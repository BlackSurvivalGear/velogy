// Velogy Security - MVP Application Logic

const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('.nav-item')];
const title = document.getElementById('pageTitle');
const sidebar = document.querySelector('.sidebar');
const toastContainer = document.getElementById('toastContainer');

const titles = {
  dashboard: 'Dashboard',
  patrol: 'Site Patrol',
  access: 'Access Control',
  jetty: 'Jetty',
  reports: 'Admin Reports',
  'gate-east': 'East Gate',
  'gate-west': 'West Gate',
  'gate-w2': 'W2 Gate',
  'car-search': 'Car Search',
  'jetty-patrol': 'Jetty Patrol',
  'visitor-search': 'Visitor Search'
};

// 16 REAL PATROL CHECKPOINTS
const CHECKPOINTS = [
  "Garden Center",
  "Daveyhulme",
  "FLX Lamp Post",
  "East Fence",
  "Double Gates",
  "Warehouse 800 / Mess Hall",
  "Warehouse 700",
  "Warehouse 600",
  "Lone Worker Check",
  "West Lot",
  "Cooling Towers",
  "Railhead",
  "Flare",
  "W5",
  "Stores",
  "W50"
];

// INITIALIZE MOCK PATROL STATE (8 Rounds x 16 Checkpoints = 128 Total)
// We set up realistic state matching the prompt examples (121 checked, 4 issues, 3 missed/pending for completed night or active night)
let currentSelectedRound = 4; // Default active round view in UI

let patrolRounds = {};

function initMockPatrolData() {
  patrolRounds = {};

  // Create 8 rounds
  for (let r = 1; r <= 8; r++) {
    patrolRounds[r] = {};
    CHECKPOINTS.forEach((cpName, idx) => {
      // Default: CHECKED
      let status = 'CHECKED';
      let time = `0${r + 21}:14`.slice(-5);
      if (r >= 4) {
        time = `0${r - 4 + 1}:${10 + idx}`.slice(-5);
      }
      let officer = (r % 2 === 0) ? "Officer S. Miller" : "Security Officer J. Vance";
      let issueDetails = null;

      // Inject specific mock issues to demonstrate features & match prompt examples
      if (cpName === "FLX Lamp Post" && r === 4) {
        status = 'ISSUE';
        issueDetails = {
          issue: "Lamp not functioning",
          severity: "HIGH",
          officer: "Security Officer J. Vance",
          time: "01:42"
        };
      } else if (cpName === "East Fence" && r === 2) {
        status = 'ISSUE';
        issueDetails = {
          issue: "Fence wire loose near post 14",
          severity: "MEDIUM",
          officer: "Officer S. Miller",
          time: "23:50"
        };
      } else if (cpName === "Cooling Towers" && r === 6) {
        status = 'ISSUE';
        issueDetails = {
          issue: "Access hatch door latch stiff",
          severity: "LOW",
          officer: "Officer A. Taylor",
          time: "03:15"
        };
      } else if (cpName === "Flare" && r === 7) {
        status = 'ISSUE';
        issueDetails = {
          issue: "Warning indicator bulb flickering",
          severity: "MEDIUM",
          officer: "Security Officer J. Vance",
          time: "04:22"
        };
      }

      // Inject 3 missed/pending checkpoints in Round 8 to showcase missed state
      if (r === 8 && (cpName === "Warehouse 700" || cpName === "Railhead" || cpName === "Stores")) {
        status = 'PENDING';
        time = '--:--';
      }

      patrolRounds[r][cpName] = {
        name: cpName,
        round: r,
        status: status, // 'CHECKED' | 'ISSUE' | 'PENDING'
        time: time,
        officer: officer,
        issueDetails: issueDetails
      };
    });
  }
}

initMockPatrolData();

// Toast notification helper
function showToast(message, type = 'info') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Date/Time Helpers
function getLocalDateTimeString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function getTimeString() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

