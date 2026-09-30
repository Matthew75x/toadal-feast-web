import {
  campaignFor,
  codeFromLocation,
  platformFamily,
} from "../../studio-project/routing-scaffold/router.mjs";

const WEBSITE_URL = "https://toadalfeast.com/";

function env(name: string): string | null {
  const value = Netlify.env.get(name);
  return value && value.trim() ? value.trim() : null;
}

function websiteDestination(code: string | null): string {
  const target = new URL(env("TOADAL_WEBSITE_URL") || WEBSITE_URL);
  if (code) target.searchParams.set("ref", code);
  return target.toString();
}

function storeDestination(platform: string): string | null {
  if (platform === "android") return env("TOADAL_ANDROID_STORE_URL");
  if (platform === "ios") return env("TOADAL_IOS_STORE_URL");
  return null;
}

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const code = codeFromLocation(url);

  if (!code) {
    return context.next();
  }

  const campaign = campaignFor(code);
  if (!campaign) {
    return Response.redirect(websiteDestination(null), 302);
  }

  // Current product intent: QR/share traffic reaches the TOADAL FEAST website
  // first. Direct store routing can be enabled later without changing printed QR
  // artwork or the Android share payload.
  const directStoreRouting = env("TOADAL_ROUTE_TO_STORES") === "true";

  if (directStoreRouting) {
    const platform = platformFamily(request.headers.get("user-agent") || "");
    const store = storeDestination(platform);
    if (store) {
      return Response.redirect(store, 302);
    }
  }

  // Pretty routes normalize to the website's legacy-compatible ref query.
  if (url.pathname.startsWith("/go/")) {
    return Response.redirect(websiteDestination(campaign.code), 302);
  }

  // Legacy Android 1.2.9 query forms already point at the website. Keep serving
  // the page normally so analytics or landing-page logic can consume ?ref=.
  return context.next();
};

export const config = {
  path: ["/*"],
};
