/**
 * CODEVISION — TEAM REGISTRATION CONTROLLER
 * Handles Team Name, Logo Upload/Picker, Team Size toggle (1 or 2),
 * Leader & Member 2 details (Roll No, Class, Section), and instant generation of Team ID card.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLogoSelector();
  initTeamSizeSelector();
  initThemesSubscription();
  initRegistrationForm();
  initPosterLightbox();
});

let currentTeamSize = 2;
let selectedLogo = '';

/* ==========================================================================
   Logo Selection & Custom Image Upload (No Preset Emblems)
   ========================================================================== */
function initLogoSelector() {
  const dropZone = document.getElementById('logoDropZone');
  const uploadBtn = document.getElementById('btnUploadLogo');
  const fileInput = document.getElementById('logoFileInput');
  const placeholder = document.getElementById('logoPlaceholder');
  const previewImg = document.getElementById('logoPreviewImg');
  const removeBtn = document.getElementById('btnRemoveLogo');
  const fileStatus = document.getElementById('logoFileName');
  const logoDataInput = document.getElementById('selectedLogoData');
  const btnText = document.getElementById('btnUploadLogoText');

  if (!fileInput) return;

  // Trigger file dialog
  if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (dropZone) {
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });

    // Drag & drop handlers
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        processLogoFile(files[0]);
      }
    });
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      processLogoFile(file);
    }
  });

  // Remove logo button
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetLogo();
    });
  }

  function processLogoFile(file) {
    if (!file.type.startsWith('image/')) {
      window.CodevisionUtils.showToast('Please select a valid image file (PNG, JPG, SVG, WEBP).', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      window.CodevisionUtils.showToast('Logo image must be under 2MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      selectedLogo = base64;
      if (logoDataInput) logoDataInput.value = base64;

      if (previewImg && placeholder) {
        previewImg.src = base64;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
      }

      if (fileStatus) {
        fileStatus.textContent = file.name;
        fileStatus.style.color = 'var(--primary)';
        fileStatus.style.fontWeight = '600';
      }

      if (btnText) btnText.textContent = 'Change Logo';
      if (removeBtn) removeBtn.style.display = 'inline-flex';

      // Clear any validation error on logo
      if (dropZone) dropZone.classList.remove('input-error');
      const errSpan = document.getElementById('selectedLogoData-error');
      if (errSpan) {
        errSpan.textContent = '';
        errSpan.style.display = 'none';
      }

      window.CodevisionUtils.showToast('Team logo uploaded successfully!', 'success', 2000);
    };
    reader.readAsDataURL(file);
  }

  function resetLogo() {
    selectedLogo = '';
    if (logoDataInput) logoDataInput.value = '';
    if (fileInput) fileInput.value = '';

    if (previewImg && placeholder) {
      previewImg.src = '';
      previewImg.style.display = 'none';
      placeholder.style.display = 'flex';
    }

    if (fileStatus) {
      fileStatus.textContent = 'No logo uploaded yet';
      fileStatus.style.color = 'var(--text-muted)';
      fileStatus.style.fontWeight = 'normal';
    }

    if (btnText) btnText.textContent = 'Choose Logo File';
    if (removeBtn) removeBtn.style.display = 'none';
  }
}

/* ==========================================================================
   Team Size Toggle (2 or 3 Members)
   ========================================================================== */
function initTeamSizeSelector() {
  const opt2 = document.getElementById('sizeOpt2');
  const opt3 = document.getElementById('sizeOpt3');
  const radio2 = document.getElementById('radioSize2');
  const radio3 = document.getElementById('radioSize3');
  const member2Block = document.getElementById('member2SectionBlock') || document.getElementById('member2Section');
  const member3Block = document.getElementById('member3SectionBlock');

  function setSize(size) {
    currentTeamSize = size;
    if (member2Block) member2Block.style.display = 'block'; // Member 2 is always required for 2-3 members

    if (size === 2) {
      if (opt2) opt2.classList.add('active');
      if (opt3) opt3.classList.remove('active');
      if (radio2) radio2.checked = true;
      if (member3Block) member3Block.style.display = 'none';
    } else {
      if (opt3) opt3.classList.add('active');
      if (opt2) opt2.classList.remove('active');
      if (radio3) radio3.checked = true;
      if (member3Block) member3Block.style.display = 'block';
    }
  }

  if (opt2) {
    opt2.addEventListener('click', (e) => {
      e.preventDefault();
      setSize(2);
    });
  }

  if (opt3) {
    opt3.addEventListener('click', (e) => {
      e.preventDefault();
      setSize(3);
    });
  }

  // Default to 2 members (Duo)
  setSize(2);
}

/* ==========================================================================
   Themes & Domain Tracks Realtime Listener
   ========================================================================== */
let availableThemes = [];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initThemesSubscription() {
  const themeSelect = document.getElementById('selectedTheme');
  const previewDiv = document.getElementById('selectedThemePreview');
  const badgeEl = document.getElementById('selectedThemeBadge');
  const descEl = document.getElementById('selectedThemeDesc');
  const regDomainsList = document.getElementById('regPageDomainsList');

  // Real-time Event Schedule sync for registration poster badge
  if (window.CodevisionDB && window.CodevisionDB.onEventScheduleChange) {
    window.CodevisionDB.onEventScheduleChange((schedule) => {
      if (!schedule) return;
      const posterDate = document.getElementById('regPosterDateBadge');
      if (posterDate && schedule.eventDateFormatted) {
        posterDate.textContent = schedule.eventDateFormatted;
      }
    });
  }

  // Real-time Themes sync from Database
  if (window.CodevisionDB && window.CodevisionDB.onThemesChange) {
    window.CodevisionDB.onThemesChange((themes) => {
      availableThemes = themes || [];

      // 1. Populate Dropdown
      if (themeSelect) {
        const currentVal = themeSelect.value;
        themeSelect.innerHTML = `<option value="" disabled ${!currentVal ? 'selected' : ''}>-- Select a Problem Domain Track --</option>` +
          availableThemes.map((t, idx) => {
            const trackNum = t.number || String(idx + 1).padStart(2, '0');
            const safeTitle = escapeHtml(t.title);
            const safeDesc = escapeHtml(t.description || t.title);
            return `<option value="${safeTitle}" data-id="${t.themeId}" data-num="${trackNum}" data-desc="${safeDesc}" ${currentVal === t.title ? 'selected' : ''}>Track ${trackNum}: ${safeTitle}</option>`;
          }).join('');

        if (currentVal && availableThemes.some(t => t.title === currentVal)) {
          themeSelect.value = currentVal;
          updateThemePreview();
        } else if (currentVal) {
          if (previewDiv) previewDiv.style.display = 'none';
        }
      }

      // 2. Populate Domains Preview Grid on Registration Page
      if (regDomainsList) {
        if (availableThemes.length === 0) {
          regDomainsList.innerHTML = `<p style="grid-column: 1 / -1; font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 12px;">Loading problem domains...</p>`;
        } else {
          regDomainsList.innerHTML = availableThemes.map((t, idx) => {
            const trackNum = t.number || String(idx + 1).padStart(2, '0');
            const safeTitle = escapeHtml(t.title);
            const safeDesc = escapeHtml(t.description || t.title);
            const diff = escapeHtml(t.difficulty || 'Intermediate');
            return `
              <div class="reg-domain-card" onclick="selectThemeFromCard('${safeTitle}')">
                <div class="reg-domain-header">
                  <span class="badge badge-blue">Track ${trackNum}</span>
                  <span class="reg-domain-diff">${diff}</span>
                </div>
                <h4 class="reg-domain-title">${safeTitle}</h4>
                <p class="reg-domain-desc">${safeDesc}</p>
              </div>
            `;
          }).join('');
        }
      }
    });
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', updateThemePreview);
  }

  function updateThemePreview() {
    if (!themeSelect || !previewDiv) return;
    const selectedOpt = (themeSelect.selectedIndex >= 0) ? themeSelect.options[themeSelect.selectedIndex] : null;
    if (selectedOpt && selectedOpt.value) {
      previewDiv.style.display = 'block';
      if (badgeEl) badgeEl.textContent = selectedOpt.getAttribute('data-num') ? `Track ${selectedOpt.getAttribute('data-num')}` : 'Track Statement';
      if (descEl) descEl.textContent = selectedOpt.getAttribute('data-desc') || selectedOpt.value;
    } else {
      previewDiv.style.display = 'none';
    }
  }

  window.selectThemeFromCard = function(themeTitle) {
    if (themeSelect) {
      themeSelect.value = themeTitle;
      updateThemePreview();
      themeSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      themeSelect.focus();
      if (window.CodevisionUtils && window.CodevisionUtils.showToast) {
        window.CodevisionUtils.showToast(`Selected "${themeTitle}" track!`, 'info', 2000);
      }
    }
  };
}

/* ==========================================================================
   Form Submission & Realtime Registration
   ========================================================================== */
function initRegistrationForm() {
  const form = document.getElementById('teamRegistrationForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitBtn = document.getElementById('btnSubmitTeam');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></span>
        <span>Registering &amp; Generating ID Card...</span>
      `;
    }

    // Collect Data
    const teamName = document.getElementById('teamName').value.trim();
    const leaderName = document.getElementById('leaderName').value.trim();
    const leaderRollNo = document.getElementById('leaderRollNo').value.trim().toUpperCase();
    const leaderEmail = document.getElementById('leaderEmail').value.trim().toLowerCase();
    const leaderPhone = document.getElementById('leaderPhone').value.trim();
    const leaderClass = document.getElementById('leaderClass').value;
    const leaderSection = document.getElementById('leaderSection').value.trim();

    const m2NameEl = document.getElementById('member2Name');
    const m2RollEl = document.getElementById('member2RollNo');
    const m2EmailEl = document.getElementById('member2Email');
    const m2PhoneEl = document.getElementById('member2Phone');
    const m2ClassEl = document.getElementById('member2Class');
    const m2SecEl = document.getElementById('member2Section');

    const member2Data = {
      name: m2NameEl ? m2NameEl.value.trim() : '',
      rollNo: m2RollEl ? m2RollEl.value.trim().toUpperCase() : '',
      email: (m2EmailEl && m2EmailEl.value) ? m2EmailEl.value.trim().toLowerCase() : '',
      phone: (m2PhoneEl && m2PhoneEl.value) ? m2PhoneEl.value.trim() : '',
      classYear: (m2ClassEl && m2ClassEl.value) ? m2ClassEl.value : leaderClass,
      section: (m2SecEl && m2SecEl.value) ? m2SecEl.value.trim().toUpperCase() : leaderSection
    };

    let member3Data = null;
    if (currentTeamSize === 3) {
      const m3NameEl = document.getElementById('member3Name');
      const m3RollEl = document.getElementById('member3RollNo');
      const m3EmailEl = document.getElementById('member3Email');
      const m3PhoneEl = document.getElementById('member3Phone');
      const m3ClassEl = document.getElementById('member3Class');
      const m3SecEl = document.getElementById('member3Section');

      member3Data = {
        name: m3NameEl ? m3NameEl.value.trim() : '',
        rollNo: m3RollEl ? m3RollEl.value.trim().toUpperCase() : '',
        email: (m3EmailEl && m3EmailEl.value) ? m3EmailEl.value.trim().toLowerCase() : '',
        phone: (m3PhoneEl && m3PhoneEl.value) ? m3PhoneEl.value.trim() : '',
        classYear: (m3ClassEl && m3ClassEl.value) ? m3ClassEl.value : leaderClass,
        section: (m3SecEl && m3SecEl.value) ? m3SecEl.value.trim().toUpperCase() : leaderSection
      };
    }

    const department = document.getElementById('department').value.trim();
    const college = document.getElementById('college').value.trim();

    const themeSelect = document.getElementById('selectedTheme');
    const selectedTheme = themeSelect ? themeSelect.value.trim() : '';
    const selectedThemeOpt = (themeSelect && themeSelect.selectedIndex >= 0) ? themeSelect.options[themeSelect.selectedIndex] : null;
    const themeId = selectedThemeOpt ? (selectedThemeOpt.getAttribute('data-id') || '') : '';

    const teamPayload = {
      teamName,
      teamLogo: selectedLogo,
      teamSize: currentTeamSize,
      selectedTheme,
      themeId,
      leader: {
        name: leaderName,
        rollNo: leaderRollNo,
        email: leaderEmail,
        phone: leaderPhone,
        classYear: leaderClass,
        section: leaderSection
      },
      member2: member2Data,
      member3: member3Data,
      department,
      college,
      registrationType: 'ONLINE'
    };

    try {
      const registeredTeam = await window.CodevisionDB.registerTeam(teamPayload);
      
      // Launch celebration confetti
      if (window.CodevisionUtils && window.CodevisionUtils.launchConfetti) {
        window.CodevisionUtils.launchConfetti(2800);
      }
      window.CodevisionUtils.showToast(`Team ${registeredTeam.teamName} registered successfully! Generating ID Card...`, 'success', 2500);

      const inlineTicketSection = document.getElementById('ticketResultSection');
      if (inlineTicketSection && typeof renderVirtualTeamIdCard === 'function') {
        renderVirtualTeamIdCard(registeredTeam);
        inlineTicketSection.scrollIntoView({ behavior: 'smooth' });
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Registration Confirmed</span>`;
        }
      } else {
        setTimeout(() => {
          window.location.href = `hall-ticket.html?teamId=${encodeURIComponent(registeredTeam.teamId)}&new=1`;
        }, 900);
      }

    } catch (err) {
      console.error("Registration error:", err);
      window.CodevisionUtils.showToast('Failed to submit registration. Please try again.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>Register Team &amp; Generate Team ID Card</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        `;
      }
    }
  });

  function validateForm() {
    let isValid = true;
    clearErrors();

    const teamNameEl = document.getElementById('teamName');
    const leaderNameEl = document.getElementById('leaderName');
    const leaderRollEl = document.getElementById('leaderRollNo');
    const leaderEmailEl = document.getElementById('leaderEmail');
    const leaderPhoneEl = document.getElementById('leaderPhone');
    const leaderClassEl = document.getElementById('leaderClass');
    const leaderSecEl = document.getElementById('leaderSection');
    const deptEl = document.getElementById('department');
    const collegeEl = document.getElementById('college');

    // Team Name
    if (!teamNameEl.value.trim() || teamNameEl.value.trim().length < 2) {
      showError(teamNameEl, 'Please enter a team name (at least 2 characters).');
      isValid = false;
    }

    // Team Logo Upload (Mandatory direct upload)
    const logoDataEl = document.getElementById('selectedLogoData');
    const dropZone = document.getElementById('logoDropZone');
    if (!selectedLogo || !logoDataEl || !logoDataEl.value) {
      if (dropZone) {
        showError(dropZone, 'Please upload your official team logo image.');
      }
      isValid = false;
    }

    // Challenge Problem Domain Track (Mandatory)
    const themeSelect = document.getElementById('selectedTheme');
    if (!themeSelect || !themeSelect.value) {
      if (themeSelect) {
        showError(themeSelect, 'Please select a Challenge Problem Domain Track.');
      }
      isValid = false;
    }

    // Leader Name
    if (!leaderNameEl.value.trim() || leaderNameEl.value.trim().length < 3) {
      showError(leaderNameEl, 'Please enter Team Leader full name.');
      isValid = false;
    }

    // Leader Roll No
    if (!leaderRollEl.value.trim()) {
      showError(leaderRollEl, 'Please enter Team Leader college roll number.');
      isValid = false;
    }

    // Leader Email
    if (!leaderEmailEl.value.trim() || !window.CodevisionUtils.Validators.isValidEmail(leaderEmailEl.value)) {
      showError(leaderEmailEl, 'Please enter a valid email address.');
      isValid = false;
    }

    // Leader Phone
    if (!leaderPhoneEl.value.trim() || !window.CodevisionUtils.Validators.isValidPhone(leaderPhoneEl.value)) {
      showError(leaderPhoneEl, 'Please enter a valid 10-digit WhatsApp phone number.');
      isValid = false;
    }

    // Leader Class & Sec
    if (!leaderClassEl.value) {
      showError(leaderClassEl, 'Please select Academic Year.');
      isValid = false;
    }
    if (!leaderSecEl.value.trim()) {
      showError(leaderSecEl, 'Please enter Section.');
      isValid = false;
    }

    // Member 2 (Always required for 2-3 member teams)
    const m2NameEl = document.getElementById('member2Name');
    const m2RollEl = document.getElementById('member2RollNo');
    const m2EmailEl = document.getElementById('member2Email');
    const m2PhoneEl = document.getElementById('member2Phone');
    const m2SecEl = document.getElementById('member2Section');

    if (m2NameEl && (!m2NameEl.value.trim() || m2NameEl.value.trim().length < 2)) {
      showError(m2NameEl, 'Please enter Member 2 full name.');
      isValid = false;
    }
    if (m2RollEl && !m2RollEl.value.trim()) {
      showError(m2RollEl, 'Please enter Member 2 roll number.');
      isValid = false;
    }
    if (m2EmailEl && m2EmailEl.value.trim() && !window.CodevisionUtils.Validators.isValidEmail(m2EmailEl.value)) {
      showError(m2EmailEl, 'Please enter a valid email for Member 2.');
      isValid = false;
    }
    if (m2PhoneEl && m2PhoneEl.value.trim() && !window.CodevisionUtils.Validators.isValidPhone(m2PhoneEl.value)) {
      showError(m2PhoneEl, 'Please enter a valid 10-digit phone for Member 2.');
      isValid = false;
    }
    if (m2SecEl && !m2SecEl.value.trim()) {
      showError(m2SecEl, 'Please enter Member 2 Section.');
      isValid = false;
    }

    // Member 3 (Required if 3 Members selected)
    if (currentTeamSize === 3) {
      const m3NameEl = document.getElementById('member3Name');
      const m3RollEl = document.getElementById('member3RollNo');
      const m3EmailEl = document.getElementById('member3Email');
      const m3PhoneEl = document.getElementById('member3Phone');
      const m3SecEl = document.getElementById('member3Section');

      if (m3NameEl && (!m3NameEl.value.trim() || m3NameEl.value.trim().length < 2)) {
        showError(m3NameEl, 'Please enter Member 3 full name.');
        isValid = false;
      }
      if (m3RollEl && !m3RollEl.value.trim()) {
        showError(m3RollEl, 'Please enter Member 3 roll number.');
        isValid = false;
      }
      if (m3EmailEl && m3EmailEl.value.trim() && !window.CodevisionUtils.Validators.isValidEmail(m3EmailEl.value)) {
        showError(m3EmailEl, 'Please enter a valid email for Member 3.');
        isValid = false;
      }
      if (m3PhoneEl && m3PhoneEl.value.trim() && !window.CodevisionUtils.Validators.isValidPhone(m3PhoneEl.value)) {
        showError(m3PhoneEl, 'Please enter a valid 10-digit phone for Member 3.');
        isValid = false;
      }
      if (m3SecEl && !m3SecEl.value.trim()) {
        showError(m3SecEl, 'Please enter Member 3 Section.');
        isValid = false;
      }
    }

    // Dept & College
    if (!deptEl.value.trim()) {
      showError(deptEl, 'Please enter Department.');
      isValid = false;
    }
    if (!collegeEl.value.trim()) {
      showError(collegeEl, 'Please enter College Name.');
      isValid = false;
    }

    if (!isValid) {
      const firstError = document.querySelector('.form-input.input-error, .form-select.input-error, .logo-upload-card.input-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      window.CodevisionUtils.showToast('Please fix required fields in the form.', 'warning');
    }

    return isValid;
  }

  function showError(inputEl, msg) {
    inputEl.classList.add('input-error');
    const errId = inputEl.id === 'logoDropZone' ? 'selectedLogoData-error' : (inputEl.id + '-error');
    const errSpan = document.getElementById(errId);
    if (errSpan) {
      errSpan.textContent = msg;
      errSpan.style.display = 'block';
    }
  }

  function clearErrors() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }
}

/* ==========================================================================
   Poster Lightbox
   ========================================================================== */
function initPosterLightbox() {
  const openTrigger = document.getElementById('openPosterLightbox');
  const lightbox = document.getElementById('posterLightbox');
  const closeTrigger = document.getElementById('closePosterLightbox');

  if (openTrigger && lightbox) {
    openTrigger.addEventListener('click', () => {
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeTrigger && lightbox) {
    closeTrigger.addEventListener('click', () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
}

