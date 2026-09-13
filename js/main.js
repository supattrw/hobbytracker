// js/main.js
// Shared logic that runs on every page

document.addEventListener('DOMContentLoaded', () => {
  loadNavbar();
  setFooterYear();
  initImageZoom();
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

function initImageZoom() {
  const images = document.querySelectorAll('main img');
  if (!images.length) return;

  let overlay = document.querySelector('.image-overlay');
  let overlayImg;

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    overlayImg = document.createElement('img');
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => overlay.classList.remove('open'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });
  } else {
    overlayImg = overlay.querySelector('img');
  }

  images.forEach(img => {
    if (img.dataset.zoomBound) return; // avoid double-binding on re-render
    img.dataset.zoomBound = 'true';
    img.addEventListener('click', () => {
      overlayImg.src = img.src;
      overlayImg.alt = img.alt;
      overlay.classList.add('open');
    });
  });
}

// exposed so page-specific scripts can re-run it after inserting new images
window.initImageZoom = initImageZoom;