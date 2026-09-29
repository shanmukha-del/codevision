/**
 * CODEVISION — ADMIN DASHBOARD CONTROLLER
 * Real-time stats, Team Details Dossier, Spot Registration for walk-ins,
 * Event Coordinator CRUD & Virtual Badges, Dynamic Themes & Gate QR Verifier.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDashboardTabs();
  initStatsAndTeams();
  initSpotRegistration();
  initCoordinatorManager();
  initThemeManager();
  initScheduleManager();
  initGateScanner();
  initSettingsModal();
});

// Global state
let allTeams = [];
let allThemes = [];
let allCoordinators = [];
let currentFilter = 'all';
let searchQuery = '';
let activeEditingThemeId = null;

/* ==========================================================================
   Navigation Tabs & Mobile Sidebar
   ========================================================================== */
function initDashboardTabs() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.dashboard-view-panel');
  const pageTitle = document.getElementById('adminPageTitle');
  const sidebar = document.getElementById('adminSidebar');
  const sidebarToggle = document.getElementById('mobileSidebarToggle');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const targetId = item.getAttribute('data-target');
      if (!targetId) return;
      e.preventDefault();

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(s => {
        if (s.id === targetId) {
          s.style.display = 'block';
        } else {
          s.style.display = 'none';
        }
      });

      const titleMap = {
        'panel-overview': 'Dashboard Overview',
        'panel-registrations': 'Registered Teams Roster',
        'panel-coordinators': 'Event Coordinators & Badges',
        'panel-themes': 'Event Day Themes (Confidential Track Prep)',
        'panel-scanner': 'Gate Check-in QR Verifier',
        'panel-schedule': 'Event Schedule, Timing & Countdown'
      };
      if (pageTitle) pageTitle.textContent = titleMap[targetId] || 'Admin Portal';

      // Mirror table in registrations panel if navigated there
      if (targetId === 'panel-registrations') {
        const anchor = document.getElementById('registrationsContainerAnchor');
        const tableCard = document.querySelector('.table-card');
        if (anchor && tableCard && !anchor.contains(tableCard)) {
          anchor.appendChild(tableCard);
        }
      } else if (targetId === 'panel-overview') {
        const overviewPanel = document.getElementById('panel-overview');
        const tableCard = document.querySelector('.table-card');
        if (overviewPanel && tableCard && !overviewPanel.contains(tableCard)) {
          overviewPanel.appendChild(tableCard);
        }
      }

      if (sidebar) sidebar.classList.remove('open');
    });
  });

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

/* ==========================================================================
   Realtime Stats & Teams Management Table
   ========================================================================== */
