const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { compileHantec } = require('../compiler/src/transpile');
const { runBytecodeObject } = require('../runtime/src/vm');

function runJsAndCollectOutput(js) {
  const lines = [];
  const context = {
    console: {
      log: (value) => lines.push(String(value))
    }
  };

  vm.runInNewContext(js, context, { timeout: 1000 });
  return lines;
}

function runFixture(fixturePath) {
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const fixture = JSON.parse(raw);
  const { name, source, expectedOutput } = fixture;

  const { js, bytecode } = compileHantec(source);

  const jsLines = runJsAndCollectOutput(js);
  assert.deepStrictEqual(jsLines, expectedOutput, `${name}: JS backend output mismatch`);

  const vmLines = [];
  runBytecodeObject(bytecode, { stdout: (line) => vmLines.push(String(line)) });
  assert.deepStrictEqual(vmLines, expectedOutput, `${name}: VM backend output mismatch`);
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
