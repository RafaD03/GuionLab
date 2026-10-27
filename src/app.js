let booted = false;
addEventListener('error', e => {
  const m = document.getElementById('main');
  if (!booted && m) m.textContent = 'Error al iniciar: ' + e.message + ' (línea ' + e.lineno + ')';
});

if (!window.api) window.api = {
  open: async () => null,
  readPath: async () => null,
  showInFolder: async () => null,
  getFileToOpen: async () => null,
  write: async () => true,
  writeSync: () => true,
  saveAs: async () => null,
  renameFile: async () => ({ success: false }),
  createInitialProject: async () => ({ success: false }),
  checkUpdate: async () => ({ status: 'dev' }),
  installUpdateNow: async () => true,
  onUpdateStatus: () => {},
  pdf: async () => { try { window.print(); } catch (x) {} return null; },
  onMenu: () => {}
};

const KEY = 'guion-studio-v1';
const KEY_RECENTS = 'guion-studio-recents';
const KEY_PROJ = 'guion-proj-';
const KEY_CONFIG = 'guion-studio-config';

let CFG = { scriptFocusBox: false, theme: 'auto' };
try {
  const sc = localStorage.getItem(KEY_CONFIG);
  if (sc) CFG = { ...CFG, ...JSON.parse(sc) };
} catch (e) {}

function applyConfig() {
  document.body.classList.toggle('hide-script-focus-box', !CFG.scriptFocusBox);
  if (CFG.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (CFG.theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  try { localStorage.setItem(KEY_CONFIG, JSON.stringify(CFG)); } catch (e) {}
}

const $ = s => document.querySelector(s), M = $('#main'), uid = () => Math.random().toString(36).slice(2, 8);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safePhoto = p => {
  if (typeof p !== 'string') return '';
  const s = p.trim();
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : '';
};
const safeColor = c => (typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c.trim())) ? c.trim() : '#3f7be0';
const wc = s => (s || '').trim() ? s.trim().split(/\s+/).length : 0, st = m => $('#st').textContent = m;
const blank = () => ({ cover: {}, tag: '', syn: '', tpl: '3', beats: {}, world: {}, worldMode: 'fantasy', chars: [], locs: [], scenes: [], treat: '', script: [], notes: [], vers: [], collab: false, writers: [] });

const PAL = ['#e0564a', '#e8963a', '#d9bd2f', '#4fae6b', '#2fa3a8', '#3f7be0', '#8a5be0', '#d65aa8'];
const OLD = { n: 'nreal', e: 'age', q: 'one', f: 'fotro', o: 'trab', d: 'lnac', fa: 'fam', mk: 'evento', pe: 'pers', vo: 'habla', va: 'filos', mz: 'habit', ob: 'metal', ne: 'need', mi: 'miedo', se: 'secre', df: 'debil', cb: 'cambia', al: 'r_al', an: 'r_an', am: 'r_am', ds: 'r_ds' };
const OLDL = { cl: 'Clase social, educación y dinero', ho: 'Qué le hace reír y qué lo saca de quicio', pq: '¿Por qué lo quiere ahora?', ap: '¿Qué se juega?', he: 'La herida o la mentira en la que cree', co: 'Lo que dice ser frente a lo que es', li: 'La línea que jamás cruzaría', ai: 'Cómo empieza la historia', af: 'Cómo termina', sm: 'Símbolo, objeto o frase que lo resume' };

function norm(o) {
  if (!o || typeof o !== 'object') o = blank();
  if (!o.cover || typeof o.cover !== 'object') o.cover = {};
  o.cover.title = String(o.cover.title || '');
  o.cover.author = String(o.cover.author || '');
  o.cover.genre = String(o.cover.genre || '');
  o.cover.contact = String(o.cover.contact || '');
  o.cover.date = String(o.cover.date || '');
  o.tag = String(o.tag || '');
  o.syn = String(o.syn || '');
  o.tpl = (o.tpl && TPL[o.tpl]) ? String(o.tpl) : '3';
  if (!o.beats || typeof o.beats !== 'object') o.beats = {};

  o.worldMode = ['fantasy', 'realistic'].includes(o.worldMode) ? o.worldMode : 'fantasy';
  if (!o.world || typeof o.world !== 'object') o.world = {};
  const cleanWorld = {};
  Object.keys(o.world).forEach(k => {
    cleanWorld[k] = String(o.world[k] == null ? '' : o.world[k]);
  });
  o.world = cleanWorld;

  if (!Array.isArray(o.chars)) o.chars = [];
  o.chars = o.chars.map((c, i) => {
    if (!c || typeof c !== 'object') c = {};
    const id = String(c.id || uid()).replace(/[^a-zA-Z0-9_-]/g, '');
    const color = safeColor(c.color || PAL[i % PAL.length]);
    const photo = safePhoto(c.photo);
    const name = String(c.name || '');
    const rel = Array.isArray(c.rel) ? c.rel.map(r => ({
      to: String(r?.to || ''),
      kind: String(r?.kind || 'Amistad'),
      note: String(r?.note || '')
    })) : [];
    let a = (c.a && typeof c.a === 'object') ? c.a : {};
    if (!c.v) {
      const n = {}, lg = [];
      Object.keys(a).forEach(k => {
        const v = String(a[k] || '');
        if (!v.trim()) return;
        if (OLD[k] && !n[OLD[k]]) n[OLD[k]] = v;
        else lg.push((OLDL[k] || k) + ': ' + v);
      });
      if (lg.length) n.legacy = lg.join('\n\n');
      a = n;
    } else {
      const cleanA = {};
      Object.keys(a).forEach(k => { cleanA[k] = String(a[k] == null ? '' : a[k]); });
      a = cleanA;
    }
    return { id, name, color, photo, rel, a, v: 2 };
  });

  if (!Array.isArray(o.locs)) o.locs = [];
  o.locs = o.locs.map(l => ({
    kind: ['INT.', 'EXT.', 'INT./EXT.'].includes(l?.kind) ? l.kind : 'INT.',
    name: String(l?.name || ''),
    desc: String(l?.desc || ''),
    note: String(l?.note || '')
  }));

  if (!Array.isArray(o.scenes)) o.scenes = [];
  o.scenes = o.scenes.map(s => ({
    head: String(s?.head || ''),
    sum: String(s?.sum || '')
  }));

  o.treat = String(o.treat || '');

  if (!Array.isArray(o.notes)) o.notes = [];
  o.notes = o.notes.map(n => ({
    t: String(n?.t || ''),
    b: String(n?.b || '')
  }));

  if (!Array.isArray(o.vers)) o.vers = [];
  o.vers = o.vers.map(v => ({
    l: String(v?.l || ''),
    d: String(v?.d || ''),
    s: v?.s && typeof v.s === 'object' ? v.s : null
  }));

  const VALID_TYPES = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'];
  if (!Array.isArray(o.script)) o.script = [];
  o.script = o.script.map(b => {
    if (!b || typeof b !== 'object') return { id: uid(), type: 'action', text: '' };
    return {
      id: String(b.id || uid()).replace(/[^a-zA-Z0-9_-]/g, ''),
      type: VALID_TYPES.includes(b.type) ? b.type : 'action',
      text: String(b.text == null ? '' : b.text)
    };
  });
  if (!o.script.length) {
    o.script = [{ id: uid(), type: 'scene', text: '' }];
  }

  o.collab = Boolean(o.collab);
  if (!Array.isArray(o.writers)) o.writers = [];
  o.writers = o.writers.map(w => String(w || '')).filter(Boolean);

  return o;
}

function timeAgo(ts) {
  if (!ts) return 'Fecha desconocida';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d} día${d > 1 ? 's' : ''}`;
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getRecents() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY_RECENTS) || '[]');
    return Array.isArray(r) ? r : [];
  } catch (e) {
    return [];
  }
}

function saveRecents(list) {
  try { localStorage.setItem(KEY_RECENTS, JSON.stringify(list)); } catch (e) {}
}

function initStorage() {
  let list = getRecents();
  if (!list.length) {
    try {
      const old = localStorage.getItem(KEY);
      if (old) {
        const o = JSON.parse(old);
        const pth = localStorage.getItem(KEY + '-path') || null;
        const hasOldContent = o && (o.cover?.title || (o.scenes && o.scenes.length) || (o.chars && o.chars.length) || o.treat || o.syn);
        if (hasOldContent) {
          const id = uid();
          localStorage.setItem(KEY_PROJ + id, old);
          list = [{
            id,
            title: o.cover?.title || 'Mi guion',
            author: o.cover?.author || '',
            genre: o.cover?.genre || '',
            path: pth,
            updatedAt: Date.now(),
            scenes: (o.scenes || []).length,
            chars: (o.chars || []).length
          }];
          saveRecents(list);
        }
      }
    } catch (e) {}
  }
  return list;
}

function updateCurrentInRecents() {
  if (!currentId) return;
  const list = getRecents();
  let item = list.find(x => x.id === currentId);
  if (!item) {
    item = { id: currentId };
    list.unshift(item);
  }
  item.title = (S.cover && S.cover.title) || 'Proyecto sin título';
  item.author = (S.cover && S.cover.author) || '';
  item.genre = (S.cover && S.cover.genre) || '';
  item.path = filePath || null;
  item.collab = Boolean(S.collab);
  item.updatedAt = Date.now();
  item.scenes = (S.scenes || []).length;
  item.chars = (S.chars || []).length;
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  saveRecents(list);
}

let inLauncher = true;
let currentId = null;
let S = blank();
let tab = 'cover';
let cur = null;
let tm = null;
let dr = null;
let arm = null;
let filePath = null;
let pending = false;
let op = {};
let searchFilter = '';
let isNewDraftThisSession = false;
let skipFileSaveOnExit = false;
let isDirty = false;

// Screenplay state
let curScriptBlock = 0;
let scriptSplit = false;
let scriptRefTab = 'chars';
let isScriptFs = false;

function persist(sync, saveToDisk = false) {
  if (inLauncher || !currentId) return;
  const j = JSON.stringify(S);
  try {
    localStorage.setItem(KEY_PROJ + currentId, j);
  } catch (e) {}
  updateCurrentInRecents();

  if (!filePath) {
    st('Borrador local · guarda con Ctrl+S');
    return;
  }

  if (!saveToDisk) {
    st('Cambios sin guardar · Ctrl+S');
    return;
  }

  if (skipFileSaveOnExit) return;

  try {
    if (sync) {
      const ok = api.writeSync(j, filePath);
      if (ok) {
        isDirty = false;
        st('Guardado ✓');
      } else {
        st('⚠ No se pudo guardar el archivo');
      }
    } else {
      api.write(j, filePath).then(ok => {
        if (ok) {
          isDirty = false;
          st('Guardado ✓');
        } else {
          st('⚠ No se pudo guardar el archivo');
        }
      });
    }
  } catch (e) {
    st('⚠ No se pudo guardar el archivo');
  }
}

function save() {
  if (inLauncher) return;
  isDirty = true;
  st('Guardando…');
  pending = true;
  clearTimeout(tm);
  tm = setTimeout(() => {
    pending = false;
    persist(false, true);
  }, 750);
}

addEventListener('beforeunload', () => {
  if (pending && !skipFileSaveOnExit) persist(true, true);
});

const hasData = () => JSON.stringify({ ...S, vers: [] }) != JSON.stringify(blank());

function setTtl() {
  if (inLauncher) {
    $('#ttl').textContent = '';
    document.title = 'GuionLab — Mis Proyectos';
    return;
  }
  if (!currentId && tab === 'config') {
    $('#ttl').textContent = ' · Configuración';
    document.title = 'Configuración — GuionLab';
    return;
  }
  const t = S.cover?.title || 'Proyecto sin título';
  const badge = S.collab ? ' (Colaborativo)' : '';
  $('#ttl').innerHTML = ' · ' + esc(t) + (S.collab ? ' <span class="collab-badge">👥 Colaborativo</span>' : '');
  document.title = t + badge + ' — GuionLab';
}

async function handleTitleRename(newTitle) {
  const trimmed = (newTitle || '').trim();
  if (!trimmed) return;
  if (!filePath) {
    updateCurrentInRecents();
    return;
  }

  const currentFileName = filePath.split(/[\\/]/).pop();
  const currentBaseName = currentFileName.replace(/\.(guion|json)$/i, '');
  const safeNew = trimmed.replace(/[\\/:*?"<>|]/g, '').trim();

  if (!safeNew || safeNew.toLowerCase() === currentBaseName.toLowerCase()) {
    return;
  }

  if (window.api && api.renameFile) {
    try {
      const res = await api.renameFile(filePath, safeNew);
      if (res && res.success && res.newPath) {
        filePath = res.newPath;
        updateCurrentInRecents();
        setTtl();
        st('Archivo renombrado a ' + safeNew + '.guion ✓');
      } else if (res && res.error) {
        st('⚠ ' + res.error);
        alert('No se pudo renombrar el archivo en disco:\n' + res.error);
      }
    } catch (err) {
      console.error('Error al renombrar archivo:', err);
    }
  }
}

async function openRecent(id) {
  if (!inLauncher && currentId && pending) persist(true, false);
  const list = getRecents();
  const item = list.find(x => x.id === id);
  if (!item) return;

  if (item.path) {
    const r = await api.readPath(item.path);
    if (r && r.data) {
      currentId = id;
      isNewDraftThisSession = false;
      isDirty = false;
      S = norm({ ...blank(), ...r.data });
      filePath = item.path;
      inLauncher = false;
      tab = 'cover';
      cur = null;
      updateCurrentInRecents();
      render();
      st('Listo');
      return;
    } else {
      if (confirm(`No se pudo encontrar el archivo en:\n${item.path}\n\n¿Quieres quitar este proyecto de la lista?`)) {
        removeRecent(id);
      }
      return;
    }
  } else {
    const raw = localStorage.getItem(KEY_PROJ + id);
    if (raw) {
      try {
        currentId = id;
        isNewDraftThisSession = false;
        isDirty = false;
        S = norm({ ...blank(), ...JSON.parse(raw) });
        filePath = null;
        inLauncher = false;
        tab = 'cover';
        cur = null;
        updateCurrentInRecents();
        render();
        st('Borrador local · guarda con Ctrl+S');
        return;
      } catch (e) {}
    }
    alert('No se encontraron datos para este borrador local.');
  }
}

let currentNewProjCloud = 'drive';
let currentHelpTab = 'collab';
let currentHelpCloud = 'drive';

function renderCollabCloudGuide(cloud) {
  if (cloud === 'onedrive') {
    return `
      <div style="background:rgba(0,120,212,0.08);border:1px solid rgba(0,120,212,0.25);border-radius:8px;padding:12px 14px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px">
          <b style="font-size:13px;color:var(--ink);display:flex;align-items:center;gap:6px">
            <span>🟦</span> Microsoft OneDrive (Integrado en Windows)
          </b>
          <button class="btn sm" data-a="openonedriveweb" style="padding:4px 10px;font-size:12px;background:#0078d4;border-color:#0078d4;color:#fff" title="Abrir OneDrive web">
            Abrir OneDrive web ↗
          </button>
        </div>
        <span class="mu" style="font-size:12px;line-height:1.45;display:block">
          OneDrive viene preinstalado en Windows. Solo necesitas haber iniciado sesión con tu cuenta de Microsoft en el PC.
          <br><span style="font-size:11px;opacity:0.85">Web oficial: <a href="https://onedrive.live.com" data-a="openonedriveweb" style="color:inherit;text-decoration:underline">onedrive.live.com</a></span>
        </span>
      </div>

      <div style="background:var(--sf);border:1px solid var(--ln);border-radius:8px;padding:12px 14px;margin-bottom:14px">
        <b style="font-size:12px;color:var(--ink);display:block;margin-bottom:8px">📖 Pasos para colaborar con OneDrive:</b>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:12px;color:var(--mu);line-height:1.55">
          <div>
            <b style="color:var(--ink)">1️⃣ Si tú creas el proyecto:</b>
            <ol style="margin:2px 0 0;padding-left:18px">
              <li>Pulsa <b>Crear proyecto</b> y guarda con <kbd>Ctrl + S</kbd>. GuionLab te sugerirá tu carpeta de <b>OneDrive</b>.</li>
              <li>Haz clic derecho sobre esa carpeta en tu explorador o en <a href="https://onedrive.live.com" data-a="openonedriveweb" style="color:var(--ac);text-decoration:underline">onedrive.live.com</a> y dale a <b>Compartir</b> con el correo de tu compañero (con permiso de <b>Edición</b>).</li>
            </ol>
          </div>
          <div style="border-top:1px solid var(--ln);padding-top:8px">
            <b style="color:var(--ink)">⭐ 2️⃣ Si tu compañero lo ha creado y te lo comparte (¡Paso imprescindible!):</b>
            <ol style="margin:2px 0 0;padding-left:18px">
              <li>Abre tu navegador, entra en <a href="https://onedrive.live.com" data-a="openonedriveweb" style="color:var(--ac);text-decoration:underline">onedrive.live.com</a> y ve a la sección <b>«Compartido»</b> (Shared).</li>
              <li>Selecciona la carpeta compartida y haz clic arriba en <b>«Agregar acceso directo a Mis archivos»</b>.<br>
                <i style="color:var(--ink);font-size:11px">⚠️ Este paso hace que OneDrive de Windows descargue la carpeta a tu disco duro.</i>
              </li>
              <li>En GuionLab pulsa <b>«Abrir archivo…»</b> (<kbd>Ctrl + O</kbd>), navega a tu carpeta de OneDrive y abre el <code>.guion</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    `;
  }

  if (cloud === 'dropbox') {
    return `
      <div style="background:rgba(0,97,254,0.08);border:1px solid rgba(0,97,254,0.25);border-radius:8px;padding:12px 14px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px">
          <b style="font-size:13px;color:var(--ink);display:flex;align-items:center;gap:6px">
            <span>📦</span> Dropbox para ordenadores
          </b>
          <button class="btn sm" data-a="opendropboxdl" style="padding:4px 10px;font-size:12px;background:#0061fe;border-color:#0061fe;color:#fff" title="Abrir página oficial de descarga">
            Descargar Dropbox ↗
          </button>
        </div>
        <span class="mu" style="font-size:12px;line-height:1.45;display:block">
          Ambos guionistas necesitáis tener instalada la aplicación oficial de Dropbox en vuestros ordenadores.
          <br><span style="font-size:11px;opacity:0.85">Enlace oficial seguro: <a href="https://www.dropbox.com/install" data-a="opendropboxdl" style="color:inherit;text-decoration:underline">dropbox.com/install</a></span>
        </span>
      </div>

      <div style="background:var(--sf);border:1px solid var(--ln);border-radius:8px;padding:12px 14px;margin-bottom:14px">
        <b style="font-size:12px;color:var(--ink);display:block;margin-bottom:8px">📖 Pasos para colaborar con Dropbox:</b>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:12px;color:var(--mu);line-height:1.55">
          <div>
            <b style="color:var(--ink)">1️⃣ Si tú creas el proyecto:</b>
            <ol style="margin:2px 0 0;padding-left:18px">
              <li>Pulsa <b>Crear proyecto</b> y guarda con <kbd>Ctrl + S</kbd> dentro de tu carpeta de <b>Dropbox</b>.</li>
              <li>Haz clic derecho sobre la carpeta en el Explorador o en <a href="https://dropbox.com" data-a="opendropboxweb" style="color:var(--ac);text-decoration:underline">dropbox.com</a> y dale a <b>Compartir</b> con tu compañero (permiso «Puede editar»).</li>
            </ol>
          </div>
          <div style="border-top:1px solid var(--ln);padding-top:8px">
            <b style="color:var(--ink)">⭐ 2️⃣ Si tu compañero lo ha creado y te lo comparte:</b>
            <ol style="margin:2px 0 0;padding-left:18px">
              <li>Abre la invitación en tu correo o en <a href="https://dropbox.com" data-a="opendropboxweb" style="color:var(--ac);text-decoration:underline">dropbox.com</a> y pulsa <b>«Añadir a Dropbox»</b>.</li>
              <li>Dropbox sincronizará automáticamente la carpeta en tu disco local (<code>C:\\Usuarios\\...\\Dropbox</code>).</li>
              <li>En GuionLab pulsa <b>«Abrir archivo…»</b> (<kbd>Ctrl + O</kbd>), navega a tu carpeta de Dropbox y abre el <code>.guion</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    `;
  }

  // Google Drive
  return `
    <div style="background:var(--ac-glow);border:1px solid var(--ac);border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px">
        <b style="font-size:13px;color:var(--ink);display:flex;align-items:center;gap:6px">
          <span>☁️</span> Google Drive para ordenadores
        </b>
        <button class="btn sm" data-a="opendrivedl" style="padding:4px 10px;font-size:12px" title="Abrir página oficial de descarga">
          Descargar Google Drive ↗
        </button>
      </div>
      <span class="mu" style="font-size:12px;line-height:1.45;display:block">
        Para sincronizar automáticamente y sin líos, ambos guionistas necesitáis tener instalada la aplicación oficial de Google Drive en el ordenador.
        <br><span style="font-size:11px;opacity:0.85">Enlace oficial seguro: <a href="https://www.google.com/drive/download/" data-a="opendrivedl" style="color:inherit;text-decoration:underline">google.com/drive/download</a></span>
      </span>
    </div>

    <div style="background:var(--sf);border:1px solid var(--ln);border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <b style="font-size:12px;color:var(--ink);display:block;margin-bottom:8px">📖 Pasos para colaborar con Google Drive:</b>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:12px;color:var(--mu);line-height:1.55">
        <div>
          <b style="color:var(--ink)">1️⃣ Si tú creas el proyecto:</b>
          <ol style="margin:2px 0 0;padding-left:18px">
            <li>Pulsa <b>Crear proyecto</b> y guarda con <kbd>Ctrl + S</kbd>. GuionLab te recomendará tu carpeta de <b>Google Drive</b>.</li>
            <li>Entra en Google Drive y comparte la carpeta del guion con el correo de tu compañero (como <b>Editor</b>).</li>
          </ol>
        </div>
        <div style="border-top:1px solid var(--ln);padding-top:8px">
          <b style="color:var(--ink)">⭐ 2️⃣ Si tu compañero ya lo ha creado y te lo ha compartido (¡Paso imprescindible!):</b>
          <ol style="margin:2px 0 0;padding-left:18px">
            <li>Entra en <a href="https://drive.google.com" data-a="opendriveweb" style="color:var(--ac);text-decoration:underline">drive.google.com</a> y ve a <b>«Compartido conmigo»</b>.</li>
            <li>Haz <b>clic derecho sobre la carpeta</b> y selecciona <b>«Añadir acceso directo a Mi unidad»</b> (imprescindible para que se descargue a tu disco duro).</li>
            <li>¡Listo! Cierra esta ventana y en GuionLab pulsa <b>«Abrir archivo…»</b> (<kbd>Ctrl + O</kbd>) para abrir el <code>.guion</code> desde tu disco G:.</li>
          </ol>
        </div>
      </div>
    </div>
  `;
}

function showNewProjectModal() {
  const modal = $('#modal-container');
  if (!modal) {
    createNewProject();
    return;
  }

  const savedWriter = localStorage.getItem('guionlab-writer-name') || '';

  modal.innerHTML = `
    <div class="modal-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <h2 style="margin:0">Nuevo proyecto</h2>
        <button class="btn g sm" data-a="cancelmodal" style="padding:4px 8px;font-size:13px">✕</button>
      </div>
      <p class="sub">Elige cómo vas a escribir tu guion para configurar el entorno de trabajo.</p>

      <div class="fl" style="margin-bottom:18px">
        <input id="np-title" value="Nuevo proyecto" placeholder="Título provisional">
        <label>Título del proyecto</label>
      </div>

      <b style="display:block;font-size:12px;margin-bottom:8px" class="mu">MODALIDAD DE TRABAJO</b>
      <div class="mode-cards">
        <div class="mode-card selected" data-a="pickmode" data-mode="solo" id="mode-solo">
          <span class="mode-card-icon">👤</span>
          <span class="mode-card-title">Individual</span>
          <span class="mode-card-desc">Escribirás tú solo. Se guardará por defecto en Documentos/GuionLab.</span>
        </div>
        <div class="mode-card" data-a="pickmode" data-mode="collab" id="mode-collab">
          <span class="mode-card-icon">👥</span>
          <span class="mode-card-title">Colaborativo</span>
          <span class="mode-card-desc">Para 2 personas. Compatible con Google Drive, OneDrive y Dropbox.</span>
        </div>
      </div>

      <div id="collab-fields" style="display:none;background:var(--bg);border:1px solid var(--ln);border-radius:10px;padding:16px;margin-bottom:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;flex-wrap:wrap">
          <b style="font-size:11px;color:var(--mu)">ELIGE TU SERVICIO EN LA NUBE:</b>
          <div style="display:flex;gap:4px">
            <button class="sub-btn${currentNewProjCloud === 'drive' ? ' on' : ''}" data-a="switchprojcloud" data-cloud="drive" style="padding:3px 10px;font-size:11px">☁️ Google Drive</button>
            <button class="sub-btn${currentNewProjCloud === 'onedrive' ? ' on' : ''}" data-a="switchprojcloud" data-cloud="onedrive" style="padding:3px 10px;font-size:11px">🟦 OneDrive</button>
            <button class="sub-btn${currentNewProjCloud === 'dropbox' ? ' on' : ''}" data-a="switchprojcloud" data-cloud="dropbox" style="padding:3px 10px;font-size:11px">📦 Dropbox</button>
          </div>
        </div>

        <div id="collab-cloud-guide-container">
          ${renderCollabCloudGuide(currentNewProjCloud)}
        </div>

        <div style="margin-top:2px;margin-bottom:14px;font-size:11px;color:var(--mu);text-align:right">
          <span>💡 Consulta la guía completa en </span><a href="#" data-a="openhelp" style="color:var(--ac);font-weight:600;text-decoration:underline">❓ Ayuda</a><span> en cualquier momento.</span>
        </div>

        <div class="fl" style="margin-bottom:12px">
          <input id="np-w1" value="${esc(savedWriter)}" placeholder="Ej. Rafa">
          <label>Tu nombre o firma</label>
        </div>
        <div class="fl">
          <input id="np-w2" placeholder="Ej. Carlos (opcional)">
          <label>Nombre de tu co-guionista</label>
        </div>
      </div>

      <div class="row" style="justify-content:flex-end;gap:10px;margin-top:20px">
        <button class="btn g" data-a="cancelmodal">Cancelar</button>
        <button class="btn" data-a="confirmnewproj">Crear proyecto</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  const titleInput = $('#np-title');
  if (titleInput) {
    titleInput.focus();
    titleInput.select();
  }
}

