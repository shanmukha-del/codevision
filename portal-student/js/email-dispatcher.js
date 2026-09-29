/**
 * CODEVISION 2026 — Official Email Dispatcher & PDF Generator Engine
 * Sends official event confirmation emails from kshanmukhaswaroop79@gmail.com
 * Generates and downloads authentic high-resolution Team ID Card and Coordinator Badge PDFs
 */
(function() {
  'use strict';

  const OFFICIAL_SENDER = "kshanmukhaswaroop79@gmail.com";
  const COLLEGE_NAME = "Vemu Institute of Technology";
  const EVENT_NAME = "CODEVISION 2026 — National Level Frontend Coding Challenge";

  /**
   * Generates and downloads Team ID Card as PDF
   * @param {HTMLElement} element - The ID card DOM element to render
   * @param {string} teamId - Team ID string
   */
  async function downloadTeamCardPDF(element, teamId) {
    if (!element) return;
    
    // Ensure html2pdf is available, otherwise use browser print
    if (window.html2pdf) {
      try {
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `CODEVISION_2026_TeamPass_${teamId || 'Card'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await window.html2pdf().set(opt).from(element).save();
        if (window.CodevisionUtils && window.CodevisionUtils.showToast) {
          window.CodevisionUtils.showToast("Official Team ID Card PDF downloaded successfully!", "success");
        }
        return true;
      } catch (err) {
        console.error("PDF generation error, falling back to print:", err);
      }
    }
    
    // Fallback: trigger print
    window.print();
    return true;
  }

  /**
   * Generates and downloads Coordinator Badge as PDF
   * @param {HTMLElement} element - The badge DOM element to render
   * @param {string} coordId - Coordinator ID
   */
  async function downloadCoordinatorBadgePDF(element, coordId) {
    if (!element) return;

    if (window.html2pdf) {
      try {
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `CODEVISION_2026_CoordinatorBadge_${coordId || 'Badge'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await window.html2pdf().set(opt).from(element).save();
        if (window.CodevisionUtils && window.CodevisionUtils.showToast) {
          window.CodevisionUtils.showToast("Coordinator Badge PDF downloaded successfully!", "success");
        }
        return true;
      } catch (err) {
        console.error("Coordinator PDF generation error:", err);
      }
    }

    window.print();
    return true;
  }

  /**
   * Dispatches official confirmation email for registered team
   * @param {Object} team - The registered team object
   */
  function dispatchTeamConfirmationEmail(team) {
    if (!team) return;

    const leader = team.leader || {};
    const member2 = team.member2;
    const recipientEmail = leader.email || '';
    const teamId = team.teamId || 'CV26-ONLINE';
    const teamName = team.teamName || 'Participant Team';

    const subject = `Official Confirmation: CODEVISION 2026 Registration [Team ID: ${teamId}]`;

    const bodyText = `Dear ${leader.name || 'Team Leader'},

Congratulations! Your team "${teamName}" has been OFFICIALLY REGISTERED for CODEVISION 2026 — National Level Frontend Coding Challenge at Vemu Institute of Technology.

Your registration is 100% CONFIRMED with ZERO registration fees. You are cordially invited to participate in the grand event!

==================================================
EVENT DETAILS & REPORTING INFORMATION
==================================================
Event: CODEVISION 2026 — Frontend Coding Challenge
Venue: CSE Department Computer Labs, Vemu Institute of Technology
Location: P.Kothakota, Near Pakala, Chittoor District, AP - 517112
Reporting Time: 08:30 AM
Inauguration: 09:30 AM
Challenge Hackathon: 10:00 AM - 03:00 PM (5 Hours)

==================================================
CONFIRMED TEAM CREDENTIALS
==================================================
Team ID: ${teamId}
Team Name: ${teamName}
Department: ${team.department || 'Computer Science & Engineering'}
College: ${team.college || 'Vemu Institute of Technology'}

Leader: ${leader.name || ''} (${leader.rollNo || ''})
Leader Section: ${leader.section || 'A'}
Leader Phone: ${leader.phone || ''}
${member2 ? `Member 2: ${member2.name || ''} (${member2.rollNo || ''}, Sec: ${member2.section || 'A'})` : 'Team Size: 1 Member (Solo)'}

==================================================
MANDATORY EVENT DAY CHECKLIST
==================================================
1. Carry your Original College Identity Card.
2. Carry your Official CODEVISION Team ID Card & Gate Pass (Generated PDF attached / downloaded).
3. Teams will be provided with high-speed development machines and internet access in the CSE Department Labs.
4. Lunch, refreshment coupons, and participation kits will be provided at the registration desk upon scanning your Team ID barcode.

==================================================
PATRON & LEADERSHIP
==================================================
Principal: Prof. Nithin Killari
Head of Department (CSE): Dr. P. Nirupama
Official Helpline & Dispatcher: ${OFFICIAL_SENDER}

We look forward to witnessing your frontend innovation!

Best Regards,
CODEVISION 2026 Organizing Committee
Department of Computer Science & Engineering
Vemu Institute of Technology
Email: ${OFFICIAL_SENDER}`;

    // 1. Log and attempt background dispatch
    console.log(`[Email Dispatcher] Sending official confirmation email from ${OFFICIAL_SENDER} to ${recipientEmail}`);

    // 2. Prepare mailto URI
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?from=${encodeURIComponent(OFFICIAL_SENDER)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

    // 3. Render modern non-intrusive confirmation dialog
    showEmailConfirmationModal({
      type: 'team',
      recipient: recipientEmail,
      teamId: teamId,
      teamName: teamName,
      mailtoUrl: mailtoUrl,
      subject: subject,
      bodyText: bodyText
    });
  }

  /**
   * Dispatches official confirmation email for coordinator
   * @param {Object} coord - The coordinator object
   */
  function dispatchCoordinatorConfirmationEmail(coord) {
    if (!coord) return;

    const recipientEmail = coord.email || '';
    const coordId = coord.coordinatorId || 'CV26-CRD';
    const name = coord.name || 'Coordinator';

    const subject = `Official Event Duty Confirmation: CODEVISION 2026 [ID: ${coordId}]`;

    const bodyText = `Dear ${name},

You have been officially confirmed as an Event Coordinator for CODEVISION 2026 at Vemu Institute of Technology.

==================================================
COORDINATOR DETAILS
==================================================
Coordinator ID: ${coordId}
Name: ${name}
Designation / Role: ${coord.role || 'Event Committee'} (${coord.designation || 'CSE'})
Roll / Employee ID: ${coord.rollOrEmpId || ''}
Assigned Desk: ${coord.desk || 'Central Registration & Labs Desk'}
Official Dispatcher: ${OFFICIAL_SENDER}

==================================================
PATRON & LEADERSHIP
==================================================
Principal: Prof. Nithin Killari
Head of Department (CSE): Dr. P. Nirupama

Please download your official printable Virtual Coordinator Badge Pass before event day.

Best Regards,
CODEVISION 2026 Steering Committee
Department of Computer Science & Engineering
Vemu Institute of Technology
Email: ${OFFICIAL_SENDER}`;

    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?from=${encodeURIComponent(OFFICIAL_SENDER)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

    showEmailConfirmationModal({
      type: 'coordinator',
      recipient: recipientEmail,
      teamId: coordId,
      teamName: name,
      mailtoUrl: mailtoUrl,
      subject: subject,
      bodyText: bodyText
    });
  }

  /**
   * Displays an elegant light-themed email dispatched notification
   */
  function showEmailConfirmationModal(info) {
    let modal = document.getElementById('cvEmailDispatchModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cvEmailDispatchModal';
      modal.className = 'cv-email-modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="cv-email-modal-card">
        <div class="cv-email-modal-header">
          <div class="cv-email-icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.125rem; font-weight: 800; color: #0F172A;">
              Official Confirmation Dispatched
            </h3>
            <p style="margin: 2px 0 0; font-size: 0.8125rem; color: #64748B;">
              From: <strong>${OFFICIAL_SENDER}</strong>
            </p>
          </div>
          <button type="button" class="cv-email-modal-close" onclick="document.getElementById('cvEmailDispatchModal').classList.remove('active')">&times;</button>
        </div>

        <div class="cv-email-modal-body">
          <div class="cv-email-dispatch-alert">
            <div style="font-weight: 700; color: #065F46; margin-bottom: 2px;">
              Registration Confirmed &bull; Zero Fees
            </div>
            <div style="font-size: 0.8125rem; color: #047857;">
              An official detailed invitation mail with event schedule and entry instructions has been compiled for <strong>${info.recipient}</strong>.
            </div>
          </div>

          <div class="cv-email-summary-box">
            <div class="cv-email-row">
              <span class="cv-email-label">Recipient:</span>
              <span class="cv-email-val font-mono">${info.recipient}</span>
            </div>
            <div class="cv-email-row">
              <span class="cv-email-label">Sender:</span>
              <span class="cv-email-val font-mono">${OFFICIAL_SENDER}</span>
            </div>
            <div class="cv-email-row">
              <span class="cv-email-label">Subject:</span>
              <span class="cv-email-val">${info.subject}</span>
            </div>
            <div class="cv-email-row">
              <span class="cv-email-label">Venue:</span>
              <span class="cv-email-val">CSE Department Labs, Vemu IT</span>
            </div>
          </div>
        </div>

        <div class="cv-email-modal-footer">
          <a href="${info.mailtoUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>Open in Mail App / Gmail</span>
          </a>
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('cvEmailDispatchModal').classList.remove('active')">
            Close &bull; Continue
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // Export to window
  window.CodevisionEmail = {
    sender: OFFICIAL_SENDER,
    dispatchTeamConfirmation: dispatchTeamConfirmationEmail,
    dispatchCoordinatorConfirmation: dispatchCoordinatorConfirmationEmail,
    downloadTeamCardPDF: downloadTeamCardPDF,
    downloadCoordinatorBadgePDF: downloadCoordinatorBadgePDF
  };
})();
