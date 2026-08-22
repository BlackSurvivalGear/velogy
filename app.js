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
  'incident-report': 'Incident Report',
  reports: 'Admin Reports',
  'gate-east': 'East Gate',
  'gate-west': 'West Gate',
  'car-search': 'Car Search',
  control: 'Control',
  'jetty-patrol': 'Jetty Patrol',
  'visitor-search': 'Visitor Search',
  'admin-dashboard': 'Admin Dashboard',
  'officer-management': 'Security Users',
  'staff-management': 'Staff Management',
  'client-management': 'Client Management',
  'access-denied': 'Access Restricted'
};

// ROLE PERMISSIONS MATRIX
const rolePermissions = {
  officer: [
    'dashboard',
    'patrol',
    'access',
    'gate-east',
    'gate-west',
    'car-search',
    'jetty',
    'jetty-patrol',
    'visitor-search',
    'incident-report'
  ],
  controller: [
    'dashboard',
    'patrol',
    'access',
    'gate-east',
    'gate-west',
    'car-search',
    'control',
    'jetty',
    'jetty-patrol',
    'visitor-search',
    'incident-report'
  ],
  supervisor: [
    'dashboard',
    'patrol',
    'access',
    'gate-east',
    'gate-west',
    'car-search',
    'control',
    'jetty',
    'jetty-patrol',
    'visitor-search',
    'incident-report',
    'admin-dashboard',
    'reports',
    'officer-management'
  ],
  'team leader': [
    'dashboard',
    'patrol',
    'access',
    'gate-east',
    'gate-west',
    'car-search',
    'control',
    'jetty',
    'jetty-patrol',
    'visitor-search',
    'incident-report',
    'admin-dashboard',
    'reports',
    'officer-management',
    'staff-management',
    'client-management'
  ],
  manager: [
    'dashboard',
    'patrol',
    'access',
    'gate-east',
    'gate-west',
    'car-search',
    'control',
    'jetty',
    'jetty-patrol',
    'visitor-search',
    'incident-report',
    'admin-dashboard',
    'reports',
    'officer-management',
    'staff-management',
    'client-management'
  ]
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

let securityUsers = {
  users: [
    { name: "Robert Lawal", role: "officer" },
    { name: "John Walsh", role: "officer" },
    { name: "Vio Roman", role: "officer" },
    { name: "Michelle Holder", role: "officer" },
    { name: "Antony Bird", role: "officer" },
    { name: "Mike Smith", role: "officer" },
    { name: "Haseeb Ansar", role: "controller" },
    { name: "Steven Smith", role: "controller" },
    { name: "Scot Smith", role: "controller" },
    { name: "Antony Warbutton", role: "controller" },
    { name: "Troy Oliv", role: "supervisor" },
    { name: "Big Rick", role: "team leader" },
    { name: "Andy", role: "team leader" },
    { name: "Darren", role: "team leader" },
    { name: "Rick", role: "team leader" },
    { name: "Seun", role: "team leader" },
    { name: "Steve", role: "team leader" },
    { name: "Seun Clegg", role: "manager" }
  ],
  testPassword: "velogy2026",
  currentUser: null
};

let nextStaffId = 7;
let nextClientId = 4;

// LOCAL MOCK STATE FOR EAST GATE VEHICLE TALLY & CONTROL NIGHT VEHICLE TALLY
// Store tally count per normalized company key / name separately for East Gate & Control
let eastGateVehicleTally = {
  "VELOGY": 0
};

let controlVehicleTally = {
  "VELOGY": 0
};

function renderEastGateVehicleTally() {
  const gridEl = document.getElementById('vehicleTallyGrid');
  const totalEl = document.getElementById('tallyTotalCount');

  // Gather active dynamic clients sorted alphabetically A-Z
  const activeClients = mockClients
    .filter(c => c.status === 'ACTIVE')
    .map(c => c.name.trim())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // Build the list of tally categories: VELOGY fixed first, then active clients
  const tallyCategories = ['VELOGY', ...activeClients];

  let totalSum = 0;

  if (gridEl) {
    gridEl.innerHTML = '';
    tallyCategories.forEach(companyName => {
      const normalizedKey = companyName.toUpperCase();
      if (!eastGateVehicleTally.hasOwnProperty(normalizedKey)) {
        eastGateVehicleTally[normalizedKey] = 0;
      }
      const count = eastGateVehicleTally[normalizedKey];
      totalSum += count;

      const card = document.createElement('div');
      card.className = 'tally-card';
      card.innerHTML = `
        <span class="tally-company-label">${companyName}</span>
        <span class="tally-count">${count}</span>
        <button type="button" class="tally-btn">[ +1 ]</button>
      `;

      const btn = card.querySelector('.tally-btn');
      btn.addEventListener('click', () => {
        incrementVehicleTally(companyName);
      });

      gridEl.appendChild(card);
    });
  } else {
    // If grid element not on current DOM view, still calculate sum across all categories
    tallyCategories.forEach(companyName => {
      const normalizedKey = companyName.toUpperCase();
      totalSum += (eastGateVehicleTally[normalizedKey] || 0);
    });
  }

  if (totalEl) {
    totalEl.textContent = totalSum;
  }
}

function incrementVehicleTally(companyName) {
  const normalizedKey = companyName.toUpperCase();
  if (!eastGateVehicleTally.hasOwnProperty(normalizedKey)) {
    eastGateVehicleTally[normalizedKey] = 0;
  }
  eastGateVehicleTally[normalizedKey] += 1;
  renderEastGateVehicleTally();
  showToast(`Vehicle logged for ${companyName.toUpperCase()} (+1)`, 'success');
}

function renderControlVehicleTally() {
  const gridEl = document.getElementById('controlVehicleTallyGrid');
  const totalEl = document.getElementById('controlTallyTotalCount');
  const roleEl = document.getElementById('controlUserRole');
  const nameEl = document.getElementById('controlUserName');

  if (securityUsers.currentUser) {
    if (roleEl) roleEl.textContent = securityUsers.currentUser.role.toUpperCase();
    if (nameEl) nameEl.textContent = securityUsers.currentUser.name;
  }

  // Gather active dynamic clients sorted alphabetically A-Z
  const activeClients = mockClients
    .filter(c => c.status === 'ACTIVE')
    .map(c => c.name.trim())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // Build the list of tally categories: VELOGY fixed first, then active clients A-Z
  const tallyCategories = ['VELOGY', ...activeClients];

  let totalSum = 0;

  if (gridEl) {
    gridEl.innerHTML = '';
    tallyCategories.forEach(companyName => {
      const normalizedKey = companyName.toUpperCase();
      if (!controlVehicleTally.hasOwnProperty(normalizedKey)) {
        controlVehicleTally[normalizedKey] = 0;
      }
      const count = controlVehicleTally[normalizedKey];
      totalSum += count;

      const card = document.createElement('div');
      card.className = 'tally-card';
      card.innerHTML = `
        <span class="tally-company-label">${companyName}</span>
        <span class="tally-count">${count}</span>
        <button type="button" class="tally-btn">[ +1 ]</button>
      `;

      const btn = card.querySelector('.tally-btn');
      btn.addEventListener('click', () => {
        incrementControlVehicleTally(companyName);
      });

      gridEl.appendChild(card);
    });
  } else {
    tallyCategories.forEach(companyName => {
      const normalizedKey = companyName.toUpperCase();
      totalSum += (controlVehicleTally[normalizedKey] || 0);
    });
  }

  if (totalEl) {
    totalEl.textContent = totalSum;
  }
}

function incrementControlVehicleTally(companyName) {
  const normalizedKey = companyName.toUpperCase();
  if (!controlVehicleTally.hasOwnProperty(normalizedKey)) {
    controlVehicleTally[normalizedKey] = 0;
  }
  controlVehicleTally[normalizedKey] += 1;
  renderControlVehicleTally();
  showToast(`Night vehicle logged for ${companyName.toUpperCase()} (+1)`, 'success');
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
  const isNightTheme = (activeView === 'control')
    ? true
    : (activeView === 'jetty-patrol' || activeView === 'jetty')
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
  // Check permission for target view
  const currentRole = securityUsers.currentUser ? securityUsers.currentUser.role : 'officer';
  const allowedViews = rolePermissions[currentRole] || rolePermissions.officer;

  if (id !== 'access-denied' && !allowedViews.includes(id)) {
    id = 'access-denied';
  }

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

  if (id === 'dashboard') {
    renderDashboardUI();
  } else if (id === 'access') {
    renderAccessControlUI();
  } else if (id === 'patrol') {
    renderPatrolDashboard();
  } else if (id === 'jetty-patrol') {
    renderJettyPatrolView();
  } else if (id === 'incident-report') {
    renderIncidentReportView();
  } else if (id === 'reports') {
    renderAdminReports();
  } else if (id === 'admin-dashboard') {
    renderAdminDashboard();
  } else if (id === 'officer-management') {
    renderOfficerManagement();
  } else if (id === 'staff-management') {
    renderStaffManagement();
  } else if (id === 'client-management') {
    renderClientManagement();
  } else if (id === 'gate-east') {
    renderGateStaffView('gate-east', 'East Gate');
    renderEastGateVehicleTally();
  } else if (id === 'gate-west') {
    renderGateStaffView('gate-west', 'West Gate');
  } else if (id === 'control') {
    renderControlVehicleTally();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DYNAMIC NAVIGATION & QUICK CARDS RENDERING BASED ON ROLE
function renderNavigationAndRoleUI() {
  const currentRole = securityUsers.currentUser ? securityUsers.currentUser.role : 'officer';
  const allowed = rolePermissions[currentRole] || rolePermissions.officer;

  // 1. Update Sidebar Nav Items
  navItems.forEach(item => {
    const targetView = item.dataset.view;
    if (allowed.includes(targetView)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });

  // Sidebar Admin Section Title
  const navSectionTitle = document.querySelector('.nav-section-title');
  if (navSectionTitle) {
    const hasAdminNav = allowed.some(v => ['admin-dashboard', 'reports', 'officer-management', 'staff-management', 'client-management'].includes(v));
    navSectionTitle.style.display = hasAdminNav ? 'block' : 'none';
  }

  // Render Dashboard Quick Cards & Access Control Cards
  renderDashboardUI();
  renderAccessControlUI();
}

function renderAccessControlUI() {
  const currentRole = securityUsers.currentUser ? securityUsers.currentUser.role : 'officer';
  const allowed = rolePermissions[currentRole] || rolePermissions.officer;

  const accessView = document.getElementById('access');
  if (!accessView) return;

  const cards = accessView.querySelectorAll('.gate-grid [data-view]');
  cards.forEach(card => {
    const targetView = card.dataset.view;
    if (allowed.includes(targetView)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function renderDashboardUI() {
  const currentRole = securityUsers.currentUser ? securityUsers.currentUser.role : 'officer';
  const allowed = rolePermissions[currentRole] || rolePermissions.officer;

  const dashboardView = document.getElementById('dashboard');
  if (!dashboardView) return;

  // Dashboard Admin Quick Cards & Section Heading
  const adminHeading = dashboardView.querySelector('.section-heading');
  const adminGrid = dashboardView.querySelector('.admin-quick-grid');

  if (adminGrid) {
    const quickCards = adminGrid.querySelectorAll('[data-view]');
    let visibleCardsCount = 0;
    quickCards.forEach(card => {
      const cardView = card.dataset.view;
      if (allowed.includes(cardView)) {
        card.style.display = '';
        visibleCardsCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (adminHeading) {
      adminHeading.style.display = visibleCardsCount > 0 ? 'block' : 'none';
    }
  }

  // Admin Dashboard Quick Cards (within section#admin-dashboard)
  const adminDashView = document.getElementById('admin-dashboard');
  if (adminDashView) {
    const adminDashQuickGrid = adminDashView.querySelector('.admin-quick-grid');
    if (adminDashQuickGrid) {
      const cards = adminDashQuickGrid.querySelectorAll('[data-view]');
      cards.forEach(card => {
        const cardView = card.dataset.view;
        card.style.display = allowed.includes(cardView) ? '' : 'none';
      });
    }
  }
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
   2. ADMIN REPORTS & SUB-REPORTS IMPLEMENTATION
   ========================================================================== */

let currentActiveReportTab = 'daily-security';
let selectedReportPatrolMode = 'DAY';
let selectedReportPatrolRound = 1;

let mockCarSearches = [
  { id: 'cs-1', dateTime: '2026-08-21T14:30', reg: 'AB12 CDE', driver: 'John Smith', company: 'Velogy', gate: 'East Gate', officer: 'Security Officer J. Vance', areas: ['Exterior', 'Boot/Cargo Area'], result: 'Clear', remarks: 'Routine vehicle search. Clear.' },
  { id: 'cs-2', dateTime: '2026-08-21T11:15', reg: 'XY55 FGH', driver: 'Robert Cole', company: 'Pinnacle', gate: 'West Gate', officer: 'Officer S. Miller', areas: ['Interior', 'Engine Area'], result: 'Item Found', remarks: 'Undeclared tool bag in rear cargo area.' },
  { id: 'cs-3', dateTime: '2026-08-20T16:45', reg: 'MN66 JKL', driver: 'Steve Green', company: 'Contractors', gate: 'East Gate', officer: 'Officer A. Taylor', areas: ['Exterior', 'Under Vehicle'], result: 'Clear', remarks: 'All clear.' }
];

let mockVisitorSearches = [
  { id: 'vs-1', name: 'Andrew Miller', company: 'Marine Services UK', timeIn: '09:15', timeOut: '11:30', officer: 'Security Officer J. Vance', dateTime: '2026-08-21T09:15', checks: ['Male Body Search', 'Male Bag Search', 'Documentation Check'], remarks: 'ID verified. Passed.' },
  { id: 'vs-2', name: 'Sarah Jenkins', company: 'Port Inspection Co', timeIn: '13:00', timeOut: '14:45', officer: 'Officer S. Miller', dateTime: '2026-08-21T13:00', checks: ['Female Body Search', 'Female Bag Search', 'Documentation Check'], remarks: 'Standard entry search. Clear.' }
];

function getAllReportedIssues() {
  const issues = [];

  // Formal Incident Reports (Function 04)
  incidentReports.forEach(inc => {
    const locDisplay = inc.location === 'Other' && inc.locationOther ? `Other (${inc.locationOther})` : inc.location;
    issues.push({
      id: inc.id,
      reportNumber: inc.reportNumber,
      dateTime: inc.dateTime,
      source: 'Incident Report',
      location: locDisplay,
      officer: inc.submittedBy,
      issue: inc.description,
      incidentType: inc.incidentType,
      severity: inc.severity || (inc.incidentType === 'Security' ? 'HIGH' : 'MEDIUM'),
      status: inc.status,
      isIncidentReport: true
    });
  });

  // Day patrol issues
  for (let r = 1; r <= 3; r++) {
    DAY_CHECKPOINTS.forEach(cp => {
      const item = dayPatrolRounds[r] ? dayPatrolRounds[r][cp] : null;
      if (item && item.status === 'ISSUE') {
        issues.push({
          id: `issue-day-${r}-${cp}`,
          dateTime: item.issueDetails?.time ? `2026-08-21T${item.issueDetails.time}` : getLocalDateTimeString(),
          source: `Site Patrol (${getOrdinalPatrolName(r)})`,
          location: cp,
          officer: item.issueDetails?.officer || item.officer,
          issue: item.issueDetails?.issue || 'Checkpoint fault reported',
          severity: item.issueDetails?.severity || 'MEDIUM',
          status: 'OPEN'
        });
      }
    });
  }

  // Night patrol issues
  for (let r = 1; r <= 8; r++) {
    CHECKPOINTS.forEach(cp => {
      const item = patrolRounds[r] ? patrolRounds[r][cp] : null;
      if (item && item.status === 'ISSUE') {
        issues.push({
          id: `issue-night-${r}-${cp}`,
          dateTime: item.issueDetails?.time ? `2026-08-21T${item.issueDetails.time}` : getLocalDateTimeString(),
          source: `Site Patrol (${getOrdinalPatrolName(r)})`,
          location: cp,
          officer: item.issueDetails?.officer || item.officer,
          issue: item.issueDetails?.issue || 'Checkpoint fault reported',
          severity: item.issueDetails?.severity || 'HIGH',
          status: 'OPEN'
        });
      }
    });
  }

  // Car Search issues
  mockCarSearches.forEach(cs => {
    if (cs.result !== 'Clear') {
      issues.push({
        id: `issue-cs-${cs.id}`,
        dateTime: cs.dateTime,
        source: 'Car Search',
        location: cs.gate,
        officer: cs.officer,
        issue: `${cs.result}: ${cs.remarks}`,
        severity: cs.result === 'Refused' ? 'HIGH' : 'MEDIUM',
        status: 'OPEN'
      });
    }
  });

  // Daily Checks issues
  if (carParkState.status === 'ISSUE') {
    issues.push({
      id: 'issue-car-park',
      dateTime: carParkState.completeTime ? `2026-08-21T${carParkState.completeTime}` : getLocalDateTimeString(),
      source: 'Daily Checks',
      location: 'Car Park',
      officer: 'Security Officer',
      issue: carParkState.remarks || 'Car Park observation reported',
      severity: 'LOW',
      status: 'OPEN'
    });
  }

  // Davyhulme oil check issues
  for (let p = 1; p <= 5; p++) {
    const level = pumpOilState.pumps[p];
    if (level === 'Low' || level === 'Critical') {
      issues.push({
        id: `issue-pump-${p}`,
        dateTime: pumpOilState.completeTime ? `2026-08-21T${pumpOilState.completeTime}` : getLocalDateTimeString(),
        source: 'Daily Checks',
        location: `Davyhulme Pump ${p}`,
        officer: 'Security Officer',
        issue: `Pump ${p} oil level is ${level}`,
        severity: level === 'Critical' ? 'HIGH' : 'MEDIUM',
        status: 'OPEN'
      });
    }
  }

  // Jetty issues
  ['DAY', 'NIGHT'].forEach(shift => {
    for (let p = 1; p <= 10; p++) {
      const patrol = jettyPatrolsState[shift] ? jettyPatrolsState[shift][p] : null;
      if (patrol) {
        JETTY_TAG_POINTS.forEach(tp => {
          if (patrol.tags[tp] === 'ISSUE') {
            issues.push({
              id: `issue-jetty-${shift}-${p}-${tp}`,
              dateTime: `2026-08-21T${patrol.expectedTime}`,
              source: 'Jetty Patrol',
              location: tp,
              officer: 'Security Officer',
              issue: `Jetty tag point fault: ${tp}`,
              severity: 'MEDIUM',
              status: 'OPEN'
            });
          }
        });
      }
    }
  });

  return issues;
}

function renderAdminReports() {
  const tabBtns = document.querySelectorAll('#reportsTabNav .report-tab-btn');
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.report === currentActiveReportTab);
  });

  const contentContainer = document.getElementById('subReportContent');
  if (!contentContainer) return;

  switch (currentActiveReportTab) {
    case 'daily-security':
      contentContainer.innerHTML = renderDailySecurityReportHTML();
      break;
    case 'patrol':
      contentContainer.innerHTML = renderPatrolReportHTML();
      attachPatrolReportListeners();
      break;
    case 'vehicle-entry':
      contentContainer.innerHTML = renderVehicleEntryReportHTML();
      break;
    case 'daily-checks':
      contentContainer.innerHTML = renderDailyChecksReportHTML();
      break;
    case 'checkpoint':
      contentContainer.innerHTML = renderCheckpointReportHTML();
      attachCheckpointReportListeners();
      break;
    case 'gate-activity':
      contentContainer.innerHTML = renderGateActivityReportHTML();
      break;
    case 'car-search':
      contentContainer.innerHTML = renderCarSearchReportHTML();
      break;
    case 'jetty':
      contentContainer.innerHTML = renderJettyReportHTML();
      break;
    case 'incident-issue':
      contentContainer.innerHTML = renderIncidentIssueReportHTML();
      break;
    default:
      contentContainer.innerHTML = renderDailySecurityReportHTML();
  }
}

// Global click delegation for reports tab navigation
document.addEventListener('click', (e) => {
  const reportTab = e.target.closest('#reportsTabNav .report-tab-btn');
  if (reportTab) {
    currentActiveReportTab = reportTab.dataset.report;
    renderAdminReports();
  }
});

/* SUB-REPORT 1: DAILY SECURITY REPORT */
function renderDailySecurityReportHTML() {
  const dayStats = getDayPatrolStats();
  const nightStats = getPatrolStats();
  const totalPatrolsCompleted = dayStats.completedRoundsCount + nightStats.completedRoundsCount;
  const totalCheckpointsChecked = (dayStats.totalChecked + dayStats.totalIssues) + (nightStats.totalChecked + nightStats.totalIssues);

  let totalVehicles = 0;
  Object.values(eastGateVehicleTally).forEach(val => { totalVehicles += val; });

  const allIssues = getAllReportedIssues();

  return `
    <div class="sub-report-panel">
      <div class="reports-summary-row">
        <div class="report-summary-card">
          <span class="eyebrow">DAILY SECURITY REPORT</span>
          <h3 style="margin-top:4px;">OPERATIONAL OVERVIEW</h3>
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:14px; margin-top:16px;">
            <div class="kpi-card" style="padding:16px;">
              <span class="kpi-label">PATROLS</span>
              <strong class="kpi-val navy-text">${totalPatrolsCompleted} / 11</strong>
              <small class="kpi-sub">3 Day · 8 Night</small>
            </div>
            <div class="kpi-card" style="padding:16px;">
              <span class="kpi-label">CHECKPOINTS</span>
              <strong class="kpi-val navy-text">${totalCheckpointsChecked} / 167</strong>
              <small class="kpi-sub">Day & Night total</small>
            </div>
            <div class="kpi-card" style="padding:16px;">
              <span class="kpi-label">VEHICLES ENTERING</span>
              <strong class="kpi-val blue-text">${totalVehicles}</strong>
              <small class="kpi-sub">East Gate tally</small>
            </div>
            <div class="kpi-card" style="padding:16px;">
              <span class="kpi-label">OPEN ISSUES</span>
              <strong class="kpi-val amber-text">${allIssues.length}</strong>
              <small class="kpi-sub">Central issue tracker</small>
            </div>
          </div>
        </div>

        <div class="report-performance-card">
          <span class="eyebrow">PATROL & CHECKPOINT STATUS</span>
          <h3 style="margin-top:4px;">Patrol Completion Summary</h3>
          <div class="summary-metrics-list">
            <div class="metric-line">
              <span>Day Patrol Completion</span>
              <strong class="ok-text">${dayStats.completedRoundsCount} / 3 Patrols (${dayStats.completionPct}%)</strong>
            </div>
            <div class="metric-line">
              <span>Night Patrol Completion</span>
              <strong class="ok-text">${nightStats.completedRoundsCount} / 8 Patrols (${nightStats.completionPct}%)</strong>
            </div>
            <div class="metric-line">
              <span>Required Checkpoint Checks</span>
              <strong>167 (39 Day / 128 Night)</strong>
            </div>
            <div class="metric-line">
              <span>Checkpoint Issues Logged</span>
              <strong class="amber-text">${dayStats.totalIssues + nightStats.totalIssues}</strong>
            </div>
            <div class="metric-line">
              <span>Missed Checkpoints</span>
              <strong class="red-text">${dayStats.totalPending + nightStats.totalPending}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="section-heading" style="margin-top: 24px;">
        <div>
          <span class="eyebrow">INDEPENDENT DUTIES & GATES</span>
          <h2>Daily Operations Status</h2>
        </div>
      </div>

      <div class="patrol-stats-grid">
        <div class="p-stat-box">
          <span class="p-stat-label">Davyhulme Oil Checks</span>
          <strong class="p-stat-val ${pumpOilState.status === 'COMPLETED' ? 'green-text' : 'amber-text'}">${pumpOilState.status}</strong>
          <small class="p-stat-sub">5 Checks ${pumpOilState.completeTime ? `(${pumpOilState.completeTime})` : ''}</small>
        </div>
        <div class="p-stat-box">
          <span class="p-stat-label">Car Park Check</span>
          <strong class="p-stat-val ${carParkState.isCompleted ? (carParkState.status === 'OK' ? 'green-text' : 'amber-text') : 'muted'}">${carParkState.isCompleted ? carParkState.status : 'PENDING'}</strong>
          <small class="p-stat-sub">${carParkState.isCompleted ? `Completed at ${carParkState.completeTime}` : 'Once Daily Duty'}</small>
        </div>
        <div class="p-stat-box">
          <span class="p-stat-label">Jetty Patrol</span>
          <strong class="p-stat-val ${dailyJettyPatrolState.status === 'COMPLETED' ? 'green-text' : 'blue-text'}">${dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT' ? 'VESSEL PRESENT' : dailyJettyPatrolState.status}</strong>
          <small class="p-stat-sub">${dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT' ? 'Not required' : (dailyJettyPatrolState.completeTime ? `Completed ${dailyJettyPatrolState.completeTime}` : 'Daily Patrol')}</small>
        </div>
        <div class="p-stat-box">
          <span class="p-stat-label">Total Vehicles Logged</span>
          <strong class="p-stat-val blue-text">${totalVehicles}</strong>
          <small class="p-stat-sub">East Gate Vehicle Tally</small>
        </div>
      </div>
    </div>
  `;
}

/* SUB-REPORT 2: PATROL REPORT */
function renderPatrolReportHTML() {
  const isDay = selectedReportPatrolMode === 'DAY';
  const checkpointsList = isDay ? DAY_CHECKPOINTS : NIGHT_CHECKPOINTS;
  const numRounds = isDay ? 3 : 8;
  const roundsData = isDay ? dayPatrolRounds : patrolRounds;

  let optionsHtml = '';
  for (let r = 1; r <= numRounds; r++) {
    optionsHtml += `<option value="${r}" ${r === selectedReportPatrolRound ? 'selected' : ''}>${getOrdinalPatrolName(r)}</option>`;
  }

  const selectedData = roundsData[selectedReportPatrolRound] || {};

  let tableRowsHtml = '';
  checkpointsList.forEach((cpName) => {
    const item = selectedData[cpName] || { status: 'PENDING', time: '--:--', officer: 'Security Officer' };
    let statusClass = 'badge-out';
    if (item.status === 'CHECKED') statusClass = 'badge-in';
    if (item.status === 'ISSUE') statusClass = 'badge-inactive';

    let issueText = item.issueDetails ? `${item.issueDetails.severity}: ${item.issueDetails.issue}` : 'None';

    tableRowsHtml += `
      <tr>
        <td style="font-weight: 700; color: var(--navy);">${cpName}</td>
        <td><span class="${statusClass}">${item.status}</span></td>
        <td>${item.time}</td>
        <td>${item.officer}</td>
        <td>${issueText}</td>
      </tr>
    `;
  });

  return `
    <div class="sub-report-panel">
      <div class="reports-filter-panel">
        <h3>Patrol Report Selector</h3>
        <div class="form-grid filter-grid">
          <label>Shift / Patrol Mode
            <select id="reportPatrolModeSelect">
              <option value="DAY" ${isDay ? 'selected' : ''}>DAY PATROLS (3 Patrols / 13 Checkpoints)</option>
              <option value="NIGHT" ${!isDay ? 'selected' : ''}>NIGHT PATROLS (8 Patrols / 16 Checkpoints)</option>
            </select>
          </label>
          <label>Select Patrol
            <select id="reportPatrolRoundSelect">
              ${optionsHtml}
            </select>
          </label>
        </div>
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">${selectedReportPatrolMode} PATROL RESULTS</span>
          <h2>${getOrdinalPatrolName(selectedReportPatrolRound)} Checkpoints Detail</h2>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Checkpoint</th>
              <th>Status</th>
              <th>Time</th>
              <th>Officer</th>
              <th>Issue Details</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function attachPatrolReportListeners() {
  const modeSelect = document.getElementById('reportPatrolModeSelect');
  const roundSelect = document.getElementById('reportPatrolRoundSelect');

  if (modeSelect) {
    modeSelect.addEventListener('change', () => {
      selectedReportPatrolMode = modeSelect.value;
      selectedReportPatrolRound = 1;
      renderAdminReports();
    });
  }

  if (roundSelect) {
    roundSelect.addEventListener('change', () => {
      selectedReportPatrolRound = parseInt(roundSelect.value, 10);
      renderAdminReports();
    });
  }
}

/* SUB-REPORT 3: VEHICLE ENTRY REPORT */
function renderVehicleEntryReportHTML() {
  const activeClients = mockClients
    .filter(c => c.status === 'ACTIVE')
    .map(c => c.name.trim())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const categories = ['VELOGY', ...activeClients];

  let totalCount = 0;
  let tableRowsHtml = '';

  categories.forEach(cat => {
    const key = cat.toUpperCase();
    const count = eastGateVehicleTally[key] || 0;
    totalCount += count;

    tableRowsHtml += `
      <tr>
        <td style="font-weight: 700; color: var(--navy);">${cat} ${cat === 'VELOGY' ? '<span class="badge-active" style="margin-left:8px;">PINNED</span>' : ''}</td>
        <td style="font-weight: 800; font-size: 16px;">${count}</td>
      </tr>
    `;
  });

  return `
    <div class="sub-report-panel">
      <div class="reports-filter-panel">
        <h3>Vehicle Entry Filters</h3>
        <div class="form-grid filter-grid" style="grid-template-columns: 1fr 1fr;">
          <label>Date
            <input type="date" id="vehicleReportDate" value="2026-08-21">
          </label>
          <label>Gate
            <select id="vehicleReportGate">
              <option value="East Gate">East Gate (Vehicle Tally)</option>
            </select>
          </label>
        </div>
      </div>

      <div class="admin-kpi-grid" style="grid-template-columns: 1fr; margin-bottom: 20px;">
        <div class="kpi-card" style="text-align: center; padding: 20px;">
          <span class="kpi-label">TOTAL VEHICLES ENTERING</span>
          <strong class="kpi-val blue-text" style="font-size: 42px;">${totalCount}</strong>
          <small class="kpi-sub">East Gate Vehicle Tally Total Today</small>
        </div>
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">COMPANY BREAKDOWN</span>
          <h2>Vehicle Entries by Client</h2>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Company / Active Yard Client</th>
              <th>Vehicle Entries Tally Count</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* SUB-REPORT 4: DAILY CHECKS REPORT */
function renderDailyChecksReportHTML() {
  let completedCount = 0;
  let outstandingCount = 0;
  let issueCount = 0;

  // Pump checks
  if (pumpOilState.status === 'COMPLETED') completedCount++; else outstandingCount++;
  // Car park check
  if (carParkState.isCompleted) {
    completedCount++;
    if (carParkState.status === 'ISSUE') issueCount++;
  } else {
    outstandingCount++;
  }
  // Jetty daily check
  if (dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT') {
    completedCount++;
  } else {
    if (dailyJettyPatrolState.status === 'COMPLETED') completedCount++; else outstandingCount++;
  }

  return `
    <div class="sub-report-panel">
      <div class="reports-summary-row">
        <div class="report-summary-card">
          <span class="eyebrow">INDEPENDENT DUTIES</span>
          <h3>Daily Checks Summary</h3>
          <div class="summary-metrics-list">
            <div class="metric-line">
              <span>Completed Checks</span>
              <strong class="ok-text">${completedCount} / 3</strong>
            </div>
            <div class="metric-line">
              <span>Outstanding Checks</span>
              <strong class="amber-text">${outstandingCount}</strong>
            </div>
            <div class="metric-line">
              <span>Reported Issues</span>
              <strong class="red-text">${issueCount}</strong>
            </div>
          </div>
        </div>

        <div class="report-performance-card">
          <span class="eyebrow">INDEPENDENT SCOPE</span>
          <h3>Operational Note</h3>
          <p class="muted" style="margin-top: 8px;">
            Daily checks (Davyhulme Oil Checks, Car Park Check, and Jetty Patrol) are independent operational duties and are NOT classified or counted as site patrol checkpoints.
          </p>
        </div>
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">DUTY BREAKDOWN</span>
          <h2>Independent Daily Checks Status</h2>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Duty Name</th>
              <th>Type / Scope</th>
              <th>Status</th>
              <th>Completion Time</th>
              <th>Details / Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 700; color: var(--navy);">Davyhulme Oil Checks</td>
              <td>5 Pumps Oil Level Check</td>
              <td><span class="${pumpOilState.status === 'COMPLETED' ? 'badge-in' : 'badge-out'}">${pumpOilState.status}</span></td>
              <td>${pumpOilState.completeTime || '--:--'}</td>
              <td>Pump levels: P1 (${pumpOilState.pumps[1]}), P2 (${pumpOilState.pumps[2]}), P3 (${pumpOilState.pumps[3]}), P4 (${pumpOilState.pumps[4]}), P5 (${pumpOilState.pumps[5]})</td>
            </tr>
            <tr>
              <td style="font-weight: 700; color: var(--navy);">Car Park Check</td>
              <td>Once Daily Inspection</td>
              <td><span class="${carParkState.isCompleted ? (carParkState.status === 'OK' ? 'badge-in' : 'badge-inactive') : 'badge-out'}">${carParkState.isCompleted ? carParkState.status : 'PENDING'}</span></td>
              <td>${carParkState.completeTime || '--:--'}</td>
              <td>${carParkState.remarks || 'No remarks recorded'}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; color: var(--navy);">Jetty Patrol</td>
              <td>Once Daily When No Vessel</td>
              <td><span class="${dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT' ? 'badge-active' : (dailyJettyPatrolState.status === 'COMPLETED' ? 'badge-in' : 'badge-out')}">${dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT' ? 'VESSEL PRESENT' : dailyJettyPatrolState.status}</span></td>
              <td>${dailyJettyPatrolState.completeTime || '--:--'}</td>
              <td>${dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT' ? 'Patrol not required while vessel is present' : 'Standard daily Jetty patrol'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* SUB-REPORT 5: CHECKPOINT REPORT */
function renderCheckpointReportHTML() {
  let tableRowsHtml = '';

  CHECKPOINTS.forEach(cpName => {
    let numChecks = 8;
    let completed = 0;
    let issues = 0;
    let missed = 0;
    let lastChecked = '--:--';

    for (let r = 1; r <= 8; r++) {
      const item = patrolRounds[r] ? patrolRounds[r][cpName] : null;
      if (item) {
        if (item.status === 'CHECKED') {
          completed++;
          lastChecked = item.time;
        } else if (item.status === 'ISSUE') {
          issues++;
          lastChecked = item.time;
        } else {
          missed++;
        }
      }
    }

    tableRowsHtml += `
      <tr style="cursor: pointer;" onclick="openCheckpointDetailModal('${cpName}')">
        <td style="font-weight: 700; color: var(--navy);">${cpName}</td>
        <td>${numChecks}</td>
        <td class="ok-text" style="font-weight:700;">${completed}</td>
        <td class="${issues > 0 ? 'amber-text' : ''}" style="font-weight:700;">${issues}</td>
        <td class="${missed > 0 ? 'red-text' : ''}">${missed}</td>
        <td>${lastChecked}</td>
        <td><button type="button" class="btn-detail-link" onclick="event.stopPropagation(); openCheckpointDetailModal('${cpName}')">View History</button></td>
      </tr>
    `;
  });

  return `
    <div class="sub-report-panel">
      <div class="section-heading" style="margin-top:0;">
        <div>
          <span class="eyebrow">CHECKPOINT PERFORMANCE</span>
          <h2>Checkpoint Performance Review</h2>
          <p class="muted-small">Click any checkpoint row to review detailed inspection history and reported issues.</p>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Checkpoint</th>
              <th>Required Checks</th>
              <th>Completed</th>
              <th>Issues</th>
              <th>Missed / Pending</th>
              <th>Last Checked</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function attachCheckpointReportListeners() {
  // Attached via onclick
}

/* SUB-REPORT 6: GATE ACTIVITY REPORT */
function renderGateActivityReportHTML() {
  let totalEastVehicles = 0;
  Object.values(eastGateVehicleTally).forEach(val => totalEastVehicles += val);

  const eastSearches = mockCarSearches.filter(cs => cs.gate === 'East Gate');
  const westSearches = mockCarSearches.filter(cs => cs.gate === 'West Gate');

  return `
    <div class="sub-report-panel">
      <div class="section-heading" style="margin-top:0;">
        <div>
          <span class="eyebrow">GATE OPERATIONS</span>
          <h2>Gate Activity Overview</h2>
        </div>
      </div>

      <div class="reports-summary-row">
        <!-- East Gate Box -->
        <div class="report-summary-card">
          <span class="eyebrow">GATE E</span>
          <h3>East Gate Operational Activity</h3>
          <div class="summary-metrics-list">
            <div class="metric-line">
              <span>Staff Currently Marked IN</span>
              <strong class="ok-text">${mockStaff.filter(s => s.status === 'IN' && s.lastAccess === 'East Gate').length}</strong>
            </div>
            <div class="metric-line">
              <span>Vehicle Entries Today (Tally)</span>
              <strong class="blue-text">${totalEastVehicles}</strong>
            </div>
            <div class="metric-line">
              <span>Vehicle Searches Logged</span>
              <strong>${eastSearches.length}</strong>
            </div>
          </div>
        </div>

        <!-- West Gate Box -->
        <div class="report-summary-card">
          <span class="eyebrow">GATE W</span>
          <h3>West Gate Operational Activity</h3>
          <div class="summary-metrics-list">
            <div class="metric-line">
              <span>Staff Currently Marked IN</span>
              <strong class="ok-text">${mockStaff.filter(s => s.status === 'IN' && s.lastAccess === 'West Gate').length}</strong>
            </div>
            <div class="metric-line">
              <span>Vehicle Searches Logged</span>
              <strong>${westSearches.length}</strong>
            </div>
            <div class="metric-line">
              <span>Access Control Status</span>
              <strong class="ok-text">Active</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">RECENT GATE SEARCHES</span>
          <h2>Recent Car Searches at Gates</h2>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Gate</th>
              <th>Vehicle Reg</th>
              <th>Driver & Company</th>
              <th>Search Officer</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            ${mockCarSearches.length === 0 ? '<tr><td colspan="6" class="muted" style="text-align:center;">No car searches recorded.</td></tr>' :
              mockCarSearches.map(cs => `
                <tr>
                  <td>${cs.dateTime.replace('T', ' ')}</td>
                  <td><span class="badge-active">${cs.gate}</span></td>
                  <td style="font-weight:700;">${cs.reg}</td>
                  <td>${cs.driver} (${cs.company})</td>
                  <td>${cs.officer}</td>
                  <td><span class="${cs.result === 'Clear' ? 'badge-in' : 'badge-inactive'}">${cs.result}</span></td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* SUB-REPORT 7: CAR SEARCH REPORT */
function renderCarSearchReportHTML() {
  const totalSearches = mockCarSearches.length;
  const clearCount = mockCarSearches.filter(cs => cs.result === 'Clear').length;
  const foundCount = mockCarSearches.filter(cs => cs.result === 'Item Found').length;
  const refusedCount = mockCarSearches.filter(cs => cs.result === 'Refused').length;

  return `
    <div class="sub-report-panel">
      <div class="reports-summary-row">
        <div class="report-summary-card">
          <span class="eyebrow">CAR SEARCH SUMMARY</span>
          <h3>Vehicle Inspection Metrics</h3>
          <div class="summary-metrics-list">
            <div class="metric-line">
              <span>Total Searches Conducted</span>
              <strong>${totalSearches}</strong>
            </div>
            <div class="metric-line">
              <span>Clear Result</span>
              <strong class="ok-text">${clearCount}</strong>
            </div>
            <div class="metric-line">
              <span>Items Found</span>
              <strong class="amber-text">${foundCount}</strong>
            </div>
            <div class="metric-line">
              <span>Refused Searches</span>
              <strong class="red-text">${refusedCount}</strong>
            </div>
          </div>
        </div>

        <div class="report-performance-card">
          <span class="eyebrow">INSPECTION AREAS</span>
          <h3>Inspected Areas Scope</h3>
          <p class="muted" style="margin-top: 8px;">
            Vehicle search records capture inspection across Exterior, Interior, Boot / Cargo Area, Under Vehicle, and Engine Area.
          </p>
        </div>
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">CAR SEARCH LOG</span>
          <h2>Vehicle Search Records</h2>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Registration</th>
              <th>Driver & Company</th>
              <th>Gate</th>
              <th>Officer</th>
              <th>Result</th>
              <th>Remarks / Inspected Areas</th>
            </tr>
          </thead>
          <tbody>
            ${mockCarSearches.length === 0 ? '<tr><td colspan="7" class="muted" style="text-align:center;">No vehicle searches recorded.</td></tr>' :
              mockCarSearches.map(cs => `
                <tr>
                  <td>${cs.dateTime.replace('T', ' ')}</td>
                  <td style="font-weight:700; color:var(--navy);">${cs.reg}</td>
                  <td>${cs.driver} (${cs.company})</td>
                  <td>${cs.gate}</td>
                  <td>${cs.officer}</td>
                  <td><span class="${cs.result === 'Clear' ? 'badge-in' : 'badge-inactive'}">${cs.result}</span></td>
                  <td>${cs.remarks} ${cs.areas ? `<br><small class="muted">Areas: ${cs.areas.join(', ')}</small>` : ''}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* SUB-REPORT 8: JETTY REPORT */
function renderJettyReportHTML() {
  let completedPatrols = 0;
  let jettyIssuesCount = 0;

  ['DAY', 'NIGHT'].forEach(shift => {
    for (let p = 1; p <= 10; p++) {
      const patrol = jettyPatrolsState[shift] ? jettyPatrolsState[shift][p] : null;
      if (patrol) {
        if (patrol.isCompleted) completedPatrols++;
        JETTY_TAG_POINTS.forEach(tp => {
          if (patrol.tags[tp] === 'ISSUE') jettyIssuesCount++;
        });
      }
    }
  });

  return `
    <div class="sub-report-panel">
      <div class="reports-summary-row">
        <div class="report-summary-card">
          <span class="eyebrow">JETTY OPERATIONAL SUMMARY</span>
          <h3>Jetty Operations Metrics</h3>
          <div class="summary-metrics-list">
            <div class="metric-line">
              <span>Total Jetty Patrols</span>
              <strong>20 Patrols per 24 Hours (10 Day / 10 Night)</strong>
            </div>
            <div class="metric-line">
              <span>Patrols Completed Today</span>
              <strong class="ok-text">${completedPatrols} / 20</strong>
            </div>
            <div class="metric-line">
              <span>Current Vessel Status</span>
              <strong class="blue-text">${dailyJettyPatrolState.vesselStatus === 'VESSEL_PRESENT' ? 'VESSEL PRESENT' : 'NO VESSEL'}</strong>
            </div>
            <div class="metric-line">
              <span>Visitor Searches Logged</span>
              <strong>${mockVisitorSearches.length}</strong>
            </div>
            <div class="metric-line">
              <span>Jetty Issues Logged</span>
              <strong class="amber-text">${jettyIssuesCount}</strong>
            </div>
          </div>
        </div>

        <div class="report-performance-card">
          <span class="eyebrow">SEPARATE SITE SCOPE</span>
          <h3>Dedicated Jetty Operations</h3>
          <p class="muted" style="margin-top: 8px;">
            Jetty operations are managed independently from Site Patrol and include dedicated 20-patrol rounds, vessel status tracking, and visitor entry searches.
          </p>
        </div>
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">JETTY VISITOR SEARCHES</span>
          <h2>Visitor Search Records</h2>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Visitor Name</th>
              <th>Company</th>
              <th>Time In / Out</th>
              <th>Search Officer</th>
              <th>Checks Performed</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${mockVisitorSearches.length === 0 ? '<tr><td colspan="7" class="muted" style="text-align:center;">No visitor searches recorded.</td></tr>' :
              mockVisitorSearches.map(vs => `
                <tr>
                  <td>${vs.dateTime.replace('T', ' ')}</td>
                  <td style="font-weight:700; color:var(--navy);">${vs.name}</td>
                  <td>${vs.company}</td>
                  <td>${vs.timeIn} - ${vs.timeOut || 'Present'}</td>
                  <td>${vs.officer}</td>
                  <td>${vs.checks.join(', ')}</td>
                  <td>${vs.remarks}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function formatReportDateTime(dateTimeStr) {
  if (!dateTimeStr) return '--';
  const dt = new Date(dateTimeStr);
  if (isNaN(dt.getTime())) return dateTimeStr.replace('T', ' ');
  const day = dt.getDate();
  const month = dt.toLocaleString('en-GB', { month: 'short' });
  const hours = String(dt.getHours()).padStart(2, '0');
  const mins = String(dt.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${mins}`;
}

/* SUB-REPORT 9: INCIDENT / ISSUE REPORT */
function renderIncidentIssueReportHTML() {
  const issues = getAllReportedIssues();
  const incCounts = getIncidentCounts();

  // Sort newest first
  issues.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  return `
    <div class="sub-report-panel">
      <div class="reports-summary-row" style="margin-bottom: 20px;">
        <div class="report-summary-card" style="width: 100%;">
          <span class="eyebrow">FORMAL INCIDENTS SUMMARY</span>
          <h3>Incident Reports Status Overview</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 12px;">
            <div class="kpi-card" style="padding: 12px 16px;">
              <span class="kpi-label">UNREAD</span>
              <strong class="kpi-val amber-text">${incCounts.unread}</strong>
            </div>
            <div class="kpi-card" style="padding: 12px 16px;">
              <span class="kpi-label">READ</span>
              <strong class="kpi-val blue-text">${incCounts.read}</strong>
            </div>
            <div class="kpi-card" style="padding: 12px 16px;">
              <span class="kpi-label">RESOLVED</span>
              <strong class="kpi-val green-text">${incCounts.resolved}</strong>
            </div>
            <div class="kpi-card" style="padding: 12px 16px;">
              <span class="kpi-label">TOTAL</span>
              <strong class="kpi-val navy-text">${incCounts.total}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="section-heading" style="margin-top:0;">
        <div>
          <span class="eyebrow">CENTRAL ISSUE TRACKER</span>
          <h2>Incident & Issue Report</h2>
          <p class="muted-small">Central view aggregating formal Incident Reports (Function 04) and operational issues from Site Patrol, Car Search, Jetty, and Daily Checks.</p>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Report / Issue</th>
              <th>Source</th>
              <th>Location</th>
              <th>Submitted By</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${issues.length === 0 ? '<tr><td colspan="7" class="muted" style="text-align:center;">No active issues or incidents reported.</td></tr>' :
              issues.map(iss => {
                let sevBadge = 'badge-out';
                if (iss.severity === 'HIGH') sevBadge = 'badge-inactive';
                if (iss.severity === 'MEDIUM') sevBadge = 'badge-active';

                let statusBadge = '<span class="badge-active">OPEN</span>';
                if (iss.status === 'UNREAD') statusBadge = '<span class="badge-unread">UNREAD</span>';
                else if (iss.status === 'READ') statusBadge = '<span class="badge-read">READ</span>';
                else if (iss.status === 'RESOLVED') statusBadge = '<span class="badge-resolved">RESOLVED</span>';

                let reportCell = iss.isIncidentReport ?
                  `<strong style="color:var(--navy);">${iss.reportNumber}</strong><br><small style="color:var(--muted);">${iss.issue}</small>` :
                  `<strong>${iss.issue}</strong>`;

                let sourceCell = iss.isIncidentReport ?
                  `<span style="font-weight:700; color:var(--blue);">${iss.source}</span>` :
                  `<span style="font-weight:700;">${iss.source}</span>`;

                return `
                  <tr>
                    <td style="white-space: nowrap;">${formatReportDateTime(iss.dateTime)}</td>
                    <td>${reportCell}</td>
                    <td>${sourceCell}</td>
                    <td style="font-weight:700; color:var(--navy);">${iss.location}</td>
                    <td>${iss.officer}</td>
                    <td><span class="${sevBadge}">${iss.severity}</span></td>
                    <td>${statusBadge}</td>
                  </tr>
                `;
              }).join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

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

    const driverVal = document.getElementById('carDriver')?.value.trim() || 'Driver';
    const companyVal = document.getElementById('carCompany')?.value.trim() || 'Company';
    const gateVal = document.getElementById('carGate')?.value || 'East Gate';
    const officerVal = document.getElementById('carOfficer')?.value || 'Security Officer';
    const dtVal = document.getElementById('carDateTime')?.value || getLocalDateTimeString();
    const remarksVal = document.getElementById('carRemarks')?.value || 'Vehicle search completed.';

    const selectedResult = document.querySelector('#carResultGrid button.selected');
    const resultVal = selectedResult ? selectedResult.dataset.result : 'Clear';

    const selectedAreas = [];
    document.querySelectorAll('#carAreasGrid button.selected').forEach(btn => {
      selectedAreas.push(btn.dataset.area);
    });

    mockCarSearches.unshift({
      id: `cs-${Date.now()}`,
      dateTime: dtVal,
      reg: regVal || 'UNREG',
      driver: driverVal,
      company: companyVal,
      gate: gateVal,
      officer: officerVal,
      areas: selectedAreas,
      result: resultVal,
      remarks: remarksVal
    });

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

    const visCompanyVal = document.getElementById('visCompany')?.value.trim() || 'Visitor Company';
    const visTimeInVal = document.getElementById('visTimeIn')?.value || getTimeString();
    const visTimeOutVal = document.getElementById('visTimeOut')?.value || '';
    const visSearcherVal = document.getElementById('visSearcher')?.value || 'Security Officer';
    const visDtVal = document.getElementById('visDateTime')?.value || getLocalDateTimeString();
    const visRemarksVal = document.getElementById('visRemarks')?.value || 'Visitor search completed.';

    const selectedChecks = [];
    document.querySelectorAll('#visitorChecksGrid button.selected').forEach(btn => {
      selectedChecks.push(btn.dataset.check);
    });

    mockVisitorSearches.unshift({
      id: `vs-${Date.now()}`,
      name: visNameVal,
      company: visCompanyVal,
      timeIn: visTimeInVal,
      timeOut: visTimeOutVal,
      officer: visSearcherVal,
      dateTime: visDtVal,
      checks: selectedChecks.length > 0 ? selectedChecks : ['Documentation Check'],
      remarks: visRemarksVal
    });

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

function renderStaffOnSiteModalContent() {
  const countEl = document.getElementById('modalStaffOnSiteCount');
  const listEl = document.getElementById('staffOnSiteListContent');
  if (!listEl) return;

  const staffIn = mockStaff.filter(s => s.status === 'IN');
  if (countEl) countEl.textContent = staffIn.length;

  const companies = ['Velogy', 'Altrad', 'Pinnacle', 'Contractors'];
  let html = '';

  companies.forEach(company => {
    const compMembers = staffIn.filter(s => s.company.toLowerCase() === company.toLowerCase());
    html += `
      <div class="staff-group-block">
        <h4 class="staff-group-title">${company.toUpperCase()}</h4>
        <ul class="staff-group-list">
    `;
    if (compMembers.length === 0) {
      html += `<li class="muted-small" style="list-style:none; font-weight:normal;">• No staff currently marked IN</li>`;
    } else {
      compMembers.forEach(s => {
        html += `<li>• ${s.name}</li>`;
      });
    }
    html += `
        </ul>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

const staffOnSiteModal = document.getElementById('staffOnSiteModal');
const openStaffOnSiteModalBtn = document.getElementById('openStaffOnSiteModalBtn');
const closeStaffOnSiteModalBtn = document.getElementById('closeStaffOnSiteModalBtn');
const closeStaffOnSiteBtn = document.getElementById('closeStaffOnSiteBtn');

function openStaffOnSiteModal() {
  renderStaffOnSiteModalContent();
  if (staffOnSiteModal) staffOnSiteModal.setAttribute('aria-hidden', 'false');
}

function closeStaffOnSiteModal() {
  if (staffOnSiteModal) staffOnSiteModal.setAttribute('aria-hidden', 'true');
}

if (openStaffOnSiteModalBtn) openStaffOnSiteModalBtn.addEventListener('click', openStaffOnSiteModal);
if (closeStaffOnSiteModalBtn) closeStaffOnSiteModalBtn.addEventListener('click', closeStaffOnSiteModal);
if (closeStaffOnSiteBtn) closeStaffOnSiteBtn.addEventListener('click', closeStaffOnSiteModal);

function renderAdminDashboard() {
  const staffInCount = mockStaff.filter(s => s.status === 'IN').length;

  const dayStats = getDayPatrolStats();
  const nightStats = getPatrolStats();

  const totalPatrolsCompleted = dayStats.completedRoundsCount + nightStats.completedRoundsCount;
  const totalCheckpointsChecked = (dayStats.totalChecked + dayStats.totalIssues) + (nightStats.totalChecked + nightStats.totalIssues);

  let totalVehicles = 0;
  Object.values(eastGateVehicleTally).forEach(val => { totalVehicles += val; });

  let totalOpenIssues = dayStats.totalIssues + nightStats.totalIssues;
  if (carParkState.status === 'ISSUE') totalOpenIssues++;

  const kpiStaffIn = document.getElementById('kpiStaffIn');
  const kpiPatrols = document.getElementById('kpiPatrols');
  const kpiCheckpoints = document.getElementById('kpiCheckpoints');
  const kpiVehiclesEntering = document.getElementById('kpiVehiclesEntering');
  const kpiOpenIssues = document.getElementById('kpiOpenIssues');

  if (kpiStaffIn) kpiStaffIn.textContent = staffInCount;
  if (kpiPatrols) kpiPatrols.textContent = `${totalPatrolsCompleted} / 11`;
  if (kpiCheckpoints) kpiCheckpoints.textContent = `${totalCheckpointsChecked} / 167`;
  if (kpiVehiclesEntering) kpiVehiclesEntering.textContent = totalVehicles;
  if (kpiOpenIssues) kpiOpenIssues.textContent = totalOpenIssues;

  renderStaffOnSiteModalContent();
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
  renderEastGateVehicleTally();
  renderControlVehicleTally();
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

/* ==========================================================================
   9. SECURITY SIGN-IN & AUTHENTICATION LOGIC
   ========================================================================== */

let currentSecurityLevel = 'OFFICER'; // 'OFFICER' | 'CONTROLLER' | 'SUPERVISOR' | 'MANAGER'

function renderSignInForm() {
  const container = document.getElementById('signInDynamicContainer');
  const errorEl = document.getElementById('signInError');
  if (!container) return;

  if (errorEl) errorEl.style.display = 'none';

  // Update tabs active state
  document.querySelectorAll('#securityLevelTabs .security-level-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.level === currentSecurityLevel);
  });

  if (currentSecurityLevel === 'OFFICER') {
    const officers = securityUsers.users.filter(u => u.role === 'officer');
    let officerOptions = officers.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    container.innerHTML = `
      <div class="sign-in-field-group">
        <label for="signInUserSelect">Officer Name</label>
        <select id="signInUserSelect" class="sign-in-input" required>
          <option value="" disabled selected>[ Select Officer ▼ ]</option>
          ${officerOptions}
        </select>
      </div>
      <div class="sign-in-field-group">
        <label for="signInPassword">Password</label>
        <input type="password" id="signInPassword" class="sign-in-input" placeholder="••••••••" required>
      </div>
    `;
  } else if (currentSecurityLevel === 'CONTROLLER') {
    const controllers = securityUsers.users.filter(u => u.role === 'controller');
    let controllerOptions = controllers.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    container.innerHTML = `
      <div class="sign-in-field-group">
        <label for="signInUserSelect">Controller Name</label>
        <select id="signInUserSelect" class="sign-in-input" required>
          <option value="" disabled selected>[ Select Controller ▼ ]</option>
          ${controllerOptions}
        </select>
      </div>
      <div class="sign-in-field-group">
        <label for="signInPassword">Password</label>
        <input type="password" id="signInPassword" class="sign-in-input" placeholder="••••••••" required>
      </div>
    `;
  } else if (currentSecurityLevel === 'SUPERVISOR') {
    const supervisors = securityUsers.users.filter(u => u.role === 'supervisor');
    const supName = supervisors.length > 0 ? supervisors[0].name : "Troy Oliv";
    container.innerHTML = `
      <div class="sign-in-role-badge">SECURITY SUPERVISOR</div>
      <div class="sign-in-role-person">${supName}</div>
      <div class="sign-in-field-group" style="margin-top: 16px;">
        <label for="signInPassword">Password</label>
        <input type="password" id="signInPassword" class="sign-in-input" placeholder="••••••••" required>
      </div>
    `;
  } else if (currentSecurityLevel === 'TEAM LEADER') {
    const teamLeaders = securityUsers.users.filter(u => u.role === 'team leader');
    let teamLeaderOptions = teamLeaders.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    container.innerHTML = `
      <div class="sign-in-field-group">
        <label for="signInUserSelect">Team Leader Name</label>
        <select id="signInUserSelect" class="sign-in-input" required>
          <option value="" disabled selected>[ Select Team Leader ▼ ]</option>
          ${teamLeaderOptions}
        </select>
      </div>
      <div class="sign-in-field-group">
        <label for="signInPassword">Password</label>
        <input type="password" id="signInPassword" class="sign-in-input" placeholder="••••••••" required>
      </div>
    `;
  } else if (currentSecurityLevel === 'MANAGER') {
    const managers = securityUsers.users.filter(u => u.role === 'manager');
    const mgrName = managers.length > 0 ? managers[0].name : "Seun Clegg";
    container.innerHTML = `
      <div class="sign-in-role-badge">SECURITY MANAGER</div>
      <div class="sign-in-role-person">${mgrName}</div>
      <div class="sign-in-field-group" style="margin-top: 16px;">
        <label for="signInPassword">Password</label>
        <input type="password" id="signInPassword" class="sign-in-input" placeholder="••••••••" required>
      </div>
    `;
  }
}

function handleSignInSubmit() {
  const passwordInput = document.getElementById('signInPassword');
  const errorEl = document.getElementById('signInError');
  const passwordVal = passwordInput ? passwordInput.value : '';

  if (errorEl) errorEl.style.display = 'none';

  if (passwordVal !== securityUsers.testPassword) {
    if (errorEl) {
      errorEl.textContent = 'Incorrect password. Please try again.';
      errorEl.style.display = 'block';
    }
    return;
  }

  let signedInName = '';
  let initials = 'SO';
  let roleVal = currentSecurityLevel.toLowerCase();

  if (currentSecurityLevel === 'OFFICER' || currentSecurityLevel === 'CONTROLLER' || currentSecurityLevel === 'TEAM LEADER') {
    const userSelect = document.getElementById('signInUserSelect');
    const selectedUser = userSelect ? userSelect.value : '';
    if (!selectedUser) {
      if (errorEl) {
        errorEl.textContent = `Please select a ${roleVal} name.`;
        errorEl.style.display = 'block';
      }
      return;
    }
    signedInName = selectedUser;
    if (currentSecurityLevel === 'TEAM LEADER') {
      initials = 'TL';
    } else {
      const parts = selectedUser.split(' ');
      initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : selectedUser.substring(0, 2).toUpperCase();
    }
  } else if (currentSecurityLevel === 'SUPERVISOR') {
    const supervisors = securityUsers.users.filter(u => u.role === 'supervisor');
    signedInName = supervisors.length > 0 ? supervisors[0].name : "Troy Oliv";
    initials = 'SUP';
  } else if (currentSecurityLevel === 'MANAGER') {
    const managers = securityUsers.users.filter(u => u.role === 'manager');
    signedInName = managers.length > 0 ? managers[0].name : "Seun Clegg";
    initials = 'MGR';
  }

  securityUsers.currentUser = {
    name: signedInName,
    role: roleVal,
    level: currentSecurityLevel,
    initials: initials
  };

  // Update topbar operator display
  const avatarEl = document.getElementById('operatorAvatar');
  const nameEl = document.getElementById('operatorName');
  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = signedInName;

  // Hide Sign-In screen
  const signInScreen = document.getElementById('signInScreen');
  if (signInScreen) {
    signInScreen.classList.add('fade-out');
    signInScreen.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      signInScreen.style.display = 'none';
    }, 400);
  }

  // Dynamically update UI and permissions for user role
  renderNavigationAndRoleUI();
  showView('dashboard');

  showToast(`Signed in as ${signedInName}`, 'success');
}

function handleSignOut() {
  securityUsers.currentUser = null;
  const signInScreen = document.getElementById('signInScreen');
  if (signInScreen) {
    signInScreen.style.display = 'flex';
    signInScreen.classList.remove('fade-out');
    signInScreen.setAttribute('aria-hidden', 'false');
  }
  renderSignInForm();
  renderNavigationAndRoleUI();
  showToast('Signed out successfully.', 'info');
}

// Security level tab switch listener
document.addEventListener('click', (e) => {
  const levelTab = e.target.closest('#securityLevelTabs .security-level-tab');
  if (levelTab) {
    currentSecurityLevel = levelTab.dataset.level;
    renderSignInForm();
  }
});

// Sign in form submission
const signInForm = document.getElementById('signInForm');
if (signInForm) {
  signInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSignInSubmit();
  });
}

// Sign out button
const signOutBtn = document.getElementById('signOutBtn');
if (signOutBtn) {
  signOutBtn.addEventListener('click', handleSignOut);
}

/* ==========================================================================
   10. SECURITY USERS (OFFICER MANAGEMENT) LOGIC
   ========================================================================== */

let pendingRemoveOfficerName = null;

function renderOfficerManagement() {
  const tableBody = document.getElementById('officerTableBody');
  const cardsContainer = document.getElementById('officerCardsContainer');
  const searchVal = (document.getElementById('officerSearchInput')?.value || '').toLowerCase().trim();

  const filteredUsers = securityUsers.users.filter(u => {
    return !searchVal || u.name.toLowerCase().includes(searchVal) || u.role.toLowerCase().includes(searchVal);
  });

  // Helper to format role names (e.g., 'team leader' -> 'Team Leader')
  const formatRoleLabel = (roleStr) => {
    return roleStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Render Desktop Table
  if (tableBody) {
    tableBody.innerHTML = '';
    if (filteredUsers.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" class="muted" style="text-align:center; padding:24px;">No security users found.</td></tr>`;
    } else {
      filteredUsers.forEach(u => {
        const tr = document.createElement('tr');
        const roleLabel = formatRoleLabel(u.role);
        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--navy);">${u.name}</td>
          <td><span class="badge-active">${roleLabel}</span></td>
          <td style="font-family: monospace;">velogy2026</td>
          <td style="text-align: right;">
            <button type="button" class="table-action-btn btn-danger" onclick="openRemoveOfficerModal('${u.name.replace(/'/g, "\\'")}')">REMOVE</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // Render Mobile Cards
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    if (filteredUsers.length === 0) {
      cardsContainer.innerHTML = `<div class="admin-card muted" style="text-align:center;">No security users found.</div>`;
    } else {
      filteredUsers.forEach(u => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        const roleLabel = formatRoleLabel(u.role);
        card.innerHTML = `
          <div class="admin-card-header">
            <div>
              <h4 class="admin-card-title">${u.name}</h4>
              <div class="admin-card-company">${roleLabel}</div>
            </div>
            <span class="badge-active">${u.role.toUpperCase()}</span>
          </div>
          <div class="admin-card-detail-row">
            <span class="muted">Password:</span>
            <span style="font-family: monospace;">velogy2026</span>
          </div>
          <div class="admin-card-actions">
            <button type="button" class="table-action-btn btn-danger" onclick="openRemoveOfficerModal('${u.name.replace(/'/g, "\\'")}')">REMOVE</button>
          </div>
        `;
        cardsContainer.appendChild(card);
      });
    }
  }
}

// Search input for officers
const officerSearchInput = document.getElementById('officerSearchInput');
if (officerSearchInput) {
  officerSearchInput.addEventListener('input', renderOfficerManagement);
}

// Add Officer Modal
const addOfficerModal = document.getElementById('addOfficerModal');
const openAddOfficerModalBtn = document.getElementById('openAddOfficerModalBtn');
const closeAddOfficerModalBtn = document.getElementById('closeAddOfficerModalBtn');
const cancelAddOfficerBtn = document.getElementById('cancelAddOfficerBtn');
const addOfficerForm = document.getElementById('addOfficerForm');

if (openAddOfficerModalBtn) {
  openAddOfficerModalBtn.addEventListener('click', () => {
    const input = document.getElementById('officerNameInput');
    const roleSelect = document.getElementById('officerRoleSelect');
    if (input) input.value = '';
    if (roleSelect) roleSelect.value = 'Officer';
    if (addOfficerModal) addOfficerModal.setAttribute('aria-hidden', 'false');
  });
}

function closeAddOfficerModal() {
  if (addOfficerModal) addOfficerModal.setAttribute('aria-hidden', 'true');
}

if (closeAddOfficerModalBtn) closeAddOfficerModalBtn.addEventListener('click', closeAddOfficerModal);
if (cancelAddOfficerBtn) cancelAddOfficerBtn.addEventListener('click', closeAddOfficerModal);

if (addOfficerForm) {
  addOfficerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('officerNameInput');
    const roleSelect = document.getElementById('officerRoleSelect');
    const nameVal = input ? input.value.trim() : '';
    const roleVal = roleSelect ? roleSelect.value.toLowerCase() : 'officer';

    if (!nameVal) return;

    if (securityUsers.users.some(u => u.name.toLowerCase() === nameVal.toLowerCase())) {
      showToast(`${nameVal} is already registered as a security user.`, 'warning');
      return;
    }

    securityUsers.users.push({ name: nameVal, role: roleVal });
    closeAddOfficerModal();
    renderOfficerManagement();
    renderSignInForm();
    showToast(`Security user ${nameVal} (${roleVal}) added successfully.`, 'success');
  });
}

// Remove Officer Modal
const confirmRemoveOfficerModal = document.getElementById('confirmRemoveOfficerModal');
const closeRemoveOfficerModalBtn = document.getElementById('closeRemoveOfficerModalBtn');
const cancelRemoveOfficerBtn = document.getElementById('cancelRemoveOfficerBtn');
const confirmRemoveOfficerBtn = document.getElementById('confirmRemoveOfficerBtn');

function openRemoveOfficerModal(officerName) {
  pendingRemoveOfficerName = officerName;
  const nameTextEl = document.getElementById('removeOfficerNameText');
  if (nameTextEl) nameTextEl.textContent = officerName;
  if (confirmRemoveOfficerModal) confirmRemoveOfficerModal.setAttribute('aria-hidden', 'false');
}

function closeRemoveOfficerModal() {
  if (confirmRemoveOfficerModal) confirmRemoveOfficerModal.setAttribute('aria-hidden', 'true');
  pendingRemoveOfficerName = null;
}

if (closeRemoveOfficerModalBtn) closeRemoveOfficerModalBtn.addEventListener('click', closeRemoveOfficerModal);
if (cancelRemoveOfficerBtn) cancelRemoveOfficerBtn.addEventListener('click', closeRemoveOfficerModal);

if (confirmRemoveOfficerBtn) {
  confirmRemoveOfficerBtn.addEventListener('click', () => {
    if (pendingRemoveOfficerName) {
      const name = pendingRemoveOfficerName;
      securityUsers.users = securityUsers.users.filter(u => u.name !== name);
      closeRemoveOfficerModal();
      renderOfficerManagement();
      renderSignInForm();
      showToast(`User ${name} removed from Security Users list.`, 'warning');
    }
  });
}

/* ==========================================================================
   11. INCIDENT REPORT MODULE (04 — INCIDENT REPORT)
   ========================================================================== */

let nextIncidentSeq = 8;
let currentIncidentTab = 'submit'; // 'submit' | 'manage'
let currentIncidentFilter = 'ALL';  // 'ALL' | 'UNREAD' | 'READ' | 'RESOLVED'
let pendingDeleteIncidentId = null;

let incidentReports = [
  {
    id: 'inc-1',
    reportNumber: 'INC-2026-0001',
    location: 'East Gate',
    locationOther: '',
    incidentType: 'Vehicle',
    dateTime: '2026-08-20T14:30',
    description: 'Commercial vehicle attempted site access without valid delivery manifest.',
    actionTaken: 'Vehicle turned away at gate by security officer. Client contacted.',
    submittedBy: 'Robert Lawal',
    submittedByRole: 'Officer',
    submittedDate: '20 August 2026',
    submittedTime: '14:30',
    status: 'RESOLVED',
    readBy: 'Troy Oliv',
    resolvedBy: 'Seun Clegg'
  },
  {
    id: 'inc-2',
    reportNumber: 'INC-2026-0002',
    location: 'Site',
    locationOther: '',
    incidentType: 'Safety',
    dateTime: '2026-08-21T09:15',
    description: 'Spill recorded near warehouse 700 loading bay area.',
    actionTaken: 'Area cordoned off and maintenance team alerted for cleanup.',
    submittedBy: 'John Walsh',
    submittedByRole: 'Officer',
    submittedDate: '21 August 2026',
    submittedTime: '09:15',
    status: 'RESOLVED',
    readBy: 'Troy Oliv',
    resolvedBy: 'Troy Oliv'
  },
  {
    id: 'inc-3',
    reportNumber: 'INC-2026-0003',
    location: 'Jetty',
    locationOther: '',
    incidentType: 'Jetty',
    dateTime: '2026-08-21T16:00',
    description: 'Minor perimeter fence warning light fault on Jetty walkway.',
    actionTaken: 'Logged in maintenance book and reported to site engineer.',
    submittedBy: 'Vio Roman',
    submittedByRole: 'Officer',
    submittedDate: '21 August 2026',
    submittedTime: '16:00',
    status: 'READ',
    readBy: 'Troy Oliv',
    resolvedBy: null
  },
  {
    id: 'inc-4',
    reportNumber: 'INC-2026-0004',
    location: 'West Gate',
    locationOther: '',
    incidentType: 'Access Control',
    dateTime: '2026-08-22T08:20',
    description: 'Contractor attempted to use expired site badge for entry.',
    actionTaken: 'Badge confiscated and contractor referred to admin office.',
    submittedBy: 'Michelle Holder',
    submittedByRole: 'Officer',
    submittedDate: '22 August 2026',
    submittedTime: '08:20',
    status: 'READ',
    readBy: 'Seun Clegg',
    resolvedBy: null
  },
  {
    id: 'inc-5',
    reportNumber: 'INC-2026-0005',
    location: 'Control',
    locationOther: '',
    incidentType: 'Security',
    dateTime: '2026-08-22T18:10',
    description: 'Unidentified vehicle parked near west boundary fence after hours.',
    actionTaken: 'Controller dispatched mobile patrol to inspect. Vehicle moved on.',
    submittedBy: 'Haseeb Ansar',
    submittedByRole: 'Controller',
    submittedDate: '22 August 2026',
    submittedTime: '18:10',
    status: 'UNREAD',
    readBy: null,
    resolvedBy: null
  },
  {
    id: 'inc-6',
    reportNumber: 'INC-2026-0006',
    location: 'Other',
    locationOther: 'Mess Hall / Rest Area',
    incidentType: 'Staff',
    dateTime: '2026-08-22T19:42',
    description: 'Property dispute reported between sub-contractor personnel.',
    actionTaken: 'Officer intervened, separated parties and notified shift supervisor.',
    submittedBy: 'Robert Lawal',
    submittedByRole: 'Officer',
    submittedDate: '22 August 2026',
    submittedTime: '19:42',
    status: 'UNREAD',
    readBy: null,
    resolvedBy: null
  },
  {
    id: 'inc-7',
    reportNumber: 'INC-2026-0007',
    location: 'East Gate',
    locationOther: '',
    incidentType: 'Vehicle',
    dateTime: '2026-08-22T21:14',
    description: 'Tailgating incident at East Gate egress barrier.',
    actionTaken: 'Barrier closed manually, driver details recorded.',
    submittedBy: 'Haseeb Ansar',
    submittedByRole: 'Controller',
    submittedDate: '22 August 2026',
    submittedTime: '21:14',
    status: 'UNREAD',
    readBy: null,
    resolvedBy: null
  }
];

function getUnreadIncidentCount() {
  return incidentReports.filter(r => r.status === 'UNREAD').length;
}

function getIncidentCounts() {
  const unread = incidentReports.filter(r => r.status === 'UNREAD').length;
  const read = incidentReports.filter(r => r.status === 'READ').length;
  const resolved = incidentReports.filter(r => r.status === 'RESOLVED').length;
  const total = incidentReports.length;
  return { unread, read, resolved, total };
}

function renderIncidentReportView() {
  const user = securityUsers.currentUser || { name: 'Security Officer', role: 'officer' };
  const role = user.role.toLowerCase();
  const canManage = (role === 'supervisor' || role === 'team leader' || role === 'manager');

  const tabNav = document.getElementById('incidentTabNav');
  const submitPanel = document.getElementById('incidentSubmitPanel');
  const managePanel = document.getElementById('incidentManagePanel');
  const confirmationPanel = document.getElementById('incidentConfirmationPanel');

  // 1. Navigation Tabs Visibility
  if (tabNav) {
    if (canManage) {
      tabNav.style.display = 'flex';
      const unreadCount = getUnreadIncidentCount();
      const badge = document.getElementById('incidentNavUnreadBadge');
      if (badge) {
        badge.textContent = `${unreadCount} UNREAD`;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
      }

      // Update active tab buttons
      tabNav.querySelectorAll('.incident-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === currentIncidentTab);
      });
    } else {
      tabNav.style.display = 'none';
      currentIncidentTab = 'submit';
    }
  }

  // 2. View Panels Switching
  if (currentIncidentTab === 'manage' && canManage) {
    if (submitPanel) submitPanel.style.display = 'none';
    if (confirmationPanel) confirmationPanel.style.display = 'none';
    if (managePanel) managePanel.style.display = 'block';
    renderIncidentManagementList();
  } else {
    if (managePanel) managePanel.style.display = 'none';
    // If we're not currently showing confirmation panel, show submission panel
    if (confirmationPanel && confirmationPanel.style.display === 'block') {
      if (submitPanel) submitPanel.style.display = 'none';
    } else {
      if (submitPanel) submitPanel.style.display = 'block';
      if (confirmationPanel) confirmationPanel.style.display = 'none';
      updateIncidentFormUserSession();
    }
  }
}

// Update "Submitted By" Session Details on Submission Form
function updateIncidentFormUserSession() {
  const user = securityUsers.currentUser || { name: 'Security Officer', role: 'officer' };
  const roleFormatted = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  const now = new Date();
  const optionsDate = { day: '2-digit', month: 'Long', year: 'numeric' };
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = getTimeString();

  const nameEl = document.getElementById('incSubmittedByName');
  const roleEl = document.getElementById('incSubmittedByRole');
  const dateEl = document.getElementById('incSubmittedByDate');
  const timeEl = document.getElementById('incSubmittedByTime');

  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = roleFormatted;
  if (dateEl) dateEl.textContent = dateStr;
  if (timeEl) timeEl.textContent = timeStr;

  const dtInput = document.getElementById('incDateTime');
  if (dtInput && !dtInput.value) {
    dtInput.value = getLocalDateTimeString();
  }
}

// Location Dropdown "Other" Toggle
const incLocationSelect = document.getElementById('incLocationSelect');
const incOtherLocationContainer = document.getElementById('incOtherLocationContainer');

if (incLocationSelect) {
  incLocationSelect.addEventListener('change', () => {
    if (incOtherLocationContainer) {
      incOtherLocationContainer.style.display = incLocationSelect.value === 'Other' ? 'block' : 'none';
    }
  });
}

// Incident Submission Form Handler
const incidentForm = document.getElementById('incidentForm');
if (incidentForm) {
  incidentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const locationSelectVal = document.getElementById('incLocationSelect')?.value || 'Site';
    const otherLocationVal = document.getElementById('incOtherLocationInput')?.value.trim() || '';
    const typeVal = document.getElementById('incTypeSelect')?.value || 'Security';
    const dateTimeVal = document.getElementById('incDateTime')?.value || getLocalDateTimeString();
    const descVal = document.getElementById('incDescription')?.value.trim() || '';
    const actionVal = document.getElementById('incActionTaken')?.value.trim() || '';

    const user = securityUsers.currentUser || { name: 'Security Officer', role: 'officer' };
    const roleFormatted = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    // Format Date & Time strings
    const dateObj = new Date(dateTimeVal);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toTimeString().slice(0, 5);

    const reportNum = `INC-2026-${String(nextIncidentSeq++).padStart(4, '0')}`;

    const newReport = {
      id: `inc-${Date.now()}`,
      reportNumber: reportNum,
      location: locationSelectVal,
      locationOther: locationSelectVal === 'Other' ? otherLocationVal : '',
      incidentType: typeVal,
      dateTime: dateTimeVal,
      description: descVal,
      actionTaken: actionVal,
      submittedBy: user.name,
      submittedByRole: roleFormatted,
      submittedDate: dateStr,
      submittedTime: timeStr,
      status: 'UNREAD',
      readBy: null,
      resolvedBy: null
    };

    incidentReports.unshift(newReport);

    // Update Confirmation View
    const confReportNumber = document.getElementById('confReportNumber');
    const confByName = document.getElementById('confByName');
    const confByRole = document.getElementById('confByRole');
    const confByDate = document.getElementById('confByDate');
    const confByTime = document.getElementById('confByTime');

    if (confReportNumber) confReportNumber.textContent = `Report: ${reportNum}`;
    if (confByName) confByName.textContent = user.name;
    if (confByRole) confByRole.textContent = roleFormatted;
    if (confByDate) confByDate.textContent = dateStr;
    if (confByTime) confByTime.textContent = timeStr;

    // Toggle panels
    const submitPanel = document.getElementById('incidentSubmitPanel');
    const confirmationPanel = document.getElementById('incidentConfirmationPanel');
    if (submitPanel) submitPanel.style.display = 'none';
    if (confirmationPanel) confirmationPanel.style.display = 'block';

    showToast(`Incident Report ${reportNum} submitted successfully.`, 'success');
  });
}

// "Submit Another Report" Handler
const submitAnotherIncidentBtn = document.getElementById('submitAnotherIncidentBtn');
if (submitAnotherIncidentBtn) {
  submitAnotherIncidentBtn.addEventListener('click', () => {
    // Reset form fields
    if (incidentForm) incidentForm.reset();
    if (incOtherLocationContainer) incOtherLocationContainer.style.display = 'none';

    const submitPanel = document.getElementById('incidentSubmitPanel');
    const confirmationPanel = document.getElementById('incidentConfirmationPanel');

    if (confirmationPanel) confirmationPanel.style.display = 'none';
    if (submitPanel) submitPanel.style.display = 'block';

    updateIncidentFormUserSession();
  });
}

// Global click handler for Incident Report Tabs (Submit vs Manage)
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('#incidentTabNav .incident-tab-btn');
  if (tabBtn) {
    currentIncidentTab = tabBtn.dataset.tab;
    renderIncidentReportView();
  }
});

// Render Incident Reports Management List (Supervisors/Managers)
function renderIncidentManagementList() {
  const counts = getIncidentCounts();

  // Update Summary Counts
  const countUnread = document.getElementById('incCountUnread');
  const countRead = document.getElementById('incCountRead');
  const countResolved = document.getElementById('incCountResolved');
  const countTotal = document.getElementById('incCountTotal');
  const headerBadge = document.getElementById('incUnreadHeaderBadge');

  if (countUnread) countUnread.textContent = counts.unread;
  if (countRead) countRead.textContent = counts.read;
  if (countResolved) countResolved.textContent = counts.resolved;
  if (countTotal) countTotal.textContent = counts.total;

  if (headerBadge) {
    headerBadge.textContent = `${counts.unread} UNREAD`;
    headerBadge.className = counts.unread > 0 ? 'status-badge active' : 'status-badge neutral';
  }

  // Filter & Search Logic
  const searchVal = (document.getElementById('incidentSearchInput')?.value || '').toLowerCase().trim();

  let filtered = incidentReports.filter(item => {
    const matchStatus = currentIncidentFilter === 'ALL' || item.status === currentIncidentFilter;
    const matchSearch = !searchVal ||
      item.reportNumber.toLowerCase().includes(searchVal) ||
      item.location.toLowerCase().includes(searchVal) ||
      (item.locationOther && item.locationOther.toLowerCase().includes(searchVal)) ||
      item.incidentType.toLowerCase().includes(searchVal) ||
      item.submittedBy.toLowerCase().includes(searchVal) ||
      item.description.toLowerCase().includes(searchVal);

    return matchStatus && matchSearch;
  });

  // Sort newest first
  filtered.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  const listContainer = document.getElementById('incidentReportsList');
  if (!listContainer) return;

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="form-panel muted" style="text-align: center; padding: 32px;">No incident reports found matching criteria.</div>`;
    return;
  }

  let html = '';
  filtered.forEach(item => {
    const locDisplay = item.location === 'Other' && item.locationOther ? `Other (${item.locationOther})` : item.location;

    let badgeClass = 'status-badge neutral';
    if (item.status === 'UNREAD') badgeClass = 'status-badge active';
    if (item.status === 'READ') badgeClass = 'status-badge neutral';
    if (item.status === 'RESOLVED') badgeClass = 'status-badge completed';

    let actionBtnHtml = '';
    if (item.status === 'UNREAD') {
      actionBtnHtml = `<button type="button" class="primary-button" onclick="markIncidentRead('${item.id}')">MARK AS READ</button>`;
    } else if (item.status === 'READ') {
      actionBtnHtml = `<button type="button" class="primary-button" onclick="markIncidentResolved('${item.id}')">MARK RESOLVED</button>`;
    } else if (item.status === 'RESOLVED') {
      actionBtnHtml = `<button type="button" class="danger-button" onclick="openDeleteIncidentModal('${item.id}')">DELETE REPORT</button>`;
    }

    html += `
      <div class="incident-card ${item.status === 'UNREAD' ? 'unread-card' : ''}">
        <div class="incident-card-header">
          <div>
            <span class="incident-number">${item.reportNumber}</span>
            <div class="incident-meta-tags">
              <span class="meta-tag-pill">${locDisplay}</span>
              <span class="meta-tag-pill">${item.incidentType}</span>
            </div>
          </div>
          <span class="${badgeClass}">${item.status}</span>
        </div>

        <div class="incident-card-body">
          <div class="incident-submitted-bar">
            <span class="muted-small">Submitted by:</span>
            <strong>${item.submittedBy}</strong> (${item.submittedByRole})
            <span class="incident-date-time">${item.submittedDate} — ${item.submittedTime}</span>
          </div>

          <div class="incident-text-block">
            <strong>Description:</strong>
            <p>${item.description}</p>
          </div>

          <div class="incident-text-block">
            <strong>Action Taken:</strong>
            <p>${item.actionTaken}</p>
          </div>
        </div>

        <div class="incident-card-actions">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  });

  listContainer.innerHTML = html;
}

// Search input handler for incident reports
const incidentSearchInput = document.getElementById('incidentSearchInput');
if (incidentSearchInput) {
  incidentSearchInput.addEventListener('input', renderIncidentManagementList);
}

// Filter pills handler for incident reports
document.querySelectorAll('#incidentStatusFilterGroup .filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#incidentStatusFilterGroup .filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentIncidentFilter = btn.dataset.incFilter;
    renderIncidentManagementList();
  });
});

// STATUS WORKFLOW ACTIONS
function markIncidentRead(reportId) {
  const user = securityUsers.currentUser;
  const role = user ? user.role.toLowerCase() : 'officer';

  if (role !== 'supervisor' && role !== 'team leader' && role !== 'manager') {
    showToast('Permission denied: Only Supervisors and Managers can mark reports Read.', 'danger');
    return;
  }

  const report = incidentReports.find(r => r.id === reportId);
  if (!report) return;

  if (report.status !== 'UNREAD') {
    showToast('Invalid status transition.', 'warning');
    return;
  }

  report.status = 'READ';
  report.readBy = user.name;
  report.readAt = getTimeString();

  showToast(`Report ${report.reportNumber} marked as READ.`, 'info');
  renderIncidentReportView();
}

function markIncidentResolved(reportId) {
  const user = securityUsers.currentUser;
  const role = user ? user.role.toLowerCase() : 'officer';

  if (role !== 'supervisor' && role !== 'team leader' && role !== 'manager') {
    showToast('Permission denied: Only Supervisors and Managers can mark reports Resolved.', 'danger');
    return;
  }

  const report = incidentReports.find(r => r.id === reportId);
  if (!report) return;

  if (report.status !== 'READ') {
    showToast('Invalid status transition: Report must be marked READ before RESOLVED.', 'warning');
    return;
  }

  report.status = 'RESOLVED';
  report.resolvedBy = user.name;
  report.resolvedAt = getTimeString();

  showToast(`Report ${report.reportNumber} marked as RESOLVED.`, 'success');
  renderIncidentReportView();
}

// Delete Protection Modal Workflow
const confirmDeleteIncidentModal = document.getElementById('confirmDeleteIncidentModal');
const closeDeleteIncidentModalBtn = document.getElementById('closeDeleteIncidentModalBtn');
const cancelDeleteIncidentBtn = document.getElementById('cancelDeleteIncidentBtn');
const confirmDeleteIncidentBtn = document.getElementById('confirmDeleteIncidentBtn');

function openDeleteIncidentModal(reportId) {
  const user = securityUsers.currentUser;
  const role = user ? user.role.toLowerCase() : 'officer';

  if (role !== 'supervisor' && role !== 'team leader' && role !== 'manager') {
    showToast('Permission denied: Only Supervisors and Managers can delete reports.', 'danger');
    return;
  }

  const report = incidentReports.find(r => r.id === reportId);
  if (!report) return;

  // Enforce delete protection condition: status === 'RESOLVED'
  if (report.status !== 'RESOLVED') {
    showToast(`Cannot delete report ${report.reportNumber}: Report must be RESOLVED before deletion.`, 'danger');
    return;
  }

  pendingDeleteIncidentId = reportId;
  const numTextEl = document.getElementById('deleteIncidentNumberText');
  if (numTextEl) numTextEl.textContent = report.reportNumber;

  if (confirmDeleteIncidentModal) confirmDeleteIncidentModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteIncidentModal() {
  if (confirmDeleteIncidentModal) confirmDeleteIncidentModal.setAttribute('aria-hidden', 'true');
  pendingDeleteIncidentId = null;
}

if (closeDeleteIncidentModalBtn) closeDeleteIncidentModalBtn.addEventListener('click', closeDeleteIncidentModal);
if (cancelDeleteIncidentBtn) cancelDeleteIncidentBtn.addEventListener('click', closeDeleteIncidentModal);

if (confirmDeleteIncidentBtn) {
  confirmDeleteIncidentBtn.addEventListener('click', () => {
    if (pendingDeleteIncidentId) {
      const report = incidentReports.find(r => r.id === pendingDeleteIncidentId);

      // Programmatic Enforcement of Delete Protection Condition
      if (!report || report.status !== 'RESOLVED') {
        showToast('Delete rejected: Only resolved incident reports can be deleted.', 'danger');
        closeDeleteIncidentModal();
        return;
      }

      const reportNum = report.reportNumber;
      incidentReports = incidentReports.filter(r => r.id !== pendingDeleteIncidentId);

      showToast(`Incident report ${reportNum} deleted successfully.`, 'warning');
      closeDeleteIncidentModal();
      renderIncidentReportView();
    }
  });
}

// Initial Initialization
initSplashScreen();
renderSignInForm();
renderNavigationAndRoleUI();
initializeDateTimeFields();
updateTheme();
renderPatrolDashboard();
renderAdminDashboard();
renderEastGateVehicleTally();
renderControlVehicleTally();
