const LCG_MULTIPLIER = 1664525n;
const LCG_INCREMENT = 1013904223n;
const UINT32_MODULUS = 0x100000000n;

function normalizeSeed(value, fallback = 0x12345678) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? (numeric >>> 0) : (fallback >>> 0);
}

function createSeededRng(seed = 0x12345678) {
  let state = normalizeSeed(seed);

  function rng() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  }

  rng.getState = () => state >>> 0;
  rng.setState = nextState => {
    state = normalizeSeed(nextState, state);
    return rng;
  };
  rng.advance = count => {
    let delta = BigInt(Math.max(0, Math.floor(Number(count) || 0)));
    let accMultiplier = 1n;
    let accIncrement = 0n;
    let currentMultiplier = LCG_MULTIPLIER;
    let currentIncrement = LCG_INCREMENT;

    while (delta > 0n) {
      if (delta & 1n) {
        accMultiplier = (accMultiplier * currentMultiplier) % UINT32_MODULUS;
        accIncrement = (accIncrement * currentMultiplier + currentIncrement) % UINT32_MODULUS;
      }
      currentIncrement = ((currentMultiplier + 1n) * currentIncrement) % UINT32_MODULUS;
      currentMultiplier = (currentMultiplier * currentMultiplier) % UINT32_MODULUS;
      delta >>= 1n;
    }

    state = Number((accMultiplier * BigInt(state) + accIncrement) % UINT32_MODULUS);
    return rng;
  };

  return rng;
}

;
// GENERATED — edit content/levels/*.json and content/challenges/*.json, not this file.
const LEVELS = Object.freeze([
  {
    "id": "claw001",
    "name": "First Bite",
    "chapter": 1,
    "targetMeals": 5,
    "time": 55,
    "hearts": 3,
    "sweepSpeed": 0.72,
    "tolerance": 42,
    "favorite": "strawberry",
    "description": "Feed Gulper 5 foods.",
    "tip": "The claw moves on its own. Tap when it lines up.",
    "theme": "berry",
    "difficulty": 1
  },
  {
    "id": "claw002",
    "name": "Sweet Spot",
    "chapter": 1,
    "targetMeals": 6,
    "time": 58,
    "hearts": 3,
    "sweepSpeed": 0.78,
    "tolerance": 40,
    "favorite": "cupcake",
    "description": "Land 2 PERFECT grabs while feeding 6 foods.",
    "tip": "Aim through the middle of the food.",
    "theme": "berry",
    "difficulty": 1,
    "perfectTarget": 2
  },
  {
    "id": "claw003",
    "name": "Berry Best",
    "chapter": 1,
    "targetMeals": 7,
    "time": 62,
    "hearts": 3,
    "sweepSpeed": 0.84,
    "tolerance": 39,
    "favorite": "strawberry",
    "description": "Feed Gulper his favorite strawberry twice.",
    "tip": "Favorites are worth more and glow in the cabinet.",
    "theme": "berry",
    "difficulty": 1,
    "favoriteTarget": 2
  },
  {
    "id": "claw004",
    "name": "Keep It Going",
    "chapter": 1,
    "targetMeals": 8,
    "time": 65,
    "hearts": 3,
    "sweepSpeed": 0.9,
    "tolerance": 37,
    "favorite": "orange",
    "description": "Build a 4x streak.",
    "tip": "A miss breaks your streak.",
    "theme": "berry",
    "difficulty": 2,
    "comboTarget": 4
  },
  {
    "id": "claw005",
    "name": "Growing Appetite",
    "chapter": 1,
    "targetMeals": 10,
    "time": 72,
    "hearts": 3,
    "sweepSpeed": 0.98,
    "tolerance": 35,
    "favorite": "pizza",
    "description": "Feed enough to see Gulper grow several times.",
    "tip": "Watch the growth meter under Gulper.",
    "theme": "berry",
    "difficulty": 2,
    "perfectTarget": 3,
    "comboTarget": 4
  },
  {
    "id": "claw006",
    "name": "First Feast",
    "chapter": 1,
    "targetMeals": 12,
    "time": 80,
    "hearts": 3,
    "sweepSpeed": 1.06,
    "tolerance": 33,
    "favorite": "gummy_bears",
    "description": "Chapter finale: favorites, PERFECTS, and a streak.",
    "tip": "Put everything you learned together.",
    "theme": "berry",
    "difficulty": 2,
    "perfectTarget": 4,
    "comboTarget": 5,
    "favoriteTarget": 2
  },
  {
    "id": "claw007",
    "name": "Bombs Away",
    "chapter": 2,
    "targetMeals": 9,
    "time": 72,
    "hearts": 3,
    "sweepSpeed": 1.02,
    "tolerance": 34,
    "favorite": "burger",
    "description": "Bombs enter the cabinet. Feed safely.",
    "tip": "Bombs cost a heart. Do not grab them.",
    "theme": "bakery",
    "difficulty": 2,
    "specialRates": {
      "bomb": 0.06,
      "heart": 0.03,
      "candy": 0
    }
  },
  {
    "id": "claw008",
    "name": "Second Chance",
    "chapter": 2,
    "targetMeals": 10,
    "time": 76,
    "hearts": 3,
    "sweepSpeed": 1.08,
    "tolerance": 33,
    "favorite": "fries",
    "description": "Hearts can repair mistakes.",
    "tip": "A heart pickup restores one heart.",
    "theme": "bakery",
    "difficulty": 2,
    "perfectTarget": 2,
    "comboTarget": 4,
    "specialRates": {
      "bomb": 0.065,
      "heart": 0.055,
      "candy": 0
    }
  },
  {
    "id": "claw009",
    "name": "Danger Dessert",
    "chapter": 2,
    "targetMeals": 11,
    "time": 80,
    "hearts": 3,
    "sweepSpeed": 1.14,
    "tolerance": 32,
    "favorite": "cookie",
    "description": "Score through a cabinet with more hazards.",
    "tip": "Wait for a clean lane instead of panic-dropping.",
    "theme": "bakery",
    "difficulty": 3,
    "perfectTarget": 3,
    "comboTarget": 5,
    "specialRates": {
      "bomb": 0.08,
      "heart": 0.04,
      "candy": 0
    }
  },
  {
    "id": "claw010",
    "name": "Favorite Under Fire",
    "chapter": 2,
    "targetMeals": 12,
    "time": 84,
    "hearts": 3,
    "sweepSpeed": 1.18,
    "tolerance": 31,
    "favorite": "pizza",
    "description": "Feed 3 favorite pizzas while avoiding bombs.",
    "tip": "Track the favorite glow, not just the nearest target.",
    "theme": "bakery",
    "difficulty": 3,
    "perfectTarget": 3,
    "comboTarget": 5,
    "favoriteTarget": 3,
    "specialRates": {
      "bomb": 0.085,
      "heart": 0.045,
      "candy": 0
    }
  },
  {
    "id": "claw011",
    "name": "No Miss Buffet",
    "chapter": 2,
    "targetMeals": 13,
    "time": 88,
    "hearts": 3,
    "sweepSpeed": 1.22,
    "tolerance": 30,
    "favorite": "watermelon",
    "description": "Keep a 7x streak in a hazardous cabinet.",
    "tip": "Streak play rewards patience.",
    "theme": "bakery",
    "difficulty": 3,
    "perfectTarget": 4,
    "comboTarget": 7,
    "specialRates": {
      "bomb": 0.09,
      "heart": 0.04,
      "candy": 0
    }
  },
  {
    "id": "claw012",
    "name": "Hazard Feast",
    "chapter": 2,
    "targetMeals": 15,
    "time": 94,
    "hearts": 3,
    "sweepSpeed": 1.27,
    "tolerance": 29,
    "favorite": "pretzel",
    "description": "Chapter finale with serious bomb pressure.",
    "tip": "Hearts are valuable; do not waste them.",
    "theme": "bakery",
    "difficulty": 3,
    "perfectTarget": 5,
    "comboTarget": 7,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.1,
      "heart": 0.045,
      "candy": 0
    }
  },
  {
    "id": "claw013",
    "name": "Magnetic Meal",
    "chapter": 3,
    "targetMeals": 11,
    "time": 78,
    "hearts": 3,
    "sweepSpeed": 1.13,
    "tolerance": 31,
    "favorite": "blueberry",
    "description": "Jeweled Candies enter the machine.",
    "tip": "Magnet widens your grab window for 3 drops.",
    "theme": "candy",
    "difficulty": 3,
    "perfectTarget": 3,
    "comboTarget": 4,
    "specialRates": {
      "bomb": 0.06,
      "heart": 0.035,
      "candy": 0.08
    }
  },
  {
    "id": "claw014",
    "name": "Clock Candy",
    "chapter": 3,
    "targetMeals": 12,
    "time": 80,
    "hearts": 3,
    "sweepSpeed": 1.19,
    "tolerance": 30,
    "favorite": "mango",
    "description": "Use Time Candy to stretch the clock.",
    "tip": "Time adds 8 seconds when captured.",
    "theme": "candy",
    "difficulty": 3,
    "perfectTarget": 3,
    "comboTarget": 5,
    "specialRates": {
      "bomb": 0.065,
      "heart": 0.035,
      "candy": 0.1
    }
  },
  {
    "id": "claw015",
    "name": "Shield Snack",
    "chapter": 3,
    "targetMeals": 13,
    "time": 84,
    "hearts": 3,
    "sweepSpeed": 1.24,
    "tolerance": 29,
    "favorite": "salmon_steak",
    "description": "Shield can protect a miss or bomb.",
    "tip": "A Shield charge is spent automatically.",
    "theme": "candy",
    "difficulty": 3,
    "perfectTarget": 4,
    "comboTarget": 5,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.08,
      "heart": 0.03,
      "candy": 0.11
    }
  },
  {
    "id": "claw016",
    "name": "Royal Appetite",
    "chapter": 3,
    "targetMeals": 14,
    "time": 86,
    "hearts": 3,
    "sweepSpeed": 1.29,
    "tolerance": 28,
    "favorite": "cupcake",
    "description": "Royal Candy doubles the next 3 meals.",
    "tip": "Royal doubles meal value and score, not just points.",
    "theme": "candy",
    "difficulty": 4,
    "perfectTarget": 4,
    "comboTarget": 6,
    "specialRates": {
      "bomb": 0.08,
      "heart": 0.03,
      "candy": 0.12
    }
  },
  {
    "id": "claw017",
    "name": "Candy Chain",
    "chapter": 3,
    "targetMeals": 15,
    "time": 90,
    "hearts": 3,
    "sweepSpeed": 1.34,
    "tolerance": 27,
    "favorite": "wrapped_candy_mix",
    "description": "Build an 8x streak while powers circulate.",
    "tip": "Grab powers when they support the objective.",
    "theme": "candy",
    "difficulty": 4,
    "perfectTarget": 5,
    "comboTarget": 8,
    "specialRates": {
      "bomb": 0.09,
      "heart": 0.035,
      "candy": 0.13
    }
  },
  {
    "id": "claw018",
    "name": "Jeweled Feast",
    "chapter": 3,
    "targetMeals": 17,
    "time": 98,
    "hearts": 3,
    "sweepSpeed": 1.38,
    "tolerance": 27,
    "favorite": "gummy_bears",
    "description": "Chapter finale: master every candy.",
    "tip": "Use powers deliberately instead of grabbing everything.",
    "theme": "candy",
    "difficulty": 4,
    "perfectTarget": 6,
    "comboTarget": 8,
    "favoriteTarget": 3,
    "specialRates": {
      "bomb": 0.095,
      "heart": 0.035,
      "candy": 0.14
    }
  },
  {
    "id": "claw019",
    "name": "Quick Claw",
    "chapter": 4,
    "targetMeals": 13,
    "time": 74,
    "hearts": 3,
    "sweepSpeed": 1.48,
    "tolerance": 27,
    "favorite": "lemon",
    "description": "The rail speeds up. Keep your timing.",
    "tip": "Read the claw rhythm instead of chasing it.",
    "theme": "night",
    "difficulty": 4,
    "perfectTarget": 4,
    "comboTarget": 5,
    "specialRates": {
      "bomb": 0.08,
      "heart": 0.03,
      "candy": 0.09
    }
  },
  {
    "id": "claw020",
    "name": "Tiny Targets",
    "chapter": 4,
    "targetMeals": 14,
    "time": 78,
    "hearts": 3,
    "sweepSpeed": 1.52,
    "tolerance": 26,
    "favorite": "blueberry",
    "description": "Small foods demand precision.",
    "tip": "Wait until the claw is nearly centered.",
    "theme": "night",
    "difficulty": 4,
    "perfectTarget": 5,
    "comboTarget": 6,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.085,
      "heart": 0.03,
      "candy": 0.09
    }
  },
  {
    "id": "claw021",
    "name": "Rush Hour",
    "chapter": 4,
    "targetMeals": 15,
    "time": 80,
    "hearts": 3,
    "sweepSpeed": 1.58,
    "tolerance": 25,
    "favorite": "shrimp_skewer",
    "description": "Feed fast without throwing away hearts.",
    "tip": "Good rhythm beats frantic tapping.",
    "theme": "night",
    "difficulty": 4,
    "perfectTarget": 5,
    "comboTarget": 7,
    "specialRates": {
      "bomb": 0.095,
      "heart": 0.03,
      "candy": 0.1
    }
  },
  {
    "id": "claw022",
    "name": "Perfect Pressure",
    "chapter": 4,
    "targetMeals": 16,
    "time": 84,
    "hearts": 3,
    "sweepSpeed": 1.62,
    "tolerance": 24,
    "favorite": "candy_corn",
    "description": "Land 7 PERFECT grabs at high speed.",
    "tip": "Use Magnet to create a safer precision window.",
    "theme": "night",
    "difficulty": 4,
    "perfectTarget": 7,
    "comboTarget": 7,
    "specialRates": {
      "bomb": 0.1,
      "heart": 0.03,
      "candy": 0.11
    }
  },
  {
    "id": "claw023",
    "name": "Streak Machine",
    "chapter": 4,
    "targetMeals": 17,
    "time": 88,
    "hearts": 3,
    "sweepSpeed": 1.68,
    "tolerance": 23,
    "favorite": "burger",
    "description": "Hold a 10x streak through pressure.",
    "tip": "A safe GRAB is better than a reckless PERFECT attempt.",
    "theme": "night",
    "difficulty": 5,
    "perfectTarget": 6,
    "comboTarget": 10,
    "specialRates": {
      "bomb": 0.105,
      "heart": 0.03,
      "candy": 0.11
    }
  },
  {
    "id": "claw024",
    "name": "Midnight Feast",
    "chapter": 4,
    "targetMeals": 19,
    "time": 96,
    "hearts": 3,
    "sweepSpeed": 1.72,
    "tolerance": 23,
    "favorite": "watermelon",
    "description": "Chapter finale at near-endgame speed.",
    "tip": "Control the pace. The clock is generous enough.",
    "theme": "night",
    "difficulty": 5,
    "perfectTarget": 7,
    "comboTarget": 10,
    "favoriteTarget": 3,
    "specialRates": {
      "bomb": 0.115,
      "heart": 0.035,
      "candy": 0.12
    }
  },
  {
    "id": "claw025",
    "name": "Golden Tray",
    "chapter": 5,
    "targetMeals": 16,
    "time": 84,
    "hearts": 3,
    "sweepSpeed": 1.64,
    "tolerance": 24,
    "favorite": "mango",
    "description": "The final chapter adds shrink syringes and combines every system.",
    "tip": "Purple syringes erase growth. Shields block them.",
    "theme": "royal",
    "difficulty": 5,
    "perfectTarget": 6,
    "comboTarget": 8,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.1,
      "heart": 0.03,
      "candy": 0.12,
      "syringe": 0.025
    },
    "shrinkMeals": 4
  },
  {
    "id": "claw026",
    "name": "Big Mouth",
    "chapter": 5,
    "targetMeals": 18,
    "time": 92,
    "hearts": 3,
    "sweepSpeed": 1.68,
    "tolerance": 23,
    "favorite": "pizza",
    "description": "Push Gulper deep into his growth stages.",
    "tip": "Long streaks accelerate the score climb.",
    "theme": "royal",
    "difficulty": 5,
    "perfectTarget": 6,
    "comboTarget": 9,
    "specialRates": {
      "bomb": 0.11,
      "heart": 0.03,
      "candy": 0.12,
      "syringe": 0.03
    },
    "shrinkMeals": 4
  },
  {
    "id": "claw027",
    "name": "Royal Favorites",
    "chapter": 5,
    "targetMeals": 19,
    "time": 96,
    "hearts": 3,
    "sweepSpeed": 1.72,
    "tolerance": 23,
    "favorite": "cupcake",
    "description": "Feed 4 favorites while maintaining precision.",
    "tip": "Royal Candy is strongest when a favorite is ready.",
    "theme": "royal",
    "difficulty": 5,
    "perfectTarget": 7,
    "comboTarget": 9,
    "favoriteTarget": 4,
    "specialRates": {
      "bomb": 0.12,
      "heart": 0.03,
      "candy": 0.13,
      "syringe": 0.035
    },
    "shrinkMeals": 4
  },
  {
    "id": "claw028",
    "name": "Three Hearts",
    "chapter": 5,
    "targetMeals": 20,
    "time": 100,
    "hearts": 3,
    "sweepSpeed": 1.76,
    "tolerance": 22,
    "favorite": "salmon_steak",
    "description": "Survive a dangerous late-game cabinet.",
    "tip": "Shield and Heart pickups can preserve the run.",
    "theme": "royal",
    "difficulty": 5,
    "perfectTarget": 7,
    "comboTarget": 10,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.13,
      "heart": 0.04,
      "candy": 0.13,
      "syringe": 0.04
    },
    "shrinkMeals": 4
  },
  {
    "id": "claw029",
    "name": "Bottomless",
    "chapter": 5,
    "targetMeals": 22,
    "time": 106,
    "hearts": 3,
    "sweepSpeed": 1.82,
    "tolerance": 21,
    "favorite": "gummy_bears",
    "description": "Reach a 12x streak and keep feeding.",
    "tip": "This is the campaign mastery test.",
    "theme": "royal",
    "difficulty": 5,
    "perfectTarget": 8,
    "comboTarget": 12,
    "favoriteTarget": 3,
    "specialRates": {
      "bomb": 0.14,
      "heart": 0.035,
      "candy": 0.14,
      "syringe": 0.05
    },
    "shrinkMeals": 5
  },
  {
    "id": "claw030",
    "name": "GRAND GULPER",
    "chapter": 5,
    "targetMeals": 25,
    "time": 116,
    "hearts": 3,
    "sweepSpeed": 1.88,
    "tolerance": 20,
    "favorite": "wrapped_candy_mix",
    "description": "The complete Feed-O-Matic exam: speed, bombs, shrink, favorites, streaks, and precision.",
    "tip": "Play targets, not panic. One bad syringe can undo several meals.",
    "theme": "royal",
    "difficulty": 5,
    "perfectTarget": 9,
    "comboTarget": 12,
    "favoriteTarget": 4,
    "specialRates": {
      "bomb": 0.15,
      "heart": 0.04,
      "candy": 0.15,
      "syringe": 0.06
    },
    "shrinkMeals": 5
  }
]);
const CHALLENGES = Object.freeze([
  {
    "id": "speed",
    "name": "Speed Feast",
    "kicker": "VELOCITY",
    "description": "A fast rail, tighter catches, and no room to drift.",
    "targetMeals": 14,
    "time": 70,
    "hearts": 3,
    "sweepSpeed": 1.78,
    "tolerance": 25,
    "favorite": "mango",
    "perfectTarget": 5,
    "comboTarget": 8,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.08,
      "syringe": 0.06,
      "heart": 0.035,
      "candy": 0.07
    },
    "theme": "challenge-speed",
    "difficulty": 5,
    "shrinkMeals": 4,
    "tip": "Read the rail rhythm. Do not chase every prize."
  },
  {
    "id": "time",
    "name": "45-Second Buffet",
    "kicker": "TIME ATTACK",
    "description": "Feed twelve meals before the cabinet clock hits zero.",
    "targetMeals": 12,
    "time": 45,
    "hearts": 3,
    "sweepSpeed": 1.48,
    "tolerance": 28,
    "favorite": "strawberry",
    "perfectTarget": 3,
    "comboTarget": 6,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.07,
      "syringe": 0.05,
      "heart": 0.035,
      "candy": 0
    },
    "theme": "challenge-time",
    "difficulty": 5,
    "shrinkMeals": 3,
    "tip": "A clean GRAB is better than waiting too long for PERFECT."
  },
  {
    "id": "bomb",
    "name": "Bomb Cabinet",
    "kicker": "HAZARD",
    "description": "Bomb density is doubled. Protect the streak and your hearts.",
    "targetMeals": 16,
    "time": 82,
    "hearts": 3,
    "sweepSpeed": 1.58,
    "tolerance": 27,
    "favorite": "pizza",
    "perfectTarget": 4,
    "comboTarget": 7,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.19,
      "syringe": 0.04,
      "heart": 0.04,
      "candy": 0.08
    },
    "theme": "challenge-bomb",
    "difficulty": 5,
    "shrinkMeals": 4,
    "tip": "Leave bombs alone. Shield can save a bad delivery."
  },
  {
    "id": "shrink",
    "name": "Shrink Panic",
    "kicker": "GROWTH RISK",
    "description": "Syringes erase meals and visibly shrink Gulper back down.",
    "targetMeals": 18,
    "time": 88,
    "hearts": 3,
    "sweepSpeed": 1.55,
    "tolerance": 27,
    "favorite": "burger",
    "perfectTarget": 4,
    "comboTarget": 8,
    "favoriteTarget": 2,
    "specialRates": {
      "bomb": 0.07,
      "syringe": 0.17,
      "heart": 0.04,
      "candy": 0.08
    },
    "theme": "challenge-shrink",
    "difficulty": 5,
    "shrinkMeals": 5,
    "tip": "Syringes do not cost a heart—but they destroy hard-earned growth."
  },
  {
    "id": "precision",
    "name": "Dead Center",
    "kicker": "PRECISION",
    "description": "Tiny grab tolerance. Build an elite PERFECT chain.",
    "targetMeals": 12,
    "time": 66,
    "hearts": 3,
    "sweepSpeed": 1.72,
    "tolerance": 19,
    "favorite": "blueberry",
    "perfectTarget": 8,
    "comboTarget": 10,
    "favoriteTarget": 1,
    "specialRates": {
      "bomb": 0.08,
      "syringe": 0.08,
      "heart": 0.03,
      "candy": 0.05
    },
    "theme": "challenge-precision",
    "difficulty": 5,
    "shrinkMeals": 4,
    "tip": "Commit at the center line, not when the claw is already passing it."
  },
  {
    "id": "gauntlet",
    "name": "Grand Gauntlet",
    "kicker": "MASTER",
    "description": "Fast rail. Two hearts. Bombs, shrink syringes, strict objectives.",
    "targetMeals": 20,
    "time": 78,
    "hearts": 2,
    "sweepSpeed": 1.98,
    "tolerance": 20,
    "favorite": "watermelon",
    "perfectTarget": 7,
    "comboTarget": 11,
    "favoriteTarget": 3,
    "specialRates": {
      "bomb": 0.16,
      "syringe": 0.12,
      "heart": 0.025,
      "candy": 0.06
    },
    "theme": "challenge-gauntlet",
    "difficulty": 5,
    "shrinkMeals": 5,
    "tip": "Everything matters: target choice, timing, shields, and streak discipline."
  }
]);
const REAL_GAMER_MODE = Object.freeze({
  "id": "real-gamer",
  "name": "REAL GAMER MODE",
  "kicker": "ENDGAME · TWO-TAP DELIVERY",
  "description": "Grab food, track Gulper across the wide arena, then time the second-tap release. Dump hazards when he is clear.",
  "tip": "First tap grabs. Second tap releases. Small Gulper is fast; a huge Gulper is slower and easier to hit.",
  "theme": "gamer",
  "targetMeals": 24,
  "time": 125,
  "hearts": 3,
  "sweepSpeed": 1.62,
  "tolerance": 24,
  "difficulty": 6,
  "shrinkMeals": 5,
  "worldWidth": 1080,
  "gulperSpeed": 190,
  "perfectTarget": 7,
  "comboTarget": 10,
  "favorite": "pizza",
  "favoriteTarget": 3,
  "specialRates": {
    "bomb": 0.14,
    "syringe": 0.1,
    "heart": 0.035,
    "candy": 0.08
  }
});
const LONG_DROP_MODE = Object.freeze({
  "id": "long-drop",
  "name": "LONG DROP MODE",
  "kicker": "VERTICAL MASTERY",
  "description": "Release high and lead moving Gulper through a 620-unit fall. The food stays airborne for 1.18 seconds.",
  "tip": "Do not release where Gulper is. Release where Gulper will be when the food reaches his mouth.",
  "theme": "long-drop",
  "targetMeals": 20,
  "time": 118,
  "hearts": 3,
  "sweepSpeed": 1.38,
  "tolerance": 29,
  "difficulty": 5,
  "favorite": "pizza",
  "favoriteTarget": 2,
  "perfectTarget": 5,
  "comboTarget": 8,
  "shrinkMeals": 4,
  "gulperSpeed": 150,
  "dropDistance": 620,
  "fallTime": 1.18,
  "specialRates": {
    "bomb": 0.075,
    "syringe": 0.05,
    "heart": 0.035,
    "candy": 0.1
  }
});

