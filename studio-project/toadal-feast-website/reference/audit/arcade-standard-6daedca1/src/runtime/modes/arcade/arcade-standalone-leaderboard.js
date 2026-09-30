// Standalone-only host capability normally supplied by full-game ui-core.js.
function addLeaderboardEntry(score, runContext = null) {
  const safeScore = Math.max(0, Math.floor(Number(score) || 0));
  if (safeScore <= 0) return null;
  const context = runContext || (typeof ArcadeRunRules !== 'undefined'
    ? ArcadeRunRules.snapshot()
    : { mode:GameState.currentMode || 'standard', ruleset:'legacy', label:'Legacy', key:`${GameState.currentMode || 'standard'}:legacy` });
  const mode = String(context.mode || GameState.currentMode || 'standard');
  const ruleset = String(context.ruleset || 'legacy');
  const rulesetKey = typeof ArcadeRunRules !== 'undefined'
    ? ArcadeRunRules.keyFor(mode, ruleset)
    : `${mode}:${ruleset}`;
  let result = null;
  SaveManager.set(data => {
    if (!Array.isArray(data.leaderboard)) data.leaderboard = [];
    if (!data.bestScoresByRuleset || typeof data.bestScoresByRuleset !== 'object' || Array.isArray(data.bestScoresByRuleset)) {
      data.bestScoresByRuleset = {};
    }
    const previousRulesetBest = Math.max(0, Math.floor(Number(data.bestScoresByRuleset[rulesetKey]) || 0));
    const entry = {
      score: safeScore,
      charId: typeof getCharDef === 'function' ? getCharDef().id : GameState.selectedCharacterId,
      mode,
      ruleset,
      rulesetKey,
      date: Date.now(),
    };
    data.leaderboard.push(entry);
    data.leaderboard.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    data.leaderboard = data.leaderboard.slice(0, 50);
    if (safeScore > previousRulesetBest) data.bestScoresByRuleset[rulesetKey] = safeScore;
    // Shared progression and mode unlocks intentionally continue to use the
    // all-rules global best, so comfort/accessibility never blocks content.
    if (safeScore > Number(data.bestScore || 0)) data.bestScore = safeScore;
    result = { entry, previousRulesetBest, newRulesetBest:safeScore > previousRulesetBest };
  });
  return result;
}
