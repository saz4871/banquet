// portfolio.js
// Browser-side only.

import { database } from "./firebaseconfig.js";
import { decryptDeep, encryptDeep, stablePathKey } from "./encryption/encryption.js";
import { recordPortfolioView } from "./view_tracker.js";
import { ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Calendar data is loaded from a tiny per-venue availability index instead of
// downloading/decrypting the entire /9/11 booking collection for every visitor.
// The same slot node is transaction-protected, so it also prevents double booking.
import { getBookingAvailability, subscribeBookingAvailability, claimBookingSlot, releaseBookingSlot, nextBookingUid } from "./booking_index.js";

let calendarDataCache = null;
let calendarDataCacheKey = '';
let calendarDataRefreshPromise = null;
let calendarRealtimeUnsubs = [];
let calendarRealtimeKey = '';

function normalizeCalendarIso(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : value;
}

function emptyCalendarData() {
  return {
    bookedByTime: { Morning: new Set(), Evening: new Set(), Night: new Set() },
    approvedByTime: { Morning: new Set(), Evening: new Set(), Night: new Set() },
    redByTime: { Morning: new Set(), Evening: new Set(), Night: new Set() }
  };
}

async function buildCalendarDataFromSnapshots(availabilityValue, redValue) {
  const data = emptyCalendarData();

  // Compact index shape:
  // { "2026-10-04": { Morning: 1, Evening: 2 } }
  // 1 = pending, 2 = approved.
  for (const [dateKey, slots] of Object.entries(availabilityValue || {})) {
    if (!slots || typeof slots !== 'object') continue;
    const date = normalizeCalendarIso(dateKey);
    if (!date) continue;
    for (const [timeKey, state] of Object.entries(slots)) {
      const bucket = Object.keys(data.bookedByTime).find(x => x.toLowerCase() === String(timeKey).toLowerCase());
      if (!bucket) continue;
      if (Number(state) === 2) data.approvedByTime[bucket].add(date);
      else if (Number(state) === 1) data.bookedByTime[bucket].add(date);
    }
  }

  const redData = redValue ? (await decryptDeep(redValue || {})) : {};
  Object.values(redData || {}).forEach(v => {
    if (!v?.reddate) return;
    const parts = String(v.reddate).split('|');
    const date = normalizeCalendarIso(parts[0]);
    const time = String(parts[1] || '').trim();
    const bucket = Object.keys(data.redByTime).find(x => x.toLowerCase() === time.toLowerCase());
    if (date && bucket) data.redByTime[bucket].add(date);
  });

  return data;
}

function renderVisibleCalendarImmediately() {
  const active = localStorage.getItem('eventTime') || localStorage.getItem('selectedEventTime') || 'Morning';
  renderCalendarFor(active).catch(() => {});
}

async function attachCalendarRealtimeListeners(uid) {
  const portfolioType = getSavedPortfolioType();
  const listenerKey = `${portfolioType}:${uid || ''}`;
  if (!uid || calendarRealtimeKey === listenerKey && calendarRealtimeUnsubs.length) return;

  calendarRealtimeUnsubs.forEach(fn => { try { fn(); } catch (_) {} });
  calendarRealtimeUnsubs = [];
  calendarRealtimeKey = listenerKey;

  const redKey = await stablePathKey(uid, 'redmark-owner');
  const redRef = ref(database, `/7/8/${redKey}`);

  let latestAvailability = {};
  let latestRed = null;
  let availabilityReady = false;
  let redReady = false;
  const flush = async () => {
    if (!availabilityReady || !redReady) return;
    try {
      calendarDataCache = await buildCalendarDataFromSnapshots(latestAvailability, latestRed);
      calendarDataCacheKey = listenerKey;
      renderVisibleCalendarImmediately();
    } catch (error) {
      console.warn('Live calendar sync failed:', error);
    }
  };

  calendarRealtimeUnsubs.push(await subscribeBookingAvailability(uid, value => {
    latestAvailability = value || {};
    availabilityReady = true;
    void flush();
  }));

  calendarRealtimeUnsubs.push(onValue(redRef, snap => {
    latestRed = snap.exists() ? snap.val() : {};
    redReady = true;
    void flush();
  }, err => console.warn('Calendar red-date realtime error:', err)));
}

async function loadCalendarData(force = false) {
  const portfolioType = getSavedPortfolioType();
  const uid = portfolioType === 'hall' ? getSavedHallUid() : getSavedBanquetUid();
  const cacheKey = `${portfolioType}:${uid || ''}`;
  if (!uid) return emptyCalendarData();
  if (!force && calendarDataCache && calendarDataCacheKey === cacheKey) return calendarDataCache;
  if (!force && calendarDataRefreshPromise && calendarDataCacheKey === cacheKey) return calendarDataRefreshPromise;

  calendarDataCacheKey = cacheKey;
  calendarDataRefreshPromise = (async () => {
    const [availabilityValue, redSnap] = await Promise.all([
      getBookingAvailability(uid),
      stablePathKey(uid, 'redmark-owner').then(key => get(ref(database, `/7/8/${key}`)))
    ]);

    calendarDataCache = await buildCalendarDataFromSnapshots(
      availabilityValue || {},
      redSnap.exists() ? redSnap.val() : {}
    );

    await attachCalendarRealtimeListeners(uid);
    return calendarDataCache;
  })().finally(() => { calendarDataRefreshPromise = null; });

  return calendarDataRefreshPromise;
}

function getSavedBanquetUid() {
  try {
    return localStorage.getItem('selectedBanquetUid');
  } catch (e) {
    return null;
  }
}

function getSavedHallUid() {
  try {
    return localStorage.getItem('selectedHallUid');
  } catch (e) {
    return null;
  }
}

function getSavedPortfolioType() {
  try {
    return localStorage.getItem('selectedPortfolioType') || 'banquet';
  } catch (e) {
    return 'banquet';
  }
}


function getHashVenueUid() {
  try {
    const hash = String(window.location.hash || '').replace(/^#/, '').trim();
    return hash ? decodeURIComponent(hash) : '';
  } catch (_) {
    return '';
  }
}

async function resolveVenueFromUrlHash() {
  const hashUid = getHashVenueUid();
  if (!hashUid) return null;

  // The public URL intentionally contains only the unique ID. Resolve whether
  // it belongs to a banquet or hall without exposing the database structure in the URL.
  const preferredType = getSavedPortfolioType();
  const order = preferredType === 'hall' ? ['hall', 'banquet'] : ['banquet', 'hall'];
  for (const type of order) {
    try {
      const record = await fetchVenueByUid(type, hashUid);
      if (record) {
        try {
          localStorage.setItem('selectedPortfolioType', type);
          if (type === 'hall') {
            localStorage.setItem('selectedHallUid', hashUid);
            localStorage.setItem('hallId', hashUid);
          } else {
            localStorage.setItem('selectedBanquetUid', hashUid);
          }
        } catch (_) {}
        return { type, uid: hashUid };
      }
    } catch (_) {}
  }
  return null;
}

function showDeletedVenueCalendar(portfolioType = 'banquet') {
  const pane = document.getElementById('calendarPane');
  if (!pane) return;

  const isHall = portfolioType === 'hall';
  const label = isHall ? 'Hall deleted' : 'Banquet deleted';
  const message = isHall
    ? 'This hall has been deleted and is no longer available.'
    : 'This banquet has been deleted and is no longer available.';

  pane.style.display = 'block';
  pane.classList.add('calendar-pane--deleted');
  pane.setAttribute('aria-label', label);
  pane.innerHTML = `
    <div class="calendar-deleted-state" role="status" aria-live="polite">
      <div class="calendar-deleted-state__icon" aria-hidden="true">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div class="calendar-deleted-state__eyebrow">UNAVAILABLE</div>
      <h2 class="calendar-deleted-state__title">${label}</h2>
      <p class="calendar-deleted-state__message">${message}</p>
    </div>`;

  // Never leave stale realtime calendar listeners running for a deleted venue.
  calendarRealtimeUnsubs.forEach(fn => { try { fn(); } catch (_) {} });
  calendarRealtimeUnsubs = [];
  calendarRealtimeKey = '';
  calendarDataCache = null;
  calendarDataCacheKey = '';
  calendarDataRefreshPromise = null;
}

function safeText(v) {
  return v === undefined || v === null ? '' : String(v);
}

function getOrCreateToastHost() {
  let host = document.getElementById('venueStatusToastHost');
  if (host) return host;

  host = document.createElement('div');
  host.id = 'venueStatusToastHost';
  host.setAttribute('aria-live', 'polite');
  host.setAttribute('aria-atomic', 'true');
  document.body.appendChild(host);
  return host;
}

function showVenueStatusToast({ type, title, message }) {
  const host = getOrCreateToastHost();
  if (!host) return;

  // Remove existing toast quickly (single toast model)
  const existing = host.querySelector('.venue-status-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `venue-status-toast venue-status-toast--${type || 'info'}`;

  toast.innerHTML = `
    <div class="venue-status-toast__icon" aria-hidden="true">
      <i class="fa-solid ${type === 'approved' ? 'fa-xmark' : type === 'pending' ? 'fa-clock' : 'fa-circle-info'}"></i>
    </div>
    <div class="venue-status-toast__content">
      <div class="venue-status-toast__title">${title || 'Notice'}</div>
      <div class="venue-status-toast__message">${message || ''}</div>
    </div>
    <button type="button" class="venue-status-toast__close" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector('.venue-status-toast__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => toast.remove());
  }

  host.appendChild(toast);

  // auto dismiss
  const duration = 3200;
  window.setTimeout(() => {
    if (toast && toast.parentNode) toast.remove();
  }, duration);
}

function formatPrice(v) {
  const s = safeText(v).trim();
  if (!s) return '0';
  return s;
}

function toEmbedUrl(videoUrl) {
  const raw = safeText(videoUrl).trim();
  if (!raw) return '';
  const iframeSrc = raw.match(/<iframe[^>]+src=["\']([^"\']+)["\']/i)?.[1];
  const candidate = iframeSrc ? iframeSrc.trim() : raw;
  if (!candidate) return '';
  if (/youtube(?:-nocookie)?\.com\/embed\//i.test(candidate)) {
    return candidate.includes('?') ? candidate : `${candidate}?rel=0&vq=hd1080`;
  }
  const watchMatch = candidate.match(/[?&]v=([^&\s]+)/i);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&vq=hd1080`;
  const shortMatch = candidate.match(/youtu\.be\/([^?&#/]+)/i);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0&vq=hd1080`;
  const shortsMatch = candidate.match(/youtube\.com\/shorts\/([^?&#/]+)/i);
  if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0&vq=hd1080`;

  // Do not pass arbitrary DB values (e.g. "/dasd") into an iframe.
  // Only accepted video sources should reach the iframe.
  try {
    const parsed = new URL(candidate, window.location.href);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const isYouTubeHost =
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtu.be' ||
      host === 'youtube-nocookie.com';

    if (!isYouTubeHost) return '';
  } catch {
    return '';
  }

  return '';
}


async function fetchVenueByUid(portfolioType, uid) {
  if (!uid) return null;

  const collectionPath = portfolioType === 'hall' ? '12/13' : '3/4';
  const directSnapshot = await get(ref(database, `${collectionPath}/${uid}`));

  if (directSnapshot.exists()) {
    const record = await decryptDeep(directSnapshot.val());
    return record && typeof record === 'object' ? { ...record, uid } : null;
  }

  // Legacy fallback: older records may have a different Firebase child key.
  const snapshot = await get(ref(database, collectionPath));
  const data = await decryptDeep(snapshot.val() || {});
  for (const [key, record] of Object.entries(data)) {
    const item = record || {};
    const recordUid = item.UID ?? item.hall_UID ?? key;
    if (String(recordUid) === String(uid)) return { ...item, uid: recordUid };
  }

  return null;
}

export async function initPortfolio() {
  const hashVenue = await resolveVenueFromUrlHash();
  const rawPortfolioType = hashVenue?.type || getSavedPortfolioType();
  const portfolioType = String(rawPortfolioType || '').trim().toLowerCase() === 'hall' ? 'hall' : 'banquet';
  const banquetUid = portfolioType === 'banquet'
    ? (hashVenue?.type === 'banquet' ? hashVenue.uid : getSavedBanquetUid())
    : getSavedBanquetUid();
  const hallUid = portfolioType === 'hall'
    ? (hashVenue?.type === 'hall' ? hashVenue.uid : getSavedHallUid())
    : getSavedHallUid();

  // UI refs
  const heroTitleEl = document.getElementById('heroTitle');
  const heroLocationEl = document.getElementById('heroLocationText');
  const banquetDescEl = document.getElementById('banquetDesc');
  const specialisationDescEl = document.getElementById('specialisationDesc');
  const viewSeasonalEl = document.getElementById('viewSeasonal');
  const viewStandardEl = document.getElementById('viewStandard');
  const viewCapacityEl = document.getElementById('viewCapacity');


  const cinematicBox = document.getElementById('cinematicBox');
  const videoIframe = document.getElementById('videoIframe');
  const heroBgGalleryEl = document.getElementById('heroBgImageGallery');

  let uidToUse = null;
  if (portfolioType === 'hall') uidToUse = hallUid;
  else uidToUse = banquetUid;

  if (!uidToUse) {
    if (heroTitleEl) heroTitleEl.innerHTML = 'Luxury <span>Portfolio</span>';
    if (heroLocationEl) heroLocationEl.textContent = 'Location: -';
    if (banquetDescEl) banquetDescEl.innerText = portfolioType === 'hall' ? 'No hall selected.' : 'No banquet selected.';
    if (specialisationDescEl) specialisationDescEl.innerText = '-';
    if (viewSeasonalEl) viewSeasonalEl.innerText = 'Rs. 0';
    if (viewStandardEl) viewStandardEl.innerText = 'Rs. 0';
    if (cinematicBox) cinematicBox.style.display = 'none';
    return;
  }

  let asset = null;
  try {
    asset = await fetchVenueByUid(portfolioType, uidToUse);
  } catch (_) {
    asset = null;
  }

  if (!asset) {
    const deletedLabel = portfolioType === 'hall' ? 'Hall deleted' : 'Banquet deleted';
    const deletedMessage = portfolioType === 'hall'
      ? 'This hall has been deleted and is no longer available.'
      : 'This banquet has been deleted and is no longer available.';
    if (heroTitleEl) heroTitleEl.textContent = deletedLabel;
    if (heroLocationEl) heroLocationEl.textContent = '';
    if (banquetDescEl) banquetDescEl.innerText = deletedMessage;
    if (specialisationDescEl) specialisationDescEl.innerText = '';
    if (viewSeasonalEl) viewSeasonalEl.innerText = '';
    if (viewStandardEl) viewStandardEl.innerText = '';
    if (cinematicBox) cinematicBox.style.display = 'none';
    showDeletedVenueCalendar(portfolioType);
    return;
  }

  // Count only real, existing portfolios. A stale shared URL must never recreate
  // a view counter after the venue has been deleted.
  const uidToUseForViews = portfolioType === 'hall' ? hallUid : banquetUid;
  if (uidToUseForViews) {
    void recordPortfolioView({
      portfolioType,
      uid: uidToUseForViews
    }).catch(() => {});
  }

  // Map fields from asset (banquet OR hall)
  // Banquet DB columns (existing): bankname, bankloctext, detail, specialisation, seasonalrate, standardrate
  // Hall DB columns (from haha.json sample): hallname, hallloctext, detail, specialisation, seasonalrate/standardrate(if present), img,img1,img2,img3,img4, ytlink
  const title =
    portfolioType === 'hall'
      ? safeText(asset.hallname || asset.title || asset.name || asset.uid)
      : safeText(asset.bankname || asset.title || asset.name || asset.uid);

  const locationText =
    portfolioType === 'hall'
      ? safeText(asset.hallloctext || asset.locationText || asset.location || asset.Location || '')
      : safeText(asset.bankloctext || asset.locationText || asset.location || asset.Location || '');

  const desc =
    safeText(
      portfolioType === 'hall'
        ? asset.detail || asset.desc || asset.description || asset.tagline || ''
        : asset.detail || asset.desc || asset.description || asset.tagline || ''
    );

  const specialisation = safeText(asset.specialisation || asset.specialization || asset.special || '');

  const seasonal = portfolioType === 'hall' ? asset.seasonalrate ?? asset.seasoncost ?? asset.seasonalPrice ?? asset.seasonalprice ?? asset.seasonCost ?? asset.seasoncosts : (asset.seasonalrate ?? asset.seasoncost ?? asset.seasonalPrice ?? asset.seasonalprice ?? asset.seasonCost ?? asset.seasoncosts);
  const standard = portfolioType === 'hall' ? (asset.standardrate ?? asset.standardcost ?? asset.standardprice ?? asset.standardCost) : (asset.standardrate ?? asset.standardcost ?? asset.standardprice ?? asset.standardCost);
  const capacity = safeText(
    portfolioType === 'hall'
      ? asset.capacity ?? asset.capacitance ?? asset.cap ?? asset.Capacity
      : asset.capacity ?? asset.capacitance ?? asset.cap ?? asset.Capacity
  );


  const video = safeText(asset.video || asset.cinematicVideo || asset.youtubeVideo || asset.videourl || '');



  // ---- Availability Based Event Time Dropdown Filtering ----
  // DB field (as per admin_dashboard.js): avaibility / availability => { Morning: true/false, Evening:..., Night:... }
  const getAvailabilityObj = () => {
    const avail = asset.avaibility ?? asset.availability ?? {};
    return avail && typeof avail === 'object' ? avail : {};
  };

  const isAvailTrue = (v) => {
    if (v === true) return true;
    if (v === false || v === null || v === undefined) return false;
    const s = String(v).trim().toLowerCase();
    if (!s) return false;
    return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on';
  };

  const availObj = getAvailabilityObj();
  const allowedTimes = ['Morning', 'Evening', 'Night'].filter((t) => {
    const v = availObj?.[t];
    return isAvailTrue(v);
  });

  const applyAllowedTimesToDropdown = (allowed) => {
    const allowedSet = new Set(allowed);

    const list = document.getElementById('bottomEventTimeDropdownList');
    const btnLabel = document.getElementById('bottomEventTimeDropdownLabel');
    const hiddenInput = document.getElementById('bottomEventTimeSelect');
    const dropdownBtn = document.getElementById('bottomEventTimeDropdownBtn');

    if (list) {
      const options = list.querySelectorAll('.calendar-dd-option');
      options.forEach((opt) => {
        const v = opt.getAttribute('data-value');
        const show = allowedSet.has(v);
        opt.style.display = show ? '' : 'none';
        opt.setAttribute('aria-hidden', show ? 'false' : 'true');
      });
    }

    // Update eventTimeSelect in modal too (hide/disable options)
    const eventTimeSelect = document.getElementById('eventTimeSelect');
    if (eventTimeSelect) {
      const opts = eventTimeSelect.querySelectorAll('option');
      opts.forEach((opt) => {
        const v = opt.value;
        const show = allowedSet.has(v);
        // Disable + optionally hide
        opt.disabled = !show;
      });

      // Fix currently selected value if it's disabled
      const cur = eventTimeSelect.value;
      const isCurAllowed = allowedSet.has(cur);
      if (!isCurAllowed) {
        const firstAllowed = allowed[0] || 'Morning';
        eventTimeSelect.value = firstAllowed;
      }
    }

    // Fix bottom dropdown value/label if current saved time is not allowed
    const currentSaved = (() => {
      try { return localStorage.getItem('eventTime'); } catch (e) { return null; }
    })();

    const desired = (currentSaved && allowedSet.has(currentSaved)) ? currentSaved : (allowed[0] || 'Morning');

    if (hiddenInput) hiddenInput.value = desired;
    if (btnLabel) btnLabel.textContent = desired;

    // Make sure calendar pane matches current desired time
    try {
      if (dropdownBtn) dropdownBtn.setAttribute('aria-expanded', 'false');
    } catch (e) {}

    try {
      // syncCalendarVisibility is defined later in file, but function exists (hoisted)
      syncCalendarVisibility(desired);
    } catch (e) {}

    // Update localStorage + modal select too
    try { setSavedEventTime(desired); } catch (e) {}
    try {
      const eventTimeSelect2 = document.getElementById('eventTimeSelect');
      if (eventTimeSelect2) eventTimeSelect2.value = desired;
    } catch (e) {}

    // Close dropdown after applying
    try {
      const list2 = document.getElementById('bottomEventTimeDropdownList');
      if (list2) list2.classList.remove('is-open');
    } catch (e) {}
  };

  // If availability data missing/empty, keep original behavior (show all)
  const allowedFinal = allowedTimes.length ? allowedTimes : ['Morning', 'Evening', 'Night'];

  // Persist venue availability so initEventTimeFlow() can clamp dropdown consistently.
  // (Otherwise initEventTimeFlow may fallback to showing all slots.)
  try {
    const payload = {
      Morning: allowedFinal.includes('Morning') === true,
      Evening: allowedFinal.includes('Evening') === true,
      Night: allowedFinal.includes('Night') === true,
    };
    localStorage.setItem('selectedVenueAvailability', JSON.stringify(payload));
  } catch (e) {}

  applyAllowedTimesToDropdown(allowedFinal);




  // UI updates
  // feedback ke mutabiq heroTitle me “Luxury” fixed text remove karke sirf bankname show karna hai.
  if (heroTitleEl) heroTitleEl.innerHTML = `<span>${title}</span>`;
  if (heroLocationEl) heroLocationEl.textContent = 'Location: ' + (locationText || 'Premium Event District');

  if (banquetDescEl) banquetDescEl.innerText = desc || '—';
  if (specialisationDescEl) {
    const raw = safeText(specialisation || '').trim();
    if (!raw || raw === '-' || raw.toLowerCase() === 'null') {
      specialisationDescEl.innerText = '—';
    } else {
      // DB sample: "Luxury Seating/Suite" (slash supported) and sometimes "A/B" or "A, B".
      const parts = raw
        .split(/\s*[;,|\n]+\s*/g)
        .flatMap((chunk) => chunk.split(/\s*\/\s*/g))
        .flatMap((chunk) => chunk.split(/\s*(?:&|\band\b)\s*/gi))
        .map((x) => x.trim())
        .filter(Boolean);

      // If still single item, keep it as a short text line (but matching UI).
      if (!parts.length) {
        specialisationDescEl.innerText = '—';
      } else if (parts.length === 1) {
        specialisationDescEl.innerHTML = `<ul class="specialisation-list"><li>${parts[0]}</li></ul>`;
      } else {
        const lis = parts.map((p) => `<li>${p}</li>`).join('');
        specialisationDescEl.innerHTML = `<ul class="specialisation-list">${lis}</ul>`;
      }
    }
  }

  if (viewSeasonalEl) viewSeasonalEl.innerText = 'Rs. ' + formatPrice(seasonal || '0').replace('Rs. ', '').trim();
  if (viewStandardEl) viewStandardEl.innerText = 'Rs. ' + formatPrice(standard || '0').replace('Rs. ', '').trim();
  if (viewCapacityEl) viewCapacityEl.innerText = capacity ? String(capacity) : '-';


  // Render images behind hero text (fields: img, img1, img2, img3, img4)
  if (heroBgGalleryEl) {
    const galleryCandidates = [
      asset.gallery, asset.images, asset.imgs, asset.cover_gallery, asset.coverGallery,
      asset.imagesStack, asset.imageGallery, asset.galleryImages
    ];
    const arrayImgs = galleryCandidates.flatMap((v) => Array.isArray(v) ? v : []);
    const rawImgs = [
      asset.img, asset.img1, asset.img2, asset.img3, asset.img4,
      asset.image, asset.image1, asset.image2, asset.image3, asset.image4,
      asset.cover, asset.coverImage, ...arrayImgs
    ];
    const imgs = Array.from(new Set(rawImgs.map((x) => safeText(x).trim()).filter(Boolean)));

    heroBgGalleryEl.innerHTML = '';

    if (imgs.length) {
      imgs.forEach((src, i) => {
        const el = document.createElement('img');
        el.className = 'hero-bg-img';
        el.loading = i === 0 ? 'eager' : 'lazy';
        if (i === 0) el.fetchPriority = 'high';
        el.decoding = 'async';
        el.alt = portfolioType === 'hall' ? 'Hall image' : 'Banquet image';
        el.src = src;
        heroBgGalleryEl.appendChild(el);
      });

      const heroImagePrevBtn = document.getElementById('heroImagePrevBtn');
      const heroImageNextBtn = document.getElementById('heroImageNextBtn');
      let currentIdx = 0;

      const applyVisibleImage = () => {
        const allImgs = heroBgGalleryEl.querySelectorAll('img.hero-bg-img');
        allImgs.forEach((imgEl, i) => {
          imgEl.style.display = i === currentIdx ? 'block' : 'none';
        });
      };

      const openImageView = () => {
        if (!imgs.length) return;

        const overlay = document.getElementById('heroImageModalOverlay');
        const modalImg = document.getElementById('heroImageModalImg');
        const prevBtn = document.getElementById('heroImageModalPrevBtn');
        const nextBtn = document.getElementById('heroImageModalNextBtn');
        const closeBtn = document.getElementById('heroImageModalCloseX');
        const counter = document.getElementById('heroImageModalCounter');
        const loading = overlay?.querySelector('.premium-image-viewer__loading');

        if (!overlay || !modalImg) {
          const heroSlider = document.querySelector('.hero-slider-container');
          if (heroSlider) heroSlider.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        const updateCounter = () => {
          if (counter) counter.textContent = `${currentIdx + 1} / ${imgs.length}`;
        };

        const setModalImage = () => {
          const src = imgs[currentIdx] || '';
          if (loading) loading.style.display = 'grid';
          modalImg.style.opacity = '0';
          modalImg.onload = () => {
            if (loading) loading.style.display = 'none';
            modalImg.style.opacity = '1';
          };
          modalImg.onerror = () => {
            if (loading) loading.style.display = 'none';
            modalImg.style.opacity = '1';
          };
          modalImg.src = src;
          modalImg.alt = `${portfolioType === 'hall' ? 'Hall' : 'Banquet'} image ${currentIdx + 1}`;
          updateCounter();
        };

        const onPrev = () => {
          currentIdx = (currentIdx - 1 + imgs.length) % imgs.length;
          setModalImage();
        };

        const onNext = () => {
          currentIdx = (currentIdx + 1) % imgs.length;
          setModalImage();
        };

        const closeViewer = () => {
          overlay.style.display = 'none';
          overlay.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('premium-image-viewer-open');
        };

        setModalImage();

        const hasMultiple = imgs.length > 1;
        if (prevBtn) {
          prevBtn.style.display = 'grid';
          prevBtn.setAttribute('aria-disabled', hasMultiple ? 'false' : 'true');
          prevBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            onPrev();
          };
        }
        if (nextBtn) {
          nextBtn.style.display = 'grid';
          nextBtn.setAttribute('aria-disabled', hasMultiple ? 'false' : 'true');
          nextBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            onNext();
          };
        }
        if (closeBtn) {
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeViewer();
          };
        }

        overlay.querySelectorAll('[data-image-viewer-close]').forEach((backdrop) => {
          backdrop.onclick = (e) => {
            e.preventDefault();
            closeViewer();
          };
        });

        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('premium-image-viewer-open');
      };

      const heroImageViewBtn = document.getElementById('heroImageViewBtn');
      if (heroImageViewBtn) {
        heroImageViewBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openImageView();
        });
      }

      if (heroImagePrevBtn) {
        heroImagePrevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!imgs.length) return;
          currentIdx = (currentIdx - 1 + imgs.length) % imgs.length;
          applyVisibleImage();
        });
      }

      if (heroImageNextBtn) {
        heroImageNextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!imgs.length) return;
          currentIdx = (currentIdx + 1) % imgs.length;
          applyVisibleImage();
        });
      }

      // Keyboard controls for the premium viewer.
      document.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('heroImageModalOverlay');
        if (!overlay || overlay.getAttribute('aria-hidden') !== 'false') return;

        if (e.key === 'Escape') {
          const closeBtn = document.getElementById('heroImageModalCloseX');
          if (closeBtn) closeBtn.click();
        } else if (e.key === 'ArrowLeft' && imgs.length > 1) {
          currentIdx = (currentIdx - 1 + imgs.length) % imgs.length;
          const img = document.getElementById('heroImageModalImg');
          if (img) {
            img.style.opacity = '0';
            img.onload = () => { img.style.opacity = '1'; };
            img.src = imgs[currentIdx];
          }
          const counter = document.getElementById('heroImageModalCounter');
          if (counter) counter.textContent = `${currentIdx + 1} / ${imgs.length}`;
        } else if (e.key === 'ArrowRight' && imgs.length > 1) {
          currentIdx = (currentIdx + 1) % imgs.length;
          const img = document.getElementById('heroImageModalImg');
          if (img) {
            img.style.opacity = '0';
            img.onload = () => { img.style.opacity = '1'; };
            img.src = imgs[currentIdx];
          }
          const counter = document.getElementById('heroImageModalCounter');
          if (counter) counter.textContent = `${currentIdx + 1} / ${imgs.length}`;
        }
      });

      // Click anywhere on hero background/text to open the premium viewer.
      heroBgGalleryEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openImageView();
      });

      const heroText = document.querySelector('.hero-text');
      if (heroText) {
        heroText.addEventListener('click', (e) => {
          e.stopPropagation();
          openImageView();
        });
      }

      applyVisibleImage();
    }
  }

  // Cinematic (YouTube video wala section)
  // DB column: ytlink (Banquet + Hall dono me expected)
  if (cinematicBox && videoIframe) {
    const videoUrlFromDb = safeText(
      asset.ytlink || asset.YTlink || asset.ytLink || asset.youtube || asset.youtubeLink ||
      asset.youtube_embeded_link || asset.youtubeEmbeddedLink || asset.youtube_embedded_link ||
      asset.youtubeEmbedded || asset.youtubeUrl || asset.video || asset.videourl || ''
    );
    const embedUrl = toEmbedUrl(videoUrlFromDb);

    const currentVideoSrc = videoIframe.getAttribute('src') || '';
    if (embedUrl) {
      if (currentVideoSrc !== embedUrl) videoIframe.src = embedUrl;
      cinematicBox.style.display = 'block';
    } else {
      cinematicBox.style.display = 'none';
      if (currentVideoSrc) videoIframe.removeAttribute('src');
    }
  }
}


function getSavedEventTime() {
  try {
    return localStorage.getItem('eventTime');
  } catch (e) {
    return null;
  }
}

function setSavedEventTime(v) {
  try {
    localStorage.setItem('eventTime', v);
  } catch (e) {}
}


function closeEventTimeModal() {
  const overlay = document.getElementById('eventTimeModalOverlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
}

const __calendarStateByType = {

  Morning: null,
  Evening: null,
  Night: null,
};

function getMonthState(calendarType) {
  if (__calendarStateByType[calendarType]) return __calendarStateByType[calendarType];
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  __calendarStateByType[calendarType] = base;
  return base;
}

function shiftMonth(calendarType, delta) {
  const cur = getMonthState(calendarType);
  const next = new Date(cur.getFullYear(), cur.getMonth() + delta, 1);
  __calendarStateByType[calendarType] = next;
  return next;
}

function formatMonthYear(d) {
  if (!d) return '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

async function renderCalendarFor(calendarType) {
  const block = document.querySelector(`.calendar-block[data-calendar="${calendarType}"]`);
  if (!block) return;
  const daysContainer = block.querySelector('[data-calendar-grid] .calendar-days');
  if (!daysContainer) return;

  const data = await loadCalendarData(false);
  const bookedSet = data.bookedByTime[calendarType] || new Set();
  const approvedSet = data.approvedByTime[calendarType] || new Set();
  const redMarkedSet = data.redByTime[calendarType] || new Set();

  const monthState = getMonthState(calendarType);
  const year = monthState.getFullYear();
  const month = monthState.getMonth();
  const monthLabelEl = block.querySelector('[data-calendar-month-label]');
  if (monthLabelEl) monthLabelEl.textContent = formatMonthYear(monthState);

  const toLocalISODate = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toLocalISODate(new Date());
  const fragment = document.createDocumentFragment();

  for (let cell = 0; cell < 42; cell++) {
    const dayNumber = cell - firstWeekday + 1;
    const isOut = dayNumber < 1 || dayNumber > daysInMonth;
    const dayBtn = document.createElement('button');
    dayBtn.type = 'button';
    dayBtn.className = 'cal-day';
    if (isOut) dayBtn.classList.add('is-out');
    if (isOut) {
      dayBtn.disabled = true;
      fragment.appendChild(dayBtn);
      continue;
    }

    const isoStr = toLocalISODate(new Date(year, month, dayNumber));
    dayBtn.textContent = String(dayNumber);
    dayBtn.dataset.date = isoStr;
    if (isoStr === todayKey) dayBtn.classList.add('is-today');

    if (approvedSet.has(isoStr) || redMarkedSet.has(isoStr)) {
      dayBtn.classList.add('is-redmarked');
      dayBtn.title = 'Date Fully Reserved';
      dayBtn.setAttribute('aria-disabled', 'true');
    } else if (bookedSet.has(isoStr)) {
      dayBtn.classList.add('is-booked-by-other');
      dayBtn.title = 'Booking Pending by Other User';
      dayBtn.setAttribute('aria-disabled', 'true');
    }

    dayBtn.addEventListener('click', () => {
      if (dayBtn.classList.contains('is-redmarked')) {
        showVenueStatusToast({ type: 'approved', title: 'Date Fully Reserved', message: 'This date is fully reserved for this time.' });
        return;
      }
      if (dayBtn.classList.contains('is-booked-by-other')) {
        showVenueStatusToast({ type: 'pending', title: 'Booking Pending', message: 'Booking pending by another user for this date.' });
        return;
      }
      try {
        localStorage.setItem('selectedEventDate', isoStr);
        localStorage.setItem('selectedEventTime', calendarType);
        localStorage.setItem('eventTime', calendarType);
      } catch (e) {}
      try { closeEventTimeModal && closeEventTimeModal(); } catch (e) {}
      try { closeUserDetailsModal && closeUserDetailsModal(); } catch (e) {}
      try { closeConfirmationModal && closeConfirmationModal(); } catch (e) {}
      openEventTypeModal();
    });
    fragment.appendChild(dayBtn);
  }

  daysContainer.replaceChildren(fragment);
}

function initCalendarMonthNav() {
  const root = document.getElementById('calendarPane');
  if (!root) return;

  const blocks = root.querySelectorAll('.calendar-block[data-calendar]');
  blocks.forEach((block) => {
    const calType = block.getAttribute('data-calendar');
    if (!calType) return;

    const prevBtn = block.querySelector('[data-month-nav="prev"]');
    const nextBtn = block.querySelector('[data-month-nav="next"]');

    const doShift = async (delta) => {
      shiftMonth(calType, delta);
      // Month data is cached; rendering is local and immediate.
      renderCalendarFor(calType).catch(() => {});
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        doShift(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        doShift(1);
      });
    }
  });
}

function syncCalendarVisibility(selectedTime) {
  const morning = document.getElementById('calendarMorning');
  const evening = document.getElementById('calendarEvening');
  const night = document.getElementById('calendarNight');

  const v = selectedTime || 'Morning';

  if (morning) morning.style.display = v === 'Morning' ? 'block' : 'none';
  if (evening) evening.style.display = v === 'Evening' ? 'block' : 'none';
  if (night) night.style.display = v === 'Night' ? 'block' : 'none';

  // Cached data makes this render instant when switching Morning/Evening/Night.
  renderCalendarFor(v).catch(() => {});

  // Firebase realtime listeners now push vendor approve/deny changes instantly.
  // No polling interval is needed, which keeps month/time switching fast.
  try { if (window.__calendarAutoRefreshTimer) clearInterval(window.__calendarAutoRefreshTimer); } catch (e) {}
  window.__calendarAutoRefreshTimer = null;
  const uid = getSavedPortfolioType() === 'hall' ? getSavedHallUid() : getSavedBanquetUid();
  if (uid) attachCalendarRealtimeListeners(uid).catch(() => {});
}





function openEventTypeModal() {

  const overlay = document.getElementById('eventTypeModalOverlay');
  if (!overlay) return;

  const dateLabel = document.getElementById('eventTypeSelectedDateLabel');
  const savedDate = getSavedEventDate();
  if (dateLabel) {
    dateLabel.textContent = savedDate ? `(${formatPrettyDate(savedDate)})` : '';
  }

  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
}

function closeEventTypeModal() {
  const overlay = document.getElementById('eventTypeModalOverlay');
  if (!overlay) return;
  try {
    const active = document.activeElement;
    if (active && overlay.contains(active)) {
      active.blur();
      const safeTarget = document.getElementById('portfolioMain') || document.body;
      if (safeTarget && typeof safeTarget.focus === 'function') safeTarget.focus({ preventScroll: true });
    }
  } catch (e) {}
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
}

function getSavedEventDate() {
  try {
    return localStorage.getItem('selectedEventDate');
  } catch (e) {
    return null;
  }
}

function formatPrettyDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

function getSavedEventType() {
  try {
    return localStorage.getItem('selectedEventType');
  } catch (e) {
    return null;
  }
}

function setSavedEventType(v) {
  try {
    localStorage.setItem('selectedEventType', v);
  } catch (e) {}
}

function openUserDetailsModal() {
  const overlay = document.getElementById('userDetailsModalOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
}

function closeUserDetailsModal() {
  const overlay = document.getElementById('userDetailsModalOverlay');
  if (!overlay) return;
  try {
    const active = document.activeElement;
    if (active && overlay.contains(active)) {
      active.blur();
      const safeTarget = document.getElementById('portfolioMain') || document.body;
      if (safeTarget && typeof safeTarget.focus === 'function') safeTarget.focus({ preventScroll: true });
    }
  } catch (e) {}
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
}


function showBookingConflictModal(title = 'Date already reserved', message = 'This date is no longer available for booking.') {
  let overlay = document.getElementById('bookingConflictModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'bookingConflictModalOverlay';
    overlay.className = 'booking-conflict-modal-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="booking-conflict-modal" role="dialog" aria-modal="true" aria-labelledby="bookingConflictModalTitle">
        <button type="button" class="booking-conflict-modal__close" aria-label="Close">&times;</button>
        <div class="booking-conflict-modal__icon"><i class="fa-solid fa-calendar-xmark"></i></div>
        <div class="booking-conflict-modal__eyebrow">LIVE AVAILABILITY</div>
        <h2 id="bookingConflictModalTitle" class="booking-conflict-modal__title"></h2>
        <p id="bookingConflictModalMessage" class="booking-conflict-modal__message"></p>
        <div class="booking-conflict-modal__hint"><i class="fa-solid fa-shield-halved"></i><span>The reservation state was checked live. No duplicate booking was created.</span></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => e.stopPropagation());
    overlay.querySelector('.booking-conflict-modal__close')?.addEventListener('click', () => {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    });
  }
  const t = overlay.querySelector('#bookingConflictModalTitle');
  const m = overlay.querySelector('#bookingConflictModalMessage');
  if (t) t.textContent = title;
  if (m) m.textContent = message;
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
  overlay.querySelector('.booking-conflict-modal__close')?.focus({ preventScroll: true });
}
function openConfirmationModal() {
  const overlay = document.getElementById('confirmationModalOverlay');
  if (!overlay) return;

  const msgEl = document.getElementById('confirmationMessage');

  const name = (() => {
    try {
      return localStorage.getItem('userNameLast') || '-';
    } catch (e) {
      return '-';
    }
  })();
  const phone = (() => {
    try {
      return localStorage.getItem('userPhoneLast') || '-';
    } catch (e) {
      return '-';
    }
  })();

  const time = getSavedEventTime() || '-';
  const date = getSavedEventDate() || '-';
  const prettyDate = (() => {
    if (date === '-') return '-';
    try {
      return formatPrettyDate(date);
    } catch (e) {
      return date;
    }
  })();

  const confirmationName = document.getElementById('confirmationName');
  const confirmationPhone = document.getElementById('confirmationPhone');
  const confirmationTime = document.getElementById('confirmationTime');
  const confirmationDate = document.getElementById('confirmationDate');

  if (confirmationName) confirmationName.textContent = name;
  if (confirmationPhone) confirmationPhone.textContent = phone;
  if (confirmationTime) confirmationTime.textContent = time;
  if (confirmationDate) confirmationDate.textContent = prettyDate;

  if (msgEl) msgEl.textContent = 'Booking confirmed.';

  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
}

function closeConfirmationModal() {
  const overlay = document.getElementById('confirmationModalOverlay');
  if (!overlay) return;

  // Avoid aria-hidden on an element that currently contains focus.
  try {
    const active = document.activeElement;
    if (active && overlay.contains(active)) {
      // Move focus to a safe element (body) before hiding.
      document.body.focus && document.body.focus();
      if (document.activeElement === overlay) document.body.focus();
    }
  } catch (e) {}

  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
}

function initEventTypeFlow() {
  const overlay = document.getElementById('eventTypeModalOverlay');
  if (!overlay) return;

  const closeX = document.getElementById('eventTypeModalCloseX');
  if (closeX) {
    closeX.addEventListener('click', () => closeEventTypeModal());
  }

  // Backdrop clicks intentionally do not close the modal; use the X button.
  overlay.addEventListener('click', (e) => { e.stopPropagation(); });

  const optionBtns = overlay.querySelectorAll('.event-type-btn');
  optionBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-event-type');
      if (!v) return;
      setSavedEventType(v);
      closeEventTypeModal();
      openUserDetailsModal();
    });
  });
}

function initEventTimeFlow() {
  const overlay = document.getElementById('eventTimeModalOverlay');
  if (!overlay) return;

  window.addEventListener('bookNowClicked', () => {
    const calendarPane = document.getElementById('calendarPane');
    if (calendarPane) {
      calendarPane.style.display = 'block';
      calendarPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Event Time modal ko auto-open na karein.
  });


  const closeX = document.getElementById('eventTimeModalCloseX');
  if (closeX) {
    closeX.addEventListener('click', () => closeEventTimeModal());
  }

  // Backdrop clicks intentionally do not close the modal; use the X button.
  overlay.addEventListener('click', (e) => { e.stopPropagation(); });

  const eventTimeSelect = document.getElementById('eventTimeSelect');

  const bottomHiddenInput = document.getElementById('bottomEventTimeSelect');
  const bottomDropdownBtn = document.getElementById('bottomEventTimeDropdownBtn');
  const bottomDropdownList = document.getElementById('bottomEventTimeDropdownList');
  const bottomDropdownLabel = document.getElementById('bottomEventTimeDropdownLabel');

  function setBottomDropdownValue(v) {
    if (!v) return;
    if (bottomHiddenInput) bottomHiddenInput.value = v;
    if (bottomDropdownLabel) bottomDropdownLabel.textContent = v;

    if (bottomDropdownBtn) bottomDropdownBtn.setAttribute('aria-expanded', 'false');
    if (bottomDropdownList) bottomDropdownList.classList.remove('is-open');

    setSavedEventTime(v);
    syncCalendarVisibility(v);

    if (eventTimeSelect) eventTimeSelect.value = v;
  }

  function toggleBottomDropdown(open) {
    if (!bottomDropdownBtn || !bottomDropdownList) return;
    const shouldOpen = typeof open === 'boolean' ? open : bottomDropdownList.classList.contains('is-open') === false;
    bottomDropdownBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    bottomDropdownList.classList.toggle('is-open', shouldOpen);
  }

  if (bottomDropdownBtn && bottomDropdownList) {
    bottomDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = bottomDropdownList.classList.contains('is-open');
      toggleBottomDropdown(!isOpen);
    });

    bottomDropdownList.addEventListener('click', (e) => {
      const opt = e.target && e.target.closest && e.target.closest('.calendar-dd-option');
      if (!opt) return;
      const v = opt.getAttribute('data-value');
      setBottomDropdownValue(v);
    });

    bottomDropdownList.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const active = document.activeElement;
      if (!active || !active.classList || !active.classList.contains('calendar-dd-option')) return;
      e.preventDefault();
      setBottomDropdownValue(active.getAttribute('data-value'));
    });

    document.addEventListener('click', () => {
      if (bottomDropdownBtn && bottomDropdownList) {
        toggleBottomDropdown(false);
      }
    });
  }

  if (eventTimeSelect) {
    eventTimeSelect.addEventListener('change', () => {
      const v = eventTimeSelect.value;
      setSavedEventTime(v);
      closeEventTimeModal();
      try { localStorage.setItem('pendingOpenBookingFlow', '0'); } catch (e) {}
      syncCalendarVisibility(v);

      if (bottomHiddenInput) bottomHiddenInput.value = v;
      if (bottomDropdownLabel) bottomDropdownLabel.textContent = v;
    });

    const savedNow = getSavedEventTime();
    if (savedNow) eventTimeSelect.value = savedNow;
  }

  const confirmBtn = document.getElementById('eventTimeConfirmBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      closeEventTimeModal();
      try { localStorage.setItem('pendingOpenBookingFlow', '0'); } catch (e) {}
    });
  }

  // Autoload Event Time modal ko remove kiya.

  // previously: pendingOpenBookingFlow ke basis par modal auto-open hota tha.
  try {
    // no-op
    void localStorage.getItem('pendingOpenBookingFlow');
  } catch (e) {}


  try {
    const saved = getSavedEventTime();
    const allowedGuard = (() => {
      try {
        const portfolioType = getSavedPortfolioType();
        const banquetUid = getSavedBanquetUid();
        const hallUid = getSavedHallUid();
        const uidToUse = portfolioType === 'hall' ? hallUid : banquetUid;
        if (!uidToUse) return null;

        const stored = localStorage.getItem('selectedVenueAvailability');
        if (stored) {
          const obj = JSON.parse(stored);
          return ['Morning','Evening','Night'].filter(t => obj && obj[t] === true);
        }
        return null;
      } catch (e) {
        return null;
      }
    })();

    const allowed = Array.isArray(allowedGuard) && allowedGuard.length ? allowedGuard : ['Morning','Evening','Night'];
    const v0 = saved || 'Morning';
    const v = allowed.includes(v0) ? v0 : (allowed[0] || 'Morning');
    syncCalendarVisibility(v);


    const bottomHiddenInput = document.getElementById('bottomEventTimeSelect');
    if (bottomHiddenInput) bottomHiddenInput.value = v;
    const bottomDropdownLabel = document.getElementById('bottomEventTimeDropdownLabel');
    if (bottomDropdownLabel) bottomDropdownLabel.textContent = v;
  } catch (e) {
    syncCalendarVisibility('Morning');
  }
}

function initUserDetailsFlow() {
  const overlay = document.getElementById('userDetailsModalOverlay');
  if (!overlay) return;

  const closeX = document.getElementById('userDetailsModalCloseX');
  const okBtn = document.getElementById('userDetailsOkBtn');

  const nameInput = document.getElementById('userNameInput');
  const phoneInput = document.getElementById('userPhoneInput');
  const errEl = document.getElementById('userDetailsError');

  function setError(msg) {
    if (!errEl) return;
    if (!msg) {
      errEl.style.display = 'none';
      errEl.textContent = '';
      return;
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }

  if (closeX) {
    closeX.addEventListener('click', () => {
      setError('');
      closeUserDetailsModal();
    });
  }

  // Backdrop clicks intentionally do not close the user-details modal; use the X button.
  overlay.addEventListener('click', (e) => { e.stopPropagation(); });

  if (okBtn) {
    okBtn.addEventListener('click', () => {
      const name = (nameInput && nameInput.value ? nameInput.value.trim() : '');
      const phoneRaw = (phoneInput && phoneInput.value ? phoneInput.value.trim() : '');
      const phoneDigits = phoneRaw.replace(/\D/g, '');

      try {
        localStorage.setItem('userNameLast', name);
        localStorage.setItem('userPhoneLast', phoneDigits);
      } catch (e) {}

      if (phoneDigits.length !== 11) {
        setError('Phone invalid (11 digits required).');
        return;
      }

      setError('');
      closeUserDetailsModal();

      try { openConfirmationModal(); } catch (e) {}
    });
  }
}

function showSuccessPopup() {
  const overlay = document.getElementById('successPopupOverlay');
  if (!overlay) return;

  const card = overlay.querySelector('.modal-card');

  // Reset animation reliably on repeat.
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
  if (card) {
    card.classList.remove('success-popup-animate');
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    card.offsetHeight;
    card.classList.add('success-popup-animate');
  }

  // Auto close after exactly 3000ms
  window.setTimeout(() => {
    try {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    } catch (e) {}
  }, 3000);
}

function initConfirmationFlow() {
  let bookingCompleted = false;
  const overlay = document.getElementById('confirmationModalOverlay');
  if (!overlay) return;

  const closeX = document.getElementById('confirmationModalCloseX');
  if (closeX) {
    closeX.addEventListener('click', () => closeConfirmationModal());
  }

  // Backdrop clicks intentionally do not close the modal; use the X button.
  overlay.addEventListener('click', (e) => { e.stopPropagation(); });

  const okBtn = document.getElementById('confirmationOkBtn');
  if (okBtn) {
    okBtn.addEventListener('click', async () => {
      bookingCompleted = false;
      // 1) close UI immediately
      closeConfirmationModal();

      // 2) Build booking payload and save to Firebase
      try {
        const clientname = safeText(localStorage.getItem('userNameLast')).trim();
        const clientcontactRaw = safeText(localStorage.getItem('userPhoneLast')).trim();
        const clientcontact = clientcontactRaw.replace(/\D/g, '');

        const event_time = safeText(localStorage.getItem('selectedEventTime') || localStorage.getItem('eventTime')).trim();
        const event_type = safeText(getSavedEventType() || '').trim();

        const targetdate = safeText(getSavedEventDate() || '').trim(); // stored/selected: YYYY-MM-DD

        // requesteddate: DB me ajj ki current date dd/mm/yyyy format
        const requesteddate = (() => {
          const now = new Date();
          const dd = String(now.getDate()).padStart(2, '0');
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const yyyy = String(now.getFullYear());
          return `${dd}/${mm}/${yyyy}`;
        })();

        // targetdate ko bhi dd/mm/yyyy me store karna hai
        const targetdateDDMMYYYY = (() => {
          const m = String(targetdate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!m) return targetdate;
          return `${m[3]}/${m[2]}/${m[1]}`;
        })();


        // Reserve a unique booking UID atomically. This prevents two simultaneous
        // clients from overwriting /9/10 with the same value.
        const LIMIT = 999999;
        let user_UID = '';
        try {
          user_UID = await nextBookingUid(LIMIT);
        } catch (e) {
          // Extremely unlikely fallback if the UID counter is temporarily unavailable.
          // The actual booking slot is still protected by the atomic slot transaction below.
          try {
            const randomPart = crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
            user_UID = `B${randomPart}`;
          } catch (_) {
            user_UID = `B${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1e6).toString(36).toUpperCase()}`;
          }
        }



        // Optional: include linked asset id (banquet/hall) for admin traceability
        const savedPortfolioType = getSavedPortfolioType();
        const selectedBanquetUid = getSavedBanquetUid();
        const selectedHallUid = getSavedHallUid();
        const selectedAssetUid = savedPortfolioType === 'hall' ? selectedHallUid : selectedBanquetUid;

        // venueId = banquet/hall record UID, jo admin ke liye locate karne mein help karega.
        const venueId = selectedAssetUid || '';

          const payload = {
          clientname,
          clientcontact,
          event_time,
          event_type,
          targetdate: targetdateDDMMYYYY,
          requesteddate,
          user_UID,
          // admin flow ke liye pending status
          status: 'pending',
          // required extra for admin lookup
          venueId,
          // helpful debug fields (won't break your required schema)
          selectedPortfolioType: savedPortfolioType,
          selectedAssetUid: selectedAssetUid || '',
        };



        // Basic validation (don't block save if optional missing; only avoid empty essential user name)
        if (!clientname) {
          console.warn('Booking save skipped: clientname missing');
          return;
        }

        // First claim the exact venue/date/time slot atomically.
        // This is the critical concurrency guard: if another user wins the slot
        // between calendar display and this click, this request is rejected.
        let slotClaimed = false;
        try {
          const claim = await claimBookingSlot({
            venueId,
            targetDate: targetdate,
            eventTime: event_time,
          });
          slotClaimed = !!claim.claimed;
          if (!slotClaimed) {
            showBookingConflictModal(
              'Date just reserved',
              'Another user secured this date and time moments ago. Please close this message and choose another available slot.'
            );
            return;
          }

          // Save the encrypted booking record only after the slot is secured.
          const userRef = ref(database, `9/11/${user_UID}`);
          await set(userRef, await encryptDeep(payload));
        } catch (bookingWriteError) {
          // Never leave a slot locked if its booking record could not be saved.
          if (slotClaimed) {
            try {
              await releaseBookingSlot({ venueId, targetDate: targetdate, eventTime: event_time });
            } catch (releaseError) {
              console.error('Failed to release abandoned booking slot:', releaseError);
            }
          }
          throw bookingWriteError;
        }

        // Repaint immediately: the newly submitted request appears yellow/pending
        // through the small venue-specific availability listener.
        try {
          await renderCalendarFor(event_time || 'Morning');
        } catch (e) {}

        bookingCompleted = true;

        // Clear pending booking state if any
        try {
          localStorage.removeItem('pendingOpenBookingFlow');
        } catch (e) {}
      } catch (e) {
        console.error('Failed to save booking:', e);
      }

      // Show success popup after Done click (and after confirmation closes).
      // Small delay so user feels “Done” action -> then success animation.
      try {
        if (bookingCompleted) window.setTimeout(() => showSuccessPopup(), 120);
      } catch (e) {}
    });
  }
}









// LOCATION button: decrypt the DB-stored location link and open it in a new tab.
async function handleLocationRedirect() {
  // Open immediately during the user's click so the browser does not block the
  // tab while Firebase read + AES-GCM decryption happens asynchronously.
  let targetTab = null;
  try {
    targetTab = window.open('', '_blank');
  } catch (_) {}

  const closeTarget = () => {
    try {
      if (targetTab && !targetTab.closed) targetTab.close();
    } catch (_) {}
  };

  try {
    const portfolioType = getSavedPortfolioType();
    const uidToUse = portfolioType === 'hall'
      ? getSavedHallUid()
      : getSavedBanquetUid();

    if (!uidToUse) {
      closeTarget();
      showVenueStatusToast({
        type: 'info',
        title: 'Location unavailable',
        message: 'No venue is currently selected.'
      });
      return;
    }

    const dbPath = portfolioType === 'hall'
      ? '12/13'
      : '3/4';

    const snapshot = await get(ref(database, dbPath));
    if (!snapshot.exists()) {
      closeTarget();
      showVenueStatusToast({
        type: 'info',
        title: 'Location unavailable',
        message: 'Venue location data was not found.'
      });
      return;
    }

    // decryptDeep supports encrypted complete records, encrypted fields,
    // and old plaintext records for backward compatibility.
    const decryptedCollection = await decryptDeep(snapshot.val() || {});
    let asset = null;

    if (decryptedCollection && typeof decryptedCollection === 'object') {
      for (const [key, rawRecord] of Object.entries(decryptedCollection)) {
        const record = await decryptDeep(rawRecord || {});
        if (!record || typeof record !== 'object') continue;

        // UID may itself be encrypted.
        const rawUid = portfolioType === 'hall'
          ? (record.UID ?? record.hall_UID ?? key)
          : (record.UID ?? key);
        const recordUid = await decryptDeep(rawUid);

        if (String(recordUid) === String(uidToUse)) {
          asset = record;
          break;
        }
      }
    }

    if (!asset) {
      closeTarget();
      showVenueStatusToast({
        type: 'info',
        title: 'Location unavailable',
        message: 'The selected venue could not be found.'
      });
      return;
    }

    // Decrypt the location field specifically at the moment it is needed.
    const rawLocationValue = portfolioType === 'hall'
      ? (
          asset.hallloclink ??
          asset.hallLocLink ??
          asset.hall_location_link ??
          asset.locationLink ??
          asset.hallloctext ??
          ''
        )
      : (
          asset.bankloclink ??
          asset.bankLocLink ??
          asset.bank_location_link ??
          asset.locationLink ??
          asset.bankloctext ??
          ''
        );

    const decryptedLocation = await decryptDeep(rawLocationValue);
    const link = safeText(decryptedLocation).trim();

    // Allow only HTTP(S) links.
    let parsedUrl = null;
    try {
      parsedUrl = new URL(link);
    } catch (_) {}

    if (!parsedUrl || !/^https?:$/i.test(parsedUrl.protocol)) {
      closeTarget();
      showVenueStatusToast({
        type: 'info',
        title: 'Location unavailable',
        message: 'No valid location link is available for this venue.'
      });
      return;
    }

    // Navigate the same tab that was opened by the user's click.
    if (targetTab && !targetTab.closed) {
      try {
        targetTab.opener = null;
        targetTab.location.replace(parsedUrl.href);
      } catch (_) {
        window.open(parsedUrl.href, '_blank', 'noopener,noreferrer');
        closeTarget();
      }
    } else {
      window.open(parsedUrl.href, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    closeTarget();
    console.error('Encrypted location redirect failed:', error);
    showVenueStatusToast({
      type: 'error',
      title: 'Location unavailable',
      message: 'The location could not be decrypted or opened.'
    });
  }
}

function initLocationButtonFlow() {
  const btn = document.getElementById('locationBtn');
  if (!btn) return;

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void handleLocationRedirect();
  });
}


async function bootstrapPortfolioPage() {
  const overlay = document.getElementById('loadingOverlay');
  overlay?.classList.remove('hidden');
  document.body.classList.add('is-loading');

  try {
    // Reveal the selected venue as soon as its main record is ready.
    // Calendar data is secondary and now hydrates in the background, so a large
    // protected calendar payload can never delay the portfolio's first paint.
    await initPortfolio();
    overlay?.classList.add('hidden');
    document.body.classList.remove('is-loading');
    void loadCalendarData(false).catch((error) => console.error('Calendar background load failed:', error));
  } catch (error) {
    console.error('Portfolio bootstrap failed:', error);
  } finally {
    overlay?.classList.add('hidden');
    document.body.classList.remove('is-loading');
  }
}

bootstrapPortfolioPage();
initEventTypeFlow();
initEventTimeFlow();
initCalendarMonthNav();
initUserDetailsFlow();
initConfirmationFlow();
initLocationButtonFlow();

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

/* PORTFOLIO_PERF_OPTIMIZATION */
(() => {
  if ('loading' in HTMLImageElement.prototype) return;
  const markLazy = () => document.querySelectorAll('img:not([loading])').forEach(img => {
    const n=(img.className+' '+(img.id||'')).toLowerCase();
    if (!/logo|icon|favicon|avatar/.test(n)) {
      img.loading='lazy';
      img.decoding='async';
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markLazy, {once:true});
  else markLazy();
})();