function renderHelpBody(helpTab) {
  if (helpTab === 'collab') {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:8px;background:var(--bg);padding:8px 12px;border-radius:8px;border:1px solid var(--ln);flex-wrap:wrap">
        <b style="font-size:12px;color:var(--ink)">Elige tu servicio de almacenamiento en la nube:</b>
        <div style="display:flex;gap:6px">
          <button class="sub-btn${currentHelpCloud === 'drive' ? ' on' : ''}" data-a="switchhelpcloud" data-cloud="drive">☁️ Google Drive</button>
          <button class="sub-btn${currentHelpCloud === 'onedrive' ? ' on' : ''}" data-a="switchhelpcloud" data-cloud="onedrive">🟦 OneDrive</button>
          <button class="sub-btn${currentHelpCloud === 'dropbox' ? ' on' : ''}" data-a="switchhelpcloud" data-cloud="dropbox">📦 Dropbox</button>
        </div>
      </div>

      <div id="help-cloud-guide-content">
        ${renderCollabCloudGuide(currentHelpCloud)}
      </div>

      <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:14px;margin-top:12px">
        <b style="color:var(--ink);font-size:13px;display:block;margin-bottom:6px">🔄 ¿Cómo funciona la sincronización en vivo?</b>
        <p style="margin:0;font-size:12px;color:var(--mu);line-height:1.6">
          Funciona exactamente igual con <b>Google Drive</b>, <b>OneDrive</b> o <b>Dropbox</b>: cada vez que cualquiera de los dos guarda (<kbd>Ctrl + S</kbd>), GuionLab detecta el cambio en el archivo compartido en menos de 1 segundo y muestra un aviso amarillo arriba:
          <i>«Cambios detectados en el archivo compartido»</i>.<br>
          Al pulsar <b>«Recargar cambios ahora»</b>, GuionLab guarda automáticamente una copia de seguridad en tu pestaña de <b>Versiones</b> y recarga la pantalla con el texto más nuevo de tu compañero. ¡Cero riesgos de perder trabajo!
        </p>
      </div>
    `;
  } else if (helpTab === 'shortcuts') {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:12px 14px">
          <b style="color:var(--ink);font-size:13px;display:block;margin-bottom:8px">📁 Proyecto y archivos</b>
          <table style="width:100%;font-size:12px;line-height:1.8;color:var(--mu)">
            <tr><td><kbd>Ctrl + S</kbd></td><td>Guardar cambios</td></tr>
            <tr><td><kbd>Ctrl + Shift + S</kbd></td><td>Guardar como…</td></tr>
            <tr><td><kbd>Ctrl + N</kbd></td><td>Nuevo proyecto</td></tr>
            <tr><td><kbd>Ctrl + O</kbd></td><td>Abrir archivo .guion</td></tr>
            <tr><td><kbd>Ctrl + Shift + H</kbd></td><td>Mis proyectos</td></tr>
            <tr><td><kbd>F1</kbd></td><td>Abrir esta ayuda</td></tr>
          </table>
        </div>

        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:12px 14px">
          <b style="color:var(--ink);font-size:13px;display:block;margin-bottom:8px">📄 Exportación PDF</b>
          <table style="width:100%;font-size:12px;line-height:1.8;color:var(--mu)">
            <tr><td><kbd>Ctrl + Shift + P</kbd></td><td>Exportar Guion literario PDF</td></tr>
            <tr><td><kbd>Ctrl + P</kbd></td><td>Exportar Dossier completo PDF</td></tr>
            <tr><td><kbd>F11</kbd></td><td>Modo pantalla completa</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Salir de pantalla completa / Cerrar ayuda</td></tr>
          </table>
        </div>
      </div>

      <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:12px 14px;margin-top:12px">
        <b style="color:var(--ink);font-size:13px;display:block;margin-bottom:8px">✍️ Editor de Guion Literario</b>
        <table style="width:100%;font-size:12px;line-height:1.8;color:var(--mu)">
          <tr><td style="width:140px"><kbd>Tab</kbd></td><td>Ciclar tipo de bloque (Escena ➔ Acción ➔ Personaje ➔ Diálogo ➔ Acotación ➔ Transición)</td></tr>
          <tr><td><kbd>Shift + Tab</kbd></td><td>Ciclar tipo de bloque hacia atrás</td></tr>
          <tr><td><kbd>Ctrl + 1</kbd> a <kbd>6</kbd></td><td>Asignar tipo directo: 1 Escena, 2 Acción, 3 Personaje, 4 Diálogo, 5 Acotación, 6 Transición</td></tr>
          <tr><td><kbd>Enter</kbd> tras Personaje</td><td>Crea automáticamente el bloque de Diálogo debajo</td></tr>
          <tr><td><kbd>Enter</kbd> dos veces</td><td>Termina el diálogo y crea un nuevo bloque de Acción</td></tr>
        </table>
      </div>
    `;
  } else if (helpTab === 'phases') {
    return `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:10px 14px">
          <b style="color:var(--ink);font-size:13px">1. 💡 Desarrollo (Portada, Sinopsis, Estructura, Notas)</b>
          <p style="margin:2px 0 0;font-size:12px;color:var(--mu)">Define el título, logline, sinopsis completa, la estructura dramática (Beat Sheet, 3 Actos o Harmon) y tus notas de desarrollo.</p>
        </div>
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:10px 14px">
          <b style="color:var(--ink);font-size:13px">2. 🌍 Mundo (Lógica del mundo, Personajes, Localizaciones)</b>
          <p style="margin:2px 0 0;font-size:12px;color:var(--mu)">Worldbuilding completo (geografía, sociedad, política, economía, magia y tecnología), fichas tridimensionales de personajes y catálogo de lugares.</p>
        </div>
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:10px 14px">
          <b style="color:var(--ink);font-size:13px">3. ✍️ Escritura (Escaleta, Tratamiento, Guion)</b>
          <p style="margin:2px 0 0;font-size:12px;color:var(--mu)">Secuencia cada escena en tarjetas reordenables, desarróllala en prosa y escribe el guion con formato profesional estándar.</p>
        </div>
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:10px 14px">
          <b style="color:var(--ink);font-size:13px">4. 📋 Dossier y Extras (Dossier, Versiones)</b>
          <p style="margin:2px 0 0;font-size:12px;color:var(--mu)">Consulta el dossier de venta completo (incluyendo el mundo) y gestiona instantáneas de respaldo de tu proyecto.</p>
        </div>
      </div>
    `;
  }
  return '';
}

