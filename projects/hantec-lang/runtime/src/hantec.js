#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');
const transpiler = path.join(projectRoot, 'compiler/src/transpile.js');
const runner = path.join(projectRoot, 'runtime/src/run.js');

function printUsage() {
  console.error('Usage: hantec run <file.hantec> | hantec run-bc <file.hantec>');
}

function runFile(inputFile, mode = 'js') {
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

  const entryFile = mode === 'bytecode'
    ? outputFile.replace(/\.js$/, '.bytecode.json')
    : outputFile;

  const r = spawnSync(process.execPath, [runner, entryFile], { stdio: 'inherit' });
  return r.status || 0;
}

function main() {
  const [, , command, inputFile] = process.argv;

  if (command === 'run' && inputFile) {
    process.exit(runFile(inputFile, 'js'));
  }

  if (command === 'run-bc' && inputFile) {
    process.exit(runFile(inputFile, 'bytecode'));
  }

  printUsage();
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { runFile };
