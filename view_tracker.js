import { database } from './firebaseconfig.js';
import { decryptDeep, stablePathKey } from './encryption/encryption.js';
import { get, ref, remove, runTransaction, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const VIEW_COUNTER_ROOT = 'analytics/venueViews';

function venueRecordPath(portfolioType) {
  return portfolioType === 'hall' ? 'hall/unique_hall' : 'banquet/unique_bank';
}

async function getLegacyViews(portfolioType, uid) {
  try {
    const snap = await get(ref(database, `${venueRecordPath(portfolioType)}/${uid}`));
    if (!snap.exists()) return 0;
    const record = await decryptDeep(snap.val());
    return Number(record?.views ?? record?.Views ?? 0) || 0;
  } catch (_) {
    return 0;
  }
}

async function counterRefFor(portfolioType, uid) {
  const key = await stablePathKey(`${portfolioType}:${uid}`, 'venue-view-counter');
  return ref(database, `${VIEW_COUNTER_ROOT}/${key}`);
}

export async function recordPortfolioView({ portfolioType = 'banquet', uid }) {
  if (!uid) return null;

  const counterRef = await counterRefFor(portfolioType, uid);
  const legacyViews = await getLegacyViews(portfolioType, uid);

  const result = await runTransaction(counterRef, current => {
    if (current === null || current === undefined) return legacyViews + 1;
    const value = Number(current);
    return (Number.isFinite(value) ? value : legacyViews) + 1;
  });

  return Number(result.snapshot?.val()) || 0;
}

export async function subscribePortfolioViewCount({ portfolioType = 'banquet', uid, fallback = 0, onChange }) {
  if (!uid || typeof onChange !== 'function') return () => {};
  try {
    const counterRef = await counterRefFor(portfolioType, uid);
    return onValue(counterRef, snap => {
      const value = Number(snap.val());
      onChange(Number.isFinite(value) ? value : Number(fallback) || 0);
    }, () => {
      onChange(Number(fallback) || 0);
    }, { onlyOnce: false });
  } catch (_) {
    onChange(Number(fallback) || 0);
    return () => {};
  }
}

export async function deletePortfolioViewCounter({ portfolioType = 'banquet', uid }) {
  if (!uid) return;
  try {
    const counterRef = await counterRefFor(portfolioType, uid);
    await remove(counterRef);
  } catch (error) {
    console.error('Failed to delete portfolio view counter:', error);
    throw error;
  }
}

export async function getPortfolioViewCount({ portfolioType = 'banquet', uid, fallback = 0 }) {
  if (!uid) return Number(fallback) || 0;
  try {
    const counterRef = await counterRefFor(portfolioType, uid);
    const snap = await get(counterRef);
    if (snap.exists()) {
      const value = Number(snap.val());
      if (Number.isFinite(value)) return value;
    }
  } catch (_) {}
  return Number(fallback) || 0;
}
