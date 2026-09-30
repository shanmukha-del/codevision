/**
 * CODEVISION — TEAM ID CARD ACCESS & RENDERING CONTROLLER
 * Unlocks official virtual Team ID card, renders prominent leader / smaller member 2 hierarchy,
 * generates security gate QR code, and handles print & downloads.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHallTicketLookup();
});

function initHallTicketLookup() {
  const form = document.getElementById('hallTicketSearchForm');
  const queryInput = document.getElementById('searchQuery');
  const resultContainer = document.getElementById('ticketResultSection');
  const statusNotice = document.getElementById('ticketStatusNotice');
  const newRegAlert = document.getElementById('newRegSuccessAlert');

  // Check URL query parameters (e.g. ?teamId=CV26-K9X42&new=1)
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = urlParams.get('teamId') || urlParams.get('email') || urlParams.get('rollNo');
  const isNewlyRegistered = urlParams.get('new') === '1' || urlParams.get('registered') === '1';

  if (isNewlyRegistered && newRegAlert) {
    newRegAlert.style.display = 'flex';
  }

  const searchCard = document.querySelector('.ticket-search-card');

  if (paramId) {
    if (queryInput) queryInput.value = paramId;
    // Auto-hide search box if directly linking with teamId/param so the ID card is the immediate hero
    if (searchCard) {
      searchCard.style.display = 'none';
    }
    performLookup(paramId);
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = queryInput.value.trim();
      if (!query) {
        window.CodevisionUtils.showToast('Please enter your Team ID, Roll Number, or Registered Email.', 'warning');
        return;
      }
      performLookup(query);
    });
  }

  async function performLookup(query) {
    statusNotice.style.display = 'none';
    resultContainer.style.display = 'none';

    const searchBtn = document.getElementById('btnSearchTicket');
    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.innerHTML = `<span class="spinner spinner-primary" style="width: 16px; height: 16px;"></span> Generating...`;
    }

    try {
      const team = await window.CodevisionDB.getTeamByEmailOrId(query);

      if (!team) {
        if (searchCard) searchCard.style.display = 'block';
        showStatusMessage('error', 'Registration Record Not Found', `
          No team registration was found matching "<strong>${window.CodevisionUtils.Validators.sanitize(query)}</strong>".
          <br><br>
          Please verify your Team ID (e.g. <code>CV26-K9X42</code>), Leader Roll Number (e.g. <code>234M1A0501</code>), or email address.
        `);
        return;
      }

      // Render official Team ID card
      renderVirtualTeamIdCard(team);

    } catch (err) {
      console.error(err);
      if (searchCard) searchCard.style.display = 'block';
      showStatusMessage('error', 'Error Accessing Database', 'Connection interrupted. Please try again.');
    } finally {
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = `<span>Generate ID Card</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
      }
    }
  }

  function showStatusMessage(type, title, htmlContent) {
    statusNotice.className = `status-alert-box alert-${type === 'error' ? 'rejected' : type}`;
    statusNotice.innerHTML = `
      <div class="alert-icon">${type === 'error' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}</div>
      <div>
        <h3 style="font-size: 1.0625rem; font-weight: 700; margin-bottom: 6px;">${title}</h3>
        <div style="font-size: 0.875rem; line-height: 1.5;">${htmlContent}</div>
      </div>
    `;
    statusNotice.style.display = 'flex';
  }

  function renderVirtualTeamIdCard(team) {
    // 1. Team Name & Team ID
    document.getElementById('ticketTeamId').textContent = team.teamId;
    document.getElementById('ticketTeamName').textContent = team.teamName;
    document.getElementById('ticketQrIdLabel').textContent = team.teamId;

    // 2. Team Logo (Custom image or preset emblem)
    const logoIcon = document.getElementById('ticketLogoIcon');
    const logoImg = document.getElementById('ticketLogoImg');
    const teamLogo = team.teamLogo || 'CV';

    if (teamLogo.startsWith('data:image') || teamLogo.startsWith('http')) {
      logoImg.src = teamLogo;
      logoImg.style.display = 'block';
      logoIcon.style.display = 'none';
    } else {
      logoImg.style.display = 'none';
      logoIcon.style.display = 'block';
      logoIcon.textContent = teamLogo;
    }

    // 3. Team Leader Details (Noticeably larger as instructed)
    const leader = team.leader || {
      name: team.member1 || '',
      rollNo: team.rollNo || '—',
      email: team.email || '—',
      phone: team.phone || '—',
      classYear: team.classYear || 'III B.Tech',
      section: team.section || 'A'
    };

    document.getElementById('ticketLeader').textContent = leader.name;
    document.getElementById('ticketLeaderRoll').textContent = leader.rollNo || team.rollNo || '—';
    document.getElementById('ticketLeaderClass').textContent = leader.classYear || team.classYear || 'III B.Tech';
    document.getElementById('ticketLeaderSec').textContent = `Sec ${leader.section || team.section || 'A'}`;
    document.getElementById('ticketEmail').textContent = leader.email || team.email || '—';
    document.getElementById('ticketPhone').textContent = leader.phone || team.phone || '—';

    // 4. Member 2 Details (Always present in 2-3 member teams)
    const m2Row = document.getElementById('ticketMember2Row') || document.getElementById('ticketMember2Card');
    const m2NameEl = document.getElementById('ticketM2Name') || document.getElementById('ticketMember2');
    const m2RollEl = document.getElementById('ticketM2Roll') || document.getElementById('ticketMember2Roll');
    const m2ClassEl = document.getElementById('ticketM2Class') || document.getElementById('ticketMember2Class');
    const m2SecEl = document.getElementById('ticketM2Sec') || document.getElementById('ticketMember2Sec');

    const member2 = team.member2;
    const hasMember2 = member2 && (typeof member2 === 'object' ? (member2.name && member2.name.trim()) : (typeof member2 === 'string' && member2.trim()));

    if (hasMember2) {
      if (m2Row) m2Row.style.display = 'flex';
      const m2Obj = typeof member2 === 'object' ? member2 : { name: String(member2) };
      if (m2NameEl) m2NameEl.textContent = m2Obj.name;
      if (m2RollEl) m2RollEl.textContent = m2Obj.rollNo || '—';
      if (m2ClassEl) m2ClassEl.textContent = m2Obj.classYear || leader.classYear || 'III B.Tech';
      if (m2SecEl) m2SecEl.textContent = `Sec ${m2Obj.section || leader.section || 'A'}`;
    } else {
      if (m2Row) m2Row.style.display = 'none';
    }

    // 5. Member 3 Details (Rendered if Trio Team)
    const m3Row = document.getElementById('ticketMember3Row') || document.getElementById('ticketMember3Card');
    const m3NameEl = document.getElementById('ticketM3Name') || document.getElementById('ticketMember3');
    const m3RollEl = document.getElementById('ticketM3Roll') || document.getElementById('ticketMember3Roll');
    const m3ClassEl = document.getElementById('ticketM3Class') || document.getElementById('ticketMember3Class');
    const m3SecEl = document.getElementById('ticketM3Sec') || document.getElementById('ticketMember3Sec');

    const member3 = team.member3;
    const hasMember3 = member3 && (typeof member3 === 'object' ? (member3.name && member3.name.trim()) : (typeof member3 === 'string' && member3.trim()));

    if (hasMember3) {
      if (m3Row) m3Row.style.display = 'flex';
      const m3Obj = typeof member3 === 'object' ? member3 : { name: String(member3) };
      if (m3NameEl) m3NameEl.textContent = m3Obj.name;
      if (m3RollEl) m3RollEl.textContent = m3Obj.rollNo || '—';
      if (m3ClassEl) m3ClassEl.textContent = m3Obj.classYear || leader.classYear || 'III B.Tech';
      if (m3SecEl) m3SecEl.textContent = `Sec ${m3Obj.section || leader.section || 'A'}`;
    } else {
      if (m3Row) m3Row.style.display = 'none';
    }

    // 5. College & Department
    document.getElementById('ticketDept').textContent = team.department || 'Computer Science & Engineering';
    document.getElementById('ticketCollege').textContent = team.college || 'Vemu Institute of Technology';

    // 6. Registration Type (Online vs Spot)
    const regType = (team.registrationType || 'ONLINE').toUpperCase();
    const regTypeEl = document.getElementById('ticketRegType');
    const badgeTypeEl = document.getElementById('ticketBadgeType');
    if (regTypeEl) {
      regTypeEl.textContent = regType === 'SPOT' ? 'SPOT REGISTRATION (WALK-IN)' : 'ONLINE REGISTRATION';
    }
    if (badgeTypeEl) {
      badgeTypeEl.textContent = regType === 'SPOT' ? 'SPOT PASS' : 'ONLINE PASS';
    }

    // Dynamic Event Schedule & Timing
    if (window.CodevisionDB && window.CodevisionDB.getEventSchedule) {
      Promise.resolve(window.CodevisionDB.getEventSchedule()).then(schedule => {
        if (schedule) {
          const dateEl = document.getElementById('ticketEventDate');
          if (dateEl && schedule.eventDateFormatted) {
            dateEl.textContent = schedule.eventDateFormatted;
          }
          const timeEl = document.getElementById('ticketEventTiming');
          if (timeEl && schedule.reportingTimeFormatted && schedule.startTimeFormatted && schedule.endTimeFormatted) {
            timeEl.textContent = `${schedule.reportingTimeFormatted} (${schedule.startTimeFormatted} – ${schedule.endTimeFormatted})`;
          }
          const venueEl = document.getElementById('ticketEventVenue');
          if (venueEl && schedule.venue) {
            venueEl.textContent = schedule.venue;
          }
        }
      }).catch(err => console.warn('Schedule fetch error:', err));
    }

    // 7. Security QR Code: CODEVISION|{teamId}
    const qrHolder = document.getElementById('ticketQrCodeHolder');
    if (qrHolder && window.QRCode) {
      qrHolder.innerHTML = '';
      const safeQrString = `CODEVISION|${team.teamId}`;
      new window.QRCode(qrHolder, {
        text: safeQrString,
        width: 108,
        height: 108,
        colorDark: '#0F172A',
        colorLight: '#FFFFFF'
      });
    }

    // Reveal Result
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });

    // Setup PDF Download Button
    const downloadPdfBtn = document.getElementById('btnDownloadPDF');
    if (downloadPdfBtn) {
      downloadPdfBtn.onclick = () => {
        if (window.CodevisionEmail && window.CodevisionEmail.downloadTeamCardPDF) {
          window.CodevisionEmail.downloadTeamCardPDF(document.getElementById('printableAdmitCard'), team.teamId);
        } else {
          window.print();
        }
      };
    }

    // Setup Print Button
    const printBtn = document.getElementById('btnPrintTicket') || document.getElementById('btnPrintHallTicket');
    if (printBtn) {
      printBtn.onclick = () => {
        window.print();
      };
    }

    // Auto-dispatch confirmation email if newly registered
    if (isNewlyRegistered && window.CodevisionEmail && window.CodevisionEmail.dispatchTeamConfirmation) {
      window.CodevisionEmail.dispatchTeamConfirmation(team);
    }
  }
}

/**
 * Toggle Search Box
 * Used by "Find Another Team" button to smoothly reveal/hide the search box.
 */
window.toggleSearchBox = function() {
  const searchCard = document.querySelector('.ticket-search-card');
  if (searchCard) {
    if (searchCard.style.display === 'none' || getComputedStyle(searchCard).display === 'none') {
      searchCard.style.display = 'block';
      searchCard.scrollIntoView({ behavior: 'smooth' });
      const input = document.getElementById('searchQuery');
      if (input) {
        input.focus();
        input.select();
      }
    } else {
      searchCard.style.display = 'none';
    }
  }
};

