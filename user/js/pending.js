/**
 * CODEVISION — STATUS TRACKER CONTROLLER
 * Loads confirmed team information and direct link to Team ID Card
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('teamId');

  if (!teamId) {
    document.getElementById('pendingContent').innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2 style="margin-bottom: 12px;">No Team ID Provided</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Please provide a valid Team ID to view details.</p>
        <a href="register.html" class="btn btn-primary">Go to Registration</a>
      </div>
    `;
    return;
  }

  initPendingWatcher(teamId);
});

function initPendingWatcher(teamId) {
  const cleanId = teamId.trim().toUpperCase();
  const teamIdDisplay = document.getElementById('displayTeamId');
  const teamNameEl = document.getElementById('displayTeamName');
  const membersEl = document.getElementById('displayMembers');
  const collegeEl = document.getElementById('displayCollege');
  const regTypeEl = document.getElementById('displayRegType');
  const dateEl = document.getElementById('displayDate');
  const actionBtn = document.getElementById('btnViewIdCard');

  const copyBtn = document.getElementById('btnCopyTeamId');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      window.CodevisionUtils.copyToClipboard(cleanId, 'Team ID copied');
    });
  }

  if (window.CodevisionDB && window.CodevisionDB.getTeamById) {
    window.CodevisionDB.getTeamById(cleanId).then(team => {
      if (!team) {
        document.getElementById('pendingContent').innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <h2 style="color: var(--danger);">Team Not Found</h2>
            <p style="color: var(--text-muted); margin: 12px 0 24px;">Could not locate a registration matching ID <strong>${cleanId}</strong>.</p>
            <a href="index.html" class="btn btn-secondary">Return Home</a>
          </div>
        `;
        return;
      }

      if (teamIdDisplay) teamIdDisplay.textContent = team.teamId;
      if (teamNameEl) teamNameEl.textContent = team.teamName;
      
      const leader = team.leader || { name: team.member1 || '' };
      const m2 = team.member2;
      const m2Name = m2 ? (typeof m2 === 'object' ? m2.name : m2) : null;
      if (membersEl) {
        membersEl.textContent = `${leader.name}${m2Name ? ' & ' + m2Name : ' (Solo Developer)'}`;
      }
      if (collegeEl) collegeEl.textContent = `${team.college || 'Vemu IT'} (${team.department || 'CSE'})`;
      if (regTypeEl) regTypeEl.textContent = (team.registrationType || 'ONLINE').toUpperCase();
      if (dateEl) dateEl.textContent = window.CodevisionUtils.formatDateTime(team.createdAt);

      if (actionBtn) {
        actionBtn.href = `hall-ticket.html?teamId=${encodeURIComponent(team.teamId)}`;
      }
    });
  }
}
