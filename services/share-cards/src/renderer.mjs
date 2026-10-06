import { Buffer } from 'node:buffer';
import { escapeText } from './contract.mjs';
export const dataPng = bytes => 'data:image/png;base64,' + Buffer.from(bytes).toString('base64');
function stars(color) {
  return [[45,95,10],[666,168,13],[1125,73,12],[1090,520,12],[650,530,9],[928,70,7]].map(([x,y,s]) => '<path transform="translate('+x+' '+y+') scale('+s/10+')" d="M0-12 3-3 12 0 3 3 0 12-3 3-12 0-3-3Z" fill="'+color+'" opacity=".85"/>').join('');
}
export function createSvg(card, assets) {
  const astro = card.theme === 'astro', ink = '#fff6d9', accent = astro ? '#83edff' : '#ffdc78';
  const score = card.kind === 'score', name = escapeText(card.gameName), alias = card.alias ? escapeText(card.alias) : '';
  const scoreText = score ? card.score.toLocaleString('en-US') : '';
  const numberSize = scoreText.length > 9 ? 66 : scoreText.length > 7 ? 80 : 100;
  const panel = astro ? '<image href="'+assets.frame+'" x="52" y="243" width="620" height="198"/>' : '<rect x="67" y="250" width="586" height="181" rx="40" fill="#221329" stroke="#ffdb85" stroke-width="3"/><path d="M96 266H622" stroke="#fff4c3" opacity=".4" stroke-width="3"/>';
  const content = score
    ? '<text x="72" y="211" font-size="45" fill="'+ink+'">'+name+'</text>'+panel+'<text x="360" y="350" text-anchor="middle" font-size="'+numberSize+'" fill="'+ink+'">'+scoreText+'</text><text x="360" y="397" text-anchor="middle" font-size="24" letter-spacing="3" fill="'+accent+'">PERSONAL SCORE · POINTS</text><text x="74" y="472" font-size="22" fill="#d3cadf">'+(alias ? alias+' shared a score.' : 'A little friendly competition?')+'</text>'
    : '<text x="72" y="232" font-size="67" fill="'+ink+'">You’re invited</text><text x="72" y="310" font-size="76" fill="'+ink+'">to the Feast!</text><text x="75" y="374" font-size="30" fill="'+accent+'">'+(card.gameId === 'toadal-feast' ? 'Good games. Great company.' : 'Come play '+name+'.')+'</text><text x="75" y="420" font-size="23" fill="#d3cadf">'+(alias ? 'An invitation from '+alias : 'Bring your appetite for adventure.')+'</text>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><radialGradient id="bg" cx=".72" cy=".44" r=".83"><stop stop-color="'+(astro?'#263866':'#512b60')+'"/><stop offset="1" stop-color="'+(astro?'#070d22':'#1a0d25')+'"/></radialGradient><radialGradient id="halo"><stop stop-color="'+(astro?'#53d5ef':'#c8925f')+'" stop-opacity=".35"/><stop offset="1" stop-color="'+(astro?'#192142':'#512b60')+'" stop-opacity="0"/></radialGradient><linearGradient id="rim"><stop stop-color="'+accent+'"/><stop offset=".45" stop-color="'+(astro?'#7c7af8':'#7e5d87')+'"/><stop offset="1" stop-color="'+(astro?'#f67acf':'#ffc77e')+'"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><circle cx="916" cy="342" r="331" fill="url(#halo)"/><rect x="18" y="18" width="1164" height="594" rx="32" fill="none" stroke="url(#rim)" stroke-width="2" opacity=".6"/><path d="M1195 600C1005 467 994 698 808 579" fill="none" stroke="'+accent+'" opacity=".1" stroke-width="32"/>'+stars(accent)+'<image href="'+assets.header+'" x="64" y="49" width="586" height="106"/><g font-family="Lilita One">'+content+'<rect x="72" y="502" width="310" height="62" rx="31" fill="'+accent+'"/><text x="227" y="542" text-anchor="middle" font-size="26" fill="#20122c">'+(card.gameId === 'toadal-feast' ? 'COME PLAY' : 'PLAY WICKED BITES')+'</text><text x="74" y="596" font-size="17" letter-spacing="1.5" fill="#c8bbd4">'+(score?'PERSONAL RESULT · NO VERIFIED RANK':'AN INVITATION TO PLAY')+'</text></g><image href="'+assets.toad+'" x="698" y="122" width="456" height="470"/></svg>';
}
export function createRenderer(Resvg, assets, font) {
  return async card => {
    const svg = new Resvg(createSvg(card, assets), { font: { fontBuffers: [font], defaultFontFamily: 'Lilita One', loadSystemFonts: false }, fitTo: { mode: 'original' } });
    let rendered;
    try { rendered = svg.render(); if (rendered.width !== 1200 || rendered.height !== 630) throw new Error('Unexpected card dimensions.'); return rendered.asPng().slice(); }
    finally { rendered?.free(); svg.free(); }
  };
}
