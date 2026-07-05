const viewTitleByKey = {
  "banquet-management": "Banquet Management",
  "banquet-spreadsheet": "Banquet Spreadsheet",
  "hall-management": "Hall Management",
  "hall-spreadsheet": "Hall Spreadsheet",
};

const viewHtmlByKey = {
  "banquet-management": `
    <div class="cardish">
    <h2>Banquet Record</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
        <label>UID</label>
        <input id="banquet_uid" type="text" placeholder="e.g. 12345" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        <input id="banquet_uid_key" type="hidden" value="">
      </div>
      <div style="border: 1px solid var(--primary); padding: 10px; border-radius: 8px;">
        <h3 style="margin: 0 0 5px 0; font-size: 14px; color: var(--primary);">VENDOR CREDENTIALS</h3>
        <div style="display: flex; gap: 10px;">
          <input id="banquet_vendor_user" type="text" placeholder="Vendor Username" style="width: 100%; padding: 5px; border-radius: 4px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
          <input id="banquet_vendor_pass" type="text" placeholder="Password" style="width: 100%; padding: 5px; border-radius: 4px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
      </div>
    </div>

    <div style="margin-top: 15px;">
      <label>Banquet Showcase Name</label>
      <input id="banquet_bankname" type="text" style="width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
          <label>User Name</label>
          <input id="banquet_user" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
        <div>
          <label>Location Link</label>
          <input id="banquet_loc_link" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: start;">
        <div>
          <label style="display: block;">Location Text</label>
          <input id="banquet_loc_text" type="text" style="width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
        <div>
          <label style="display: block;">Capacity</label>
          <input id="banquet_capacity" type="text" style="width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <label>Whatsapp</label>
          <input id="banquet_whatsapp" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
        <div>
          <label>Start Date</label>
          <input id="banquet_startdate" type="date" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
        <div>
          <label>Standard Rate:</label>
          <input id="banquet_standard" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
        <div>
          <label>Seasonal Rate:</label>
          <input id="banquet_seasonal" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
        <div>
          <label>Youtube Embeded Link</label>
          <input id="banquet_ytlink" type="text" style="width: 203%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>
      </div>

      <div style="margin-top: 12px;">
        <label>Upload Gallery Images</label>
        <input id="banquet_img_file" type="file" accept="image/*" multiple style="width: 21%; padding: 8px; margin-top: 5px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);" />
        <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
          <div id="banquet_img_preview" style="width:160px; height:110px; flex-shrink: 0; border-radius:10px; overflow:hidden; border:1px solid rgba(251,113,133,0.35); display:flex; align-items:center; justify-content:center; color: var(--muted); font-size:12px; background-size: cover; background-position: center; background-color: rgba(0,0,0,0.2);">No Preview</div>
          <div style="flex:1; min-width:240px;">
            <div style="color: var(--muted); font-size:12px; margin-bottom:6px;">Double-click an image to set as cover.</div>
            <div id="banquet_img_thumbs" style="display:flex; flex-wrap:wrap; gap:10px; min-height: 110px;"></div>
          </div>
        </div>
        <input id="banquet_img" type="hidden" value="" />
      </div>

      <div style="margin-top: 15px;">
        <label>Specialisation</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 5px;">
          <label><input id="banquet_spec_lux" type="checkbox"> Luxury Seating/Suite</label>
          <label><input id="banquet_spec_master_class" type="checkbox"> Master-Class Catering Team</label>
          <label><input id="banquet_spec_cctv" type="checkbox"> Monitoring CCTV Setup</label>
          <label><input id="banquet_spec_theme" type="checkbox"> Custom Immersive Themes</label>
          <label><input id="banquet_spec_valet" type="checkbox"> Premium Elite Valet System</label>
        </div>
      </div>

      <div style="margin-top: 15px;">
        <label>Details</label>
        <textarea id="banquet_details" style="width: 100%; height: 80px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);"></textarea>
      </div>

      <div style="margin-top: 15px;">
        <button class="a-btn" style="background: var(--primary); color: white;">Save/Update</button>
        <button class="a-btn">Clear</button>
      </div>
    </div>
  `,

  "banquet-spreadsheet": `
    <div class="cardish">
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="display:flex; gap:12px; align-items:center; flex-wrap: wrap;">
          <label style="display:flex; align-items:center; gap:8px; color: var(--muted); font-weight:700;">
            <span>Status:</span>
            <select id="banquetStatusFilter" style="padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
              <option value="all" selected>All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </label>

          <input type="text" id="searchInput" placeholder="Search records..." style="padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>

        <button onclick="exportTableToPDF('banquetTable')" class="a-btn">Export PDF</button>
      </div>
      <div style="overflow-x: auto; padding-bottom: 10px;">
        <table id="banquetTable" style="width: 100%; border-collapse: collapse; margin-top: 15px; text-align: left; color: var(--text); white-space: nowrap;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border);">
              <th style="padding: 10px;">UID</th>
              <th style="padding: 10px;">Cover Image</th>
              <th style="padding: 10px;">Banquet Name</th>
              <th style="padding: 10px;">User Name</th>
              <th style="padding: 10px;">Contact</th>
              <th style="padding: 10px;">Vendor Username</th>
              <th style="padding: 10px;">Vendor Password</th>
              <th style="padding: 10px;">Start Date</th>
              <th style="padding: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `,

  "hall-management": `
    <div class="cardish" style="background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border);">
  <h2 style="margin-top: 0;">Hall Record</h2>
  
  <!-- Row 1: UID and Vendor Credentials -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
    <div>
      <label>UID</label>
      <input id="hall_uid" type="text" placeholder="e.g. 12345" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      <input id="hall_uid_key" type="hidden" value="">
    </div>
    <div style="border: 1px solid var(--primary); padding: 10px; border-radius: 8px;">
      <h3 style="margin: 0 0 5px 0; font-size: 14px; color: var(--primary);">VENDOR CREDENTIALS</h3>
      <div style="display: flex; gap: 10px;">
        <input id="hall_vendor_user" type="text" placeholder="Username" style="width: 100%; padding: 5px; border-radius: 4px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        <input id="hall_vendor_pass" type="text" placeholder="Password" style="width: 100%; padding: 5px; border-radius: 4px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
    </div>
  </div>

  <!-- Row 2: Basic Info -->
  <div style="margin-top: 15px;">
    <label>Hall Showcase Name</label>
    <input id="hall_bankname" type="text" style="width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
        <label>User Name</label>
        <input id="hall_user" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
      <div>
        <label>Location Link</label>
        <input id="hall_loc_link" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: start;">
      <div>
        <label style="display: block; margin-top: 10px;">Location Text</label>
        <input id="hall_loc_text" type="text" style="width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
      <div>
        <label style="display: block; margin-top: 10px;">Capacity</label>
        <input id="hall_capacity" type="text" style="width: 100%; padding: 8px; margin-top: 5px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
    </div>

    <!-- Row 3: Rates and Contacts -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
        <label>Whatsapp</label>
        <input id="hall_whatsapp" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
      <div>
        <label>Start Date</label>
        <input id="hall_startdate" type="date" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
      <div>
        <label>Standard Rate</label>
        <input id="hall_standard" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
      <div>
        <label>Seasonal Rate</label>
        <input id="hall_seasonal" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
      </div>
    </div>

    <!-- YouTube Link: Full width -->
    <div style="margin-top: 15px;">
      <label>Youtube Embedded Link</label>
      <input id="hall_ytlink" type="text" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
    </div>
  </div>
</div>
      <div style="margin-top: 12px;">
        <label>Upload Gallery Images</label>
        <input id="hall_img_file" type="file" accept="image/*" multiple style="width: 21%; padding: 8px; margin-top: 5px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);" />
        <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
          <div id="hall_img_preview" style="width:160px; height:110px; flex-shrink: 0; border-radius:10px; overflow:hidden; border:1px solid rgba(251,113,133,0.35); display:flex; align-items:center; justify-content:center; color: var(--muted); font-size:12px; background-size: cover; background-position: center; background-color: rgba(0,0,0,0.2);">No Preview</div>
          <div style="flex:1; min-width:240px;">
            <div style="color: var(--muted); font-size:12px; margin-bottom:6px;">Double-click an image to set as cover.</div>
            <div id="hall_img_thumbs" style="display:flex; flex-wrap:wrap; gap:10px; min-height: 110px;"></div>
          </div>
        </div>
        <input id="hall_img" type="hidden" value="" />
      </div>

      <div style="margin-top: 15px;">
        <label>Specialisation</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 5px;">
          <label><input id="hall_spec_lux" type="checkbox"> Luxury Seating/Suite</label>
          <label><input id="hall_spec_master_class" type="checkbox"> Master-Class Catering Team</label>
          <label><input id="hall_spec_cctv" type="checkbox"> Monitoring CCTV Setup</label>
          <label><input id="hall_spec_theme" type="checkbox"> Custom Immersive Themes</label>
          <label><input id="hall_spec_valet" type="checkbox"> Premium Elite Valet System</label>
        </div>
      </div>

      <div style="margin-top: 15px;">
        <label>Details</label>
        <textarea id="hall_details" style="width: 100%; height: 80px; margin-top: 5px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);"></textarea>
      </div>

      <div style="margin-top: 15px;">
        <button class="a-btn" style="background: var(--primary); color: white;">Save/Update</button>
        <button class="a-btn">Clear</button>
      </div>
    </div>
  `,

  "hall-spreadsheet": `
    <div class="cardish">
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="display:flex; gap:12px; align-items:center; flex-wrap: wrap;">
          <label style="display:flex; align-items:center; gap:8px; color: var(--muted); font-weight:700;">
            <span>Status:</span>
            <select id="hallStatusFilter" style="padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
              <option value="all" selected>All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </label>

          <input type="text" id="searchInput" placeholder="Search records..." style="padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text);">
        </div>

        <button onclick="exportTableToPDF('hallTable')" class="a-btn">Export PDF</button>
      </div>
      <div style="overflow-x: auto; padding-bottom: 10px;">
        <table id="hallTable" style="width: 100%; border-collapse: collapse; margin-top: 15px; text-align: left; color: var(--text); white-space: nowrap;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border);">
              <th style="padding: 10px; white-space: nowrap;">UID</th>
              <th style="padding: 10px; white-space: nowrap;">Cover Image</th>
              <th style="padding: 10px; white-space: nowrap;">Hall Name</th>
              <th style="padding: 10px; white-space: nowrap;">User Name</th>
              <th style="padding: 10px; white-space: nowrap;">Contact</th>
              <th style="padding: 10px; white-space: nowrap;">Vendor Username</th>
              <th style="padding: 10px; white-space: nowrap;">Vendor Password</th>
              <th style="padding: 10px; white-space: nowrap;">Start Date</th>
              <th style="padding: 10px; white-space: nowrap;">Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

    </div>
  `
};

