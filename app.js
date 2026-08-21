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
  'gate-east': 'East Gate',
  'gate-west': 'West Gate',
  'gate-w2': 'W2 Gate',
  'car-search': 'Car Search',
  'jetty-patrol': 'Jetty Patrol',
  'visitor-search': 'Visitor Search'
};

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

  const patrolDt = document.getElementById('patrolDateTime');
  if (patrolDt && !patrolDt.value) patrolDt.value = nowIso;

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
   1. SITE PATROL MODULE (8 NIGHTLY ROUNDS & 16 CHECKPOINTS)
   ========================================================================== */

const CHECKPOINT_NAMES = [
  "Garden Center", "Daveyhulme", "FLX Lamp Post", "East Fence",
  "Double Gates", "Warehouse 800 / Mess Hall", "Warehouse 700", "Warehouse 600",
  "Lone Worker Check", "West Lot", "Cooling Towers", "Railhead",
  "Flare", "W5", "Stores", "W50"
];

// Local state for 8 Rounds x 16 Checkpoints
// State per checkpoint: 'Pending' | 'Checked' | 'Issue'
let activeRoundIndex = 0; // 0 to 7
const patrolRounds = Array.from({ length: 8 }, (_, rIdx) => ({
  roundNumber: rIdx + 1,
  timeLabel: `Round ${rIdx + 1}`,
  status: 'Pending', // 'Pending' | 'In Progress' | 'Completed'
  checkpoints: CHECKPOINT_NAMES.map(name => ({ name, status: 'Pending' }))
}));

let patrolState = 'NOT STARTED'; // 'NOT STARTED' | 'PATROL ACTIVE' | 'COMPLETED'

const patrolBadge = document.getElementById('patrolBadge');
const startPatrolBtn = document.getElementById('startPatrolBtn');
const completePatrolBtn = document.getElementById('completePatrolBtn');
const dashPatrolStatus = document.getElementById('dashPatrolStatus');
const dashPatrolSub = document.getElementById('dashPatrolSub');
const reportIssueBtn = document.getElementById('reportIssueBtn');

const roundSelectorGrid = document.getElementById('roundSelectorGrid');
const checkpointGrid = document.getElementById('checkpointGrid');
const activeRoundSubtitle = document.getElementById('activeRoundSubtitle');
const roundProgressText = document.getElementById('roundProgressText');
const roundSummaryList = document.getElementById('roundSummaryList');
const checkpointSummaryList = document.getElementById('checkpointSummaryList');
const toggleReportSummaryBtn = document.getElementById('toggleReportSummaryBtn');
const patrolSummaryPanel = document.getElementById('patrolSummaryPanel');

function renderRoundSelectors() {
  if (!roundSelectorGrid) return;
  roundSelectorGrid.innerHTML = '';

  patrolRounds.forEach((round, idx) => {
    const checkedCount = round.checkpoints.filter(c => c.status === 'Checked').length;
    const issueCount = round.checkpoints.filter(c => c.status === 'Issue').length;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `round-card ${idx === activeRoundIndex ? 'active-round' : ''}`;

    let badgeClass = 'round-pending';
    let statusLabel = 'Pending';
    if (checkedCount === 16) {
      badgeClass = 'round-completed';
      statusLabel = '16/16 Completed';
    } else if (checkedCount > 0 || issueCount > 0) {
      badgeClass = 'round-in-progress';
      statusLabel = `${checkedCount}/16 Checked`;
    }

    if (issueCount > 0) {
      statusLabel += ` (${issueCount} Issue)`;
    }

    btn.innerHTML = `
      <span class="round-num">0${round.roundNumber}</span>
      <strong>Round ${round.roundNumber}</strong>
      <em class="${badgeClass}">${statusLabel}</em>
    `;

    btn.addEventListener('click', () => {
      activeRoundIndex = idx;
      renderRoundSelectors();
      renderCheckpoints();
      updatePatrolUI();
    });

    roundSelectorGrid.appendChild(btn);
  });
}

