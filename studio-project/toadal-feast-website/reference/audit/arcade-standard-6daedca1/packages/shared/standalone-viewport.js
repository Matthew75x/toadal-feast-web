// ============================================================
// standalone-viewport.js — Shared responsive canvas fitting for standalone modes
// Keeps the logical game canvas intact while sizing the player-facing frame to
// the actual standalone stage. It has no Arcade, Puzzle, or Connect-3 runtime
// dependencies, so every split package can use the same layout contract.
// ============================================================

const StandaloneViewport = (() => {
  const DEFAULT_MAX_DPR = 3;

  function numericStyle(style, property) {
    const value = Number.parseFloat(style?.[property]);
    return Number.isFinite(value) ? value : 0;
  }

  function resolveWrapper(canvas, suppliedWrapper) {
    return suppliedWrapper
      || canvas?.closest?.('#canvasWrapper')
      || document.getElementById('canvasWrapper')
      || null;
  }

  function resolveStage(wrapper, suppliedStage) {
    return suppliedStage
      || wrapper?.closest?.('.standalone-stage')
      || wrapper?.parentElement
      || null;
  }

  function contentBox(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const width = Math.max(1, (element.clientWidth || rect.width)
      - numericStyle(style, 'paddingLeft')
      - numericStyle(style, 'paddingRight'));
    const height = Math.max(1, (element.clientHeight || rect.height)
      - numericStyle(style, 'paddingTop')
      - numericStyle(style, 'paddingBottom'));
    return { width, height };
  }

  /**
   * Fit a fixed logical canvas into the visible standalone stage.
   *
   * The wrapper and canvas are deliberately assigned the same display size.
   * This prevents a browser from clipping a canvas that was sized against the
   * whole window while its standalone frame was capped to a smaller box.
   */
  function fitCanvas(canvas, logicalWidth, logicalHeight, options = {}) {
    if (!canvas || !(logicalWidth > 0) || !(logicalHeight > 0)) return null;
    const wrapper = resolveWrapper(canvas, options.wrapper);
    const stage = resolveStage(wrapper, options.stage);
    const bounds = contentBox(stage);
    if (!wrapper || !bounds) return null;

    const scale = Math.max(0.05, Math.min(bounds.width / logicalWidth, bounds.height / logicalHeight));
    const displayWidth = Math.max(1, Math.floor(logicalWidth * scale));
    const displayHeight = Math.max(1, Math.floor(logicalHeight * scale));
    const rawDpr = Number(options.dpr ?? window.devicePixelRatio ?? 1);
    const pixelRatio = Math.max(1, Math.min(Number.isFinite(rawDpr) ? rawDpr : 1, options.maxDpr || DEFAULT_MAX_DPR));

    // The frame owns the visible box; the canvas may never be larger than it.
    wrapper.style.width = `${displayWidth}px`;
    wrapper.style.height = `${displayHeight}px`;
    canvas.width = Math.round(logicalWidth * pixelRatio);
    canvas.height = Math.round(logicalHeight * pixelRatio);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    return Object.freeze({
      scale,
      displayWidth,
      displayHeight,
      pixelRatio,
      stageWidth: Math.floor(bounds.width),
      stageHeight: Math.floor(bounds.height),
    });
  }

  return Object.freeze({ fitCanvas });
})();
