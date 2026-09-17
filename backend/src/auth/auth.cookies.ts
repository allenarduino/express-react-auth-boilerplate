import { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env';

export const AUTH_COOKIE_NAME = 'auth_token';
export const REMEMBER_ME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function baseCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    };
}

export function getAuthCookieOptions(rememberMe: boolean): CookieOptions {
    const options = baseCookieOptions();
    if (rememberMe) {
        options.maxAge = REMEMBER_ME_MAX_AGE_MS;
    }
    return options;
}

export function setAuthCookie(res: Response, token: string, rememberMe: boolean): void {
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions(rememberMe));
}

export function clearAuthCookie(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
}

export function getTokenFromRequest(req: Request): string | null {
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    if (typeof cookieToken === 'string' && cookieToken.trim()) {
        return cookieToken;
    }

    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        const token = header.slice(7).trim();
        return token || null;
    }

    return null;
}
