import { createHash, timingSafeEqual } from 'node:crypto';
import { AppError } from '../lib/errors.js';

// Compares secrets in constant time, so the response time doesn't leak how much of a guess was right.
function sameSecret(given: string, expected: string): boolean {
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(given), hash(expected));
}

// SIMULATED: one shared password from ADMIN_PASSWORD, and ADMIN_TOKEN as a fixed token.
// The real app would give each facilities staff member an account (e.g. Supabase Auth)
// and issue expiring tokens.

/** Returns the admin token if the password is right. */
export function login(password: string): string {
  const expected = process.env.ADMIN_PASSWORD;
  const token = process.env.ADMIN_TOKEN;
  if (!expected || !token || !sameSecret(password, expected)) {
    throw new AppError('UNAUTHORIZED', 'Wrong password');
  }
  return token;
}

/** Throws UNAUTHORIZED unless the Authorization header is "Bearer <ADMIN_TOKEN>". */
export function checkAdminToken(authorization: string | undefined): void {
  const token = process.env.ADMIN_TOKEN;
  const given = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token || !given || !sameSecret(given, token)) {
    throw new AppError('UNAUTHORIZED', 'Sign in as an admin first');
  }
}
