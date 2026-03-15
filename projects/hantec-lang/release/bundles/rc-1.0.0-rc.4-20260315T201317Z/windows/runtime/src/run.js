#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const { runBytecodeFile } = require('./vm');

function runJs(entryFile, options = {}) {
  const target = path.resolve(entryFile);
  const traceHook = path.resolve(__dirname, 'js-trace-hook.js');
  const args = ['--require', traceHook, target];
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      MULDA_TRACE: options.trace ? '1' : '0',
      MULDA_TRACE_FORMAT: options.traceFormat || 'text'
    }
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`Runtime terminated by signal: ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 0);
  });
}

function runEntry(entryFile, options = {}) {
  const target = path.resolve(entryFile);
  if (target.endsWith('.bytecode.json')) {
    runBytecodeFile(target, { trace: options.trace, traceFormat: options.traceFormat });
    return;
  }
  runJs(target, options);
}

function parseArgs(argv) {
  const options = { trace: false, traceFormat: 'text' };
  const positional = [];

  for (const arg of argv) {
    if (arg === '--trace' || arg === '--debug') {
      options.trace = true;
      continue;
    }
    if (arg === '--trace-json') {
      options.trace = true;
      options.traceFormat = 'json';
      continue;
    }
    positional.push(arg);
  }

  return { options, positional };
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const [entryFile] = parsed.positional;

  if (!entryFile) {
    console.error('Usage: node runtime/src/run.js [--trace|--debug|--trace-json] <program.js|program.bytecode.json>  # generated from .mulda');
    process.exit(1);
  }

  try {
    runEntry(entryFile, parsed.options);
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runJs, runEntry, parseArgs };
