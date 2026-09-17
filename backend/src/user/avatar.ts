import fs from 'fs/promises';
import path from 'path';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');

/**
 * Persist a browser-generated JPEG data URL as the user's avatar file.
 * Always writes `{userId}.jpg` so re-uploads replace the previous image.
 */
export async function saveAvatarFromDataUrl(userId: string, dataUrl: string): Promise<string> {
    const match = dataUrl.match(/^data:image\/(?:jpeg|jpg|png|webp);base64,(.+)$/i);
    const base64 = match?.[1];
    if (!base64) {
        throw new Error('Image must be a JPEG, PNG, or WebP data URL');
    }

    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) {
        throw new Error('Image data is empty');
    }
    if (buffer.length > MAX_AVATAR_BYTES) {
        throw new Error('Image must be 2MB or smaller');
    }

    await fs.mkdir(AVATAR_DIR, { recursive: true });
    const filename = `${userId}.jpg`;
    await fs.writeFile(path.join(AVATAR_DIR, filename), buffer);

    return `/uploads/avatars/${filename}`;
}