function renderCheckpoints() {
  if (!checkpointGrid) return;
  checkpointGrid.innerHTML = '';

  const activeRound = patrolRounds[activeRoundIndex];
  if (activeRoundSubtitle) {
    activeRoundSubtitle.textContent = `ROUND ${activeRound.roundNumber} CHECKPOINTS`;
  }

  const checkedCount = activeRound.checkpoints.filter(c => c.status === 'Checked').length;
  if (roundProgressText) {
    roundProgressText.textContent = `${checkedCount} / 16 Checked`;
  }

  activeRound.checkpoints.forEach((cp, cpIdx) => {
    const card = document.createElement('div');
    card.className = `check-card ${cp.status === 'Checked' ? 'checked' : cp.status === 'Issue' ? 'has-issue' : ''}`;

    const padIdx = (cpIdx + 1).toString().padStart(2, '0');
    card.innerHTML = `
      <span>${padIdx}</span>
      <strong>${cp.name}</strong>
      <div class="cp-actions">
        <button type="button" class="cp-btn cp-check ${cp.status === 'Checked' ? 'active' : ''}">Checked</button>
        <button type="button" class="cp-btn cp-issue ${cp.status === 'Issue' ? 'active' : ''}">Issue</button>
      </div>
    `;

    const checkBtn = card.querySelector('.cp-check');
    const issueBtn = card.querySelector('.cp-issue');

    checkBtn.addEventListener('click', () => {
      if (cp.status === 'Checked') {
        cp.status = 'Pending';
      } else {
        cp.status = 'Checked';
      }
      onCheckpointStatusChange();
    });

    issueBtn.addEventListener('click', () => {
      if (cp.status === 'Issue') {
        cp.status = 'Pending';
      } else {
        cp.status = 'Issue';
      }
      onCheckpointStatusChange();
    });

    checkpointGrid.appendChild(card);
  });
}

function onCheckpointStatusChange() {
  const activeRound = patrolRounds[activeRoundIndex];
  const checkedCount = activeRound.checkpoints.filter(c => c.status === 'Checked').length;

  if (checkedCount === 16) {
    activeRound.status = 'Completed';
  } else if (checkedCount > 0 || activeRound.checkpoints.some(c => c.status === 'Issue')) {
    activeRound.status = 'In Progress';
  } else {
    activeRound.status = 'Pending';
  }

  // Auto-set patrol active if user interacts
  if (patrolState === 'NOT STARTED') {
    patrolState = 'PATROL ACTIVE';
  }

  renderRoundSelectors();
  renderCheckpoints();
  renderSummaryLists();
  updatePatrolUI();
}

function renderSummaryLists() {
  if (roundSummaryList) {
    roundSummaryList.innerHTML = patrolRounds.map(r => {
      const checked = r.checkpoints.filter(c => c.status === 'Checked').length;
      const issues = r.checkpoints.filter(c => c.status === 'Issue').length;
      const pct = Math.round((checked / 16) * 100);
      return `
        <div class="summary-row">
          <span><strong>Round ${r.roundNumber}</strong> (${pct}%)</span>
          <span>${checked}/16 Checked ${issues > 0 ? `<b style="color:var(--red); margin-left:6px;">(${issues} Issue)</b>` : ''}</span>
        </div>
      `;
    }).join('');
  }

  if (checkpointSummaryList) {
    checkpointSummaryList.innerHTML = CHECKPOINT_NAMES.map((name, idx) => {
      let totalCheckedAcrossRounds = 0;
      let totalIssuesAcrossRounds = 0;
      patrolRounds.forEach(r => {
        if (r.checkpoints[idx].status === 'Checked') totalCheckedAcrossRounds++;
        if (r.checkpoints[idx].status === 'Issue') totalIssuesAcrossRounds++;
      });
      return `
        <div class="summary-row">
          <span>${name}</span>
          <span><b>${totalCheckedAcrossRounds}/8 Rounds</b> ${totalIssuesAcrossRounds > 0 ? `<em style="color:var(--red); font-style:normal;">(${totalIssuesAcrossRounds} Issue)</em>` : ''}</span>
        </div>
      `;
    }).join('');
  }
}