// Auto-populate date-time inputs if empty
function initializeDateTimeFields() {
  const nowIso = getLocalDateTimeString();
  const timeNow = getTimeString();

  const carDt = document.getElementById('carDateTime');
  if (carDt && !carDt.value) carDt.value = nowIso;

  const jettyPatrolDt = document.getElementById('jettyPatrolDateTime');
  if (jettyPatrolDt && !jettyPatrolDt.value) jettyPatrolDt.value = nowIso;

  const visDt = document.getElementById('visDateTime');
  if (visDt && !visDt.value) visDt.value = nowIso;

  const visTimeIn = document.getElementById('visTimeIn');
  if (visTimeIn && !visTimeIn.value) visTimeIn.value = timeNow;
}

// View Navigation
function showView(id) {
  const target = document.getElementById(id);
  if (!target) return;

  views.forEach(view => view.classList.toggle('active-view', view.id === id));

  navItems.forEach(item => {
    const isMainMatch = item.dataset.view === id;
    const isAccessSub = (id.startsWith('gate-') || id === 'car-search') && item.dataset.view === 'access';
    const isJettySub = (id.startsWith('jetty-') || id === 'visitor-search') && item.dataset.view === 'jetty';
    item.classList.toggle('active', isMainMatch || isAccessSub || isJettySub);
  });

  if (title) title.textContent = titles[id] || 'Dashboard';
  if (sidebar) sidebar.classList.remove('open');

  initializeDateTimeFields();

  if (id === 'patrol') {
    renderPatrolDashboard();
  } else if (id === 'reports') {
    renderAdminReports();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Delegation for Navigation
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-view]');
  if (trigger) {
    event.preventDefault();
    showView(trigger.dataset.view);
  }
});

