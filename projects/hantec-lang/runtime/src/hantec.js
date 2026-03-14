#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');
const transpiler = path.join(projectRoot, 'compiler/src/transpile.js');
const runner = path.join(projectRoot, 'runtime/src/run.js');

function printUsage() {
  console.error('Usage: hantec run <file.hantec>');
}

function runFile(inputFile) {
  const resolved = path.resolve(inputFile);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    return 1;
  }

  const distDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const outputFile = path.join(distDir, `${path.basename(resolved, '.hantec')}.js`);

  const t = spawnSync(process.execPath, [transpiler, resolved, outputFile], { stdio: 'inherit' });
  if (t.status !== 0) return t.status || 1;

  const r = spawnSync(process.execPath, [runner, outputFile], { stdio: 'inherit' });
  return r.status || 0;
}

function main() {
  const [, , command, inputFile] = process.argv;

  if (command !== 'run' || !inputFile) {
    printUsage();
    process.exit(1);
  }

  process.exit(runFile(inputFile));
}

if (require.main === module) {
  main();
}

module.exports = { runFile };
