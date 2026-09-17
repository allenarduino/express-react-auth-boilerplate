import { z } from 'zod';

/**
 * Validation schemas for user profile endpoints
 */

const emptyToNull = (value: string | null | undefined) =>
    value === '' ? null : value;

const optionalUrl = z
    .union([z.string().url('Invalid URL format'), z.literal(''), z.null()])
    .optional()
    .transform(emptyToNull);

// Update profile validation
export const updateProfileSchema = z.object({
    name: z.string().max(100, 'Name must be 100 characters or less').nullable().optional(),
    avatarUrl: optionalUrl,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Body for permanent account deletion (must match signed-in email). */
export const deleteAccountSchema = z.object({
    confirmEmail: z.string().email('Enter a valid email address'),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const uploadAvatarSchema = z.object({
    image: z.string().min(1, 'Image data is required'),
});

export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;

