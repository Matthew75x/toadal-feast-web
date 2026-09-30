// GENERATED FROM content/assets/food-presentation-contract.json + approved cross-mode provenance.
// Visible alpha bounds are measured by the Node-native PNG analyzer; do not edit directly.

const FROGGY_FOOD_PRESENTATION = Object.freeze({
  "schemaVersion": 1,
  "policy": {
    "purpose": "Normalize every spawn-eligible Arcade food at a consistent visible size while retaining exact-master geometry for other modes. Stable blocked identities remain unavailable rather than receiving wrong-subject substitutions.",
    "matchingRule": "exact-subject-match-only",
    "sourceOfTruth": "Each mode surface uses visible alpha bounds measured from the exact image it actually renders. Arcade uses the audited max-256 runtime derivative; other modes retain approved canonical-master bounds.",
    "cropRule": "Any subject pixel must remain inside the profile safe frame. Owner-visible clipping at enlarged review is an automatic rejection.",
    "defaultFootprint": 0.76,
    "defaultMinimumSafeMargin": 0.1,
    "phase": "all-arcade-active-runtime-images-normalized"
  },
  "activation": {
    "status": "owner-approved-scaling",
    "scope": "all-arcade-active-runtime-images",
    "activeCanonicalFoodIds": [
      "food.apple",
      "food.banana",
      "food.pear",
      "food.orange",
      "food.lemon",
      "food.strawberry",
      "food.grapes",
      "food.cherry",
      "food.pineapple",
      "food.kiwi",
      "food.mango",
      "food.blueberry",
      "food.coconut",
      "food.pizza",
      "food.burger",
      "food.fries",
      "food.fried-chicken",
      "food.steak",
      "food.cheese",
      "food.pretzel",
      "food.carrot",
      "food.candy-corn",
      "food.avocado",
      "food.broccoli",
      "food.tomato",
      "food.potato",
      "food.donut",
      "food.cookie",
      "food.ice-cream-cone",
      "food.red-velvet-cake",
      "food.cupcake",
      "food.chocolate",
      "food.hard-candy",
      "food.gummy-bear",
      "food.lollipop",
      "food.macaron",
      "food.salmon-nigiri",
      "food.shrimp-nigiri",
      "food.maki-roll",
      "food.ramen",
      "food.curry",
      "food.chili-pepper",
      "food.marshmallow",
      "food.mochi",
      "food.brownie",
      "food.cheesecake",
      "food.taco",
      "food.hot-dog",
      "food.chicken-nuggets",
      "food.onion-rings",
      "food.nachos",
      "food.whole-fish",
      "food.fruit-bowl",
      "food.watermelon-slice",
      "food.cinnamon-roll",
      "food.milkshake",
      "food.cotton-candy",
      "food.peach",
      "food.raspberry",
      "food.dragon-fruit",
      "food.golden-apple",
      "food.jelly-beans",
      "food.jewel-candy"
    ],
    "rolloutRule": "Every spawn-eligible Arcade identity uses an exact owner-approved or previously approved image. Owner-removed duplicates and poor-quality foods remain stable historical IDs but cannot spawn."
  },
  "profiles": {
    "arcade.falling-food": {
      "mode": "arcade",
      "surface": "falling-food",
      "targetVisibleFraction": 0.76,
      "minimumSafeMarginFraction": 0.1,
      "anchor": "center",
      "shadow": "renderer-owned"
    },
    "infinite.colony-food": {
      "mode": "infinite",
      "surface": "colony-food",
      "targetVisibleFraction": 0.74,
      "minimumSafeMarginFraction": 0.12,
      "anchor": "center",
      "shadow": "renderer-owned"
    },
    "puzzle.board-food": {
      "mode": "puzzle",
      "surface": "board-cell",
      "targetVisibleFraction": 0.76,
      "minimumSafeMarginFraction": 0.1,
      "anchor": "center",
      "shadow": "renderer-owned"
    },
    "feastfall.match-tile": {
      "mode": "feastfall",
      "surface": "match-tile",
      "targetVisibleFraction": 0.72,
      "minimumSafeMarginFraction": 0.14,
      "anchor": "center",
      "shadow": "renderer-owned"
    }
  },
  "profileAliases": {
    "puzzle.board-cell": "puzzle.board-food"
  },
  "foods": {
    "food.apple": {
      "canonicalFoodId": "food.apple",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-apple.png",
      "masterAssetKey": "glossy.sticker.food.apple",
      "resolvedMasterAssetKey": "glossy.sticker.food.apple",
      "subject": "apple",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1484375,
        "y": 0.140625,
        "width": 0.7021484375,
        "height": 0.71875
      },
      "visibleMargins": {
        "left": 0.1484375,
        "top": 0.140625,
        "right": 0.1494140625,
        "bottom": 0.140625
      },
      "visibleAspect": 0.9769021739130435,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.apple",
          "profileKey": "arcade.falling-food"
        },
        {
          "mode": "feastfall",
          "surface": "match-tile",
          "foodId": "apple",
          "profileKey": "feastfall.match-tile"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_apple.png",
          "sourceAssetKey": "glossy.sticker.food.apple",
          "runtimeAssetKey": "food_apple",
          "classification": "exact-cross-mode-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.15234375,
            "y": 0.14453125,
            "width": 0.69921875,
            "height": 0.7109375
          },
          "visibleMargins": {
            "left": 0.15234375,
            "top": 0.14453125,
            "right": 0.1484375,
            "bottom": 0.14453125
          },
          "visibleAspect": 0.9835164835164835
        }
      }
    },
    "food.avocado": {
      "canonicalFoodId": "food.avocado",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-avocado.png",
      "masterAssetKey": "glossy.sticker.food.avocado",
      "resolvedMasterAssetKey": "glossy.sticker.food.avocado",
      "subject": "avocado",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.17578125,
        "y": 0.1416015625,
        "width": 0.6474609375,
        "height": 0.716796875
      },
      "visibleMargins": {
        "left": 0.17578125,
        "top": 0.1416015625,
        "right": 0.1767578125,
        "bottom": 0.1416015625
      },
      "visibleAspect": 0.9032697547683923,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.avocado",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_avocado.png",
          "sourceAssetKey": "glossy.sticker.food.avocado",
          "runtimeAssetKey": "food_avocado",
          "classification": "exact-cross-mode-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.17578125,
            "y": 0.140625,
            "width": 0.6484375,
            "height": 0.71875
          },
          "visibleMargins": {
            "left": 0.17578125,
            "top": 0.140625,
            "right": 0.17578125,
            "bottom": 0.140625
          },
          "visibleAspect": 0.9021739130434783
        }
      }
    },
    "food.banana": {
      "canonicalFoodId": "food.banana",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-banana.png",
      "masterAssetKey": "glossy.sticker.food.banana",
      "resolvedMasterAssetKey": "glossy.sticker.food.banana",
      "subject": "banana",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.171875,
        "y": 0.140625,
        "width": 0.65625,
        "height": 0.73046875
      },
      "visibleMargins": {
        "left": 0.171875,
        "top": 0.140625,
        "right": 0.171875,
        "bottom": 0.12890625
      },
      "visibleAspect": 0.8983957219251337,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.banana",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_banana.png",
          "sourceAssetKey": "glossy.sticker.food.banana",
          "runtimeAssetKey": "food_banana",
          "classification": "exact-cross-mode-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.171875,
            "y": 0.140625,
            "width": 0.65625,
            "height": 0.73046875
          },
          "visibleMargins": {
            "left": 0.171875,
            "top": 0.140625,
            "right": 0.171875,
            "bottom": 0.12890625
          },
          "visibleAspect": 0.8983957219251337
        }
      }
    },
    "food.blueberry": {
      "canonicalFoodId": "food.blueberry",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-blueberry.png",
      "masterAssetKey": "glossy.sticker.food.blueberry",
      "resolvedMasterAssetKey": "glossy.sticker.food.blueberry",
      "subject": "blueberry",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1416015625,
        "y": 0.1484375,
        "width": 0.716796875,
        "height": 0.7021484375
      },
      "visibleMargins": {
        "left": 0.1416015625,
        "top": 0.1484375,
        "right": 0.1416015625,
        "bottom": 0.1494140625
      },
      "visibleAspect": 1.0208623087621698,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.blueberry",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.blueberry",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_blueberry.png",
          "sourceAssetKey": "owner.food.blueberry.rc24",
          "runtimeAssetKey": "food_blueberry",
          "classification": "owner-approved-generated-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.26171875,
            "y": 0.23046875,
            "width": 0.4921875,
            "height": 0.546875
          },
          "visibleMargins": {
            "left": 0.26171875,
            "top": 0.23046875,
            "right": 0.24609375,
            "bottom": 0.22265625
          },
          "visibleAspect": 0.9
        }
      }
    },
    "food.broccoli": {
      "canonicalFoodId": "food.broccoli",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
      "masterAssetKey": "glossy.sticker.food.broccoli",
      "resolvedMasterAssetKey": "glossy.sticker.food.broccoli",
      "subject": "broccoli",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.0625,
        "y": 0.0625,
        "width": 0.875,
        "height": 0.859375
      },
      "visibleMargins": {
        "left": 0.0625,
        "top": 0.0625,
        "right": 0.0625,
        "bottom": 0.078125
      },
      "visibleAspect": 1.018181818181818,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.broccoli",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.broccoli",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
          "sourceAssetKey": "glossy.sticker.food.broccoli",
          "runtimeAssetKey": "food_broccoli",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.0625,
            "y": 0.0625,
            "width": 0.875,
            "height": 0.859375
          },
          "visibleMargins": {
            "left": 0.0625,
            "top": 0.0625,
            "right": 0.0625,
            "bottom": 0.078125
          },
          "visibleAspect": 1.018181818181818
        }
      }
    },
    "food.burger": {
      "canonicalFoodId": "food.burger",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-burger.png",
      "masterAssetKey": "glossy.sticker.food.burger",
      "resolvedMasterAssetKey": "glossy.sticker.food.burger",
      "subject": "burger",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.0654296875,
        "y": 0.0615234375,
        "width": 0.8681640625,
        "height": 0.865234375
      },
      "visibleMargins": {
        "left": 0.0654296875,
        "top": 0.0615234375,
        "right": 0.06640625,
        "bottom": 0.0732421875
      },
      "visibleAspect": 1.0033860045146727,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.burger",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.burger",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_burger.png",
          "sourceAssetKey": "glossy.sticker.food.burger",
          "runtimeAssetKey": "food_burger",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.05859375,
            "y": 0.0546875,
            "width": 0.8828125,
            "height": 0.87890625
          },
          "visibleMargins": {
            "left": 0.05859375,
            "top": 0.0546875,
            "right": 0.05859375,
            "bottom": 0.06640625
          },
          "visibleAspect": 1.0044444444444445
        }
      }
    },
    "food.carrot": {
      "canonicalFoodId": "food.carrot",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_carrot.png",
      "masterAssetKey": "glossy.sticker.food.carrot",
      "resolvedMasterAssetKey": "glossy.sticker.food.carrot",
      "subject": "carrot",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.046875,
        "y": 0.109375,
        "width": 0.90625,
        "height": 0.78125
      },
      "visibleMargins": {
        "left": 0.046875,
        "top": 0.109375,
        "right": 0.046875,
        "bottom": 0.109375
      },
      "visibleAspect": 1.16,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.carrot",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.carrot",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_carrot.png",
          "sourceAssetKey": "glossy.sticker.food.carrot",
          "runtimeAssetKey": "food_carrot",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.046875,
            "y": 0.109375,
            "width": 0.90625,
            "height": 0.78125
          },
          "visibleMargins": {
            "left": 0.046875,
            "top": 0.109375,
            "right": 0.046875,
            "bottom": 0.109375
          },
          "visibleAspect": 1.16
        }
      }
    },
    "food.cheese": {
      "canonicalFoodId": "food.cheese",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
      "masterAssetKey": "glossy.sticker.food.cheese",
      "resolvedMasterAssetKey": "glossy.sticker.food.cheese",
      "subject": "cheese",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.1875,
        "y": 0.21875,
        "width": 0.625,
        "height": 0.609375
      },
      "visibleMargins": {
        "left": 0.1875,
        "top": 0.21875,
        "right": 0.1875,
        "bottom": 0.171875
      },
      "visibleAspect": 1.0256410256410255,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.cheese",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.cheese",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
          "sourceAssetKey": "glossy.sticker.food.cheese",
          "runtimeAssetKey": "food_cheese",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.1875,
            "y": 0.21875,
            "width": 0.625,
            "height": 0.609375
          },
          "visibleMargins": {
            "left": 0.1875,
            "top": 0.21875,
            "right": 0.1875,
            "bottom": 0.171875
          },
          "visibleAspect": 1.0256410256410255
        }
      }
    },
    "food.cherry": {
      "canonicalFoodId": "food.cherry",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cherry.png",
      "masterAssetKey": "glossy.sticker.food.cherry",
      "resolvedMasterAssetKey": "glossy.sticker.food.cherry",
      "subject": "cherry",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.171875,
        "y": 0.171875,
        "width": 0.640625,
        "height": 0.640625
      },
      "visibleMargins": {
        "left": 0.171875,
        "top": 0.171875,
        "right": 0.1875,
        "bottom": 0.1875
      },
      "visibleAspect": 1,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.cherry",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.cherry",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cherry.png",
          "sourceAssetKey": "glossy.sticker.food.cherry",
          "runtimeAssetKey": "food_cherry",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.171875,
            "y": 0.171875,
            "width": 0.640625,
            "height": 0.640625
          },
          "visibleMargins": {
            "left": 0.171875,
            "top": 0.171875,
            "right": 0.1875,
            "bottom": 0.1875
          },
          "visibleAspect": 1
        }
      }
    },
    "food.chocolate": {
      "canonicalFoodId": "food.chocolate",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_brownie.png",
      "masterAssetKey": "glossy.sticker.food.chocolate",
      "resolvedMasterAssetKey": "glossy.sticker.food.chocolate",
      "subject": "chocolate bar",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.06640625,
        "y": 0.09765625,
        "width": 0.87109375,
        "height": 0.81640625
      },
      "visibleMargins": {
        "left": 0.06640625,
        "top": 0.09765625,
        "right": 0.0625,
        "bottom": 0.0859375
      },
      "visibleAspect": 1.0669856459330143,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.chocolate",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_brownie.png",
          "sourceAssetKey": "glossy.sticker.food.chocolate",
          "runtimeAssetKey": "food_chocolate",
          "classification": "exact-cross-mode-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.06640625,
            "y": 0.09765625,
            "width": 0.87109375,
            "height": 0.81640625
          },
          "visibleMargins": {
            "left": 0.06640625,
            "top": 0.09765625,
            "right": 0.0625,
            "bottom": 0.0859375
          },
          "visibleAspect": 1.0669856459330143
        }
      }
    },
    "food.coconut": {
      "canonicalFoodId": "food.coconut",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-coconut.png",
      "masterAssetKey": "glossy.sticker.food.coconut",
      "resolvedMasterAssetKey": "glossy.sticker.food.coconut",
      "subject": "coconut",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.140625,
        "y": 0.1728515625,
        "width": 0.71875,
        "height": 0.654296875
      },
      "visibleMargins": {
        "left": 0.140625,
        "top": 0.1728515625,
        "right": 0.140625,
        "bottom": 0.1728515625
      },
      "visibleAspect": 1.0985074626865672,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.coconut",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_coconut.png",
          "sourceAssetKey": "glossy.sticker.food.coconut",
          "runtimeAssetKey": "food_coconut",
          "classification": "exact-cross-mode-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.140625,
            "y": 0.171875,
            "width": 0.71875,
            "height": 0.65625
          },
          "visibleMargins": {
            "left": 0.140625,
            "top": 0.171875,
            "right": 0.140625,
            "bottom": 0.171875
          },
          "visibleAspect": 1.0952380952380953
        }
      }
    },
    "food.cookie": {
      "canonicalFoodId": "food.cookie",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-cookie.png",
      "masterAssetKey": "glossy.sticker.food.cookie",
      "resolvedMasterAssetKey": "glossy.sticker.food.cookie",
      "subject": "cookie",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1337890625,
        "y": 0.1708984375,
        "width": 0.732421875,
        "height": 0.658203125
      },
      "visibleMargins": {
        "left": 0.1337890625,
        "top": 0.1708984375,
        "right": 0.1337890625,
        "bottom": 0.1708984375
      },
      "visibleAspect": 1.1127596439169138,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.cookie",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.cookie",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cookie.png",
          "sourceAssetKey": "owner.food.cookie.rc24",
          "runtimeAssetKey": "food_cookie",
          "classification": "owner-approved-generated-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.1875,
            "y": 0.1953125,
            "width": 0.63671875,
            "height": 0.62109375
          },
          "visibleMargins": {
            "left": 0.1875,
            "top": 0.1953125,
            "right": 0.17578125,
            "bottom": 0.18359375
          },
          "visibleAspect": 1.0251572327044025
        }
      }
    },
    "food.corn": {
      "canonicalFoodId": "food.corn",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-corn.png",
      "masterAssetKey": "glossy.sticker.food.corn",
      "resolvedMasterAssetKey": "glossy.sticker.food.corn",
      "subject": "corn",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.2431640625,
        "y": 0.1357421875,
        "width": 0.513671875,
        "height": 0.728515625
      },
      "visibleMargins": {
        "left": 0.2431640625,
        "top": 0.1357421875,
        "right": 0.2431640625,
        "bottom": 0.1357421875
      },
      "visibleAspect": 0.7050938337801609,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.corn",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.corn",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.cupcake": {
      "canonicalFoodId": "food.cupcake",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-cupcake.png",
      "masterAssetKey": "glossy.sticker.food.cupcake",
      "resolvedMasterAssetKey": "glossy.sticker.food.cupcake",
      "subject": "cupcake",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1337890625,
        "y": 0.046875,
        "width": 0.732421875,
        "height": 0.8935546875
      },
      "visibleMargins": {
        "left": 0.1337890625,
        "top": 0.046875,
        "right": 0.1337890625,
        "bottom": 0.0595703125
      },
      "visibleAspect": 0.819672131147541,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.cupcake",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.cupcake",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
          "sourceAssetKey": "glossy.sticker.food.cupcake",
          "runtimeAssetKey": "food_cupcake",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.125,
            "y": 0.0390625,
            "width": 0.75,
            "height": 0.91015625
          },
          "visibleMargins": {
            "left": 0.125,
            "top": 0.0390625,
            "right": 0.125,
            "bottom": 0.05078125
          },
          "visibleAspect": 0.8240343347639485
        }
      }
    },
    "food.donut": {
      "canonicalFoodId": "food.donut",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-donut.png",
      "masterAssetKey": "glossy.sticker.food.donut",
      "resolvedMasterAssetKey": "glossy.sticker.food.donut",
      "subject": "donut",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.068359375,
        "y": 0.1376953125,
        "width": 0.8671875,
        "height": 0.736328125
      },
      "visibleMargins": {
        "left": 0.068359375,
        "top": 0.1376953125,
        "right": 0.064453125,
        "bottom": 0.1259765625
      },
      "visibleAspect": 1.1777188328912467,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.donut",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.donut",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_donut.png",
          "sourceAssetKey": "glossy.sticker.food.donut",
          "runtimeAssetKey": "food_donut",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.0625,
            "y": 0.1328125,
            "width": 0.87890625,
            "height": 0.74609375
          },
          "visibleMargins": {
            "left": 0.0625,
            "top": 0.1328125,
            "right": 0.05859375,
            "bottom": 0.12109375
          },
          "visibleAspect": 1.1780104712041886
        }
      }
    },
    "food.fried-chicken": {
      "canonicalFoodId": "food.fried-chicken",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
      "masterAssetKey": "glossy.sticker.food.fried-chicken",
      "resolvedMasterAssetKey": "glossy.sticker.food.fried-chicken",
      "subject": "fried chicken",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.02734375,
        "y": 0.0625,
        "width": 0.9453125,
        "height": 0.875
      },
      "visibleMargins": {
        "left": 0.02734375,
        "top": 0.0625,
        "right": 0.02734375,
        "bottom": 0.0625
      },
      "visibleAspect": 1.0803571428571428,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.fried-chicken",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.fried-chicken",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
          "sourceAssetKey": "glossy.sticker.food.fried-chicken",
          "runtimeAssetKey": "food_chicken",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.02734375,
            "y": 0.0625,
            "width": 0.9453125,
            "height": 0.875
          },
          "visibleMargins": {
            "left": 0.02734375,
            "top": 0.0625,
            "right": 0.02734375,
            "bottom": 0.0625
          },
          "visibleAspect": 1.0803571428571428
        }
      }
    },
    "food.fries": {
      "canonicalFoodId": "food.fries",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-fries.png",
      "masterAssetKey": "glossy.sticker.food.fries",
      "resolvedMasterAssetKey": "glossy.sticker.food.fries",
      "subject": "fries",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.173828125,
        "y": 0.1337890625,
        "width": 0.6337890625,
        "height": 0.732421875
      },
      "visibleMargins": {
        "left": 0.173828125,
        "top": 0.1337890625,
        "right": 0.1923828125,
        "bottom": 0.1337890625
      },
      "visibleAspect": 0.8653333333333333,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.fries",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.fries",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fries.png",
          "sourceAssetKey": "glossy.sticker.food.fries",
          "runtimeAssetKey": "food_fries",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.1640625,
            "y": 0.1328125,
            "width": 0.64453125,
            "height": 0.734375
          },
          "visibleMargins": {
            "left": 0.1640625,
            "top": 0.1328125,
            "right": 0.19140625,
            "bottom": 0.1328125
          },
          "visibleAspect": 0.8776595744680851
        }
      }
    },
    "food.grapes": {
      "canonicalFoodId": "food.grapes",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-grapes.png",
      "masterAssetKey": "glossy.sticker.food.grapes",
      "resolvedMasterAssetKey": "glossy.sticker.food.grapes",
      "subject": "grapes",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1630859375,
        "y": 0.1396484375,
        "width": 0.673828125,
        "height": 0.7314453125
      },
      "visibleMargins": {
        "left": 0.1630859375,
        "top": 0.1396484375,
        "right": 0.1630859375,
        "bottom": 0.12890625
      },
      "visibleAspect": 0.9212283044058746,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.grapes",
          "profileKey": "arcade.falling-food"
        },
        {
          "mode": "puzzle",
          "surface": "board-cell",
          "foodId": "food.grapes",
          "profileKey": "puzzle.board-food"
        },
        {
          "mode": "feastfall",
          "surface": "match-tile",
          "foodId": "grape",
          "profileKey": "feastfall.match-tile"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_grapes.png",
          "sourceAssetKey": "glossy.sticker.food.grapes",
          "runtimeAssetKey": "food_grapes",
          "classification": "exact-cross-mode-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.16015625,
            "y": 0.13671875,
            "width": 0.6796875,
            "height": 0.73828125
          },
          "visibleMargins": {
            "left": 0.16015625,
            "top": 0.13671875,
            "right": 0.16015625,
            "bottom": 0.125
          },
          "visibleAspect": 0.9206349206349206
        }
      }
    },
    "food.hard-candy": {
      "canonicalFoodId": "food.hard-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candy.png",
      "masterAssetKey": "glossy.sticker.food.hard-candy",
      "resolvedMasterAssetKey": "glossy.sticker.food.hard-candy",
      "subject": "hard candy",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.140625,
        "y": 0.265625,
        "width": 0.734375,
        "height": 0.5
      },
      "visibleMargins": {
        "left": 0.140625,
        "top": 0.265625,
        "right": 0.125,
        "bottom": 0.234375
      },
      "visibleAspect": 1.46875,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.hard-candy",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.hard-candy",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candy.png",
          "sourceAssetKey": "glossy.sticker.food.hard-candy",
          "runtimeAssetKey": "food_candy",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.140625,
            "y": 0.265625,
            "width": 0.734375,
            "height": 0.5
          },
          "visibleMargins": {
            "left": 0.140625,
            "top": 0.265625,
            "right": 0.125,
            "bottom": 0.234375
          },
          "visibleAspect": 1.46875
        }
      }
    },
    "food.hot-sauce": {
      "canonicalFoodId": "food.hot-sauce",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chili_pepper.png",
      "masterAssetKey": "glossy.sticker.food.hot-sauce",
      "resolvedMasterAssetKey": "glossy.sticker.food.hot-sauce",
      "subject": "hot sauce bottle",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.08203125,
        "y": 0.05859375,
        "width": 0.859375,
        "height": 0.828125
      },
      "visibleMargins": {
        "left": 0.08203125,
        "top": 0.05859375,
        "right": 0.05859375,
        "bottom": 0.11328125
      },
      "visibleAspect": 1.0377358490566038,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.hot-sauce",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.ice-cream-cone": {
      "canonicalFoodId": "food.ice-cream-cone",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
      "masterAssetKey": "glossy.sticker.food.ice-cream-cone",
      "resolvedMasterAssetKey": "glossy.sticker.food.ice-cream-cone",
      "subject": "ice cream cone",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.234375,
        "y": 0.171875,
        "width": 0.53125,
        "height": 0.671875
      },
      "visibleMargins": {
        "left": 0.234375,
        "top": 0.171875,
        "right": 0.234375,
        "bottom": 0.15625
      },
      "visibleAspect": 0.7906976744186046,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.ice-cream-cone",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.ice-cream-cone",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
          "sourceAssetKey": "glossy.sticker.food.ice-cream-cone",
          "runtimeAssetKey": "food_icecream",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.234375,
            "y": 0.171875,
            "width": 0.53125,
            "height": 0.671875
          },
          "visibleMargins": {
            "left": 0.234375,
            "top": 0.171875,
            "right": 0.234375,
            "bottom": 0.15625
          },
          "visibleAspect": 0.7906976744186046
        }
      }
    },
    "food.ketchup": {
      "canonicalFoodId": "food.ketchup",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
      "masterAssetKey": "glossy.sticker.food.ketchup",
      "resolvedMasterAssetKey": "glossy.sticker.food.ketchup",
      "subject": "ketchup bottle",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.046875,
        "y": 0.0625,
        "width": 0.90625,
        "height": 0.875
      },
      "visibleMargins": {
        "left": 0.046875,
        "top": 0.0625,
        "right": 0.046875,
        "bottom": 0.0625
      },
      "visibleAspect": 1.0357142857142858,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.ketchup",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.kiwi": {
      "canonicalFoodId": "food.kiwi",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-kiwi.png",
      "masterAssetKey": "glossy.sticker.food.kiwi",
      "resolvedMasterAssetKey": "glossy.sticker.food.kiwi",
      "subject": "kiwi",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.140625,
        "y": 0.1513671875,
        "width": 0.71875,
        "height": 0.697265625
      },
      "visibleMargins": {
        "left": 0.140625,
        "top": 0.1513671875,
        "right": 0.140625,
        "bottom": 0.1513671875
      },
      "visibleAspect": 1.0308123249299719,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.kiwi",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.kiwi",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_kiwi.png",
          "sourceAssetKey": "glossy.sticker.food.kiwi",
          "runtimeAssetKey": "food_kiwi",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.140625,
            "y": 0.1484375,
            "width": 0.71875,
            "height": 0.703125
          },
          "visibleMargins": {
            "left": 0.140625,
            "top": 0.1484375,
            "right": 0.140625,
            "bottom": 0.1484375
          },
          "visibleAspect": 1.0222222222222221
        }
      }
    },
    "food.lemon": {
      "canonicalFoodId": "food.lemon",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-lemon.png",
      "masterAssetKey": "glossy.sticker.food.lemon",
      "resolvedMasterAssetKey": "glossy.sticker.food.lemon",
      "subject": "lemon",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.154296875,
        "y": 0.1416015625,
        "width": 0.6904296875,
        "height": 0.716796875
      },
      "visibleMargins": {
        "left": 0.154296875,
        "top": 0.1416015625,
        "right": 0.1552734375,
        "bottom": 0.1416015625
      },
      "visibleAspect": 0.9632152588555858,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.lemon",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.lemon",
          "profileKey": "arcade.falling-food"
        },
        {
          "mode": "feastfall",
          "surface": "match-tile",
          "foodId": "lemon",
          "profileKey": "feastfall.match-tile"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lemon.png",
          "sourceAssetKey": "glossy.sticker.food.lemon",
          "runtimeAssetKey": "food_lemon",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.15234375,
            "y": 0.140625,
            "width": 0.6953125,
            "height": 0.71875
          },
          "visibleMargins": {
            "left": 0.15234375,
            "top": 0.140625,
            "right": 0.15234375,
            "bottom": 0.140625
          },
          "visibleAspect": 0.967391304347826
        }
      }
    },
    "food.mango": {
      "canonicalFoodId": "food.mango",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-mango.png",
      "masterAssetKey": "glossy.sticker.food.mango",
      "resolvedMasterAssetKey": "glossy.sticker.food.mango",
      "subject": "mango",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.140625,
        "y": 0.1748046875,
        "width": 0.71875,
        "height": 0.6494140625
      },
      "visibleMargins": {
        "left": 0.140625,
        "top": 0.1748046875,
        "right": 0.140625,
        "bottom": 0.17578125
      },
      "visibleAspect": 1.106766917293233,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.mango",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_mango.png",
          "sourceAssetKey": "glossy.sticker.food.mango",
          "runtimeAssetKey": "food_mango",
          "classification": "exact-cross-mode-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.140625,
            "y": 0.171875,
            "width": 0.71875,
            "height": 0.65234375
          },
          "visibleMargins": {
            "left": 0.140625,
            "top": 0.171875,
            "right": 0.140625,
            "bottom": 0.17578125
          },
          "visibleAspect": 1.1017964071856288
        }
      }
    },
    "food.nachos": {
      "canonicalFoodId": "food.nachos",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_nachos.png",
      "masterAssetKey": "firefly.food.nachos",
      "resolvedMasterAssetKey": "firefly.food.nachos",
      "subject": "nachos",
      "rawWidth": 128,
      "rawHeight": 128,
      "visibleBounds": {
        "x": 0.15625,
        "y": 0.1953125,
        "width": 0.6796875,
        "height": 0.6015625
      },
      "visibleMargins": {
        "left": 0.15625,
        "top": 0.1953125,
        "right": 0.1640625,
        "bottom": 0.203125
      },
      "visibleAspect": 1.12987012987013,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.nachos",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.nachos",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
          "sourceAssetKey": "runtime.food_nachos",
          "runtimeAssetKey": "food_nachos",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.046875,
            "y": 0.0703125,
            "width": 0.9140625,
            "height": 0.859375
          },
          "visibleMargins": {
            "left": 0.046875,
            "top": 0.0703125,
            "right": 0.0390625,
            "bottom": 0.0703125
          },
          "visibleAspect": 1.0636363636363637
        }
      }
    },
    "food.orange": {
      "canonicalFoodId": "food.orange",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-orange.png",
      "masterAssetKey": "glossy.sticker.food.orange",
      "resolvedMasterAssetKey": "glossy.sticker.food.orange",
      "subject": "orange",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1650390625,
        "y": 0.140625,
        "width": 0.669921875,
        "height": 0.73046875
      },
      "visibleMargins": {
        "left": 0.1650390625,
        "top": 0.140625,
        "right": 0.1650390625,
        "bottom": 0.12890625
      },
      "visibleAspect": 0.9171122994652406,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.orange",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.orange",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_orange.png",
          "sourceAssetKey": "glossy.sticker.food.orange",
          "runtimeAssetKey": "food_orange",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.1640625,
            "y": 0.14453125,
            "width": 0.671875,
            "height": 0.73046875
          },
          "visibleMargins": {
            "left": 0.1640625,
            "top": 0.14453125,
            "right": 0.1640625,
            "bottom": 0.125
          },
          "visibleAspect": 0.9197860962566845
        }
      }
    },
    "food.pear": {
      "canonicalFoodId": "food.pear",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-pear.png",
      "masterAssetKey": "glossy.sticker.food.pear",
      "resolvedMasterAssetKey": "glossy.sticker.food.pear",
      "subject": "pear",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.21875,
        "y": 0.1376953125,
        "width": 0.5625,
        "height": 0.724609375
      },
      "visibleMargins": {
        "left": 0.21875,
        "top": 0.1376953125,
        "right": 0.21875,
        "bottom": 0.1376953125
      },
      "visibleAspect": 0.7762803234501348,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.pear",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.pear",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pear.png",
          "sourceAssetKey": "glossy.sticker.food.pear",
          "runtimeAssetKey": "food_pear",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.21484375,
            "y": 0.13671875,
            "width": 0.5703125,
            "height": 0.7265625
          },
          "visibleMargins": {
            "left": 0.21484375,
            "top": 0.13671875,
            "right": 0.21484375,
            "bottom": 0.13671875
          },
          "visibleAspect": 0.7849462365591398
        }
      }
    },
    "food.pineapple": {
      "canonicalFoodId": "food.pineapple",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-pineapple.png",
      "masterAssetKey": "glossy.sticker.food.pineapple",
      "resolvedMasterAssetKey": "glossy.sticker.food.pineapple",
      "subject": "pineapple",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.244140625,
        "y": 0.13671875,
        "width": 0.5107421875,
        "height": 0.7265625
      },
      "visibleMargins": {
        "left": 0.244140625,
        "top": 0.13671875,
        "right": 0.2451171875,
        "bottom": 0.13671875
      },
      "visibleAspect": 0.7029569892473119,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.pineapple",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.pineapple",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pineapple.png",
          "sourceAssetKey": "owner.food.pineapple.rc24",
          "runtimeAssetKey": "food_pineapple",
          "classification": "owner-approved-generated-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.1015625,
            "y": 0.1875,
            "width": 0.77734375,
            "height": 0.6796875
          },
          "visibleMargins": {
            "left": 0.1015625,
            "top": 0.1875,
            "right": 0.12109375,
            "bottom": 0.1328125
          },
          "visibleAspect": 1.1436781609195403
        }
      }
    },
    "food.pizza": {
      "canonicalFoodId": "food.pizza",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-pizza.png",
      "masterAssetKey": "glossy.sticker.food.pizza",
      "resolvedMasterAssetKey": "glossy.sticker.food.pizza",
      "subject": "pizza slice",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.16796875,
        "y": 0.0771484375,
        "width": 0.779296875,
        "height": 0.8359375
      },
      "visibleMargins": {
        "left": 0.16796875,
        "top": 0.0771484375,
        "right": 0.052734375,
        "bottom": 0.0869140625
      },
      "visibleAspect": 0.9322429906542056,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.pizza",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pizza.png",
          "sourceAssetKey": "glossy.sticker.food.pizza",
          "runtimeAssetKey": "food_pizza",
          "classification": "exact-cross-mode-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.16015625,
            "y": 0.0703125,
            "width": 0.79296875,
            "height": 0.84765625
          },
          "visibleMargins": {
            "left": 0.16015625,
            "top": 0.0703125,
            "right": 0.046875,
            "bottom": 0.08203125
          },
          "visibleAspect": 0.9354838709677419
        }
      }
    },
    "food.pond-fish": {
      "canonicalFoodId": "food.pond-fish",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-pond-fish.png",
      "masterAssetKey": "glossy.sticker.food.pond-fish",
      "resolvedMasterAssetKey": "glossy.sticker.food.pond-fish",
      "subject": "pond fish",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1337890625,
        "y": 0.2099609375,
        "width": 0.732421875,
        "height": 0.580078125
      },
      "visibleMargins": {
        "left": 0.1337890625,
        "top": 0.2099609375,
        "right": 0.1337890625,
        "bottom": 0.2099609375
      },
      "visibleAspect": 1.2626262626262625,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.pond-fish",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.popcorn": {
      "canonicalFoodId": "food.popcorn",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_popcorn.png",
      "masterAssetKey": "firefly.food.popcorn",
      "resolvedMasterAssetKey": "firefly.food.popcorn",
      "subject": "popcorn tub",
      "rawWidth": 128,
      "rawHeight": 128,
      "visibleBounds": {
        "x": 0.1953125,
        "y": 0.15625,
        "width": 0.625,
        "height": 0.6796875
      },
      "visibleMargins": {
        "left": 0.1953125,
        "top": 0.15625,
        "right": 0.1796875,
        "bottom": 0.1640625
      },
      "visibleAspect": 0.9195402298850575,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.popcorn",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.potato": {
      "canonicalFoodId": "food.potato",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_potato.png",
      "masterAssetKey": "glossy.sticker.food.potato",
      "resolvedMasterAssetKey": "glossy.sticker.food.potato",
      "subject": "potato",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.1875,
        "y": 0.234375,
        "width": 0.640625,
        "height": 0.5625
      },
      "visibleMargins": {
        "left": 0.1875,
        "top": 0.234375,
        "right": 0.171875,
        "bottom": 0.203125
      },
      "visibleAspect": 1.1388888888888888,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.potato",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_potato.png",
          "sourceAssetKey": "glossy.sticker.food.potato",
          "runtimeAssetKey": "food_potato",
          "classification": "exact-cross-mode-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.1875,
            "y": 0.234375,
            "width": 0.640625,
            "height": 0.5625
          },
          "visibleMargins": {
            "left": 0.1875,
            "top": 0.234375,
            "right": 0.171875,
            "bottom": 0.203125
          },
          "visibleAspect": 1.1388888888888888
        }
      }
    },
    "food.potato-chips": {
      "canonicalFoodId": "food.potato-chips",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_potato_chips.png",
      "masterAssetKey": "firefly.food.potato-chips",
      "resolvedMasterAssetKey": "firefly.food.potato-chips",
      "subject": "potato chips",
      "rawWidth": 128,
      "rawHeight": 128,
      "visibleBounds": {
        "x": 0.1796875,
        "y": 0.1640625,
        "width": 0.6484375,
        "height": 0.6484375
      },
      "visibleMargins": {
        "left": 0.1796875,
        "top": 0.1640625,
        "right": 0.171875,
        "bottom": 0.1875
      },
      "visibleAspect": 1,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.potato-chips",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.pretzel": {
      "canonicalFoodId": "food.pretzel",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pretzel.png",
      "masterAssetKey": "firefly.food.pretzel",
      "resolvedMasterAssetKey": "firefly.food.pretzel",
      "subject": "pretzel",
      "rawWidth": 128,
      "rawHeight": 128,
      "visibleBounds": {
        "x": 0.1796875,
        "y": 0.2109375,
        "width": 0.6328125,
        "height": 0.5703125
      },
      "visibleMargins": {
        "left": 0.1796875,
        "top": 0.2109375,
        "right": 0.1875,
        "bottom": 0.21875
      },
      "visibleAspect": 1.1095890410958904,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.pretzel",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.pretzel",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
          "sourceAssetKey": "owner.food.pretzel.rc24",
          "runtimeAssetKey": "food_pretzel",
          "classification": "owner-approved-generated-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.14453125,
            "y": 0.1875,
            "width": 0.72265625,
            "height": 0.63671875
          },
          "visibleMargins": {
            "left": 0.14453125,
            "top": 0.1875,
            "right": 0.1328125,
            "bottom": 0.17578125
          },
          "visibleAspect": 1.1349693251533743
        }
      }
    },
    "food.red-velvet-cake": {
      "canonicalFoodId": "food.red-velvet-cake",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
      "masterAssetKey": "glossy.sticker.food.red-velvet-cake",
      "resolvedMasterAssetKey": "glossy.sticker.food.red-velvet-cake",
      "subject": "red velvet cake",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.1875,
        "y": 0.1875,
        "width": 0.625,
        "height": 0.671875
      },
      "visibleMargins": {
        "left": 0.1875,
        "top": 0.1875,
        "right": 0.1875,
        "bottom": 0.140625
      },
      "visibleAspect": 0.9302325581395349,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.red-velvet-cake",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.red-velvet-cake",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
          "sourceAssetKey": "glossy.sticker.food.red-velvet-cake",
          "runtimeAssetKey": "food_cake",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.1875,
            "y": 0.1875,
            "width": 0.625,
            "height": 0.671875
          },
          "visibleMargins": {
            "left": 0.1875,
            "top": 0.1875,
            "right": 0.1875,
            "bottom": 0.140625
          },
          "visibleAspect": 0.9302325581395349
        }
      }
    },
    "food.salmon-steak": {
      "canonicalFoodId": "food.salmon-steak",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-salmon-steak.png",
      "masterAssetKey": "glossy.sticker.food.salmon-steak",
      "resolvedMasterAssetKey": "glossy.sticker.food.salmon-steak",
      "subject": "salmon steak",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1337890625,
        "y": 0.2099609375,
        "width": 0.732421875,
        "height": 0.580078125
      },
      "visibleMargins": {
        "left": 0.1337890625,
        "top": 0.2099609375,
        "right": 0.1337890625,
        "bottom": 0.2099609375
      },
      "visibleAspect": 1.2626262626262625,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.salmon-steak",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.shrimp-skewer": {
      "canonicalFoodId": "food.shrimp-skewer",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-shrimp-skewer.png",
      "masterAssetKey": "glossy.sticker.food.shrimp-skewer",
      "resolvedMasterAssetKey": "glossy.sticker.food.shrimp-skewer",
      "subject": "shrimp skewer",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.1337890625,
        "y": 0.1591796875,
        "width": 0.732421875,
        "height": 0.681640625
      },
      "visibleMargins": {
        "left": 0.1337890625,
        "top": 0.1591796875,
        "right": 0.1337890625,
        "bottom": 0.1591796875
      },
      "visibleAspect": 1.0744985673352436,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.shrimp-skewer",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.steak": {
      "canonicalFoodId": "food.steak",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
      "masterAssetKey": "glossy.sticker.food.steak",
      "resolvedMasterAssetKey": "glossy.sticker.food.steak",
      "subject": "steak",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.02734375,
        "y": 0.10546875,
        "width": 0.94140625,
        "height": 0.78515625
      },
      "visibleMargins": {
        "left": 0.02734375,
        "top": 0.10546875,
        "right": 0.03125,
        "bottom": 0.109375
      },
      "visibleAspect": 1.199004975124378,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.steak",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.steak",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
          "sourceAssetKey": "glossy.sticker.food.steak",
          "runtimeAssetKey": "food_meat",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.02734375,
            "y": 0.10546875,
            "width": 0.94140625,
            "height": 0.78515625
          },
          "visibleMargins": {
            "left": 0.02734375,
            "top": 0.10546875,
            "right": 0.03125,
            "bottom": 0.109375
          },
          "visibleAspect": 1.199004975124378
        }
      }
    },
    "food.strawberry": {
      "canonicalFoodId": "food.strawberry",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-strawberry.png",
      "masterAssetKey": "glossy.sticker.food.strawberry",
      "resolvedMasterAssetKey": "glossy.sticker.food.strawberry",
      "subject": "strawberry",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.099609375,
        "y": 0.046875,
        "width": 0.796875,
        "height": 0.90625
      },
      "visibleMargins": {
        "left": 0.099609375,
        "top": 0.046875,
        "right": 0.103515625,
        "bottom": 0.046875
      },
      "visibleAspect": 0.8793103448275862,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.strawberry",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.strawberry",
          "profileKey": "arcade.falling-food"
        },
        {
          "mode": "puzzle",
          "surface": "board-cell",
          "foodId": "food.strawberry",
          "profileKey": "puzzle.board-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_strawberry.png",
          "sourceAssetKey": "glossy.sticker.food.strawberry",
          "runtimeAssetKey": "food_strawberry",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.09375,
            "y": 0.0390625,
            "width": 0.80859375,
            "height": 0.921875
          },
          "visibleMargins": {
            "left": 0.09375,
            "top": 0.0390625,
            "right": 0.09765625,
            "bottom": 0.0390625
          },
          "visibleAspect": 0.8771186440677966
        }
      }
    },
    "food.strawberry-cupcake": {
      "canonicalFoodId": "food.strawberry-cupcake",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
      "masterAssetKey": "glossy.sticker.food.strawberry-cupcake",
      "resolvedMasterAssetKey": "glossy.sticker.food.strawberry-cupcake",
      "subject": "strawberry cupcake",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.125,
        "y": 0.0390625,
        "width": 0.75,
        "height": 0.91015625
      },
      "visibleMargins": {
        "left": 0.125,
        "top": 0.0390625,
        "right": 0.125,
        "bottom": 0.05078125
      },
      "visibleAspect": 0.8240343347639485,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.strawberry-cupcake",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.sushi": {
      "canonicalFoodId": "food.sushi",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "masterAssetKey": "glossy.sticker.food.sushi",
      "resolvedMasterAssetKey": "glossy.sticker.food.sushi",
      "subject": "sushi",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.171875,
        "y": 0.25,
        "width": 0.65625,
        "height": 0.515625
      },
      "visibleMargins": {
        "left": 0.171875,
        "top": 0.25,
        "right": 0.171875,
        "bottom": 0.234375
      },
      "visibleAspect": 1.2727272727272727,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.sushi",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.sushi",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.sushi-roll": {
      "canonicalFoodId": "food.sushi-roll",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "masterAssetKey": "glossy.sticker.food.sushi-roll",
      "resolvedMasterAssetKey": "glossy.sticker.food.sushi-roll",
      "subject": "sushi roll",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.171875,
        "y": 0.25,
        "width": 0.65625,
        "height": 0.515625
      },
      "visibleMargins": {
        "left": 0.171875,
        "top": 0.25,
        "right": 0.171875,
        "bottom": 0.234375
      },
      "visibleAspect": 1.2727272727272727,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.sushi-roll",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.sushi-roll",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.toast": {
      "canonicalFoodId": "food.toast",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
      "masterAssetKey": "glossy.sticker.food.toast",
      "resolvedMasterAssetKey": "glossy.sticker.food.toast",
      "subject": "toast slice",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.14453125,
        "y": 0.1875,
        "width": 0.72265625,
        "height": 0.63671875
      },
      "visibleMargins": {
        "left": 0.14453125,
        "top": 0.1875,
        "right": 0.1328125,
        "bottom": 0.17578125
      },
      "visibleAspect": 1.1349693251533743,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.toast",
          "profileKey": "infinite.colony-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.tomato": {
      "canonicalFoodId": "food.tomato",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
      "masterAssetKey": "glossy.sticker.food.tomato",
      "resolvedMasterAssetKey": "glossy.sticker.food.tomato",
      "subject": "tomato",
      "rawWidth": 64,
      "rawHeight": 64,
      "visibleBounds": {
        "x": 0.046875,
        "y": 0.0625,
        "width": 0.90625,
        "height": 0.875
      },
      "visibleMargins": {
        "left": 0.046875,
        "top": 0.0625,
        "right": 0.046875,
        "bottom": 0.0625
      },
      "visibleAspect": 1.0357142857142858,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.tomato",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.tomato",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
          "sourceAssetKey": "glossy.sticker.food.tomato",
          "runtimeAssetKey": "food_tomato",
          "classification": "exact-glossy-sticker-canonical-master",
          "rawWidth": 64,
          "rawHeight": 64,
          "visibleBounds": {
            "x": 0.046875,
            "y": 0.0625,
            "width": 0.90625,
            "height": 0.875
          },
          "visibleMargins": {
            "left": 0.046875,
            "top": 0.0625,
            "right": 0.046875,
            "bottom": 0.0625
          },
          "visibleAspect": 1.0357142857142858
        }
      }
    },
    "food.udon": {
      "canonicalFoodId": "food.udon",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
      "masterAssetKey": "glossy.sticker.food.udon",
      "resolvedMasterAssetKey": "glossy.sticker.food.udon",
      "subject": "udon",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.0859375,
        "y": 0.0859375,
        "width": 0.83984375,
        "height": 0.82421875
      },
      "visibleMargins": {
        "left": 0.0859375,
        "top": 0.0859375,
        "right": 0.07421875,
        "bottom": 0.08984375
      },
      "visibleAspect": 1.018957345971564,
      "targets": [
        {
          "mode": "infinite",
          "surface": "colony-food",
          "foodId": "food.udon",
          "profileKey": "infinite.colony-food"
        },
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.udon",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.watermelon": {
      "canonicalFoodId": "food.watermelon",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-watermelon.png",
      "masterAssetKey": "glossy.sticker.food.watermelon",
      "resolvedMasterAssetKey": "glossy.sticker.food.watermelon",
      "subject": "watermelon",
      "rawWidth": 1024,
      "rawHeight": 1024,
      "visibleBounds": {
        "x": 0.14453125,
        "y": 0.140625,
        "width": 0.7099609375,
        "height": 0.73046875
      },
      "visibleMargins": {
        "left": 0.14453125,
        "top": 0.140625,
        "right": 0.1455078125,
        "bottom": 0.12890625
      },
      "visibleAspect": 0.9719251336898396,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.watermelon",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": false,
      "override": null,
      "ownerReview": null,
      "profileBounds": {}
    },
    "food.candy-corn": {
      "canonicalFoodId": "food.candy-corn",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candycorn.png",
      "masterAssetKey": "owner.food.candy-corn.rc24",
      "resolvedMasterAssetKey": "owner.food.candy-corn.rc24",
      "subject": "Candy Corn",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.203125,
        "y": 0.19921875,
        "width": 0.58984375,
        "height": 0.60546875
      },
      "visibleMargins": {
        "left": 0.203125,
        "top": 0.19921875,
        "right": 0.20703125,
        "bottom": 0.1953125
      },
      "visibleAspect": 0.9741935483870968,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.candy-corn",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candycorn.png",
          "sourceAssetKey": "owner.food.candy-corn.rc24",
          "runtimeAssetKey": "food_candycorn",
          "classification": "owner-approved-generated-master",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.203125,
            "y": 0.19921875,
            "width": 0.58984375,
            "height": 0.60546875
          },
          "visibleMargins": {
            "left": 0.203125,
            "top": 0.19921875,
            "right": 0.20703125,
            "bottom": 0.1953125
          },
          "visibleAspect": 0.9741935483870968
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.gummy-bear": {
      "canonicalFoodId": "food.gummy-bear",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_gummy_bear.png",
      "masterAssetKey": "runtime.food_gummy_bear",
      "resolvedMasterAssetKey": "runtime.food_gummy_bear",
      "subject": "Gummy Bear",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.21875,
        "y": 0.05859375,
        "width": 0.5625,
        "height": 0.859375
      },
      "visibleMargins": {
        "left": 0.21875,
        "top": 0.05859375,
        "right": 0.21875,
        "bottom": 0.08203125
      },
      "visibleAspect": 0.6545454545454545,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.gummy-bear",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_gummy_bear.png",
          "sourceAssetKey": "runtime.food_gummy_bear",
          "runtimeAssetKey": "food_gummy_bear",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.21875,
            "y": 0.05859375,
            "width": 0.5625,
            "height": 0.859375
          },
          "visibleMargins": {
            "left": 0.21875,
            "top": 0.05859375,
            "right": 0.21875,
            "bottom": 0.08203125
          },
          "visibleAspect": 0.6545454545454545
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.lollipop": {
      "canonicalFoodId": "food.lollipop",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lollipop.png",
      "masterAssetKey": "runtime.food_lollipop",
      "resolvedMasterAssetKey": "runtime.food_lollipop",
      "subject": "Lollipop",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.20703125,
        "y": 0.10546875,
        "width": 0.5859375,
        "height": 0.78515625
      },
      "visibleMargins": {
        "left": 0.20703125,
        "top": 0.10546875,
        "right": 0.20703125,
        "bottom": 0.109375
      },
      "visibleAspect": 0.746268656716418,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.lollipop",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lollipop.png",
          "sourceAssetKey": "runtime.food_lollipop",
          "runtimeAssetKey": "food_lollipop",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.20703125,
            "y": 0.10546875,
            "width": 0.5859375,
            "height": 0.78515625
          },
          "visibleMargins": {
            "left": 0.20703125,
            "top": 0.10546875,
            "right": 0.20703125,
            "bottom": 0.109375
          },
          "visibleAspect": 0.746268656716418
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.macaron": {
      "canonicalFoodId": "food.macaron",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_macaron.png",
      "masterAssetKey": "runtime.food_macaron",
      "resolvedMasterAssetKey": "runtime.food_macaron",
      "subject": "Macaron",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.09375,
        "y": 0.125,
        "width": 0.8125,
        "height": 0.75
      },
      "visibleMargins": {
        "left": 0.09375,
        "top": 0.125,
        "right": 0.09375,
        "bottom": 0.125
      },
      "visibleAspect": 1.0833333333333333,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.macaron",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_macaron.png",
          "sourceAssetKey": "runtime.food_macaron",
          "runtimeAssetKey": "food_macaron",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.09375,
            "y": 0.125,
            "width": 0.8125,
            "height": 0.75
          },
          "visibleMargins": {
            "left": 0.09375,
            "top": 0.125,
            "right": 0.09375,
            "bottom": 0.125
          },
          "visibleAspect": 1.0833333333333333
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.salmon-nigiri": {
      "canonicalFoodId": "food.salmon-nigiri",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_salmon_nigiri.png",
      "masterAssetKey": "runtime.food_salmon_nigiri",
      "resolvedMasterAssetKey": "runtime.food_salmon_nigiri",
      "subject": "Salmon Nigiri",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.05859375,
        "y": 0.1328125,
        "width": 0.89453125,
        "height": 0.72265625
      },
      "visibleMargins": {
        "left": 0.05859375,
        "top": 0.1328125,
        "right": 0.046875,
        "bottom": 0.14453125
      },
      "visibleAspect": 1.2378378378378379,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.salmon-nigiri",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_salmon_nigiri.png",
          "sourceAssetKey": "runtime.food_salmon_nigiri",
          "runtimeAssetKey": "food_salmon_nigiri",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.05859375,
            "y": 0.1328125,
            "width": 0.89453125,
            "height": 0.72265625
          },
          "visibleMargins": {
            "left": 0.05859375,
            "top": 0.1328125,
            "right": 0.046875,
            "bottom": 0.14453125
          },
          "visibleAspect": 1.2378378378378379
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.shrimp-nigiri": {
      "canonicalFoodId": "food.shrimp-nigiri",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_shrimp_nigiri.png",
      "masterAssetKey": "runtime.food_shrimp_nigiri",
      "resolvedMasterAssetKey": "runtime.food_shrimp_nigiri",
      "subject": "Shrimp Nigiri",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.078125,
        "y": 0.13671875,
        "width": 0.89453125,
        "height": 0.73046875
      },
      "visibleMargins": {
        "left": 0.078125,
        "top": 0.13671875,
        "right": 0.02734375,
        "bottom": 0.1328125
      },
      "visibleAspect": 1.2245989304812834,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.shrimp-nigiri",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_shrimp_nigiri.png",
          "sourceAssetKey": "runtime.food_shrimp_nigiri",
          "runtimeAssetKey": "food_shrimp_nigiri",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.078125,
            "y": 0.13671875,
            "width": 0.89453125,
            "height": 0.73046875
          },
          "visibleMargins": {
            "left": 0.078125,
            "top": 0.13671875,
            "right": 0.02734375,
            "bottom": 0.1328125
          },
          "visibleAspect": 1.2245989304812834
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.maki-roll": {
      "canonicalFoodId": "food.maki-roll",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_maki_roll.png",
      "masterAssetKey": "runtime.food_maki_roll",
      "resolvedMasterAssetKey": "runtime.food_maki_roll",
      "subject": "Maki Roll",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.109375,
        "y": 0.125,
        "width": 0.7890625,
        "height": 0.73046875
      },
      "visibleMargins": {
        "left": 0.109375,
        "top": 0.125,
        "right": 0.1015625,
        "bottom": 0.14453125
      },
      "visibleAspect": 1.0802139037433156,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.maki-roll",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_maki_roll.png",
          "sourceAssetKey": "runtime.food_maki_roll",
          "runtimeAssetKey": "food_maki_roll",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.109375,
            "y": 0.125,
            "width": 0.7890625,
            "height": 0.73046875
          },
          "visibleMargins": {
            "left": 0.109375,
            "top": 0.125,
            "right": 0.1015625,
            "bottom": 0.14453125
          },
          "visibleAspect": 1.0802139037433156
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.ramen": {
      "canonicalFoodId": "food.ramen",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
      "masterAssetKey": "runtime.food_ramen",
      "resolvedMasterAssetKey": "runtime.food_ramen",
      "subject": "Ramen",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.0859375,
        "y": 0.0859375,
        "width": 0.83984375,
        "height": 0.82421875
      },
      "visibleMargins": {
        "left": 0.0859375,
        "top": 0.0859375,
        "right": 0.07421875,
        "bottom": 0.08984375
      },
      "visibleAspect": 1.018957345971564,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.ramen",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
          "sourceAssetKey": "runtime.food_ramen",
          "runtimeAssetKey": "food_ramen",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.0859375,
            "y": 0.0859375,
            "width": 0.83984375,
            "height": 0.82421875
          },
          "visibleMargins": {
            "left": 0.0859375,
            "top": 0.0859375,
            "right": 0.07421875,
            "bottom": 0.08984375
          },
          "visibleAspect": 1.018957345971564
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.curry": {
      "canonicalFoodId": "food.curry",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_curry.png",
      "masterAssetKey": "runtime.food_curry",
      "resolvedMasterAssetKey": "runtime.food_curry",
      "subject": "Curry",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.05078125,
        "y": 0.0859375,
        "width": 0.90625,
        "height": 0.8515625
      },
      "visibleMargins": {
        "left": 0.05078125,
        "top": 0.0859375,
        "right": 0.04296875,
        "bottom": 0.0625
      },
      "visibleAspect": 1.0642201834862386,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.curry",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_curry.png",
          "sourceAssetKey": "runtime.food_curry",
          "runtimeAssetKey": "food_curry",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.05078125,
            "y": 0.0859375,
            "width": 0.90625,
            "height": 0.8515625
          },
          "visibleMargins": {
            "left": 0.05078125,
            "top": 0.0859375,
            "right": 0.04296875,
            "bottom": 0.0625
          },
          "visibleAspect": 1.0642201834862386
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.chili-pepper": {
      "canonicalFoodId": "food.chili-pepper",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chili_pepper.png",
      "masterAssetKey": "runtime.food_chili_pepper",
      "resolvedMasterAssetKey": "runtime.food_chili_pepper",
      "subject": "Chili Pepper",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.08203125,
        "y": 0.05859375,
        "width": 0.859375,
        "height": 0.828125
      },
      "visibleMargins": {
        "left": 0.08203125,
        "top": 0.05859375,
        "right": 0.05859375,
        "bottom": 0.11328125
      },
      "visibleAspect": 1.0377358490566038,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.chili-pepper",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chili_pepper.png",
          "sourceAssetKey": "runtime.food_chili_pepper",
          "runtimeAssetKey": "food_chili_pepper",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.08203125,
            "y": 0.05859375,
            "width": 0.859375,
            "height": 0.828125
          },
          "visibleMargins": {
            "left": 0.08203125,
            "top": 0.05859375,
            "right": 0.05859375,
            "bottom": 0.11328125
          },
          "visibleAspect": 1.0377358490566038
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.marshmallow": {
      "canonicalFoodId": "food.marshmallow",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_marshmallow.png",
      "masterAssetKey": "runtime.food_marshmallow",
      "resolvedMasterAssetKey": "runtime.food_marshmallow",
      "subject": "Marshmallow",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.08203125,
        "y": 0.09765625,
        "width": 0.8359375,
        "height": 0.77734375
      },
      "visibleMargins": {
        "left": 0.08203125,
        "top": 0.09765625,
        "right": 0.08203125,
        "bottom": 0.125
      },
      "visibleAspect": 1.0753768844221105,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.marshmallow",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_marshmallow.png",
          "sourceAssetKey": "runtime.food_marshmallow",
          "runtimeAssetKey": "food_marshmallow",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.08203125,
            "y": 0.09765625,
            "width": 0.8359375,
            "height": 0.77734375
          },
          "visibleMargins": {
            "left": 0.08203125,
            "top": 0.09765625,
            "right": 0.08203125,
            "bottom": 0.125
          },
          "visibleAspect": 1.0753768844221105
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.mochi": {
      "canonicalFoodId": "food.mochi",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_mochi.png",
      "masterAssetKey": "runtime.food_mochi",
      "resolvedMasterAssetKey": "runtime.food_mochi",
      "subject": "Mochi",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.06640625,
        "y": 0.125,
        "width": 0.8671875,
        "height": 0.73828125
      },
      "visibleMargins": {
        "left": 0.06640625,
        "top": 0.125,
        "right": 0.06640625,
        "bottom": 0.13671875
      },
      "visibleAspect": 1.1746031746031746,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.mochi",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_mochi.png",
          "sourceAssetKey": "runtime.food_mochi",
          "runtimeAssetKey": "food_mochi",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.06640625,
            "y": 0.125,
            "width": 0.8671875,
            "height": 0.73828125
          },
          "visibleMargins": {
            "left": 0.06640625,
            "top": 0.125,
            "right": 0.06640625,
            "bottom": 0.13671875
          },
          "visibleAspect": 1.1746031746031746
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.brownie": {
      "canonicalFoodId": "food.brownie",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_brownie.png",
      "masterAssetKey": "runtime.food_brownie",
      "resolvedMasterAssetKey": "runtime.food_brownie",
      "subject": "Brownie",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.06640625,
        "y": 0.09765625,
        "width": 0.87109375,
        "height": 0.81640625
      },
      "visibleMargins": {
        "left": 0.06640625,
        "top": 0.09765625,
        "right": 0.0625,
        "bottom": 0.0859375
      },
      "visibleAspect": 1.0669856459330143,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.brownie",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_brownie.png",
          "sourceAssetKey": "runtime.food_brownie",
          "runtimeAssetKey": "food_brownie",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.06640625,
            "y": 0.09765625,
            "width": 0.87109375,
            "height": 0.81640625
          },
          "visibleMargins": {
            "left": 0.06640625,
            "top": 0.09765625,
            "right": 0.0625,
            "bottom": 0.0859375
          },
          "visibleAspect": 1.0669856459330143
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.cheesecake": {
      "canonicalFoodId": "food.cheesecake",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheesecake.png",
      "masterAssetKey": "runtime.food_cheesecake",
      "resolvedMasterAssetKey": "runtime.food_cheesecake",
      "subject": "Cheesecake",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.1171875,
        "y": 0.07421875,
        "width": 0.796875,
        "height": 0.8515625
      },
      "visibleMargins": {
        "left": 0.1171875,
        "top": 0.07421875,
        "right": 0.0859375,
        "bottom": 0.07421875
      },
      "visibleAspect": 0.9357798165137615,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.cheesecake",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheesecake.png",
          "sourceAssetKey": "runtime.food_cheesecake",
          "runtimeAssetKey": "food_cheesecake",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.1171875,
            "y": 0.07421875,
            "width": 0.796875,
            "height": 0.8515625
          },
          "visibleMargins": {
            "left": 0.1171875,
            "top": 0.07421875,
            "right": 0.0859375,
            "bottom": 0.07421875
          },
          "visibleAspect": 0.9357798165137615
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.taco": {
      "canonicalFoodId": "food.taco",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_taco.png",
      "masterAssetKey": "runtime.food_taco",
      "resolvedMasterAssetKey": "runtime.food_taco",
      "subject": "Taco",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.09765625,
        "y": 0.10546875,
        "width": 0.82421875,
        "height": 0.7890625
      },
      "visibleMargins": {
        "left": 0.09765625,
        "top": 0.10546875,
        "right": 0.078125,
        "bottom": 0.10546875
      },
      "visibleAspect": 1.0445544554455446,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.taco",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_taco.png",
          "sourceAssetKey": "runtime.food_taco",
          "runtimeAssetKey": "food_taco",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.09765625,
            "y": 0.10546875,
            "width": 0.82421875,
            "height": 0.7890625
          },
          "visibleMargins": {
            "left": 0.09765625,
            "top": 0.10546875,
            "right": 0.078125,
            "bottom": 0.10546875
          },
          "visibleAspect": 1.0445544554455446
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.hot-dog": {
      "canonicalFoodId": "food.hot-dog",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_hot_dog.png",
      "masterAssetKey": "runtime.food_hot_dog",
      "resolvedMasterAssetKey": "runtime.food_hot_dog",
      "subject": "Hot Dog",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.05859375,
        "y": 0.171875,
        "width": 0.89453125,
        "height": 0.65625
      },
      "visibleMargins": {
        "left": 0.05859375,
        "top": 0.171875,
        "right": 0.046875,
        "bottom": 0.171875
      },
      "visibleAspect": 1.3630952380952381,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.hot-dog",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_hot_dog.png",
          "sourceAssetKey": "runtime.food_hot_dog",
          "runtimeAssetKey": "food_hot_dog",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.05859375,
            "y": 0.171875,
            "width": 0.89453125,
            "height": 0.65625
          },
          "visibleMargins": {
            "left": 0.05859375,
            "top": 0.171875,
            "right": 0.046875,
            "bottom": 0.171875
          },
          "visibleAspect": 1.3630952380952381
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.chicken-nuggets": {
      "canonicalFoodId": "food.chicken-nuggets",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken_nuggets.png",
      "masterAssetKey": "runtime.food_chicken_nuggets",
      "resolvedMasterAssetKey": "runtime.food_chicken_nuggets",
      "subject": "Chicken Nuggets",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.0625,
        "y": 0.09765625,
        "width": 0.86328125,
        "height": 0.8046875
      },
      "visibleMargins": {
        "left": 0.0625,
        "top": 0.09765625,
        "right": 0.07421875,
        "bottom": 0.09765625
      },
      "visibleAspect": 1.0728155339805825,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.chicken-nuggets",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken_nuggets.png",
          "sourceAssetKey": "runtime.food_chicken_nuggets",
          "runtimeAssetKey": "food_chicken_nuggets",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.0625,
            "y": 0.09765625,
            "width": 0.86328125,
            "height": 0.8046875
          },
          "visibleMargins": {
            "left": 0.0625,
            "top": 0.09765625,
            "right": 0.07421875,
            "bottom": 0.09765625
          },
          "visibleAspect": 1.0728155339805825
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.onion-rings": {
      "canonicalFoodId": "food.onion-rings",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_onion_rings.png",
      "masterAssetKey": "runtime.food_onion_rings",
      "resolvedMasterAssetKey": "runtime.food_onion_rings",
      "subject": "Onion Rings",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.125,
        "y": 0.0546875,
        "width": 0.76171875,
        "height": 0.88671875
      },
      "visibleMargins": {
        "left": 0.125,
        "top": 0.0546875,
        "right": 0.11328125,
        "bottom": 0.05859375
      },
      "visibleAspect": 0.8590308370044053,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.onion-rings",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_onion_rings.png",
          "sourceAssetKey": "runtime.food_onion_rings",
          "runtimeAssetKey": "food_onion_rings",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.125,
            "y": 0.0546875,
            "width": 0.76171875,
            "height": 0.88671875
          },
          "visibleMargins": {
            "left": 0.125,
            "top": 0.0546875,
            "right": 0.11328125,
            "bottom": 0.05859375
          },
          "visibleAspect": 0.8590308370044053
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.whole-fish": {
      "canonicalFoodId": "food.whole-fish",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_whole_fish.png",
      "masterAssetKey": "runtime.food_whole_fish",
      "resolvedMasterAssetKey": "runtime.food_whole_fish",
      "subject": "Whole Fish",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.01953125,
        "y": 0.18359375,
        "width": 0.96484375,
        "height": 0.60546875
      },
      "visibleMargins": {
        "left": 0.01953125,
        "top": 0.18359375,
        "right": 0.015625,
        "bottom": 0.2109375
      },
      "visibleAspect": 1.5935483870967742,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.whole-fish",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_whole_fish.png",
          "sourceAssetKey": "runtime.food_whole_fish",
          "runtimeAssetKey": "food_whole_fish",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.01953125,
            "y": 0.18359375,
            "width": 0.96484375,
            "height": 0.60546875
          },
          "visibleMargins": {
            "left": 0.01953125,
            "top": 0.18359375,
            "right": 0.015625,
            "bottom": 0.2109375
          },
          "visibleAspect": 1.5935483870967742
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.fruit-bowl": {
      "canonicalFoodId": "food.fruit-bowl",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fruit_bowl.png",
      "masterAssetKey": "runtime.food_fruit_bowl",
      "resolvedMasterAssetKey": "runtime.food_fruit_bowl",
      "subject": "Fruit Bowl",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.0859375,
        "y": 0.109375,
        "width": 0.8359375,
        "height": 0.7890625
      },
      "visibleMargins": {
        "left": 0.0859375,
        "top": 0.109375,
        "right": 0.078125,
        "bottom": 0.1015625
      },
      "visibleAspect": 1.0594059405940595,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.fruit-bowl",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fruit_bowl.png",
          "sourceAssetKey": "runtime.food_fruit_bowl",
          "runtimeAssetKey": "food_fruit_bowl",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.0859375,
            "y": 0.109375,
            "width": 0.8359375,
            "height": 0.7890625
          },
          "visibleMargins": {
            "left": 0.0859375,
            "top": 0.109375,
            "right": 0.078125,
            "bottom": 0.1015625
          },
          "visibleAspect": 1.0594059405940595
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.watermelon-slice": {
      "canonicalFoodId": "food.watermelon-slice",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_watermelon_slice.png",
      "masterAssetKey": "runtime.food_watermelon_slice",
      "resolvedMasterAssetKey": "runtime.food_watermelon_slice",
      "subject": "Watermelon Slice",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.09375,
        "y": 0.0859375,
        "width": 0.8203125,
        "height": 0.80078125
      },
      "visibleMargins": {
        "left": 0.09375,
        "top": 0.0859375,
        "right": 0.0859375,
        "bottom": 0.11328125
      },
      "visibleAspect": 1.024390243902439,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.watermelon-slice",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_watermelon_slice.png",
          "sourceAssetKey": "runtime.food_watermelon_slice",
          "runtimeAssetKey": "food_watermelon_slice",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.09375,
            "y": 0.0859375,
            "width": 0.8203125,
            "height": 0.80078125
          },
          "visibleMargins": {
            "left": 0.09375,
            "top": 0.0859375,
            "right": 0.0859375,
            "bottom": 0.11328125
          },
          "visibleAspect": 1.024390243902439
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.cinnamon-roll": {
      "canonicalFoodId": "food.cinnamon-roll",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
      "masterAssetKey": "runtime.food_cinnamon_roll",
      "resolvedMasterAssetKey": "runtime.food_cinnamon_roll",
      "subject": "Cinnamon Roll",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.05078125,
        "y": 0.07421875,
        "width": 0.8984375,
        "height": 0.8359375
      },
      "visibleMargins": {
        "left": 0.05078125,
        "top": 0.07421875,
        "right": 0.05078125,
        "bottom": 0.08984375
      },
      "visibleAspect": 1.074766355140187,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.cinnamon-roll",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
          "sourceAssetKey": "runtime.food_cinnamon_roll",
          "runtimeAssetKey": "food_cinnamon_roll",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.05078125,
            "y": 0.07421875,
            "width": 0.8984375,
            "height": 0.8359375
          },
          "visibleMargins": {
            "left": 0.05078125,
            "top": 0.07421875,
            "right": 0.05078125,
            "bottom": 0.08984375
          },
          "visibleAspect": 1.074766355140187
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.milkshake": {
      "canonicalFoodId": "food.milkshake",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_milkshake.png",
      "masterAssetKey": "runtime.food_milkshake",
      "resolvedMasterAssetKey": "runtime.food_milkshake",
      "subject": "Milkshake",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.1875,
        "y": 0.04296875,
        "width": 0.62890625,
        "height": 0.890625
      },
      "visibleMargins": {
        "left": 0.1875,
        "top": 0.04296875,
        "right": 0.18359375,
        "bottom": 0.06640625
      },
      "visibleAspect": 0.706140350877193,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.milkshake",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_milkshake.png",
          "sourceAssetKey": "runtime.food_milkshake",
          "runtimeAssetKey": "food_milkshake",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.1875,
            "y": 0.04296875,
            "width": 0.62890625,
            "height": 0.890625
          },
          "visibleMargins": {
            "left": 0.1875,
            "top": 0.04296875,
            "right": 0.18359375,
            "bottom": 0.06640625
          },
          "visibleAspect": 0.706140350877193
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.cotton-candy": {
      "canonicalFoodId": "food.cotton-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cotton_candy.png",
      "masterAssetKey": "runtime.food_cotton_candy",
      "resolvedMasterAssetKey": "runtime.food_cotton_candy",
      "subject": "Cotton Candy",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.1484375,
        "y": 0.05078125,
        "width": 0.71875,
        "height": 0.8984375
      },
      "visibleMargins": {
        "left": 0.1484375,
        "top": 0.05078125,
        "right": 0.1328125,
        "bottom": 0.05078125
      },
      "visibleAspect": 0.8,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.cotton-candy",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cotton_candy.png",
          "sourceAssetKey": "runtime.food_cotton_candy",
          "runtimeAssetKey": "food_cotton_candy",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.1484375,
            "y": 0.05078125,
            "width": 0.71875,
            "height": 0.8984375
          },
          "visibleMargins": {
            "left": 0.1484375,
            "top": 0.05078125,
            "right": 0.1328125,
            "bottom": 0.05078125
          },
          "visibleAspect": 0.8
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.peach": {
      "canonicalFoodId": "food.peach",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_peach.png",
      "masterAssetKey": "runtime.food_peach",
      "resolvedMasterAssetKey": "runtime.food_peach",
      "subject": "Peach",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.0703125,
        "y": 0.07421875,
        "width": 0.859375,
        "height": 0.828125
      },
      "visibleMargins": {
        "left": 0.0703125,
        "top": 0.07421875,
        "right": 0.0703125,
        "bottom": 0.09765625
      },
      "visibleAspect": 1.0377358490566038,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.peach",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_peach.png",
          "sourceAssetKey": "runtime.food_peach",
          "runtimeAssetKey": "food_peach",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.0703125,
            "y": 0.07421875,
            "width": 0.859375,
            "height": 0.828125
          },
          "visibleMargins": {
            "left": 0.0703125,
            "top": 0.07421875,
            "right": 0.0703125,
            "bottom": 0.09765625
          },
          "visibleAspect": 1.0377358490566038
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.raspberry": {
      "canonicalFoodId": "food.raspberry",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_raspberry.png",
      "masterAssetKey": "runtime.food_raspberry",
      "resolvedMasterAssetKey": "runtime.food_raspberry",
      "subject": "Raspberry",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.15234375,
        "y": 0.125,
        "width": 0.703125,
        "height": 0.734375
      },
      "visibleMargins": {
        "left": 0.15234375,
        "top": 0.125,
        "right": 0.14453125,
        "bottom": 0.140625
      },
      "visibleAspect": 0.9574468085106383,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.raspberry",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_raspberry.png",
          "sourceAssetKey": "runtime.food_raspberry",
          "runtimeAssetKey": "food_raspberry",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.15234375,
            "y": 0.125,
            "width": 0.703125,
            "height": 0.734375
          },
          "visibleMargins": {
            "left": 0.15234375,
            "top": 0.125,
            "right": 0.14453125,
            "bottom": 0.140625
          },
          "visibleAspect": 0.9574468085106383
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.dragon-fruit": {
      "canonicalFoodId": "food.dragon-fruit",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_dragon_fruit.png",
      "masterAssetKey": "runtime.food_dragon_fruit",
      "resolvedMasterAssetKey": "runtime.food_dragon_fruit",
      "subject": "Dragon Fruit",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.078125,
        "y": 0.07421875,
        "width": 0.84375,
        "height": 0.83984375
      },
      "visibleMargins": {
        "left": 0.078125,
        "top": 0.07421875,
        "right": 0.078125,
        "bottom": 0.0859375
      },
      "visibleAspect": 1.0046511627906978,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.dragon-fruit",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_dragon_fruit.png",
          "sourceAssetKey": "runtime.food_dragon_fruit",
          "runtimeAssetKey": "food_dragon_fruit",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.078125,
            "y": 0.07421875,
            "width": 0.84375,
            "height": 0.83984375
          },
          "visibleMargins": {
            "left": 0.078125,
            "top": 0.07421875,
            "right": 0.078125,
            "bottom": 0.0859375
          },
          "visibleAspect": 1.0046511627906978
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.golden-apple": {
      "canonicalFoodId": "food.golden-apple",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_golden_apple.png",
      "masterAssetKey": "runtime.food_golden_apple",
      "resolvedMasterAssetKey": "runtime.food_golden_apple",
      "subject": "Golden Apple",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.1484375,
        "y": 0.09765625,
        "width": 0.70703125,
        "height": 0.76171875
      },
      "visibleMargins": {
        "left": 0.1484375,
        "top": 0.09765625,
        "right": 0.14453125,
        "bottom": 0.140625
      },
      "visibleAspect": 0.9282051282051282,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.golden-apple",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_golden_apple.png",
          "sourceAssetKey": "runtime.food_golden_apple",
          "runtimeAssetKey": "food_golden_apple",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.1484375,
            "y": 0.09765625,
            "width": 0.70703125,
            "height": 0.76171875
          },
          "visibleMargins": {
            "left": 0.1484375,
            "top": 0.09765625,
            "right": 0.14453125,
            "bottom": 0.140625
          },
          "visibleAspect": 0.9282051282051282
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.jelly-beans": {
      "canonicalFoodId": "food.jelly-beans",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_jelly_beans.png",
      "masterAssetKey": "runtime.food_jelly_beans",
      "resolvedMasterAssetKey": "runtime.food_jelly_beans",
      "subject": "Jelly Beans",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.046875,
        "y": 0.140625,
        "width": 0.90625,
        "height": 0.72265625
      },
      "visibleMargins": {
        "left": 0.046875,
        "top": 0.140625,
        "right": 0.046875,
        "bottom": 0.13671875
      },
      "visibleAspect": 1.2540540540540541,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.jelly-beans",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_jelly_beans.png",
          "sourceAssetKey": "runtime.food_jelly_beans",
          "runtimeAssetKey": "food_jelly_beans",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.046875,
            "y": 0.140625,
            "width": 0.90625,
            "height": 0.72265625
          },
          "visibleMargins": {
            "left": 0.046875,
            "top": 0.140625,
            "right": 0.046875,
            "bottom": 0.13671875
          },
          "visibleAspect": 1.2540540540540541
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    },
    "food.jewel-candy": {
      "canonicalFoodId": "food.jewel-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_jewel_candy.png",
      "masterAssetKey": "runtime.food_jewel_candy",
      "resolvedMasterAssetKey": "runtime.food_jewel_candy",
      "subject": "Jewel Candy",
      "rawWidth": 256,
      "rawHeight": 256,
      "visibleBounds": {
        "x": 0.04296875,
        "y": 0.19921875,
        "width": 0.91015625,
        "height": 0.62890625
      },
      "visibleMargins": {
        "left": 0.04296875,
        "top": 0.19921875,
        "right": 0.046875,
        "bottom": 0.171875
      },
      "visibleAspect": 1.4472049689440993,
      "targets": [
        {
          "mode": "arcade",
          "surface": "falling-food",
          "foodId": "food.jewel-candy",
          "profileKey": "arcade.falling-food"
        }
      ],
      "runtimeActive": true,
      "arcadeRuntimeActive": true,
      "override": null,
      "ownerReview": null,
      "profileBounds": {
        "arcade.falling-food": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_jewel_candy.png",
          "sourceAssetKey": "runtime.food_jewel_candy",
          "runtimeAssetKey": "food_jewel_candy",
          "classification": "approved-runtime-derivative",
          "rawWidth": 256,
          "rawHeight": 256,
          "visibleBounds": {
            "x": 0.04296875,
            "y": 0.19921875,
            "width": 0.91015625,
            "height": 0.62890625
          },
          "visibleMargins": {
            "left": 0.04296875,
            "top": 0.19921875,
            "right": 0.046875,
            "bottom": 0.171875
          },
          "visibleAspect": 1.4472049689440993
        }
      },
      "presentationClass": "approved-arcade-runtime-image"
    }
  }
});

const FoodPresentationRegistry = (() => {
  'use strict';
  const foods = Object.freeze(FROGGY_FOOD_PRESENTATION.foods || {});
  const profiles = Object.freeze(FROGGY_FOOD_PRESENTATION.profiles || {});
  const aliases = Object.freeze(FROGGY_FOOD_PRESENTATION.profileAliases || {});
  function get(foodId) { return foods[String(foodId || '')] || null; }
  function profile(key) { return profiles[String(key || '')] || null; }
  function profileKeyFor(mode, surface) { const requested = String(mode || '') + '.' + String(surface || ''); return aliases[requested] || requested; }
  function profileFor(mode, surface) { return profile(profileKeyFor(mode, surface)); }
  function list() { return Object.freeze(Object.values(foods)); }
  return Object.freeze({ get, profile, profileFor, profileKeyFor, list, policy: FROGGY_FOOD_PRESENTATION.policy });
})();

if (typeof globalThis !== 'undefined') { globalThis.FROGGY_FOOD_PRESENTATION = FROGGY_FOOD_PRESENTATION; globalThis.FoodPresentationRegistry = FoodPresentationRegistry; }
