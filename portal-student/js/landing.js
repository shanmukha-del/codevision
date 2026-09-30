/**
 * CODEVISION — LANDING PAGE LOGIC & 3D INTERACTIONS
 * Dynamic Themes Sync, Countdown Timer, Parallax & Scroll Reveal
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initRegistrationDeadlineChecker();
  initCountdown();
  initDynamicThemes();
  init3DParallax();
  initScrollReveal();
  setInterval(initRegistrationDeadlineChecker, 10000);
});

/* ==========================================================================
   Navbar & Mobile Menu
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const drawer = document.getElementById('mobileNavDrawer');
  const navLinks = document.querySelectorAll('.mobile-nav-drawer .nav-link');

  // Sticky header shadow
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile drawer toggle
  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        drawer.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ==========================================================================
   Registration Deadline & Automatic Closure Handler
   ========================================================================== */
function initRegistrationDeadlineChecker() {
  const isClosed = window.CodevisionDB && window.CodevisionDB.isRegistrationClosed ? window.CodevisionDB.isRegistrationClosed() : false;

  const heroNotice = document.getElementById('heroRegDeadlineNotice');
  const navRegBtn = document.getElementById('navRegisterBtn');
  const mobileNavRegBtn = document.getElementById('mobileNavRegisterBtn');
  const heroRegBtn = document.getElementById('heroRegisterBtn');
  const heroTicketBtn = document.getElementById('heroHallTicketBtn');
  const domainRevealBox = document.getElementById('domainRevealActionBox');
  const bottomCtaRegisterBtn = document.getElementById('bottomCtaRegisterBtn');
  const bottomCtaStatusTag = document.getElementById('bottomCtaStatusTag');
  const bottomCtaDeadlineNotice = document.getElementById('bottomCtaDeadlineNotice');

  if (isClosed) {
    // 1. Hero Notice
    if (heroNotice) {
      heroNotice.innerHTML = `<span>⛔</span> <span>Registrations Officially Closed (Concluded 03 Oct 2026, 08:00 PM)</span>`;
      heroNotice.style.background = '#FEE2E2';
      heroNotice.style.color = '#991B1B';
      heroNotice.style.borderColor = '#FCA5A5';
    }

    // 2. Hide register buttons across navigation and hero
    if (navRegBtn) navRegBtn.style.display = 'none';
    if (mobileNavRegBtn) mobileNavRegBtn.style.display = 'none';
    if (heroRegBtn) heroRegBtn.style.display = 'none';
    if (heroTicketBtn) {
      heroTicketBtn.className = 'btn btn-primary btn-lg';
    }
    if (domainRevealBox) domainRevealBox.style.display = 'none';

    // 3. Bottom CTA banner
    if (bottomCtaStatusTag) {
      bottomCtaStatusTag.textContent = 'REGISTRATION CONCLUDED';
      bottomCtaStatusTag.style.color = '#FCA5A5';
    }
    if (bottomCtaRegisterBtn) bottomCtaRegisterBtn.style.display = 'none';
    if (bottomCtaDeadlineNotice) {
      bottomCtaDeadlineNotice.innerHTML = `Candidate registrations concluded on <strong>Saturday, 03 Oct 2026 at 08:00 PM</strong>.`;
      bottomCtaDeadlineNotice.style.color = '#E2E8F0';
    }

    // 4. In theme cards (hide or change action)
    document.querySelectorAll('.theme-footer a[href*="register.html"]').forEach(link => {
      link.style.display = 'none';
    });
  } else {
    // Open state
    if (heroNotice) {
      heroNotice.innerHTML = `<span>⏳</span> <span>Last Date to Register: <strong>Saturday, 03 Oct 2026 at 08:00 PM</strong></span>`;
      heroNotice.style.background = '#FEF3C7';
      heroNotice.style.color = '#92400E';
      heroNotice.style.borderColor = '#FCD34D';
    }
    if (navRegBtn) navRegBtn.style.display = '';
    if (mobileNavRegBtn) mobileNavRegBtn.style.display = '';
    if (heroRegBtn) heroRegBtn.style.display = '';
    if (domainRevealBox) domainRevealBox.style.display = '';
    if (bottomCtaRegisterBtn) bottomCtaRegisterBtn.style.display = '';
  }
}

