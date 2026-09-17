# JWT Authentication Middleware

This directory contains JWT authentication middleware for protecting routes.

## Files

- `auth.ts` - Cookie or Bearer JWT authentication middleware
- `rateLimit.ts` - Rate limiter for login, signup, and password-reset writes
- `index.ts` - Exports all middleware functions

## Usage

### Basic Authentication Middleware

```typescript
import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../presentation/middleware/auth';

const router = Router();

// Protected route
router.get('/protected', authMiddleware, (req: AuthRequest, res) => {
    // req.user is guaranteed to exist and contains { id, email }
    res.json({ 
        message: 'Access granted', 
        user: req.user 
    });
});
```

### Optional Authentication Middleware

```typescript
import { optionalAuthMiddleware, AuthRequest } from '../presentation/middleware/auth';

// Route that works with or without authentication
router.get('/optional', optionalAuthMiddleware, (req: AuthRequest, res) => {
    if (req.user) {
        res.json({ message: 'Authenticated user', user: req.user });
    } else {
        res.json({ message: 'Anonymous user' });
    }
});
```

## Middleware Behavior

### authMiddleware
- **Required**: `auth_token` httpOnly cookie, or `Authorization: Bearer <token>`
- **Success**: Attaches `req.user = { id, email }` and calls `next()`
- **Failure**: Returns 401 JSON error and stops request processing

### optionalAuthMiddleware
- **Optional**: Authorization header
- **Success**: Attaches `req.user` if valid token provided
- **Failure**: Continues without user data (no error response)

## Error Responses

All authentication failures return JSON with this structure:

```json
{
    "success": false,
    "error": "Error description"
}
```

## Error Types

- `Authorization header is required`
- `Authorization header must start with "Bearer "`
- `Token is required`
- `Invalid token payload`
- `Invalid token`
- `Token has expired`
- `Token not active`
- `Token verification failed`
