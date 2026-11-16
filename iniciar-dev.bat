@echo off
title DoragonTable - Modo Desenvolvimento (Hot Reload)
set PATH=C:\Users\MakerOfSeas\AppData\Local\Programs\nodejs;%PATH%
cd /d "%~dp0"
echo ========================================================
echo     Iniciando DoragonTable no Modo Desenvolvimento
echo ========================================================
npm run dev:electron