function showHelpModal(initialTab = 'collab', initialCloud = currentHelpCloud) {
  const modal = $('#modal-container');
  if (!modal) return;
  currentHelpTab = initialTab || currentHelpTab || 'collab';
  if (initialCloud) currentHelpCloud = initialCloud;

  const contentPane = $('#help-content-pane');
  if (contentPane && modal.style.display !== 'none') {
    modal.querySelectorAll('[data-a="switchhelptab"]').forEach(b => {
      b.classList.toggle('on', b.dataset.tab === currentHelpTab);
    });
    contentPane.innerHTML = renderHelpBody(currentHelpTab);
    return;
  }

  modal.innerHTML = `
    <div class="modal-card wide">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">
        <div>
          <h2 style="margin:0;font-size:20px;display:flex;align-items:center;gap:8px">
            <span>❓</span> Ayuda y Guía de GuionLab
          </h2>
          <p class="sub" style="margin:2px 0 0;font-size:13px">Todo lo que necesitas saber para escribir individualmente o a 4 manos.</p>
        </div>
        <button class="btn g sm" data-a="cancelmodal" style="padding:6px 10px;font-size:14px;line-height:1">✕</button>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--ln);padding-bottom:10px">
        <button class="sub-btn${currentHelpTab === 'collab' ? ' on' : ''}" data-a="switchhelptab" data-tab="collab">
          👥 Modo Colaborativo
        </button>
        <button class="sub-btn${currentHelpTab === 'shortcuts' ? ' on' : ''}" data-a="switchhelptab" data-tab="shortcuts">
          ⌨️ Atajos de teclado
        </button>
        <button class="sub-btn${currentHelpTab === 'phases' ? ' on' : ''}" data-a="switchhelptab" data-tab="phases">
          🎬 Fases de escritura
        </button>
      </div>

      <div id="help-content-pane">
        ${renderHelpBody(currentHelpTab)}
      </div>

      <div class="row" style="justify-content:flex-end;margin-top:20px">
        <button class="btn" data-a="cancelmodal">Cerrar ayuda</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

function showExportModal() {
  const modal = $('#modal-container');
  if (!modal) return;
  modal.innerHTML = `
    <div class="modal-card" style="max-width:560px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">
        <div>
          <h2 style="margin:0;font-size:20px;display:flex;align-items:center;gap:8px">
            <span>📤</span> Exportar a PDF
          </h2>
          <p class="sub" style="margin:2px 0 0;font-size:13px">Elige qué documento deseas generar:</p>
        </div>
        <button class="btn g sm" data-a="cancelmodal" style="padding:6px 10px;font-size:14px;line-height:1">✕</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;margin:18px 0">
        <div class="export-opt-card" data-a="doexportscript">
          <div style="font-size:32px;flex:none">✍️</div>
          <div style="flex:1">
            <b style="font-size:15px;color:var(--ink);display:block;margin-bottom:3px">Solo el Guion Literario</b>
            <span class="mu" style="font-size:12.5px;line-height:1.45;display:block">
              Guion en formato estándar de la industria (Courier Prime 12pt, márgenes profesionales, números de página y portada).
            </span>
          </div>
          <button class="btn sm" data-a="doexportscript" style="flex:none">Exportar Guion →</button>
        </div>

        <div class="export-opt-card" data-a="doexportdossier">
          <div style="font-size:32px;flex:none">📋</div>
          <div style="flex:1">
            <b style="font-size:15px;color:var(--ink);display:block;margin-bottom:3px">Dossier Completo de Venta</b>
            <span class="mu" style="font-size:12.5px;line-height:1.45;display:block">
              Dossier completo (portada, logline, sinopsis, la lógica del mundo, personajes, localizaciones, escaleta y tratamiento).
            </span>
          </div>
          <button class="btn g sm" data-a="doexportdossier" style="flex:none">Exportar Dossier →</button>
        </div>
      </div>

      <div class="row" style="justify-content:flex-end;margin-top:10px">
        <button class="btn g" data-a="cancelmodal">Cancelar</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

function showRenameModal(item) {
  const modal = $('#modal-container');
  if (!modal) return;

  const currentTitle = item.title || 'Proyecto sin título';
  const hasPath = !!item.path;

  modal.innerHTML = `
    <div class="modal-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <h2 style="margin:0;font-size:18px">✏️ Renombrar proyecto</h2>
        <button class="btn g sm" data-a="cancelmodal" style="padding:4px 8px;font-size:13px">✕</button>
      </div>
      <p class="sub" style="margin-bottom:14px">
        ${hasPath ? 'Cambia el título del proyecto y el nombre de su archivo físico en disco.' : 'Cambia el título de este borrador local.'}
      </p>

      <div class="fl" style="margin-bottom:14px">
        <input id="rename-title" value="${esc(currentTitle)}" placeholder="Nuevo título del proyecto">
        <label>Título del proyecto</label>
      </div>

      ${hasPath ? `
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:8px;padding:10px 12px;margin-bottom:18px;font-size:12px">
          <span style="color:var(--mu);display:block;margin-bottom:2px">Archivo en disco actual:</span>
          <code style="word-break:break-all;color:var(--ink)">${esc(item.path)}</code>
        </div>
      ` : ''}

      <div class="row" style="justify-content:flex-end;gap:10px">
        <button class="btn g" data-a="cancelmodal">Cancelar</button>
        <button class="btn" data-a="confirmrenameproj" data-id="${esc(item.id)}">Renombrar</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  const inp = $('#rename-title');
  if (inp) {
    inp.focus();
    inp.select();
  }
}

async function createNewProject(opts = {}) {
  if (!inLauncher && currentId && pending) persist(true, true);
  currentId = uid();
  isNewDraftThisSession = false;
  isDirty = false;
  S = blank();
  const initialTitle = (opts.title || 'Nuevo proyecto').trim() || 'Nuevo proyecto';
  S.cover = { title: initialTitle };
  S.collab = Boolean(opts.collab);
  if (opts.writers && opts.writers.length) {
    S.writers = opts.writers;
    S.cover.author = opts.writers.join(' & ');
  }
  filePath = null;

  if (window.api && api.createInitialProject) {
    try {
      const res = await api.createInitialProject(initialTitle, S.collab, JSON.stringify(S));
      if (res && res.success && res.path) {
        filePath = res.path;
      }
    } catch (e) {
      console.error('Error al crear archivo inicial:', e);
    }
  }

  inLauncher = false;
  tab = 'cover';
  cur = null;
  persist(true, !!filePath);
  render();
  if (filePath) {
    st('Guardado en ' + (S.collab ? 'carpeta compartida' : 'Documentos/GuionLab') + ' ✓');
  } else {
    st('Borrador local · guarda con Ctrl+S');
  }
}

function goHome() {
  if (!inLauncher && currentId) {
    persist(true, false);
  }
  const b = $('#collab-banner');
  if (b) b.style.display = 'none';
  inLauncher = true;
  currentId = null;
  arm = null;
  render();
}

function removeRecent(id) {
  const list = getRecents().filter(x => x.id !== id);
  saveRecents(list);
  try { localStorage.removeItem(KEY_PROJ + id); } catch (e) {}
  if (currentId === id) {
    currentId = null;
    S = blank();
    isDirty = false;
  }
  render();
}

function showDeleteProjectModal(id) {
  const list = getRecents();
  const item = list.find(x => x.id === id);
  if (!item) return;

  const modal = $('#modal-container');
  if (!modal) return;

  const title = item.title || 'Proyecto sin título';
  const hasPath = !!item.path;

  modal.innerHTML = `
    <div class="modal-card" style="max-width:520px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:42px;height:42px;border-radius:10px;background:rgba(224,86,74,0.15);border:1px solid rgba(224,86,74,0.35);display:flex;align-items:center;justify-content:center;font-size:22px;flex:none">
            🗑️
          </div>
          <div>
            <h2 style="margin:0;font-size:18px;color:var(--ink)">Eliminar proyecto</h2>
            <span class="mu" style="font-size:13px">Aviso de eliminación del almacenamiento</span>
          </div>
        </div>
        <button class="btn g sm" data-a="cancelmodal" style="padding:4px 8px;font-size:13px">✕</button>
      </div>

      <div style="background:var(--bg);border:1px solid var(--ln);border-radius:10px;padding:12px 16px;margin-bottom:14px">
        <b style="font-size:16px;color:var(--ink);display:block;margin-bottom:3px">«${esc(title)}»</b>
        ${hasPath ? `
          <div style="font-size:12px;color:var(--mu);font-family:monospace;word-break:break-all">
            📁 ${esc(item.path)}
          </div>
        ` : `
          <div style="font-size:13px;color:var(--mu)">
            📝 Borrador guardado localmente en este equipo.
          </div>
        `}
      </div>

      <div style="background:rgba(224,86,74,0.08);border-left:3px solid #e0564a;border-radius:6px;padding:12px 14px;margin-bottom:20px;font-size:13px;line-height:1.5;color:var(--ink)">
        <b>⚠️ ¿Estás seguro de que quieres continuar?</b><br>
        ${hasPath ?
          'Si confirmas, el archivo se <b>eliminará de tu almacenamiento</b> (disco de tu ordenador o carpeta sincronizada en Drive / Dropbox / OneDrive) y desaparecerá de la lista de GuionLab.' :
          'Si confirmas, este borrador local se <b>eliminará permanentemente del almacenamiento</b> de tu equipo.'}
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px">
        <button class="btn g" data-a="cancelmodal">Cancelar</button>
        <button class="btn" data-a="confirmdelproj" data-id="${esc(item.id)}" style="background:#e0564a;border-color:#e0564a;color:#fff">
          Sí, eliminar del almacenamiento
        </button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

async function fOpen() {
  if (!inLauncher && currentId && pending) persist(true, false);
  const r = await api.open();
  if (!r) return;
  if (!r.data || !r.data.cover) {
    st('⚠ El archivo no es un proyecto válido');
    alert('El archivo no es un proyecto válido de GuionLab.');
    return;
  }
  const list = getRecents();
  const exist = list.find(x => x.path === r.path);
  currentId = exist ? exist.id : uid();
  isNewDraftThisSession = false;
  isDirty = false;
  S = norm({ ...blank(), ...r.data });
  filePath = r.path;
  inLauncher = false;
  tab = 'cover';
  cur = null;
  persist(true, false);
  render();
  st('Listo');
}

async function fSaveAs() {
  const p = await api.saveAs(JSON.stringify(S), S.cover?.title || 'Mi guion', Boolean(S.collab));
  if (p) {
    filePath = p;
    isNewDraftThisSession = false;
    isDirty = false;
    persist(true, true);
    render();
    return p;
  }
  return null;
}

async function fSave() {
  if (!filePath) return fSaveAs();
  persist(true, true);
  render();
  return filePath;
}

async function fPdf() {
  const t = tab;
  tab = 'dos';
  const prevTheme = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', 'light');
  document.body.classList.add('printing-dossier');
  render();
  await new Promise(r => setTimeout(r, 200));
  const p = await api.pdf(S.cover?.title || 'Proyecto', 'dossier');
  document.body.classList.remove('printing-dossier');
  if (prevTheme) document.documentElement.setAttribute('data-theme', prevTheme);
  else document.documentElement.removeAttribute('data-theme');
  tab = t;
  render();
  st(p ? 'Dossier PDF exportado ✓' : '');
}

const g = p => p.split('.').reduce((o, k) => o == null ? o : o[k], S) || '';
function setP(p, v) {
  const k = p.split('.');
  let o = S;
  while (k.length > 1) {
    const n = k.shift();
    o = o[n] == null ? (o[n] = {}) : o[n];
  }
  o[k[0]] = v;
}

const f = (p, l, t, ph) => '<div class="fl">' + (t == 'ta' ? `<textarea rows="1" data-k="${p}" placeholder="${esc(ph || ' ')}">${esc(g(p))}</textarea>` : `<input data-k="${p}" value="${esc(g(p))}" placeholder="${esc(ph || ' ')}">`) + `<label>${l}</label></div>`;
const sel = (p, l, o) => `<div class="fl"><select data-k="${p}">${o.map(x => `<option${x == (g(p) || o[0]) ? ' selected' : ''}>${x}</option>`).join('')}</select><label>${l}</label></div>`;
const head = (t, s) => `<h1>${t}</h1><p class="sub">${s}</p>`;

const SECS = [
  ['hist', 'Historia', [['metac', 'Meta a corto plazo'], ['metal', 'Meta a largo plazo'], ['need', 'Necesidad real: lo que de verdad necesita'], ['cini', 'Creencias iniciales'], ['ccamb', 'Creencias cambiadas'], ['cambia', '¿Qué lo lleva a cambiar?'], ['prim', 'Primera aparición'], ['part', 'Participación en la trama'], ['conf', 'Conflicto'], ['moment', 'Momento más decisivo']]],
  ['info', 'Información personal', [['nreal', 'Nombre real'], ['fnac', 'Fecha de nacimiento'], ['lnac', 'Lugar de nacimiento'], ['etnia', 'Etnia/raza'], ['fam', 'Familia']]],
  ['fis', 'Fisonomía', [['altura', 'Altura'], ['peso', 'Peso'], ['cuerpo', 'Cuerpo'], ['piel', 'Color de piel'], ['estc', 'Estilo de cabello'], ['colc', 'Color de cabello'], ['forj', 'Forma de los ojos'], ['colo', 'Color de ojos'], ['rost', 'Forma del rostro'], ['dist', 'Característica distintiva'], ['facial', 'Otras características faciales'], ['postura', 'Postura'], ['fotro', 'Otra apariencia física']]],
  ['vida', 'Vida', [['habil', 'Habilidades'], ['hdes', '¿Cómo se desarrollaron las habilidades?'], ['incomp', 'Incompetencia'], ['fort', 'Fortaleza/talento'], ['debil', 'Debilidades'], ['hobby', 'Hobbies'], ['habit', 'Hábitos'], ['salud', 'Salud'], ['habla', 'Forma de hablar'], ['mascota', 'Mascota'], ['vest', 'Vestimenta'], ['carga', 'Algo que siempre carga consigo/armas/herramientas'], ['acces', 'Accesorios'], ['zona', 'Zona de residencia/entorno'], ['hogar', 'Descripción del hogar'], ['vecin', 'Vecindario'], ['org', 'Organización implicada'], ['ingr', 'Ingresos'], ['trab', 'Trabajo/ocupación'], ['rango', 'Rango/puesto de trabajo'], ['satis', 'Satisfacción con el empleo']]],
  ['act', 'Actitud', [['pers', 'Personalidad'], ['moral', 'Moral'], ['motiv', 'Motivación'], ['desal', 'Desalientos'], ['filos', 'Filosofía'], ['miedo', 'Mayor miedo'], ['autoc', 'Autocontrol'], ['intel', 'Nivel de inteligencia'], ['confz', 'Nivel de confianza']]],
  ['bio', 'Biografía', [['infan', 'Infancia'], ['evento', 'Evento pasado importante'], ['logro', 'Mejor logro'], ['otlog', 'Otros logros'], ['peor', 'Peor momento'], ['fallas', 'Fallas'], ['secre', 'Secretos'], ['mejmem', 'Mejores memorias'], ['peormem', 'Peores memorias']]],
  ['rel', 'Relaciones', [['r_al', 'Aliados y mentores'], ['r_an', 'Quién o qué se le opone'], ['r_am', 'Amor, familia y vínculos clave'], ['r_ds', 'Cómo trata a los desconocidos']]]
];

const HK = ['role', 'age', 'gender', 'one', 'long', 'dream', 'free'], ALL = HK.concat(...SECS.map(x => x[2].map(q => q[0])));
const fl = (c, k) => { const v = ((c.a || {})[k] || '').trim(); return !!v && v != 'Indefinido'; };
const pct = c => Math.round(100 * ALL.filter(k => fl(c, k)).length / ALL.length);
const secN = (c, k) => SECS.find(x => x[0] == k)[2].filter(q => fl(c, q[0])).length;

const TPL = {
  '3': ['Tres actos', ['#Acto I · Planteamiento', 'Imagen inicial', 'Presentación del protagonista y su mundo', 'Detonante', 'Primer punto de giro', '#Acto II · Confrontación', 'Obstáculos crecientes', 'Punto medio', 'Todo está perdido', 'Segundo punto de giro', '#Acto III · Resolución', 'Clímax', 'Desenlace']],
  's': ['Save the Cat', ['Imagen inicial', 'Tema planteado', 'Preparación', 'Catalizador', 'Debate', 'Paso al Acto II', 'Trama B', 'Diversión y juegos', 'Punto medio', 'Los malos se acercan', 'Todo está perdido', 'Noche oscura del alma', 'Paso al Acto III', 'Final', 'Imagen final']],
  'h': ['Viaje del héroe', ['Mundo ordinario', 'Llamada a la aventura', 'Rechazo de la llamada', 'Encuentro con el mentor', 'Cruce del umbral', 'Pruebas, aliados y enemigos', 'Acercamiento a la cueva más profunda', 'Calvario', 'Recompensa', 'El camino de vuelta', 'Resurrección', 'Regreso con el elixir']]
};

const TABS = [
  ['cover', 'Portada'],
  ['syn', 'Tagline y sinopsis'],
  ['str', 'Estructura'],
  ['notes', 'Notas'],
  ['world', 'Mundo'],
  ['chars', 'Personajes'],
  ['locs', 'Localizaciones'],
  ['board', 'Escaleta'],
  ['treat', 'Tratamiento'],
  ['script', 'Guion'],
  ['dos', 'Dossier'],
  ['vers', 'Versiones'],
  ['config', 'Configuración']
];

const WORLD_TEMPLATES = {
  fantasy: {
    name: 'Fantasía / Ciencia Ficción',
    icon: '✨',
    sections: [
      {
        id: 'geo',
        title: '1. Geografía y entorno físico',
        icon: '🏔️',
        fields: [
          ['geo_where', '¿Dónde y cuándo ocurre la historia?', 'Planeta alienígena, reino fantástico, isla flotante o futuro postapocalíptico...'],
          ['geo_climate', '¿Cómo es el clima y la naturaleza?', 'Estaciones mágicas, lunas dobles, tormentas radiactivas o biomas sobrenaturales...'],
          ['geo_resources', '¿De dónde obtienen los recursos básicos?', 'Agua pura, alimento, cristales de energía, maná o minerales arcanos...'],
          ['geo_travel', '¿Cómo son las fronteras y los viajes?', 'Bestias míticas, naves espaciales, hiperespacio, portales o a pie...']
        ]
      },
      {
        id: 'soc',
        title: '2. Sociedad y culturas',
        icon: '👥',
        fields: [
          ['soc_factions', '¿Qué razas, clanes o facciones existen?', 'Elfos, cíborgs, gremios, tribus... ¿Qué prejuicios o alianzas ancestrales tienen?'],
          ['soc_daily', '¿Cómo es la vida cotidiana?', 'Qué comen, vestimenta, dialectos arcanos/alienígenas y celebraciones...'],
          ['soc_values', '¿Cuáles son sus valores y tabúes?', 'Lo que se castiga con destierro/muerte, deberes sagrados o blasfemias...'],
          ['soc_fears', '¿A qué le temen colectivamente?', 'El despertar de un dios antiguo, plagas alienígenas o profecías de extinción...']
        ]
      },
      {
        id: 'pol',
        title: '3. Política y poder',
        icon: '👑',
        fields: [
          ['pol_gov', '¿Quién gobierna y cómo ejerce el poder?', 'Imperio galáctico, monarquía de sangre, consejo teocrático o megacorporación...'],
          ['pol_power', '¿Quién controla los recursos o el poder arcano?', 'Quién tiene acceso a la magia/tecnología y quién está marginado o esclavizado...'],
          ['pol_conflicts', '¿Qué guerras o tensiones están activas?', 'Rencores de batallas pasadas, rebeliones ocultas o guerra fría entre facciones...']
        ]
      },
      {
        id: 'eco',
        title: '4. Economía y tecnología',
        icon: '⚙️',
        fields: [
          ['eco_system', '¿Cuál es el sistema económico y monetario?', 'Monedas de oro, créditos cuánticos, trueque de chatarra... Señores y desposeídos...'],
          ['eco_tech', '¿Cuál es el nivel tecnológico y sus artefactos?', 'Armas de plasma, alquimia, espadas de acero arcano, motores de antimateria...'],
          ['eco_comm', '¿Cómo se transmite la información?', 'Cuervos mensajeros, hologramas, telepatía o redes neuronales...']
        ]
      },
      {
        id: 'mag',
        title: '5. Religión, magia y reglas especiales',
        icon: '✨',
        fields: [
          ['mag_beliefs', '¿En qué creen las personas?', 'Dioses vivos, cultos fanáticos, leyendas ancestrales o ateísmo escéptico...'],
          ['mag_rules', '¿Cuáles son las reglas y el precio de la magia o tecnología?', 'Límites inviolables, coste de usarla (vida, cordura, sangre, combustible)...'],
          ['mag_collapse', '¿Qué pasa si algo colapsa o deja de funcionar?', 'Si la magia se apaga, el reactor colapsa o el líder muere, ¿qué dominó cae primero?']
        ]
      }
    ]
  },
  realistic: {
    name: 'Realista / Contemporáneo / Histórico',
    icon: '🏢',
    sections: [
      {
        id: 'geo',
        title: '1. Geografía y entorno real',
        icon: '🏙️',
        fields: [
          ['geo_where', '¿Dónde y en qué época ocurre la historia?', 'Ciudad moderna, pueblo rural, años 80, posguerra o barrio marginal en la actualidad...'],
          ['geo_climate', '¿Cómo es el ambiente y la atmósfera física?', 'Verano asfixiante, invierno lluvioso, bullicio industrial o claustrofobia urbana...'],
          ['geo_resources', '¿Cómo acceden a los recursos y servicios básicos?', 'Supermercados y comodidades, o escasez, apagones y comedores sociales...'],
          ['geo_travel', '¿Cómo son los límites, distancias y movilidad?', 'Fronteras entre barrios ricos/pobres, transporte público, coches, control policial...']
        ]
      },
      {
        id: 'soc',
        title: '2. Sociedad y clases sociales',
        icon: '👥',
        fields: [
          ['soc_factions', '¿Qué colectivos o grupos sociales chocan entre sí?', 'Familias enfrentadas, choque de clases, bandas callejeras o círculos cerrados...'],
          ['soc_daily', '¿Cómo es la rutina y el día a día?', 'Horarios laborales, qué comen, cómo visten para encajar y dónde se reúnen...'],
          ['soc_values', '¿Cuáles son los códigos morales y tabúes sociales?', 'Qué otorga prestigio o arruina una reputación, qué se considera una traición...'],
          ['soc_fears', '¿A qué le teme la comunidad o el entorno?', 'Miedo a la ruina económica, al desalojo, a la violencia, a la cárcel o al juicio social...']
        ]
      },
      {
        id: 'pol',
        title: '3. Poder, leyes e instituciones',
        icon: '⚖️',
        fields: [
          ['pol_gov', '¿Quién manda realmente en este entorno?', 'Autoridades oficiales (alcalde, policía), un cacique local o líderes del bajo mundo...'],
          ['pol_power', '¿Cómo actúa la ley y quién tiene impunidad?', 'Quién cuenta con contactos/dinero para eludir la ley y quién es perseguido...'],
          ['pol_conflicts', '¿Qué rivalidades o tensiones latentes existen?', 'Huelgas, rencores familiares antiguos, expedientes abiertos o pugna territorial...']
        ]
      },
      {
        id: 'eco',
        title: '4. Economía, dinero y medios',
        icon: '💼',
        fields: [
          ['eco_system', '¿Cuál es la realidad económica y laboral?', 'Sueldos precarios, deudas asfixiantes, dinero negro o grandes corporaciones...'],
          ['eco_tech', '¿Qué herramientas y tecnología tienen a su alcance?', 'Teléfonos inteligentes y cámaras, o maquinaria vieja, herramientas manuales...'],
          ['eco_comm', '¿Cómo corre la información y los rumores?', 'Redes sociales, grupos de mensajería, prensa local o cotilleos de barrio...']
        ]
      },
      {
        id: 'mag',
        title: '5. Reglas del juego y punto de quiebre',
        icon: '🎯',
        fields: [
          ['mag_beliefs', '¿En qué creen o cuál es la ideología predominante?', 'Tradición religiosa, ambición capitalista, cinismo escéptico o lealtad ciega...'],
          ['mag_rules', '¿Cuáles son las «reglas no escritas» del lugar?', 'Lo que todos saben pero nadie dice: a quién respetar, qué deudas pagar primero...'],
          ['mag_collapse', '¿Qué desataría la crisis o el caos?', 'Si sale a la luz un secreto, muere el cabecilla o la policía hace una redada...']
        ]
      }
    ]
  }
};

const PHASES = [
  {
    id: 'cover',
    name: 'Portada',
    icon: '📄',
    tabs: [
      ['cover', 'Portada']
    ]
  },
  {
    id: 'dev',
    name: 'Desarrollo',
    icon: '💡',
    tabs: [
      ['syn', 'Tagline y sinopsis'],
      ['str', 'Estructura'],
      ['notes', 'Notas']
    ]
  },
  {
    id: 'world',
    name: 'Mundo',
    icon: '🌍',
    tabs: [
      ['world', 'Mundo'],
      ['chars', 'Personajes'],
      ['locs', 'Localizaciones']
    ]
  },
  {
    id: 'write',
    name: 'Escritura',
    icon: '✍️',
    tabs: [
      ['board', 'Escaleta'],
      ['treat', 'Tratamiento'],
      ['script', 'Guion']
    ]
  },
  {
    id: 'output',
    name: 'Dossier y Extras',
    icon: '📋',
    tabs: [
      ['dos', 'Dossier'],
      ['vers', 'Versiones']
    ]
  }
];

let phaseLastTab = {
  cover: 'cover',
  dev: 'syn',
  world: 'world',
  write: 'script',
  output: 'dos'
};

function getPhaseForTab(t) {
  for (const p of PHASES) {
    if (p.tabs.some(x => x[0] === t)) return p;
  }
  return PHASES[0];
}

function renderNavBar() {
  if (inLauncher || (!currentId && tab !== 'config')) return '';
  if (tab === 'config' && !currentId) return '';

  const activePhase = getPhaseForTab(tab);

  const phaseBtnsHtml = PHASES.map(p => {
    const isActive = p.id === activePhase.id && tab !== 'config';
    return `
      <button class="phase-btn${isActive ? ' on' : ''}" data-a="pickphase" data-phase="${p.id}" title="${p.name}">
        <span>${p.icon}</span>
        <span>${p.name}</span>
      </button>
    `;
  }).join('');

  let subBtnsHtml = '';
  if (activePhase.tabs.length > 1 && tab !== 'config') {
    subBtnsHtml = activePhase.tabs.map(tb => {
      const isTabActive = tb[0] === tab;
      let countBadge = '';
      if (tb[0] === 'chars') countBadge = ` (${(S.chars || []).length})`;
      else if (tb[0] === 'locs') countBadge = ` (${(S.locs || []).length})`;
      else if (tb[0] === 'board') countBadge = ` (${(S.scenes || []).length})`;
      else if (tb[0] === 'notes') countBadge = ` (${(S.notes || []).length})`;
      else if (tb[0] === 'vers') countBadge = ` (${(S.vers || []).length})`;

      return `
        <button class="sub-btn${isTabActive ? ' on' : ''}" data-t="${tb[0]}" title="${tb[1]}">
          ${tb[1]}${countBadge}
        </button>
      `;
    }).join('');
  }

  return `
    <div class="phase-bar" style="display:flex;align-items:center;justify-content:space-between;gap:12px">
      <div style="display:flex;gap:6px;overflow-x:auto">${phaseBtnsHtml}</div>
      <button class="btn sm" data-a="openexportmodal" title="Exportar Guion o Dossier en PDF" style="flex:none;margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;font-weight:600">
        <span>📤</span> Exportar
      </button>
    </div>
    ${subBtnsHtml ? `<div class="sub-bar">${subBtnsHtml}</div>` : ''}
  `;
}

const V = {
  cover: () => head('Portada', 'Los datos de tu proyecto. Aparecen en el dossier.') +
    f('cover.title', 'Título') + f('cover.author', 'Autor o autora') + f('cover.genre', 'Género y tono', '', 'Ej.: thriller psicológico, comedia negra') + f('cover.contact', 'Contacto', '', 'Correo o teléfono') + f('cover.date', 'Fecha o versión', '', 'Ej.: Borrador 1, octubre 2026'),
  syn: () => head('Tagline y sinopsis', 'El tagline vende la película en una frase. La sinopsis cuenta la historia completa, final incluido.') + f('tag', 'Tagline', '', 'Una frase corta y con gancho') + '<span class="mu" data-c="tag"></span>' + f('syn', 'Sinopsis', 'ta', 'Protagonista, conflicto, giro y final. Entre 150 y 300 palabras.') + '<span class="mu" data-c="syn" data-u="w"></span>',
  str: () => {
    const bs = TPL[S.tpl][1];
    return head('Estructura', 'Elige una plantilla y coloca los giros de tu historia en cada punto.') + '<div class="row">' + Object.entries(TPL).map(([k, v]) => `<button class="btn ${k == S.tpl ? '' : 'g'}" data-a="tpl" data-v="${k}">${v[0]}</button>`).join('') + '</div>' + bs.map((b, i) => b[0] == '#' ? `<h2>${b.slice(1)}</h2>` : f('beats.' + S.tpl + '-' + i, b, 'ta')).join('');
  },
  world: () => {
    const mode = S.worldMode === 'realistic' ? 'realistic' : 'fantasy';
    const currentTpl = WORLD_TEMPLATES[mode] || WORLD_TEMPLATES.fantasy;
    const h = head('Mundo', 'La lógica y coherencia interna de tu universo narrativo. Responde solo lo que necesites para tu historia.');
    const modeSwitcher = `
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap;padding:12px 16px">
        <div>
          <b style="font-size:14px;color:var(--ink);display:flex;align-items:center;gap:6px">
            <span>${currentTpl.icon}</span> Enfoque de mundo: ${currentTpl.name}
          </b>
          <span class="mu" style="font-size:12px;display:block;margin-top:2px">
            Cambia entre fantasía/ciencia ficción y realismo cuando quieras. Tus textos se conservan intactos.
          </span>
        </div>
        <div style="display:flex;gap:6px;flex:none">
          <button class="btn sm ${mode === 'fantasy' ? '' : 'g'}" data-a="setworldmode" data-mode="fantasy">
            ✨ Fantasía / Sci-Fi
          </button>
          <button class="btn sm ${mode === 'realistic' ? '' : 'g'}" data-a="setworldmode" data-mode="realistic">
            🏢 Realista / Histórico
          </button>
        </div>
      </div>
    `;
    const nav = '<div class="row jn" style="margin-bottom:14px">' + currentTpl.sections.map(s => 
      `<button class="btn g sm" data-a="jump" data-v="world_${s.id}">${s.icon} ${s.title.replace(/^\\d+\\.\\s*/, '')}</button>`
    ).join('') + `<button class="btn g sm" data-a="jump" data-v="world_free">📝 Construcción libre</button></div>`;

    const cards = currentTpl.sections.map(s => {
      const isOpen = op['world_' + s.id] !== false;
      const fieldsHtml = s.fields.map(([fid, title, placeholder]) => {
        return f('world.' + fid, title, 'ta', placeholder);
      }).join('');

      return `
        <details class="card sec" data-sec="world_${s.id}"${isOpen ? ' open' : ''}>
          <summary>
            <span style="font-weight:700;display:flex;align-items:center;gap:8px">
              <span>${s.icon}</span> <span>${s.title}</span>
            </span>
          </summary>
          <div style="padding-top:10px">
            ${fieldsHtml}
          </div>
        </details>
      `;
    }).join('');

    const freeCard = `
      <details class="card sec" data-sec="world_free"${op['world_free'] !== false ? ' open' : ''}>
        <summary>
          <span style="font-weight:700;display:flex;align-items:center;gap:8px">
            <span>📝</span> <span>Construcción libre y notas del mundo</span>
          </span>
        </summary>
        <div style="padding-top:10px">
          <p class="mu" style="font-size:13px;margin:0 0 10px">
            Espacio abierto para volcar información a granel, cronologías, documentos de lore o desarrollar tu universo narrativo a tu propio estilo, sin tener que responder a las preguntas guiadas.
          </p>
          ${f('world.free', 'Construcción libre / Información a granel', 'ta', 'Escribe aquí tu worldbuilding libremente: historia previa del mundo, enciclopedia, eventos clave, reglas o apuntes a granel…').replace('<textarea', '<textarea style="min-height:180px"')}
        </div>
      </details>
    `;

    return h + modeSwitcher + nav + cards + freeCard;
  },
  chars: () => {
    if (cur == null || cur >= S.chars.length) cur = S.chars.length ? 0 : null;
    const av = (c, i) => `<span class="av" data-av="${i}" style="background:${safeColor(c.color)}">${safePhoto(c.photo) ? `<img src="${safePhoto(c.photo)}" alt="">` : esc((c.name || '?').trim().charAt(0).toUpperCase() || '?')}</span>`;
    const side = '<div class="side">' + S.chars.map((c, i) => `<button class="ci${i == cur ? ' on' : ''}" data-a="pick" data-i="${i}" title="Clic para seleccionar · Clic derecho para eliminar">${av(c, i)}<span class="cn"><b data-nm="${i}">${esc(c.name || 'Sin nombre')}</b><span class="mu">${fl(c, 'role') ? esc(c.a.role) + ' · ' : ''}<span data-pg="${i}">${pct(c)}</span> %</span></span></button>`).join('') + '<button class="btn g" data-a="addc">+ Personaje</button></div>';
    const c = S.chars[cur], h = head('Personajes', 'Una ficha completa por personaje. Responde solo lo que necesites: cada sección se puede plegar.');
    if (!c) return h + `<div class="cl">${side}<p class="mu">Aún no hay personajes. Crea el primero con el botón de la izquierda.</p></div>`;
    const P = 'chars.' + cur + '.', ROLES = ['Indefinido', 'Protagonista', 'Antagonista', 'Secundario', 'Mentor', 'Aliado', 'Interés romántico', 'Figurante'], GEN = ['Indefinido', 'Mujer', 'Hombre', 'No binario', 'Otro'], RK = ['Amistad', 'Familia', 'Pareja', 'Aliado', 'Mentor', 'Rival', 'Enemigo', 'Otro'];
    const sec = (k, t, body, n) => `<details class="card sec" data-sec="${k}"${(k == 'leg' ? op[k] === true : op[k] !== false) ? ' open' : ''}><summary><span>${t}</span>${n ? `<span class="mu" data-cn="${k}">${secN(c, k)} de ${n}</span>` : ''}</summary>${body}</details>`;
    const oth = S.chars.filter(x => x != c), by = oth.filter(x => x.rel.some(r => r.to == c.id)).map(x => esc(x.name || 'Sin nombre') + ' (' + esc(x.rel.find(r => r.to == c.id).kind) + ')');
    const relB = oth.length ? c.rel.map((r, k) => `<div class="rr"><div class="fl"><select data-k="${P}rel.${k}.to"><option value="">Elegir personaje…</option>${oth.map(o => `<option value="${o.id}"${o.id == r.to ? ' selected' : ''}>${esc(o.name || 'Sin nombre')}</option>`).join('')}</select><label>Relación con</label></div>${sel(P + 'rel.' + k + '.kind', 'Tipo', RK)}${f(P + 'rel.' + k + '.note', 'Cómo es esta relación')}<button class="btn g" data-a="delr" data-i="${k}">✕</button></div>`).join('') + '<p><button class="btn g" data-a="addr">+ Relación con otro personaje</button></p>' + (by.length ? `<p class="mu">También aparece en las relaciones de: ${by.join(', ')}</p>` : '') : '<p class="mu">Crea otro personaje para poder relacionarlos entre sí.</p>';
    const ph = `<div class="ph">${safePhoto(c.photo) ? `<img src="${safePhoto(c.photo)}" alt="">` : '<svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/></svg>'}<button class="btn g sm" data-a="addph">${safePhoto(c.photo) ? 'Cambiar foto' : 'Añadir fotografía +'}</button>${safePhoto(c.photo) ? '<button class="btn g sm" data-a="delph">Quitar</button>' : ''}<input type="file" id="pf" accept="image/*" hidden></div>`;
    const top = `<div class="card"><div class="hg"><div><div class="fl"><input data-k="${P}name" value="${esc(c.name)}" placeholder=" " style="padding-right:48px"><label>Nombre</label><input type="color" class="cdot" data-k="${P}color" value="${safeColor(c.color)}" title="Color del personaje"></div><div class="trio">${sel(P + 'a.role', 'Rol en la historia', ROLES)}${f(P + 'a.age', 'Edad')}${sel(P + 'a.gender', 'Género', GEN)}</div>${f(P + 'a.one', 'Descripción en una línea')}${f(P + 'a.long', 'Descripción extensa', 'ta')}${f(P + 'a.dream', 'Dreamcast', 'ta', 'Actores o actrices que lo interpretarían')}</div>${ph}</div></div>`;
    const freeCard = `
      <details class="card sec" data-sec="char_free"${op['char_free'] !== false ? ' open' : ''}>
        <summary>
          <span style="font-weight:700;display:flex;align-items:center;gap:8px">
            <span>📝</span> <span>Construcción libre y notas del personaje</span>
          </span>
        </summary>
        <div style="padding-top:10px">
          <p class="mu" style="font-size:13px;margin:0 0 10px">
            Espacio abierto para volcar información a granel sobre este personaje, monólogos, trasfondo, anécdotas o tu propia ficha personalizada sin tener que responder a las preguntas guiadas.
          </p>
          ${f(P + 'a.free', 'Construcción libre / Información a granel del personaje', 'ta', 'Escribe aquí libremente todo lo que quieras sobre el personaje: trasfondo, voz, anécdotas, psicología o tu propia ficha a tu manera…').replace('<textarea', '<textarea style="min-height:180px"')}
        </div>
      </details>
    `;
    const body = SECS.map(x => sec(x[0], x[1], (x[0] == 'rel' ? relB : '') + x[2].map(q => f(P + 'a.' + q[0], q[1], 'ta')).join(''), x[2].length)).join('');
    const nav = '<div class="row jn">' +
      `<button class="btn g sm" data-a="jump" data-v="char_free">📝 Libre</button>` +
      SECS.map(x => `<button class="btn g sm" data-a="jump" data-v="${x[0]}">${x[1]}</button>`).join('') +
      '</div>';
    return h + nav + `<div class="cl">${side}<div>${top}${freeCard}${body}${c.a.legacy ? sec('leg', 'Notas del formato anterior', f(P + 'a.legacy', 'Notas migradas', 'ta'), 0) : ''}<p><button class="btn g" data-a="delc">Eliminar personaje</button></p></div></div>`;
  },
  locs: () => head('Localizaciones', 'Una ficha por lugar. Sus nombres salen como sugerencias al escribir los encabezados de la escaleta.') + S.locs.map((l, i) => `<div class="card"><div class="row"><select data-k="locs.${i}.kind" style="width:auto">${['INT.', 'EXT.', 'INT./EXT.'].map(o => `<option${o == l.kind ? ' selected' : ''}>${o}</option>`).join('')}</select><input data-k="locs.${i}.name" value="${esc(l.name)}" placeholder="Nombre del lugar" style="flex:1"><button class="btn g" data-a="dell" data-i="${i}">✕</button></div>` + f(`locs.${i}.desc`, 'Descripción y atmósfera', 'ta') + f(`locs.${i}.note`, 'Notas de producción o escenas donde aparece', 'ta') + '</div>').join('') + '<button class="btn" data-a="addl">+ Localización</button>',
  board: () => head('Escaleta', `${S.scenes.length} escenas. Arrastra el asa o usa las flechas para reordenar.`) + `<datalist id="dl">${S.locs.filter(l => l.name).map(l => `<option value="${esc((l.kind + ' ' + l.name).toUpperCase())}">`).join('')}</datalist>` + S.scenes.map((s, i) => `<div class="card sc" data-i="${i}"><span class="hd" draggable="true" data-dr="${i}" title="Arrastrar">⠿ ${i + 1}</span><div><input list="dl" data-k="scenes.${i}.head" value="${esc(s.head)}" placeholder="INT. CAFÉ – DÍA"><textarea data-k="scenes.${i}.sum" placeholder="¿Qué ocurre y qué cambia en la escena?" style="margin-top:6px">${esc(s.sum)}</textarea></div><div class="col"><button class="btn g" data-a="up" data-i="${i}">↑</button><button class="btn g" data-a="dn" data-i="${i}">↓</button><button class="btn g" data-a="dels" data-i="${i}">✕</button></div></div>`).join('') + '<button class="btn" data-a="adds">+ Escena</button>',
  treat: () => head('Tratamiento', 'La historia completa en prosa y en presente, de principio a fin, final incluido. Poco diálogo: cuenta lo que se ve y se siente.') + f('treat', 'Tratamiento', 'ta', 'Empieza aquí…').replace('<textarea', '<textarea style="min-height:60vh"') + '<p class="row"><span class="mu" data-c="treat" data-u="w"></span><button class="btn g" data-a="skel">Añadir la escaleta como esqueleto</button></p>',
  script: () => renderScriptView(),
  notes: () => head('Notas', 'Ideas sueltas, notas de investigación y apuntes creativos para el desarrollo de tu historia.') +
    (!S.notes.length ? '<p class="mu" style="margin-bottom:16px">Aún no hay notas. Crea tu primera nota con el botón de abajo.</p>' : '') +
    S.notes.map((n, i) => `<div class="card"><div class="row"><input data-k="notes.${i}.t" value="${esc(n.t)}" placeholder="Título de la nota" style="flex:1"><button class="btn g" data-a="deln" data-i="${i}" title="Eliminar nota">✕</button></div><textarea data-k="notes.${i}.b" placeholder="Escribe aquí tu nota, idea, referencia…" style="margin-top:8px">${esc(n.b)}</textarea></div>`).join('') +
    '<button class="btn" data-a="addn">+ Nueva nota</button>',
  vers: () => head('Versiones', 'Guarda instantáneas completas de tu proyecto para experimentar sin miedo y poder volver atrás.') +
    (S.collab ?
      `<div class="card" style="margin-bottom:14px;background:var(--ac-glow);border-left:3px solid var(--ac)">
        <b style="font-size:14px;color:var(--ink)">👥 Versiones colaborativas</b><br>
        <span class="mu" style="font-size:13px;display:block;margin-top:2px">
          Guarda versiones identificadas con tu nombre para que tu compañero sepa qué cambios hiciste y cuándo.
        </span>
      </div>` : '') +
    `<div class="card" style="margin-bottom:20px">
      <b style="font-size:15px;display:block;margin-bottom:4px">Guardar versión actual</b>
      <span class="mu" style="font-size:13px;display:block;margin-bottom:12px">
        Crea un punto de restauración con todo el contenido actual del proyecto (guion, personajes, escaleta, notas).
      </span>
      <div class="row">
        <input id="vl" placeholder="${S.collab ? 'Ej. Revisión ' + esc(localStorage.getItem('guionlab-writer-name') || 'Rafa') + ' - Nuevas escenas' : 'Nombre de la versión, p. ej. Borrador 1, Antes de cambiar final…'}" style="flex:1">
        <button class="btn" data-a="sv">Guardar versión</button>
      </div>
    </div>` +
    '<h2>Historial de versiones</h2>' +
    (!S.vers.length ? '<p class="mu">Aún no has guardado ninguna versión de este proyecto.</p>' :
      S.vers.map((v, i) => `<div class="card row" style="align-items:center;margin-bottom:10px"><div style="flex:1"><b style="font-size:15px">${esc(v.l)}</b><br><span class="mu" style="font-size:13px">Guardada el ${esc(v.d)}</span></div><button class="btn g" data-a="rv" data-i="${i}" title="Restaurar el proyecto a esta versión">Restaurar</button><button class="btn g" data-a="delv" data-i="${i}" title="Eliminar del historial">✕</button></div>`).join('')),
  dos: () => {
    const c = S.cover, P = s => `<p class="pre">${esc(s)}</p>`, L = S.locs.filter(l => l.name);
    const mode = S.worldMode === 'realistic' ? 'realistic' : 'fantasy';
    const currentTpl = WORLD_TEMPLATES[mode] || WORLD_TEMPLATES.fantasy;
    const worldEntries = currentTpl.sections.map(s => {
      const filled = s.fields.filter(([fid]) => S.world && S.world[fid] && S.world[fid].trim());
      if (!filled.length) return '';
      return `<h3>${s.title}</h3>` + filled.map(([fid, title]) => `<p><b>${title}</b><br>${esc(S.world[fid])}</p>`).join('');
    }).filter(Boolean);
    if (S.world && S.world.free && S.world.free.trim()) {
      worldEntries.push('<h3>Construcción libre y notas del mundo</h3>' + P(S.world.free));
    }
    const worldDossierHtml = worldEntries.length ? (`<h2>Lógica del Mundo (${currentTpl.name})</h2>` + worldEntries.join('')) : '';

    return '<div class="np"><h1>Dossier</h1><p class="sub">Todo el proyecto en una vista para imprimir o consultar.</p></div>' + `<section class="dc"><div class="big">${esc(c.title || 'Sin título')}</div>` + [c.genre, c.author, c.contact, c.date].filter(Boolean).map(x => `<div class="mu">${esc(x)}</div>`).join('') + '</section>'
      + (S.tag ? `<p class="tag">«${esc(S.tag)}»</p>` : '') + (S.syn ? '<h2>Sinopsis</h2>' + P(S.syn) : '')
      + worldDossierHtml
      + (S.chars.length ? '<h2>Personajes</h2>' + S.chars.map(ch => {
        const a = ch.a || {}, q = (k, l) => fl(ch, k) ? `<p><b>${l}</b><br>${esc(a[k])}</p>` : '', nm = id => { const o = S.chars.find(x => x.id == id); return o ? esc(o.name || 'Sin nombre') : ''; }, rs = (ch.rel || []).filter(r => nm(r.to));
        return `<div class="card">${safePhoto(ch.photo) ? `<img class="dph" src="${safePhoto(ch.photo)}" alt="">` : ''}<h3>${esc(ch.name || 'Sin nombre')}</h3><p class="mu">${[a.role, a.age && 'Edad ' + a.age, a.gender].filter(x => x && x != 'Indefinido').map(esc).join(' · ')}</p>` + [['one', 'En una línea'], ['long', 'Descripción'], ['dream', 'Dreamcast']].map(x => q(x[0], x[1])).join('') + (a.free ? '<h4>Construcción libre y notas del personaje</h4>' + P(a.free) : '') + SECS.map(x => { const b = x[2].map(z => q(z[0], z[1])).join(''); return b ? `<h4>${x[1]}</h4>` + b : ''; }).join('') + (rs.length ? '<h4>Relaciones con otros personajes</h4>' + rs.map(r => `<p><b>${nm(r.to)}</b> · ${esc(r.kind)}${r.note ? '<br>' + esc(r.note) : ''}</p>`).join('') : '') + q('legacy', 'Notas del formato anterior') + '</div>';
      }).join('') : '')
      + (L.length ? '<h2>Localizaciones</h2>' + L.map(l => `<p><b>${esc(l.kind + ' ' + l.name)}</b><br>${esc(l.desc)}</p>`).join('') : '')
      + (S.scenes.length ? '<h2>Escaleta</h2><ol>' + S.scenes.map(s => `<li><b>${esc(s.head)}</b> ${esc(s.sum)}</li>`).join('') + '</ol>' : '')
      + (S.treat ? '<h2>Tratamiento</h2>' + P(S.treat) : '');
  },
  config: () => head('Configuración', 'Opciones generales y preferencias visuales de la aplicación.') +
    (currentId ?
      `<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px;gap:20px;margin-bottom:14px">
        <div style="flex:1">
          <b style="font-size:16px;display:block;margin-bottom:4px">Modalidad de trabajo del proyecto</b>
          <span class="mu" style="font-size:14px;line-height:1.4;display:block">
            ${S.collab ? '👥 <b>Modo Colaborativo activo:</b> Sincronización en vivo con Google Drive, OneDrive o Dropbox para escribir a 4 manos.' : '👤 <b>Modo Individual activo:</b> Proyecto para escribir en solitario en este equipo.'}
          </span>
        </div>
        <div class="row" style="gap:6px;flex:none">
          <button class="btn sm ${S.collab ? 'g' : ''}" data-a="setmode" data-v="solo">👤 Individual</button>
          <button class="btn sm ${S.collab ? '' : 'g'}" data-a="setmode" data-v="collab">👥 Colaborativo</button>
        </div>
      </div>` :
      `<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px;gap:20px;margin-bottom:14px">
        <div style="flex:1">
          <b style="font-size:16px;display:block;margin-bottom:4px">Modalidad de trabajo</b>
          <span class="mu" style="font-size:14px;line-height:1.4;display:block">
            Abre un proyecto para cambiar su modalidad entre Individual o Colaborativo (a 4 manos con Drive, OneDrive o Dropbox).
          </span>
        </div>
      </div>`
    ) +
    `<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px;gap:20px;margin-bottom:14px">
      <div style="flex:1">
        <b style="font-size:16px;display:block;margin-bottom:4px">Tema de la interfaz</b>
        <span class="mu" style="font-size:14px;line-height:1.4;display:block">
          Elige entre modo claro, modo oscuro o seguir automáticamente la configuración de tu sistema operativo.
        </span>
      </div>
      <div class="row" style="gap:6px;flex:none">
        <button class="btn sm ${CFG.theme === 'light' ? '' : 'g'}" data-a="settheme" data-v="light" title="Fijar modo claro siempre">☀ Claro</button>
        <button class="btn sm ${CFG.theme === 'dark' ? '' : 'g'}" data-a="settheme" data-v="dark" title="Fijar modo oscuro siempre">🌙 Oscuro</button>
        <button class="btn sm ${(!CFG.theme || CFG.theme === 'auto') ? '' : 'g'}" data-a="settheme" data-v="auto" title="Seguir la preferencia del sistema operativo">💻 Automático</button>
      </div>
    </div>` +
    `<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px;gap:20px">
      <div style="flex:1">
        <b style="font-size:16px;display:block;margin-bottom:4px">Recuadro de enfoque en el guion</b>
        <span class="mu" style="font-size:14px;line-height:1.4;display:block">
          Muestra un recuadro sombreado sobre la línea activa y la etiqueta del tipo de bloque (ESCENA, ACCIÓN, PERSONAJE...) mientras escribes. Si lo desactivas, la hoja se ve completamente limpia como en una máquina de escribir.
        </span>
      </div>
      <label class="switch" title="Activar / Desactivar recuadro">
        <input type="checkbox" id="cfg-focusbox" ${CFG.scriptFocusBox ? 'checked' : ''} data-a="togglefocusbox">
        <span class="slider"></span>
      </label>
    </div>` +
    `<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px;gap:20px;margin-top:14px">
      <div style="flex:1">
        <b style="font-size:16px;display:block;margin-bottom:4px">Actualizaciones automáticas</b>
        <span class="mu" style="font-size:14px;line-height:1.4;display:block">
          Versión instalada: <b>v1.6.6</b> · Conectado con GitHub Releases.
          <span id="cfg-update-status" style="display:block;margin-top:4px;color:var(--ac);font-weight:600"></span>
        </span>
      </div>
      <button class="btn g sm" data-a="checkupdatebtn" style="flex:none;padding:8px 14px;font-weight:600">🔍 Buscar actualizaciones</button>
    </div>`
};

function renderLauncher() {
  const list = getRecents();
  let cardsHtml = '';
  if (list.length) {
    cardsHtml = '<div class="pc-list">' + list.map(item => {
      const isSaved = !!item.path;
      const badge = isSaved ? '<span class="pc-badge saved">Archivo .guion</span>' : '<span class="pc-badge">Borrador local</span>';
      const collabBadge = item.collab ? '<span class="pc-badge" style="background:var(--ac-glow);color:var(--ink);border:1px solid var(--ac)">👥 Colaborativo</span>' : '';
      const metaParts = [];
      if (item.author) metaParts.push('Por ' + esc(item.author));
      if (item.genre) metaParts.push(esc(item.genre));
      if (item.scenes) metaParts.push(item.scenes + ' ' + (item.scenes === 1 ? 'escena' : 'escenas'));
      if (item.chars) metaParts.push(item.chars + ' ' + (item.chars === 1 ? 'personaje' : 'personajes'));
      const metaLine = metaParts.length ? `<div class="pc-meta">${metaParts.join(' · ')}</div>` : '';
      const dateTxt = 'Modificado ' + timeAgo(item.updatedAt);
      const pathTxt = item.path
        ? `<span class="pc-path" title="${esc(item.path)}">📄 ${esc(item.path)}</span>`
        : '<span class="pc-path" title="Borrador guardado en la memoria interna de la aplicación (LocalStorage). Usa «Guardar archivo» para exportarlo a tu disco.">💾 Memoria interna de la app (Borrador)</span>';
      const searchTerms = esc(((item.title || '') + ' ' + (item.genre || '') + ' ' + (item.author || '')).toLowerCase());

      return `<div class="pc-card" data-a="openproj" data-id="${esc(item.id)}" data-search="${searchTerms}">
        <div class="pc-top">
          <h2 class="pc-title">${esc(item.title || 'Proyecto sin título')}</h2>
          <div style="display:flex;gap:6px">${collabBadge}${badge}</div>
        </div>
        ${metaLine}
        <div class="pc-bot">
          <span>${dateTxt} · ${pathTxt}</span>
          <div class="pc-btns">
            <button class="btn sm" data-a="openproj" data-id="${esc(item.id)}">Abrir</button>
            <button class="btn g sm" data-a="renameproj" data-id="${esc(item.id)}" title="Cambiar título del proyecto y renombrar archivo físico en disco">✏️ Renombrar</button>
            ${item.path ? `<button class="btn g sm" data-a="showfolder" data-path="${esc(item.path)}" title="Ver archivo en el Explorador">Carpeta</button>` : `<button class="btn g sm" data-a="savedrafttofile" data-id="${esc(item.id)}" title="Guardar este borrador como archivo .guion físico en tu disco">💾 Guardar archivo</button>`}
            <button class="btn g sm" data-a="delproj" data-id="${esc(item.id)}" title="Eliminar proyecto del almacenamiento">🗑️ Eliminar</button>
          </div>
        </div>
      </div>`;
    }).join('') + '<p id="no-search-results" class="mu" style="display:none;text-align:center;padding:36px">No se encontraron proyectos con ese texto.</p></div>';
  } else {
    cardsHtml = `<div class="l-empty">
      <h2>¡Bienvenido a GuionLab!</h2>
      <p>Crea tu primer guion o abre un proyecto existente desde tu ordenador.</p>
      <button class="btn" data-a="newproj"><strong>+ Crear mi primer proyecto</strong></button>
    </div>`;
  }

  const searchHtml = list.length > 2 ? `<div class="l-search"><input type="search" id="search-proj" placeholder="Buscar proyecto por título, género o autor…"></div>` : '';

  return `<div class="launcher">
    <div class="l-hero">
      <div class="l-hero-brand">
        <div class="l-hero-logo-box">
          <img src="icon.png" alt="GuionLab" class="l-hero-logo">
        </div>
        <div class="l-hero-text">
          <div class="l-hero-title-row">
            <h1 class="l-app-title">GuionLab</h1>
            <span class="brand-badge l-hero-badge">STUDIO</span>
          </div>
          <p class="l-hero-subtitle">Preproducción y escritura cinematográfica profesional</p>
        </div>
      </div>
    </div>

    <div class="l-head">
      <div>
        <h2 class="l-sec-title">Mis Proyectos</h2>
        <p class="sub" style="margin:0">Elige un proyecto para continuar escribiendo o empieza uno nuevo.</p>
      </div>
      <div class="l-actions">
        <button class="btn" data-a="newproj"><strong>+ Nuevo proyecto</strong></button>
        <button class="btn g" data-a="fopen">📂 Abrir archivo…</button>
        <button class="btn g" data-a="openhelp">❓ Ayuda</button>
      </div>
    </div>
    ${searchHtml}
    ${cardsHtml}

    <div class="launcher-footer">
      <span class="lf-left">Developed by Rafa Dobón</span>
      <span class="lf-right">v1.6.6</span>
    </div>
  </div>`;
}

const SCRIPT_TYPES = [
  ['scene', 'Escena', '🎬'],
  ['action', 'Acción', '📝'],
  ['character', 'Personaje', '👤'],
  ['dialogue', 'Diálogo', '💬'],
  ['parenthetical', 'Acotación', '( )'],
  ['transition', 'Transición', '➡']
];

function formatParenthetical(str) {
  let s = (str || '').trim();
  if (!s) return '';
  if (!s.startsWith('(')) s = '(' + s;
  if (!s.endsWith(')')) s = s + ')';
  return s;
}

function getPlaceholderForType(type) {
  if (type === 'scene') return 'INT. / EXT. LUGAR - DÍA/NOCHE';
  if (type === 'character') return 'PERSONAJE (EN MAYÚSCULAS)';
  if (type === 'dialogue') return 'Escribe el diálogo aquí…';
  if (type === 'parenthetical') return '(acotación)';
  if (type === 'transition') return 'CORTE A:';
  return 'Descripción de la acción…';
}

function estimateBlockLines(b) {
  if (!b) return 1;
  const text = typeof b.text === 'string' ? b.text : '';
  let lines = 1;
  if (text.includes('\n')) {
    lines = text.split('\n').length;
  } else {
    const perLine = b.type === 'dialogue' ? 35 : (b.type === 'character' || b.type === 'parenthetical' ? 25 : 60);
    lines = Math.max(1, Math.ceil(text.length / perLine));
  }
  let spacing = 1;
  if (b.type === 'scene') spacing = 2;
  else if (b.type === 'character') spacing = 1;
  else if (b.type === 'parenthetical') spacing = 0;
  else if (b.type === 'dialogue') spacing = 1;
  else if (b.type === 'transition') spacing = 2;
  return lines + spacing;
}

function paginateScript(blocks) {
  if (!blocks || !blocks.length) return [[]];
  const pages = [];
  let curPage = [];
  let curLines = 0;
  const MAX_LINES = 48;

  blocks.forEach((b, i) => {
    const lines = estimateBlockLines(b);
    let forceNewPage = false;
    if (curPage.length > 0) {
      if (b.type === 'scene') {
        const nextB = blocks[i + 1];
        const nextLines = nextB ? estimateBlockLines(nextB) : 2;
        if (curLines + lines + nextLines > MAX_LINES) forceNewPage = true;
      } else if (b.type === 'character') {
        const nextB = blocks[i + 1];
        const nextLines = (nextB && nextB.type === 'dialogue') ? estimateBlockLines(nextB) : 2;
        if (curLines + lines + nextLines > MAX_LINES) forceNewPage = true;
      } else if (curLines + lines > MAX_LINES) {
        forceNewPage = true;
      }
    }

    if (forceNewPage) {
      pages.push(curPage);
      curPage = [{ block: b, index: i }];
      curLines = lines;
    } else {
      curPage.push({ block: b, index: i });
      curLines += lines;
    }
  });

  if (curPage.length > 0) {
    pages.push(curPage);
  }
  return pages.length ? pages : [[]];
}

function getScriptStats() {
  const blocks = S.script || [];
  const scenes = blocks.filter(b => b.type === 'scene').length;
  let totalWords = 0;
  blocks.forEach(b => {
    const t = (b.text || '').trim();
    if (t) totalWords += t.split(/\s+/).length;
  });
  const pages = Math.max(1, paginateScript(blocks).length);
  return { scenes, words: totalWords, pages };
}

function renderPagesHtml(paginated) {
  const totalPages = paginated.length;
  return paginated.map((pageItems, pageIdx) => {
    const pageNum = pageIdx + 1;
    const blocksHtml = pageItems.map(item => {
      const b = item.block;
      const i = item.index;
      let val = b.text || '';
      if (b.type === 'character') val = val.toUpperCase();
      else if (b.type === 'parenthetical' && val.trim()) val = formatParenthetical(val);
      return `
      <div class="sb-block sb-${b.type}" data-i="${i}" data-type="${b.type}">
        <textarea data-si="${i}" placeholder="${getPlaceholderForType(b.type)}" rows="1">${esc(val)}</textarea>
        <span class="sb-badge">${b.type}</span>
      </div>`;
    }).join('');

    return `
      <div class="script-page-sheet" data-page="${pageNum}">
        <div class="script-page-header">
          <span class="script-page-num">${pageNum > 1 ? pageNum + '.' : ''}</span>
        </div>
        <div class="script-page-body">
          ${blocksHtml}
        </div>
        <div class="script-page-footer">
          <span>Pág. ${pageNum} de ${totalPages}</span>
        </div>
      </div>
    `;
  }).join('');
}

function refreshScriptPages(targetBlockIndex, cursorOffset = 0) {
  const wrap = M.querySelector('.script-pages-wrap');
  if (!wrap) {
    render();
    if (typeof targetBlockIndex === 'number') focusScriptBlock(targetBlockIndex, cursorOffset);
    return;
  }
  const paginated = paginateScript(S.script);
  wrap.innerHTML = renderPagesHtml(paginated);
  const stats = getScriptStats();
  const statsTxt = `~${stats.pages} ${stats.pages === 1 ? 'pág' : 'págs'} · ${stats.scenes} escenas · ${stats.words} palabras`;
  const stEl = document.querySelector('.script-stats span');
  if (stEl) stEl.textContent = statsTxt;
  const fsStats = $('#fs-stats');
  if (fsStats) fsStats.textContent = statsTxt;
  if (typeof targetBlockIndex === 'number') focusScriptBlock(targetBlockIndex, cursorOffset);
}

function renderRefContent() {
  if (scriptRefTab === 'chars') {
    if (!S.chars || !S.chars.length) return '<p class="mu">Aún no hay personajes en este proyecto.</p>';
    return S.chars.map(c => `
      <div class="card" style="font-size:13px">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
          <span class="av" style="background:${safeColor(c.color)};width:26px;height:26px;font-size:12px">${safePhoto(c.photo) ? `<img src="${safePhoto(c.photo)}">` : esc((c.name || '?').charAt(0).toUpperCase())}</span>
          <b>${esc(c.name || 'Sin nombre')}</b>
          <span class="mu" style="font-size:12px">${esc(c.a?.role || '')}</span>
        </div>
        ${c.a?.one ? `<p style="margin:4px 0"><b>En una línea:</b> ${esc(c.a.one)}</p>` : ''}
        ${c.a?.pers ? `<p style="margin:4px 0"><b>Personalidad:</b> ${esc(c.a.pers)}</p>` : ''}
        ${c.a?.habla ? `<p style="margin:4px 0"><b>Forma de hablar:</b> ${esc(c.a.habla)}</p>` : ''}
        ${c.a?.need ? `<p style="margin:4px 0"><b>Necesidad:</b> ${esc(c.a.need)}</p>` : ''}
        ${c.a?.free ? `<p style="margin:4px 0;white-space:pre-wrap"><b>Notas libres:</b> ${esc(c.a.free)}</p>` : ''}
      </div>
    `).join('');
  }
  if (scriptRefTab === 'board') {
    if (!S.scenes || !S.scenes.length) return '<p class="mu">Aún no hay escenas en la escaleta.</p>';
    return S.scenes.map((s, i) => `
      <div class="card" style="font-size:13px">
        <b>${i + 1}. ${esc(s.head || 'Sin encabezado')}</b>
        <p style="margin:4px 0 0" class="mu">${esc(s.sum || '')}</p>
      </div>
    `).join('');
  }
  if (scriptRefTab === 'treat') {
    if (!S.treat) return '<p class="mu">No hay texto en el tratamiento todavía.</p>';
    return `<div class="card pre" style="font-size:13px;white-space:pre-wrap">${esc(S.treat)}</div>`;
  }
  if (scriptRefTab === 'str') {
    const bs = TPL[S.tpl][1];
    return bs.map((b, i) => b[0] == '#' ? `<h4 style="font-size:14px;margin:12px 0 4px;color:var(--ac)">${esc(b.slice(1))}</h4>` : `
      <div class="card" style="font-size:13px">
        <b>${esc(b)}</b>
        <p style="margin:4px 0 0" class="mu">${esc(S.beats[S.tpl + '-' + i] || 'Sin definir')}</p>
      </div>
    `).join('');
  }
  if (scriptRefTab === 'locs') {
    if (!S.locs || !S.locs.length) return '<p class="mu">No hay localizaciones creadas.</p>';
    return S.locs.map(l => `
      <div class="card" style="font-size:13px">
        <b>${esc(l.kind + ' ' + l.name)}</b>
        ${l.desc ? `<p style="margin:4px 0 0" class="mu">${esc(l.desc)}</p>` : ''}
      </div>
    `).join('');
  }
  if (scriptRefTab === 'notes') {
    if (!S.notes || !S.notes.length) return '<p class="mu">No hay notas creadas.</p>';
    return S.notes.map(n => `
      <div class="card" style="font-size:13px">
        <b>${esc(n.t || 'Nota')}</b>
        <p style="margin:4px 0 0;white-space:pre-wrap" class="mu">${esc(n.b || '')}</p>
      </div>
    `).join('');
  }
  if (scriptRefTab === 'world') {
    const mode = S.worldMode === 'realistic' ? 'realistic' : 'fantasy';
    const currentTpl = WORLD_TEMPLATES[mode] || WORLD_TEMPLATES.fantasy;
    const entries = currentTpl.sections.map(s => {
      const filled = s.fields.filter(([fid]) => S.world && S.world[fid] && S.world[fid].trim());
      if (!filled.length) return '';
      return `
        <div class="card" style="font-size:13px;margin-bottom:8px">
          <b>${s.icon} ${s.title}</b>
          ${filled.map(([fid, title]) => `<div style="margin-top:6px"><b>${title}</b><p style="margin:2px 0 0;white-space:pre-wrap" class="mu">${esc(S.world[fid])}</p></div>`).join('')}
        </div>
      `;
    }).filter(Boolean);
    if (S.world && S.world.free && S.world.free.trim()) {
      entries.push(`
        <div class="card" style="font-size:13px;margin-bottom:8px">
          <b>📝 Construcción libre del mundo</b>
          <p style="margin:4px 0 0;white-space:pre-wrap" class="mu">${esc(S.world.free)}</p>
        </div>
      `);
    }
    if (!entries.length) return '<p class="mu">Aún no has añadido datos en la pestaña Mundo.</p>';
    return entries.join('');
  }
  if (scriptRefTab === 'syn') {
    return `
      <div class="card" style="font-size:13px">
        <b>Tagline:</b>
        <p class="mu" style="font-style:italic;margin:4px 0 8px">«${esc(S.tag || 'Sin tagline')}»</p>
        <b>Sinopsis:</b>
        <p class="mu" style="white-space:pre-wrap;margin:4px 0 0">${esc(S.syn || 'Sin sinopsis')}</p>
      </div>
    `;
  }
  return '';
}

function renderScriptView() {
  if (!S.script || !S.script.length) {
    S.script = [{ id: uid(), type: 'scene', text: '' }];
  }
  const stats = getScriptStats();
  const activeBlock = S.script[curScriptBlock] || S.script[0];
  const activeType = activeBlock ? activeBlock.type : 'action';

  const pillsHtml = SCRIPT_TYPES.map(st => `
    <button class="${st[0] === activeType ? 'on' : ''}" data-a="setscripttype" data-type="${st[0]}" title="Formatear como ${st[1]} (Tab / Ctrl+1..6)">
      ${st[2]} ${st[1]}
    </button>
  `).join('');

  const paginated = paginateScript(S.script);
  const pagesHtml = renderPagesHtml(paginated);

  const refHtml = `
    <div class="ref-pane">
      <div class="ref-head">
        <b>Panel de referencia</b>
        <select class="ref-select" data-a="pickref">
          <option value="chars"${scriptRefTab === 'chars' ? ' selected' : ''}>👤 Personajes (${(S.chars || []).length})</option>
          <option value="world"${scriptRefTab === 'world' ? ' selected' : ''}>🌍 Mundo</option>
          <option value="board"${scriptRefTab === 'board' ? ' selected' : ''}>🎞 Escaleta (${(S.scenes || []).length})</option>
          <option value="treat"${scriptRefTab === 'treat' ? ' selected' : ''}>📖 Tratamiento</option>
          <option value="str"${scriptRefTab === 'str' ? ' selected' : ''}>📐 Estructura</option>
          <option value="locs"${scriptRefTab === 'locs' ? ' selected' : ''}>📍 Lugares (${(S.locs || []).length})</option>
          <option value="notes"${scriptRefTab === 'notes' ? ' selected' : ''}>💡 Notas (${(S.notes || []).length})</option>
          <option value="syn"${scriptRefTab === 'syn' ? ' selected' : ''}>📌 Sinopsis</option>
        </select>
      </div>
      <div class="ref-body">${renderRefContent()}</div>
    </div>
  `;

  const statsTxt = `~${stats.pages} ${stats.pages === 1 ? 'pág' : 'págs'} · ${stats.scenes} escenas · ${stats.words} palabras`;
  const fsStats = $('#fs-stats');
  if (fsStats) fsStats.textContent = statsTxt;

  return `
    <div class="script-wrap">
      <div class="script-toolbar">
        <div class="format-pills">
          ${pillsHtml}
        </div>
        <div class="script-tools-right">
          <div class="script-stats">
            <span>${statsTxt}</span>
          </div>
          ${S.scenes && S.scenes.length && S.script.length <= 1 && !S.script[0].text ? `<button class="btn g sm" data-a="importescaleta" title="Importar escenas de la escaleta">+ Importar escaleta</button>` : ''}
          <button class="btn ${scriptSplit ? '' : 'g'} sm" data-a="togglesplit" title="Mostrar u ocultar panel de referencias lateral">
            ${scriptSplit ? '✕ Cerrar panel' : '◫ Panel de referencias'}
          </button>
          <button class="btn g sm" data-a="togglescriptfs" title="Escribir a pantalla completa sin distracciones">
            ⛶ Pantalla completa
          </button>
        </div>
      </div>
      <div class="script-split-wrap${scriptSplit ? '' : ' no-split'}">
        <div class="script-pages-wrap">
          ${pagesHtml}
        </div>
        ${scriptSplit ? refHtml : ''}
      </div>
    </div>
  `;
}

function setScriptBlockType(i, type) {
  if (!S.script[i]) return;
  if (type === 'character' && S.script[i].text) {
    S.script[i].text = S.script[i].text.toUpperCase();
  } else if (type === 'parenthetical' && S.script[i].text.trim()) {
    S.script[i].text = formatParenthetical(S.script[i].text);
  }
  S.script[i].type = type;
  curScriptBlock = i;
  save();
  const blockEl = M.querySelector(`.sb-block[data-i="${i}"]`);
  if (blockEl) {
    blockEl.className = `sb-block sb-${type}`;
    blockEl.dataset.type = type;
    const badge = blockEl.querySelector('.sb-badge');
    if (badge) badge.textContent = type;
    const ta = blockEl.querySelector('textarea');
    if (ta) {
      ta.value = S.script[i].text;
      ta.placeholder = getPlaceholderForType(type);
    }
    document.querySelectorAll('.format-pills button').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.type === type);
    });
  } else {
    render();
    focusScriptBlock(i);
  }
}

