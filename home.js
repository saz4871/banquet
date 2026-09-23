import { database } from "./firebaseconfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { decryptDeep } from "./encryption/encryption.js";

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
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

gridEl.addEventListener('click', (event) => {
  const card = event.target.closest('.card[data-uid]');
  if (card) openDetails(card.dataset.uid);
});

gridEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.card[data-uid]');
  if (!card) return;
  event.preventDefault();
  openDetails(card.dataset.uid);
});

function render(list) {
  gridEl.replaceChildren();
  emptyStateEl.style.display = list.length ? 'none' : 'block';
  countBadge.textContent = list.length;
  if (!list.length) return;

  const fragment = document.createDocumentFragment();
  list.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card card--ready';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open ${homeMode} ${item.title || item.uid}`);
    card.dataset.uid = item.uid;

    const title = item.title || item.bankname || item.name || item.hallTitle || item.hallName || item.hallname || item.uid;
    const location = homeMode === 'banquets'
      ? (item.locationText || item.location || item.bankloctext || item.Location || '')
      : (item.hallLocationText || item.hallloctext || item.hallLocation || item.locationText || item.location || '');
    const priceRaw = homeMode === 'banquets'
      ? (item.standardrate || item.standardcost || item.seasoncost || item.seasonalPrice || item.randomPrice || '0')
      : (item.standardcost || item.seasoncost || item.seasonalPrice || item.randomPrice || '0');
    const capacity = item.capacity || item.Capacity || item.people_capacity || item.peopleCapacity || item.people || item.capacityText || '—';
    const cover = pickCover(item);

    card.innerHTML = `
      <div class="img-container">
        ${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">` : `<div class="no-image"><i class="fa-regular fa-image"></i><span>Venue image unavailable</span></div>`}
        <div class="luxury-badge"><i class="fa-solid fa-gem"></i> Premium Venue</div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(title)}</h3>
        <div class="card-location"><i class="fa-solid fa-location-dot"></i><span>${escapeHtml(String(location).trim() || 'Location available on details')}</span></div>
        <div class="card-stats">
          <div class="stat"><span>Standard Rate</span><strong>${escapeHtml(formatRs(priceRaw))}</strong></div>
          <div class="stat"><span>Capacity</span><strong>${escapeHtml(String(capacity).trim())} <small>people</small></strong></div>
        </div>
      </div>
      <div class="card-cta"><span>Explore venue</span><i class="fa-solid fa-arrow-right"></i></div>
    `;
    fragment.appendChild(card);
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

  document.getElementById('sectionTitle').classList.remove('section-title-refresh');
  void document.getElementById('sectionTitle').offsetWidth;
  document.getElementById('sectionTitle').classList.add('section-title-refresh');
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
  const data = await decryptDeep(snapshot.val() || {});
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
  showLoadingOverlay();
  document.body.classList.add('is-loading');


  try {
    [allBanquets, allHalls] = await Promise.all([
      loadData('banquet/unique_bank'),
      loadData('hall/unique_hall')
    ]);
  } finally {
    hideLoadingOverlay();
    document.body.classList.remove('is-loading');
  }

  window.setHomeMode('banquets');

  const searchInput = document.getElementById('searchInput');

  // Smoothness on scroll: debounce search re-renders (prevents jank while scrolling/typing on low-end).
  let searchT = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchT);
    searchT = setTimeout(() => applySearch(), 80);
  });



})();

