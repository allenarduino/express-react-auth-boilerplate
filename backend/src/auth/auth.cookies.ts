import { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env';

export const AUTH_SESSION_COOKIE = 'auth_session';
export const REMEMBER_COOKIE = 'remember_me';
export const OAUTH_STATE_COOKIE = 'oauth_state';
export const REMEMBER_ME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

function baseCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    };
}

export function getCookieValue(req: Request, name: string): string | null {
    const value = req.cookies?.[name];
    if (typeof value === 'string' && value.trim()) {
        return value;
    }
    return null;
}

export function getBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return null;
    }
    const token = header.slice(7).trim();
    return token || null;
}

export function setSessionCookies(
    res: Response,
    sessionToken: string,
    rememberToken: string | null
): void {
    res.cookie(AUTH_SESSION_COOKIE, sessionToken, baseCookieOptions());

    if (rememberToken) {
        res.cookie(REMEMBER_COOKIE, rememberToken, {
            ...baseCookieOptions(),
            maxAge: REMEMBER_ME_MAX_AGE_MS,
        });
        return;
    }

    res.clearCookie(REMEMBER_COOKIE, baseCookieOptions());
}

export function clearSessionCookies(res: Response): void {
    res.clearCookie(AUTH_SESSION_COOKIE, baseCookieOptions());
    res.clearCookie(REMEMBER_COOKIE, baseCookieOptions());
}

export function setOAuthStateCookie(res: Response, state: string): void {
    res.cookie(OAUTH_STATE_COOKIE, state, {
        ...baseCookieOptions(),
        maxAge: OAUTH_STATE_MAX_AGE_MS,
    });
}

export function clearOAuthStateCookie(res: Response): void {
    res.clearCookie(OAUTH_STATE_COOKIE, baseCookieOptions());
}
