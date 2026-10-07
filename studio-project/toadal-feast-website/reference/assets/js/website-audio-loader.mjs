function playerParts(doc = document) {
  const shell = doc.querySelector('[data-player-shell]');
  const frame = shell?.querySelector('[data-player-frame]');
  const gameId = shell?.getAttribute('data-game-id') || '';
  return shell && frame && gameId ? { shell, frame, gameId } : null;
}
function manifestUrl(frame) {
  const entry = new URL(frame.src, location.href);
  if (entry.origin !== location.origin) throw new Error('cartridge entry must be same-origin');
  return new URL('cartridge.json', entry);
}
function siteRoot(doc = document) {
  const brand = doc.querySelector('.site-brand');
  const path = brand ? new URL(brand.href, location.href).pathname : '/';
  return path === '/' ? '' : path.replace(/\/+$/, '');
}

export async function loadWebsiteAudioHost({ doc = document } = {}) {
  const parts = playerParts(doc); if (!parts) return null;
  let manifest;
  try {
    const response = await fetch(manifestUrl(parts.frame), { credentials: 'same-origin', redirect: 'error', cache: 'no-cache' });
    if (!response.ok) return null;
    manifest = await response.json();
  } catch (_) { return null; }
  if (!manifest?.audio || manifest.audio.mode !== 'host') return null;
  try {
    const moduleUrl = new URL(siteRoot(doc) + '/assets/js/website-audio-host.mjs', location.href);
    const mod = await import(moduleUrl.href);
    return await mod.attachWebsiteAudioHost({ doc, manifest });
  } catch (_) { return null; }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.self === window.top) {
  loadWebsiteAudioHost().catch(() => {});
}
