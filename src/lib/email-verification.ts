import crypto from 'crypto';

const SECRET = process.env.APPWRITE_API_KEY || 'fallback-secret';

/**
 * Generate a random 6-digit verification code.
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create a signed token that embeds userId + code + expiry.
 * Stored in an httpOnly cookie so the server can verify the code
 * without needing a database table.
 * Valid for 15 minutes.
 */
export function createVerificationToken(userId: string, email: string, code: string): string {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min
  const payload = `${userId}:${email}:${code}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/**
 * Verify a code against the signed token.
 * Returns userId + email if valid, null otherwise.
 */
export function verifyCode(
  token: string,
  inputCode: string
): { userId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 5) return null;

    const [userId, email, code, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    // Check expiration
    if (Date.now() > expiresAt) return null;

    // Verify signature
    const payload = `${userId}:${email}:${code}:${expiresAtStr}`;
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

    if (signature !== expectedSignature) return null;

    // Check code matches (constant-time comparison)
    if (
      inputCode.length !== code.length ||
      !crypto.timingSafeEqual(Buffer.from(inputCode), Buffer.from(code))
    ) {
      return null;
    }

    return { userId, email };
  } catch {
    return null;
  }
}
