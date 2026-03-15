#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function syntaxError(message, line, column = 1) {
  const err = new Error(`${message} (line ${line}, col ${column})`);
  err.line = line;
  err.column = column;
  return err;
}

function isIdentifier(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function parseFunctionSignature(signature, line) {
  const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/.exec(signature);
  if (!match) {
    if (!signature.includes('(') || !signature.endsWith(')')) {
      throw syntaxError('funkce requires signature like "funkce name(param1, param2)"', line);
    }

    const maybeName = signature.split('(')[0].trim();
    if (!isIdentifier(maybeName)) {
      throw syntaxError(`Invalid function name "${maybeName || ''}"`, line);
    }

    throw syntaxError('Invalid function parameter list', line);
  }

  const [, name, rawParams] = match;
  if (!isIdentifier(name)) {
    throw syntaxError(`Invalid function name "${name}"`, line);
  }

  const params = [];
  if (rawParams.trim()) {
    for (const rawParam of rawParams.split(',')) {
      const param = rawParam.trim();
      if (!param) {
        throw syntaxError('Invalid function parameter list', line);
      }
      if (!isIdentifier(param)) {
        throw syntaxError(`Invalid function parameter "${param}"`, line);
      }
      params.push(param);
    }
  }

  return { name, params };
}

function parseProgram(source) {
  const lines = source.split(/\r?\n/);
  const root = { type: 'program', body: [] };
  const stack = [root];

  function currentBody() {
    return stack[stack.length - 1].body;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed === 'konec') {
      if (stack.length === 1) {
        throw syntaxError('Unexpected "konec" without open block', lineNo);
      }
      stack.pop();
      continue;
    }

    if (trimmed.startsWith('kdyz ')) {
      const expr = trimmed.slice('kdyz '.length).trim();
      if (!expr) {
        throw syntaxError('kdyz requires condition expression', lineNo);
      }

      const node = { type: 'if', expr, body: [], line: lineNo };
      currentBody().push(node);
      stack.push(node);
      continue;
    }

    if (trimmed.startsWith('opakuj ')) {
      const expr = trimmed.slice('opakuj '.length).trim();
      if (!expr) {
        throw syntaxError('opakuj requires iteration count expression', lineNo);
      }

      const node = { type: 'repeat', expr, body: [], line: lineNo };
      currentBody().push(node);
      stack.push(node);
      continue;
    }

    if (trimmed.startsWith('funkce ')) {
      const signature = trimmed.slice('funkce '.length).trim();
      if (!signature) {
        throw syntaxError('funkce requires signature like "funkce name(param1, param2)"', lineNo);
      }

      const { name, params } = parseFunctionSignature(signature, lineNo);
      const node = { type: 'function', name, params, body: [], line: lineNo };
      currentBody().push(node);
      stack.push(node);
      continue;
    }

    if (trimmed.startsWith('dej ')) {
      const rest = trimmed.slice('dej '.length).trim();
      const eq = rest.indexOf('=');
      if (eq === -1) {
        throw syntaxError('Expected "=" in variable declaration', lineNo);
      }

      const name = rest.slice(0, eq).trim();
      const expr = rest.slice(eq + 1).trim();

      if (!isIdentifier(name)) {
        throw syntaxError(`Invalid variable name "${name}"`, lineNo);
      }
      if (!expr) {
        throw syntaxError('Variable declaration requires expression after "="', lineNo);
      }

      currentBody().push({ type: 'declare', name, expr, line: lineNo });
      continue;
    }

    if (trimmed.startsWith('rekni ')) {
      const text = trimmed.slice('rekni '.length).trim();
      if (!text) {
        throw syntaxError('rekni requires text', lineNo);
      }
      currentBody().push({ type: 'printText', text, line: lineNo });
      continue;
    }

    if (trimmed.startsWith('spocitej ')) {
      const expr = trimmed.slice('spocitej '.length).trim();
      if (!expr) {
        throw syntaxError('spocitej requires an expression', lineNo);
      }
      currentBody().push({ type: 'printExpr', expr, line: lineNo });
      continue;
    }

    if (trimmed.startsWith('vrat ')) {
      const expr = trimmed.slice('vrat '.length).trim();
      if (!expr) {
        throw syntaxError('vrat requires an expression', lineNo);
      }
      const inFunction = stack.some((node) => node.type === 'function');
      if (!inFunction) {
        throw syntaxError('vrat is only allowed inside funkce blocks', lineNo);
      }
      currentBody().push({ type: 'return', expr, line: lineNo });
      continue;
    }

    throw syntaxError(`Unsupported syntax: "${trimmed}"`, lineNo);
  }

  if (stack.length > 1) {
    const open = stack[stack.length - 1];
    const label = open.type === 'function' ? `function "${open.name}"` : `block "${open.type}"`;
    throw syntaxError(`${label} opened here is missing closing "konec"`, open.line);
  }

  return root.body;
}

