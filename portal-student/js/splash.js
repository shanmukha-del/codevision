/**
 * CODEVISION 2026 — Light-Theme Ultra-Smooth Animated Splash Screen Engine
 * High-performance, GPU-accelerated, Mobile & Laptop Optimized (Pure CSS & requestAnimationFrame)
 */
(function() {
  'use strict';

  function initSplash() {
    const splash = document.getElementById('codevisionSplash');
    if (!splash) return;

    const bar = document.getElementById('cvSplashBar');
    const percentEl = document.getElementById('cvSplashPercent');
    const statusTextEl = document.getElementById('cvSplashStatusText');
    const skipBtn = document.getElementById('cvSplashSkipBtn');

    let dismissed = false;
    let progress = 0;
    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth fill

    // Prevent body background scroll while splash is active
    document.body.style.overflow = 'hidden';

    function dismiss() {
      if (dismissed) return;
      dismissed = true;

      if (bar) bar.style.width = '100%';
      if (percentEl) percentEl.textContent = '100%';
      if (statusTextEl) statusTextEl.textContent = 'Welcome to CODEVISION 2026';

      splash.classList.add('fade-out');

      setTimeout(() => {
        splash.classList.add('hidden');
        document.body.style.overflow = '';
        try {
          splash.remove();
        } catch (_) {}
        window.dispatchEvent(new CustomEvent('codevision:splash-dismissed'));
      }, 450);
    }

    // Interactive skip triggers
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
      });
    }

    splash.addEventListener('click', dismiss);

    // Frame-by-frame 60fps/120fps progress
    function updateProgress(now) {
      if (dismissed) return;

      const elapsed = now - startTime;
      const linearT = Math.min(1, elapsed / duration);
      // Ease out cubic
      const easedT = 1 - Math.pow(1 - linearT, 3);

      progress = Math.min(100, Math.round(easedT * 100));

      if (bar) bar.style.width = progress + '%';
      if (percentEl) percentEl.textContent = progress + '%';

      if (progress < 40) {
        if (statusTextEl) statusTextEl.textContent = 'Initializing Codevision Engine...';
      } else if (progress < 80) {
        if (statusTextEl) statusTextEl.textContent = 'Connecting to Supabase Cloud...';
      } else if (progress < 100) {
        if (statusTextEl) statusTextEl.textContent = 'Launching Portal...';
      }

      if (linearT < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        dismiss();
      }
    }

    requestAnimationFrame(updateProgress);

    // Absolute fallback safety timeout
    setTimeout(dismiss, 1600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplash);
  } else {
    initSplash();
  }
})();
