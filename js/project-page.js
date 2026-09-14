// js/project-page.js
// Shared by crochet.html, nails-art.html, ceramic.html, accessories-making.html
// Each of those pages sets <body data-category="..."> to say which one it is.

document.addEventListener('DOMContentLoaded', async () => {
  const category = document.body.dataset.category;
  if (!category || !window.projectAPI) return;

  await loadAndRender(category);

  const editBtn = document.querySelector('#edit-project-btn');
  if (editBtn) {
    editBtn.addEventListener('click', async () => {
      const projects = await window.projectAPI.getProjects();
      const existing = projects[category]?.latest;
      if (!existing) return;

      window.openProjectModal({
        mode: 'edit',
        category,
        existing,
        onSaved: () => loadAndRender(category),
      });
    });
  }
});

async function loadAndRender(category) {
  const projects = await window.projectAPI.getProjects();
  renderProjectPage(projects[category]);
}

function renderProjectPage(data) {
  const imageEl = document.querySelector('.show-off-image');
  const titleEl = document.querySelector('.project-details h1');
  const statusListEl = document.querySelector('.project-details ul');
  const descEl = document.querySelector('.project-details p');
  const howtoEl = document.querySelector('.project-details .how-to');
  const galleryEl = document.querySelector('.image-container');
  const editBtn = document.querySelector('#edit-project-btn');

  if (!data || !data.latest) {
    titleEl.textContent = 'No project logged yet';
    descEl.textContent = '';
    if (howtoEl) howtoEl.textContent = '';
    imageEl.style.display = 'none';
    statusListEl.innerHTML = '';
    galleryEl.innerHTML = '';
    if (editBtn) editBtn.style.display = 'none';
    return;
  }

  imageEl.src = data.latest.image;
  imageEl.alt = data.latest.title;
  imageEl.style.display = 'block';
  titleEl.textContent = data.latest.title;
  descEl.textContent = data.latest.description;
  if (howtoEl) howtoEl.textContent = data.latest.howto || '';
  if (editBtn) editBtn.style.display = 'inline-block';

  statusListEl.innerHTML = '';
  (data.latest.status || []).forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.label}: ${item.value}`;
    statusListEl.appendChild(li);
  });

  galleryEl.innerHTML = '';
  (data.history || []).forEach(item => {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || '';
    galleryEl.appendChild(img);
  });

  

  // newly-inserted images need the click-to-enlarge listener attached
  if (window.initImageZoom) window.initImageZoom();
}