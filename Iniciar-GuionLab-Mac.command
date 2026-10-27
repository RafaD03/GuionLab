#!/bin/bash
cd "$(dirname "$0")"
clear
echo "========================================================"
echo "               Iniciando GuionLab para macOS             "
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js no está instalado en este Mac."
    echo "GuionLab necesita Node.js para ejecutarse."
    echo ""
    echo "Descárgalo gratis en https://nodejs.org (versión LTS recomendada)."
    echo "Abriendo la página de descarga..."
    open "https://nodejs.org"
    echo ""
    read -p "Presiona Enter para salir..."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias necesarias (solo la primera vez)..."
    npm install
fi

echo "🚀 Abriendo GuionLab..."
npm start