const navItems = Array.from(document.querySelectorAll(".nav__item"));
const pageTitle = document.getElementById("pageTitle");
const statusPill = document.getElementById("statusPill");
const viewContainer = document.getElementById("viewContainer");

function setActive(key) {
  navItems.forEach((btn) => {
    const isActive = btn.dataset.view === key;
    btn.classList.toggle("is-active", isActive);
  });
}

function renderView(key) {
  const title = viewTitleByKey[key] || "Admin Dashboard";
  pageTitle.textContent = title;

  const html = viewHtmlByKey[key] || `<div class="cardish"><h2>${title}</h2><p>Coming soon.</p></div>`;
  viewContainer.innerHTML = html;

  if (statusPill) {
    statusPill.textContent = "Loaded";
  }

  // Naya Update: Banquet management view ke liye engine activate karein
  if (key === "banquet-management") {
    initBanquetFileBrowseUx();

    // Save/Update button: validation first
    const saveBtn = viewContainer.querySelector('button.a-btn[style*="background: var(--primary)"]');
    if (saveBtn && !saveBtn.dataset.boundSaveToast) {
      saveBtn.dataset.boundSaveToast = 'true';
      saveBtn.addEventListener('click', async () => {
        // Prevent accidental double-submit UI
        try {
          saveBtn.classList.add('is-pressed');
          setTimeout(() => saveBtn.classList.remove('is-pressed'), 250);
        } catch (_) {}

        const pill = document.getElementById('statusPill');
        if (pill) {
          pill.textContent = 'Validating...';
          pill.style.borderColor = 'rgba(251, 191, 36, 0.55)';
        }

        const validation = validateBanquetManagementForm();
        if (!validation.ok) {
          if (pill) {
            pill.textContent = validation.message || 'Validation failed';
            pill.style.borderColor = 'rgba(244, 63, 94, 0.6)';
          }
          if (validation.firstEl && typeof validation.firstEl.focus === 'function') {
            try {
              validation.firstEl.focus();
            } catch (_) {}
          }
          return;
        }

        if (pill) {
          pill.textContent = 'Saving...';
          pill.style.borderColor = 'rgba(52, 211, 153, 0.5)';
        }

        try {
          const saved = await upsertBanquetRecord();
          if (pill) {
          pill.textContent = saved?.mode === 'update' ? 'Operation Successful!' : 'Operation Successful!';
            pill.style.borderColor = 'rgba(52, 211, 153, 0.5)';
          alert('Operation Successful');
          }

          // After save/update: clear form for banquet-management
          clearBanquetManagementForm();

          // After user closes the popup (or taps OK), move to spreadsheet and refresh
          setActive('banquet-spreadsheet');
          renderView('banquet-spreadsheet');
          loadBanquetSpreadsheetRows().catch((e) => console.error(e));


          // After save, if user is on spreadsheet tab, refresh rows.

          const activeNav = navItems.find((b) => b.classList.contains('is-active'));
          if (activeNav?.dataset.view === 'banquet-spreadsheet') {
            loadBanquetSpreadsheetRows().catch((e) => console.error(e));
          }
        } catch (e) {
          console.error(e);
          if (pill) {
            pill.textContent = 'Save failed. Check console.';
            pill.style.borderColor = 'rgba(244, 63, 94, 0.6)';
          }
        }
      });


    }

    // Clear button wiring (ensures UID becomes editable + all fields/images reset)
    const clearBtn = document.querySelector('#viewContainer .cardish .a-btn:not([style*="background: var(--primary)"])');
    // More robust: bind by the exact Clear text button inside the banquet card
    const clearBtnExact = Array.from(viewContainer.querySelectorAll('button.a-btn')).find((b) => b.textContent.trim() === 'Clear');
    const btnToBind = clearBtnExact || clearBtn;
    if (btnToBind && !btnToBind.dataset.boundClear) {
      btnToBind.dataset.boundClear = 'true';
      btnToBind.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          btnToBind.classList.add('is-pressed');
          setTimeout(() => btnToBind.classList.remove('is-pressed'), 250);

          const pill = document.getElementById('statusPill');
          if (pill) pill.textContent = 'Cleared';
        } catch (_) {}
        clearBanquetManagementForm();
      });

    }
  }

// Hall: validation + save/update wiring
  if (key === "hall-management") {
    initHallFileBrowseUx();

    const saveBtn = viewContainer.querySelector('button.a-btn[style*="background: var(--primary)"]');
    if (saveBtn && !saveBtn.dataset.boundHallSave) {
      saveBtn.dataset.boundHallSave = 'true';
      saveBtn.addEventListener('click', async () => {
        const pill = document.getElementById('statusPill');
        if (pill) {
          pill.textContent = 'Validating...';
          pill.style.borderColor = 'rgba(251, 191, 36, 0.55)';
        }

        const validation = validateHallManagementForm();
        if (!validation.ok) {
          if (pill) {
            pill.textContent = validation.message || 'Validation failed';
            pill.style.borderColor = 'rgba(244, 63, 94, 0.6)';
          }
          if (validation.firstEl && typeof validation.firstEl.focus === 'function') {
            try {
              validation.firstEl.focus();
            } catch (_) {}
          }
          return;
        }

        if (pill) {
          pill.textContent = 'Saving...';
          pill.style.borderColor = 'rgba(52, 211, 153, 0.5)';
        }

        try {
          const saved = await upsertHallRecord();
          if (pill) {
            pill.textContent = 'Operation Successful!';
            pill.style.borderColor = 'rgba(52, 211, 153, 0.5)';
          }

          clearHallManagementForm();

          setTimeout(() => {
            // Save success popup + then clear form + navigate
            alert('Operation Successful');
            clearHallManagementForm();
            setActive('hall-spreadsheet');
            renderView('hall-spreadsheet');
            loadHallSpreadsheetRows().catch((e) => console.error(e));
          }, 0);

        } catch (e) {
          console.error(e);
          if (pill) {
            pill.textContent = 'Save failed. Check console.';
            pill.style.borderColor = 'rgba(244, 63, 94, 0.6)';
          }
        }
      });
    }

    // Clear button wiring
    const clearBtnExact = Array.from(viewContainer.querySelectorAll('button.a-btn')).find((b) => b.textContent.trim() === 'Clear');
    const btnToBind = clearBtnExact;
    if (btnToBind && !btnToBind.dataset.boundHallClear) {
      btnToBind.dataset.boundHallClear = 'true';
      btnToBind.addEventListener('click', (e) => {
        e.preventDefault();
        clearHallManagementForm();
      });
    }
  }
}


function validateBanquetManagementForm() {
  const getEl = (id) => document.getElementById(id);
  const getVal = (id) => {
    const el = getEl(id);
    return el ? String(el.value ?? '').trim() : '';
  };

  const markBad = (el) => {
    if (!el) return;
    try {
      el.style.outline = '2px solid rgba(244, 63, 94, 0.9)';
      el.style.outlineOffset = '2px';
    } catch (_) {}
  };

  const requireField = (id, label) => {
    const el = getEl(id);
    const v = getVal(id);
    if (!v) {
      markBad(el);
      return { ok: false, firstEl: el, message: `${label} is required.` };
    }
    return null;
  };

  // UID is optional in create vs update mode; but if you want it required, uncomment.
  // const uidErr = requireField('banquet_uid', 'UID'); if (uidErr) return uidErr;

  const requiredChecks = [
    ['banquet_vendor_user', 'Vendor Username'],
    ['banquet_vendor_pass', 'Vendor Password'],
    ['banquet_bankname', 'Banquet Showcase Name'],
    ['banquet_user', 'User Name'],
    ['banquet_loc_link', 'Location Link'],
    ['banquet_loc_text', 'Location Text'],
    ['banquet_capacity', 'Capacity'],
    ['banquet_whatsapp', 'Whatsapp'],
    ['banquet_startdate', 'Start Date'],
    ['banquet_standard', 'Standard Rate'],
    ['banquet_seasonal', 'Seasonal Rate'],
    ['banquet_ytlink', 'Youtube Embeded Link'],
    ['banquet_details', 'Details'],
  ];


  for (const [id, label] of requiredChecks) {
    const err = requireField(id, label);
    if (err) return err;
  }

  // Rate validation: number check
  const isNumericStr = (s) => {
    const x = String(s ?? '').trim();
    if (!x) return false;
    return /^-?\d+(\.\d+)?$/.test(x);
  };

  const standardVal = getVal('banquet_standard');
  const seasonalVal = getVal('banquet_seasonal');

  if (!isNumericStr(standardVal)) {
    const el = getEl('banquet_standard');
    markBad(el);
    return { ok: false, firstEl: el, message: 'Standard Rate must be a valid number.' };
  }

  if (!isNumericStr(seasonalVal)) {
    const el = getEl('banquet_seasonal');
    markBad(el);
    return { ok: false, firstEl: el, message: 'Seasonal Rate must be a valid number.' };
  }

  // cover/pic validation (hidden field holds selected cover base64/url)
  const coverHidden = getEl('banquet_img');

  const coverVal = coverHidden ? String(coverHidden.value ?? '').trim() : '';
  if (!coverVal) {
    // Prefer showing error on file input if hidden missing
    const fileEl = getEl('banquet_img_file') || coverHidden;
    markBad(fileEl);
    return {
      ok: false,
      firstEl: fileEl,
      message: 'Please upload/select a cover image (gallery pic).',
    };
  }

  // Specialisation: at least one checkbox checked
  const specIds = [
    'banquet_spec_lux',
    'banquet_spec_master_class',
    'banquet_spec_cctv',
    'banquet_spec_theme',
    'banquet_spec_valet',
  ];

  const anyChecked = specIds.some((id) => {
    const cb = getEl(id);
    return cb ? !!cb.checked : false;
  });

  if (!anyChecked) {
    const firstCb = getEl(specIds[0]);
    markBad(firstCb);
    return {
      ok: false,
      firstEl: firstCb,
      message: 'Select at least one Specialisation checkbox.',
    };
  }

  return { ok: true };
}

