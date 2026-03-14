const assert = require('assert');
const { transpileHantec } = require('../compiler/src/transpile');

function testVariablesAndPrint() {
  const source = [
    '# test',
    'dej x = 40 + 2',
    'rekni Ahoj',
    'spocitej x'
  ].join('\n');

  const js = transpileHantec(source);
  assert(js.includes('const x = (40 + 2);'));
  assert(js.includes('console.log("Ahoj");'));
  assert(js.includes('console.log(x);'));
}

function testControlFlowBlocks() {
  const source = [
    'dej x = 2',
    'opakuj 3',
    '  kdyz x > 0',
    '    spocitej x',
    '  konec',
    'konec'
  ].join('\n');

  const js = transpileHantec(source);
  assert(js.includes('for (let __hantec_i1 = 0; __hantec_i1 < (3); __hantec_i1 += 1) {'));
  assert(js.includes('if ((x > 0)) {'));
  assert(js.includes('console.log(x);'));
}

function testUnexpectedKonecError() {
  const source = 'konec';
  assert.throws(
    () => transpileHantec(source),
    /Unexpected "konec"/
  );
}

function testMissingKonecError() {
  const source = [
    'kdyz 1 < 2',
    '  rekni ano'
  ].join('\n');

  assert.throws(
    () => transpileHantec(source),
    /missing closing "konec"/
  );
}

function testLineColumnError() {
  const source = 'dej 123 = 1';
  assert.throws(
    () => transpileHantec(source),
    /line 1, col 1/
  );
}

testVariablesAndPrint();
testControlFlowBlocks();
testUnexpectedKonecError();
testMissingKonecError();
testLineColumnError();
console.log('tests passed');
