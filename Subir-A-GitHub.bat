@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================================
echo             Subir cambios a GitHub - GuionLab
echo ========================================================
echo.

git status -s
echo.
set /p msg="Mensaje del cambio (pulsa Enter para fecha automatica): "
if "%msg%"=="" set msg=Actualizacion GuionLab %date% %time%

git add .
git commit -m "%msg%"
echo.
echo Subiendo cambios a GitHub...
git push origin main

echo.
echo ========================================================
echo ?Completado! Presiona cualquier tecla para salir...
pause > nul