function validateHallManagementForm() {
  const getEl = (id) => document.getElementById(id);
  const getVal = (id) => {
    const el = getEl(id);
    return el ? String(el.value ?? '').trim() : '';
  };

  const markBad = (el) => {
    if (!el) return;
    try {
      el.style.outline = '2px solid rgba(244, 63, 94, 0.9)';
      el.style.outlineOffset = '2px';
    } catch (_) {}
  };

  const requireField = (id, label) => {
    const el = getEl(id);
    const v = getVal(id);
    if (!v) {
      markBad(el);
      return { ok: false, firstEl: el, message: `${label} is required.` };
    }
    return null;
  };

  const requiredChecks = [
    ['hall_vendor_user', 'Vendor Username'],
    ['hall_vendor_pass', 'Vendor Password'],
    ['hall_bankname', 'Hall Showcase Name'],
    ['hall_user', 'User Name'],
    ['hall_loc_link', 'Location Link'],
    ['hall_loc_text', 'Location Text'],
    ['hall_whatsapp', 'Whatsapp'],
    ['hall_startdate', 'Start Date'],
    ['hall_ytlink', 'Youtube Embeded Link'],
    ['hall_details', 'Details'],
    ['hall_capacity', 'Capacity'],
  ];

  for (const [id, label] of requiredChecks) {
    const err = requireField(id, label);
    if (err) return err;
  }

  // cover/pic validation (hidden field holds selected cover base64/url)
  const coverHidden = getEl('hall_img');
  const coverVal = coverHidden ? String(coverHidden.value ?? '').trim() : '';
  if (!coverVal) {
    const fileEl = getEl('hall_img_file') || coverHidden;
    markBad(fileEl);
    return {
      ok: false,
      firstEl: fileEl,
      message: 'Please upload/select a cover image (gallery pic).',
    };
  }

  // Specialisation: at least one checkbox checked
  const specIds = [
    'hall_spec_lux',
    'hall_spec_master_class',
    'hall_spec_cctv',
    'hall_spec_theme',
    'hall_spec_valet',
  ];

  const anyChecked = specIds.some((id) => {
    const cb = getEl(id);
    return cb ? !!cb.checked : false;
  });

  if (!anyChecked) {
    const firstCb = getEl(specIds[0]);
    markBad(firstCb);
    return {
      ok: false,
      firstEl: firstCb,
      message: 'Select at least one Specialisation checkbox.',
    };
  }

  return { ok: true };
}




function clearBanquetManagementForm() {
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };

  setVal("banquet_uid", "");
  setVal("banquet_uid_key", "");

  // Clear pe UID wapas editable (and style reset)
  const uidEl = document.getElementById("banquet_uid");
  if (uidEl) {
    uidEl.readOnly = false;
    uidEl.style.cursor = "";
    uidEl.style.opacity = "";
  }
  setVal("banquet_vendor_user", "");
  setVal("banquet_vendor_pass", "");
  setVal("banquet_bankname", "");
  setVal("banquet_user", "");
  setVal("banquet_loc_link", "");
  setVal("banquet_loc_text", "");
  setVal("banquet_whatsapp", "");
  setVal("banquet_capacity", "");
  setVal("banquet_startdate", "");
  setVal("banquet_standard", "");
  setVal("banquet_seasonal", "");
  setVal("banquet_ytlink", "");
  setVal("banquet_img", "");
  setVal("banquet_details", "");



  // Clear thumbnails container + file input so images/entries reset fully
  const thumbsWrap = document.getElementById("banquet_img_thumbs");
  if (thumbsWrap) thumbsWrap.innerHTML = "";

  const fileInput = document.getElementById("banquet_img_file");
  if (fileInput) fileInput.value = "";

  const specIds = [
    "banquet_spec_lux",
    "banquet_spec_master_class",
    "banquet_spec_cctv",
    "banquet_spec_theme",
    "banquet_spec_valet",
  ];
  specIds.forEach((id) => {
    const cb = document.getElementById(id);
    if (cb) cb.checked = false;
  });

  const preview = document.getElementById("banquet_img_preview");
  if (preview) {
    preview.textContent = "No Preview";
    preview.innerHTML = "No Preview";
  }
}

function setBanquetImgPreview(url) {
  const preview = document.getElementById("banquet_img_preview");
  if (!preview) return;

  const clean = url ? String(url).trim() : "";
  if (!clean) {
    preview.textContent = "No Preview";
    preview.innerHTML = "No Preview";
    return;
  }

  // Use high quality rendering without scaling artifacts
  preview.innerHTML = `<img src="${clean}" alt="Cover" decoding="async" loading="lazy" style="width:100%;height:100%;object-fit:cover;image-rendering: -webkit-optimize-contrast;"/>`;
}

function setBanquetThumbsPreviewFromUrls(urls) {
  const thumbsWrap = document.getElementById("banquet_img_thumbs");
  if (!thumbsWrap) return;

  thumbsWrap.innerHTML = "";
  if (!Array.isArray(urls) || urls.length === 0) return;

  urls.filter(Boolean).slice(0, 4).forEach((u, index) => {
    const clean = String(u).trim();
    if (!clean) return;

    const thumb = document.createElement("div");
    thumb.draggable = true;
    thumb.dataset.url = clean;
    
    // UI Styling
    thumb.style.position = "relative";
    thumb.style.width = "90px"; 
    thumb.style.height = "90px";
    thumb.style.borderRadius = "12px";
    thumb.style.overflow = "hidden";
    thumb.style.border = "2px solid var(--border)";
    thumb.style.cursor = "pointer";

    const isCover = index === 0;
    thumb.innerHTML = `
      <img src="${clean}" style="width:100%;height:100%;object-fit:cover;"/>
      <div style="position:absolute; top:4px; right:4px; background:var(--danger); color:white; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px;">×</div>
      <div style="position:absolute; bottom:0; left:0; right:0; background:${isCover ? 'var(--accent)' : 'rgba(0,0,0,0.6)'}; color:${isCover ? 'black' : 'white'}; font-size:10px; text-align:center; padding:2px; font-weight:bold;">
        ${isCover ? 'Cover Pic' : 'Gallery'}
      </div>
    `;

    // Double-click event to set cover and re-render
    thumb.addEventListener('dblclick', () => {
        const allUrls = Array.from(document.querySelectorAll("#banquet_img_thumbs [data-url]")).map(el => el.dataset.url);
        // Clicked image ko list mein sabse pehle (index 0) le aayein
        const newOrder = [clean, ...allUrls.filter(u => u !== clean)];
        
        // Re-render thumbnails to update labels
        setBanquetThumbsPreviewFromUrls(newOrder);
        
        // Update Main Preview and Hidden Input
        setBanquetImgPreview(clean);
        const hiddenInput = document.getElementById('banquet_img');
        if (hiddenInput) hiddenInput.value = clean;
    });

    // Delete Logic
    thumb.querySelector('div[style*="cursor:pointer"]').addEventListener("click", (e) => {
      e.stopPropagation();
      const currentUrls = Array.from(document.querySelectorAll("#banquet_img_thumbs [data-url]")).map(el => el.dataset.url);
      const newUrls = currentUrls.filter(url => url !== clean);
      setBanquetThumbsPreviewFromUrls(newUrls);
      setBanquetImgPreview(newUrls[0] || "");
      document.getElementById("banquet_img").value = newUrls[0] || "";
    });

    thumbsWrap.appendChild(thumb);
  });

  wireBanquetThumbDrag();
}

function wireBanquetThumbDrag() {
  const thumbsWrap = document.getElementById("banquet_img_thumbs");
  if (!thumbsWrap) return;

  let dragEl = null;

  const dragStart = (e) => {
    dragEl = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", dragEl.dataset.url || "");
    } catch (_) {}
  };

  const dragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const container = thumbsWrap;
    const after = getDragAfterElement(container, e.clientX, e.clientY);
    if (after == null) {
      container.appendChild(dragEl);
    } else {
      container.insertBefore(dragEl, after);
    }
  };

  const dragEnd = () => {
    dragEl = null;
    
    // Naya cover update karein jo drag ke baad sabse pehla thumbnail hai
    const cover = getBanquetCoverFromThumbs();
    
    // UI Preview update karein
    setBanquetImgPreview(cover);
    
    // Hidden field update karein taaki database mein naya order save ho
    const hidden = document.getElementById("banquet_img");
    if (hidden) hidden.value = cover || "";
    
    console.log("Drag end: New cover updated to", cover);
  };

  // Rebind: Har thumbnail ke liye listeners phir se set karein[cite: 7]
  Array.from(thumbsWrap.children).forEach((child) => {
    child.removeEventListener("dragstart", dragStart);
    child.removeEventListener("dragover", dragOver);
    child.removeEventListener("dragend", dragEnd);
    
    child.addEventListener("dragstart", dragStart);
    child.addEventListener("dragover", dragOver);
    child.addEventListener("drop", (e) => e.preventDefault());
    child.addEventListener("dragend", dragEnd);
  });
}

