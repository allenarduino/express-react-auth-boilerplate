import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env';

/**
 * Limits brute-force and signup spam on public auth writes.
 * Skipped in tests so integration suites can run without sleeping.
 */
export const authWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
        success: false,
        message: 'Too many attempts. Please try again later.',
    },
});
