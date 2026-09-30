// GENERATED FILE — DO NOT EDIT.
// Sources: content/assets/asset-provenance.json + content/assets/firefly-food-priority-2026-07-05.json | Run: npm run assets:generate
// This is the runtime projection; the complete provenance/review ledger remains source-only.

const FROGGY_ASSET_PROVENANCE = Object.freeze({
  "schemaVersion": 1,
  "policy": {
    "purpose": "Runtime semantic asset resolution and owned fallback policy.",
    "fallbackPolicy": "Production renderers must never silently substitute a native emoji for a missing approved asset."
  },
  "priorityMappings": [
    {
      "targetAssetKey": "infinite.food.blackberry",
      "priorityAssetKey": "firefly.food.blackberries-02"
    },
    {
      "targetAssetKey": "infinite.food.blueberry",
      "priorityAssetKey": "firefly.food.blueberries"
    },
    {
      "targetAssetKey": "infinite.food.bread",
      "priorityAssetKey": "firefly.food.bread"
    },
    {
      "targetAssetKey": "infinite.food.brownie",
      "priorityAssetKey": "firefly.food.brownie"
    },
    {
      "targetAssetKey": "infinite.food.candy-cane",
      "priorityAssetKey": "firefly.food.candy-cane"
    },
    {
      "targetAssetKey": "infinite.food.cheese",
      "priorityAssetKey": "firefly.food.cheese-wedge-small"
    },
    {
      "targetAssetKey": "infinite.food.cherry",
      "priorityAssetKey": "firefly.food.cherries"
    },
    {
      "targetAssetKey": "infinite.food.cinnamon-roll",
      "priorityAssetKey": "firefly.food.cinnamon-roll"
    },
    {
      "targetAssetKey": "infinite.food.cookie",
      "priorityAssetKey": "firefly.food.chocolate-chip-cookie"
    },
    {
      "targetAssetKey": "infinite.food.crackers",
      "priorityAssetKey": "firefly.food.crackers"
    },
    {
      "targetAssetKey": "infinite.food.cupcake",
      "priorityAssetKey": "firefly.food.cupcake"
    },
    {
      "targetAssetKey": "infinite.food.donut",
      "priorityAssetKey": "firefly.food.strawberry-donut"
    },
    {
      "targetAssetKey": "infinite.food.eclair",
      "priorityAssetKey": "firefly.food.chocolate-eclair"
    },
    {
      "targetAssetKey": "infinite.food.fries",
      "priorityAssetKey": "firefly.food.french-fries"
    },
    {
      "targetAssetKey": "infinite.food.gummy-bear",
      "priorityAssetKey": "firefly.food.gummy-bear"
    },
    {
      "targetAssetKey": "infinite.food.ice-cream-cone",
      "priorityAssetKey": "firefly.food.strawberry-ice-cream-cone"
    },
    {
      "targetAssetKey": "infinite.food.jelly",
      "priorityAssetKey": "firefly.food.red-jelly"
    },
    {
      "targetAssetKey": "infinite.food.kiwi",
      "priorityAssetKey": "firefly.food.kiwi"
    },
    {
      "targetAssetKey": "infinite.food.lemon",
      "priorityAssetKey": "firefly.food.lemon"
    },
    {
      "targetAssetKey": "infinite.food.lime",
      "priorityAssetKey": "firefly.food.lime"
    },
    {
      "targetAssetKey": "infinite.food.lollipop",
      "priorityAssetKey": "firefly.food.lollipop"
    },
    {
      "targetAssetKey": "infinite.food.macaron",
      "priorityAssetKey": "firefly.food.pink-macaron"
    },
    {
      "targetAssetKey": "infinite.food.meatballs",
      "priorityAssetKey": "firefly.food.meatballs"
    },
    {
      "targetAssetKey": "infinite.food.milkshake",
      "priorityAssetKey": "firefly.food.strawberry-milkshake"
    },
    {
      "targetAssetKey": "infinite.food.muffin",
      "priorityAssetKey": "firefly.food.blueberry-muffin"
    },
    {
      "targetAssetKey": "infinite.food.nachos",
      "priorityAssetKey": "firefly.food.nachos"
    },
    {
      "targetAssetKey": "infinite.food.orange",
      "priorityAssetKey": "firefly.food.orange"
    },
    {
      "targetAssetKey": "infinite.food.papaya",
      "priorityAssetKey": "firefly.food.papaya"
    },
    {
      "targetAssetKey": "infinite.food.passion-fruit",
      "priorityAssetKey": "firefly.food.passionfruit-half"
    },
    {
      "targetAssetKey": "infinite.food.peach",
      "priorityAssetKey": "firefly.food.peach"
    },
    {
      "targetAssetKey": "infinite.food.pear",
      "priorityAssetKey": "firefly.food.pear"
    },
    {
      "targetAssetKey": "infinite.food.pomegranate",
      "priorityAssetKey": "firefly.food.pomegranate"
    },
    {
      "targetAssetKey": "infinite.food.popcorn",
      "priorityAssetKey": "firefly.food.popcorn"
    },
    {
      "targetAssetKey": "infinite.food.potato-chips",
      "priorityAssetKey": "firefly.food.potato-chips"
    },
    {
      "targetAssetKey": "infinite.food.pretzel",
      "priorityAssetKey": "firefly.food.pretzel"
    },
    {
      "targetAssetKey": "infinite.food.raspberry",
      "priorityAssetKey": "firefly.food.raspberries"
    },
    {
      "targetAssetKey": "infinite.food.roast-chicken",
      "priorityAssetKey": "firefly.food.roast-chicken"
    },
    {
      "targetAssetKey": "infinite.food.steak",
      "priorityAssetKey": "firefly.food.steak"
    },
    {
      "targetAssetKey": "infinite.food.strawberry",
      "priorityAssetKey": "firefly.food.strawberry"
    },
    {
      "targetAssetKey": "infinite.food.sundae",
      "priorityAssetKey": "firefly.food.fruit-sundae"
    },
    {
      "targetAssetKey": "infinite.food.tortilla-chips",
      "priorityAssetKey": "firefly.food.tortilla-chips"
    }
  ],
  "assets": [
    {
      "assetKey": "arcade.food.blueberry",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_blueberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_blueberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.broccoli",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.burger",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_burger.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_burger.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.carrot",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_carrot.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_carrot.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.cheese",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.cherry",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cherry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cherry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.cookie",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cookie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cookie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.corn",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candycorn.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candycorn.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.cupcake",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.donut",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/feastfall/emoji-standard-2026-07-08/masters-1024/donut.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/feastfall/emoji-standard-2026-07-08/masters-1024/donut.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.fried-chicken",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.fries",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fries.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fries.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.hard-candy",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candy.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candy.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.ice-cream-cone",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.kiwi",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_kiwi.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_kiwi.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.lemon",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lemon.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lemon.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.orange",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_orange.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_orange.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.pear",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pear.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pear.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.pineapple",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pineapple.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pineapple.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.red-velvet-cake",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.steak",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.strawberry",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_strawberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_strawberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.sushi",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.sushi-roll",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.tomato",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.food.udon",
      "role": "arcade-falling-food",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.hazard.bomb",
      "role": "arcade-falling-nonfood",
      "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-hazard-bomb.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-hazard-bomb.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.hazard.caution",
      "role": "arcade-falling-nonfood",
      "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-hazard-caution.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-hazard-caution.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.hazard.fire",
      "role": "arcade-falling-nonfood",
      "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-hazard-fire.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-hazard-fire.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.pickup.gift",
      "role": "arcade-falling-nonfood",
      "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-gift.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-gift.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.pickup.heart.blue",
      "role": "arcade-falling-nonfood",
      "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-heart-blue.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-heart-blue.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.pickup.heart.red",
      "role": "arcade-falling-nonfood",
      "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-heart-red.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-heart-red.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.pickup.sun",
      "role": "arcade-falling-nonfood",
      "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-sun.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-sun.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.pickup.syringe",
      "role": "arcade-falling-nonfood",
      "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-syringe.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-p0-nonfood-approved-2026-07-07/masters/arcade-pickup-syringe.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.powerup.candy.haste",
      "role": "arcade-powerup-jeweled-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-haste.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-haste.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.powerup.candy.magnet",
      "role": "arcade-powerup-jeweled-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-magnet.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-magnet.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.powerup.candy.portal",
      "role": "arcade-powerup-jeweled-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-portal.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-portal.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.powerup.candy.royal",
      "role": "arcade-powerup-jeweled-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-royal.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-royal.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.powerup.candy.shield",
      "role": "arcade-powerup-jeweled-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-shield.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-shield.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.powerup.candy.star",
      "role": "arcade-powerup-jeweled-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-star.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-star.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.powerup.candy.sword",
      "role": "arcade-powerup-jeweled-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-sword.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-sword.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "arcade.powerup.candy.time",
      "role": "arcade-powerup-jeweled-candy",
      "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-time.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-powerup-candies-v1/masters/arcade-powerup-candy-time.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.bob",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/bob.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/bob.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.chomper",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/chomper.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/chomper.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.classic",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/classic.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/classic.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.count",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/count.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/count.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.fire",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/fire.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/fire.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.flytrap",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/flytrap.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/flytrap.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.gulper",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/gulper.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/gulper.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.pelican",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/pelican.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/pelican.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.princess",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/curated-highres/princess/lilly_idle_1f_512_2026-09-08.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/curated-highres/princess/lilly_idle_1f_512_2026-09-08.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "character.portrait.royal",
      "role": "character-select-portrait",
      "sourcePath": "assets/images/characters/runtime-select/royal.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/characters/runtime-select/royal.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.blackberries-02",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_blackberries_02.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_blackberries_02.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.blueberries",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_blueberries.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_blueberries.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.blueberry-muffin",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_blueberry_muffin.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_blueberry_muffin.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.bread",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_bread.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_bread.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.brownie",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_brownie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_brownie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.candy-cane",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_candy_cane.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_candy_cane.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.cheese-wedge-small",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_cheese_wedge_small.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_cheese_wedge_small.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.cherries",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_cherries.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_cherries.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.chocolate-chip-cookie",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_chocolate_chip_cookie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_chocolate_chip_cookie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.chocolate-eclair",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_chocolate_eclair.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_chocolate_eclair.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.cinnamon-roll",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_cinnamon_roll.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_cinnamon_roll.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.coconut",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_coconut.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_coconut.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.crackers",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_crackers.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_crackers.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.cupcake",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_cupcake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_cupcake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.french-fries",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_french_fries.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_french_fries.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.fruit-sundae",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_fruit_sundae.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_fruit_sundae.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.grapes",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_grapes.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_grapes.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.gummy-bear",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_gummy_bear.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_gummy_bear.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.kiwi",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_kiwi.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_kiwi.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.lemon",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_lemon.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_lemon.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.lime",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_lime.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_lime.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.lollipop",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_lollipop.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_lollipop.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.mango",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_mango.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_mango.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.meatballs",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_meatballs.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_meatballs.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.nachos",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_nachos.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_nachos.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.orange",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_orange.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_orange.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.papaya",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_papaya.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_papaya.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.passionfruit-half",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_passionfruit_half.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_passionfruit_half.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.peach",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_peach.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_peach.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.pear",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pear.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pear.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.pink-macaron",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pink_macaron.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pink_macaron.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.pomegranate",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pomegranate.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pomegranate.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.popcorn",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_popcorn.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_popcorn.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.potato-chips",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_potato_chips.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_potato_chips.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.pretzel",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pretzel.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_pretzel.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.raspberries",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_raspberries.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_raspberries.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.red-apple",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_red_apple.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_red_apple.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.red-jelly",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_red_jelly.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_red_jelly.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.roast-chicken",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_roast_chicken.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_roast_chicken.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.steak",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_steak.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_steak.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.strawberry",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_strawberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_strawberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.strawberry-donut",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_strawberry_donut.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_strawberry_donut.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.strawberry-ice-cream-cone",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_strawberry_ice_cream_cone.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_strawberry_ice_cream_cone.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.strawberry-milkshake",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_strawberry_milkshake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_strawberry_milkshake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.tortilla-chips",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_tortilla_chips.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_tortilla_chips.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "firefly.food.watermelon-slice",
      "role": "firefly-food-master-library",
      "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_watermelon_slice.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-firefly-2026-07-05/raw/food_watermelon_slice.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.apple",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-apple.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-apple.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.avocado",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-avocado.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-avocado.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.bagel",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/feastfall/emoji-standard-2026-07-08/masters-1024/donut.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/feastfall/emoji-standard-2026-07-08/masters-1024/donut.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.banana",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-banana.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-banana.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.blueberry",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-blueberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-blueberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.broccoli",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.burger",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-burger.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-burger.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.carrot",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_carrot.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_carrot.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.cheese",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.cherry",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cherry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cherry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.chocolate",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_brownie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_brownie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.coconut",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-coconut.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-coconut.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.cookie",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-cookie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-cookie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.corn",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-corn.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-corn.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.croissant",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.cupcake",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-cupcake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-cupcake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.donut",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-donut.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-donut.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.fried-chicken",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.fries",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-fries.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-fries.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.grapes",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-grapes.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-grapes.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.hard-candy",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candy.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candy.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.hot-sauce",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chili_pepper.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chili_pepper.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.ice-cream-cone",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.ketchup",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.kiwi",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-kiwi.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-kiwi.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.lemon",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-lemon.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-lemon.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.mango",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-mango.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-mango.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.melon",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-melon.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-melon.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.nachos",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.orange",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-orange.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-orange.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.pancake",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.pear",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-pear.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-pear.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.pineapple",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-pineapple.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-pineapple.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.pizza",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-pizza.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-pizza.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.pond-fish",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-pond-fish.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-pond-fish.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.popcorn",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.potato",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_potato.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_potato.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.potato-chips",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.pretzel",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.red-velvet-cake",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.salmon-steak",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-salmon-steak.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-salmon-steak.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.shrimp-skewer",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-shrimp-skewer.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/all-remaining-02/masters/food-shrimp-skewer.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.steak",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.strawberry",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-strawberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-strawberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.strawberry-cupcake",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.sushi",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.sushi-roll",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.toast",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.tomato",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.udon",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.waffle",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "glossy.sticker.food.watermelon",
      "role": "canonical-food-master",
      "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-watermelon.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-glossy-sticker-v2/fruit-produce-01/masters/food-watermelon.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.biome.bakery",
      "role": "biome-tile",
      "sourcePath": "assets/infinite/biomes/bakery.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/infinite/biomes/bakery.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.biome.farm",
      "role": "biome-tile",
      "sourcePath": "assets/infinite/biomes/farm.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/infinite/biomes/farm.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.biome.forest",
      "role": "biome-tile",
      "sourcePath": "assets/infinite/biomes/forest.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/infinite/biomes/forest.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.biome.lake",
      "role": "biome-tile",
      "sourcePath": "assets/infinite/biomes/lake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/infinite/biomes/lake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.building.compost",
      "role": "colony-station",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/compost.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/compost.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.building.feeding",
      "role": "colony-station",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/feeding.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/feeding.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.building.granary",
      "role": "colony-station",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/granary.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/granary.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.building.lookout",
      "role": "colony-station",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/lookout.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/lookout.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.building.market",
      "role": "colony-station",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/market.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/market.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.building.nursery",
      "role": "colony-station",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/nursery.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/nursery.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.building.reclaimer",
      "role": "colony-station",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/reclaimer.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/buildings/reclaimer.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.effect.food-burst",
      "role": "effect",
      "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/effects/food-burst.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/effects/food-burst.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.effect.golden-sparkle",
      "role": "effect",
      "sourcePath": "assets/infinite/food/_golden_sparkle.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/infinite/food/_golden_sparkle.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.avocado-toast",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_avocado.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_avocado.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.bacon",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.bagel",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/feastfall/emoji-standard-2026-07-08/masters-1024/donut.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/feastfall/emoji-standard-2026-07-08/masters-1024/donut.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.baked-potato",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_potato.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_potato.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.blackberry",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_blueberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_blueberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.blueberry",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_blueberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_blueberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.bread",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.bread-roll",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.broccoli",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.brownie",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_brownie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_brownie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.burger",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_burger.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_burger.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.burrito",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_taco.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_taco.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.caesar-salad",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_broccoli.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.candy-cane",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lollipop.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lollipop.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.carrot",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_carrot.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_carrot.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.carrot-cake",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.cheese",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.cherry",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cherry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cherry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.cinnamon-roll",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.cookie",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cookie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cookie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.corn",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candycorn.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candycorn.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.crackers",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cookie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cookie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.cricket",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.croissant",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.cupcake",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.donut",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/feastfall/emoji-standard-2026-07-08/masters-1024/donut.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/feastfall/emoji-standard-2026-07-08/masters-1024/donut.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.eclair",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheesecake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheesecake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.fried-chicken",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.fried-egg",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheese.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.fried-rice",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_curry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_curry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.fries",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fries.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fries.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.gummy-bear",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_gummy_bear.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_gummy_bear.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.hard-candy",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candy.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_candy.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.hot-cocoa",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_milkshake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_milkshake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.hot-dog",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_hot_dog.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_hot_dog.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.hot-sauce",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chili_pepper.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chili_pepper.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.ice-cream-cone",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.ice-cream-cup",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.jelly",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_jelly_beans.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_jelly_beans.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.ketchup",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.kiwi",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_kiwi.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_kiwi.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.lemon",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lemon.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lemon.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.lime",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lemon.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lemon.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.lollipop",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lollipop.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_lollipop.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.macaron",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_macaron.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_macaron.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.meatballs",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken_nuggets.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken_nuggets.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.milkshake",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_milkshake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_milkshake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.miso-soup",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.mixed-nuts",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_jelly_beans.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_jelly_beans.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.muffin",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.nachos",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.nigiri",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_salmon_nigiri.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_salmon_nigiri.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.onion-rings",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_onion_rings.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_onion_rings.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.orange",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_orange.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_orange.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.pancake",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.papaya",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_mango.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_mango.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.passion-fruit",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_dragon_fruit.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_dragon_fruit.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.peach",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_peach.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_peach.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.pear",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pear.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pear.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.pineapple",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pineapple.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pineapple.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.pomegranate",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_raspberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_raspberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.pond-fish",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_whole_fish.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_whole_fish.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.popcorn",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.potato-chips",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.pretzel",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.pudding",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheesecake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cheesecake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.pumpkin",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_orange.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_orange.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.raspberry",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_raspberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_raspberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.red-velvet-cake",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cake.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.roast-chicken",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_chicken.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.salad",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fruit_bowl.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_fruit_bowl.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.salmon-steak",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.shrimp-skewer",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_shrimp_nigiri.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_shrimp_nigiri.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.spring-roll",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.starfruit",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_golden_apple.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_golden_apple.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.steak",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_meat.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.strawberry",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_strawberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_strawberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.strawberry-cupcake",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cupcake.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.sundae",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_icecream.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.sushi",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.sushi-roll",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_riceball.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.taco",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_taco.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_taco.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.toast",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_pretzel.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.food.tom-yum-soup",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_curry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_curry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.tomato",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_tomato.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.tortilla-chips",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_nachos.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.udon",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_ramen.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.food.waffle",
      "role": "collectible",
      "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
      "lifecycle": "staging",
      "releaseStatus": "blocked",
      "runtimeStatus": "blocked",
      "playerVisible": false,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/arcade-runtime-food-v1/max-256/food_cinnamon_roll.png",
          "lifecycle": "staging",
          "releaseStatus": "blocked",
          "runtimeStatus": "blocked"
        }
      }
    },
    {
      "assetKey": "infinite.friend.bob",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/bread.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/bread.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.chomper",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/chomper.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/chomper.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.classic",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/common.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/common.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.count",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/dessert.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/dessert.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.fire",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/fire.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/fire.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.flytrap",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/farmhand.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/farmhand.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.gulper",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/glutton.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/glutton.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.hippo",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/belly.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/belly.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.pelican",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/forager.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/forager.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.princess",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/berry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/berry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.friend.royal",
      "role": "colony-friend",
      "sourcePath": "assets/images/infinite/friends/toad.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/images/infinite/friends/toad.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.frog.aquatic",
      "role": "colony-unit",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/aquatic.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/aquatic.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.frog.belly",
      "role": "colony-unit",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/belly.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/belly.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.frog.berry",
      "role": "colony-unit",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/berry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/berry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.frog.common",
      "role": "colony-unit",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/common.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/common.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.frog.dessert",
      "role": "colony-unit",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/dessert.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/dessert.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.frog.glutton",
      "role": "colony-unit",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/glutton.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/glutton.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.frog.hunter",
      "role": "colony-unit",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/hunter.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/hunter.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.frog.toad",
      "role": "colony-unit",
      "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/toad.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/retained-safe-margin/frogs/toad.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.hazard.waste",
      "role": "hazard",
      "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/hazards/waste.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/hazards/waste.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.ui.colony-coin",
      "role": "ui-icon",
      "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/colony-coin.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/colony-coin.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.ui.food",
      "role": "ui-icon",
      "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/food.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/food.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.ui.gold",
      "role": "ui-icon",
      "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/gold.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/gold.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.ui.map",
      "role": "ui-icon",
      "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/map.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/map.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "infinite.ui.unit",
      "role": "ui-icon",
      "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/unit.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/infinite/batch-01/ui/unit.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "owner.food.blueberry.rc24",
      "role": "food-master",
      "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-blueberry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-blueberry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "owner.food.candy-corn.rc24",
      "role": "food-master",
      "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-candy-corn.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-candy-corn.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "owner.food.cookie.rc24",
      "role": "food-master",
      "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-cookie.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-cookie.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "owner.food.pineapple.rc24",
      "role": "food-master",
      "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-pineapple.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-pineapple.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "owner.food.pretzel.rc24",
      "role": "food-master",
      "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-pretzel.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/food-owner-approved-2026-07-27/masters/food-pretzel.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.action.apply",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/utility-daily.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/utility-daily.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.action.copy",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-story.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-story.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.action.quit",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/close.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/close.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.action.skip",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/play.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/play.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.action.undo",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/control-undo.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/control-undo.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.badge.rank",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/progress-rank.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/progress-rank.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.badge.trophy",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/progress-trophy.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/progress-trophy.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.control.down",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/nav-down.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/nav-down.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.control.left",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/nav-left.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/nav-left.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.control.pause",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/pause.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/pause.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.control.restart",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/control-restart.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/control-restart.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.control.resume",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/play.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/play.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.control.right",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/nav-right.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/nav-right.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.control.up",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/nav-up.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/nav-up.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.currency.colony-coin",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/economy/colony-coin.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/economy/colony-coin.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.currency.gold",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/hud-gold.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/hud-gold.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.game.bomb",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/game/bomb.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/game/bomb.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.game.food",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/game/food.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/game/food.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.game.plate",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/hud-pantry.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/hud-pantry.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.game.skull",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/result-defeat.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/result-defeat.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.game.sparkle",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/result-star-glow.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/result-star-glow.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.game.target",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/puzzle-goal.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/puzzle-goal.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.game.vomit",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/puzzle-release.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/puzzle-release.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.health.heart",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/game/heart.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/game/heart.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.lock",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/meta/lock.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/meta/lock.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.map",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-map.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-map.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.audio",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/audio.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/audio.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.characters",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/character-frog.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/character-frog.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.cosmetics",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/character-wardrobe.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/character-wardrobe.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.help",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/help.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/help.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.hero",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-hero.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-hero.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.powerups",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/game/powerup.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/game/powerup.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.shop",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/utility-store.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/utility-store.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.stats",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-stats.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-stats.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.menu.story",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-story.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/misc-story.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.settings",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/settings.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/controls/settings.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.tool.lab",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/mode-puzzle.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/mode-puzzle.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.unlock",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/character-unlock.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-raster-authority/runtime-256/character-unlock.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    },
    {
      "assetKey": "ui.warning",
      "role": "ui-symbol",
      "sourcePath": "assets/themes/froggy-feast/ui-v2/meta/warning.png",
      "lifecycle": "approved",
      "releaseStatus": "approved",
      "runtimeStatus": "active",
      "playerVisible": true,
      "themeBindings": {
        "froggy-feast": {
          "sourcePath": "assets/themes/froggy-feast/ui-v2/meta/warning.png",
          "lifecycle": "approved",
          "releaseStatus": "approved",
          "runtimeStatus": "active"
        }
      }
    }
  ]
});

