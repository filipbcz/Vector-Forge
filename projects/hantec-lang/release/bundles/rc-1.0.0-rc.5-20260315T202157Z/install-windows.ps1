param(
  [string]$TargetDir = "$env:LOCALAPPDATA\Mulda",
  [string]$BinDir = "$env:USERPROFILE\bin"
)

$ErrorActionPreference = 'Stop'
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Payload = Join-Path $ScriptRoot 'windows\bin\mulda.exe'
$RuntimeSource = Join-Path $ScriptRoot 'windows\runtime'
$CompilerSource = Join-Path $ScriptRoot 'windows\compiler'

function Assert-InstallPath([string]$PathValue, [string]$ParamName) {
  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    throw "Parameter $ParamName cannot be empty. Example: -$ParamName `"$env:LOCALAPPDATA\Mulda`""
  }

  if ($PathValue.IndexOfAny([System.IO.Path]::GetInvalidPathChars()) -ge 0) {
    throw "Parameter $ParamName contains invalid path characters: $PathValue"
  }

  $fullPath = [System.IO.Path]::GetFullPath($PathValue)
  if ($fullPath.StartsWith('\\')) {
    throw "UNC paths are not supported for $ParamName in RC installer: $fullPath"
  }

  return $fullPath
}

$TargetDir = Assert-InstallPath -PathValue $TargetDir -ParamName 'TargetDir'
$BinDir = Assert-InstallPath -PathValue $BinDir -ParamName 'BinDir'

if (-not (Test-Path $Payload)) {
  throw "Missing release payload: $Payload`nRun this script from extracted RC bundle root."
}
if (-not (Test-Path $RuntimeSource)) {
  throw "Missing runtime payload: $RuntimeSource`nRe-extract the RC bundle and retry."
}
if (-not (Test-Path $CompilerSource)) {
  throw "Missing compiler payload: $CompilerSource`nRe-extract the RC bundle and retry."
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

$runtimeTarget = Join-Path $TargetDir 'runtime'
$compilerTarget = Join-Path $TargetDir 'compiler'
if (Test-Path $runtimeTarget) { Remove-Item -Recurse -Force $runtimeTarget }
if (Test-Path $compilerTarget) { Remove-Item -Recurse -Force $compilerTarget }

Copy-Item -Recurse -Force $RuntimeSource $runtimeTarget
Copy-Item -Recurse -Force $CompilerSource $compilerTarget
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
Write-Host "Next steps:"
Write-Host "  1) Add $BinDir to PATH (System Settings -> Environment Variables)."
Write-Host "  2) Open a NEW terminal."
Write-Host "  3) Run: mulda --help"
