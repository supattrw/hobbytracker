const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// --- tiny static file server, so fetch('navbar.html') works exactly
// like it did under Live Server (fetch is unreliable over file://) ---
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
      if (req.url === '/') filePath = path.join(__dirname, 'index.html');

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
  const port = await startServer();

  Menu.setApplicationMenu(null); // removes the File/Edit/View/Window bar

  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    // icon: path.join(__dirname, 'images/icon.png'), // add an icon file and uncomment when ready
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