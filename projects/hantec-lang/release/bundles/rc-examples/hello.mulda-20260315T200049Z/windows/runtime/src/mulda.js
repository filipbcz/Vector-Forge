#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');
const transpiler = path.join(projectRoot, 'compiler/src/transpile.js');
const runner = path.join(projectRoot, 'runtime/src/run.js');
const packageJson = require(path.join(projectRoot, 'package.json'));

function printUsage() {
  console.error('Usage: mulda <compile|run|run-bc|run-c> [--target js|c] [--platform linux-x64|windows-x64] [--trace|--debug|--trace-json] <file.mulda>');
  console.error('Aliases: muldac [--target js|c] [--platform linux-x64|windows-x64] <file.mulda> ; muldarun [--trace|--debug|--trace-json] <file.mulda> [--bc|--c]');
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
  const baseName = path.basename(resolved, '.mulda');
  const ext = target === 'c' ? '.c' : '.js';
  const outputFile = path.join(distDir, `${baseName}${ext}`);

  const t = spawnSync(process.execPath, [transpiler, resolved, outputFile], { stdio: 'inherit' });
  const status = t.status || 0;
  if (status !== 0) return status;

  if (target === 'c' && options.platform) {
    const toolchain = resolveCToolchain(options.platform);
    if (!toolchain) {
      console.error(`Unsupported platform: ${options.platform}`);
      return 1;
    }
    const nativeOut = path.join(distDir, `${baseName}-${toolchain.targetLabel}${toolchain.outputExt}`);
    const nativeStatus = compileCToNative(outputFile, nativeOut, { platform: options.platform });
    if (nativeStatus !== 0) {
      return nativeStatus;
    }
    writeNativeArtifactMetadata({
      sourceFile: resolved,
      cFile: outputFile,
      artifactFile: nativeOut,
      toolchain,
      platform: options.platform
    });
  }

  return 0;
}

function resolveCToolchain(platform = 'linux-x64') {
  if (platform === 'linux-x64') {
    return { cc: 'gcc', outputExt: '', targetLabel: 'linux-x64' };
  }
  if (platform === 'windows-x64') {
    return { cc: 'x86_64-w64-mingw32-gcc', outputExt: '.exe', targetLabel: 'windows-x64' };
  }
  return null;
}

function compileCToNative(entryCFile, outputFile, options = {}) {
  const toolchain = resolveCToolchain(options.platform || 'linux-x64');
  if (!toolchain) {
    console.error(`Unsupported platform: ${options.platform}`);
    return 1;
  }

  const ccProbe = spawnSync(toolchain.cc, ['--version'], { stdio: 'ignore' });
  if (ccProbe.status !== 0) {
    const recommendation = toolchain.targetLabel === 'linux-x64'
      ? 'Install GCC (Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y build-essential).'
      : 'Install MinGW-w64 (Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y mingw-w64).';
    console.error(`[TOOLCHAIN_MISSING] ${toolchain.cc} for ${toolchain.targetLabel}. ${recommendation}`);
    return 1;
  }

  const compile = spawnSync(toolchain.cc, [entryCFile, '-std=c11', '-O2', '-o', outputFile], { stdio: 'inherit' });
  return compile.status || 0;
}

function writeNativeArtifactMetadata({ sourceFile, cFile, artifactFile, toolchain, platform }) {
  const metadataPath = `${artifactFile}.metadata.json`;
  const metadata = {
    lang: 'mulda',
    version: packageJson.version,
    backend: 'c',
    platform,
    compiler: toolchain.cc,
    generatedAt: new Date().toISOString(),
    sourceFile,
    cFile,
    artifactFile
  };
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
}

function compileAndRunC(entryCFile, options = {}) {
  const outBin = path.join(os.tmpdir(), `mulda-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const compileStatus = compileCToNative(entryCFile, outBin, { platform: 'linux-x64' });
  if (compileStatus !== 0) return compileStatus;

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
  const options = { trace: false, traceFormat: 'text', bytecode: false, cBackend: false, target: 'js', platform: null };

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
    if (flag === '--platform') {
      const value = args.shift();
      if (!value) throw new Error('--platform requires value: linux-x64 or windows-x64');
      if (value !== 'linux-x64' && value !== 'windows-x64') {
        throw new Error(`Unsupported platform: ${value}`);
      }
      options.platform = value;
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
      process.exit(compileFile(parsed.inputFile, { target: parsed.options.target, platform: parsed.options.platform }));
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
      process.exit(compileFile(parsed.inputFile, { target: parsed.options.target, platform: parsed.options.platform }));
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

module.exports = { runFile, compileFile, parseCommandArgs, compileAndRunC, compileCToNative, resolveCToolchain, writeNativeArtifactMetadata };