const AssetProvenanceRegistry = (() => {
  const records = new Map(FROGGY_ASSET_PROVENANCE.assets.map(record => [record.assetKey, Object.freeze(record)]));
  const priorityByTarget = new Map((FROGGY_ASSET_PROVENANCE.priorityMappings || []).map(mapping => [mapping.targetAssetKey, mapping.priorityAssetKey]));

  function activeThemeId(requestedThemeId) {
    if (requestedThemeId) return String(requestedThemeId);
    if (typeof ThemeSystem !== 'undefined' && ThemeSystem?.current) return String(ThemeSystem.current()?.id || 'froggy-feast');
    return 'froggy-feast';
  }

  function get(assetKey) { return records.get(String(assetKey || '')) || null; }

  function resolve(assetKey, options = {}) {
    const requestedRecord = get(assetKey);
    const priorityAssetKey = requestedRecord ? priorityByTarget.get(requestedRecord.assetKey) : null;
    const priorityRecord = priorityAssetKey ? get(priorityAssetKey) : null;
    const record = priorityRecord || requestedRecord;
    // An active reviewed priority master can supersede a held historical image;
    // a missing priority master never creates a substitution or bypasses theme isolation.
    if (!record || record.runtimeStatus === 'blocked') return null;
    const themeId = activeThemeId(options.themeId);
    const binding = record.themeBindings?.[themeId] || null;
    if (!binding || !binding.sourcePath || binding.runtimeStatus === 'blocked') return null;
    return Object.freeze({
      assetKey: requestedRecord?.assetKey || record.assetKey,
      requestedAssetKey: requestedRecord?.assetKey || record.assetKey,
      resolvedAssetKey: record.assetKey,
      isPriorityOverride: Boolean(priorityRecord),
      role: record.role,
      themeId,
      sourcePath: binding.sourcePath,
      lifecycle: binding.lifecycle || record.lifecycle,
      releaseStatus: binding.releaseStatus || record.releaseStatus,
      runtimeStatus: binding.runtimeStatus || record.runtimeStatus,
      playerVisible: record.playerVisible,
    });
  }

  function list(options = {}) { const themeId = options.themeId ? String(options.themeId) : null; return [...records.values()].filter(record => !themeId || record.themeBindings?.[themeId]); }

  function unresolvedRequired(options = {}) {
    const themeId = activeThemeId(options.themeId);
    return [...records.values()].filter(record => {
      const preferred = get(priorityByTarget.get(record.assetKey)) || record;
      return record.playerVisible && !preferred.themeBindings?.[themeId];
    });
  }

  return Object.freeze({ get, resolve, list, unresolvedRequired, policy: FROGGY_ASSET_PROVENANCE.policy });
})();

if (typeof globalThis !== 'undefined') {
  globalThis.FROGGY_ASSET_PROVENANCE = FROGGY_ASSET_PROVENANCE;
  globalThis.AssetProvenanceRegistry = AssetProvenanceRegistry;
}
