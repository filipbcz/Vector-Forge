const fs = require('fs');
const path = require('path');

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

function evaluateExpr(expr, scope, helpers) {
  const names = Object.keys(scope);
  const values = Object.values(scope);
  const helperNames = Object.keys(helpers);
  const helperValues = Object.values(helpers);
  // eslint-disable-next-line no-new-func
  const fn = new Function(...helperNames, ...names, `return (${expr});`);
  return fn(...helperValues, ...values);
}

function createStdlib() {
  function delka(value) {
    if (value == null) return 0;
    if (typeof value === 'string' || Array.isArray(value)) return value.length;
    if (typeof value === 'object') return Object.keys(value).length;
    return String(value).length;
  }

  function cislo(value) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`cislo() expected number-like value, got: ${value}`);
    }
    return parsed;
  }

  function text(value) {
    return String(value);
  }

  function minimum(...values) {
    if (values.length === 0) {
      throw new Error('minimum() requires at least one argument');
    }
    return Math.min(...values.map(cislo));
  }

  function maximum(...values) {
    if (values.length === 0) {
      throw new Error('maximum() requires at least one argument');
    }
    return Math.max(...values.map(cislo));
  }

  function obsahuje(container, needle) {
    if (typeof container === 'string' || Array.isArray(container)) {
      return container.includes(needle);
    }
    if (container && typeof container === 'object') {
      return Object.prototype.hasOwnProperty.call(container, needle);
    }
    return false;
  }

  return { delka, cislo, text, minimum, maximum, obsahuje };
}

function executeInstructions(instructions, scope, helpers, stdout) {
  for (const ins of instructions) {
    if (ins.op === 'DECLARE') {
      scope[ins.name] = evaluateExpr(ins.expr, scope, helpers);
      continue;
    }

    if (ins.op === 'PRINT_TEXT') {
      stdout(String(ins.text));
      continue;
    }

    if (ins.op === 'PRINT_EXPR') {
      const value = evaluateExpr(ins.expr, scope, helpers);
      stdout(String(value));
      continue;
    }

    if (ins.op === 'IF') {
      const condition = evaluateExpr(ins.expr, scope, helpers);
      if (condition) {
        const result = executeInstructions(ins.body, scope, helpers, stdout);
        if (result instanceof ReturnSignal) return result;
      }
      continue;
    }

    if (ins.op === 'REPEAT') {
      const count = Number(evaluateExpr(ins.expr, scope, helpers));
      for (let i = 0; i < count; i += 1) {
        const result = executeInstructions(ins.body, scope, helpers, stdout);
        if (result instanceof ReturnSignal) return result;
      }
      continue;
    }

    if (ins.op === 'FUNCTION') {
      scope[ins.name] = (...args) => {
        const localScope = Object.create(scope);
        for (let i = 0; i < ins.params.length; i += 1) {
          localScope[ins.params[i]] = args[i];
        }
        const result = executeInstructions(ins.body, localScope, helpers, stdout);
        if (result instanceof ReturnSignal) return result.value;
        return undefined;
      };
      continue;
    }

    if (ins.op === 'RETURN') {
      return new ReturnSignal(evaluateExpr(ins.expr, scope, helpers));
    }

    throw new Error(`Unsupported opcode: ${ins.op}`);
  }

  return null;
}

function runBytecodeObject(bytecode, options = {}) {
  if (!bytecode || typeof bytecode !== 'object') {
    throw new Error('Invalid bytecode object');
  }
  if (!Array.isArray(bytecode.instructions)) {
    throw new Error('Bytecode missing instructions array');
  }

  const stdout = options.stdout || ((line) => console.log(line));
  const helpers = createStdlib();
  const scope = {};

  const result = executeInstructions(bytecode.instructions, scope, helpers, stdout);
  if (result instanceof ReturnSignal) {
    return result.value;
  }
  return undefined;
}

function runBytecodeFile(filePath, options = {}) {
  const resolved = path.resolve(filePath);
  const raw = fs.readFileSync(resolved, 'utf8');
  const bytecode = JSON.parse(raw);
  return runBytecodeObject(bytecode, options);
}

module.exports = {
  runBytecodeObject,
  runBytecodeFile,
  createStdlib
};