function generateJs(ast) {
  const out = [
    '// generated by hantec transpiler v0.4.2',
    '"use strict";',
    '',
    '// stdlib v0.4.2 (MVP)',
    'function delka(value) {',
    '  if (value == null) return 0;',
    '  if (typeof value === "string" || Array.isArray(value)) return value.length;',
    '  if (typeof value === "object") return Object.keys(value).length;',
    '  return String(value).length;',
    '}',
    '',
    'function cislo(value) {',
    '  const parsed = Number(value);',
    '  if (Number.isNaN(parsed)) {',
    '    throw new Error(`cislo() expected number-like value, got: ${value}`);',
    '  }',
    '  return parsed;',
    '}',
    '',
    'function text(value) {',
    '  return String(value);',
    '}',
    ''
  ];

  let loopCounter = 0;

  function emit(nodes, indent = 0) {
    const pad = '  '.repeat(indent);

    for (const node of nodes) {
      if (node.type === 'declare') {
        out.push(`${pad}const ${node.name} = (${node.expr});`);
      } else if (node.type === 'printText') {
        out.push(`${pad}console.log(${JSON.stringify(node.text)});`);
      } else if (node.type === 'printExpr') {
        out.push(`${pad}console.log(${node.expr});`);
      } else if (node.type === 'if') {
        out.push(`${pad}if ((${node.expr})) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}}`);
      } else if (node.type === 'repeat') {
        loopCounter += 1;
        const idx = `__hantec_i${loopCounter}`;
        out.push(`${pad}for (let ${idx} = 0; ${idx} < (${node.expr}); ${idx} += 1) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}}`);
      } else if (node.type === 'function') {
        out.push(`${pad}function ${node.name}(${node.params.join(', ')}) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}}`);
      } else if (node.type === 'return') {
        out.push(`${pad}return (${node.expr});`);
      }
    }
  }

  emit(ast, 0);
  return out.join('\n');
}

function transpileHantec(source) {
  const ast = parseProgram(source);
  return generateJs(ast);
}

function emitBytecodePlaceholder(jsCode) {
  return {
    version: '0.4.2',
    target: 'node',
    note: 'bytecode backend placeholder',
    bytes: Buffer.from(jsCode, 'utf8').length
  };
}

function main() {
  const [, , inputFile, outputFile] = process.argv;
  if (!inputFile || !outputFile) {
    console.error('Usage: node compiler/src/transpile.js <input.hantec> <output.js>');
    process.exit(1);
  }

  const inputPath = path.resolve(inputFile);
  const outputPath = path.resolve(outputFile);

  try {
    const source = fs.readFileSync(inputPath, 'utf8');
    const js = transpileHantec(source);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, js, 'utf8');

    const bytecodePath = outputPath.replace(/\.js$/, '.bytecode.json');
    fs.writeFileSync(bytecodePath, JSON.stringify(emitBytecodePlaceholder(js), null, 2));

    console.log(`Transpiled ${inputFile} -> ${outputFile}`);
    console.log(`Bytecode placeholder -> ${path.relative(process.cwd(), bytecodePath)}`);
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  syntaxError,
  parseProgram,
  generateJs,
  transpileHantec,
  emitBytecodePlaceholder
};