// Mobile Sidebar Menu Toggle
const menuButton = document.getElementById('menuButton');
if (menuButton) {
  menuButton.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

/* ==========================================================================
   1. SITE PATROL MODULE & NIGHT PATROL MODEL (8 Rounds x 16 Checkpoints)
   ========================================================================== */

function getPatrolStats() {
  let totalChecksRequired = 8 * 16; // 128
  let totalChecked = 0;
  let totalIssues = 0;
  let totalPending = 0;
  let completedRoundsCount = 0;

  for (let r = 1; r <= 8; r++) {
    let roundChecked = 0;
    let roundIssues = 0;
    let roundPending = 0;

    CHECKPOINTS.forEach(cpName => {
      const item = patrolRounds[r][cpName];
      if (item.status === 'CHECKED') {
        totalChecked++;
        roundChecked++;
      } else if (item.status === 'ISSUE') {
        totalIssues++;
        roundIssues++;
      } else {
        totalPending++;
        roundPending++;
      }
    });

    if (roundPending === 0) {
      completedRoundsCount++;
    }
  }

  const completionPct = (((totalChecked + totalIssues) / totalChecksRequired) * 100).toFixed(1);

  return {
    totalChecksRequired,
    totalChecked,
    totalIssues,
    totalPending,
    completedRoundsCount,
    completionPct
  };
}

function renderPatrolDashboard() {
  const stats = getPatrolStats();

  // Update Night Patrol Summary Status Box
  const statRoundsCompleted = document.getElementById('statRoundsCompleted');
  const statRoundsOutstanding = document.getElementById('statRoundsOutstanding');
  const statChecksCompleted = document.getElementById('statChecksCompleted');
  const statChecksOutstanding = document.getElementById('statChecksOutstanding');
  const statCompletionPct = document.getElementById('statCompletionPct');
  const statIssuesCount = document.getElementById('statIssuesCount');

  if (statRoundsCompleted) statRoundsCompleted.textContent = `${stats.completedRoundsCount} / 8`;
  if (statRoundsOutstanding) statRoundsOutstanding.textContent = `${8 - stats.completedRoundsCount} rounds outstanding`;
  if (statChecksCompleted) statChecksCompleted.textContent = `${stats.totalChecked + stats.totalIssues} / 128`;
  if (statChecksOutstanding) statChecksOutstanding.textContent = `${stats.totalPending} checks remaining`;
  if (statCompletionPct) statCompletionPct.textContent = `${stats.completionPct}%`;
  if (statIssuesCount) statIssuesCount.textContent = `${stats.totalIssues}`;

  // Update Dashboard status card
  const dashPatrolStatus = document.getElementById('dashPatrolStatus');
  const dashPatrolSub = document.getElementById('dashPatrolSub');
  if (dashPatrolStatus) {
    dashPatrolStatus.textContent = `Round ${currentSelectedRound} Active`;
  }
  if (dashPatrolSub) {
    dashPatrolSub.textContent = `${stats.totalChecked + stats.totalIssues} / 128 Checkpoints Cleared (${stats.completionPct}%)`;
  }

  // Render Round Selector Pills
  const roundPillsContainer = document.getElementById('roundPillsContainer');
  if (roundPillsContainer) {
    roundPillsContainer.innerHTML = '';
    for (let r = 1; r <= 8; r++) {
      let rChecked = 0;
      CHECKPOINTS.forEach(cp => {
        if (patrolRounds[r][cp].status !== 'PENDING') rChecked++;
      });
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `round-pill ${r === currentSelectedRound ? 'active' : ''}`;
      btn.dataset.round = r;
      btn.innerHTML = `Round ${r} <span class="pill-sub">${rChecked}/16</span>`;
      btn.addEventListener('click', () => {
        currentSelectedRound = r;
        renderPatrolDashboard();
      });
      roundPillsContainer.appendChild(btn);
    }
  }

  // Render Round Details Header & Checkpoints
  const activeRoundTitle = document.getElementById('activeRoundTitle');
  const activeRoundSub = document.getElementById('activeRoundSub');
  const checkpointGrid = document.getElementById('checkpointGrid');

  if (activeRoundTitle) activeRoundTitle.textContent = `PATROL ROUND ${currentSelectedRound}`;

  let roundCheckedCount = 0;
  let roundIssueCount = 0;
  CHECKPOINTS.forEach(cp => {
    if (patrolRounds[currentSelectedRound][cp].status === 'CHECKED') roundCheckedCount++;
    if (patrolRounds[currentSelectedRound][cp].status === 'ISSUE') roundIssueCount++;
  });

  if (activeRoundSub) {
    activeRoundSub.textContent = `${roundCheckedCount + roundIssueCount} / 16 checkpoints checked ${roundIssueCount > 0 ? `(${roundIssueCount} issue)` : ''}`;
  }

  if (checkpointGrid) {
    checkpointGrid.innerHTML = '';
    CHECKPOINTS.forEach((cpName, index) => {
      const data = patrolRounds[currentSelectedRound][cpName];
      const card = document.createElement('div');

      let stateClass = 'state-pending';
      let badgeText = 'PENDING';
      let metaText = 'Awaiting tag';
      let btnLabel = 'TAG CHECKPOINT';

      if (data.status === 'CHECKED') {
        stateClass = 'state-checked';
        badgeText = 'CHECKED';
        metaText = `Checked ${data.time}`;
        btnLabel = 'CHECKED ✓';
      } else if (data.status === 'ISSUE') {
        stateClass = 'state-issue';
        badgeText = 'ISSUE';
        metaText = `${data.issueDetails ? data.issueDetails.issue : 'Issue logged'} (${data.time})`;
        btnLabel = 'VIEW ISSUE';
      }

      card.className = `check-card ${stateClass}`;
      card.innerHTML = `
        <div class="check-card-top">
          <span class="check-card-num">${String(index + 1).padStart(2, '0')}</span>
          <span class="check-card-badge">${badgeText}</span>
        </div>
        <strong>${cpName}</strong>
        <div class="check-card-meta">${metaText}</div>
        <button type="button" class="check-card-btn">${btnLabel}</button>
      `;

      const btn = card.querySelector('.check-card-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCheckpointClick(currentSelectedRound, cpName);
      });

      card.addEventListener('click', () => {
        handleCheckpointClick(currentSelectedRound, cpName);
      });

      checkpointGrid.appendChild(card);
    });
  }
}

