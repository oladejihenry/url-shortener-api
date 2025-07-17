import { Request, Response } from 'express';
import { urlSchema } from '../validation';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { errorResponse, successResponse } from '../lib/responseWrapper';

export class UrlController {
  /**
   * Create a short url
   * @param req - The request object
   * @param res - The response object
   * @returns The short url
   */
  static async createShortUrl(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const validatedData = urlSchema.parse(req.body);

      const shortCode = nanoid(8);

      //check if the user has reached the limit of 10 urls
      const userUrls = await prisma.url.findMany({
        where: { userId },
      });
      if (userUrls.length >= 10) {
        return res.status(402).json(
          errorResponse('You have reached the limit of 10 urls', {
            upgrade: 'https://www.google.com',
          })
        );
      }

      const url = await prisma.url.create({
        data: {
          shortCode,
          longUrl: validatedData.url,
          userId,
          expiresAt: validatedData.expiresIn
            ? new Date(Date.now() + validatedData.expiresIn * 3600000)
            : null,
        },
      });

      //Cache the url in redis
      await redisClient.set(`url:${shortCode}`, validatedData.url, {
        EX: validatedData.expiresIn
          ? validatedData.expiresIn * 3600
          : undefined,
      });

      res.status(201).json(
        successResponse('Short URL created successfully', {
          shortUrl: `${process.env.API_URL}/s/${shortCode}`,
          ...url,
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json(errorResponse('Validation failed', error));
      }
      res.status(500).json(errorResponse('Internal server error'));
    }
  }

  /**
   * Redirect to the url
   * @param req - The request object
   * @param res - The response object
   * @returns The redirect url
   */
  static async redirectUrl(req: Request, res: Response) {
    try {
      const { shortCode } = req.params;

      //Try to get the url from redis
      let longUrl = await redisClient.get(`url:${shortCode}`);

      //If the url is not found in redis, try to get it from the database
      if (!longUrl) {
        const url = await prisma.url.findUnique({
          where: { shortCode },
        });

        if (!url) {
          return res.status(404).json(errorResponse('URL not found'));
        }

        if (url.expiresAt && url.expiresAt < new Date()) {
          return res.status(410).json(errorResponse('URL has expired'));
        }

        longUrl = url.longUrl;

        // Cache the URL in Redis
        await redisClient.set(`url:${shortCode}`, longUrl, {
          EX: url.expiresAt
            ? Math.floor((url.expiresAt.getTime() - Date.now()) / 1000)
            : undefined,
        });
      }

      prisma.url
        .update({
          where: { shortCode },
          data: {
            views: { increment: 1 },
            lastViewed: new Date(),
          },
        })
        .catch(console.error);

      // Track analytics in Redis
      await redisClient.incr(`analytics:${shortCode}`).catch(console.error);

      return res.redirect(longUrl);
    } catch (error) {}
  }

  /**
   * Get the stats for a short url
   * @param req - The request object
   * @param res - The response object
   * @returns The stats
   */
  static async getUrlStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { shortCode } = req.params;

      const url = await prisma.url.findFirst({
        where: { shortCode, userId },
      });

      if (!url) {
        return res.status(404).json(errorResponse('URL not found'));
      }

      const realtimeViews =
        (await redisClient.get(`analytics:${shortCode}`)) || '0';

      res.json(
        successResponse('Url stats fetched successfully', {
          ...url,
          realtimeViews: parseInt(realtimeViews),
        })
      );
    } catch (error) {
      res.status(500).json(errorResponse('Internal server error'));
    }
  }

  /**
   * Get the urls for a user
   * @param req - The request object
   * @param res - The response object
   * @returns The urls
   */
  static async getUserUrls(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const urls = await prisma.url.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Get real-time views for all URLs
      const urlsWithStats = await Promise.all(
        urls.map(async (url) => {
          const realtimeViews =
            (await redisClient.get(`analytics:${url.shortCode}`)) || '0';
          return {
            ...url,
            realtimeViews: parseInt(realtimeViews),
          };
        })
      );

      res.json(successResponse('Urls fetched successfully', urlsWithStats));
    } catch (error) {
      res.status(500).json(errorResponse('Internal server error'));
    }
  }
}
