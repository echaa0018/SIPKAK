import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from '../lib/errors.js';

type AdminAccount = { username: string; password: string };
type AdminSession = { username: string; expiresAt: number };

const SESSION_SECONDS = 12 * 60 * 60;

function sameSecret(given: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

/** A local prototype can use ADMIN_USERNAME + ADMIN_PASSWORD. For multiple people, use
 * ADMIN_USERS_JSON with an array of username/password pairs (see .env.example).
 * Malformed configuration fails closed; it never grants access by default.
 */
function accounts(): AdminAccount[] {
  const json = process.env.ADMIN_USERS_JSON?.trim();
  if (json) {
    try {
      const values: unknown = JSON.parse(json);
      if (!Array.isArray(values) || values.length === 0 || values.length > 50) return [];
      const parsed: AdminAccount[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < values.length; i++) {
        const item = values[i] as Partial<AdminAccount> | null;
        if (!item || typeof item.username !== 'string' || typeof item.password !== 'string') return [];
        const username = item.username.trim();
        if (!username || !item.password || seen.has(username)) return [];
        seen.add(username);
        parsed.push({ username, password: item.password });
      }
      return parsed;
    } catch {
      return [];
    }
  }
  const password = process.env.ADMIN_PASSWORD;
  return password ? [{ username: process.env.ADMIN_USERNAME?.trim() || 'admin', password }] : [];
}

// ADMIN_TOKEN is accepted as a legacy signing secret for existing local .env files.
// Use a fresh ADMIN_SESSION_SECRET for any new environment.
function signingSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_TOKEN?.trim() || undefined;
}

function signature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Returns a signed, expiring session for the specific administrator. */
export function login(username: string, password: string): string {
  const users = accounts();
  const secret = signingSecret();
  const user = users.find((entry) => entry.username === username.trim());
  if (!secret || !user || !sameSecret(password, user.password)) {
    throw new AppError('UNAUTHORIZED', 'Invalid username or password');
  }
  const session: AdminSession = {
    username: user.username,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${signature(payload, secret)}`;
}

/** Every admin operation validates its signed session on the server. */
export function checkAdminToken(authorization: string | undefined): string {
  const secret = signingSecret();
  const token = authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!secret || !token) throw new AppError('UNAUTHORIZED', 'Sign in as an admin first');

  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new AppError('UNAUTHORIZED', 'Invalid admin session');
  }
  const expected = signature(parts[0], secret);
  const givenBuffer = Buffer.from(parts[1]);
  const expectedBuffer = Buffer.from(expected);
  if (givenBuffer.length !== expectedBuffer.length || !timingSafeEqual(givenBuffer, expectedBuffer)) {
    throw new AppError('UNAUTHORIZED', 'Invalid admin session');
  }

  try {
    const session = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as AdminSession;
    if (typeof session.username !== 'string' || typeof session.expiresAt !== 'number' ||
        !Number.isFinite(session.expiresAt) || session.expiresAt <= Math.floor(Date.now() / 1000) ||
        !accounts().some((account) => account.username === session.username)) {
      throw new Error('Expired or disabled account');
    }
    return session.username;
  } catch {
    throw new AppError('UNAUTHORIZED', 'Expired or invalid admin session. Sign in again.');
  }
}
