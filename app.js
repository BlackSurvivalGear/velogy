// ImoTech Security Solutions - Application Logic

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
  'car-search': 'Car Search',
  'jetty-patrol': 'Jetty Patrol',
  'visitor-search': 'Visitor Search',
  'admin-dashboard': 'Admin Dashboard',
  'staff-management': 'Staff Management',
  'client-management': 'Client Management'
};

// INITIAL MOCK DATA FOR STAFF & CLIENTS
let mockStaff = [
  { id: 'staff-1', name: 'John Smith', company: 'Velogy', status: 'IN', lastAccess: 'East Gate' },
  { id: 'staff-2', name: 'David Jones', company: 'Velogy', status: 'IN', lastAccess: 'East Gate' },
  { id: 'staff-3', name: 'Michael Brown', company: 'Altrad', status: 'OUT', lastAccess: 'West Gate' },
  { id: 'staff-4', name: 'James Wilson', company: 'Altrad', status: 'IN', lastAccess: 'East Gate' },
  { id: 'staff-5', name: 'Robert Cole', company: 'Pinnacle', status: 'IN', lastAccess: 'East Gate' },
  { id: 'staff-6', name: 'Steve Green', company: 'Contractors', status: 'OUT', lastAccess: 'West Gate' }
];

let mockClients = [
  { id: 'client-1', name: 'TIP', contact: 'Client Contact', status: 'ACTIVE', passwordStatus: 'ACTIVE', password: '••••••••', nextChangeDate: '01 September 2026' },
  { id: 'client-2', name: 'DEN HARTOG', contact: 'Client Contact', status: 'ACTIVE', passwordStatus: 'ACTIVE', password: '••••••••', nextChangeDate: '01 September 2026' },
  { id: 'client-3', name: 'CISSION', contact: 'Client Contact', status: 'ACTIVE', passwordStatus: 'ACTIVE', password: '••••••••', nextChangeDate: '01 September 2026' }
];

let nextStaffId = 7;
let nextClientId = 4;

// LOCAL MOCK STATE FOR EAST GATE VEHICLE TALLY
let eastGateVehicleTally = {
  tip: 0,
  denHartog: 0,
  cission: 0,
  velogy: 0
};

function renderEastGateVehicleTally() {
  const tipEl = document.getElementById('tallyCountTip');
  const denHartogEl = document.getElementById('tallyCountDenHartog');
  const cissionEl = document.getElementById('tallyCountCission');
  const velogyEl = document.getElementById('tallyCountVelogy');
  const totalEl = document.getElementById('tallyTotalCount');

  if (tipEl) tipEl.textContent = eastGateVehicleTally.tip;
  if (denHartogEl) denHartogEl.textContent = eastGateVehicleTally.denHartog;
  if (cissionEl) cissionEl.textContent = eastGateVehicleTally.cission;
  if (velogyEl) velogyEl.textContent = eastGateVehicleTally.velogy;

  const total = eastGateVehicleTally.tip + eastGateVehicleTally.denHartog + eastGateVehicleTally.cission + eastGateVehicleTally.velogy;
  if (totalEl) totalEl.textContent = total;
}

function incrementVehicleTally(companyKey) {
  if (eastGateVehicleTally.hasOwnProperty(companyKey)) {
    eastGateVehicleTally[companyKey] += 1;
    renderEastGateVehicleTally();
    const companyDisplayNames = {
      tip: 'TIP',
      denHartog: 'DEN HARTOG',
      cission: 'CISSION',
      velogy: 'VELOGY'
    };
    const displayName = companyDisplayNames[companyKey] || companyKey.toUpperCase();
    showToast(`Vehicle logged for ${displayName} (+1)`, 'success');
  }
}

// Helper to return ordinal patrol names: 1 -> "1st Patrol", 2 -> "2nd Patrol", 3 -> "3rd Patrol", etc.
function getOrdinalPatrolName(num) {
  const n = parseInt(num, 10);
  if (n === 1) return '1st Patrol';
  if (n === 2) return '2nd Patrol';
  if (n === 3) return '3rd Patrol';
  if (n === 4) return '4th Patrol';
  if (n === 5) return '5th Patrol';
  if (n === 6) return '6th Patrol';
  if (n === 7) return '7th Patrol';
  if (n === 8) return '8th Patrol';
  return `${n}th Patrol`;
}

// DEFINITIVE SITE PATROL CHECKPOINTS
// 13 DAY PATROL CHECKPOINTS (No warehouse checkpoints)
const DAY_CHECKPOINTS = [
  "Garden Center",
  "Daveyhulme",
  "FLX Lamp Post",
  "East Fence",
  "Double Gates",
  "Lone Worker Check",
  "West Lot",
  "Cooling Towers",
  "Railhead",
  "Flare",
  "W5",
  "Stores",
  "W50"
];

