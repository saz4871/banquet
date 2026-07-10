// portfolio.js
// Browser-side only.

import { database } from "./firebaseconfig.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
let portfolioRedMarkedDates = new Set();

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

async function syncRedMarkedDates() {
    const portfolioType = getSavedPortfolioType();
    const uid = portfolioType === 'hall' ? getSavedHallUid() : getSavedBanquetUid();
    if (!uid) return;
    
    try {
        const rmRef = ref(database, `/redmarkdates/unique_redmark/${uid}`);
        const snap = await get(rmRef);
        const data = snap.val() || {};
        
        portfolioRedMarkedDates.clear();
        Object.values(data).forEach(v => {
            if (v?.reddate) {
                // reddate format "DD/MM/YYYY|CalendarType" ko extract karein
                const datePart = v.reddate.split('|')[0];
                const [dd, mm, yyyy] = datePart.split('/');
                portfolioRedMarkedDates.add(`${yyyy}-${mm}-${dd}`);
            }
        });
    } catch (e) {
        console.error("Red mark sync failed:", e);
    }
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

  // Goal: ytlink ko aise iframe src me convert karein ke content reliably play ho.
  // DB me aksar watch?v= wala link aata hai; isay embed format me convert karna safe hai.
  // (User feedback: previous embed logic fail na kare—embed link banate hi play hota hai.)
  if (raw.includes('youtube.com/embed/')) {
    return raw;
  }

  // watch link: extract video id
  if (raw.includes('watch?v=')) {
    const id = raw.split('watch?v=')[1].split('&')[0];
    if (id) {
      // Force max quality if available.
      // Note: YouTube may still override based on network/device.
      return `https://www.youtube.com/embed/${id}?vq=hd1080&rel=0`;
    }
    return raw;
  }

  // youtu.be link
  if (raw.includes('youtu.be/')) {
    const id = raw.split('youtu.be/')[1].split('?')[0];
    if (id) {
      return `https://www.youtube.com/embed/${id}?vq=hd1080&rel=0`;
    }
    return raw;
  }

  // Agar already koi other embeddable/URL ho to as-is return
  return raw;
}




async function fetchBanquetByUid(uid) {
  if (!uid) return null;

  const snapshot = await get(ref(database, 'banquet/unique_bank'));
  const data = snapshot.val() || {};

  // match by either it.UID or key itself
  for (const k of Object.keys(data)) {
    const it = data[k] || {};
    const itUid = it.UID ?? k;
    if (String(itUid) === String(uid)) {
      return { ...it, uid: itUid };
    }
  }

  return null;
}

