const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Set isolated user data folder to avoid cache permission conflicts
const userDataPath = path.join(app.getPath('appData'), 'DoragonTable');
app.setPath('userData', userDataPath);
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const sessionFilePath = path.join(userDataPath, 'user_session.json');
const logFilePath = path.join(__dirname, 'renderer.log');

function logToFile(prefix, message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] [${prefix}] ${typeof message === 'object' ? JSON.stringify(message) : message}\n`);
  } catch {}
}

let mainWindow = null;

// --- IPC: USER SESSION PERSISTENCE ---
ipcMain.handle('session:get', async () => {
  try {
    if (fs.existsSync(sessionFilePath)) {
      const data = fs.readFileSync(sessionFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    logToFile('SESSION_ERROR', `Failed to read session: ${err.message}`);
  }
  return null;
});

ipcMain.handle('session:set', async (event, user) => {
  try {
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(sessionFilePath, JSON.stringify(user, null, 2), 'utf-8');
    logToFile('SESSION_SAVED', `User ${user?.username} saved successfully.`);
    return true;
  } catch (err) {
    logToFile('SESSION_ERROR', `Failed to save session: ${err.message}`);
    return false;
  }
});

ipcMain.handle('session:clear', async () => {
  try {
    if (fs.existsSync(sessionFilePath)) {
      fs.unlinkSync(sessionFilePath);
      logToFile('SESSION_CLEARED', 'Session file removed.');
    }
    return true;
  } catch (err) {
    logToFile('SESSION_ERROR', `Failed to clear session: ${err.message}`);
    return false;
  }
});

// --- AUTO-UPDATER CONFIGURATION ---
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('checking-for-update', () => {
  logToFile('UPDATER', 'Checking for update...');
  mainWindow?.webContents.send('updater:status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  logToFile('UPDATER', `Update available: v${info.version}`);
  mainWindow?.webContents.send('updater:status', { status: 'available', info });
});

autoUpdater.on('update-not-available', (info) => {
  logToFile('UPDATER', 'App is up to date.');
  mainWindow?.webContents.send('updater:status', { status: 'not-available', info });
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('updater:status', {
    status: 'downloading',
    percent: Math.round(progressObj.percent),
    transferred: progressObj.transferred,
    total: progressObj.total,
  });
});

autoUpdater.on('update-downloaded', (info) => {
  logToFile('UPDATER', `Update downloaded: v${info.version}`);
  mainWindow?.webContents.send('updater:status', { status: 'downloaded', info });
});

autoUpdater.on('error', (err) => {
  logToFile('UPDATER_ERROR', err?.message || String(err));
  mainWindow?.webContents.send('updater:status', { status: 'error', error: err?.message || String(err) });
});

ipcMain.handle('updater:check', async () => {
  if (app.isPackaged) {
    try {
      const res = await autoUpdater.checkForUpdates();
      return { success: true, updateInfo: res?.updateInfo };
    } catch (err) {
      logToFile('UPDATER_ERROR', `Manual check failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  } else {
    return { success: true, dev: true, message: 'Modo dev: auto-updater ativo na versão empacotada.' };
  }
});

ipcMain.handle('updater:install', () => {
  logToFile('UPDATER', 'Restarting and installing update...');
  autoUpdater.quitAndInstall();
});

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

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    logToFile(`CONSOLE_${level}`, `${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    logToFile('FAIL_LOAD', `${code} ${desc} ${url}`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();

    // Check for updates on startup if packaged
    if (app.isPackaged) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify().catch((err) => {
          logToFile('UPDATER_INIT', `Initial check error: ${err.message}`);
        });
      }, 4000);
    }
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
