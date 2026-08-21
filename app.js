const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('.nav-item')];
const title = document.getElementById('pageTitle');
const sidebar = document.querySelector('.sidebar');

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

function showView(id) {
  const target = document.getElementById(id);
  if (!target) return;
  views.forEach(view => view.classList.toggle('active-view', view.id === id));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.view === id || (id.startsWith('gate-') || id === 'car-search') && item.dataset.view === 'access' || (id.startsWith('jetty-') || id === 'visitor-search') && item.dataset.view === 'jetty'));
  title.textContent = titles[id] || 'Dashboard';
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-view]');
  if (trigger) showView(trigger.dataset.view);
});

document.getElementById('menuButton').addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.querySelectorAll('.choice-grid button').forEach(button => {
  button.addEventListener('click', () => {
    button.classList.toggle('selected');
    button.setAttribute('aria-pressed', button.classList.contains('selected'));
  });
});
