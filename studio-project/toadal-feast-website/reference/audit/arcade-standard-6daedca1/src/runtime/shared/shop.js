// ============================================================
// src/runtime/shared/shop.js — ITEM_SHOP_DATA pure data constant
// Load order: 4th (after src/runtime/shared/cosmetics.js)
// ============================================================
// Power-up IDs are gameplay/save identifiers. visualKind selects a temporary
// vector presentation; final art can be added under the same assetKey later.

const ITEM_SHOP_DATA = [
  { id:'shield_pu',       label:'Shield Candy',          assetKey:'pu_shield',       visualKind:'shield',       accent:'#59b5e8', desc:'Blocks next miss or bomb catch.', duration:6 },
  { id:'slowfood_pu',     label:'Time Candy',       assetKey:'pu_slowfood',     visualKind:'slowFood',     accent:'#83c9f2', desc:'Food falls at 45% speed for 7s.', duration:7 },
  { id:'doublepoints_pu', label:'Royal Candy',   assetKey:'pu_doublepoints', visualKind:'doublePoints', accent:'#ffd35b', desc:'2× score on every catch for 8s.', duration:8 },
  { id:'speedboost_pu',   label:'Haste Candy',     assetKey:'pu_speedboost',   visualKind:'speedBoost',   accent:'#f1a34a', desc:'Move much faster for 5s.', duration:5 },
  { id:'magnet_pu',       label:'Magnet Candy',          assetKey:'pu_magnet',       visualKind:'magnet',       accent:'#d7647a', desc:'Wider catch radius for 6s.', duration:6 },
  { id:'scoreboost_pu',   label:'Star Candy',     assetKey:'pu_scoreboost',   visualKind:'scoreBoost',   accent:'#f1bd4e', desc:'1.5× score multiplier for 8s.', duration:8 },
  { id:'piercing_pu',     label:'Sword Candy', assetKey:'pu_piercing',     visualKind:'piercing',     accent:'#7b90df', desc:'One tongue shot collects every safe item it passes through for 7s.', duration:7 },
  { id:'vacuum_pu',       label:'Portal Candy',          assetKey:'pu_vacuum',       visualKind:'vacuum',       accent:'#7ac8d6', desc:'Pulls safe items above the frog into its mouth for 5s.', duration:5 },
];