// 16 NIGHT PATROL CHECKPOINTS (Includes 3 warehouse checkpoints)
const NIGHT_CHECKPOINTS = [
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

// Alias CHECKPOINTS to NIGHT_CHECKPOINTS for backward compatibility with Night Patrol & Reports Matrix
const CHECKPOINTS = NIGHT_CHECKPOINTS;

// Theme state management helper
function updateTheme() {
  const activeView = document.querySelector('.view.active-view')?.id;
  const isNightTheme = (activeView === 'jetty-patrol' || activeView === 'jetty')
    ? currentJettyShift === 'NIGHT'
    : currentPatrolMode === 'NIGHT';
  document.body.classList.toggle('night-theme', isNightTheme);
}

// Active selected rounds for UI navigation
let currentSelectedDayRound = 1; // Default active Day Patrol round view in UI
let currentSelectedRound = 4;    // Default active Night Patrol round view in UI

let dayPatrolRounds = {};
let patrolRounds = {};

function initMockDayPatrolData() {
  dayPatrolRounds = {};
  // Create 3 Day Patrol rounds x 13 Checkpoints = 39 Total Checkpoint Checks
  for (let r = 1; r <= 3; r++) {
    dayPatrolRounds[r] = {};
    DAY_CHECKPOINTS.forEach((cpName, idx) => {
      let status = 'PENDING';
      let time = '--:--';
      let officer = "Security Officer J. Vance";
      let issueDetails = null;

      // Mock completion status for Round 1 to show active/in-progress workflow
      if (r === 1) {
        if (idx < 8) {
          status = 'CHECKED';
          time = `0${7 + Math.floor(idx / 3)}:${15 + idx * 4}`.slice(-5);
        } else if (cpName === "Flare") {
          status = 'ISSUE';
          time = '09:42';
          issueDetails = {
            issue: "Safety sign missing near flare stack base",
            severity: "MEDIUM",
            officer: "Security Officer J. Vance",
            time: "09:42"
          };
        }
      }

      dayPatrolRounds[r][cpName] = {
        name: cpName,
        round: r,
        status: status, // 'PENDING' | 'CHECKED' | 'ISSUE'
        time: time,
        officer: officer,
        issueDetails: issueDetails
      };
    });
  }
}

function initMockPatrolData() {
  initMockDayPatrolData();
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

  updateTheme();

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
  } else if (id === 'jetty-patrol') {
    renderJettyPatrolView();
  } else if (id === 'reports') {
    renderAdminReports();
  } else if (id === 'admin-dashboard') {
    renderAdminDashboard();
  } else if (id === 'staff-management') {
    renderStaffManagement();
  } else if (id === 'client-management') {
    renderClientManagement();
  } else if (id === 'gate-east') {
    renderGateStaffView('gate-east', 'East Gate');
    renderEastGateVehicleTally();
  } else if (id === 'gate-west') {
    renderGateStaffView('gate-west', 'West Gate');
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
   1. SITE PATROL MODULE (DAY & NIGHT PATROL + DAILY CHECKS)
   ========================================================================== */

// Patrol Mode State ('DAY' | 'NIGHT')
let currentPatrolMode = 'DAY';

function getDayPatrolStats() {
  let totalChecksRequired = 3 * 13; // 39
  let totalChecked = 0;
  let totalIssues = 0;
  let totalPending = 0;
  let completedRoundsCount = 0;

  for (let r = 1; r <= 3; r++) {
    let roundPending = 0;

    DAY_CHECKPOINTS.forEach(cpName => {
      const item = dayPatrolRounds[r][cpName];
      if (item.status === 'CHECKED') {
        totalChecked++;
      } else if (item.status === 'ISSUE') {
        totalIssues++;
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

// Daily Checks State (Independent from Patrol Rounds)
let pumpOilState = {
  status: 'PENDING', // 'PENDING' | 'COMPLETED'
  completeTime: null,
  pumps: {
    1: 'OK',
    2: 'OK',
    3: 'OK',
    4: 'OK',
    5: 'OK'
  }
};

let carParkState = {
  status: 'OK', // 'OK' | 'ISSUE'
  isCompleted: false,
  completeTime: null,
  remarks: ''
};

let dailyJettyPatrolState = {
  vesselStatus: 'NO_VESSEL', // 'NO_VESSEL' | 'VESSEL_PRESENT'
  status: 'PENDING', // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  completeTime: null
};

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
  updateTheme();
  // Update Subtle Mode Toggle UI & Indicators
  const modeBtns = document.querySelectorAll('#patrolModeToggleGroup [data-patrol-mode]');
  modeBtns.forEach(btn => {
    const isActive = btn.dataset.patrolMode === currentPatrolMode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    const dot = btn.querySelector('.radio-dot');
    if (dot) {
      dot.textContent = isActive ? '●' : '○';
    }
  });

  const patrolMainTitle = document.getElementById('patrolMainTitle');
  if (patrolMainTitle) {
    patrolMainTitle.textContent = currentPatrolMode === 'DAY' ? 'DAY PATROLS' : 'NIGHT PATROLS';
  }

  const scheduleBadge = document.getElementById('patrolScheduleBadge');
  if (scheduleBadge) {
    if (currentPatrolMode === 'DAY') {
      scheduleBadge.textContent = '3 Patrols · 13 checkpoints per Patrol · 39 checkpoint checks';
    } else {
      scheduleBadge.textContent = '8 Patrols · 16 checkpoints per Patrol · 128 checkpoint checks';
    }
  }

  const daySection = document.getElementById('dayPatrolSection');
  const nightSection = document.getElementById('nightPatrolSection');
  const dailyChecksContainer = document.querySelector('.daily-checks-container');

  if (daySection && nightSection) {
    if (currentPatrolMode === 'DAY') {
      daySection.style.display = 'block';
      nightSection.style.display = 'none';
      renderDayPatrolSection();
      if (dailyChecksContainer) {
        dailyChecksContainer.style.display = 'block';
      }
      renderDailyChecksSection();
    } else {
      daySection.style.display = 'none';
      nightSection.style.display = 'block';
      renderNightPatrolSection();
      if (dailyChecksContainer) {
        dailyChecksContainer.style.display = 'none';
      }
    }
  }
}

// 1A. DAY PATROL RENDER & LOGIC (3 Rounds x 13 Checkpoints = 39 Checks)
function renderDayPatrolSection() {
  const dayStats = getDayPatrolStats();

  // Update Day Patrol Summary Status Box
  const dayStatRoundsCompleted = document.getElementById('dayStatRoundsCompleted');
  const dayStatRoundsOutstanding = document.getElementById('dayStatRoundsOutstanding');
  const dayStatChecksCompleted = document.getElementById('dayStatChecksCompleted');
  const dayStatChecksOutstanding = document.getElementById('dayStatChecksOutstanding');
  const dayStatCompletionPct = document.getElementById('dayStatCompletionPct');
  const dayStatIssuesCount = document.getElementById('dayStatIssuesCount');
  const dayPatrolBadge = document.getElementById('dayPatrolBadge');

  if (dayStatRoundsCompleted) dayStatRoundsCompleted.textContent = `${dayStats.completedRoundsCount} / 3 Patrols`;
  if (dayStatRoundsOutstanding) dayStatRoundsOutstanding.textContent = `${3 - dayStats.completedRoundsCount} patrols outstanding`;
  if (dayStatChecksCompleted) dayStatChecksCompleted.textContent = `${dayStats.totalChecked + dayStats.totalIssues} / 39`;
  if (dayStatChecksOutstanding) dayStatChecksOutstanding.textContent = `${dayStats.totalPending} checks remaining`;
  if (dayStatCompletionPct) dayStatCompletionPct.textContent = `${dayStats.completionPct}%`;
  if (dayStatIssuesCount) dayStatIssuesCount.textContent = `${dayStats.totalIssues}`;

  if (dayPatrolBadge) {
    dayPatrolBadge.textContent = `${getOrdinalPatrolName(currentSelectedDayRound).toUpperCase()} ACTIVE`;
    dayPatrolBadge.className = dayStats.completedRoundsCount === 3 ? 'status-badge completed' : 'status-badge active';
  }

  // Render Day Patrol Selector Pills
  const dayRoundPillsContainer = document.getElementById('dayRoundPillsContainer');
  if (dayRoundPillsContainer) {
    dayRoundPillsContainer.innerHTML = '';
    for (let r = 1; r <= 3; r++) {
      let rChecked = 0;
      DAY_CHECKPOINTS.forEach(cp => {
        if (dayPatrolRounds[r][cp].status !== 'PENDING') rChecked++;
      });
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `round-pill ${r === currentSelectedDayRound ? 'active' : ''}`;
      btn.dataset.dayRound = r;
      btn.innerHTML = `${getOrdinalPatrolName(r)} <span class="pill-sub">${rChecked}/13</span>`;
      btn.addEventListener('click', () => {
        currentSelectedDayRound = r;
        renderPatrolDashboard();
      });
      dayRoundPillsContainer.appendChild(btn);
    }
  }

  // Render Active Day Patrol Header & Checkpoints
  const dayActiveRoundTitle = document.getElementById('dayActiveRoundTitle');
  const dayActiveRoundSub = document.getElementById('dayActiveRoundSub');
  const dayCheckpointGrid = document.getElementById('dayCheckpointGrid');

  if (dayActiveRoundTitle) dayActiveRoundTitle.textContent = `${getOrdinalPatrolName(currentSelectedDayRound)}`;

  let roundCheckedCount = 0;
  let roundIssueCount = 0;
  DAY_CHECKPOINTS.forEach(cp => {
    if (dayPatrolRounds[currentSelectedDayRound][cp].status === 'CHECKED') roundCheckedCount++;
    if (dayPatrolRounds[currentSelectedDayRound][cp].status === 'ISSUE') roundIssueCount++;
  });

  if (dayActiveRoundSub) {
    dayActiveRoundSub.textContent = `${roundCheckedCount + roundIssueCount} / 13 checkpoints checked ${roundIssueCount > 0 ? `(${roundIssueCount} issue)` : ''}`;
  }

  if (dayCheckpointGrid) {
    dayCheckpointGrid.innerHTML = '';
    DAY_CHECKPOINTS.forEach((cpName, index) => {
      const data = dayPatrolRounds[currentSelectedDayRound][cpName];
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
        handleDayCheckpointClick(currentSelectedDayRound, cpName);
      });

      card.addEventListener('click', () => {
        handleDayCheckpointClick(currentSelectedDayRound, cpName);
      });

      dayCheckpointGrid.appendChild(card);
    });
  }
}

function handleDayCheckpointClick(roundNum, cpName) {
  const data = dayPatrolRounds[roundNum][cpName];
  if (data.status === 'PENDING') {
    data.status = 'CHECKED';
    data.time = getTimeString();
    data.officer = "Security Officer J. Vance";
    showToast(`${cpName} tagged as CHECKED at ${data.time} (${getOrdinalPatrolName(roundNum)})`, 'success');
  } else if (data.status === 'CHECKED') {
    data.status = 'PENDING';
    data.time = '--:--';
    showToast(`${cpName} reset to PENDING`, 'info');
  } else if (data.status === 'ISSUE') {
    openCheckpointDetailModal(cpName);
  }
  renderPatrolDashboard();
}

// "Tag All Remaining" Button Action for Day Patrol
const dayTagAllBtn = document.getElementById('dayTagAllBtn');
if (dayTagAllBtn) {
  dayTagAllBtn.addEventListener('click', () => {
    DAY_CHECKPOINTS.forEach(cpName => {
      const item = dayPatrolRounds[currentSelectedDayRound][cpName];
      if (item.status === 'PENDING') {
        item.status = 'CHECKED';
        item.time = getTimeString();
      }
    });
    showToast(`All remaining checkpoints for ${getOrdinalPatrolName(currentSelectedDayRound)} tagged.`, 'success');
    renderPatrolDashboard();
  });
}

// "Report Issue" Button Action for Day Patrol
const openDayIssueModalBtn = document.getElementById('openDayIssueModalBtn');
if (openDayIssueModalBtn) {
  openDayIssueModalBtn.addEventListener('click', () => {
    populateIssueCheckpointSelect(currentPatrolMode);
    if (issueRoundSelect) issueRoundSelect.value = currentSelectedDayRound;
    if (issueModal) issueModal.setAttribute('aria-hidden', 'false');
  });
}

// 1B. NIGHT PATROL RENDER & LOGIC (8 Rounds x 16 Checkpoints = 128 Checks)
function renderNightPatrolSection() {
  const stats = getPatrolStats();

  // Update Night Patrol Summary Status Box
  const statRoundsCompleted = document.getElementById('statRoundsCompleted');
  const statRoundsOutstanding = document.getElementById('statRoundsOutstanding');
  const statChecksCompleted = document.getElementById('statChecksCompleted');
  const statChecksOutstanding = document.getElementById('statChecksOutstanding');
  const statCompletionPct = document.getElementById('statCompletionPct');
  const statIssuesCount = document.getElementById('statIssuesCount');

  if (statRoundsCompleted) statRoundsCompleted.textContent = `${stats.completedRoundsCount} / 8 Patrols`;
  if (statRoundsOutstanding) statRoundsOutstanding.textContent = `${8 - stats.completedRoundsCount} patrols outstanding`;
  if (statChecksCompleted) statChecksCompleted.textContent = `${stats.totalChecked + stats.totalIssues} / 128`;
  if (statChecksOutstanding) statChecksOutstanding.textContent = `${stats.totalPending} checks remaining`;
  if (statCompletionPct) statCompletionPct.textContent = `${stats.completionPct}%`;
  if (statIssuesCount) statIssuesCount.textContent = `${stats.totalIssues}`;

  // Update Dashboard status card
  const dashPatrolStatus = document.getElementById('dashPatrolStatus');
  const dashPatrolSub = document.getElementById('dashPatrolSub');
  if (dashPatrolStatus) {
    dashPatrolStatus.textContent = `${getOrdinalPatrolName(currentSelectedRound)} Active`;
  }
  if (dashPatrolSub) {
    dashPatrolSub.textContent = `${stats.totalChecked + stats.totalIssues} / 128 Checkpoints Cleared (${stats.completionPct}%)`;
  }

  const nightPatrolBadge = document.getElementById('patrolBadge');
  if (nightPatrolBadge) {
    nightPatrolBadge.textContent = `${getOrdinalPatrolName(currentSelectedRound).toUpperCase()} ACTIVE`;
  }

  // Render Patrol Selector Pills
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
      btn.innerHTML = `${getOrdinalPatrolName(r)} <span class="pill-sub">${rChecked}/16</span>`;
      btn.addEventListener('click', () => {
        currentSelectedRound = r;
        renderPatrolDashboard();
      });
      roundPillsContainer.appendChild(btn);
    }
  }

  // Render Active Patrol Header & Checkpoints
  const activeRoundTitle = document.getElementById('activeRoundTitle');
  const activeRoundSub = document.getElementById('activeRoundSub');
  const checkpointGrid = document.getElementById('checkpointGrid');

  if (activeRoundTitle) activeRoundTitle.textContent = `${getOrdinalPatrolName(currentSelectedRound)}`;

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

// 1C. DAILY CHECKS RENDER & LOGIC (INDEPENDENT FROM PATROL ROUNDS)
function renderDailyChecksSection() {
  // 1. Pump Oil Checks
  const pumpListContainer = document.getElementById('pumpListContainer');
  const pumpStatusBadge = document.getElementById('pumpStatusBadge');

  if (pumpListContainer) {
    pumpListContainer.innerHTML = '';
    for (let p = 1; p <= 5; p++) {
      const currentLevel = pumpOilState.pumps[p];
      const row = document.createElement('div');
      row.className = 'pump-row';
      row.innerHTML = `
        <span class="pump-name">Pump ${p} &nbsp;&nbsp;&nbsp;&nbsp;Oil Level</span>
        <div class="pump-level-selector" data-pump="${p}">
          <button type="button" class="level-btn ${currentLevel === 'OK' ? 'active-ok' : ''}" data-level="OK">OK</button>
          <button type="button" class="level-btn ${currentLevel === 'Low' ? 'active-low' : ''}" data-level="Low">Low</button>
          <button type="button" class="level-btn ${currentLevel === 'Critical' ? 'active-critical' : ''}" data-level="Critical">Critical</button>
        </div>
      `;

      row.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          pumpOilState.pumps[p] = btn.dataset.level;
          renderDailyChecksSection();
        });
      });

      pumpListContainer.appendChild(row);
    }
  }

  if (pumpStatusBadge) {
    if (pumpOilState.status === 'COMPLETED') {
      pumpStatusBadge.textContent = `COMPLETED (${pumpOilState.completeTime})`;
      pumpStatusBadge.className = 'status-badge completed';
    } else {
      pumpStatusBadge.textContent = 'PENDING';
      pumpStatusBadge.className = 'status-badge neutral';
    }
  }

  // 2. Car Park Check
  const carParkStatusBadge = document.getElementById('carParkStatusBadge');
  const carParkRemarks = document.getElementById('carParkRemarks');

  if (carParkStatusBadge) {
    if (carParkState.isCompleted) {
      carParkStatusBadge.textContent = `COMPLETED (${carParkState.status}) · ${carParkState.completeTime}`;
      carParkStatusBadge.className = carParkState.status === 'OK' ? 'status-badge completed' : 'status-badge active';
    } else {
      carParkStatusBadge.textContent = 'PENDING';
      carParkStatusBadge.className = 'status-badge neutral';
    }
  }

  const cpGridBtns = document.querySelectorAll('#carParkStatusGrid button');
  cpGridBtns.forEach(btn => {
    const statusVal = btn.dataset.carParkStatus;
    btn.classList.toggle('selected', carParkState.status === statusVal);
  });

  // 3. Jetty Patrol Daily Duty
  const jettyDailyBadge = document.getElementById('jettyDailyStatusBadge');
  const jettyNoVesselActions = document.getElementById('jettyNoVesselActions');
  const jettyVesselPresentNotice = document.getElementById('jettyVesselPresentNotice');

  const jvBtns = document.querySelectorAll('#jettyVesselStatusGrid button');
  jvBtns.forEach(btn => {
    btn.classList.toggle('selected', dailyJettyPatrolState.vesselStatus === btn.dataset.vesselStatus);
  });

  if (dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT') {
    if (jettyNoVesselActions) jettyNoVesselActions.style.display = 'none';
    if (jettyVesselPresentNotice) jettyVesselPresentNotice.style.display = 'block';
    if (jettyDailyBadge) {
      jettyDailyBadge.textContent = 'VESSEL PRESENT (NOT REQUIRED)';
      jettyDailyBadge.className = 'status-badge neutral';
    }
  } else {
    if (jettyNoVesselActions) jettyNoVesselActions.style.display = 'block';
    if (jettyVesselPresentNotice) jettyVesselPresentNotice.style.display = 'none';
    if (jettyDailyBadge) {
      if (dailyJettyPatrolState.status === 'COMPLETED') {
        jettyDailyBadge.textContent = `COMPLETED (${dailyJettyPatrolState.completeTime})`;
        jettyDailyBadge.className = 'status-badge completed';
      } else if (dailyJettyPatrolState.status === 'IN_PROGRESS') {
        jettyDailyBadge.textContent = 'PATROL IN PROGRESS';
        jettyDailyBadge.className = 'status-badge active';
      } else {
        jettyDailyBadge.textContent = 'NO VESSEL (PATROL REQUIRED)';
        jettyDailyBadge.className = 'status-badge neutral';
      }
    }
  }
}

