export const TEMPLATE_VERSION = '1';
export const GAMES = Object.freeze({
  'toadal-feast': { id: 'toadal-feast', name: 'TOADAL FEAST', canShareScore: false, path: '/play/' },
  'wicked-bites': { id: 'wicked-bites', name: 'Wicked Bites', canShareScore: true, path: '/player/wicked-bites/' },
});
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export function escapeText(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
export function normalizePayload(input, { aliasAllowed = false, now = new Date() } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Expected a card object.');
  const keys = new Set(['schemaVersion', 'kind', 'theme', 'gameId', 'score', 'achievedAt', 'alias', 'aliasPublic']);
  if (Object.keys(input).some(key => !keys.has(key))) throw new HttpError(400, 'Unsupported card field.');
  if (input.schemaVersion !== 1 || !['invite', 'score'].includes(input.kind) || !['feast', 'astro'].includes(input.theme)) throw new HttpError(400, 'Unsupported card version, kind, or theme.');
  if (!Object.hasOwn(GAMES, input.gameId)) throw new HttpError(400, 'Unknown game.');
  const game = GAMES[input.gameId];
  const result = { schemaVersion: 1, templateVersion: TEMPLATE_VERSION, kind: input.kind, theme: input.theme, gameId: game.id, gameName: game.name, locale: 'en', alias: null };
  if (input.alias !== undefined || input.aliasPublic !== undefined) {
    if (!aliasAllowed || input.aliasPublic !== true || typeof input.alias !== 'string') throw new HttpError(400, 'Public names are not enabled or explicitly selected.');
    const alias = input.alias.trim().normalize('NFC');
    if (!alias || [...alias].length > 24 || /[\p{C}\p{Zl}\p{Zp}]/u.test(alias)) throw new HttpError(400, 'Use a name of 1–24 visible characters.');
    result.alias = alias;
  }
  if (input.kind === 'score') {
    if (!game.canShareScore || !Number.isSafeInteger(input.score) || input.score < 0 || input.score > 999999999) throw new HttpError(400, 'A personal score must be an integer from 0 to 999,999,999 for an eligible game.');
    let achievedAt = null;
    if (input.achievedAt !== undefined) {
      if (typeof input.achievedAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(input.achievedAt)) throw new HttpError(400, 'Use a UTC score timestamp.');
      const time = new Date(input.achievedAt);
      if (!Number.isFinite(time.getTime()) || time.toISOString().slice(0, 19) !== input.achievedAt.slice(0, 19) || time.getTime() > now.getTime() || time.getTime() < Date.UTC(2020, 0, 1)) throw new HttpError(400, 'Invalid score timestamp.');
      achievedAt = time.toISOString();
    }
    Object.assign(result, { score: input.score, achievedAt, units: 'points', mode: 'unspecified', rulesetVersion: null, confidence: 'none', persistence: 'none', source: 'personal-submission' });
  } else if (input.score !== undefined || input.achievedAt !== undefined) throw new HttpError(400, 'Invitations cannot contain a score.');
  return result;
}
export function cardTitle(card) { return card.kind === 'invite' ? "You're invited to the Feast!" : `${card.gameName} · ${card.score.toLocaleString('en-US')} points`; }
export function cardDescription(card) { return card.kind === 'invite' ? `${card.alias ? card.alias + ' invites you to' : 'Come play'} ${card.gameName}. Pick up a game and join the fun.` : `${card.alias ? card.alias + ' shared a' : 'A player shared a'} personal score. Come play ${card.gameName}!`; }
