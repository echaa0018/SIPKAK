import { readFileSync } from 'node:fs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/index.js';

// What Vercel's zero-config Express needs from src/index.ts.
describe('Vercel entry point (src/index.ts)', () => {
  it('default-exports an app that serves the API', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns the API’s JSON errors through the mounted app', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('imports and calls express, and never calls listen()', () => {
    const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');

    expect(source).toMatch(/^import express from 'express';$/m);
    expect(source).toMatch(/= express\(\)/);
    expect(source).not.toMatch(/\.listen\(/);
  });
});
