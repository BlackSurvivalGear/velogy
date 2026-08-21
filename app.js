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
   1. SITE PATROL MODULE
   ========================================================================== */

let patrolState = 'NOT STARTED'; // 'NOT STARTED' | 'PATROL ACTIVE' | 'COMPLETED'
const patrolBadge = document.getElementById('patrolBadge');
const startPatrolBtn = document.getElementById('startPatrolBtn');
const completePatrolBtn = document.getElementById('completePatrolBtn');
const dashPatrolStatus = document.getElementById('dashPatrolStatus');
const dashPatrolSub = document.getElementById('dashPatrolSub');
const checkpointCards = document.querySelectorAll('.check-card');
const reportIssueBtn = document.getElementById('reportIssueBtn');

function updatePatrolUI() {
  if (!patrolBadge) return;
  patrolBadge.textContent = patrolState;
  patrolBadge.className = 'status-badge';

  if (patrolState === 'NOT STARTED') {
    patrolBadge.classList.add('neutral');
    startPatrolBtn.disabled = false;
    completePatrolBtn.disabled = true;
    if (dashPatrolStatus) {
      dashPatrolStatus.textContent = 'Ready';
      dashPatrolStatus.className = '';
    }
    if (dashPatrolSub) dashPatrolSub.textContent = 'Awaiting patrol start';
  } else if (patrolState === 'PATROL ACTIVE') {
    patrolBadge.classList.add('active');
    startPatrolBtn.disabled = true;
    completePatrolBtn.disabled = false;
    if (dashPatrolStatus) {
      dashPatrolStatus.textContent = 'In Progress';
      dashPatrolStatus.className = 'active-text';
    }
    if (dashPatrolSub) dashPatrolSub.textContent = 'Patrol actively underway';
  } else if (patrolState === 'COMPLETED') {
    patrolBadge.classList.add('completed');
    startPatrolBtn.disabled = false;
    completePatrolBtn.disabled = true;
    if (dashPatrolStatus) {
      dashPatrolStatus.textContent = 'Completed';
      dashPatrolStatus.className = 'ok';
    }
    if (dashPatrolSub) dashPatrolSub.textContent = 'All checkpoints cleared';
  }
}

if (startPatrolBtn) {
  startPatrolBtn.addEventListener('click', () => {
    patrolState = 'PATROL ACTIVE';
    updatePatrolUI();
    showToast('Site Patrol started.', 'success');
  });
}

if (completePatrolBtn) {
  completePatrolBtn.addEventListener('click', () => {
    // Auto-check any remaining pending checkpoints
    checkpointCards.forEach(card => {
      const statusEm = card.querySelector('.check-status');
      if (statusEm && statusEm.textContent === 'Pending') {
        statusEm.textContent = 'Checked';
        card.classList.add('checked');
      }
    });
    patrolState = 'COMPLETED';
    updatePatrolUI();
    showToast('Site Patrol completed successfully.', 'success');
  });
}

// Checkpoint interactive click
checkpointCards.forEach(card => {
  card.addEventListener('click', () => {
    const statusEm = card.querySelector('.check-status');
    const checkpointName = card.dataset.checkpoint || 'Checkpoint';
    if (!statusEm) return;

    if (statusEm.textContent === 'Pending') {
      statusEm.textContent = 'Checked';
      card.classList.add('checked');
      showToast(`${checkpointName} checkpoint checked.`, 'info');
    } else {
      statusEm.textContent = 'Pending';
      card.classList.remove('checked');
      showToast(`${checkpointName} reset to pending.`, 'info');
    }
  });
});

if (reportIssueBtn) {
  reportIssueBtn.addEventListener('click', () => {
    showToast('Issue reported and logged for Security Supervisor.', 'warning');
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

    // Reset non-essential fields or navigate back after short delay
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
updatePatrolUI();
