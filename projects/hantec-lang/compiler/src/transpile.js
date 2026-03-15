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

function parseAssignment(raw, line) {
  const eq = raw.indexOf('=');
  if (eq === -1) {
    throw syntaxError('Expected "=" in assignment', line);
  }

  const name = raw.slice(0, eq).trim();
  const expr = normalizeExpression(raw.slice(eq + 1).trim());

  if (!isIdentifier(name)) {
    throw syntaxError(`Invalid assignment target "${name}"`, line);
  }
  if (!expr) {
    throw syntaxError('Assignment requires expression after "="', line);
  }

  return { name, expr };
}

function normalizeExpression(expr) {
  return expr
    .replace(/\bjo\b/g, 'true')
    .replace(/\bhovno\b/g, 'false')
    .replace(/\baKurva\b/g, '&&')
    .replace(/\bbo\b/g, '||')
    .replace(/\bnechcu\b/g, '!');
}

function parseFunctionSignature(signature, line) {
  const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/.exec(signature);
  if (!match) {
    if (!signature.includes('(') || !signature.endsWith(')')) {
      throw syntaxError('funkcicka requires signature like "funkcicka name(param1, param2)"', line);
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
  let sawStartKeyword = false;
  let sawExecutableStatement = false;

  function currentBody() {
    return stack[stack.length - 1].body;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed === 'Hokna' || trimmed === 'nacpi' || trimmed === 'program') {
      if (sawStartKeyword) {
        throw syntaxError('Program start keyword is allowed only once', lineNo);
      }
      if (sawExecutableStatement) {
        throw syntaxError('Program start keyword must be the first statement', lineNo);
      }
      sawStartKeyword = true;
      continue;
    }

    if (!sawStartKeyword) {
      throw syntaxError('Program must start with "Hokna"', lineNo);
    }

    sawExecutableStatement = true;

    if (trimmed === 'konec') {
      if (stack.length === 1) {
        throw syntaxError('Unexpected "konec" without open block', lineNo);
      }
      stack.pop();
      continue;
    }

    if (trimmed.startsWith('dyz ') || trimmed.startsWith('kdyz ')) {
      const isDeprecatedAlias = trimmed.startsWith('kdyz ');
      const expr = normalizeExpression(trimmed.slice((isDeprecatedAlias ? 'kdyz' : 'dyz').length).trim());
      if (!expr) {
        throw syntaxError(`${isDeprecatedAlias ? 'kdyz' : 'dyz'} requires condition expression`, lineNo);
      }

      const node = { type: 'if', expr, body: [], line: lineNo };
      currentBody().push(node);
      stack.push(node);
      continue;
    }

    if (trimmed.startsWith('opakuj ')) {
      const expr = normalizeExpression(trimmed.slice('opakuj '.length).trim());
      if (!expr) {
        throw syntaxError('opakuj requires iteration count expression', lineNo);
      }

      const node = { type: 'repeat', expr, body: [], line: lineNo };
      currentBody().push(node);
      stack.push(node);
      continue;
    }

    if (trimmed.startsWith('funkcicka ') || trimmed.startsWith('funkce ')) {
      const isDeprecatedAlias = trimmed.startsWith('funkce ');
      const keyword = isDeprecatedAlias ? 'funkce' : 'funkcicka';
      const signature = trimmed.slice(`${keyword} `.length).trim();
      if (!signature) {
        throw syntaxError(`${keyword} requires signature like "${keyword} name(param1, param2)"`, lineNo);
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

      const left = rest.slice(0, eq).trim();
      const expr = normalizeExpression(rest.slice(eq + 1).trim());

      const typeSplit = left.split(':');
      const name = typeSplit[0].trim();
      const declaredType = typeSplit[1] ? typeSplit[1].trim() : null;

      if (!isIdentifier(name)) {
        throw syntaxError(`Invalid variable name "${name}"`, lineNo);
      }
      if (declaredType && declaredType !== 'joNeboHovno') {
        throw syntaxError(`Unsupported type annotation "${declaredType}"`, lineNo);
      }
      if (!expr) {
        throw syntaxError('Variable declaration requires expression after "="', lineNo);
      }

      currentBody().push({ type: 'declare', name, declaredType, expr, line: lineNo });
      continue;
    }

    if (trimmed.startsWith('vyblij ')) {
      const expr = normalizeExpression(trimmed.slice('vyblij '.length).trim());
      if (!expr) {
        throw syntaxError('vyblij requires expression', lineNo);
      }
      currentBody().push({ type: 'printExpr', expr, line: lineNo });
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
      const expr = normalizeExpression(trimmed.slice('spocitej '.length).trim());
      if (!expr) {
        throw syntaxError('spocitej requires an expression', lineNo);
      }
      currentBody().push({ type: 'printExpr', expr, line: lineNo });
      continue;
    }

    if (trimmed.startsWith('vrat ')) {
      const expr = normalizeExpression(trimmed.slice('vrat '.length).trim());
      if (!expr) {
        throw syntaxError('vrat requires an expression', lineNo);
      }
      const inFunction = stack.some((node) => node.type === 'function');
      if (!inFunction) {
        throw syntaxError('vrat is only allowed inside funkcicka blocks', lineNo);
      }
      currentBody().push({ type: 'return', expr, line: lineNo });
      continue;
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*\s*=(?!=)/.test(trimmed)) {
      const { name, expr } = parseAssignment(trimmed, lineNo);
      currentBody().push({ type: 'assign', name, expr, line: lineNo });
      continue;
    }

    throw syntaxError(`Unsupported syntax: "${trimmed}"`, lineNo);
  }

  if (!sawStartKeyword) {
    throw syntaxError('Program must start with "Hokna"', 1);
  }

  if (stack.length > 1) {
    const open = stack[stack.length - 1];
    const label = open.type === 'function' ? `function "${open.name}"` : `block "${open.type}"`;
    throw syntaxError(`${label} opened here is missing closing "konec"`, open.line);
  }

  return root.body;
}

function stdlibPrelude() {
  return [
    '// stdlib v0.8.0',
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
    '',
    'function minimum(...values) {',
    '  if (values.length === 0) {',
    "    throw new Error('minimum() requires at least one argument');",
    '  }',
    '  return Math.min(...values.map(cislo));',
    '}',
    '',
    'function maximum(...values) {',
    '  if (values.length === 0) {',
    "    throw new Error('maximum() requires at least one argument');",
    '  }',
    '  return Math.max(...values.map(cislo));',
    '}',
    '',
    'function obsahuje(container, needle) {',
    '  if (typeof container === "string" || Array.isArray(container)) {',
    '    return container.includes(needle);',
    '  }',
    '  if (container && typeof container === "object") {',
    '    return Object.prototype.hasOwnProperty.call(container, needle);',
    '  }',
    '  return false;',
    '}',
    ''
  ];
}

function generateJs(ast) {
  const out = [
    '// generated by mulda transpiler v0.8.0',
    '"use strict";',
    '',
    ...stdlibPrelude(),
    'const __muldaTrace = (typeof globalThis !== "undefined" && typeof globalThis.__muldaTraceHook === "function")',
    '  ? globalThis.__muldaTraceHook',
    '  : () => {};',
    ''
  ];

  let loopCounter = 0;

  function emit(nodes, indent = 0) {
    const pad = '  '.repeat(indent);

    for (const node of nodes) {
      if (node.type === 'declare') {
        out.push(`${pad}let ${node.name} = (${node.expr});`);
        out.push(`${pad}__muldaTrace({ backend: "js", op: "DECLARE", line: ${node.line}, detail: ${JSON.stringify(`${node.name}=`)} + JSON.stringify(${node.name}) });`);
      } else if (node.type === 'assign') {
        out.push(`${pad}${node.name} = (${node.expr});`);
        out.push(`${pad}__muldaTrace({ backend: "js", op: "ASSIGN", line: ${node.line}, detail: ${JSON.stringify(`${node.name}=`)} + JSON.stringify(${node.name}) });`);
      } else if (node.type === 'printText') {
        out.push(`${pad}__muldaTrace({ backend: "js", op: "PRINT_TEXT", line: ${node.line} });`);
        out.push(`${pad}console.log(${JSON.stringify(node.text)});`);
      } else if (node.type === 'printExpr') {
        out.push(`${pad}__muldaTrace({ backend: "js", op: "PRINT_EXPR", line: ${node.line} });`);
        out.push(`${pad}console.log(${node.expr});`);
      } else if (node.type === 'if') {
        out.push(`${pad}__muldaTrace({ backend: "js", op: "IF", line: ${node.line} });`);
        out.push(`${pad}if ((${node.expr})) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}}`);
      } else if (node.type === 'repeat') {
        loopCounter += 1;
        const idx = `__mulda_i${loopCounter}`;
        out.push(`${pad}__muldaTrace({ backend: "js", op: "REPEAT", line: ${node.line} });`);
        out.push(`${pad}for (let ${idx} = 0; ${idx} < (${node.expr}); ${idx} += 1) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}}`);
      } else if (node.type === 'function') {
        out.push(`${pad}__muldaTrace({ backend: "js", op: "FUNCTION", line: ${node.line}, detail: ${JSON.stringify(`name=${node.name}`)} });`);
        out.push(`${pad}function ${node.name}(${node.params.join(', ')}) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}}`);
      } else if (node.type === 'return') {
        out.push(`${pad}__muldaTrace({ backend: "js", op: "RETURN", line: ${node.line} });`);
        out.push(`${pad}return (${node.expr});`);
      }
    }
  }

  emit(ast, 0);
  return out.join('\n');
}

function cEscape(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function generateC(ast) {
  const out = [
    '/* generated by mulda transpiler v0.8.0 */',
    '#include <stdio.h>',
    '#include <stdbool.h>',
    '#include <stdlib.h>',
    '#include <string.h>',
    '',
    'static int __mulda_trace_enabled(void) {',
    '  const char *v = getenv("MULDA_TRACE");',
    '  return v && strcmp(v, "0") != 0;',
    '}',
    '',
    'static int __mulda_trace_json(void) {',
    '  const char *v = getenv("MULDA_TRACE_FORMAT");',
    '  return v && strcmp(v, "json") == 0;',
    '}',
    '',
    'static void __mulda_trace(const char *op, int line, const char *detail) {',
    '  if (!__mulda_trace_enabled()) return;',
    '  if (__mulda_trace_json()) {',
    '    if (detail && detail[0]) {',
    '      fprintf(stderr, "{\\\"backend\\\":\\\"c\\\",\\\"op\\\":\\\"%s\\\",\\\"line\\\":%d,\\\"detail\\\":\\\"%s\\\"}\\n", op, line, detail);',
    '    } else {',
    '      fprintf(stderr, "{\\\"backend\\\":\\\"c\\\",\\\"op\\\":\\\"%s\\\",\\\"line\\\":%d}\\n", op, line);',
    '    }',
    '  } else {',
    '    if (detail && detail[0]) fprintf(stderr, "[TRACE][c] %s line=%d %s\\n", op, line, detail);',
    '    else fprintf(stderr, "[TRACE][c] %s line=%d\\n", op, line);',
    '  }',
    '}',
    '',
    'static void __mulda_print_num(double value) {',
    '  if ((double)((long long)value) == value) printf("%lld\\n", (long long)value);',
    '  else printf("%g\\n", value);',
    '}',
    ''
  ];

  const topFunctions = ast.filter((n) => n.type === 'function');
  for (const fn of topFunctions) {
    out.push(`static double ${fn.name}(${fn.params.map(() => 'double').join(', ') || 'void'});`);
  }
  if (topFunctions.length > 0) out.push('');

  let repeatCounter = 0;

  function emit(nodes, indent = 0) {
    const pad = '  '.repeat(indent);
    for (const node of nodes) {
      if (node.type === 'declare') {
        const cType = node.declaredType === 'joNeboHovno' ? 'bool' : 'double';
        out.push(`${pad}${cType} ${node.name} = (${node.expr});`);
        out.push(`${pad}__mulda_trace("DECLARE", ${node.line}, "${cEscape(`${node.name}=%g`)}");`);
      } else if (node.type === 'assign') {
        out.push(`${pad}${node.name} = (${node.expr});`);
        out.push(`${pad}__mulda_trace("ASSIGN", ${node.line}, "${cEscape(`${node.name}=%g`)}");`);
      } else if (node.type === 'printText') {
        out.push(`${pad}__mulda_trace("PRINT_TEXT", ${node.line}, "");`);
        out.push(`${pad}printf("${cEscape(node.text)}\\n");`);
      } else if (node.type === 'printExpr') {
        const isStringLiteral = /^"([^"\\]|\\.)*"$/.test(node.expr);
        out.push(`${pad}__mulda_trace("PRINT_EXPR", ${node.line}, "");`);
        if (isStringLiteral) out.push(`${pad}printf("%s\\n", ${node.expr});`);
        else out.push(`${pad}__mulda_print_num((double)(${node.expr}));`);
      } else if (node.type === 'if') {
        out.push(`${pad}__mulda_trace("IF", ${node.line}, "");`);
        out.push(`${pad}if ((${node.expr})) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}}`);
      } else if (node.type === 'repeat') {
        repeatCounter += 1;
        const idx = `__mulda_i${repeatCounter}`;
        out.push(`${pad}__mulda_trace("REPEAT", ${node.line}, "");`);
        out.push(`${pad}for (int ${idx} = 0; ${idx} < (int)(${node.expr}); ${idx} += 1) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}}`);
      } else if (node.type === 'function') {
        out.push(`${pad}__mulda_trace("FUNCTION", ${node.line}, "${cEscape(`name=${node.name}`)}");`);
        out.push(`${pad}static double ${node.name}(${node.params.map((p) => `double ${p}`).join(', ') || 'void'}) {`);
        emit(node.body, indent + 1);
        out.push(`${pad}  return 0;`);
        out.push(`${pad}}`);
        out.push('');
      } else if (node.type === 'return') {
        out.push(`${pad}__mulda_trace("RETURN", ${node.line}, "");`);
        out.push(`${pad}return (${node.expr});`);
      }
    }
  }

  for (const fn of topFunctions) {
    emit([fn], 0);
  }

  out.push('int main(void) {');
  emit(ast.filter((n) => n.type !== 'function'), 1);
  out.push('  return 0;');
  out.push('}');

  return out.join('\n');
}

function buildBytecodeInstructions(nodes) {
  return nodes.map((node) => {
    if (node.type === 'declare') {
      return { op: 'DECLARE', name: node.name, expr: node.expr, line: node.line };
    }
    if (node.type === 'assign') {
      return { op: 'ASSIGN', name: node.name, expr: node.expr, line: node.line };
    }
    if (node.type === 'printText') {
      return { op: 'PRINT_TEXT', text: node.text, line: node.line };
    }
    if (node.type === 'printExpr') {
      return { op: 'PRINT_EXPR', expr: node.expr, line: node.line };
    }
    if (node.type === 'if') {
      return { op: 'IF', expr: node.expr, body: buildBytecodeInstructions(node.body), line: node.line };
    }
    if (node.type === 'repeat') {
      return { op: 'REPEAT', expr: node.expr, body: buildBytecodeInstructions(node.body), line: node.line };
    }
    if (node.type === 'function') {
      return {
        op: 'FUNCTION',
        name: node.name,
        params: node.params,
        body: buildBytecodeInstructions(node.body),
        line: node.line
      };
    }
    if (node.type === 'return') {
      return { op: 'RETURN', expr: node.expr, line: node.line };
    }
    throw new Error(`Unsupported AST node in bytecode emitter: ${node.type}`);
  });
}

function emitBytecode(ast) {
  return {
    version: '0.8.0',
    target: 'mulda-vm',
    note: 'bytecode prototype with recursive instruction blocks',
    instructions: buildBytecodeInstructions(ast)
  };
}

function transpileMulda(source) {
  const ast = parseProgram(source);
  return generateJs(ast);
}

function compileMulda(source) {
  const ast = parseProgram(source);
  return {
    ast,
    js: generateJs(ast),
    c: generateC(ast),
    bytecode: emitBytecode(ast)
  };
}

function main() {
  const [, , inputFile, outputFile] = process.argv;
  if (!inputFile || !outputFile) {
    console.error('Usage: node compiler/src/transpile.js <input.mulda> <output.js|output.c>');
    process.exit(1);
  }

  const inputPath = path.resolve(inputFile);
  const outputPath = path.resolve(outputFile);

  try {
    const source = fs.readFileSync(inputPath, 'utf8');
    const { js, c, bytecode } = compileMulda(source);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    if (outputPath.endsWith('.c')) {
      fs.writeFileSync(outputPath, c, 'utf8');
      console.log(`Transpiled ${inputFile} -> ${outputFile}`);
      return;
    }

    fs.writeFileSync(outputPath, js, 'utf8');

    const bytecodePath = outputPath.replace(/\.js$/, '.bytecode.json');
    fs.writeFileSync(bytecodePath, JSON.stringify(bytecode, null, 2));

    console.log(`Transpiled ${inputFile} -> ${outputFile}`);
    console.log(`Bytecode -> ${path.relative(process.cwd(), bytecodePath)}`);
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
  generateC,
  transpileMulda,
  compileMulda,
  transpileHantec: transpileMulda,
  compileHantec: compileMulda,
  emitBytecode
};