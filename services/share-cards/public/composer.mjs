import { createShareClient, newIdempotencyKey, ShareClientError } from './share-client.mjs';

const byId = id => document.getElementById(id);
const form = byId('card-form');
const gameSelect = byId('game');
const scoreInput = byId('score');
const prepareButton = byId('prepare');
const previewImage = byId('card-preview');
const previewStage = byId('preview-stage');
const status = byId('app-status');
const client = createShareClient();
let config = null;
let busy = false;
let previewController = null;
let previewRevision = 0;
let previewTimer = 0;
let previewObjectUrl = null;
let previewBlob = null;
let previewPayloadKey = null;
let prepared = null;
let requestPayloadKey = null;
let requestKey = null;
let acceptedSnapshot = null;
let shareBusy = false;
const managedCards = [];
const downloadUrls = new Set();

function message(node, text) {
  node.textContent = text || '';
  node.hidden = !text;
}
function chosen(name) { return form.querySelector('input[name="' + name + '"]:checked')?.value; }
function selectedGame() { return config?.games.find(game => game.id === gameSelect.value); }
function labelPayload(payload) {
  const name = config?.games.find(game => game.id === payload.gameId)?.name || 'TOADAL FEAST';
  return payload.kind === 'score' ? name + ' · personal score ' + payload.score.toLocaleString()
    : name + ' · Feast invitation';
}
function currentPayload() {
  if (!config || !selectedGame()) throw new ShareClientError('Choose an available game.');
  const payload = { schemaVersion: 1, kind: chosen('kind'), theme: chosen('theme'), gameId: gameSelect.value };
  if (!config.themes.includes(payload.theme)) throw new ShareClientError('Choose an available card theme.');
  if (payload.kind === 'score') {
    if (!selectedGame().canShareScore) throw new ShareClientError('This game does not currently support score cards.');
    const value = scoreInput.value.trim();
    if (!/^\d+$/.test(value)) throw new ShareClientError('Enter your score as a whole number, using digits only.');
    const score = Number(value);
    if (!Number.isSafeInteger(score) || score < 0 || score > 999999999) throw new ShareClientError('Enter a whole-number score from 0 to 999,999,999.');
    payload.score = score;
    if (acceptedSnapshot?.gameId === payload.gameId && acceptedSnapshot.score === score &&
        typeof acceptedSnapshot.achievedAt === 'string' && Number.isFinite(Date.parse(acceptedSnapshot.achievedAt))) {
      payload.achievedAt = new Date(acceptedSnapshot.achievedAt).toISOString();
    }
  }
  if (config.aliasAllowed && byId('alias').value.trim()) {
    if (!byId('alias-public').checked) throw new ShareClientError('Choose whether to include the display name publicly, or leave the name blank.');
    const alias = byId('alias').value.trim().normalize('NFC');
    if ([...alias].length > 24 || /[\p{C}\p{Zl}\p{Zp}]/u.test(alias)) throw new ShareClientError('Use a display name of up to 24 visible characters.');
    payload.alias = alias;
    payload.aliasPublic = true;
  }
  return payload;
}
function clearPreview() {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
  previewBlob = null;
  previewPayloadKey = null;
  previewImage.removeAttribute('src');
  previewImage.hidden = true;
  byId('preview-placeholder').hidden = false;
  byId('download-preview').disabled = true;
}
function refreshControls() {
  const isScore = chosen('kind') === 'score';
  document.body.dataset.theme = chosen('theme') || 'feast';
  byId('score-fields').hidden = !isScore;
  scoreInput.required = isScore;
  byId('score-kind').disabled = !selectedGame()?.canShareScore;
  const scoreGames = config?.games.filter(game => game.canShareScore).map(game => game.name) || [];
  byId('score-availability').textContent = selectedGame()?.canShareScore ? ''
    : scoreGames.length ? 'Choose ' + scoreGames.join(' or ') + ' below to share a personal score.' : 'Score cards are unavailable for these games.';
  byId('alias-fields').hidden = !config?.aliasAllowed;
  const source = acceptedSnapshot && acceptedSnapshot.score === Number(scoreInput.value) &&
    acceptedSnapshot.gameId === gameSelect.value;
  byId('score-help').textContent = source
    ? 'Completed browser-local result. Personal and unverified; it does not establish a global ranking.'
    : 'Entered personal score. This standalone creator does not read a game session or verify a result.';
  byId('source-note').textContent = isScore
    ? source ? 'Browser-local personal result · no global ranking' : 'Entered personal score · not verified'
    : 'Anonymous invitation · no recipient tracking';
  byId('public-notice').textContent = 'The card is public to anyone with its link. Links expire after ' +
    (config?.retentionDays || 7) + ' days.' + (isScore ? ' Your score remains a personal claim.' : ' This invitation opens a game page.');
  let valid = false;
  try { currentPayload(); valid = true; } catch { /* Field feedback is shown on submit or preview. */ }
  prepareButton.disabled = busy || !valid || config?.creationEnabled === false;
  prepareButton.querySelector('span').textContent = busy ? 'Preparing your card…' : config?.creationEnabled === false ? 'Link creation unavailable' : 'Prepare share link';
  document.querySelector('.prepare-help').textContent = config?.creationEnabled === false
    ? 'Card previews are available. Public links are not enabled yet.'
    : 'Review your preview, then prepare a link before sharing.';
}
function queuePreview() {
  clearTimeout(previewTimer);
  previewController?.abort();
  previewRevision += 1;
  previewStage.setAttribute('aria-busy', 'true');
  byId('preview-state').textContent = 'Updating';
  byId('download-preview').disabled = true;
  const revision = previewRevision;
  previewTimer = window.setTimeout(() => updatePreview(revision), 350);
}
async function updatePreview(revision) {
  if (revision !== previewRevision) return;
  let payload;
  try { payload = currentPayload(); } catch (error) {
    clearPreview();
    previewStage.setAttribute('aria-busy', 'false');
    byId('preview-state').textContent = 'Add your details';
    message(byId('preview-error'), chosen('kind') === 'score' && !scoreInput.value.trim() ? '' : error.message);
    return;
  }
  const controller = new AbortController();
  previewController = controller;
  let newUrl = null;
  try {
    const blob = await client.preview(payload, { signal: controller.signal });
    if (revision !== previewRevision || controller.signal.aborted) return;
    newUrl = URL.createObjectURL(blob);
    const decoded = new Image();
    decoded.src = newUrl;
    await decoded.decode();
    if (revision !== previewRevision || controller.signal.aborted) {
      URL.revokeObjectURL(newUrl);
      return;
    }
    const oldUrl = previewObjectUrl;
    previewObjectUrl = newUrl;
    previewBlob = blob;
    previewPayloadKey = JSON.stringify(payload);
    previewImage.src = newUrl;
    previewImage.alt = labelPayload(payload) + ', in the ' + (payload.theme === 'astro' ? 'Astro Arcade' : 'Candy Feast') + ' theme.';
    previewImage.hidden = false;
    byId('preview-placeholder').hidden = true;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    byId('download-preview').disabled = false;
    message(byId('preview-error'), '');
    byId('preview-state').textContent = 'Preview ready';
  } catch (error) {
    if (newUrl) URL.revokeObjectURL(newUrl);
    if (revision !== previewRevision || controller.signal.aborted) return;
    byId('preview-state').textContent = 'Preview unavailable';
    message(byId('preview-error'), error.message || 'The preview is unavailable. Please try again.');
  } finally {
    if (revision === previewRevision) previewStage.setAttribute('aria-busy', 'false');
  }
}
function onFormChange(event) {
  if (event.target === gameSelect && !selectedGame()?.canShareScore) {
    form.querySelector('input[name=kind][value=invite]').checked = true;
  }
  if (event.target === scoreInput || event.target === gameSelect) acceptedSnapshot = null;
  message(byId('form-error'), '');
  refreshControls();
  queuePreview();
}
form.addEventListener('input', onFormChange);

