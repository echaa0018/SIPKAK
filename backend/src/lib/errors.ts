import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export type ErrorCode =
  'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'PAYLOAD_TOO_LARGE' | 'INTERNAL';

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, string>;

  constructor(code: ErrorCode, message: string, details?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = statusByCode[code];
    this.details = details;
  }
}

// Turns a zod error into { field: "first message for that field" }.
function zodDetails(error: ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'body';
    details[field] ??= issue.message;
  }
  return details;
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) {
    return new AppError('VALIDATION_ERROR', 'Invalid request', zodDetails(err));
  }
  // Errors thrown by express.json() carry a `type`.
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.too.large') {
    return new AppError('PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  if (type === 'entity.parse.failed') {
    return new AppError('VALIDATION_ERROR', 'Body is not valid JSON');
  }

  console.error(err);
  return new AppError('INTERNAL', 'Something went wrong');
}

export const notFound: RequestHandler = (req) => {
  throw new AppError('NOT_FOUND', `No route for ${req.method} ${req.path}`);
};

// Express recognises an error handler by its four parameters, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { code, status, message, details } = toAppError(err);
  res.status(status).json({ error: { code, message, ...(details && { details }) } });
};
