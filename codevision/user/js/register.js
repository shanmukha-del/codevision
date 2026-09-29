/**
 * CODEVISION — TEAM REGISTRATION CONTROLLER
 * Handles Team Name, Logo Upload/Picker, Team Size toggle (1 or 2),
 * Leader & Member 2 details (Roll No, Class, Section), and instant generation of Team ID card.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLogoSelector();
  initTeamSizeSelector();
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
   Team Size Toggle (1 or 2 Members)
   ========================================================================== */
function initTeamSizeSelector() {
  const opt1 = document.getElementById('sizeOpt1');
  const opt2 = document.getElementById('sizeOpt2');
  const radio1 = document.getElementById('radioSize1');
  const radio2 = document.getElementById('radioSize2');
  const member2Section = document.getElementById('member2Section');

  function setSize(size) {
    currentTeamSize = size;
    if (size === 1) {
      if (opt1) opt1.classList.add('active');
      if (opt2) opt2.classList.remove('active');
      if (radio1) radio1.checked = true;
      if (member2Section) {
        member2Section.style.display = 'none';
      }
    } else {
      if (opt2) opt2.classList.add('active');
      if (opt1) opt1.classList.remove('active');
      if (radio2) radio2.checked = true;
      if (member2Section) {
        member2Section.style.display = 'block';
      }
    }
  }

  if (opt1) {
    opt1.addEventListener('click', (e) => {
      e.preventDefault();
      setSize(1);
    });
  }

  if (opt2) {
    opt2.addEventListener('click', (e) => {
      e.preventDefault();
      setSize(2);
    });
  }

  // Default to 2
  setSize(2);
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
    const leaderSection = document.getElementById('leaderSection').value;

    let member2Data = null;
    if (currentTeamSize === 2) {
      member2Data = {
        name: document.getElementById('member2Name').value.trim(),
        rollNo: document.getElementById('member2RollNo').value.trim().toUpperCase(),
        email: document.getElementById('member2Email').value.trim().toLowerCase(),
        phone: document.getElementById('member2Phone').value.trim(),
        classYear: document.getElementById('member2Class').value || leaderClass,
        section: document.getElementById('member2Section').value || leaderSection
      };
    }

    const department = document.getElementById('department').value;
    const college = document.getElementById('college').value.trim();

    const teamPayload = {
      teamName,
      teamLogo: selectedLogo,
      teamSize: currentTeamSize,
      leader: {
        name: leaderName,
        rollNo: leaderRollNo,
        email: leaderEmail,
        phone: leaderPhone,
        classYear: leaderClass,
        section: leaderSection
      },
      member2: member2Data,
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

      // Smooth redirect directly to Team ID Card pass
      setTimeout(() => {
        window.location.href = `hall-ticket.html?teamId=${encodeURIComponent(registeredTeam.teamId)}&new=1`;
      }, 900);

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
    if (!leaderSecEl.value) {
      showError(leaderSecEl, 'Please select Section.');
      isValid = false;
    }

    // Member 2 if 2 selected
    if (currentTeamSize === 2) {
      const m2NameEl = document.getElementById('member2Name');
      const m2RollEl = document.getElementById('member2RollNo');
      const m2EmailEl = document.getElementById('member2Email');
      const m2PhoneEl = document.getElementById('member2Phone');

      if (!m2NameEl.value.trim() || m2NameEl.value.trim().length < 3) {
        showError(m2NameEl, 'Please enter Member 2 full name.');
        isValid = false;
      }
      if (!m2RollEl.value.trim()) {
        showError(m2RollEl, 'Please enter Member 2 roll number.');
        isValid = false;
      }
      if (m2EmailEl.value.trim() && !window.CodevisionUtils.Validators.isValidEmail(m2EmailEl.value)) {
        showError(m2EmailEl, 'Please enter a valid email for Member 2.');
        isValid = false;
      }
      if (m2PhoneEl.value.trim() && !window.CodevisionUtils.Validators.isValidPhone(m2PhoneEl.value)) {
        showError(m2PhoneEl, 'Please enter a valid 10-digit phone for Member 2.');
        isValid = false;
      }
    }

    // Dept & College
    if (!deptEl.value) {
      showError(deptEl, 'Please select Department.');
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
