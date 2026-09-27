/*
 * One-time Firebase data-at-rest migration.
 *
 * This keeps the Firebase schema usable by the existing client while moving
 * logical record values (including UID/date fields) into AES-GCM envelopes.
 * Red-mark UID/date path names are replaced with keyed deterministic digests.
 *
 * Run only from an authenticated admin dashboard. A local completion flag
 * prevents the migration from running on every dashboard refresh.
 */
import { database } from "../firebaseconfig.js";
import { ref, get, set, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { encryptDeep, decryptDeep, stablePathKey } from "./encryption.js";

const DONE_KEY = "event_vault_encryption_migration_v2";
const PREFIX = "EV1.";

function isEncryptedEnvelope(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}

async function migrateCollection(path) {
  const rootRef = ref(database, path);
  const snap = await get(rootRef);
  if (!snap.exists()) return { path, changed: 0 };

  const raw = snap.val() || {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    if (!isEncryptedEnvelope(raw)) {
      await set(rootRef, await encryptDeep(raw));
      return { path, changed: 1 };
    }
    return { path, changed: 0 };
  }

  let changed = 0;
  for (const [key, rawValue] of Object.entries(raw)) {
    if (isEncryptedEnvelope(rawValue)) continue;
    const plain = await decryptDeep(rawValue);
    await set(ref(database, `${path}/${key}`), await encryptDeep(plain));
    changed++;
  }
  return { path, changed };
}

async function migrateRedmarks() {
  const rootPath = "/redmarkdates/unique_redmark";
  const snap = await get(ref(database, rootPath));
  if (!snap.exists()) return { owners: 0, records: 0 };

  const rawOwners = snap.val() || {};
  let owners = 0;
  let records = 0;

  for (const [oldOwnerKey, rawOwnerNode] of Object.entries(rawOwners)) {
    const ownerPlain = await decryptDeep(rawOwnerNode || {});
    if (!ownerPlain || typeof ownerPlain !== "object") continue;

    let ownerUid = "";
    // Old schema normally stores UID inside every redmark record.
    for (const rawRecord of Object.values(ownerPlain)) {
      const record = await decryptDeep(rawRecord || {});
      if (record?.UID != null) {
        ownerUid = String(record.UID);
        break;
      }
    }
    if (!ownerUid) ownerUid = String(oldOwnerKey);

    const newOwnerKey = await stablePathKey(ownerUid, "redmark-owner");
    const newOwnerPath = `${rootPath}/${newOwnerKey}`;

    for (const [oldChildKey, rawRecord] of Object.entries(ownerPlain)) {
      const record = await decryptDeep(rawRecord || {});
      if (!record || typeof record !== "object") continue;

      const redDate = String(record.reddate || record.redDate || "").trim();
      let childSource = redDate || oldChildKey;
      const parts = childSource.split("|").map((v) => String(v || "").trim());
      if (parts.length >= 2) {
        const datePart = parts[0];
        const calendarType = parts[1];
        const dm = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dm) {
          const iso = `${dm[3]}-${String(dm[2]).padStart(2, "0")}-${String(dm[1]).padStart(2, "0")}`;
          childSource = `${calendarType}|${iso}`;
        }
      }
      const newChildKey = await stablePathKey(childSource, "redmark-child");

      await set(ref(database, `${newOwnerPath}/${newChildKey}`), await encryptDeep(record));
      records++;
    }

    if (oldOwnerKey !== newOwnerKey) {
      await remove(ref(database, `${rootPath}/${oldOwnerKey}`));
    }
    owners++;
  }

  return { owners, records };
}

export async function migrateExistingDatabaseEncryption({ force = false } = {}) {
  if (!force) {
    try {
      if (localStorage.getItem(DONE_KEY) === "1") {
        return { skipped: true };
      }
    } catch (_) {}
  }

  const results = [];
  results.push(await migrateCollection("/banquet/unique_bank"));
  results.push(await migrateCollection("/hall/unique_hall"));
  results.push(await migrateCollection("/user/unique_user"));
  results.push(await migrateCollection("/data/twostepauthkey"));
  results.push(await migrateCollection("/user/currentid"));
  const redmarks = await migrateRedmarks();

  try {
    localStorage.setItem(DONE_KEY, "1");
  } catch (_) {}

  return { skipped: false, results, redmarks };
}