;


const LOGICAL_WIDTH = 720;
const LOGICAL_HEIGHT = 900;
const REAL_GAMER_WORLD_WIDTH = REAL_GAMER_MODE.worldWidth;
const STANDARD_WORLD_WIDTH = LOGICAL_WIDTH;
const REAL_GAMER_DELIVERY_GRACE = 1.25;
const LONG_DROP_DELIVERY_GRACE = 1.25;
const CAMPAIGN_LEVEL_COUNT = LEVELS.length;
const GULPER_STAGE_THRESHOLDS = Object.freeze([0, 2, 4, 7, 10, 14, 19, 25]);
const FOOD_IDS = Object.freeze([
  'strawberry','blueberry','orange','mango','pear','grapes','watermelon','pineapple_wedge',
  'cookie','cupcake','gummy_bears','wrapped_candy_mix','pizza','burger','fries','pretzel',
  'salmon_steak','shrimp_skewer','lemon','candy_corn'
]);
const SPECIAL_IDS = Object.freeze(['heart','bomb','syringe','magnet','time','shield','royal']);
const CAMPAIGN_ASSIST_MAX = 8;

const SMALL = new Set(['blueberry','lemon','candy_corn']);
const LARGE = new Set(['pizza','burger','watermelon']);
const CANDIES = ['magnet','time','shield','royal'];
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

function stageForMeals(meals){
  let stage=0;
  for(let i=1;i<GULPER_STAGE_THRESHOLDS.length;i++) if(meals>=GULPER_STAGE_THRESHOLDS[i]) stage=i;
  return stage;
}
function nextStageAt(meals){
  for(const n of GULPER_STAGE_THRESHOLDS) if(n>meals) return n;
  return GULPER_STAGE_THRESHOLDS.at(-1);
}
function growthProgress(meals){
  const stage=stageForMeals(meals);
  if(stage>=GULPER_STAGE_THRESHOLDS.length-1)return 1;
  const lo=GULPER_STAGE_THRESHOLDS[stage],hi=GULPER_STAGE_THRESHOLDS[stage+1];
  return clamp((meals-lo)/(hi-lo),0,1);
}
function targetScaleForMeals(meals){ return clamp(.82+meals*.016,.82,1.34); }
function dailySeedFromDate(dateKey){
  let h=2166136261>>>0;
  for(const ch of String(dateKey)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;
}
function dynamicLevel(kind,challengeId){
  if(kind==='gamer') return REAL_GAMER_MODE;
  if(kind==='long-drop') return LONG_DROP_MODE;
  if(kind==='daily') return {id:'daily',name:'Daily Feed',chapter:0,targetMeals:16,time:92,hearts:3,sweepSpeed:1.30,tolerance:30,favorite:'strawberry',perfectTarget:4,comboTarget:6,favoriteTarget:2,specialRates:{bomb:.08,syringe:.035,heart:.04,candy:.10},theme:'daily',difficulty:4,shrinkMeals:3,description:'A fresh seeded challenge for today.',tip:'Everyone gets the same cabinet seed today.'};
  if(kind==='challenge') return CHALLENGES.find(x=>x.id===challengeId)||CHALLENGES[0];
  return {id:'endless',name:'Endless Feed',chapter:0,targetMeals:Infinity,time:Infinity,hearts:3,sweepSpeed:.94,tolerance:37,favorite:null,specialRates:{bomb:.055,syringe:.035,heart:.035,candy:.07},theme:'endless',difficulty:2,shrinkMeals:4,description:'Keep feeding until the cabinet wins.',tip:'Speed and danger climb every seven meals.'};
}
function rollItemKind(rng,level){
  const rates=level.specialRates||{};
  const r=rng();
  const bomb=Number(rates.bomb||0), syringe=Number(rates.syringe||0), heart=Number(rates.heart||0), candy=Number(rates.candy||0);
  if(r<bomb) return 'bomb';
  if(r<bomb+syringe) return 'syringe';
  if(r<bomb+syringe+heart) return 'heart';
  if(r<bomb+syringe+heart+candy) return CANDIES[Math.floor(rng()*CANDIES.length)];
  return 'food';
}
function makeFoodItem(rng,index,level,forcedId=null){
  const id=forcedId||FOOD_IDS[Math.floor(rng()*FOOD_IDS.length)];
  const width=SMALL.has(id)?32:LARGE.has(id)?46:38,worldWidth=Number(level.worldWidth||LOGICAL_WIDTH),margin=68;
  return {uid:`food-${index}-${Math.floor(rng()*1e8)}`,kind:'food',id,x:margin+rng()*Math.max(100,worldWidth-margin*2),y:365+rng()*128,width,value:100,bobPhase:rng()*Math.PI*2};
}
function makeItem(rng,index,level){
  const kind=rollItemKind(rng,level);
  if(kind==='food') return makeFoodItem(rng,index,level);
  const worldWidth=Number(level.worldWidth||LOGICAL_WIDTH),margin=68;return {uid:`item-${index}-${Math.floor(rng()*1e8)}`,kind,id:kind,x:margin+rng()*Math.max(100,worldWidth-margin*2),y:365+rng()*128,width:kind==='bomb'?44:kind==='syringe'?42:40,value:kind==='bomb'||kind==='syringe'?0:125,bobPhase:rng()*Math.PI*2};
}
function spreadItems(run){
  const ordered=[...run.items].sort((a,b)=>a.x-b.x);
  for(let i=1;i<ordered.length;i++){
    const minGap=58;
    if(ordered[i].x-ordered[i-1].x<minGap)ordered[i].x=Math.min((run.worldWidth||LOGICAL_WIDTH)-68,ordered[i-1].x+minGap);
  }
  for(let i=ordered.length-2;i>=0;i--) if(ordered[i+1].x-ordered[i].x<52)ordered[i].x=Math.max(68,ordered[i+1].x-52);
}
function ensureCabinet(run){
  const foodCount=run.items.filter(x=>x.kind==='food').length;
  for(let i=foodCount;i<4;i++){
    const idx=run.items.findIndex(x=>x.kind!=='food');if(idx<0)break;run.items[idx]=makeFoodItem(run.rng,run.spawnSerial++,run.level);
  }
  if(run.level.favoriteTarget&&run.favorites<run.level.favoriteTarget&&!run.items.some(x=>x.kind==='food'&&x.id===run.level.favorite)){
    const idx=run.items.findIndex(x=>x.kind==='food'&&x.id!==run.level.favorite);
    if(idx>=0)run.items[idx]=makeFoodItem(run.rng,run.spawnSerial++,run.level,run.level.favorite);
  }
  spreadItems(run);
}
function refill(run){run.items.push(makeItem(run.rng,run.spawnSerial++,run.level));ensureCabinet(run);}

function createRun({levelId='claw001',seed=0xC1A0,endless=false,daily=false,challengeId=null,realGamer=false,longDrop=false,campaignAssist=true}={}){
  const challenge=!!challengeId;
  const level=longDrop?dynamicLevel('long-drop'):realGamer?dynamicLevel('gamer'):endless?dynamicLevel('endless'):daily?dynamicLevel('daily'):challenge?dynamicLevel('challenge',challengeId):(LEVELS.find(l=>l.id===levelId)||LEVELS[0]);
  const rng=createSeededRng(seed>>>0);
  const run={
    level,seed:seed>>>0,rng,endless,daily,challenge,realGamer,longDrop,challengeId:challenge?level.id:null,worldWidth:Number(level.worldWidth||LOGICAL_WIDTH),elapsed:0,timeBonus:0,remaining:level.time,deliveryOvertime:0,
    score:0,meals:0,hearts:level.hearts,combo:0,bestCombo:0,perfects:0,greats:0,grabs:0,misses:0,favorites:0,
    stage:0,targetScale:targetScaleForMeals(0),clawX:Number(level.worldWidth||LOGICAL_WIDTH)/2,sweepPhase:rng()*Math.PI*2,state:'idle',result:'playing',
    gulperX:Number(level.worldWidth||LOGICAL_WIDTH)/2,gulperDir:rng()>.5?1:-1,gulperFrozen:false,deliveryMisses:0,safeDumps:0,longDropLandings:0,
    campaignAssist:!!campaignAssist&&!endless&&!daily&&!challenge&&!realGamer&&!longDrop,assistBonus:0,assistNearMisses:0,
    deliveryAttempts:0,deliveryErrorTotalMs:0,bestDeliveryErrorMs:null,lastDeliveryFeedback:null,
    items:Array.from({length:7},(_,i)=>makeItem(rng,i,level)),spawnSerial:7,heldItem:null,lastGrade:null,lastFeedEvent:null,
    effects:{magnetDrops:0,shield:0,royalMeals:0},specials:{heart:0,bomb:0,syringe:0,magnet:0,time:0,shield:0,royal:0},capturedFoods:{}
  };ensureCabinet(run);return run;
}
function currentGulperSpeed(run){
  if(!(run?.realGamer||run?.longDrop))return 0;
  const stageSlow=Math.max(.58,1-run.stage*.055),rush=run.longDrop?1:(1+Math.min(.30,run.combo*.018));
  return Number(run.level.gulperSpeed||180)*stageSlow*rush;
}
function predictGulperX(run,seconds){
  if(!(run?.realGamer||run?.longDrop))return run?.gulperX??LOGICAL_WIDTH/2;
  let x=Number(run.gulperX),dir=run.gulperDir>=0?1:-1,remaining=Math.max(0,Number(seconds)||0),speed=currentGulperSpeed(run),margin=82+run.stage*4,lo=margin,hi=run.worldWidth-margin;
  for(let guard=0;guard<12&&remaining>1e-7;guard++){const boundary=dir>0?hi:lo,dist=Math.abs(boundary-x),t=dist/Math.max(1e-6,speed);if(t>=remaining){x+=dir*speed*remaining;remaining=0}else{x=boundary;remaining-=t;dir*=-1}}
  return clamp(x,lo,hi);
}
function sweepSpeed(run){
  if(!run.endless) return run.level.sweepSpeed;
  return Math.min(2.28,run.level.sweepSpeed+Math.floor(run.meals/7)*.095);
}
function tolerance(run){
  let t=run.endless?Math.max(17,run.level.tolerance-Math.floor(run.meals/7)*1.45):run.level.tolerance;
  if(run.effects.magnetDrops>0) t+=18;
  if(run.campaignAssist) t+=Math.min(CAMPAIGN_ASSIST_MAX,Math.max(0,run.assistBonus||0));
  return t;
}
function stepRun(run,dt){
  if(run.result!=='playing') return run;
  run.elapsed+=dt;
  if(Number.isFinite(run.level.time)){
    run.remaining=Math.max(0,run.level.time+run.timeBonus-run.elapsed);
    if(run.remaining<=0&&!levelComplete(run)){
      if(run.state==='delivery'){
        run.deliveryOvertime+=dt;
        const grace=run.longDrop?LONG_DROP_DELIVERY_GRACE:REAL_GAMER_DELIVERY_GRACE;
        if(run.deliveryOvertime>=grace) run.result='failed';
      } else if(run.state==='idle') run.result='failed';
    } else run.deliveryOvertime=0;
  }
  if((run.realGamer||run.longDrop)&&!run.gulperFrozen){
    const speed=currentGulperSpeed(run);
    run.gulperX+=run.gulperDir*speed*dt;const margin=82+run.stage*4;
    if(run.gulperX<=margin){run.gulperX=margin;run.gulperDir=1}else if(run.gulperX>=run.worldWidth-margin){run.gulperX=run.worldWidth-margin;run.gulperDir=-1}
  }
  if(run.state==='idle'){
    run.sweepPhase+=dt*sweepSpeed(run);
    const half=run.worldWidth/2,amp=Math.max(292,half-68);run.clawX=half+amp*Math.sin(run.sweepPhase);
  }
  return run;
}
function evaluateGrab(run){
  const tol=tolerance(run); let best=null,dist=Infinity,nearest=Infinity;
  for(const item of run.items){
    const d=Math.abs(item.x-run.clawX), effective=tol+item.width*.20;nearest=Math.min(nearest,d);
    if(d<=effective&&d<dist){best=item;dist=d;}
  }
  if(!best) return {hit:false,grade:'MISS',distance:Infinity,nearestDistance:nearest,item:null,food:null};
  const ratio=dist/Math.max(1,tol); const grade=ratio<=.22?'PERFECT':ratio<=.55?'GREAT':'GRAB';
  return {hit:true,grade,distance:dist,nearestDistance:nearest,item:best,food:best};
}
function commitGrab(run,evaluation){
  if(run.result!=='playing') return run;
  if(run.effects.magnetDrops>0) run.effects.magnetDrops--;
  if(!evaluation.hit){
    run.misses++;run.combo=0;run.lastGrade='MISS';
    if(run.campaignAssist&&Number.isFinite(evaluation.nearestDistance)&&evaluation.nearestDistance<=Math.max(54,tolerance(run)*1.65)){run.assistNearMisses++;run.assistBonus=Math.min(CAMPAIGN_ASSIST_MAX,(run.assistBonus||0)+2);}
    if(run.effects.shield>0){run.effects.shield--;run.lastFeedEvent={kind:'shield-save'};return run;}
    run.hearts=Math.max(0,run.hearts-1);run.lastFeedEvent={kind:'miss'};
    if(run.hearts<=0) run.result='failed';
    return run;
  }
  if(run.campaignAssist&&run.assistBonus>0)run.assistBonus=Math.max(0,run.assistBonus-1);
  const item=evaluation.item;
  run.heldItem=item;run.items=run.items.filter(x=>x.uid!==item.uid);run.lastGrade=evaluation.grade;
  run.grabs++;run.combo++;run.bestCombo=Math.max(run.bestCombo,run.combo);
  if(evaluation.grade==='PERFECT')run.perfects++; if(evaluation.grade==='GREAT')run.greats++;
  return run;
}
function gulperCatchRadius(run){if(run.longDrop)return Math.min(150,70+run.stage*11);return run.realGamer?Math.min(150,62+run.stage*12):150}

function longDropFallTime(run){return run?.longDrop?Number(run.level.fallTime||1.18):0}
function longDropDistance(run){return run?.longDrop?Number(run.level.dropDistance||620):0}

function evaluateDelivery(run,releaseX=run.clawX){
  const radius=gulperCatchRadius(run),distance=Math.abs(Number(releaseX)-run.gulperX),speed=Math.max(1,currentGulperSpeed(run)),timingErrorMs=(run.realGamer||run.longDrop)?distance/speed*1000:0;
  return {hit:distance<=radius,distance,radius,gulperX:run.gulperX,releaseX:Number(releaseX),timingErrorMs};
}
function trackDelivery(run,evaluation){
  if(!(run?.realGamer||run?.longDrop)||!evaluation)return evaluation;
  const ms=Math.max(0,Number(evaluation.timingErrorMs)||0);run.deliveryAttempts++;run.deliveryErrorTotalMs+=ms;run.bestDeliveryErrorMs=run.bestDeliveryErrorMs==null?ms:Math.min(run.bestDeliveryErrorMs,ms);
  run.lastDeliveryFeedback={hit:!!evaluation.hit,distance:evaluation.distance,radius:evaluation.radius,timingErrorMs:ms,releaseX:evaluation.releaseX,gulperX:evaluation.gulperX};return evaluation;
}
function averageDeliveryErrorMs(run){return run?.deliveryAttempts?run.deliveryErrorTotalMs/run.deliveryAttempts:0}
function discardHeldItem(run,{safeHazard=false}={}){
  const item=run.heldItem;if(!item)return run;const hazard=item.kind==='bomb'||item.kind==='syringe';
  if(hazard&&safeHazard){run.specials[item.kind]++;run.safeDumps++;run.score+=90;run.lastFeedEvent={kind:'safe-dump',id:item.kind};}
  else {run.deliveryMisses++;run.misses++;run.combo=0;if(run.effects.shield>0){run.effects.shield--;run.lastFeedEvent={kind:'shield-delivery'};}else{run.hearts=Math.max(0,run.hearts-1);run.lastFeedEvent={kind:'delivery-miss'};if(run.hearts<=0)run.result='failed';}}
  run.heldItem=null;refill(run);return run;
}
function feedHeldFood(run){
  const item=run.heldItem;if(!item)return run;
  run.lastFeedEvent=null;
  if(item.kind==='bomb'){
    run.specials.bomb++;run.combo=0;
    if(run.effects.shield>0){run.effects.shield--;run.lastFeedEvent={kind:'shield-bomb'};}
    else {run.hearts=Math.max(0,run.hearts-1);run.lastFeedEvent={kind:'bomb'};if(run.hearts<=0)run.result='failed';}
  } else if(item.kind==='syringe'){
    run.specials.syringe++;run.combo=0;
    if(run.effects.shield>0){run.effects.shield--;run.lastFeedEvent={kind:'shield-syringe'};}
    else {
      const before=run.meals,loss=Math.min(before,Math.max(1,run.level.shrinkMeals||4));
      run.meals=Math.max(0,before-loss);run.stage=stageForMeals(run.meals);run.targetScale=targetScaleForMeals(run.meals);run.score=Math.max(0,run.score-150);
      run.lastFeedEvent={kind:'syringe',loss};
    }
  } else if(item.kind==='heart'){
    run.specials.heart++;run.hearts=Math.min(Math.max(3,run.level.hearts),run.hearts+1);run.score+=150;run.lastFeedEvent={kind:'heart'};
  } else if(CANDIES.includes(item.kind)){
    run.specials[item.kind]++;run.score+=200;run.lastFeedEvent={kind:item.kind};
    if(item.kind==='magnet')run.effects.magnetDrops+=3;
    if(item.kind==='time'&&Number.isFinite(run.remaining)){run.timeBonus+=8;run.remaining+=8;}
    if(item.kind==='shield')run.effects.shield=Math.min(2,run.effects.shield+1);
    if(item.kind==='royal')run.effects.royalMeals+=3;
  } else {
    const gradeMul=run.lastGrade==='PERFECT'?1.8:run.lastGrade==='GREAT'?1.35:1;
    const comboMul=1+Math.min(1.6,Math.max(0,run.combo-1)*.10);
    const royal=run.effects.royalMeals>0?2:1;if(run.effects.royalMeals>0)run.effects.royalMeals--;
    const favorite=item.id===run.level.favorite,favoriteMul=favorite?1.25:1,scoreGain=Math.round(item.value*gradeMul*comboMul*royal*favoriteMul);
    run.score+=scoreGain;run.meals+=royal;
    if(favorite)run.favorites++;if(run.longDrop)run.longDropLandings++;run.capturedFoods[item.id]=(run.capturedFoods[item.id]||0)+1;
    run.stage=stageForMeals(run.meals);run.targetScale=targetScaleForMeals(run.meals);run.lastFeedEvent={kind:'food',id:item.id,royal:royal>1,favorite,favoriteBonus:favorite,scoreGain,mealGain:royal,grade:run.lastGrade,combo:run.combo};
  }
  run.heldItem=null;refill(run);
  if(!run.endless&&levelComplete(run))run.result='complete';
  return run;
}
function levelComplete(run){
  const l=run.level;
  if(run.meals<l.targetMeals)return false;
  // Campaign is the learnable path: meals clear the level; authored skill goals earn stars.
  // Daily and every mastery mode are strict exams and require every listed objective.
  const strict=!!(run.daily||run.challenge||run.realGamer||run.longDrop);
  if(!strict)return true;
  if(l.perfectTarget&&run.perfects<l.perfectTarget)return false;
  if(l.comboTarget&&run.bestCombo<l.comboTarget)return false;
  if(l.favoriteTarget&&run.favorites<l.favoriteTarget)return false;
  return true;
}
function objectiveProgress(run){
  const l=run.level,isCampaign=!(run.endless||run.daily||run.challenge||run.realGamer||run.longDrop);
  const meal=`${run.meals}/${Number.isFinite(l.targetMeals)?l.targetMeals:'∞'} meals`;
  if(!isCampaign){
    const bits=[meal];
    if(l.perfectTarget)bits.push(`${run.perfects}/${l.perfectTarget} perfect`);
    if(l.comboTarget)bits.push(`best x${run.bestCombo}/${l.comboTarget}`);
    if(l.favoriteTarget)bits.push(`${run.favorites}/${l.favoriteTarget} favorite`);
    return bits;
  }
  const bonus=[];
  if(l.perfectTarget)bonus.push(`${run.perfects}/${l.perfectTarget} perfect`);
  if(l.comboTarget)bonus.push(`x${run.bestCombo}/${l.comboTarget}`);
  if(l.favoriteTarget)bonus.push(`${run.favorites}/${l.favoriteTarget} fav`);
  return [`CLEAR ${meal}`,...(bonus.length?[`STAR BONUS ${bonus.join(' / ')}`]:[])];
}
function starRating(run){
  if(run.result!=='complete')return 0;
  const l=run.level,accuracy=run.grabs/(run.grabs+run.misses||1),checks=[];
  if(l.perfectTarget)checks.push(run.perfects>=l.perfectTarget);
  if(l.comboTarget)checks.push(run.bestCombo>=l.comboTarget);
  if(l.favoriteTarget)checks.push(run.favorites>=l.favoriteTarget);
  if(!checks.length){
    let stars=1;
    if(accuracy>=.78&&run.bestCombo>=Math.min(4,l.targetMeals))stars++;
    if(accuracy>=.92&&run.perfects>=Math.max(2,Math.ceil(l.targetMeals*.25)))stars++;
    return stars;
  }
  const met=checks.filter(Boolean).length;
  let stars=1;
  if(met>=Math.ceil(checks.length/2))stars=2;
  if(met===checks.length&&accuracy>=.85)stars=3;
  return stars;
}
function snapshot(run){
  return {levelId:run.level.id,challengeId:run.challengeId,realGamer:run.realGamer,longDrop:run.longDrop,seed:run.seed,score:run.score,meals:run.meals,hearts:run.hearts,combo:run.combo,bestCombo:run.bestCombo,perfects:run.perfects,greats:run.greats,grabs:run.grabs,misses:run.misses,deliveryMisses:run.deliveryMisses,safeDumps:run.safeDumps,longDropLandings:run.longDropLandings,favorites:run.favorites,stage:run.stage,gulperX:Number(run.gulperX.toFixed(3)),worldWidth:run.worldWidth,result:run.result,remaining:Number.isFinite(run.remaining)?Number(run.remaining.toFixed(3)):null,deliveryOvertime:Number((run.deliveryOvertime||0).toFixed(3)),assistBonus:run.assistBonus||0,deliveryAttempts:run.deliveryAttempts||0,averageDeliveryErrorMs:Number(averageDeliveryErrorMs(run).toFixed(2)),bestDeliveryErrorMs:run.bestDeliveryErrorMs==null?null:Number(run.bestDeliveryErrorMs.toFixed(2)),effects:{...run.effects},rngState:run.rng.getState()};
}

;
const KEY='toadal:game:claw-feed-gulper:v1:save';
const LEGACY_KEYS=[]; // Browser cartridge: never read or migrate standalone CLAW save keys.
const SAVE_VERSION=7;
const SAVE_CAMPAIGN_LEVEL_COUNT=30;
const SAVE_FOOD_IDS=new Set(['strawberry','blueberry','orange','mango','pear','grapes','watermelon','pineapple_wedge','cookie','cupcake','gummy_bears','wrapped_candy_mix','pizza','burger','fries','pretzel','salmon_steak','shrimp_skewer','lemon','candy_corn']);
const SAVE_SPECIAL_IDS=new Set(['heart','bomb','syringe','magnet','time','shield','royal']);
const SAVE_CHALLENGE_IDS=new Set(['speed','time','bomb','shrink','precision','gauntlet']);
const SAVE_ACHIEVEMENT_IDS=new Set(['firstBite','bottomless','feedingFrenzy','centerClaw','deadCenter','hotStreak','unbroken','grandGulper','starFeeder','starMaster','foodCollector','specialist','campaignComplete','challengeAccepted','challengeMaster','realGamer','movingTargetMaster','longDrop','dropMaster']);

const DEFAULT_SAVE=()=>({
  version:SAVE_VERSION,unlockedLevel:1,totalStars:0,levels:{},
  endless:{highScore:0,bestCombo:0,maxMeals:0},
  daily:{date:null,bestScore:0,stars:0,completed:false},
  challenge:{records:{}},
  realGamer:{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0,safeDumps:0,bestTimingErrorMs:null},
  longDrop:{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0,bestLandings:0,bestTimingErrorMs:null},
  stats:{runs:0,wins:0,challengeWins:0,gamerWins:0,longDropWins:0,totalScore:0,meals:0,grabs:0,perfects:0,greats:0,misses:0,deliveryMisses:0,safeDumps:0,bestCombo:0,maxStage:0,bombs:0,syringes:0,candies:0,bestAccuracy:0},
  collection:{foods:{},specials:{}},achievements:{},
  settings:{music:true,sfx:true,musicVolume:.55,sfxVolume:.72,reducedMotion:false,haptics:true,highContrast:false,colorAssist:false,campaignAssist:true},
  tutorialSeen:false,gamerTutorialSeen:false,longDropTutorialSeen:false,lastPlayedLevel:'claw001',createdAt:Date.now(),updatedAt:Date.now()
});
function number(v,fallback=0){v=Number(v);return Number.isFinite(v)?v:fallback}
function saveClamp(v,lo,hi,fallback=lo){return Math.max(lo,Math.min(hi,number(v,fallback)))}
function whole(v,lo=0,hi=Number.MAX_SAFE_INTEGER,fallback=0){return Math.floor(saveClamp(v,lo,hi,fallback))}
function bool(v,fallback=false){return typeof v==='boolean'?v:fallback}
function optionalMetric(v,lo=0,hi=60_000){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):null}
function readStorage(key){try{return localStorage.getItem(key)}catch{return null}}
function removeStorage(key){try{localStorage.removeItem(key)}catch{}}
function countMap(input,allowed){const out={};if(!input||typeof input!=='object')return out;for(const [k,v] of Object.entries(input)){if(typeof k!=='string'||!allowed.has(k))continue;const n=whole(v,0,1_000_000,0);if(n)out[k]=n}return out}
function normalizeLevelRecords(input){
  const out={};if(!input||typeof input!=='object')return out;
  for(const [id,r] of Object.entries(input)){
    const m=/^claw(\d{3})$/.exec(id);if(!m)continue;const n=Number(m[1]);if(n<1||n>SAVE_CAMPAIGN_LEVEL_COUNT||!r||typeof r!=='object')continue;
    out[id]={stars:whole(r.stars,0,3,0),bestScore:whole(r.bestScore,0,1_000_000_000,0),bestCombo:whole(r.bestCombo,0,1_000_000,0),bestMeals:whole(r.bestMeals,0,1_000_000,0),bestAccuracy:saveClamp(r.bestAccuracy,0,1,0)};
  }return out;
}
function normalizeChallengeRecords(input){
  const out={};if(!input||typeof input!=='object')return out;
  for(const [id,r] of Object.entries(input)){if(typeof id!=='string'||!SAVE_CHALLENGE_IDS.has(id)||!r||typeof r!=='object')continue;out[id]={wins:whole(r.wins,0,1_000_000,0),bestScore:whole(r.bestScore,0,1_000_000_000,0),bestMeals:whole(r.bestMeals,0,1_000_000,0),bestCombo:whole(r.bestCombo,0,1_000_000,0),bestAccuracy:saveClamp(r.bestAccuracy,0,1,0),bestRemaining:saveClamp(r.bestRemaining,0,86_400,0)}}return out;
}
function normalizeSave(p){
  const d=DEFAULT_SAVE();p=p&&typeof p==='object'&&!Array.isArray(p)?p:{};
  const settingsIn=p.settings&&typeof p.settings==='object'?p.settings:{};
  const settings={...d.settings,music:bool(settingsIn.music,d.settings.music),sfx:bool(settingsIn.sfx,d.settings.sfx),haptics:bool(settingsIn.haptics,d.settings.haptics),reducedMotion:bool(settingsIn.reducedMotion,d.settings.reducedMotion),highContrast:bool(settingsIn.highContrast,d.settings.highContrast),colorAssist:bool(settingsIn.colorAssist,d.settings.colorAssist),campaignAssist:bool(settingsIn.campaignAssist,d.settings.campaignAssist),musicVolume:saveClamp(settingsIn.musicVolume,0,1,d.settings.musicVolume),sfxVolume:saveClamp(settingsIn.sfxVolume,0,1,d.settings.sfxVolume)};
  const st=p.stats&&typeof p.stats==='object'?p.stats:{};const stats={...d.stats};for(const k of ['runs','wins','challengeWins','gamerWins','longDropWins','totalScore','meals','grabs','perfects','greats','misses','deliveryMisses','safeDumps','bestCombo','maxStage','bombs','syringes','candies'])stats[k]=whole(st[k],0,k==='maxStage'?7:1_000_000_000,d.stats[k]);stats.bestAccuracy=saveClamp(st.bestAccuracy,0,1,d.stats.bestAccuracy);
  const en=p.endless&&typeof p.endless==='object'?p.endless:{};const endless={highScore:whole(en.highScore,0,1_000_000_000,0),bestCombo:whole(en.bestCombo,0,1_000_000,0),maxMeals:whole(en.maxMeals,0,1_000_000,0)};
  const di=p.daily&&typeof p.daily==='object'?p.daily:{};const daily={date:typeof di.date==='string'&&di.date.length<=32?di.date:null,bestScore:whole(di.bestScore,0,1_000_000_000,0),stars:whole(di.stars,0,3,0),completed:bool(di.completed,false)};
  const levels=normalizeLevelRecords(p.levels),challenge={records:normalizeChallengeRecords(p.challenge?.records)};
  const rg=p.realGamer&&typeof p.realGamer==='object'?p.realGamer:{};const realGamer={wins:whole(rg.wins,0,1_000_000,0),bestScore:whole(rg.bestScore,0,1_000_000_000,0),bestMeals:whole(rg.bestMeals,0,1_000_000,0),bestCombo:whole(rg.bestCombo,0,1_000_000,0),bestAccuracy:saveClamp(rg.bestAccuracy,0,1,0),bestRemaining:saveClamp(rg.bestRemaining,0,86_400,0),safeDumps:whole(rg.safeDumps,0,1_000_000,0),bestTimingErrorMs:optionalMetric(rg.bestTimingErrorMs)};
  const ld=p.longDrop&&typeof p.longDrop==='object'?p.longDrop:{};const longDrop={wins:whole(ld.wins,0,1_000_000,0),bestScore:whole(ld.bestScore,0,1_000_000_000,0),bestMeals:whole(ld.bestMeals,0,1_000_000,0),bestCombo:whole(ld.bestCombo,0,1_000_000,0),bestAccuracy:saveClamp(ld.bestAccuracy,0,1,0),bestRemaining:saveClamp(ld.bestRemaining,0,86_400,0),bestLandings:whole(ld.bestLandings,0,1_000_000,0),bestTimingErrorMs:optionalMetric(ld.bestTimingErrorMs)};
  const collection={foods:countMap(p.collection?.foods,SAVE_FOOD_IDS),specials:countMap(p.collection?.specials,SAVE_SPECIAL_IDS)};
  const achievements={};if(p.achievements&&typeof p.achievements==='object')for(const [k,v] of Object.entries(p.achievements))if(SAVE_ACHIEVEMENT_IDS.has(k)&&v===true)achievements[k]=true;
  const totalStars=Object.values(levels).reduce((a,x)=>a+x.stars,0);let derivedUnlock=1;for(const [id,r] of Object.entries(levels))if(r.stars>0)derivedUnlock=Math.max(derivedUnlock,Math.min(SAVE_CAMPAIGN_LEVEL_COUNT,Number(id.slice(-3))+1));
  const unlockedLevel=Math.max(derivedUnlock,whole(p.unlockedLevel,1,SAVE_CAMPAIGN_LEVEL_COUNT,1));
  const createdAt=whole(p.createdAt,0,Number.MAX_SAFE_INTEGER,Date.now());
  return {version:SAVE_VERSION,unlockedLevel,totalStars,levels,endless,daily,challenge,realGamer,longDrop,stats,collection,achievements,settings,tutorialSeen:bool(p.tutorialSeen,false),gamerTutorialSeen:bool(p.gamerTutorialSeen,false),longDropTutorialSeen:bool(p.longDropTutorialSeen,false),lastPlayedLevel:(()=>{const v=String(p.lastPlayedLevel||''),m=/^claw(\d{3})$/.exec(v);return m&&Number(m[1])>=1&&Number(m[1])<=SAVE_CAMPAIGN_LEVEL_COUNT?v:'claw001'})(),createdAt,updatedAt:Date.now()};
}
function loadSave(){
  const raw=readStorage(KEY);
  if(raw){try{return normalizeSave(JSON.parse(raw))}catch{removeStorage(KEY)}}
  for(const key of LEGACY_KEYS){
    const legacy=readStorage(key);if(!legacy)continue;
    try{const s=normalizeSave(JSON.parse(legacy));storeSave(s);return s}catch{}
  }
  return DEFAULT_SAVE();
}
function storeSave(save){try{save.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(normalizeSave(save)));return true;}catch{return false;}}
function resetSave(){const s=DEFAULT_SAVE();storeSave(s);return s;}
function exportSave(save){return JSON.stringify(normalizeSave(save),null,2)}
function importSave(text){const parsed=JSON.parse(text);const s=normalizeSave(parsed);storeSave(s);return s}
function trackCollection(save,run){
  for(const [id,count] of Object.entries(run.capturedFoods||{})) save.collection.foods[id]=(save.collection.foods[id]||0)+count;
  for(const [id,count] of Object.entries(run.specials||{})) if(count) save.collection.specials[id]=(save.collection.specials[id]||0)+count;
}
function recordRunStats(save,run){
  const s=save.stats;s.runs++;if(run.result==='complete')s.wins++;s.totalScore+=run.score;s.meals+=run.meals;s.grabs+=run.grabs;s.perfects+=run.perfects;s.greats+=run.greats;s.misses+=run.misses;s.deliveryMisses+=(run.deliveryMisses||0);s.safeDumps+=(run.safeDumps||0);s.bestCombo=Math.max(s.bestCombo,run.bestCombo);s.maxStage=Math.max(s.maxStage,run.stage);s.bombs+=run.specials?.bomb||0;s.syringes+=run.specials?.syringe||0;s.candies+=['magnet','time','shield','royal'].reduce((a,k)=>a+(run.specials?.[k]||0),0);const acc=run.grabs/(run.grabs+run.misses||1);s.bestAccuracy=Math.max(s.bestAccuracy,acc);trackCollection(save,run);unlockAchievements(save);storeSave(save);
}
function recordCampaign(save,run,stars){
  const id=run.level.id,prev=save.levels[id]||{stars:0,bestScore:0,bestCombo:0,bestAccuracy:0};
  const accuracy=run.grabs/(run.grabs+run.misses||1);
  save.levels[id]={stars:Math.max(prev.stars||0,stars),bestScore:Math.max(prev.bestScore||0,run.score),bestCombo:Math.max(prev.bestCombo||0,run.bestCombo),bestMeals:Math.max(prev.bestMeals||0,run.meals),bestAccuracy:Math.max(prev.bestAccuracy||0,accuracy)};
  const n=Number(id.replace('claw',''))||1;save.unlockedLevel=Math.max(save.unlockedLevel,Math.min(SAVE_CAMPAIGN_LEVEL_COUNT,n+1));save.lastPlayedLevel=id;save.totalStars=Object.values(save.levels).reduce((a,x)=>a+(x.stars||0),0);recordRunStats(save,run);
}
function recordEndless(save,run){save.endless.highScore=Math.max(save.endless.highScore,run.score);save.endless.bestCombo=Math.max(save.endless.bestCombo,run.bestCombo);save.endless.maxMeals=Math.max(save.endless.maxMeals,run.meals);recordRunStats(save,run);}
function recordDaily(save,run,dateKey,stars){
  if(save.daily.date!==dateKey)save.daily={date:dateKey,bestScore:0,stars:0,completed:false};
  save.daily.bestScore=Math.max(save.daily.bestScore,run.score);save.daily.stars=Math.max(save.daily.stars,stars);save.daily.completed=save.daily.completed||run.result==='complete';recordRunStats(save,run);
}
function recordChallenge(save,run){
  const id=run.challengeId||run.level.id,prev=save.challenge.records[id]||{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0};
  const accuracy=run.grabs/(run.grabs+run.misses||1),complete=run.result==='complete';
  save.challenge.records[id]={wins:prev.wins+(complete?1:0),bestScore:Math.max(prev.bestScore||0,run.score),bestMeals:Math.max(prev.bestMeals||0,run.meals),bestCombo:Math.max(prev.bestCombo||0,run.bestCombo),bestAccuracy:Math.max(prev.bestAccuracy||0,accuracy),bestRemaining:Math.max(prev.bestRemaining||0,Number.isFinite(run.remaining)?run.remaining:0)};
  if(complete)save.stats.challengeWins=(save.stats.challengeWins||0)+1;
  recordRunStats(save,run);
}
function recordRealGamer(save,run){
  const r=save.realGamer||{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0,safeDumps:0},complete=run.result==='complete',accuracy=run.grabs/(run.grabs+run.misses||1);
  r.wins+=(complete?1:0);r.bestScore=Math.max(r.bestScore||0,run.score);r.bestMeals=Math.max(r.bestMeals||0,run.meals);r.bestCombo=Math.max(r.bestCombo||0,run.bestCombo);r.bestAccuracy=Math.max(r.bestAccuracy||0,accuracy);r.bestRemaining=Math.max(r.bestRemaining||0,Number.isFinite(run.remaining)?run.remaining:0);r.safeDumps=Math.max(r.safeDumps||0,run.safeDumps||0);if(run.bestDeliveryErrorMs!=null)r.bestTimingErrorMs=r.bestTimingErrorMs==null?run.bestDeliveryErrorMs:Math.min(r.bestTimingErrorMs,run.bestDeliveryErrorMs);save.realGamer=r;if(complete)save.stats.gamerWins=(save.stats.gamerWins||0)+1;recordRunStats(save,run);
}
function recordLongDrop(save,run){
  const r=save.longDrop||{wins:0,bestScore:0,bestMeals:0,bestCombo:0,bestAccuracy:0,bestRemaining:0,bestLandings:0},complete=run.result==='complete',accuracy=run.grabs/(run.grabs+run.misses||1);
  r.wins+=(complete?1:0);r.bestScore=Math.max(r.bestScore||0,run.score);r.bestMeals=Math.max(r.bestMeals||0,run.meals);r.bestCombo=Math.max(r.bestCombo||0,run.bestCombo);r.bestAccuracy=Math.max(r.bestAccuracy||0,accuracy);r.bestRemaining=Math.max(r.bestRemaining||0,Number.isFinite(run.remaining)?run.remaining:0);r.bestLandings=Math.max(r.bestLandings||0,run.longDropLandings||0);if(run.bestDeliveryErrorMs!=null)r.bestTimingErrorMs=r.bestTimingErrorMs==null?run.bestDeliveryErrorMs:Math.min(r.bestTimingErrorMs,run.bestDeliveryErrorMs);save.longDrop=r;if(complete)save.stats.longDropWins=(save.stats.longDropWins||0)+1;recordRunStats(save,run);
}
function unlockAchievements(save){
  const a=save.achievements,s=save.stats;
  if(s.meals>=1)a.firstBite=true;if(s.meals>=50)a.bottomless=true;if(s.meals>=250)a.feedingFrenzy=true;
  if(s.perfects>=25)a.centerClaw=true;if(s.perfects>=100)a.deadCenter=true;
  if(s.bestCombo>=10)a.hotStreak=true;if(s.bestCombo>=20)a.unbroken=true;if(s.maxStage>=7)a.grandGulper=true;
  if(save.totalStars>=45)a.starFeeder=true;if(save.totalStars>=75)a.starMaster=true;
  if(Object.keys(save.collection.foods).length>=SAVE_FOOD_IDS.size)a.foodCollector=true;
  if(Object.keys(save.collection.specials).length>=SAVE_SPECIAL_IDS.size)a.specialist=true;
  if(save.levels.claw030?.stars)a.campaignComplete=true;
  const challengeRecords=Object.values(save.challenge?.records||{});if(challengeRecords.some(x=>(x.wins||0)>0))a.challengeAccepted=true;if(challengeRecords.filter(x=>(x.wins||0)>0).length>=6)a.challengeMaster=true;if((save.realGamer?.wins||0)>0)a.realGamer=true;if((save.realGamer?.bestCombo||0)>=15)a.movingTargetMaster=true;if((save.longDrop?.wins||0)>0)a.longDrop=true;if((save.longDrop?.bestLandings||0)>=20)a.dropMaster=true;
}

