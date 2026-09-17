import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

/**
 * Extended Request interface with user authentication data
 */
export interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
    };
}

/**
 * JWT Authentication Middleware
 *
 * Behavior:
 * - Reads Authorization header "Bearer <token>"
 * - Verifies JWT token using env.JWT_SECRET
 * - On success: attaches req.user = { id: payload.sub, email: payload.email }
 * - On failure: responds with 401 JSON error
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: 'Authorization header is required'
            });
            return;
        }

        if (!authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Authorization header must start with "Bearer "'
            });
            return;
        }

        const token = authHeader.substring(7);

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Token is required'
            });
            return;
        }

        const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

        if (!payload.sub || !payload.email) {
            res.status(401).json({
                success: false,
                error: 'Invalid token payload'
            });
            return;
        }

        (req as AuthRequest).user = {
            id: payload.sub,
            email: payload.email
        };

        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
            return;
        }

        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token has expired'
            });
            return;
        }

        if (error instanceof jwt.NotBeforeError) {
            res.status(401).json({
                success: false,
                error: 'Token not active'
            });
            return;
        }

        res.status(401).json({
            success: false,
            error: 'Token verification failed'
        });
    }
};

/**
 * Optional middleware for routes that can work with or without authentication
 * Similar to authMiddleware but doesn't return 401 on missing token
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.substring(7);

        if (!token) {
            next();
            return;
        }

        const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

        if (payload.sub && payload.email) {
            (req as AuthRequest).user = {
                id: payload.sub,
                email: payload.email
            };
        }

        next();

    } catch {
        next();
    }
};
