import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  id: string;
  refreshToken?: string;
}