function showPrepared(card, { focus = false } = {}) {
  prepared = card;
  byId('ready-panel').hidden = false;
  byId('share-url').value = card.url;
  byId('ready-title').textContent = card.payload.kind === 'score' ? 'Your score link is ready.' : 'Your invitation is ready.';
  byId('ready-panel').querySelector('.ready-copy').textContent =
    labelPayload(card.payload) + ' · ' + (card.payload.theme === 'astro' ? 'Astro Arcade' : 'Candy Feast') +
    '. This link keeps this exact card. Edit your details and prepare again to make another.';
  byId('expires').textContent = 'Expires ' + new Date(card.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const canNativeShare = typeof navigator.share === 'function';
  byId('native-share').hidden = !canNativeShare;
  byId('native-share').disabled = false;
  byId('copy-link').disabled = false;
  byId('download-card').disabled = false;
  byId('remove-card').disabled = false;
  byId('share-status').textContent = canNativeShare
    ? 'Tap Share to choose an app, or copy your link.'
    : 'Copy your link and paste it into the app of your choice.';
  renderEarlierCards();
  if (focus) byId('ready-title').focus({ preventScroll: false });
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !config || config.creationEnabled === false) return;
  let payload;
  try { payload = currentPayload(); } catch (error) {
    message(byId('form-error'), error.message);
    return;
  }
  const payloadKey = JSON.stringify(payload);
  const existing = managedCards.find(card => !card.removed && card.payloadKey === payloadKey && Date.parse(card.expiresAt) > Date.now());
  if (existing) { showPrepared(existing, { focus: true }); return; }
  if (requestPayloadKey !== payloadKey || !requestKey) {
    requestPayloadKey = payloadKey;
    try { requestKey = newIdempotencyKey(); }
    catch (error) { message(byId('form-error'), error.message); return; }
  }
  busy = true;
  refreshControls();
  message(byId('form-error'), '');
  status.textContent = 'Preparing a public card and link.';
  try {
    const response = await client.create(payload, { key: requestKey });
    const card = { ...response, payload: Object.freeze({ ...payload }), payloadKey, removed: false };
    const known = managedCards.find(item => item.id === card.id);
    if (!known) managedCards.push(card);
    showPrepared(known || card, { focus: true });
    status.textContent = 'Your card is prepared. Choose Share or Copy link.';
  } catch (error) {
    if (error.status && error.status !== 409) { requestKey = null; requestPayloadKey = null; }
    message(byId('form-error'), error.status === 409
      ? 'This card is still being prepared. Tap Prepare again shortly to check the same request.'
      : error.status === 503
      ? 'That preparation did not finish. Tap Prepare to start a new preparation.'
      : error.message || 'The card could not be prepared. You can try again.');
    status.textContent = 'Preparation needs attention.';
  } finally {
    busy = false;
    refreshControls();
  }
});

