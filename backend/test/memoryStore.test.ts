import { describe, expect, it } from 'vitest';
import { seedReports } from '../src/data/seed.js';
import { createMemoryStore } from '../src/store/memoryStore.js';

describe('memory store', () => {
  it('hands out copies, so changing a result does not change the store or the seed', async () => {
    const store = createMemoryStore();

    const report = await store.getReport(142);
    report!.description = 'changed';

    expect((await store.getReport(142))!.description).toBe('Lamp by the east stairs is out');
    expect(seedReports.find((r) => r.id === 142)!.description).toBe(
      'Lamp by the east stairs is out',
    );
  });

  it('returns undefined for an unknown id', async () => {
    expect(await createMemoryStore().getReport(9999)).toBeUndefined();
  });
});
