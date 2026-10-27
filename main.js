const { app, BrowserWindow, Menu, dialog, ipcMain, nativeTheme, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs'), path = require('path');
let win;
let forceQuit = false;
let fileToOpenOnStartup = null;
if (process.argv.length >= 2) {
  const arg = process.argv[process.argv.length - 1];
  if (arg && (arg.endsWith('.guion') || arg.endsWith('.json')) && fs.existsSync(arg)) {
    fileToOpenOnStartup = arg;
  }
}
const FILT = [{ name: 'Proyecto de GuionLab', extensions: ['guion', 'json'] }];
const send = c => win && win.webContents.send('menu', c);
const safe = s => String(s || 'Proyecto').replace(/[\\/:*?"<>|]/g, '').trim() || 'Proyecto';

function isValidProjectPath(p) {
  if (typeof p !== 'string' || !p.trim()) return false;
  const ext = path.extname(p).toLowerCase();
  return ext === '.guion' || ext === '.json';
}

function createWindow() {
  win = new BrowserWindow({
    width: 1180, height: 820, minWidth: 520, minHeight: 500,
    title: 'GuionLab',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#15181f' : '#edf1f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.on('will-attach-webview', e => e.preventDefault());

  win.once('ready-to-show', () => {
    if (win && !win.isDestroyed()) {
      win.show();
      win.focus();
      setTimeout(() => {
        if (app.isPackaged) {
          checkAndNotifyUpdate(false);
        }
      }, 3500);
    }
  });

  win.on('close', e => {
    if (forceQuit) {
      stopFileWatcher();
      return;
    }
    e.preventDefault();
    if (win && win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send('app:close-requested');
    } else {
      forceQuit = true;
      if (win) win.close();
    }
  });
}

const menu = [
  ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
  { label: 'Archivo', submenu: [
    { label: 'Mis proyectos', accelerator: 'CmdOrCtrl+Shift+H', click: () => send('home') },
    { type: 'separator' },
    { label: 'Proyecto nuevo', accelerator: 'CmdOrCtrl+N', click: () => send('new') },
    { label: 'Abrir…', accelerator: 'CmdOrCtrl+O', click: () => send('open') },
    { type: 'separator' },
    { label: 'Guardar', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
    { label: 'Guardar como…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('saveas') },
    { type: 'separator' },
    { label: 'Exportar guion en PDF…', accelerator: 'CmdOrCtrl+Shift+P', click: () => send('pdf-script') },
    { label: 'Exportar dossier en PDF…', accelerator: 'CmdOrCtrl+P', click: () => send('pdf') },
    { type: 'separator' },
    { label: 'Configuración…', accelerator: 'CmdOrCtrl+,', click: () => send('config') },
    { type: 'separator' },
    { label: 'Salir', accelerator: 'CmdOrCtrl+Q', click: () => { if (win && !win.isDestroyed()) win.close(); } }] },
  { label: 'Edición', submenu: [
    { role: 'undo', label: 'Deshacer' }, { role: 'redo', label: 'Rehacer' }, { type: 'separator' },
    { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' },
    { role: 'selectAll', label: 'Seleccionar todo' }] },
  { label: 'Ver', submenu: [
    { role: 'resetZoom', label: 'Tamaño normal' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' },
    { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' }] },
  { label: 'Ayuda', submenu: [
    { label: 'Guía y ayuda…', accelerator: 'F1', click: () => send('help') },
    { label: 'Buscar actualizaciones…', click: () => checkAndNotifyUpdate(true) },
    { type: 'separator' },
    { label: 'Descargar Google Drive para ordenadores…', click: () => shell.openExternal('https://www.google.com/drive/download/') },
    { label: 'Descargar Dropbox para ordenadores…', click: () => shell.openExternal('https://www.dropbox.com/install') },
    { label: 'Abrir Microsoft OneDrive en la web…', click: () => shell.openExternal('https://onedrive.live.com') }
  ]}
];

let activeFilePath = null;
let fileWatcher = null;
let lastKnownContent = null;
let watchDebounceTimer = null;

function stopFileWatcher() {
  if (fileWatcher) {
    try { fileWatcher.close(); } catch (e) {}
    fileWatcher = null;
  }
}

function startFileWatcher(targetPath) {
  stopFileWatcher();
  if (!targetPath || !isValidProjectPath(targetPath) || !fs.existsSync(targetPath)) return;
  
  try {
    lastKnownContent = fs.readFileSync(targetPath, 'utf8');
  } catch (e) {
    lastKnownContent = null;
  }

  try {
    fileWatcher = fs.watch(targetPath, eventType => {
      if (eventType === 'change' || eventType === 'rename') {
        clearTimeout(watchDebounceTimer);
        watchDebounceTimer = setTimeout(() => {
          checkExternalChange(targetPath);
        }, 400);
      }
    });
    fileWatcher.on('error', () => {
      stopFileWatcher();
    });
  } catch (err) {}
}

function checkExternalChange(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  try {
    const current = fs.readFileSync(targetPath, 'utf8');
    if (lastKnownContent !== null && current !== lastKnownContent) {
      lastKnownContent = current;
      if (win && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send('file:external-change', { path: targetPath });
      }
    }
  } catch (e) {}
}

ipcMain.handle('app:fileToOpen', () => {
  const p = fileToOpenOnStartup;
  fileToOpenOnStartup = null;
  if (p && isValidProjectPath(p) && fs.existsSync(p)) {
    try {
      activeFilePath = path.resolve(p);
      const content = fs.readFileSync(p, 'utf8');
      lastKnownContent = content;
      startFileWatcher(activeFilePath);
      return { path: p, data: JSON.parse(content) };
    }
    catch (e) { return null; }
  }
  return null;
});

ipcMain.handle('file:readPath', async (e, p) => {
  if (!isValidProjectPath(p) || !fs.existsSync(p)) return { error: 'not_found' };
  try {
    activeFilePath = path.resolve(p);
    const content = fs.readFileSync(p, 'utf8');
    lastKnownContent = content;
    startFileWatcher(activeFilePath);
    return { path: p, data: JSON.parse(content) };
  }
  catch (err) { return { error: 'invalid', message: err.message }; }
});

ipcMain.handle('file:showInFolder', (e, p) => {
  if (isValidProjectPath(p) && fs.existsSync(p)) {
    shell.showItemInFolder(path.resolve(p));
    return true;
  }
  return false;
});

ipcMain.handle('file:open', async () => {
  const r = await dialog.showOpenDialog(win, { filters: FILT, properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  if (!isValidProjectPath(p)) return null;
  try {
    activeFilePath = path.resolve(p);
    const content = fs.readFileSync(p, 'utf8');
    lastKnownContent = content;
    startFileWatcher(activeFilePath);
    return { path: p, data: JSON.parse(content) };
  }
  catch (e) { dialog.showErrorBox('No se pudo abrir', 'El archivo no es un proyecto válido.'); return null; }
});

ipcMain.handle('file:write', (e, data, p) => {
  const target = (p && isValidProjectPath(p)) ? path.resolve(p) : activeFilePath;
  if (!target || !isValidProjectPath(target) || typeof data !== 'string') return false;
  try {
    lastKnownContent = data;
    fs.writeFileSync(target, data, 'utf8');
    activeFilePath = target;
    startFileWatcher(target);
    return true;
  } catch (x) { return false; }
});

ipcMain.on('file:writeSync', (e, data, p) => {
  const target = (p && isValidProjectPath(p)) ? path.resolve(p) : activeFilePath;
  if (!target || !isValidProjectPath(target) || typeof data !== 'string') {
    e.returnValue = false;
    return;
  }
  try {
    lastKnownContent = data;
    fs.writeFileSync(target, data, 'utf8');
    activeFilePath = target;
    startFileWatcher(target);
    e.returnValue = true;
  } catch (x) { e.returnValue = false; }
});

ipcMain.handle('app:confirmClose', async (e, opts) => {
  const { isDraft, title, filePath } = opts || {};
  const safeTitle = (title || '').trim() || (isDraft ? 'Nuevo proyecto' : 'Proyecto sin título');

  if (isDraft) {
    const res = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['Guardar como…', 'Cerrar sin guardar', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
      title: 'Guardar borrador',
      message: `El proyecto «${safeTitle}» es un borrador local y no está guardado en un archivo.`,
      detail: '¿Deseas guardarlo en un archivo .guion nuevo antes de salir?'
    });
    if (res.response === 0) return 'saveas';
    if (res.response === 1) return 'dontsave';
    return 'cancel';
  } else {
    const res = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['Guardar', 'Cerrar sin guardar', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
      title: 'Guardar cambios',
      message: `¿Deseas guardar el proyecto «${safeTitle}» en su archivo antes de salir?`,
      detail: filePath ? `Archivo:\n${filePath}` : ''
    });
    if (res.response === 0) return 'save';
    if (res.response === 1) return 'dontsave';
    return 'cancel';
  }
});

ipcMain.on('app:forceClose', () => {
  forceQuit = true;
  if (win && !win.isDestroyed()) {
    win.close();
  }
  app.quit();
});

function getDocumentsGuionLabPath() {
  try {
    const docs = app.getPath('documents');
    const target = path.join(docs, 'GuionLab');
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    return target;
  } catch (e) {
    return app.getPath('documents');
  }
}

function getGoogleDrivePath() {
  for (let code = 71; code <= 90; code++) {
    const letter = String.fromCharCode(code) + ':\\';
    try {
      if (fs.existsSync(letter)) {
        const subSpanish = path.join(letter, 'Mi unidad');
        if (fs.existsSync(subSpanish)) return subSpanish;
        const subEnglish = path.join(letter, 'My Drive');
        if (fs.existsSync(subEnglish)) return subEnglish;
        if (fs.existsSync(path.join(letter, '.drivefs'))) return letter;
      }
    } catch (e) {}
  }

  try {
    const home = app.getPath('home');
    // macOS CloudStorage check
    const cloudStorage = path.join(home, 'Library', 'CloudStorage');
    if (fs.existsSync(cloudStorage)) {
      const items = fs.readdirSync(cloudStorage);
      for (const item of items) {
        if (item.toLowerCase().startsWith('googledrive')) {
          const full = path.join(cloudStorage, item);
          const sub1 = path.join(full, 'Mi unidad');
          if (fs.existsSync(sub1)) return sub1;
          const sub2 = path.join(full, 'My Drive');
          if (fs.existsSync(sub2)) return sub2;
          return full;
        }
      }
    }

    const userPaths = [
      path.join(home, 'Google Drive', 'Mi unidad'),
      path.join(home, 'Google Drive', 'My Drive'),
      path.join(home, 'Google Drive'),
      path.join(home, 'Mi unidad'),
      path.join(home, 'GoogleDrive')
    ];
    for (const p of userPaths) {
      if (fs.existsSync(p)) return p;
    }
  } catch (e) {}

  return null;
}

function getOneDrivePath() {
  const envPaths = [
    process.env.OneDrive,
    process.env.OneDriveConsumer,
    process.env.OneDriveCommercial
  ].filter(Boolean);
  for (const p of envPaths) {
    if (fs.existsSync(p)) return p;
  }
  try {
    const home = app.getPath('home');
    // macOS CloudStorage check
    const cloudStorage = path.join(home, 'Library', 'CloudStorage');
    if (fs.existsSync(cloudStorage)) {
      const items = fs.readdirSync(cloudStorage);
      for (const item of items) {
        if (item.toLowerCase().startsWith('onedrive')) {
          return path.join(cloudStorage, item);
        }
      }
    }
    const odHome = path.join(home, 'OneDrive');
    if (fs.existsSync(odHome)) return odHome;
  } catch (e) {}
  return null;
}

function getDropboxPath() {
  try {
    const home = app.getPath('home');
    // macOS CloudStorage check
    const cloudStorage = path.join(home, 'Library', 'CloudStorage');
    if (fs.existsSync(cloudStorage)) {
      const items = fs.readdirSync(cloudStorage);
      for (const item of items) {
        if (item.toLowerCase().startsWith('dropbox')) {
          return path.join(cloudStorage, item);
        }
      }
    }

    const dbHome = path.join(home, 'Dropbox');
    if (fs.existsSync(dbHome)) return dbHome;

    const localApp = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const infoPath = path.join(localApp, 'Dropbox', 'info.json');
    if (fs.existsSync(infoPath)) {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      const p = info?.personal?.path || info?.business?.path;
      if (p && fs.existsSync(p)) return p;
    }
  } catch (e) {}
  return null;
}

function getCloudSyncPath() {
  // Try Google Drive first, then OneDrive, then Dropbox
  const gdrive = getGoogleDrivePath();
  if (gdrive) return gdrive;
  const onedrive = getOneDrivePath();
  if (onedrive) return onedrive;
  const dropbox = getDropboxPath();
  if (dropbox) return dropbox;
  return null;
}

ipcMain.handle('app:openExternal', (e, url) => {
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle('file:saveAs', async (e, data, name, isCollab) => {
  if (typeof data !== 'string') return null;

  let targetDir;
  if (isCollab) {
    const cloudRoot = getCloudSyncPath();
    if (cloudRoot) {
      const cloudGuionLab = path.join(cloudRoot, 'GuionLab');
      try {
        if (!fs.existsSync(cloudGuionLab)) {
          fs.mkdirSync(cloudGuionLab, { recursive: true });
        }
        targetDir = cloudGuionLab;
      } catch (err) {
        targetDir = cloudRoot;
      }
    } else {
      targetDir = getDocumentsGuionLabPath();
    }
  } else {
    targetDir = getDocumentsGuionLabPath();
  }

  const suggestedFileName = safe(name) + '.guion';
  const defaultPath = path.join(targetDir, suggestedFileName);

  const r = await dialog.showSaveDialog(win, { defaultPath, filters: FILT });
  if (r.canceled || !r.filePath || !isValidProjectPath(r.filePath)) return null;
  try {
    lastKnownContent = data;
    fs.writeFileSync(r.filePath, data, 'utf8');
    activeFilePath = path.resolve(r.filePath);
    startFileWatcher(activeFilePath);
    return r.filePath;
  }
  catch (x) { dialog.showErrorBox('No se pudo guardar', String(x.message)); return null; }
});

ipcMain.handle('file:createInitialProject', async (e, title, isCollab, data) => {
  try {
    let targetDir;
    if (isCollab) {
      const cloudRoot = getCloudSyncPath();
      if (cloudRoot) {
        const cloudGuionLab = path.join(cloudRoot, 'GuionLab');
        try {
          if (!fs.existsSync(cloudGuionLab)) fs.mkdirSync(cloudGuionLab, { recursive: true });
          targetDir = cloudGuionLab;
        } catch (err) {
          targetDir = cloudRoot;
        }
      } else {
        targetDir = getDocumentsGuionLabPath();
      }
    } else {
      targetDir = getDocumentsGuionLabPath();
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const baseName = safe(title || 'Nuevo proyecto');
    let candidate = path.join(targetDir, baseName + '.guion');
    let counter = 2;
    while (fs.existsSync(candidate)) {
      candidate = path.join(targetDir, `${baseName} (${counter}).guion`);
      counter++;
    }

    fs.writeFileSync(candidate, data, 'utf8');
    activeFilePath = path.resolve(candidate);
    lastKnownContent = data;
    startFileWatcher(activeFilePath);
    return { success: true, path: activeFilePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file:rename', async (e, oldPath, newTitle) => {
  if (!isValidProjectPath(oldPath) || !fs.existsSync(oldPath)) {
    return { success: false, error: 'El archivo a renombrar no existe.' };
  }
  try {
    const dir = path.dirname(oldPath);
    const ext = path.extname(oldPath) || '.guion';
    const safeName = safe(newTitle) + ext;
    const targetPath = path.join(dir, safeName);

    if (path.resolve(oldPath).toLowerCase() === path.resolve(targetPath).toLowerCase()) {
      if (oldPath !== targetPath) {
        stopFileWatcher();
        const tmp = targetPath + '.tmp_ren';
        fs.renameSync(oldPath, tmp);
        fs.renameSync(tmp, targetPath);
        activeFilePath = path.resolve(targetPath);
        startFileWatcher(activeFilePath);
      }
      return { success: true, newPath: activeFilePath || targetPath };
    }

    if (fs.existsSync(targetPath)) {
      return { success: false, error: `Ya existe un archivo llamado "${safeName}" en esa carpeta.` };
    }

    stopFileWatcher();
    fs.renameSync(oldPath, targetPath);
    activeFilePath = path.resolve(targetPath);
    startFileWatcher(activeFilePath);
    return { success: true, newPath: activeFilePath };
  } catch (err) {
    if (activeFilePath) startFileWatcher(activeFilePath);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('pdf:export', async (e, name, suffix = 'dossier') => {
  const sfx = safe(suffix || 'dossier');
  const r = await dialog.showSaveDialog(win, { defaultPath: safe(name) + ' - ' + sfx + '.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (r.canceled || !r.filePath || !r.filePath.toLowerCase().endsWith('.pdf')) return null;
  try {
    const buf = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    fs.writeFileSync(r.filePath, buf);
    return r.filePath;
  } catch (x) { dialog.showErrorBox('No se pudo exportar el PDF', String(x.message)); return null; }
});

ipcMain.handle('file:delete', async (e, filePath) => {
  if (!isValidProjectPath(filePath)) return { success: false, error: 'Ruta no válida' };
  try {
    const resolved = path.resolve(filePath);
    if (activeFilePath && path.resolve(activeFilePath) === resolved) {
      stopFileWatcher();
      activeFilePath = null;
      lastKnownContent = null;
    }
    if (fs.existsSync(resolved)) {
      try {
        await shell.trashItem(resolved);
      } catch (trashErr) {
        fs.unlinkSync(resolved);
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = {
  info: m => console.log('[autoUpdater]', m),
  warn: m => console.warn('[autoUpdater]', m),
  error: m => console.error('[autoUpdater]', m)
};

function sendUpdaterStatus(payload) {
  if (win && win.webContents && !win.webContents.isDestroyed()) {
    win.webContents.send('updater:status', payload);
  }
}

function checkAndNotifyUpdate(manual = false) {
  if (!app.isPackaged) {
    if (manual) {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Actualizaciones de GuionLab',
        message: 'Modo desarrollo activo',
        detail: 'Las actualizaciones automáticas se comprueban en la versión instalada de GuionLab (conectada a GitHub Releases).'
      });
    }
    return;
  }
  autoUpdater.checkForUpdates().catch(err => {
    console.warn('[autoUpdater] Error al comprobar actualizaciones:', err.message);
    const msg = String(err && err.message ? err.message : '');
    const isNotFound = msg.includes('404') || msg.includes('latest.yml') || msg.includes('Cannot find') || msg.includes('release');

    if (isNotFound) {
      sendUpdaterStatus({
        status: 'not-available',
        message: `GuionLab está actualizado a la última versión (v${app.getVersion()}).`
      });
      if (manual) {
        dialog.showMessageBox(win, {
          type: 'info',
          title: 'Actualizaciones de GuionLab',
          message: 'GuionLab está al día',
          detail: `Tienes la versión más reciente instalada (v${app.getVersion()}). No hay nuevas actualizaciones publicadas en GitHub.`
        });
      }
      return;
    }

    if (manual) {
      dialog.showMessageBox(win, {
        type: 'warning',
        title: 'Actualizaciones de GuionLab',
        message: 'No se pudo conectar con GitHub Releases',
        detail: 'Comprueba tu conexión a Internet o inténtalo de nuevo más tarde.'
      });
    }
  });
}

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    sendUpdaterStatus({ status: 'checking', message: 'Comprobando si hay actualizaciones…' });
  });

  autoUpdater.on('update-available', info => {
    sendUpdaterStatus({
      status: 'available',
      version: info.version,
      message: `Nueva versión v${info.version} encontrada. Descargando en segundo plano…`
    });
  });

  autoUpdater.on('update-not-available', info => {
    sendUpdaterStatus({
      status: 'not-available',
      version: info.version,
      message: 'GuionLab está actualizado a la última versión.'
    });
  });

  autoUpdater.on('download-progress', progress => {
    sendUpdaterStatus({
      status: 'downloading',
      percent: Math.round(progress.percent || 0),
      message: `Descargando actualización: ${Math.round(progress.percent || 0)}%`
    });
  });

  autoUpdater.on('update-downloaded', info => {
    sendUpdaterStatus({
      status: 'ready',
      version: info.version,
      message: `¡GuionLab v${info.version} listo para instalar!`
    });
    if (win && !win.isDestroyed()) {
      dialog.showMessageBox(win, {
        type: 'info',
        buttons: ['Reiniciar y actualizar ahora', 'Instalar al salir'],
        defaultId: 0,
        cancelId: 1,
        title: 'Actualización lista',
        message: `¡GuionLab v${info.version} se ha descargado correctamente!`,
        detail: '¿Deseas reiniciar la aplicación ahora para instalar la nueva versión?'
      }).then(res => {
        if (res.response === 0) {
          forceQuit = true;
          autoUpdater.quitAndInstall(false, true);
        }
      });
    }
  });

  autoUpdater.on('error', err => {
    const msg = String(err && err.message ? err.message : '');
    console.error('[autoUpdater] Error:', msg);
    sendUpdaterStatus({
      status: 'error',
      message: err.message || 'Error al comprobar o descargar la actualización'
    });
  });

  ipcMain.handle('updater:check', () => {
    checkAndNotifyUpdate(true);
    return { success: true };
  });

  ipcMain.handle('updater:installNow', () => {
    forceQuit = true;
    autoUpdater.quitAndInstall(false, true);
    return true;
  });
}

app.whenReady().then(() => {
  setupAutoUpdater();
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  createWindow();
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) {
      createWindow();
    }
  });
});
app.on('before-quit', e => {
  if (!forceQuit && win && !win.isDestroyed()) {
    e.preventDefault();
    win.close();
  }
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
