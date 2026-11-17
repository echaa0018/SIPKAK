import { createHmac } from 'node:crypto';
import type { Request } from 'express';
import { AppError } from '../lib/errors.js';
import type { Store } from '../store/store.js';

function fingerprint(value: string): string {
  // Use a deployment-specific secret in Supabase mode to prevent offline IP guessing.
  const secret = process.env.RATE_LIMIT_SECRET || 'local-memory-only-rate-limit';
  return createHmac('sha256', secret).update(value).digest('hex');
}

export async function limitSubmission(store: Store, req: Request, reporterId: string): Promise<void> {
  if (store.kind === 'supabase' && !process.env.RATE_LIMIT_SECRET) {
    throw new Error('RATE_LIMIT_SECRET must be set when DATA_STORE=supabase');
  }
  // Never trust a browser-supplied X-Forwarded-For header. Express req.ip uses the direct
  // connection unless a trusted proxy is explicitly configured in the deployment.
  const source = fingerprint(`source:${req.ip ?? req.socket.remoteAddress ?? 'unknown'}`);
  const reporter = fingerprint(`reporter:${reporterId}`);
  if (!(await store.allowSubmission(source, reporter, Date.now()))) {
    throw new AppError('RATE_LIMITED', 'Too many reports. Please try again in 10 minutes.');
  }
}
