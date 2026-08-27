import type { PredictionsResponse } from "@/lib/sports/types";

function formatKickoff(kickoff: string): string {
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return kickoff;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildShareText(sportLabel: string, predictions: PredictionsResponse): string {
  const header = `Pythia Athletics — ${sportLabel} picks`;

  const lines = predictions.games.map(
    (game) =>
      `${game.homeTeam} vs ${game.awayTeam} (${formatKickoff(game.kickoff)})\n→ ${game.claudePick} (${game.confidence} confidence)`,
  );

  return [header, "", ...lines].join("\n");
}
