(function (root, factory) {
  const configApi = (typeof module === 'object' && module.exports) ? require('./toadal-runtime-config.js') : root.ToadalRuntimeConfig;
  const froggyApi = (typeof module === 'object' && module.exports) ? require('./froggy-client.js') : root.ToadalFroggyClient;
  const localApi = (typeof module === 'object' && module.exports) ? require('./local-progression-adapter.js') : root.ToadalLocalProgressionAdapter;
  const syncApi = (typeof module === 'object' && module.exports) ? require('./cloud-sync.js') : root.ToadalCloudSync;
  const telemetryApi = (typeof module === 'object' && module.exports) ? require('./telemetry-guard.js') : root.ToadalTelemetryGuard;
  const leaderboardApi = (typeof module === 'object' && module.exports) ? require('./leaderboard-adapter.js') : root.ToadalLeaderboardAdapter;
  const api = factory(configApi,froggyApi,localApi,syncApi,telemetryApi,leaderboardApi);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ToadalIntegrationController = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (configApi,froggyApi,localApi,syncApi,telemetryApi,leaderboardApi) {
  'use strict';
  const AGE_BANDS = ['under_13','13_15','16_17','18_plus'];
  function registrationDocuments(value) {
    const documents=value?.documents;
    if(!Array.isArray(documents)||!documents.length||documents.some(d=>!d||typeof d!=='object'||Array.isArray(d)||typeof d.requiredForAccounts!=='boolean'))return null;
    const required=documents.filter(d=>d.requiredForAccounts===true);
    if(!required.length||required.length>20||new Set(required.map(d=>d.key)).size!==required.length||required.some(d=>typeof d.key!=='string'||!/^[-a-z0-9_]{1,64}$/i.test(d.key)||d.approved!==true||typeof d.version!=='string'||!d.version||d.version.length>128||/draft/i.test(d.version)||typeof d.path!=='string'||!d.path||d.path.length>2048||d.path.startsWith('//')||d.path.includes('\\')||(!d.path.startsWith('/')&&!/^https:\/\//i.test(d.path))))return null;
    for(const d of required){try{const url=new URL(d.path,'https://legal.invalid');if(url.protocol!=='https:'||url.username||url.password)return null;}catch(_){return null;}}
    return required.map(d=>({key:d.key,version:d.version,path:d.path,title:typeof d.title==='string'?d.title:d.key}));
  }
  function audienceEligible(policy,assertion,ageBand) {
    if(!AGE_BANDS.includes(ageBand)||assertion?.ageBand!==ageBand||assertion?.policyVersion!==policy?.policyVersion)return false;
    if(policy.classification==='child_directed'||policy.classification==='mixed'&&ageBand==='under_13')return Boolean(assertion.parentalConsentVerifiedAt);
    return ['general','mixed'].includes(policy.classification);
  }
  class Controller {
    constructor(options) {
      options=options||{}; this.config=configApi.normalize(options.config||{enabled:false});
      this.localStorage=options.localStorage || globalThis.localStorage; this.sessionStorage=options.sessionStorage || globalThis.sessionStorage;
      this.client=new froggyApi.Client({baseUrl:this.config.apiBaseUrl,gameId:this.config.gameId,buildId:this.config.buildId,environmentId:this.config.environment,platform:'web',fetchImpl:options.fetchImpl||globalThis.fetch,storage:this.sessionStorage,timeoutMs:this.config.requestTimeoutMs,telemetryBatchSize:this.config.telemetryBatchSize,telemetryMaxQueue:this.config.telemetryMaxQueue});
      this.sync=new syncApi.Coordinator({client:this.client,storage:this.localStorage,slot:'website-progression',includeLocalScores:false,allowWrites:()=>this.permits('cloudWrite')});
      this.telemetry=new telemetryApi.GuardedTelemetry(this.client);
      this.leaderboards=new leaderboardApi.Leaderboards({client:this.client,readEnabled:this.config.features.globalLeaderboardsRead,submitEnabled:this.config.features.globalLeaderboardsSubmit});
      this.lastProbe=null;
    }
    permits(feature) {
      const p=this.lastProbe, f=this.config.features;
      if(!this.config.enabled || !p?.ok || p.controls?.maintenance !== false) return false;
      const c=p.capabilities?.capabilities||{}, controls=p.controls;
      const allowed={
        accounts:f.accounts && c.accounts===true,
        guest:f.accounts && c.guest_identity===true && controls.guestSessionsEnabled===true,
        registration:f.accounts && f.accountRegistration && c.accounts===true && controls.accountCreationEnabled===true && ['general','mixed','child_directed'].includes(p.audiencePolicy?.classification),
        cloudSync:f.cloudSync && c.cloud_save===true,
        cloudWrite:f.cloudSync && c.cloud_save===true && controls.cloudSaveWritesEnabled===true,
        telemetry:f.telemetry && c.telemetry===true && controls.telemetryEnabled===true,
        achievements:f.achievements && c.achievements===true,
        entitlements:f.entitlements && c.entitlements===true,
        balance:c.economy===true,
        privacy:f.accounts && c.privacy_ops===true,
        globalLeaderboardsRead:f.globalLeaderboardsRead && c.leaderboards===true && controls.leaderboardsEnabled===true,
        globalLeaderboardsSubmit:f.globalLeaderboardsSubmit && c.leaderboards===true && controls.leaderboardsEnabled===true,
        push:f.push && c.notifications===true && controls.notificationsEnabled===true
      };
      return Boolean(allowed[feature]);
    }
    requireFeature(feature) { if(!this.permits(feature)) throw new froggyApi.FroggyError(0,'FEATURE_HELD','This connected feature is currently unavailable.'); }
    async probe() {
      if(!this.config.enabled) return this.lastProbe={ok:false,disabled:true};
      try {
        const [caps,remoteConfig]=await Promise.all([this.client.capabilities(),this.client.config()]);
        if(caps.gameId!==this.config.gameId || caps.effectiveEnvironment!==this.config.environment || remoteConfig.gameId!==this.config.gameId || remoteConfig.environmentId!==this.config.environment || remoteConfig.status!=='active' || !remoteConfig.config || !caps.effectiveControls) throw new froggyApi.FroggyError(0,'CONFIG_SCOPE_MISMATCH','The connected configuration does not match this website.');
        const controls={};
        for(const key of ['guestSessionsEnabled','accountCreationEnabled','cloudSaveWritesEnabled','leaderboardsEnabled','telemetryEnabled','premiumRewardsEnabled','commerceEnabled','adsEnabled','notificationsEnabled','merchCheckoutEnabled']) controls[key]=caps.effectiveControls[key]===true && remoteConfig.config[key]===true;
        controls.maintenance=caps.effectiveControls.maintenance!==false || remoteConfig.config.maintenance!==false;
        let me=null, audiencePolicy=null;
        try { me=await this.client.me(); } catch(e) { if(e.status!==401) throw e; this.client.setSession(null); }
        if(this.config.features.accountRegistration) audiencePolicy=await this.client.audiencePolicy();
        this.leaderboards.readEnabled=this.config.features.globalLeaderboardsRead && caps.capabilities?.leaderboards===true && controls.leaderboardsEnabled && !controls.maintenance;
        this.leaderboards.submitEnabled=this.config.features.globalLeaderboardsSubmit && caps.capabilities?.leaderboards===true && controls.leaderboardsEnabled && !controls.maintenance;
        return this.lastProbe={ok:true,capabilities:caps,remoteConfig,controls,identity:me,audiencePolicy};
      } catch(error) { this.leaderboards.readEnabled=this.leaderboards.submitEnabled=false; return this.lastProbe={ok:false,error:{code:error.code||'ERROR',status:error.status||0,message:error.message}}; }
    }
    async ensureGuest() { if(!this.client.token) this.requireFeature('guest'); return this.client.ensureGuest(); }
    async registrationState() {
      await this.probe();
      if(!this.permits('registration'))return{ready:false,reason:'registration-held'};
      const policy=this.lastProbe.audiencePolicy;
      if(policy.neutralAgeScreen!==true||typeof policy.policyVersion!=='string'||!policy.policyVersion||/unknown|draft/i.test(policy.policyVersion))return{ready:false,reason:'audience-policy-held'};
      const documents=registrationDocuments(await this.client.request('/v1/legal/documents',{auth:false}));
      if(!documents)return{ready:false,reason:'legal-documents-held'};
      return{ready:true,policy:{classification:policy.classification,policyVersion:policy.policyVersion},documents,ageBands:AGE_BANDS.slice()};
    }
    async register(email,password,registration) {
      const plan=await this.registrationState();
      if(!plan.ready)throw new froggyApi.FroggyError(0,'FEATURE_HELD','Account creation awaits approved audience and legal activation.');
      const acceptances=registration?.legalAcceptances;
      if(registration?.audienceAccepted!==true||!AGE_BANDS.includes(registration?.ageBand)||!Array.isArray(acceptances)||plan.documents.some(d=>!acceptances.some(a=>a?.documentKey===d.key&&a?.documentVersion===d.version))||acceptances.length!==plan.documents.length)throw new froggyApi.FroggyError(0,'LEGAL_ACCEPTANCE_REQUIRED','Explicit current document consent and neutral age selection are required.');
      await this.ensureGuest();await this.client.classifyAudience(registration.ageBand);
      const audience=await this.client.audienceState();
      if(!audienceEligible(audience.policy,audience.assertion,registration.ageBand))throw new froggyApi.FroggyError(0,'AUDIENCE_ACCOUNT_HELD','This age band requires an approved consent path before email account creation.');
      await this.probe();this.requireFeature('registration');
      if(this.lastProbe.audiencePolicy.policyVersion!==plan.policy.policyVersion)throw new froggyApi.FroggyError(0,'AUDIENCE_POLICY_CHANGED','Review the current audience policy before continuing.');
      const account=await this.client.register({email,password,legalAcceptances:plan.documents.map(d=>({documentKey:d.key,documentVersion:d.version})),locale:'en',platform:'web'});
      if(this.lastProbe?.ok)this.lastProbe.identity=account;let sync={ok:true,action:'disabled'};
      if(this.permits('cloudSync')){try{sync=await this.sync.reconcile();}catch(error){sync={ok:false,action:'unavailable',reason:error.code||'ERROR'};}}
      return{account,sync};
    }
    async requestPasswordReset(email) {
      await this.probe();this.requireFeature('accounts');
      return this.client.requestPasswordReset(email);
    }
    async completePasswordReset(token,newPassword) {
      await this.probe();this.requireFeature('accounts');
      if(!this.config.accountOrigin)throw new froggyApi.FroggyError(0,'ACCOUNT_RECOVERY_HELD','A public account recovery URL has not been approved for this website.');
      if(typeof token!=='string'||!token||token.length>512)throw new froggyApi.FroggyError(0,'TOKEN_REQUIRED','A valid provider recovery token is required.');
      const out=await this.client.completePasswordReset({token,newPassword});if(this.lastProbe?.ok)this.lastProbe.identity=null;return out;
    }
    async login(email,password) { this.requireFeature('accounts'); const account=await this.client.login({email,password}); if(this.lastProbe?.ok)this.lastProbe.identity=account; let sync={ok:true,action:'disabled'}; if(this.permits('cloudSync')){try{sync=await this.sync.reconcile();}catch(error){sync={ok:false,action:'unavailable',reason:error.code||'ERROR'};}} return {account,sync}; }
    logout() { return this.client.logout(); }
    logoutEverywhere() { return this.client.logoutEverywhere(); }
    me() { return this.client.me(); }
    async profile() { this.requireFeature('accounts'); await this.ensureGuest(); return this.client.profile(); }
    async updateProfile(patch) { this.requireFeature('accounts'); await this.ensureGuest(); return this.client.updateProfile(patch); }
    async syncNow() { await this.probe(); return this.permits('cloudSync') ? this.sync.reconcile() : {ok:false,action:'disabled'}; }
    resolveSync(strategy, conflict) { this.requireFeature('cloudSync'); return this.sync.resolve(strategy,conflict); }
    achievements() { return this.permits('achievements') ? this.client.achievements() : Promise.resolve([]); }
    async balance() { this.requireFeature('balance'); await this.ensureGuest(); return this.client.balance('jeweled_candy'); }
    entitlements() { return this.permits('entitlements') ? this.client.entitlements() : Promise.resolve([]); }
    topScores(mode,limit) { this.leaderboards.readEnabled=this.permits('globalLeaderboardsRead'); return this.leaderboards.top(mode,limit); }
    submitScore(run,eligibility) { this.leaderboards.submitEnabled=this.permits('globalLeaderboardsSubmit'); return this.leaderboards.submitCompletedRun(run,eligibility); }
    track(name,data,time) { return this.permits('telemetry') ? this.telemetry.track(name,data,time) : Promise.resolve({accepted:false,reason:'telemetry-disabled'}); }
    flushTelemetry(options) { return this.permits('telemetry') ? this.telemetry.flush(options) : Promise.resolve(0); }
    async requestPrivacy(type,confirm) { this.requireFeature('privacy'); await this.ensureGuest(); return this.client.requestPrivacy(type,confirm); }
    privacyRequests() { this.requireFeature('privacy'); return this.client.privacyRequests(); }
    privacyExport(id) { this.requireFeature('privacy'); return this.client.privacyExport(id); }
    audiencePolicy() { return this.client.audiencePolicy(); }
    audienceState() { return this.client.audienceState(); }
    classifyAudience(ageBand) { return this.client.classifyAudience(ageBand); }
    legalState() { return this.client.legalState(); }
    acceptLegal(documentKey,documentVersion,options) { return this.client.acceptLegal(documentKey,documentVersion,options); }
    remoteConfig() { return this.client.config(); }
    serviceStatus() { return this.client.serviceStatus(); }
    registerPush(provider,token,options) { return this.permits('push') ? this.client.registerPush(provider,token,options) : Promise.resolve({ok:false,reason:'push-disabled'}); }
    unregisterPush(provider,token) { return this.client.unregisterPush(provider,token); }
    localSnapshot() { return localApi.makePayload(this.localStorage,{includeLocalScores:true}); }
  }
  return { Controller, registrationDocuments, audienceEligible };
});
