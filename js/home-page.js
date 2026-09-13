// js/home-page.js
// Shows whichever project (across all categories) was updated most recently

document.addEventListener('DOMContentLoaded', () => {
  renderLatestWork();

  const uploadBtn = document.querySelector('#upload-latest-btn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      window.openProjectModal({
        mode: 'create',
        onSaved: () => renderLatestWork(),
      });
    });
  }
});

async function renderLatestWork() {
  const card = document.querySelector('#latest-work-card');
  if (!card || !window.projectAPI) return;

  const projects = await window.projectAPI.getProjects();

  let newest = null;
  let newestCategory = null;

  Object.entries(projects).forEach(([category, data]) => {
    if (data.latest && (!newest || new Date(data.latest.date) > new Date(newest.date))) {
      newest = data.latest;
      newestCategory = category;
    }
  });

  if (!newest) {
    card.innerHTML = '<p>No projects logged yet. Click "Upload latest project" to add your first one!</p>';
    return;
  }

  card.innerHTML = `
    <span class="latest-work-label">Latest work &mdash; ${formatCategory(newestCategory)}</span>
    <img src="${newest.image}" alt="${newest.title}" class="show-off-image">
    <h2>${newest.title}</h2>
    <a href="${newestCategory}.html" class="secondary-btn">View project</a>
  `;

  if (window.initImageZoom) window.initImageZoom();
}

function formatCategory(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}