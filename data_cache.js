import { database } from './firebaseconfig.js';
import { decryptDeep } from './encryption/encryption.js';
import { onValue, ref } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const cache = new Map();
const listeners = new Map();

function ensure(path) {
  const key = String(path);
  let entry = cache.get(key);
  if (!entry) {
    let resolveFirst;
    let rejectFirst;
    const first = new Promise((resolve, reject) => { resolveFirst = resolve; rejectFirst = reject; });
    first.catch(() => {});
    entry = { data: undefined, ready: false, first, resolveFirst, rejectFirst, error: null };
    cache.set(key, entry);

    const unsub = onValue(ref(database, key), async (snap) => {
      try {
        const raw = snap.exists() ? snap.val() : {};
        entry.data = await decryptDeep(raw);
        entry.ready = true;
        entry.error = null;
        if (entry.resolveFirst) {
          entry.resolveFirst(entry.data);
          entry.resolveFirst = null;
          entry.rejectFirst = null;
        }
        const subs = listeners.get(key);
        if (subs) for (const cb of Array.from(subs)) {
          try { cb(entry.data); } catch (e) { console.error('[data-cache listener]', e); }
        }
      } catch (e) {
        entry.error = e;
        if (!entry.ready && entry.rejectFirst) {
          entry.rejectFirst(e);
          entry.resolveFirst = null;
          entry.rejectFirst = null;
        }
      }
    }, (error) => {
      entry.error = error;
      if (!entry.ready && entry.rejectFirst) {
        entry.rejectFirst(error);
        entry.resolveFirst = null;
        entry.rejectFirst = null;
      }
    });
    entry.unsubscribe = unsub;
  }
  return entry;
}

export function hasCached(path) {
  return !!cache.get(String(path))?.ready;
}

export async function getCached(path) {
  const entry = ensure(path);
  if (entry.ready) return entry.data;
  return entry.first;
}

export function peekCached(path, fallback = {}) {
  const entry = cache.get(String(path));
  return entry?.ready ? entry.data : fallback;
}

export function subscribeCached(path, callback) {
  const key = String(path);
  ensure(key);
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  const entry = cache.get(key);
  if (entry?.ready) queueMicrotask(() => { try { callback(entry.data); } catch (e) { console.error(e); } });
  return () => listeners.get(key)?.delete(callback);
}

export function invalidateCached(path) {
  const entry = cache.get(String(path));
  if (entry) entry.ready = false;
}

export function seedCached(path, data) {
  const entry = ensure(path);
  entry.data = data;
  entry.ready = true;
  return data;
}