function initStatsAndTeams() {
  const tableBody = document.getElementById('teamsTableBody');
  const searchInput = document.getElementById('teamSearchInput');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      renderTeamsTable();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderTeamsTable();
    });
  }

  // Export CSV
  const exportCsvBtn = document.getElementById('btnExportCsv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (!allTeams || allTeams.length === 0) {
        window.CodevisionUtils.showToast('No teams to export yet.', 'warning');
        return;
      }

      const headers = [
        'Team ID', 'Team Name', 'Registration Type', 'Status',
        'Leader Name', 'Leader Email', 'Leader Phone', 'Leader Roll No', 'Leader Class', 'Leader Section',
        'Member2 Name', 'Member2 Email', 'Member2 Phone', 'Member2 Roll No', 'Member2 Class', 'Member2 Section',
        'Member3 Name', 'Member3 Roll No', 'Member3 Class', 'Member3 Section',
        'College', 'Department', 'Registered At'
      ];

      function csvEscape(val) {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }

      const rows = allTeams.map(t => {
        const leader = t.leader || {};
        const m2 = t.member2 || {};
        const m3 = t.member3 || {};
        return [
          csvEscape(t.teamId),
          csvEscape(t.teamName),
          csvEscape(t.registrationType || 'ONLINE'),
          csvEscape(t.status || 'confirmed'),
          csvEscape(leader.name || t.leaderName || ''),
          csvEscape(leader.email || t.leaderEmail || ''),
          csvEscape(leader.phone || t.leaderPhone || ''),
          csvEscape(leader.rollNo || t.leaderRollNo || ''),
          csvEscape(leader.classYear || t.leaderClassYear || ''),
          csvEscape(leader.section || t.leaderSection || ''),
          csvEscape(typeof m2 === 'object' ? m2.name : (m2 || '')),
          csvEscape(typeof m2 === 'object' ? (m2.email || '') : ''),
          csvEscape(typeof m2 === 'object' ? (m2.phone || '') : ''),
          csvEscape(typeof m2 === 'object' ? (m2.rollNo || '') : ''),
          csvEscape(typeof m2 === 'object' ? (m2.classYear || '') : ''),
          csvEscape(typeof m2 === 'object' ? (m2.section || '') : ''),
          csvEscape(typeof m3 === 'object' ? (m3.name || '') : ''),
          csvEscape(typeof m3 === 'object' ? (m3.rollNo || '') : ''),
          csvEscape(typeof m3 === 'object' ? (m3.classYear || '') : ''),
          csvEscape(typeof m3 === 'object' ? (m3.section || '') : ''),
          csvEscape(t.college || ''),
          csvEscape(t.department || ''),
          csvEscape(t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '')
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CODEVISION_2026_Registrations_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.CodevisionUtils.showToast(`Exported ${allTeams.length} team registrations as CSV!`, 'success', 3000);
    });
  }

  // Subscribe to real-time teams stream from DB
  if (window.CodevisionDB && window.CodevisionDB.onAllTeamsChange) {
    window.CodevisionDB.onAllTeamsChange((teams) => {
      allTeams = teams;
      updateStats();
      renderTeamsTable();
    });
  }

  // Subscribe to coordinators for stats counter
  if (window.CodevisionDB && window.CodevisionDB.onCoordinatorsChange) {
    window.CodevisionDB.onCoordinatorsChange((coords) => {
      allCoordinators = coords;
      updateStats();
    });
  }

  function updateStats() {
    const total = allTeams.length;
    const online = allTeams.filter(t => (t.registrationType || 'ONLINE').toUpperCase() === 'ONLINE').length;
    const spot = allTeams.filter(t => (t.registrationType || '').toUpperCase() === 'SPOT').length;
    const totalCoords = allCoordinators.length;

    animateCount('statTotalTeams', total);
    animateCount('statOnlineTeams', online);
    animateCount('statSpotTeams', spot);
    animateCount('statCoordinators', totalCoords);

    // Update sidebar badges
    const badgeTeams = document.getElementById('sidebarTeamsBadge');
    if (badgeTeams) {
      badgeTeams.textContent = total;
    }
    const badgeCoords = document.getElementById('sidebarCoordsBadge');
    if (badgeCoords) {
      badgeCoords.textContent = totalCoords;
    }

    // Update filter counts
    const countAll = document.getElementById('filterCountAll');
    const countOnline = document.getElementById('filterCountOnline');
    const countSpot = document.getElementById('filterCountSpot');

    if (countAll) countAll.textContent = `(${total})`;
    if (countOnline) countOnline.textContent = `(${online})`;
    if (countSpot) countSpot.textContent = `(${spot})`;
  }

  function renderTeamsTable() {
    if (!tableBody) return;

    let filtered = allTeams;

    // Type filter
    if (currentFilter === 'online') {
      filtered = filtered.filter(t => (t.registrationType || 'ONLINE').toUpperCase() === 'ONLINE');
    } else if (currentFilter === 'spot') {
      filtered = filtered.filter(t => (t.registrationType || '').toUpperCase() === 'SPOT');
    }

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(t => {
        const teamId = (t.teamId || '').toLowerCase();
        const teamName = (t.teamName || '').toLowerCase();
        const lName = (t.leader ? t.leader.name : (t.member1 || '')).toLowerCase();
        const lRoll = (t.leader ? t.leader.rollNo : (t.rollNo || '')).toLowerCase();
        const m2Name = (t.member2 ? (typeof t.member2 === 'object' ? t.member2.name : t.member2) : '').toLowerCase();
        const m2Roll = (t.member2 && typeof t.member2 === 'object' ? (t.member2.rollNo || '') : '').toLowerCase();
        const email = (t.leader ? t.leader.email : (t.email || '')).toLowerCase();

        return teamId.includes(searchQuery) ||
               teamName.includes(searchQuery) ||
               lName.includes(searchQuery) ||
               lRoll.includes(searchQuery) ||
               m2Name.includes(searchQuery) ||
               m2Roll.includes(searchQuery) ||
               email.includes(searchQuery);
      });
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No team registrations found matching current filter or search criteria.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(team => {
      const regType = (team.registrationType || 'ONLINE').toUpperCase();
      const typeBadgeClass = regType === 'SPOT' ? 'badge-spot' : 'badge-confirmed';
      const formattedDate = window.CodevisionUtils.formatDateTime(team.createdAt);

      const leader = team.leader || {
        name: team.member1 || 'Leader',
        rollNo: team.rollNo || '—',
        classYear: team.classYear || 'III B.Tech',
        section: team.section || 'A'
      };

      const member2 = team.member2;
      const m2Name = member2 ? (typeof member2 === 'object' ? member2.name : member2) : null;
      const m2Roll = member2 && typeof member2 === 'object' ? member2.rollNo : null;
      const m2Class = member2 && typeof member2 === 'object' ? member2.classYear : null;
      const m2Sec = member2 && typeof member2 === 'object' ? member2.section : null;

      const teamLogo = team.teamLogo || 'CV';
      const isImageLogo = teamLogo.startsWith('data:image') || teamLogo.startsWith('http');
      const logoHtml = isImageLogo 
        ? `<span class="table-logo-thumb"><img src="${teamLogo}" alt="Logo"></span>`
        : `<span class="table-logo-thumb">${teamLogo}</span>`;

      return `
        <tr data-team-id="${team.teamId}">
          <td>
            <span class="font-mono" style="font-weight: 800; color: var(--primary); font-size: 0.875rem;">
              ${team.teamId}
            </span>
          </td>
          <td>
            <div style="display: flex; align-items: center;">
              ${logoHtml}
              <!-- Clicking Team Name directly opens details modal -->
              <span class="team-name-link" onclick="viewTeamModal('${team.teamId}')" title="Click to view full team details">
                ${escapeHtml(team.teamName)}
              </span>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; color: #0F172A;">${escapeHtml(leader.name)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              <span class="font-mono" style="color: var(--primary); font-weight: 600;">${escapeHtml(leader.rollNo || '—')}</span>
              • ${escapeHtml(leader.classYear || '')} - Sec ${escapeHtml(leader.section || 'A')}
            </div>
          </td>
          <td>
            ${m2Name ? `
              <div style="font-weight: 600;">${escapeHtml(m2Name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                <span class="font-mono">${escapeHtml(m2Roll || '—')}</span>
                ${m2Class ? `• ${escapeHtml(m2Class)} - Sec ${escapeHtml(m2Sec || 'A')}` : ''}
              </div>
            ` : '—'}
            ${team.member3 && (team.member3.name || team.member3.rollNo) ? `
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed var(--border-light);">
                <div style="font-weight: 600; color: #7C3AED;">${escapeHtml(team.member3.name)} <span style="font-size: 0.625rem; background: #F3E8FF; padding: 1px 5px; border-radius: 3px; font-weight: 800;">M3</span></div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  <span class="font-mono">${escapeHtml(team.member3.rollNo || '—')}</span>
                  • ${escapeHtml(team.member3.classYear || leader.classYear || 'III B.Tech')} - Sec ${escapeHtml(team.member3.section || leader.section || 'A')}
                </div>
              </div>
            ` : ''}
          </td>
          <td>
            <div style="font-size: 0.8125rem;">${escapeHtml(team.college || 'Vemu IT')}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(team.department || 'CSE')}</div>
          </td>
          <td>
            <span class="badge ${typeBadgeClass}">
              ${regType}
            </span>
          </td>
          <td style="font-size: 0.8125rem; color: var(--text-muted); white-space: nowrap;">
            ${formattedDate}
          </td>
          <td>
            <div class="table-action-btns">
              <button type="button" class="btn btn-secondary btn-sm" onclick="viewTeamModal('${team.teamId}')" title="View Team Dossier">
                Details
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="viewTeamModal('${team.teamId}')" title="Open Official Team ID Card Dossier">ID Card</button>
              <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: rgba(220,38,38,0.3);" onclick="deleteTeamConfirm('${team.teamId}')" title="Delete Team"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Animate count helper
function animateCount(elId, targetVal, prefix = '') {
  const el = document.getElementById(elId);
  if (!el) return;
  const current = parseInt(el.textContent.replace(/\D/g, '')) || 0;
  if (current === targetVal) {
    el.textContent = `${prefix}${targetVal}`;
    return;
  }

  const duration = 350;
  const startTime = Date.now();

  function step() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(current + (targetVal - current) * progress);
    el.textContent = `${prefix}${value}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ==========================================================================
   Team Details Modal (Opened on Team Name Click)
   ========================================================================== */
window.viewTeamModal = function(teamId) {
  const team = allTeams.find(t => t.teamId === teamId);
  if (!team) return;

  const leader = team.leader || {
    name: team.member1 || '—',
    rollNo: team.rollNo || '—',
    classYear: team.classYear || 'III B.Tech',
    section: team.section || 'A',
    email: team.email || '—',
    phone: team.phone || '—'
  };

  const member2 = team.member2;
  const m2Name = member2 ? (typeof member2 === 'object' ? member2.name : member2) : null;
  const m2Roll = member2 && typeof member2 === 'object' ? member2.rollNo : '—';
  const m2Class = member2 && typeof member2 === 'object' ? member2.classYear : leader.classYear;
  const m2Sec = member2 && typeof member2 === 'object' ? member2.section : leader.section;

  // Header
  document.getElementById('modalTeamId').textContent = team.teamId;
  document.getElementById('modalTeamName').textContent = team.teamName;
  
  const regType = (team.registrationType || 'ONLINE').toUpperCase();
  const regBadge = document.getElementById('modalRegTypeBadge');
  regBadge.className = `badge ${regType === 'SPOT' ? 'badge-spot' : 'badge-confirmed'}`;
  regBadge.textContent = regType === 'SPOT' ? 'SPOT WALK-IN' : 'ONLINE VERIFIED';

  // Logo
  const logoThumb = document.getElementById('modalTeamLogoThumb');
  const teamLogo = team.teamLogo || 'CV';
  if (teamLogo.startsWith('data:image') || teamLogo.startsWith('http')) {
    logoThumb.innerHTML = `<img src="${teamLogo}" style="width: 100%; height: 100%; object-fit: cover;">`;
  } else {
    logoThumb.textContent = teamLogo;
  }

  // Leader Details
  document.getElementById('modalLeaderName').textContent = leader.name;
  document.getElementById('modalLeaderRoll').textContent = leader.rollNo || '—';
  document.getElementById('modalLeaderClassSec').textContent = `${leader.classYear || 'III B.Tech'} • Section ${leader.section || 'A'}`;
  document.getElementById('modalLeaderEmail').textContent = leader.email || '—';
  document.getElementById('modalLeaderPhone').textContent = leader.phone || '—';

  // Member 2 Details
  const m2Box = document.getElementById('modalMember2Box');
  if (m2Box) {
    if (m2Name) {
      m2Box.style.display = 'block';
      document.getElementById('modalM2Name').textContent = m2Name;
      document.getElementById('modalM2Roll').textContent = m2Roll || '—';
      document.getElementById('modalM2ClassSec').textContent = `${m2Class || 'III B.Tech'} • Section ${m2Sec || 'A'}`;
    } else {
      m2Box.style.display = 'none';
    }
  }

  // Member 3 Details
  const m3Box = document.getElementById('modalMember3Box');
  const m3 = team.member3;
  const m3Name = m3 ? (typeof m3 === 'object' ? m3.name : m3) : null;
  const m3Roll = m3 && typeof m3 === 'object' ? m3.rollNo : '—';
  const m3Class = m3 && typeof m3 === 'object' ? m3.classYear : leader.classYear;
  const m3Sec = m3 && typeof m3 === 'object' ? m3.section : leader.section;

  if (m3Box) {
    if (m3Name) {
      m3Box.style.display = 'block';
      const nameEl = document.getElementById('modalM3Name');
      const rollEl = document.getElementById('modalM3Roll');
      const csEl = document.getElementById('modalM3ClassSec');
      if (nameEl) nameEl.textContent = m3Name;
      if (rollEl) rollEl.textContent = m3Roll || '—';
      if (csEl) csEl.textContent = `${m3Class || 'III B.Tech'} • Section ${m3Sec || 'A'}`;
    } else {
      m3Box.style.display = 'none';
    }
  }

  // Logistics
  document.getElementById('modalCollege').textContent = team.college || 'Vemu Institute of Technology';
  document.getElementById('modalDept').textContent = team.department || 'Computer Science & Engineering';
  document.getElementById('modalRegisteredAt').textContent = window.CodevisionUtils.formatDateTime(team.createdAt);

  // Modal actions
  const modalActions = document.getElementById('teamModalActions');
  modalActions.innerHTML = `
    <button type="button" class="btn btn-secondary" onclick="closeTeamDetailModal()">Close</button>
    <a href="hall-ticket.html?teamId=${encodeURIComponent(team.teamId)}" target="_blank" class="btn btn-primary">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      <span>Print / Open Team ID Card ↗</span>
    </a>
  `;

  window.CodevisionUtils.openModal('teamDetailModal');
};

window.closeTeamDetailModal = function() {
  window.CodevisionUtils.closeModal('teamDetailModal');
};

window.deleteTeamConfirm = async function(teamId) {
  if (confirm(`Are you sure you want to remove Team ${teamId}?`)) {
    try {
      await window.CodevisionDB.deleteTeam(teamId);
      window.CodevisionUtils.showToast(`Team ${teamId} deleted.`, 'info');
    } catch (e) {
      console.error(e);
      window.CodevisionUtils.showToast('Failed to delete team.', 'error');
    }
  }
};

/* ==========================================================================
   Spot Registration Feature (Walk-in Desk on Event Day)
   ========================================================================== */
function initSpotRegistration() {
  const topBtn = document.getElementById('btnTopSpotRegister');
  const tableBtn = document.getElementById('btnOpenSpotModal');
  const form = document.getElementById('spotRegForm');
  const size1 = document.getElementById('spotSize1');
  const size2 = document.getElementById('spotSize2');
  const m2Block = document.getElementById('spotMember2Block');

  if (topBtn) topBtn.addEventListener('click', openSpotRegistrationModal);
  if (tableBtn) tableBtn.addEventListener('click', openSpotRegistrationModal);

  // Spot Logo File Upload
  const spotFileInput = document.getElementById('spotLogoFileInput');
  const btnUploadSpotLogo = document.getElementById('btnUploadSpotLogo');
  const spotPreviewBox = document.getElementById('spotLogoPreviewBox');
  const spotLogoPlaceholder = document.getElementById('spotLogoPlaceholder');
  const spotLogoPreviewImg = document.getElementById('spotLogoPreviewImg');
  const btnRemoveSpotLogo = document.getElementById('btnRemoveSpotLogo');
  const spotLogoFileName = document.getElementById('spotLogoFileName');
  const spotLogoData = document.getElementById('spotLogoData');

  if (btnUploadSpotLogo && spotFileInput) {
    btnUploadSpotLogo.addEventListener('click', () => spotFileInput.click());
    if (spotPreviewBox) spotPreviewBox.addEventListener('click', () => spotFileInput.click());

    spotFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        window.CodevisionUtils.showToast('Please select a valid image file.', 'warning');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        window.CodevisionUtils.showToast('Logo must be under 2MB.', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target.result;
        if (spotLogoData) spotLogoData.value = base64;
        if (spotLogoPreviewImg && spotLogoPlaceholder) {
          spotLogoPreviewImg.src = base64;
          spotLogoPreviewImg.style.display = 'block';
          spotLogoPlaceholder.style.display = 'none';
        }
        if (spotLogoFileName) spotLogoFileName.textContent = file.name;
        if (btnRemoveSpotLogo) btnRemoveSpotLogo.style.display = 'inline-flex';
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnRemoveSpotLogo) {
    btnRemoveSpotLogo.addEventListener('click', () => {
      if (spotLogoData) spotLogoData.value = 'CV';
      if (spotFileInput) spotFileInput.value = '';
      if (spotLogoPreviewImg && spotLogoPlaceholder) {
        spotLogoPreviewImg.src = '';
        spotLogoPreviewImg.style.display = 'none';
        spotLogoPlaceholder.style.display = 'inline';
      }
      if (spotLogoFileName) spotLogoFileName.textContent = 'Default Emblem';
      btnRemoveSpotLogo.style.display = 'none';
    });
  }

  const sizeRadio2 = document.getElementById('spotSize2');
  const sizeRadio3 = document.getElementById('spotSize3');
  const m3SpotBlock = document.getElementById('spotM3Block');

  if (sizeRadio2 && sizeRadio3 && m3SpotBlock) {
    sizeRadio2.addEventListener('change', () => {
      if (sizeRadio2.checked) m3SpotBlock.style.display = 'none';
    });
    sizeRadio3.addEventListener('change', () => {
      if (sizeRadio3.checked) m3SpotBlock.style.display = 'block';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const teamName = document.getElementById('spotTeamName').value.trim();
      const logoEl = document.getElementById('spotLogoData');
      const teamLogo = (logoEl && logoEl.value) ? logoEl.value : 'CV';
      const teamSize = (document.getElementById('spotSize3') && document.getElementById('spotSize3').checked) ? 3 : 2;

      const leaderName = document.getElementById('spotLeaderName').value.trim();
      const leaderRoll = document.getElementById('spotLeaderRoll').value.trim().toUpperCase();
      const leaderEmail = document.getElementById('spotLeaderEmail').value.trim().toLowerCase();
      const leaderPhone = document.getElementById('spotLeaderPhone').value.trim();
      const leaderClass = document.getElementById('spotLeaderClass').value;
      const leaderSec = document.getElementById('spotLeaderSec').value;

      const m2Name = document.getElementById('spotM2Name').value.trim();
      const m2Roll = document.getElementById('spotM2Roll').value.trim().toUpperCase();
      const member2 = {
        name: m2Name,
        rollNo: m2Roll,
        classYear: (document.getElementById('spotM2Class') && document.getElementById('spotM2Class').value) || leaderClass,
        section: (document.getElementById('spotM2Sec') && document.getElementById('spotM2Sec').value) || leaderSec
      };

      let member3 = null;
      if (teamSize === 3) {
        const m3Name = (document.getElementById('spotM3Name') ? document.getElementById('spotM3Name').value.trim() : '');
        const m3Roll = (document.getElementById('spotM3Roll') ? document.getElementById('spotM3Roll').value.trim().toUpperCase() : '');
        if (m3Name || m3Roll) {
          member3 = {
            name: m3Name,
            rollNo: m3Roll,
            classYear: (document.getElementById('spotM3Class') && document.getElementById('spotM3Class').value) || leaderClass,
            section: (document.getElementById('spotM3Sec') && document.getElementById('spotM3Sec').value) || leaderSec
          };
        }
      }

      const dept = document.getElementById('spotDept').value.trim();
      const college = document.getElementById('spotCollege').value.trim();

      const payload = {
        teamName,
        teamLogo: teamLogo,
        teamSize,
        leader: {
          name: leaderName,
          rollNo: leaderRoll,
          email: leaderEmail,
          phone: leaderPhone,
          classYear: leaderClass,
          section: leaderSec
        },
        member2,
        member3,
        department: dept,
        college,
        registrationType: 'SPOT',
        notes: 'Walk-in Spot Registration issued at Admin Help Desk'
      };

      const submitBtn = document.getElementById('btnSubmitSpotReg');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Saving &amp; Generating Pass...</span>`;
      }

      try {
        const newTeam = await window.CodevisionDB.registerTeam(payload);
        window.CodevisionUtils.showToast(`Spot team ${newTeam.teamName} (${newTeam.teamId}) registered! Opening Team ID Card...`, 'success', 2800);
        closeSpotRegistrationModal();
        form.reset();

        // Open Team ID Card ready for immediate print
        window.open(`hall-ticket.html?teamId=${encodeURIComponent(newTeam.teamId)}&new=1`, '_blank');

      } catch (err) {
        console.error(err);
        window.CodevisionUtils.showToast('Failed to complete spot registration.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Register Spot Team &amp; Generate ID Card</span>`;
        }
      }
    });
  }
}

window.openSpotRegistrationModal = function() {
  window.CodevisionUtils.openModal('spotRegModal');
};

window.closeSpotRegistrationModal = function() {
  window.CodevisionUtils.closeModal('spotRegModal');
};

/* ==========================================================================
   Event Coordinators Management (CRUD & Virtual Badges)
   ========================================================================== */
function initCoordinatorManager() {
  const container = document.getElementById('adminCoordsGrid');
  const addBtn = document.getElementById('btnOpenAddCoord');
  const form = document.getElementById('coordForm');

  if (window.CodevisionDB && window.CodevisionDB.onCoordinatorsChange) {
    window.CodevisionDB.onCoordinatorsChange((coords) => {
      allCoordinators = coords;
      renderCoordinators();
    });
  }

  function renderCoordinators() {
    if (!container) return;

    if (allCoordinators.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          No coordinators registered yet. Click "+ Register New Coordinator" to create badges.
        </div>
      `;
      return;
    }

    container.innerHTML = allCoordinators.map(c => {
      const isImg = c.avatar && (c.avatar.startsWith('data:image') || c.avatar.startsWith('http'));
      const avatarHtml = isImg
        ? `<div class="coord-card-avatar"><img src="${c.avatar}" alt="Avatar"></div>`
        : `<div class="coord-card-avatar" style="font-weight: 800; font-size: 1.25rem; color: var(--primary); background: var(--primary-light); display: flex; align-items: center; justify-content: center;">${escapeHtml((c.name || 'C').charAt(0).toUpperCase())}</div>`;

      return `
        <div class="coord-admin-card" data-coord-id="${c.coordId}">
          <div class="coord-card-top">
            ${avatarHtml}
            <div class="coord-card-info">
              <h4>${escapeHtml(c.name)}</h4>
              <p>${escapeHtml(c.role)}</p>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                <span class="font-mono" style="color: var(--primary); font-weight: 700;">${escapeHtml(c.coordId)}</span>
                • ${escapeHtml(c.rollOrEmpId || '')}
              </div>
            </div>
          </div>

          <div class="coord-card-desk">
            <span>Operational Assignment:</span>
            <strong>${escapeHtml(c.desk || 'General Operations Desk')}</strong>
          </div>

          <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 3px;">
            <div style="display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>${escapeHtml(c.email)}</span></div><div style="display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>${escapeHtml(c.phone)}</span></div>
          </div>

          <div class="coord-card-actions">
            <button type="button" class="btn btn-primary btn-sm" onclick="viewCoordBadgeModal('${c.coordId}')" title="View & Print Official Badge">
              View Virtual Badge
            </button>
            <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: rgba(220,38,38,0.3);" onclick="deleteCoordConfirm('${c.coordId}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>
      `;
    }).join('');
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (form) form.reset();
      window.CodevisionUtils.openModal('coordRegModal');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('coordName') ? document.getElementById('coordName').value.trim() : '';
      const rollOrEmpId = document.getElementById('coordRollEmpId') ? document.getElementById('coordRollEmpId').value.trim().toUpperCase() : '';
      const role = document.getElementById('coordCategory') ? document.getElementById('coordCategory').value : 'Event Coordinator';
      const designation = document.getElementById('coordDesignation') ? document.getElementById('coordDesignation').value.trim() : '';
      const email = document.getElementById('coordEmail') ? document.getElementById('coordEmail').value.trim().toLowerCase() : '';
      const phone = document.getElementById('coordPhone') ? document.getElementById('coordPhone').value.trim() : '';
      const dept = document.getElementById('coordDept') ? document.getElementById('coordDept').value.trim() : 'Computer Science & Engineering';
      const desk = document.getElementById('coordDesk') ? document.getElementById('coordDesk').value.trim() : '';
      const avatarEl = document.getElementById('coordAvatarData');
      const avatar = avatarEl && avatarEl.value ? avatarEl.value : '';

      if (!name || !email) {
        window.CodevisionUtils.showToast('Please fill in Name and Email.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('btnSaveCoord');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }

      try {
        const newCoord = await window.CodevisionDB.addCoordinator({
          name, rollOrEmpId, role, designation, email, phone, department: dept, desk, avatar
        });
        window.CodevisionUtils.showToast(`Coordinator ${newCoord.name} registered! Virtual badge generated.`, 'success', 2500);
        closeCoordRegModal();
        viewCoordBadgeModal(newCoord.coordId);
      } catch (err) {
        console.error(err);
        window.CodevisionUtils.showToast('Failed to register coordinator', 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Coordinator'; }
      }
    });
  }
}

window.closeCoordRegModal = function() {
  window.CodevisionUtils.closeModal('coordRegModal');
};

window.viewCoordBadgeModal = function(coordId) {
  const coord = allCoordinators.find(c => c.coordId === coordId);
  if (!coord) return;

  // Use actual HTML IDs from the badge modal card
  const nameEl = document.getElementById('modalCoordName');
  const desigEl = document.getElementById('modalCoordDesig');
  const idEl = document.getElementById('modalCoordId');
  const deskEl = document.getElementById('modalCoordDesk');

  if (nameEl) nameEl.textContent = coord.name;
  if (desigEl) desigEl.textContent = `${coord.designation || coord.role || 'Coordinator'} • ${coord.department || 'CSE'}`;
  if (idEl) idEl.textContent = coord.coordId;
  if (deskEl) deskEl.textContent = coord.desk || 'General Event Operations Desk';

  // Print button
  const printBtn = document.getElementById('btnPrintModalBadge');
  if (printBtn) {
    printBtn.onclick = () => {
      window.open(`coordinator-badge.html?coordId=${encodeURIComponent(coord.coordId)}`, '_blank');
    };
  }

  window.CodevisionUtils.openModal('coordBadgeModal');
};

window.closeCoordBadgeModal = function() {
  window.CodevisionUtils.closeModal('coordBadgeModal');
};

window.deleteCoordConfirm = async function(coordId) {
  if (confirm(`Remove coordinator ${coordId}?`)) {
    try {
      await window.CodevisionDB.deleteCoordinator(coordId);
      window.CodevisionUtils.showToast('Coordinator removed.', 'info');
    } catch (e) {
      console.error(e);
      window.CodevisionUtils.showToast('Failed to delete coordinator', 'error');
    }
  }
};

/* ==========================================================================
   Dynamic Themes Track Management (Internal Coordinator Prep)
   ========================================================================== */
function initThemeManager() {
  const themesContainer = document.getElementById('adminThemesList') || document.getElementById('adminThemesGrid');
  const addThemeBtn = document.getElementById('btnOpenAddTheme');
  const themeForm = document.getElementById('themeForm');

  if (window.CodevisionDB && window.CodevisionDB.onThemesChange) {
    window.CodevisionDB.onThemesChange((themes) => {
      allThemes = themes;
      renderAdminThemes();
    }, false);
  }

  function renderAdminThemes() {
    if (!themesContainer) return;

    if (allThemes.length === 0) {
      themesContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          No themes prepared yet. Click "+ Add New Theme" to prepare secret event tracks.
        </div>
      `;
      return;
    }

    themesContainer.innerHTML = allThemes.map(theme => {
      const difficultyClass = `difficulty-${(theme.difficulty || 'intermediate').toLowerCase()}`;

      return `
        <div class="theme-admin-card" data-theme-id="${theme.themeId}">
          <div class="theme-admin-header">
            <span class="badge badge-blue">Track ${theme.number}</span>
            <span class="theme-difficulty ${difficultyClass}">${theme.difficulty}</span>
          </div>
          <h3 class="theme-admin-title">${escapeHtml(theme.title)}</h3>
          <p class="theme-admin-desc">${escapeHtml(theme.description)}</p>
          
          <div class="theme-admin-actions">
            <span style="font-size: 0.75rem; color: #D97706; font-weight: 700;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Unsealed Oct 24
            </span>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color: rgba(220,38,38,0.3);" onclick="deleteThemeConfirm('${theme.themeId}')">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (addThemeBtn) {
    addThemeBtn.addEventListener('click', () => {
      activeEditingThemeId = null;
      if (document.getElementById('themeModalTitle')) {
        document.getElementById('themeModalTitle').textContent = 'Add Competition Track';
      }
      if (themeForm) themeForm.reset();
      window.CodevisionUtils.openModal('themeModal');
    });
  }

  if (themeForm) {
    themeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('themeTitle') ? document.getElementById('themeTitle').value.trim() : '';

      if (!title) {
        window.CodevisionUtils.showToast('Please enter the Theme Title.', 'warning');
        return;
      }

      const themeData = {
        number: String(allThemes.length + 1).padStart(2, '0'),
        title,
        description: title, // use title as description (title-only form)
        icon: 'code',
        difficulty: 'Intermediate',
        active: true
      };

      const submitBtn = document.getElementById('btnSaveTheme');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }

      try {
        await window.CodevisionDB.addTheme(themeData);
        window.CodevisionUtils.showToast(`Theme "${title}" saved in event vault!`, 'success', 3000);
        window.CodevisionUtils.closeModal('themeModal');
        if (themeForm) themeForm.reset();
      } catch (err) {
        console.error(err);
        window.CodevisionUtils.showToast('Failed to save theme. Try again.', 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Theme'; }
      }
    });
  }
}

window.deleteThemeConfirm = async function(themeId) {
  if (confirm('Delete this track statement?')) {
    try {
      await window.CodevisionDB.deleteTheme(themeId);
      window.CodevisionUtils.showToast('Track deleted.', 'info');
    } catch (err) {
      console.error(err);
    }
  }
};

/* ==========================================================================
   Gate Check-in QR Verifier (Supports Teams & Coordinators)
   ========================================================================== */
function initGateScanner() {
  const scanForm = document.getElementById('manualScanForm');
  const scanInput = document.getElementById('manualQrInput');
  const resultBox = document.getElementById('scanResultNotice');
  const btnToggleCamera = document.getElementById('btnToggleCamera');
  const qrVideoElement = document.getElementById('qrVideoElement');
  const cameraPlaceholder = document.getElementById('cameraPlaceholderText');
  const scannerContainer = document.getElementById('scannerVideoContainer');
  const checkInsTableBody = document.getElementById('checkInsTableBody');
  const checkInCountBadge = document.getElementById('checkInCountBadge');
  const btnExportCheckInsCsv = document.getElementById('btnExportCheckInsCsv');
  const btnClearCheckIns = document.getElementById('btnClearCheckIns');

  let html5QrScanner = null;
  let isCameraScanning = false;

  // Render Check-in Roster Table
  function renderCheckInsTable(checkins) {
    if (!checkInsTableBody) return;
    const list = checkins || (window.CodevisionDB && window.CodevisionDB.getCheckIns ? window.CodevisionDB.getCheckIns() : []);

    if (checkInCountBadge) {
      checkInCountBadge.textContent = list.length;
    }

    if (list.length === 0) {
      checkInsTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.8125rem;">
            No check-ins recorded yet. Scan or verify candidate passes above.
          </td>
        </tr>
      `;
      return;
    }

    checkInsTableBody.innerHTML = list.map((item, idx) => {
      const isTeam = item.type === 'TEAM';
      const typeBadge = isTeam
        ? `<span class="badge badge-blue">TEAM</span>`
        : `<span class="badge badge-green" style="background:#D1FAE5;color:#065F46;border-color:#A7F3D0;">COORD</span>`;
      
      const leaderDetails = isTeam
        ? `<strong>${escapeHtml(item.leaderName || '—')}</strong><div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(item.leaderRollNo || '')}</div>`
        : `<strong>${escapeHtml(item.name || '—')}</strong><div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(item.deskOrLab || '')}</div>`;

      const membersList = isTeam
        ? [item.member2Name, item.member3Name].filter(Boolean).map(m => escapeHtml(m)).join(', ') || '—'
        : '—';

      return `
        <tr>
          <td class="font-mono" style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap;">${escapeHtml(item.scannedAtFormatted || item.scannedAt || '')}</td>
          <td>${typeBadge}</td>
          <td><span class="font-mono" style="font-weight: 700; color: var(--primary);">${escapeHtml(item.id)}</span></td>
          <td style="font-weight: 700; color: #0F172A;">${escapeHtml(item.name)}</td>
          <td>${leaderDetails}</td>
          <td style="font-size: 0.8125rem;">${membersList}</td>
          <td style="font-size: 0.8125rem; color: var(--text-muted);">${escapeHtml(item.college || 'Vemu IT')}</td>
          <td><span style="display: inline-block; padding: 2px 8px; border-radius: 999px; background: #D1FAE5; color: #065F46; font-size: 0.75rem; font-weight: 700;">ADMITTED</span></td>
        </tr>
      `;
    }).join('');
  }

  // Subscribe to realtime check-ins
  if (window.CodevisionDB && window.CodevisionDB.onCheckInsChange) {
    window.CodevisionDB.onCheckInsChange((checkins) => {
      renderCheckInsTable(checkins);
    });
  } else {
    renderCheckInsTable([]);
  }

  // Process Verification of scanned code
  function processVerification(raw) {
    if (!raw || !resultBox) return;

    resultBox.style.display = 'block';

    // Check if it's a coordinator barcode: CODEVISION|COORD|CV26-CRD-XXX
    if (raw.includes('COORD')) {
      const parts = raw.split('|');
      const coordId = (parts[parts.length - 1] || '').trim();
      const coord = allCoordinators.find(c => c.coordId.toUpperCase() === coordId.toUpperCase());

      if (coord) {
        // Record Check-in
        let checkInRes = { isDuplicate: false };
        if (window.CodevisionDB && window.CodevisionDB.recordCheckIn) {
          checkInRes = window.CodevisionDB.recordCheckIn({
            type: 'COORDINATOR',
            id: coord.coordId,
            name: coord.name,
            leaderName: coord.name,
            leaderRollNo: coord.rollOrEmpId || '',
            college: 'Vemu IT',
            department: coord.department || 'CSE',
            regType: 'FACULTY/STUDENT',
            deskOrLab: coord.desk || 'General Event Operations Desk'
          });
        }

        const duplicateNotice = checkInRes.isDuplicate
          ? `<div style="margin-top: 8px; font-size: 0.8125rem; color: #D97706; font-weight: 700;">⚠️ Already Checked In Earlier at ${checkInRes.checkIn.scannedAtFormatted}</div>`
          : `<div style="margin-top: 8px; font-size: 0.8125rem; color: #059669; font-weight: 700;">✅ Check-In Recorded in Gate Roster</div>`;

        resultBox.className = 'status-alert-box alert-confirmed';
        resultBox.innerHTML = `
          <div class="alert-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div>
            <h3 style="font-weight: 800; color: #065F46; font-size: 1.25rem;">COORDINATOR VIP GATE ACCESS APPROVED</h3>
            <div style="font-size: 0.9375rem; margin-top: 6px; color: #047857; line-height: 1.6;">
              <strong>Coordinator:</strong> ${escapeHtml(coord.name)} (${coord.coordId})<br>
              <strong>Role:</strong> ${escapeHtml(coord.role)} • ${escapeHtml(coord.designation || '')}<br>
              <strong>Assigned Venue:</strong> <span style="background: #D1FAE5; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${escapeHtml(coord.desk)}</span>
            </div>
            ${duplicateNotice}
          </div>
        `;
        window.CodevisionUtils.showToast(`Coordinator ${coord.name} admitted!`, 'success');
        return;
      }
    }

    // Check if it's a team pass: CODEVISION|CV26-XXXXX or CV26-XXXXX
    let teamId = raw;
    if (raw.includes('|')) {
      const parts = raw.split('|');
      teamId = parts[parts.length - 1].trim();
    }

    const team = allTeams.find(t => t.teamId.toUpperCase() === teamId.toUpperCase());

    if (!team) {
      resultBox.className = 'status-alert-box alert-rejected';
      resultBox.innerHTML = `
        <div class="alert-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
        <div>
          <h3 style="font-weight: 700; color: #991B1B;">INVALID ENTRY / PASS NOT RECOGNIZED</h3>
          <p style="font-size: 0.875rem;">No registered team or coordinator matches barcode "<strong>${escapeHtml(raw)}</strong>". Direct candidate to Spot Registration Desk.</p>
        </div>
      `;
      window.CodevisionUtils.showToast('Unrecognized Pass', 'error');
      return;
    }

    const leader = team.leader || { name: team.member1 || '', rollNo: team.rollNo || '' };
    const m2 = team.member2;
    const m2Name = m2 ? (typeof m2 === 'object' ? m2.name : m2) : null;
    const m3 = team.member3;
    const m3Name = m3 && (m3.name || m3.rollNo) ? m3.name : null;
    const regType = (team.registrationType || 'ONLINE').toUpperCase();

    // Record check-in to roster
    let checkInRes = { isDuplicate: false };
    if (window.CodevisionDB && window.CodevisionDB.recordCheckIn) {
      checkInRes = window.CodevisionDB.recordCheckIn({
        type: 'TEAM',
        id: team.teamId,
        name: team.teamName,
        leaderName: leader.name || '',
        leaderRollNo: leader.rollNo || '',
        member2Name: m2Name || '',
        member3Name: m3Name || '',
        college: team.college || 'Vemu IT',
        department: team.department || 'CSE',
        regType: regType,
        deskOrLab: 'CSE Block B — Lab 3 Workstations'
      });
    }

    const duplicateNotice = checkInRes.isDuplicate
      ? `<div style="margin-top: 8px; font-size: 0.8125rem; color: #D97706; font-weight: 700;">⚠️ Already Admitted at ${checkInRes.checkIn.scannedAtFormatted}</div>`
      : `<div style="margin-top: 8px; font-size: 0.8125rem; color: #059669; font-weight: 700;">✅ Entry Confirmed &amp; Logged in Roster</div>`;

    resultBox.className = 'status-alert-box alert-confirmed';
    resultBox.innerHTML = `
      <div class="alert-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div>
        <h3 style="font-weight: 800; color: #065F46; font-size: 1.25rem;">GATE ADMISSION CONFIRMED (${regType})</h3>
        <div style="font-size: 0.9375rem; margin-top: 6px; color: #047857; line-height: 1.6;">
          <strong>Team Name:</strong> ${escapeHtml(team.teamName)} (${team.teamId})<br>
          <strong>Leader:</strong> ${escapeHtml(leader.name)} (${escapeHtml(leader.rollNo || '—')})<br>
          ${m2Name ? `<strong>Member 2:</strong> ${escapeHtml(m2Name)} (${escapeHtml((m2 && m2.rollNo) || '—')})<br>` : ''}
          ${m3Name ? `<strong>Member 3:</strong> ${escapeHtml(m3Name)} (${escapeHtml((m3 && m3.rollNo) || '—')})<br>` : ''}
          <strong>Institution:</strong> ${escapeHtml(team.college || 'Vemu IT')} (${escapeHtml(team.department || 'CSE')})<br>
          <strong>Allocated Lab:</strong> <span style="background: #D1FAE5; padding: 2px 8px; border-radius: 4px; font-weight: 700;">CSE Block B — Lab 3 Workstations</span>
        </div>
        ${duplicateNotice}
      </div>
    `;

    window.CodevisionUtils.showToast(`Team ${team.teamName} admitted!`, 'success');
  }

  // Manual Form Input
  if (scanForm && scanInput) {
    scanForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = scanInput.value.trim();
      if (!raw) return;
      processVerification(raw);
      scanInput.value = '';
    });
  }

  // Camera QR Scanner Toggle
  if (btnToggleCamera) {
    btnToggleCamera.addEventListener('click', async () => {
      if (isCameraScanning) {
        stopCameraScanner();
      } else {
        startCameraScanner();
      }
    });
  }

  function startCameraScanner() {
    if (!scannerContainer) return;

    // Check if html5QrCode library is available
    if (typeof Html5Qrcode !== 'undefined') {
      try {
        scannerContainer.innerHTML = `<div id="html5QrReaderElement" style="width: 100%; height: 100%;"></div>`;
        html5QrScanner = new Html5Qrcode("html5QrReaderElement");

        const config = { fps: 10, qrbox: { width: 220, height: 220 } };

        html5QrScanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // Success QR read
            processVerification(decodedText);
          },
          (errorMessage) => {
            // Scanning in progress... ignore frame-level errors
          }
        ).then(() => {
          isCameraScanning = true;
          if (btnToggleCamera) {
            btnToggleCamera.className = 'btn btn-outline';
            btnToggleCamera.style.borderColor = 'rgba(220,38,38,0.5)';
            btnToggleCamera.style.color = 'var(--danger)';
            btnToggleCamera.innerHTML = `<span>■ Stop Camera Scanner</span>`;
          }
          window.CodevisionUtils.showToast('Camera scanner active! Point at Team ID Card.', 'info', 2500);
        }).catch((err) => {
          console.warn("Html5Qrcode error:", err);
          fallbackNativeCamera();
        });
      } catch (err) {
        console.warn("Scanner init failed, using native fallback", err);
        fallbackNativeCamera();
      }
    } else {
      fallbackNativeCamera();
    }
  }

  function fallbackNativeCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      window.CodevisionUtils.showToast('Camera access is not supported on this browser/origin. Please use manual input.', 'warning', 4000);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (qrVideoElement) {
          qrVideoElement.srcObject = stream;
          qrVideoElement.style.display = 'block';
          qrVideoElement.play();
          if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
          isCameraScanning = true;
          if (btnToggleCamera) {
            btnToggleCamera.className = 'btn btn-outline';
            btnToggleCamera.style.borderColor = 'rgba(220,38,38,0.5)';
            btnToggleCamera.style.color = 'var(--danger)';
            btnToggleCamera.innerHTML = `<span>■ Stop Camera Scanner</span>`;
          }
          window.CodevisionUtils.showToast('Camera active. (Native stream)', 'info');
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        window.CodevisionUtils.showToast('Camera permission denied or not available. Please allow camera or use manual input.', 'error', 3500);
      });
  }

  function stopCameraScanner() {
    if (html5QrScanner) {
      html5QrScanner.stop().then(() => {
        html5QrScanner.clear();
        html5QrScanner = null;
        resetScannerUI();
      }).catch(() => {
        resetScannerUI();
      });
    } else if (qrVideoElement && qrVideoElement.srcObject) {
      const tracks = qrVideoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      qrVideoElement.srcObject = null;
      resetScannerUI();
    } else {
      resetScannerUI();
    }
  }

  function resetScannerUI() {
    isCameraScanning = false;
    if (scannerContainer) {
      scannerContainer.innerHTML = `
        <video id="qrVideoElement" style="width: 100%; height: 100%; object-fit: cover; display: none;"></video>
        <div id="cameraPlaceholderText" style="text-align: center; padding: 20px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin-bottom: 8px; opacity: 0.7;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p style="font-size: 0.875rem; margin: 0; opacity: 0.8;">Camera inactive. Click button below to activate scanner.</p>
        </div>
      `;
    }
    if (btnToggleCamera) {
      btnToggleCamera.className = 'btn btn-primary';
      btnToggleCamera.style.borderColor = '';
      btnToggleCamera.style.color = '';
      btnToggleCamera.innerHTML = `<span>Activate Camera Scanner</span>`;
    }
  }

  // Export Check-in Roster as CSV
  if (btnExportCheckInsCsv) {
    btnExportCheckInsCsv.addEventListener('click', () => {
      const list = window.CodevisionDB && window.CodevisionDB.getCheckIns ? window.CodevisionDB.getCheckIns() : [];
      if (list.length === 0) {
        window.CodevisionUtils.showToast('No check-in entries to export yet.', 'warning');
        return;
      }

      const headers = [
        'Check-In Time', 'Type', 'ID', 'Team / Name', 'Leader / Contact',
        'Leader Roll No', 'Member 2', 'Member 3', 'College', 'Department',
        'Reg Type', 'Allocated Lab / Desk', 'Verified Status'
      ];

      function csvEscape(val) {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }

      const rows = list.map(item => [
        csvEscape(item.scannedAtFormatted || item.scannedAt || ''),
        csvEscape(item.type || 'TEAM'),
        csvEscape(item.id || ''),
        csvEscape(item.name || ''),
        csvEscape(item.leaderName || ''),
        csvEscape(item.leaderRollNo || ''),
        csvEscape(item.member2Name || ''),
        csvEscape(item.member3Name || ''),
        csvEscape(item.college || ''),
        csvEscape(item.department || ''),
        csvEscape(item.regType || ''),
        csvEscape(item.deskOrLab || ''),
        'ADMITTED'
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CODEVISION_2026_Gate_Admitted_List_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.CodevisionUtils.showToast(`Exported ${list.length} admitted passes to CSV!`, 'success');
    });
  }

  // Clear Roster
  if (btnClearCheckIns) {
    btnClearCheckIns.addEventListener('click', () => {
      if (confirm('Clear the gate admission roster? Registered teams in the database will NOT be affected.')) {
        if (window.CodevisionDB && window.CodevisionDB.clearCheckIns) {
          window.CodevisionDB.clearCheckIns();
        }
        window.CodevisionUtils.showToast('Admission roster cleared.', 'info');
      }
    });
  }
}

/* ==========================================================================
   Settings Modal (Cloud DB Info & Seed Reset)
   ========================================================================== */
function initSettingsModal() {
  const openBtn = document.getElementById('btnOpenSettings');
  const resetBtn = document.getElementById('btnResetSampleData');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      // Show Supabase connection info (read-only display)
      const supabaseUrl = window.CodevisionSupabase ? window.CodevisionSupabase.url : '';
      const supabaseKey = window.CodevisionSupabase ? window.CodevisionSupabase.anonKey : '';

      const apiKeyEl = document.getElementById('cfgApiKey');
      const projectIdEl = document.getElementById('cfgProjectId');
      const statusEl = document.getElementById('currentEngineStatus');

      if (apiKeyEl) apiKeyEl.value = supabaseKey ? supabaseKey.substring(0, 40) + '...' : '(not configured)';
      if (projectIdEl) projectIdEl.value = supabaseUrl ? supabaseUrl.replace('https://', '').split('.')[0] : '';

      const authDomainEl = document.getElementById('cfgAuthDomain');
      const storageBucketEl = document.getElementById('cfgStorageBucket');
      const msgSenderEl = document.getElementById('cfgMessagingSenderId');
      const appIdEl = document.getElementById('cfgAppId');
      if (authDomainEl) authDomainEl.value = supabaseUrl || '';
      if (storageBucketEl) storageBucketEl.value = window.CodevisionSupabase ? window.CodevisionSupabase.bucket : 'team-profiles';
      if (msgSenderEl) msgSenderEl.value = 'N/A (Supabase realtime)';
      if (appIdEl) appIdEl.value = 'supabase-v2';

      if (statusEl) statusEl.textContent = supabaseUrl ? 'Connected — Supabase Cloud Database Active' : 'Local Cache Mode (no Supabase)';

      window.CodevisionUtils.openModal('settingsModal');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset to clean sample themes, teams, and coordinators?')) {
        window.CodevisionDB.resetToDefaults();
        window.CodevisionUtils.showToast('Clean sample data reset successfully!', 'info');
        window.CodevisionUtils.closeModal('settingsModal');
      }
    });
  }

  // Save button — just close and show info (Supabase config is set in supabase-config.js)
  const saveBtn = document.getElementById('btnSaveFirebaseConfig');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      window.CodevisionUtils.showToast('Supabase settings are configured in supabase-config.js. No changes made.', 'info', 3000);
      window.CodevisionUtils.closeModal('settingsModal');
    });
  }
}

