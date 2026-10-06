import { initWasm, Resvg } from '@resvg/resvg-wasm';
import wasm from '@resvg/resvg-wasm/index_bg.wasm';
import header from '../assets/toadal-feast-header.png';
import frame from '../assets/astro-score-frame.png';
import toad from '../assets/toadal-victory.png';
import font from '../assets/LilitaOne-Latin.ttf';
import { createRenderer, dataPng } from './renderer.mjs';
import { normalizePayload } from './contract.mjs';
import { createService } from './service.mjs';
import { R2Store } from './stores.mjs';
import { createBurstLimiter } from './burst-limit.mjs';
type RuntimeEnv = Pick<Cloudflare.Env, 'CARDS' | 'ASSETS'> & {
  PUBLIC_ORIGIN: string; ALLOWED_ORIGINS: string; PLAY_BASE: string;
  CREATION_ENABLED: string; ALLOW_PUBLIC_ALIAS: string; RETENTION_DAYS: string;
  MAX_DAILY_CREATES: string; MAX_DAILY_RENDERS: string;
};
// Only immutable build assets / a Wasm initialization promise are shared.
let initialized: Promise<void> | undefined;
const assets = { header: dataPng(header), frame: dataPng(frame), toad: dataPng(toad) };
const renderer = createRenderer(Resvg, assets, new Uint8Array(font));
function serviceFor(env: RuntimeEnv) {
  const store = new R2Store(env.CARDS);
  return createService({
    store,
    render: async (card: ReturnType<typeof normalizePayload>) => { initialized ||= initWasm(wasm); await initialized; return renderer(card); },
    origin: env.PUBLIC_ORIGIN,
    allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(value => value.trim()).filter(Boolean),
    playBase: env.PLAY_BASE,
    creationEnabled: env.CREATION_ENABLED === 'true',
    aliasAllowed: env.ALLOW_PUBLIC_ALIAS === 'true',
    retentionDays: Number(env.RETENTION_DAYS),
    maxDailyCreates: Number(env.MAX_DAILY_CREATES),
    maxDailyRenders: Number(env.MAX_DAILY_RENDERS),
    rateLimit: createBurstLimiter(store, { dailyRenderLimit: Number(env.MAX_DAILY_RENDERS) }),
  });
}
const worker: ExportedHandler<RuntimeEnv> = {
  async fetch(request, env) {
    try {
      const path = new URL(request.url).pathname;
      if(path.startsWith('/api/') || path.startsWith('/s/') || path === '/health') return serviceFor(env).fetch(request);
      const response = await env.ASSETS.fetch(request), headers = new Headers(response.headers);
      headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
      headers.set('Referrer-Policy', 'no-referrer'); headers.set('X-Content-Type-Options', 'nosniff'); headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(response.body, { status: response.status, headers });
    } catch { return Response.json({ error: 'The card service is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
  },
  async scheduled(_controller, env) { await serviceFor(env).cleanup(); },
};
export default worker;