// Mode Switcher Tab Click Listeners
document.addEventListener('click', (e) => {
  const modeTab = e.target.closest('#patrolModeToggleGroup [data-patrol-mode]');
  if (modeTab) {
    currentPatrolMode = modeTab.dataset.patrolMode;
    updateTheme();
    renderPatrolDashboard();
  }
});

// Complete Pump Oil Check Handler
const completePumpCheckBtn = document.getElementById('completePumpCheckBtn');
if (completePumpCheckBtn) {
  completePumpCheckBtn.addEventListener('click', () => {
    pumpOilState.status = 'COMPLETED';
    pumpOilState.completeTime = getTimeString();
    showToast(`Davyhulme Oil Checks completed at ${pumpOilState.completeTime}. All 5 oil checks recorded.`, 'success');
    renderPatrolDashboard();
  });
}

// Car Park Status Select Toggle
document.querySelectorAll('#carParkStatusGrid button').forEach(btn => {
  btn.addEventListener('click', () => {
    carParkState.status = btn.dataset.carParkStatus;
    renderDailyChecksSection();
  });
});

// Complete Car Park Check Handler
const completeCarParkCheckBtn = document.getElementById('completeCarParkCheckBtn');
if (completeCarParkCheckBtn) {
  completeCarParkCheckBtn.addEventListener('click', () => {
    const remarksEl = document.getElementById('carParkRemarks');
    if (remarksEl) carParkState.remarks = remarksEl.value.trim();

    carParkState.isCompleted = true;
    carParkState.completeTime = getTimeString();

    const toastType = carParkState.status === 'OK' ? 'success' : 'warning';
    showToast(`Car Park Check completed at ${carParkState.completeTime} (Status: ${carParkState.status}).`, toastType);
    renderPatrolDashboard();
  });
}