;
const clips={grab:'assets/audio/crumb.wav',eat:'assets/audio/savory.wav',perfect:'assets/audio/premium.wav',miss:'assets/audio/rice.wav',special:'assets/audio/sugar.wav',bomb:'assets/audio/rice.wav',level:'assets/audio/juice.wav',ui:'assets/audio/crumb.wav'};
const cache=new Map();
let musicTimer=null,musicCtx=null,musicStep=0,musicVolume=.55,musicEnabled=false,musicPaused=false,intensity=0,musicScene='menu';
const SCENES={
  menu:{melody:[523.25,659.25,783.99,659.25,587.33,698.46,783.99,659.25],roots:[130.81,146.83,174.61,146.83],gain:.82,air:.35},
  campaign:{melody:[523.25,659.25,783.99,880,783.99,698.46,659.25,587.33],roots:[130.81,174.61,146.83,196],gain:1,air:.5},
  challenge:{melody:[587.33,698.46,880,698.46,659.25,783.99,932.33,783.99],roots:[146.83,174.61,196,164.81],gain:1.06,air:.66},
  gamer:{melody:[659.25,783.99,987.77,880,698.46,880,1046.5,987.77],roots:[164.81,196,146.83,220],gain:1.08,air:.75},
  longdrop:{melody:[493.88,587.33,698.46,783.99,698.46,587.33,523.25,659.25],roots:[123.47,146.83,174.61,130.81],gain:.98,air:.52},
  flight:{melody:[783.99,0,698.46,0,659.25,0,587.33,0],roots:[123.47,0,130.81,0],gain:.62,air:.22},
  danger:{melody:[698.46,880,783.99,987.77,880,1046.5,987.77,1174.66],roots:[174.61,196,220,196],gain:1.12,air:.9},
  result:{melody:[523.25,659.25,783.99,1046.5,783.99,659.25,698.46,880],roots:[130.81,174.61,196,261.63],gain:.9,air:.46}
};
function audio(name){let a=cache.get(name);if(!a){a=new Audio(clips[name]||clips.grab);a.preload='auto';cache.set(name,a);}return a;}
function playSfx(name,enabled=true,volume=.72,pitch=1){
  if(!enabled)return;
  try{const base=audio(name),a=base.cloneNode(true);const mul=name==='eat'?.60:name==='bomb'?.78:name==='perfect'?.86:.66;a.volume=Math.max(0,Math.min(1,volume*mul));a.playbackRate=Math.max(.72,Math.min(1.28,Number(pitch)||1));a.play().catch(()=>{});}catch{}
}
function note(freq,duration=.24,gain=.022,type='triangle',offset=0){
  if(!musicCtx||!freq)return;const t=musicCtx.currentTime+offset,o=musicCtx.createOscillator(),g=musicCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*musicVolume),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(musicCtx.destination);o.start(t);o.stop(t+duration+.02);
}
function musicTick(){
  if(!musicCtx||!musicEnabled||musicPaused)return;
  const scene=SCENES[musicScene]||SCENES.campaign,m=scene.melody[musicStep%scene.melody.length],root=scene.roots[Math.floor(musicStep/4)%scene.roots.length];
  const pulse=.020*scene.gain*(.88+intensity*.22);note(m,.18,pulse,'sine');
  if(musicStep%2===0&&m)note(m/2,.12,.009*scene.gain,'triangle',.04);
  if(musicStep%4===0)note(root,.34,.012*scene.gain,'sine',.01);
  if(scene.air>.5&&musicStep%2===1&&m)note(m*1.5,.07,.0045*scene.air*(.5+intensity*.8),'sine',.08);
  if(intensity>.72&&musicStep%4===3&&m)note(m*2,.05,.0035,'square',.12);
  musicStep++;
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}if(musicCtx){try{musicCtx.close()}catch{}musicCtx=null;}musicPaused=false;}
function startMusic(enabled=true,volume=.55){musicEnabled=!!enabled;musicVolume=Math.max(0,Math.min(1,Number(volume)||0));if(!musicEnabled||musicTimer)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;musicCtx=new AC();musicStep=0;musicTick();musicTimer=setInterval(musicTick,260);}catch{}}
function setMusic(enabled,volume=musicVolume){musicEnabled=!!enabled;musicVolume=Math.max(0,Math.min(1,Number(volume)||0));stopMusic();if(musicEnabled)startMusic(true,musicVolume);}
function setMusicVolume(volume){musicVolume=Math.max(0,Math.min(1,Number(volume)||0));}
function setMusicIntensity(v){intensity=Math.max(0,Math.min(1,Number(v)||0));}
function setMusicScene(scene){if(SCENES[scene])musicScene=scene;}
function getMusicScene(){return musicScene;}
function setMusicPaused(paused){musicPaused=!!paused;if(!musicCtx)return;try{const op=musicPaused?musicCtx.suspend():musicCtx.resume();op?.catch?.(()=>{});}catch{}}

