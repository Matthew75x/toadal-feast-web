// Semantic Feast Genie art registry. Runtime uses only supplied 256px atlases.
(function (root) {
  'use strict';
  const states = Object.freeze([
    'neutral_talk', 'listen_blink', 'talk_open', 'talk_wide', 'talk_o',
    'happy_explain', 'point_up', 'point_side', 'welcome', 'thinking',
    'surprised', 'concerned', 'wink', 'laugh', 'delighted', 'side_hover',
  ]);
  const semantic = Object.freeze({
    idle: 'listen_blink', listening: 'listen_blink', talking: 'neutral_talk',
    explaining: 'happy_explain', rule: 'point_up', target: 'point_side',
    greeting: 'welcome', hint: 'thinking', surprise: 'surprised',
    warning: 'concerned', playful: 'wink', celebrate: 'delighted',
    entrance: 'side_hover', exit: 'side_hover',
  });
  const speakers = Object.freeze(['sweet', 'fruity', 'savoury']);
  function resolve(speaker, pose) {
    const chosenSpeaker = speakers.includes(String(speaker)) ? String(speaker) : 'sweet';
    const state = states.includes(String(pose)) ? String(pose) : (semantic[String(pose)] || 'listen_blink');
    const index = states.indexOf(state);
    return Object.freeze({ speaker: chosenSpeaker, pose: String(pose || 'idle'), frame: state, index,
      asset: `assets/images/ui/feast-genies/${chosenSpeaker}_dialogue_atlas_256.png`,
      backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100 / 3}%` });
  }
  root.FeastGenieRegistry = Object.freeze({ states, semantic, speakers, resolve });
})(typeof globalThis !== 'undefined' ? globalThis : window);