function handleCheckpointClick(roundNum, cpName) {
  const data = patrolRounds[roundNum][cpName];
  if (data.status === 'PENDING') {
    data.status = 'CHECKED';
    data.time = getTimeString();
    data.officer = "Security Officer J. Vance";
    showToast(`${cpName} tagged as CHECKED at ${data.time}`, 'success');
  } else if (data.status === 'CHECKED') {
    // Toggle back to pending or open detail
    data.status = 'PENDING';
    data.time = '--:--';
    showToast(`${cpName} reset to PENDING`, 'info');
  } else if (data.status === 'ISSUE') {
    openCheckpointDetailModal(cpName);
  }
  renderPatrolDashboard();
}

// "Tag All Remaining" Button Action
const tagAllBtn = document.getElementById('tagAllBtn');
if (tagAllBtn) {
  tagAllBtn.addEventListener('click', () => {
    CHECKPOINTS.forEach(cpName => {
      const item = patrolRounds[currentSelectedRound][cpName];
      if (item.status === 'PENDING') {
        item.status = 'CHECKED';
        item.time = getTimeString();
      }
    });
    showToast(`All remaining checkpoints for Round ${currentSelectedRound} tagged.`, 'success');
    renderPatrolDashboard();
  });
}

// ISSUE REPORTING MODAL & ACTION
const issueModal = document.getElementById('issueModal');
const openIssueModalBtn = document.getElementById('openIssueModalBtn');
const closeIssueModalBtn = document.getElementById('closeIssueModalBtn');
const cancelIssueBtn = document.getElementById('cancelIssueBtn');
const issueForm = document.getElementById('issueForm');
const issueRoundSelect = document.getElementById('issueRoundSelect');
const issueCheckpointSelect = document.getElementById('issueCheckpointSelect');

function populateIssueCheckpointSelect() {
  if (!issueCheckpointSelect) return;
  issueCheckpointSelect.innerHTML = '';
  CHECKPOINTS.forEach(cp => {
    const opt = document.createElement('option');
    opt.value = cp;
    opt.textContent = cp;
    issueCheckpointSelect.appendChild(opt);
  });
}

if (openIssueModalBtn) {
  openIssueModalBtn.addEventListener('click', () => {
    populateIssueCheckpointSelect();
    if (issueRoundSelect) issueRoundSelect.value = currentSelectedRound;
    if (issueModal) issueModal.setAttribute('aria-hidden', 'false');
  });
}

function closeIssueModal() {
  if (issueModal) issueModal.setAttribute('aria-hidden', 'true');
}

if (closeIssueModalBtn) closeIssueModalBtn.addEventListener('click', closeIssueModal);
if (cancelIssueBtn) cancelIssueBtn.addEventListener('click', closeIssueModal);

if (issueForm) {
  issueForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const rVal = parseInt(issueRoundSelect.value, 10);
    const cpVal = issueCheckpointSelect.value;
    const severityVal = document.getElementById('issueSeveritySelect').value;
    const officerVal = document.getElementById('issueOfficerInput').value || 'Security Officer';
    const descVal = document.getElementById('issueDescInput').value || 'Issue reported';

    patrolRounds[rVal][cpVal] = {
      name: cpVal,
      round: rVal,
      status: 'ISSUE',
      time: getTimeString(),
      officer: officerVal,
      issueDetails: {
        issue: descVal,
        severity: severityVal,
        officer: officerVal,
        time: getTimeString()
      }
    };

    closeIssueModal();
    showToast(`Issue reported for Round ${rVal} — ${cpVal} (${severityVal} Severity)`, 'warning');
    renderPatrolDashboard();
  });
}

