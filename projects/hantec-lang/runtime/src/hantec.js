#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');
const transpiler = path.join(projectRoot, 'compiler/src/transpile.js');
const runner = path.join(projectRoot, 'runtime/src/run.js');

function printUsage() {
  console.error('Usage: hantec run [--trace|--debug] <file.hantec> | hantec run-bc [--trace|--debug] <file.hantec>');
}

function runFile(inputFile, mode = 'js', options = {}) {
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

  const runnerArgs = [runner];
  if (options.trace) {
    runnerArgs.push('--trace');
  }
  runnerArgs.push(entryFile);

  const r = spawnSync(process.execPath, runnerArgs, { stdio: 'inherit' });
  return r.status || 0;
}

function parseCommandArgs(argv) {
  const args = [...argv];
  const options = { trace: false };

  while (args[0] && args[0].startsWith('--')) {
    const flag = args.shift();
    if (flag === '--trace' || flag === '--debug') {
      options.trace = true;
      continue;
    }
    throw new Error(`Unknown flag: ${flag}`);
  }

  return { options, inputFile: args[0] };
}

function main() {
  const [, , command, ...rest] = process.argv;

  try {
    if (command === 'run') {
      const parsed = parseCommandArgs(rest);
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      process.exit(runFile(parsed.inputFile, 'js', parsed.options));
    }

    if (command === 'run-bc') {
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

module.exports = { runFile, parseCommandArgs };
