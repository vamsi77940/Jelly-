import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let lastDb: { close: () => void } | undefined;

async function freshStorageModule() {
  // Each test needs its own module instance: storage.ts keeps module-level
  // "hydrated" state and an in-memory cache, both of which must reset
  // between tests the same way they'd reset on a real app restart.
  vi.resetModules();
  const mod = await import('@/lib/storage');
  lastDb = mod.db;
  return mod;
}

async function deleteTestDatabase() {
  lastDb?.close();
  lastDb = undefined;
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('lifeassist-db');
    req.onsuccess = () => resolve(undefined);
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(undefined);
  });
}

beforeEach(async () => {
  localStorage.clear();
  await deleteTestDatabase();
});

afterEach(() => {
  lastDb?.close();
});

describe('storage migration and persistence', () => {
  it('migrates the original prototype\'s flat localStorage keys forward', async () => {
    const seededTasks = [{ id: 't1', title: 'Legacy task', completed: false }];
    localStorage.setItem('lifeassist_tasks', JSON.stringify(seededTasks));

    const { hydrateStorage, readJSON } = await freshStorageModule();
    await hydrateStorage();

    expect(readJSON('tasks', [])).toEqual(seededTasks);
  });

  it('migrates Phase 0 namespaced localStorage keys into IndexedDB', async () => {
    const seededNotes = [{ id: 'n1', title: 'Phase 0 note', content: 'hello' }];
    localStorage.setItem('lifeassist:notes', JSON.stringify(seededNotes));

    const { hydrateStorage, readJSON } = await freshStorageModule();
    await hydrateStorage();

    expect(readJSON('notes', [])).toEqual(seededNotes);
  });

  it('falls back cleanly when there is nothing to migrate', async () => {
    const { hydrateStorage, readJSON } = await freshStorageModule();
    await hydrateStorage();

    expect(readJSON('tasks', [])).toEqual([]);
    expect(readJSON('nonexistentKey', 'fallback')).toBe('fallback');
  });

  it('does not throw or duplicate data when hydrateStorage runs twice', async () => {
    localStorage.setItem('lifeassist_tasks', JSON.stringify([{ id: 't1' }]));
    const { hydrateStorage, readJSON } = await freshStorageModule();

    await hydrateStorage();
    await hydrateStorage();

    expect(readJSON('tasks', [])).toEqual([{ id: 't1' }]);
  });

  it('persists writeJSON to IndexedDB so a later app restart can read it back', async () => {
    const first = await freshStorageModule();
    await first.hydrateStorage();
    first.writeJSON('habits', [{ id: 'h1', name: 'Read' }]);

    // Give the fire-and-forget IndexedDB write a tick to land before we
    // simulate a fresh restart and re-hydrate from disk.
    await new Promise((r) => setTimeout(r, 20));

    const second = await freshStorageModule();
    await second.hydrateStorage();

    expect(second.readJSON('habits', [])).toEqual([{ id: 'h1', name: 'Read' }]);
  });

  it('exportAllData excludes internal migration marker rows', async () => {
    const { hydrateStorage, writeJSON, exportAllData } = await freshStorageModule();
    await hydrateStorage();
    writeJSON('tasks', [{ id: 't1' }]);
    await new Promise((r) => setTimeout(r, 20));

    const dump = await exportAllData();
    expect(dump.tasks).toEqual([{ id: 't1' }]);
    expect(Object.keys(dump).some((k) => k.startsWith('__'))).toBe(false);
  });

  it('importAllData restores a dump produced by exportAllData', async () => {
    const { hydrateStorage, importAllData } = await freshStorageModule();
    await hydrateStorage();

    await importAllData({ tasks: [{ id: 'restored' }] });

    const fresh = await freshStorageModule();
    await fresh.hydrateStorage();
    expect(fresh.readJSON('tasks', [])).toEqual([{ id: 'restored' }]);
  });

  it('clearAllData wipes database and local cache maps', async () => {
    const { hydrateStorage, writeJSON, readJSON, clearAllData } = await freshStorageModule();
    await hydrateStorage();

    writeJSON('tasks', [{ id: 'clearTest' }]);
    expect(readJSON('tasks', [])).toEqual([{ id: 'clearTest' }]);

    await clearAllData();

    expect(readJSON('tasks', [])).toEqual([]);

    const fresh = await freshStorageModule();
    await fresh.hydrateStorage();
    expect(fresh.readJSON('tasks', [])).toEqual([]);
  });
});