// Jetty Vessel Status Select Toggle
document.querySelectorAll('#jettyVesselStatusGrid button').forEach(btn => {
  btn.addEventListener('click', () => {
    dailyJettyPatrolState.vesselStatus = btn.dataset.vesselStatus;
    if (dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT') {
      showToast('Vessel Present selected. Daily Jetty patrol not required.', 'info');
    } else {
      showToast('No Vessel selected. Daily Jetty patrol enabled.', 'info');
    }
    renderDailyChecksSection();
  });
});

// Start & Complete Daily Jetty Patrol Handlers
const startDailyJettyPatrolBtn = document.getElementById('startDailyJettyPatrolBtn');
if (startDailyJettyPatrolBtn) {
  startDailyJettyPatrolBtn.addEventListener('click', () => {
    dailyJettyPatrolState.status = 'IN_PROGRESS';
    showToast('Daily Jetty Patrol started.', 'info');
    renderDailyChecksSection();
  });
}

const completeDailyJettyPatrolBtn = document.getElementById('completeDailyJettyPatrolBtn');
if (completeDailyJettyPatrolBtn) {
  completeDailyJettyPatrolBtn.addEventListener('click', () => {
    dailyJettyPatrolState.status = 'COMPLETED';
    dailyJettyPatrolState.completeTime = getTimeString();
    showToast(`Daily Jetty Patrol completed at ${dailyJettyPatrolState.completeTime}.`, 'success');
    renderDailyChecksSection();
  });
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
    showToast(`All remaining checkpoints for ${getOrdinalPatrolName(currentSelectedRound)} tagged.`, 'success');
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

function populateIssueCheckpointSelect(mode = 'NIGHT') {
  if (!issueCheckpointSelect) return;
  issueCheckpointSelect.innerHTML = '';
  const cpList = mode === 'DAY' ? DAY_CHECKPOINTS : NIGHT_CHECKPOINTS;
  cpList.forEach(cp => {
    const opt = document.createElement('option');
    opt.value = cp;
    opt.textContent = cp;
    issueCheckpointSelect.appendChild(opt);
  });

  if (issueRoundSelect) {
    issueRoundSelect.innerHTML = '';
    const numRounds = mode === 'DAY' ? 3 : 8;
    for (let r = 1; r <= numRounds; r++) {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = getOrdinalPatrolName(r);
      issueRoundSelect.appendChild(opt);
    }
  }
}

if (openIssueModalBtn) {
  openIssueModalBtn.addEventListener('click', () => {
    populateIssueCheckpointSelect(currentPatrolMode);
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

    if (currentPatrolMode === 'DAY') {
      if (dayPatrolRounds[rVal]) {
        dayPatrolRounds[rVal][cpVal] = {
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
      }
    } else {
      if (patrolRounds[rVal]) {
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
      }
    }

    closeIssueModal();
    showToast(`Issue reported for ${getOrdinalPatrolName(rVal)} — ${cpVal} (${severityVal} Severity)`, 'warning');
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
          <span class="h-round">${getOrdinalPatrolName(r)}</span>
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
        <span class="detail-box-label">Patrols Checked</span>
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

    <h4 style="margin: 20px 0 12px; color: var(--navy);">Night Patrol History (Patrols 1–8)</h4>
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

let gateCompanyFilters = {
  'gate-east': 'ALL',
  'gate-west': 'ALL'
};

function setGateCompanyFilter(gateViewId, companyName) {
  gateCompanyFilters[gateViewId] = companyName;

  const filterContainerId = gateViewId === 'gate-east' ? 'eastCompanyFilters' : 'westCompanyFilters';
  const container = document.getElementById(filterContainerId);
  if (container) {
    container.querySelectorAll('.filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gateCompany === companyName);
    });
  }

  const gateName = gateViewId === 'gate-east' ? 'East Gate' : 'West Gate';
  renderGateStaffView(gateViewId, gateName);
}

function renderGateStaffView(gateViewId, gateName) {
  const isEast = gateViewId === 'gate-east';
  const countInEl = document.getElementById(isEast ? 'eastStaffInCount' : 'westStaffInCount');
  const countOutEl = document.getElementById(isEast ? 'eastStaffOutCount' : 'westStaffOutCount');
  const searchInput = document.getElementById(isEast ? 'eastGateSearch' : 'westGateSearch');
  const listContainer = document.getElementById(isEast ? 'eastGateStaffList' : 'westGateStaffList');

  if (!listContainer) return;

  // Calculate site totals
  const totalIn = mockStaff.filter(s => s.status === 'IN').length;
  const totalOut = mockStaff.filter(s => s.status === 'OUT').length;

  if (countInEl) countInEl.textContent = totalIn;
  if (countOutEl) countOutEl.textContent = totalOut;

  const searchVal = (searchInput?.value || '').toLowerCase().trim();
  const selectedCompany = gateCompanyFilters[gateViewId] || 'ALL';

  // Filter staff list
  const filteredStaff = mockStaff.filter(item => {
    const matchSearch = !searchVal || item.name.toLowerCase().includes(searchVal) || item.company.toLowerCase().includes(searchVal);
    const matchCompany = selectedCompany === 'ALL' || item.company.toUpperCase() === selectedCompany;
    return matchSearch && matchCompany;
  });

  // Group staff by standard companies
  const companies = ['VELOGY', 'ALTRAD', 'PINNACLE', 'CONTRACTORS'];
  let html = '';

  if (filteredStaff.length === 0) {
    html = `<div class="admin-card muted" style="text-align:center; padding:24px;">No staff records found matching criteria.</div>`;
  } else {
    companies.forEach(company => {
      // If company filter is set and does not match, skip section
      if (selectedCompany !== 'ALL' && selectedCompany !== company) return;

      const groupMembers = filteredStaff.filter(s => s.company.toUpperCase() === company);
      if (groupMembers.length === 0) return;

      html += `
        <div class="company-group-section">
          <h3 class="company-group-header">${company}</h3>
          <div class="gate-staff-cards-grid">
      `;

      groupMembers.forEach(item => {
        const isIn = item.status === 'IN';
        const isOut = item.status === 'OUT';

        html += `
          <div class="staff-gate-card">
            <div class="staff-gate-info">
              <strong class="staff-gate-name">${item.name}</strong>
              <span class="staff-gate-company">${item.company}</span>
              <div class="staff-gate-last-access">
                <span class="muted-small">Last Access:</span>
                <strong>${item.lastAccess || 'None'}</strong>
              </div>
            </div>
            <div class="in-out-toggle">
              <button type="button" class="toggle-in-btn ${isIn ? 'active' : ''}" onclick="toggleGateStaffStatus('${item.id}', 'IN', '${gateName}', '${gateViewId}')">
                ${isIn ? '● IN' : '○ IN'}
              </button>
              <button type="button" class="toggle-out-btn ${isOut ? 'active' : ''}" onclick="toggleGateStaffStatus('${item.id}', 'OUT', '${gateName}', '${gateViewId}')">
                ${isOut ? '● OUT' : '○ OUT'}
              </button>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });
  }

  listContainer.innerHTML = html;
}

function toggleGateStaffStatus(staffId, newStatus, gateName, gateViewId) {
  const staff = mockStaff.find(s => s.id === staffId);
  if (!staff) return;

  if (staff.status === newStatus && staff.lastAccess === gateName) return;

  staff.status = newStatus;
  staff.lastAccess = gateName;

  showToast(`${staff.name} (${staff.company}) marked ${newStatus} at ${gateName}.`, newStatus === 'IN' ? 'success' : 'info');

  renderGateStaffView('gate-east', 'East Gate');
  renderGateStaffView('gate-west', 'West Gate');
  renderStaffManagement();
  renderAdminDashboard();
}

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
   6. JETTY PATROL & VISITOR SEARCH MODULES (20 Patrols per 24 Hours)
   ========================================================================== */

const JETTY_TAG_POINTS = [
  "Perimeter fence & signs",
  "Access control points",
  "Lighting & CCTV equipment",
  "CCTV blind spots",
  "Controlled buildings",
  "Vehicle parking areas",
  "Ship/Port interface",
  "Dangerous goods areas",
  "Other areas"
];

// Pre-calculated 72-minute expected patrol start times
// Day Shift: 06:00 to 18:00 (10 patrols)
const DAY_PATROL_TIMES = [
  "06:00", "07:12", "08:24", "09:36", "10:48",
  "12:00", "13:12", "14:24", "15:36", "16:48"
];

// Night Shift: 18:00 to 06:00 (10 patrols)
const NIGHT_PATROL_TIMES = [
  "18:00", "19:12", "20:24", "21:36", "22:48",
  "00:00", "01:12", "02:24", "03:36", "04:48"
];

// Determine current operating shift and patrol based on system time
function getSystemShiftAndPatrol() {
  const now = new Date();
  const minsFromMidnight = now.getHours() * 60 + now.getMinutes();
  const dayStartMins = 6 * 60;   // 06:00 = 360 mins
  const nightStartMins = 18 * 60; // 18:00 = 1080 mins

  let shift = 'DAY';
  let patrolNum = 1;

  if (minsFromMidnight >= dayStartMins && minsFromMidnight < nightStartMins) {
    shift = 'DAY';
    const elapsed = minsFromMidnight - dayStartMins;
    patrolNum = Math.min(10, Math.floor(elapsed / 72) + 1);
  } else {
    shift = 'NIGHT';
    let elapsed = 0;
    if (minsFromMidnight >= nightStartMins) {
      elapsed = minsFromMidnight - nightStartMins;
    } else {
      elapsed = minsFromMidnight + (6 * 60);
    }
    patrolNum = Math.min(10, Math.floor(elapsed / 72) + 1);
  }

  return { shift, patrolNum };
}

// 20 Patrols State Store (10 Day + 10 Night)
let currentJettyShift = 'DAY';
let currentJettyPatrolNum = 1;

let jettyPatrolsState = {
  DAY: {},
  NIGHT: {}
};

function initJettyPatrolData() {
  const systemInfo = getSystemShiftAndPatrol();
  currentJettyShift = systemInfo.shift;
  currentJettyPatrolNum = systemInfo.patrolNum;

  ['DAY', 'NIGHT'].forEach(shift => {
    const times = shift === 'DAY' ? DAY_PATROL_TIMES : NIGHT_PATROL_TIMES;
    for (let p = 1; p <= 10; p++) {
      let tags = {};
      JETTY_TAG_POINTS.forEach(tp => {
        tags[tp] = null; // null | 'OK' | 'ISSUE'
      });

      let isCompleted = false;
      let isStarted = false;

      // Mock completion status for earlier patrols in current shift to show realistic state
      if (shift === systemInfo.shift && p < systemInfo.patrolNum) {
        isStarted = true;
        isCompleted = true;
        JETTY_TAG_POINTS.forEach(tp => {
          tags[tp] = 'OK';
        });
      } else if (shift === systemInfo.shift && p === systemInfo.patrolNum) {
        isStarted = true;
      }

      jettyPatrolsState[shift][p] = {
        shift: shift,
        patrolNum: p,
        expectedTime: times[p - 1],
        isStarted: isStarted,
        isCompleted: isCompleted,
        tags: tags,
        remarks: ''
      };
    }
  });
}

initJettyPatrolData();

function renderJettyPatrolView() {
  updateTheme();
  const currentPatrol = jettyPatrolsState[currentJettyShift][currentJettyPatrolNum];

  // Update Operating Period Titles
  const jettyCurrentShiftHeader = document.getElementById('jettyCurrentShiftHeader');
  if (jettyCurrentShiftHeader) {
    jettyCurrentShiftHeader.textContent = `${currentJettyShift} SHIFT — 10 PATROLS`;
  }

  // Update Shift Toggle Tabs
  const shiftTabs = document.querySelectorAll('#jettyShiftToggleGroup .shift-tab');
  shiftTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.shift === currentJettyShift);
  });

  // Render 10 Patrol Pills
  const pillsContainer = document.getElementById('jettyPatrolPillsContainer');
  if (pillsContainer) {
    pillsContainer.innerHTML = '';
    const times = currentJettyShift === 'DAY' ? DAY_PATROL_TIMES : NIGHT_PATROL_TIMES;

    for (let p = 1; p <= 10; p++) {
      const pData = jettyPatrolsState[currentJettyShift][p];
      let taggedCount = 0;
      JETTY_TAG_POINTS.forEach(tp => {
        if (pData.tags[tp]) taggedCount++;
      });

      const pill = document.createElement('button');
      pill.type = 'button';
      let pillClass = 'jetty-patrol-pill';
      if (p === currentJettyPatrolNum) pillClass += ' active';
      if (pData.isCompleted) pillClass += ' completed-pill';

      pill.className = pillClass;
      pill.dataset.patrol = p;
      pill.innerHTML = `
        <span>P${p} (${times[p - 1]})</span>
        <span class="pill-sub">${pData.isCompleted ? '✓ Done' : `${taggedCount}/9`}</span>
      `;

      pill.addEventListener('click', () => {
        currentJettyPatrolNum = p;
        renderJettyPatrolView();
      });

      pillsContainer.appendChild(pill);
    }
  }

  // Update Active Patrol Header & Badge
  const titleEl = document.getElementById('jettyActivePatrolTitle');
  const eyebrowEl = document.getElementById('jettyActivePatrolEyebrow');
  const timeEl = document.getElementById('jettyActivePatrolTime');
  const badgeEl = document.getElementById('jettyPatrolBadge');
  const startBtn = document.getElementById('startJettyPatrolBtn');

  let taggedCount = 0;
  JETTY_TAG_POINTS.forEach(tp => {
    if (currentPatrol.tags[tp]) taggedCount++;
  });

  const patrolName = `${currentJettyShift} PATROL ${currentJettyPatrolNum}`;

  if (titleEl) titleEl.textContent = patrolName;
  if (eyebrowEl) eyebrowEl.textContent = `EXPECTED START ${currentPatrol.expectedTime}`;
  if (timeEl) {
    timeEl.textContent = `Expected Start: ${currentPatrol.expectedTime} | ${taggedCount} / ${JETTY_TAG_POINTS.length} Tag Points Completed ${currentPatrol.isCompleted ? '(Patrol Completed)' : ''}`;
  }

  if (badgeEl) {
    if (currentPatrol.isCompleted) {
      badgeEl.textContent = `${patrolName} — COMPLETED`;
      badgeEl.className = 'status-badge completed';
    } else if (currentPatrol.isStarted) {
      badgeEl.textContent = `${patrolName} — ACTIVE`;
      badgeEl.className = 'status-badge active';
    } else {
      badgeEl.textContent = `${patrolName} — NOT STARTED`;
      badgeEl.className = 'status-badge neutral';
    }
  }

  if (startBtn) {
    if (currentPatrol.isStarted || currentPatrol.isCompleted) {
      startBtn.textContent = 'Patrol In Progress';
      startBtn.disabled = true;
    } else {
      startBtn.textContent = 'Start Patrol';
      startBtn.disabled = false;
    }
  }

  // Update Checklist Buttons State
  const checklistContainer = document.getElementById('jettyChecklist');
  if (checklistContainer) {
    const rows = checklistContainer.querySelectorAll('.checklist-row');
    rows.forEach(row => {
      const itemKey = row.dataset.item;
      const val = currentPatrol.tags[itemKey];

      const okBtn = row.querySelector('.toggle-ok');
      const issueBtn = row.querySelector('.toggle-issue');

      if (okBtn) okBtn.classList.toggle('active-ok', val === 'OK');
      if (issueBtn) issueBtn.classList.toggle('active-issue', val === 'ISSUE');
    });
  }

  const remarksInput = document.getElementById('jettyPatrolRemarks');
  if (remarksInput) {
    remarksInput.value = currentPatrol.remarks || '';
  }
}

// Shift Toggle Listeners
document.querySelectorAll('#jettyShiftToggleGroup .shift-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    currentJettyShift = tab.dataset.shift;
    currentJettyPatrolNum = 1;
    updateTheme();
    renderJettyPatrolView();
  });
});

// Start Patrol Button Action
const startJettyPatrolBtn = document.getElementById('startJettyPatrolBtn');
if (startJettyPatrolBtn) {
  startJettyPatrolBtn.addEventListener('click', () => {
    const patrol = jettyPatrolsState[currentJettyShift][currentJettyPatrolNum];
    patrol.isStarted = true;
    showToast(`${currentJettyShift} Patrol ${currentJettyPatrolNum} started.`, 'success');
    renderJettyPatrolView();
  });
}

// Tag Point Click Interactivity
document.querySelectorAll('#jettyChecklist .checklist-row').forEach(row => {
  const itemKey = row.dataset.item;

  row.querySelectorAll('.ok-issue-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      const patrol = jettyPatrolsState[currentJettyShift][currentJettyPatrolNum];
      patrol.isStarted = true;

      const clickVal = btn.dataset.value; // 'OK' or 'ISSUE'
      if (patrol.tags[itemKey] === clickVal) {
        patrol.tags[itemKey] = null; // Toggle off if clicked again
      } else {
        patrol.tags[itemKey] = clickVal;
      }

      // Check if all tag points are completed
      let allTagged = true;
      JETTY_TAG_POINTS.forEach(tp => {
        if (!patrol.tags[tp]) allTagged = false;
      });

      if (allTagged) {
        patrol.isCompleted = true;
      } else {
        patrol.isCompleted = false;
      }

      renderJettyPatrolView();
    });
  });
});

// Complete Patrol Button Action
const completeJettyPatrolBtn = document.getElementById('completeJettyPatrolBtn');
if (completeJettyPatrolBtn) {
  completeJettyPatrolBtn.addEventListener('click', () => {
    const patrol = jettyPatrolsState[currentJettyShift][currentJettyPatrolNum];
    const remarksInput = document.getElementById('jettyPatrolRemarks');
    if (remarksInput) patrol.remarks = remarksInput.value;

    // Tag remaining items as OK if completing patrol directly
    JETTY_TAG_POINTS.forEach(tp => {
      if (!patrol.tags[tp]) patrol.tags[tp] = 'OK';
    });

    patrol.isStarted = true;
    patrol.isCompleted = true;

    showToast(`${currentJettyShift} Patrol ${currentJettyPatrolNum} completed.`, 'success');
    renderJettyPatrolView();

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

/* ==========================================================================
   7. STAFF MANAGEMENT LOGIC
   ========================================================================== */

let currentStaffStatusFilter = 'ALL';
let currentStaffCompanyFilter = 'ALL';
let pendingRemoveStaffId = null;

function renderStaffManagement() {
  const tableBody = document.getElementById('staffTableBody');
  const cardsContainer = document.getElementById('staffCardsContainer');
  const searchVal = (document.getElementById('staffSearchInput')?.value || '').toLowerCase().trim();

  const filteredStaff = mockStaff.filter(item => {
    // Search by Name or Company
    const matchSearch = !searchVal || item.name.toLowerCase().includes(searchVal) || item.company.toLowerCase().includes(searchVal);
    // Filter by Status (ALL, IN, OUT)
    const matchStatus = currentStaffStatusFilter === 'ALL' || item.status === currentStaffStatusFilter;
    // Filter by Company (ALL, VELOGY, ALTRAD, PINNACLE, CONTRACTORS)
    const matchCompany = currentStaffCompanyFilter === 'ALL' || item.company.toUpperCase() === currentStaffCompanyFilter;

    return matchSearch && matchStatus && matchCompany;
  });

  // Render Desktop Table
  if (tableBody) {
    tableBody.innerHTML = '';
    if (filteredStaff.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" class="muted" style="text-align:center; padding:24px;">No staff records found matching criteria.</td></tr>`;
    } else {
      filteredStaff.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.status === 'IN' ? 'badge-in' : 'badge-out';
        const toggleBtnLabel = item.status === 'IN' ? 'MARK OUT' : 'MARK IN';
        const toggleBtnClass = item.status === 'IN' ? 'btn-out' : 'btn-in';

        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--navy);">${item.name}</td>
          <td>${item.company}</td>
          <td><span class="${badgeClass}">${item.status}</span></td>
          <td style="text-align: right;">
            <div class="action-btn-group">
              <button type="button" class="table-action-btn ${toggleBtnClass}" onclick="toggleStaffStatus('${item.id}')">${toggleBtnLabel}</button>
              <button type="button" class="table-action-btn" onclick="openEditStaffModal('${item.id}')">EDIT</button>
              <button type="button" class="table-action-btn btn-danger" onclick="openRemoveStaffModal('${item.id}')">REMOVE</button>
            </div>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // Render Mobile Cards
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    if (filteredStaff.length === 0) {
      cardsContainer.innerHTML = `<div class="admin-card muted" style="text-align:center;">No staff records found matching criteria.</div>`;
    } else {
      filteredStaff.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        const badgeClass = item.status === 'IN' ? 'badge-in' : 'badge-out';
        const toggleBtnLabel = item.status === 'IN' ? 'MARK OUT' : 'MARK IN';
        const toggleBtnClass = item.status === 'IN' ? 'btn-out' : 'btn-in';

        card.innerHTML = `
          <div class="admin-card-header">
            <div>
              <h4 class="admin-card-title">${item.name}</h4>
              <div class="admin-card-company">${item.company}</div>
            </div>
            <span class="${badgeClass}">${item.status}</span>
          </div>
          <div class="admin-card-actions">
            <button type="button" class="table-action-btn ${toggleBtnClass}" onclick="toggleStaffStatus('${item.id}')">${toggleBtnLabel}</button>
            <button type="button" class="table-action-btn" onclick="openEditStaffModal('${item.id}')">EDIT</button>
            <button type="button" class="table-action-btn btn-danger" onclick="openRemoveStaffModal('${item.id}')">REMOVE</button>
          </div>
        `;
        cardsContainer.appendChild(card);
      });
    }
  }

  renderAdminDashboard();
}

// Toggle Mark IN / MARK OUT
function toggleStaffStatus(staffId) {
  const staff = mockStaff.find(s => s.id === staffId);
  if (!staff) return;

  if (staff.status === 'IN') {
    staff.status = 'OUT';
    showToast(`${staff.name} (${staff.company}) marked OUT.`, 'info');
  } else {
    staff.status = 'IN';
    showToast(`${staff.name} (${staff.company}) marked IN.`, 'success');
  }

  renderStaffManagement();
}

// Search & Filter Attachments for Staff
const staffSearchInput = document.getElementById('staffSearchInput');
if (staffSearchInput) {
  staffSearchInput.addEventListener('input', renderStaffManagement);
}

document.querySelectorAll('#staffStatusFilterGroup .filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#staffStatusFilterGroup .filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStaffStatusFilter = btn.dataset.filterStatus;
    renderStaffManagement();
  });
});

document.querySelectorAll('#staffCompanyFilterGroup .filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#staffCompanyFilterGroup .filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStaffCompanyFilter = btn.dataset.filterCompany;
    renderStaffManagement();
  });
});