function getDragAfterElement(container, x, y) {
  const draggableElements = [...container.querySelectorAll("[draggable='true']")];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - (box.top + box.height / 2);
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function checkboxCheckedFromValue(val) {
  // Handles: true/false, "true"/"false", 1/0, "yes"/"no", or "".
  if (val === true) return true;
  if (val === false) return false;
  if (val === 1) return true;
  if (val === 0) return false;
  if (val == null) return false;
  const s = String(val).trim().toLowerCase();
  if (!s) return false;
  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "on";
}

function getBanquetRowStatusFromRowData(r) {
  const startDateStr = r.startdate ?? "";

  // Prefer DB countdownDays if present.
  const expiryDateStr = r.expiredate ?? r.expireDate ?? '';
  const countdownDb = r.countdowndays ?? r.countdownDays ?? '';

  if (countdownDb !== '' && countdownDb != null) {
    const diffDays = parseInt(String(countdownDb), 10);
    if (Number.isFinite(diffDays)) {
      return diffDays > 0 ? 'active' : 'expired';
    }
  }

  // Fallback: compute from expiredate/startdate (for older rows)
  if (startDateStr || expiryDateStr) {
    const computedRemaining = computeCountdownDaysFromDates(startDateStr, expiryDateStr);
    if (computedRemaining !== '') {
      const diffDays = parseInt(computedRemaining, 10);
      if (Number.isFinite(diffDays)) {
        return diffDays > 0 ? 'active' : 'expired';
      }
    }
  }

  return 'unknown';
}

function applyBanquetSpreadsheetFilters() {
  const table = document.getElementById('banquetTable');
  if (!table) return;

  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const statusSel = document.getElementById('banquetStatusFilter');
  const status = statusSel ? String(statusSel.value || 'all').toLowerCase() : 'all';

  const searchEl = document.getElementById('searchInput');
  const search = searchEl ? String(searchEl.value || '').toLowerCase().trim() : '';

  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.forEach((tr) => {
    const rowStatus = String(tr.dataset.status || 'unknown').toLowerCase();
    const matchesStatus = status === 'all' ? true : rowStatus === status;

    const text = (tr.textContent || '').toLowerCase();
    const matchesSearch = !search ? true : text.includes(search);

    tr.style.display = matchesStatus && matchesSearch ? '' : 'none';
  });
}


function getBanquetGalleryUrlsFromUI() {
  const thumbsWrap = document.getElementById("banquet_img_thumbs");
  if (!thumbsWrap) return [];

  const urls = Array.from(thumbsWrap.querySelectorAll("[data-url]"))
    .map((el) => el?.dataset?.url)
    .filter(Boolean)
    .map((u) => String(u).trim())
    .filter(Boolean);

  // Limit to 4 for backend compatibility (img, img1, img2, img3)
  return urls.slice(0, 4);
}

function computeExpireDateFromStartDate(startDateStr) {
  const s = startDateStr ? String(startDateStr).trim() : '';
  if (!s) return '';

  // Input is from <input type="date"> (YYYY-MM-DD). Construct safely in local time.
  const parts = s.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return '';

  const [y, m, d] = parts;
  const dt = new Date(y, (m - 1), d);
  if (Number.isNaN(dt.getTime())) return '';

  dt.setDate(dt.getDate() + 30);

  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function computeCountdownDaysFromDates(startDateStr, expireDateStr) {
  // If both present -> compute from expireDateStr to today.
  const s = startDateStr ? String(startDateStr).trim() : '';
  const e = expireDateStr ? String(expireDateStr).trim() : '';
  if (!s || !e) return '';

  const parts = e.split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return '';

  const [y, m, d] = parts;
  const expiryDate = new Date(y, (m - 1), d);
  if (Number.isNaN(expiryDate.getTime())) return '';

  // Use ceiling for remaining days, consistent with existing spreadsheet logic.
  const today = new Date();
  const timeDiff = expiryDate - today;
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Number.isFinite(diffDays) ? String(diffDays) : '';
}

function getBanquetPayloadFromForm() {
  const getElVal = (id) => {
    const el = document.getElementById(id);
    return el ? String(el.value ?? '').trim() : '';
  };
  const getChecked = (id) => {
    const el = document.getElementById(id);
    return el ? !!el.checked : false;
  };


  // Note: UI me jo thumbnails present hain unki urls hidden inputs me cover ke form me stored hoti hain.
  // DB ke liye img/img1/img2/img3 tak compressed values pack karni hoti hain.
  const galleryUrls = getBanquetGalleryUrlsFromUI();
  const cover = getElVal('banquet_img') || galleryUrls[0] || '';


  // DB shape from haha.json: banquet/unique_bank/{key}/specialisation is a single string.
  const specLabels = [];
  if (getChecked('banquet_spec_lux')) specLabels.push('Luxury Seating/Suite');
  if (getChecked('banquet_spec_master_class')) specLabels.push('Master-Class Catering Team');
  if (getChecked('banquet_spec_cctv')) specLabels.push('Monitoring CCTV Setup');
  if (getChecked('banquet_spec_theme')) specLabels.push('Custom Immersive Themes');
  if (getChecked('banquet_spec_valet')) specLabels.push('Premium Elite Valet System');
  const specialisation = specLabels.join(', ');

  const img0 = cover || '';
  const img1 = galleryUrls[1] || '';
  const img2 = galleryUrls[2] || '';
  const img3 = galleryUrls[3] || '';

  const startdate = getElVal('banquet_startdate');
  const expiredate = computeExpireDateFromStartDate(startdate);
  const countdowndays = computeCountdownDaysFromDates(startdate, expiredate);

  return {
    UID: getElVal('banquet_uid') || '',

    vendor_user: getElVal('banquet_vendor_user'),
    vendor_pass: getElVal('banquet_vendor_pass'),
    bankname: getElVal('banquet_bankname'),
    user: getElVal('banquet_user'),
    bankloclink: getElVal('banquet_loc_link'),
    bankloctext: getElVal('banquet_loc_text'),
    bankwhatsapp: getElVal('banquet_whatsapp'),
    startdate,
    expiredate,
    countdowndays,
    ytlink: getElVal('banquet_ytlink'),
    detail: getElVal('banquet_details'),
    // UI me jo Capacity textbox hai woh same UID wale record ki 'capacity' column me save/update hogi
    capacity: getElVal('banquet_capacity'),
    specialisation: specialisation,


    // Rates
    standardrate: getElVal('banquet_standard'),
    seasonalrate: getElVal('banquet_seasonal'),

  // Images (compatible with haha.json pattern img/img1/img2/img3)
    img: img0,
    img1,
    img2,
    img3,

  };
}



async function upsertBanquetRecord() {
  const { database } = await import("./firebaseconfig.js");
  const { ref, get, set } = await import(
    "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"
  );

  const formPayload = getBanquetPayloadFromForm();

  // Hidden field (banquet_uid_key) ko priority dein taake edit mode mein path break na ho
  const uidKeyRaw = (document.getElementById('banquet_uid_key')?.value || '').trim();
  const uidRaw = (document.getElementById('banquet_uid')?.value || '').trim();
  
  // Agar edit mode hai to uidKeyRaw use hoga, agar new entry hai to uidRaw
  const recordKey = uidKeyRaw || uidRaw;

  if (!recordKey) {
    throw new Error('UID key missing');
  }

  // Path hamesha fixed rahega, nesting nahi hogi[cite: 3]
  const recordPath = `banquet/unique_bank/${recordKey}`;
  
  // Pehle check karein record hai ya nahi[cite: 3]
  const snap = await get(ref(database, recordPath));
  const exists = snap.exists();

  // Payload prepare karein[cite: 3]
  const payloadToSave = {
    ...formPayload,
    UID: String(recordKey),
  };

  // Sahi path par data set/update karein[cite: 3]
  await set(ref(database, recordPath), payloadToSave);

  // Return mode takay UI ko update ki success ka pata chale[cite: 3]
  return { mode: exists ? 'update' : 'create', path: recordPath, key: recordKey };
}

async function loadBanquetForEditingByPath(dataPath) {
  if (!dataPath) return;
  clearBanquetManagementForm();

  const { database } = await import("./firebaseconfig.js");
  const { get, ref } = await import(
    "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"
  );

  const snap = await get(ref(database, dataPath));
  if (!snap.exists()) {
    alert("Banquet record not found.");
    return;
  }

  const r = snap.val() || {};
  // Path se last part (key) extract karein
  const pathParts = dataPath.split("/");
  const recordKey = pathParts[pathParts.length - 1];
  
  const UID = r.UID ?? recordKey;

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };

  // Fixed: Space remove karke sirf sahi key set ki
  setVal("banquet_uid_key", recordKey);
  setVal("banquet_uid", UID ? String(UID) : "");

  // Edit mode me UID uneditable
  const uidEl = document.getElementById("banquet_uid");
  if (uidEl) {
    uidEl.readOnly = true;
    uidEl.style.cursor = "not-allowed";
    uidEl.style.opacity = "0.75";
  }

  // ... (Baaki saara logic wahi rahega)
  setVal("banquet_vendor_user", r.vendor_user ?? r.vendorUser ?? "");

  // Rates
  setVal(
    "banquet_standard",
    r.standardrate ?? r.standardRate ?? r.standard_rate ?? ""
  );
  setVal(
    "banquet_seasonal",
    r.seasonalrate ?? r.seasonalRate ?? r.seasonal_rate ?? ""
  );

  setVal("banquet_vendor_pass", r.vendor_pass ?? r.vendorPass ?? "");

  setVal("banquet_bankname", r.bankname ?? "");
  setVal("banquet_user", r.user ?? "");
  setVal("banquet_loc_link", r.bankloclink ?? r.loclink ?? r.location_link ?? r.locationLink ?? "");
  setVal("banquet_loc_text", r.bankloctext ?? r.banloctext ?? r.loctext ?? r.location_text ?? r.locationText ?? "");
  setVal("banquet_capacity", r.bankcapacity ?? r.capacity ?? r.Capacity ?? "");

  setVal("banquet_whatsapp", r.bankwhatsapp ?? r.whatsapp ?? "");
  setVal("banquet_startdate", r.startdate ?? r.startDate ?? "");
  setVal("banquet_img", r.img ?? r.coverImage ?? r.cover_image ?? "");

  const ytRaw = r.ytlink ?? r.ytLink ?? r.youtube_embeded_link ?? r.youtubeEmbededLink ?? r.youtube_embedded_link ?? r.youtubeEmbeddedLink ?? r.youtube_embeded ?? r.youtubeEmbedded ?? "";
  setVal("banquet_ytlink", ytRaw == null ? "" : String(ytRaw).trim());
  setVal("banquet_details", r.detail ?? r.details ?? r.desc ?? "");

  // Spec handling
  const specPayload = r.specialisation ?? r.specialization ?? r.specialisation_checks ?? r.specialisation_values ?? r.spec ?? r;
  let spec;
  if (typeof specPayload === "string") {
    const s = specPayload.trim().toLowerCase();
    spec = {
      lux: s.includes("lux") || s.includes("suite") || s.includes("wedding") || s.includes("events"),
      master_class: s.includes("master") || s.includes("class") || s.includes("catering"),
      cctv: s.includes("cctv") || s.includes("monitor"),
      theme: s.includes("theme") || s.includes("immersive"),
      valet: s.includes("valet") || s.includes("elite"),
    };
  } else {
    spec = normalizeSpecialisation(specPayload);
  }

  const specIdsToCheck = {
    "banquet_spec_lux": r.lux ?? r.Luxury ?? r["Luxury Seating/Suite"] ?? r["luxury"],
    "banquet_spec_master_class": r.master_class ?? r.masterClass ?? r["Master-Class Catering Team"],
    "banquet_spec_cctv": r.cctv ?? r.CCTV ?? r["Monitoring CCTV Setup"],
    "banquet_spec_theme": r.theme ?? r["Custom Immersive Themes"],
    "banquet_spec_valet": r.valet ?? r["Premium Elite Valet System"] ?? r.PremiumValet,
  };

  const setCb = (id, checked) => {
    const cb = document.getElementById(id);
    if (cb) cb.checked = !!checked;
  };

  setCb("banquet_spec_lux", spec.lux ?? checkboxCheckedFromValue(specIdsToCheck["banquet_spec_lux"]));
  setCb("banquet_spec_master_class", spec.master_class ?? checkboxCheckedFromValue(specIdsToCheck["banquet_spec_master_class"]));
  setCb("banquet_spec_cctv", spec.cctv ?? checkboxCheckedFromValue(specIdsToCheck["banquet_spec_cctv"]));
  setCb("banquet_spec_theme", spec.theme ?? checkboxCheckedFromValue(specIdsToCheck["banquet_spec_theme"]));
  setCb("banquet_spec_valet", spec.valet ?? checkboxCheckedFromValue(specIdsToCheck["banquet_spec_valet"]));

  const img0 = r.img ?? r.coverImage ?? r.cover_image ?? "";
  const img1 = r.img1 ?? r.image1 ?? r.img_1 ?? "";
  const img2 = r.img2 ?? r.image2 ?? r.img_2 ?? "";
  const img3 = r.img3 ?? r.image3 ?? r.img_3 ?? "";

  const galleryUrls = r.gallery ?? r.images ?? r.imgs ?? r.cover_gallery ?? r.coverGallery ?? null;
  let urls = [];
  if (galleryUrls && Array.isArray(galleryUrls) && galleryUrls.length) {
    urls = [img0, ...galleryUrls].filter(Boolean).map(String);
  } else {
    urls = [img0, img1, img2, img3].filter(Boolean).map(String);
  }

  const unique = Array.from(new Set(urls));
  setBanquetImgPreview(unique[0] || "");
  setBanquetThumbsPreviewFromUrls(unique);
  const hidden = document.getElementById("banquet_img");
  if (hidden) hidden.value = unique[0] || "";
}

function initBanquetFileBrowseUx() {
  const fileInput = document.getElementById("banquet_img_file");
  if (!fileInput) return;

  // Avoid double-binding
  if (fileInput.dataset.bound === "true") return;
  fileInput.dataset.bound = "true";

  fileInput.addEventListener("change", async () => {
    // Max 4 images select karne ki limit lagayi hai
    const files = Array.from(fileInput.files || []).slice(0, 4); 
    const base64Urls = [];

    // File ko Base64 mein convert karne ke liye Helper Promise
    const compressImageToDataUrl = (file, opts = {}) => {
      const maxW = opts.maxW ?? 900;
      const maxH = opts.maxH ?? 900;
      const quality = opts.quality ?? 0.55;
      const mime = opts.mime ?? "image/jpeg";

      return new Promise((resolve, reject) => {
        if (!file || !file.type || !file.type.startsWith("image/")) {
          resolve(null);
          return;
        }

        const url = URL.createObjectURL(file);
        const img = new Image();
        // Important: for canvas operations
        img.onload = () => {
          try {
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;

            if (!iw || !ih) {
              URL.revokeObjectURL(url);
              resolve(null);
              return;
            }

            const scale = Math.min(1, maxW / iw, maxH / ih);
            const w = Math.max(1, Math.round(iw * scale));
            const h = Math.max(1, Math.round(ih * scale));

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              URL.revokeObjectURL(url);
              resolve(null);
              return;
            }

            ctx.imageSmoothingEnabled = true;
            // Aggressive reduction speed/size compromise
            ctx.imageSmoothingQuality = "low";
            ctx.drawImage(img, 0, 0, w, h);

            // JPEG quality control -> DB string length reduction
            const out = canvas.toDataURL(mime, quality);
            URL.revokeObjectURL(url);
            resolve(out);
          } catch (e) {
            try {
              URL.revokeObjectURL(url);
            } catch (_) {}
            reject(e);
          }
        };

        img.onerror = (err) => {
          try {
            URL.revokeObjectURL(url);
          } catch (_) {}
          reject(err);
        };

        img.src = url;
      });
    };

    // Ek ek karke saari selected images ko compress + convert karein
    for (const file of files) {
      try {
        const compressed = await compressImageToDataUrl(file, {
          maxW: 900,
          maxH: 900,
          quality: 0.55,
          mime: "image/jpeg",
        });
        if (compressed) base64Urls.push(compressed);
      } catch (err) {
        console.error("Error compressing file:", err);
      }
    }

    if (base64Urls.length > 0) {
      // 1. Aapke existing thumbnail container ko base64 se populate karein
      setBanquetThumbsPreviewFromUrls(base64Urls);
      
      // 2. Pehli image ko automatically cover image banayein
      const hidden = document.getElementById("banquet_img");
      if (hidden) hidden.value = base64Urls[0] || "";
      
      // 3. Main big preview image ko update karein
      setBanquetImgPreview(base64Urls[0] || "");
    }
  });
}

