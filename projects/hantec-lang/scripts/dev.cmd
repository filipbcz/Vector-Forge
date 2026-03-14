@echo off
setlocal
cd /d %~dp0\..

echo [hantec] compile demo
node compiler\src\transpile.js examples\hello.hantec dist\hello.js
if errorlevel 1 exit /b 1

echo [hantec] run demo
node runtime\src\run.js dist\hello.js
if errorlevel 1 exit /b 1

echo [hantec] done