;
const foodPath=id=>`assets/foods/${id}.png`;
const gulperStagePath=stage=>`assets/gulper/stages/gulper_stage_${stage}.png`;
const gulperEatPath=stage=>`assets/gulper/feeding/gulper_stage_${stage}_eat_8f_450.png`;
const gulperBlinkPath=stage=>`assets/gulper/stages/gulper_stage_${stage}_blink.png`;
const specialPath=id=>`assets/specials/${id}.png`;
const uiPath=id=>`assets/ui/${id}`;
const pendingLoads=new Map();
function loadAsset(map,src){
  if(map.has(src))return Promise.resolve(map.get(src));
  let pending=pendingLoads.get(src);
  if(!pending){
    pending=new Promise(resolve=>{const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;}).finally(()=>pendingLoads.delete(src));
    pendingLoads.set(src,pending);
  }
  return pending.then(img=>{if(img)map.set(src,img);return img});
}

function retainGulperEatingStages(map,stages=[]){
  const keep=new Set(stages.filter(Number.isInteger).filter(x=>x>=0&&x<8).map(gulperEatPath));
  for(const key of [...map.keys()]) if(key.includes('/gulper/feeding/')&&!keep.has(key)) map.delete(key);
}

async function preloadAssets(foodIds,specialIds=[]){
  // Mobile memory lock: preload the cabinet and static Gulper frames, but decode eating sheets lazily per growth stage.
  const paths=[...foodIds.map(foodPath),...specialIds.map(specialPath),...Array.from({length:8},(_,i)=>gulperStagePath(i)),...Array.from({length:8},(_,i)=>gulperBlinkPath(i)),gulperEatPath(0),uiPath('background.webp'),uiPath('star-fill.png'),uiPath('star-empty.png')];
  const map=new Map();await Promise.all(paths.map(src=>loadAsset(map,src)));return map;
}

;
/**
 * CLAW Feed-O-Matic presentation painter.
 *
 * Reuses the actual TOADAL food, Gulper and Candyland assets.
 * Decorative only: no hit boxes, timers, coordinates, scoring or save data.
 * All screen artwork is logical 720x900 Canvas, matching the shipped renderer.
 */
const GOLD='#f6c15e', PALE_GOLD='#fff0b4', PINK='#f84d93', ROSE='#aa326d';
const W=720,H=900;

