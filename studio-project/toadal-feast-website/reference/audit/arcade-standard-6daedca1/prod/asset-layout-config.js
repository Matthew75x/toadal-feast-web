// ============================================================
// asset-layout-config.js — Asset Positioning Configuration
// ============================================================
// Defines where UI elements, characters, and game objects should
// be rendered on the canvas. Allows repositioning without code changes.

const AssetLayoutConfig = {
  // ============================================================
  // CANVAS AND VIEWPORT CONFIGURATION
  // ============================================================
  viewport: {
    width: 800,
    height: 600,
    scale: 1.0,
    backgroundColor: '#1a1a1a',
  },

  // ============================================================
  // CHARACTER RENDERING POSITIONS
  // ============================================================
  characters: {
    // Main character in arcade/modes
    main: {
      x: 400,        // Center X
      y: 350,        // Bottom third of screen
      scale: 2.0,
      layer: 100,
    },

    // Character in puzzle mode
    puzzle: {
      x: 400,
      y: 480,
      scale: 1.5,
      layer: 100,
    },

    // Secondary character (multi-character modes)
    secondary: {
      x: 600,
      y: 400,
      scale: 1.5,
      layer: 90,
    },

    // Character portrait in UI
    portrait: {
      x: 50,
      y: 50,
      scale: 1.0,
      layer: 50,
    },

    // Character selection screen
    selection: {
      x: 400,
      y: 300,
      scale: 2.5,
      layer: 100,
    },
  },

  // ============================================================
  // HUD ELEMENT POSITIONS
  // ============================================================
  hud: {
    // Score display
    score: {
      x: 50,
      y: 20,
      fontSize: 28,
      align: 'left',
      layer: 200,
    },

    // Timer display
    timer: {
      x: 750,
      y: 20,
      fontSize: 24,
      align: 'right',
      layer: 200,
    },

    // Lives/health indicator
    lives: {
      x: 50,
      y: 60,
      iconSize: 24,
      spacing: 30,
      layer: 200,
    },

    // Level indicator
    level: {
      x: 400,
      y: 20,
      fontSize: 20,
      align: 'center',
      layer: 200,
    },

    // Combo display
    combo: {
      x: 750,
      y: 60,
      fontSize: 32,
      align: 'right',
      layer: 200,
    },

    // Status messages
    message: {
      x: 400,
      y: 200,
      fontSize: 48,
      align: 'center',
      duration: 2000,
      layer: 300,
    },

    // FPS/Debug info
    debug: {
      x: 10,
      y: 580,
      fontSize: 12,
      align: 'left',
      layer: 400,
    },
  },

  // ============================================================
  // PUZZLE MODE LAYOUT
  // ============================================================
  puzzle: {
    // Board/grid position
    board: {
      x: 150,
      y: 100,
      width: 500,
      height: 500,
      layer: 50,
    },

    // Individual tile size
    tile: {
      width: 80,
      height: 80,
      spacing: 2,
    },

    // Frog position overlay
    frogOverlay: {
      scale: 1.0,
      opacity: 1.0,
      offsetY: 20,
      layer: 150,
    },

    // Bomb threat indicator
    bombIndicator: {
      offsetX: 10,
      offsetY: -15,
      scale: 0.8,
      layer: 120,
    },

    // Combo feedback
    comboFeedback: {
      x: 400,
      y: 50,
      fontSize: 36,
      layer: 200,
    },

    // Energy/fullness bar
    statusBars: {
      width: 200,
      height: 20,
      x: 50,
      y: 50,
      layer: 180,
    },
  },

  // ============================================================
  // ARCADE MODE LAYOUT
  // ============================================================
  arcade: {
    // Falling food spawn zone
    spawnZone: {
      x: 150,
      y: 0,
      width: 500,
      height: 600,
      layer: 30,
    },

    // Food/hazard rendering
    objects: {
      scale: 1.5,
      maxOnScreen: 20,
      layer: 60,
    },

    // Catch zone highlight
    catchZone: {
      scale: 1.2,
      opacity: 0.3,
      layer: 40,
    },

    // Score popup positions
    scorePopup: {
      offsetY: -50,
      duration: 1000,
      fontSize: 24,
      layer: 220,
    },
  },

  // ============================================================
  // UI BUTTON POSITIONS
  // ============================================================
  buttons: {
    // Main menu buttons
    play: {
      x: 200,
      y: 400,
      width: 150,
      height: 60,
      fontSize: 20,
      layer: 150,
    },

    settings: {
      x: 450,
      y: 400,
      width: 150,
      height: 60,
      fontSize: 20,
      layer: 150,
    },

    shop: {
      x: 200,
      y: 480,
      width: 150,
      height: 60,
      fontSize: 20,
      layer: 150,
    },

    achievements: {
      x: 450,
      y: 480,
      width: 150,
      height: 60,
      fontSize: 20,
      layer: 150,
    },

    // Game controls
    pauseButton: {
      x: 750,
      y: 20,
      width: 40,
      height: 40,
      layer: 250,
    },

    soundToggle: {
      x: 700,
      y: 20,
      width: 40,
      height: 40,
      layer: 250,
    },

    // Pause menu options
    resume: {
      x: 400,
      y: 250,
      width: 200,
      height: 50,
      layer: 200,
    },

    restart: {
      x: 400,
      y: 320,
      width: 200,
      height: 50,
      layer: 200,
    },

    quit: {
      x: 400,
      y: 390,
      width: 200,
      height: 50,
      layer: 200,
    },
  },

  // ============================================================
  // MENU SCREEN LAYOUT
  // ============================================================
  menus: {
    // Title/logo
    title: {
      x: 400,
      y: 80,
      fontSize: 64,
      align: 'center',
      layer: 100,
    },

    // Menu items spacing
    itemSpacing: 80,
    itemStartY: 250,

    // Mode selection grid
    modeGrid: {
      columns: 2,
      rows: 2,
      spacing: 40,
      itemWidth: 300,
      itemHeight: 200,
      startX: 100,
      startY: 150,
      layer: 100,
    },

    // Character select grid
    characterGrid: {
      columns: 4,
      rows: 3,
      spacing: 20,
      itemWidth: 140,
      itemHeight: 160,
      startX: 40,
      startY: 100,
      layer: 100,
    },
  },

  // ============================================================
  // ANIMATION AND EFFECT POSITIONING
  // ============================================================
  effects: {
    // Particle system origin
    particleOrigin: {
      x: 400,
      y: 300,
    },

    // Explosion effects
    explosion: {
      scale: 2.0,
      duration: 600,
      layer: 180,
    },

    // Screen shake intensity
    screenShake: {
      intensity: 5,
      duration: 200,
    },

    // Flash effect intensity
    flash: {
      intensity: 0.8,
      duration: 150,
    },
  },

  // ============================================================
  // RESPONSIVE ADJUSTMENTS
  // ============================================================
  responsive: {
    breakpoints: {
      mobile: 480,      // < 480px
      tablet: 768,      // < 768px
      desktop: 1024,    // >= 1024px
    },

    // Scale adjustments per breakpoint
    scales: {
      mobile: 0.75,
      tablet: 0.9,
      desktop: 1.0,
    },
  },

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Get responsive scale based on viewport width
   * @param {number} viewportWidth - Current viewport width
   * @returns {number} Scale factor
   */
  getResponsiveScale(viewportWidth) {
    if (viewportWidth < this.responsive.breakpoints.mobile) {
      return this.responsive.scales.mobile;
    } else if (viewportWidth < this.responsive.breakpoints.tablet) {
      return this.responsive.scales.tablet;
    }
    return this.responsive.scales.desktop;
  },

  /**
   * Calculate position on grid
   * @param {number} row - Grid row
   * @param {number} col - Grid column
   * @param {object} gridConfig - Grid configuration
   * @returns {object} { x, y } position
   */
  getGridPosition(row, col, gridConfig) {
    return {
      x: gridConfig.startX + col * (gridConfig.itemWidth + gridConfig.spacing),
      y: gridConfig.startY + row * (gridConfig.itemHeight + gridConfig.spacing),
    };
  },

  /**
   * Offset position for animation
   * @param {object} basePos - Base { x, y } position
   * @param {number} t - Animation time (0-1)
   * @param {string} easeType - 'ease-in', 'ease-out', 'ease-in-out', 'linear'
   * @returns {object} Offset { x, y }
   */
  getAnimationOffset(basePos, t, easeType = 'ease-out') {
    const eases = {
      'ease-in': t => t * t,
      'ease-out': t => 1 - (1 - t) * (1 - t),
      'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      'linear': t => t,
    };

    const easedT = eases[easeType] ? eases[easeType](t) : t;
    return {
      x: basePos.x * easedT,
      y: basePos.y * easedT,
    };
  },

  /**
   * Apply screen shake to a position
   * @param {object} pos - Base { x, y } position
   * @param {number} intensity - Shake intensity
   * @returns {object} Shaken { x, y } position
   */
  applyScreenShake(pos, intensity = 5) {
    return {
      x: pos.x + (Math.random() - 0.5) * intensity * 2,
      y: pos.y + (Math.random() - 0.5) * intensity * 2,
    };
  },

  /**
   * Create a popup text position
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} duration - Total duration in ms
   * @param {number} elapsedTime - Elapsed time in ms
   * @returns {object} { x, y, opacity, scale }
   */
  getPopupState(x, y, duration, elapsedTime) {
    const progress = Math.min(1, elapsedTime / duration);
    const opacity = progress < 0.7 ? 1 : (1 - progress) / 0.3;

    return {
      x: x,
      y: y - 30 * progress,
      opacity: Math.max(0, opacity),
      scale: 1 + progress * 0.2,
    };
  },
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssetLayoutConfig;
}
