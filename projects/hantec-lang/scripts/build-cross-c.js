#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { compileFile, resolveCToolchain } = require('../runtime/src/mulda');

const projectRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(projectRoot, 'package.json'));

function usage() {
  console.error('Usage: node scripts/build-cross-c.js <file.mulda>');
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function main() {
  const input = process.argv[2];
  if (!input) {
    usage();
    process.exit(1);
  }

  const sourceFile = path.resolve(input);
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  const baseName = path.basename(sourceFile, '.mulda');
  const distDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  const platforms = ['linux-x64', 'windows-x64'];
  const builds = [];
  let hasFailure = false;

  for (const platform of platforms) {
    const toolchain = resolveCToolchain(platform);
    const artifactPath = path.join(distDir, `${baseName}-${platform}${toolchain.outputExt}`);
    const result = {
      platform,
      compiler: toolchain.cc,
      artifact: artifactPath,
      status: 'ok'
    };

    const status = compileFile(sourceFile, { target: 'c', platform });
    if (status !== 0) {
      hasFailure = true;
      result.status = 'failed';
      result.recommendation = toolchain.cc === 'gcc'
        ? 'Install GCC toolchain. Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y build-essential'
        : 'Install MinGW-w64 cross-compiler. Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y mingw-w64';
      builds.push(result);
      continue;
    }

    result.sha256 = sha256File(artifactPath);
    const metadataPath = `${artifactPath}.metadata.json`;
    if (fs.existsSync(metadataPath)) {
      result.metadata = metadataPath;
      result.metadataSha256 = sha256File(metadataPath);
    }

    builds.push(result);
  }

  const manifest = {
    lang: 'mulda',
    version: packageJson.version,
    generatedAt: new Date().toISOString(),
    sourceFile,
    cSource: path.join(distDir, `${baseName}.c`),
    platforms: Object.fromEntries(builds.map((b) => [b.platform, {
      status: b.status,
      artifact: b.artifact,
      sha256: b.sha256 || null,
      metadata: b.metadata || null,
      metadataSha256: b.metadataSha256 || null,
      compiler: b.compiler,
      recommendation: b.recommendation || null
    }])),
    allTargetsBuilt: !hasFailure
  };

  const manifestPath = path.join(distDir, `${baseName}.release-manifest.json`);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Manifest written: ${manifestPath}`);
  for (const build of builds) {
    if (build.status === 'ok') {
      console.log(`[OK] ${build.platform} -> ${build.artifact}`);
    } else {
      console.log(`[FAIL] ${build.platform} -> ${build.recommendation}`);
    }
  }

  process.exit(hasFailure ? 2 : 0);
}

main();
