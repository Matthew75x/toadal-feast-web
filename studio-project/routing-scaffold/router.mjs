export const ROUTE_VERSION = 1;

export const DEFAULT_DESTINATIONS = Object.freeze({
  website: "https://toadalfeast.com/",
  android: null,
  ios: null,
});

export const CAMPAIGNS = Object.freeze({
  app_qr: Object.freeze({
    source: "app",
    medium: "qr",
    campaign: "nearby_share",
  }),
  app_share: Object.freeze({
    source: "app",
    medium: "native_share",
    campaign: "player_share",
  }),
  sticker_public: Object.freeze({
    source: "offline",
    medium: "qr",
    campaign: "public_sticker",
  }),
});

const ALIASES = Object.freeze({
  "app-qr": "app_qr",
  "app-share": "app_share",
  "sticker-public": "sticker_public",
});

export function normalizeCode(rawCode) {
  const value = String(rawCode || "").trim().toLowerCase();
  if (!value) return null;
  const safe = value.replace(/[^a-z0-9_-]/g, "");
  if (!safe) return null;
  return ALIASES[safe] || safe;
}

export function campaignFor(rawCode) {
  const code = normalizeCode(rawCode);
  const record = code ? CAMPAIGNS[code] : null;
  return record ? { code, ...record } : null;
}

export function codeFromLocation(input) {
  const url = input instanceof URL ? input : new URL(String(input), DEFAULT_DESTINATIONS.website);
  const queryCode = normalizeCode(url.searchParams.get("ref"));
  if (queryCode) return queryCode;

  const match = url.pathname.match(/^\/go\/([^/?#]+)\/?$/i);
  return match ? normalizeCode(match[1]) : null;
}

export function platformFamily(userAgent = "") {
  const ua = String(userAgent).toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/(iphone|ipad|ipod)/.test(ua)) return "ios";
  return "website";
}

export function chooseDestination({ userAgent = "", destinations = DEFAULT_DESTINATIONS } = {}) {
  const platform = platformFamily(userAgent);
  const candidate = destinations?.[platform];
  return candidate || destinations?.website || DEFAULT_DESTINATIONS.website;
}

export function resolveRoute({
  url,
  userAgent = "",
  destinations = DEFAULT_DESTINATIONS,
} = {}) {
  const code = codeFromLocation(url || DEFAULT_DESTINATIONS.website);
  const campaign = campaignFor(code);
  const destination = chooseDestination({ userAgent, destinations });

  return {
    routeVersion: ROUTE_VERSION,
    code: campaign?.code || null,
    source: campaign?.source || "unknown",
    medium: campaign?.medium || "unknown",
    campaign: campaign?.campaign || "unattributed",
    platform: platformFamily(userAgent),
    destination,
    knownCampaign: Boolean(campaign),
  };
}
