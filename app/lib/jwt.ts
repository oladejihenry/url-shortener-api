import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Users } from '../generated/prisma';
import prisma from './prisma';
import { TokenPayload } from '@/types';
dotenv.config();

export class JWTService {
  private static ACCESS_TOKEN_EXPIRY = process.env
    .ACCESS_TOKEN_EXPIRY as string;
  private static REFRESH_TOKEN_EXPIRY = process.env
    .REFRESH_TOKEN_EXPIRY as string;
  private static JWT_SECRET = process.env.JWT_SECRET as string;
  private static REFRESH_TOKEN_SECRET = process.env
    .JWT_REFRESH_SECRET as string;

  static async generateTokens(user: Users, sessionId: string) {
    const payload: Omit<TokenPayload, 'type'> = {
      userId: user.id,
      sessionId,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY } as SignOptions
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY } as SignOptions
    );

    await prisma.users.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLogin: new Date(),
      },
    });

    return { accessToken, refreshToken };
  }

  static async verifyToken(
    token: string,
    type: 'access' | 'refresh'
  ): Promise<TokenPayload | null> {
    try {
      const secret =
        type === 'access' ? this.JWT_SECRET : this.REFRESH_TOKEN_SECRET;
      const decoded = jwt.verify(token, secret) as TokenPayload;
      if (decoded.type !== type) {
        return null;
      }

      //verify token version and session
      const [user, session] = await Promise.all([
        prisma.users.findUnique({ where: { id: decoded.userId } }),
        prisma.sessions.findUnique({ where: { id: decoded.sessionId } }),
      ]);

      if (!user || !session || user.tokenVersion !== decoded.tokenVersion) {
        return null;
      }

      //update session lastActivity
      await prisma.sessions.update({
        where: { id: decoded.sessionId },
        data: { lastActivity: Math.floor(Date.now() / 1000) },
      });

      return decoded;
    } catch (error) {
      return null;
    }
  }
}