function focusScriptBlock(idx, pos) {
  setTimeout(() => {
    const ta = M.querySelector(`textarea[data-si="${idx}"]`);
    if (ta) {
      ta.focus();
      if (typeof pos === 'number') {
        ta.selectionStart = ta.selectionEnd = Math.min(pos, ta.value.length);
      }
      ta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 10);
}

function toggleScriptFs() {
  isScriptFs = !isScriptFs;
  document.body.classList.toggle('is-script-fullscreen', isScriptFs);
  const fsBar = $('#fs-bar');
  if (fsBar) fsBar.style.display = isScriptFs ? 'inline-flex' : 'none';
  if (isScriptFs) {
    const stats = getScriptStats();
    const fsStats = $('#fs-stats');
    if (fsStats) fsStats.textContent = `~${stats.pages} pág · ${stats.scenes} escenas · ${stats.words} palabras`;
  }
}

function importEscaletaToScript() {
  if (!S.scenes || !S.scenes.length) {
    alert('No hay escenas en la escaleta para importar.');
    return;
  }
  if (S.script && S.script.length > 1 && !confirm('¿Añadir las escenas de la escaleta al guion?')) {
    return;
  }
  const newBlocks = [];
  S.scenes.forEach(s => {
    if (s.head) newBlocks.push({ id: uid(), type: 'scene', text: s.head.toUpperCase() });
    if (s.sum) newBlocks.push({ id: uid(), type: 'action', text: s.sum });
  });
  if (newBlocks.length) {
    if (S.script.length === 1 && !S.script[0].text) {
      S.script = newBlocks;
    } else {
      S.script = S.script.concat(newBlocks);
    }
    save();
    render();
    st('Escaleta importada al guion ✓');
  }
}

async function fPdfScript() {
  const title = S.cover?.title || 'Guion';
  const author = S.cover?.author || '';
  const contact = S.cover?.contact || '';
  const date = S.cover?.date || '';

  const titlePageHtml = `
    <div class="script-title-page" style="page-break-after:always;break-after:page;width:210mm;height:297mm;min-height:297mm;max-height:297mm;display:flex;flex-direction:column;justify-content:space-between;text-align:center;font-family:'Courier Prime',Courier,monospace;font-size:12pt;font-weight:normal;line-height:1.4;padding:60mm 25.4mm 30mm 38.1mm;box-sizing:border-box;background:#ffffff;color:#000000">
      <div></div>
      <div>
        <div style="font-size:12pt;font-weight:normal;letter-spacing:1px;text-transform:uppercase;margin:0 0 24px;color:#000">${esc(title)}</div>
        ${author ? `<div style="font-size:12pt;font-weight:normal;margin:0 0 12px;color:#000">por</div><div style="font-size:12pt;font-weight:normal;margin:0;color:#000">${esc(author)}</div>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;text-align:left;font-size:12pt;font-weight:normal;color:#000;padding:0">
        <div>${esc(contact).replace(/\n/g, '<br>')}</div>
        <div style="text-align:right">${esc(date)}</div>
      </div>
    </div>
  `;

  const blocks = S.script && S.script.length ? S.script : [{ type: 'action', text: '' }];
  const paginated = paginateScript(blocks);
  const totalPages = Math.max(1, paginated.length);

  const scriptPagesHtml = paginated.map((pageItems, pageIdx) => {
    const pageNum = pageIdx + 1;
    const blocksHtml = pageItems.map(item => {
      const b = item.block;
      const text = esc(b.text || '');
      if (b.type === 'scene') return `<div style="font-weight:normal;text-transform:uppercase;margin-top:22px;margin-bottom:8px;page-break-after:avoid">${esc(b.text.toUpperCase())}</div>`;
      if (b.type === 'character') return `<div style="font-weight:normal;text-transform:uppercase;margin-left:37%;width:40%;margin-top:14px;margin-bottom:0;page-break-after:avoid">${esc(b.text.toUpperCase())}</div>`;
      if (b.type === 'parenthetical') return `<div style="font-weight:normal;margin-left:27%;width:36%;margin-bottom:0;page-break-after:avoid">${esc(formatParenthetical(b.text))}</div>`;
      if (b.type === 'dialogue') return `<div style="font-weight:normal;margin-left:17%;width:62%;margin-bottom:14px">${text}</div>`;
      if (b.type === 'transition') return `<div style="font-weight:normal;text-align:right;margin-left:auto;width:40%;text-transform:uppercase;margin-top:16px;margin-bottom:16px">${esc(b.text.toUpperCase())}</div>`;
      return `<div style="font-weight:normal;margin-bottom:12px">${text}</div>`;
    }).join('');

    return `
      <div class="script-page-sheet" style="page-break-after:${pageNum < totalPages ? 'always' : 'auto'};break-after:${pageNum < totalPages ? 'page' : 'auto'};width:210mm;height:297mm;min-height:297mm;max-height:297mm;padding:25.4mm 25.4mm 25.4mm 38.1mm;box-sizing:border-box;background:#ffffff;color:#000000;overflow:hidden">
        <div style="height:24px;display:flex;justify-content:flex-end;font-size:12pt;font-weight:normal;margin-bottom:8px">
          <span>${pageNum > 1 ? pageNum + '.' : ''}</span>
        </div>
        <div>
          ${blocksHtml}
        </div>
      </div>
    `;
  }).join('');

  const oldContent = M.innerHTML;
  const oldClass = M.className;
  const prevTheme = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', 'light');
  document.body.classList.add('printing-script');
  M.innerHTML = `<div class="script-print-container" style="font-family:'Courier Prime',Courier,monospace;font-size:12pt;line-height:1.25;font-weight:normal;color:#000;background:#ffffff;width:210mm;margin:0 auto">${titlePageHtml}${scriptPagesHtml}</div>`;

  st('Generando PDF del guion…');
  await new Promise(r => setTimeout(r, 250));
  const p = await api.pdf(title, 'guion');

  document.body.classList.remove('printing-script');
  if (prevTheme) document.documentElement.setAttribute('data-theme', prevTheme);
  else document.documentElement.removeAttribute('data-theme');
  M.className = oldClass;
  M.innerHTML = oldContent;
  st(p ? 'PDF del guion exportado ✓' : '');
}

function cc() {
  const c = S.chars[cur];
  if (!c) return;
  M.querySelectorAll('[data-nm]').forEach(e => e.textContent = S.chars[e.dataset.nm].name || 'Sin nombre');
  M.querySelectorAll('[data-av]').forEach(e => e.style.background = safeColor(S.chars[e.dataset.av]?.color));
  M.querySelectorAll('[data-pg]').forEach(e => e.textContent = pct(S.chars[e.dataset.pg]));
  M.querySelectorAll('[data-cn]').forEach(e => e.textContent = secN(c, e.dataset.cn) + ' de ' + SECS.find(x => x[0] == e.dataset.cn)[2].length);
}

function cnt() {
  document.querySelectorAll('[data-c]').forEach(e => {
    const v = g(e.dataset.c);
    e.textContent = e.dataset.u == 'w' ? wc(v) + ' palabras' : v.length + ' caracteres';
  });
}

function render() {
  const btnHome = $('#btn-back');
  const nav = $('#nav');
  const cfgBtn = $('#btn-top-cfg');
  if (cfgBtn) cfgBtn.className = tab === 'config' ? 'btn sm' : 'btn g sm';
  document.body.classList.toggle('in-launcher', inLauncher);

  if (inLauncher) {
    if (btnHome) btnHome.style.display = 'none';
    if (nav) nav.innerHTML = '';
    $('#ttl').textContent = '';
    document.title = 'GuionLab — Mis Proyectos';
    const rec = getRecents();
    st(rec.length ? `${rec.length} proyecto${rec.length === 1 ? '' : 's'}` : '');
    M.className = 'launcher-view';
    M.innerHTML = renderLauncher();
    const si = $('#search-proj');
    if (si) {
      si.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        let vis = 0;
        M.querySelectorAll('.pc-card').forEach(card => {
          const match = !q || (card.dataset.search || '').includes(q);
          card.style.display = match ? '' : 'none';
          if (match) vis++;
        });
        const noRes = $('#no-search-results');
        if (noRes) noRes.style.display = (vis === 0 && q) ? 'block' : 'none';
      });
    }
    return;
  }

  if (!currentId && tab !== 'config') {
    inLauncher = true;
    render();
    return;
  }

  if (btnHome) btnHome.style.display = 'inline-flex';
  if (nav) {
    nav.innerHTML = renderNavBar();
  }
  M.className = tab == 'script' ? ('script' + (scriptSplit ? '' : ' no-split')) : tab;
  M.innerHTML = V[tab]();
  setTtl();
  cnt();
  updateHeaderHeight();
}

function updateHeaderHeight() {
  const headerEl = document.querySelector('header');
  if (headerEl) {
    const h = headerEl.offsetHeight;
    if (h) {
      document.documentElement.style.setProperty('--header-height', h + 'px');
    }
  }
}
window.addEventListener('resize', updateHeaderHeight);

function mv(a, b) {
  if (b < 0 || b >= S.scenes.length || a == b) return;
  const x = S.scenes.splice(a, 1)[0];
  S.scenes.splice(b, 0, x);
  save();
  render();
}

function snap(l) {
  S.vers.unshift({ l, d: new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }), s: JSON.stringify({ ...S, vers: [] }) });
  S.vers = S.vers.slice(0, 20);
}

function deleteCharIndex(idx) {
  if (idx == null || idx < 0 || idx >= S.chars.length) return;
  const c = S.chars[idx];
  const name = (c.name || '').trim() ? `"${c.name.trim()}"` : 'este personaje';
  if (confirm(`¿Estás seguro de que quieres eliminar ${name}? Esta acción no se puede deshacer.`)) {
    const id = c.id;
    S.chars.splice(idx, 1);
    S.chars.forEach(x => x.rel = (x.rel || []).filter(r => r.to != id));
    if (cur === idx) {
      cur = S.chars.length ? Math.min(idx, S.chars.length - 1) : null;
    } else if (cur > idx) {
      cur--;
    }
    save();
    render();
  }
}

const A = {
  gohome() { goHome(); return false; },
  newproj() { showNewProjectModal(); return false; },
  cancelmodal() {
    const modal = $('#modal-container');
    if (modal) modal.style.display = 'none';
    return false;
  },
  pickmode(i, t) {
    const mode = t.dataset.mode;
    const cardSolo = $('#mode-solo');
    const cardCollab = $('#mode-collab');
    const collabFields = $('#collab-fields');
    if (mode === 'collab') {
      if (cardSolo) cardSolo.classList.remove('selected');
      if (cardCollab) cardCollab.classList.add('selected');
      if (collabFields) collabFields.style.display = 'block';
      const w1 = $('#np-w1');
      if (w1 && !w1.value) w1.focus();
    } else {
      if (cardSolo) cardSolo.classList.add('selected');
      if (cardCollab) cardCollab.classList.remove('selected');
      if (collabFields) collabFields.style.display = 'none';
    }
    return false;
  },
  async confirmnewproj() {
    const title = ($('#np-title') ? $('#np-title').value.trim() : '') || 'Nuevo proyecto';
    const isCollab = $('#mode-collab') && $('#mode-collab').classList.contains('selected');
    const w1 = $('#np-w1') ? $('#np-w1').value.trim() : '';
    const w2 = $('#np-w2') ? $('#np-w2').value.trim() : '';

    if (w1) {
      try { localStorage.setItem('guionlab-writer-name', w1); } catch (e) {}
    }

    const modal = $('#modal-container');
    if (modal) modal.style.display = 'none';

    await createNewProject({
      title,
      collab: isCollab,
      writers: [w1, w2].filter(Boolean)
    });
    return false;
  },
  setmode(i, t) {
    S.collab = (t.dataset.v === 'collab');
    persist(true, true);
    render();
    st(S.collab ? 'Cambiado a Modo Colaborativo 👥' : 'Cambiado a Modo Individual 👤');
    return false;
  },
  reloadcollab() {
    reloadExternalFile();
    return false;
  },
  dismisscollab() {
    const b = $('#collab-banner');
    if (b) b.style.display = 'none';
    return false;
  },
  installupdatenow() {
    if (window.api && api.installUpdateNow) api.installUpdateNow();
    return false;
  },
  dismissupdatebanner() {
    const b = $('#update-banner');
    if (b) b.style.display = 'none';
    return false;
  },
  checkupdatebtn() {
    const cfgSt = $('#cfg-update-status');
    if (cfgSt) cfgSt.textContent = 'Buscando actualizaciones en GitHub…';
    if (window.api && api.checkUpdate) api.checkUpdate();
    return false;
  },
  opendrivedl() {
    if (window.api && api.openExternal) api.openExternal('https://www.google.com/drive/download/');
    return false;
  },
  opendriveweb() {
    if (window.api && api.openExternal) api.openExternal('https://drive.google.com');
    return false;
  },
  openonedriveweb() {
    if (window.api && api.openExternal) api.openExternal('https://onedrive.live.com');
    return false;
  },
  opendropboxdl() {
    if (window.api && api.openExternal) api.openExternal('https://www.dropbox.com/install');
    return false;
  },
  opendropboxweb() {
    if (window.api && api.openExternal) api.openExternal('https://dropbox.com');
    return false;
  },
  openhelp() {
    showHelpModal('collab');
    return false;
  },
  switchhelptab(i, t) {
    if (t.dataset.tab) showHelpModal(t.dataset.tab);
    return false;
  },
  switchhelpcloud(i, t) {
    const cloud = t.dataset.cloud;
    if (!cloud) return false;
    currentHelpCloud = cloud;
    const c = $('#help-cloud-guide-content');
    if (c) c.innerHTML = renderCollabCloudGuide(cloud);
    const parent = t.parentElement;
    if (parent) {
      parent.querySelectorAll('[data-a="switchhelpcloud"]').forEach(b => {
        b.classList.toggle('on', b.dataset.cloud === cloud);
      });
    }
    return false;
  },
  switchprojcloud(i, t) {
    const cloud = t.dataset.cloud;
    if (!cloud) return false;
    currentNewProjCloud = cloud;
    const c = $('#collab-cloud-guide-container');
    if (c) c.innerHTML = renderCollabCloudGuide(cloud);
    const parent = t.parentElement;
    if (parent) {
      parent.querySelectorAll('[data-a="switchprojcloud"]').forEach(b => {
        b.classList.toggle('on', b.dataset.cloud === cloud);
      });
    }
    return false;
  },
  delproj(i, t) {
    const id = t.dataset.id;
    if (id) showDeleteProjectModal(id);
    return false;
  },
  async confirmdelproj(i, t) {
    const id = t.dataset.id;
    if (!id) return false;
    const modal = $('#modal-container');
    if (modal) modal.style.display = 'none';

    const list = getRecents();
    const item = list.find(x => x.id === id);
    if (item && item.path && window.api && window.api.deleteFile) {
      try {
        const res = await api.deleteFile(item.path);
        if (res && res.error) {
          alert('No se pudo eliminar el archivo físico: ' + res.error);
        }
      } catch (err) {
        console.error('Error al borrar archivo físico:', err);
      }
    }

    removeRecent(id);
    st('🗑️ Proyecto eliminado del almacenamiento');
    return false;
  },
  showfolder(i, t) {
    if (t.dataset.path) api.showInFolder(t.dataset.path);
    return false;
  },
  renameproj(i, t) {
    const id = t.dataset.id;
    if (!id) return false;
    const list = getRecents();
    const item = list.find(x => x.id === id);
    if (!item) return false;
    showRenameModal(item);
    return false;
  },
  async confirmrenameproj(i, t) {
    const id = t.dataset.id;
    if (!id) return false;
    const input = $('#rename-title');
    const newTitle = (input ? input.value : '').trim();
    if (!newTitle) {
      alert('Introduce un título válido.');
      return false;
    }

    const modal = $('#modal-container');
    if (modal) modal.style.display = 'none';

    const list = getRecents();
    const item = list.find(x => x.id === id);
    if (!item) return false;

    if (item.path && window.api && window.api.renameFile) {
      try {
        const res = await api.renameFile(item.path, newTitle);
        if (res && res.success && res.newPath) {
          item.path = res.newPath;
          item.title = newTitle;
          try {
            const r = await api.readPath(res.newPath);
            if (r && r.data) {
              const data = r.data;
              if (!data.cover) data.cover = {};
              data.cover.title = newTitle;
              await api.write(JSON.stringify(data), res.newPath);
            }
          } catch (e) {}

          if (currentId === id) {
            S.cover.title = newTitle;
            filePath = res.newPath;
            setTtl();
          }
          item.updatedAt = Date.now();
          saveRecents(list);
          st('Proyecto y archivo renombrados con éxito ✓');
        } else if (res && res.error) {
          alert('No se pudo renombrar el archivo en disco:\n' + res.error);
          return false;
        }
      } catch (err) {
        alert('Error al renombrar: ' + err.message);
        return false;
      }
    } else {
      item.title = newTitle;
      try {
        const raw = localStorage.getItem(KEY_PROJ + id);
        if (raw) {
          const data = JSON.parse(raw);
          if (!data.cover) data.cover = {};
          data.cover.title = newTitle;
          localStorage.setItem(KEY_PROJ + id, JSON.stringify(data));
        }
      } catch (e) {}
      if (currentId === id) {
        S.cover.title = newTitle;
        setTtl();
      }
      item.updatedAt = Date.now();
      saveRecents(list);
      st('Título actualizado con éxito ✓');
    }

    render();
    return false;
  },
  async savedrafttofile(i, t) {
    const id = t.dataset.id;
    if (!id) return false;
    const list = getRecents();
    const item = list.find(x => x.id === id);
    if (!item) return false;

    let projectData = null;
    if (currentId === id) {
      projectData = S;
    } else {
      const raw = localStorage.getItem(KEY_PROJ + id);
      if (raw) {
        try { projectData = JSON.parse(raw); } catch (e) {}
      }
    }
    if (!projectData) {
      alert('No se encontraron datos para este borrador.');
      return false;
    }

    const p = await api.saveAs(JSON.stringify(projectData), item.title || 'Mi guion', Boolean(item.collab));
    if (p) {
      item.path = p;
      item.updatedAt = Date.now();
      saveRecents(list);
      if (currentId === id) {
        filePath = p;
        isNewDraftThisSession = false;
        isDirty = false;
      }
      render();
      st('Borrador guardado como archivo .guion ✓');
    }
    return false;
  },
  openproj(i, t) {
    const id = t.dataset.id;
    if (id) openRecent(id);
    return false;
  },
  addc() {
    S.chars.push({ id: uid(), v: 2, name: '', a: {}, rel: [], color: PAL[S.chars.length % PAL.length] });
    cur = S.chars.length - 1;
    scrollTo({ top: 0, behavior: 'smooth' });
  },
  pick(i) {
    cur = i;
    scrollTo({ top: 0, behavior: 'smooth' });
  },
  delc() {
    deleteCharIndex(cur);
    return false;
  },
  addr() { S.chars[cur].rel.push({ to: '', kind: 'Amistad', note: '' }); },
  delr(i) { S.chars[cur].rel.splice(i, 1); },
  addph() { $('#pf').click(); return false; },
  delph() { S.chars[cur].photo = ''; },
  jump(i, t) {
    const d = M.querySelector('[data-sec="' + t.dataset.v + '"]');
    if (d) {
      d.open = true;
      op[t.dataset.v] = true;
      const header = document.querySelector('header');
      const hH = header ? header.offsetHeight : 50;
      const y = d.getBoundingClientRect().top + window.scrollY - hH - 16;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
    return false;
  },
  setworldmode(i, t) {
    const m = t.dataset.mode;
    if (m === 'fantasy' || m === 'realistic') {
      S.worldMode = m;
      save();
      render();
    }
    return false;
  },
  addl() { S.locs.push({ kind: 'INT.', name: '', desc: '', note: '' }); },
  dell(i) { S.locs.splice(i, 1); },
  adds() { S.scenes.push({ head: '', sum: '' }); },
  dels(i) { S.scenes.splice(i, 1); },
  up(i) { mv(i, i - 1); },
  dn(i) { mv(i, i + 1); },
  addn() { S.notes.push({ t: '', b: '' }); },
  deln(i) { S.notes.splice(i, 1); },
  sv() { snap($('#vl').value || 'Versión sin nombre'); },
  delv(i) { S.vers.splice(i, 1); },
  rv(i) {
    const v = S.vers[i];
    snap('Antes de restaurar');
    S = norm({ ...blank(), ...JSON.parse(v.s), vers: S.vers });
    cur = null;
  },
  tpl(i, t) { S.tpl = t.dataset.v; },
  skel() {
    S.treat += (S.treat ? '\n\n' : '') + S.scenes.map((s, i) => `${i + 1}. ${s.head || ''}${s.sum ? ': ' + s.sum : ''}`).join('\n\n');
  },
  fopen() { fOpen(); return false; },
  fsave() { fSave(); return false; },
  fsaveas() { fSaveAs(); return false; },
  pr() { showExportModal(); return false; },
  openexportmodal() { showExportModal(); return false; },
  doexportscript() {
    const modal = $('#modal-container');
    if (modal) modal.style.display = 'none';
    fPdfScript();
    return false;
  },
  doexportdossier() {
    const modal = $('#modal-container');
    if (modal) modal.style.display = 'none';
    fPdf();
    return false;
  },
  togglesplit() { scriptSplit = !scriptSplit; render(); return false; },
  togglescriptfs() { toggleScriptFs(); return false; },
  exportscriptpdf() { fPdfScript(); return false; },
  importescaleta() { importEscaletaToScript(); return false; },
  setscripttype(i, t) { setScriptBlockType(curScriptBlock, t.dataset.type); return false; },
  togglefocusbox(i, t) {
    CFG.scriptFocusBox = t.checked;
    applyConfig();
    return false;
  },
  openconfig() {
    inLauncher = false;
    tab = 'config';
    render();
    return false;
  },
  settheme(i, t) {
    CFG.theme = t.dataset.v || 'auto';
    applyConfig();
    render();
    return false;
  },
  pickphase(i, t) {
    const pid = t.dataset.phase;
    const targetPhase = PHASES.find(p => p.id === pid);
    if (targetPhase) {
      tab = phaseLastTab[pid] || targetPhase.tabs[0][0];
      render();
      scrollTo(0, 0);
    }
    return false;
  }
};

api.onMenu(c => {
  if (c == 'home') goHome();
  else if (c == 'new') showNewProjectModal();
  else if (c == 'open') fOpen();
  else if (c == 'save' && !inLauncher) fSave();
  else if (c == 'saveas' && !inLauncher) fSaveAs();
  else if (c == 'pdf' && !inLauncher) fPdf();
  else if (c == 'pdf-script' && !inLauncher) fPdfScript();
  else if (c == 'config') {
    tab = 'config';
    render();
  }
  else if (c == 'help') {
    showHelpModal();
  }
});

async function reloadExternalFile() {
  const b = $('#collab-banner');
  if (b) b.style.display = 'none';
  if (!filePath) return;

  const r = await api.readPath(filePath);
  if (r && r.data) {
    snap('Antes de recargar cambios de compañero');
    S = norm({ ...blank(), ...r.data });
    isDirty = false;
    render();
    st('Guion recargado con los últimos cambios del archivo ✓');
  } else {
    alert('No se pudo recargar el archivo en disco.');
  }
}

if (api.onExternalChange) {
  api.onExternalChange(d => {
    if (inLauncher || !filePath) return;
    const b = $('#collab-banner');
    if (b) {
      b.style.display = 'flex';
      st('⚠ Cambios detectados en el archivo en disco');
    }
  });
}

if (api.onUpdateStatus) {
  api.onUpdateStatus(data => {
    if (!data) return;
    if (data.status === 'ready') {
      const b = $('#update-banner');
      if (b) {
        const titleEl = $('#update-banner-title');
        if (titleEl) titleEl.textContent = `¡GuionLab v${data.version || ''} listo para instalar!`;
        b.style.display = 'flex';
      }
      const cfgSt = $('#cfg-update-status');
      if (cfgSt) cfgSt.textContent = `🎉 ¡Versión v${data.version || ''} lista para instalar!`;
      st(`¡Actualización v${data.version || ''} lista!`);
    } else if (data.status === 'downloading') {
      const cfgSt = $('#cfg-update-status');
      if (cfgSt) cfgSt.textContent = `Descargando actualización: ${data.percent || 0}%…`;
      st(`Descargando actualización: ${data.percent || 0}%…`);
    } else if (data.status === 'available') {
      const cfgSt = $('#cfg-update-status');
      if (cfgSt) cfgSt.textContent = `Nueva versión v${data.version || ''} encontrada. Descargando…`;
      st(`Nueva versión v${data.version || ''} encontrada`);
    } else if (data.status === 'not-available') {
      const cfgSt = $('#cfg-update-status');
      if (cfgSt) cfgSt.textContent = '✓ GuionLab está actualizado a la última versión.';
      st('GuionLab al día ✓');
    } else if (data.status === 'error') {
      const cfgSt = $('#cfg-update-status');
      if (cfgSt) cfgSt.textContent = 'No se pudo conectar con el servidor de actualizaciones.';
    }
  });
}

if (api.onCloseRequested) {
  api.onCloseRequested(async () => {
    if (inLauncher || !currentId) {
      api.forceClose();
      return;
    }

    const isDraft = !filePath;
    const projectTitle = S?.cover?.title || (isDraft ? 'Nuevo proyecto' : 'Proyecto sin título');

    const action = await api.confirmClose({
      isDraft,
      title: projectTitle,
      filePath
    });

    if (action === 'save') {
      if (filePath) {
        skipFileSaveOnExit = false;
        persist(true, true);
      }
      api.forceClose();
    } else if (action === 'saveas') {
      const savedPath = await fSaveAs();
      if (savedPath) {
        api.forceClose();
      }
    } else if (action === 'dontsave') {
      skipFileSaveOnExit = true;
      if (isNewDraftThisSession && currentId) {
        removeRecent(currentId);
      }
      api.forceClose();
    }
  });
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-t],[data-a],[data-phase],.pc-card,.mode-card');
  if (!t) return;

  const modeCard = t.closest('.mode-card');
  if (modeCard) {
    A.pickmode(null, modeCard);
    return;
  }

  if (t.classList.contains('pc-card') && !e.target.closest('button')) {
    const id = t.dataset.id;
    if (id) openRecent(id);
    return;
  }

  const phaseBtn = t.closest('[data-phase]');
  if (phaseBtn) {
    const pid = phaseBtn.dataset.phase;
    const targetPhase = PHASES.find(p => p.id === pid);
    if (targetPhase) {
      tab = phaseLastTab[pid] || targetPhase.tabs[0][0];
      render();
      scrollTo(0, 0);
    }
    return;
  }

  if (t.dataset.t) {
    if (!currentId && t.dataset.t !== 'config') return;
    tab = t.dataset.t;
    const p = getPhaseForTab(tab);
    if (p) phaseLastTab[p.id] = tab;
    render();
    scrollTo(0, 0);
    return;
  }

  const a = t.dataset.a, i = +t.dataset.i;
  if (!a || typeof A[a] !== 'function') return;

  if (/^(del|rv)/.test(a)) {
    const armKey = a + (t.dataset.id || i);
    if (arm != armKey) {
      arm = armKey;
      const o = t.textContent;
      t.textContent = '¿Seguro?';
      setTimeout(() => {
        if (arm == armKey) {
          arm = null;
          t.textContent = o;
        }
      }, 3000);
      return;
    }
  }

  arm = null;
  if (A[a](i, t) !== false) {
    save();
    render();
  }
});

M.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.si != null) {
    const idx = +t.dataset.si;
    if (S.script[idx]) {
      if (S.script[idx].type === 'character') {
        const start = t.selectionStart, end = t.selectionEnd;
        t.value = t.value.toUpperCase();
        t.setSelectionRange(start, end);
      }
      S.script[idx].text = t.value;
      save();
      const stats = getScriptStats();
      const txt = `~${stats.pages} pág · ${stats.scenes} escenas · ${stats.words} palabras`;
      const stEl = document.querySelector('.script-stats span');
      if (stEl) stEl.textContent = txt;
      const fsStats = $('#fs-stats');
      if (fsStats) fsStats.textContent = txt;
    }
    return;
  }
  const p = t.dataset.k;
  if (!p) return;
  setP(p, t.value);
  if (p == 'cover.title') setTtl();
  if (p.startsWith('chars.')) cc();
  cnt();
  save();
});

M.addEventListener('focusout', e => {
  const t = e.target;
  if (t && t.dataset && t.dataset.k === 'cover.title') {
    handleTitleRename(t.value);
  }
  if (t.dataset && t.dataset.si != null) {
    const idx = +t.dataset.si;
    const b = S.script[idx];
    if (b) {
      if (b.type === 'character') {
        b.text = b.text.toUpperCase();
        t.value = b.text;
      } else if (b.type === 'parenthetical' && b.text.trim()) {
        b.text = formatParenthetical(b.text);
        t.value = b.text;
      }
      save();
    }
  }
});

M.addEventListener('keydown', e => {
  const t = e.target;
  if (t && t.dataset && t.dataset.k === 'cover.title' && e.key === 'Enter') {
    e.preventDefault();
    t.blur();
    return;
  }
  if (!t.dataset || t.dataset.si == null) return;
  const i = +t.dataset.si;
  const block = S.script[i];
  if (!block) return;

  if (e.ctrlKey && !e.shiftKey && !e.altKey) {
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 6) {
      e.preventDefault();
      setScriptBlockType(i, SCRIPT_TYPES[num - 1][0]);
      return;
    }
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    if (block.type === 'parenthetical' && t.value.trim()) {
      t.value = formatParenthetical(t.value);
      block.text = t.value;
    } else if (block.type === 'character' && t.value) {
      t.value = t.value.toUpperCase();
      block.text = t.value;
    }
    const order = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'];
    const curIdx = order.indexOf(block.type);
    const nextIdx = e.shiftKey ? (curIdx - 1 + order.length) % order.length : (curIdx + 1) % order.length;
    setScriptBlockType(i, order[nextIdx]);
    return;
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (block.type === 'parenthetical' && t.value.trim()) {
      t.value = formatParenthetical(t.value);
      block.text = t.value;
    } else if (block.type === 'character' && t.value) {
      t.value = t.value.toUpperCase();
      block.text = t.value;
    }
    let nextType = 'action';
    if (block.type === 'scene') nextType = 'action';
    else if (block.type === 'action') nextType = 'action';
    else if (block.type === 'character') nextType = 'dialogue';
    else if (block.type === 'parenthetical') nextType = 'dialogue';
    else if (block.type === 'dialogue') nextType = 'action';
    else if (block.type === 'transition') nextType = 'scene';

    const pos = t.selectionStart;
    const full = t.value;
    const before = full.slice(0, pos);
    const after = full.slice(pos);

    block.text = before;
    t.value = before;

    const newBlock = { id: uid(), type: nextType, text: after };
    S.script.splice(i + 1, 0, newBlock);
    curScriptBlock = i + 1;
    save();

    const currentBlockEl = t.closest('.sb-block');
    const currentSheet = currentBlockEl ? currentBlockEl.closest('.script-page-sheet') : null;
    const wrap = M.querySelector('.script-pages-wrap');

    if (currentBlockEl && currentSheet && wrap) {
      const sheetBlocks = currentSheet.querySelectorAll('.sb-block');
      let sheetLines = 0;
      sheetBlocks.forEach(el => {
        const idx = +el.dataset.i;
        if (S.script[idx]) sheetLines += estimateBlockLines(S.script[idx]);
      });
      sheetLines += estimateBlockLines(newBlock);

      const body = currentSheet.querySelector('.script-page-body');
      const isPixelOverflow = body && (body.scrollHeight + 32 > body.clientHeight);

      if (sheetLines <= 48 && !isPixelOverflow && nextType !== 'scene') {
        const newEl = document.createElement('div');
        newEl.className = `sb-block sb-${nextType}`;
        newEl.dataset.i = i + 1;
        newEl.dataset.type = nextType;
        newEl.innerHTML = `<textarea data-si="${i + 1}" placeholder="${getPlaceholderForType(nextType)}" rows="1">${esc(after)}</textarea><span class="sb-badge">${nextType}</span>`;
        currentBlockEl.after(newEl);

        const allBlocks = wrap.querySelectorAll('.sb-block');
        allBlocks.forEach(bEl => {
          const idx = +bEl.dataset.i;
          if (idx > i + 1) {
            bEl.dataset.i = idx + 1;
            const bTa = bEl.querySelector('textarea');
            if (bTa) bTa.dataset.si = idx + 1;
          }
        });

        document.querySelectorAll('.format-pills button').forEach(btn => {
          btn.classList.toggle('on', btn.dataset.type === nextType);
        });

        const stats = getScriptStats();
        const txt = `~${stats.pages} ${stats.pages === 1 ? 'pág' : 'págs'} · ${stats.scenes} escenas · ${stats.words} palabras`;
        const stEl = document.querySelector('.script-stats span');
        if (stEl) stEl.textContent = txt;
        const fsStats = $('#fs-stats');
        if (fsStats) fsStats.textContent = txt;

        focusScriptBlock(i + 1, 0);
        return;
      }
    }

    refreshScriptPages(i + 1, 0);
    return;
  }

  if (e.key === 'Backspace' && t.selectionStart === 0 && t.selectionEnd === 0) {
    if (S.script.length > 1 && i > 0) {
      e.preventDefault();
      const prevBlock = S.script[i - 1];
      const prevLen = prevBlock.text.length;
      prevBlock.text += block.text;
      S.script.splice(i, 1);
      curScriptBlock = i - 1;
      save();

      const currentBlockEl = t.closest('.sb-block');
      const currentSheet = currentBlockEl ? currentBlockEl.closest('.script-page-sheet') : null;
      const wrap = M.querySelector('.script-pages-wrap');
      const prevTa = wrap ? wrap.querySelector(`textarea[data-si="${i - 1}"]`) : null;
      const prevSheet = prevTa ? prevTa.closest('.script-page-sheet') : null;

      if (currentBlockEl && currentSheet && prevSheet === currentSheet && wrap && prevTa) {
        prevTa.value = prevBlock.text;
        currentBlockEl.remove();

        const allBlocks = wrap.querySelectorAll('.sb-block');
        allBlocks.forEach(bEl => {
          const idx = +bEl.dataset.i;
          if (idx > i) {
            bEl.dataset.i = idx - 1;
            const bTa = bEl.querySelector('textarea');
            if (bTa) bTa.dataset.si = idx - 1;
          }
        });

        const stats = getScriptStats();
        const txt = `~${stats.pages} ${stats.pages === 1 ? 'pág' : 'págs'} · ${stats.scenes} escenas · ${stats.words} palabras`;
        const stEl = document.querySelector('.script-stats span');
        if (stEl) stEl.textContent = txt;
        const fsStats = $('#fs-stats');
        if (fsStats) fsStats.textContent = txt;

        focusScriptBlock(i - 1, prevLen);
        return;
      }

      refreshScriptPages(i - 1, prevLen);
      return;
    }
  }

  if (e.key === 'ArrowUp' && t.selectionStart === 0 && i > 0) {
    e.preventDefault();
    focusScriptBlock(i - 1, S.script[i - 1].text.length);
  } else if (e.key === 'ArrowDown' && t.selectionStart === t.value.length && i < S.script.length - 1) {
    e.preventDefault();
    focusScriptBlock(i + 1, 0);
  }
});

M.addEventListener('focusin', e => {
  const t = e.target;
  if (t.dataset && t.dataset.si != null) {
    curScriptBlock = +t.dataset.si;
    const block = S.script[curScriptBlock];
    if (block) {
      document.querySelectorAll('.format-pills button').forEach(btn => {
        btn.classList.toggle('on', btn.dataset.type === block.type);
      });
    }
  }
});

M.addEventListener('dragstart', e => {
  const h = e.target.closest('[data-dr]');
  if (h) {
    dr = +h.dataset.dr;
    e.dataTransfer.setData('text/plain', 's');
    e.dataTransfer.setDragImage(h.closest('.card'), 10, 10);
  }
});

M.addEventListener('dragover', e => {
  if (dr != null && e.target.closest('.sc')) e.preventDefault();
});

M.addEventListener('drop', e => {
  const c = e.target.closest('.sc');
  if (c && dr != null) {
    e.preventDefault();
    const a = dr;
    dr = null;
    mv(a, +c.dataset.i);
  }
});

M.addEventListener('toggle', e => {
  const d = e.target;
  if (d.dataset && d.dataset.sec) op[d.dataset.sec] = d.open;
}, true);

M.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.a === 'pickref') {
    scriptRefTab = t.value;
    const refBody = M.querySelector('.ref-body');
    if (refBody) refBody.innerHTML = renderRefContent();
    return;
  }
  if (t.id != 'pf' || !t.files[0]) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 400 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
      cv.width = Math.round(im.width * k);
      cv.height = Math.round(im.height * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      S.chars[cur].photo = cv.toDataURL('image/jpeg', .82);
      save();
      render();
    };
    im.src = r.result;
  };
  r.readAsDataURL(t.files[0]);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = $('#modal-container');
    if (modal && modal.style.display !== 'none') {
      modal.style.display = 'none';
      return;
    }
    if (isScriptFs) {
      toggleScriptFs();
    }
  } else if (e.key === 'F1') {
    e.preventDefault();
    showHelpModal();
  }
});

const modalContainer = $('#modal-container');
if (modalContainer) {
  modalContainer.addEventListener('click', e => {
    if (e.target === modalContainer) modalContainer.style.display = 'none';
  });
}

document.addEventListener('contextmenu', e => {
  const ci = e.target.closest('.side .ci');
  if (ci && ci.dataset.i != null) {
    e.preventDefault();
    deleteCharIndex(+ci.dataset.i);
  }
});

// Initialization
initStorage();
applyConfig();

if (window.api && api.getFileToOpen) {
  api.getFileToOpen().then(f => {
    if (f && f.data) {
      const list = getRecents();
      const exist = list.find(x => x.path === f.path);
      currentId = exist ? exist.id : uid();
      isNewDraftThisSession = false;
      isDirty = false;
      S = norm({ ...blank(), ...f.data });
      filePath = f.path;
      inLauncher = false;
      tab = 'cover';
      updateCurrentInRecents();
      persist(true, false);
      render();
      st('Listo');
    } else {
      render();
    }
  }).catch(() => render());
} else {
  render();
}

booted = true;
