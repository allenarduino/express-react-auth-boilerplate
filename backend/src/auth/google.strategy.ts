import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthRepository } from './auth.repository';
import { UserRepository } from '../user/user.repository';
import { env, isGoogleAuthConfigured } from '../config/env';

/**
 * Google OAuth Strategy configuration
 */
export function configureGoogleStrategy(): void {
    if (!isGoogleAuthConfigured()) {
        return
    }
    const authRepo = new AuthRepository();
    const userRepo = new UserRepository();

    passport.use(new GoogleStrategy({
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${env.APP_URL}/api/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this Google ID
            let user = await authRepo.findByGoogleId(profile.id);

            if (user) {
                // User exists, update their Google info if needed
                if (user.googleEmail !== profile.emails?.[0]?.value ||
                    user.googleName !== profile.displayName ||
                    user.googlePicture !== profile.photos?.[0]?.value) {

                    user = await authRepo.updateGoogleInfo(user.id, {
                        ...(profile.emails?.[0]?.value && { googleEmail: profile.emails[0].value }),
                        ...(profile.displayName && { googleName: profile.displayName }),
                        ...(profile.photos?.[0]?.value && { googlePicture: profile.photos[0].value })
                    });

                    // Update user's profile with latest Google picture
                    if (profile.photos?.[0]?.value) {
                        const userRepo = new UserRepository();
                        await userRepo.updateProfile(user.id, {
                            name: profile.displayName || null,
                            avatarUrl: profile.photos[0].value
                        });
                    }
                }
                return done(null, user);
            }

            // Check if user exists with the same email
            const existingUser = await authRepo.findByEmail(profile.emails?.[0]?.value || '');
            if (existingUser) {
                // Link Google account to existing user
                user = await authRepo.linkGoogleAccount(existingUser.id, {
                    googleId: profile.id,
                    ...(profile.emails?.[0]?.value && { googleEmail: profile.emails[0].value }),
                    ...(profile.displayName && { googleName: profile.displayName }),
                    ...(profile.photos?.[0]?.value && { googlePicture: profile.photos[0].value })
                });

                // Update existing user's profile with Google picture if they don't have an avatar
                if (profile.photos?.[0]?.value) {
                    const userRepo = new UserRepository();
                    const currentProfile = await userRepo.findProfileByUserId(existingUser.id);
                    if (currentProfile && !currentProfile.avatarUrl) {
                        await userRepo.updateProfile(existingUser.id, {
                            name: profile.displayName || currentProfile.name,
                            avatarUrl: profile.photos[0].value
                        });
                    }
                }

                return done(null, user);
            }

            // Create new user with Google OAuth
            user = await authRepo.createGoogleUser({
                email: profile.emails?.[0]?.value || '',
                googleId: profile.id,
                ...(profile.emails?.[0]?.value && { googleEmail: profile.emails[0].value }),
                ...(profile.displayName && { googleName: profile.displayName }),
                ...(profile.photos?.[0]?.value && { googlePicture: profile.photos[0].value }),
                isEmailVerified: true // Google emails are pre-verified
            });

            // Create profile for the new user with Google picture as avatar
            await userRepo.createProfileWithAvatar(user.id, {
                name: profile.displayName || null,
                avatarUrl: profile.photos?.[0]?.value || null
            });

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }));

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await authRepo.findById(id);
            done(null, user);
        } catch (error) {
            done(error, false);
        }
    });
}

