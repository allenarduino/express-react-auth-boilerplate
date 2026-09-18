import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { UserRepository } from '../user/user.repository';
import { EmailProvider } from '../infrastructure/email/EmailProvider';
import { env } from '../config/env';
import { generateOpaqueToken, hashToken } from './tokens';
import { REMEMBER_KIND, SESSION_KIND, SessionRepository } from './session.repository';

export class AuthService {
    constructor(
        private authRepo: AuthRepository,
        private userRepo: UserRepository,
        private emailProvider: EmailProvider,
        private sessionRepo: SessionRepository
    ) { }

    async signUp(email: string, password: string, name?: string): Promise<{ id: string; email: string }> {
        const existingUser = await this.authRepo.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const verificationToken = generateOpaqueToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = await this.authRepo.createUser({
            email,
            passwordHash,
            isEmailVerified: false,
            verificationToken: hashToken(verificationToken),
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

    async verifyEmail(token: string): Promise<{ id: string; email: string; isEmailVerified: boolean }> {
        const user = await this.authRepo.findByVerificationToken(token);
        if (!user) {
            throw new Error('Invalid verification token');
        }

        if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
            throw new Error('Verification token has expired');
        }

        const updatedUser = await this.authRepo.updateEmailVerification(user.id, true);

        return {
            id: updatedUser.id,
            email: updatedUser.email,
            isEmailVerified: updatedUser.isEmailVerified,
        };
    }

    issueAccessToken(userId: string, email: string): string {
        return jwt.sign(
            {
                sub: userId,
                email,
            },
            env.JWT_SECRET,
            {
                expiresIn: env.JWT_EXPIRES_IN,
            } as jwt.SignOptions
        );
    }

    async login(
        email: string,
        password: string,
        rememberMe = false
    ): Promise<{ sessionToken: string; rememberToken: string | null; rememberMe: boolean }> {
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

        const tokens = await this.sessionRepo.createLoginTokens(user.id, rememberMe);
        return {
            sessionToken: tokens.sessionToken,
            rememberToken: tokens.rememberToken,
            rememberMe,
        };
    }

    async createBrowserSession(
        userId: string,
        rememberMe: boolean
    ): Promise<{ sessionToken: string; rememberToken: string | null }> {
        const tokens = await this.sessionRepo.createLoginTokens(userId, rememberMe);
        return {
            sessionToken: tokens.sessionToken,
            rememberToken: tokens.rememberToken,
        };
    }

    async revokeBrowserTokens(sessionToken: string | null, rememberToken: string | null): Promise<void> {
        if (sessionToken) {
            await this.sessionRepo.deleteByRawToken(sessionToken, SESSION_KIND);
        }
        if (rememberToken) {
            await this.sessionRepo.deleteByRawToken(rememberToken, REMEMBER_KIND);
        }
    }

    async verifyToken(token: string): Promise<{ id: string; email: string }> {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string };
            return {
                id: decoded.sub,
                email: decoded.email,
            };
        } catch {
            throw new Error('Invalid or expired token');
        }
    }

    async resendVerificationEmail(email: string): Promise<void> {
        const user = await this.authRepo.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.isEmailVerified) {
            throw new Error('Email is already verified');
        }

        const verificationToken = generateOpaqueToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.authRepo.updateVerificationToken(
            user.id,
            hashToken(verificationToken),
            verificationTokenExpires
        );

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

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.authRepo.findByEmail(email);
        if (!user) {
            return;
        }

        const resetToken = generateOpaqueToken();
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

        await this.authRepo.setPasswordResetToken(user.id, hashToken(resetToken), resetTokenExpires);

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

    async resetPassword(
        email: string,
        resetToken: string,
        newPassword: string
    ): Promise<{ id: string; email: string }> {
        const invalidMessage = 'Invalid or expired reset token';
        const user = await this.authRepo.findByEmail(email);
        if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
            throw new Error(invalidMessage);
        }

        if (user.passwordResetExpires < new Date()) {
            throw new Error(invalidMessage);
        }

        if (user.passwordResetToken !== hashToken(resetToken)) {
            throw new Error(invalidMessage);
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        const updatedUser = await this.authRepo.updatePassword(user.id, passwordHash);
        await this.sessionRepo.deleteAllForUser(user.id);

        return {
            id: updatedUser.id,
            email: updatedUser.email,
        };
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
        currentSessionId?: string
    ): Promise<void> {
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
        await this.sessionRepo.deleteAllForUserExcept(userId, currentSessionId);
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
