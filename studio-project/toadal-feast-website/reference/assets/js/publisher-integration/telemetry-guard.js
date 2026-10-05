(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalTelemetryGuard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORBIDDEN = new Set(['email','name','displayName','fullName','firstName','lastName','phone','address','ip','ipAddress','token','authorization','password','platformUserId','userId','deviceId','advertisingId','message','text']);
  const FORBIDDEN_NORMALIZED = new Set(Array.from(FORBIDDEN, key => key.replace(/[^a-z0-9]/gi, '').toLowerCase()));
  const EVENTS = Object.freeze({
    app_boot_started:['buildId','platform','profile'], app_boot_completed:['buildId','platform','durationMs'], app_boot_failed:['buildId','platform','stage','errorCode'],
    runtime_error:['buildId','platform','mode','errorCode','fatal'], session_started:['platform','buildId'], session_completed:['durationMs','modeCount'], mode_entered:['mode'], mode_completed:['mode','durationMs','result'],
    puzzle_attempt_started:['levelId','attempt'], puzzle_attempt_completed:['levelId','attempt','stars','restarts','undos','durationMs'], feastfall_round_completed:['result','score','durationMs','specialsUsed'],
    arcade_run_completed:['score','durationMs','defeatCause','characterId'], infinite_claim_completed:['elapsedBucket','capReached','claimBucket'], save_local_write:['slot','schemaVersion','durationMs'],
    save_cloud_write:['slot','version','durationMs'], save_cloud_conflict:['slot','localVersion','remoteVersion'], save_cloud_failure:['slot','errorCode'], backend_request_failed:['service','operation','statusBucket','errorCode'],
    premium_reward_claimed:['rewardKey','mode','amountBucket'], economy_reconciliation_mismatch:['currencyKey','deltaBucket'], daily_goal_completed:['goalKey'], daily_goal_claimed:['goalKey'],
    ad_opportunity_offered:['placement'], ad_opportunity_suppressed:['reason'], ad_impression:['provider','placement'], rewarded_completed:['placement'], pond_contribution_accepted:['weekKey','sourceType','unitsBucket'],
    pond_contribution_rejected:['weekKey','sourceType','reason'], share_intent_opened:['surface']
  });
  function scalar(v) { return v !== null && ['string','number','boolean'].includes(typeof v); }
  function plainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value)); }
  function findForbidden(value, path, out, seen) {
    path = path || '$'; out = out || [];
    if (!value || typeof value !== 'object') return out;
    seen = seen || new WeakSet();
    if (seen.has(value)) return out;
    seen.add(value);
    for (const [k,v] of Object.entries(value)) {
      if (FORBIDDEN_NORMALIZED.has(k.replace(/[^a-z0-9]/gi, '').toLowerCase())) out.push(path + '.' + k);
      if (v && typeof v === 'object') findForbidden(v, path + '.' + k, out, seen);
    }
    return out;
  }
  const enumValue = values => value => typeof value === 'string' && values.includes(value);
  const integer = (minimum, maximum) => value => Number.isSafeInteger(value) && value >= minimum && value <= maximum;
  const identifier = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,127}$/i.test(value);
  const errorCode = value => typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value);
  const numericBucket = value => {
    if (typeof value !== 'string' || !/^(?:0|[1-9]\d{0,6})(?:-(?:0|[1-9]\d{0,6})|\+)?$/.test(value)) return false;
    const bounds = value.replace(/\+$/, '').split('-').map(Number);
    return bounds.length === 1 || bounds[0] <= bounds[1];
  };
  // These event vocabulary values do not map a website preview to a canonical backend mode.
  const FIELD_RULES = Object.freeze({
    buildId:identifier, profile:() => false, platform:enumValue(['web','android','ios','desktop']),
    mode:enumValue(['puzzle','feastfall','arcade','infinite']), stage:enumValue(['config','identity','assets','game','services','boot']),
    errorCode, fatal:value => typeof value === 'boolean', capReached:value => typeof value === 'boolean',
    durationMs:value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 86400000,
    modeCount:integer(0,64), attempt:integer(1,1000000), stars:integer(0,3), restarts:integer(0,1000000), undos:integer(0,1000000), specialsUsed:integer(0,1000000),
    score:integer(0,Number.MAX_SAFE_INTEGER), schemaVersion:integer(1,10000), version:integer(0,Number.MAX_SAFE_INTEGER), localVersion:integer(0,Number.MAX_SAFE_INTEGER), remoteVersion:integer(0,Number.MAX_SAFE_INTEGER),
    result:enumValue(['complete','completed','win','loss','victory','defeat','success','failure','abandoned']),
    levelId:value => typeof value === 'string' && /^(?:level|puzzle)[_-][0-9]{1,6}$/.test(value), slot:enumValue(['website-progression','main']),
    service:enumValue(['froggy-locker','identity','saves','profiles','leaderboards','telemetry','config','privacy','rewards','economy']),
    operation:enumValue(['GET','POST','PUT','PATCH','DELETE','read','write','flush','load','save','login','register','reconcile']), statusBucket:enumValue(['network','timeout','2xx','3xx','4xx','5xx']), currencyKey:enumValue(['jeweled_candy']),
    elapsedBucket:numericBucket, claimBucket:numericBucket, amountBucket:numericBucket, deltaBucket:numericBucket, unitsBucket:numericBucket,
    weekKey:value => typeof value === 'string' && /^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(value), sourceType:enumValue(['puzzle','feastfall','arcade','infinite']), surface:enumValue(['home','player','profile','leaderboards']),
    // Catalogue IDs require an explicit finite allowlist; held services do not invent IDs.
    characterId:() => false, rewardKey:() => false, goalKey:() => false, defeatCause:() => false, placement:() => false, provider:() => false, reason:() => false
  });
  const REQUIRED = Object.freeze({
    session_started:['platform','buildId'], mode_entered:['mode'], mode_completed:['mode','durationMs','result'],
    puzzle_attempt_started:['levelId','attempt'], puzzle_attempt_completed:['levelId','attempt','stars'],
    save_cloud_write:['slot','version'], save_cloud_conflict:['slot','localVersion','remoteVersion'], save_cloud_failure:['slot','errorCode']
  });
  function validatesField(key, value, policy) {
    const approved = policy?.values?.[key];
    if (Array.isArray(approved)) return identifier(value) && approved.includes(value);
    return Boolean(FIELD_RULES[key]?.(value));
  }
  function sanitize(name, data, policy) {
    if (!Object.prototype.hasOwnProperty.call(EVENTS, name)) return { ok:false, reason:'unknown-event' };
    if (!plainObject(data)) return { ok:false, reason:'invalid-event-data' };
    const forbidden = findForbidden(data);
    if (forbidden.length) return { ok:false, reason:'forbidden-pii-field', fields:forbidden };
    for (const [key,value] of Object.entries(data)) {
      if (!scalar(value)) return { ok:false, reason:'non-scalar-field', field:key };
      if (typeof value === 'number' && !Number.isFinite(value)) return { ok:false, reason:'invalid-number', field:key };
    }
    const output = {};
    for (const key of EVENTS[name]) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      const value = data[key];
      if (typeof value === 'number' && !Number.isFinite(value)) return { ok:false, reason:'invalid-number', field:key };
      if (!validatesField(key,value,policy)) return { ok:false, reason:'invalid-field-value', field:key };
      output[key] = value;
    }
    for (const key of REQUIRED[name] || []) if (!Object.prototype.hasOwnProperty.call(output,key)) return { ok:false, reason:'missing-required-field', field:key };
    return { ok:true, event:{ name, data:output } };
  }
  function deliveryFailure(error) { return { accepted:false, reason:'telemetry-delivery-failed', retryable:true, code:errorCode(error?.code) ? error.code : 'TELEMETRY_ERROR', status:integer(0,599)(error?.status) ? error.status : 0 }; }
  class GuardedTelemetry {
    constructor(client, policy) {
      if (!client) throw new Error('client required'); this.client=client;
      this.policy={values:{...(policy?.values || {})}};
      if (typeof client.buildId === 'string') this.policy.values.buildId=[client.buildId];
      if (typeof client.platform === 'string') this.policy.values.platform=[client.platform];
    }
    track(name, data, time) {
      return Promise.resolve().then(() => {
        const s=sanitize(name,data,this.policy); if(!s.ok) return {accepted:false,...s};
        if (time !== undefined && (typeof time !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(time) || !Number.isFinite(Date.parse(time)))) return {accepted:false,reason:'invalid-event-time'};
        return Promise.resolve(this.client.track(name,s.event.data,time)).then(count=>({accepted:true,queuedOrAccepted:count}));
      }).catch(deliveryFailure);
    }
    flush(options) { return Promise.resolve().then(() => this.client.flushTelemetry(options)).catch(deliveryFailure); }
  }
  return { EVENTS, FORBIDDEN, FIELD_RULES, findForbidden, sanitize, GuardedTelemetry };
});