function rect(ctx,x,y,w,h,r=0){
  ctx.beginPath();
  if(r)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);
}
function linear(ctx,x0,y0,x1,y1,stops){
  const g=ctx.createLinearGradient(x0,y0,x1,y1);
  for(const [p,c] of stops)g.addColorStop(p,c);
  return g;
}
function panel(ctx,x,y,w,h,r,stops,stroke=null,lw=2){
  ctx.fillStyle=linear(ctx,x,y,x,y+h,stops);
  rect(ctx,x,y,w,h,r);ctx.fill();
  if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}
}
function ellipse(ctx,x,y,rx,ry,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function dot(ctx,x,y,r,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
function bulb(ctx,x,y,now,id,quiet=false){
  const t=quiet?0.5:0.5+0.5*Math.sin(now*.0037+id*.77);
  dot(ctx,x,y,8.2,'#8a3b57');
  dot(ctx,x,y,6.2,'#fff3c7');
  dot(ctx,x,y,4.9,t>.4?'#ffe47b':'#ffc77a');
  if(!quiet){ctx.globalAlpha=.12+t*.2;dot(ctx,x,y,10.4,'#ffeb89');ctx.globalAlpha=1;}
}
function bolt(ctx,x,y){
  dot(ctx,x,y,6,'#7f395e');dot(ctx,x,y,4.5,'#fff0b6');
  ctx.strokeStyle='#9c724a';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.stroke();
}
function embossed(ctx,label,x,y,size){
  ctx.save();
  ctx.textAlign='center';
  ctx.textBaseline='alphabetic';
  ctx.font=`1000 ${size}px ui-rounded,"Trebuchet MS",system-ui,sans-serif`;
  ctx.lineJoin='round';
  ctx.lineWidth=size*.15;
  ctx.strokeStyle='#65324f';
  ctx.strokeText(label,x,y+4);
  ctx.fillStyle='#a75c39';
  ctx.fillText(label,x,y+5);
  ctx.fillStyle='#fff1bc';
  ctx.fillText(label,x,y);
  ctx.restore();
}
function enamelFinish(ctx,now,quiet){
  ctx.save();
  // Pearlescent edges belong to the existing cabinet, not a replacement background.
  for(const x of [36,666]){
    ctx.fillStyle=linear(ctx,x-12,0,x+12,0,[[0,'#41193c88'],[.22,'#fff7d1cc'],[.40,'#ffbdd3a6'],[.73,'#f04d96a0'],[1,'#541b48b0']]);
    rect(ctx,x-8,160,19,638,9);ctx.fill();
    ctx.strokeStyle='#ffe9b076';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x+5,178);ctx.lineTo(x+5,782);ctx.stroke();
  }
  ctx.strokeStyle='#fff2cc99';ctx.lineWidth=3;
  rect(ctx,48,151,624,677,29);ctx.stroke();
  // Decorative fasteners help the hand-drawn machinery look constructed.
  for(const x of [57,663])for(const y of [210,342,476,600,731])bolt(ctx,x,y);
  const lower=linear(ctx,0,788,0,866,[[0,'#fff7d3b0'],[.20,'#f6ad6fa8'],[.60,'#bf4b7970'],[1,'#61285080']]);
  ctx.fillStyle=lower;rect(ctx,53,817,614,34,15);ctx.fill();
  ctx.strokeStyle='#ffe3a488';ctx.lineWidth=2;ctx.stroke();
  if(!quiet){
    ctx.globalAlpha=.35+.15*Math.sin(now*.002);
    ellipse(ctx,360,839,250,7,'#ffe9aa55');
  }
  ctx.restore();
}
function chamberGlaze(ctx,now,quiet){
  ctx.save();rect(ctx,72,184,576,415,14);ctx.clip();
  const pearl=ctx.createRadialGradient(360,265,30,360,330,420);
  pearl.addColorStop(0,'#bcdfff26');
  pearl.addColorStop(.50,'#89c8ff09');
  pearl.addColorStop(1,'#ffb5e410');
  ctx.fillStyle=pearl;ctx.fillRect(73,185,574,412);
  for(const x of [123,597]){
    const spotlight=ctx.createLinearGradient(x,189,x,424);
    spotlight.addColorStop(0,'#fff5ca28');spotlight.addColorStop(1,'#fff5ca00');
    ctx.fillStyle=spotlight;
    ctx.beginPath();ctx.moveTo(x-13,191);ctx.lineTo(x+13,191);ctx.lineTo(x+130,423);ctx.lineTo(x-130,423);ctx.closePath();ctx.fill();
  }
  // Very faint prize-floor shine: actual pickup art is painted later on top.
  ctx.fillStyle='#ffe9ba18';
  ctx.beginPath();ctx.ellipse(360,565,250,30,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function candyCityReflection(ctx,bg){
  if(!bg)return;
  ctx.save();rect(ctx,67,176,586,421,15);ctx.clip();
  ctx.globalAlpha=.36;
  ctx.drawImage(bg,64,165,594,446);
  ctx.globalAlpha=1;
  const fade=linear(ctx,0,185,0,600,[[0,'#6f8fc64a'],[.50,'#2439632d'],[1,'#10233d66']]);
  ctx.fillStyle=fade;ctx.fillRect(67,176,586,421);ctx.restore();
}
function stageBase(ctx,now,quiet,mode='standard'){
  // Gulper is on a platform OUTSIDE the glass. Existing character sprites render above this.
  ctx.save();
  if(mode==='gamer'||mode==='long-drop'){
    // Moving-Gulper modes need a full-width exterior runway, not a central pedestal.
    panel(ctx,75,746,570,95,24,[[0,'#be6d92'],[.4,'#943c78'],[1,'#612450']],'#ffd589',5);
    panel(ctx,83,788,554,42,18,[[0,'#fff2c1'],[.22,'#f9bc6c'],[.75,'#c47577'],[1,'#8a3567']],'#ffedac',3);
    panel(ctx,88,813,544,22,9,[[0,'#8a3b65'],[1,'#542349']],'#f5c77b',2);
    for(let i=0;i<13;i++)bulb(ctx,103+i*42.8,825,now,i+70,quiet);
    ctx.font='900 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0bc';
    // Keep the runway uncluttered while the real Gulper traverses it.
    ctx.restore();return;
  }
  const halo=ctx.createRadialGradient(360,755,35,360,760,320);
  halo.addColorStop(0,'#fcb9af44');halo.addColorStop(.55,'#ef58972a');halo.addColorStop(1,'#521b3600');
  ctx.fillStyle=halo;ctx.fillRect(65,645,590,210);
  panel(ctx,80,694,560,147,30,[[0,'#7f315b'],[.56,'#a8486c'],[1,'#3a1438']],'#ffc772bb',5);
  panel(ctx,114,744,492,64,30,[[0,'#fdf4c3'],[.27,'#f9c773'],[.65,'#cf8e4e'],[1,'#864663']],'#fff4cb',5);
  ellipse(ctx,360,765,235,31,'#672c52aa');
  ellipse(ctx,360,761,216,22,'#f5b7c9');
  ellipse(ctx,360,759,192,15,'#fdf1c4');
  for(let i=0;i<13;i++){
    const angle=Math.PI+(i+1)*Math.PI/14;
    const x=360+220*Math.cos(angle),y=783+27*Math.sin(angle);
    bulb(ctx,x,y,now,i+70,quiet);
  }
  panel(ctx,225,805,270,31,16,[[0,'#9e3369'],[.6,'#6f2351'],[1,'#50173c']],'#f6c15e',3);
  ctx.textAlign='center';ctx.font='900 13px system-ui';
  ctx.fillStyle=PALE_GOLD;ctx.fillText('GULPER FEEDING STAGE',360,825);
  ctx.restore();
}
function marquee(ctx,now,mode,quiet){
  ctx.save();
  ctx.shadowColor='#f95594aa';ctx.shadowBlur=20;
  panel(ctx,51,21,618,124,44,[[0,'#ffe0c8'],[.17,'#ff99b8'],[.40,'#f34996'],[.75,'#c73575'],[1,'#82285d']],'#ffe19b',8);
  ctx.shadowBlur=0;
  panel(ctx,66,30,588,105,35,[[0,'#6a244e'],[.25,'#a83671'],[.70,'#752658'],[1,'#542448']],'#fff0bb',3);
  const halo=ctx.createRadialGradient(360,75,15,360,83,302);
  halo.addColorStop(0,'#ffdc9270');halo.addColorStop(1,'#ea559000');
  ctx.fillStyle=halo;rect(ctx,67,30,586,105,35);ctx.fill();
  // Two large, editable lines replace the illegible single-line cabinet lettering.
  embossed(ctx,"GULPER'S",360,81,47);
  embossed(ctx,'FEED-O-MATIC',360,116,31);
  for(let i=0;i<15;i++)bulb(ctx,83+i*39.6,32,now,i,quiet);
  for(const x of [62,658])for(const [i,y] of [61,94,126].entries())bulb(ctx,x,y,now,20+i+(x>360?8:0),quiet);
  ctx.restore();
}
function sideCabinet(ctx){
  ctx.save();
  const metal=linear(ctx,15,0,62,0,[[0,'#723556'],[.2,'#f87aa8'],[.45,'#ffd29b'],[.68,'#c34379'],[1,'#691f5b']]);
  for(const [x,w] of [[16,52],[652,52]]){
    ctx.fillStyle=metal;rect(ctx,x,144,w,703,21);ctx.fill();
    ctx.lineWidth=5;ctx.strokeStyle='#ffc976';ctx.stroke();
    ctx.fillStyle='#ffffff4b';rect(ctx,x+11,154,6,681,3);ctx.fill();
    for(const y of [190,355,520,691,815])bolt(ctx,x+w/2,y);
  }
  ctx.restore();
}
function ceiling(ctx,now,quiet){
  // Rail coordinates match the original clawPose (head starts at y=174).
  panel(ctx,68,148,584,29,12,[[0,'#fff2be'],[.33,'#cb8c50'],[.66,'#f4c86f'],[1,'#704366']],'#fff1cf',3);
  panel(ctx,82,157,556,11,6,[[0,'#65758d'],[.5,'#cad7dc'],[1,'#404561']],'#7f5369',1);
  for(let i=0;i<21;i++){
    const x=92+i*26.7;
    dot(ctx,x,163,3,i%3===0?'#fff0ac':i%2===0?'#ffd0e0':'#ffc057');
  }
  // Corner spotlights make the existing food sprites read as prizes.
  for(const x of [112,608]){
    const beam=ctx.createLinearGradient(x,174,x,370);
    beam.addColorStop(0,'#fffbd42e');beam.addColorStop(1,'#fffbd400');
    ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x,176);ctx.lineTo(x-86,370);ctx.lineTo(x+86,370);ctx.closePath();ctx.fill();
    ellipse(ctx,x,178,26,9,'#fff0b8');
    ellipse(ctx,x,178,16,5,'#ffffff');
  }
}
function splitBar(ctx,now,active,quiet){
  ctx.save();
  const y=608;
  panel(ctx,48,y,624,54,16,[[0,'#fff1be'],[.16,'#cf8348'],[.39,'#ffb0ba'],[.77,'#e34a8e'],[1,'#8d2a65']],'#ffd787',5);
  panel(ctx,63,y+11,594,28,10,[[0,'#a73673'],[1,'#671e51']],'#f5bb76',2);
  // Deliberate opaque separation makes the food glass and Gulper area two different places.
  ctx.textAlign='center';ctx.font='900 15px ui-rounded,"Trebuchet MS",system-ui';ctx.fillStyle=PALE_GOLD;
  ctx.fillText('SEALED FOOD',151,640);
  ctx.fillText('GULPER OUTSIDE',562,640);
  if(!active){
    for(const x of [255,465])dot(ctx,x,634,4,'#fff0ab');
  }
  ctx.restore();
}
function chute(ctx,now,active,quiet){
  ctx.save();
  const glow=active&&!quiet?(.5+.5*Math.sin(now*.012)):.15;
  ctx.shadowColor='#ffe27c';ctx.shadowBlur=active?18:7;
  panel(ctx,287,591,146,139,18,[[0,'#fff9d4'],[.1,'#d8edf2b0'],[.6,'#6c9cce66'],[1,'#fff1b1ab']],'#ffcd70',8);
  ctx.shadowBlur=0;
  panel(ctx,301,606,118,105,12,[[0,'#304c73'],[.5,'#8ce1e526'],[1,'#2c365c']],'#fff2c7ad',2);
  const shaft=ctx.createLinearGradient(0,623,0,714);
  shaft.addColorStop(0,'#ffeda800');shaft.addColorStop(.6,'#ffe7882b');shaft.addColorStop(1,'#ffeaa880');
  ctx.fillStyle=shaft;rect(ctx,318,628,84,77,9);ctx.fill();
  ctx.fillStyle=active?'#fff4d2':'#f1d6b1';
  ctx.textAlign='center';ctx.font='950 16px ui-rounded,"Trebuchet MS",system-ui';ctx.fillText('FOOD CHUTE',360,623);
  ctx.strokeStyle=active?'#fff5b8':'#f5d39a';ctx.lineWidth=6;ctx.lineCap='round';
  ctx.globalAlpha=.65+glow*.3;
  ctx.beginPath();ctx.moveTo(360,658);ctx.lineTo(360,689);ctx.moveTo(349,679);ctx.lineTo(360,692);ctx.lineTo(371,679);ctx.stroke();
  ctx.globalAlpha=1;ctx.restore();
}
function paintMachineBack(ctx,{now=0,background=null,mode='standard',quiet=false}={}){
  ctx.save();
  // Visible original TOADAL Candyland asset: no generated substitute.
  if(background){
    ctx.globalAlpha=.64;ctx.drawImage(background,0,0,W,H);ctx.globalAlpha=1;
  }
  ctx.shadowColor='#ff8dbc60';ctx.shadowBlur=25;
  panel(ctx,8,13,704,875,43,[[0,'#ffb1c0'],[.3,'#ec548d'],[.75,'#b73571'],[1,'#712a59']],'#fff0ad',9);
  ctx.shadowBlur=0;
  panel(ctx,28,138,664,709,34,[[0,'#f77da3'],[.25,'#d64187'],[.75,'#aa2f73'],[1,'#63285c']],'#ffd37a',6);
  // Sealed chamber and external Gulper stage have distinct backing materials.
  const base=linear(ctx,0,178,0,620,[[0,'#527ba6'],[.38,'#345b84'],[.70,'#294768'],[1,'#172d4b']]);
  ctx.fillStyle=base;rect(ctx,64,177,592,439,17);ctx.fill();
  candyCityReflection(ctx,background);
  chamberGlaze(ctx,now,quiet);
  const chamberLight=linear(ctx,0,176,0,580,[[0,'#c5e7ff33'],[.25,'#ffffff03'],[1,'#000a2900']]);
  ctx.fillStyle=chamberLight;rect(ctx,70,179,580,427,14);ctx.fill();
  panel(ctx,74,542,572,62,14,[[0,'#ca94ab44'],[.66,'#744d7599'],[1,'#202740b0']],'#fff6d02b',2);
  for(let i=0;i<14;i++){
    const x=96+i*40;
    ctx.fillStyle='#ffe0ae22';rect(ctx,x,564,22,22,5);ctx.fill();
  }
  stageBase(ctx,now,quiet,mode);
  sideCabinet(ctx);
  enamelFinish(ctx,now,quiet);
  marquee(ctx,now,mode,quiet);
  ceiling(ctx,now,quiet);
  ctx.restore();
}
function paintGlassFront(ctx,{now=0,quiet=false,mode='standard'}={}){
  ctx.save();
  const bottom=mode==='long-drop'?744:607;
  rect(ctx,70,183,580,bottom-183,14);ctx.clip();
  // Multiple low-alpha reflected ribbons make glass believable without hiding food targets.
  const g=linear(ctx,68,186,620,bottom,[[0,'#ffffff27'],[.22,'#ffffff05'],[.58,'#ffffff00'],[1,'#ccefff0f']]);
  ctx.fillStyle=g;ctx.fillRect(70,183,580,bottom-183);
  ctx.fillStyle='#f2ffff11';
  ctx.beginPath();ctx.moveTo(88,192);ctx.lineTo(166,192);ctx.lineTo(94,bottom-12);ctx.lineTo(82,bottom-12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffffff0b';
  ctx.beginPath();ctx.moveTo(540,187);ctx.lineTo(574,187);ctx.lineTo(472,bottom-12);ctx.lineTo(452,bottom-12);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.save();rect(ctx,70,183,580,bottom-183,14);
  ctx.strokeStyle='#fff5d05a';ctx.lineWidth=4;ctx.stroke();
  ctx.strokeStyle='#ff9eca4b';ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
}
function paintDeliveryFront(ctx,{now=0,mode='standard',phase='idle',quiet=false}={}){
  ctx.save();
  const active=['centering','delivery-wait','release','feeding','freefall','eating'].includes(phase);
  if(mode==='gamer'){
    splitBar(ctx,now,active,quiet);
    // The existing horizontal mastery mode releases anywhere along the moving lane.
    // A fixed centre chute would tell the player the wrong thing.
    panel(ctx,82,648,556,81,19,[[0,'#c9edf95c'],[.5,'#36557750'],[1,'#16284f66']],'#ffe2a37e',4);
    ctx.fillStyle='#fff1c5';ctx.font='900 11px system-ui';ctx.textAlign='center';
    // Delivery instruction remains on the real, focusable action control below the playfield.
    for(let x=126;x<621;x+=95){
      dot(ctx,x,696,9,'#ffdb8499');
      ctx.strokeStyle='#f9df8d';ctx.lineWidth=2;ctx.beginPath();
      ctx.moveTo(x,692);ctx.lineTo(x,703);ctx.moveTo(x-4,700);ctx.lineTo(x,705);ctx.lineTo(x+4,700);ctx.stroke();
    }
  }else if(mode!=='long-drop'){
    splitBar(ctx,now,active,quiet);
    chute(ctx,now,active,quiet);
  }else{
    // The advanced mode's actual freefall runs down an open shaft: no fake standard chute.
    panel(ctx,54,750,612,33,16,[[0,'#fff6cb'],[.5,'#e58f9f'],[1,'#ab396f']],'#ffe29a',4);
    ctx.fillStyle=PALE_GOLD;ctx.textAlign='center';ctx.font='850 11px system-ui';
    ctx.fillText('LONG DROP LANDING ZONE',360,773);
  }
  ctx.restore();
}
function paintStageLip(ctx,{now=0,quiet=false,mode='standard'}={}){
  ctx.save();
  if(mode==='gamer'||mode==='long-drop'){
    panel(ctx,77,848,566,28,13,[[0,'#fff0b2'],[.25,'#f6b875'],[1,'#9e4777']],'#ffde91',4);
    for(let i=0;i<12;i++)bulb(ctx,97+i*47.8,865,now,i+110,quiet);
    ctx.restore();return;
  }
  // Foreground lip masks the feet minimally and anchors the existing Gulper sprites.
  panel(ctx,98,853,524,25,13,[[0,'#fff1c7'],[.25,'#ffc578'],[.62,'#b96b69'],[1,'#8c366d']],'#ffda84',3);
  for(let i=0;i<10;i++)bulb(ctx,128+i*51.5,865,now,100+i,quiet);
  ctx.restore();
}

;
const {splitStageGeometry,paintSplitBackdrop,paintSplitGlass,paintSplitStageLip}=(()=>{
/**
 * CLAW integrated split-stage presentation.  Visual-only geometry: underlying
 * claw mechanics, seeded food targets, timers, scores, and v7 saves are untouched.
 * Uses the canonical TOADAL Candyland image and Gulper/food sprite family.
 * Coordinates below are in the portrait scene's 720-unit-wide projected space.
 */
const INK='#35172f',GOLD='#ffe5a3',ROSE='#f264a3';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));

function splitStageGeometry(sceneHeight){
  const height=Math.max(900,sceneHeight),extra=Math.max(0,height-900);
  const chamberBottom=Math.round(580+extra*.24);
  const bayTop=Math.round(chamberBottom+92+extra*.18);
  const floorY=Math.round(height-35);
  return {
    height,extra,chamberBottom,bayTop,floorY,
    prizeOffset:Math.round(extra*.15),
    upperZone:[0,chamberBottom],
    deliveryZone:[chamberBottom,bayTop],
    gulperZone:[bayTop,height],
    lowerHeight:height-bayTop,
    // The entire stage remains readable on 320x568. Growth still visibly changes size.
    gulperFactor:clamp((height-bayTop)/375,.71,1),
    releaseY:chamberBottom-37,
    mouthY:Math.round(floorY-23-(height-bayTop)*.34),
  };
}

function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function panel(ctx,x,y,w,h,r,gradient,border,thickness=2){
  ctx.fillStyle=gradient;rounded(ctx,x,y,w,h,r);ctx.fill();
  if(border){ctx.strokeStyle=border;ctx.lineWidth=thickness;ctx.stroke();}
}
function gradient(ctx,x1,y1,x2,y2,stops){
  const g=ctx.createLinearGradient(x1,y1,x2,y2);
  for(const [pos,col] of stops)g.addColorStop(pos,col);
  return g;
}
function light(ctx,x,y,size,phase,quiet){
  const pulse=quiet?0.75:.78+.22*Math.sin(phase);
  ctx.fillStyle='#643054';ctx.beginPath();ctx.arc(x,y,size+2,0,7);ctx.fill();
  ctx.fillStyle='#ffe49b';ctx.beginPath();ctx.arc(x,y,size,0,7);ctx.fill();
  ctx.globalAlpha=pulse;
  ctx.fillStyle='#fff8cf';ctx.beginPath();ctx.arc(x-1,y-1,size*.45,0,7);ctx.fill();
  ctx.globalAlpha=1;
}
function write(ctx,text,x,y,font,color='#fff5cb'){
  ctx.textAlign='center';ctx.font=font;ctx.fillStyle=color;ctx.fillText(text,x,y);
}
function goldRim(ctx,x,y,w,h,r){
  ctx.save();ctx.shadowColor='#feda92a8';ctx.shadowBlur=12;
  ctx.strokeStyle='#fff2bd';ctx.lineWidth=7;rounded(ctx,x,y,w,h,r);ctx.stroke();
  ctx.shadowBlur=0;ctx.strokeStyle='#d08b52';ctx.lineWidth=3;rounded(ctx,x+4,y+4,w-8,h-8,Math.max(3,r-4));ctx.stroke();ctx.restore();
}
function drawCabinetHeader(ctx,frame,now,quiet){
  panel(ctx,25,16,670,143,40,gradient(ctx,20,20,20,160,[[0,'#ffafc5'],[.32,'#ee4f93'],[1,'#98315e']]),'#ffe5a3',8);
  panel(ctx,53,25,614,119,30,gradient(ctx,60,24,60,145,[[0,'#582049'],[.5,'#892b62'],[1,'#3f203e']]),'#ffd88d',4);
  ctx.save();ctx.shadowColor='#faafd6c0';ctx.shadowBlur=8;
  write(ctx,"GULPER'S",360,83,'1000 53px ui-rounded, "Trebuchet MS", system-ui');
  write(ctx,'FEED-O-MATIC',360,126,'1000 30px ui-rounded, "Trebuchet MS", system-ui');
  ctx.restore();
  for(let i=0;i<13;i++)light(ctx,78+i*47,27,5,now*.006+i,quiet);
  for(let i=0;i<13;i++)light(ctx,78+i*47,147,5,now*.006+i+2,quiet);
}
function drawPrizeChamber(ctx,frame,background,now,quiet){
  const bottom=frame.chamberBottom;
  panel(ctx,40,158,640,bottom-157,28,gradient(ctx,40,158,40,bottom,[[0,'#ffcaa4'],[.1,'#fa88ad'],[.83,'#b33b77'],[1,'#64254e']]),'#ffe5a3',6);
  panel(ctx,61,176,598,bottom-198,22,gradient(ctx,63,175,63,bottom,[[0,'#89b4dc'],[.45,'#456eaf'],[1,'#1d3659']]),'#fff1c5',4);
  // Native Candyland scenery inside the playable chamber, not an empty scenic band.
  ctx.save();rounded(ctx,64,180,592,bottom-205,19);ctx.clip();
  if(background){ctx.globalAlpha=.72;ctx.drawImage(background,63,180,594,bottom-196);ctx.globalAlpha=1;}
  const tint=gradient(ctx,0,180,0,bottom,[[0,'#6cc3f030'],[.5,'#223d641c'],[1,'#142f4655']]);
  ctx.fillStyle=tint;ctx.fillRect(64,180,592,bottom-205);
  // Ceiling spotlights illuminate the existing real food/hazard sprites.
  for(const x of [115,603]){
    ctx.fillStyle=gradient(ctx,x,183,x,bottom-50,[[0,'#fff2c842'],[1,'#fff4cd00']]);
    ctx.beginPath();ctx.moveTo(x,184);ctx.lineTo(x-104,bottom-38);ctx.lineTo(x+104,bottom-38);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  // Rail is deliberately fixed to the existing clawPose y=174.
  panel(ctx,73,160,574,22,11,gradient(ctx,73,160,73,185,[[0,'#fff8d7'],[.5,'#e6ae6c'],[1,'#714062']]),'#ffe2a0',3);
  panel(ctx,83,169,554,8,4,'#8ba5bb','#baecf0',1);
  for(let x=91,i=0;x<639;x+=29,i++)light(ctx,x,174,2.5,now*.007+i,quiet);
  // A real machine prize ledge below food, not a blank floor.
  panel(ctx,78,bottom-52,565,37,12,gradient(ctx,0,bottom-54,0,bottom-8,[[0,'#b0bed784'],[.55,'#52618c'],[1,'#4c275b']]),'#e7ceac80',2);
  for(let x=102;x<627;x+=39){ctx.fillStyle='#fff6b123';rounded(ctx,x,bottom-37,18,14,4);ctx.fill();}
  for(const x of [42,677]){
    panel(ctx,x-7,160,14,bottom-168,7,gradient(ctx,x-7,0,x+7,0,[[0,'#72325b'],[.4,'#ffe4a4'],[1,'#ac3873']]),'#ffecc7',1.5);
  }
}
function drawDeliveryBridge(ctx,frame,mode,now,quiet,phase){
  const top=frame.chamberBottom,bottom=frame.bayTop,h=bottom-top;
  panel(ctx,29,top-4,662,h+15,22,gradient(ctx,29,top,29,bottom,[[0,'#f7a8af'],[.18,'#e34d93'],[.78,'#7a326c'],[1,'#4c2455']]),'#ffe6ac',6);
  panel(ctx,44,top+13,632,h-14,15,gradient(ctx,44,top+11,44,bottom,[[0,'#5b2b68'],[.5,'#4f316a'],[1,'#251c4e']]),'#f1a9a2',2);
  const active=['centering','release','feeding','delivery-wait','freefall','eating'].includes(phase);
  if(mode==='gamer'){
    // The moving-Gulper minimap is the live heading for this real delivery lane.
    // A moving-target runway spans the width; no false central chute.
    const yc=top+75+(h-120)*.5;
    ctx.strokeStyle='#83f3e29b';ctx.lineWidth=4;ctx.setLineDash([8,13]);
    ctx.beginPath();ctx.moveTo(90,yc);ctx.lineTo(630,yc);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<7;i++)light(ctx,100+i*86,yc,5,now*.005+i,quiet);
  }else if(mode==='long-drop'){
    write(ctx,'LONG DROP  •  LEAD THE LANDING',360,top+37,'900 16px ui-rounded,"Trebuchet MS",system-ui');
    for(const x of [239,481]){
      ctx.strokeStyle='#b4ecff66';ctx.lineWidth=3;ctx.setLineDash([8,11]);ctx.beginPath();ctx.moveTo(x,top+40);ctx.lineTo(x,bottom-12);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.strokeStyle='#fff2bc88';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(360,top+40);ctx.lineTo(360,bottom-12);ctx.stroke();
  }else{
    write(ctx,'GRAB',151,top+32,'950 18px ui-rounded,"Trebuchet MS",system-ui');
    write(ctx,'FEED',569,top+32,'950 18px ui-rounded,"Trebuchet MS",system-ui');
    // Side conveyors direct the prize toward the center hatch, instead of
    // leaving either half of the middle section as an empty decorative band.
    for(const side of [-1,1]){
      const sx=360+side*255,ex=360+side*116;
      ctx.save();ctx.lineCap='round';
      ctx.strokeStyle='#512854';ctx.lineWidth=28;
      ctx.beginPath();ctx.moveTo(sx,top+61);ctx.lineTo(ex,bottom-29);ctx.stroke();
      ctx.strokeStyle='#e8ad7a';ctx.lineWidth=18;
      ctx.beginPath();ctx.moveTo(sx,top+61);ctx.lineTo(ex,bottom-29);ctx.stroke();
      ctx.strokeStyle='#fff0b9';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(sx,top+56);ctx.lineTo(ex,bottom-34);ctx.stroke();
      for(let i=0;i<5;i++){
        const k=(i+.5)/5,xx=sx+(ex-sx)*k,yy=top+61+(bottom-29-top-61)*k;
        light(ctx,xx,yy,3.7,now*.006+i+side,quiet);
      }
      ctx.restore();
    }
    // Animated delivery tunnel actually traces where captured food travels.
    const tubeX=272,tubeW=176,tubeY=top+4,tubeH=h-4;
    ctx.save();ctx.shadowColor=active?'#fff3b7a6':'#ffdb8c66';ctx.shadowBlur=active?17:9;
    panel(ctx,tubeX,tubeY,tubeW,tubeH,24,gradient(ctx,tubeX,tubeY,tubeX+tubeW,tubeY,[[0,'#ffde8d'],[.15,'#b1dfea'],[.55,'#4d7daa'],[.85,'#b9ebf1'],[1,'#ffcd89']]),'#fff0c4',7);
    ctx.restore();
    panel(ctx,tubeX+16,tubeY+12,tubeW-32,tubeH-28,15,gradient(ctx,0,tubeY,0,tubeY+tubeH,[[0,'#213453b3'],[1,'#466995a5']]),'#e7faff88',2);
    for(let i=0;i<3;i++){
      const yy=tubeY+33+i*(tubeH-66)/2;
      ctx.fillStyle=active?'#fff3be':'#d8d0aa';ctx.beginPath();ctx.moveTo(360,yy+13);ctx.lineTo(343,yy-7);ctx.lineTo(377,yy-7);ctx.closePath();ctx.fill();
    }
  }
  for(const x of [55,664])for(let y=top+23,i=0;y<bottom-12;y+=35,i++)light(ctx,x,y,4,now*.006+i,quiet);
}
function drawGulperBay(ctx,frame,background,now,quiet,mode,phase,stage=0){
  const top=frame.bayTop,H=frame.height,h=H-top;
  // The bottom of the screen is an active feeding bay, not detached scenic wallpaper.
  panel(ctx,23,top-6,674,h-1,27,gradient(ctx,23,top,23,H,[[0,'#ffe6ab'],[.03,'#c34585'],[.22,'#72275e'],[1,'#452342']]),'#ffe19e',7);
  panel(ctx,48,top+10,624,h-38,21,gradient(ctx,48,top,48,H,[[0,'#7b3985'],[.40,'#513064'],[1,'#39214e']]),'#f3be87',3);
  ctx.save();rounded(ctx,56,top+17,608,h-52,14);ctx.clip();
  if(background){ctx.globalAlpha=.28;ctx.drawImage(background,56,top+9,608,h);ctx.globalAlpha=1;}
  const v=gradient(ctx,0,top,0,H,[[0,'#4f244aab'],[.5,'#5c276bbb'],[1,'#2c183eef']]);
  ctx.fillStyle=v;ctx.fillRect(56,top+12,608,h-45);
  const halo=ctx.createRadialGradient(360,H-112,12,360,H-105,340);
  halo.addColorStop(0,'#ffc0c071');halo.addColorStop(.53,'#e75da132');halo.addColorStop(1,'#e75da100');
  ctx.fillStyle=halo;ctx.fillRect(60,top+16,600,h-36);
  ctx.restore();
  // Floor and golden stage form the bottom of the active character's play space.
  const groundY=frame.floorY-39;
  panel(ctx,76,groundY,568,58,25,gradient(ctx,76,groundY,76,groundY+58,[[0,'#fff8cb'],[.26,'#f4c37e'],[.66,'#b9766c'],[1,'#79315e']]),'#ffe49d',5);
  ctx.fillStyle='#bd6a817c';ctx.beginPath();ctx.ellipse(360,groundY+14,248,22,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff2b7';ctx.beginPath();ctx.ellipse(360,groundY+8,213,11,0,0,Math.PI*2);ctx.fill();
  for(let x=99,i=0;x<633;x+=42,i++)light(ctx,x,groundY+40,5,now*.007+i,quiet);
  const faceY=top+Math.min(35,h*.12);
  // Don't put signage across Gulper's face when later growth fills his bay.
  if(stage>2)return;
  if(mode==='standard'||mode==='challenge'){
    write(ctx,'GULPER IS HUNGRY!',360,faceY,'950 24px ui-rounded,"Trebuchet MS",system-ui','#ffe8b1');
  }else if(mode==='gamer'){
    write(ctx,'TRACK THE MOVING GULPER',360,faceY,'900 17px ui-rounded,"Trebuchet MS",system-ui','#a9ffdf');
  }else if(mode==='long-drop'){
    write(ctx,'CATCH THE LONG DROP',360,faceY,'900 17px ui-rounded,"Trebuchet MS",system-ui','#c8f1ff');
  }
}

function paintSplitBackdrop(ctx,{frame,background,now=0,quiet=false,mode='standard',phase='idle',stage=0}){
  ctx.save();
  // Continuous outer frame ties all THREE purpose-built zones together.
  panel(ctx,8,8,704,frame.height-18,36,gradient(ctx,8,8,8,frame.height,[[0,'#d45185'],[.3,'#f875a0'],[.7,'#a13774'],[1,'#762b62']]),'#ffe4a1',7);
  drawGulperBay(ctx,frame,background,now,quiet,mode,phase,stage);
  drawDeliveryBridge(ctx,frame,mode,now,quiet,phase);
  drawPrizeChamber(ctx,frame,background,now,quiet);
  drawCabinetHeader(ctx,frame,now,quiet);
  ctx.restore();
}
function paintSplitGlass(ctx,{frame,mode='standard'}){
  ctx.save();
  const bottom=frame.chamberBottom;
  rounded(ctx,65,185,590,bottom-202,18);ctx.clip();
  const shine=gradient(ctx,70,185,600,bottom,[[0,'#ffffff34'],[.15,'#ffffff07'],[.70,'#d9f8ff00'],[1,'#c1eefe18']]);
  ctx.fillStyle=shine;ctx.fillRect(64,184,592,bottom-196);
  ctx.fillStyle='#ffffff0c';ctx.beginPath();ctx.moveTo(86,189);ctx.lineTo(152,189);ctx.lineTo(95,bottom-15);ctx.lineTo(80,bottom-15);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.save();ctx.strokeStyle='#fff2c788';ctx.lineWidth=4;rounded(ctx,65,185,590,bottom-202,18);ctx.stroke();ctx.restore();
}
function paintSplitStageLip(ctx,{frame,now=0,quiet=false}){
  // Only a narrow lip over the very bottom of Gulper's feet; no overlaid fake HUD.
  ctx.save();
  panel(ctx,69,frame.height-30,582,22,11,gradient(ctx,0,frame.height-30,0,frame.height-7,[[0,'#fff6bf'],[.3,'#f4bd73'],[1,'#9b4771']]),'#ffe1a6',3);
  for(let i=0;i<12;i++)light(ctx,100+i*47,frame.height-19,4,now*.004+i,quiet);
  ctx.restore();
}

return {splitStageGeometry,paintSplitBackdrop,paintSplitGlass,paintSplitStageLip};
})();
;
/* CLAW website-only host adapter: toadal.game.v1 preview, NOT TCS approval. */
function createWebsiteBridge({onPause,onResume,onMute,onUnmute,onInit}){
  const GAME='claw-feed-gulper';
  const P='toadal.game.v1';
  const isEmbedded=window.parent!==window;
  // The host serves the cartridge from its own HTTPS origin, but iframe sandboxing
  // can assign the document an *opaque* origin (window.location.origin === 'null').
  // Recover the immutable URL's site origin, not the opaque document origin.
  // This is NOT referrer trust: incoming messages must also come from window.parent.
  const origin=(()=>{try{return new URL(window.location.href).origin}catch{return ''}})();
  const validOrigin=isEmbedded&&/^https?:\/\//.test(origin)&&origin!=='null';
  let ready=false, hostPaused=false, hostMuted=false, finished=false, lastScore=null;
  const send=(type,extra={})=>{
    if(!validOrigin)return false;
    window.parent.postMessage({protocol:P,version:1,gameId:GAME,type,...extra},origin);
    return true;
  };
  const incoming=(event)=>{
    if(!validOrigin||event.source!==window.parent||event.origin!==origin)return;
    const d=event.data;
    if(!d||typeof d!=='object'||Array.isArray(d)||d.protocol!==P||d.gameId!==GAME||d.version!==1||typeof d.type!=='string')return;
    if(!['host:init','host:pause','host:resume','host:mute','host:unmute','host:visibility','host:exit-confirmed'].includes(d.type))return;
    if(d.type==='host:init'){
      ready=true;
      try{onInit?.(d)}catch{}
      if(d.muted===true)mute(true);
      send('game:ready');return;
    }
    if(!ready)return;
    if(d.type==='host:pause')pause();
    else if(d.type==='host:resume')resume();
    else if(d.type==='host:visibility'){
      if(d.visible===false)pause(); // Visible is never implicit permission to resume.
    }
    else if(d.type==='host:mute')mute(true);
    else if(d.type==='host:unmute')mute(false);
    // Host controls fullscreen/exit. Game has no internal website-exit/fullscreen action.
  };
  function pause(){if(!hostPaused){const didPause=!!onPause?.();hostPaused=didPause;}}
  function resume(){if(hostPaused){const didResume=!!onResume?.();if(didResume)hostPaused=false;}}
  function mute(isMuted){hostMuted=!!isMuted;
    try{if(hostMuted)onMute?.();else onUnmute?.();}catch{}
  }
  if(isEmbedded)window.addEventListener('message',incoming);
  return {
    get muted(){return hostMuted},
    get ready(){return ready},
    started(){finished=false;lastScore=null;send('game:started')},
    paused(){send('game:paused')},
    resumed(){send('game:resumed')},
    score(n){if(!Number.isSafeInteger(n)||n<0||n===lastScore)return;lastScore=n;send('game:score',{score:n})},
    complete(n){if(finished)return;finished=true;send('game:complete',{score:Math.max(0,Math.trunc(Number(n)||0))})},
    error(code){send('game:error',{code:String(code||'runtime').slice(0,64)})},
    announce(){send('game:ready')}
  };
}

;
const $=id=>document.getElementById(id);
const canvas=$('gameCanvas'),ctx=canvas.getContext('2d',{alpha:false,desynchronized:true})||canvas.getContext('2d');
const screens={menu:$('menu'),levels:$('levelSelect'),challenges:$('challengeSelect'),collection:$('collection'),play:$('gameWrap'),result:$('result')};
const CHAPTERS={
  1:{name:'FIRST FEAST',subtitle:'Learn the machine',theme:'berry'},
  2:{name:'TRICKY TREATS',subtitle:'Bombs and second chances',theme:'bakery'},
  3:{name:'JEWELED CABINET',subtitle:'Master the Ability Candies',theme:'candy'},
  4:{name:'SPEED FEAST',subtitle:'Precision under pressure',theme:'night'},
  5:{name:'GRAND APPETITE',subtitle:'The final buffet',theme:'royal'}
};
const ACHIEVEMENTS={
  firstBite:['First Bite','Feed Gulper once.'],bottomless:['Bottomless','Feed 50 lifetime meals.'],feedingFrenzy:['Feeding Frenzy','Feed 250 lifetime meals.'],
  centerClaw:['Center Claw','Land 25 PERFECT grabs.'],deadCenter:['Dead Center','Land 100 PERFECT grabs.'],hotStreak:['Hot Streak','Reach a 10x streak.'],
  unbroken:['Unbroken','Reach a 20x streak.'],grandGulper:['Grand Gulper','Reach growth stage 8.'],starFeeder:['Star Feeder','Earn 45 campaign stars.'],
  starMaster:['Star Master','Earn 75 campaign stars.'],foodCollector:['Pantry Full','Discover every food.'],specialist:['Cabinet Expert','Capture every special item.'],campaignComplete:['The Grand Feast','Finish level 30.'],
  challengeAccepted:['Challenge Accepted','Clear any Challenge cabinet.'],challengeMaster:['Cabinet Master','Clear all six Challenge cabinets.'],
  realGamer:['REAL GAMER','Clear REAL GAMER MODE.'],movingTargetMaster:['Moving Target Master','Reach a 15x streak in REAL GAMER MODE.'],
  longDrop:['LONG DROP','Clear LONG DROP MODE.'],dropMaster:['Drop Master','Land 20 long-drop meals in one run.']
};

let save=loadSave(),assets=new Map(),run=null,mode='menu',paused=false,resultRecorded=false,lastUnlocked=save.unlockedLevel;
let anim={phase:'idle',t:0,item:null,dropX:LOGICAL_WIDTH/2,grade:null,gulperScale:.82,reaction:'',reactionT:0,shake:0,stageUp:false,stageDown:false,cameraX:0,deliveryHit:false};
let last=performance.now(),renderLast=performance.now(),accumulator=0,viewport={scale:1,offsetX:0,offsetY:0,split:false,sceneH:900},particles=[],floaters=[],toastTimer=null,modalResume=false,countdownRemaining=0,briefingReturn='menu',briefingReturnRun=null,briefingReturnRecorded=false,coachActive=false;
const FIXED=1/60,MAX_STEPS=5;
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const pretty=s=>String(s).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const INTERACTIVE_KEY_SELECTOR='button,input,select,textarea,a,summary,[role=\"button\"]';
const img=src=>assets.get(src);
const safeShowModal=dialog=>{if(dialog&&!dialog.open){dialog.scrollTop=0;try{dialog.showModal();dialog.scrollTop=0}catch{}}};
const safeCloseDialog=dialog=>{if(dialog?.open)dialog.close()};
const keyTargetsControl=target=>target instanceof Element&&!!target.closest(INTERACTIVE_KEY_SELECTOR);
const runAccuracy=()=>run?run.grabs/(run.grabs+run.misses||1):0;
const sfx=(name,pitch=1)=>{
  if(websiteBridge?.muted)return;
  return playSfx(name,save.settings.sfx,save.settings.sfxVolume,pitch);
};
const websiteBridge=createWebsiteBridge({
  onPause:()=>{if(mode==='play'&&!paused){pauseGame();return true}return false},
  onResume:()=>{if(mode==='play'&&paused&&$('pauseDialog').open&&!document.hidden){resumeGame();return true}return false},
  onMute:()=>{setMusic(false,save.settings.musicVolume);setMusicPaused(true)},
  onUnmute:()=>{setMusic(save.settings.music,save.settings.musicVolume);setMusicPaused(paused)},
  onInit:()=>{}
});

function activateAudio(){if(save.settings.music&&!websiteBridge.muted)startMusic(true,save.settings.musicVolume)}
function applyVisualSettings(){document.body.classList.toggle('high-contrast',!!save.settings.highContrast);document.body.classList.toggle('color-assist',!!save.settings.colorAssist);document.body.classList.toggle('reduced-motion',!!save.settings.reducedMotion)}
function haptic(pattern=10){if(save.settings.haptics&&navigator.vibrate)navigator.vibrate(pattern)}
function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1450)}
function resize(){
  const r=canvas.getBoundingClientRect(),cap=r.width<=340?1.35:r.width<=480?1.5:2,dpr=Math.min(window.devicePixelRatio||1,cap);
  canvas.width=Math.max(1,Math.floor(r.width*dpr));canvas.height=Math.max(1,Math.floor(r.height*dpr));
  // Gameplay is one purpose-built scene, not a 720x900 poster letterboxed in a phone.
  // The original logical 720-wide physics grid still determines captures and timing.
  const portrait=innerHeight>480&&innerHeight>innerWidth&&r.height>r.width*1.18;
  const fitted=Math.min(canvas.width/LOGICAL_WIDTH,canvas.height/LOGICAL_HEIGHT);
  const s=portrait?Math.min(canvas.width/LOGICAL_WIDTH,canvas.height/900):fitted;
  const sceneH=canvas.height/s;
  viewport={scale:s,offsetX:(canvas.width-LOGICAL_WIDTH*s)/2,offsetY:portrait?0:(canvas.height-LOGICAL_HEIGHT*s)/2,split:portrait,sceneH};
  const coach=$('coachHint');
  if(coach){
    if(portrait){
      // The coach belongs immediately under the claw rail; it must not obscure
      // the center delivery chute or food path on a small phone.
      const shellTop=$('appShell').getBoundingClientRect().top;
      const projectedTop=r.top-shellTop + 194*s/dpr;
      coach.style.top=`${Math.round(projectedTop)}px`;
    }else coach.style.top='';
  }
}
window.addEventListener('resize',resize,{passive:true});window.visualViewport?.addEventListener('resize',resize,{passive:true});

function setMode(next){
  mode=next;Object.entries(screens).forEach(([k,el])=>el.hidden=k!==next);if(next!=='play'){countdownRemaining=0;$('coachHint').hidden=true;$('countdown').classList.remove('show');$('countdown').textContent='';clearTimeout(toastTimer);$('toast').classList.remove('show');$('toast').textContent='';}
  if(next==='menu'){setMusicScene('menu');renderMenu()}if(next==='levels')renderLevels();if(next==='challenges')renderChallenges();if(next==='collection')renderCollection();if(next==='result')setMusicScene('result');
  $('appShell').classList.toggle('claw-playing',next==='play');
  $('gameWrap').classList.toggle('challenge-active',next==='play'&&!!run?.challenge);$('gameWrap').classList.toggle('gamer-active',next==='play'&&!!run?.realGamer);$('gameWrap').classList.toggle('long-drop-active',next==='play'&&!!run?.longDrop);
  requestAnimationFrame(resize);
}
function currentCampaignChapter(){return Math.min(5,Math.ceil(Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel)/6))}
function renderMenu(){
  const menuStage=Math.min(7,Math.floor((save.stats?.meals||0)/32));$('menuGulper').src=gulperStagePath(menuStage);
  $('menuStars').textContent=save.totalStars;$('menuLevel').textContent=Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel);$('menuChapter').textContent=currentCampaignChapter();
  const next=Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel),finished=!!save.levels[`claw${String(CAMPAIGN_LEVEL_COUNT).padStart(3,'0')}`]?.stars;
  $('continueBtn').textContent=finished?'REPLAY GRAND GULPER':`CONTINUE · LEVEL ${next}`;
  const ch=CHAPTERS[currentCampaignChapter()];$('menuCampaignTitle').textContent=finished?'CAMPAIGN COMPLETE':ch.name;
  const pct=Math.round((save.totalStars/(CAMPAIGN_LEVEL_COUNT*3))*100);$('menuCampaignPct').textContent=`${pct}%`;$('menuCampaignBar').style.width=`${pct}%`;
  const d=save.daily.date===todayKey()?save.daily:null;$('dailyStatus').textContent=d?.completed?`BEST ${d.bestScore}`:'NEW CHALLENGE';$('endlessStatus').textContent=`BEST ${save.endless.highScore}`;
  const cleared=CHALLENGES.filter(c=>(save.challenge?.records?.[c.id]?.wins||0)>0).length;$('challengeStatus').textContent=cleared?`${cleared}/6 CLEARED · MIXED-SKILL TRIALS`:'6 TRIALS · MASTER THE BASE CABINET';
  if($('realGamerStatus'))$('realGamerStatus').textContent=(save.realGamer?.wins||0)?`CLEARED ×${save.realGamer.wins} · BEST ${save.realGamer.bestScore}`:`1080 WIDE · 2-TAP INTERCEPT`;
  if($('longDropStatus'))$('longDropStatus').textContent=(save.longDrop?.wins||0)?`CLEARED ×${save.longDrop.wins} · BEST ${save.longDrop.bestScore}`:`620 DROP · PREDICT IMPACT`;  
  $('collectionMenuStatus').textContent=`${Object.keys(save.collection.foods).length} / ${FOOD_IDS.length} FOODS`;
  applyVisualSettings();
}
function openLevels(){setMode('levels')}
function renderLevels(){
  const holder=$('levelButtons');holder.innerHTML='';
  $('campaignSummary').textContent=`${save.totalStars}/${CAMPAIGN_LEVEL_COUNT*3} stars · ${Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel)}/${CAMPAIGN_LEVEL_COUNT} levels unlocked`;
  $('campaignStarsBig').textContent=save.totalStars;$('campaignLevelsBig').textContent=Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel);$('campaignOverviewBar').style.width=`${Math.round(save.totalStars/(CAMPAIGN_LEVEL_COUNT*3)*100)}%`;
  for(let chapter=1;chapter<=5;chapter++){
    const levels=LEVELS.filter(l=>l.chapter===chapter),earned=levels.reduce((sum,l)=>sum+(save.levels[l.id]?.stars||0),0),max=levels.length*3;
    const head=document.createElement('div');head.className='chapter-head';head.innerHTML=`<div><b>CHAPTER ${chapter} · ${CHAPTERS[chapter].name}</b><small>${CHAPTERS[chapter].subtitle}</small></div><span class="chapter-stars">★ ${earned}/${max}</span>`;holder.appendChild(head);
    for(const l of levels){
      const i=LEVELS.indexOf(l),unlocked=i<save.unlockedLevel,rec=save.levels[l.id]||{},stars=rec.stars||0,b=document.createElement('button');
      b.className='level-card'+(i===save.unlockedLevel-1?' current':'')+(!unlocked?' locked-copy':'');b.disabled=!unlocked;
      const fav=l.favorite?`<img class="favorite-mini" src="${foodPath(l.favorite)}" alt="${pretty(l.favorite)}">`:'';
      const difficulty='◆'.repeat(Math.max(1,Math.min(5,l.difficulty||1)))+'◇'.repeat(Math.max(0,5-(l.difficulty||1)));
      b.innerHTML=`<span class="level-num">${i+1}</span><span><strong>${l.name}</strong><small>${l.description}</small><span class="level-meta">${fav}<small class="difficulty">${difficulty}</small></span></span><span class="stars">${unlocked?'★'.repeat(stars)+'☆'.repeat(3-stars):'LOCKED'}</span>`;
      b.addEventListener('click',()=>{activateAudio();startRun({levelId:l.id},true,'levels')});holder.appendChild(b);
    }
  }
}
function renderChallenges(){
  const holder=$('challengeButtons');holder.innerHTML='';
  const cleared=CHALLENGES.filter(c=>(save.challenge?.records?.[c.id]?.wins||0)>0).length;
  $('challengeSummary').textContent=`${cleared}/6 cleared · master fast rails, timers, bombs, shrink syringes, and precision objectives`;
  const icons={speed:'time',time:'time',bomb:'bomb',shrink:'syringe',precision:'magnet',gauntlet:'bomb'};
  for(const c of CHALLENGES){
    const rec=save.challenge?.records?.[c.id]||{},b=document.createElement('button');b.className='challenge-card';
    const tags=[`${c.time}s`,`SPEED ${c.sweepSpeed.toFixed(2)}x`,c.specialRates?.bomb?'BOMBS':null,c.specialRates?.syringe?'SHRINK':null,c.perfectTarget?`${c.perfectTarget} PERFECT`:null].filter(Boolean);
    b.innerHTML=`<img src="${specialPath(icons[c.id]||'bomb')}" alt=""><div class="challenge-copy"><span class="challenge-kicker">${c.kicker}</span><strong>${c.name}</strong><p>${c.description}</p><div class="challenge-tags">${tags.map(x=>`<span>${x}</span>`).join('')}</div></div><div class="challenge-best"><span>${rec.wins?`CLEARED ×${rec.wins}`:'UNCLEARED'}</span><b>BEST ${rec.bestScore||0}</b></div>`;
    b.addEventListener('click',()=>{activateAudio();startRun({challengeId:c.id},true,'challenges')});holder.appendChild(b);
  }
}

