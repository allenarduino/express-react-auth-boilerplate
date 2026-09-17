import { UserRepository } from './user.repository';

/**
 * Combined user and profile data structure
 */
export interface UserProfileData {
    id: string;
    email: string;
    isEmailVerified: boolean;
    googlePicture: string | null;
    googleName: string | null;
    profile: {
        name: string | null;
        bio: string | null;
        avatarUrl: string | null;
        website: string | null;
    };
}

/**
 * Profile update data structure
 */
export interface ProfileUpdateData {
    name?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    website?: string | null;
}

/**
 * User service for profile management operations
 * Separates user profile logic from authentication logic
 */
export class UserService {
    constructor(
        private userRepo: UserRepository
    ) { }

    /**
     * Get user profile with combined user and profile data
     * @param userId - The user ID to get profile for
     * @returns Promise<UserProfileData> - Combined user and profile data
     * @throws Error if user or profile not found
     */
    async getProfile(userId: string): Promise<UserProfileData> {
        // Validate input
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('User ID is required and must be a non-empty string');
        }

        // Get user with profile data
        const userWithProfile = await this.userRepo.findUserWithProfile(userId);
        if (!userWithProfile) {
            throw new Error('User not found');
        }

        if (!userWithProfile.profile) {
            throw new Error('Profile not found for user');
        }

        // Return combined data
        return {
            id: userWithProfile.id,
            email: userWithProfile.email,
            isEmailVerified: userWithProfile.isEmailVerified,
            googlePicture: userWithProfile.googlePicture,
            googleName: userWithProfile.googleName,
            profile: {
                name: userWithProfile.profile.name,
                bio: userWithProfile.profile.bio,
                avatarUrl: userWithProfile.profile.avatarUrl,
                website: userWithProfile.profile.website,
            },
        };
    }

    /**
     * Update user profile with provided data
     * @param userId - The user ID whose profile to update
     * @param data - Profile data to update
     * @returns Promise<UserProfileData> - Updated combined user and profile data
     * @throws Error if user or profile not found, or validation fails
     */
    async updateProfile(userId: string, data: ProfileUpdateData): Promise<UserProfileData> {
        // Validate input
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('User ID is required and must be a non-empty string');
        }

        if (!data || typeof data !== 'object') {
            throw new Error('Profile data is required and must be an object');
        }

        // Validate individual fields if provided
        if (data.name !== undefined && data.name !== null && typeof data.name !== 'string') {
            throw new Error('Name must be a string or null');
        }

        if (data.bio !== undefined && data.bio !== null && typeof data.bio !== 'string') {
            throw new Error('Bio must be a string or null');
        }

        if (data.avatarUrl !== undefined && data.avatarUrl !== null && typeof data.avatarUrl !== 'string') {
            throw new Error('Avatar URL must be a string or null');
        }

        if (data.website !== undefined && data.website !== null && typeof data.website !== 'string') {
            throw new Error('Website must be a string or null');
        }

        // Validate string lengths
        if (data.name && data.name.length > 100) {
            throw new Error('Name must be 100 characters or less');
        }

        if (data.bio && data.bio.length > 500) {
            throw new Error('Bio must be 500 characters or less');
        }

        if (data.website && data.website.length > 200) {
            throw new Error('Website URL must be 200 characters or less');
        }

        // Check if user exists
        const user = await this.userRepo.findUserBasicInfo(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if profile exists
        const profileExists = await this.userRepo.profileExists(userId);
        if (!profileExists) {
            throw new Error('Profile not found for user');
        }

        // Update profile
        const updatedProfile = await this.userRepo.updateProfile(userId, data);

        // Return updated combined data
        return {
            id: user.id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            googlePicture: user.googlePicture,
            googleName: user.googleName,
            profile: {
                name: updatedProfile.name,
                bio: updatedProfile.bio,
                avatarUrl: updatedProfile.avatarUrl,
                website: updatedProfile.website,
            },
        };
    }

    /**
     * Check if a user exists by ID
     * @param userId - The user ID to check
     * @returns Promise<boolean> - True if user exists, false otherwise
     */
    async userExists(userId: string): Promise<boolean> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            return false;
        }

        const user = await this.userRepo.findUserBasicInfo(userId);
        return user !== null;
    }

    /**
     * Get user basic info without profile data
     * @param userId - The user ID to get info for
     * @returns Promise<{ id: string; email: string; isEmailVerified: boolean; googlePicture: string | null; googleName: string | null }> - Basic user info
     * @throws Error if user not found
     */
    async getUserInfo(userId: string): Promise<{
        id: string
        email: string
        isEmailVerified: boolean
        googlePicture: string | null
        googleName: string | null
    }> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('User ID is required and must be a non-empty string');
        }

        const user = await this.userRepo.findUserBasicInfo(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Delete user profile (soft delete by clearing profile data)
     * @param userId - The user ID whose profile to delete
     * @returns Promise<void>
     * @throws Error if user or profile not found
     */
    async deleteProfile(userId: string): Promise<void> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('User ID is required and must be a non-empty string');
        }

        const user = await this.userRepo.findUserBasicInfo(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const profileExists = await this.userRepo.profileExists(userId);
        if (!profileExists) {
            throw new Error('Profile not found for user');
        }

        // Clear profile data
        await this.userRepo.clearProfile(userId);
    }

    /**
     * Permanently delete the user account and related records.
     */
    async deleteAccount(userId: string): Promise<void> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('User ID is required and must be a non-empty string');
        }

        const user = await this.userRepo.findUserBasicInfo(userId);
        if (!user) {
            throw new Error('User not found');
        }

        await this.userRepo.deleteUser(userId);
    }
}
