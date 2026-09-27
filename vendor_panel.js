import { database } from "./firebaseconfig.js";
import { decryptDeep, encryptDeep, stablePathKey } from "./encryption/encryption.js";
import { ref, get, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getCached, hasCached, subscribeCached, invalidateCached, seedCached, peekCached } from './data_cache.js';
import { getPortfolioViewCount, subscribePortfolioViewCount } from './view_tracker.js';

const db = database;


const overlay = document.getElementById("vendorLoginOverlay");
const verifyForm = document.getElementById("verifyForm");
const messageEl = document.getElementById("message");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const logoutBtn = document.getElementById("logoutBtn");
const vendorPasswordToggle = document.getElementById("vendorPasswordToggle");
const vendorPasswordInput = document.getElementById("vendorPassword");
const verifyBtn = document.getElementById("verifyBtn");

const pageTitle = document.getElementById("pageTitle");
const statusPill = document.getElementById("statusPill");
const viewContainer = document.getElementById("viewContainer");
let __vendorViewUnsubs = [];
let __vendorViewCountState = new Map();
function clearVendorViewListeners() {
  __vendorViewUnsubs.forEach((unsub) => { try { unsub?.(); } catch (_) {} });
  __vendorViewUnsubs = [];
  __vendorViewCountState = new Map();
}
function updateVendorViewsCard() {
  const total = Array.from(__vendorViewCountState.values()).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const el = document.getElementById('vendorViewsCount');
  if (el) el.textContent = String(total);
}
async function subscribeVendorViewCounters(results) {
  clearVendorViewListeners();
  const sourceType = String(window.__vendor_source || '').toLowerCase() === 'hall' ? 'hall' : 'banquet';
  for (let index = 0; index < results.length; index += 1) {
    const r = results[index];
    const uid = r?.hall_UID ?? r?.UID ?? r?.uid;
    if (!uid) continue;
    const fallback = Number(r?.views ?? r?.Views ?? 0) || 0;
    __vendorViewCountState.set(`${sourceType}:${uid}`, fallback);
    const unsub = await subscribePortfolioViewCount({
      portfolioType: sourceType,
      uid,
      fallback,
      onChange: (value) => {
        __vendorViewCountState.set(`${sourceType}:${uid}`, Number(value) || 0);
        updateVendorViewsCard();
      }
    });
    if (typeof unsub === 'function') __vendorViewUnsubs.push(unsub);
  }
  updateVendorViewsCard();
}

const navButtons = Array.from(document.querySelectorAll(".nav__item[data-view]"));
const appLoadingOverlay = document.getElementById('appLoadingOverlay');
function setAppLoading(show, text = 'Preparing your workspace and syncing the latest data…') {
  if (!appLoadingOverlay) return;
  const msg = appLoadingOverlay.querySelector('.app-loading-text');
  if (msg) msg.textContent = text;
  appLoadingOverlay.classList.toggle('is-visible', !!show);
  appLoadingOverlay.setAttribute('aria-hidden', show ? 'false' : 'true');
}


void Promise.all([getCached('/3/4'), getCached('/12/13'), getCached('/9/11')]).catch(e => console.warn('[Vendor cache warm]', e));

function setOverlayHidden(hidden) {
  overlay.setAttribute("aria-hidden", hidden ? "true" : "false");
  
  // Add this line to prevent focus when hidden
  overlay.inert = hidden; 
  
  if (hidden) {
    overlay.style.display = "none";
  } else {
    overlay.style.display = "grid";
  }
}

vendorPasswordToggle?.addEventListener("click", () => {
  if (!vendorPasswordInput) return;
  const show = vendorPasswordInput.type === "password";
  vendorPasswordInput.type = show ? "text" : "password";
  vendorPasswordToggle.setAttribute("aria-pressed", String(show));
  vendorPasswordToggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
  vendorPasswordToggle.innerHTML = `<i class="fa-regular fa-eye${show ? '-slash' : ''}"></i>`;
});

function setMessage(text, isError = false) {
  messageEl.textContent = text || "";
  messageEl.style.color = isError ? "rgba(239, 68, 68, 0.95)" : "rgba(34, 197, 94, 0.95)";
}

function setStatus(text) {
  if (!statusPill) return;
  statusPill.textContent = text;
}

function setActiveView(viewKey) {
  navButtons.forEach((b) => {
    b.classList.toggle("is-active", b.dataset.view === viewKey);
  });
}

