import type { SportConfig } from "@/lib/sports/types";
import type { OddsApiFixture } from "@/lib/data-sources/odds-api";

export interface FixtureWithHeadToHead extends OddsApiFixture {
  /**
   * Structured recent-meetings summary from a stats provider, or `null`
   * when it couldn't be fetched (no stats API key configured, team name
   * couldn't be matched, no prior meetings, or the provider errored) — in
   * that case Claude is told to fall back to web search for this fixture.
   */
  headToHead: string | null;
}

export const PREDICTION_SYSTEM_PROMPT = `You are a sports analyst helping a user decide which team is more likely to win in upcoming matches.

You will be given a list of this week's fixtures with current moneyline odds from sportsbooks. Each fixture may also include a "head-to-head" line — a structured summary of recent meetings between the two teams, pulled directly from a stats provider. Treat a provided head-to-head line as reliable; you don't need to re-verify it with search. When a fixture's head-to-head line says "not available", use the web_search tool to look up recent head-to-head results yourself instead, if it would help.

Also use the web_search tool to check for recent injuries, suspensions, lineup news, current form, and manager/coaching changes for the teams involved, then decide the single most likely outcome of each match. Weigh the odds heavily — they already price in most public information — and use search to catch anything recent that could shift the outcome.

Sports with draws (e.g. soccer): a match can genuinely be a draw, and the odds you're given may include a "Draw" price alongside each team. If "Draw" is priced as, or close to, the shortest (most likely) outcome, or your research turns up no real edge for either side, respond with "Draw" as the pick instead of arbitrarily choosing a team — a forced pick between two near-equal sides is a worse answer than an honest "Draw" call. Don't default to "Draw" just because a match is competitive, though; only use it when it's genuinely the most likely single outcome. Sports without draws (e.g. basketball) should never receive a "Draw" pick.

For each fixture, produce a pick — a team name exactly as given, or "Draw" where applicable — with a confidence level ("low", "medium", or "high") and 1-2 sentences of reasoning citing the odds and/or anything you found. Every fixture id given to you must appear exactly once in your final answer. Do not invent teams or fixtures that were not given to you.`;

export function buildPredictionPrompt(
  sport: SportConfig,
  fixtures: FixtureWithHeadToHead[],
): string {
  const lines = fixtures.map((f) => {
    const odds =
      f.oddsSummary && f.oddsSummary.length > 0
        ? f.oddsSummary.map((o) => `${o.team} @ ${o.price}`).join(", ")
        : "no odds posted yet";
    const headToHead =
      f.headToHead ?? "not available from stats provider — check web search if useful";
    return `- id: ${f.id} | ${f.homeTeam} vs ${f.awayTeam} | kickoff: ${f.commenceTime} | odds: ${odds} | odds-implied favorite: ${f.favorite ?? "unknown"} | head-to-head: ${headToHead}`;
  });

  return `Sport: ${sport.label}\n\nHere are this week's fixtures with current moneyline odds:\n\n${lines.join("\n")}\n\nAnalyze each fixture and return the JSON described in your instructions.`;
}
