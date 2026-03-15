#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const manifestPath = process.argv[2] || '.pack-dry-run.json';
if (!fs.existsSync(manifestPath)) {
  console.error(`[pack:check] Missing manifest: ${manifestPath}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const packInfo = Array.isArray(payload) ? payload[0] : payload;
const files = (packInfo?.files || []).map((entry) => entry.path);

const requiredFiles = [
  'package.json',
  'README.md',
  'compiler/src/transpile.js',
  'runtime/src/mulda.js',
  'runtime/src/run.js',
  'runtime/src/vm.js',
  'ide-web/index.html',
  'ide-web/server.js'
];

const forbiddenPrefixes = ['tests/', 'dist/', '.github/'];

const missing = requiredFiles.filter((required) => !files.includes(required));
const forbidden = files.filter((f) => forbiddenPrefixes.some((prefix) => f.startsWith(prefix)));

if (missing.length > 0) {
  console.error('[pack:check] Missing required package files:');
  for (const item of missing) console.error(`  - ${item}`);
}

if (forbidden.length > 0) {
  console.error('[pack:check] Forbidden files found in package:');
  for (const item of forbidden) console.error(`  - ${item}`);
}

if (missing.length > 0 || forbidden.length > 0) {
  process.exit(1);
}

const prettySize = typeof packInfo?.unpackedSize === 'number'
  ? `${(packInfo.unpackedSize / 1024).toFixed(1)} KiB`
  : 'unknown';

console.log(`[pack:check] OK (${files.length} files, unpacked ${prettySize})`);