/* ==========================================================================
   2. ADMIN REPORTS & CHECKPOINT MATRIX
   ========================================================================== */

function populateAdminFilterCheckpoints() {
  const filterCheckpoint = document.getElementById('filterCheckpoint');
  if (!filterCheckpoint) return;
  filterCheckpoint.innerHTML = '<option value="ALL">All 16 Checkpoints</option>';
  CHECKPOINTS.forEach(cp => {
    const opt = document.createElement('option');
    opt.value = cp;
    opt.textContent = cp;
    filterCheckpoint.appendChild(opt);
  });
}

function renderAdminReports() {
  populateAdminFilterCheckpoints();
  const stats = getPatrolStats();

  // Summary Card updates
  const repRequiredChecks = document.getElementById('repRequiredChecks');
  const repCompletedChecks = document.getElementById('repCompletedChecks');
  const repIssuesCount = document.getElementById('repIssuesCount');
  const repOutstandingChecks = document.getElementById('repOutstandingChecks');

  if (repRequiredChecks) repRequiredChecks.textContent = stats.totalChecksRequired;
  if (repCompletedChecks) repCompletedChecks.textContent = stats.totalChecked;
  if (repIssuesCount) repIssuesCount.textContent = stats.totalIssues;
  if (repOutstandingChecks) repOutstandingChecks.textContent = stats.totalPending;

  // Performance box updates
  const perfChecked = document.getElementById('perfChecked');
  const perfIssues = document.getElementById('perfIssues');
  const perfMissed = document.getElementById('perfMissed');
  const perfPct = document.getElementById('perfPct');

  if (perfChecked) perfChecked.textContent = stats.totalChecked;
  if (perfIssues) perfIssues.textContent = stats.totalIssues;
  if (perfMissed) perfMissed.textContent = stats.totalPending;
  if (perfPct) perfPct.textContent = `${stats.completionPct}%`;

  // Render Checkpoint Report Table (16 Checkpoints x 8 Rounds Matrix)
  const reportTableBody = document.getElementById('reportTableBody');
  if (!reportTableBody) return;

  const filterRoundVal = document.getElementById('filterRound') ? document.getElementById('filterRound').value : 'ALL';
  const filterCpVal = document.getElementById('filterCheckpoint') ? document.getElementById('filterCheckpoint').value : 'ALL';
  const filterStatusVal = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'ALL';

  reportTableBody.innerHTML = '';

  CHECKPOINTS.forEach(cpName => {
    if (filterCpVal !== 'ALL' && filterCpVal !== cpName) return;

    const tr = document.createElement('tr');

    let rowHtml = `<td class="col-checkpoint">${cpName}</td>`;

    let matchesFilter = true;

    for (let r = 1; r <= 8; r++) {
      if (filterRoundVal !== 'ALL' && parseInt(filterRoundVal, 10) !== r) {
        // Skip display logic filtering if specific round selected
      }

      const item = patrolRounds[r][cpName];
      let cellSymbol = '✓';
      let statusClass = 'status-checked';

      if (item.status === 'ISSUE') {
        cellSymbol = '!';
        statusClass = 'status-issue';
      } else if (item.status === 'PENDING') {
        cellSymbol = '—';
        statusClass = 'status-pending';
      }

      rowHtml += `<td><span class="cell-status ${statusClass}">${cellSymbol}</span></td>`;
    }

    rowHtml += `<td><button type="button" class="btn-detail-link">View Details</button></td>`;
    tr.innerHTML = rowHtml;

    tr.addEventListener('click', () => {
      openCheckpointDetailModal(cpName);
    });

    reportTableBody.appendChild(tr);
  });
}

// Attach filter change listeners
['filterDate', 'filterNight', 'filterRound', 'filterCheckpoint', 'filterOfficer', 'filterStatus'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', renderAdminReports);
  }
});

