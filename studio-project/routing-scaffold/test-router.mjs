import assert from "node:assert/strict";
import {
  campaignFor,
  chooseDestination,
  codeFromLocation,
  normalizeCode,
  platformFamily,
  resolveRoute,
} from "./router.mjs";

const destinations = {
  website: "https://toadalfeast.com/",
  android: "https://play.google.com/store/apps/details?id=com.toadalfeast.game",
  ios: "https://apps.apple.com/app/idPLACEHOLDER",
};

assert.equal(normalizeCode(" APP-QR "), "app_qr");
assert.equal(normalizeCode("app_share"), "app_share");
assert.equal(normalizeCode("bad<script>"), "badscript");

assert.deepEqual(campaignFor("app_qr"), {
  code: "app_qr",
  source: "app",
  medium: "qr",
  campaign: "nearby_share",
});

assert.equal(
  codeFromLocation("https://toadalfeast.com/?ref=app_qr"),
  "app_qr",
);
assert.equal(
  codeFromLocation("https://toadalfeast.com/go/app-share"),
  "app_share",
);

assert.equal(platformFamily("Mozilla/5.0 (Linux; Android 16)"), "android");
assert.equal(platformFamily("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), "ios");
assert.equal(platformFamily("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "website");

assert.equal(
  chooseDestination({ userAgent: "Android", destinations }),
  destinations.android,
);
assert.equal(
  chooseDestination({ userAgent: "iPhone", destinations }),
  destinations.ios,
);

const qr = resolveRoute({
  url: "https://toadalfeast.com/?ref=app_qr",
  userAgent: "Android",
  destinations,
});
assert.equal(qr.code, "app_qr");
assert.equal(qr.source, "app");
assert.equal(qr.medium, "qr");
assert.equal(qr.campaign, "nearby_share");
assert.equal(qr.destination, destinations.android);
assert.equal(qr.knownCampaign, true);

const unknown = resolveRoute({
  url: "https://toadalfeast.com/go/not-a-real-campaign",
  userAgent: "Desktop",
  destinations,
});
assert.equal(unknown.knownCampaign, false);
assert.equal(unknown.destination, destinations.website);

console.log("QR attribution routing scaffold: PASS");
