const fs = require('fs');
const path = require('path');
const tar = require('tar');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const LINUX_UNPACKED = path.join(DIST, 'linux-unpacked');

function makeArHeader(name, size, mode = '100644', mtime = 0) {
  const buf = Buffer.alloc(60, 0x20); // 60 bytes filled with ASCII spaces
  buf.write(name, 0, 16, 'ascii');
  buf.write(String(mtime || Math.floor(Date.now() / 1000)), 16, 12, 'ascii');
  buf.write('0', 28, 6, 'ascii');
  buf.write('0', 34, 6, 'ascii');
  buf.write(mode, 40, 8, 'ascii');
  buf.write(String(size), 48, 10, 'ascii');
  buf[58] = 0x60;
  buf[59] = 0x0a;
  return buf;
}

async function streamToFile(readStream, writeStream) {
  return new Promise((resolve, reject) => {
    readStream.pipe(writeStream, { end: false });
    readStream.on('end', resolve);
    readStream.on('error', reject);
  });
}

async function buildDeb() {
  console.log('📦 Construyendo paquete instalador .deb (Debian / Ubuntu / Mint)...');
  const staging = path.join(DIST, 'deb-staging');
  const controlDir = path.join(staging, 'control');
  const dataDir = path.join(staging, 'data');

  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(controlDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  // 1. debian-binary
  const debianBinaryPath = path.join(staging, 'debian-binary');
  fs.writeFileSync(debianBinaryPath, '2.0\n', 'ascii');

  // 2. Control files
  const controlContent = `Package: guionlab
Version: 1.6.5
Section: utils
Priority: optional
Architecture: amd64
Maintainer: Rafael Dobón Romo <contacto@guionlab.com>
Homepage: https://guionlab.com
Installed-Size: 320000
Description: GuionLab Studio: preproduccion y escritura de guiones
 GuionLab es una suite profesional para guionistas con diseno nordico,
 preproduccion cinematografica, fichas tridimensionales de personajes,
 construccion de mundo libre, escaleta, tratamiento y guion literario.
`;
  fs.writeFileSync(path.join(controlDir, 'control'), controlContent.replace(/\r\n/g, '\n'), 'utf8');

  const postinstContent = `#!/bin/sh
set -e
chmod +x /opt/guionlab/guionlab 2>/dev/null || true
if [ -f /opt/guionlab/chrome-sandbox ]; then
    chmod 4755 /opt/guionlab/chrome-sandbox 2>/dev/null || chmod +x /opt/guionlab/chrome-sandbox 2>/dev/null || true
fi
ln -sf /opt/guionlab/guionlab /usr/bin/guionlab 2>/dev/null || true
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi
exit 0
`;
  fs.writeFileSync(path.join(controlDir, 'postinst'), postinstContent.replace(/\r\n/g, '\n'), 'utf8');

  const postrmContent = `#!/bin/sh
set -e
if [ "$1" = "remove" ] || [ "$1" = "purge" ]; then
    rm -f /usr/bin/guionlab
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database -q /usr/share/applications || true
    fi
    if command -v gtk-update-icon-cache >/dev/null 2>&1; then
        gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
    fi
fi
exit 0
`;
  fs.writeFileSync(path.join(controlDir, 'postrm'), postrmContent.replace(/\r\n/g, '\n'), 'utf8');

  const prermContent = `#!/bin/sh
set -e
rm -f /usr/bin/guionlab
exit 0
`;
  fs.writeFileSync(path.join(controlDir, 'prerm'), prermContent.replace(/\r\n/g, '\n'), 'utf8');

  // Pack control.tar.gz
  const controlTarPath = path.join(staging, 'control.tar.gz');
  await tar.c(
    {
      gzip: true,
      portable: true,
      file: controlTarPath,
      cwd: controlDir
    },
    ['control', 'postinst', 'postrm', 'prerm']
  );

  // 3. Data files
  const optGuionLab = path.join(dataDir, 'opt', 'guionlab');
  const usrApps = path.join(dataDir, 'usr', 'share', 'applications');
  const usrIcons = path.join(dataDir, 'usr', 'share', 'icons', 'hicolor', '512x512', 'apps');
  const usrBin = path.join(dataDir, 'usr', 'bin');

  fs.mkdirSync(optGuionLab, { recursive: true });
  fs.mkdirSync(usrApps, { recursive: true });
  fs.mkdirSync(usrIcons, { recursive: true });
  fs.mkdirSync(usrBin, { recursive: true });

  // Copy linux-unpacked into /opt/guionlab
  console.log('  -> Copiando binarios a /opt/guionlab...');
  fs.cpSync(LINUX_UNPACKED, optGuionLab, { recursive: true });

  // Copy icon
  fs.copyFileSync(path.join(ROOT, 'build', 'icon.png'), path.join(usrIcons, 'guionlab.png'));

  // Desktop launcher
  const desktopFileContent = `[Desktop Entry]
Name=GuionLab Studio
GenericName=Editor de Guiones
Comment=Preproducción y escritura de guiones cinematográficos y series
Exec=/opt/guionlab/guionlab %U
Icon=guionlab
Terminal=false
Type=Application
Categories=Office;WordProcessor;Utility;
StartupWMClass=GuionLab
MimeType=application/x-guionlab;
Keywords=script;screenplay;guion;cine;teatro;historia;
`;
  fs.writeFileSync(path.join(usrApps, 'guionlab.desktop'), desktopFileContent.replace(/\r\n/g, '\n'), 'utf8');

  // Wrapper in /usr/bin
  const binWrapperContent = `#!/bin/sh
exec /opt/guionlab/guionlab "$@"
`;
  fs.writeFileSync(path.join(usrBin, 'guionlab'), binWrapperContent.replace(/\r\n/g, '\n'), 'utf8');

  // Pack data.tar.gz
  console.log('  -> Empaquetando data.tar.gz (puede tardar unos segundos)...');
  const dataTarPath = path.join(staging, 'data.tar.gz');
  await tar.c(
    {
      gzip: true,
      portable: true,
      file: dataTarPath,
      cwd: dataDir
    },
    ['opt', 'usr']
  );

  // 4. Assemble ar archive (.deb)
  const debOutputPath = path.join(DIST, 'GuionLab_1.6.5_amd64.deb');
  console.log('  -> Ensamblando archivo final .deb...');

  const debStream = fs.createWriteStream(debOutputPath);

  // Magic
  debStream.write(Buffer.from('!<arch>\n', 'ascii'));

  // 1. debian-binary
  const debBinBuffer = fs.readFileSync(debianBinaryPath);
  debStream.write(makeArHeader('debian-binary', debBinBuffer.length, '100644'));
  debStream.write(debBinBuffer);
  if (debBinBuffer.length % 2 !== 0) debStream.write(Buffer.from('\n', 'ascii'));

  // 2. control.tar.gz
  const controlStat = fs.statSync(controlTarPath);
  debStream.write(makeArHeader('control.tar.gz', controlStat.size, '100644'));
  await streamToFile(fs.createReadStream(controlTarPath), debStream);
  if (controlStat.size % 2 !== 0) debStream.write(Buffer.from('\n', 'ascii'));

  // 3. data.tar.gz
  const dataStat = fs.statSync(dataTarPath);
  debStream.write(makeArHeader('data.tar.gz', dataStat.size, '100644'));
  await streamToFile(fs.createReadStream(dataTarPath), debStream);
  if (dataStat.size % 2 !== 0) debStream.write(Buffer.from('\n', 'ascii'));

  await new Promise(resolve => debStream.end(resolve));

  console.log(`✓ Paquete .deb creado exitosamente: ${debOutputPath} (${(dataStat.size / 1024 / 1024).toFixed(1)} MB)`);

  // Clean staging
  fs.rmSync(staging, { recursive: true, force: true });
  return debOutputPath;
}

async function buildUniversalPackage() {
  console.log('📦 Construyendo paquete universal para Linux con instalador automático...');
  const stagingRoot = path.join(DIST, 'linux-pkg-staging');
  const bundleDir = path.join(stagingRoot, 'GuionLab-v1.6.5-Linux');

  fs.rmSync(stagingRoot, { recursive: true, force: true });
  fs.mkdirSync(bundleDir, { recursive: true });

  // 1. Copiar linux-unpacked a bundle/guionlab
  console.log('  -> Copiando binarios de la aplicación...');
  fs.cpSync(LINUX_UNPACKED, path.join(bundleDir, 'guionlab'), { recursive: true });

  // 2. Icono
  fs.copyFileSync(path.join(ROOT, 'build', 'icon.png'), path.join(bundleDir, 'guionlab.png'));

  // 3. Desktop launcher
  const desktopContent = `[Desktop Entry]
Name=GuionLab Studio
GenericName=Editor de Guiones
Comment=Preproducción y escritura de guiones cinematográficos y series
Exec=/opt/guionlab/guionlab %U
Icon=guionlab
Terminal=false
Type=Application
Categories=Office;WordProcessor;Utility;
StartupWMClass=GuionLab
MimeType=application/x-guionlab;
Keywords=script;screenplay;guion;cine;teatro;historia;
`;
  fs.writeFileSync(path.join(bundleDir, 'guionlab.desktop'), desktopContent.replace(/\\r\\n/g, '\\n'), 'utf8');

  // 4. Script de instalación automática
  const installShContent = `#!/bin/bash
# ========================================================
# Instalador de GuionLab Studio v1.6.5 para Linux
# ========================================================

set -e

RED='\\\\033[0;31m'
GREEN='\\\\033[0;32m'
CYAN='\\\\033[0;36m'
YELLOW='\\\\033[1;33m'
BOLD='\\\\033[1m'
NC='\\\\033[0m'

echo -e "\${CYAN}\${BOLD}========================================================\${NC}"
echo -e "\${CYAN}\${BOLD}         Instalador de GuionLab Studio v1.6.5          \${NC}"
echo -e "\${CYAN}\${BOLD}========================================================\${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
APP_SOURCE="$SCRIPT_DIR/guionlab"

if [ ! -d "$APP_SOURCE" ] || [ ! -f "$APP_SOURCE/guionlab" ]; then
    echo -e "\${RED}Error: No se encontró la carpeta 'guionlab' con el ejecutable en $SCRIPT_DIR.\${NC}"
    exit 1
fi

if [ "$EUID" -eq 0 ]; then
    INSTALL_DIR="/opt/guionlab"
    BIN_DIR="/usr/local/bin"
    DESKTOP_DIR="/usr/share/applications"
    ICON_DIR="/usr/share/icons/hicolor/512x512/apps"
    echo -e "\${GREEN}✓ Modo: Para todo el sistema (/opt/guionlab)\${NC}"
else
    INSTALL_DIR="$HOME/.local/share/guionlab"
    BIN_DIR="$HOME/.local/bin"
    DESKTOP_DIR="$HOME/.local/share/applications"
    ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
    echo -e "\${YELLOW}✓ Modo: Usuario actual ($INSTALL_DIR)\${NC}"
    echo -e "  (Si prefieres instalar para todos los usuarios, ejecuta: sudo ./instalar.sh)"
fi

echo ""
echo -e "\${BOLD}1/4. Copiando archivos de GuionLab...\${NC}"
mkdir -p "$INSTALL_DIR"
rm -rf "$INSTALL_DIR"/*
cp -r "$APP_SOURCE"/* "$INSTALL_DIR/"

echo -e "\${BOLD}2/4. Configurando permisos de ejecución...\${NC}"
chmod +x "$INSTALL_DIR/guionlab"
if [ -f "$INSTALL_DIR/chrome-sandbox" ]; then
    if [ "$EUID" -eq 0 ]; then
        chmod 4755 "$INSTALL_DIR/chrome-sandbox" 2>/dev/null || chmod +x "$INSTALL_DIR/chrome-sandbox"
    else
        chmod +x "$INSTALL_DIR/chrome-sandbox"
    fi
fi

echo -e "\${BOLD}3/4. Instalando icono y acceso directo del sistema...\${NC}"
mkdir -p "$ICON_DIR"
cp "$SCRIPT_DIR/guionlab.png" "$ICON_DIR/guionlab.png" 2>/dev/null || true

mkdir -p "$DESKTOP_DIR"
cp "$SCRIPT_DIR/guionlab.desktop" "$DESKTOP_DIR/guionlab.desktop"

if [ "$EUID" -ne 0 ]; then
    sed -i "s|Exec=/opt/guionlab/guionlab %U|Exec=$INSTALL_DIR/guionlab %U|g" "$DESKTOP_DIR/guionlab.desktop"
    sed -i "s|Icon=guionlab|Icon=$ICON_DIR/guionlab.png|g" "$DESKTOP_DIR/guionlab.desktop"
fi

echo -e "\${BOLD}4/4. Creando comando de terminal 'guionlab'...\${NC}"
mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/guionlab" "$BIN_DIR/guionlab"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q -t -f "$(dirname "$ICON_DIR")/.." 2>/dev/null || true
fi

echo ""
echo -e "\${GREEN}\${BOLD}¡Instalación completada con éxito!\${NC}"
echo -e "Puedes abrir \${BOLD}GuionLab\${NC} desde:"
echo -e "  1. El menú de aplicaciones de tu distribución Linux (busca 'GuionLab')."
echo -e "  2. O directamente desde el terminal escribiendo: \${CYAN}guionlab\${NC}"
echo ""
`;
  fs.writeFileSync(path.join(bundleDir, 'instalar.sh'), installShContent.replace(/\\r\\n/g, '\\n'), 'utf8');

  // 5. Script desinstalador
  const uninstallShContent = `#!/bin/bash
# ========================================================
# Desinstalador de GuionLab Studio para Linux
# ========================================================

set -e

if [ "$EUID" -eq 0 ]; then
    INSTALL_DIR="/opt/guionlab"
    BIN_DIR="/usr/local/bin"
    DESKTOP_DIR="/usr/share/applications"
    ICON_DIR="/usr/share/icons/hicolor/512x512/apps"
else
    INSTALL_DIR="$HOME/.local/share/guionlab"
    BIN_DIR="$HOME/.local/bin"
    DESKTOP_DIR="$HOME/.local/share/applications"
    ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
fi

echo "Desinstalando GuionLab..."
rm -rf "$INSTALL_DIR"
rm -f "$BIN_DIR/guionlab"
rm -f "$DESKTOP_DIR/guionlab.desktop"
rm -f "$ICON_DIR/guionlab.png"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

echo "✓ GuionLab ha sido desinstalado correctamente de tu sistema."
`;
  fs.writeFileSync(path.join(bundleDir, 'desinstalar.sh'), uninstallShContent.replace(/\\r\\n/g, '\\n'), 'utf8');

  // 6. Lanzador directo sin instalar
  const runDirectShContent = `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
chmod +x "$SCRIPT_DIR/guionlab/guionlab" 2>/dev/null || true
exec "$SCRIPT_DIR/guionlab/guionlab" "$@"
`;
  fs.writeFileSync(path.join(bundleDir, 'iniciar-sin-instalar.sh'), runDirectShContent.replace(/\\r\\n/g, '\\n'), 'utf8');

  // 7. README-LINUX.txt
  const readmeContent = `========================================================
GUIONLAB STUDIO v1.6.5 PARA LINUX
========================================================

¡Hola! Esta es la versión de GuionLab Studio v1.6.5 para sistemas GNU/Linux
(Ubuntu, Linux Mint, Debian, Fedora, Arch Linux, Manjaro, openSUSE, etc.).

OPCIÓN 1: INSTALACIÓN EN EL SISTEMA (RECOMENDADA)
--------------------------------------------------------
Abre un terminal en esta carpeta y ejecuta:

  ./instalar.sh

  - Si lo ejecutas como usuario normal, se instalará en tu carpeta personal (~/.local/share/guionlab).
  - Si prefieres instalarlo para todos los usuarios del sistema:
      sudo ./instalar.sh

¡Listo! A partir de ese momento tendrás:
  ✓ Icono y acceso directo en el menú de aplicaciones de tu escritorio (GNOME, KDE, Cinnamon, XFCE, etc.).
  ✓ El comando de terminal 'guionlab' disponible para lanzar la app desde cualquier lugar.

OPCIÓN 2: EJECUTAR DIRECTAMENTE SIN INSTALAR (PORTABLE)
--------------------------------------------------------
Si prefieres no instalar nada en el sistema:
1. Haz doble clic en el archivo "iniciar-sin-instalar.sh"
   (o en el terminal: ./iniciar-sin-instalar.sh)

DESINSTALACIÓN
--------------------------------------------------------
Para desinstalar GuionLab en cualquier momento:
  ./desinstalar.sh
  (o 'sudo ./desinstalar.sh' si lo instalaste con sudo).
`;
  fs.writeFileSync(path.join(bundleDir, 'README-LINUX.txt'), readmeContent.replace(/\\r\\n/g, '\\n'), 'utf8');

  // Pack tar.gz
  const tarOutputPath = path.join(DIST, 'GuionLab-v1.6.5-Linux.tar.gz');
  console.log('  -> Creando archivo comprimido GuionLab-v1.6.5-Linux.tar.gz...');
  await tar.c(
    {
      gzip: true,
      portable: true,
      file: tarOutputPath,
      cwd: stagingRoot
    },
    ['GuionLab-v1.6.5-Linux']
  );

  console.log(`✓ Paquete universal creado exitosamente: ${tarOutputPath}`);

  // Clean staging
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  return tarOutputPath;
}

async function main() {
  try {
    if (!fs.existsSync(LINUX_UNPACKED)) {
      console.error('Error: no se encontró dist/linux-unpacked. Ejecuta primero npm run dist:linux');
      process.exit(1);
    }

    const debFile = await buildDeb();
    const tarFile = await buildUniversalPackage();

    console.log(`\n✓ Paquete .deb disponible en: ${debFile}`);
    console.log(`✓ Paquete .tar.gz disponible en: ${tarFile}`);
    console.log('\n🎉 ¡Todos los instaladores de Linux se han generado con éxito en la carpeta dist/!');
  } catch (err) {
    console.error('Error durante la creación de los paquetes de Linux:', err);
    process.exit(1);
  }
}

main();
