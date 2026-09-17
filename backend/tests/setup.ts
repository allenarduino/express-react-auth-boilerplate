import { execSync } from 'child_process';
import { setupTestDatabase, cleanupTestDatabase } from './db-setup';

// Global test setup
beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    process.env.EMAIL_PROVIDER = 'console';
    process.env.APP_URL = 'http://localhost:4000';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    // Setup test database
    await setupTestDatabase();
});

afterAll(async () => {
    await cleanupTestDatabase();
    execSync('npx prisma generate --schema=prisma/schema.prisma', { stdio: 'inherit' });
});

// Global test utilities
export const testUtils = {
    // Generate test user data
    generateTestUser: () => ({
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
    }),

    // Wait for async operations
    wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};
