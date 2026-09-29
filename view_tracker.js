import { database } from './firebaseconfig.js';
import { decryptDeep, stablePathKey } from './encryption/encryption.js';
import { get, ref, remove, runTransaction, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// High-concurrency sharded counters.
// Existing scalar counters are migrated into { base, shards } before new writes.
const VIEW_COUNTER_ROOT = '1/2';
const VIEW_SHARDS = 32;

function normalizePortfolioType(portfolioType) {
  const value = String(portfolioType || '').trim().toLowerCase();
  return value === 'hall' || value === '12' || value === '13' ? 'hall' : 'banquet';
}


function venueRecordPath(portfolioType) {
  return normalizePortfolioType(portfolioType) === 'hall' ? '12/13' : '3/4';
}

async function counterBaseKey(portfolioType, uid) {
  return stablePathKey(`${portfolioType}:${uid}`, 'venue-view-counter');
}

async function ensureCounterShape(portfolioType, uid) {
  const key = await counterBaseKey(portfolioType, uid);
  const counterRef = ref(database, `${VIEW_COUNTER_ROOT}/${key}`);

  await runTransaction(counterRef, current => {
    if (current === null || typeof current === 'object') return current;
    const old = Number(current);
    return { base: Number.isFinite(old) && old >= 0 ? old : 0, shards: {} };
  });

  return key;
}

async function getBaseViews(portfolioType, uid) {
  try {
    const key = await counterBaseKey(portfolioType, uid);
    const [counterSnap, recordSnap] = await Promise.all([
      get(ref(database, `${VIEW_COUNTER_ROOT}/${key}`)),
      get(ref(database, `${venueRecordPath(portfolioType)}/${uid}`)),
    ]);

    const counter = counterSnap.exists() ? counterSnap.val() : null;
    let base = 0;
    if (counter && typeof counter === 'object') {
      base = Number(counter.base) || 0;
    } else if (counter !== null) {
      base = Number(counter) || 0;
    }

    let recordViews = 0;
    if (recordSnap.exists()) {
      const record = await decryptDeep(recordSnap.val());
      recordViews = Number(record?.views ?? record?.Views ?? 0) || 0;
    }

    // Preserve whichever pre-sharding source has the larger established count.
    return Math.max(base, recordViews);
  } catch (_) {
    return 0;
  }
}

function randomShard() {
  try {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return Number(bytes[0] % VIEW_SHARDS);
  } catch (_) {
    return Math.floor(Math.random() * VIEW_SHARDS);
  }
}

async function readShardValues(portfolioType, uid) {
  const key = await counterBaseKey(portfolioType, uid);
  const snap = await get(ref(database, `${VIEW_COUNTER_ROOT}/${key}/shards`));
  const value = snap.exists() ? snap.val() : {};
  let total = 0;
  for (const n of Object.values(value || {})) total += Number(n) || 0;
  return total;
}

export async function recordPortfolioView({ portfolioType = 'banquet', uid }) {
  if (!uid) return null;
  portfolioType = normalizePortfolioType(portfolioType);

  const key = await ensureCounterShape(portfolioType, uid);
  const shard = randomShard();
  const counterRef = ref(database, `${VIEW_COUNTER_ROOT}/${key}/shards/${shard}`);

  await runTransaction(counterRef, current => {
    const value = Number(current);
    return (Number.isFinite(value) ? value : 0) + 1;
  });

  try {
    const [base, shards] = await Promise.all([
      getBaseViews(portfolioType, uid),
      readShardValues(portfolioType, uid),
    ]);
    return base + shards;
  } catch (_) {
    return null;
  }
}

export async function subscribePortfolioViewCount({ portfolioType = 'banquet', uid, fallback = 0, onChange }) {
  if (!uid || typeof onChange !== 'function') return () => {};
  portfolioType = normalizePortfolioType(portfolioType);

  let active = true;
  const key = await counterBaseKey(portfolioType, uid);
  let base = await getBaseViews(portfolioType, uid);
  let shardTotal = 0;

  const emit = () => {
    if (!active) return;
    const total = Number(base || 0) + Number(shardTotal || 0);
    onChange(Number.isFinite(total) ? total : Number(fallback) || 0);
  };

  try {
    // One listener for the whole shard collection instead of 32 listeners.
    const shardsRef = ref(database, `${VIEW_COUNTER_ROOT}/${key}/shards`);
    const unsub = onValue(shardsRef, snap => {
      const value = snap.exists() ? snap.val() : {};
      shardTotal = Object.values(value || {}).reduce(
        (sum, n) => sum + (Number(n) || 0), 0
      );
      emit();
    }, () => emit());

    emit();

    return () => {
      active = false;
      try { unsub(); } catch (_) {}
    };
  } catch (_) {
    active = false;
    onChange(Number(fallback) || 0);
    return () => {};
  }
}

export async function deletePortfolioViewCounter({ portfolioType = 'banquet', uid }) {
  if (!uid) return;
  portfolioType = normalizePortfolioType(portfolioType);
  const key = await counterBaseKey(portfolioType, uid);
  await remove(ref(database, `${VIEW_COUNTER_ROOT}/${key}`));
}

export async function getPortfolioViewCount({ portfolioType = 'banquet', uid, fallback = 0 }) {
  if (!uid) return Number(fallback) || 0;
  portfolioType = normalizePortfolioType(portfolioType);
  try {
    const [base, shards] = await Promise.all([
      getBaseViews(portfolioType, uid),
      readShardValues(portfolioType, uid),
    ]);
    return base + shards;
  } catch (_) {
    return Number(fallback) || 0;
  }
}
