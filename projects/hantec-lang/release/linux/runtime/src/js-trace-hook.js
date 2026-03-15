function createJsTracer(options = {}) {
  const traceEnabled = options.trace === true;
  if (!traceEnabled) {
    return () => {};
  }

  const format = options.traceFormat === 'json' ? 'json' : 'text';

  return (event) => {
    if (format === 'json') {
      process.stderr.write(`${JSON.stringify({ trace: true, ...event })}\n`);
      return;
    }

    const detail = event.detail ? ` ${event.detail}` : '';
    const backend = event.backend || 'js';
    process.stderr.write(`[trace:${backend}] ${event.op} line=${event.line ?? '?'}${detail}\n`);
  };
}

const trace = createJsTracer({
  trace: process.env.MULDA_TRACE === '1',
  traceFormat: process.env.MULDA_TRACE_FORMAT || 'text'
});

globalThis.__muldaTraceHook = trace;
