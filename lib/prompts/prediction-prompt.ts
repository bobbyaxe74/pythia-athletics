import type { SportConfig } from "@/lib/sports/types";
import type { OddsApiFixture } from "@/lib/data-sources/odds-api";

export const PREDICTION_SYSTEM_PROMPT = `You are a sports analyst helping a user decide which team is more likely to win in upcoming matches.

You will be given a list of this week's fixtures with current moneyline odds from sportsbooks. Use the web_search tool to check for recent injuries, suspensions, lineup news, current form, and head-to-head history for the teams involved, then decide which team is more likely to win each match. Weigh the odds heavily — they already price in most public information — and use search to catch anything recent that could shift the outcome (a key injury, a suspension, a manager change).

Respond with ONLY a single JSON object, no markdown code fences, no commentary before or after it, matching exactly this shape:

{
  "games": [
    {
      "id": "<the fixture id exactly as given>",
      "claudePick": "<the team name you predict will win>",
      "confidence": "low" | "medium" | "high",
      "reasoning": "<1-2 sentences citing the odds and/or anything you found>"
    }
  ]
}

Every fixture id given to you must appear exactly once in "games". Do not invent teams or fixtures that were not given to you.`;

export function buildPredictionPrompt(sport: SportConfig, fixtures: OddsApiFixture[]): string {
  const lines = fixtures.map((f) => {
    const odds =
      f.oddsSummary && f.oddsSummary.length > 0
        ? f.oddsSummary.map((o) => `${o.team} @ ${o.price}`).join(", ")
        : "no odds posted yet";
    return `- id: ${f.id} | ${f.homeTeam} vs ${f.awayTeam} | kickoff: ${f.commenceTime} | odds: ${odds} | odds-implied favorite: ${f.favorite ?? "unknown"}`;
  });

  return `Sport: ${sport.label}\n\nHere are this week's fixtures with current moneyline odds:\n\n${lines.join("\n")}\n\nAnalyze each fixture and return the JSON described in your instructions.`;
}
