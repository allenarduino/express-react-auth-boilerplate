import { Request, Response } from 'express';
import passport from 'passport';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UserRepository } from '../user/user.repository';
import { createEmailProvider } from '../infrastructure/email';
import { signupSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, verifyTokenSchema, passwordResetRequestSchema, passwordResetSchema, changePasswordSchema } from './auth.validation';
import { env, isGoogleAuthConfigured } from '../config/env';
import {
    AUTH_SESSION_COOKIE,
    clearSessionCookies,
    getCookieValue,
    REMEMBER_COOKIE,
    setSessionCookies,
} from './auth.cookies';
import { AuthRequest } from '../presentation/middleware/auth';
import { SessionRepository } from './session.repository';
import { consumeOAuthState, startOAuthState } from './oauth-state';

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
            const sessionRepo = new SessionRepository();
            this.authService = new AuthService(this.authRepo, userRepo, emailProvider, sessionRepo);
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
     * Authenticate user and set an httpOnly session cookie.
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
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

            const { email, password, rememberMe } = validationResult.data;
            const result = await this.authService.login(email, password, rememberMe);
            setSessionCookies(res, result.sessionToken, result.rememberToken);

            res.status(200).json({
                success: true,
                message: 'Login successful',
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: (error as Error).message,
            });
        }
    }

    /**
     * POST /api/auth/logout
     * Revoke the current session and remember-me token, then clear cookies.
     */
    async logout(req: Request, res: Response): Promise<void> {
        try {
            await this.authService.revokeBrowserTokens(
                getCookieValue(req, AUTH_SESSION_COOKIE),
                getCookieValue(req, REMEMBER_COOKIE)
            );
        } finally {
            clearSessionCookies(res);
        }
        res.status(200).json({
            success: true,
            message: 'Logged out',
        });
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
     * Get current user info from the session or Bearer JWT
     */
    async getMe(req: Request, res: Response): Promise<void> {
        try {
            const { id } = (req as AuthRequest).user;
            const fullUser = await this.authRepo.findById(id);

            if (!fullUser) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }

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
     * GET /api/auth/google/status
     * Whether Google sign-in has real OAuth credentials.
     */
    googleStatus(_req: Request, res: Response): void {
        res.status(200).json({
            success: true,
            data: { enabled: isGoogleAuthConfigured() },
        });
    }

    /**
     * GET /api/auth/google
     * Initiate Google OAuth login
     */
    async googleLogin(_req: Request, res: Response): Promise<void> {
        if (!isGoogleAuthConfigured()) {
            res.status(503).json({
                success: false,
                message: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.',
            });
            return;
        }

        const state = startOAuthState(res);
        const callbackURL = `${env.APP_URL}/api/auth/google/callback`;
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
        url.searchParams.set('redirect_uri', callbackURL);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'profile email');
        url.searchParams.set('state', state);
        res.redirect(url.toString());
    }

    /**
     * GET /api/auth/google/callback
     * Handle Google OAuth callback
     */
    googleCallback(req: Request, res: Response): void {
        if (!consumeOAuthState(req, res)) {
            res.redirect(`${env.FRONTEND_URL}/login?error=oauth_state`);
            return;
        }

        passport.authenticate('google', { session: false }, async (err: any, user: any) => {
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
                const tokens = await this.authService.createBrowserSession(user.id, true);
                setSessionCookies(res, tokens.sessionToken, tokens.rememberToken);
                return res.redirect(`${env.FRONTEND_URL}/auth/callback`);
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

            const { token, password, email } = validationResult.data;
            const user = await this.authService.resetPassword(email, token, password);

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
            await this.authService.changePassword(
                userId,
                currentPassword,
                newPassword,
                (req as AuthRequest).sessionId
            );

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
