/* ======================================================
   Landa Quantum V13 Refined - Script Core Logic
   ====================================================== */

/* ===== Particles Animation ===== */
(function(){
  const wrap = document.getElementById('particles');
  if (!wrap) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = (60 + Math.random() * 60) + '%';
    p.style.animationDuration = (14 + Math.random() * 10) + 's';
    p.style.opacity = 0.3 + Math.random() * 0.4;
    wrap.appendChild(p);
  }
})();

/* ===== Login ===== */
const loginScreen = document.getElementById('loginScreen');
const appRoot = document.getElementById('appRoot');

document.getElementById('btnFill').onclick = () => {
  authUser.value = 'Expert';
  authPass.value = 'Landa123456';
};

document.getElementById('btnLogin').onclick = () => {
  if (authUser.value.trim() === 'Expert' && authPass.value === 'Landa123456') {
    loginScreen.classList.add('hidden');
    appRoot.classList.remove('hidden');
    toast('Welcome, Expert', 'ok');
    go('dashboard');
    updateKPIs();
  } else toast('Invalid credentials', 'err');
};

/* ===== Navigation ===== */
const pages = ['dashboard', 'create', 'cases'];
document.querySelectorAll('.nav .item').forEach(btn => {
  btn.onclick = (e) => {
    e.preventDefault();
    const route = btn.dataset.route;
    go(route);
  };
});

function go(route) {
  pages.forEach(p => document.getElementById('page-' + p).classList.add('hidden'));
  document.getElementById('page-' + route).classList.remove('hidden');
  document.querySelectorAll('.nav .item').forEach(a =>
    a.classList.toggle('active', a.dataset.route === route)
  );
  if (route === 'dashboard') updateKPIs();
  if (route === 'cases') renderCases();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.getElementById('goHome').onclick = () => go('dashboard');

/* ===== Local Storage ===== */
const LS_KEY = 'landa_cases_v13';
function getCases() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch (e) { return []; }
}
function setCases(a) {
  localStorage.setItem(LS_KEY, JSON.stringify(a));
  updateKPIs();
}

/* ===== Dropdown Data ===== */
const MACHINES = { Simplex: ['S2', ']()
