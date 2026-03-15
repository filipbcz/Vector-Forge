#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const projectRoot = path.resolve(root, '..');
const transpiler = path.join(projectRoot, 'compiler/src/transpile.js');
const runner = path.join(projectRoot, 'runtime/src/run.js');

function runProgram(source, { traceJson = false } = {}) {
  const tmpDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(tmpDir, { recursive: true });

  const inFile = path.join(tmpDir, 'web-input.mulda');
  const outFile = path.join(tmpDir, 'web-output.js');
  fs.writeFileSync(inFile, source, 'utf8');

  const t = spawnSync(process.execPath, [transpiler, inFile, outFile], { encoding: 'utf8' });
  if (t.status !== 0) {
    return { ok: false, status: 400, error: t.stderr || t.stdout || 'Transpile failed' };
  }

  const args = [runner];
  if (traceJson) {
    args.push('--trace-json');
  }
  args.push(outFile);

  const r = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const output = String(r.stdout || '').trim();
  const stderrText = String(r.stderr || '');
  const trace = [];
  const errors = [];

  for (const line of stderrText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.trace) {
        trace.push(parsed);
      } else {
        errors.push(trimmed);
      }
    } catch {
      errors.push(trimmed);
    }
  }

  return {
    ok: r.status === 0,
    status: r.status === 0 ? 200 : 400,
    output,
    trace,
    error: errors.join('\n') || null
  };
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (req.method === 'POST' && req.url === '/run') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const source = String(payload.source || '');
        const traceJson = payload.traceJson !== false;

        const result = runProgram(source, { traceJson });
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const port = process.env.PORT || 4173;
server.listen(port, () => {
  console.log(`Mulda IDE running on http://localhost:${port}`);
});
