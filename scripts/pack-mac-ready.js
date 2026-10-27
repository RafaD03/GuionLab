const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const version = require(path.join(ROOT, 'package.json')).version;
const zipName = `GuionLab-v${version}-Mac-Ready.zip`;
const zipPath = path.join(DIST, zipName);

const staging = path.join(DIST, 'mac-staging');
if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

function copyRec(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRec(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const itemsToCopy = [
  'main.js',
  'preload.js',
  'package.json',
  'README-MAC.txt',
  'Compilar-Instalador-Mac.command',
  'Iniciar-GuionLab-Mac.command',
  'src',
  'build'
];

for (const item of itemsToCopy) {
  const src = path.join(ROOT, item);
  if (fs.existsSync(src)) {
    copyRec(src, path.join(staging, item));
  }
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

console.log(`Comprimiendo ${zipName}...`);
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${staging}\\*' -DestinationPath '${zipPath}' -Force"`);

fs.rmSync(staging, { recursive: true, force: true });
console.log(`✓ Archivo Mac creado exitosamente: ${zipPath}`);
