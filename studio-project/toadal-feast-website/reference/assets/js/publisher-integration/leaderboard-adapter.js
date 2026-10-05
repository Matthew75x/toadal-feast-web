(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalLeaderboardAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function normalizeScore(value) {
    if (Number.isSafeInteger(value) && value >= 0) return value;
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) { const n=Number(value.trim()); if(Number.isSafeInteger(n)) return n; }
    return null;
  }
  function normalizeMode(value) { return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(value) ? value : null; }
  class Leaderboards {
    constructor(options) { options=options||{}; if(!options.client) throw new Error('client required'); this.client=options.client; this.readEnabled=options.readEnabled!==false; this.submitEnabled=options.submitEnabled===true; }
    async top(mode, limit) { mode=normalizeMode(mode); if(!mode) return {ok:false,reason:'invalid-mode'}; if(!this.readEnabled) return {ok:false,reason:'global-read-disabled'}; return {ok:true,scores:await this.client.topScores(mode,{limit})}; }
    async submitCompletedRun(run, eligibility) {
      const mode=normalizeMode(run?.mode); const score=normalizeScore(run?.score);
      if(!mode||score===null) return {ok:false,reason:'invalid-run'};
      if(!this.submitEnabled) return {ok:false,reason:'global-submit-disabled'};
      if(!eligibility || eligibility.eligible !== true) return {ok:false,reason:'run-not-eligible'};
      if(eligibility.source !== 'validated-game-complete') return {ok:false,reason:'untrusted-source'};
      return {ok:true,score:await this.client.submitScore(mode,score)};
    }
  }
  return { normalizeScore, normalizeMode, Leaderboards };
});
