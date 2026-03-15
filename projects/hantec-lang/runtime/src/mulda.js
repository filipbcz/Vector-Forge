#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');
const transpiler = path.join(projectRoot, 'compiler/src/transpile.js');
const runner = path.join(projectRoot, 'runtime/src/run.js');

function printUsage() {
  console.error('Usage: mulda <compile|run|run-bc> [--trace|--debug|--trace-json] <file.mulda>');
  console.error('Aliases: muldac <file.mulda> ; muldarun [--trace|--debug|--trace-json] <file.mulda> [--bc]');
}

function compileFile(inputFile) {
  const resolved = path.resolve(inputFile);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    return 1;
  }

  const distDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const outputFile = path.join(distDir, `${path.basename(resolved, '.mulda')}.js`);

  const t = spawnSync(process.execPath, [transpiler, resolved, outputFile], { stdio: 'inherit' });
  return t.status || 0;
}

function runFile(inputFile, mode = 'js', options = {}) {
  const status = compileFile(inputFile);
  if (status !== 0) return status;

  const resolved = path.resolve(inputFile);
  const outputFile = path.join(projectRoot, 'dist', `${path.basename(resolved, '.mulda')}.js`);

  const entryFile = mode === 'bytecode'
    ? outputFile.replace(/\.js$/, '.bytecode.json')
    : outputFile;

  const runnerArgs = [runner];
  if (options.trace) {
    runnerArgs.push(options.traceFormat === 'json' ? '--trace-json' : '--trace');
  }
  runnerArgs.push(entryFile);

  const r = spawnSync(process.execPath, runnerArgs, { stdio: 'inherit' });
  return r.status || 0;
}

function parseCommandArgs(argv) {
  const args = [...argv];
  const options = { trace: false, traceFormat: 'text', bytecode: false };

  while (args[0] && args[0].startsWith('--')) {
    const flag = args.shift();
    if (flag === '--trace' || flag === '--debug') {
      options.trace = true;
      continue;
    }
    if (flag === '--trace-json') {
      options.trace = true;
      options.traceFormat = 'json';
      continue;
    }
    if (flag === '--bc' || flag === '--bytecode') {
      options.bytecode = true;
      continue;
    }
    throw new Error(`Unknown flag: ${flag}`);
  }

  return { options, inputFile: args[0] };
}

function main() {
  const invokedAs = path.basename(process.argv[1] || 'mulda');
  const [, , commandOrFile, ...rest] = process.argv;

  try {
    if (invokedAs === 'muldac') {
      const input = commandOrFile;
      if (!input) {
        printUsage();
        process.exit(1);
      }
      process.exit(compileFile(input));
    }

    if (invokedAs === 'muldarun') {
      const parsed = parseCommandArgs([commandOrFile, ...rest].filter(Boolean));
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      process.exit(runFile(parsed.inputFile, parsed.options.bytecode ? 'bytecode' : 'js', parsed.options));
    }

    if (commandOrFile === 'compile') {
      const parsed = parseCommandArgs(rest);
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      process.exit(compileFile(parsed.inputFile));
    }

    if (commandOrFile === 'run') {
      const parsed = parseCommandArgs(rest);
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      process.exit(runFile(parsed.inputFile, 'js', parsed.options));
    }

    if (commandOrFile === 'run-bc') {
      const parsed = parseCommandArgs(rest);
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      process.exit(runFile(parsed.inputFile, 'bytecode', parsed.options));
    }
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
  }

  printUsage();
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { runFile, compileFile, parseCommandArgs };
