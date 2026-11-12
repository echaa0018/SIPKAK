import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/createApp.js';
import { createStore } from '../src/store/createStore.js';

describe('createStore', () => {
  it('uses the memory store by default', () => {
    expect(createStore({}).kind).toBe('memory');
    expect(createStore({ DATA_STORE: 'memory' }).kind).toBe('memory');
  });

  it('uses Supabase with DATA_STORE=supabase', () => {
    const store = createStore({
      DATA_STORE: 'supabase',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_example',
    });

    expect(store.kind).toBe('supabase');
  });

  it('refuses DATA_STORE=supabase without its URL and key', () => {
    expect(() => createStore({ DATA_STORE: 'supabase' })).toThrow(
      'DATA_STORE=supabase needs SUPABASE_URL and SUPABASE_SECRET_KEY',
    );
  });

  it('explains a SUPABASE_URL copied with /rest/v1/', () => {
    expect(() =>
      createStore({
        DATA_STORE: 'supabase',
        SUPABASE_URL: 'https://example.supabase.co/rest/v1/',
        SUPABASE_SECRET_KEY: 'sb_secret_example',
      }),
    ).toThrow('without /rest/v1/');
  });

  it('is what /api/health reports', async () => {
    const store = createStore({
      DATA_STORE: 'supabase',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_example',
    });

    const res = await request(createApp(store)).get('/api/health');

    expect(res.body).toEqual({ ok: true, store: 'supabase' });
  });
});
