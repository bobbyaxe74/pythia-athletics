// API-Sports (api-sports.io) — structured head-to-head history, used to
// give Claude reliable recent-meetings data instead of leaving it entirely
// to ad hoc web search. Every function here degrades to `null` on any
// failure (missing key, unmatched team name, rate limit, network error,
// no prior meetings) rather than throwing — callers treat `null` as "fall
// back to web search for this fixture," never as a hard error.

const HOSTS: Record<"football" | "basketball", string> = {
  football: "https://v3.football.api-sports.io",
  basketball: "https://v1.basketball.api-sports.io",
};

interface ApiSportsTeamSearchResponse {
  response?: { team: { id: number; name: string } }[];
}

async function findTeamId(
  apiKey: string,
  sportPath: "football" | "basketball",
  teamName: string,
): Promise<number | null> {
  try {
    const res = await fetch(
      `${HOSTS[sportPath]}/teams?search=${encodeURIComponent(teamName)}`,
      {
        headers: { "x-apisports-key": apiKey },
        next: { revalidate: 86400 }, // team IDs are stable — cache a day
      },
    );
    if (!res.ok) return null;

    const data: ApiSportsTeamSearchResponse = await res.json();
    const results = data.response ?? [];
    if (results.length === 0) return null;

    const exact = results.find(
      (r) => r.team.name.toLowerCase() === teamName.toLowerCase(),
    );
    return (exact ?? results[0]).team.id;
  } catch {
    return null;
  }
}

interface FootballH2HFixture {
  fixture: { date: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
}

interface FootballH2HResponse {
  response?: FootballH2HFixture[];
}

async function fetchFootballH2H(
  apiKey: string,
  homeId: number,
  awayId: number,
): Promise<FootballH2HFixture[] | null> {
  try {
    const res = await fetch(
      `${HOSTS.football}/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`,
      { headers: { "x-apisports-key": apiKey }, next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data: FootballH2HResponse = await res.json();
    return data.response ?? null;
  } catch {
    return null;
  }
}

function summarizeFootballH2H(
  matches: FootballH2HFixture[],
  homeTeamId: number,
  awayTeamId: number,
  homeTeamName: string,
  awayTeamName: string,
): string | null {
  const valid = matches.filter((m) => m.goals.home != null && m.goals.away != null);
  if (valid.length === 0) return null;

  const sorted = [...valid].sort(
    (a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime(),
  );

  let homeTeamWins = 0;
  let awayTeamWins = 0;
  let draws = 0;

  for (const match of sorted) {
    const homeGoals = match.goals.home as number;
    const awayGoals = match.goals.away as number;
    if (homeGoals === awayGoals) {
      draws++;
      continue;
    }
    const winnerId = homeGoals > awayGoals ? match.teams.home.id : match.teams.away.id;
    if (winnerId === homeTeamId) homeTeamWins++;
    else if (winnerId === awayTeamId) awayTeamWins++;
  }

  const latest = sorted[0];
  const latestLine = `most recent: ${latest.teams.home.name} ${latest.goals.home}-${latest.goals.away} ${latest.teams.away.name} on ${latest.fixture.date.slice(0, 10)}`;

  return `Last ${sorted.length} meetings — ${homeTeamName} won ${homeTeamWins}, ${awayTeamName} won ${awayTeamWins}, ${draws} draw${draws === 1 ? "" : "s"} (${latestLine})`;
}

interface BasketballH2HGame {
  date: string;
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  scores: {
    home: { total: number | null };
    away: { total: number | null };
  };
}

interface BasketballH2HResponse {
  response?: BasketballH2HGame[];
}

async function fetchBasketballH2H(
  apiKey: string,
  homeId: number,
  awayId: number,
): Promise<BasketballH2HGame[] | null> {
  try {
    const res = await fetch(`${HOSTS.basketball}/games/h2h?h2h=${homeId}-${awayId}`, {
      headers: { "x-apisports-key": apiKey },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data: BasketballH2HResponse = await res.json();
    return data.response ?? null;
  } catch {
    return null;
  }
}

function summarizeBasketballH2H(
  games: BasketballH2HGame[],
  homeTeamId: number,
  awayTeamId: number,
  homeTeamName: string,
  awayTeamName: string,
): string | null {
  const valid = games.filter(
    (g) => g.scores.home.total != null && g.scores.away.total != null,
  );
  if (valid.length === 0) return null;

  const sorted = [...valid].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let homeTeamWins = 0;
  let awayTeamWins = 0;

  for (const game of sorted) {
    const homeScore = game.scores.home.total as number;
    const awayScore = game.scores.away.total as number;
    const winnerId = homeScore > awayScore ? game.teams.home.id : game.teams.away.id;
    if (winnerId === homeTeamId) homeTeamWins++;
    else if (winnerId === awayTeamId) awayTeamWins++;
  }

  const latest = sorted[0];
  const latestLine = `most recent: ${latest.teams.home.name} ${latest.scores.home.total}-${latest.scores.away.total} ${latest.teams.away.name} on ${latest.date.slice(0, 10)}`;

  return `Last ${sorted.length} meetings — ${homeTeamName} won ${homeTeamWins}, ${awayTeamName} won ${awayTeamWins} (${latestLine})`;
}

/**
 * Best-effort structured head-to-head summary for one fixture. Returns
 * `null` on any failure along the way (no key, team name not found, API
 * error, no valid past meetings) — never throws. The caller should fall
 * back to instructing Claude to search the web for this fixture when it
 * gets `null` back.
 */
export async function getHeadToHeadSummary(
  apiKey: string | null,
  sportPath: "football" | "basketball" | undefined,
  homeTeamName: string,
  awayTeamName: string,
): Promise<string | null> {
  if (!apiKey || !sportPath) return null;

  try {
    const [homeId, awayId] = await Promise.all([
      findTeamId(apiKey, sportPath, homeTeamName),
      findTeamId(apiKey, sportPath, awayTeamName),
    ]);
    if (homeId == null || awayId == null) return null;

    if (sportPath === "football") {
      const matches = await fetchFootballH2H(apiKey, homeId, awayId);
      if (!matches) return null;
      return summarizeFootballH2H(matches, homeId, awayId, homeTeamName, awayTeamName);
    }

    const games = await fetchBasketballH2H(apiKey, homeId, awayId);
    if (!games) return null;
    return summarizeBasketballH2H(games, homeId, awayId, homeTeamName, awayTeamName);
  } catch {
    return null;
  }
}
