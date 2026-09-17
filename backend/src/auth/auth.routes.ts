import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../presentation/middleware/auth';

/**
 * Authentication routes
 */
export function createAuthRoutes(authController?: AuthController): Router {
    const router = Router();
    const controller = authController || new AuthController();

    // Bind methods to preserve 'this' context
    const signUp = controller.signUp.bind(controller);
    const verifyEmail = controller.verifyEmail.bind(controller);
    const login = controller.login.bind(controller);
    const verifyToken = controller.verifyToken.bind(controller);
    const resendVerification = controller.resendVerification.bind(controller);
    const forgotPassword = controller.forgotPassword.bind(controller);
    const resetPassword = controller.resetPassword.bind(controller);
    const getMe = controller.getMe.bind(controller);
    const googleLogin = controller.googleLogin.bind(controller);
    const googleCallback = controller.googleCallback.bind(controller);
    const changePassword = controller.changePassword.bind(controller);

    // Public routes
    router.post('/signup', signUp);
    router.get('/verify', verifyEmail);
    router.post('/login', login);
    router.post('/verify-token', verifyToken);
    router.post('/resend-verification', resendVerification);
    router.post('/forgot-password', forgotPassword);
    router.post('/reset-password', resetPassword);

    // Google OAuth routes
    router.get('/google', googleLogin);
    router.get('/google/callback', googleCallback);
    router.get('/callback/google', googleCallback);

    // Protected routes
    router.get('/me', authMiddleware, getMe);
    router.post('/change-password', authMiddleware, changePassword);

    return router;
}

// Export individual route handlers for testing
export { AuthController };
