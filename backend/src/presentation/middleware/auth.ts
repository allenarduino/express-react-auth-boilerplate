import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import {
    AUTH_SESSION_COOKIE,
    getBearerToken,
    getCookieValue,
    REMEMBER_COOKIE,
    setSessionCookies,
} from '../../auth/auth.cookies';
import {
    REMEMBER_KIND,
    SESSION_KIND,
    SESSION_TTL_MS,
    SessionRepository,
} from '../../auth/session.repository';

export interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
    };
    sessionId?: string;
}

const sessionRepo = new SessionRepository();

function attachUser(req: Request, user: { id: string; email: string }, sessionId?: string): void {
    (req as AuthRequest).user = {
        id: user.id,
        email: user.email,
    };
    if (sessionId) {
        (req as AuthRequest).sessionId = sessionId;
    }
}

function sendAuthError(res: Response, error: string): void {
    res.status(401).json({
        success: false,
        error,
    });
}

async function authenticateSessionCookie(req: Request, res: Response): Promise<boolean> {
    const sessionToken = getCookieValue(req, AUTH_SESSION_COOKIE);
    if (sessionToken) {
        const session = await sessionRepo.findValid(sessionToken, SESSION_KIND);
        if (session) {
            attachUser(req, session.user, session.id);
            return true;
        }
    }

    const rememberToken = getCookieValue(req, REMEMBER_COOKIE);
    if (!rememberToken) {
        return false;
    }

    const remember = await sessionRepo.findValid(rememberToken, REMEMBER_KIND);
    if (!remember) {
        return false;
    }

    const nextSession = await sessionRepo.create(remember.userId, SESSION_KIND, SESSION_TTL_MS);
    setSessionCookies(res, nextSession.rawToken, rememberToken);
    attachUser(req, remember.user, nextSession.id);
    return true;
}

function authenticateBearer(req: Request, token: string): boolean {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (!payload.sub || !payload.email) {
        return false;
    }
    attachUser(req, { id: payload.sub, email: payload.email as string });
    return true;
}

/**
 * Cookie sessions and Bearer JWTs are separate strategies.
 * Browser requests use `auth_session` / `remember_me` cookies.
 * API clients use `Authorization: Bearer`.
 */
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (await authenticateSessionCookie(req, res)) {
            next();
            return;
        }

        const bearerToken = getBearerToken(req);
        if (bearerToken) {
            if (!authenticateBearer(req, bearerToken)) {
                sendAuthError(res, 'Invalid token payload');
                return;
            }
            next();
            return;
        }

        sendAuthError(res, 'Authentication required');
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

export const optionalAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (await authenticateSessionCookie(req, res)) {
            next();
            return;
        }

        const bearerToken = getBearerToken(req);
        if (bearerToken) {
            authenticateBearer(req, bearerToken);
        }
        next();
    } catch {
        next();
    }
};
