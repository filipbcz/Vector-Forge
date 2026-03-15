#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');
const transpiler = path.join(projectRoot, 'compiler/src/transpile.js');
const runner = path.join(projectRoot, 'runtime/src/run.js');

function printUsage() {
  console.error('Usage: mulda <compile|run|run-bc|run-c> [--target js|c] [--trace|--debug|--trace-json] <file.mulda>');
  console.error('Aliases: muldac [--target js|c] <file.mulda> ; muldarun [--trace|--debug|--trace-json] <file.mulda> [--bc|--c]');
}

function compileFile(inputFile, options = {}) {
  const resolved = path.resolve(inputFile);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    return 1;
  }

  const target = options.target || 'js';
  if (!['js', 'c'].includes(target)) {
    console.error(`Unsupported compile target: ${target}`);
    return 1;
  }

  const distDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const ext = target === 'c' ? '.c' : '.js';
  const outputFile = path.join(distDir, `${path.basename(resolved, '.mulda')}${ext}`);

  const t = spawnSync(process.execPath, [transpiler, resolved, outputFile], { stdio: 'inherit' });
  return t.status || 0;
}

function compileAndRunC(entryCFile, options = {}) {
  const gcc = spawnSync('gcc', ['--version'], { stdio: 'ignore' });
  if (gcc.status !== 0) {
    console.error('gcc not found. Install gcc to run C backend output.');
    return 1;
  }

  const outBin = path.join(os.tmpdir(), `mulda-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const compile = spawnSync('gcc', [entryCFile, '-std=c11', '-O2', '-o', outBin], { stdio: 'inherit' });
  if ((compile.status || 0) !== 0) return compile.status || 1;

  const run = spawnSync(outBin, {
    stdio: 'inherit',
    env: {
      ...process.env,
      MULDA_TRACE: options.trace ? '1' : '0',
      MULDA_TRACE_FORMAT: options.traceFormat || 'text'
    }
  });

  try {
    fs.rmSync(outBin, { force: true });
  } catch (_) {
    // ignore cleanup failures
  }

  return run.status || 0;
}

function runFile(inputFile, mode = 'js', options = {}) {
  const compileTarget = mode === 'c' ? 'c' : 'js';
  const status = compileFile(inputFile, { target: compileTarget });
  if (status !== 0) return status;

  const resolved = path.resolve(inputFile);
  const baseName = path.basename(resolved, '.mulda');
  const jsFile = path.join(projectRoot, 'dist', `${baseName}.js`);
  const cFile = path.join(projectRoot, 'dist', `${baseName}.c`);

  if (mode === 'c') {
    return compileAndRunC(cFile, options);
  }

  const entryFile = mode === 'bytecode'
    ? jsFile.replace(/\.js$/, '.bytecode.json')
    : jsFile;

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
  const options = { trace: false, traceFormat: 'text', bytecode: false, cBackend: false, target: 'js' };

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
    if (flag === '--c') {
      options.cBackend = true;
      continue;
    }
    if (flag === '--target') {
      const value = args.shift();
      if (!value) throw new Error('--target requires value: js or c');
      if (value !== 'js' && value !== 'c') throw new Error(`Unsupported target: ${value}`);
      options.target = value;
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
      const parsed = parseCommandArgs([commandOrFile, ...rest].filter(Boolean));
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      process.exit(compileFile(parsed.inputFile, { target: parsed.options.target }));
    }

    if (invokedAs === 'muldarun') {
      const parsed = parseCommandArgs([commandOrFile, ...rest].filter(Boolean));
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      const mode = parsed.options.cBackend ? 'c' : (parsed.options.bytecode ? 'bytecode' : 'js');
      process.exit(runFile(parsed.inputFile, mode, parsed.options));
    }

    if (commandOrFile === 'compile') {
      const parsed = parseCommandArgs(rest);
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      process.exit(compileFile(parsed.inputFile, { target: parsed.options.target }));
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

    if (commandOrFile === 'run-c') {
      const parsed = parseCommandArgs(rest);
      if (!parsed.inputFile) {
        printUsage();
        process.exit(1);
      }
      process.exit(runFile(parsed.inputFile, 'c', parsed.options));
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

module.exports = { runFile, compileFile, parseCommandArgs, compileAndRunC };