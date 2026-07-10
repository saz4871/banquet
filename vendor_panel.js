import { database } from "./firebaseconfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const db = database;


const overlay = document.getElementById("vendorLoginOverlay");
const verifyForm = document.getElementById("verifyForm");
const messageEl = document.getElementById("message");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const logoutBtn = document.getElementById("logoutBtn");

const pageTitle = document.getElementById("pageTitle");
const statusPill = document.getElementById("statusPill");
const viewContainer = document.getElementById("viewContainer");

const navButtons = Array.from(document.querySelectorAll(".nav__item[data-view]"));

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
  try { window.__vendor_last_view = viewKey; } catch (e) {}
  setActiveView(viewKey);

  // Late switching fix: show loading indicator immediately on view switch
  setStatus('Loading...');
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

        // --- Live Pending Counter (from /user/unique_user by venueID + status) ---
        // PERFORMANCE: Avoid blocking UI. We fetch pending in background.
        let vendorAssignedVenueUid = null;

        try {
          vendorAssignedVenueUid = localStorage.getItem("vendorAssignedVenueUid");
        } catch (e) {}
        if (!vendorAssignedVenueUid) vendorAssignedVenueUid = window.__vendor_id;

        // Ensure only 1 listener at a time
        if (window.__vendorPendingUnsub && typeof window.__vendorPendingUnsub === "function") {
          try { window.__vendorPendingUnsub(); } catch (e) {}
          window.__vendorPendingUnsub = null;
        }

        // Quick debug helper (will not break UI)
        // If pending count is not updating, check these values in console.
        try {
          console.log("[vendor_panel] assignedVenueUid=", vendorAssignedVenueUid);
        } catch (e) {}


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
        const pendingRef = ref(db, "/user/unique_user");

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

