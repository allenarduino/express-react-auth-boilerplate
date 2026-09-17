import { z } from 'zod';

/**
 * Validation schemas for authentication endpoints
 */

// Signup validation
export const signupSchema = z.object({
    name: z.string().min(1, 'Name must be at least 1 character').max(100).optional(),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

// Login validation
export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
});

// Verify email validation
export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
});

// Resend verification validation
export const resendVerificationSchema = z.object({
    email: z.string().email('Invalid email format'),
});

// Verify token validation
export const verifyTokenSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

// Password reset request validation
export const passwordResetRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
});

// Password reset validation
export const passwordResetSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
