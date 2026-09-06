import { NextRequest, NextResponse } from "next/server";
import { getSportConfig } from "@/lib/sports/registry";
import { fetchResultsForSport, InvalidOddsApiKeyError } from "@/lib/data-sources/odds-api";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const sportId = body?.sport;
  const oddsApiKey = body?.oddsApiKey;

  if (typeof sportId !== "string" || typeof oddsApiKey !== "string" || !oddsApiKey.trim()) {
    return NextResponse.json({ error: "sport and oddsApiKey are required" }, { status: 400 });
  }

  const sport = getSportConfig(sportId);
  if (!sport) {
    return NextResponse.json({ error: `Unknown sport: ${sportId}` }, { status: 404 });
  }

  try {
    // The Odds API's free/basic tiers only return the last few days of
    // completed scores — fine for grading a recent week, not for anything
    // older. Fixtures outside that window just stay ungraded.
    const results = await fetchResultsForSport(oddsApiKey, sport.oddsApiSportKeys, 3);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof InvalidOddsApiKeyError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to fetch results";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
