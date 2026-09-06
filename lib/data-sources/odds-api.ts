const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

export class InvalidOddsApiKeyError extends Error {}

export interface OddsApiFixture {
  id: string;
  sportKey: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  favorite: string | null;
  oddsSummary: { team: string; price: number }[] | null;
}

interface RawOutcome {
  name: string;
  price: number;
}

interface RawMarket {
  key: string;
  outcomes: RawOutcome[];
}

interface RawBookmaker {
  markets: RawMarket[];
}

interface RawGame {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: RawBookmaker[];
}

function toFixture(sportKey: string, game: RawGame): OddsApiFixture {
  const h2h = game.bookmakers?.[0]?.markets.find((m) => m.key === "h2h");
  const outcomes = h2h?.outcomes;
  const favorite =
    outcomes && outcomes.length > 0
      ? outcomes.reduce((a, b) => (a.price < b.price ? a : b)).name
      : null;

  return {
    id: game.id,
    sportKey,
    commenceTime: game.commence_time,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    favorite,
    oddsSummary: outcomes?.map((o) => ({ team: o.name, price: o.price })) ?? null,
  };
}

async function fetchSportOdds(
  oddsApiKey: string,
  sportKey: string,
  from: Date,
  to: Date,
): Promise<OddsApiFixture[]> {
  const params = new URLSearchParams({
    apiKey: oddsApiKey,
    regions: "us,uk,eu",
    markets: "h2h",
    dateFormat: "iso",
    oddsFormat: "decimal",
    commenceTimeFrom: from.toISOString().split(".")[0] + "Z",
    commenceTimeTo: to.toISOString().split(".")[0] + "Z",
  });

  const res = await fetch(`${ODDS_API_BASE}/sports/${sportKey}/odds/?${params}`, {
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      throw new InvalidOddsApiKeyError("Invalid Odds API key");
    }
    throw new Error(`The Odds API request failed for ${sportKey}: ${res.status} ${body}`);
  }

  const data: RawGame[] = await res.json();
  return data.map((game) => toFixture(sportKey, game));
}

// Thresholds on the no-vig (de-margined) implied probability of the
// outcome actually picked. Anchoring confidence to the market instead of
// letting Claude self-report it means the label is consistent and
// meaningful every week — a pick against the market favorite (a real
// upset call) is correctly labeled lower confidence, regardless of how
// sure Claude's own wording sounds.
const HIGH_CONFIDENCE_THRESHOLD = 0.7;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.55;

/**
 * Confidence for `pick`, derived from the fixture's own odds — not from
 * Claude. Removes the bookmaker's overround (vig) by normalizing each
 * outcome's raw implied probability (1/price) against the sum across all
 * outcomes, then buckets the picked outcome's share. Falls back to "low"
 * when there's no odds data or the pick can't be matched to an outcome
 * (e.g. odds not posted yet) — conservative default, not a guess.
 */
export function computeConfidenceFromOdds(
  oddsSummary: { team: string; price: number }[] | null,
  pick: string,
): "low" | "medium" | "high" {
  if (!oddsSummary || oddsSummary.length === 0) return "low";

  const picked = oddsSummary.find((o) => o.team.toLowerCase() === pick.toLowerCase());
  if (!picked) return "low";

  const totalImpliedProbability = oddsSummary.reduce((sum, o) => sum + 1 / o.price, 0);
  const normalizedProbability = 1 / picked.price / totalImpliedProbability;

  if (normalizedProbability >= HIGH_CONFIDENCE_THRESHOLD) return "high";
  if (normalizedProbability >= MEDIUM_CONFIDENCE_THRESHOLD) return "medium";
  return "low";
}

export async function fetchFixturesForSport(
  oddsApiKey: string,
  sportKeys: string[],
  weekWindowDays: number,
): Promise<OddsApiFixture[]> {
  const from = new Date();
  const to = new Date(Date.now() + weekWindowDays * 24 * 60 * 60 * 1000);

  const results = await Promise.all(
    sportKeys.map((key) => fetchSportOdds(oddsApiKey, key, from, to)),
  );

  return results
    .flat()
    .sort((a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime());
}

/**
 * Keeps only the chronologically earliest fixture for each team, dropping
 * any later fixture where either team has already appeared. Assumes
 * `fixtures` is already sorted ascending by kickoff time (as returned by
 * `fetchFixturesForSport`).
 */
export function keepEarliestFixturePerTeam(fixtures: OddsApiFixture[]): OddsApiFixture[] {
  const seenTeams = new Set<string>();
  const kept: OddsApiFixture[] = [];

  for (const fixture of fixtures) {
    if (seenTeams.has(fixture.homeTeam) || seenTeams.has(fixture.awayTeam)) {
      continue;
    }
    seenTeams.add(fixture.homeTeam);
    seenTeams.add(fixture.awayTeam);
    kept.push(fixture);
  }

  return kept;
}

export interface FixtureResult {
  id: string;
  completed: boolean;
  /** "home" | "away" | "draw", or null if not completed / scores missing. */
  winner: "home" | "away" | "draw" | null;
}

interface RawScoreEntry {
  name: string;
  score: string;
}

interface RawScoreGame {
  id: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: RawScoreEntry[] | null;
}

function toFixtureResult(game: RawScoreGame): FixtureResult {
  if (!game.completed || !game.scores) {
    return { id: game.id, completed: game.completed, winner: null };
  }

  const home = game.scores.find((s) => s.name === game.home_team);
  const away = game.scores.find((s) => s.name === game.away_team);
  if (!home || !away) {
    return { id: game.id, completed: game.completed, winner: null };
  }

  const homeScore = Number(home.score);
  const awayScore = Number(away.score);
  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    return { id: game.id, completed: game.completed, winner: null };
  }

  const winner =
    homeScore === awayScore ? "draw" : homeScore > awayScore ? "home" : "away";
  return { id: game.id, completed: true, winner };
}

async function fetchSportScores(
  oddsApiKey: string,
  sportKey: string,
  daysFrom: number,
): Promise<FixtureResult[]> {
  const params = new URLSearchParams({
    apiKey: oddsApiKey,
    daysFrom: String(daysFrom),
    dateFormat: "iso",
  });

  const res = await fetch(`${ODDS_API_BASE}/sports/${sportKey}/scores/?${params}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      throw new InvalidOddsApiKeyError("Invalid Odds API key");
    }
    throw new Error(`The Odds API scores request failed for ${sportKey}: ${res.status} ${body}`);
  }

  const data: RawScoreGame[] = await res.json();
  return data.map(toFixtureResult);
}

/**
 * Completed-game results for the last `daysFrom` days (The Odds API caps
 * this at 3 on most plans) across every sport key for a sport. Used to
 * auto-grade a previously saved run of predictions against real outcomes.
 */
export async function fetchResultsForSport(
  oddsApiKey: string,
  sportKeys: string[],
  daysFrom = 3,
): Promise<FixtureResult[]> {
  const results = await Promise.all(
    sportKeys.map((key) => fetchSportScores(oddsApiKey, key, daysFrom)),
  );
  return results.flat();
}
