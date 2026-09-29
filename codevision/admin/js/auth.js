/**
 * CODEVISION — ADMIN AUTHENTICATION CONTROLLER
 * Handles coordinator login, session verification, route protection, and logout
 */

document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.endsWith('login.html');
  const isDashboardPage = window.location.pathname.endsWith('dashboard.html');

  const currentAdmin = window.CodevisionDB.getCurrentAdmin();

  // Route protection
  if (isDashboardPage && !currentAdmin) {
    window.location.href = 'login.html';
    return;
  }

  if (isLoginPage && currentAdmin) {
    window.location.href = 'dashboard.html';
    return;
  }

  if (isLoginPage) {
    initLoginPage();
  }

  if (isDashboardPage) {
    initAdminHeader(currentAdmin);
  }
});

function initLoginPage() {
  const form = document.getElementById('adminLoginForm');
  const userInput = document.getElementById('adminUsername') || document.getElementById('adminEmail');
  const passInput = document.getElementById('adminPassword');
  const errorBox = document.getElementById('loginErrorBox');
  const btnSubmit = document.getElementById('btnLoginSubmit');

  // Quick credentials 1-click fill helper button
  document.querySelectorAll('.btn-demo-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      const username = btn.getAttribute('data-username') || btn.getAttribute('data-email');
      const pass = btn.getAttribute('data-pass');
      if (username && pass) {
        if (userInput) userInput.value = username;
        if (passInput) passInput.value = pass;
      }
    });
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';

      const username = userInput ? userInput.value.trim() : '';
      const password = passInput ? passInput.value.trim() : '';

      if (!username || !password) {
        showError('Please enter both administrator username and password.');
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `
        <span class="spinner" style="width: 16px; height: 16px;"></span>
        <span>Authenticating...</span>
      `;

      try {
        const result = await window.CodevisionDB.loginAdmin(username, password);

        if (result.success) {
          window.CodevisionUtils.showToast('Login successful! Loading dashboard...', 'success', 1500);
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 600);
        } else {
          showError(result.error || 'Authentication failed. Please verify credentials.');
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `Sign In to Dashboard →`;
        }
      } catch (err) {
        console.error(err);
        showError('Network error during authentication. Please retry.');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `Sign In to Dashboard →`;
      }
    });
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }
}

function initAdminHeader(admin) {
  if (!admin) return;

  const nameEl = document.getElementById('adminUserName');
  const roleEl = document.getElementById('adminUserRole');
  const avatarEl = document.getElementById('adminAvatarInitial');

  if (nameEl) nameEl.textContent = admin.displayName || 'Coordinator';
  if (roleEl) roleEl.textContent = admin.role || 'Admin';
  if (avatarEl) avatarEl.textContent = (admin.displayName || 'A').charAt(0).toUpperCase();

  // Setup Logout
  const logoutBtns = document.querySelectorAll('.btn-admin-logout');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to sign out from Codevision Admin Portal?')) {
        await window.CodevisionDB.logoutAdmin();
        window.location.href = 'login.html';
      }
    });
  });
}
