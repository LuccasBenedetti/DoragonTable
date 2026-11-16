const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Set isolated user data folder to avoid cache permission conflicts
app.setPath('userData', path.join(app.getPath('appData'), 'DoragonTable'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0d0f12',
    title: 'DoragonTable — Virtual Tabletop & AI Master',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const distHtml = path.join(__dirname, '../dist/index.html');
  const isDevExplicit = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  if (isDevExplicit) {
    const devUrl = 'http://localhost:5173';
    mainWindow.loadURL(devUrl).catch(() => {
      setTimeout(() => mainWindow.loadURL(devUrl), 1000);
    });
  } else if (fs.existsSync(distHtml)) {
    mainWindow.loadFile(distHtml);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
