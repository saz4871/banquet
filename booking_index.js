/*
 * Scalable booking availability index.
 *
 * A booking slot is stored at:
 *   /9/11/_availability/<HMAC venue>/<YYYY-MM-DD>/<Morning|Evening|Night>
 *
 * Value: 1 = pending, 2 = approved.
 *
 * The exact slot node is also the concurrency lock. A Firebase transaction
 * makes two simultaneous booking requests for the same venue/date/time race
 * safely: only one can create the slot.
 *
 * The venue key is deterministic/HMACed, so venue IDs are not exposed as
 * structural Firebase path names. Dates/times are intentionally readable
 * inside the already-protected venue bucket because the index is designed to
 * be tiny and query-free.
 */
import { database } from './firebaseconfig.js';
import { stablePathKey } from './encryption/encryption.js';
import {
  get,
  ref,
  runTransaction,
  set,
  remove,
  update,
  onValue,
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const INDEX_ROOT_PATH = '9/11/_availability';
const VENUE_NAMESPACE = 'booking-availability-v2-venue';
const MIGRATION_MARKER_VALUE = 'v2';

function normalizeDate(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

function normalizeTime(raw) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === 'morning') return 'Morning';
  if (value === 'evening') return 'Evening';
  if (value === 'night') return 'Night';
  return '';
}

async function rootKey() {
  // Keep the index under the existing /9/11 permission boundary so no new
  // Firebase top-level security rule is required by this optimization.
  return INDEX_ROOT_PATH;
}

export async function bookingVenueKey(venueId) {
  return stablePathKey(String(venueId ?? ''), VENUE_NAMESPACE);
}

export async function bookingVenuePath(venueId) {
  const [root, venue] = await Promise.all([rootKey(), bookingVenueKey(venueId)]);
  return `${root}/${venue}`;
}

export async function bookingSlotPath(venueId, targetDate, eventTime) {
  const date = normalizeDate(targetDate);
  const time = normalizeTime(eventTime);
  if (!venueId || !date || !time) throw new Error('Invalid booking slot.');
  return `${await bookingVenuePath(venueId)}/${date}/${time}`;
}

/**
 * Atomically claims a slot for a new pending booking.
 * Returns { claimed: true } only when this request created the slot.
 */
export async function nextBookingUid(limit = 999999) {
  const max = Math.max(9999, Number(limit) || 999999);
  const result = await runTransaction(ref(database, '9/10'), current => {
    const n = Number(current) || 0;
    return n >= max ? 1 : n + 1;
  });
  if (!result.committed) throw new Error('Could not reserve booking UID.');
  const n = Number(result.snapshot?.val()) || 1;
  return String(n).padStart(4, '0');
}

export async function claimBookingSlot({ venueId, targetDate, eventTime }) {
  const path = await bookingSlotPath(venueId, targetDate, eventTime);
  const result = await runTransaction(ref(database, path), current => {
    // 1 = customer pending, 2 = approved booking, 3 = vendor block.
    // All states share one transaction slot, preventing same-second races.
    if (current === null || current === undefined) return 1;
    return undefined;
  });
  return { claimed: !!result.committed, path, reason: result.committed ? 'claimed' : 'already_reserved' };
}

export async function claimVendorBlockSlot({ venueId, targetDate, eventTime }) {
  const path = await bookingSlotPath(venueId, targetDate, eventTime);
  const result = await runTransaction(ref(database, path), current => {
    // A pending/approved customer booking wins the race.
    if (current === null || current === undefined) return 3;
    return undefined;
  });
  return { claimed: !!result.committed, path, reason: result.committed ? 'blocked' : 'already_reserved' };
}

export async function releaseVendorBlockSlot({ venueId, targetDate, eventTime }) {
  const path = await bookingSlotPath(venueId, targetDate, eventTime);
  const result = await runTransaction(ref(database, path), current => {
    // Never remove a customer booking.
    return Number(current) === 3 ? null : undefined;
  });
  return !!result.committed;
}

export async function setBookingSlotApproved({ venueId, targetDate, eventTime }) {
  const path = await bookingSlotPath(venueId, targetDate, eventTime);
  await set(ref(database, path), 2);
  return path;
}

