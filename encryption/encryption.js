/*
 * Event Vault data-at-rest encryption helper.
 *
 * Cipher: AES-256-GCM
 * KDF: PBKDF2-SHA-256 with 310,000 iterations
 * Every encrypted value gets a fresh random salt + IV.
 * Envelope format: EV1.<base64url(salt)>.<base64url(iv)>.<base64url(ciphertext)>
 *
 * IMPORTANT SECURITY NOTE:
 * A browser cannot keep a decryption secret hidden from a determined user who
 * controls the browser. For truly secret data, keep the master secret on a
 * trusted backend/Cloud Function and only return authorised plaintext to the UI.
 * This module is still useful for client-side data-at-rest encryption and for
 * protecting Firebase dumps/backups when the runtime secret is supplied securely.
 */

const PREFIX = "EV1";
const ITERATIONS = 310000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const keyCache = new Map();
const MAX_KEY_CACHE = 64;

function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromB64url(value) {
  const padded = String(value).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(value).length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
function getSecret() {
  // Browser-only deployment fallback. This keeps the module plug-and-play.
  // IMPORTANT: a value shipped to the browser is not a true server secret.
  // For production-grade secrecy, define __EVENT_VAULT_ENCRYPTION_SECRET__
  // from a trusted backend/session before this module is used.
  const runtimeSecret = globalThis.__EVENT_VAULT_ENCRYPTION_SECRET__;
  if (typeof runtimeSecret === "string" && runtimeSecret.length >= 32) return runtimeSecret;

  // High-entropy application key split into chunks so it is not stored as a
  // plain readable phrase. This is obfuscation, not a substitute for a backend secret.
  const chunks = [
    "q7N4xV2pL9sK6mR3", "8dF1wZ5tH0cB7yJ2",
    "uP6aE9nQ4rT8vM1x", "C3kG5sW7bD2fL0hA"
  ];
  return chunks.join("");
}
async function deriveKey(secret, salt) {
  const cacheKey = `${secret.length}:${b64url(salt)}`;
  const cached = keyCache.get(cacheKey);
  if (cached) return cached;
  const base = await crypto.subtle.importKey("raw", textEncoder.encode(secret), "PBKDF2", false, ["deriveKey"]);
  const promise = crypto.subtle.deriveKey(
    {name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},
    base,
    {name:"AES-GCM",length:KEY_BYTES*8},
    false,
    ["encrypt","decrypt"]
  );
  keyCache.set(cacheKey, promise);
  if (keyCache.size > MAX_KEY_CACHE) keyCache.delete(keyCache.keys().next().value);
  return promise;
}
export async function encryptString(value) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(getSecret(), salt);
  const plaintext = textEncoder.encode(String(value));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,tagLength:128}, key, plaintext));
  return `${PREFIX}.${b64url(salt)}.${b64url(iv)}.${b64url(ciphertext)}`;
}
export async function decryptString(value) {
  if (typeof value !== "string" || !value.startsWith(`${PREFIX}.`)) return value;
  const parts = value.split(".");
  if (parts.length !== 4) throw new Error("Invalid encrypted value.");
  const key = await deriveKey(getSecret(), fromB64url(parts[1]));
  const plain = await crypto.subtle.decrypt({name:"AES-GCM",iv:fromB64url(parts[2]),tagLength:128}, key, fromB64url(parts[3]));
  return textDecoder.decode(plain);
}
export async function encryptValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return await encryptString(JSON.stringify(value));
  }
  return await encryptString(JSON.stringify(value));
}
export async function decryptValue(value) {
  if (typeof value !== "string" || !value.startsWith(`${PREFIX}.`)) return value;
  const decoded = await decryptString(value);
  try { return JSON.parse(decoded); } catch { return decoded; }
}
export async function encryptDeep(value) {
  // Encrypt each logical record as ONE AES-GCM envelope. This is much faster
  // than deriving a PBKDF2 key separately for every field, while still
  // protecting the entire object (including nested values) before storage.
  if (value && typeof value === "object") {
    return encryptString(JSON.stringify(value));
  }
  return encryptValue(value);
}

export async function decryptDeep(value) {
  // New records are stored as one encrypted string.
  if (typeof value === "string" && value.startsWith(`${PREFIX}.`)) {
    return decryptValue(value);
  }

  // Backward compatibility: older records may contain individually encrypted
  // fields or plain legacy data. Decode those recursively without breaking them.
  if (Array.isArray(value)) return Promise.all(value.map(decryptDeep));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = await decryptDeep(item);
    return out;
  }
  return value;
}
export async function secureSet(firebaseSet, dbRef, value) {
  return firebaseSet(dbRef, await encryptDeep(value));
}
export async function secureUpdate(firebaseUpdate, dbRef, value) {
  return firebaseUpdate(dbRef, await encryptDeep(value));
}