function applyHallSpreadsheetFilters() {
  const table = document.getElementById('hallTable');
  if (!table) return;

  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const statusSel = document.getElementById('hallStatusFilter');
  const status = statusSel ? String(statusSel.value || 'all').toLowerCase() : 'all';

  const searchEl = document.getElementById('searchInput');
  const search = searchEl ? String(searchEl.value || '').toLowerCase().trim() : '';

  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.forEach((tr) => {
    const rowStatus = String(tr.dataset.status || 'unknown').toLowerCase();
    const matchesStatus = status === 'all' ? true : rowStatus === status;

    const text = (tr.textContent || '').toLowerCase();
    const matchesSearch = !search ? true : text.includes(search);

    tr.style.display = matchesStatus && matchesSearch ? '' : 'none';
  });
}


async function clearHallManagementForm() {
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };

  setVal("hall_uid", "");
  setVal("hall_uid_key", "");

  // Re-enable UID
  const uidEl = document.getElementById("hall_uid");
  if (uidEl) {
    uidEl.readOnly = false;
    uidEl.style.cursor = "";
    uidEl.style.opacity = "";
  }

  setVal("hall_vendor_user", "");
  setVal("hall_vendor_pass", "");
  setVal("hall_bankname", "");
  setVal("hall_user", "");
  setVal("hall_loc_link", "");
  setVal("hall_loc_text", "");
  setVal("hall_whatsapp", "");
  setVal("hall_startdate", "");
  setVal("hall_standard", "");
  setVal("hall_seasonal", "");
  setVal("hall_ytlink", "");
  setVal("hall_img", "");
  setVal("hall_capacity", "");
  setVal("hall_details", "");


  // Images UI
  const preview = document.getElementById("hall_img_preview");
  if (preview) {
    preview.textContent = "No Preview";
    preview.innerHTML = "No Preview";
  }

  const thumbsWrap = document.getElementById("hall_img_thumbs");
  if (thumbsWrap) thumbsWrap.innerHTML = "";

  const fileInput = document.getElementById("hall_img_file");
  if (fileInput) fileInput.value = "";

  const specIds = [
    "hall_spec_lux",
    "hall_spec_master_class",
    "hall_spec_cctv",
    "hall_spec_theme",
    "hall_spec_valet",
  ];
  specIds.forEach((id) => {
    const cb = document.getElementById(id);
    if (cb) cb.checked = false;
  });
}

function setHallImgPreview(url) {
  const preview = document.getElementById("hall_img_preview");
  if (!preview) return;

  const clean = url ? String(url).trim() : "";
  if (!clean) {
    preview.textContent = "No Preview";
    preview.innerHTML = "No Preview";
    return;
  }

  preview.innerHTML = `<img src="${clean}" alt="Cover" decoding="async" loading="lazy" style="width:100%;height:100%;object-fit:cover;"/>`;
}

