import { database } from "./firebaseconfig.js";
import { decryptDeep } from "./encryption/encryption.js";
import { get, ref } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const form = document.getElementById("verifyForm");
const keyInput = document.getElementById("twoStepKey");
const messageEl = document.getElementById("message");
const verifyBtn = document.getElementById("verifyBtn");
const togglePass = document.getElementById("togglePass");

function setMessage(text = "", type = "") {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`.trim();
}

function setBusy(busy) {
  verifyBtn.disabled = busy;
  verifyBtn.classList.toggle("is-loading", busy);
}


async function hashKey(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

function isNumericKey(value) {
  return /^\d+$/.test(String(value).trim());
}

async function readExpectedKey() {
  const snap = await get(ref(database, "banquet/twostepauthkey"));
  if (!snap.exists()) return null;
  const raw = snap.val();
  const decoded = await decryptDeep(raw);
  return decoded === null || decoded === undefined ? null : String(decoded).trim();
}

// Prevents the previous "first correct attempt gets rejected" bug.
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form || !keyInput || !verifyBtn) return;

  const enteredKey = String(keyInput.value || "").trim();
  if (!enteredKey) {
    setMessage("Authentication key is required.", "error");
    keyInput.focus();
    return;
  }
  if (!isNumericKey(enteredKey)) {
    setMessage("Use numbers only for the authentication key.", "error");
    keyInput.focus();
    return;
  }

  setBusy(true);
  setMessage("Verifying secure access…");

  try {
    const expectedKey = await readExpectedKey();
    if (!expectedKey) throw new Error("AUTH_KEY_MISSING");

    if (enteredKey !== expectedKey) {
      try { localStorage.removeItem("admin_verified"); } catch (_) {}
      setMessage("Incorrect authentication key.", "error");
      keyInput.select();
      return;
    }

    sessionStorage.setItem("admin_verified", "true");
    // Keep compatibility with the existing dashboard guard.
    localStorage.setItem("admin_verified", "true");
    localStorage.setItem("twostepauthkey_hash", await hashKey(expectedKey));

    setMessage("Access verified. Opening dashboard…", "success");
    setTimeout(() => { window.location.replace("./admin_dashboard.html"); }, 220);
  } catch (error) {
    console.error(error);
    setMessage(error?.message === "AUTH_KEY_MISSING"
      ? "Authentication service is not configured."
      : "Could not verify access. Check your Firebase connection.", "error");
  } finally {
    setBusy(false);
  }
});

togglePass?.addEventListener("click", () => {
  const showing = keyInput.type === "text";
  keyInput.type = showing ? "password" : "text";
  togglePass.innerHTML = `<i class="fa-regular fa-eye${showing ? "" : "-slash"}"></i>`;
  togglePass.setAttribute("aria-label", showing ? "Show authentication key" : "Hide authentication key");
});

keyInput?.addEventListener("input", () => {
  if (messageEl.textContent) setMessage("");
});
