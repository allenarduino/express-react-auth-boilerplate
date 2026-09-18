import { PrismaClient, Session, User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { generateOpaqueToken, hashToken } from './tokens';

export const SESSION_KIND = 'session';
export const REMEMBER_KIND = 'remember';

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionWithUser = Session & { user: User };

export class SessionRepository {
    private prisma: PrismaClient;

    constructor(prismaClient?: PrismaClient) {
        this.prisma = prismaClient || prisma;
    }

    async create(
        userId: string,
        kind: typeof SESSION_KIND | typeof REMEMBER_KIND,
        ttlMs: number
    ): Promise<{ id: string; rawToken: string }> {
        const rawToken = generateOpaqueToken();
        const created = await this.prisma.session.create({
            data: {
                userId,
                tokenHash: hashToken(rawToken),
                kind,
                expiresAt: new Date(Date.now() + ttlMs),
            },
        });
        return { id: created.id, rawToken };
    }

    async createLoginTokens(
        userId: string,
        rememberMe: boolean
    ): Promise<{ sessionToken: string; sessionId: string; rememberToken: string | null }> {
        const session = await this.create(userId, SESSION_KIND, SESSION_TTL_MS);
        let rememberToken: string | null = null;
        if (rememberMe) {
            const remember = await this.create(userId, REMEMBER_KIND, REMEMBER_TTL_MS);
            rememberToken = remember.rawToken;
        }
        return {
            sessionToken: session.rawToken,
            sessionId: session.id,
            rememberToken,
        };
    }

    async findValid(
        rawToken: string,
        kind: typeof SESSION_KIND | typeof REMEMBER_KIND
    ): Promise<SessionWithUser | null> {
        return this.prisma.session.findFirst({
            where: {
                tokenHash: hashToken(rawToken),
                kind,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
    }

    async deleteByRawToken(
        rawToken: string,
        kind: typeof SESSION_KIND | typeof REMEMBER_KIND
    ): Promise<void> {
        await this.prisma.session.deleteMany({
            where: {
                tokenHash: hashToken(rawToken),
                kind,
            },
        });
    }

    async deleteAllForUser(userId: string): Promise<void> {
        await this.prisma.session.deleteMany({ where: { userId } });
    }

    async deleteAllForUserExcept(userId: string, sessionId?: string): Promise<void> {
        await this.prisma.session.deleteMany({
            where: sessionId
                ? { userId, id: { not: sessionId } }
                : { userId },
        });
    }
}
