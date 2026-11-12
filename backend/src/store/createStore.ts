import { createMemoryStore } from './memoryStore.js';
import type { Store } from './store.js';
import { createSupabaseStore } from './supabaseStore.js';

/** Picks the store from DATA_STORE: "memory" (the default) or "supabase". */
export function createStore(env: NodeJS.ProcessEnv = process.env): Store {
  if (env.DATA_STORE === 'supabase') {
    const { SUPABASE_URL, SUPABASE_SECRET_KEY } = env;
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
      throw new Error('DATA_STORE=supabase needs SUPABASE_URL and SUPABASE_SECRET_KEY to be set.');
    }
    return createSupabaseStore(SUPABASE_URL, SUPABASE_SECRET_KEY);
  }
  return createMemoryStore();
}
