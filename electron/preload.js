const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('doragonAPI', {
  platform: process.platform,
  version: '1.0.0',
  isElectron: true,
  // User Session Persistence API
  getUserSession: () => ipcRenderer.invoke('session:get'),
  saveUserSession: (user) => ipcRenderer.invoke('session:set', user),
  clearUserSession: () => ipcRenderer.invoke('session:clear'),
  // Auto-Updater API
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdaterStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
});
