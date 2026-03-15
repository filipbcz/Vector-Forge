#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

console.error('[deprecated] `hantec` CLI is deprecated. Use `mulda`, `muldac`, or `muldarun`.');
const target = path.join(__dirname, 'mulda.js');
const result = spawnSync(process.execPath, [target, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status || 0);
