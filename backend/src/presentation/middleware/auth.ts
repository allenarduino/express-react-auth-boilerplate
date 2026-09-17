import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { getTokenFromRequest } from '../../auth/auth.cookies';

/**
 * Extended Request interface with user authentication data
 */
export interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
    };
}

function attachUserFromToken(req: Request, token: string): boolean {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

    if (!payload.sub || !payload.email) {
        return false;
    }

    (req as AuthRequest).user = {
        id: payload.sub,
        email: payload.email,
    };

    return true;
}

function sendAuthError(res: Response, error: string): void {
    res.status(401).json({
        success: false,
        error,
    });
}

/**
 * JWT authentication middleware.
 *
 * Accepts an httpOnly `auth_token` cookie (browser sessions) or an
 * `Authorization: Bearer <token>` header (API clients and tests).
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            sendAuthError(res, 'Authentication required');
            return;
        }

        if (!attachUserFromToken(req, token)) {
            sendAuthError(res, 'Invalid token payload');
            return;
        }

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            sendAuthError(res, 'Token has expired');
            return;
        }

        if (error instanceof jwt.NotBeforeError) {
            sendAuthError(res, 'Token not active');
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            sendAuthError(res, 'Invalid token');
            return;
        }

        sendAuthError(res, 'Token verification failed');
    }
};

/**
 * Optional middleware for routes that can work with or without authentication.
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            next();
            return;
        }

        attachUserFromToken(req, token);
        next();
    } catch {
        next();
    }
};