async function loadHallForEditingByPath(dataPath) {
  if (!dataPath) return;
  clearHallManagementForm();

  // Ensure hall thumbnails UX is ready for re-render (dblclick/drag)
  try {
    initHallFileBrowseUx();
  } catch (_) {}


  const { database } = await import("./firebaseconfig.js");
  const { get, ref } = await import(
    "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"
  );

  const snap = await get(ref(database, dataPath));
  if (!snap.exists()) {
    alert("Hall record not found.");
    return;
  }

  const r = snap.val() || {};

  // path se record key
  const pathParts = String(dataPath).split("/");
  const recordKey = pathParts[pathParts.length - 1];
  const UID = r.hall_UID ?? r.hallUID ?? r.UID ?? recordKey;

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };

  setVal("hall_uid_key", recordKey);
  setVal("hall_uid", UID ? String(UID) : "");

  // UID uneditable in edit mode
  const uidEl = document.getElementById("hall_uid");
  if (uidEl) {
    uidEl.readOnly = true;
    uidEl.style.cursor = "not-allowed";
    uidEl.style.opacity = "0.75";
  }

  // Map firebase fields (based on hall record structure)
  setVal("hall_vendor_user", r.vendor_user ?? r.vendorUser ?? "");
  setVal("hall_vendor_pass", r.vendor_pass ?? r.vendorPass ?? "");
  setVal("hall_bankname", r.hallname ?? r.bankname ?? "");
  setVal("hall_user", r.user ?? r.hall_user ?? "");

  setVal("hall_loc_link", r.hallloclink ?? r.loclink ?? r.location_link ?? "");
  setVal("hall_loc_text", r.hallloctext ?? r.loctext ?? r.location_text ?? "");

  setVal("hall_whatsapp", r.hallwhatsapp ?? r.whatsapp ?? "");
  setVal("hall_startdate", r.startdate ?? r.startDate ?? "");

  // Rates mapping
  setVal(
    "hall_standard",
    r.standardcost ?? r.standard_rate ?? r.standardRate ?? ""
  );
  setVal(
    "hall_seasonal",
    r.seasoncost ?? r.seasonalcost ?? r.seasonal_rate ?? r.seasonalRate ?? ""
  );

  // YouTube
  setVal("hall_ytlink", r.ytlink ?? r.ytLink ?? r.youtube_embeded_link ?? "");

  // Details
  setVal("hall_details", r.detail ?? r.details ?? r.desc ?? "");
  setVal("hall_capacity", r.bankcapacity ?? r.capacity ?? r.Capacity ?? "");


  // Specialisation string -> checkboxes
  const specRaw = r.specialisation ?? r.specialization ?? "";
  const s = String(specRaw).trim().toLowerCase();

  const setCb = (id, on) => {
    const cb = document.getElementById(id);
    if (cb) cb.checked = !!on;
  };

  setCb("hall_spec_lux", s.includes("lux") || s.includes("suite") || s.includes("wedding") || s.includes("events"));
  setCb("hall_spec_master_class", s.includes("master") || s.includes("class") || s.includes("catering"));
  setCb("hall_spec_cctv", s.includes("cctv") || s.includes("monitor"));
  setCb("hall_spec_theme", s.includes("theme") || s.includes("immersive"));
  setCb("hall_spec_valet", s.includes("valet") || s.includes("elite"));

  // Images: cover + gallery (img,img1,img2,img3)
  const img0 = r.img ?? r.coverImage ?? r.cover_image ?? "";
  const img1 = r.img1 ?? r.image1 ?? r.img_1 ?? "";
  const img2 = r.img2 ?? r.image2 ?? r.img_2 ?? "";
  const img3 = r.img3 ?? r.image3 ?? r.img_3 ?? "";

  const unique = Array.from(new Set([img0, img1, img2, img3].filter(Boolean))).slice(0, 4);

  const cover = unique[0] || "";
  setVal("hall_img", cover);
  setHallImgPreview(cover);

  // Render thumbnails including cover + img1/img2/img3
  setHallThumbsPreviewFromUrls(unique);
}

function getHallGalleryUrlsFromUI() {
  const thumbsWrap = document.getElementById('hall_img_thumbs');
  if (!thumbsWrap) return [];

  const urls = Array.from(thumbsWrap.querySelectorAll('[data-url]'))
    .map((el) => el?.dataset?.url)
    .filter(Boolean)
    .map((u) => String(u).trim())
    .filter(Boolean);

  return urls.slice(0, 4);
}

function setHallThumbsPreviewFromUrls(urls) {
  const thumbsWrap = document.getElementById('hall_img_thumbs');
  if (!thumbsWrap) return;

  thumbsWrap.innerHTML = '';
  if (!Array.isArray(urls) || urls.length === 0) return;

  urls.filter(Boolean).slice(0, 4).forEach((u, index) => {
    const clean = String(u).trim();
    if (!clean) return;

    const thumb = document.createElement('div');
    thumb.draggable = true;
    thumb.dataset.url = clean;

    thumb.style.position = 'relative';
    thumb.style.width = '90px';
    thumb.style.height = '90px';
    thumb.style.borderRadius = '12px';
    thumb.style.overflow = 'hidden';
    thumb.style.border = '2px solid var(--border)';
    thumb.style.cursor = 'pointer';

    const isCover = index === 0;
    thumb.innerHTML = `
      <img src="${clean}" style="width:100%;height:100%;object-fit:cover;"/>
      <div style="position:absolute; top:4px; right:4px; background:var(--danger); color:white; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px;">×</div>
      <div style="position:absolute; bottom:0; left:0; right:0; background:${isCover ? 'var(--accent)' : 'rgba(0,0,0,0.6)'}; color:${isCover ? 'black' : 'white'}; font-size:10px; text-align:center; padding:2px; font-weight:bold;">
        ${isCover ? 'Cover Pic' : 'Gallery'}
      </div>
    `;

    thumb.addEventListener('dblclick', () => {
      const allUrls = Array.from(document.querySelectorAll('#hall_img_thumbs [data-url]')).map((el) => el.dataset.url);
      const newOrder = [clean, ...allUrls.filter((x) => x !== clean)];
      setHallThumbsPreviewFromUrls(newOrder);

      setHallImgPreview(clean);
      const hiddenInput = document.getElementById('hall_img');
      if (hiddenInput) hiddenInput.value = clean;
    });

    thumb.querySelector('div[style*="cursor:pointer"]').addEventListener('click', (e) => {
      e.stopPropagation();
      const currentUrls = Array.from(document.querySelectorAll('#hall_img_thumbs [data-url]')).map((el) => el.dataset.url);
      const newUrls = currentUrls.filter((x) => x !== clean);
      setHallThumbsPreviewFromUrls(newUrls);

      const nextCover = newUrls[0] || '';
      setHallImgPreview(nextCover);
      const hidden = document.getElementById('hall_img');
      if (hidden) hidden.value = nextCover;
    });

    thumbsWrap.appendChild(thumb);
  });

  wireHallThumbDrag();
}

function wireHallThumbDrag() {
  const thumbsWrap = document.getElementById('hall_img_thumbs');
  if (!thumbsWrap) return;

  let dragEl = null;

  const dragStart = (e) => {
    dragEl = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', dragEl.dataset.url || '');
    } catch (_) {}
  };

  const dragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const container = thumbsWrap;
    const after = getDragAfterElement(container, e.clientX, e.clientY);
    if (after == null) container.appendChild(dragEl);
    else container.insertBefore(dragEl, after);
  };

  const dragEnd = () => {
    dragEl = null;
    const cover = getHallCoverFromThumbs();
    setHallImgPreview(cover);

    const hidden = document.getElementById('hall_img');
    if (hidden) hidden.value = cover || '';
  };

  Array.from(thumbsWrap.children).forEach((child) => {
    child.removeEventListener('dragstart', dragStart);
    child.removeEventListener('dragover', dragOver);
    child.removeEventListener('dragend', dragEnd);

    child.addEventListener('dragstart', dragStart);
    child.addEventListener('dragover', dragOver);
    child.addEventListener('drop', (e) => e.preventDefault());
    child.addEventListener('dragend', dragEnd);
  });
}

function getHallCoverFromThumbs() {
  const first = document.querySelector('#hall_img_thumbs [data-url]');
  return first?.dataset?.url ? String(first.dataset.url) : '';
}

function initHallFileBrowseUx() {
  const fileInput = document.getElementById('hall_img_file');
  if (!fileInput) return;
  if (fileInput.dataset.bound === 'true') return;
  fileInput.dataset.bound = 'true';

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []).slice(0, 4);
    const base64Urls = [];

    const compressImageToDataUrl = (file, opts = {}) => {
      const maxW = opts.maxW ?? 900;
      const maxH = opts.maxH ?? 900;
      const quality = opts.quality ?? 0.55;
      const mime = opts.mime ?? 'image/jpeg';

      return new Promise((resolve, reject) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
          resolve(null);
          return;
        }

        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          try {
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            if (!iw || !ih) {
              URL.revokeObjectURL(url);
              resolve(null);
              return;
            }

            const scale = Math.min(1, maxW / iw, maxH / ih);
            const w = Math.max(1, Math.round(iw * scale));
            const h = Math.max(1, Math.round(ih * scale));

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              URL.revokeObjectURL(url);
              resolve(null);
              return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'low';
            ctx.drawImage(img, 0, 0, w, h);

            const out = canvas.toDataURL(mime, quality);
            URL.revokeObjectURL(url);
            resolve(out);
          } catch (e) {
            try {
              URL.revokeObjectURL(url);
            } catch (_) {}
            reject(e);
          }
        };

        img.onerror = (err) => {
          try {
            URL.revokeObjectURL(url);
          } catch (_) {}
          reject(err);
        };

        img.src = url;
      });
    };

    for (const file of files) {
      try {
        const compressed = await compressImageToDataUrl(file, {
          maxW: 900,
          maxH: 900,
          quality: 0.55,
          mime: 'image/jpeg',
        });
        if (compressed) base64Urls.push(compressed);
      } catch (err) {
        console.error('Error compressing file:', err);
      }
    }

    if (base64Urls.length > 0) {
      setHallThumbsPreviewFromUrls(base64Urls);

      const hidden = document.getElementById('hall_img');
      if (hidden) hidden.value = base64Urls[0] || '';

      setHallImgPreview(base64Urls[0] || '');
    }
  });
}