/* ==========================================================================
   3. CHECKPOINT DETAIL MODAL / DRAWER
   ========================================================================== */

const detailModal = document.getElementById('detailModal');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');

function openCheckpointDetailModal(cpName) {
  const titleEl = document.getElementById('detailModalTitle');
  const bodyEl = document.getElementById('detailModalBody');
  if (!detailModal || !bodyEl) return;

  if (titleEl) titleEl.textContent = cpName.toUpperCase();

  let roundsChecked = 0;
  let issuesCount = 0;
  let lastCheckedTime = '--:--';
  let historyHtml = '';
  let officersSet = new Set();

  for (let r = 1; r <= 8; r++) {
    const item = patrolRounds[r][cpName];
    if (item.status === 'CHECKED') {
      roundsChecked++;
      lastCheckedTime = item.time;
      officersSet.add(item.officer);
    } else if (item.status === 'ISSUE') {
      issuesCount++;
      officersSet.add(item.officer);
    }

    let badgeClass = item.status === 'CHECKED' ? 'ok-text' : item.status === 'ISSUE' ? 'amber-text' : 'muted';
    let statusLabel = item.status;
    if (item.status === 'ISSUE' && item.issueDetails) {
      statusLabel = `ISSUE (${item.issueDetails.severity}): ${item.issueDetails.issue}`;
    }

    historyHtml += `
      <div class="detail-history-item">
        <div>
          <span class="h-round">Round ${r}</span>
          <div class="${badgeClass}" style="font-size:13px; font-weight:700; margin-top:2px;">${statusLabel}</div>
        </div>
        <div style="text-align:right;">
          <span class="h-time">${item.time}</span>
          <div class="muted-small">${item.officer}</div>
        </div>
      </div>
    `;
  }

  bodyEl.innerHTML = `
    <div class="detail-summary-grid">
      <div class="detail-box">
        <span class="detail-box-label">Rounds Checked</span>
        <span class="detail-box-val">${roundsChecked} / 8</span>
      </div>
      <div class="detail-box">
        <span class="detail-box-label">Issues Logged</span>
        <span class="detail-box-val ${issuesCount > 0 ? 'amber-text' : ''}">${issuesCount}</span>
      </div>
      <div class="detail-box">
        <span class="detail-box-label">Last Checked</span>
        <span class="detail-box-val">${lastCheckedTime}</span>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <strong>Officers inspecting:</strong>
      <span class="muted" style="font-size:13px;">${[...officersSet].join(', ') || 'None'}</span>
    </div>

    <h4 style="margin: 20px 0 12px; color: var(--navy);">Night Patrol History (Rounds 1–8)</h4>
    <div class="detail-history-list">
      ${historyHtml}
    </div>
  `;

  detailModal.setAttribute('aria-hidden', 'false');
}

function closeDetailModal() {
  if (detailModal) detailModal.setAttribute('aria-hidden', 'true');
}

if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeDetailModal);

/* ==========================================================================
   4. ACCESS CONTROL & GATES MODULE
   ========================================================================== */

document.querySelectorAll('.gate-actions button').forEach(button => {
  button.addEventListener('click', () => {
    const gateContainer = button.closest('.gate-actions');
    const gateName = gateContainer ? gateContainer.dataset.gate : 'Gate';
    const actionName = button.dataset.gateAction || button.textContent.trim();

    const gateId = button.closest('.view').id;
    let activityListId = '';
    if (gateId === 'gate-east') activityListId = 'eastGateActivity';
    if (gateId === 'gate-west') activityListId = 'westGateActivity';
    if (gateId === 'gate-w2') activityListId = 'w2GateActivity';

    const activityList = document.getElementById(activityListId);
    if (activityList) {
      const p = document.createElement('p');
      p.className = 'new-entry';
      p.textContent = `${getTimeString()} · ${actionName}`;
      activityList.prepend(p);
    }

    const toastType = actionName === 'Access Denied' ? 'danger' : 'success';
    showToast(`${gateName}: ${actionName} recorded.`, toastType);
  });
});