// Staff Modal Setup (Add / Edit)
const staffModal = document.getElementById('staffModal');
const openAddStaffModalBtn = document.getElementById('openAddStaffModalBtn');
const closeStaffModalBtn = document.getElementById('closeStaffModalBtn');
const cancelStaffBtn = document.getElementById('cancelStaffBtn');
const staffForm = document.getElementById('staffForm');

if (openAddStaffModalBtn) {
  openAddStaffModalBtn.addEventListener('click', () => {
    document.getElementById('staffModalTitle').textContent = 'Add Staff';
    document.getElementById('staffEditId').value = '';
    document.getElementById('staffNameInput').value = '';
    document.getElementById('staffCompanySelect').value = 'Velogy';
    document.getElementById('submitStaffBtn').textContent = 'Add Staff';
    if (staffModal) staffModal.setAttribute('aria-hidden', 'false');
  });
}

function closeStaffModal() {
  if (staffModal) staffModal.setAttribute('aria-hidden', 'true');
}

if (closeStaffModalBtn) closeStaffModalBtn.addEventListener('click', closeStaffModal);
if (cancelStaffBtn) cancelStaffBtn.addEventListener('click', closeStaffModal);

function openEditStaffModal(staffId) {
  const staff = mockStaff.find(s => s.id === staffId);
  if (!staff) return;

  document.getElementById('staffModalTitle').textContent = 'Edit Staff';
  document.getElementById('staffEditId').value = staff.id;
  document.getElementById('staffNameInput').value = staff.name;
  document.getElementById('staffCompanySelect').value = staff.company;
  document.getElementById('submitStaffBtn').textContent = 'Save Changes';

  if (staffModal) staffModal.setAttribute('aria-hidden', 'false');
}