function renderView(viewKey) {
  clearVendorViewListeners();
  try { window.__vendor_last_view = viewKey; } catch (e) {}
  setActiveView(viewKey);

  // Cached views switch instantly; only the first cold load shows Loading.
  const warm = (viewKey === 'vendor-spreadsheet' && hasCached('/9/11')) ||
               (viewKey === 'vendor-rate' && (hasCached('/3/4') || hasCached('/12/13'))) ||
               (viewKey === 'vendor-management' && (hasCached('/3/4') || hasCached('/12/13')));
  setStatus(warm ? 'Live' : 'Loading...');
  viewContainer.innerHTML = '';

  // Login ke waqt set kiya gaya name global variable se access hoga
  const name = window.__vendor_name || "Vendor";

  // IMPORTANT: Do not set Ready() immediately here.
  // Some views render sync, but others do async work; setting Ready() early makes it feel like "Loading" never ends.




  if (viewKey === "vendor-management") {
    pageTitle.textContent = `Welcome ${name}`;

    // NOTE: Calendar + availability/red/yellow logic remove kar di gayi hai.
    // Vendor Management me sirf your banquet/hall cards render honge.

    const vendorId = window.__vendor_id;

    // Vendor stats cards wapas (Pending/Approved/Views/Expiry)
    (async () => {
      try {
        // Start state: user ko loading clearly dikhni chahiye until first DOM render complete.
        setStatus('Loading...');
        // Home-like banquet cards
        const cardsWrapStyle = 'padding-top:16px;';

        // --- Live Pending Counter (from /9/11 by venueID + status) ---
        // PERFORMANCE: Avoid blocking UI. We fetch pending in background.
        const vendorAssignedVenueUid = String(window.__vendor_id ?? '').trim();

        // Ensure only 1 listener at a time
        if (window.__vendorPendingUnsub && typeof window.__vendorPendingUnsub === "function") {
          try { window.__vendorPendingUnsub(); } catch (e) {}
          window.__vendorPendingUnsub = null;
        }


            const normalizeStatus = (s) => String(s ?? "").toLowerCase().trim();



        const updateVendorPendingCount = (count) => {
          const el = document.getElementById("vendorPendingCardCount");
          if (!el) return;
          el.textContent = String(count ?? 0);
        };

        // Update quick-cards numbers by index:
        // cardish[0]=Pending, cardish[2]=Approved
        const updateVendorQuickCardValueByIndex = (cardIndex, count) => {
          const quickCards = viewContainer?.querySelector?.('.quick-cards');
          if (!quickCards) return;
          const cardEls = quickCards.querySelectorAll('.cardish');
          if (!cardEls || !cardEls[cardIndex]) return;
          const valueEl = cardEls[cardIndex].querySelector('div[style*="font-size:22px"]');
          if (!valueEl) return;
          valueEl.textContent = String(count ?? 0);
        };

        const updateVendorPendingQuickCard = (count) => {
          updateVendorQuickCardValueByIndex(0, count);
        };

        const updateVendorApprovedQuickCard = (count) => {
          updateVendorQuickCardValueByIndex(2, count);
        };

        // DOM timing issue: realtime callback DOM mount se pehle run ho sakta hai.
        // Is helper ko use karke ham latest values ko repaint karenge jab DOM ready ho.
        const repaintQuickCardsIfPresent = () => {
          updateVendorPendingQuickCard(realtimePendingCount);
          updateVendorApprovedQuickCard(realtimeApprovedCount);
        };

        // Start with 0 temporarily; but realtime listener will repaint quick-cards immediately after mount.
        // (No separate fallback rendering for Pending/Approved will override realtime values.)
        updateVendorPendingCount(0);


        // We will store the realtime count so quick-cards render the SAME value.
        let realtimePendingCount = 0;
        let realtimeApprovedCount = 0;


        const { onValue } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js");
        const pendingRef = ref(db, "/9/11");

        // NOTE: This pending counter currently does full-table scanning.
        // Spreadsheet view ko fix karna priority hai (big payload). Pending view keep as-is to avoid breaking realtime logic.
// Avoid realtime issues when navigating back/forward: ignore callbacks while page is in bfcache.
let __vendorPageHidden = false;
window.addEventListener('pagehide', () => { __vendorPageHidden = true; });
window.addEventListener('pageshow', (e) => {
  // If returning from bfcache, force a hard refresh of listeners by re-rendering the view.
  __vendorPageHidden = false;
  try {
    const persisted = e?.persisted;
    if (persisted && window.__vendor_authed && window.__vendor_last_view) {
      setTimeout(() => {
        try { renderView(window.__vendor_last_view); } catch (_) {}
      }, 50);
    }
  } catch (_) {}
});

window.__vendorPendingUnsub = onValue(pendingRef, async (snap) => {
  if (__vendorPageHidden) return;
  try {
    const data = snap.exists() ? (await decryptDeep(snap.val() || {})) : {};
    let count = 0;
    let approvedCount = 0; // Naya variable approved count ke liye

    for (const [key, r] of Object.entries(data)) {
      if (!r) continue;

      const venueId = r.venueId ?? r.venue_id ?? r.selectedAssetUid ?? r.assetUid ?? r.venueID ?? "";
      const status = String(r.status ?? r.approval_status ?? "pending").toLowerCase().trim();

      if (String(venueId) === String(vendorAssignedVenueUid)) {
        // Pending check
        if (status === "pending" || status.includes("pending") || status === "awaiting") {
          count++;
        }
        // Approved check
        else if (status === "approved" || status.includes("approved")) {
          approvedCount++;
        }
      }
    }



    realtimePendingCount = count;
    realtimeApprovedCount = approvedCount;

    // Update UI
    updateVendorPendingCount(count);

    // Defer quick-cards repaint so that DOM is ready (fixes Approved card not reflecting recent count).
    try {
      requestAnimationFrame(() => {
        repaintQuickCardsIfPresent();
      });
    } catch (e) {
      repaintQuickCardsIfPresent();
    }
    
  } catch (e) {
    console.error("Vendor pending counter error:", e);
    realtimePendingCount = 0;
    realtimeApprovedCount = 0;
    updateVendorPendingCount(0);
    try {
      repaintQuickCardsIfPresent();
    } catch (_) {}
  }
});



        const pickCover = (item) =>
          item.img || item.cover || (Array.isArray(item.imagesStack) ? item.imagesStack[0] : '') || '';

        const formatRs = (v) => {
          const s = String(v ?? '').trim();
          if (!s) return 'Rs. 0';
          return 'Rs. ' + s;
        };

        const computePrice = (item) => {
          const priceRaw =
            item.standardrate ||
            item.standardcost ||
            item.seasoncost ||
            item.seasonalPrice ||
            item.randomPrice ||
            '0';
          return formatRs(priceRaw);
        };

        const collectTitle = (item) =>
          item.title || item.hallname || item.bankname || item.name || item.uid || item.UID || '';

        const collectTag = (item) =>
          item.specialisation ||
          item.specialization ||
          item.tagline ||
          item.tag ||
          item.banktagline ||
          item.detail ||
          item.locationText ||
          '';

        const collectLocation = (item) => {
          return (item.locationText || item.location || item.bankloctext || item.Location || '').trim();
        };

        const cardHtml = (item) => {
          const cover = pickCover(item);
          const title = collectTitle(item);
          const tag = collectTag(item).slice(0, 160);
          const location = collectLocation(item);
          const price = computePrice(item).replace('Rs. ', '').trim();
          const capacity = String(item.capacity || item.Capacity || item.people_capacity || item.peopleCapacity || item.people || item.capacityText || '').trim();
          const uid = item.UID || item.uid || item.hall_UID || '';
          const typeLabel = (item.hall_UID || item.hallname || item.hallName) ? 'HALL' : 'BANQUET';
          return `
            <div class="vendor-venue-card" role="button" tabindex="0" aria-label="Open ${typeLabel.toLowerCase()} ${title}" data-banquet-uid="${uid}">
              <div class="vendor-venue-card__media">
                ${cover ? `<img src="${cover}" alt="${typeLabel} cover" loading="eager" />` : `<div class="vendor-venue-card__empty"><i class="fa-regular fa-image"></i><span>No Image</span></div>`}
                <div class="vendor-venue-card__shade"></div>
                <div class="vendor-venue-card__badge"><i class="fa-solid fa-crown"></i> ${typeLabel}</div>
                <div class="vendor-venue-card__uid">UID ${uid || '—'}</div>
              </div>
              <div class="vendor-venue-card__body">
                <div class="vendor-venue-card__eyebrow">YOUR ASSIGNED VENUE</div>
                <div class="vendor-venue-card__title">${title}</div>
                <div class="vendor-venue-card__location"><i class="fa-solid fa-location-dot"></i><span>${location || 'Location not added'}</span></div>
                <div class="vendor-venue-card__meta">
                  <div><small>RATE</small><strong>Rs. ${price || '0'}</strong></div>
                  <div><small>CAPACITY</small><strong>${capacity || '—'}</strong><em>people</em></div>
                </div>
                <div class="vendor-venue-card__cta"><span>Open portfolio</span><i class="fa-solid fa-arrow-up-right-from-square"></i></div>
              </div>
            </div>
          `;
        };

        const results = [];
        const banquetRecords = [];



        // Banquet
        const banquetData = await getCached('/3/4');
        if (banquetData && Object.keys(banquetData).length) {
          const data = banquetData;
          for (const [id, record] of Object.entries(data)) {
            if (!record) continue;
            const isMatch = String(record.UID ?? id) === String(vendorId);
            if (isMatch) results.push(record);
          }
        }

        // Hall
        const hallData = await getCached('/12/13');
        if (hallData && Object.keys(hallData).length) {
          const data = hallData;
          for (const [id, record] of Object.entries(data)) {
            if (!record) continue;
            const isMatch = String(record.hall_UID ?? record.UID ?? id) === String(vendorId);
            if (isMatch) results.push(record);
          }
        }

        // Stats (pending/approved/views/expiry) - calendar removed, but stats depend on records
        const now = new Date();
        let pending = 0;
        let approved = 0;

        // realtime-synced counters (if realtime listener ran)
        // let realtimeApprovedCount = 0; // declared already in realtime listener scope


        let minDays = Infinity;
        let minExpireDate = '';
        let viewsTotal = 0;

        // Track spreadsheet-style status counts too (if /9/11 has status)
        // PERFORMANCE NOTE:
        // - We do NOT re-fetch /9/11 here.
        // - But we DO compute spreadsheetPending/Approved/Deny from whatever status fields exist on `results` records.
        //   (Some records may already carry status/approval_status.)
        let spreadsheetPending = 0;
        let spreadsheetApproved = 0;
        let spreadsheetDeny = 0;



        const viewCounts = await Promise.all(results.map((r) => {
          const uid = r?.hall_UID ?? r?.UID ?? r?.uid;
          const type = String(window.__vendor_source || '').toLowerCase() === 'hall' ? 'hall' : 'banquet';
          return getPortfolioViewCount({ portfolioType: type, uid, fallback: r?.views ?? r?.Views ?? 0 });
        }));

        // Keep the Views card live; no vendor-panel refresh is required after a qualified portfolio visit.
        void subscribeVendorViewCounters(results);

        for (let index = 0; index < results.length; index += 1) {
          const r = results[index];
          const viewsNum = Number(viewCounts[index]);
          if (Number.isFinite(viewsNum)) viewsTotal += viewsNum;

          // 1) Spreadsheet-style approval status (Approve/Deny) for pending card count alignment
          const rawStatus = r?.status ?? r?.approval_status;
          const xStatus = String(rawStatus ?? '').toLowerCase();
          if (xStatus) {
            if (xStatus.includes('approved') || xStatus === 'approved') spreadsheetApproved++;
            else if (xStatus.includes('deny') || xStatus.includes('denied') || xStatus === 'deny' || xStatus === 'denied') spreadsheetDeny++;
            else if (xStatus.includes('pending') || xStatus === 'pending' || xStatus === 'awaiting' || xStatus === 'awaiting validation') spreadsheetPending++;
            else spreadsheetPending++;
          }

          const rawCountdown = r?.countdowndays ?? r?.countdownDays;
          const countdownDays = rawCountdown !== undefined ? Number(rawCountdown) : NaN;

          if (Number.isFinite(countdownDays)) {
            minDays = Math.min(minDays, countdownDays);
            const rawExpire = String(r?.expiredate ?? r?.expireDate ?? '').trim();
            if (rawExpire && (!minExpireDate || rawExpire < minExpireDate)) minExpireDate = rawExpire.slice(0, 10);
            if (countdownDays < 0) approved++;
            else pending++;
            continue;
          }

          const exp = r?.expiredate ? new Date(r.expiredate) : null;
          if (!exp || Number.isNaN(exp.getTime())) continue;

          const diffMs = exp.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          minDays = Math.min(minDays, diffDays);
          const rawExpire = String(r?.expiredate ?? r?.expireDate ?? '').trim();
          if (rawExpire && (!minExpireDate || rawExpire < minExpireDate)) minExpireDate = rawExpire.slice(0, 10);

          if (diffDays < 0) approved++;
          else pending++;
        }

        if (!results.length) {
          return;
        }
        if (!Number.isFinite(minDays)) minDays = 0;

        const banquetCards = results
          .filter((it) => it)
          .map((it) => cardHtml(it))
          .join('');

        // Realtime quick-cards should be driven ONLY by realtime listener.
        // pending/approved fallback is removed to avoid showing default values.
        const finalPending = realtimePendingCount;
        const finalApproved = realtimeApprovedCount;

        // Ensure Pending quick-card consistent with realtime pending counter (or 0 until first listener tick)
        updateVendorPendingQuickCard(finalPending);
        updateVendorPendingCount(finalPending);







        const quickCardsHtml = (pendingCount, viewsCount, approvedCount, minDaysLeft, expiryDate) => {
          const pending = String(pendingCount ?? 0);
          const views = String(viewsCount ?? 0);
          const approved = String(approvedCount ?? 0);
          const expiryText = Number.isFinite(minDaysLeft) ? String(minDaysLeft) : '0';
          const expiryDateText = String(minExpireDate || '—');

          return `
            <div class="quick-cards" style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:0 16px;">
              <div class="cardish" style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(251,113,133,0.25);border-radius:16px;">
                <div style="font-weight:900;color:rgba(229,231,235,0.95);">Pending</div>
                <div style="font-size:22px;font-weight:1000;color:rgba(251,191,36,0.95);margin-top:6px;">${pending}</div>
              </div>
              <div class="cardish" style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(251,113,133,0.25);border-radius:16px;">
                <div style="font-weight:900;color:rgba(229,231,235,0.95);">Views</div>
                <div id="vendorViewsCount" style="font-size:22px;font-weight:1000;color:rgba(96,165,250,0.95);margin-top:6px;">${views}</div>
              </div>
              <div class="cardish" style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(251,113,133,0.25);border-radius:16px;">
                <div style="font-weight:900;color:rgba(229,231,235,0.95);">Approved</div>
                <div style="font-size:22px;font-weight:1000;color:rgba(34,197,94,0.95);margin-top:6px;">${approved}</div>
              </div>
              <div class="cardish" style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(251,113,133,0.25);border-radius:16px;">
                <div style="font-weight:900;color:rgba(229,231,235,0.95);">Days Left to Expire</div>
                <div id="vendorExpiryDays" style="font-size: 22px; font-weight: 1000; margin-top: 6px; 
    color: ${parseInt(expiryText) < 0 ? 'rgba(239,68,68,0.95)' : '#22c55e'};">
    ${parseInt(expiryText) < 0 
        ? `Expired ${Math.abs(expiryText)} days ago` 
        : `${expiryText} Days Remaining`}
</div>
<div id="vendorExpiryDate" style="margin-top:5px;font-size:10px;font-weight:800;color:rgba(229,231,235,.58);">Expires: ${expiryDateText}</div>
              </div>
            </div>
          `;
        };

        // Vendor Assigned Venue UID (banquet/hall ka) show on top of cards
        const assignedVenueUid = String(vendorAssignedVenueUid ?? vendorId ?? '');
        viewContainer.innerHTML = `
          ${quickCardsHtml(finalPending, viewsTotal, finalApproved, minDays, minExpireDate)}
          <div style="max-width:1100px;margin:10px auto 0;padding:0 16px;">
            <div style="padding:10px 14px;background:rgba(0,0,0,0.18);border:1px solid rgba(251,113,133,0.25);border-radius:14px;">
              <div style="font-size:16px;font-weight:1000;color:rgba(255,230,240,0.98);margin-top:4px;">Assigned Venue UID: ${assignedVenueUid}</div>
            </div>
          </div>
          <div style="${cardsWrapStyle}">
            <div id="vendorBanquetCardsGrid" class="grid" style="padding-top:16px;margin:0 auto;max-width:1100px;">
              ${banquetCards || ''}
            </div>
          </div>

        `;


        // Click-to-open portfolio.html (same flow as home.js)



        const onCardActivate = (cardEl) => {
          const uid = cardEl?.dataset?.banquetUid;
          if (!uid) return;
          const source = String(window.__vendor_source || 'banquet').toLowerCase();
          try {
            localStorage.setItem('selectedPortfolioType', source === 'hall' ? 'hall' : 'banquet');
          } catch (e) {}
          try {
            if (source === 'hall') localStorage.setItem('selectedHallUid', uid);
            else localStorage.setItem('selectedBanquetUid', uid);
          } catch (e) {}
          window.location.href = 'portfolio.html';
        };

        viewContainer.querySelectorAll('[data-banquet-uid]').forEach((cardEl) => {
          cardEl.addEventListener('click', () => onCardActivate(cardEl));
          cardEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') onCardActivate(cardEl);
          });
        });
      } catch (err) {
        console.error("Vendor cards load error:", err);
        setStatus('Ready');
        setAppLoading(false);
      }

      // ===== Bottom Calendar (same UI/working as portfolio) =====
      // Inject calendar only inside vendor-management view.
      try {
        const vendorAssignedVenueUid = String(window.__vendor_id ?? '').trim();

        const checkboxValue = (v) => {
          if (v === true || v === 1) return true;
          const x = String(v ?? '').trim().toLowerCase();
          return ['true','1','yes','y','on'].includes(x);
        };

        // Read the exact Morning/Evening/Night availability configured by Admin.
        // This is decrypted before the vendor calendar is rendered, so the vendor
        // never sees time options that Admin disabled.
        let vendorAvailability = { Morning: true, Evening: true, Night: true };
        try {
          const venueUid = String(vendorAssignedVenueUid ?? '').trim();
          const preferredSource = String(window.__vendor_source || localStorage.getItem('vendorSource') || '').toLowerCase();
          const paths = preferredSource === 'hall'
            ? [`/12/13/${venueUid}`, `/3/4/${venueUid}`]
            : preferredSource === 'banquet'
              ? [`/3/4/${venueUid}`, `/12/13/${venueUid}`]
              : [`/3/4/${venueUid}`, `/12/13/${venueUid}`];

          let venue = null;
          for (const path of paths) {
            const dataPath = path.startsWith('/hall/') ? '/12/13' : '/3/4';
            const all = await getCached(dataPath);
            const key = path.split('/').pop();
            const candidate = all?.[key];
            if (candidate) { venue = candidate; break; }
            // Some legacy records use a different encrypted child key, so fall back to UID scan.
            if (all) {
              const found = Object.values(all).find(r => String(r?.UID ?? r?.hall_UID ?? '') === String(venueUid));
              if (found) { venue = found; break; }
            }
          }

          if (venue) {
            const a = venue.avaibility ?? venue.availability ?? {};
            const getAvailabilityValue = (key) => a[key] ?? a[key.toLowerCase()] ?? a[key.toUpperCase()];
            const hasConfigured = ['Morning','Evening','Night'].some((k) => Object.prototype.hasOwnProperty.call(a, k) || Object.prototype.hasOwnProperty.call(a, k.toLowerCase()) || Object.prototype.hasOwnProperty.call(a, k.toUpperCase()));
            if (hasConfigured) {
              vendorAvailability = {
                Morning: checkboxValue(getAvailabilityValue('Morning')),
                Evening: checkboxValue(getAvailabilityValue('Evening')),
                Night: checkboxValue(getAvailabilityValue('Night'))
              };
            }
          }
        } catch (e) {
          // Keep a safe legacy fallback if the venue record is temporarily unavailable.
          vendorAvailability = { Morning: true, Evening: true, Night: true };
        }
        const enabledVendorTimes = ['Morning','Evening','Night'].filter(t => vendorAvailability[t]);
        if (!enabledVendorTimes.length) enabledVendorTimes.push('Morning');

        // Short-lived in-memory cache prevents the 3s visual refresh from
        // repeatedly downloading the complete user/redmark collections.
        const calendarDataCache = { usersAt: 0, users: null, redAt: 0, red: null };
        const CALENDAR_CACHE_MS = 5000;

        const vendorCalendarPaneHtml = `
          <div id="vendorCalendarPane" class="calendar-pane vendor-calendar-shell" aria-live="polite" style="display:block;">
            <div class="calendar-pane__header">
              <div class="section-title" style="margin:0; font-size:18px; padding-left:12px; border-left-width:3px;">
                <i class="fa-solid fa-calendar-days" style="color:#ffd700;"></i> Pick a Date
              </div>

              <div class="calendar-bottom-time-select" aria-label="Pick Event Time">
                <button
                  id="bottomEventTimeDropdownBtn"
                  type="button"
                  class="calendar-dd-btn"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="bottomEventTimeDropdownList"
                >
                  <span class="calendar-dd-label-text" id="bottomEventTimeDropdownLabel">Select Event Time</span>
                  <span class="calendar-dd-caret" aria-hidden="true">▾</span>
                </button>

                <div
                  id="bottomEventTimeDropdownList"
                  class="calendar-dd-list"
                  role="listbox"
                  aria-label="Event Time"
                >
                  ${enabledVendorTimes.map(t => `<div class="calendar-dd-option" role="option" data-value="${t}" tabindex="0">${t}</div>`).join('')}
                </div>

                <input type="hidden" id="bottomEventTimeSelect" value="" />
              </div>
            </div>

            <div class="calendar-pane__body">
              <div class="calendar-block" id="calendarMorning" data-calendar="Morning" style="display:${vendorAvailability.Morning ? 'block' : 'none'};">
                <div class="calendar-topbar">
                  <div class="calendar-month" data-month-label="Morning">
                    <button type="button" class="calendar-month__chev" data-month-nav="prev" aria-label="Previous month">‹</button>
                    <span class="calendar-month__label" data-calendar-month-label="Morning">Morning</span>
                    <button type="button" class="calendar-month__chev calendar-month__chev--right" data-month-nav="next" aria-label="Next month">›</button>
                  </div>
                </div>
                <div class="calendar-grid" data-calendar-grid>
                  <div class="calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>
                  <div class="calendar-days"></div>
                </div>
              </div>

              <div class="calendar-block" id="calendarEvening" data-calendar="Evening" style="display:${vendorAvailability.Evening ? 'block' : 'none'};">
                <div class="calendar-topbar">
                  <div class="calendar-month" data-month-label="Evening">
                    <button type="button" class="calendar-month__chev" data-month-nav="prev" aria-label="Previous month">‹</button>
                    <span class="calendar-month__label" data-calendar-month-label="Evening">Evening</span>
                    <button type="button" class="calendar-month__chev calendar-month__chev--right" data-month-nav="next" aria-label="Next month">›</button>
                  </div>
                </div>
                <div class="calendar-grid" data-calendar-grid>
                  <div class="calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>
                  <div class="calendar-days"></div>
                </div>
              </div>

              <div class="calendar-block" id="calendarNight" data-calendar="Night" style="display:${vendorAvailability.Night ? 'block' : 'none'};">
                <div class="calendar-topbar">
                  <div class="calendar-month" data-month-label="Night">
                    <button type="button" class="calendar-month__chev" data-month-nav="prev" aria-label="Previous month">‹</button>
                    <span class="calendar-month__label" data-calendar-month-label="Night">Night</span>
                    <button type="button" class="calendar-month__chev calendar-month__chev--right" data-month-nav="next" aria-label="Next month">›</button>
                  </div>
                </div>
                <div class="calendar-grid" data-calendar-grid>
                  <div class="calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>
                  <div class="calendar-days"></div>
                </div>
              </div>
              <div class="calendar-status-legend" aria-label="Calendar status legend">
                <span><i class="dot-green"></i> Approved booking</span>
                <span><i class="dot-yellow"></i> Booking pending</span>
                <span><i class="dot-red"></i> Vendor blocked</span>
              </div>
            </div>
          </div>
        `;

        // Put calendar right after cards grid.
        const calendarMountPoint = viewContainer;
        if (calendarMountPoint) {
          calendarMountPoint.insertAdjacentHTML('beforeend', vendorCalendarPaneHtml);
        }

        // If vendor panel css already has calendar styles, they will apply. If not, inline CSS still covers basic.

        const __calendarStateByType = { Morning: null, Evening: null, Night: null };
        const getMonthState = (calendarType) => {
          if (__calendarStateByType[calendarType]) return __calendarStateByType[calendarType];
          const now = new Date();
          const base = new Date(now.getFullYear(), now.getMonth(), 1);
          __calendarStateByType[calendarType] = base;
          return base;
        };
        const shiftMonth = (calendarType, delta) => {
          const cur = getMonthState(calendarType);
          const next = new Date(cur.getFullYear(), cur.getMonth() + delta, 1);
          __calendarStateByType[calendarType] = next;
          return next;
        };
        const formatMonthYear = (d) => {
          if (!d) return '';
          const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        };
        const toLocalISODate = (d) => {
          const yy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yy}-${mm}-${dd}`;
        };

        const showVendorCalendarNotice = (title, message, type = 'info') => {
          let host = document.getElementById('vendorCalendarNoticeHost');
          if (!host) {
            host = document.createElement('div');
            host.id = 'vendorCalendarNoticeHost';
            host.className = 'vendor-calendar-notice-host';
            host.setAttribute('aria-live', 'polite');
            document.body.appendChild(host);
          }
          host.innerHTML = `
            <div class="vendor-calendar-notice vendor-calendar-notice--${type}">
              <div class="vendor-calendar-notice__icon"><i class="fa-solid ${type === 'approved' ? 'fa-lock' : type === 'pending' ? 'fa-clock' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i></div>
              <div><strong>${title}</strong><span>${message}</span></div>
            </div>`;
          window.clearTimeout(host.__hideTimer);
          host.__hideTimer = window.setTimeout(() => { host.innerHTML = ''; }, 2800);
        };

        const renderCalendarFor = async (calendarType) => {
          const block = document.querySelector(`.calendar-block[data-calendar="${calendarType}"]`);
          if (!block) return;

          const daysContainer = block.querySelector('[data-calendar-grid] .calendar-days');
          if (!daysContainer) return;

          // booked/approved based on /9/11 for this vendor venueId.
          let bookedSet = new Set();
          let approvedSet = new Set();

          // red-marked dates for this vendor/time (DB: /7/8/<vendorEnrolledVenueUid>)
          // DB stores `reddate` like: "04/07/2026|Morning"
          let redMarkedIsoSet = new Set();

          // helpers
          const parseReddateToIso = (reddate, expectedCalendarType) => {
            const reddateStr = String(reddate ?? '').trim();
            if (!reddateStr) return null;

            const parts = reddateStr.split('|').map((x) => String(x ?? '').trim());
            if (parts.length < 2) return null;

            const datePart = parts[0];
            const timePart = parts[1];
            if (!datePart || !timePart) return null;

            if (String(timePart).trim().toLowerCase() !== String(expectedCalendarType).trim().toLowerCase()) return null;

            // Common formats:
            // 1) dd/mm/yyyy  (e.g. 06/07/2026)
            // 2) d/m/yyyy    (e.g. 6/7/2026)
            // 3) yyyy-mm-dd

            // dd/mm/yyyy (2-digit)
            let dm = datePart.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (dm) {
              return `${dm[3]}-${dm[2]}-${dm[1]}`;
            }

            // d/m/yyyy (1- or 2-digit)
            dm = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (dm) {
              const d = String(dm[1]).padStart(2, '0');
              const m = String(dm[2]).padStart(2, '0');
              return `${dm[3]}-${m}-${d}`;
            }

            // yyyy-mm-dd
            const iso = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (iso) return datePart;

            return null;
          };

          try {
            let all;
            if (calendarDataCache.users && (Date.now() - calendarDataCache.usersAt) < CALENDAR_CACHE_MS) {
              all = calendarDataCache.users;
            } else {
              all = await getCached('/9/11');
              calendarDataCache.users = all;
              calendarDataCache.usersAt = Date.now();
            }

            for (const k of Object.keys(all)) {
              const it = all[k] || {};
              const dbVenueId = it.venueId ?? it.venueID;
              if (!dbVenueId || String(dbVenueId) !== String(vendorAssignedVenueUid)) continue;

              if (!it.status) continue;
              if (!it.event_time) continue;

              const statusLower = String(it.status).toLowerCase();
              const dbEventTime = String(it.event_time).trim().toLowerCase();
              const uiCalendarType = String(calendarType).trim().toLowerCase();
              if (dbEventTime !== uiCalendarType) continue;

              const tdRaw = it.targetdate ? String(it.targetdate).trim() : '';
              if (!tdRaw) continue;

              let tdIso = '';
              const isoMatch = tdRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (isoMatch) tdIso = tdRaw;
              else {
                const dm = tdRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (dm) tdIso = `${dm[3]}-${dm[2]}-${dm[1]}`;
              }

              if (!tdIso) continue;

              if (statusLower === 'pending' || statusLower === 'awaiting' || statusLower.includes('pending')) bookedSet.add(tdIso);
              else if (statusLower === 'approved' || statusLower.includes('approved')) approvedSet.add(tdIso);
            }
          } catch (e) {
            console.warn('[vendor_panel calendar] fetch fail', e);
          }

          try {
            let rmData;
            if (calendarDataCache.red && (Date.now() - calendarDataCache.redAt) < CALENDAR_CACHE_MS) {
              rmData = calendarDataCache.red;
            } else {
              const redPath = `/7/8/${await stablePathKey(vendorAssignedVenueUid, 'redmark-owner')}`;
              rmData = await getCached(redPath);
              calendarDataCache.red = rmData;
              calendarDataCache.redAt = Date.now();
            }
            for (const v of Object.values(rmData)) {
              const iso = parseReddateToIso(v?.reddate, calendarType);
              if (iso) redMarkedIsoSet.add(iso);
            }
          } catch (e) {
            // ignore if node missing
          }


          const monthState = getMonthState(calendarType);
          const year = monthState.getFullYear();
          const month = monthState.getMonth();

          const monthLabelEl = block.querySelector('[data-calendar-month-label]');
          if (monthLabelEl) monthLabelEl.textContent = formatMonthYear(monthState);

          const firstDay = new Date(year, month, 1);
          const firstWeekday = firstDay.getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          const totalCells = 42;
          const todayISO = new Date();
          todayISO.setHours(0,0,0,0);
          const todayKey = toLocalISODate(todayISO);

          daysContainer.innerHTML = '';

          for (let cell = 0; cell < totalCells; cell++) {
  const dayNumber = cell - firstWeekday + 1;
  const isOut = dayNumber < 1 || dayNumber > daysInMonth;

  const dayBtn = document.createElement('div');
  dayBtn.className = 'cal-day';
  if (isOut) dayBtn.classList.add('is-out');

  if (!isOut) {
    const dayDate = new Date(year, month, dayNumber);
    dayDate.setHours(0, 0, 0, 0);
    const isoStr = toLocalISODate(dayDate);
    dayBtn.textContent = String(dayNumber);

    // 1. TODAY MARKER
    if (isoStr === todayKey) dayBtn.classList.add('is-today');

    // 2. STATUS PRIORITY
    // Approved booking = GREEN and locked. Manual vendor block = RED and locked.
    // Pending request = YELLOW and locked.
    if (approvedSet.has(isoStr)) {
      dayBtn.classList.add('is-approved');
      dayBtn.setAttribute('title', 'Approved booking — fully reserved');
      dayBtn.setAttribute('aria-disabled', 'true');
    } else if (redMarkedIsoSet.has(isoStr)) {
      dayBtn.classList.add('is-redmarked');
      dayBtn.setAttribute('title', 'Vendor blocked — fully reserved');
      dayBtn.setAttribute('aria-disabled', 'true');
    } else if (bookedSet.has(isoStr)) {
      dayBtn.classList.add('is-booked-by-other');
      dayBtn.setAttribute('title', 'Booking pending by another user');
      dayBtn.setAttribute('aria-disabled', 'true');
    }

    // 3. Vendor RED-MARK toggle. This is a vendor-only calendar action;
    // it must NOT open the customer booking modal.
    dayBtn.addEventListener('click', async () => {
      if (dayBtn.classList.contains('is-approved')) {
        showVendorCalendarNotice('Date fully reserved', 'This approved booking is locked for the vendor.', 'approved');
        return;
      }

      if (dayBtn.classList.contains('is-booked-by-other')) {
        showVendorCalendarNotice('Booking pending', 'A customer request is already pending for this date.', 'pending');
        return;
      }

      const isAlreadyRed = redMarkedIsoSet.has(isoStr);
      const basePath = `/7/8/${await stablePathKey(vendorAssignedVenueUid, "redmark-owner")}`;
      const [yyyy, mm, dd] = isoStr.split('-');
      const reddateVal = `${dd}/${mm}/${yyyy}|${calendarType}`;
      const childKey = await stablePathKey(`${calendarType}|${isoStr}`, "redmark-child");
      const nodePath = `${basePath}/${childKey}`;

      // Premium inline loading state: the spinner lives inside the exact day
      // and disappears as soon as Firebase finishes the write/remove.
      window.__vendorCalendarUpdating = true;
      dayBtn.classList.add('is-calendar-updating');
      dayBtn.setAttribute('aria-busy', 'true');
      dayBtn.setAttribute('aria-disabled', 'true');
      const originalDayText = dayBtn.textContent;
      dayBtn.innerHTML = `<span class="cal-day-spinner" aria-hidden="true"></span><span class="cal-day-loading-text">${originalDayText}</span>`;

      try {
        const { set, remove } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

        if (isAlreadyRed) {
          await remove(ref(db, nodePath));
          calendarDataCache.redAt = 0;
          redMarkedIsoSet.delete(isoStr);
          dayBtn.classList.remove('is-redmarked');
          dayBtn.innerHTML = originalDayText;
          showVendorCalendarNotice('Date unblocked', 'The date is available again for new requests.', 'info');
        } else {
          await set(ref(db, nodePath), await encryptDeep({
            UID: vendorAssignedVenueUid,
            reddate: reddateVal,
          }));
          calendarDataCache.redAt = 0;
          redMarkedIsoSet.add(isoStr);
          dayBtn.classList.add('is-redmarked');
          dayBtn.innerHTML = originalDayText;
          showVendorCalendarNotice('Date fully reserved', 'This date is now blocked on the vendor and portfolio calendars.', 'approved');
        }
      } catch (e) {
        console.error('[Calendar Redmark Toggle] failed', e);
        dayBtn.innerHTML = originalDayText;
        showVendorCalendarNotice('Could not update date', 'Please try again.', 'error');
      } finally {
        window.__vendorCalendarUpdating = false;
        dayBtn.classList.remove('is-calendar-updating');
        dayBtn.setAttribute('aria-busy', 'false');
        dayBtn.setAttribute('aria-disabled', redMarkedIsoSet.has(isoStr) ? 'true' : 'false');
      }
    });
  }
  daysContainer.appendChild(dayBtn);
}
        };

        const initCalendarMonthNav = () => {
          const root = document.getElementById('vendorCalendarPane');

          if (!root) return;

          const blocks = root.querySelectorAll('.calendar-block[data-calendar]');
          blocks.forEach((block) => {
            const calType = block.getAttribute('data-calendar');
            if (!calType) return;

            const prevBtn = block.querySelector('[data-month-nav="prev"]');
            const nextBtn = block.querySelector('[data-month-nav="next"]');

            const doShift = async (delta) => {
              shiftMonth(calType, delta);
              try { await renderCalendarFor(calType); } catch (e) {}
            };

            if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); doShift(-1); });
            if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); doShift(1); });
          });
        };

        const syncCalendarVisibility = async (selectedTime) => {
          const morning = document.getElementById('calendarMorning');
          const evening = document.getElementById('calendarEvening');
          const night = document.getElementById('calendarNight');

          const v = selectedTime || 'Morning';
          if (morning) morning.style.display = v === 'Morning' && vendorAvailability.Morning ? 'block' : 'none';
          if (evening) evening.style.display = v === 'Evening' && vendorAvailability.Evening ? 'block' : 'none';
          if (night) night.style.display = v === 'Night' && vendorAvailability.Night ? 'block' : 'none';

          await renderCalendarFor(v).catch(() => {});

          // Event-driven live sync: Firebase pushes only when booking/status data
          // actually changes. No polling loop and no repeated full calendar load.
          try {
            if (Array.isArray(window.__vendorCalendarLiveUnsubs)) {
              for (const unsub of window.__vendorCalendarLiveUnsubs) {
                try { unsub?.(); } catch (_) {}
              }
            }
            window.__vendorCalendarLiveUnsubs = [];

            const refreshVisibleCalendar = () => {
              if (window.__vendorCalendarUpdating) return;
              const currentTime = localStorage.getItem('eventTime') || v || 'Morning';
              renderCalendarFor(currentTime).catch(() => {});
            };
            window.__vendorCalendarLiveUnsubs.push(subscribeCached('/9/11', refreshVisibleCalendar));
            const redPath = `/7/8/${await stablePathKey(vendorAssignedVenueUid, 'redmark-owner')}`;
            window.__vendorCalendarLiveUnsubs.push(subscribeCached(redPath, refreshVisibleCalendar));
          } catch (e) {
            console.warn('[vendor calendar live sync] setup failed', e);
          }
        };


        // Bottom dropdown wiring
        const ddBtn = document.getElementById('bottomEventTimeDropdownBtn');
        const ddList = document.getElementById('bottomEventTimeDropdownList');
        const ddLabel = document.getElementById('bottomEventTimeDropdownLabel');
        const hiddenInput = document.getElementById('bottomEventTimeSelect');

        const setBottomDropdownValue = (v) => {
          if (!v || !enabledVendorTimes.includes(v)) return;
          try { localStorage.setItem('eventTime', v); } catch (e) {}
          if (hiddenInput) hiddenInput.value = v;
          if (ddLabel) ddLabel.textContent = v;
          if (ddBtn) ddBtn.setAttribute('aria-expanded', 'false');
          if (ddList) ddList.classList.remove('is-open');
          syncCalendarVisibility(v).catch(() => {});
        };

        const toggleBottomDropdown = (open) => {
          if (!ddBtn || !ddList) return;
          const shouldOpen = typeof open === 'boolean' ? open : !ddList.classList.contains('is-open');
          ddBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
          ddList.classList.toggle('is-open', shouldOpen);
        };

        if (ddBtn && ddList) {
          ddBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleBottomDropdown(); });
          ddList.addEventListener('click', (e) => {
            const opt = e.target && e.target.closest && e.target.closest('.calendar-dd-option');
            if (!opt) return;
            const v = opt.getAttribute('data-value');
            setBottomDropdownValue(v);
          });
          document.addEventListener('click', () => toggleBottomDropdown(false));
        }

        const initTime = (() => {
          try {
            const saved = localStorage.getItem('eventTime');
            return enabledVendorTimes.includes(saved) ? saved : enabledVendorTimes[0];
          } catch (e) {
            return 'Morning';
          }
        })();

        if (ddLabel) ddLabel.textContent = initTime;
        if (hiddenInput) hiddenInput.value = initTime;

        initCalendarMonthNav();
        syncCalendarVisibility(initTime).catch(() => {});

      } catch (e) {
        console.warn('[vendor_panel] calendar injection failed', e);
      }

      // ===== End Bottom Calendar =====

      // Initial async work complete: cards grid + calendar injected.
      setStatus('Ready');
      setAppLoading(false);
    })();

  } else if (viewKey === "vendor-spreadsheet") {
    pageTitle.textContent = `Welcome ${name}`;

    // SECURITY/SCOPE: the spreadsheet is always scoped to the authenticated
    // vendor venue UID established by verifyVendor(). Never trust a stale
    // localStorage venue id as the source of truth for this view.
    const vendorId = String(window.__vendor_id ?? '').trim();
    const vendorSource = String(window.__vendor_source ?? '').trim().toLowerCase();

    if (!vendorId) {
      viewContainer.innerHTML = `
        <div class="vendor-empty-state">
          <i class="fa-solid fa-shield-halved"></i>
          <strong>Vendor session not available</strong>
          <span>Please log in again to load your assigned venue records.</span>
        </div>`;
      setStatus('Locked');
      return;
    }

    viewContainer.innerHTML = `
      <section class="vendor-spreadsheet-shell">
        <div class="vendor-spreadsheet-head">
          <div>
            <div class="vendor-eyebrow"><i class="fa-solid fa-table-columns"></i> PRIVATE VENDOR RECORDS</div>
            <h2>My Booking Spreadsheet</h2>
            <p>Only requests for your assigned ${vendorSource || 'venue'} are shown here.</p>
          </div>
          <div class="vendor-scope-badge">
            <span>Assigned venue</span>
            <b>${vendorId}</b>
          </div>
        </div>

        <div class="vendor-spreadsheet-toolbar">
          <label class="vendor-filter">
            <span>Status</span>
            <select id="vendorSpreadsheetStatusFilter">
              <option value="all" selected>All records</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="deny">Denied</option>
            </select>
          </label>
          <label class="vendor-filter vendor-filter--search">
            <span>Search</span>
            <div class="vendor-search-input">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input id="vendorSpreadsheetSearch" type="search" placeholder="Client, contact or user ID" autocomplete="off" />
            </div>
          </label>
          <div class="vendor-month-control">
            <span>Requested month</span>
            <div class="vendor-month-buttons">
              <button type="button" id="vendorSpreadsheetMonthPrev" aria-label="Previous month"><i class="fa-solid fa-chevron-left"></i></button>
              <div id="vendorSpreadsheetMonthYearLabel">--</div>
              <button type="button" id="vendorSpreadsheetMonthNext" aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
        </div>

        <div class="vendor-table-wrap">
          <table id="vendorRequestsTable" class="vendor-record-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Event</th>
                <th>Target date</th>
                <th>Time</th>
                <th>Requested</th>
                <th>Status</th>
                <th class="vendor-action-col">Action</th>
              </tr>
            </thead>
            <tbody id="vendorRequestsTbody">
              <tr><td colspan="8"><div class="vendor-table-loading"><span></span> Loading your records…</div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="vendor-spreadsheet-foot"><i class="fa-solid fa-lock"></i> Vendor-isolated view · records from other venues are never rendered.</div>
      </section>
    `;

    (async () => {
      try {
        const data = await getCached('/9/11');
        const tbody = document.getElementById('vendorRequestsTbody');
        if (!tbody) return;

        const normalize = (v) => String(v ?? '').trim();
        const getRecordVenueId = (r) => normalize(
          r?.venueId ?? r?.venueID ?? r?.venueUid ?? r?.venueUID ??
          r?.selectedAssetUid ?? r?.selectedAssetUID ?? r?.assetUid ?? r?.assetUID ?? ''
        );
        const sameVenue = (r) => {
          const recordVenueId = getRecordVenueId(r);
          // IMPORTANT: no fallback. A request without a venue id is not allowed
          // into a vendor's private spreadsheet.
          return Boolean(recordVenueId) && recordVenueId === vendorId;
        };

        const parseDate = (v) => {
          const value = normalize(v);
          if (!value) return null;
          const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (iso) return new Date(`${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}T00:00:00`);
          const dm = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (dm) return new Date(`${dm[3]}-${String(dm[2]).padStart(2,'0')}-${String(dm[1]).padStart(2,'0')}T00:00:00`);
          const d = new Date(value);
          return Number.isNaN(d.getTime()) ? null : d;
        };
        const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const statusKind = (status) => {
          const x = normalize(status).toLowerCase();
          if (x.includes('approved')) return 'approved';
          if (x.includes('deny') || x.includes('denied') || x.includes('rejected')) return 'deny';
          return 'pending';
        };
        const statusLabel = (status) => {
          const kind = statusKind(status);
          return kind === 'approved' ? 'Approved' : kind === 'deny' ? 'Denied' : 'Pending';
        };

        if (!data || !Object.keys(data).length) {
          // Do not return here: the realtime subscription below must stay active
          // so a brand-new booking appears without refreshing the spreadsheet.
          data = {};
        }

        // Strict vendor isolation happens BEFORE any row is constructed/rendered.
        let rows = [];
        const buildRowsFromData = (sourceData) => {
          const nextRows = [];
          for (const [rawKey, r] of Object.entries(sourceData || {})) {
          if (!r || !sameVenue(r)) continue;
            nextRows.push({
              rawKey,
            uid: normalize(r.user_UID ?? r.useruid ?? r.UID ?? r.uid ?? rawKey),
            name: normalize(r.clientname ?? r.name ?? r.username ?? r.userName ?? '—'),
            contact: normalize(r.clientcontact ?? r.contact ?? r.phone ?? r.number ?? r.whatsapp ?? '—'),
            eventType: normalize(r.event_type ?? r.eventType ?? r.selectedPortfolioType ?? 'Event'),
            targetDate: normalize(r.targetdate ?? r.targetDate ?? '—'),
            eventTime: normalize(r.event_time ?? r.eventTime ?? '—'),
            requestedDate: normalize(r.requesteddate ?? r.requestedDate ?? r.requestDate ?? '—'),
            status: normalize(r.status ?? r.approval_status ?? r.action ?? 'pending'),
              raw: r
            });
          }
          nextRows.sort((a, b) => {
            const da = parseDate(a.requestedDate), db = parseDate(b.requestedDate);
            if (da && db) return db.getTime() - da.getTime();
            if (da) return -1;
            if (db) return 1;
            return b.rawKey.localeCompare(a.rawKey);
          });
          return nextRows;
        };

        rows = buildRowsFromData(data);

        /* rows are kept live from the shared Firebase cache. */

        let activeYm;
        const today = new Date();
        activeYm = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

        const monthLabel = document.getElementById('vendorSpreadsheetMonthYearLabel');
        const renderMonthLabel = () => {
          const [y, m] = activeYm.split('-').map(Number);
          monthLabel.textContent = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        };

        const renderRows = () => {
          const statusFilter = normalize(document.getElementById('vendorSpreadsheetStatusFilter')?.value || 'all').toLowerCase();
          const search = normalize(document.getElementById('vendorSpreadsheetSearch')?.value || '').toLowerCase();
          const filtered = rows.filter(row => {
            const kind = statusKind(row.status);
            if (statusFilter !== 'all' && kind !== statusFilter) return false;
            if (search) {
              const hay = `${row.uid} ${row.name} ${row.contact} ${row.eventType} ${row.targetDate} ${row.eventTime}`.toLowerCase();
              if (!hay.includes(search)) return false;
            }
            if (search) return true; // searching is global across this vendor's records
            const d = parseDate(row.requestedDate);
            if (!d) return false;
            const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            return ym === activeYm;
          });

          if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="vendor-empty-state vendor-empty-state--table"><i class="fa-regular fa-calendar-xmark"></i><strong>No matching records</strong><span>Try another status, search term or month.</span></div></td></tr>`;
            return;
          }

          tbody.innerHTML = filtered.map(row => {
            const kind = statusKind(row.status);
            const actionDisabled = kind !== 'pending';
            return `
              <tr data-user-key="${escapeHtml(row.rawKey)}">
                <td data-label="Client"><div class="vendor-client-cell"><span class="vendor-avatar">${escapeHtml((row.name || 'V').charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.uid)}</small></div></div></td>
                <td data-label="Contact">${escapeHtml(row.contact)}</td>
                <td data-label="Event"><span class="vendor-event-chip">${escapeHtml(row.eventType)}</span></td>
                <td data-label="Target date"><strong>${escapeHtml(row.targetDate)}</strong></td>
                <td data-label="Time">${escapeHtml(row.eventTime)}</td>
                <td data-label="Requested">${escapeHtml(row.requestedDate)}</td>
                <td data-label="Status"><span class="vendor-status vendor-status--${kind}">${statusLabel(row.status)}</span></td>
                <td data-label="Action" class="vendor-actions-cell">
                  ${actionDisabled ? `<span class="vendor-action-muted">${kind === 'approved' ? 'Closed' : 'Declined'}</span>` : `<button type="button" class="vendor-row-btn vendor-row-btn--approve" data-action="approve" data-user-key="${escapeHtml(row.rawKey)}"><i class="fa-solid fa-check"></i> Approve</button><button type="button" class="vendor-row-btn vendor-row-btn--deny" data-action="deny" data-user-key="${escapeHtml(row.rawKey)}"><i class="fa-solid fa-xmark"></i> Deny</button>`}
                </td>
              </tr>`;
          }).join('');
        };

        renderMonthLabel();
        renderRows();
        setStatus('Live');

        document.getElementById('vendorSpreadsheetStatusFilter')?.addEventListener('change', renderRows);
        document.getElementById('vendorSpreadsheetSearch')?.addEventListener('input', renderRows);
        document.getElementById('vendorSpreadsheetMonthPrev')?.addEventListener('click', () => {
          const [y,m] = activeYm.split('-').map(Number);
          const d = new Date(y, m - 2, 1);
          activeYm = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          renderMonthLabel(); renderRows();
        });
        document.getElementById('vendorSpreadsheetMonthNext')?.addEventListener('click', () => {
          const [y,m] = activeYm.split('-').map(Number);
          const d = new Date(y, m, 1);
          activeYm = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          renderMonthLabel(); renderRows();
        });

        tbody.addEventListener('click', async (event) => {
          const button = event.target.closest('button[data-action][data-user-key]');
          if (!button || button.disabled) return;
          const rawKey = button.dataset.userKey;
          const action = button.dataset.action;
          const row = rows.find(item => item.rawKey === rawKey);
          // Re-check scope before every mutation; this prevents a stale DOM row
          // from updating another venue's request.
          if (!row || !sameVenue(row.raw)) return;

          const siblingButtons = button.parentElement.querySelectorAll('button');
          siblingButtons.forEach(btn => { btn.disabled = true; btn.classList.add('is-busy'); });
          try {
            setStatus(`Updating ${action === 'approve' ? 'approval' : 'decision'}…`);
            const { set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
            const recordSnap = await get(ref(db, `/9/11/${rawKey}`));
            if (!recordSnap.exists()) throw new Error('User record not found.');
            const currentRecord = await decryptDeep(recordSnap.val());
            if (!sameVenue(currentRecord)) throw new Error('This record is outside your assigned venue.');
            const nextStatus = action === 'approve' ? 'Approved' : 'Deny';
            const updatedRecord = { ...(currentRecord || {}), status: nextStatus };

            // Paint the changed row immediately — do not reload the spreadsheet.
            row.status = nextStatus;
            row.raw = updatedRecord;
            renderRows();
            setStatus('Live');

            // Persist in Firebase. The realtime cache listener above will reconcile
            // this optimistic state with the encrypted database value automatically.
            await set(ref(db, `/9/11/${rawKey}`), await encryptDeep(updatedRecord));
          } catch (err) {
            console.error('Vendor request update failed:', err);
            // Roll back the optimistic paint if Firebase rejected the write.
            if (row && typeof currentRecord !== 'undefined') {
              row.status = currentRecord.status ?? currentRecord.approval_status ?? currentRecord.action ?? 'pending';
              row.raw = currentRecord;
              renderRows();
            }
            setStatus('Live');
            siblingButtons.forEach(btn => { btn.disabled = false; btn.classList.remove('is-busy'); });
          }
        });

        // Firebase onValue is already wired by data_cache.js. Subscribe once so the
        // spreadsheet repaints only its visible rows when a request is added/changed.
        // No full renderView(), no loading overlay, and no second page fetch.
        if (window.__vendorSpreadsheetUnsub) {
          try { window.__vendorSpreadsheetUnsub(); } catch (_) {}
        }
        window.__vendorSpreadsheetUnsub = subscribeCached('/9/11', (liveData) => {
          rows = buildRowsFromData(liveData);
          renderRows();
          setStatus('Live');
        });
      } catch (err) {
        console.error('Vendor spreadsheet load error:', err);
        setStatus('Error');
        const tbody = document.getElementById('vendorRequestsTbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8"><div class="vendor-empty-state vendor-empty-state--table"><i class="fa-solid fa-triangle-exclamation"></i><strong>Could not load records</strong><span>Please refresh the vendor panel and try again.</span></div></td></tr>`;
      }
    })();

  } else if (viewKey === "vendor-rate") {
    const vendorId = window.__vendor_id;

    viewContainer.innerHTML = `
      <div class="panel__inner">
        <div class="cardish" style="padding:18px;max-width:720px;margin:0 auto;">
          <h2 style="margin:0 0 12px;">Rate Settings</h2>
          <p style="margin:0 0 16px;color:rgba(229,231,235,0.75);font-weight:700;">
            Update your Standard and Seasonal rates for your Banquet/Hall.
          </p>

          <div style="display:grid;grid-template-columns:1fr;gap:14px;">
            <div style="border:1px solid rgba(251,113,133,0.25);background:rgba(0,0,0,0.18);border-radius:16px;padding:14px;">
              <div style="font-weight:900;color:rgba(229,231,235,0.9);margin-bottom:10px;">Standard Rate/Cost</div>
              <input id="vendorStandardRateInput" type="text" placeholder="Enter value"
                style="width:100%;padding:12px 12px;border-radius:14px;border:1px solid rgba(251,113,133,0.35);background:rgba(0,0,0,0.18);color:rgba(255,255,255,0.95);font-weight:800;outline:none;" />
            </div>

            <div style="border:1px solid rgba(251,113,133,0.25);background:rgba(0,0,0,0.18);border-radius:16px;padding:14px;">
              <div style="font-weight:900;color:rgba(229,231,235,0.9);margin-bottom:10px;">Seasonal Rate/Cost</div>
              <input id="vendorSeasonalRateInput" type="text" placeholder="Enter value"
                style="width:100%;padding:12px 12px;border-radius:14px;border:1px solid rgba(251,113,133,0.35);background:rgba(0,0,0,0.18);color:rgba(255,255,255,0.95);font-weight:800;outline:none;" />
            </div>

            <div style="display:flex;gap:10px;align-items:center;justify-content:flex-start;flex-wrap:wrap;">
              <button type="button" class="a-btn" id="vendorSaveRatesBtn" style="padding:10px 12px;">Save Rates</button>
            </div>
          </div>


          <p id="vendorRateMsg" style="margin:12px 0 0;color:rgba(229,231,235,0.75);font-weight:800;" aria-live="polite"></p>
        </div>
      </div>
    `;

    const msgEl = document.getElementById('vendorRateMsg');
    const stdEl = document.getElementById('vendorStandardRateInput');
    const seasonalEl = document.getElementById('vendorSeasonalRateInput');
    const saveRatesBtn = document.getElementById('vendorSaveRatesBtn');



    const setLocalMsg = (txt, isErr=false) => {
      if (!msgEl) return;
      msgEl.textContent = txt || '';
      msgEl.style.color = isErr ? 'rgba(239,68,68,0.95)' : 'rgba(34,197,94,0.95)';
    };

    setStatus('Loading...');

    (async () => {
      try {
        const { get, set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

        // Determine vendor record by scanning both banquet + hall once (small tables expected).
        // If banquet match: update standardrate/seasonalrate.
        // If hall match: update standardcost/seasoncost.
        const banquetData = await getCached('/3/4');
        let target = null; // { basePath, key, standardField, seasonalField }
        if (banquetData && Object.keys(banquetData).length) {
          const data = banquetData;
          for (const [k, rec] of Object.entries(data)) {
            if (!rec) continue;
            const uid = String(rec.UID ?? k);
            if (uid === String(vendorId)) {
              target = {
                record: rec,
                basePath: '/3/4',
                key: k,
                standardField: 'standardrate',
                seasonalField: 'seasonalrate',
              };
              stdEl.value = String(rec.standardrate ?? '');
              seasonalEl.value = String(rec.seasonalrate ?? '');
              break;
            }
          }
        }

        if (!target) {
          const hallData = await getCached('/12/13');
          if (hallData && Object.keys(hallData).length) {
            const data = hallData;
            for (const [k, rec] of Object.entries(data)) {
              if (!rec) continue;
              const uid = String(rec.hall_UID ?? rec.UID ?? k);
              if (uid === String(vendorId)) {
                target = {
                  record: rec,
                  basePath: '/12/13',
                  key: k,
                  standardField: 'standardcost',
                  seasonalField: 'seasoncost',
                };
                stdEl.value = String(rec.standardcost ?? '');
                seasonalEl.value = String(rec.seasoncost ?? '');
                break;
              }
            }
          }
        }

        if (!target) {
          setStatus('Ready');
          setLocalMsg('Rate target not found for this vendor.', true);
          return;
        }

        saveRatesBtn?.addEventListener('click', async () => {
          const stdVal = String(stdEl?.value ?? '').trim();
          const seasonalVal = String(seasonalEl?.value ?? '').trim();

          if (!stdVal) return setLocalMsg('Enter Standard value.', true);
          if (!seasonalVal) return setLocalMsg('Enter Seasonal value.', true);

          setStatus('Saving...');
          try {
            const updatedVenue = { ...(target.record || {}) };
            updatedVenue[target.standardField] = stdVal;
            updatedVenue[target.seasonalField] = seasonalVal;
            await set(ref(db, `${target.basePath}/${target.key}`), await encryptDeep(updatedVenue));

            setStatus('Ready');
            setLocalMsg('Rates saved successfully.', false);
          } catch (e) {
            console.error(e);
            setStatus('Ready');
            setLocalMsg('Failed to save Rates.', true);
          }
        });


        setStatus('Ready');
      } catch (err) {
        console.error('Rate view error:', err);
        setStatus('Ready');
        setLocalMsg('Failed to load Rate settings.', true);
      }
    })();

  } else if (viewKey === "vendor-change-password") {
    const vendorId = window.__vendor_id;

    viewContainer.innerHTML = `
      <div class="panel__inner">
        <div class="cardish" style="padding:18px;max-width:720px;margin:0 auto;">
          <h2 style="margin:0 0 12px;">Change password</h2>

          <p style="margin:0 0 18px;color:rgba(229,231,235,0.75);font-weight:700;">
            Enter current password and new password for your linked vendor.
          </p>

          <form id="vendorChangePasswordForm" style="display:flex;flex-direction:column;gap:12px;">
            <label style="font-weight:900;color:rgba(229,231,235,0.85);">Current password</label>
            <input id="vendorCurrentPassword" type="password" required
              style="padding:12px 12px;border-radius:14px;border:1px solid rgba(251,113,133,0.35);background:rgba(0,0,0,0.18);color:rgba(255,255,255,0.95);font-weight:800;outline:none;" />

            <label style="font-weight:900;color:rgba(229,231,235,0.85);">New password</label>
            <input id="vendorNewPassword" type="password" required
              style="padding:12px 12px;border-radius:14px;border:1px solid rgba(251,113,133,0.35);background:rgba(0,0,0,0.18);color:rgba(255,255,255,0.95);font-weight:800;outline:none;" />

            <button type="submit" class="vendor-login-btn" style="margin-top:8px;">
              Update password
            </button>
            <p id="vendorChangePasswordMsg" style="margin:0;color:rgba(229,231,235,0.75);font-weight:800;" aria-live="polite"></p>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('vendorChangePasswordForm');
    const msgEl = document.getElementById('vendorChangePasswordMsg');
    const currentEl = document.getElementById('vendorCurrentPassword');
    const newEl = document.getElementById('vendorNewPassword');

    const setLocalMsg = (txt, isErr=false) => {
      if (!msgEl) return;
      msgEl.textContent = txt || '';
      msgEl.style.color = isErr ? 'rgba(239,68,68,0.95)' : 'rgba(34,197,94,0.95)';
    };

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('Updating...');
      setLocalMsg('');

      const currPass = String(currentEl?.value ?? '');
      const newPass = String(newEl?.value ?? '');

      if (!currPass || !newPass) {
        setStatus('Ready');
        setLocalMsg('Please fill all fields.', true);
        return;
      }

      try {
        const { get, set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

        // Current implementation checks both banquet and hall vendor_pass.
        // We update the same node we validate.
        const banquetRef = ref(db, '/3/4');
        const banquetSnap = await get(banquetRef);
        let target = null;

        if (banquetSnap.exists()) {
          const data = await decryptDeep(banquetSnap.val() || {});
          for (const [vid, record] of Object.entries(data)) {
            if (!record) continue;
            const uidMatch = String(record.UID ?? vid) === String(vendorId);
            const passMatch = String(record.vendor_pass ?? '') === currPass;
            if (uidMatch && passMatch) {
              target = { path: `/3/4/${vid}`, record };
              break;
            }
          }
        }

        if (!target) {
          const hallRef = ref(db, '/12/13');
          const hallSnap = await get(hallRef);
          if (hallSnap.exists()) {
            const data = await decryptDeep(hallSnap.val() || {});
            for (const [hid, record] of Object.entries(data)) {
              if (!record) continue;
              const uidMatch = String(record.hall_UID ?? record.UID ?? hid) === String(vendorId);
              const passMatch = String(record.vendor_pass ?? '') === currPass;
              if (uidMatch && passMatch) {
                target = { path: `/12/13/${hid}`, record };
                break;
              }
            }
          }
        }

        if (!target) {
          setStatus('Ready');
          setLocalMsg('Current password is incorrect.', true);
          return;
        }

        // Venue records are encrypted as one logical record; decrypt, change, re-encrypt.
        const updatedVenue = { ...(target.record || {}) };
        updatedVenue.vendor_pass = newPass;
        await set(ref(db, target.path), await encryptDeep(updatedVenue));

        setStatus('Ready');
        setLocalMsg('Password updated successfully.', false);
      } catch (err) {
        console.error('Change password error:', err);
        setStatus('Ready');
        setLocalMsg('Failed to update password. Please try again.', true);
      }
    });

    setStatus('Ready');
  } else {
    viewContainer.innerHTML = "<div style='color:rgba(229,231,235,0.7);font-weight:800;'>Unknown view</div>";
  }
}





async function verifyVendor(username, password) {
  // Both venue collections are warmed in parallel and kept live for the whole session.
  const [banquetData, hallData] = await Promise.all([
    getCached('/3/4'),
    getCached('/12/13')
  ]);

  for (const [vendorId, record] of Object.entries(banquetData || {})) {
    if (!record) continue;
    if (String(record.vendor_user ?? '') === String(username) && String(record.vendor_pass ?? '') === String(password)) {
      return { vendorId, record, source: 'banquet' };
    }
  }

  for (const [hallId, record] of Object.entries(hallData || {})) {
    if (!record) continue;
    if (String(record.vendor_user ?? '') === String(username) && String(record.vendor_pass ?? '') === String(password)) {
      return { vendorId: hallId, record, source: 'hall' };
    }
  }
  return null;
}

function setAuthedSession(vendorId, source = "") {
  // Auth will be kept only in-memory for this page session.
  // But we also persist assigned venue UID for pending-counter mapping.
  window.__vendor_authed = true;
  window.__vendor_id = vendorId;
  window.__vendor_source = source || "";

  try {
    if (vendorId !== undefined && vendorId !== null) {
      localStorage.setItem("vendorAssignedVenueUid", String(vendorId));
      if (source) localStorage.setItem("vendorSource", String(source));
    }
  } catch (e) {}
}


function clearSession() {
  clearVendorViewListeners();
  window.__vendor_authed = false;
  window.__vendor_id = undefined;
  window.__vendor_source = "";
}

function isAuthed() {
  return window.__vendor_authed === true;
}



// Initial auth state
if (isAuthed()) {
  setOverlayHidden(true);
  setStatus("Authenticated");
  setAppLoading(true, 'Please wait — preparing your vendor dashboard…');
  renderView("vendor-management");
} else {
  setOverlayHidden(false);
  setStatus("Locked");
}

verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (verifyBtn) { verifyBtn.disabled = true; verifyBtn.classList.add("is-loading"); }
  const username = document.getElementById("vendorUsername").value.trim();
  const password = document.getElementById("vendorPassword").value;

  setMessage("Logging you in, please wait...", false);
  setStatus("Verifying...");

  try {
    const match = await verifyVendor(username, password);
    if (!match) {
      setStatus("Ready");
      setMessage("Invalid username or password", true);
      return;
    }

    // Name & Session Logic
    let name = match.record?.vendor_user_name ?? match.record?.user_name ?? match.record?.vendor_user ?? match.record?.user ?? match.record?.UID ?? "Vendor";
    window.__vendor_name = name; 
    setAuthedSession(match.vendorId, match.source);
    setOverlayHidden(true);
    setAppLoading(true, 'Please wait — preparing your vendor dashboard…');
    document.getElementById("pageTitle").textContent = `Welcome ${name}`;

    // Recalculate this exact vendor venue's expiry immediately on login.
    try {
      const { get, set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
      const basePath = match.source === 'hall' ? '/12/13' : '/3/4';
      const recordPath = `${basePath}/${match.vendorId}`;
      const freshSnap = await get(ref(db, recordPath));
      if (freshSnap.exists()) {
        const freshRecord = await decryptDeep(freshSnap.val() || {});
        const next = { ...(freshRecord || {}) };
        const startRaw = String(next.startdate ?? next.startDate ?? '').trim();
        let expire = String(next.expiredate ?? next.expireDate ?? '').trim();
        if (startRaw) {
          const m = startRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) {
            const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            dt.setDate(dt.getDate() + 30);
            expire = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
          }
        }
        if (expire) {
          const em = expire.match(/^(\d{4})-(\d{2})-(\d{2})/);
          const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
          const tm = todayStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (em && tm) {
            const expiryDate = new Date(Number(em[1]), Number(em[2]) - 1, Number(em[3]));
            const today = new Date(Number(tm[1]), Number(tm[2]) - 1, Number(tm[3]));
            next.expiredate = expire;
            next.countdowndays = String(Math.ceil((expiryDate - today) / 86400000));
            await set(ref(db, recordPath), await encryptDeep(next));
            seedCached(basePath, { ...(basePath.includes('/banquet/') ? peekCached('/3/4', {}) : peekCached('/12/13', {})), [match.vendorId]: next });
            match.record = next;
          }
        }
      }
    } catch (e) {
      console.error('Vendor expiry refresh error:', e);
    }
    renderView("vendor-management");
    clearInterval(window.__vendorExpiryTicker);
    window.__vendorExpiryTicker = window.setInterval(() => {
      const rawExpire = String(match.record?.expiredate ?? match.record?.expireDate ?? '').trim().slice(0, 10);
      const m = rawExpire.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
      const tm = todayStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const el = document.getElementById('vendorExpiryDate');
      const dayEl = document.getElementById('vendorExpiryDays');
      if (!m || !tm) return;
      const expiryDate = new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
      const today = new Date(Number(tm[1]), Number(tm[2])-1, Number(tm[3]));
      const days = Math.ceil((expiryDate - today) / 86400000);
      if (el) el.textContent = `Expires: ${rawExpire}`;
      if (dayEl) dayEl.textContent = days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} Days Remaining`;
    }, 60000);
  } catch (err) {
    console.error("Error:", err);
    setMessage("Verification failed.", true);
  } finally {
    if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.classList.remove("is-loading"); }
  }
});

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!isAuthed()) {
      setOverlayHidden(false);
      setStatus("Locked");
      return;
    }
    renderView(btn.dataset.view);
  });
});

changePasswordBtn.addEventListener("click", () => {
  try {
    renderView('vendor-change-password');
  } catch (e) {}
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  setOverlayHidden(false);
  setStatus("Locked");
  setMessage("", false);
});