export async function initPortfolio() {
  const portfolioType = getSavedPortfolioType();
  const banquetUid = getSavedBanquetUid();
  const hallUid = getSavedHallUid();

  // ---- Views increment (10 sec open) ----
  // Requirement: agar banquet/hall page 10 seconds se zyada open rahe,
  // to us asset ke "views" column ko +1 karo.
  // Anti-multiple-increment (same browser) ke liye localStorage guard.
  const uidToUseForViews = portfolioType === 'hall' ? hallUid : banquetUid;
  if (uidToUseForViews) {
    const storageKey = `views_incr_done_${portfolioType}_${uidToUseForViews}`;
    try {
      if (!localStorage.getItem(storageKey)) {
        setTimeout(() => {
          try {
            // If already marked in meantime, skip.
            if (localStorage.getItem(storageKey)) return;
            localStorage.setItem(storageKey, '1');

            const assetPath =
              portfolioType === 'hall'
                ? `hall/unique_hall/${uidToUseForViews}`
                : `banquet/unique_bank/${uidToUseForViews}`;

            // Increment safely: get current value then set (simpler; if you want strict atomic increment use server transaction)
            import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js')
              .then(async ({ ref, get, set }) => {
                const assetRef = ref(database, assetPath);
                const snap = await get(assetRef);
                const data = snap.val() || {};
                const curViews = Number(data.views ?? data.Views ?? 0) || 0;
                await set(assetRef, { ...data, views: curViews + 1 });
              })
              .catch(() => {
                // no-op
              });
          } catch (e) {
            // ignore
          }
        }, 10000);
      }
    } catch (e) {
      // ignore
    }
  }


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
    if (portfolioType === 'hall') {
      // fetch hall record from hall/unique_hall
      const snapshot = await get(ref(database, 'hall/unique_hall'));
      const data = snapshot.val() || {};
      for (const k of Object.keys(data)) {
        const it = data[k] || {};
        const itUid = it.UID ?? it.hall_UID ?? k;
        if (String(itUid) === String(uidToUse)) {
          asset = { ...it, uid: itUid };
          break;
        }
      }
    } else {
      asset = await fetchBanquetByUid(uidToUse);
    }
  } catch (e) {
    asset = null;
  }

  if (!asset) {
    if (banquetDescEl) banquetDescEl.innerText = portfolioType === 'hall' ? 'Hall details not found.' : 'Banquet details not found.';
    if (specialisationDescEl) specialisationDescEl.innerText = '-';
    if (viewSeasonalEl) viewSeasonalEl.innerText = 'Rs. 0';
    if (viewStandardEl) viewStandardEl.innerText = 'Rs. 0';
    if (cinematicBox) cinematicBox.style.display = 'none';
    return;
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
    const rawImgs = [asset.img, asset.img1, asset.img2, asset.img3, asset.img4];
    const imgs = rawImgs
      .map((x) => safeText(x).trim())
      .filter((x) => x);

    heroBgGalleryEl.innerHTML = '';

    if (imgs.length) {
      imgs.forEach((src) => {
        const el = document.createElement('img');
        el.className = 'hero-bg-img';
        el.loading = 'lazy';
        el.alt = portfolioType === 'hall' ? 'Hall image' : 'Banquet image';
        el.src = src;
        heroBgGalleryEl.appendChild(el);
      });

      // For click-to-view UI
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
        applyVisibleImage();

        const overlay = document.getElementById('heroImageModalOverlay');
        const modalImg = document.getElementById('heroImageModalImg');
        const prevBtn = document.getElementById('heroImageModalPrevBtn');
        const nextBtn = document.getElementById('heroImageModalNextBtn');
        const closeBtn = document.getElementById('heroImageModalCloseX');

        if (!overlay || !modalImg) {

          // fallback: just scroll
          const heroSlider = document.querySelector('.hero-slider-container');
          if (heroSlider) heroSlider.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        const setModalImage = () => {
          modalImg.src = imgs[currentIdx] || '';
        };

        setModalImage();

        // Ensure prev/next buttons are shown/hidden based on number of images
        if (prevBtn) prevBtn.style.display = imgs.length > 1 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = imgs.length > 1 ? 'flex' : 'none';

        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');


        const onPrev = () => {
          currentIdx = (currentIdx - 1 + imgs.length) % imgs.length;
          // Only change modal image; keep hero cover images fixed.
          setModalImage();
        };

        const onNext = () => {
          currentIdx = (currentIdx + 1) % imgs.length;
          // Only change modal image; keep hero cover images fixed.
          setModalImage();
        };

        // Mobile swipe support: swipe left => next, swipe right => prev
        let touchStartX = null;
        let touchStartY = null;
        const onTouchStart = (ev) => {
          if (!ev || !ev.touches || !ev.touches[0]) return;
          touchStartX = ev.touches[0].clientX;
          touchStartY = ev.touches[0].clientY;
        };
        const onTouchEnd = (ev) => {
          if (!touchStartX && touchStartX !== 0) return;
          if (!ev || !ev.changedTouches || !ev.changedTouches[0]) return;

          const endX = ev.changedTouches[0].clientX;
          const endY = ev.changedTouches[0].clientY;

          const dx = endX - touchStartX;
          const dy = endY - touchStartY;

          // Ignore mostly vertical swipes
          if (Math.abs(dy) > Math.abs(dx)) return;

          const TH = 45; // swipe threshold in px
          if (dx <= -TH) {
            onNext();
          } else if (dx >= TH) {
            onPrev();
          }

          touchStartX = null;
          touchStartY = null;
        };




        // Remove previous handlers by cloning if needed (simple approach: overwrite by setting once)
        if (prevBtn) {
          prevBtn.onclick = null;
          prevBtn.onclick = (e) => { e && e.stopPropagation && e.stopPropagation(); onPrev(); };
        }
        if (nextBtn) {
          nextBtn.onclick = null;
          nextBtn.onclick = (e) => { e && e.stopPropagation && e.stopPropagation(); onNext(); };
        }
        if (closeBtn) {
          closeBtn.onclick = null;
          closeBtn.onclick = (e) => {
            e && e.stopPropagation && e.stopPropagation();
            overlay.style.display = 'none';
            overlay.setAttribute('aria-hidden', 'true');
          };
        }

        overlay.onclick = (e) => {
          if (e.target === overlay) {
            overlay.style.display = 'none';
            overlay.setAttribute('aria-hidden', 'true');
          }
        };
      };


      // Make controls work if present
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

      // Click anywhere on hero background to open image view
      heroBgGalleryEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openImageView();
      });

      // Also click on hero text to open
      const heroText = document.querySelector('.hero-text');
      if (heroText) {
        heroText.addEventListener('click', (e) => {
          e.stopPropagation();
          openImageView();
        });
      }

      // Initialize first
      applyVisibleImage();
    }
  }


  // Cinematic (YouTube video wala section)
  // DB column: ytlink (Banquet + Hall dono me expected)
  if (cinematicBox && videoIframe) {
    const videoUrlFromDb = safeText(asset.ytlink || asset.YTlink || asset.ytLink || asset.video || '');
    const embedUrl = toEmbedUrl(videoUrlFromDb);

    if (embedUrl) {
      videoIframe.src = embedUrl;
      cinematicBox.style.display = 'block';
    } else {
      cinematicBox.style.display = 'none';
      videoIframe.src = '';
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


function openEventTimeModal() {

  const overlay = document.getElementById('eventTimeModalOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
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

function monthKeyForState(d) {
  if (!d) return '';
  const yy = d.getFullYear();
  const mm = d.getMonth();
  return `${yy}-${mm}`;
}

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

  let bookedSet = new Set();
  let approvedSet = new Set();
  let redMarkedSet = new Set(); // Naya Set Red Marks ke liye

  try {
    const savedPortfolioType = getSavedPortfolioType();
    const selectedAssetUid = savedPortfolioType === 'hall' ? getSavedHallUid() : getSavedBanquetUid();

    if (selectedAssetUid) {
      // 1. Existing Booked/Approved Data
      const snap = await get(ref(database, 'user/unique_user'));
      const all = snap.val() || {};

      for (const k of Object.keys(all)) {
        const it = all[k] || {};
        const dbVenueId = it.venueId ?? it.venueID;
        if (dbVenueId && String(dbVenueId) !== String(selectedAssetUid)) continue;
        if (!it.status || !it.event_time) continue;

        const dbEventTime = String(it.event_time).trim().toLowerCase();
        if (dbEventTime !== String(calendarType).trim().toLowerCase()) continue;

        const tdRaw = it.targetdate ? String(it.targetdate).trim() : '';
        if (!tdRaw) continue;

        let tdIso = tdRaw;
        const dmMatch = tdRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (dmMatch) tdIso = `${dmMatch[3]}-${dmMatch[2]}-${dmMatch[1]}`;
        
        if (String(it.status).toLowerCase() === 'pending') bookedSet.add(tdIso);
        else if (String(it.status).toLowerCase() === 'approved') approvedSet.add(tdIso);
      }

      // 2. Naya: Vendor Red Marks Fetch
      // reddate format: "DD/MM/YYYY|CalendarType"
      const rmSnap = await get(ref(database, `/redmarkdates/unique_redmark/${selectedAssetUid}`));
      const rmData = rmSnap.val() || {};
      Object.values(rmData).forEach(v => {
          if (v?.reddate) {
              const parts = String(v.reddate).split('|');
              const datePart = parts[0];
              const calPart = (parts[1] || '').trim();

              // Only mark red for the currently rendered calendarType
              if (String(calPart).trim().toLowerCase() !== String(calendarType).trim().toLowerCase()) {
                return;
              }

              const [dd, mm, yyyy] = datePart.split('/');
              if (dd && mm && yyyy) redMarkedSet.add(`${yyyy}-${mm}-${dd}`);
          }
      });
    }
  } catch (e) {
    console.warn('Failed to fetch calendar data:', e);
  }

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

  daysContainer.innerHTML = '';

  // Loop ke andar ka code yahan se replace karein:
for (let cell = 0; cell < 42; cell++) {
    const dayNumber = cell - firstWeekday + 1;
    const isOut = dayNumber < 1 || dayNumber > daysInMonth;
    const dayBtn = document.createElement('div');
    dayBtn.className = 'cal-day';
    if (isOut) dayBtn.classList.add('is-out');

    if (!isOut) {
        // Sirf EK BAAR declare karein
        const isoStr = toLocalISODate(new Date(year, month, dayNumber));
        
        dayBtn.textContent = String(dayNumber);
        if (isoStr === todayKey) dayBtn.classList.add('is-today');

        // Priority Logic (Ab koi conflict nahi hoga)
        if (redMarkedSet.has(isoStr)) {
            dayBtn.classList.add('is-redmarked');
            // Red marked ko click se bachane ke liye click logic mein check hai
        } else if (approvedSet.has(isoStr)) {
            dayBtn.classList.add('is-approved');
        } else if (bookedSet.has(isoStr)) {
            dayBtn.classList.add('is-booked-by-other');
            dayBtn.setAttribute('aria-disabled', 'true');
        }
    }

    dayBtn.addEventListener('click', () => {
        if (isOut) return;

        const isoStr = toLocalISODate(new Date(year, month, dayNumber));

        // Red marked => Approved jaisa behavior + toast
        if (dayBtn.classList.contains('is-redmarked')) {
            showVenueStatusToast({
              type: 'approved',
              title: 'Date Fully Reserved',
              message: 'This date is fully reserved for this time.'
            });
            return;
        }

        // Approved => toast
        if (dayBtn.classList.contains('is-approved')) {
            showVenueStatusToast({ type: 'approved', title: 'Date Fully Reserved', message: 'This date is fully reserved for this time.' });
            return;
        }

        // Booked by other => treat as disabled (should already be not clickable, but keep safe)
        if (dayBtn.classList.contains('is-booked-by-other')) {
            showVenueStatusToast({ type: 'pending', title: 'Not Available', message: 'This date is already booked by another client.' });
            return;
        }

        // Non-red date => exact booking flow (EventType -> UserDetails -> Confirmation -> Success)
        try {
          localStorage.setItem('selectedEventDate', isoStr);
          // sync time with the calendar pane being clicked
          localStorage.setItem('selectedEventTime', calendarType);
          localStorage.setItem('eventTime', calendarType);
        } catch (e) {}

        // ensure confirmation modal shows date/time correctly
        // open flow
        try { closeEventTimeModal && closeEventTimeModal(); } catch (e) {}
        try { closeUserDetailsModal && closeUserDetailsModal(); } catch (e) {}
        try { closeConfirmationModal && closeConfirmationModal(); } catch (e) {}
        openEventTypeModal();
    });
    daysContainer.appendChild(dayBtn);
}
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
      try {
        await renderCalendarFor(calType);
      } catch (e) {}
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

  // Initial render
  renderCalendarFor(v).catch(() => {});

  // Auto refresh marks every 3 seconds (old behavior back)
  // Avoid multiple intervals
  try {
    if (window.__calendarAutoRefreshTimer) {
      clearInterval(window.__calendarAutoRefreshTimer);
    }
  } catch (e) {}

  // Capture the latest visible calendar type in the interval via closure variable.
  // Also update immediately when user switches time.
  window.__calendarAutoRefreshTimer = setInterval(() => {
    const currentTime = (function () {
      try {
        return localStorage.getItem('eventTime') || v || 'Morning';
      } catch (e) {
        return v || 'Morning';
      }
    })();

    renderCalendarFor(currentTime).catch(() => {});
  }, 3000);
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
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
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

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeEventTypeModal();
  });

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

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeEventTimeModal();
  });

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

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      setError('');
      closeUserDetailsModal();
    }
  });

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
  const overlay = document.getElementById('confirmationModalOverlay');
  if (!overlay) return;

  const closeX = document.getElementById('confirmationModalCloseX');
  if (closeX) {
    closeX.addEventListener('click', () => closeConfirmationModal());
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeConfirmationModal();
  });

  const okBtn = document.getElementById('confirmationOkBtn');
  if (okBtn) {
    okBtn.addEventListener('click', async () => {
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


        // Incrementing UID style: 0001, 0002, 0003...
        // Use Firebase /user/currentid as the source to reduce duplication across devices.
        // (Not a transaction; if you expect very high concurrency, we should switch to a transaction.)
        const LIMIT = 999999;
        let user_UID = '';
        try {
          const currentIdSnap = await get(ref(database, 'user/currentid'));
          const currentIdRaw = currentIdSnap.exists() ? currentIdSnap.val() : 0;
          const currentId = Number(currentIdRaw) || 0;

          // Keep UID inside configured limit range, but also make it non-sequential by using randomness.
          // Requirement: currentid ki range ke andar random UID generate karna.
          const rangeSeed = currentId % LIMIT;
          const randomWithin = Math.floor(Math.random() * (LIMIT || 1));
          const nextId = ((rangeSeed + randomWithin) % LIMIT) + 1;

          // update so next request uses next key
          await set(ref(database, 'user/currentid'), nextId);

          user_UID = String(nextId).padStart(4, '0');

        } catch (e) {
          // Fallback: local counter
          const nextIdx = (() => {
            try {
              const cur = parseInt(localStorage.getItem('bookingUIDCounter') || '0', 10);
              const n = (Number.isFinite(cur) ? cur + 1 : 1);
              localStorage.setItem('bookingUIDCounter', String(n));
              return n;
            } catch (e) {
              return 1;
            }
          })();
          user_UID = String(nextIdx).padStart(4, '0');
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

        // Save to: Firebase(/user/unique_user/) using the random id as key
        // (Firebase RTDB path: /user/unique_user/{user_UID})
        const userRef = ref(database, `user/unique_user/${user_UID}`);
        await set(userRef, payload);

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
        window.setTimeout(() => showSuccessPopup(), 120);
      } catch (e) {}
    });
  }
}









