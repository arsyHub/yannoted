const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key) => ipcRenderer.invoke('store-delete', key),
  openFileDialog: () => ipcRenderer.invoke('dialog-open-file'),
  saveFileDialog: (defaultPath) => ipcRenderer.invoke('dialog-save-file', defaultPath),
  readFile: (path) => ipcRenderer.invoke('fs-read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('fs-write-file', path, content),
  watchFile: (path) => ipcRenderer.send('watch-file', path),
  unwatchFile: (path) => ipcRenderer.send('unwatch-file', path),
  openFileLocation: (path) => ipcRenderer.send('show-item-in-folder', path),
  onFileChanged: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('file-changed', listener);
    return () => ipcRenderer.removeListener('file-changed', listener);
  },
  showMessage: (options) => ipcRenderer.invoke('dialog-show-message', options),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
});
