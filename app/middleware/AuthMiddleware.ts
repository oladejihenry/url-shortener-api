import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../lib/jwt';
import prisma from '../lib/prisma';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await JWTService.verifyToken(token, 'access');

    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [user, session] = await Promise.all([
      prisma.users.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          tokenVersion: true,
          createdAt: true,
        },
      }),
      prisma.sessions.findUnique({
        where: { id: decoded.sessionId },
      }),
    ]);

    if (!user || !session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    (req as any).user = user;
    (req as any).sessionId = session.id;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
