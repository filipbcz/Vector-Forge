@echo off
setlocal
cd /d %~dp0\..

echo [mulda] compile demo
node compiler\src\transpile.js examples\hello.mulda dist\hello.js
if errorlevel 1 exit /b 1

echo [mulda] run demo
node runtime\src\run.js dist\hello.js
if errorlevel 1 exit /b 1

echo [mulda] done
