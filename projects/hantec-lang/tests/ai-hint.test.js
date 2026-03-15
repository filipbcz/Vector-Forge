#!/usr/bin/env node
const assert = require('assert');

process.env.AI_ENABLED = 'false';

const { fallbackHint, normalizeHintResponse } = require('../ide-web/server.js');

async function run() {
  const data = normalizeHintResponse(
    fallbackHint('Hokna\nvyblij 1', 2, 'inline'),
    'AI disabled (AI_ENABLED=false).'
  );

  assert.strictEqual(typeof data.suggestion, 'string', 'suggestion should be a string');
  assert.ok(Array.isArray(data.alternatives), 'alternatives should be an array');
  assert.strictEqual(typeof data.confidence, 'number', 'confidence should be a number');
  assert.strictEqual(typeof data.notes, 'string', 'notes should be a string');
  assert.ok(data.notes.length > 0, 'notes should not be empty');

  console.log('ai-hint.test.js: OK');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
