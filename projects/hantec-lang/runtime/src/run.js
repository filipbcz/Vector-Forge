#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

function runJs(entryFile) {
  const target = path.resolve(entryFile);
  const child = spawn(process.execPath, [target], { stdio: 'inherit', shell: false });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`Runtime terminated by signal: ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 0);
  });
}

function main() {
  const [, , entryFile] = process.argv;
  if (!entryFile) {
    console.error('Usage: node runtime/src/run.js <program.js>');
    process.exit(1);
  }

  runJs(entryFile);
}

if (require.main === module) {
  main();
}

module.exports = { runJs };
