#!/usr/bin/env node
const assert = require('assert');

process.env.AI_ENABLED = 'false';

const { createServer } = require('../ide-web/server.js');

async function run() {
  const server = createServer();

  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/ai/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'Hokna\nvyblij 1',
        cursorLine: 2,
        cursorCol: 9,
        mode: 'inline'
      })
    });

    assert.strictEqual(res.status, 200, 'Expected status 200');
    const data = await res.json();

    assert.strictEqual(typeof data.suggestion, 'string', 'suggestion should be a string');
    assert.ok(Array.isArray(data.alternatives), 'alternatives should be an array');
    assert.strictEqual(typeof data.confidence, 'number', 'confidence should be a number');
    assert.strictEqual(typeof data.notes, 'string', 'notes should be a string');

    console.log('ai-hint.test.js: OK');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
