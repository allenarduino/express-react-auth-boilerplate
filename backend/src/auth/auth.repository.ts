import { PrismaClient, User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { hashToken } from './tokens';

/**
 * Authentication repository for user authentication operations
 * Handles auth-specific database queries
 */
export class AuthRepository {
    private prisma: PrismaClient;

    constructor(prismaClient?: PrismaClient) {
        this.prisma = prismaClient || prisma;
    }

    /**
     * Create a new user with authentication data
     * @param data - User creation data including email and passwordHash
     * @returns Promise<User> - The created user
     */
    async createUser(data: {
        email: string;
        passwordHash: string;
        isEmailVerified?: boolean;
        verificationToken?: string;
        verificationTokenExpires?: Date;
    }): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                isEmailVerified: data.isEmailVerified || false,
                verificationToken: data.verificationToken || null,
                verificationTokenExpires: data.verificationTokenExpires || null,
            },
        });
    }

    /**
     * Find a user by their email address
     * @param email - The email address to search for
     * @returns Promise<User | null> - The user if found, null otherwise
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Find a user by their unique ID
     * @param id - The user ID to search for
     * @returns Promise<User | null> - The user if found, null otherwise
     */
    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    /**
     * Find a user by their email verification token
     * @param token - The verification token to search for
     * @returns Promise<User | null> - The user if found, null otherwise
     */
    async findByVerificationToken(token: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { verificationToken: hashToken(token) },
        });
    }

    /**
     * Update a user with the provided data
     * @param id - The user ID to update
     * @param data - Partial user data to update
     * @returns Promise<User> - The updated user
     */
    async updateUser(id: string, data: Partial<User>): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    /**
     * Check if a user exists by email
     * @param email - The email address to check
     * @returns Promise<boolean> - True if user exists, false otherwise
     */
    async userExistsByEmail(email: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        return user !== null;
    }

    /**
     * Update user's email verification status
     * @param id - The user ID to update
     * @param isVerified - Whether the email is verified
     * @returns Promise<User> - The updated user
     */
    async updateEmailVerification(id: string, isVerified: boolean): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: {
                isEmailVerified: isVerified,
                verificationToken: null,
                verificationTokenExpires: null,
            },
        });
    }

    /**
     * Update user's verification token
     * @param id - The user ID to update
     * @param token - The new verification token
     * @param expires - The token expiration date
     * @returns Promise<User> - The updated user
     */
    async updateVerificationToken(
        id: string,
        token: string,
        expires: Date
    ): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: {
                verificationToken: token,
                verificationTokenExpires: expires,
            },
        });
    }

    /**
     * Find a user by their Google ID
     * @param googleId - The Google ID to search for
     * @returns Promise<User | null> - The user if found, null otherwise
     */
    async findByGoogleId(googleId: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { googleId },
        });
    }

    /**
     * Create a new user with Google OAuth data
     * @param data - User creation data including Google OAuth info
     * @returns Promise<User> - The created user
     */
    async createGoogleUser(data: {
        email: string;
        googleId: string;
        googleEmail?: string;
        googleName?: string;
        googlePicture?: string;
        isEmailVerified?: boolean;
    }): Promise<User> {
        return this.prisma.user.create({
            data: {
                email: data.email,
                googleId: data.googleId,
                googleEmail: data.googleEmail || null,
                googleName: data.googleName || null,
                googlePicture: data.googlePicture || null,
                isEmailVerified: data.isEmailVerified || true,
                authProvider: 'google',
            },
        });
    }

    /**
     * Link Google account to existing user
     * @param userId - The user ID to link to
     * @param googleData - Google OAuth data
     * @returns Promise<User> - The updated user
     */
    async linkGoogleAccount(userId: string, googleData: {
        googleId: string;
        googleEmail?: string;
        googleName?: string;
        googlePicture?: string;
    }): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                googleId: googleData.googleId,
                googleEmail: googleData.googleEmail || null,
                googleName: googleData.googleName || null,
                googlePicture: googleData.googlePicture || null,
                authProvider: 'google',
                isEmailVerified: true, // Google emails are pre-verified
            },
        });
    }

    /**
     * Update user's Google OAuth information
     * @param userId - The user ID to update
     * @param googleData - Google OAuth data to update
     * @returns Promise<User> - The updated user
     */
    async updateGoogleInfo(userId: string, googleData: {
        googleEmail?: string;
        googleName?: string;
        googlePicture?: string;
    }): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                googleEmail: googleData.googleEmail || null,
                googleName: googleData.googleName || null,
                googlePicture: googleData.googlePicture || null,
            },
        });
    }

    /**
     * Set password reset token for user
     * @param userId - The user ID to set reset token for
     * @param resetToken - The password reset token
     * @param resetExpires - When the token expires
     * @returns Promise<User> - The updated user
     */
    async setPasswordResetToken(userId: string, resetToken: string, resetExpires: Date): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpires: resetExpires,
            },
        });
    }

    /**
     * Update user's password and clear reset token
     * @param userId - The user ID to update password for
     * @param passwordHash - The new hashed password
     * @returns Promise<User> - The updated user
     */
    async updatePassword(userId: string, passwordHash: string): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });
    }
}