byId('native-share').addEventListener('click', () => {
  if (!prepared || prepared.removed || shareBusy) return;
  if (Date.parse(prepared.expiresAt) <= Date.now()) {
    byId('share-status').textContent = 'This link has expired. Prepare a fresh card to share.';
    return;
  }
  const title = prepared.payload.kind === 'score' ? 'My personal TOADAL score' : 'You’re invited to the Feast';
  const data = { title, text: prepared.payload.kind === 'score' ? 'Come play and share your own score.' : 'There’s room for you at the Feast.', url: prepared.url };
  if (typeof navigator.share !== 'function' || (navigator.canShare && !navigator.canShare(data))) {
    byId('share-status').textContent = 'Sharing is unavailable here. Copy the link and paste it into your app.';
    return;
  }
  shareBusy = true;
  byId('native-share').disabled = true;
  // Invoke immediately inside this fresh click; no render, fetch or await precedes it.
  let handoff;
  try { handoff = navigator.share(data); } catch (error) { handoff = Promise.reject(error); }
  Promise.resolve(handoff).then(() => {
    byId('share-status').textContent = 'Card handed to your device’s share app. Delivery or posting is handled there.';
  }).catch(error => {
    byId('share-status').textContent = error.name === 'AbortError'
      ? 'Share closed. Your link is still ready.'
      : 'The share app could not open. Copy your link instead.';
  }).finally(() => {
    shareBusy = false;
    byId('native-share').disabled = !prepared || prepared.removed;
  });
});
byId('copy-link').addEventListener('click', async () => {
  if (!prepared || prepared.removed) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(prepared.url);
    byId('share-status').textContent = 'Link copied. Paste it into your message or post.';
  } catch {
    const field = byId('share-url');
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    byId('share-status').textContent = 'Your link is selected. Copy it using your device’s copy command.';
  }
});
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  downloadUrls.add(url);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.delete(url); }, 15000);
}
byId('download-preview').addEventListener('click', () => {
  if (previewBlob && previewPayloadKey === JSON.stringify(currentPayload())) {
    downloadBlob(previewBlob, 'toadal-card-preview.png');
  }
});
byId('download-card').addEventListener('click', async () => {
  const card = prepared;
  if (!card || card.removed) return;
  byId('download-card').disabled = true;
  try {
    const response = await fetch(card.imageUrl, { credentials: 'omit' });
    if (!response.ok || !/^image\/png(?:;|$)/i.test(response.headers.get('Content-Type') || '')) throw new Error('Image unavailable');
    downloadBlob(await response.blob(), 'toadal-' + card.payload.kind + '-card.png');
    byId('share-status').textContent = 'Card download started. Include the public link when you post the image.';
  } catch {
    byId('share-status').textContent = 'The image could not download. The public link is still available to copy.';
  } finally { byId('download-card').disabled = !prepared || prepared.removed; }
});

