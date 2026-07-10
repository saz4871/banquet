import { database } from "./firebaseconfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const toastEl = document.getElementById('toast');
const gridEl = document.getElementById('grid');
const emptyStateEl = document.getElementById('emptyState');
const countBadge = document.getElementById('countBadge');

const MAX_DAYS = 30;

let homeMode = 'banquets';
let allBanquets = [];
let allHalls = [];


function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d, 0, 0, 0, 0);
  }
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function remainingDays(startAt, now, maxDays) {
  if (!startAt) return 0;
  const diffMs = now.getTime() - startAt.getTime();
  const elapsedDays = Math.floor(diffMs / 86400000);
  return maxDays - elapsedDays;
}

function formatRs(v) {
  const s = String(v ?? '').trim();
  if (!s) return 'Rs. 0';
  return 'Rs. ' + s;
}

function pickCover(item) {
  return item.img || item.cover || (Array.isArray(item.imagesStack) ? item.imagesStack[0] : '') || '';
}

function collectTextForSearch(item) {
  const fields = [
    item.uid,
    item.title,
    item.name,
    item.tagline,
    item.tag,
    item.phone,
    item.whatsapp,
    item.vendor_user,
    item.vendor_pass,
    item.detail,
    item.specialisation,
    item.specialization,

    // Search ko card meta ke mutabiq include karo
    item.locationText,
    item.location,
    item.bankloctext,
    item.Location,

    // halls location keys
    item.hallloctext,
    item.hallLocationText,
    item.hallLocation,

    item.bankloctext,
    item.locationText,
    item.locationLink,


    // some entries might store label/city in different keys
    item.city,
    item.area,
  ];
  return fields.filter(Boolean).join(' ').toLowerCase();
}


function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

