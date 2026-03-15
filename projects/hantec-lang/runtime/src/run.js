#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const { runBytecodeFile } = require('./vm');

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

function runEntry(entryFile) {
  const target = path.resolve(entryFile);
  if (target.endsWith('.bytecode.json')) {
    runBytecodeFile(target);
    return;
  }
  runJs(target);
}

function main() {
  const [, , entryFile] = process.argv;
  if (!entryFile) {
    console.error('Usage: node runtime/src/run.js <program.js|program.bytecode.json>');
    process.exit(1);
  }

  try {
    runEntry(entryFile);
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runJs, runEntry };
