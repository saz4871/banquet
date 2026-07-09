// Master Record (Vendor Spreadsheet style) helper
// Intentionally self-contained-ish and imported dynamically from admin_dashboard.js

export async function initMasterRecordVendorSpreadsheet() {
  const tbody = document.getElementById('masterVendorRequestsTbody');
  if (!tbody) return;

  const statusEl = document.getElementById('masterVendorSpreadsheetStatusFilter');
  const searchEl = document.getElementById('masterVendorSpreadsheetSearch');
  const refreshBtn = document.getElementById('masterVendorSpreadsheetRefreshBtn');

  const { database } = await import('./firebaseconfig.js');
  const { get, ref } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

  const setStatusMsg = (txt) => {
    const pill = document.getElementById('statusPill');
    if (pill) {
      pill.textContent = txt;
      // keep border default
    }
  };

  const renderEmpty = (msg) => {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="padding:14px;color:rgba(229,231,235,0.7);font-weight:800;">${msg}</td>
      </tr>
    `;
  };

  let rows = [];

  const parseRequested = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(s);
    const dm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dm) {
      const dd = dm[1].padStart(2, '0');
      const mm = dm[2].padStart(2, '0');
      const yyyy = dm[3];
      return new Date(`${yyyy}-${mm}-${dd}`);
    }
    const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
  };

  const statusColor = (s) => {
    const x = String(s ?? '').toLowerCase();
    if (x.includes('approved') || x === 'approved') return 'rgba(34,197,94,0.95)';
    if (x.includes('deny') || x.includes('denied') || x === 'denied') return 'rgba(239,68,68,0.95)';
    return 'rgba(251,191,36,0.95)';
  };

  const applyFilters = () => {
    const st = String(statusEl?.value ?? 'all').toLowerCase();
    const q = String(searchEl?.value ?? '').trim().toLowerCase();

    // Month/Year filter from label controlled by < and > arrows
    // Example label: "July 2026"
    const monthLabelEl = document.getElementById('masterRecordMonthLabel');
    const monthLabel = monthLabelEl ? String(monthLabelEl.textContent ?? '').trim() : '';
    let selectedYM = null; // { y, m } where m is 1-12

    if (monthLabel) {
      const m1 = monthLabel.match(/^([A-Za-z]+)\s+(\d{4})$/);
      if (m1) {
        const monthName = String(m1[1]).toLowerCase();
        const year = parseInt(String(m1[2]), 10);
        const monthMap = {
          january: 1,
          february: 2,
          march: 3,
          april: 4,
          may: 5,
          june: 6,
          july: 7,
          august: 8,
          september: 9,
          october: 10,
          november: 11,
          december: 12,
        };
        const mm = monthMap[monthName];
        if (Number.isFinite(mm) && mm >= 1 && mm <= 12 && Number.isFinite(year)) {
          selectedYM = { y: year, m: mm };
        }
      }
    }

    const filtered = rows.filter((row) => {
      const rs = String(row.status ?? '').toLowerCase();

      if (st !== 'all') {
        if (st === 'pending') {
          if (!(rs.includes('pending') || rs.includes('awaiting'))) return false;
        } else if (st === 'approved') {
          if (!rs.includes('approved')) return false;
        } else if (st === 'deny') {
          if (!(rs.includes('deny') || rs.includes('denied'))) return false;
        }
      }

      if (q) {
        const hay = `${row.name} ${row.contact} ${row.uid} ${row.venueUid}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Apply Requested Date month/year matching
      if (selectedYM) {
        const d = parseRequested(row.requestedDate);
        if (!d) return false;
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        if (y !== selectedYM.y || m !== selectedYM.m) return false;
      }

      return true;
    });

    tbody.innerHTML = filtered.map((row) => {
      const sCol = statusColor(row.status);
      const raw = row.raw;
      const rawKey = row.rawKey;
      const lower = String(row.status ?? '').toLowerCase();

      const actionBlock = (lower.includes('approved') || lower.includes('deny'))
        ? `<div style="opacity:0.75;font-weight:800;color:rgba(229,231,235,0.8);padding:6px 0;">Action Done</div>`
        : `
            <div style="opacity:0.7;font-weight:800;color:rgba(229,231,235,0.5);padding:6px 0;">Pending</div>
          `;

      return `
        <tr style="border-bottom:1px solid rgba(251,113,133,0.18);">
        <td style="padding:10px;">${row.uid}</td>
          <td style="padding:10px;">${row.name}</td>
          <td style="padding:10px;">${row.contact}</td>
          <td style="padding:10px;">${row.venueUid}</td>
          <td style="padding:10px;">${row.eventType}</td>
          <td style="padding:10px;">${row.targetDate}</td>
          <td style="padding:10px;">${row.eventTime}</td>
          <td style="padding:10px;">${row.requestedDate}</td>
          <td style="padding:10px;">
            <span style="color:${sCol};font-weight:900;">${row.status}</span>
          </td>
        </tr>
      `;
    }).join('');

    // attach action handler via delegation
    tbody.onclick = null;
  };

  const loadRows = async () => {
    setStatusMsg('Loading...');
    tbody.innerHTML = '';
    renderEmpty('Loading...');

    const snap = await get(ref(database, '/user/unique_user'));
    if (!snap.exists()) {
      rows = [];
      renderEmpty('No user records found.');
      setStatusMsg('Ready');
      return;
    }

    const data = snap.val() || {};
    const out = [];

    for (const [id, r] of Object.entries(data)) {
      if (!r) continue;

      const portfolioType = String(r.selectedPortfolioType ?? r.portfolioType ?? '');
      const uid = r.user_UID ?? r.useruid ?? r.UID ?? r.uid ?? id;
      out.push({
        rawKey: id,
        uid: String(uid ?? ''),
        name: String(r.clientname ?? r.name ?? ''),
        contact: String(r.clientcontact ?? r.contact ?? ''),
        eventType: String(r.event_type ?? r.eventType ?? portfolioType ?? ''),
        targetDate: String(r.targetdate ?? r.targetDate ?? ''),
        eventTime: String(r.event_time ?? r.eventTime ?? ''),
        requestedDate: String(r.requesteddate ?? r.requestedDate ?? ''),
        venueUid: String(r.venueId ?? r.venueUID ?? r.venueuid ?? ''),
        status: String(r.status ?? r.approval_status ?? 'pending'),
        raw: r,
      });
    }

    // sort by requested date desc
    out.sort((a, b) => {
      const da = parseRequested(a.requestedDate);
      const db = parseRequested(b.requestedDate);
      if (da && db) return db.getTime() - da.getTime();
      if (da && !db) return -1;
      if (!da && db) return 1;
      return String(b.rawKey).localeCompare(String(a.rawKey));
    });

    rows = out;
    if (!rows.length) {
      renderEmpty('No enrollment rows to show.');
    }

    applyFilters();
    setStatusMsg('Ready');
  };

  // initial load + filters
  if (statusEl) statusEl.onchange = applyFilters;
  if (searchEl) searchEl.oninput = applyFilters;

  // Month back/forward arrows wiring (data-month-nav prev/next)
  const monthLabelEl = document.getElementById('masterRecordMonthLabel');
  const prevBtn = document.querySelector('.calendar-month__chev[data-month-nav="prev"]');
  const nextBtn = document.querySelector('.calendar-month__chev[data-month-nav="next"]');

  const calendarEl = document.querySelector('.calendar-month[data-month-label="master-record-date"]');
  if (calendarEl) {
    // UI alignment: calendar label ko hi source of truth banao
    calendarEl.setAttribute('data-active-month-label', 'master-record-date');
  }


  const parseMonthLabel = (labelText) => {
    const s = String(labelText ?? '').trim();
    const m1 = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (!m1) return null;
    const monthName = String(m1[1]).toLowerCase();
    const year = parseInt(String(m1[2]), 10);
    const monthMap = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };
    const mm = monthMap[monthName];
    if (!Number.isFinite(mm) || !Number.isFinite(year)) return null;
    return { y: year, m: mm };
  };

  const formatMonthLabel = (y, m1to12) => {
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];
    const idx = m1to12 - 1;
    if (idx < 0 || idx > 11) return '';
    return `${monthNames[idx]} ${y}`;
  };

  const shiftMonthLabel = (delta) => {
    if (!monthLabelEl) return;
    const cur = parseMonthLabel(monthLabelEl.textContent);
    if (!cur) return;
    let y = cur.y;
    let m = cur.m + delta;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    monthLabelEl.textContent = formatMonthLabel(y, m);
    applyFilters();
  };

  if (prevBtn) prevBtn.addEventListener('click', () => shiftMonthLabel(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => shiftMonthLabel(1));


  if (refreshBtn) {
    refreshBtn.onclick = () => loadRows().catch(console.error);
  }

  // Approve/Deny buttons intentionally removed from UI for this view.
  // (No click handler needed.)

  // Align label to current month on first render
  try {
    const monthLabelEl = document.getElementById('masterRecordMonthLabel');
    if (monthLabelEl) {
      const now = new Date();
      const monthNames = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December',
      ];
      monthLabelEl.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }
  } catch (_) {}

  await loadRows();
}