if (staffForm) {
  staffForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('staffEditId').value;
    const nameVal = document.getElementById('staffNameInput').value.trim();
    const companyVal = document.getElementById('staffCompanySelect').value;

    if (editId) {
      // Edit existing staff
      const staff = mockStaff.find(s => s.id === editId);
      if (staff) {
        staff.name = nameVal;
        staff.company = companyVal;
        showToast(`Staff record updated for ${nameVal}.`, 'success');
      }
    } else {
      // Add new staff (defaults to OUT)
      const newStaff = {
        id: `staff-${nextStaffId++}`,
        name: nameVal,
        company: companyVal,
        status: 'OUT'
      };
      mockStaff.push(newStaff);
      showToast(`New staff member ${nameVal} added (Status: OUT).`, 'success');
    }

    closeStaffModal();
    renderStaffManagement();
  });
}

// Confirm Remove Staff Modal Setup
const confirmRemoveStaffModal = document.getElementById('confirmRemoveStaffModal');
const closeRemoveStaffModalBtn = document.getElementById('closeRemoveStaffModalBtn');
const cancelRemoveStaffBtn = document.getElementById('cancelRemoveStaffBtn');
const confirmRemoveStaffBtn = document.getElementById('confirmRemoveStaffBtn');

function openRemoveStaffModal(staffId) {
  const staff = mockStaff.find(s => s.id === staffId);
  if (!staff) return;

  pendingRemoveStaffId = staffId;
  const nameTextEl = document.getElementById('removeStaffNameText');
  if (nameTextEl) nameTextEl.textContent = staff.name;

  if (confirmRemoveStaffModal) confirmRemoveStaffModal.setAttribute('aria-hidden', 'false');
}

