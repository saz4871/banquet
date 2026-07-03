import { database } from "./firebaseconfig.js";
import { get, ref } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const form = document.getElementById("verifyForm");
const keyInput = document.getElementById("twoStepKey");
const messageEl = document.getElementById("message");
const verifyBtn = document.getElementById("verifyBtn");

// If this script is loaded on a page that doesn't have the login UI, do nothing.
if (!form || !keyInput || !messageEl || !verifyBtn) {
  // Important: allow script to be imported anywhere without breaking the page.
  // eslint-disable-next-line no-console
  // console.debug("admin_login.js: login UI elements not found, skipping");
} else {
  function setMessage(text, type) {
  messageEl.textContent = text || "";
  messageEl.classList.remove("error", "success");
  if (type) messageEl.classList.add(type);
}


function isNumericKey(s) {
  return /^[0-9]+$/.test(String(s).trim());
}

async function readExpectedKey() {
  // Path as per request: /banquet/twostepauthkey
  const snap = await get(ref(database, "banquet/twostepauthkey"));
  return snap.exists() ? String(snap.val()).trim() : null;
}

// GSAP premium animations (rose-gold + petals)
function initIntroAnimations() {
  const card = document.querySelector(".card");
  const title = document.querySelector(".title");
  const formEl = document.querySelector(".form");
  const hint = document.querySelector(".hint");

  if (!window.gsap || !card) return;

  gsap.fromTo(
    card,
    { y: 22, opacity: 0, scale: 0.98 },
    { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }
  );

  if (title) {
    gsap.fromTo(
      title,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.1, ease: "power2.out" }
    );
  }
  if (formEl) {
    gsap.fromTo(
      formEl,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.7, delay: 0.12, ease: "power2.out" }
    );
  }
  if (hint) {
    gsap.fromTo(
      hint,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 0.18, ease: "power2.out" }
    );
  }
}

function startPetals() {
  if (!window.gsap) return;

  const host = document.createElement("div");
  host.className = "petals";
  document.body.appendChild(host);

  const colors = ["#fb7185", "#f973a9", "#d946ef"];
  const count = 18;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "petal";
    const left = Math.random() * 100;
    const size = 10 + Math.random() * 10;
    const duration = 4 + Math.random() * 4;
    const delay = Math.random() * 1.5;
    const hue = colors[Math.floor(Math.random() * colors.length)];

    p.style.left = left + "%";
    p.style.width = size + "px";
    p.style.height = size * 0.7 + "px";
    p.style.background = `radial-gradient(circle at 30% 30%, rgba(255, 225, 235, 0.95), ${hue})`;
    host.appendChild(p);

    const sway = Math.random() * 140 - 70;
    gsap.fromTo(
      p,
      { y: -30, opacity: 0, x: 0, rotate: 20 },
      {
        y: window.innerHeight + 40,
        x: sway,
        rotate: 280,
        opacity: 1,
        duration,
        delay,
        ease: "none",
        repeat: -1,
        repeatDelay: 0.5,
      }
    );
  }
}

initIntroAnimations();
startPetals();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const enteredKey = String(keyInput.value || "").trim();

  if (!enteredKey) {
    setMessage("Key required.", "error");
    keyInput.focus();
    return;
  }

  if (!isNumericKey(enteredKey)) {
    setMessage("Invalid key format.", "error");
    keyInput.focus();
    return;
  }

  try {
    verifyBtn.disabled = true;
    setMessage("Verifying...", "");

    const expectedKey = await readExpectedKey();

    if (!expectedKey) {
      setMessage("Auth key not found in Firebase.", "error");
      return;
    }

    // Compare browser localStorage pass value with Firebase key.
    // NOTE: Replace localStorage key name here if your code uses a different one.
    const localPass = String(
      window.localStorage.getItem("twostepauthkey_pass") || ""
    ).trim();

    const localOk = localPass === expectedKey;
    const enteredOk = enteredKey === expectedKey;

    if (enteredOk) {
      // Update localStorage pass after successful entered-key validation,
      // then require it to match Firebase key.
      window.localStorage.setItem("twostepauthkey_pass", expectedKey);
    }

    if (enteredOk && localOk) {
      setMessage("Verified successfully!", "success");
      window.localStorage.setItem("admin_verified", "true");
      window.location.href = "./admin_dashboard.html";
    } else {
      // Ensure stale/previous auth flag doesn't remain after failed login attempts.
      try {
        window.localStorage.removeItem("admin_verified");
      } catch (e) {}

      if (!enteredOk) {
        setMessage("Incorrect key.", "error");
      } else {
        setMessage(
          "Local auth pass does not match. Please re-verify.",
          "error"
        );
      }
    }

  } catch (err) {
    console.error(err);
    setMessage("Verification failed. Check Firebase connection/permissions.", "error");
  } finally {
    verifyBtn.disabled = false;
  }
});
}


