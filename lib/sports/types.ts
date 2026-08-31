export interface SportConfig {
  id: string;
  label: string;
  /** The Odds API sport keys to pull fixtures/odds from for this sport. */
  oddsApiSportKeys: string[];
  /** How many days ahead of now counts as "this week" for this sport. */
  weekWindowDays: number;
  /**
   * When true, only the earliest fixture for each team within the fetch
   * window is kept — later fixtures involving a team already seen are
   * dropped. Leagues like soccer normally schedule one match per team per
   * round, so if the rolling week window happens to span a round boundary
   * (e.g. Thursday's round and the following Sunday/Monday's round both
   * fall inside it), a team can otherwise show up twice in one prediction
   * run. Sports where teams legitimately play multiple times a week (e.g.
   * NBA) should leave this unset.
   */
  oneFixturePerTeam?: boolean;
  /**
   * API-Sports (api-sports.io) sport path used to fetch structured
   * head-to-head history — "football" or "basketball". Both share one
   * account/key across their sport-specific APIs. Leave unset for sports
   * with no API-Sports coverage; head-to-head then falls back to whatever
   * Claude's own web search turns up.
   */
  apiSportsPath?: "football" | "basketball";
}

export interface Prediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  oddsImpliedFavorite: string | null;
  claudePick: string;
  confidence: "low" | "medium" | "high";
  reasoning: string;
}

export interface PredictionsResponse {
  sport: string;
  weekOf: string;
  games: Prediction[];
}
