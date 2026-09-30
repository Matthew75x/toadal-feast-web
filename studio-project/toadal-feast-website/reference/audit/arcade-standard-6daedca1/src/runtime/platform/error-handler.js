// ============================================================
// src/runtime/platform/error-handler.js — safe client-side error reporting hooks
// ============================================================
// The game stays local-first. No network telemetry is sent automatically.
// Consumers can listen for `froggy:error` to forward sanitized reports later.

const ErrorReporter = (() => {
  const MAX_ENTRIES = 30;
  const entries = [];

  function safeText(value, limit = 4000) {
    try {
      const text = typeof value === 'string' ? value : String(value ?? '');
      return text.slice(0, limit);
    } catch (_) {
      return 'Unserializable error value';
    }
  }

  function normalize(kind, input = {}) {
    return Object.freeze({
      kind,
      message: safeText(input.message || input.reason || 'Unknown error'),
      filename: safeText(input.filename || ''),
      line: Number.isFinite(Number(input.line)) ? Number(input.line) : null,
      column: Number.isFinite(Number(input.column)) ? Number(input.column) : null,
      stack: safeText(input.stack || ''),
      time: new Date().toISOString(),
      url: safeText(typeof location !== 'undefined' ? location.href : ''),
    });
  }

  function report(kind, input) {
    const payload = normalize(kind, input);
    entries.push(payload);
    if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
    try {
      console.error(`[TOADAL FEAST ${kind}]`, payload);
      if (globalThis.GameTransitionOverlay?.active) globalThis.GameTransitionOverlay.markError?.(payload.message);
      window.dispatchEvent(new CustomEvent('froggy:error', { detail: payload }));
    } catch (_) {
      // Never allow reporting to create another uncaught error.
    }
    return payload;
  }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('error', event => {
      report('uncaught-error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      report('unhandled-rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
    });
  }

  return Object.freeze({
    report,
    recent: () => entries.slice(),
    clear: () => { entries.length = 0; },
  });
})();

if (typeof globalThis !== 'undefined') globalThis.ErrorReporter = ErrorReporter;
