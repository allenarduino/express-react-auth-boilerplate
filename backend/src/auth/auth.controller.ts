import { Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UserRepository } from '../user/user.repository';
import { createEmailProvider } from '../infrastructure/email';
import { signupSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, verifyTokenSchema, passwordResetRequestSchema, passwordResetSchema, changePasswordSchema } from './auth.validation';
import { env } from '../config/env';

/**
 * Authentication controller for handling HTTP requests
 */
export class AuthController {
    private authService: AuthService;
    private authRepo: AuthRepository;

    constructor(authService?: AuthService) {
        if (authService) {
            this.authService = authService;
            this.authRepo = new AuthRepository();
        } else {
            // Initialize dependencies for backward compatibility
            this.authRepo = new AuthRepository();
            const userRepo = new UserRepository();
            const emailProvider = createEmailProvider();
            this.authService = new AuthService(this.authRepo, userRepo, emailProvider);
        }
    }

    /**
     * POST /api/auth/signup
     * Register a new user
     */
    async signUp(req: Request, res: Response): Promise<void> {
        try {
            // Validate input with Zod
            const validationResult = signupSchema.safeParse(req.body);
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

            const { email, password, name } = validationResult.data;
            const user = await this.authService.signUp(email, password, name);

            res.status(201).json({
                success: true,
                message: 'User created successfully. Please check your email for verification.',
                data: {
                    id: user.id,
                    email: user.email,
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
     * GET /api/auth/verify
     * Verify user's email address
     */
    async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.query;

            if (!token || typeof token !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Verification token is required',
                });
                return;
            }

            const user = await this.authService.verifyEmail(token);

            res.status(200).json({
                success: true,
                message: 'Email verified successfully',
                data: {
                    id: user.id,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified,
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
     * POST /api/auth/login
     * Authenticate user and return JWT token
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            // Validate input with Zod
            const validationResult = loginSchema.safeParse(req.body);
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

            const { email, password } = validationResult.data;
            const result = await this.authService.login(email, password);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token: result.token,
                },
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * POST /api/auth/verify-token
     * Verify JWT token and return user info
     */
    async verifyToken(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body;

            if (!token) {
                res.status(400).json({
                    success: false,
                    message: 'Token is required',
                });
                return;
            }

            const userInfo = await this.authService.verifyToken(token);

            res.status(200).json({
                success: true,
                message: 'Token is valid',
                data: userInfo,
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * POST /api/auth/resend-verification
     * Resend verification email
     */
    async resendVerification(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            if (!email) {
                res.status(400).json({
                    success: false,
                    message: 'Email is required',
                });
                return;
            }

            await this.authService.resendVerificationEmail(email);

            res.status(200).json({
                success: true,
                message: 'Verification email sent successfully',
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * GET /api/auth/me
     * Get current user info from JWT token
     */
    async getMe(req: Request, res: Response): Promise<void> {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    message: 'Authorization header with Bearer token is required',
                });
                return;
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            const userInfo = await this.authService.verifyToken(token);

            // Fetch full user data from database including Google OAuth fields
            const fullUser = await this.authRepo.findById(userInfo.id);

            if (!fullUser) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }

            // Return full user data
            res.status(200).json({
                success: true,
                message: 'User info retrieved successfully',
                data: {
                    id: fullUser.id,
                    email: fullUser.email,
                    name: fullUser.googleName,
                    googlePicture: fullUser.googlePicture,
                    isEmailVerified: fullUser.isEmailVerified,
                    authProvider: fullUser.authProvider,
                    hasPassword: Boolean(fullUser.passwordHash),
                },
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * GET /api/auth/google
     * Initiate Google OAuth login
     */
    async googleLogin(req: Request, res: Response): Promise<void> {
        passport.authenticate('google', {
            scope: ['profile', 'email']
        })(req, res);
    }

    /**
     * GET /api/auth/google/callback
     * Handle Google OAuth callback
     */
    googleCallback(req: Request, res: Response): void {
        passport.authenticate('google', { session: false }, (err: any, user: any) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Authentication failed',
                    error: err.message,
                });
            }

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Authentication failed',
                });
            }

            try {
                // Generate JWT token for the user
                const payload = {
                    sub: user.id,
                    email: user.email,
                };

                const token = jwt.sign(payload, env.JWT_SECRET, {
                    expiresIn: env.JWT_EXPIRES_IN,
                } as jwt.SignOptions);

                // Redirect to frontend with token
                const frontendUrl = `${env.FRONTEND_URL}/auth/callback?token=${token}`;
                return res.redirect(frontendUrl);
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Token generation failed',
                    error: (error as Error).message,
                });
            }
        })(req, res);
    }

    /**
     * POST /api/auth/forgot-password
     * Request password reset
     */
    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            // Validate input with Zod
            const validationResult = passwordResetRequestSchema.safeParse(req.body);
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

            const { email } = validationResult.data;
            await this.authService.requestPasswordReset(email);

            // Always return success for security (don't reveal if user exists)
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * POST /api/auth/reset-password
     * Reset password using reset token
     */
    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            // Validate input with Zod
            const validationResult = passwordResetSchema.safeParse(req.body);
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

            const { token, password } = validationResult.data;
            const user = await this.authService.resetPassword(token, password);

            res.status(200).json({
                success: true,
                message: 'Password reset successfully',
                data: {
                    id: user.id,
                    email: user.email,
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
     * POST /api/auth/change-password
     * Change password for the authenticated user
     */
    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            const validationResult = changePasswordSchema.safeParse(req.body);
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

            const { currentPassword, newPassword } = validationResult.data;
            await this.authService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: 'Password updated successfully',
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }
}
