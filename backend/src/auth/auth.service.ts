import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { UserRepository } from '../user/user.repository';
import { EmailProvider } from '../infrastructure/email/EmailProvider';
import { env } from '../config/env';

/**
 * Authentication service for user registration, verification, and login
 */
export class AuthService {
    constructor(
        private authRepo: AuthRepository,
        private userRepo: UserRepository,
        private emailProvider: EmailProvider
    ) { }

    /**
     * Register a new user with email verification
     * @param email - User's email address
     * @param password - Plain text password
     * @param name - Optional display name stored on the profile
     * @returns Promise<{ id: string; email: string }> - Basic user info
     * @throws Error if user already exists or registration fails
     */
    async signUp(email: string, password: string, name?: string): Promise<{ id: string; email: string }> {
        // Check if user already exists
        const existingUser = await this.authRepo.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate verification token (32 bytes = 64 hex characters)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user with verification token
        const user = await this.authRepo.createUser({
            email,
            passwordHash,
            isEmailVerified: false,
            verificationToken,
            verificationTokenExpires,
        });

        if (name?.trim()) {
            await this.userRepo.createProfileWithAvatar(user.id, { name: name.trim() });
        } else {
            await this.userRepo.createProfile(user.id);
        }

        const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await this.emailProvider.send(
            email,
            'Verify your email address',
            this.buildActionEmail({
                heading: 'Welcome!',
                body: 'Please verify your email address by clicking the button below.',
                actionUrl: verificationLink,
                actionLabel: 'Verify Email',
                footnote: 'This link will expire in 24 hours. If you didn\'t create an account, you can ignore this email.',
            })
        );

        return {
            id: user.id,
            email: user.email,
        };
    }

    /**
     * Verify user's email address using verification token
     * @param token - Verification token from email link
     * @returns Promise<{ id: string; email: string; isEmailVerified: boolean }> - User info
     * @throws Error if token is invalid or expired
     */
    async verifyEmail(token: string): Promise<{ id: string; email: string; isEmailVerified: boolean }> {
        // Find user by verification token
        const user = await this.authRepo.findByVerificationToken(token);
        if (!user) {
            throw new Error('Invalid verification token');
        }

        // Check if token has expired
        if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
            throw new Error('Verification token has expired');
        }

        // Update user to mark email as verified and clear token fields
        const updatedUser = await this.authRepo.updateEmailVerification(user.id, true);

        return {
            id: updatedUser.id,
            email: updatedUser.email,
            isEmailVerified: updatedUser.isEmailVerified,
        };
    }

    /**
     * Sign a JWT. Remember-me sessions last 30 days; otherwise JWT_EXPIRES_IN.
     */
    issueAccessToken(userId: string, email: string, rememberMe = false): string {
        return jwt.sign(
            {
                sub: userId,
                email,
            },
            env.JWT_SECRET,
            {
                expiresIn: rememberMe ? '30d' : env.JWT_EXPIRES_IN,
            } as jwt.SignOptions
        );
    }

    /**
     * Authenticate user and return a JWT for the httpOnly session cookie.
     */
    async login(
        email: string,
        password: string,
        rememberMe = false
    ): Promise<{ token: string; rememberMe: boolean }> {
        const user = await this.authRepo.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (!user.passwordHash) {
            throw new Error('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        if (!user.isEmailVerified) {
            throw new Error('Please verify your email address before logging in');
        }

        return {
            token: this.issueAccessToken(user.id, user.email, rememberMe),
            rememberMe,
        };
    }

    /**
     * Verify JWT token and return user info
     * @param token - JWT token to verify
     * @returns Promise<{ id: string; email: string }> - User info from token
     * @throws Error if token is invalid or expired
     */
    async verifyToken(token: string): Promise<{ id: string; email: string }> {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string };
            return {
                id: decoded.sub,
                email: decoded.email,
            };
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Resend verification email for existing user
     * @param email - User's email address
     * @returns Promise<void>
     * @throws Error if user not found or already verified
     */
    async resendVerificationEmail(email: string): Promise<void> {
        const user = await this.authRepo.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.isEmailVerified) {
            throw new Error('Email is already verified');
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with new token
        await this.authRepo.updateVerificationToken(user.id, verificationToken, verificationTokenExpires);

        const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await this.emailProvider.send(
            email,
            'Verify your email address',
            this.buildActionEmail({
                heading: 'Verify your email address',
                body: 'Please verify your email address by clicking the button below.',
                actionUrl: verificationLink,
                actionLabel: 'Verify Email',
                footnote: 'This link will expire in 24 hours.',
            })
        );
    }

    /**
     * Request password reset for user
     * @param email - User's email address
     * @returns Promise<void>
     * @throws Error if user not found
     */
    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.authRepo.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not for security
            return;
        }

        // Generate password reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token to database
        await this.authRepo.setPasswordResetToken(user.id, resetToken, resetTokenExpires);

        const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await this.emailProvider.send(
            email,
            'Password Reset Request',
            this.buildActionEmail({
                heading: 'Password reset request',
                body: 'You requested a password reset for your account. Click the button below to choose a new password.',
                actionUrl: resetLink,
                actionLabel: 'Reset Password',
                footnote: 'This link will expire in 1 hour. If you didn\'t request this, you can ignore this email.',
            })
        );
    }

    /**
     * Reset user's password using reset token
     * @param resetToken - The password reset token
     * @param newPassword - The new password
     * @returns Promise<{ id: string; email: string }> - User info
     * @throws Error if token is invalid or expired
     */
    async resetPassword(resetToken: string, newPassword: string): Promise<{ id: string; email: string }> {
        // Find user by reset token
        const user = await this.authRepo.findByPasswordResetToken(resetToken);
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password and clear reset token
        const updatedUser = await this.authRepo.updatePassword(user.id, passwordHash);

        return {
            id: updatedUser.id,
            email: updatedUser.email,
        };
    }

    /**
     * Change password for an authenticated user
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.authRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.passwordHash) {
            throw new Error('This account uses Google sign-in and does not have a password');
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentValid) {
            throw new Error('Current password is incorrect');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.authRepo.updatePassword(user.id, passwordHash);
    }

    private buildActionEmail(options: {
        heading: string;
        body: string;
        actionUrl: string;
        actionLabel: string;
        footnote: string;
    }): string {
        return `
            <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
                <h1 style="font-size: 22px; margin-bottom: 12px;">${options.heading}</h1>
                <p style="color: #4b5563; line-height: 1.5;">${options.body}</p>
                <p style="margin: 28px 0;">
                    <a href="${options.actionUrl}" style="background-color: #111827; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                        ${options.actionLabel}
                    </a>
                </p>
                <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">${options.footnote}</p>
            </div>
        `;
    }
}