window.__vendorPendingUnsub = onValue(pendingRef, (snap) => {
  if (__vendorPageHidden) return;
  try {
    const data = snap.val() || {};
    let count = 0;
    let approvedCount = 0; // Naya variable approved count ke liye

    console.log("[DEBUG] Current vendorAssignedVenueUid:", vendorAssignedVenueUid);

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
          const uid = item.UID || item.uid || '';

          // NOTE: escapeHtml removed earlier for performance; current UI expects raw text.
          // If you need XSS protection, re-introduce a minimal escape function.
          return `
            <div class="card" role="button" tabindex="0" aria-label="Open banquet ${title}" data-banquet-uid="${uid}">
              <div class="img-container">
                ${cover ? `<img src="${cover}" alt="cover" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8">No Image</div>`}
                <div class="luxury-badge">Verified Luxury</div>
              </div>
              <div class="card-body">
                <div class="card-title">${title}</div>
                <div class="card-tag">
                  <b>${tag}</b>
                  <div class="card-meta">
                    <span>Location:</span>
                    ${location}
                  </div>
                </div>
              </div>
              <div class="card-footer">
                <div class="price">
                  Standart Rate:
                  <b>${price}</b>
                  <div class="capacity">People Capacity: <b>${capacity}</b></div>
                </div>
                <div class="arrow"><i class="fa-solid fa-arrow-right"></i></div>
              </div>
            </div>
          `;
        };

        const results = [];
        const banquetRecords = [];



        // Banquet
        const banquetSnap = await get(ref(db, "/banquet/unique_bank"));
        if (banquetSnap.exists()) {
          const data = banquetSnap.val() || {};
          for (const [id, record] of Object.entries(data)) {
            if (!record) continue;
            const isMatch = String(record.UID ?? id) === String(vendorId);
            if (isMatch) results.push(record);
          }
        }

        // Hall
        const hallSnap = await get(ref(db, "/hall/unique_hall"));
        if (hallSnap.exists()) {
          const data = hallSnap.val() || {};
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
        let viewsTotal = 0;

        // Track spreadsheet-style status counts too (if /user/unique_user has status)
        // PERFORMANCE NOTE:
        // - We do NOT re-fetch /user/unique_user here.
        // - But we DO compute spreadsheetPending/Approved/Deny from whatever status fields exist on `results` records.
        //   (Some records may already carry status/approval_status.)
        let spreadsheetPending = 0;
        let spreadsheetApproved = 0;
        let spreadsheetDeny = 0;



        for (const r of results) {

          const rawViews = r?.views;
          const viewsNum = rawViews !== undefined ? Number(rawViews) : 0;
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
            if (countdownDays < 0) approved++;
            else pending++;
            continue;
          }

          const exp = r?.expiredate ? new Date(r.expiredate) : null;
          if (!exp || Number.isNaN(exp.getTime())) continue;

          const diffMs = exp.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          minDays = Math.min(minDays, diffDays);

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







        const quickCardsHtml = (pendingCount, viewsCount, approvedCount, minDaysLeft) => {
          const pending = String(pendingCount ?? 0);
          const views = String(viewsCount ?? 0);
          const approved = String(approvedCount ?? 0);
          const expiryText = Number.isFinite(minDaysLeft) ? String(minDaysLeft) : '0';

          return `
            <div class="quick-cards" style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:0 16px;">
              <div class="cardish" style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(251,113,133,0.25);border-radius:16px;">
                <div style="font-weight:900;color:rgba(229,231,235,0.95);">Pending</div>
                <div style="font-size:22px;font-weight:1000;color:rgba(251,191,36,0.95);margin-top:6px;">${pending}</div>
              </div>
              <div class="cardish" style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(251,113,133,0.25);border-radius:16px;">
                <div style="font-weight:900;color:rgba(229,231,235,0.95);">Views</div>
                <div style="font-size:22px;font-weight:1000;color:rgba(96,165,250,0.95);margin-top:6px;">${views}</div>
              </div>
              <div class="cardish" style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(251,113,133,0.25);border-radius:16px;">
                <div style="font-weight:900;color:rgba(229,231,235,0.95);">Approved</div>
                <div style="font-size:22px;font-weight:1000;color:rgba(34,197,94,0.95);margin-top:6px;">${approved}</div>
              </div>
              <div class="cardish" style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid rgba(251,113,133,0.25);border-radius:16px;">
                <div style="font-weight:900;color:rgba(229,231,235,0.95);">Days Left to Expire</div>
                <div style="font-size: 22px; font-weight: 1000; margin-top: 6px; 
    color: ${parseInt(expiryText) < 0 ? 'rgba(239,68,68,0.95)' : '#22c55e'};">
    
    ${parseInt(expiryText) < 0 
        ? `Expired ${Math.abs(expiryText)} days ago` 
        : `${expiryText} Days Remaining`}
        
</div>
              </div>
            </div>
          `;
        };

        // Vendor Assigned Venue UID (banquet/hall ka) show on top of cards
        const assignedVenueUid = String(vendorAssignedVenueUid ?? vendorId ?? '');
        viewContainer.innerHTML = `
          ${quickCardsHtml(finalPending, viewsTotal, finalApproved, minDays)}
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
          try {
            localStorage.setItem('selectedPortfolioType', 'banquet');
          } catch (e) {}
          try {
            localStorage.setItem('selectedBanquetUid', uid);
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
        // fallback keep zeros
        setStatus('Ready');
      }

      // ===== Bottom Calendar (same UI/working as portfolio) =====
      // Inject calendar only inside vendor-management view.
      try {
        const vendorCalendarPaneHtml = `
          <div id="vendorCalendarPane" class="calendar-pane" aria-live="polite" style="display:block;">
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
                  <div class="calendar-dd-option" role="option" data-value="Morning" tabindex="0">Morning</div>
                  <div class="calendar-dd-option" role="option" data-value="Evening" tabindex="0">Evening</div>
                  <div class="calendar-dd-option" role="option" data-value="Night" tabindex="0">Night</div>
                </div>

                <input type="hidden" id="bottomEventTimeSelect" value="" />
              </div>
            </div>

            <div class="calendar-pane__body">
              <div class="calendar-block" id="calendarMorning" data-calendar="Morning">
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

              <div class="calendar-block" id="calendarEvening" data-calendar="Evening" style="display:none;">
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

              <div class="calendar-block" id="calendarNight" data-calendar="Night" style="display:none;">
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

        // Availability pipeline: Bottom dropdown (Morning/Evening/Night) ko venue record ke
        // avaibility/availability field se match karo.
        const getVenueAvailability = async () => {
          const venueId = (() => {
            try {
              const x = localStorage.getItem('vendorAssignedVenueUid');
              return x ? String(x) : String(window.__vendor_id ?? '');
            } catch (e) {
              return String(window.__vendor_id ?? '');
            }
          })();

          if (!venueId) return { Morning: true, Evening: true, Night: true };

          try {
            // Banquet first
            const banquetSnap = await get(ref(db, '/banquet/unique_bank'));
            const banquetData = banquetSnap?.val?.() || {};
            for (const [k, rec] of Object.entries(banquetData)) {
              if (!rec) continue;
              const recUid = String(rec.UID ?? k);
              if (recUid !== String(venueId)) continue;

              const avail = rec.avaibility ?? rec.availability ?? {};
              return {
                Morning: !!(avail.Morning ?? avail.morning ?? avail.MORNING),
                Evening: !!(avail.Evening ?? avail.evening ?? avail.EVENING),
                Night: !!(avail.Night ?? avail.night ?? avail.NIGHT),
              };
            }

            // Hall next
            const hallSnap = await get(ref(db, '/hall/unique_hall'));
            const hallData = hallSnap?.val?.() || {};
            for (const [k, rec] of Object.entries(hallData)) {
              if (!rec) continue;
              const recUid = String(rec.hall_UID ?? rec.UID ?? k);
              if (recUid !== String(venueId)) continue;

              const avail = rec.avaibility ?? rec.availability ?? {};
              return {
                Morning: !!(avail.Morning ?? avail.morning ?? avail.MORNING),
                Evening: !!(avail.Evening ?? avail.evening ?? avail.EVENING),
                Night: !!(avail.Night ?? avail.night ?? avail.NIGHT),
              };
            }
          } catch (e) {}

          // Fallback: show all
          return { Morning: true, Evening: true, Night: true };
        };

        const applyBottomDropdownAvailability = async () => {
          const avail = await getVenueAvailability();

          const ddLabel = document.getElementById('bottomEventTimeDropdownLabel');
          const hiddenInput = document.getElementById('bottomEventTimeSelect');
          const ddBtn = document.getElementById('bottomEventTimeDropdownBtn');
          const ddList = document.getElementById('bottomEventTimeDropdownList');

          if (!ddList) return;

          const optionEls = Array.from(ddList.querySelectorAll('.calendar-dd-option'));
          optionEls.forEach((el) => {
            const v = String(el.getAttribute('data-value') || '').trim();
            const allowed = !!avail[v];
            el.style.display = allowed ? '' : 'none';
            el.setAttribute('aria-hidden', allowed ? 'false' : 'true');
          });

          const allowedTimes = ['Morning', 'Evening', 'Night'].filter((t) => !!avail[t]);
          if (!allowedTimes.length) {
            if (ddLabel) ddLabel.textContent = 'No Time Available';
            if (hiddenInput) hiddenInput.value = '';
            if (ddBtn) ddBtn.setAttribute('aria-expanded', 'false');
            return { avail, allowedTimes, current: '' };
          }

          let cur = '';
          try { cur = localStorage.getItem('eventTime') || ''; } catch (e) {}
          cur = String(cur || '').trim();

          if (!cur || !avail[cur]) {
            cur = allowedTimes[0];
            try { localStorage.setItem('eventTime', cur); } catch (e) {}
          }

          if (ddLabel) ddLabel.textContent = cur;
          if (hiddenInput) hiddenInput.value = cur;

          // Ensure calendar visibility sync matches allowed times
          try { await syncCalendarVisibility(cur); } catch (e) {}

          const clampSelection = (selected) => {
            const s = String(selected || '').trim();
            if (!s) return allowedTimes[0];
            if (!avail[s]) return allowedTimes[0];
            return s;
          };

          return { avail, allowedTimes, clampSelection, current: cur };
        };
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

        const vendorAssignedVenueUid = (() => {
          try {
            const x = localStorage.getItem('vendorAssignedVenueUid');
            return x ? String(x) : String(window.__vendor_id ?? '');
          } catch (e) {
            return String(window.__vendor_id ?? '');
          }
        })();

        const renderCalendarFor = async (calendarType) => {
          const block = document.querySelector(`.calendar-block[data-calendar="${calendarType}"]`);
          if (!block) return;

          const daysContainer = block.querySelector('[data-calendar-grid] .calendar-days');
          if (!daysContainer) return;

          // booked/approved based on /user/unique_user for this vendor venueId.
          let bookedSet = new Set();
          let approvedSet = new Set();

          // red-marked dates for this vendor/time (DB: /redmarkdates/unique_redmark/<vendorEnrolledVenueUid>)
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
            const snap = await get(ref(db, '/user/unique_user'));
            const all = snap.val() || {};

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

              if (statusLower === 'pending') bookedSet.add(tdIso);
              else if (statusLower === 'approved') approvedSet.add(tdIso);
            }
          } catch (e) {
            console.warn('[vendor_panel calendar] fetch fail', e);
          }

          try {
            const rmSnap = await get(ref(db, `/redmarkdates/unique_redmark/${vendorAssignedVenueUid}`));
            const rmData = rmSnap.val() || {};
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

    // 2. STATUS & RED-MARK LOGIC (YEH HEE FIX HAI)
    // Pehle check karein agar ye date "Red Marked" hai
    if (redMarkedIsoSet.has(isoStr)) {
        dayBtn.classList.add('is-redmarked');
    }

    // Phir booking/approved check
    if (approvedSet.has(isoStr)) {
      dayBtn.classList.add('is-approved');
      dayBtn.classList.remove('is-booked-by-other');
      dayBtn.removeAttribute('aria-disabled');
    } else if (bookedSet.has(isoStr)) {
      dayBtn.classList.add('is-booked-by-other');
      dayBtn.setAttribute('aria-disabled', 'true');
    }

    // 3. CLICK EVENT
    dayBtn.addEventListener('click', async () => {
      // Agar date approved hai, toh ruk jayein
      if (dayBtn.classList.contains('is-approved')) {
        alert('Date fully reserved for this time.');
        return;
      }

      // Agar booked/pending hai, toh red mark na lagayein
      if (dayBtn.classList.contains('is-booked-by-other')) return;

      // RED MARK TOGGLE LOGIC
      const isAlreadyRed = redMarkedIsoSet.has(isoStr);
      try {
        const { set, remove } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
        const basePath = `/redmarkdates/unique_redmark/${vendorAssignedVenueUid}`;
        const [yyyy, mm, dd] = isoStr.split('-');
        const reddateVal = `${dd}/${mm}/${yyyy}|${calendarType}`;
        const childKey = `${calendarType}_${isoStr}`;
        const nodePath = `${basePath}/${childKey}`;

        if (isAlreadyRed) {
          await remove(ref(db, nodePath));
          dayBtn.classList.remove('is-redmarked');
          redMarkedIsoSet.delete(isoStr);
        } else {
          await set(ref(db, nodePath), {
            UID: vendorAssignedVenueUid,
            reddate: reddateVal,
          });
          dayBtn.classList.add('is-redmarked');
          redMarkedIsoSet.add(isoStr);
        }
      } catch (e) {
        console.error('[Calendar Redmark Toggle] failed', e);
      }

      // Selection UI
      const all = daysContainer.querySelectorAll('.cal-day');
      all.forEach((x) => x.classList.remove('is-selected'));
      dayBtn.classList.add('is-selected');

      localStorage.setItem('selectedEventTime', calendarType);
      localStorage.setItem('selectedEventDate', isoStr);
      if (typeof window.openEventTypeModal === 'function') {
        window.openEventTypeModal();
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
          if (morning) morning.style.display = v === 'Morning' ? 'block' : 'none';
          if (evening) evening.style.display = v === 'Evening' ? 'block' : 'none';
          if (night) night.style.display = v === 'Night' ? 'block' : 'none';

          await renderCalendarFor(v).catch(() => {});

          // Auto refresh marks (portfolio ki tarah): 3 seconds me calendar re-render
          // so red/yellow changes real-time dikhay dein without full page refresh.
          try {
            if (window.__vendorCalendarAutoRefreshTimer) {
              clearInterval(window.__vendorCalendarAutoRefreshTimer);
              window.__vendorCalendarAutoRefreshTimer = null;
            }
          } catch (e) {}

          window.__vendorCalendarAutoRefreshTimer = setInterval(() => {
            try {
              const currentTime = localStorage.getItem('eventTime') || v || 'Morning';
              // important: re-render current selected calendar block only
              // to avoid losing event listeners/classes on other blocks.
              renderCalendarFor(currentTime).catch(() => {});
            } catch (e) {}
          }, 3000);
        };


        // Bottom dropdown wiring
        const ddBtn = document.getElementById('bottomEventTimeDropdownBtn');
        const ddList = document.getElementById('bottomEventTimeDropdownList');
        const ddLabel = document.getElementById('bottomEventTimeDropdownLabel');
        const hiddenInput = document.getElementById('bottomEventTimeSelect');

        const setBottomDropdownValue = (v) => {
          if (!v) return;
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
            return localStorage.getItem('eventTime') || 'Morning';
          } catch (e) {
            return 'Morning';
          }
        })();

        // Apply venue availability to show only allowed time slots in dropdown
        // and clamp current selection accordingly.
        try {
          const res = await applyBottomDropdownAvailability();
          if (res?.current) {
            if (ddLabel) ddLabel.textContent = res.current;
            if (hiddenInput) hiddenInput.value = res.current;
          }
        } catch (e) {}

        initCalendarMonthNav();
        syncCalendarVisibility((localStorage.getItem('eventTime') || initTime)).catch(() => {});


      } catch (e) {
        console.warn('[vendor_panel] calendar injection failed', e);
      }

      // ===== End Bottom Calendar =====

      // Initial async work complete: cards grid + calendar injected.
      setStatus('Ready');
    })();

  } else if (viewKey === "vendor-spreadsheet") {
    pageTitle.textContent = `Welcome ${name}`;

    const vendorId = window.__vendor_id;

    viewContainer.innerHTML = `
      <div class="panel__inner">
        <div class="cardish" style="padding:18px;">
          <h2 style="margin:0 0 10px;">Vendor Spreadsheet</h2>

          <div style="display:flex;align-items:center;gap:12px;margin:0 0 14px;flex-wrap:wrap;">
            <label style="font-weight:800;color:rgba(229,231,235,0.85);">Status Filter:</label>
            <select id="vendorSpreadsheetStatusFilter" style="padding:10px 12px;border-radius:14px;border:1px solid rgba(251,113,133,0.35);background:rgba(0,0,0,0.18);color:rgba(255,255,255,0.95);font-weight:800;">
              <option value="all" selected>All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="deny">Deny</option>
            </select>

            <label style="font-weight:800;color:rgba(229,231,235,0.85);">Search:</label>
            <input
              id="vendorSpreadsheetSearch"
              type="text"
              placeholder="Name / Contact"
              style="padding:10px 12px;border-radius:14px;border:1px solid rgba(251,113,133,0.35);background:rgba(0,0,0,0.18);color:rgba(255,255,255,0.95);font-weight:800;min-width:240px;outline:none;"
            />


            <div style="display:flex;align-items:center;gap:10px;">
              <button type="button" id="vendorSpreadsheetMonthPrev" class="a-btn" style="padding:8px 10px;" aria-label="Previous month"><</button>
              <div id="vendorSpreadsheetMonthYearLabel" style="min-width:110px;text-align:center;font-weight:900;color:rgba(229,231,235,0.95);padding:8px 10px;border:1px solid rgba(251,113,133,0.35);background:rgba(0,0,0,0.18);border-radius:14px;">
                --
              </div>
              <button type="button" id="vendorSpreadsheetMonthNext" class="a-btn" style="padding:8px 10px;" aria-label="Next month">></button>
            </div>
          </div>

          <div style="overflow-x:auto;padding-bottom:10px;">
            <table id="vendorRequestsTable" style="width:100%;border-collapse:collapse;text-align:left;color:rgba(255,230,240,0.98);white-space:nowrap;">
              <thead>
                <tr style="border-bottom:1px solid rgba(251,113,133,0.25);">
                  <th style="padding:10px;">UID</th>
                  <th style="padding:10px;">Name</th>
                  <th style="padding:10px;">Contact</th>
                  <th style="padding:10px;">Event Type</th>
                  <th style="padding:10px;">Target Date</th>
                  <th style="padding:10px;">Event Time</th>
                  <th style="padding:10px;">Requested Date</th>
                  <th style="padding:10px;">Status</th>
                  <th style="padding:10px;">Action</th>
                </tr>
              </thead>
              <tbody id="vendorRequestsTbody">
                <tr>
                  <td colspan="9" style="padding:14px;color:rgba(229,231,235,0.7);font-weight:800;">
                    Loading rows...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    (async () => {
      try {
        // PERFORMANCE FIX:
        // Previously we fetched the entire `/user/unique_user` and filtered client-side.
        // Now we fetch only vendor rows by querying on `venueId`.
        // IMPORTANT: Firebase RTDB requires an .indexOn for `venueId`.
        // If index is missing, RTDB throws:
        //   "Index not defined, add .indexOn: \"venueId\" ..."
        // We'll show a clear message and fail fast instead of freezing UI.


        const { query, orderByChild, equalTo } = await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js");

        const vendorRequestsQ = query(
          ref(db, "/user/unique_user"),
          orderByChild("venueId"),
          equalTo(String(vendorId))
        );

        const snap = await get(vendorRequestsQ);

        // If RTDB rules/index missing for venueId, request might fail earlier and land in catch.
        // When it fails, we'll show a readable hint instead of leaving UI stuck.


        const tbody = document.getElementById("vendorRequestsTbody");
        if (!tbody) return;

        tbody.innerHTML = "";
        if (!snap.exists()) {
          tbody.innerHTML = `
            <tr>
              <td colspan="9" style="padding:14px;color:rgba(229,231,235,0.7);font-weight:800;">No user records found.</td>
            </tr>
          `;
          setStatus("Ready");
          return;
        }

        const data = snap.val() || {};
        const rows = [];

        for (const [id, r] of Object.entries(data)) {
          if (!r) continue;

          const portfolioType = String(r.selectedPortfolioType ?? r.portfolioType ?? "");

          const uid = r.user_UID ?? r.useruid ?? r.UID ?? r.uid ?? id;
          const nameCell = r.clientname ?? r.name ?? "";
          const contactCell = r.clientcontact ?? r.contact ?? "";
          const eventType = r.event_type ?? r.eventType ?? portfolioType ?? "";

          const targetDate = r.targetdate ?? r.targetDate ?? "";
          const eventTime = r.event_time ?? r.eventTime ?? "";
          const requestedDate = r.requesteddate ?? r.requestedDate ?? "";
          const status = r.status ?? r.approval_status ?? "pending";

          rows.push({
            uid: String(uid ?? ""),
            name: String(nameCell ?? ""),
            contact: String(contactCell ?? ""),
            eventType: String(eventType ?? ""),
            targetDate: String(targetDate ?? ""),
            eventTime: String(eventTime ?? ""),
            requestedDate: String(requestedDate ?? ""),
            status: String(status ?? ""),
            rawKey: id,
            raw: r,
          });
        }


        if (!rows.length) {
          tbody.innerHTML = `
            <tr>
              <td colspan="9" style="padding:14px;color:rgba(229,231,235,0.7);font-weight:800;">No enrollment rows to show.</td>
            </tr>
          `;
          setStatus("Ready");
          return;
        }

        const statusColor = (s) => {
          const x = String(s ?? "").toLowerCase();
          if (x.includes("approved") || x === "approved") return "rgba(34,197,94,0.95)";
          if (x.includes("deny") || x.includes("denied") || x === "denied") return "rgba(239,68,68,0.95)";
          return "rgba(251,191,36,0.95)";
        };

        // Sort by most recent first (best-effort)
        const parseRequested = (v) => {
          const s = String(v ?? '').trim();
          if (!s) return null;
          // already ISO?
          const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (iso) return new Date(s);
          // dd/mm/yyyy
          const dm = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
          if (dm) {
            const yyyy = dm[3];
            const mm = dm[2];
            const dd = dm[1];
            return new Date(`${yyyy}-${mm}-${dd}`);
          }
          // fallback
          const d = new Date(s);
          return Number.isNaN(d.getTime()) ? null : d;
        };

        rows.sort((a, b) => {
          const da = parseRequested(a.raw?.requesteddate ?? a.raw?.requestedDate ?? a.requestedDate);
          const db = parseRequested(b.raw?.requesteddate ?? b.raw?.requestedDate ?? b.requestedDate);
          if (da && db) return db.getTime() - da.getTime();
          if (da && !db) return -1;
          if (!da && db) return 1;

          // fallback: rawKey stable-ish but lexicographic; keep as last resort
          return String(b.rawKey).localeCompare(String(a.rawKey));
        });

        let activeYm = null; // format: YYYY-MM
        // default current month
        {
          const now = new Date();
          activeYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        const applyFilter = () => {
          const statusEl = document.getElementById('vendorSpreadsheetStatusFilter');
          const statusVal = String(statusEl?.value ?? 'all').toLowerCase();

          const searchEl = document.getElementById('vendorSpreadsheetSearch');
          const searchVal = String(searchEl?.value ?? '').trim().toLowerCase();

          // activeYm ko arrow se set kiya jayega (default current month)
          const filtered = rows.filter((row) => {
            // status filtering
            const st = String(row.status ?? '').toLowerCase();
            let okStatus = true;
            if (statusVal === 'all') okStatus = true;
            else if (statusVal === 'pending') okStatus = st === 'pending';
            else if (statusVal === 'approved') okStatus = st.includes('approved');
            else if (statusVal === 'deny') okStatus = st.includes('deny');
            if (!okStatus) return false;

            // search filtering (name / contact / uid)
            if (searchVal) {
              const hay = `${row.name} ${row.contact} ${row.uid}`.toLowerCase();
              if (!hay.includes(searchVal)) return false;
            }


            if (!activeYm) return true;

            // month-year filtering
            const dt = parseRequested(row.requestedDate ?? row.raw?.requesteddate ?? row.raw?.requestedDate);
            if (!dt) return false;
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const ym = `${yyyy}-${mm}`;
            return ym === activeYm;
          });

          tbody.innerHTML = filtered
            .map((row) => {
              const sCol = statusColor(row.status);
              return `
              <tr style="border-bottom:1px solid rgba(251,113,133,0.18);">
                <td style="padding:10px;">${row.uid}</td>
                <td style="padding:10px;">${row.name}</td>
                <td style="padding:10px;">${row.contact}</td>
                <td style="padding:10px;">${row.eventType}</td>
                <td style="padding:10px;">${row.targetDate}</td>
                <td style="padding:10px;">${row.eventTime}</td>
                <td style="padding:10px;">${row.requestedDate}</td>
                <td style="padding:10px;">
                  <span style="color:${sCol};font-weight:900;">${row.status}</span>
                </td>
                <td style="padding:10px;">
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${String(row.status ?? '').toLowerCase().includes('approved') || String(row.status ?? '').toLowerCase().includes('deny') ? `
                      <div style="opacity:0.75;font-weight:800;color:rgba(229,231,235,0.8);padding:6px 0;">Action Done</div>
                    ` : `
                      <button type="button" class="a-btn" style="padding:8px 10px;" data-action="approve" data-user-key="${row.rawKey}">Approve</button>
                      <button type="button" class="a-btn" style="padding:8px 10px;" data-action="deny" data-user-key="${row.rawKey}">Deny</button>
                    `}
                  </div>
                </td>
              </tr>
            `;
            })
            .join("");
        };

        // Build Month-Year dropdown options from rows, and auto-select current month/year
        const monthEl = document.getElementById('vendorSpreadsheetMonthYearFilter');
        if (monthEl) {
          const monthsSet = new Set();
          for (const row of rows) {
            const dt = parseRequested(row.requestedDate ?? row.raw?.requesteddate ?? row.raw?.requestedDate);
            if (!dt) continue;
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            monthsSet.add(`${yyyy}-${mm}`);
          }

          const monthsArr = Array.from(monthsSet).sort();
          const current = new Date();
          const currYm = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

          monthEl.innerHTML = `<option value="all" selected>All</option>`;

          // If current month exists, select it; else keep All selected.
          for (const ym of monthsArr) {
            const opt = document.createElement('option');
            opt.value = ym;
            const [y, m] = ym.split('-');
            const label = `${m}/${y}`; // MM/YYYY
            opt.textContent = label;
            if (ym === currYm) {
              opt.selected = true;
              // ensure 'All' not selected
              monthEl.value = ym;
            }
            monthEl.appendChild(opt);
          }

          // If current not found, default stays All (already selected)
          // Ensure applyFilter reads current month selection correctly.
        }

        const monthLabelEl = document.getElementById('vendorSpreadsheetMonthYearLabel');
        const updateMonthLabel = () => {
          if (!monthLabelEl || !activeYm) return;
          const [y, m] = activeYm.split('-');
          const mNum = Number(m);
          monthLabelEl.textContent = `${mNum}/${y}`; // MM/YYYY
        };
        updateMonthLabel();

        const prevBtn = document.getElementById('vendorSpreadsheetMonthPrev');
        const nextBtn = document.getElementById('vendorSpreadsheetMonthNext');

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            if (!activeYm) return;
            const [y, m] = activeYm.split('-').map(Number);
            const d = new Date(y, m - 2, 1);
            activeYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            updateMonthLabel();
            applyFilter();
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            if (!activeYm) return;
            const [y, m] = activeYm.split('-').map(Number);
            const d = new Date(y, m, 1);
            activeYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            updateMonthLabel();
            applyFilter();
          });
        }

        // initial render
        applyFilter();


        const filterEl = document.getElementById('vendorSpreadsheetStatusFilter');
        if (filterEl) {
          filterEl.addEventListener('change', () => {
            // re-render only, event delegation click handler remains on tbodyEl
            applyFilter();
          });
        }

        const searchBoxEl = document.getElementById('vendorSpreadsheetSearch');
        if (searchBoxEl) {
          searchBoxEl.addEventListener('input', () => applyFilter());
        }




        // Approve/Deny button handlers (per-row disable to prevent double action)
        const tbodyEl = document.getElementById("vendorRequestsTbody");
        if (tbodyEl) {
          tbodyEl.addEventListener("click", async (evt) => {
            const btn = evt.target?.closest?.('button[data-action][data-user-key]');
            if (!btn) return;
            evt.preventDefault();
            evt.stopPropagation();

            if (btn.disabled) return;

            const action = String(btn.dataset.action ?? "").toLowerCase();
            const rawKey = String(btn.dataset.userKey ?? "");
            if (!rawKey || (action !== 'approve' && action !== 'deny')) return;

            // Prevent double click / double write
            const row = btn.closest('tr');
            const approveBtn = row?.querySelector('button[data-action="approve"][data-user-key="' + rawKey + '"]');
            const denyBtn = row?.querySelector('button[data-action="deny"][data-user-key="' + rawKey + '"]');

            if (btn.disabled || approveBtn?.disabled || denyBtn?.disabled) return;

            // make unpressable immediately
            btn.disabled = true;
            btn.style.pointerEvents = 'none';

            if (approveBtn) {
              approveBtn.disabled = true;
              approveBtn.style.pointerEvents = 'none';
            }
            if (denyBtn) {
              denyBtn.disabled = true;
              denyBtn.style.pointerEvents = 'none';
            }
            if (approveBtn) approveBtn.disabled = true;
            if (denyBtn) denyBtn.disabled = true;

            // Optional: visual state
            if (approveBtn) approveBtn.style.opacity = '0.6';
            if (denyBtn) denyBtn.style.opacity = '0.6';

            const newStatus = action === 'approve' ? 'Approved' : 'Deny';

            try {
              setStatus(`Updating ${newStatus}...`);

              const { set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
              await set(ref(db, `/user/unique_user/${rawKey}/status`), newStatus);


              // Update status text in UI
              const statusSpan = row?.querySelector('span');
              if (statusSpan) {
                statusSpan.textContent = newStatus;
                // update color quickly
                if (newStatus === 'Approved') statusSpan.style.color = 'rgba(34,197,94,0.95)';
                if (newStatus === 'Deny') statusSpan.style.color = 'rgba(239,68,68,0.95)';
              }

              setStatus('Ready');

              // Keep user in the same Vendor Spreadsheet view.
              // (Do not redirect back to vendor-management on Approve/Deny.)
              // Optionally re-apply current filters by simply re-rendering the same view.
              try {
                renderView('vendor-spreadsheet');
                // Wait a tick so the table DOM mounts, then re-apply last filter value.
                setTimeout(() => {
                  const statusEl = document.getElementById('vendorSpreadsheetStatusFilter');
                  const searchEl = document.getElementById('vendorSpreadsheetSearch');
                  if (statusEl) statusEl.dispatchEvent(new Event('change'));
                  if (searchEl) searchEl.dispatchEvent(new Event('input'));
                }, 150);
              } catch (e) {}
            } catch (err) {
              console.error('Approve/Deny update failed:', err);
              // If write fails, re-enable buttons so vendor can retry
              btn.disabled = false;
              if (approveBtn) approveBtn.disabled = false;
              if (denyBtn) denyBtn.disabled = false;
              if (approveBtn) approveBtn.style.opacity = '';
              if (denyBtn) denyBtn.style.opacity = '';
              setStatus('Ready');
            }
          });
        }

        setStatus("Ready");
      } catch (err) {
        console.error("Spreadsheet load error:", err);
        setStatus("Ready");
        const tbody = document.getElementById("vendorRequestsTbody");
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="9" style="padding:14px;color:rgba(239,68,68,0.95);font-weight:900;">Failed to load table.</td>
            </tr>
          `;
        }
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
        const banquetSnap = await get(ref(db, '/banquet/unique_bank'));
        let target = null; // { basePath, key, standardField, seasonalField }
        if (banquetSnap.exists()) {
          const data = banquetSnap.val() || {};
          for (const [k, rec] of Object.entries(data)) {
            if (!rec) continue;
            const uid = String(rec.UID ?? k);
            if (uid === String(vendorId)) {
              target = {
                basePath: '/banquet/unique_bank',
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
          const hallSnap = await get(ref(db, '/hall/unique_hall'));
          if (hallSnap.exists()) {
            const data = hallSnap.val() || {};
            for (const [k, rec] of Object.entries(data)) {
              if (!rec) continue;
              const uid = String(rec.hall_UID ?? rec.UID ?? k);
              if (uid === String(vendorId)) {
                target = {
                  basePath: '/hall/unique_hall',
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
            // IMPORTANT: Use `update()` to avoid overwriting the full banquet/hall record.
            // Previous code used `set(..., { merge: true })` which is not safe here.
            const { update } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
            await update(ref(db, `${target.basePath}/${target.key}`), {
              [target.standardField]: stdVal,
              [target.seasonalField]: seasonalVal,
            });

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
        const { get, update } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

        // Current implementation checks both banquet and hall vendor_pass.
        // We update the same node we validate.
        const banquetRef = ref(db, '/banquet/unique_bank');
        const banquetSnap = await get(banquetRef);
        let target = null;

        if (banquetSnap.exists()) {
          const data = banquetSnap.val() || {};
          for (const [vid, record] of Object.entries(data)) {
            if (!record) continue;
            const uidMatch = String(record.UID ?? vid) === String(vendorId);
            const passMatch = String(record.vendor_pass ?? '') === currPass;
            if (uidMatch && passMatch) {
              target = { path: `/banquet/unique_bank/${vid}`, record };
              break;
            }
          }
        }

        if (!target) {
          const hallRef = ref(db, '/hall/unique_hall');
          const hallSnap = await get(hallRef);
          if (hallSnap.exists()) {
            const data = hallSnap.val() || {};
            for (const [hid, record] of Object.entries(data)) {
              if (!record) continue;
              const uidMatch = String(record.hall_UID ?? record.UID ?? hid) === String(vendorId);
              const passMatch = String(record.vendor_pass ?? '') === currPass;
              if (uidMatch && passMatch) {
                target = { path: `/hall/unique_hall/${hid}`, record };
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

        // Update vendor_pass only
        await update(ref(db, target.path), { vendor_pass: newPass });

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
  // Vendor auth: /banquet/unique_bank/* using vendor_user + vendor_pass
  const banquetRef = ref(db, "/banquet/unique_bank");
  const banquetSnap = await get(banquetRef);

  if (banquetSnap.exists()) {
    const data = banquetSnap.val();
    for (const [vendorId, record] of Object.entries(data || {})) {
      if (!record) continue;
      if (
        String(record.vendor_user ?? "") === String(username) &&
        String(record.vendor_pass ?? "") === String(password)
      ) {
        return { vendorId, record, source: "banquet" };
      }
    }
  }

  // Hall auth: /hall/unique_hall/* using vendor_user + vendor_pass (as stored in haha.json)
  const hallRef = ref(db, "/hall/unique_hall");
  const hallSnap = await get(hallRef);

  if (!hallSnap.exists()) return null;

  const hallData = hallSnap.val();
  for (const [hallId, record] of Object.entries(hallData || {})) {
    if (!record) continue;
    if (
      String(record.vendor_user ?? "") === String(username) &&
      String(record.vendor_pass ?? "") === String(password)
    ) {
      return { vendorId: hallId, record, source: "hall" };
    }
  }

  return null;
}


function setAuthedSession(vendorId) {
  // Auth will be kept only in-memory for this page session.
  // But we also persist assigned venue UID for pending-counter mapping.
  window.__vendor_authed = true;
  window.__vendor_id = vendorId;

  try {
    if (vendorId !== undefined && vendorId !== null) {
      localStorage.setItem("vendorAssignedVenueUid", String(vendorId));
    }
  } catch (e) {}
}


function clearSession() {
  window.__vendor_authed = false;
  window.__vendor_id = undefined;
}

function isAuthed() {
  return window.__vendor_authed === true;
}



// Initial auth state
if (isAuthed()) {
  setOverlayHidden(true);
  setStatus("Authenticated");
  // default render
  renderView("vendor-management");
} else {
  setOverlayHidden(false);
  setStatus("Locked");
}

verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
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
    setAuthedSession(match.vendorId);
    setOverlayHidden(true);
    document.getElementById("pageTitle").textContent = `Welcome ${name}`;

    // --- FIXED COUNTDOWN LOGIC ---
    try {
      const vendorIdStr = String(match.vendorId ?? "");
      if (vendorIdStr) {
        const { get, set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
        const updateCountdown = async (baseRef) => {
          const snap = await get(ref(db, baseRef));
          if (!snap.exists()) return;
          const data = snap.val() || {};
          const updates = [];
          const today = new Date("2026-07-08"); // Current System Date

          for (const [docId, rec] of Object.entries(data)) {
            const recordUid = String(rec.UID ?? rec.uid ?? rec.hall_UID ?? rec.hallId ?? rec.id ?? rec.vendorId ?? "");
            if (recordUid === vendorIdStr && rec.expiredate) {
              const expireDate = new Date(rec.expiredate);
              // Calculation: (Expiry - Today)
              const diffTime = expireDate - today;
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              // Direct value update (Negative means expired)
              updates.push(set(ref(db, `${baseRef}/${docId}/countdowndays`), String(diffDays)));
            }
          }
          await Promise.all(updates);
        };

        await updateCountdown('/banquet/unique_bank');
        await updateCountdown('/hall/unique_hall');
      }
    } catch (e) {
      console.error('Update error:', e);
    }
    renderView("vendor-management");
  } catch (err) {
    console.error("Error:", err);
    setMessage("Verification failed.", true);
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