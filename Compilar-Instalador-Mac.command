#!/bin/bash
cd "$(dirname "$0")"
clear
echo "========================================================"
echo "        Compilando instalador .DMG de GuionLab          "
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js no está instalado en este Mac."
    echo "Descárgalo gratis en https://nodejs.org (versión LTS recomendada)."
    open "https://nodejs.org"
    read -p "Presiona Enter para salir..."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias necesarias..."
    npm install
fi

echo "⚙️ Compilando archivo .dmg para Mac..."
npm run dist:mac

echo ""
echo "========================================================"
echo "✅ ¡Instalador creado con éxito en la carpeta dist/!"
echo "========================================================"
open "dist"
read -p "Presiona Enter para cerrar..."
