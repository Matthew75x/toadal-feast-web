// ============================================================
// src/runtime/shared/cosmetics.js — COSMETIC_DATA pure data constant
// Load order: 3rd (after src/runtime/shared/characters.js)
// ============================================================

const COSMETIC_DATA = [
  { id:'classic_royal_crown', slot:'hat', type:'accessory', assetKey:'cosmetic_classic_royal_crown', name:'Classic Crown', visualKind:'imageHat', accent:'#e0b23d', desc:'A visual-only royal crown for Classic Frog.', coinCost:0, rarity:'common', applicableTo:['classic'], previewSrc:'assets/images/cosmetics/classic/hats/royal-crown.png', presentation:Object.freeze({ mode:'overlay', anchorSlot:'hat', assetSrc:'assets/images/cosmetics/classic/hats/royal-crown.png', targetWidth:60, assetAnchorX:0.5, assetAnchorY:0.90, seatOffsetX:0, seatOffsetY:3.5, mirrorWithCharacter:true, imageOnly:true }), effectIds:Object.freeze([]) },
  { id:'classic_party_hat', slot:'hat', type:'accessory', assetKey:'cosmetic_classic_party_hat', name:'Party Hat', visualKind:'imageHat', accent:'#ef4aa6', desc:'A bright visual-only party hat for Classic Frog.', coinCost:0, rarity:'common', applicableTo:['classic'], previewSrc:'assets/images/cosmetics/classic/hats/party-hat.png', presentation:Object.freeze({ mode:'overlay', anchorSlot:'hat', assetSrc:'assets/images/cosmetics/classic/hats/party-hat.png', targetWidth:48, assetAnchorX:0.5, assetAnchorY:0.94, seatOffsetX:0, seatOffsetY:3.0, mirrorWithCharacter:true, imageOnly:true }), effectIds:Object.freeze([]) },
  { id:'classic_wizard_hat', slot:'hat', type:'accessory', assetKey:'cosmetic_classic_wizard_hat', name:'Wizard Hat', visualKind:'imageHat', accent:'#7453b8', desc:'A visual-only moon-and-stars wizard hat for Classic Frog.', coinCost:0, rarity:'common', applicableTo:['classic'], previewSrc:'assets/images/cosmetics/classic/hats/wizard-hat.png', presentation:Object.freeze({ mode:'overlay', anchorSlot:'hat', assetSrc:'assets/images/cosmetics/classic/hats/wizard-hat.png', targetWidth:72, assetAnchorX:0.5, assetAnchorY:0.86, seatOffsetX:0, seatOffsetY:3.5, mirrorWithCharacter:true, imageOnly:true }), effectIds:Object.freeze([]) },
  { id:'classic_chef_hat', slot:'hat', type:'accessory', assetKey:'cosmetic_classic_chef_hat', name:'Chef Hat', visualKind:'imageHat', accent:'#f5f0e4', desc:'A visual-only chef toque for Classic Frog.', coinCost:0, rarity:'common', applicableTo:['classic'], previewSrc:'assets/images/cosmetics/classic/hats/chef-hat.png', presentation:Object.freeze({ mode:'overlay', anchorSlot:'hat', assetSrc:'assets/images/cosmetics/classic/hats/chef-hat.png', targetWidth:64, assetAnchorX:0.5, assetAnchorY:0.91, seatOffsetX:0, seatOffsetY:5.0, mirrorWithCharacter:true, imageOnly:true }), effectIds:Object.freeze([]) },
  { id:'classic_flower_crown', slot:'hat', type:'accessory', assetKey:'cosmetic_classic_flower_crown', name:'Flower Crown', visualKind:'imageHat', accent:'#e884a8', desc:'A visual-only ring of meadow flowers for Classic Frog.', coinCost:0, rarity:'common', applicableTo:['classic'], previewSrc:'assets/images/cosmetics/classic/hats/flower-crown.png', presentation:Object.freeze({ mode:'overlay', anchorSlot:'hat', assetSrc:'assets/images/cosmetics/classic/hats/flower-crown.png', targetWidth:70, assetAnchorX:0.5, assetAnchorY:0.86, seatOffsetX:0, seatOffsetY:3.5, mirrorWithCharacter:true, imageOnly:true }), effectIds:Object.freeze([]) },
  { id:'classic_pirate_hat', slot:'hat', type:'accessory', assetKey:'cosmetic_classic_pirate_hat', name:'Pirate Hat', visualKind:'imageHat', accent:'#d09a2e', desc:'A visual-only pirate captain hat for Classic Frog.', coinCost:0, rarity:'common', applicableTo:['classic'], previewSrc:'assets/images/cosmetics/classic/hats/pirate-hat.png', presentation:Object.freeze({ mode:'overlay', anchorSlot:'hat', assetSrc:'assets/images/cosmetics/classic/hats/pirate-hat.png', targetWidth:82, assetAnchorX:0.5, assetAnchorY:0.86, seatOffsetX:0, seatOffsetY:3.0, mirrorWithCharacter:true, imageOnly:true }), effectIds:Object.freeze([]) },
  { id:'classic_winter_beanie', slot:'hat', type:'accessory', assetKey:'cosmetic_classic_winter_beanie', name:'Winter Beanie', visualKind:'imageHat', accent:'#3c9b9a', desc:'A visual-only striped winter beanie for Classic Frog.', coinCost:0, rarity:'common', applicableTo:['classic'], previewSrc:'assets/images/cosmetics/classic/hats/winter-beanie.png', presentation:Object.freeze({ mode:'overlay', anchorSlot:'hat', assetSrc:'assets/images/cosmetics/classic/hats/winter-beanie.png', targetWidth:69.7714, assetAnchorX:0.500000, assetAnchorY:0.887687, seatOffsetX:0, seatOffsetY:4.0, mirrorWithCharacter:true, imageOnly:true }), effectIds:Object.freeze([]) },
];