/* ==========================================================================
   Event Schedule, Timings & Duration Manager (Admin-Configurable)
   ========================================================================== */
function initScheduleManager() {
  const form = document.getElementById('scheduleConfigForm') || document.getElementById('adminScheduleForm');
  const dateInput = document.getElementById('cfgEventDate');
  const datePreview = document.getElementById('cfgEventDatePreview');
  const startTimeInput = document.getElementById('cfgStartTime');
  const durationInput = document.getElementById('cfgDurationHours');
  const endTimeInput = document.getElementById('cfgEndTime');
  const reportingInput = document.getElementById('cfgReportingTime');
  const venueInput = document.getElementById('cfgVenue');
  const resetBtn = document.getElementById('btnResetSchedule');

  // Preview elements
  const cdDays = document.getElementById('adminCdDays');
  const cdHours = document.getElementById('adminCdHours');
  const cdMinutes = document.getElementById('adminCdMinutes');
  const cdSeconds = document.getElementById('adminCdSeconds');
  const cardDate = document.getElementById('previewCardDate');
  const cardTime = document.getElementById('previewCardTime');
  const cardHours = document.getElementById('previewCardHours');
  const cardReporting = document.getElementById('previewCardReporting');
  const cardVenue = document.getElementById('previewCardVenue');

  let currentTargetTimestamp = 0;

  function updatePreviewCountdown() {
    if (!currentTargetTimestamp) return;
    const now = new Date().getTime();
    const distance = currentTargetTimestamp - now;

    if (distance <= 0) {
      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMinutes) cdMinutes.textContent = '00';
      if (cdSeconds) cdSeconds.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
    if (cdMinutes) cdMinutes.textContent = String(minutes).padStart(2, '0');
    if (cdSeconds) cdSeconds.textContent = String(seconds).padStart(2, '0');
  }

  function autoCalculateTimes() {
    const startVal = startTimeInput ? startTimeInput.value : '10:00';
    let duration = parseFloat(durationInput ? durationInput.value : 5);
    if (isNaN(duration) || duration <= 0) duration = 5;

    // End Time: start + duration
    if (startVal && endTimeInput) {
      const [sh, sm] = startVal.split(':').map(Number);
      const totalMinutes = (sh * 60 + sm) + Math.round(duration * 60);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      endTimeInput.value = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    // Reporting Time: 30 minutes before start
    if (startVal && reportingInput) {
      const [sh, sm] = startVal.split(':').map(Number);
      const repMinutes = (sh * 60 + sm) - 30;
      const repH = Math.floor((repMinutes < 0 ? repMinutes + 1440 : repMinutes) / 60) % 24;
      const repM = (repMinutes < 0 ? repMinutes + 1440 : repMinutes) % 60;
      reportingInput.value = `${String(repH).padStart(2, '0')}:${String(repM).padStart(2, '0')}`;
    }

    // Update Date preview
    if (dateInput && datePreview) {
      const val = dateInput.value;
      if (val) {
        const [y, m, d] = val.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (!isNaN(dateObj.getTime())) {
          datePreview.textContent = `Formatted: ${days[dateObj.getDay()]}, ${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
        }
      }
    }
  }

  function syncFormWithSchedule(schedule) {
    if (!schedule) return;
    if (dateInput) dateInput.value = schedule.eventDate || '2026-10-24';
    if (datePreview) datePreview.textContent = `Formatted: ${schedule.eventDateFormatted}`;
    if (startTimeInput) startTimeInput.value = schedule.startTime || '10:00';
    if (durationInput) durationInput.value = schedule.durationHours || 5;
    if (endTimeInput) endTimeInput.value = schedule.endTime || '15:00';
    if (reportingInput) reportingInput.value = schedule.reportingTime || '09:30';
    if (venueInput) venueInput.value = schedule.venue || 'CSE Labs, Vemu IT';

    // Live preview card
    if (cardDate) cardDate.textContent = schedule.eventDateFormatted;
    if (cardTime) cardTime.textContent = `${schedule.startTimeFormatted} – ${schedule.endTimeFormatted}`;
    if (cardHours) cardHours.textContent = `${schedule.durationHours} Hours Live Challenge`;
    if (cardReporting) cardReporting.textContent = schedule.reportingTimeFormatted;
    if (cardVenue) cardVenue.textContent = schedule.venue;

    // Target Timestamp
    const isoTarget = `${schedule.eventDate}T${schedule.startTime || '10:00'}:00`;
    const parsed = new Date(isoTarget).getTime();
    if (!isNaN(parsed)) {
      currentTargetTimestamp = parsed;
      const now = new Date().getTime();
      if (currentTargetTimestamp <= now) {
        currentTargetTimestamp = now + 1000 * 60 * 60 * 24 * 25 + 1000 * 60 * 60 * 12;
      }
    }
    updatePreviewCountdown();
  }

  // Subscribe to DB Schedule
  if (window.CodevisionDB && window.CodevisionDB.onEventScheduleChange) {
    window.CodevisionDB.onEventScheduleChange((schedule) => {
      syncFormWithSchedule(schedule);
    });
  }

  // Interactive changes
  if (durationInput) durationInput.addEventListener('input', autoCalculateTimes);
  if (startTimeInput) startTimeInput.addEventListener('change', autoCalculateTimes);
  if (dateInput) dateInput.addEventListener('change', autoCalculateTimes);

  // Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const saveBtn = document.getElementById('btnSaveSchedule');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span>Saving &amp; Broadcasting...</span>`;
      }

      const scheduleData = {
        eventDate: dateInput ? dateInput.value : '2026-10-24',
        startTime: startTimeInput ? startTimeInput.value : '10:00',
        durationHours: durationInput ? parseFloat(durationInput.value) : 5,
        endTime: endTimeInput ? endTimeInput.value : '15:00',
        reportingTime: reportingInput ? reportingInput.value : '09:30',
        venue: venueInput ? venueInput.value.trim() : 'CSE Labs, Vemu IT'
      };

      try {
        const updated = await window.CodevisionDB.updateEventSchedule(scheduleData);
        window.CodevisionUtils.showToast('Event Schedule updated! Website countdown & passes synced.', 'success', 3000);
        syncFormWithSchedule(updated);
      } catch (err) {
        console.error(err);
        window.CodevisionUtils.showToast('Failed to save event schedule.', 'error');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<span>Save &amp; Broadcast Schedule</span>`;
        }
      }
    });
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset event schedule to default (Saturday, Oct 24, 2026 • 5 Hours)?')) {
        const defaultSched = {
          eventDate: '2026-10-24',
          startTime: '10:00',
          durationHours: 5,
          endTime: '15:00',
          reportingTime: '09:30',
          venue: 'CSE Labs, Vemu IT'
        };
        const resetVal = await window.CodevisionDB.updateEventSchedule(defaultSched);
        syncFormWithSchedule(resetVal);
        window.CodevisionUtils.showToast('Schedule reset to default.', 'info');
      }
    });
  }

  setInterval(updatePreviewCountdown, 1000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}
