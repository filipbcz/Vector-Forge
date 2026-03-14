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

function testLineColumnError() {
  const source = 'dej 123 = 1';
  assert.throws(
    () => transpileHantec(source),
    /line 1, col 1/
  );
}

testVariablesAndPrint();
testLineColumnError();
console.log('tests passed');
