import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import Store from 'electron-store';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const store = new Store();
const isDev = !app.isPackaged;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 700,
    minHeight: 500,
    frame: false,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  isDev
    ? win.loadURL('http://localhost:5173')
    : win.loadFile(path.join(__dirname, '../dist/index.html'));
}

// IPC handlers
ipcMain.handle('store-get', (_, key) => store.get(key));
ipcMain.handle('store-set', (_, key, value) => store.set(key, value));
ipcMain.handle('store-delete', (_, key) => store.delete(key));

ipcMain.handle('dialog-open-file', async (_, filters) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters || [{ name: 'Text Files', extensions: ['txt'] }, { name: 'All Files', extensions: ['*'] }]
  });
  if (!canceled) {
    return filePaths[0];
  }
  return null;
});

ipcMain.handle('dialog-save-file', async (_, defaultPath, filters) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath,
    filters: filters || [{ name: 'Text Files', extensions: ['txt'] }, { name: 'All Files', extensions: ['*'] }]
  });
  if (!canceled) {
    return filePath;
  }
  return null;
});

ipcMain.handle('fs-read-file', async (_, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('Failed to read file:', error);
    return null;
  }
});

const fileWatchers = new Map();
const savingFiles = new Set();

ipcMain.handle('fs-write-file', async (_, filePath, content) => {
  try {
    savingFiles.add(filePath);
    fs.writeFileSync(filePath, content, 'utf-8');
    setTimeout(() => savingFiles.delete(filePath), 500);
    return true;
  } catch (error) {
    console.error('Failed to write file:', error);
    savingFiles.delete(filePath);
    return false;
  }
});

ipcMain.on('watch-file', (e, filePath) => {
  if (fileWatchers.has(filePath)) return;
  try {
    const watcher = fs.watch(filePath, (eventType) => {
      if (eventType === 'change' && !savingFiles.has(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          e.sender.send('file-changed', { filePath, content });
        } catch (err) {
          console.error('Error reading changed file:', err);
        }
      }
    });
    fileWatchers.set(filePath, watcher);
  } catch (error) {
    console.error('Failed to watch file:', error);
  }
});

ipcMain.on('unwatch-file', (e, filePath) => {
  if (fileWatchers.has(filePath)) {
    fileWatchers.get(filePath).close();
    fileWatchers.delete(filePath);
  }
});

ipcMain.handle('dialog-show-message', async (_, options) => {
  const { response } = await dialog.showMessageBox(options);
  return response;
});

ipcMain.on('window-minimize', (e) => BrowserWindow.fromWebContents(e.sender).minimize());
ipcMain.on('window-maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on('window-close', (e) => BrowserWindow.fromWebContents(e.sender).close());

ipcMain.on('show-item-in-folder', (e, filePath) => {
  shell.showItemInFolder(filePath);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
