// portfolio.js
// Browser-side only.

import { database } from "./firebaseconfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

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


function safeText(v) {
  return v === undefined || v === null ? '' : String(v);
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
    if (id) return `https://www.youtube.com/embed/${id}`;
    return raw;
  }

  // youtu.be link
  if (raw.includes('youtu.be/')) {
    const id = raw.split('youtu.be/')[1].split('?')[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
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



  // UI updates
  // feedback ke mutabiq heroTitle me “Luxury” fixed text remove karke sirf bankname show karna hai.
  if (heroTitleEl) heroTitleEl.innerHTML = `<span>${title}</span>`;
  if (heroLocationEl) heroLocationEl.textContent = 'Location: ' + (locationText || 'Premium Event District');

  if (banquetDescEl) banquetDescEl.innerText = desc || '—';
  if (specialisationDescEl) specialisationDescEl.innerText = specialisation || '—';

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

function syncSelectedPills() {
  const saved = getSavedEventTime();
  const pills = document.querySelectorAll('.time-pill');
  pills.forEach((p) => {
    const v = p.getAttribute('data-value');
    const selected = saved === v;
    p.classList.toggle('selected', selected);
    p.setAttribute('aria-checked', selected ? 'true' : 'false');
  });
}

function renderCalendarFor(calendarType) {
  const block = document.querySelector(`.calendar-block[data-calendar="${calendarType}"]`);
  if (!block) return;

  const daysContainer = block.querySelector('[data-calendar-grid] .calendar-days');
  if (!daysContainer) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const totalCells = 42;
  const todayISO = new Date();
  todayISO.setHours(0, 0, 0, 0);

  daysContainer.innerHTML = '';

  for (let cell = 0; cell < totalCells; cell++) {
    const dayNumber = cell - firstWeekday + 1;
    const isOut = dayNumber < 1 || dayNumber > daysInMonth;

    const dayBtn = document.createElement('div');
    dayBtn.className = 'cal-day';
    if (isOut) dayBtn.classList.add('is-out');

    const dayDate = new Date(year, month, Math.max(1, Math.min(daysInMonth, dayNumber || 1)));
    dayDate.setHours(0, 0, 0, 0);

    const isoStr = dayDate.toISOString().slice(0, 10);
    dayBtn.textContent = isOut ? '' : String(dayNumber);

    const saved = (() => {
      try {
        return localStorage.getItem(`calendarSelectedDate_${calendarType}`);
      } catch (e) {
        return null;
      }
    })();

    if (!isOut) {
      if (saved && saved === isoStr) dayBtn.classList.add('is-selected');
      if (isoStr === todayISO.toISOString().slice(0, 10)) dayBtn.classList.add('is-today');
    }

    dayBtn.addEventListener('click', () => {
      if (isOut) return;

      const all = block.querySelectorAll('.cal-day');
      all.forEach((x) => x.classList.remove('is-selected'));
      dayBtn.classList.add('is-selected');

      try {
        localStorage.setItem(`calendarSelectedDate_${calendarType}`, isoStr);
      } catch (e) {}

      try {
        localStorage.setItem('selectedEventTime', calendarType);
        localStorage.setItem('selectedEventDate', isoStr);
      } catch (e) {}

      try {
        openEventTypeModal();
      } catch (e) {}
    });

    daysContainer.appendChild(dayBtn);
  }
}

function syncCalendarVisibility(selectedTime) {
  const morning = document.getElementById('calendarMorning');
  const evening = document.getElementById('calendarEvening');
  const night = document.getElementById('calendarNight');

  const v = selectedTime || 'Morning';

  if (morning) morning.style.display = v === 'Morning' ? 'block' : 'none';
  if (evening) evening.style.display = v === 'Evening' ? 'block' : 'none';
  if (night) night.style.display = v === 'Night' ? 'block' : 'none';

  if (v === 'Morning') renderCalendarFor('Morning');
  if (v === 'Evening') renderCalendarFor('Evening');
  if (v === 'Night') renderCalendarFor('Night');
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

    if (!getSavedEventTime()) {
      openEventTimeModal();
    }
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

  try {
    const pending = localStorage.getItem('pendingOpenBookingFlow') === '1';
    if (pending && !getSavedEventTime()) {
      openEventTimeModal();
    }
  } catch (e) {}

  try {
    const saved = getSavedEventTime();
    const v = saved || 'Morning';
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
    okBtn.addEventListener('click', () => closeConfirmationModal());
  }
}

initPortfolio();
initEventTypeFlow();
initEventTimeFlow();
initUserDetailsFlow();
initConfirmationFlow();

