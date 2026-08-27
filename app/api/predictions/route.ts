import { NextRequest, NextResponse } from "next/server";
import { getSportConfig } from "@/lib/sports/registry";
import { fetchFixturesForSport, InvalidOddsApiKeyError } from "@/lib/data-sources/odds-api";
import {
  getPicksFromClaude,
  InvalidAnthropicKeyError,
  InsufficientCreditsError,
} from "@/lib/data-sources/claude";
import type { Prediction, PredictionsResponse } from "@/lib/sports/types";
import { DEFAULT_CLAUDE_MODEL, isValidClaudeModel } from "@/lib/models";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const sportId = body?.sport;
  const anthropicKey = body?.anthropicKey;
  const oddsApiKey = body?.oddsApiKey;
  const model = body?.model ?? DEFAULT_CLAUDE_MODEL;

  if (
    typeof sportId !== "string" ||
    typeof anthropicKey !== "string" ||
    !anthropicKey.trim() ||
    typeof oddsApiKey !== "string" ||
    !oddsApiKey.trim()
  ) {
    return NextResponse.json(
      { error: "sport, anthropicKey, and oddsApiKey are required" },
      { status: 400 },
    );
  }

  if (typeof model !== "string" || !isValidClaudeModel(model)) {
    return NextResponse.json({ error: `Unknown model: ${model}` }, { status: 400 });
  }

  const sport = getSportConfig(sportId);
  if (!sport) {
    return NextResponse.json({ error: `Unknown sport: ${sportId}` }, { status: 404 });
  }

  try {
    const fixtures = await fetchFixturesForSport(
      oddsApiKey,
      sport.oddsApiSportKeys,
      sport.weekWindowDays,
    );

    if (fixtures.length === 0) {
      const empty: PredictionsResponse = {
        sport: sport.id,
        weekOf: new Date().toISOString(),
        games: [],
      };
      return NextResponse.json(empty);
    }

    const picks = await getPicksFromClaude(anthropicKey, model, sport, fixtures);
    const picksById = new Map(picks.map((p) => [p.id, p]));

    const games: Prediction[] = fixtures.map((f) => {
      const pick = picksById.get(f.id);
      return {
        id: f.id,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        kickoff: f.commenceTime,
        oddsImpliedFavorite: f.favorite,
        claudePick: pick?.claudePick ?? f.favorite ?? f.homeTeam,
        confidence: pick?.confidence ?? "low",
        reasoning:
          pick?.reasoning ??
          "Claude did not return a pick for this fixture; defaulting to the odds-implied favorite.",
      };
    });

    const response: PredictionsResponse = {
      sport: sport.id,
      weekOf: new Date().toISOString(),
      games,
    };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof InvalidAnthropicKeyError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    if (error instanceof InvalidOddsApiKeyError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to generate predictions";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
