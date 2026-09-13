const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const FILES_DIR = path.join(ROOT_DIR, 'files');

const DEFAULT_PROJECTS = {
  'crochet': { latest: null, history: [] },
  'nails-art': { latest: null, history: [] },
  'ceramic': { latest: null, history: [] },
  'accessories-making': { latest: null, history: [] },
};

function ensureStorageExists() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(FILES_DIR, { recursive: true });
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEFAULT_PROJECTS, null, 2));
  }
}

function loadProjects() {
  ensureStorageExists();
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
  } catch (err) {
    console.error('Failed to read projects.json, resetting to defaults:', err);
    return { ...DEFAULT_PROJECTS };
  }
}

function saveProjects(data) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

// --- IPC: bridge for the renderer (via preload.js) to read/write project data ---
ipcMain.handle('get-projects', () => {
  return loadProjects();
});

ipcMain.handle('save-project', (event, payload) => {
  const { category, title, status, description, imagePath } = payload;
  const projects = loadProjects();

  if (!projects[category]) {
    projects[category] = { latest: null, history: [] };
  }

  // the current "latest" becomes the newest item in the history row
  if (projects[category].latest) {
    projects[category].history.unshift(projects[category].latest);
  }

  let savedImagePath = projects[category].latest ? projects[category].latest.image : null;

  if (imagePath) {
    const categoryDir = path.join(FILES_DIR, category);
    fs.mkdirSync(categoryDir, { recursive: true });
    const ext = path.extname(imagePath) || '.jpg';
    const filename = `${Date.now()}${ext}`;
    fs.copyFileSync(imagePath, path.join(categoryDir, filename));
    savedImagePath = `files/${category}/${filename}`;
  }

  projects[category].latest = {
    title,
    status,
    description,
    image: savedImagePath,
    date: new Date().toISOString(),
  };

  saveProjects(projects);
  return projects[category];
});

// Edits the CURRENT latest project in place — does not push anything into history.
ipcMain.handle('update-project', (event, payload) => {
  const { category, title, status, description, imagePath } = payload;
  const projects = loadProjects();

  if (!projects[category] || !projects[category].latest) {
    throw new Error(`No existing project to edit for category: ${category}`);
  }

  let savedImagePath = projects[category].latest.image;

  if (imagePath) {
    const categoryDir = path.join(FILES_DIR, category);
    fs.mkdirSync(categoryDir, { recursive: true });
    const ext = path.extname(imagePath) || '.jpg';
    const filename = `${Date.now()}${ext}`;
    fs.copyFileSync(imagePath, path.join(categoryDir, filename));
    savedImagePath = `files/${category}/${filename}`;
  }

  projects[category].latest = {
    title,
    status,
    description,
    image: savedImagePath,
    date: new Date().toISOString(),
  };

  saveProjects(projects);
  return projects[category];
});

// --- tiny static file server, so fetch() calls work exactly
// like they did under Live Server (fetch is unreliable over file://) ---
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(ROOT_DIR, decodeURIComponent(req.url.split('?')[0]));
      if (req.url === '/') filePath = path.join(ROOT_DIR, 'index.html');

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
      });
    });

    // port 0 = let the OS pick a free port
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

async function createWindow() {
  ensureStorageExists();
  const port = await startServer();

  Menu.setApplicationMenu(null); // removes the File/Edit/View/Window bar

  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(ROOT_DIR, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // icon: path.join(ROOT_DIR, 'images/icon.png'), // add an icon file and uncomment when ready
  });

  win.loadURL(`http://127.0.0.1:${port}/index.html`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});