function closeRemoveStaffModal() {
  if (confirmRemoveStaffModal) confirmRemoveStaffModal.setAttribute('aria-hidden', 'true');
  pendingRemoveStaffId = null;
}

if (closeRemoveStaffModalBtn) closeRemoveStaffModalBtn.addEventListener('click', closeRemoveStaffModal);
if (cancelRemoveStaffBtn) cancelRemoveStaffBtn.addEventListener('click', closeRemoveStaffModal);

if (confirmRemoveStaffBtn) {
  confirmRemoveStaffBtn.addEventListener('click', () => {
    if (pendingRemoveStaffId) {
      const staff = mockStaff.find(s => s.id === pendingRemoveStaffId);
      const name = staff ? staff.name : 'Staff';
      mockStaff = mockStaff.filter(s => s.id !== pendingRemoveStaffId);
      showToast(`${name} removed from staff list.`, 'warning');
      closeRemoveStaffModal();
      renderStaffManagement();
    }
  });
}

/* ==========================================================================
   8. CLIENT MANAGEMENT & ADMIN DASHBOARD CALCULATIONS
   ========================================================================== */

let currentClientStatusFilter = 'ALL';
let pendingDeactivateClientId = null;

function renderAdminDashboard() {
  const staffInCount = mockStaff.filter(s => s.status === 'IN').length;
  const staffOutCount = mockStaff.filter(s => s.status === 'OUT').length;
  const totalStaffCount = mockStaff.length;
  const activeClientsCount = mockClients.filter(c => c.status === 'ACTIVE').length;

  const kpiStaffIn = document.getElementById('kpiStaffIn');
  const kpiStaffOut = document.getElementById('kpiStaffOut');
  const kpiTotalStaff = document.getElementById('kpiTotalStaff');
  const kpiActiveClients = document.getElementById('kpiActiveClients');

  if (kpiStaffIn) kpiStaffIn.textContent = staffInCount;
  if (kpiStaffOut) kpiStaffOut.textContent = staffOutCount;
  if (kpiTotalStaff) kpiTotalStaff.textContent = totalStaffCount;
  if (kpiActiveClients) kpiActiveClients.textContent = activeClientsCount;
}