// LOCATION button: venue location link based on selected banquet/hall
async function handleLocationRedirect() {
  try {
    const portfolioType = getSavedPortfolioType();
    const banquetUid = getSavedBanquetUid();
    const hallUid = getSavedHallUid();

    const uidToUse = portfolioType === 'hall' ? hallUid : banquetUid;
    if (!uidToUse) return;

    if (portfolioType === 'hall') {
      // hall/unique_hall/{uid}
      const snap = await get(ref(database, 'hall/unique_hall'));
      const data = snap.val() || {};
      let asset = null;
      for (const k of Object.keys(data)) {
        const it = data[k] || {};
        const itUid = it.UID ?? it.hall_UID ?? k;
        if (String(itUid) === String(uidToUse)) { asset = { ...it, uid: itUid }; break; }
      }
      const link = safeText(asset?.hallloclink || asset?.hallLocLink || asset?.hall_location_link || asset?.locationLink || asset?.hallloctext || '').trim();
      if (link && link.startsWith('http')) { window.location.href = link; return; }
      if (link) { window.open(link, '_blank'); return; }
    } else {
      // banquet/unique_bank/{uid}
      const snapshot = await get(ref(database, 'banquet/unique_bank'));
      const data = snapshot.val() || {};
      let asset = null;
      for (const k of Object.keys(data)) {
        const it = data[k] || {};
        const itUid = it.UID ?? k;
        if (String(itUid) === String(uidToUse)) { asset = { ...it, uid: itUid }; break; }
      }
      const link = safeText(asset?.bankloclink || asset?.bankLocLink || asset?.bank_location_link || asset?.locationLink || asset?.bankloctext || '').trim();
      if (link && link.startsWith('http')) { window.location.href = link; return; }
      if (link) { window.open(link, '_blank'); return; }
    }

    // fallback: scroll to hero location text
    const heroLocationEl = document.getElementById('heroLocationText');
    if (heroLocationEl) heroLocationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) {
    console.error('Location redirect failed:', e);
  }
}

function initLocationButtonFlow() {
  const btn = document.getElementById('locationBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLocationRedirect();
  });
}


initPortfolio();
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