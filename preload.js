const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  open: () => ipcRenderer.invoke('file:open'),
  readPath: p => ipcRenderer.invoke('file:readPath', p),
  showInFolder: p => ipcRenderer.invoke('file:showInFolder', p),
  getFileToOpen: () => ipcRenderer.invoke('app:fileToOpen'),
  write: (d, p) => ipcRenderer.invoke('file:write', d, p),
  writeSync: (d, p) => ipcRenderer.sendSync('file:writeSync', d, p),
  saveAs: (d, n, c) => ipcRenderer.invoke('file:saveAs', d, n, c),
  deleteFile: p => ipcRenderer.invoke('file:delete', p),
  renameFile: (o, n) => ipcRenderer.invoke('file:rename', o, n),
  createInitialProject: (t, c, d) => ipcRenderer.invoke('file:createInitialProject', t, c, d),
  pdf: (n, s) => ipcRenderer.invoke('pdf:export', n, s),
  onMenu: cb => ipcRenderer.on('menu', (e, c) => cb(c)),
  onCloseRequested: cb => ipcRenderer.on('app:close-requested', () => cb()),
  confirmClose: opts => ipcRenderer.invoke('app:confirmClose', opts),
  forceClose: () => ipcRenderer.send('app:forceClose'),
  onExternalChange: cb => ipcRenderer.on('file:external-change', (e, d) => cb(d)),
  openExternal: url => ipcRenderer.invoke('app:openExternal', url),
  checkUpdate: () => ipcRenderer.invoke('updater:check'),
  installUpdateNow: () => ipcRenderer.invoke('updater:installNow'),
  onUpdateStatus: cb => ipcRenderer.on('updater:status', (e, d) => cb(d))
});
