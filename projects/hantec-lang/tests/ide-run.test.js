#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { createServer } = require('../ide-web/server.js');

async function main() {
  const probe = require('child_process').spawnSync('gcc', ['--version'], { stdio: 'ignore' });
  if (probe.status !== 0) {
    console.log('ide-run.test.js: SKIP (gcc not available)');
    return;
  }

  const server = createServer();

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const source = ['Hokna', 'dej x = 1', 'x = x + 1', 'vyblij x'].join('\n');
    const res = await fetch(`${baseUrl}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, traceJson: true })
    });

    assert.strictEqual(res.status, 200, 'run endpoint should return HTTP 200');
    const payload = await res.json();

    assert.strictEqual(payload.ok, true, 'run endpoint should return ok=true');
    assert.ok(Array.isArray(payload.trace), 'trace should be an array');
    assert.ok(payload.trace.length > 0, 'trace should contain C trace events');
    assert.ok(payload.trace.some((e) => e.op === 'DECLARE'), 'trace should include DECLARE');
    assert.ok(payload.trace.some((e) => e.op === 'ASSIGN'), 'trace should include ASSIGN');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    const distDir = path.join(__dirname, '..', 'dist');
    for (const name of ['web-input.mulda', 'web-output.c', 'web-output-linux-x64']) {
      const target = path.join(distDir, name);
      try {
        fs.unlinkSync(target);
      } catch (_) {
        // ignore cleanup errors
      }
    }
  }

  console.log('ide-run.test.js: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