function renderCollection(){
  const discovered=Object.keys(save.collection.foods).length,achieved=Object.keys(ACHIEVEMENTS).filter(k=>save.achievements[k]).length;
  $('collectionSummary').textContent=`${discovered}/${FOOD_IDS.length} foods · ${achieved}/${Object.keys(ACHIEVEMENTS).length} achievements · max growth ${Math.min(8,(save.stats.maxStage||0)+1)}/8`;
  const campaignDone=!!save.levels.claw030?.stars,challengeDone=CHALLENGES.every(c=>(save.challenge?.records?.[c.id]?.wins||0)>0),gamerDone=(save.realGamer?.wins||0)>0,dropDone=(save.longDrop?.wins||0)>0;
  const mastery=[
    ['LEARN','CAMPAIGN',campaignDone,`${save.totalStars}/90 stars`],['MASTERY I','CHALLENGE',challengeDone,`${CHALLENGES.filter(c=>(save.challenge?.records?.[c.id]?.wins||0)>0).length}/6 cleared`],
    ['MASTERY II','HORIZONTAL',gamerDone,gamerDone?`best ${save.realGamer.bestScore}`:'moving target'],['MASTERY III','VERTICAL',dropDone,dropDone?`best ${save.longDrop.bestScore}`:'predict impact']
  ];
  $('masteryPath').innerHTML=mastery.map(([axis,name,done,detail])=>`<div class="mastery-step${done?' complete':''}"><span class="axis">${axis}</span><b>${name}</b><small>${detail}</small><span>${done?'MASTERED':'NEXT SKILL'}</span></div>`).join('');
  $('growthGallery').innerHTML='';for(let stage=0;stage<8;stage++){const on=(save.stats.maxStage||0)>=stage||stage===0,d=document.createElement('div');d.className='growth-card'+(on?'':' locked');d.innerHTML=`<img src="${gulperStagePath(stage)}" alt="Gulper growth stage ${stage+1}"><b>STAGE ${stage+1}</b><small>${stage===7?'MAXIMUM':`${GULPER_STAGE_THRESHOLDS[Math.min(7,stage)]} meals`}</small>`;$('growthGallery').appendChild(d)}
  $('achievementGrid').innerHTML='';for(const [id,[name,desc]] of Object.entries(ACHIEVEMENTS)){const on=!!save.achievements[id],d=document.createElement('div');d.className='achievement'+(on?'':' locked');d.innerHTML=`<b>${on?'★':'☆'} ${name}</b><span>${desc}</span>`;$('achievementGrid').appendChild(d)}
  $('foodCollection').innerHTML='';FOOD_IDS.forEach(id=>{const count=save.collection.foods[id]||0,d=document.createElement('div');d.className='collection-item'+(count?'':' locked');d.innerHTML=`<img src="${foodPath(id)}" alt="${pretty(id)}"><strong>${pretty(id)}</strong><small>${count?`fed ${count}`:'undiscovered'}</small>`;$('foodCollection').appendChild(d)});
  $('specialCollection').innerHTML='';SPECIAL_IDS.forEach(id=>{const count=save.collection.specials[id]||0,d=document.createElement('div');d.className='collection-item'+(count?'':' locked');d.innerHTML=`<img src="${specialPath(id)}" alt="${pretty(id)}"><strong>${pretty(id)}</strong><small>${count?`captured ${count}`:'undiscovered'}</small>`;$('specialCollection').appendChild(d)});
  const s=save.stats,stats=[['Meals',s.meals],['Perfects',s.perfects],['Best streak','x'+s.bestCombo],['Runs',s.runs],['Wins',s.wins],['Challenge wins',s.challengeWins||0],['REAL GAMER wins',s.gamerWins||0],['LONG DROP wins',s.longDropWins||0],['Safe dumps',s.safeDumps||0],['Delivery misses',s.deliveryMisses||0],['Best accuracy',Math.round((s.bestAccuracy||0)*100)+'%'],['Score',s.totalScore],['Bombs',s.bombs],['Shrinks',s.syringes||0]];$('lifetimeStats').innerHTML=stats.map(([a,b])=>`<div class="stat-card"><b>${b}</b><small>${a.toUpperCase()}</small></div>`).join('');
}