function getHallPayloadFromForm() {
  const getElVal = (id) => {
    const el = document.getElementById(id);
    return el ? String(el.value ?? '').trim() : '';
  };
  const galleryUrls = getHallGalleryUrlsFromUI();
  const cover = getElVal('hall_img') || galleryUrls[0] || '';

  const specLabels = [];
  if (document.getElementById('hall_spec_lux')?.checked) specLabels.push('Luxury Seating/Suite');
  if (document.getElementById('hall_spec_master_class')?.checked) specLabels.push('Master-Class Catering Team');
  if (document.getElementById('hall_spec_cctv')?.checked) specLabels.push('Monitoring CCTV Setup');
  if (document.getElementById('hall_spec_theme')?.checked) specLabels.push('Custom Immersive Themes');
  if (document.getElementById('hall_spec_valet')?.checked) specLabels.push('Premium Elite Valet System');

  const specialisation = specLabels.join(', ');

  const img0 = cover || '';
  const img1 = galleryUrls[1] || '';
  const img2 = galleryUrls[2] || '';
  const img3 = galleryUrls[3] || '';

  const startdate = getElVal('hall_startdate');
  const expiredate = computeExpireDateFromStartDate(startdate);
  const countdowndays = computeCountdownDaysFromDates(startdate, expiredate);

  return {
    UID: getElVal('hall_uid') || '',
    vendor_user: getElVal('hall_vendor_user'),
    vendor_pass: getElVal('hall_vendor_pass'),
    hallname: getElVal('hall_bankname'),
    user: getElVal('hall_user'),
    hallloclink: getElVal('hall_loc_link'),
    hallloctext: getElVal('hall_loc_text'),
    hallwhatsapp: getElVal('hall_whatsapp'),

    startdate,
    expiredate,
    countdowndays,

    ytlink: getElVal('hall_ytlink'),
    detail: getElVal('hall_details'),
    specialisation,

    // Hall capacity textbox -> capacity column in DB
    capacity: getElVal('hall_capacity'),

    standardcost: getElVal('hall_standard'),
    seasoncost: getElVal('hall_seasonal'),

    img: img0,
    img1,
    img2,
    img3,
  };
}

async function upsertHallRecord() {
  const { database } = await import('./firebaseconfig.js');
  const { ref, get, set } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

  const formPayload = getHallPayloadFromForm();

  const uidKeyRaw = String(document.getElementById('hall_uid_key')?.value || '').trim();
  const uidRaw = String(document.getElementById('hall_uid')?.value || '').trim();
  const recordKey = uidKeyRaw || uidRaw;

  if (!recordKey) throw new Error('UID key missing');

  const recordPath = `hall/unique_hall/${recordKey}`;
  const snap = await get(ref(database, recordPath));
  const exists = snap.exists();

  const payloadToSave = { ...formPayload, UID: String(recordKey), hall_UID: String(recordKey) };
  await set(ref(database, recordPath), payloadToSave);

  return { mode: exists ? 'update' : 'create', path: recordPath, key: recordKey };
}

async function loadHallSpreadsheetRows() {
  const table = document.getElementById('hallTable');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  tbody.innerHTML = '';


  const tr = document.createElement('tr');
  const td = document.createElement('td');
  // Colspan update: UID..Start Date..Status..Actions => 10 columns
  td.colSpan = 10; 
  td.style.padding = '12px';
  td.style.color = 'var(--muted)';
  td.textContent = 'Loading...';
  tr.appendChild(td);
  tbody.appendChild(tr);

  try {
    const { database } = await import('./firebaseconfig.js');
    const { get, ref } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');

    const snapToUse = await get(ref(database, 'hall/unique_hall'));
    tbody.innerHTML = '';

    if (!snapToUse.exists()) {
      const emptyTr = document.createElement('tr');
      const emptyTd = document.createElement('td');
      emptyTd.colSpan = 9;
      emptyTd.style.padding = '12px';
      emptyTd.style.color = 'var(--muted)';
      emptyTd.textContent = 'No hall records found.';
      emptyTr.appendChild(emptyTd);
      tbody.appendChild(emptyTr);
      return;
    }

    const uniqueHallObj = snapToUse.val() || {};
    const rows = [];

    Object.entries(uniqueHallObj).forEach(([hallKey, hallVal]) => {
      if (!hallVal) return;
      const hall_UID = hallVal.hall_UID ?? hallKey;
      rows.push({
        hallKey,
        UID: hall_UID ? String(hall_UID) : '',
        raw: hallVal,
        deletePath: `hall/unique_hall/${hallKey}`,
      });
    });

    rows.sort((a, b) => String(a.UID).localeCompare(String(b.UID)));

    for (const row of rows) {
      const r = row.raw || {};

      const coverImage = r.img ?? r.coverImage ?? '';
      const hallName = r.hallname ?? '';
      const userName = r.user ?? '';
      const contact = r.hallwhatsapp ?? '';
      const vendorUser = r.vendor_user ?? ''; // Database field[cite: 4]
      const vendorPass = r.vendor_pass ?? ''; // Database field[cite: 4]
      const startDateStr = r.startdate ?? '';
      const expiryDateStr = r.expiredate ?? r.expireDate ?? '';
      const countdownDb = r.countdowndays ?? r.countdownDays ?? '';

      let displayStatus = '';
      if (countdownDb !== '' && countdownDb != null) {
        const diffDays = parseInt(String(countdownDb), 10);
        if (Number.isFinite(diffDays)) {
          if (diffDays > 0) {
            displayStatus = `<span style="color: #34d399; font-size: 12px; font-weight: bold;">Remaining: ${diffDays}d</span>`;
          } else {
            displayStatus = `<span style="color: #fb7185; font-size: 12px; font-weight: bold;">Expired: ${diffDays}d</span>`;
          }
        }
      }

      // Fallback compute if DB fields missing/old
      if (!displayStatus && (startDateStr || expiryDateStr)) {
        const computedRemaining = computeCountdownDaysFromDates(startDateStr, expiryDateStr);
        if (computedRemaining !== '') {
          const diffDays = parseInt(computedRemaining, 10);
          if (Number.isFinite(diffDays)) {
            if (diffDays > 0) {
              displayStatus = `<span style="color: #34d399; font-size: 12px; font-weight: bold;">Remaining: ${diffDays}d</span>`;
            } else {
              displayStatus = `<span style="color: #fb7185; font-size: 12px; font-weight: bold;">Expired: ${diffDays}d</span>`;
            }
          }
        }
      }

      const rowStatus = getBanquetRowStatusFromRowData(r);

      const coverHtml = coverImage
        ? `<img src="${coverImage}" alt="Cover" style="width:100px;height:70px;object-fit:cover;border-radius:10px;" />`
        : `<span style="color: var(--muted)">N/A</span>`;

      const trEl = document.createElement('tr');
      trEl.dataset.status = rowStatus;
      trEl.style.borderBottom = '1px solid rgba(251, 113, 133, 0.18)';

      trEl.innerHTML = `
        <td style="padding: 10px;">${row.UID}</td>
        <td style="padding: 10px;">${coverHtml}</td>
        <td style="padding: 10px;">${hallName}</td>
        <td style="padding: 10px;">${userName}</td>
        <td style="padding: 10px;">${contact}</td>
        <td style="padding: 10px;">${vendorUser}</td> <!-- Added Column -->
        <td style="padding: 10px;">${vendorPass}</td>
        <td style="padding: 10px;">
          ${startDateStr}<br>
          ${displayStatus || `<span style="color: var(--muted)">Unknown</span>`}
        </td>
        <td style="padding: 10px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="a-btn" style="padding:8px 10px;" data-edit-path="${row.deletePath}">Edit</button>
            <button type="button" class="a-btn" style="padding:8px 10px;" data-delete-path="${row.deletePath}">Delete</button>
          </div>
        </td>
      `;

      // ... (Event listeners for edit/delete button logic remains the same)
      const editBtn = trEl.querySelector(`[data-edit-path="${row.deletePath}"]`);
      if (editBtn) {
        editBtn.addEventListener('click', async () => {
          setActive('hall-management');
          renderView('hall-management');
          await loadHallForEditingByPath(row.deletePath);
        });
      }

      const deleteBtn = trEl.querySelector(`[data-delete-path="${row.deletePath}"]`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          const okDel = window.confirm(`Delete hall UID ${row.UID}?`);
          if (!okDel) return;
          const { database } = await import('./firebaseconfig.js');
          const { ref, remove } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js');
          await remove(ref(database, row.deletePath));
          await loadHallSpreadsheetRows();
        });
      }

      tbody.appendChild(trEl);
    }

    applyHallSpreadsheetFilters();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='9' style='color:var(--danger); padding:12px;'>Failed to load hall records.</td></tr>";
  }
}

