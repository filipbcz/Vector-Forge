#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`[installer-check] ERROR: ${message}`);
  process.exit(1);
}

function runLinuxDryRunCheck() {
  const scriptPath = path.join(root, 'release', 'install-linux.sh');
  const run = spawnSync('bash', [scriptPath, '--dry-run'], { encoding: 'utf8' });
  if ((run.status || 0) !== 0) {
    fail(`linux installer dry-run failed (exit=${run.status}):\n${run.stderr || run.stdout || ''}`);
  }

  const output = `${run.stdout || ''}\n${run.stderr || ''}`;
  const expectedMarkers = [
    'DRY RUN (no files will be changed)',
    'Would install payload from:',
    'Would create/update:',
    'Would create/update shims in:',
    'Would remove old dirs:'
  ];

  for (const marker of expectedMarkers) {
    if (!output.includes(marker)) {
      fail(`linux installer dry-run output missing marker: "${marker}"`);
    }
  }

  console.log('[installer-check] linux dry-run markers OK');
}

function runWindowsStaticValidation() {
  const scriptPath = path.join(root, 'release', 'install-windows.ps1');
  const script = fs.readFileSync(scriptPath, 'utf8');

  const requiredSnippets = [
    'param(',
    '[string]$TargetDir = "$env:LOCALAPPDATA\\Mulda"',
    '[string]$BinDir = "$env:USERPROFILE\\bin"',
    "function Assert-InstallPath",
    "$Payload = Join-Path $ScriptRoot 'windows\\bin\\mulda.exe'",
    "$RuntimeSource = Join-Path $ScriptRoot 'windows\\runtime'",
    "$CompilerSource = Join-Path $ScriptRoot 'windows\\compiler'",
    "Set-Content -Path (Join-Path $BinDir 'mulda.cmd')",
    'Run: mulda --help'
  ];

  for (const snippet of requiredSnippets) {
    if (!script.includes(snippet)) {
      fail(`install-windows.ps1 missing required snippet: ${snippet}`);
    }
  }

  const hereStringOpens = (script.match(/@"/g) || []).length;
  const hereStringCloses = (script.match(/"@/g) || []).length;
  if (hereStringOpens !== hereStringCloses) {
    fail(`install-windows.ps1 heredoc imbalance: open=${hereStringOpens}, close=${hereStringCloses}`);
  }

  const pwshProbe = spawnSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], { encoding: 'utf8' });
  if ((pwshProbe.status || 0) === 0) {
    const parse = spawnSync('pwsh', ['-NoProfile', '-Command', `
      $null = $errors = $null;
      [System.Management.Automation.PSParser]::Tokenize((Get-Content -Raw '${scriptPath.replace(/'/g, "''")}'), [ref]$errors) | Out-Null;
      if ($errors.Count -gt 0) {
        $errors | ForEach-Object { Write-Error $_.Message };
        exit 2;
      }
    `], { encoding: 'utf8' });

    if ((parse.status || 0) !== 0) {
      fail(`PowerShell parser reported syntax issues in install-windows.ps1:\n${parse.stderr || parse.stdout || ''}`);
    }

    console.log('[installer-check] windows syntax parse OK (pwsh)');
  } else {
    console.log('[installer-check] pwsh unavailable, fallback static validation used');
  }

  console.log('[installer-check] windows placeholders/sanity OK');
}

runLinuxDryRunCheck();
runWindowsStaticValidation();
console.log('[installer-check] all checks passed');
