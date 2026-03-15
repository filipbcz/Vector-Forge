param(
  [string]$TargetDir = "$env:LOCALAPPDATA\Mulda",
  [string]$BinDir = "$env:USERPROFILE\bin"
)

$ErrorActionPreference = 'Stop'
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Payload = Join-Path $ScriptRoot 'windows\bin\mulda.exe'

if (-not (Test-Path $Payload)) {
  throw "Missing release payload: $Payload`nRun script from extracted RC bundle root."
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

$runtimeTarget = Join-Path $TargetDir 'runtime'
$compilerTarget = Join-Path $TargetDir 'compiler'
if (Test-Path $runtimeTarget) { Remove-Item -Recurse -Force $runtimeTarget }
if (Test-Path $compilerTarget) { Remove-Item -Recurse -Force $compilerTarget }

Copy-Item -Recurse -Force (Join-Path $ScriptRoot 'windows\runtime') $runtimeTarget
Copy-Item -Recurse -Force (Join-Path $ScriptRoot 'windows\compiler') $compilerTarget
Copy-Item -Force $Payload (Join-Path $TargetDir 'mulda.exe')

$shim = @"
@echo off
set MULDA_HOME=%MULDA_HOME%
if "%MULDA_HOME%"=="" set MULDA_HOME=$TargetDir
"%MULDA_HOME%\mulda.exe" %*
"@

Set-Content -Path (Join-Path $BinDir 'mulda.cmd') -Value $shim -Encoding ASCII

Write-Host "Mulda installed"
Write-Host "  HOME: $TargetDir"
Write-Host "  BIN : $(Join-Path $BinDir 'mulda.cmd')"
Write-Host "Add $BinDir to PATH if needed."
