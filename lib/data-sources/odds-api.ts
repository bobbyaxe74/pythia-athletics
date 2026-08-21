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
