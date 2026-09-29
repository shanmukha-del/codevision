/**
 * CODEVISION 2026 — COORDINATOR PORTAL LOGIC
 * Synchronizes with Supabase coordinators table
 * Real-time Badge Lookup, Verification, Committee List & PDF Download
 */
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initCoordinatorSearch();
    loadCommitteeDirectory();
  });

  function initCoordinatorSearch() {
    const form = document.getElementById('coordSearchForm');
    const queryInput = document.getElementById('coordQuery');
    const noticeEl = document.getElementById('coordNotice');
    const resultSection = document.getElementById('coordBadgeSection');

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id') || urlParams.get('coordId');
    if (paramId && queryInput) {
      queryInput.value = paramId;
      performLookup(paramId);
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = queryInput.value.trim();
        if (!query) {
          if (window.CodevisionUtils) {
            window.CodevisionUtils.showToast("Please enter Coordinator ID, Roll ID, or Phone.", "warning");
          }
          return;
        }
        performLookup(query);
      });
    }

    async function performLookup(query) {
      if (noticeEl) noticeEl.style.display = 'none';
      if (resultSection) resultSection.style.display = 'none';

      const searchBtn = document.getElementById('btnSearchCoord');
      if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = `<span class="spinner" style="width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite;"></span> Verifying...`;
      }

      try {
        let coord = null;
        if (window.CodevisionDB && window.CodevisionDB.getCoordinatorById) {
          coord = await window.CodevisionDB.getCoordinatorById(query);
        }

        if (!coord) {
          showNotice('error', 'Coordinator Not Found', `No coordinator record found matching "<strong>${escapeHtml(query)}</strong>". Please verify your Coordinator ID or Phone.`);
          return;
        }

        renderCoordinatorBadge(coord);

      } catch (err) {
        console.error("Coordinator lookup error:", err);
        showNotice('error', 'Database Connection Error', 'Failed to retrieve coordinator data. Please try again.');
      } finally {
        if (searchBtn) {
          searchBtn.disabled = false;
          searchBtn.innerHTML = `<span>View Badge</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
        }
      }
    }

    function showNotice(type, title, html) {
      if (!noticeEl) return;
      noticeEl.className = `status-alert-box alert-${type === 'error' ? 'rejected' : type}`;
      noticeEl.innerHTML = `
        <div style="font-weight: 700; color: #DC2626; margin-bottom: 2px;">${title}</div>
        <div style="font-size: 0.875rem; color: #B91C1C;">${html}</div>
      `;
      noticeEl.style.display = 'block';
    }

    function renderCoordinatorBadge(coord) {
      if (!resultSection) return;

      const nameEl = document.getElementById('badgeCoordName');
      const desigEl = document.getElementById('badgeCoordDesig');
      const idPill = document.getElementById('badgeCoordIdPill');
      const roleTitle = document.getElementById('badgeRoleTitle');
      const deskEl = document.getElementById('badgeCoordDesk');
      const avatarFrame = document.getElementById('badgeAvatarFrame');
      const avatarImg = document.getElementById('badgeAvatarImg');
      const avatarInitial = document.getElementById('badgeAvatarInitial');

      if (nameEl) nameEl.textContent = coord.name || 'Coordinator';
      if (desigEl) desigEl.textContent = `${coord.designation || 'Faculty Coordinator'} &bull; ${coord.department || 'CSE'}`;
      if (idPill) idPill.textContent = coord.coordinatorId || 'CV26-CRD';
      if (roleTitle) roleTitle.textContent = (coord.role || 'EVENT COORDINATOR').toUpperCase();
      if (deskEl) deskEl.textContent = coord.desk || 'Central Registration & Labs Desk';

      // Avatar
      const hasPhoto = coord.avatar && (coord.avatar.startsWith('http') || coord.avatar.startsWith('data:image'));
      if (hasPhoto && avatarImg) {
        avatarImg.src = coord.avatar;
        avatarImg.style.display = 'block';
        if (avatarInitial) avatarInitial.style.display = 'none';
      } else {
        if (avatarImg) avatarImg.style.display = 'none';
        if (avatarInitial) {
          avatarInitial.textContent = (coord.name ? coord.name.charAt(0) : 'C').toUpperCase();
          avatarInitial.style.display = 'block';
        }
      }

      // Security QR Code
      const qrHolder = document.getElementById('coordQrCodeHolder');
      if (qrHolder && window.QRCode) {
        qrHolder.innerHTML = '';
        new window.QRCode(qrHolder, {
          text: `CODEVISION|COORD|${coord.coordinatorId || 'ID'}`,
          width: 72,
          height: 72,
          colorDark: '#0F172A',
          colorLight: '#FFFFFF'
        });
      }

      // PDF Download Button
      const downloadBtn = document.getElementById('btnDownloadCoordBadgePDF');
      if (downloadBtn) {
        downloadBtn.onclick = () => {
          if (window.CodevisionEmail && window.CodevisionEmail.downloadCoordinatorBadgePDF) {
            window.CodevisionEmail.downloadCoordinatorBadgePDF(document.getElementById('printableCoordBadge'), coord.coordinatorId);
          } else {
            window.print();
          }
        };
      }

      // Print Button
      const printBtn = document.getElementById('btnPrintCoordBadge');
      if (printBtn) {
        printBtn.onclick = () => window.print();
      }

      // Email Confirmation Button
      const emailBtn = document.getElementById('btnEmailCoordDuty');
      if (emailBtn) {
        emailBtn.onclick = () => {
          if (window.CodevisionEmail && window.CodevisionEmail.dispatchCoordinatorConfirmation) {
            window.CodevisionEmail.dispatchCoordinatorConfirmation(coord);
          }
        };
      }

      resultSection.style.display = 'block';
      resultSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function loadCommitteeDirectory() {
    const listEl = document.getElementById('committeeRosterList');
    if (!listEl) return;

    try {
      let coords = [];
      if (window.CodevisionDB && window.CodevisionDB.getCoordinators) {
        coords = await window.CodevisionDB.getCoordinators();
      }

      if (!coords || coords.length === 0) {
        listEl.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-muted);">
            Committee list is being finalized.
          </div>
        `;
        return;
      }

      listEl.innerHTML = coords.map(c => {
        const initial = (c.name ? c.name.charAt(0) : 'C').toUpperCase();
        const hasPhoto = c.avatar && (c.avatar.startsWith('http') || c.avatar.startsWith('data:image'));
        
        return `
          <div class="coord-item-card" onclick="viewCoordinator('${escapeHtml(c.coordinatorId)}')">
            <div class="coord-item-avatar">
              ${hasPhoto ? `<img src="${escapeHtml(c.avatar)}" alt="${escapeHtml(c.name)}">` : `<span>${initial}</span>`}
            </div>
            <div style="flex: 1; min-width: 0;">
              <strong style="color: var(--text-main); font-size: 0.9375rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHtml(c.name)}
              </strong>
              <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700; display: block;">
                ${escapeHtml(c.role || 'Coordinator')}
              </span>
              <span style="font-size: 0.6875rem; color: var(--text-muted); font-family: var(--font-mono);">
                ${escapeHtml(c.coordinatorId)} &bull; ${escapeHtml(c.desk || 'Labs')}
              </span>
            </div>
          </div>
        `;
      }).join('');

    } catch (e) {
      console.warn("Could not load committee directory:", e);
    }
  }

  window.viewCoordinator = function(id) {
    const queryInput = document.getElementById('coordQuery');
    if (queryInput) {
      queryInput.value = id;
      const form = document.getElementById('coordSearchForm');
      if (form) form.dispatchEvent(new Event('submit'));
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
