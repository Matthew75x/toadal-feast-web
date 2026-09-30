#!/usr/bin/env node

const env = process.env;
const direct = env.TOADAL_ROUTE_TO_STORES === "true";
const website = (env.TOADAL_WEBSITE_URL || "https://toadalfeast.com/").trim();
const android = (env.TOADAL_ANDROID_STORE_URL || "").trim();
const ios = (env.TOADAL_IOS_STORE_URL || "").trim();

const errors = [];
const warnings = [];

function validHttpUrl(value, label) {
  try {
    const u = new URL(value);
    if (!/^https?:$/.test(u.protocol)) throw new Error("unsupported protocol");
  } catch {
    errors.push(`${label} is not a valid http(s) URL: ${value}`);
  }
}

validHttpUrl(website, "TOADAL_WEBSITE_URL");

if (direct) {
  if (!android) errors.push("TOADAL_ROUTE_TO_STORES=true requires TOADAL_ANDROID_STORE_URL");
  if (!ios) errors.push("TOADAL_ROUTE_TO_STORES=true requires TOADAL_IOS_STORE_URL");
  if (android) validHttpUrl(android, "TOADAL_ANDROID_STORE_URL");
  if (ios) validHttpUrl(ios, "TOADAL_IOS_STORE_URL");
} else {
  if (android || ios) warnings.push("Store URLs are configured but direct store routing is disabled; website-first routing remains active.");
}

console.log(JSON.stringify({
  schema: "toadal-feast.acquisition-env-check.v1",
  website,
  directStoreRouting: direct,
  androidStoreConfigured: Boolean(android),
  iosStoreConfigured: Boolean(ios),
  errors,
  warnings
}, null, 2));

if (errors.length) process.exitCode = 1;