const ACTIVE_COSMETIC_IDS = Object.freeze(new Set(COSMETIC_DATA.map(item => item.id)));
const ACTIVE_COSMETIC_BY_ID = Object.freeze(new Map(COSMETIC_DATA.map(item => [item.id, item])));

function cosmeticAppliesToCharacter(item, characterId) {
  if (!item) return false;
  const target = String(characterId || '');
  const applicable = Array.isArray(item.applicableTo) ? item.applicableTo.map(String) : [];
  const declaredCompatible = applicable.includes('all') || applicable.includes(target);
  if (!declaredCompatible) return false;
  if (typeof characterProfileAllowsCosmetic === 'function') {
    return characterProfileAllowsCosmetic(item, target);
  }
  // Tests and legacy tools that load src/runtime/shared/cosmetics.js in isolation retain the
  // declared-target fallback. Production pages load the profile authority.
  return declaredCompatible;
}
const RETIRED_COSMETIC_IDS = Object.freeze(new Set([
  'uni_aviators',
  'uni_tophat',
  'uni_crown',
  'classic_wizard',
  'classic_ocean',
  'classic_monocle',
  'classic_afro',
  'gulper_chef',
  'gulper_pacifier',
  'gulper_mud',
  'chomper_gold_teeth',
  'chomper_biker_beard',
  'chomper_propeller',
  'fire_demon',
  'fire_shades',
  'fire_horns',
  'pelican_pirate',
  'pelican_patch',
  'pelican_sailor',
  'count_bat',
  'count_glasses',
  'count_cape',
  'bg_meadow',
  'bg_volcano',
  'bg_ocean',
  'bg_spooky',
  'bg_golden'
]));

function sanitizeCosmeticSaveData(save) {
  if (!save || typeof save !== 'object') return false;
  let changed = false;
  if (Array.isArray(save.unlockedCosmetics)) {
    const next = save.unlockedCosmetics.filter(id => !RETIRED_COSMETIC_IDS.has(String(id || '')));
    if (next.length !== save.unlockedCosmetics.length) { save.unlockedCosmetics = next; changed = true; }
  }
  if (save.equippedCosmetics && typeof save.equippedCosmetics === 'object' && !Array.isArray(save.equippedCosmetics)) {
    for (const [subject, equipment] of Object.entries(save.equippedCosmetics)) {
      if (!equipment || typeof equipment !== 'object' || Array.isArray(equipment)) continue;
      for (const [slot, id] of Object.entries(equipment)) {
        const cosmeticId = String(id || '');
        const nativeItem = ACTIVE_COSMETIC_BY_ID.get(cosmeticId) || null;
        if (RETIRED_COSMETIC_IDS.has(cosmeticId)
          || (nativeItem && !cosmeticAppliesToCharacter(nativeItem, subject))
          || (nativeItem && typeof getCharacterCosmeticProfile === 'function'
            && getCharacterCosmeticProfile(subject)?.active !== true)) {
          delete equipment[slot];
          changed = true;
        }
      }
      if (subject !== '__contentTargets' && Object.keys(equipment).length === 0) { delete save.equippedCosmetics[subject]; changed = true; }
    }
  }
  return changed;
}