async function loadBanquetSpreadsheetRows() {
  // Note: banquet spreadsheet is already implemented.

  const table = document.getElementById("banquetTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Mark loading
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 9;
  td.style.padding = "12px";
  td.style.color = "var(--muted)";
  td.textContent = "Loading...";
  tr.appendChild(td);
  tbody.appendChild(tr);

  try {
    const { database } = await import("./firebaseconfig.js");
    const { get, ref } = await import(
      "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"
    );

    const snapToUse = await get(ref(database, `banquet/unique_bank`));
    tbody.innerHTML = "";

    if (!snapToUse.exists()) {
      const emptyTr = document.createElement("tr");
      const emptyTd = document.createElement("td");
      emptyTd.colSpan = 9;
      emptyTd.style.padding = "12px";
      emptyTd.style.color = "var(--muted)";
      emptyTd.textContent = "No banquet records found.";
      emptyTr.appendChild(emptyTd);
      tbody.appendChild(emptyTr);
      return;
    }

    const uniqueBankObj = snapToUse.val() || {};
    const rows = [];
    Object.entries(uniqueBankObj).forEach(([uidKey, uidVal]) => {
      if (!uidVal) return;
      const UID = uidVal.UID ?? uidKey;
      rows.push({
        UID: UID ? String(UID) : "",
        raw: uidVal,
        deletePath: `banquet/unique_bank/${uidKey}`,
      });
    });

    rows.sort((a, b) => String(a.UID).localeCompare(String(b.UID)));

    for (const row of rows) {
      const r = row.raw || {};
      const banquetName = r.bankname ?? "";
      const userName = r.user ?? "";
      const contact = r.bankwhatsapp ?? "";
      const vendorUser = r.vendor_user ?? "";
      const vendorPass = r.vendor_pass ?? "";
      const startDateStr = r.startdate ?? "";
      const coverImage = r.img ?? r.coverImage ?? "";

      // Dynamic Countdown Calculation (prefer DB countdowndays if present)
      const expiryDateStr = r.expiredate ?? r.expireDate ?? '';
      const countdownDb = r.countdowndays ?? r.countdownDays ?? '';

      let displayStatus = "";
      if (countdownDb !== '' && countdownDb != null) {
        const diffDays = parseInt(String(countdownDb), 10);
        if (Number.isFinite(diffDays)) {
          if (diffDays > 0) {
            displayStatus = `<span style="color: #34d399; font-size: 12px; font-weight: bold;">Remaining: ${diffDays}d</span>`;
          } else {
            displayStatus = `<span style="color: #fb7185; font-size: 12px; font-weight: bold;">Expired: ${diffDays}d</span>`;
          }
        }
      }

      // Fallback: compute from expiredate/startdate (for older rows)
      if (!displayStatus && (startDateStr || expiryDateStr)) {
        const computedRemaining = computeCountdownDaysFromDates(startDateStr, expiryDateStr);
        if (computedRemaining !== '') {
          const diffDays = parseInt(computedRemaining, 10);
          if (diffDays > 0) {
            displayStatus = `<span style="color: #34d399; font-size: 12px; font-weight: bold;">Remaining: ${diffDays}d</span>`;
          } else {
            displayStatus = `<span style="color: #fb7185; font-size: 12px; font-weight: bold;">Expired: ${diffDays}d</span>`;
          }
        }
      }

      const rowStatus = getBanquetRowStatusFromRowData(r);

      const trEl = document.createElement("tr");
      trEl.dataset.status = rowStatus;
      trEl.style.borderBottom = "1px solid rgba(251, 113, 133, 0.18)";


      const coverHtml = coverImage
        ? `<img src="${coverImage}" alt="Cover" style="width:100px;height:70px;object-fit:cover;border-radius:10px;" />`
        : `<span style="color: var(--muted)">N/A</span>`;

      trEl.innerHTML = `
        <td style="padding: 10px;">${row.UID}</td>
        <td style="padding: 10px;">${coverHtml}</td>
        <td style="padding: 10px;">${banquetName}</td>
        <td style="padding: 10px;">${userName}</td>
        <td style="padding: 10px;">${contact}</td>
        <td style="padding: 10px;">${vendorUser}</td>
        <td style="padding: 10px;">${vendorPass}</td>
        <td style="padding: 10px;">
          ${startDateStr}<br>
          ${displayStatus}
        </td>
        <td style="padding: 10px;">


          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="a-btn" style="padding:8px 10px;" data-edit-path="${row.deletePath}">Edit</button>
            <button type="button" class="a-btn" style="padding:8px 10px;" data-delete-path="${row.deletePath}">Delete</button>
          </div>
        </td>
      `;

      const editBtn = trEl.querySelector(`[data-edit-path="${row.deletePath}"]`);
      if (editBtn) {
        editBtn.addEventListener("click", async () => {
          try {
            // Switch to banquet-management view
            setActive("banquet-management");
            renderView("banquet-management");

            // Load and populate form with selected UID record
            await loadBanquetForEditingByPath(row.deletePath);

            // Enable browse + draggable preview UI
            initBanquetFileBrowseUx();
          } catch (e) {
            console.error(e);
            alert("Failed to load banquet for editing.");
          }
        });
      }

      const deleteBtn = trEl.querySelector(`[data-delete-path="${row.deletePath}"]`);
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
          const okDel = window.confirm(`Delete banquet UID ${row.UID}?`);
          if (!okDel) return;
          try {
            const { database } = await import("./firebaseconfig.js");
            const { ref, remove } = await import(
              "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"
            );
            await remove(ref(database, row.deletePath));
            await loadBanquetSpreadsheetRows();
          } catch (e) {
            console.error(e);
            alert("Delete failed.");
          }
        });
      }

      tbody.appendChild(trEl);
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='9' style='color:var(--danger); padding:12px;'>Failed to load records.</td></tr>";
  }
}

async function init() {
  if (!navItems.length || !viewContainer) return;


  // Protect dashboard refresh/direct access:
  // if localStorage flag isn't set, show embedded login overlay.
  const ok = window.localStorage.getItem("admin_verified") === "true";
  const overlay = document.getElementById("adminLoginOverlay");


  // Extra protection: keep validating localStorage pass vs Firebase in background.
  // If mismatch is detected, auto-logout.
  const startRevalidation = async () => {
    try {
      const localPass = String(
        window.localStorage.getItem("twostepauthkey_pass") || ""
      ).trim();

      // Fetch latest expected key from Firebase.
      // (We use dynamic import so this dashboard JS still works if fetch isn't needed.)
      const { database } = await import("./firebaseconfig.js");
      const { get, ref } = await import(
        "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"
      );
      const snap = await get(ref(database, "banquet/twostepauthkey"));
      const expectedKey = snap.exists() ? String(snap.val()).trim() : null;

      if (!expectedKey || localPass !== expectedKey) {
        try {
          window.localStorage.removeItem("admin_verified");
        } catch (e) {}
        window.location.href = "./admin_login.html";
      }
    } catch (e) {
      // Fail-closed: if we cannot validate, don't keep user logged in.
      try {
        window.localStorage.removeItem("admin_verified");
      } catch (err) {}
      window.location.href = "./admin_login.html";
    }
  };

  // Run immediately + then every 60s.
  if (ok) {
    startRevalidation();
    window.__adminRevalidateInterval = window.setInterval(
      startRevalidation,
      60000
    );

    // Remove auth key only after the revalidation window.
    // (Earlier version used 5s which could look like auto-logout/redirect.)
    window.setTimeout(() => {
      try {
        window.localStorage.removeItem("twostepauthkey_pass");
      } catch (_) {}
    }, 60000);


    // Security/cleanup (handled above at 60s). Kept intentionally removed to avoid early redirect/logout.

  }

  if (!ok) {
    try {
      window.localStorage.removeItem("admin_verified");
    } catch (e) {}

    // Show embedded login overlay (dashboard content stays protected)
    if (overlay) {
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
    }
    return;
  }

  if (overlay) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }




  const active = navItems.find((b) => b.classList.contains("is-active"));
  const initialKey = active?.dataset.view || navItems[0]?.dataset.view;

  if (initialKey) {
    setActive(initialKey);
    renderView(initialKey);


  if (initialKey === "banquet-spreadsheet") {
      // don't block init; fire and forget
      loadBanquetSpreadsheetRows().catch((e) => console.error(e));
    }
  }


  navItems.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.view;
      setActive(key);

      if (statusPill) {
        statusPill.textContent = "Loading...";
      }


      if (window.gsap) {
        // small fade transition
        gsap.to(viewContainer, { opacity: 0.25, duration: 0.12, onComplete: () => {
          renderView(key);
            gsap.fromTo(viewContainer, { opacity: 0.25 }, { opacity: 1, duration: 0.18 });
          if (key === "banquet-spreadsheet") {
            loadBanquetSpreadsheetRows().catch((e) => console.error(e));
          }
          if (key === "hall-spreadsheet") {
            loadHallSpreadsheetRows().catch((e) => console.error(e));
          }
        }});
      } else {
        renderView(key);
        if (key === "banquet-spreadsheet") {
          try {
            await loadBanquetSpreadsheetRows();
          } catch (e) {
            console.error(e);
          }
        }
      }

    });
  });

  // (Logout button) - original behaviour preserved
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Reset auth state stored in localStorage
      try {
        window.localStorage.removeItem("admin_verified");
        window.localStorage.removeItem("twostepauthkey_pass");
      } catch (_) {}

      window.location.href = "./admin_login.html";
    });
  }
}

init();

// Search input: banquet + hall dono ke liye active view ke hisaab se filter karein.
document.addEventListener('input', function (e) {
  if (!e.target || e.target.id !== 'searchInput') return;

  const activeNav = navItems.find((b) => b.classList.contains('is-active'));
  const activeView = activeNav?.dataset?.view;

  if (activeView === 'banquet-spreadsheet') {
    applyBanquetSpreadsheetFilters();
  } else if (activeView === 'hall-spreadsheet') {
    applyHallSpreadsheetFilters();
  }
});

document.addEventListener('change', function (e) {
  if (!e.target) return;

  if (e.target.id === 'banquetStatusFilter') {
    applyBanquetSpreadsheetFilters();
    return;
  }

  if (e.target.id === 'hallStatusFilter') {
    applyHallSpreadsheetFilters();
    return;
  }
});







// Export table to PDF (basic, dependency-free fallback)
// If you already have a proper exportTableToPDF implementation elsewhere, keep that instead.
window.exportTableToPDF = async function (tableId) {
  const table = document.getElementById(tableId);
  if (!table) {
    alert('Table not found: ' + tableId);
    return;
  }

  // Try native print dialog as a reliable fallback.
  // User can Save as PDF from print dialog.
  const win = window.open('', '_blank');
  if (!win) {
    alert('Popup blocked. Allow popups to export PDF.');
    return;
  }

  const clonedTable = table.cloneNode(true);

  // Remove Actions column content (Edit/Delete) from export PDF
  // We remove the last column in both header and body.
  const rows = clonedTable.querySelectorAll('tr');
  rows.forEach((tr) => {
    const cells = tr.children;
    if (!cells || !cells.length) return;
    const last = cells[cells.length - 1];
    if (last && last.parentElement) last.remove();
  });


  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8" />
<title>Export</title>
<style>
  body{font-family:Arial, sans-serif; padding:20px;}
  table{width:100%; border-collapse:collapse; font-size:12px;}
  th,td{border:1px solid #ddd; padding:8px; text-align:left;}
  th{background:#f3f3f3;}
  img{max-width:60px; max-height:45px; object-fit:cover;}
</style>
</head><body>
  <h2>${tableId} Export</h2>
`);
  win.document.write(clonedTable.outerHTML);
  win.document.write(`</body></html>`);
  win.document.close();

  win.focus();
  // Give browser time to render before printing
  setTimeout(() => {
    win.print();
  }, 250);
};

