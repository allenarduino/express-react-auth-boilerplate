import request from 'supertest';
import { app } from '../src/server';
import { getTestPrisma, resetDatabase } from './database';
import { testUtils } from './setup';

describe('Authentication Integration Tests', () => {
    const prisma = getTestPrisma();
    let testUser: { email: string; password: string };
    let createdUserId: string;
    let verificationToken: string;

    const signupAndVerify = async (email: string, password: string) => {
        const signupResponse = await request(app)
            .post('/api/auth/signup')
            .send({ email, password })
            .expect(201);

        const id = signupResponse.body.data.id as string;
        const userInDb = await prisma.user.findUnique({ where: { id } });
        const token = userInDb?.verificationToken || '';

        await request(app).get(`/api/auth/verify?token=${token}`).expect(200);

        return { id, verificationToken: token };
    };

    beforeAll(async () => {
        await resetDatabase();
    });

    beforeEach(() => {
        testUser = testUtils.generateTestUser();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    describe('POST /api/auth/signup', () => {
        it('should create a new user and return 201 with user data', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('email', testUser.email);

            createdUserId = response.body.data.id;

            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
                include: { profile: true },
            });

            expect(userInDb).toBeTruthy();
            expect(userInDb?.email).toBe(testUser.email);
            expect(userInDb?.isEmailVerified).toBe(false);
            expect(userInDb?.verificationToken).toBeTruthy();
            expect(userInDb?.profile).toBeTruthy();

            verificationToken = userInDb?.verificationToken || '';
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'invalid-email',
                    password: testUser.password,
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
        });

        it('should return 400 for weak password', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: '123',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
        });

        it('should return 400 for duplicate email', async () => {
            await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(201);

            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /api/auth/verify', () => {
        beforeEach(async () => {
            const signupResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            createdUserId = signupResponse.body.data.id;

            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
            });
            verificationToken = userInDb?.verificationToken || '';
        });

        it('should verify email successfully with valid token', async () => {
            const response = await request(app)
                .get(`/api/auth/verify?token=${verificationToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id', createdUserId);
            expect(response.body.data).toHaveProperty('email', testUser.email);
            expect(response.body.data).toHaveProperty('isEmailVerified', true);

            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
            });

            expect(userInDb?.isEmailVerified).toBe(true);
            expect(userInDb?.verificationToken).toBeNull();
        });

        it('should return 400 for invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/verify?token=invalid-token')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 for missing token', async () => {
            const response = await request(app)
                .get('/api/auth/verify')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            const created = await signupAndVerify(testUser.email, testUser.password);
            createdUserId = created.id;
            verificationToken = created.verificationToken;
        });

        it('should login successfully with verified email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('token');
        });

        it('should return 401 for unverified email', async () => {
            const newTestUser = testUtils.generateTestUser();
            await request(app)
                .post('/api/auth/signup')
                .send({
                    email: newTestUser.email,
                    password: newTestUser.password,
                });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: newTestUser.email,
                    password: newTestUser.password,
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 for missing email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: testUser.password,
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('errors');
        });
    });

    describe('GET /api/auth/me', () => {
        let authToken: string;

        beforeEach(async () => {
            const created = await signupAndVerify(testUser.email, testUser.password);
            createdUserId = created.id;

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            authToken = loginResponse.body.data.token;
        });

        it('should return user profile with a valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id', createdUserId);
            expect(response.body.data).toHaveProperty('email', testUser.email);
        });

        it('should return 401 for missing token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        it('should return 401 for invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        it('should return 401 for malformed authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'InvalidFormat token')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/user/me', () => {
        let authToken: string;

        beforeEach(async () => {
            const created = await signupAndVerify(testUser.email, testUser.password);
            createdUserId = created.id;

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            authToken = loginResponse.body.data.token;
        });

        it('should return user profile with a valid token', async () => {
            const response = await request(app)
                .get('/api/user/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id', createdUserId);
            expect(response.body.data).toHaveProperty('email', testUser.email);
            expect(response.body.data).toHaveProperty('profile');
            expect(response.body.data.profile).toHaveProperty('name');
            expect(response.body.data.profile).toHaveProperty('bio');
            expect(response.body.data.profile).toHaveProperty('avatarUrl');
            expect(response.body.data.profile).toHaveProperty('website');
        });

        it('should return 401 for missing token', async () => {
            const response = await request(app)
                .get('/api/user/me')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('password reset', () => {
        it('should reset the password and allow login with the new password', async () => {
            await signupAndVerify(testUser.email, testUser.password);

            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: testUser.email })
                .expect(200);

            const userAfterForgot = await prisma.user.findUnique({
                where: { email: testUser.email },
            });
            const resetToken = userAfterForgot?.passwordResetToken;
            expect(resetToken).toBeTruthy();

            const newPassword = 'newpassword123';
            await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: resetToken,
                    password: newPassword,
                })
                .expect(200);

            await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(401);

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: newPassword,
                })
                .expect(200);

            await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
                .expect(200);
        });

        it('should return 400 for an invalid reset token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token: 'not-a-real-reset-token',
                    password: 'newpassword123',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('DELETE /api/user/me', () => {
        it('should delete the account and reject later logins', async () => {
            const created = await signupAndVerify(testUser.email, testUser.password);
            createdUserId = created.id;

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            const authToken = loginResponse.body.data.token as string;

            await request(app)
                .delete('/api/user/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ confirmEmail: 'wrong@example.com' })
                .expect(400);

            await request(app)
                .delete('/api/user/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ confirmEmail: testUser.email })
                .expect(200);

            const userInDb = await prisma.user.findUnique({
                where: { id: createdUserId },
            });
            expect(userInDb).toBeNull();

            await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(401);
        });
    });
});
