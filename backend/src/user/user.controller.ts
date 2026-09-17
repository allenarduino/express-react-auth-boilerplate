import { Request, Response } from 'express';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { deleteAccountSchema, updateProfileSchema, uploadAvatarSchema } from './user.validation';
import { saveAvatarFromDataUrl } from './avatar';
import { env } from '../config/env';
import { clearAuthCookie } from '../auth/auth.cookies';

/**
 * User controller for handling profile-related HTTP requests
 */
export class UserController {
    private userService: UserService;

    constructor(userService?: UserService) {
        if (userService) {
            this.userService = userService;
        } else {
            // Initialize dependencies for backward compatibility
            const userRepo = new UserRepository();
            this.userService = new UserService(userRepo);
        }
    }

    /**
     * GET /api/user/profile
     * Get current user's profile
     */
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id; // Assuming user is attached by auth middleware

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const profile = await this.userService.getProfile(userId);

            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: profile,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * PUT /api/user/me/profile
     * Update current user's profile
     */
    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id; // Assuming user is attached by auth middleware

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            // Validate input with Zod
            const validationResult = updateProfileSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationResult.error.issues.map((err: any) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
                return;
            }

            const updateData = validationResult.data;
            const transformedData = {
                ...(updateData.name !== undefined ? { name: updateData.name } : {}),
                ...(updateData.bio !== undefined ? { bio: updateData.bio } : {}),
                ...(updateData.avatarUrl !== undefined ? { avatarUrl: updateData.avatarUrl } : {}),
                ...(updateData.website !== undefined ? { website: updateData.website } : {}),
            };

            const updatedProfile = await this.userService.updateProfile(userId, transformedData);

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedProfile,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * GET /api/user/info
     * Get current user's basic info (without profile)
     */
    async getUserInfo(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id; // Assuming user is attached by auth middleware

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const userInfo = await this.userService.getUserInfo(userId);

            res.status(200).json({
                success: true,
                message: 'User info retrieved successfully',
                data: userInfo,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * POST /api/user/me/avatar
     * Upload a cropped profile photo (JPEG data URL)
     */
    async uploadAvatar(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const validationResult = uploadAvatarSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationResult.error.issues.map((err: any) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
                return;
            }

            const relativePath = await saveAvatarFromDataUrl(userId, validationResult.data.image);
            const avatarUrl = `${env.APP_URL}${relativePath}?t=${Date.now()}`;
            const updatedProfile = await this.userService.updateProfile(userId, { avatarUrl });

            res.status(200).json({
                success: true,
                message: 'Avatar uploaded successfully',
                data: {
                    url: avatarUrl,
                    profile: updatedProfile,
                },
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * DELETE /api/user/me
     * Permanently delete the authenticated user's account.
     */
    async deleteAccount(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            const tokenEmail = (req as any).user?.email as string | undefined;

            if (!userId || !tokenEmail) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const validationResult = deleteAccountSchema.safeParse(req.body || {});
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationResult.error.issues.map((err: any) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
                return;
            }

            const typed = validationResult.data.confirmEmail.trim().toLowerCase();
            if (typed !== tokenEmail.trim().toLowerCase()) {
                res.status(400).json({
                    success: false,
                    message: 'Confirmation email does not match your account email',
                });
                return;
            }

            await this.userService.deleteAccount(userId);
            clearAuthCookie(res);

            res.status(200).json({
                success: true,
                message: 'Account deleted successfully',
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * DELETE /api/user/profile
     * Clear current user's profile data
     */
    async deleteProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id; // Assuming user is attached by auth middleware

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            await this.userService.deleteProfile(userId);

            res.status(200).json({
                success: true,
                message: 'Profile cleared successfully',
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * GET /api/user/profile/:userId
     * Get another user's public profile (admin or public endpoint)
     */
    async getPublicProfile(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }

            const profile = await this.userService.getProfile(userId);

            // Return only public profile data (no email, verification status)
            const publicProfile = {
                id: profile.id,
                profile: profile.profile,
            };

            res.status(200).json({
                success: true,
                message: 'Public profile retrieved successfully',
                data: publicProfile,
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }
}
