import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import passport from 'passport';
import { config } from 'dotenv';
import { createAuthRoutes } from './auth';
import { createUserRoutes } from './user';
import { prisma } from './config/prisma';
import { env } from './config/env';
import { createEmailProvider } from './infrastructure/email';
import { AuthService } from './auth/auth.service';
import { UserService } from './user/user.service';
import { AuthRepository } from './auth/auth.repository';
import { UserRepository } from './user/user.repository';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { configureGoogleStrategy } from './auth/google.strategy';

// Load environment variables
config();

const app = express();
const PORT = env.PORT || 4000;

// CORS configuration
const corsOrigins = [
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
].filter((origin, index, list) => Boolean(origin) && list.indexOf(origin) === index);

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());

// Initialize repositories with Prisma instance
const authRepository = new AuthRepository(prisma);
const userRepository = new UserRepository(prisma);

// Initialize email provider based on environment
const emailProvider = createEmailProvider();

// Initialize services with dependencies
const authService = new AuthService(authRepository, userRepository, emailProvider);
const userService = new UserService(userRepository);

// Initialize controllers with services
const authController = new AuthController(authService);
const userController = new UserController(userService);

// Initialize Passport and Google OAuth strategy
configureGoogleStrategy();

// Middleware
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Initialize Passport middleware
app.use(passport.initialize());

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', createAuthRoutes(authController));
app.use('/api/user', createUserRoutes(userController));

// Root route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Express + TypeScript Authentication API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            user: '/api/user',
            health: '/health'
        }
    });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler:', error);

    res.status(400).json({
        success: false,
        error: error.message || 'Internal server error'
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    try {
        await prisma.$disconnect();
        console.log('Prisma client disconnected');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle process termination
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start server (supertest uses `app` directly in tests)
let server: ReturnType<typeof app.listen> | undefined;

if (env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log('====================================');
        console.log('🚀 Server is running!');
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${env.NODE_ENV || 'development'}`);
        console.log(`📧 Email Provider: ${env.EMAIL_PROVIDER || 'console'}`);
        console.log('====================================');
        console.log('\n📋 Available endpoints:');
        console.log('  GET  /health - Health check');
        console.log('  POST /api/auth/signup - Register user');
        console.log('  GET  /api/auth/verify?token=xxx - Verify email');
        console.log('  POST /api/auth/login - Login user');
        console.log('  POST /api/auth/logout - Clear session cookie');
        console.log('  GET  /api/auth/google - Google OAuth login');
        console.log('  GET  /api/auth/google/callback - Google OAuth callback');
        console.log('  GET  /api/auth/me - Get current user (protected)');
        console.log('  POST /api/auth/change-password - Change password (protected)');
        console.log('  GET  /api/user/me - Get user profile (protected)');
        console.log('  PUT  /api/user/me/profile - Update profile (protected)');
        console.log('  POST /api/user/me/avatar - Upload avatar (protected)');
        console.log('  DELETE /api/user/me - Delete account (protected)');
        console.log('====================================');
    });
}

export { app, server };