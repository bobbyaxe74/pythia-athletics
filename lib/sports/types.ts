export interface SportConfig {
  id: string;
  label: string;
  /** The Odds API sport keys to pull fixtures/odds from for this sport. */
  oddsApiSportKeys: string[];
  /** How many days ahead of now counts as "this week" for this sport. */
  weekWindowDays: number;
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
