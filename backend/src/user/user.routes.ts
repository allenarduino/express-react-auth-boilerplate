import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../presentation/middleware/auth';

/**
 * User routes for profile management
 */
export function createUserRoutes(userController?: UserController): Router {
    const router = Router();
    const controller = userController || new UserController();

    // Bind methods to preserve 'this' context
    const getProfile = controller.getProfile.bind(controller);
    const updateProfile = controller.updateProfile.bind(controller);
    const getUserInfo = controller.getUserInfo.bind(controller);
    const deleteProfile = controller.deleteProfile.bind(controller);
    const getPublicProfile = controller.getPublicProfile.bind(controller);
    const deleteAccount = controller.deleteAccount.bind(controller);
    const uploadAvatar = controller.uploadAvatar.bind(controller);

    // Protected routes (require authentication)
    router.get('/me', authMiddleware, getProfile);
    router.put('/me/profile', authMiddleware, updateProfile);
    router.post('/me/avatar', authMiddleware, uploadAvatar);
    router.delete('/me', authMiddleware, deleteAccount);
    router.get('/info', authMiddleware, getUserInfo);
    router.delete('/profile', authMiddleware, deleteProfile);

    // Public routes
    router.get('/profile/:userId', getPublicProfile);

    return router;
}

// Export individual route handlers for testing
export { UserController };