/* ==========================================================================
   5. CAR SEARCH MODULE
   ========================================================================== */

// Multi-choice buttons (Vehicle Areas)
document.querySelectorAll('.choice-grid.multi-choice button').forEach(button => {
  button.addEventListener('click', () => {
    button.classList.toggle('selected');
    button.setAttribute('aria-pressed', button.classList.contains('selected'));
  });
});

// Single-choice buttons (Search Result)
document.querySelectorAll('.choice-grid.single-choice button').forEach(button => {
  button.addEventListener('click', () => {
    const parentGrid = button.closest('.choice-grid');
    parentGrid.querySelectorAll('button').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('selected');
    button.setAttribute('aria-pressed', 'true');
  });
});

// Complete Car Search Action
const carSearchForm = document.getElementById('carSearchForm');
if (carSearchForm) {
  carSearchForm.addEventListener('submit', e => {
    e.preventDefault();
    const regInput = document.getElementById('carReg');
    const regVal = regInput ? regInput.value.trim() : '';

    const selectedResult = document.querySelector('#carResultGrid button.selected');
    const resultVal = selectedResult ? selectedResult.dataset.result : 'Clear';

    const toastType = resultVal === 'Clear' ? 'success' : resultVal === 'Item Found' ? 'warning' : 'danger';
    showToast(`Car Search completed for ${regVal || 'Vehicle'}. Result: ${resultVal}`, toastType);

    setTimeout(() => {
      showView('access');
    }, 1200);
  });
}

/* ==========================================================================
   6. JETTY PATROL & VISITOR SEARCH MODULES
   ========================================================================== */

let jettyPatrolActive = false;
const startJettyPatrolBtn = document.getElementById('startJettyPatrolBtn');
const jettyPatrolBadge = document.getElementById('jettyPatrolBadge');
const completeJettyPatrolBtn = document.getElementById('completeJettyPatrolBtn');

if (startJettyPatrolBtn) {
  startJettyPatrolBtn.addEventListener('click', () => {
    jettyPatrolActive = true;
    if (jettyPatrolBadge) {
      jettyPatrolBadge.textContent = 'PATROL ACTIVE';
      jettyPatrolBadge.className = 'status-badge active';
    }
    showToast('Jetty Patrol started.', 'success');
  });
}

// Checklist OK / ISSUE toggles
document.querySelectorAll('.ok-issue-toggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    const toggleGroup = btn.closest('.ok-issue-toggle');
    toggleGroup.querySelectorAll('button').forEach(b => b.classList.remove('active-ok', 'active-issue'));

    if (btn.dataset.value === 'OK') {
      btn.classList.add('active-ok');
    } else {
      btn.classList.add('active-issue');
    }
  });
});

if (completeJettyPatrolBtn) {
  completeJettyPatrolBtn.addEventListener('click', () => {
    if (jettyPatrolBadge) {
      jettyPatrolBadge.textContent = 'COMPLETED';
      jettyPatrolBadge.className = 'status-badge completed';
    }
    showToast('Jetty Patrol record submitted.', 'success');
    setTimeout(() => {
      showView('jetty');
    }, 1200);
  });
}

const visitorSearchForm = document.getElementById('visitorSearchForm');
if (visitorSearchForm) {
  visitorSearchForm.addEventListener('submit', e => {
    e.preventDefault();
    const visNameInput = document.getElementById('visName');
    const visNameVal = visNameInput ? visNameInput.value.trim() : 'Visitor';

    showToast(`Visitor search completed for ${visNameVal}.`, 'success');

    setTimeout(() => {
      showView('jetty');
    }, 1200);
  });
}

// Initial Initialization
initializeDateTimeFields();
renderPatrolDashboard();
