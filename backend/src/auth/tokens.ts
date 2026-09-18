import crypto from 'crypto';

export function generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function tokensMatch(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