const COSMETIC_PRESENTATION_MODES = Object.freeze(new Set([
  'overlay', 'costume-overlay', 'body-effect', 'sprite-variant', 'canvas-palette', 'background',
]));

const COSMETIC_EFFECT_HANDLERS = Object.freeze({});

function cosmeticPresentationForItem(item) {
  const source = item?.presentation && typeof item.presentation === 'object' ? item.presentation : {};
  const mode = COSMETIC_PRESENTATION_MODES.has(source.mode)
    ? source.mode
    : (item?.type === 'background' || item?.isBg ? 'background' : 'overlay');
  const equipSlot = cosmeticSlotForItem(item);
  const anchorSlot = cosmeticSlotIsValid(source.anchorSlot) ? source.anchorSlot : equipSlot;
  const targetWidth = Number(source.targetWidth);
  const assetAnchorX = Number(source.assetAnchorX);
  const assetAnchorY = Number(source.assetAnchorY);
  const seatOffsetX = Number(source.seatOffsetX);
  const seatOffsetY = Number(source.seatOffsetY);
  return Object.freeze({
    mode,
    anchorSlot,
    sizeScale: Math.max(0.25, Math.min(4, Number(source.sizeScale) || 1)),
    rendererVariant: String(source.rendererVariant || ''),
    paletteId: String(source.paletteId || ''),
    assetSrc: String(source.assetSrc || ''),
    targetWidth: Number.isFinite(targetWidth) ? Math.max(8, Math.min(256, targetWidth)) : 0,
    assetAnchorX: Number.isFinite(assetAnchorX) ? Math.max(0, Math.min(1, assetAnchorX)) : 0.5,
    assetAnchorY: Number.isFinite(assetAnchorY) ? Math.max(0, Math.min(1, assetAnchorY)) : 1,
    seatOffsetX: Number.isFinite(seatOffsetX) ? Math.max(-64, Math.min(64, seatOffsetX)) : 0,
    seatOffsetY: Number.isFinite(seatOffsetY) ? Math.max(-64, Math.min(64, seatOffsetY)) : 0,
    mirrorWithCharacter: source.mirrorWithCharacter !== false,
    imageOnly: source.imageOnly === true,
  });
}

function cosmeticRenderSlotForItem(item) {
  return cosmeticPresentationForItem(item).anchorSlot;
}

function applyCosmeticEffects(item, stats) {
  // Approved cosmetics are visual-only. Gameplay tuning belongs to character/balance systems.
  return stats;
}

function resolveArcadeVisualCharacterDefinition(character) {
  // Cosmetics never replace the authoritative character model.
  return character;
}

const COSMETIC_ANCHORS = Object.freeze({
  default: Object.freeze({ hat: Object.freeze({ x:0, y:-25, size:32 }) }),
  classic: Object.freeze({ hat: Object.freeze({ x:0, y:-25, size:32 }) }),
});

const CLASSIC_HAT_PORTRAIT_ANCHOR = Object.freeze({ x:0, y:-42 });

const CLASSIC_HAT_FRAME_ANCHORS = Object.freeze({
  classic_idle: Object.freeze({ x:0, y:-87 }),
  classic_mouth_open: Object.freeze({ x:0, y:-87 }),
  classic_tongue_pose: Object.freeze({ x:0, y:-87 }),
  classic_catch_success: Object.freeze({ x:0, y:-90 }),
  classic_hurt: Object.freeze({ x:0, y:-87 }),
  classic_move_left: Object.freeze({ x:-5, y:-92 }),
  classic_move_right: Object.freeze({ x:7, y:-91 }),
  classic_blink: Object.freeze({ x:0, y:-87 }),
  default: Object.freeze({ x:0, y:-87 }),
});