export async function releaseBookingSlot({ venueId, targetDate, eventTime }) {
  const path = await bookingSlotPath(venueId, targetDate, eventTime);
  const result = await runTransaction(ref(database, path), current => {
    return Number(current) === 1 ? null : undefined;
  });
  return !!result.committed;
}

export async function getBookingAvailability(venueId) {
  if (!venueId) return {};
  const path = await bookingVenuePath(venueId);
  const snap = await get(ref(database, path));
  return snap.exists() ? (snap.val() || {}) : {};
}

export async function subscribeBookingAvailability(venueId, callback) {
  if (!venueId || typeof callback !== 'function') return () => {};
  const path = await bookingVenuePath(venueId);
  return onValue(ref(database, path), snap => {
    callback(snap.exists() ? (snap.val() || {}) : {});
  }, error => {
    console.warn('[booking-index] realtime availability failed:', error);
    callback({});
  });
}

/**
 * One-time migration of existing encrypted /9/11 bookings into the compact
 * per-venue availability index. The admin dashboard calls this in background.
 * New bookings/status changes maintain the index incrementally afterwards.
 */
export async function migrateBookingAvailabilityIndex() {
  const root = await rootKey();
  const markerPath = `${root}/_meta/migration`;
  const markerSnap = await get(ref(database, markerPath));
  if (markerSnap.exists() && String(markerSnap.val()) === MIGRATION_MARKER_VALUE) {
    return { migrated: false, skipped: true, count: 0 };
  }

  const bookingSnap = await get(ref(database, '9/11'));
  const raw = bookingSnap.exists() ? (bookingSnap.val() || {}) : {};
  const { decryptDeep } = await import('./encryption/encryption.js');
  const all = await decryptDeep(raw);
  const updates = {};
  let count = 0;

  for (const record of Object.values(all || {})) {
    if (!record || typeof record !== 'object') continue;
    const venueId = record.venueId ?? record.venueID ?? record.selectedAssetUid ?? record.assetUid;
    const date = normalizeDate(record.targetdate ?? record.targetDate ?? record.date);
    const time = normalizeTime(record.event_time ?? record.eventTime);
    if (!venueId || !date || !time) continue;

    const status = String(record.status ?? record.bookingStatus ?? '').trim().toLowerCase();
    if (status.includes('deny') || status.includes('reject') || status === 'cancelled' || status === 'canceled') continue;
    const value = (status.includes('approved')) ? 2 : 1;
    const venue = await bookingVenueKey(venueId);
    updates[`${venue}/${date}/${time}`] = value;
    count++;
  }

  if (Object.keys(updates).length) {
    await update(ref(database, root), updates);
  }
  await set(ref(database, markerPath), MIGRATION_MARKER_VALUE);
  return { migrated: true, skipped: false, count };
}



/**
 * Permanently removes every booking/index record belonging to a venue.
 * This is intentionally a server-like admin action: it scans /9/11 once,
 * identifies records by venue UID, removes those booking children, and also
 * removes the compact availability bucket for the venue.
 */
export async function deleteVenueBookingData(venueId) {
  if (!venueId) return { removedBookings: 0, removedAvailability: false };
  const { decryptDeep } = await import('./encryption/encryption.js');
  const bookingSnap = await get(ref(database, '9/11'));
  const raw = bookingSnap.exists() ? (bookingSnap.val() || {}) : {};
  const all = await decryptDeep(raw);
  const removals = {};
  let removedBookings = 0;

  for (const [bookingKey, record] of Object.entries(all || {})) {
    if (!record || typeof record !== 'object') continue;
    const recordVenueId = record.venueId ?? record.venueID ?? record.selectedAssetUid ?? record.assetUid;
    if (String(recordVenueId ?? '') === String(venueId)) {
      removals[bookingKey] = null;
      removedBookings++;
    }
  }

  if (Object.keys(removals).length) {
    await update(ref(database, '9/11'), removals);
  }

  const venueKey = await bookingVenueKey(venueId);
  await remove(ref(database, `${INDEX_ROOT_PATH}/${venueKey}`));
  return { removedBookings, removedAvailability: true };
}

export function bookingStatusValue(status) {
  const s = String(status ?? '').trim().toLowerCase();
  if (s.includes('approved')) return 2;
  if (s.includes('deny') || s.includes('reject') || s === 'cancelled' || s === 'canceled') return 0;
  return 1;
}
