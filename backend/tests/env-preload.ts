import { execSync } from 'child_process';

process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.EMAIL_PROVIDER = 'console';
process.env.APP_URL = 'http://localhost:4000';
process.env.FRONTEND_URL = 'http://localhost:5173';

execSync('npx prisma generate --schema=prisma/test-schema.prisma', {
    stdio: 'inherit',
    env: {
        ...process.env,
        TEST_DATABASE_URL: process.env.DATABASE_URL,
    },
});
