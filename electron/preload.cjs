// Preload script for Electron IPC communication
// Runs in a separate context with access to Node.js APIs
// Exposes a safe API to the renderer process via contextBridge

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: () => ipcRenderer.invoke('open-file'),
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
  },
  getAppVersion: () => '2.1.2',
  platform: process.platform,
});
