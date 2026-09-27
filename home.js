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
  const card = event.target.closest('.venue-tile[data-uid]');
  if (card) openDetails(card.dataset.uid);
});

gridEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.venue-tile[data-uid]');
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
  list.forEach((item, index) => {
    const tile = document.createElement('article');
    tile.className = 'venue-tile';
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    const title = item.title || item.bankname || item.name || item.hallTitle || item.hallName || item.hallname || item.uid;
    tile.setAttribute('aria-label', `Open ${homeMode} ${title}`);
    tile.dataset.uid = item.uid;

    const location = homeMode === 'banquets'
      ? (item.locationText || item.location || item.bankloctext || item.Location || '')
      : (item.hallLocationText || item.hallloctext || item.hallLocation || item.locationText || item.location || '');
    const priceRaw = homeMode === 'banquets'
      ? (item.standardrate || item.standardcost || item.seasoncost || item.seasonalPrice || item.randomPrice || '0')
      : (item.standardcost || item.seasoncost || item.seasonalPrice || item.randomPrice || '0');
    const capacity = item.capacity || item.Capacity || item.people_capacity || item.peopleCapacity || item.people || item.capacityText || '—';
    const cover = pickCover(item);

    tile.innerHTML = `
      <div class="venue-tile__media">
        ${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" loading="${index < 3 ? 'eager' : 'lazy'}" fetchpriority="${index < 3 ? 'high' : 'auto'}" decoding="async">` : `<div class="venue-tile__no-image"><i class="fa-regular fa-image"></i></div>`}
        <div class="venue-tile__shade"></div>
        <div class="venue-tile__index">${String(index + 1).padStart(2, '0')}</div>
        <div class="venue-tile__type"><i class="fa-solid ${homeMode === 'banquets' ? 'fa-champagne-glasses' : 'fa-building-columns'}"></i>${homeMode === 'banquets' ? 'BANQUET' : 'HALL'}</div>
      </div>
      <div class="venue-tile__content">
        <div class="venue-tile__eyebrow">PRIVATE VENUE</div>
        <h3>${escapeHtml(title)}</h3>
        <div class="venue-tile__location"><i class="fa-solid fa-location-dot"></i><span>${escapeHtml(String(location).trim() || 'Location available on details')}</span></div>
        <div class="venue-tile__meta">
          <span><small>FROM</small><b>${escapeHtml(formatRs(priceRaw))}</b></span>
          <span><small>CAPACITY</small><b>${escapeHtml(String(capacity).trim())} <em>people</em></b></span>
        </div>
        <div class="venue-tile__action"><span>View portfolio</span><i class="fa-solid fa-arrow-up-right-from-square"></i></div>
      </div>
    `;
    fragment.appendChild(tile);
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
  const banquetTab = document.getElementById('navBanquets');
  const hallTab = document.getElementById('navHalls');
  banquetTab.classList.toggle('active', mode === 'banquets');
  hallTab.classList.toggle('active', mode === 'halls');
  banquetTab.setAttribute('aria-selected', String(mode === 'banquets'));
  hallTab.setAttribute('aria-selected', String(mode === 'halls'));
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


async function fetchFreshData(path) {
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
  if (path === 'banquet/unique_bank') allBanquets = list;
  if (path === 'hall/unique_hall') allHalls = list;
  if (document.readyState !== 'loading' && (path === 'banquet/unique_bank' || path === 'hall/unique_hall')) {
    try { applySearch(); } catch (_) {}
  }
  return list;
}

async function loadData(path) {
  return fetchFreshData(path);
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