function populateBriefing(){
  if(!run)return;const l=run.level,n=LEVELS.findIndex(x=>x.id===l.id)+1;
  $('briefingKicker').textContent=run.longDrop?'MASTERY III · VERTICAL':run.realGamer?'MASTERY II · HORIZONTAL':run.challenge?`MASTERY I · ${l.kicker}`:run.daily?'DAILY FEED':run.endless?'ENDLESS FEED':`LEVEL ${n} · CHAPTER ${l.chapter}`;
  $('briefingTitle').textContent=l.name;$('briefingDescription').textContent=l.description;
  const fw=$('briefingFavoriteImg').parentElement,isCampaign=!(run.endless||run.daily||run.challenge||run.realGamer||run.longDrop);
  if(l.favorite&&isCampaign){fw.hidden=false;$('briefingFavoriteImg').src=foodPath(l.favorite);$('briefingFavoriteImg').alt=pretty(l.favorite);$('briefingFavoriteName').textContent=`${pretty(l.favorite)} · +25% SCORE`}else fw.hidden=true;
  const objective=[],bonus=[];
  objective.push(run.endless?'SURVIVE':`${l.targetMeals} MEALS`);
  if(l.perfectTarget)(isCampaign?bonus:objective).push(`${l.perfectTarget} PERFECT`);
  if(l.comboTarget)(isCampaign?bonus:objective).push(`x${l.comboTarget} STREAK`);
  if(l.favoriteTarget)(isCampaign?bonus:objective).push(isCampaign?`${l.favoriteTarget} FAVORITES`:`${l.favoriteTarget} ${pretty(l.favorite).toUpperCase()} FAV`);
  const cabinet=[];
  if(l.specialRates?.bomb)cabinet.push('BOMBS');
  if(l.specialRates?.syringe)cabinet.push(`SHRINK -${l.shrinkMeals||4}`);
  if(l.specialRates?.candy)cabinet.push('JEWELED CANDIES');
  if(l.specialRates?.heart)cabinet.push('HEARTS');
  const goals=[];
  if(run.longDrop){
    goals.push(['2','2 TAPS · grab → lead-release from high above']);
    goals.push(['↓',`${l.dropDistance} UNIT DROP · ${l.fallTime.toFixed(2)}s FLIGHT · GULPER KEEPS MOVING`]);
  }else if(run.realGamer){
    goals.push(['2','2 TAPS · grab → release over moving Gulper']);
    goals.push(['↔','1080-WIDE ARENA · dump hazards when Gulper is away']);
  }else{
    goals.push(['1','ONE TAP · grab food; the claw auto-feeds Gulper']);
  }
  goals.push(['✓',`${isCampaign?'CLEAR · ':run.endless?'':'REQUIRED · '}${objective.join(' · ')}`]);
  if(bonus.length)goals.push(['★',`STAR BONUS · ${bonus.join(' · ')}`]);
  if(Number.isFinite(l.time))goals.push(['T',`${l.time}s CLOCK · ${l.hearts} HEART${l.hearts===1?'':'S'}`]);
  else goals.push(['♥',`${l.hearts} HEARTS · survive as long as you can`]);
  if(cabinet.length)goals.push(['!',cabinet.join(' · ')]);
  $('briefingGoals').innerHTML=goals.map(([i,t])=>`<div class="briefing-goal"><i>${i}</i><span>${t}</span></div>`).join('');
  $('briefingTip').textContent=l.tip||'Time the center of the food.';
  $('briefingStart').textContent=run.longDrop?'START VERTICAL MASTERY':run.realGamer?'START HORIZONTAL MASTERY':run.challenge?'START MASTERY TRIAL':run.endless?'START ENDLESS':run.daily?'START DAILY':'START FEEDING';
}
function startRun({levelId='claw001',endless=false,daily=false,challengeId=null,realGamer=false,longDrop=false,seed:seedOverride=null}={},showBriefing=true,returnMode='menu'){
  const seed=daily?dailySeedFromDate(todayKey()):(Number.isInteger(seedOverride)?seedOverride>>>0:((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0));lastUnlocked=save.unlockedLevel;briefingReturn=returnMode;
  briefingReturnRun=returnMode==='result'?run:null;briefingReturnRecorded=returnMode==='result'?resultRecorded:false;
  run=createRun({levelId,seed,endless,daily,challengeId,realGamer,longDrop,campaignAssist:save.settings.campaignAssist});run.personalBestTimingMs=longDrop?save.longDrop?.bestTimingErrorMs:realGamer?save.realGamer?.bestTimingErrorMs:null;paused=showBriefing;resultRecorded=false;particles=[];floaters=[];countdownRemaining=0;coachActive=longDrop?!save.longDropTutorialSeen:realGamer?!save.gamerTutorialSeen:!save.tutorialSeen;anim={phase:'idle',t:0,item:null,dropX:run.worldWidth/2,grade:null,gulperScale:.82,reaction:'',reactionT:0,shake:0,stageUp:false,stageDown:false,cameraX:0,deliveryHit:false};
  retainGulperEatingStages(assets,[run.stage,Math.min(7,run.stage+1)]);loadAsset(assets,gulperEatPath(run.stage));
  canvas.setAttribute('aria-label',run.longDrop?'LONG DROP CLAW. Tap once to grab, then tap again to release early and lead moving Gulper through the long fall.':run.realGamer?'REAL GAMER CLAW. Tap once to grab food, then tap again to release over moving Gulper.':'CLAW Feed Gulper game. Tap or press Space to drop the claw.');
  setMode('play');updateHud();last=performance.now();accumulator=0;
  $('coachHint').hidden=true;
  if(showBriefing){populateBriefing();safeShowModal($('briefingDialog'))}else beginRun();
}
function beginRun(){
  safeCloseDialog($('briefingDialog'));paused=false;setMusicPaused(false);setMusicScene(run.longDrop?'longdrop':run.realGamer?'gamer':run.challenge?'challenge':'campaign');countdownRemaining=2.25;last=performance.now();renderLast=last;accumulator=0;activateAudio();
  if(coachActive){$('coachHint').textContent='CENTER THE CLAW OVER FOOD · TAP TO DROP';$('coachHint').hidden=false}
  websiteBridge.started();
}
function updateHud(){
  if(!run)return;websiteBridge.score(run.score);$('hudScore').textContent=run.score;$('hudCombo').textContent=`x${Math.max(1,run.combo)}`;
  if(run.stage<7&&nextStageAt(run.meals)-run.meals<=1)loadAsset(assets,gulperEatPath(run.stage+1));
  $('hudHearts').textContent='♥'.repeat(run.hearts)+'♡'.repeat(Math.max(0,Math.max(3,run.level.hearts)-run.hearts));$('hudTimer').textContent=Number.isFinite(run.remaining)?Math.ceil(run.remaining)+'s':'∞';$('hudTimer').classList.toggle('timer-danger',Number.isFinite(run.remaining)&&run.remaining<=15);$('levelName').textContent=run.level.name;
  const urgent=Number.isFinite(run.remaining)&&run.remaining<=10,hazard=!!(run.level.specialRates?.bomb||run.level.specialRates?.syringe),manual=run.realGamer||run.longDrop,finalRelease=manual&&anim.phase==='delivery-wait'&&run.remaining<=0;$('dropHint').textContent=run.longDrop&&anim.phase==='freefall'?'FALLING · TRACK GULPER':finalRelease?'FINAL RELEASE · TAP NOW':run.longDrop&&anim.phase==='delivery-wait'?'2ND TAP · LEAD THE LANDING':run.longDrop?'1ST TAP · GRAB FOOD':run.realGamer&&anim.phase==='delivery-wait'?'2ND TAP · RELEASE OVER GULPER':run.realGamer?'1ST TAP · GRAB FOOD':urgent?'HURRY · TAP TO DROP':hazard?'CENTER IT · AVOID HAZARDS':'TAP ANYWHERE TO DROP';
  $('objectiveText').textContent=objectiveProgress(run).join(' · ');
  const e=run.effects,p=[];if(e.magnetDrops)p.push(`MAGNET ${e.magnetDrops}`);if(e.shield)p.push(`SHIELD ${e.shield}`);if(e.royalMeals)p.push(`ROYAL ×2 · ${e.royalMeals}`);if(run.campaignAssist&&run.assistBonus>0)p.push(`TRAINING +${Math.round(run.assistBonus)}`);$('effectPills').innerHTML=p.map(x=>`<span class="effect-pill">${x}</span>`).join('');
  $('growthStageLabel').textContent=`GROWTH ${run.stage+1} / 8`;$('growthBar').style.width=`${Math.round(growthProgress(run.meals)*100)}%`;const n=nextStageAt(run.meals);$('growthNext').textContent=run.stage>=7?'MAX SIZE':`${Math.max(0,n-run.meals)} TO GROW`;
  setMusicIntensity(Math.max(Math.min(1,(run.combo||0)/12),Number.isFinite(run.remaining)&&run.remaining<=15?Math.min(1,(15-run.remaining)/8):0));setMusicScene(anim.phase==='freefall'?'flight':Number.isFinite(run.remaining)&&run.remaining<=10?'danger':run.longDrop?'longdrop':run.realGamer?'gamer':run.challenge?'challenge':'campaign');
}
function drop(){
  if(!run||paused||countdownRemaining>0||run.result!=='playing'||document.querySelector('dialog[open]'))return;
  if((run.realGamer||run.longDrop)&&anim.phase==='delivery-wait')return releaseManualDelivery();
  if(anim.phase!=='idle')return;run.state='busy';anim.phase='dropping';anim.t=0;anim.dropX=run.clawX;haptic(7);sfx('ui');updateHud();
}
function releaseManualDelivery(){
  if(!(run?.realGamer||run?.longDrop)||!run.heldItem||anim.phase!=='delivery-wait')return;
  if(run.longDrop){run.state='freefall';anim.phase='freefall';anim.t=0;anim.deliveryHit=false;sfx('ui');haptic(8);updateHud();return;}
  const d=trackDelivery(run,evaluateDelivery(run,anim.dropX)),item=run.heldItem,hazard=item.kind==='bomb'||item.kind==='syringe';anim.deliveryHit=d.hit;run.gulperFrozen=true;anim.t=0;
  if(!d.hit){discardHeldItem(run,{safeHazard:hazard});anim.reaction=hazard?'SAFE DUMP!':'MISSED MOUTH!';anim.reactionT=0;toast(hazard?`${item.kind.toUpperCase()} DUMPED SAFELY`:`MISSED GULPER · ${Math.round(d.timingErrorMs)}ms OFF · HEART -1`);sfx(hazard?'special':'miss');haptic(hazard?[7,14,7]:[18,14,18]);anim.phase='delivery-miss';anim.item=item;updateHud();return;}
  anim.phase='release';sfx('ui');haptic(8);updateHud();
}
function resolveLongDropImpact(){
  if(!run?.longDrop||!run.heldItem)return;const d=trackDelivery(run,evaluateDelivery(run,anim.dropX)),item=run.heldItem,hazard=item.kind==='bomb'||item.kind==='syringe';anim.deliveryHit=d.hit;run.gulperFrozen=true;anim.t=0;
  if(!d.hit){discardHeldItem(run,{safeHazard:hazard});anim.reaction=hazard?'SAFE DUMP!':'MISSED LANDING!';anim.reactionT=0;toast(hazard?`${item.kind.toUpperCase()} DUMPED SAFELY`:`MISSED GULPER · ${Math.round(d.timingErrorMs)}ms OFF · HEART -1`);sfx(hazard?'special':'miss');haptic(hazard?[7,14,7]:[18,14,18]);anim.phase='delivery-miss';anim.item=item;updateHud();return;}
  anim.phase='feeding';sfx('perfect');haptic([8,18,8]);updateHud();
}
function resolveGrab(){
  const ev=evaluateGrab(run);commitGrab(run,ev);anim.grade=ev.grade;
  if(ev.hit){anim.item=ev.item;sfx(ev.grade==='PERFECT'?'perfect':'grab');haptic(ev.grade==='PERFECT'?[8,22,8]:8);anim.phase='rising';if(coachActive){$('coachHint').textContent=run.longDrop?'LEAD GULPER · RELEASE BEFORE HE REACHES THE LANDING':run.realGamer?'NOW TIME GULPER · TAP AGAIN TO RELEASE':'NICE · THE CLAW AUTO-FEEDS GULPER'}}
  else{sfx('miss');haptic([18,20,18]);anim.reaction=run.lastFeedEvent?.kind==='shield-save'?'SHIELD!':'OOPS!';anim.reactionT=0;if(run.lastFeedEvent?.kind==='shield-save')toast('SHIELD SAVED IT');if(coachActive)$('coachHint').textContent="AIM FOR THE FOOD'S CENTER · TRY AGAIN";anim.phase='rising-miss';}
  anim.t=0;updateHud();
}
function spawnBurst(kind,count=22){
  if(save.settings.reducedMotion)return;const budget=innerWidth<=480?Math.min(count,14):count;
  for(let i=0;i<budget;i++)particles.push({x:(run?.realGamer||run?.longDrop)?run.gulperX:LOGICAL_WIDTH/2,y:640,vx:(Math.random()-.5)*260,vy:-90-Math.random()*180,t:0,life:.48+Math.random()*.42,kind});
  if(particles.length>64)particles=particles.slice(-64);
}
function spawnFloater(text,x,y,tone='score'){
  if(save.settings.reducedMotion)return;floaters.push({text:String(text),x,y,t:0,life:.82,tone});if(floaters.length>12)floaters=floaters.slice(-12);
}
function finishFeed(){
  const beforeStage=run.stage,beforeMeals=run.meals;feedHeldFood(run);const ev=run.lastFeedEvent||{kind:'food'};spawnBurst(ev.kind,ev.kind==='food'?24:18);anim.stageUp=run.stage>beforeStage;anim.stageDown=run.stage<beforeStage;
  retainGulperEatingStages(assets,[run.stage,Math.min(7,run.stage+1)]);loadAsset(assets,gulperEatPath(run.stage));
  if(ev.kind==='bomb'||ev.kind==='shield-bomb'){
    sfx('bomb');haptic([30,20,45]);anim.shake=.28;anim.reaction=ev.kind==='shield-bomb'?'BLOCKED!':'BURP!';toast(ev.kind==='shield-bomb'?'SHIELD BLOCKED BOMB':'BOMB!');anim.phase='burst';
  } else if(ev.kind==='syringe'||ev.kind==='shield-syringe'){
    sfx(ev.kind==='syringe'?'miss':'special');haptic(ev.kind==='syringe'?[18,15,18]:[8,15,8]);anim.shake=ev.kind==='syringe'?.16:0;anim.reaction=ev.kind==='shield-syringe'?'BLOCKED!':'SHRUNK!';anim.reactionT=0;
    toast(ev.kind==='shield-syringe'?'SHIELD BLOCKED SHRINK':`SHRINK · -${ev.loss||Math.max(0,beforeMeals-run.meals)} MEALS`);anim.phase='burst';
  } else {
    const eatPitch=Math.max(.78,1.04-run.stage*.035);sfx(ev.kind==='food'?'eat':'special',ev.kind==='food'?eatPitch:1);
    const reactions={heart:'HEALED!',magnet:'MAGNET!',time:'+8 SEC!',shield:'SHIELDED!',royal:'ROYAL!'};
    anim.reaction=ev.kind==='food'?(ev.favorite?'FAVORITE!':ev.royal?'ROYAL x2!':run.combo>=10?'FEASTING!':run.lastGrade==='PERFECT'?'PERFECT BITE!':'CHOMP!'):(reactions[ev.kind]||'NICE!');anim.reactionT=0;
    if(ev.kind==='food'){const gx=(run.realGamer||run.longDrop)?run.gulperX:LOGICAL_WIDTH/2;spawnFloater(`+${ev.scoreGain||0}`,gx,610,ev.favorite?'favorite':run.lastGrade==='PERFECT'?'perfect':'score');if(ev.favorite)spawnFloater('FAVORITE +25%',gx,650,'favorite');if(run.lastGrade==='PERFECT'){anim.shake=Math.max(anim.shake,.07);haptic([7,12,7])}if(anim.stageUp){anim.shake=Math.max(anim.shake,.14);spawnFloater(`STAGE ${run.stage+1}!`,gx,685,'stage')}}
    if(ev.kind==='heart')toast('HEART +1');if(ev.kind==='magnet')toast('MAGNET · 3 DROPS');if(ev.kind==='time')toast('+8 SECONDS');if(ev.kind==='shield')toast('SHIELD READY');if(ev.kind==='royal')toast('ROYAL · DOUBLE MEALS');if(ev.kind==='food'&&ev.royal)toast('ROYAL x2');if(anim.stageUp)toast(`GULPER GREW · STAGE ${run.stage+1}`);
    anim.phase='eating';
  }
  if(coachActive&&ev.kind==='food'){coachActive=false;if(run.longDrop)save.longDropTutorialSeen=true;else if(run.realGamer)save.gamerTutorialSeen=true;else save.tutorialSeen=true;storeSave(save);setTimeout(()=>{if($('coachHint'))$('coachHint').hidden=true},1250)}
  anim.t=0;updateHud();
}
function finishCycle(){if(run){run.state='idle';run.gulperFrozen=false;}anim.phase='idle';anim.t=0;anim.item=null;anim.grade=null;anim.stageUp=false;anim.stageDown=false;if(run.result!=='playing')showResult()}
function renderResultStars(stars){$('resultStars').innerHTML='';for(let i=0;i<3;i++){const im=document.createElement('img');im.src=uiPath(i<stars?'star-fill.png':'star-empty.png');im.alt=i<stars?'earned star':'empty star';$('resultStars').appendChild(im)}}
function showResult(){
  if(!run||mode==='result')return;
  const stars=(run.endless||run.challenge||run.realGamer||run.longDrop?0:starRating(run)),wasLevel=run.level.id,prevRec=save.levels[wasLevel]||{},prevChallenge=run.challenge?{...(save.challenge?.records?.[run.challengeId]||{})}:null,prevEndless={...save.endless},prevGamer={...save.realGamer},prevLongDrop={...save.longDrop};
  if(!resultRecorded){
    if(run.longDrop)recordLongDrop(save,run);else if(run.realGamer)recordRealGamer(save,run);else if(run.endless)recordEndless(save,run);else if(run.daily)recordDaily(save,run,todayKey(),stars);else if(run.challenge)recordChallenge(save,run);else if(run.result==='complete')recordCampaign(save,run,stars);else recordRunStats(save,run);resultRecorded=true;
  }
  const complete=run.result==='complete';
  $('resultEyebrow').textContent=run.longDrop?'LONG DROP RESULT':run.realGamer?'REAL GAMER RESULT':run.challenge?'CHALLENGE RESULT':run.daily?'DAILY RESULT':run.endless?'ENDLESS RESULT':'CAMPAIGN RESULT';
  $('resultTitle').textContent=complete?(run.longDrop?'LONG DROP CLEARED!':run.realGamer?'REAL GAMER CLEARED!':run.challenge?'CHALLENGE CLEARED!':'GULPER FED!'):run.longDrop?'DROP RUN OVER':run.realGamer?'GAMER RUN OVER':run.endless?'ENDLESS OVER':run.challenge?'CHALLENGE FAILED':'SO CLOSE!';
  $('resultGulper').src=gulperStagePath(run.stage);$('resultScore').textContent=run.score;$('resultGrowth').textContent=`GROWTH STAGE ${run.stage+1} / 8`;
  const hideCampaignStars=run.endless||run.challenge||run.realGamer||run.longDrop;$('result').classList.toggle('mastery-result',!!(run.challenge||run.realGamer||run.longDrop));$('resultStars').hidden=hideCampaignStars;if(hideCampaignStars)$('resultStars').innerHTML='';else renderResultStars(stars);
  const isEndlessBest=run.endless&&run.score>(prevEndless?.highScore||0),isChallengeBest=run.challenge&&run.score>(prevChallenge?.bestScore||0),isGamerBest=run.realGamer&&run.score>(prevGamer?.bestScore||0),isLongDropBest=run.longDrop&&run.score>(prevLongDrop?.bestScore||0);
  $('resultBest').textContent=isLongDropBest&&run.score>0?'★ NEW LONG DROP BEST':isGamerBest&&run.score>0?'★ NEW REAL GAMER BEST':isEndlessBest&&run.score>0?'★ NEW ENDLESS BEST':isChallengeBest?'★ NEW CHALLENGE BEST':complete&&!run.challenge&&stars===3?'★ THREE-STAR FEAST':' ';
  const resultMetrics=[['MEALS',run.meals],['ACCURACY',Math.round(runAccuracy()*100)+'%'],['PERFECT',run.perfects],['BEST STREAK','x'+run.bestCombo]];
  if(run.level.favorite)resultMetrics.push(['FAVORITES',run.favorites]);
  if(run.realGamer||run.longDrop){resultMetrics.push(['AVG ERROR',Math.round(averageDeliveryErrorMs(run))+'ms']);resultMetrics.push(['BEST ERROR',run.bestDeliveryErrorMs==null?'—':Math.round(run.bestDeliveryErrorMs)+'ms']);resultMetrics.push([run.longDrop?'LANDINGS':'SAFE DUMPS',run.longDrop?run.longDropLandings:run.safeDumps]);}
  $('resultStats').innerHTML=resultMetrics.map(([label,value])=>`<span><b>${value}</b>${label}</span>`).join('');
  const unlock=$('resultUnlock');unlock.hidden=true;
  if(run.longDrop&&complete){unlock.hidden=false;unlock.textContent=`LONG DROP CLEARED · ${Math.ceil(run.remaining)}s LEFT · AVG ${Math.round(averageDeliveryErrorMs(run))}ms`}
  else if(run.realGamer&&complete){unlock.hidden=false;unlock.textContent=`REAL GAMER CLEARED · ${Math.ceil(run.remaining)}s LEFT · AVG ${Math.round(averageDeliveryErrorMs(run))}ms`}
  else if(run.challenge&&complete){unlock.hidden=false;unlock.textContent=`${run.level.name.toUpperCase()} CLEARED · ${Math.ceil(run.remaining)}s LEFT`}
  else if(!run.endless&&!run.daily&&!run.challenge&&!run.realGamer&&!run.longDrop&&complete&&save.unlockedLevel>lastUnlocked){unlock.hidden=false;unlock.textContent=Number(run.level.id.slice(-3))>=CAMPAIGN_LEVEL_COUNT?'CAMPAIGN COMPLETE · GRAND GULPER!':`LEVEL ${save.unlockedLevel} UNLOCKED`}
  else if(!run.endless&&!run.daily&&!run.challenge&&!run.realGamer&&!run.longDrop&&stars>(prevRec.stars||0)){unlock.hidden=false;unlock.textContent=`NEW BEST · ${stars} STARS`}
  $('resultPrimary').textContent=run.longDrop?'DROP AGAIN':run.realGamer?'RUN IT BACK':run.challenge?(complete&&CHALLENGES.findIndex(x=>x.id===run.challengeId)<CHALLENGES.length-1?'NEXT CHALLENGE':'RETRY CHALLENGE'):run.endless?'PLAY AGAIN':run.daily?'DAILY AGAIN':complete&&Number(run.level.id.slice(-3))<CAMPAIGN_LEVEL_COUNT?'NEXT LEVEL':'RETRY';
  if(complete)websiteBridge.complete(run.score);
  setMode('result');sfx(complete?'level':'miss');
}

function themePalette(){
  const t=run?.level?.theme||'berry';
  return {
    berry:['#37466d','#19233a','#ff6a91','#59dbc8'],bakery:['#594056','#291f36','#f3a85d','#ffd96a'],candy:['#493a68','#201d43','#b789ff','#59dbc8'],
    night:['#26304d','#10172a','#72a8ff','#ff6a91'],royal:['#4d355e','#21152f','#ffd96a','#ff6a91'],daily:['#2f5260','#142a34','#59dbc8','#ffd96a'],endless:['#3a2b50','#171427','#ff6a91','#8b9aff'],
    'challenge-speed':['#4d2844','#1f152b','#ff7b87','#ffd96a'],'challenge-time':['#30455c','#121c2d','#69d7ff','#ffd96a'],'challenge-bomb':['#552f36','#22131a','#ff6969','#ffb05f'],'challenge-shrink':['#4a355f','#1d162d','#ca8cff','#59dbc8'],'challenge-precision':['#283e54','#101b29','#59dbc8','#c9a5ff'],'challenge-gauntlet':['#50263e','#1b1322','#ff5d86','#ca8cff'],gamer:['#222744','#090d1b','#ff3f66','#56e3d0'],'long-drop':['#17334d','#081521','#73cfff','#ffd96a']
  }[t]||['#37466d','#19233a','#ff6a91','#59dbc8'];
}
function activeSplitFrame(){return viewport.split&&mode==='play'?splitStageGeometry(viewport.sceneH):null}
function logicalCtx(){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  const frame=activeSplitFrame(),bg=img(uiPath('background.webp'));
  if(frame){ctx.fillStyle='#211538';ctx.fillRect(0,0,canvas.width,canvas.height)}
  else if(bg){const k=Math.max(canvas.width/bg.width,canvas.height/bg.height),w=bg.width*k,h=bg.height*k;ctx.globalAlpha=.70;ctx.drawImage(bg,(canvas.width-w)/2,(canvas.height-h)/2,w,h);ctx.globalAlpha=1;ctx.fillStyle='#19112830';ctx.fillRect(0,0,canvas.width,canvas.height)}
  else{ctx.fillStyle='#151a2d';ctx.fillRect(0,0,canvas.width,canvas.height)}
  ctx.translate(viewport.offsetX,viewport.offsetY);ctx.scale(viewport.scale,viewport.scale);
  if(anim.shake>0&&!save.settings.reducedMotion)ctx.translate((Math.random()-.5)*18*anim.shake,(Math.random()-.5)*12*anim.shake);
}
function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawMachine(now){
  const bg=img(uiPath('background.webp'));
  const mode=run?.longDrop?'long-drop':run?.realGamer?'gamer':run?.challenge?'challenge':'standard';
  paintMachineBack(ctx,{now,background:bg,mode,quiet:save.settings.reducedMotion});
  // Retain the real long-drop visual references and world geometry.
  if(run?.longDrop){
    ctx.save();ctx.strokeStyle='#bcecff45';ctx.lineWidth=2;ctx.setLineDash([9,13]);
    for(const x of [170,360,550]){ctx.beginPath();ctx.moveTo(x,204);ctx.lineTo(x,738);ctx.stroke()}
    ctx.setLineDash([]);
    ctx.textAlign='center';ctx.font='900 11px system-ui';ctx.fillStyle='#d9f1ffbd';
    for(const [y,label] of [[278,'HIGH RELEASE'],[478,'LONG FALL'],[700,'LANDING ZONE']]){
      ctx.fillText(label,360,y);
    }
    ctx.restore();
  }
}
function drawMachineForeground(now){
  const mode=run?.longDrop?'long-drop':run?.realGamer?'gamer':run?.challenge?'challenge':'standard';
  const quiet=save.settings.reducedMotion;
  paintGlassFront(ctx,{now,mode,quiet});
  paintDeliveryFront(ctx,{now,mode,quiet,phase:anim.phase});
}
function itemImage(item){return item.kind==='food'?img(foodPath(item.id)):img(specialPath(item.id))}
function drawItems(now){
  if(!run)return;for(const item of run.items){const im=itemImage(item);if(!im)continue;const bob=save.settings.reducedMotion?0:Math.sin(now*.0025+item.bobPhase)*5,size=78+(item.width-38)*.62,y=item.y+bob+(activeSplitFrame()?.prizeOffset||0);
    ctx.save();ctx.translate(item.x,y);
    if(item.kind==='food'&&item.id===run.level.favorite){ctx.strokeStyle='#ffd96ab8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,size*.52+7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffd96a';ctx.font='950 14px system-ui';ctx.textAlign='center';ctx.fillText('★',0,-size*.55-9)}
    if(item.kind!=='food'){const color=item.kind==='bomb'?'#ff6969':item.kind==='syringe'?'#ca8cff':'#59dbc8';ctx.globalAlpha=.18+.08*Math.sin(now*.008+item.bobPhase);ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,size*.62,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
    if(item.kind==='bomb'&&!save.settings.reducedMotion){ctx.globalAlpha=.84+.16*Math.sin(now*.012)}ctx.drawImage(im,-size/2,-size/2,size,size);ctx.globalAlpha=1;
    ctx.fillStyle='#00000036';ctx.beginPath();ctx.ellipse(0,size*.45,size*.32,6,0,0,Math.PI*2);ctx.fill();
    if(item.kind==='bomb'||item.kind==='syringe'){ctx.fillStyle=item.kind==='bomb'?'#ff8b8b':'#ddb3ff';ctx.strokeStyle='#141020';ctx.lineWidth=4;ctx.font='950 10px system-ui';ctx.textAlign='center';const label=item.kind==='bomb'?'BOMB':'SHRINK';ctx.strokeText(label,0,-size*.58-7);ctx.fillText(label,0,-size*.58-7)}
    ctx.restore();
  }
}
function clawPose(){let x=run?.clawX||LOGICAL_WIDTH/2,y=174,arm=54;const prizeShift=activeSplitFrame()?.prizeOffset||0;if(anim.phase==='dropping'){const p=Math.min(1,anim.t/.48);x=anim.dropX;arm=54+p*(300+prizeShift)}else if(['rising','rising-miss'].includes(anim.phase)){const p=Math.min(1,anim.t/.44);x=anim.dropX;arm=354+prizeShift-p*(300+prizeShift)}else if(anim.phase==='centering'){const p=Math.min(1,anim.t/.34);x=anim.dropX+(LOGICAL_WIDTH/2-anim.dropX)*p}else if((run?.realGamer||run?.longDrop)&&['delivery-wait','freefall','release','feeding','delivery-miss'].includes(anim.phase))x=anim.dropX;else if(['release','feeding','eating','burst'].includes(anim.phase))x=LOGICAL_WIDTH/2;return{x,y,arm}}
function drawClaw(){
  if(!run)return;
  const {x,y,arm}=clawPose(),hy=y+arm;
  const quiet=save.settings.reducedMotion;
  ctx.save();
  // Retain the existing motor and grabbing coordinates, improve material rendering only.
  ctx.strokeStyle='#372e51';ctx.lineWidth=11;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x,y-12);ctx.lineTo(x,hy+4);ctx.stroke();
  ctx.strokeStyle='#ffe0a4';ctx.lineWidth=6;
  ctx.beginPath();ctx.moveTo(x+1,y-12);ctx.lineTo(x+1,hy);ctx.stroke();
  ctx.strokeStyle='#ffffff91';ctx.lineWidth=1.7;
  ctx.beginPath();ctx.moveTo(x-2,y-10);ctx.lineTo(x-2,hy-4);ctx.stroke();
  const head=ctx.createLinearGradient(x-38,hy-12,x+38,hy+22);
  head.addColorStop(0,'#fff1c5');head.addColorStop(.25,'#e1b36a');
  head.addColorStop(.55,'#ec5598');head.addColorStop(.8,'#b73d78');head.addColorStop(1,'#61335f');
  ctx.fillStyle=head;roundedRect(x-37,hy-20,74,44,17);ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle='#ffdb7d';ctx.stroke();
  ctx.fillStyle='#ffedbe';ctx.beginPath();ctx.arc(x,hy-1,11,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#bd417a';ctx.beginPath();ctx.arc(x,hy-1,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffe59b';ctx.font='900 14px system-ui';ctx.textAlign='center';ctx.fillText('★',x,hy+4);
  const grip=anim.phase==='dropping'||anim.item?23:33;
  ctx.lineWidth=11;ctx.strokeStyle='#64344c';ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x-27,hy+12);ctx.lineTo(x-grip,hy+39);ctx.moveTo(x+27,hy+12);ctx.lineTo(x+grip,hy+39);ctx.stroke();
  ctx.lineWidth=6;ctx.strokeStyle='#ffdb8d';
  ctx.beginPath();ctx.moveTo(x-27,hy+12);ctx.lineTo(x-grip,hy+39);ctx.moveTo(x+27,hy+12);ctx.lineTo(x+grip,hy+39);ctx.stroke();
  ctx.lineCap='butt';
  if(anim.item&&['rising','centering','delivery-wait','release'].includes(anim.phase)&&!(activeSplitFrame()&&anim.phase==='release')){
    const im=itemImage(anim.item);if(im)ctx.drawImage(im,x-38,hy+30,76,76);
  }
  ctx.restore();
}
function eatDuration(){return .56+(run?.stage||0)*.032}
function drawGulper(now){
  if(!run)return;anim.gulperScale+=(run.targetScale-anim.gulperScale)*.10;const stage=run.stage,baseX=(run.realGamer||run.longDrop)?run.gulperX:LOGICAL_WIDTH/2,frame=activeSplitFrame(),held=run.heldItem||anim.item;
  let lean=0,rotation=0;if(held&&['centering','delivery-wait','freefall','release','feeding'].includes(anim.phase)&&!save.settings.reducedMotion){const dir=Math.sign(anim.dropX-baseX)||1,hazard=held.kind==='bomb'||held.kind==='syringe',favorite=held.kind==='food'&&held.id===run.level.favorite;lean=(hazard?-1:1)*dir*(favorite?15:hazard?12:7);rotation=(hazard?-1:1)*dir*.025}
  const x=baseX+lean,dur=eatDuration();let scale=anim.gulperScale;if(anim.phase==='eating'&&!save.settings.reducedMotion)scale*=1+Math.sin(Math.min(1,anim.t/dur)*Math.PI)*(.075+stage*.004);const size=frame?Math.min(frame.lowerHeight*1.25,frame.lowerHeight*(scale/.82)):330*scale;
  // Align the canonical sprite's ACTUAL visible feet, not its transparent PNG border.
  const y=frame?frame.floorY-23-size*.054:785;
  ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y-7,size*.33,size*.07,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.translate(x,y-size*.42);ctx.rotate(rotation);
  if(anim.phase==='eating'){const sheet=img(gulperEatPath(stage));if(sheet){const frame=Math.min(7,Math.floor(anim.t/dur*8));ctx.drawImage(sheet,frame*450,0,450,450,-size/2,-size*.41,size,size);ctx.restore();return}}
  const blink=!save.settings.reducedMotion&&Math.sin(now/510)>.991,im=img(blink?gulperBlinkPath(stage):gulperStagePath(stage));if(im)ctx.drawImage(im,-size/2,-size*.41,size,size);ctx.restore();
}
function drawGulperMood(now){
  if(!run||save.settings.reducedMotion)return;const held=run.heldItem||anim.item;if(!held||!['centering','delivery-wait','freefall'].includes(anim.phase))return;const x=(run.realGamer||run.longDrop)?run.gulperX:LOGICAL_WIDTH/2,y=(activeSplitFrame()?.mouthY-22||545)+Math.sin(now/170)*4;let symbol='',fill='#fff5e7';
  if(held.kind==='food'&&held.id===run.level.favorite){symbol='♥';fill='#ffd96a'}else if(held.kind==='bomb'||held.kind==='syringe'){symbol='!';fill='#ff8b8b'}else if(held.kind==='food'){symbol='•';fill='#73e6d2'}else return;
  ctx.save();ctx.globalAlpha=.88;ctx.fillStyle='#171224cc';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();ctx.fillStyle=fill;ctx.font='950 18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbol,x,y+1);ctx.restore();
}
function drawFeedingDrop(){
  if(!anim.item||!['release','feeding','delivery-miss','freefall'].includes(anim.phase))return;
  const im=itemImage(anim.item);if(!im)return;
  const frame=activeSplitFrame();
  if(frame){
    // In LONG DROP the food has already landed by the feeding phase.
    // Do not animate a second, visually false fall from the top of the shaft.
    if(run?.longDrop&&anim.phase==='feeding')return;
    const release=anim.phase==='release',fall=anim.phase==='freefall',miss=anim.phase==='delivery-miss';
    const dur=release?.13:fall?longDropFallTime(run):miss?.46:.32,p=Math.min(1,anim.t/dur),ease=p*p;
    const start=release?280:fall?210:frame.chamberBottom-80;
    const end=release?frame.chamberBottom-80:miss?frame.floorY-8:frame.mouthY;
    const y=start+(end-start)*ease;
    const x=(run?.realGamer||run?.longDrop)?anim.dropX:LOGICAL_WIDTH/2;
    const size=(fall?80:70)*(1-p*.12);
    ctx.save();
    // This is the REAL food sprite following one continuous chamber-to-mouth trajectory.
    ctx.strokeStyle=fall?'#b0f1ff85':'#ffeba680';ctx.lineWidth=5;ctx.setLineDash([8,11]);
    ctx.beginPath();ctx.moveTo(x,start);ctx.lineTo(x,y-15);ctx.stroke();ctx.setLineDash([]);
    ctx.shadowColor=fall?'#a5eaff':'#fff1c1';ctx.shadowBlur=17;
    ctx.globalAlpha=miss?Math.max(.15,1-p):1;
    ctx.drawImage(im,x-size/2,y-size/2,size,size);ctx.restore();return;
  }
if(anim.phase==='freefall'){const dur=longDropFallTime(run),p=Math.min(1,anim.t/dur),ease=p*p,y=205+(700-205)*ease,s=82*(1-p*.18);ctx.save();ctx.strokeStyle='#73cfff55';ctx.lineWidth=3;ctx.setLineDash([8,12]);ctx.beginPath();ctx.moveTo(anim.dropX,205);ctx.lineTo(anim.dropX,y-18);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.35+.65*Math.min(1,p*2);ctx.drawImage(im,anim.dropX-s/2,y-s/2,s,s);ctx.restore();return;}const dur=anim.phase==='delivery-miss'?.46:.32,p=Math.min(1,anim.t/dur),y=265+((anim.phase==='delivery-miss'?760:635)-265)*(p*p),s=78*(1-p*.28);ctx.save();if(p>.65)ctx.globalAlpha=Math.max(.35,1-(p-.65)*1.2);const fx=(run?.realGamer||run?.longDrop)?anim.dropX:LOGICAL_WIDTH/2;ctx.drawImage(im,fx-s/2,y-s/2,s,s);ctx.restore()}
function drawBurst(){if(anim.phase!=='burst')return;const p=Math.min(1,anim.t/.46);ctx.save();ctx.strokeStyle=`rgba(255,100,90,${1-p})`;ctx.lineWidth=14*(1-p)+2;ctx.beginPath();ctx.arc((run?.realGamer||run?.longDrop)?run.gulperX:LOGICAL_WIDTH/2,activeSplitFrame()?.mouthY||620,35+p*125,0,Math.PI*2);ctx.stroke();ctx.restore()}
function drawFeedback(){
  if(anim.grade&&anim.phase!=='idle'){ctx.save();ctx.textAlign='center';ctx.font='950 30px system-ui';ctx.fillStyle=anim.grade==='PERFECT'?'#ffe17a':anim.grade==='GREAT'?'#69e3d0':anim.grade==='MISS'?'#d0c8da':'#fff';ctx.strokeStyle='#111827';ctx.lineWidth=6;ctx.strokeText(anim.grade,LOGICAL_WIDTH/2,245);ctx.fillText(anim.grade,LOGICAL_WIDTH/2,245);ctx.restore()}
  if(anim.reaction&&anim.reactionT<1.05){const p=anim.reactionT/1.05,gx=run?.realGamer?run.gulperX-anim.cameraX:(run?.gulperX||LOGICAL_WIDTH/2),bx=Math.max(92,Math.min(LOGICAL_WIDTH-92,gx+120));ctx.save();ctx.globalAlpha=Math.min(1,(1-p)*1.6);ctx.translate(bx,(activeSplitFrame()?.mouthY||620)-p*28);ctx.fillStyle='#fff5e7';roundedRect(-72,-22,144,44,18);ctx.fill();ctx.fillStyle='#2c2031';ctx.font='950 17px system-ui';ctx.textAlign='center';ctx.fillText(anim.reaction,0,6);ctx.restore()}
}
function updateParticles(dt){for(const p of particles){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=360*dt}particles=particles.filter(p=>p.t<p.life)}
function drawParticles(){for(const p of particles){ctx.save();ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.kind==='bomb'?'#ff6969':p.kind==='syringe'?'#ca8cff':p.kind==='food'?'#ffd96a':'#59dbc8';ctx.beginPath();ctx.arc(p.x,p.y+(activeSplitFrame()?.mouthY-640||0),4,0,Math.PI*2);ctx.fill();ctx.restore()}}
function updateFloaters(dt){for(const f of floaters)f.t+=dt;floaters=floaters.filter(f=>f.t<f.life)}
function drawFloaters(){for(const f of floaters){const p=f.t/f.life;ctx.save();ctx.globalAlpha=Math.max(0,1-p);ctx.font=f.tone==='stage'?'950 22px system-ui':'950 16px system-ui';ctx.textAlign='center';ctx.fillStyle=f.tone==='favorite'?'#ffd96a':f.tone==='perfect'?'#fff2a4':f.tone==='stage'?'#73e6d2':'#fff';ctx.strokeStyle='#111827';ctx.lineWidth=4;const y=f.y-p*58+(activeSplitFrame()?.mouthY-640||0);ctx.strokeText(f.text,f.x,y);ctx.fillText(f.text,f.x,y);ctx.restore()}}
function drawLongDropPrediction(){if(!run?.longDrop||anim.phase!=='delivery-wait'||(save.longDrop?.wins||0)>0)return;const x=predictGulperX(run,longDropFallTime(run));ctx.save();ctx.globalAlpha=.48+.16*Math.sin(performance.now()/180);ctx.strokeStyle='#73cfff';ctx.lineWidth=3;ctx.setLineDash([7,7]);ctx.beginPath();ctx.ellipse(x,activeSplitFrame()?.floorY-85||714,58+run.stage*5,15,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#dff5ff';ctx.font='900 9px system-ui';ctx.textAlign='center';ctx.fillText('PREDICTED LANDING',x,activeSplitFrame()?.floorY-107||690);ctx.restore()}
function drawMasteryGhost(){if(!(run?.realGamer||run?.longDrop)||!run.lastDeliveryFeedback||anim.reactionT>1.05)return;const d=run.lastDeliveryFeedback;ctx.save();ctx.globalAlpha=Math.max(.18,1-anim.reactionT/1.05);ctx.lineWidth=3;ctx.strokeStyle=d.hit?'#73e6d2':'#ff8b8b';ctx.beginPath();ctx.moveTo(d.releaseX,activeSplitFrame()?.floorY-130||680);ctx.lineTo(d.releaseX,activeSplitFrame()?.floorY-75||735);ctx.stroke();ctx.fillStyle='#73e6d2';ctx.beginPath();ctx.arc(d.gulperX,activeSplitFrame()?.floorY-92||718,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText(`${Math.round(d.timingErrorMs)}ms`,(d.releaseX+d.gulperX)/2,665);if(run.personalBestTimingMs!=null){ctx.font='800 7px system-ui';ctx.fillStyle='#ffd96a';ctx.fillText(`PB ${Math.round(run.personalBestTimingMs)}ms`,(d.releaseX+d.gulperX)/2,678)}ctx.restore()}
function cameraTarget(){if(!run?.realGamer)return 0;const focus=anim.phase==='delivery-wait'||['release','feeding','delivery-miss','eating','burst'].includes(anim.phase)?(anim.dropX+run.gulperX)/2:run.clawX;return Math.max(0,Math.min(run.worldWidth-LOGICAL_WIDTH,focus-LOGICAL_WIDTH/2))}
function applyWorldCamera(renderDt=FIXED){if(!run?.realGamer)return;const target=cameraTarget(),alpha=1-Math.exp(-7.7*Math.max(0,Math.min(.05,renderDt)));anim.cameraX+=(target-anim.cameraX)*alpha;ctx.translate(-anim.cameraX,0)}
function drawGamerMiniMap(){if(!run?.realGamer)return;const x=92,y=activeSplitFrame()?.chamberBottom+37||552,w=536;ctx.save();ctx.fillStyle='#080b15cc';roundedRect(x,y,w,24,12);ctx.fill();ctx.strokeStyle='#ffffff2f';ctx.stroke();const pos=v=>x+10+(v/run.worldWidth)*(w-20);ctx.fillStyle='#ff5d86';ctx.beginPath();ctx.arc(pos(anim.phase==='delivery-wait'?anim.dropX:run.clawX),y+12,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#59dbc8';ctx.beginPath();ctx.arc(pos(run.gulperX),y+12,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='800 7px system-ui';ctx.textAlign='center';ctx.fillText('CLAW',pos(anim.phase==='delivery-wait'?anim.dropX:run.clawX),y-3);ctx.fillText('GULPER',pos(run.gulperX),y-3);ctx.restore()}
function drawLongDropMeter(){if(!run?.longDrop)return;const x=650,y=212,h=activeSplitFrame()?Math.max(300,activeSplitFrame().bayTop-260):470;ctx.save();ctx.fillStyle='#07121dcc';roundedRect(x-16,y-10,34,h+20,17);ctx.fill();ctx.strokeStyle='#73cfff55';ctx.stroke();ctx.strokeStyle='#ffffff25';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+h);ctx.stroke();const p=anim.phase==='freefall'?Math.min(1,anim.t/longDropFallTime(run)):anim.phase==='delivery-wait'?0:1;ctx.fillStyle='#ffd96a';ctx.beginPath();ctx.arc(x,y+h*p,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dff5ff';ctx.font='900 7px system-ui';ctx.textAlign='right';ctx.fillText(`${run.level.dropDistance} DROP`,x-22,y+6);ctx.restore()}
function render(now,renderDt){
  logicalCtx();
  const frame=activeSplitFrame();
  if(frame){
    const visualMode=run?.longDrop?'long-drop':run?.realGamer?'gamer':run?.challenge?'challenge':'standard';
    paintSplitBackdrop(ctx,{frame,background:img(uiPath('background.webp')),now,quiet:save.settings.reducedMotion,mode:visualMode,phase:anim.phase,stage:run?.stage||0});
    ctx.save();applyWorldCamera(renderDt);drawItems(now);drawClaw();ctx.restore();
    paintSplitGlass(ctx,{frame,mode:visualMode});
    // Delivery animation and the canonical character render outside the glass.
    ctx.save();if(run?.realGamer)ctx.translate(-anim.cameraX,0);
    drawLongDropPrediction();drawFeedingDrop();drawGulper(now);drawGulperMood(now);
    drawBurst();drawParticles();drawFloaters();drawMasteryGhost();ctx.restore();
    paintSplitStageLip(ctx,{frame,now,quiet:save.settings.reducedMotion});
    drawGamerMiniMap();drawLongDropMeter();drawFeedback();return;
  }
  // Existing short-landscape mode retains its already-qualified projection.
  drawMachine(now);ctx.save();applyWorldCamera(renderDt);drawItems(now);drawLongDropPrediction();drawFeedingDrop();drawClaw();ctx.restore();
  drawMachineForeground(now);ctx.save();if(run?.realGamer)ctx.translate(-anim.cameraX,0);
  drawGulper(now);drawGulperMood(now);drawBurst();drawParticles();drawFloaters();drawMasteryGhost();ctx.restore();
  paintStageLip(ctx,{now,quiet:save.settings.reducedMotion,mode:run?.longDrop?'long-drop':run?.realGamer?'gamer':'standard'});
  drawGamerMiniMap();drawLongDropMeter();drawFeedback();
}

function simulate(dt){
  if(!run||paused||mode!=='play')return;
  if(countdownRemaining>0){countdownRemaining=Math.max(0,countdownRemaining-dt);const text=countdownRemaining>1.55?'3':countdownRemaining>1.0?'2':countdownRemaining>.45?'1':'FEED!';$('countdown').textContent=text;$('countdown').classList.add('show');if(countdownRemaining===0){$('countdown').classList.remove('show');$('countdown').textContent='';last=performance.now()}return}else{$('countdown').classList.remove('show');$('countdown').textContent='';}
  stepRun(run,dt);anim.t+=dt;anim.reactionT+=dt;anim.shake=Math.max(0,anim.shake-dt*1.6);updateParticles(dt);updateFloaters(dt);
  if(anim.phase==='dropping'&&anim.t>=.48)resolveGrab();else if(anim.phase==='rising'&&anim.t>=.44){if(run.realGamer||run.longDrop){anim.phase='delivery-wait';run.state='delivery';anim.t=0;updateHud()}else{anim.phase='centering';anim.t=0}}else if(anim.phase==='rising-miss'&&anim.t>=.44)finishCycle();else if(anim.phase==='centering'&&anim.t>=.34){anim.phase='release';anim.t=0}else if(anim.phase==='freefall'&&anim.t>=longDropFallTime(run))resolveLongDropImpact();else if(anim.phase==='release'&&anim.t>=.13){anim.phase='feeding';anim.t=0}else if(anim.phase==='feeding'&&anim.t>=.32)finishFeed();else if(anim.phase==='delivery-miss'&&anim.t>=.46)finishCycle();else if(anim.phase==='eating'&&anim.t>=eatDuration())finishCycle();else if(anim.phase==='burst'&&anim.t>=.46)finishCycle();
  if(run.result!=='playing'&&anim.phase==='idle')showResult();updateHud();
}
function frame(now){const dt=Math.min(.1,(now-last)/1000),renderDt=Math.min(.05,Math.max(0,(now-renderLast)/1000));last=now;renderLast=now;accumulator+=dt;let steps=0;while(accumulator>=FIXED&&steps<MAX_STEPS){simulate(FIXED);accumulator-=FIXED;steps++}if(mode==='play')render(now,renderDt);requestAnimationFrame(frame)}

function pauseGame(){if(!run||mode!=='play'||paused)return;paused=true;setMusicPaused(true);$('pauseObjective').textContent=objectiveProgress(run).join(' · ');safeShowModal($('pauseDialog'));websiteBridge.paused()}
function resumeGame(){safeCloseDialog($('pauseDialog'));paused=false;setMusicPaused(websiteBridge.muted);last=performance.now();renderLast=last;websiteBridge.resumed()}
function restartRun(){const opts={levelId:run.level.id,endless:run.endless,daily:run.daily,challengeId:run.challengeId,realGamer:run.realGamer,longDrop:run.longDrop,seed:run.seed};safeCloseDialog($('pauseDialog'));setMusicPaused(false);startRun(opts,false,'menu')}
function quitToMenu(){safeCloseDialog($('pauseDialog'));paused=false;setMusicPaused(false);run=null;$('coachHint').hidden=true;setMode('menu')}
function openSettings(returnMode=false){modalResume=returnMode&&mode==='play'?returnMode:false;if(modalResume){paused=true;setMusicPaused(true)}syncSettings();safeShowModal($('settingsDialog'))}
function closeSettings(){safeCloseDialog($('settingsDialog'));if(modalResume==='pause'&&mode==='play'){paused=true;safeShowModal($('pauseDialog'))}else if(modalResume==='resume'&&mode==='play'){paused=false;setMusicPaused(false);last=performance.now();renderLast=last}modalResume=false}
function syncSettings(){
  applyVisualSettings();
  $('musicToggle').checked=save.settings.music;$('sfxToggle').checked=save.settings.sfx;$('hapticsToggle').checked=save.settings.haptics;$('motionToggle').checked=save.settings.reducedMotion;$('contrastToggle').checked=save.settings.highContrast;$('colorAssistToggle').checked=save.settings.colorAssist;$('campaignAssistToggle').checked=save.settings.campaignAssist;$('musicVolume').value=Math.round(save.settings.musicVolume*100);$('sfxVolume').value=Math.round(save.settings.sfxVolume*100)
}
function saveSettings(){
  const musicWas=save.settings.music;
  save.settings.music=$('musicToggle').checked;save.settings.sfx=$('sfxToggle').checked;save.settings.haptics=$('hapticsToggle').checked;save.settings.reducedMotion=$('motionToggle').checked;save.settings.highContrast=$('contrastToggle').checked;save.settings.colorAssist=$('colorAssistToggle').checked;save.settings.campaignAssist=$('campaignAssistToggle').checked;save.settings.musicVolume=Number($('musicVolume').value)/100;save.settings.sfxVolume=Number($('sfxVolume').value)/100;storeSave(save);applyVisualSettings();setMusicVolume(save.settings.musicVolume);if(musicWas!==save.settings.music)setMusic(save.settings.music&&!websiteBridge.muted,save.settings.musicVolume);if(websiteBridge.muted)setMusicPaused(true);if(modalResume&&mode==='play')setMusicPaused(true);renderMenu();
}
function openHelp(returnMode=false){modalResume=returnMode&&mode==='play'?returnMode:false;if(modalResume){paused=true;setMusicPaused(true)}safeShowModal($('helpDialog'))}
function closeHelp(){safeCloseDialog($('helpDialog'));if(modalResume==='resume'&&mode==='play'){paused=false;setMusicPaused(false);last=performance.now();renderLast=last}else if(modalResume==='pause'&&mode==='play'){paused=true;safeShowModal($('pauseDialog'))}modalResume=false}
function downloadSave(){const blob=new Blob([exportSave(save)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='CLAW_FEED_GULPER_SAVE.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800);toast('SAVE EXPORTED')}
async function handleImport(file){try{if(file.size>1_000_000)throw new Error('save-too-large');save=importSave(await file.text());syncSettings();setMusic(save.settings.music,save.settings.musicVolume);renderMenu();toast('SAVE IMPORTED')}catch{toast('INVALID SAVE FILE')}}

$('dropActionBtn').addEventListener('click',drop);
$('gameWrap').addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;if(keyTargetsControl(e.target))return;e.preventDefault();drop()},{passive:false});
// Route Escape through exactly one topmost modal transition; do not let native dialog cancellation cascade.
document.addEventListener('keydown',e=>{
  if(e.code!=='Escape')return;
  const open=[...document.querySelectorAll('dialog[open]')];if(!open.length)return;
  e.preventDefault();e.stopImmediatePropagation();const top=open.at(-1);
  if(top===$('confirmResetDialog'))return safeCloseDialog(top);
  if(top===$('settingsDialog'))return closeSettings();
  if(top===$('helpDialog'))return closeHelp();
  if(top===$('creditsDialog'))return safeCloseDialog(top);
  if(top===$('pauseDialog'))return resumeGame();
  if(top===$('briefingDialog'))return $('briefingBack').click();
},{capture:true});
document.addEventListener('keydown',e=>{
  const dialogOpen=!!document.querySelector('dialog[open]');
  if((e.code==='Space'||e.code==='Enter')&&mode==='play'&&!dialogOpen&&!keyTargetsControl(e.target)){e.preventDefault();drop()}
  if(e.code==='Escape'&&mode==='play'&&!dialogOpen){e.preventDefault();pauseGame()}
});
$('pauseBtn').addEventListener('click',pauseGame);$('resumeBtn').addEventListener('click',resumeGame);$('restartBtn').addEventListener('click',restartRun);$('quitBtn').addEventListener('click',quitToMenu);$('pauseSettingsBtn').addEventListener('click',()=>{safeCloseDialog($('pauseDialog'));openSettings('pause')});
$('helpBtn').addEventListener('click',()=>openHelp('resume'));$('helpMenuBtn').addEventListener('click',()=>openHelp(false));$('helpClose').addEventListener('click',closeHelp);
$('settingsBtn').addEventListener('click',()=>openSettings(false));$('settingsClose').addEventListener('click',closeSettings);['musicToggle','sfxToggle','hapticsToggle','motionToggle','contrastToggle','colorAssistToggle','campaignAssistToggle','musicVolume','sfxVolume'].forEach(id=>$(id).addEventListener('change',()=>{saveSettings();if(id==='sfxVolume'&&save.settings.sfx)sfx('ui')}));$('musicVolume').addEventListener('input',()=>setMusicVolume(Number($('musicVolume').value)/100));
$('campaignBtn').addEventListener('click',()=>{activateAudio();openLevels()});$('backLevelBtn').addEventListener('click',()=>setMode('menu'));$('challengeBtn').addEventListener('click',()=>{activateAudio();setMode('challenges')});$('realGamerBtn').addEventListener('click',()=>{activateAudio();startRun({realGamer:true},true,'menu')});$('longDropBtn').addEventListener('click',()=>{activateAudio();startRun({longDrop:true},true,'menu')});$('backChallengeBtn').addEventListener('click',()=>setMode('menu'));$('collectionBtn').addEventListener('click',()=>setMode('collection'));$('backCollectionBtn').addEventListener('click',()=>setMode('menu'));
$('continueBtn').addEventListener('click',()=>{activateAudio();const n=Math.min(CAMPAIGN_LEVEL_COUNT,save.unlockedLevel);startRun({levelId:`claw${String(n).padStart(3,'0')}`},true,'menu')});$('endlessBtn').addEventListener('click',()=>{activateAudio();startRun({endless:true},true,'menu')});$('dailyBtn').addEventListener('click',()=>{activateAudio();startRun({daily:true},true,'menu')});
$('resultMenu').addEventListener('click',()=>setMode('menu'));$('resultReplay').addEventListener('click',()=>run&&startRun({levelId:run.level.id,endless:run.endless,daily:run.daily,challengeId:run.challengeId,realGamer:run.realGamer,longDrop:run.longDrop},false,'result'));$('resultPrimary').addEventListener('click',()=>{if(!run)return;if(run.longDrop)return startRun({longDrop:true},false,'result');if(run.realGamer)return startRun({realGamer:true},false,'result');if(run.challenge){const i=CHALLENGES.findIndex(x=>x.id===run.challengeId);if(run.result==='complete'&&i>=0&&i<CHALLENGES.length-1)return startRun({challengeId:CHALLENGES[i+1].id},true,'result');return startRun({challengeId:run.challengeId},false,'result')}if(run.endless)return startRun({endless:true},false,'result');if(run.daily)return startRun({daily:true},false,'result');const idx=LEVELS.findIndex(x=>x.id===run.level.id);if(run.result==='complete'&&idx<LEVELS.length-1)return startRun({levelId:LEVELS[idx+1].id},true,'result');startRun({levelId:run.level.id},false,'result')});
$('briefingStart').addEventListener('click',beginRun);$('briefingBack').addEventListener('click',()=>{safeCloseDialog($('briefingDialog'));paused=false;$('coachHint').hidden=true;if(briefingReturn==='result'&&briefingReturnRun){run=briefingReturnRun;resultRecorded=briefingReturnRecorded;briefingReturnRun=null;briefingReturnRecorded=false;setMode('result')}else{run=null;briefingReturnRun=null;briefingReturnRecorded=false;setMode(briefingReturn)}});
$('creditsBtn').addEventListener('click',()=>safeShowModal($('creditsDialog')));$('creditsClose').addEventListener('click',()=>safeCloseDialog($('creditsDialog')));
$('exportSaveBtn').addEventListener('click',downloadSave);$('importSaveBtn').addEventListener('click',()=>$('importSaveFile').click());$('importSaveFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)handleImport(f);e.target.value='' });
$('resetProgressBtn').addEventListener('click',()=>safeShowModal($('confirmResetDialog')));$('cancelResetBtn').addEventListener('click',()=>safeCloseDialog($('confirmResetDialog')));$('confirmResetBtn').addEventListener('click',()=>{save=resetSave();safeCloseDialog($('confirmResetDialog'));safeCloseDialog($('settingsDialog'));syncSettings();setMusic(save.settings.music,save.settings.musicVolume);setMode('menu');toast('PROGRESS RESET')});
// Native dialog Esc/cancel must route through the same state transitions as visible buttons.
$('briefingDialog').addEventListener('cancel',e=>{e.preventDefault();$('briefingBack').click()});
$('pauseDialog').addEventListener('cancel',e=>{e.preventDefault();resumeGame()});
$('settingsDialog').addEventListener('cancel',e=>{e.preventDefault();closeSettings()});
$('helpDialog').addEventListener('cancel',e=>{e.preventDefault();closeHelp()});
$('creditsDialog').addEventListener('cancel',e=>{e.preventDefault();safeCloseDialog($('creditsDialog'))});
$('confirmResetDialog').addEventListener('cancel',e=>{e.preventDefault();safeCloseDialog($('confirmResetDialog'))});

document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play'&&run){setMusicPaused(true);if(!paused){paused=true;if(!document.querySelector('dialog[open]'))safeShowModal($('pauseDialog'))}}});

(async function init(){
  assets=await preloadAssets(FOOD_IDS,SPECIAL_IDS);resize();setMode('menu');syncSettings();requestAnimationFrame(frame);
  websiteBridge.announce(); // Host-managed page, no site-scope service worker registration.
})();

