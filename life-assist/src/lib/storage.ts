/**
 * Local-first persistence layer — Phase 1.
 *
 * Backed by IndexedDB (via Dexie) instead of Phase 0's localStorage, which
 * gives far higher storage quotas and won't silently fail when data grows
 * (habits/analytics history in later phases will be much larger than
 * tasks/notes ever were).
 *
 * IndexedDB is asynchronous, but every store in this app was written against
 * a synchronous readJSON/writeJSON API. Rather than rewrite every store to
 * be async (which would ripple into every component), this module keeps an
 * in-memory cache that's hydrated from IndexedDB once at startup:
 *   - readJSON()  reads the cache synchronously (same signature as Phase 0)
 *   - writeJSON() updates the cache synchronously, then persists to
 *     IndexedDB in the background (write-through, fire-and-forget)
 *
 * main.tsx awaits hydrateStorage() before rendering, so by the time any
 * component mounts, the cache already reflects what's on disk.
 */
import Dexie, { type Table } from 'dexie';

interface KVRow {
  key: string;
  value: unknown;
  updatedAt?: number;
}

class LifeAssistDB extends Dexie {
  kv!: Table<KVRow, string>;
  constructor() {
    super('lifeassist-db');
    this.version(1).stores({ kv: 'key' });
  }
}

export const db = new LifeAssistDB();

const cache = new Map<string, unknown>();
const timestampCache = new Map<string, number>();
let hydrated = false;

type ChangeListener = (name: string, value: unknown, updatedAt: number) => void;
const changeListeners = new Set<ChangeListener>();

export function addStorageChangeListener(listener: ChangeListener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

type RehydrateCallback = () => void;
const rehydrateCallbacks = new Set<RehydrateCallback>();

export function registerRehydrateCallback(cb: RehydrateCallback): () => void {
  rehydrateCallbacks.add(cb);
  return () => rehydrateCallbacks.delete(cb);
}

export function rehydrateAllStores(): void {
  rehydrateCallbacks.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('[storage] error during rehydration callback', e);
    }
  });
}

export function readJSON<T>(name: string, fallback: T): T {
  if (cache.has(name)) return cache.get(name) as T;
  return fallback;
}

export function writeJSON<T>(name: string, value: T): void {
  const updatedAt = Date.now();
  cache.set(name, value);
  timestampCache.set(name, updatedAt);
  db.kv.put({ key: name, value, updatedAt }).catch((err) => {
    // IndexedDB can fail (private browsing, quota, disabled storage). The
    // in-memory cache still has the value for this session; surface the
    // failure so the person knows a refresh could lose it.
    console.error(`[storage] failed to persist "${name}" to IndexedDB`, err);
  });

  changeListeners.forEach((listener) => {
    try {
      listener(name, value, updatedAt);
    } catch (e) {
      console.error('[storage] error in change listener', e);
    }
  });
}

export async function writeJSONFromSync(name: string, value: unknown, updatedAt: number): Promise<void> {
  cache.set(name, value);
  timestampCache.set(name, updatedAt);
  await db.kv.put({ key: name, value, updatedAt });
}

export interface StorageItem {
  key: string;
  value: unknown;
  updatedAt?: number;
}

export function getStorageItemWithTimestamp(name: string): StorageItem | null {
  if (!cache.has(name)) return null;
  return {
    key: name,
    value: cache.get(name),
    updatedAt: timestampCache.get(name),
  };
}

/**
 * One-time migration from the original single-file app's localStorage keys
 * (lifeassist_tasks, lifeassist_notes, ...) into the Phase 0 namespaced
 * localStorage schema, so nothing is lost if someone upgrades straight from
 * the original prototype.
 */
function migrateOriginalPrototypeKeys(): void {
  const legacyMap: Record<string, string> = {
    lifeassist_tasks: 'tasks',
    lifeassist_notes: 'notes',
    lifeassist_alarms: 'alarms',
    lifeassist_morning_alarm: 'morningAlarm',
    lifeassist_settings: 'legacySettings',
  };

  for (const [legacyKey, newName] of Object.entries(legacyMap)) {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) continue;
    const namespacedKey = `lifeassist:${newName}`;
    if (localStorage.getItem(namespacedKey)) continue; // already migrated once
    try {
      JSON.parse(raw); // validate before copying forward
      localStorage.setItem(namespacedKey, raw);
    } catch {
      // Skip unparseable legacy data rather than blocking startup.
    }
  }
}

/**
 * One-time migration from Phase 0's localStorage ("lifeassist:*") into
 * IndexedDB. Runs after the original-prototype migration above, so both
 * upgrade paths (original app -> Phase 1, or Phase 0 -> Phase 1) land in
 * the same place.
 */
async function migrateLocalStorageIntoIndexedDb(): Promise<void> {
  const marker = await db.kv.get('__migratedFromLocalStorage');
  if (marker) return;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('lifeassist:')) continue;
    const name = key.slice('lifeassist:'.length);
    const existing = await db.kv.get(name);
    if (existing) continue;
    try {
      const value = JSON.parse(localStorage.getItem(key) as string);
      await db.kv.put({ key: name, value });
    } catch {
      // Skip unparseable entries.
    }
  }

  await db.kv.put({ key: '__migratedFromLocalStorage', value: true });
}

/**
 * Call once at startup, before rendering and before any store reads
 * readJSON for its initial state. Runs both migrations, then loads every
 * IndexedDB row into the in-memory cache.
 */
export async function hydrateStorage(): Promise<void> {
  if (hydrated) return;
  migrateOriginalPrototypeKeys();
  await migrateLocalStorageIntoIndexedDb();

  const rows = await db.kv.toArray();
  rows.forEach((row) => {
    cache.set(row.key, row.value);
    if (row.updatedAt) {
      timestampCache.set(row.key, row.updatedAt);
    }
  });
  hydrated = true;
}

/** Every user-data row currently in IndexedDB, keyed by name (internal migration markers excluded). */
export async function exportAllData(): Promise<Record<string, unknown>> {
  const rows = await db.kv.toArray();
  const dump: Record<string, unknown> = {};
  rows.forEach((row) => {
    if (!row.key.startsWith('__')) dump[row.key] = row.value;
  });
  return dump;
}

/** Restores a dump produced by exportAllData — caller is responsible for reloading afterward to re-hydrate every store. */
export async function importAllData(dump: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(dump).filter(([key]) => !key.startsWith('__'));
  await db.kv.bulkPut(entries.map(([key, value]) => ({ key, value })));
}

/** Clears all user data from both the IndexedDB database and local cache maps, and rehydrates stores. */
export async function clearAllData(): Promise<void> {
  await db.kv.clear();
  cache.clear();
  timestampCache.clear();
  rehydrateAllStores();
}