/* ==========================================================================
   Dynamic Countdown Timer & Realtime Event Schedule Sync
   ========================================================================== */
function initCountdown() {
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  let targetTimestamp = new Date('2026-10-24T10:00:00+05:30').getTime();

  function update() {
    const current = new Date().getTime();
    const distance = targetTimestamp - current;

    if (distance <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  // Subscribe to real-time event schedule set by Admin
  if (window.CodevisionDB && window.CodevisionDB.onEventScheduleChange) {
    window.CodevisionDB.onEventScheduleChange((schedule) => {
      if (!schedule) return;

      // Calculate Target Timestamp
      const isoTarget = `${schedule.eventDate}T${schedule.startTime || '10:00'}:00`;
      const parsed = new Date(isoTarget).getTime();
      if (!isNaN(parsed)) {
        targetTimestamp = parsed;
        const now = new Date().getTime();
        if (targetTimestamp <= now) {
          // If in the past, provide realistic 25-day preview countdown
          targetTimestamp = now + 1000 * 60 * 60 * 24 * 25 + 1000 * 60 * 60 * 12;
        }
      }

      // Update Hero Ribbon & Badges
      const heroDate = document.getElementById('heroEventDate');
      if (heroDate && schedule.eventDateFormatted) {
        heroDate.textContent = schedule.eventDateFormatted;
      }

      const heroTime = document.getElementById('heroEventTime');
      if (heroTime && schedule.startTimeFormatted && schedule.endTimeFormatted) {
        heroTime.textContent = `${schedule.startTimeFormatted} – ${schedule.endTimeFormatted}`;
      }

      const heroVenue = document.getElementById('heroEventVenue');
      if (heroVenue && schedule.venue) {
        heroVenue.textContent = schedule.venue;
      }

      const heroDuration = document.getElementById('heroDurationBadge');
      if (heroDuration && schedule.durationHours) {
        heroDuration.textContent = `${schedule.durationHours} Hours Live`;
      }

      // Update Format Card
      const fmtTime = document.getElementById('formatTimeDuration');
      if (fmtTime && schedule.startTimeFormatted && schedule.endTimeFormatted) {
        fmtTime.textContent = `${schedule.startTimeFormatted} – ${schedule.endTimeFormatted}`;
      }

      const fmtSub = document.getElementById('formatSubDuration');
      if (fmtSub && schedule.durationHours) {
        fmtSub.textContent = `${schedule.durationHours} hours of non-stop innovation, live mentorship, and final jury viva.`;
      }

      // Update Schedule Timeline Badges
      const bReporting = document.getElementById('schedBadgeReporting');
      if (bReporting && schedule.reportingTimeFormatted) bReporting.textContent = schedule.reportingTimeFormatted;

      const bAnnounce = document.getElementById('schedBadgeAnnounce');
      if (bAnnounce && schedule.startTimeFormatted) bAnnounce.textContent = schedule.startTimeFormatted;

      const bEnd = document.getElementById('schedBadgeEnd');
      if (bEnd && schedule.endTimeFormatted) bEnd.textContent = schedule.endTimeFormatted;

      const ruleScheduleDesc = document.getElementById('ruleScheduleDesc');
      if (ruleScheduleDesc && schedule.startTimeFormatted && schedule.endTimeFormatted && schedule.reportingTimeFormatted) {
        ruleScheduleDesc.textContent = `Event duration is ${schedule.startTimeFormatted} to ${schedule.endTimeFormatted}. Participants must report by ${schedule.reportingTimeFormatted} for QR ticket check-in and system allotment.`;
      }

      update();
    });
  }

  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   Dynamic Themes Listener (Realtime from DB)
   ========================================================================== */
function initDynamicThemes() {
  const container = document.getElementById('dynamic-themes-list');
  if (!container) return;

  const iconSvgMap = {
    brain: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"/></svg>`,
    building: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="8" y1="6" x2="8" y2="6.01"/><line x1="16" y1="6" x2="16" y2="6.01"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>`,
    'credit-card': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    leaf: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    code: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  };

  function renderThemes(themes) {
    if (!themes || themes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <p>Themes are being curated by event coordinators. Check back shortly!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = themes.map((theme, idx) => {
      const num = theme.number || String(idx + 1).padStart(2, '0');
      const difficultyClass = `difficulty-${(theme.difficulty || 'intermediate').toLowerCase()}`;
      const iconKey = theme.icon || 'code';
      const iconHtml = iconSvgMap[iconKey] || iconSvgMap.code;

      const isClosed = window.CodevisionDB && window.CodevisionDB.isRegistrationClosed ? window.CodevisionDB.isRegistrationClosed() : false;
      const actionBadge = isClosed
        ? `<span class="badge" style="background: #F1F5F9; color: #475569; font-size: 0.75rem; padding: 4px 10px; border-radius: 4px;">Problem Track</span>`
        : `<a href="register.html" class="badge badge-blue" style="text-decoration: none; font-size: 0.75rem; padding: 4px 10px; border-radius: 4px;">Select in Registration &rarr;</a>`;

      return `
        <article class="theme-card tilt-card reveal revealed">
          <div class="theme-header">
            <span class="theme-num">${num}</span>
            <div style="color: var(--primary); display: flex; align-items: center; justify-content: center;">
              ${iconHtml}
            </div>
          </div>
          <h3 class="theme-title">${escapeHtml(theme.title)}</h3>
          <p class="theme-desc">${escapeHtml(theme.description || theme.title)}</p>
          <div class="theme-footer">
            <span class="theme-difficulty ${difficultyClass}">${escapeHtml(theme.difficulty || 'Intermediate')}</span>
            ${actionBadge}
          </div>
        </article>
      `;
    }).join('');
  }

  // Subscribe to real-time updates from database
  if (window.CodevisionDB && window.CodevisionDB.onThemesChange) {
    window.CodevisionDB.onThemesChange((themes) => {
      renderThemes(themes);
    }, true);
  }
}

/* ==========================================================================
   3D Mouse Parallax on Hero Visual
   ========================================================================== */
function init3DParallax() {
  const browser = document.querySelector('.hero-browser-3d');
  const heroContainer = document.querySelector('.hero-section');
  const floatItems = document.querySelectorAll('.float-symbol');

  if (!browser || !heroContainer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let mouseX = 0, mouseY = 0;
  let currentRotateX = 7, currentRotateY = -8;
  let targetRotateX = 7, targetRotateY = -8;

  heroContainer.addEventListener('mousemove', (e) => {
    const rect = heroContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    targetRotateY = (x / (rect.width / 2)) * 14;
    targetRotateX = -(y / (rect.height / 2)) * 14;

    // Subtle parallax on floating badges
    floatItems.forEach((item, idx) => {
      const depth = (idx + 1) * 6;
      const transX = (x / rect.width) * depth;
      const transY = (y / rect.height) * depth;
      item.style.transform = `translate(${transX}px, ${transY}px)`;
    });
  });

  heroContainer.addEventListener('mouseleave', () => {
    targetRotateX = 7;
    targetRotateY = -8;
    floatItems.forEach(item => {
      item.style.transform = '';
    });
  });

  // Smooth interpolation frame
  function updateParallax() {
    currentRotateX += (targetRotateX - currentRotateX) * 0.1;
    currentRotateY += (targetRotateY - currentRotateY) * 0.1;

    browser.style.transform = `rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) rotateZ(1deg)`;
    requestAnimationFrame(updateParallax);
  }
  requestAnimationFrame(updateParallax);
}

/* ==========================================================================
   Scroll Reveal Observer
   ========================================================================== */
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
    return;
  }

  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
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
