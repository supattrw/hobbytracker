document.addEventListener('DOMContentLoaded', () => {
  loadNavbar();
  setFooterYear();
});

function loadNavbar() {
  const placeholder = document.querySelector('#navbar-placeholder');
  if (!placeholder) return;

  fetch('navbar.html')
    .then(res => res.text())
    .then(html => {
      placeholder.innerHTML = html;
      // these depend on the navbar existing, so run them after injection
      initMobileMenu();
      highlightActiveLink();
    })
    .catch(err => console.error('Failed to load navbar:', err));
}

function initMobileMenu() {
  const menuBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

function highlightActiveLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

function setFooterYear() {
  const yearEl = document.querySelector('#current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}