// ============================================================
// Cosmetic slot taxonomy + conflict resolution (backend classification)
// A character equips at most ONE item per slot. Full-costume skins that
// already include headwear declare blocks:['hat'] so you can never end up
// wearing two hats (or a hat over a hatted reskin) at once.
// ============================================================
const COSMETIC_SLOTS = Object.freeze({
  skin:       Object.freeze({ id: 'skin', label: 'Body / Reskin', blocks: Object.freeze([]) }),
  hat:        Object.freeze({ id: 'hat', label: 'Hat', blocks: Object.freeze([]) }),
  afro:       Object.freeze({ id: 'afro', label: 'Hair', blocks: Object.freeze([]) }),
  glasses:    Object.freeze({ id: 'glasses', label: 'Eyewear', blocks: Object.freeze([]) }),
  beard:      Object.freeze({ id: 'beard', label: 'Facial Hair', blocks: Object.freeze([]) }),
  mouth:      Object.freeze({ id: 'mouth', label: 'Mouth', blocks: Object.freeze([]) }),
  horns:      Object.freeze({ id: 'horns', label: 'Head Add-on', blocks: Object.freeze([]) }),
  cape:       Object.freeze({ id: 'cape', label: 'Back / Cape', blocks: Object.freeze([]) }),
  background: Object.freeze({ id: 'background', label: 'Background', blocks: Object.freeze([]) }),
});
const COSMETIC_SLOT_ORDER = Object.freeze(['skin', 'hat', 'afro', 'glasses', 'beard', 'mouth', 'horns', 'cape', 'background']);

function cosmeticSlotIsValid(slot) {
  return typeof slot === 'string' && Object.prototype.hasOwnProperty.call(COSMETIC_SLOTS, slot);
}

// Canonical slot for a cosmetic. Prefers the item's explicit slot, then the
// content-item cosmetic.slot, then type — never guesses from id substrings.
function cosmeticSlotForItem(item) {
  if (!item) return 'hat';
  if (cosmeticSlotIsValid(item.slot)) return item.slot;
  if (item.cosmetic && cosmeticSlotIsValid(item.cosmetic.slot)) return item.cosmetic.slot;
  if (item.type === 'background' || item.isBg) return 'background';
  if (item.type === 'skin' || item.type === 'reskin') return 'skin';
  if (typeof console !== 'undefined' && console.warn) console.warn('[cosmetics] no slot for', item.id, '- defaulting to hat');
  return 'hat';
}

function cosmeticBlocksFor(item, slot) {
  const set = new Set();
  const meta = COSMETIC_SLOTS[slot];
  if (meta) meta.blocks.forEach(b => set.add(b));
  if (item && Array.isArray(item.blocks)) item.blocks.forEach(b => { if (cosmeticSlotIsValid(b)) set.add(b); });
  return set;
}

// Pure equip resolver. Returns a NEW equipped map with `item` toggled in its
// slot, one-per-slot enforced, and conflicting slots (both directions) cleared.
function resolveCosmeticEquip(equippedMap, item, lookup) {
  const map = { ...(equippedMap || {}) };
  if (!item) return map;
  const slot = cosmeticSlotForItem(item);
  if (map[slot] === item.id) { delete map[slot]; return map; }
  cosmeticBlocksFor(item, slot).forEach(b => { delete map[b]; });
  Object.keys(map).forEach(s => {
    const other = typeof lookup === 'function' ? lookup(map[s]) : null;
    if (other && cosmeticBlocksFor(other, s).has(slot)) delete map[s];
  });
  map[slot] = item.id;
  return map;
}

if (typeof window !== 'undefined') {
  window.ACTIVE_COSMETIC_IDS = ACTIVE_COSMETIC_IDS;
  window.RETIRED_COSMETIC_IDS = RETIRED_COSMETIC_IDS;
  window.sanitizeCosmeticSaveData = sanitizeCosmeticSaveData;
  window.cosmeticAppliesToCharacter = cosmeticAppliesToCharacter;
  window.COSMETIC_SLOTS = COSMETIC_SLOTS;
  window.COSMETIC_SLOT_ORDER = COSMETIC_SLOT_ORDER;
  window.cosmeticSlotIsValid = cosmeticSlotIsValid;
  window.cosmeticSlotForItem = cosmeticSlotForItem;
  window.resolveCosmeticEquip = resolveCosmeticEquip;
  window.CLASSIC_HAT_PORTRAIT_ANCHOR = CLASSIC_HAT_PORTRAIT_ANCHOR;
  window.CLASSIC_HAT_FRAME_ANCHORS = CLASSIC_HAT_FRAME_ANCHORS;
  window.COSMETIC_PRESENTATION_MODES = COSMETIC_PRESENTATION_MODES;
  window.COSMETIC_EFFECT_HANDLERS = COSMETIC_EFFECT_HANDLERS;
  window.cosmeticPresentationForItem = cosmeticPresentationForItem;
  window.cosmeticRenderSlotForItem = cosmeticRenderSlotForItem;
  window.applyCosmeticEffects = applyCosmeticEffects;
  window.resolveArcadeVisualCharacterDefinition = resolveArcadeVisualCharacterDefinition;
}