function render(list) {
  gridEl.innerHTML = '';
  emptyStateEl.style.display = list.length ? 'none' : 'block';
  countBadge.textContent = list.length;

  if (!list.length) return;

  // Low-end/smooth mode: avoid heavy GSAP per-card work on tiny devices.
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldSkipCardAnimation = reduceMotion || (typeof window.innerWidth === 'number' && window.innerWidth < 420);

  const fragment = document.createDocumentFragment();

  list.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open ${homeMode} ${item.title || item.uid}`);

    card.addEventListener('click', () => openDetails(item.uid));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openDetails(item.uid);
    });



    const cover = pickCover(item);
    // Halls ke liye UID hide karke hallname show karna hai (haha.json me hallname field hai)
    const title =
      item.title ||
      item.bankname ||
      item.name ||
      item.hallTitle ||
      item.hallName ||
      item.hallname ||
      item.uid;

    // OR details ke bajaye specialisation ko 1 per line look me dikhana hai.
    // fallback: purana tagline/detail/locationText.
    const tag =
      item.specialisation ||
      item.specialization ||
      item.tagline ||
      item.tag ||
      item.banktagline ||
      item.detail ||
      item.locationText ||
      '';

    // Starts From mapping:
    // - Banquets: seasoncost ko prefer karo (agar available ho)
    // - Halls: standardcost ko prefer karo (agar available ho)
    const priceRaw =
      homeMode === 'banquets'
        ? (item.standardrate || item.standardcost || item.seasoncost || item.seasonalPrice || item.randomPrice || '0')
        : (item.standardcost || item.seasoncost || item.seasonalPrice || item.randomPrice || '0');


    const price = formatRs(priceRaw);



    card.innerHTML = `
      <div class="img-container">
        ${cover ? `<img src="${cover}" alt="cover" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8">No Image</div>`}
        <div class="luxury-badge">Verified Luxury</div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(title)}</div>

        <div class="card-tag">
          <b>${escapeHtml(tag).slice(0, 160)}</b>
          <div class="card-meta">
            <span>Location:</span>
            ${escapeHtml(
              homeMode === 'banquets'
                ? (item.locationText || item.location || item.bankloctext || item.Location || '').trim()
                : (item.hallLocationText || item.hallloctext || item.hallLocation || item.locationText || item.location || '').trim()
            )}
          </div>


        </div>
      </div>

      <div class="card-footer">
        <div class="price">
          Standart Rate:
          <b>${escapeHtml(price.replace('Rs. ', '').trim())}</b>
          <div class="capacity">People Capacity: <b>${escapeHtml(String(item.capacity || item.Capacity || item.people_capacity || item.peopleCapacity || item.people || item.capacityText || '').trim())}</b></div>
        </div>
        <div class="arrow"><i class="fa-solid fa-arrow-right"></i></div>
      </div>

    `;

    fragment.appendChild(card);

    if (!shouldSkipCardAnimation) {
      gsap.fromTo(
        card,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7, delay: i * 0.03, ease: 'power3.out' }
      );
    } else {
      // Ensure final visible state when skipping animations.
      card.style.opacity = '1';
      card.style.transform = 'translateY(0px)';
    }
  });

  gridEl.appendChild(fragment);
}

function applySearch() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const base = homeMode === 'banquets' ? allBanquets : allHalls;

  if (!q) {
    render(base);
    return;
  }

  // Search by: title/name + other collected fields (including hall/banquet labels)
  const filtered = base.filter((it) => {
    const text = collectTextForSearch(it);
    const nameKey = homeMode === 'banquets'
      ? (it.bankname || it.hallName || it.title || it.name || it.banktagline || it.bankloclink)
      : (it.hallname || it.hallName || it.title || it.bankname || it.name || it.hallTitle);

    const nameText = String(nameKey ?? '').toLowerCase().trim();
    return text.includes(q) || nameText.includes(q);
  });

  render(filtered);
}


window.setHomeMode = function (mode) {
  homeMode = mode;
  document.getElementById('navBanquets').classList.toggle('active', mode === 'banquets');
  document.getElementById('navHalls').classList.toggle('active', mode === 'halls');
  document.getElementById('sectionTitle').innerHTML =
    mode === 'banquets'
      ? '&nbsp;&nbsp;Available <span>Luxury Spaces</span>'
      : '&nbsp;&nbsp;Available <span>Luxury Halls</span>&nbsp;';

  applySearch();

  gsap.fromTo('#sectionTitle', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
};

function openDetails(uid) {
  if (homeMode === 'banquets') {
    // selected banquet uid store + redirect to portfolio.html
    try { localStorage.setItem('selectedPortfolioType', 'banquet'); } catch (e) {}
    localStorage.setItem('selectedBanquetUid', uid);
    window.location.href = 'portfolio.html';
  } else {
    // halls -> same portfolio UI, but load hall record
    try { localStorage.setItem('selectedPortfolioType', 'hall'); } catch (e) {}
    localStorage.setItem('selectedHallUid', uid);
    // keep backward-compat if you already used hallId somewhere
    try { localStorage.setItem('hallId', uid); } catch (e) {}
    window.location.href = 'portfolio.html';
  }
}


async function loadData(path) {
  const snapshot = await get(ref(database, path));
  const data = snapshot.val() || {};
  const list = [];
  const now = new Date();

  for (const k of Object.keys(data)) {
    const it = data[k] || {};
    if (remainingDays(normalizeDate(it.startdate || it.startDate), now, MAX_DAYS) > 0) {
      list.push({ ...it, uid: it.UID ?? k });
    }
  }
  return list;
}

function setupPremiumAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.fromTo('.hero-content', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.85 }, 0);
  tl.fromTo('.home-navbar', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, 0.08);
  tl.fromTo('.search-container', { opacity: 0, y: 10, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, 0.12);
}


const loadingOverlayEl = document.getElementById('loadingOverlay');

function showLoadingOverlay() {
  if (!loadingOverlayEl) return;
  loadingOverlayEl.classList.remove('hidden');
}

function hideLoadingOverlay() {
  if (!loadingOverlayEl) return;
  loadingOverlayEl.classList.add('hidden');
}

// Initial Loading
(async () => {
  setupPremiumAnimations();

  showLoadingOverlay();


  try {
    allBanquets = await loadData('banquet/unique_bank');
    allHalls = await loadData('hall/unique_hall');
  } finally {
    hideLoadingOverlay();
  }

  window.setHomeMode('banquets');

  const searchInput = document.getElementById('searchInput');

  // Smoothness on scroll: debounce search re-renders (prevents jank while scrolling/typing on low-end).
  let searchT = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchT);
    searchT = setTimeout(() => applySearch(), 80);
  });



  searchInput.addEventListener('focus', () => {
    gsap.to('.search-container', {
      boxShadow: '0 18px 60px rgba(0,0,0,.55), 0 0 0 3px rgba(255,105,180,.18)',
      duration: 0.35,
    });
  });
  searchInput.addEventListener('blur', () => {
    gsap.to('.search-container', { boxShadow: '0 12px 30px rgba(0,0,0,.35)', duration: 0.35 });
  });
  searchInput.addEventListener('focus', () => {
    gsap.to('.search-container', {
      boxShadow: '0 18px 60px rgba(0,0,0,.55), 0 0 0 3px rgba(255,105,180,.18)',
      duration: 0.35,
    });
  });
  searchInput.addEventListener('blur', () => {
    gsap.to('.search-container', { boxShadow: '0 12px 30px rgba(0,0,0,.35)', duration: 0.35 });
  });
})();

// Right Click Disable
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

// Keyboard Shortcuts Disable
document.addEventListener("keydown", (e) => {

    // F12
    if (e.key === "F12") {
        e.preventDefault();
    }

    // Ctrl + Shift + I / J / C
    if (
        e.ctrlKey &&
        e.shiftKey &&
        ["I", "J", "C"].includes(e.key.toUpperCase())
    ) {
        e.preventDefault();
    }

    // Ctrl + U (View Source)
    if (e.ctrlKey && e.key.toUpperCase() === "U") {
        e.preventDefault();
    }

    // Ctrl + S (Optional)
    if (e.ctrlKey && e.key.toUpperCase() === "S") {
        e.preventDefault();
    }

    // Ctrl + P (Optional)
    if (e.ctrlKey && e.key.toUpperCase() === "P") {
        e.preventDefault();
    }
});