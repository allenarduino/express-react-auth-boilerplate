import { Request, Response } from 'express';
import { generateOpaqueToken, tokensMatch } from './tokens';
import {
    clearOAuthStateCookie,
    getCookieValue,
    OAUTH_STATE_COOKIE,
    setOAuthStateCookie,
} from './auth.cookies';

export function startOAuthState(res: Response): string {
    const state = generateOpaqueToken();
    setOAuthStateCookie(res, state);
    return state;
}

export function consumeOAuthState(req: Request, res: Response): boolean {
    const expected = getCookieValue(req, OAUTH_STATE_COOKIE);
    const provided = typeof req.query.state === 'string' ? req.query.state : '';
    clearOAuthStateCookie(res);

    if (!expected || !provided || !tokensMatch(expected, provided)) {
        return false;
    }

    return true;
}
