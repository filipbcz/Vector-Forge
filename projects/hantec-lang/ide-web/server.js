#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const projectRoot = path.resolve(root, '..');
const transpiler = path.join(projectRoot, 'compiler/src/transpile.js');

const AI_APPROVED_KEYWORDS = ['Hokna', 'vyblij', 'dyz', 'trtkej', 'funkcicka', 'joNeboHovno', 'jo', 'hovno', 'aKurva', 'bo', 'nechcu'];
const AI_DEPRECATED = ['nacpi', 'program', 'rekni', 'spocitej', 'kdyz', 'funkce'];

const AI_CONFIG = {
  enabled: String(process.env.AI_ENABLED || 'true').toLowerCase() !== 'false',
  model: process.env.AI_MODEL || 'openai-codex/gpt-5.3-codex',
  timeoutMs: Math.max(500, Number(process.env.AI_TIMEOUT_MS || 4500)),
  endpoint:
    process.env.AI_ENDPOINT ||
    process.env.OPENCLAW_MODEL_ENDPOINT ||
    (process.env.OPENAI_BASE_URL ? `${process.env.OPENAI_BASE_URL.replace(/\/$/, '')}/chat/completions` : 'http://127.0.0.1:11434/v1/chat/completions'),
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ''
};

function clampText(input, maxLen = 420) {
  const clean = String(input || '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    .replace(/<\/?script[^>]*>/gi, '')
    .replace(/\r/g, '')
    .trim();
  return clean.length > maxLen ? `${clean.slice(0, maxLen)}…` : clean;
}

function fallbackHint(source, cursorLine, mode) {
  const lines = String(source || '').split(/\r?\n/);
  const index = Math.max(0, Math.min(lines.length - 1, Number(cursorLine || 1) - 1));
  const current = (lines[index] || '').trim();

  let suggestion = 'vyblij "Sem napiš zprávu"';
  if (!lines.some(line => line.trim().startsWith('Hokna'))) {
    suggestion = 'Hokna';
  } else if (/^dyz\b/.test(current)) {
    suggestion = 'dyz jo\n  vyblij "podminka plati"\nkonec';
  } else if (/^funkcicka\b/.test(current) || mode === 'function') {
    suggestion = 'funkcicka pozdrav(jmeno)\n  vyblij jmeno\nkonec';
  } else if (/joNeboHovno/.test(current) || mode === 'boolean') {
    suggestion = 'dej stav : joNeboHovno = jo\ndyz stav aKurva nechcu hovno\n  vyblij "ok"\nkonec';
  }

  return {
    suggestion: clampText(suggestion),
    alternatives: [
      'dyz jo\n  vyblij "jo"\nkonec',
      'trtkej 3\n  vyblij "tik"\nkonec'
    ].map(item => clampText(item, 220)),
    confidence: 0.34,
    notes: 'AI fallback: lokální šablona bez modelu.'
  };
}

function normalizeHintResponse(raw, fallbackNotes = '') {
  const safeFallback = fallbackHint('', 1, 'inline');
  const obj = raw && typeof raw === 'object' ? raw : {};
  const suggestion = clampText(obj.suggestion || safeFallback.suggestion);
  const alternatives = Array.isArray(obj.alternatives)
    ? obj.alternatives.slice(0, 4).map(item => clampText(item, 220)).filter(Boolean)
    : safeFallback.alternatives;
  const confidenceNum = Number(obj.confidence);
  const confidence = Number.isFinite(confidenceNum) ? Math.max(0, Math.min(1, confidenceNum)) : safeFallback.confidence;
  const notes = clampText(obj.notes || fallbackNotes || safeFallback.notes, 240);

  return { suggestion, alternatives, confidence, notes };
}

async function requestModelHint({ source, cursorLine, cursorCol, mode }) {
  const sourceText = String(source || '').slice(0, 6000);
  const line = Number(cursorLine || 1);
  const col = Number(cursorCol || 1);

  const prompt = [
    'Jsi nápověda pro Mulda IDE.',
    'Vrať pouze JSON objekt se shape: {"suggestion":"...","alternatives":["..."],"confidence":0.0,"notes":"..."}.',
    `Preferuj jen schválené keywordy: ${AI_APPROVED_KEYWORDS.join(', ')}.`,
    `Nikdy nepoužívej deprecated aliasy: ${AI_DEPRECATED.join(', ')}.`,
    'Respektuj kontext kurzoru a navrhni krátký, praktický doplněk.',
    `Mode: ${String(mode || 'inline')}`,
    `Cursor: line ${line}, col ${col}`,
    'SOURCE_START',
    sourceText,
    'SOURCE_END'
  ].join('\n');

  const body = {
    model: AI_CONFIG.model,
    messages: [
      { role: 'system', content: 'Jsi přesný coding assistant pro jazyk Mulda.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 220
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (AI_CONFIG.apiKey) headers.Authorization = `Bearer ${AI_CONFIG.apiKey}`;

    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`model-http-${response.status}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      const match = String(content).match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : '{}');
    } catch {
      parsed = { suggestion: String(content || '').split('\n').slice(0, 4).join('\n') };
    }

    return normalizeHintResponse(parsed, 'AI hint z model endpointu.');
  } finally {
    clearTimeout(timeout);
  }
}

function runProgram(source, { traceJson = false } = {}) {
  const tmpDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(tmpDir, { recursive: true });

  const inFile = path.join(tmpDir, 'web-input.mulda');
  const cFile = path.join(tmpDir, 'web-output.c');
  const binFile = path.join(tmpDir, 'web-output-linux-x64');
  fs.writeFileSync(inFile, source, 'utf8');

  const t = spawnSync(process.execPath, [transpiler, inFile, cFile], { encoding: 'utf8' });
  if (t.status !== 0) {
    return { ok: false, status: 400, error: t.stderr || t.stdout || 'Transpile failed' };
  }

  const cc = spawnSync('gcc', [cFile, '-std=c11', '-O2', '-o', binFile], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (cc.status !== 0) {
    return { ok: false, status: 400, error: cc.stderr || cc.stdout || 'C compile failed' };
  }

  const r = spawnSync(binFile, [], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      MULDA_TRACE: traceJson ? '1' : '0',
      MULDA_TRACE_FORMAT: traceJson ? 'json' : 'text'
    }
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
      const isTraceEvent =
        parsed &&
        typeof parsed === 'object' &&
        (
          parsed.trace === true ||
          (typeof parsed.op === 'string' && (parsed.backend === 'c' || parsed.backend === 'js'))
        );
      if (isTraceEvent) {
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (req.method === 'POST' && req.url === '/run') {
      try {
        const payload = await readJsonBody(req);
        const source = String(payload.source || '');
        const traceJson = payload.traceJson !== false;

        const result = runProgram(source, { traceJson });
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    }

    if (req.method === 'POST' && req.url === '/ai/hint') {
      try {
        const payload = await readJsonBody(req);
        const baseFallback = fallbackHint(payload.source, payload.cursorLine, payload.mode);

        if (!AI_CONFIG.enabled) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(normalizeHintResponse(baseFallback, 'AI disabled (AI_ENABLED=false).')));
        }

        let hint;
        try {
          hint = await requestModelHint(payload);
        } catch (err) {
          hint = normalizeHintResponse(baseFallback, `AI fallback (${err.name === 'AbortError' ? 'timeout' : 'model unavailable'}).`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(hint));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(normalizeHintResponse(fallbackHint('', 1, 'inline'), `AI fallback (bad request: ${e.message})`)));
      }
    }

    res.writeHead(404);
    res.end('Not found');
  });
}

if (require.main === module) {
  const server = createServer();
  const port = process.env.PORT || 4173;
  server.listen(port, () => {
    console.log(`Mulda IDE running on http://localhost:${port}`);
  });
}

module.exports = { createServer, normalizeHintResponse, fallbackHint };
