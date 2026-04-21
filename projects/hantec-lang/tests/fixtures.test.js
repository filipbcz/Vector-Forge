const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { compileMulda } = require('../compiler/src/transpile');

function compileAndRunC(source) {
  const { c } = compileMulda(source);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mulda-fixture-'));
  const cPath = path.join(tmp, 'fixture.c');
  const binPath = path.join(tmp, 'fixture-bin');

  fs.writeFileSync(cPath, c, 'utf8');

  const ccProbe = spawnSync('gcc', ['--version'], { stdio: 'ignore' });
  if (ccProbe.status !== 0) {
    throw new Error('gcc is required for fixtures.test.js');
  }

  const build = spawnSync('gcc', [cPath, '-std=c11', '-O2', '-o', binPath], { encoding: 'utf8' });
  if (build.status !== 0) {
    throw new Error(`gcc failed: ${build.stderr || build.stdout}`);
  }

  const run = spawnSync(binPath, [], { encoding: 'utf8' });
  if (run.status !== 0) {
    throw new Error(`binary failed: ${run.stderr || run.stdout}`);
  }

  return run.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function runFixture(fixturePath) {
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const fixture = JSON.parse(raw);
  const { name, source, expectedOutput } = fixture;

  const cLines = compileAndRunC(source);
  assert.deepStrictEqual(cLines, expectedOutput, `${name}: C backend output mismatch`);
}

function main() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const fixtureFiles = fs.readdirSync(fixturesDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  assert(fixtureFiles.length > 0, 'No fixture files found');

  for (const file of fixtureFiles) {
    runFixture(path.join(fixturesDir, file));
  }

  console.log(`fixtures passed (${fixtureFiles.length})`);
}

main();