async function removeCard(card, button, output) {
  if (!card || card.removed) return;
  button.disabled = true;
  output.textContent = 'Removing this public card…';
  try {
    await client.revoke(card.id, card.manageToken);
    card.removed = true;
    card.manageToken = '';
    if (prepared?.id === card.id) {
      byId('share-url').value = '';
      byId('native-share').disabled = true;
      byId('copy-link').disabled = true;
      byId('download-card').disabled = true;
      byId('ready-title').textContent = 'This card has been removed.';
      byId('ready-panel').querySelector('.ready-copy').textContent = 'The service no longer serves this page or image. You can prepare another card.';
    }
    output.textContent = 'Card removed from this service. Copies saved by other apps may remain.';
    status.textContent = output.textContent;
    requestKey = null;
    requestPayloadKey = null;
    renderEarlierCards();
  } catch (error) {
    output.textContent = error.message || 'The card could not be removed. Please try again.';
    button.disabled = false;
  }
}
byId('remove-card').addEventListener('click', () => removeCard(prepared, byId('remove-card'), byId('share-status')));
function renderEarlierCards() {
  let section = byId('earlier-cards');
  if (!section) {
    section = document.createElement('details');
    section.id = 'earlier-cards';
    section.className = 'remove-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Earlier cards from this tab';
    section.append(summary);
    byId('ready-panel').append(section);
  }
  section.querySelectorAll('.earlier-card').forEach(node => node.remove());
  const earlier = managedCards.filter(card => card.id !== prepared?.id && !card.removed);
  section.hidden = !earlier.length;
  for (const card of earlier) {
    const row = document.createElement('div');
    row.className = 'earlier-card';
    const text = document.createElement('p');
    text.className = 'help';
    text.textContent = labelPayload(card.payload);
    const link = document.createElement('a');
    link.className = 'text-button';
    link.textContent = 'Open public card';
    link.href = card.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button danger';
    button.textContent = 'Remove earlier card';
    button.setAttribute('aria-label', 'Remove ' + labelPayload(card.payload));
    const feedback = document.createElement('p');
    feedback.className = 'help';
    feedback.setAttribute('role', 'status');
    button.addEventListener('click', () => removeCard(card, button, feedback));
    row.append(text, link, button, feedback);
    section.append(row);
  }
}

/* Called only by a host that already owns and validates its completed-result feed. */
export function acceptHostSnapshot(snapshot) {
  if (!config || !snapshot || snapshot.gameId !== 'wicked-bites' ||
      !Number.isSafeInteger(snapshot.score) || snapshot.score < 0 ||
      !config.games.some(game => game.id === snapshot.gameId && game.canShareScore)) return false;
  acceptedSnapshot = Object.freeze({
    gameId: snapshot.gameId, score: snapshot.score,
    achievedAt: typeof snapshot.achievedAt === 'string' ? snapshot.achievedAt : undefined
  });
  gameSelect.value = snapshot.gameId;
  form.querySelector('input[name=kind][value=score]').checked = true;
  scoreInput.value = String(snapshot.score);
  refreshControls();
  queuePreview();
  return true;
}

window.addEventListener('pagehide', () => {
  clearTimeout(previewTimer);
  previewController?.abort();
  previewRevision += 1;
  clearPreview();
  downloadUrls.forEach(url => URL.revokeObjectURL(url));
  downloadUrls.clear();
});
window.addEventListener('pageshow', event => { if (event.persisted && config) queuePreview(); });

async function boot() {
  try {
    config = await client.config();
    if (config.analyticsEnabled !== false) throw new ShareClientError('This card creator requires analytics to be disabled.');
    gameSelect.replaceChildren(...config.games.map(game => {
      const option = document.createElement('option');
      option.value = game.id;
      option.textContent = game.name;
      return option;
    }));
    gameSelect.disabled = false;
    for (const input of form.querySelectorAll('input[name=theme]')) input.disabled = !config.themes.includes(input.value);
    if (!config.themes.includes(chosen('theme'))) {
      const available = Array.from(form.querySelectorAll('input[name=theme]')).find(input => !input.disabled);
      if (available) available.checked = true;
    }
    refreshControls();
    queuePreview();
  } catch (error) {
    config = null;
    previewStage.setAttribute('aria-busy', 'false');
    byId('preview-state').textContent = 'Service unavailable';
    message(byId('form-error'), error.message || 'The card service is unavailable. Reload to try again.');
    status.textContent = 'The card creator is unavailable.';
  }
}
boot();