function updatePatrolUI() {
  if (!patrolBadge) return;
  patrolBadge.textContent = patrolState;
  patrolBadge.className = 'status-badge';

  const totalCheckedAllRounds = patrolRounds.reduce((acc, r) => acc + r.checkpoints.filter(c => c.status === 'Checked').length, 0);

  if (patrolState === 'NOT STARTED') {
    patrolBadge.classList.add('neutral');
    startPatrolBtn.disabled = false;
    completePatrolBtn.disabled = true;
    if (dashPatrolStatus) {
      dashPatrolStatus.textContent = 'Ready';
      dashPatrolStatus.className = '';
    }
    if (dashPatrolSub) dashPatrolSub.textContent = '8 Rounds pending (128 checkpoints)';
  } else if (patrolState === 'PATROL ACTIVE') {
    patrolBadge.classList.add('active');
    startPatrolBtn.disabled = true;
    completePatrolBtn.disabled = false;
    if (dashPatrolStatus) {
      dashPatrolStatus.textContent = 'In Progress';
      dashPatrolStatus.className = 'active-text';
    }
    if (dashPatrolSub) dashPatrolSub.textContent = `${totalCheckedAllRounds} / 128 Total Checkpoints Cleared`;
  } else if (patrolState === 'COMPLETED') {
    patrolBadge.classList.add('completed');
    startPatrolBtn.disabled = false;
    completePatrolBtn.disabled = true;
    if (dashPatrolStatus) {
      dashPatrolStatus.textContent = 'Completed';
      dashPatrolStatus.className = 'ok';
    }
    if (dashPatrolSub) dashPatrolSub.textContent = 'All 8 Nightly Patrol Rounds Completed';
  }
}

if (startPatrolBtn) {
  startPatrolBtn.addEventListener('click', () => {
    patrolState = 'PATROL ACTIVE';
    updatePatrolUI();
    showToast('Site Patrol started. Select rounds and check off checkpoints.', 'success');
  });
}

if (completePatrolBtn) {
  completePatrolBtn.addEventListener('click', () => {
    // Mark all remaining checkpoints as checked
    patrolRounds.forEach(r => {
      r.status = 'Completed';
      r.checkpoints.forEach(c => {
        if (c.status !== 'Issue') c.status = 'Checked';
      });
    });

    patrolState = 'COMPLETED';
    renderRoundSelectors();
    renderCheckpoints();
    renderSummaryLists();
    updatePatrolUI();
    showToast('All 8 Patrol Rounds completed successfully.', 'success');
  });
}

if (reportIssueBtn) {
  reportIssueBtn.addEventListener('click', () => {
    showToast('Issue logged for current patrol round.', 'warning');
  });
}

if (toggleReportSummaryBtn && patrolSummaryPanel) {
  toggleReportSummaryBtn.addEventListener('click', () => {
    patrolSummaryPanel.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ==========================================================================
   2. ACCESS CONTROL & GATES MODULE
   ========================================================================== */

document.querySelectorAll('.gate-actions button').forEach(button => {
  button.addEventListener('click', () => {
    const gateContainer = button.closest('.gate-actions');
    const gateName = gateContainer ? gateContainer.dataset.gate : 'Gate';
    const actionName = button.dataset.gateAction || button.textContent.trim();

    // Find the corresponding activity list
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
   3. CAR SEARCH MODULE
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
   4. JETTY PATROL MODULE
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

/* ==========================================================================
   5. VISITOR SEARCH MODULE
   ========================================================================== */

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

// Initial initialization
initializeDateTimeFields();
renderRoundSelectors();
renderCheckpoints();
renderSummaryLists();
updatePatrolUI();
