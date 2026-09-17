// Export auth module components
export { AuthService } from './auth.service';
export { AuthController } from './auth.controller';
export { AuthRepository } from './auth.repository';
export { createAuthRoutes } from './auth.routes';

// Example usage:
/*
import { createAuthRoutes } from './auth';
import express from 'express';

const app = express();

// Add auth routes
app.use('/api/auth', createAuthRoutes());

// Available endpoints:
// POST /api/auth/signup - Register new user
// GET  /api/auth/verify?token=xxx - Verify email
// POST /api/auth/login - Login user
// POST /api/auth/verify-token - Verify JWT token
// POST /api/auth/resend-verification - Resend verification email
// GET  /api/auth/me - Get current user (cookie or Bearer)
// POST /api/auth/logout - Clear session cookie
*/
