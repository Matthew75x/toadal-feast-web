import assert from "node:assert/strict";

const vars = new Map();
globalThis.Netlify = {
  env: {
    get(name) {
      return vars.get(name) ?? undefined;
    },
  },
};

const { default: handler } = await import(
  "../../netlify/edge-functions/acquisition-router.ts"
);

function context() {
  return {
    nextCalled: false,
    async next() {
      this.nextCalled = true;
      return new Response("NEXT", { status: 200 });
    },
  };
}

async function run(url, userAgent = "") {
  const ctx = context();
  const request = new Request(url, {
    headers: userAgent ? { "user-agent": userAgent } : {},
  });
  const response = await handler(request, ctx);
  return { response, ctx };
}

vars.clear();
let result = await run("https://toadalfeast.com/");
assert.equal(result.ctx.nextCalled, true);
assert.equal(result.response.status, 200);

result = await run("https://toadalfeast.com/?ref=app_qr");
assert.equal(result.ctx.nextCalled, true);

result = await run("https://toadalfeast.com/go/app-qr");
assert.equal(result.response.status, 302);
assert.equal(
  result.response.headers.get("location"),
  "https://toadalfeast.com/?ref=app_qr",
);

result = await run("https://toadalfeast.com/go/not-real");
assert.equal(result.response.status, 302);
assert.equal(
  result.response.headers.get("location"),
  "https://toadalfeast.com/",
);

vars.set("TOADAL_ROUTE_TO_STORES", "true");
vars.set(
  "TOADAL_ANDROID_STORE_URL",
  "https://play.google.com/store/apps/details?id=com.toadalfeast.game",
);
result = await run(
  "https://toadalfeast.com/go/app-qr",
  "Mozilla/5.0 (Linux; Android 16)",
);
assert.equal(result.response.status, 302);
assert.equal(
  result.response.headers.get("location"),
  "https://play.google.com/store/apps/details?id=com.toadalfeast.game",
);

console.log("Netlify acquisition edge scaffold: PASS");