function renderClientManagement() {
  const tableBody = document.getElementById('clientTableBody');
  const cardsContainer = document.getElementById('clientCardsContainer');
  const searchVal = (document.getElementById('clientSearchInput')?.value || '').toLowerCase().trim();

  const filteredClients = mockClients.filter(item => {
    const matchSearch = !searchVal || item.name.toLowerCase().includes(searchVal) || item.contact.toLowerCase().includes(searchVal);
    const matchStatus = currentClientStatusFilter === 'ALL' || item.status === currentClientStatusFilter;
    return matchSearch && matchStatus;
  });

  // Render Desktop Table
  if (tableBody) {
    tableBody.innerHTML = '';
    if (filteredClients.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="muted" style="text-align:center; padding:24px;">No client records found matching criteria.</td></tr>`;
    } else {
      filteredClients.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive';
        const deactivateBtnText = item.status === 'ACTIVE' ? 'DEACTIVATE' : 'REACTIVATE';
        const deactivateBtnClass = item.status === 'ACTIVE' ? 'btn-danger' : 'btn-in';

        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--navy); cursor: pointer;" onclick="openClientDetailModal('${item.id}')">${item.name}</td>
          <td>${item.contact}</td>
          <td><span class="${badgeClass}">${item.status}</span></td>
          <td><span class="badge-active">ACTIVE</span></td>
          <td style="text-align: right;">
            <div class="action-btn-group">
              <button type="button" class="table-action-btn" onclick="openClientDetailModal('${item.id}')">VIEW</button>
              <button type="button" class="table-action-btn" onclick="openEditClientModal('${item.id}')">EDIT</button>
              <button type="button" class="table-action-btn" onclick="openChangePasswordModal('${item.id}')">PASSWORD</button>
              <button type="button" class="table-action-btn ${deactivateBtnClass}" onclick="handleClientDeactivateToggle('${item.id}')">${deactivateBtnText}</button>
            </div>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // Render Mobile Cards
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    if (filteredClients.length === 0) {
      cardsContainer.innerHTML = `<div class="admin-card muted" style="text-align:center;">No client records found matching criteria.</div>`;
    } else {
      filteredClients.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        const badgeClass = item.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive';
        const deactivateBtnText = item.status === 'ACTIVE' ? 'DEACTIVATE' : 'REACTIVATE';
        const deactivateBtnClass = item.status === 'ACTIVE' ? 'btn-danger' : 'btn-in';

        card.innerHTML = `
          <div class="admin-card-header">
            <div>
              <h4 class="admin-card-title" style="cursor: pointer;" onclick="openClientDetailModal('${item.id}')">${item.name}</h4>
              <div class="admin-card-company">Contact: ${item.contact}</div>
            </div>
            <span class="${badgeClass}">${item.status}</span>
          </div>
          <div class="admin-card-detail-row">
            <span class="muted">Monthly Password Status:</span>
            <span class="badge-active">ACTIVE</span>
          </div>
          <div class="admin-card-actions">
            <button type="button" class="table-action-btn" onclick="openClientDetailModal('${item.id}')">VIEW</button>
            <button type="button" class="table-action-btn" onclick="openEditClientModal('${item.id}')">EDIT</button>
            <button type="button" class="table-action-btn" onclick="openChangePasswordModal('${item.id}')">PASSWORD</button>
            <button type="button" class="table-action-btn ${deactivateBtnClass}" onclick="handleClientDeactivateToggle('${item.id}')">${deactivateBtnText}</button>
          </div>
        `;
        cardsContainer.appendChild(card);
      });
    }
  }

  renderAdminDashboard();
}

// Search & Filter Attachments for Clients
const clientSearchInput = document.getElementById('clientSearchInput');
if (clientSearchInput) {
  clientSearchInput.addEventListener('input', renderClientManagement);
}

document.querySelectorAll('#clientStatusFilterGroup .filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#clientStatusFilterGroup .filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentClientStatusFilter = btn.dataset.filterClientStatus;
    renderClientManagement();
  });
});

// Client Modal Setup (Add / Edit)
const clientModal = document.getElementById('clientModal');
const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
const closeClientModalBtn = document.getElementById('closeClientModalBtn');
const cancelClientBtn = document.getElementById('cancelClientBtn');
const clientForm = document.getElementById('clientForm');

if (openAddClientModalBtn) {
  openAddClientModalBtn.addEventListener('click', () => {
    document.getElementById('clientModalTitle').textContent = 'Add Client';
    document.getElementById('clientEditId').value = '';
    document.getElementById('clientNameInput').value = '';
    document.getElementById('clientContactInput').value = '';
    document.getElementById('clientStatusSelect').value = 'ACTIVE';
    document.getElementById('submitClientBtn').textContent = 'Add Client';
    if (clientModal) clientModal.setAttribute('aria-hidden', 'false');
  });
}

function closeClientModal() {
  if (clientModal) clientModal.setAttribute('aria-hidden', 'true');
}

if (closeClientModalBtn) closeClientModalBtn.addEventListener('click', closeClientModal);
if (cancelClientBtn) cancelClientBtn.addEventListener('click', closeClientModal);

function openEditClientModal(clientId) {
  const client = mockClients.find(c => c.id === clientId);
  if (!client) return;

  document.getElementById('clientModalTitle').textContent = 'Edit Client';
  document.getElementById('clientEditId').value = client.id;
  document.getElementById('clientNameInput').value = client.name;
  document.getElementById('clientContactInput').value = client.contact;
  document.getElementById('clientStatusSelect').value = client.status;
  document.getElementById('submitClientBtn').textContent = 'Save Changes';

  if (clientModal) clientModal.setAttribute('aria-hidden', 'false');
}

if (clientForm) {
  clientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('clientEditId').value;
    const nameVal = document.getElementById('clientNameInput').value.trim();
    const contactVal = document.getElementById('clientContactInput').value.trim() || 'Client Contact';
    const statusVal = document.getElementById('clientStatusSelect').value;

    if (editId) {
      // Edit existing client
      const client = mockClients.find(c => c.id === editId);
      if (client) {
        client.name = nameVal;
        client.contact = contactVal;
        client.status = statusVal;
        showToast(`Client record updated for ${nameVal}.`, 'success');
      }
    } else {
      // Add new client (defaults to ACTIVE)
      const newClient = {
        id: `client-${nextClientId++}`,
        name: nameVal,
        contact: contactVal,
        status: statusVal,
        passwordStatus: 'ACTIVE',
        password: '••••••••',
        nextChangeDate: '01 September 2026'
      };
      mockClients.push(newClient);
      showToast(`New client company ${nameVal} added (Status: ACTIVE).`, 'success');
    }

    closeClientModal();
    renderClientManagement();
  });
}

// Client Deactivation Workflow
function handleClientDeactivateToggle(clientId) {
  const client = mockClients.find(c => c.id === clientId);
  if (!client) return;

  if (client.status === 'ACTIVE') {
    openDeactivateClientModal(clientId);
  } else {
    // Reactivate client
    client.status = 'ACTIVE';
    showToast(`${client.name} reactivated successfully.`, 'success');
    renderClientManagement();
  }
}

const confirmDeactivateClientModal = document.getElementById('confirmDeactivateClientModal');
const closeDeactivateClientModalBtn = document.getElementById('closeDeactivateClientModalBtn');
const cancelDeactivateClientBtn = document.getElementById('cancelDeactivateClientBtn');
const confirmDeactivateClientBtn = document.getElementById('confirmDeactivateClientBtn');

function openDeactivateClientModal(clientId) {
  const client = mockClients.find(c => c.id === clientId);
  if (!client) return;

  pendingDeactivateClientId = clientId;
  const nameTextEl = document.getElementById('deactivateClientNameText');
  if (nameTextEl) nameTextEl.textContent = client.name;

  if (confirmDeactivateClientModal) confirmDeactivateClientModal.setAttribute('aria-hidden', 'false');
}

function closeDeactivateClientModal() {
  if (confirmDeactivateClientModal) confirmDeactivateClientModal.setAttribute('aria-hidden', 'true');
  pendingDeactivateClientId = null;
}

if (closeDeactivateClientModalBtn) closeDeactivateClientModalBtn.addEventListener('click', closeDeactivateClientModal);
if (cancelDeactivateClientBtn) cancelDeactivateClientBtn.addEventListener('click', closeDeactivateClientModal);

if (confirmDeactivateClientBtn) {
  confirmDeactivateClientBtn.addEventListener('click', () => {
    if (pendingDeactivateClientId) {
      const client = mockClients.find(c => c.id === pendingDeactivateClientId);
      if (client) {
        client.status = 'INACTIVE';
        showToast(`${client.name} deactivated (Status: INACTIVE).`, 'warning');
      }
      closeDeactivateClientModal();
      renderClientManagement();
    }
  });
}

// Client Detail Modal View
const clientDetailModal = document.getElementById('clientDetailModal');
const closeClientDetailModalBtn = document.getElementById('closeClientDetailModalBtn');
const closeClientDetailBtn = document.getElementById('closeClientDetailBtn');

function openClientDetailModal(clientId) {
  const client = mockClients.find(c => c.id === clientId);
  if (!client || !clientDetailModal) return;

  const contentEl = document.getElementById('clientDetailContent');
  const badgeClass = client.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive';

  if (contentEl) {
    contentEl.innerHTML = `
      <div style="border-bottom: 1px solid var(--line); padding-bottom: 12px;">
        <span class="eyebrow">COMPANY NAME</span>
        <h3 style="margin: 4px 0 0; color: var(--navy); font-size: 22px;">${client.name}</h3>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <span class="muted-small">Contact:</span>
          <div style="font-weight:700; color:var(--navy); font-size:15px; margin-top:2px;">${client.contact}</div>
        </div>
        <div>
          <span class="muted-small">Status:</span>
          <div style="margin-top:2px;"><span class="${badgeClass}">${client.status}</span></div>
        </div>
      </div>
      <div style="background: #f8fafc; border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-top: 8px;">
        <span class="eyebrow">MONTHLY CLIENT PASSWORD</span>
        <div class="password-display-box" style="margin-top: 10px;">
          <div>
            <span class="masked-password">••••••••</span>
          </div>
          <span class="badge-active">PASSWORD ACTIVE</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
          <div>
            <span class="muted-small">NEXT CHANGE</span>
            <div style="font-weight: 700; color: var(--navy); font-size: 13px;">${client.nextChangeDate}</div>
          </div>
          <button type="button" class="primary-button" onclick="closeClientDetailModal(); openChangePasswordModal('${client.id}');">CHANGE PASSWORD</button>
        </div>
      </div>
    `;
  }

  clientDetailModal.setAttribute('aria-hidden', 'false');
}

function closeClientDetailModal() {
  if (clientDetailModal) clientDetailModal.setAttribute('aria-hidden', 'true');
}

if (closeClientDetailModalBtn) closeClientDetailModalBtn.addEventListener('click', closeClientDetailModal);
if (closeClientDetailBtn) closeClientDetailBtn.addEventListener('click', closeClientDetailModal);

// Change Password Modal Workflow
const changePasswordModal = document.getElementById('changePasswordModal');
const closeChangePasswordModalBtn = document.getElementById('closeChangePasswordModalBtn');
const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
const changePasswordForm = document.getElementById('changePasswordForm');

function openChangePasswordModal(clientId) {
  const client = mockClients.find(c => c.id === clientId);
  if (!client || !changePasswordModal) return;

  document.getElementById('changePasswordClientId').value = client.id;
  document.getElementById('changePasswordClientName').textContent = client.name;
  document.getElementById('newPasswordInput').value = '';

  changePasswordModal.setAttribute('aria-hidden', 'false');
}

function closeChangePasswordModal() {
  if (changePasswordModal) changePasswordModal.setAttribute('aria-hidden', 'true');
}

if (closeChangePasswordModalBtn) closeChangePasswordModalBtn.addEventListener('click', closeChangePasswordModal);
if (cancelChangePasswordBtn) cancelChangePasswordBtn.addEventListener('click', closeChangePasswordModal);

if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientId = document.getElementById('changePasswordClientId').value;
    const client = mockClients.find(c => c.id === clientId);

    if (client) {
      client.passwordStatus = 'ACTIVE';
      client.nextChangeDate = '01 October 2026';
      showToast(`Monthly password updated for ${client.name}. Status: ACTIVE. Next change: 01 October 2026`, 'success');
    }

    closeChangePasswordModal();
    renderClientManagement();
  });
}

// Splash Screen Handler (2-second initial load overlay)
function initSplashScreen() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  setTimeout(() => {
    splash.classList.add('fade-out');
    splash.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 600);
  }, 2000);
}

// Initial Initialization
initSplashScreen();
initializeDateTimeFields();
updateTheme();
renderPatrolDashboard();
renderAdminDashboard();
renderEastGateVehicleTally();
