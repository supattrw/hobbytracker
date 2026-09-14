// js/project-modal.js
// Builds and controls the "Create / Edit project" popup, reused across pages.

let modalMode = 'create'; // 'create' | 'edit'
let modalOnSaved = null;

function ensureModalExists() {
  if (document.querySelector('#project-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'project-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <button type="button" class="modal-close" aria-label="Close">&times;</button>
      <h1 id="modal-title">Log a new project</h1>

      <form id="modal-project-form" class="project-form">
        <label id="modal-category-label">
          Which hobby is this?
          <select id="modal-category-select" required>
            <option value="" disabled selected>Choose a category</option>
            <option value="crochet">Crochet</option>
            <option value="nails-art">Nails Art</option>
            <option value="ceramic">Ceramic</option>
            <option value="accessories-making">Accessories Making</option>
          </select>
        </label>

        <label>
          Project title
          <input type="text" id="modal-title-input" placeholder="e.g. This is my latest work" required>
        </label>

        <div class="status-fields">
          <p class="field-group-label">Status</p>
          <div id="modal-status-rows"></div>
          <button type="button" id="modal-add-status-row" class="secondary-btn">+ Add status field</button>
        </div>

        <label>
          Description
          <textarea id="modal-description-input" rows="2" placeholder="Tell the story behind this project..." required></textarea>
        </label>

        <label>
          How to
          <textarea id="modal-howto-input" rows="4" placeholder="How to make this project..."></textarea>
        </label>

        <label>
          Photo <span id="modal-photo-hint" class="field-hint"></span>
          <input type="file" id="modal-image-input" accept="image/*">
        </label>
        <img id="modal-image-preview" class="image-preview" style="display:none;" alt="Preview of selected photo">

        <button type="submit" class="primary-btn" id="modal-submit-btn">Save project</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeProjectModal();
  });
  overlay.querySelector('.modal-close').addEventListener('click', closeProjectModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectModal();
  });

  overlay.querySelector('#modal-add-status-row').addEventListener('click', () => addModalStatusRow());

  overlay.querySelector('#modal-image-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = overlay.querySelector('#modal-image-preview');
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  });

  overlay.querySelector('#modal-project-form').addEventListener('submit', handleModalSubmit);
}

function addModalStatusRow(label = '', value = '') {
  const container = document.querySelector('#modal-status-rows');
  const row = document.createElement('div');
  row.className = 'status-row';
  row.innerHTML = `
    <input type="text" class="status-label" placeholder="Label (e.g. Time)" value="${label}">
    <input type="text" class="status-value" placeholder="Value (e.g. 2-3 weeks)" value="${value}">
    <button type="button" class="remove-row-btn" aria-label="Remove field">&times;</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

// options = { mode: 'create' | 'edit', category, existing, onSaved }
function openProjectModal(options = {}) {
  const { mode = 'create', category = '', existing = null, onSaved = null } = options;
  ensureModalExists();
  modalMode = mode;
  modalOnSaved = onSaved;

  const overlay = document.querySelector('#project-modal-overlay');
  const title = overlay.querySelector('#modal-title');
  const categoryLabel = overlay.querySelector('#modal-category-label');
  const categorySelect = overlay.querySelector('#modal-category-select');
  const titleInput = overlay.querySelector('#modal-title-input');
  const descInput = overlay.querySelector('#modal-description-input');
  const howtoInput = overlay.querySelector('#modal-howto-input');
  const statusRows = overlay.querySelector('#modal-status-rows');
  const imageInput = overlay.querySelector('#modal-image-input');
  const imagePreview = overlay.querySelector('#modal-image-preview');
  const photoHint = overlay.querySelector('#modal-photo-hint');
  const submitBtn = overlay.querySelector('#modal-submit-btn');

  statusRows.innerHTML = '';
  howtoInput.value = '';
  imageInput.value = '';
  imagePreview.style.display = 'none';
  submitBtn.disabled = false;

  if (mode === 'edit') {
    title.textContent = 'Edit project';
    categoryLabel.style.display = 'none';
    categorySelect.value = category;
    categorySelect.disabled = true;
    titleInput.value = existing?.title || '';
    descInput.value = existing?.description || '';
    howtoInput.value = existing?.howto || '';
    (existing?.status || []).forEach(item => addModalStatusRow(item.label, item.value));
    if (!existing?.status?.length) { addModalStatusRow(); addModalStatusRow(); }
    imageInput.required = false;
    photoHint.textContent = '(leave empty to keep the current photo)';
    if (existing?.image) {
      imagePreview.src = existing.image;
      imagePreview.style.display = 'block';
    }
    submitBtn.textContent = 'Save changes';
  } else {
    title.textContent = 'Log a new project';
    categoryLabel.style.display = '';
    categorySelect.disabled = false;
    categorySelect.value = category || '';
    titleInput.value = '';
    descInput.value = '';
    howtoInput.value = '';
    addModalStatusRow();
    addModalStatusRow();
    imageInput.required = true;
    photoHint.textContent = '';
    submitBtn.textContent = 'Save project';
  }

  overlay.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeProjectModal() {
  const overlay = document.querySelector('#project-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
}

async function handleModalSubmit(e) {
  e.preventDefault();

  if (!window.projectAPI) {
    alert('Saving projects only works inside the desktop app.');
    return;
  }

  const overlay = document.querySelector('#project-modal-overlay');
  const category = overlay.querySelector('#modal-category-select').value;
  const title = overlay.querySelector('#modal-title-input').value.trim();
  const description = overlay.querySelector('#modal-description-input').value.trim();
  const howto = overlay.querySelector('#modal-howto-input').value.trim();
  const file = overlay.querySelector('#modal-image-input').files[0];
  const submitBtn = overlay.querySelector('#modal-submit-btn');

  if (!category) {
    alert('Please choose a category.');
    return;
  }

  const status = Array.from(overlay.querySelectorAll('#modal-status-rows .status-row'))
    .map(row => ({
      label: row.querySelector('.status-label').value.trim(),
      value: row.querySelector('.status-value').value.trim(),
    }))
    .filter(item => item.label && item.value);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const payload = { category, title, status, description, howto, imagePath: file ? window.projectAPI.getFilePath(file) : null };
    const updated = modalMode === 'edit'
      ? await window.projectAPI.updateProject(payload)
      : await window.projectAPI.saveProject(payload);

    closeProjectModal();
    if (modalOnSaved) modalOnSaved(category, updated);
  } catch (err) {
    console.error('Failed to save project:', err);
    alert('Something went wrong saving your project.');
    submitBtn.disabled = false;
    submitBtn.textContent = modalMode === 'edit' ? 'Save changes' : 'Save project';
  }
}

window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;