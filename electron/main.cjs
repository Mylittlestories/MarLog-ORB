const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Skip squirrel startup gracefully if not installed
try {
  if (require('electron-squirrel-startup')) app.quit();
} catch (e) { /* not installed, continue normally */ }

const APP_NAME = 'MarLog ORB';
const APP_VERSION = '2.1.3';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    center: true,
    title: `${APP_NAME} v${APP_VERSION} — Oil Record Book`,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Dev in dev mode
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: prevent opening external URLs in-app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Entry', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-action', 'new-entry') },
        { type: 'separator' },
        { label: 'Export PDF', accelerator: 'CmdOrCtrl+Shift+P', click: () => mainWindow.webContents.send('menu-action', 'export-pdf') },
        { label: 'Export JSON', click: () => mainWindow.webContents.send('menu-action', 'export-json') },
        { label: 'Import JSON', click: () => mainWindow.webContents.send('menu-action', 'import-json') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { label: 'Edit', submenu: [
      { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
    ]},
    { label: 'View', submenu: [
      { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }, { type: 'separator' },
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' },
      { role: 'togglefullscreen' },
    ]},
    { label: 'Window', submenu: [
      { role: 'minimize' }, { role: 'close' },
    ]},
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MarLog ORB',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About MarLog ORB',
              message: `${APP_NAME} v${APP_VERSION}`,
              detail: 'MARPOL Annex I Compliant Oil Record Book\nFor Shipboard Engineers\n\nCompliant with MARPOL 73/78, Annex I, Regulation 17',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC: Save file dialog
ipcMain.handle('save-file', async (_event, { content, suggestedName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save File',
    defaultPath: suggestedName,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, content, 'utf8');
      return { success: true, path: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Save cancelled' };
});

// IPC: Open file dialog
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Data',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf8');
      return { success: true, content, path: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Open cancelled' };
});

// App lifecycle
app.whenReady().then(() => {
  createMenu();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  if (mainWindow) mainWindow.destroy();
});
