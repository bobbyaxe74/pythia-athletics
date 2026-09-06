import type { Prediction, PredictionsResponse } from "@/lib/sports/types";
import type { FixtureResult } from "@/lib/data-sources/odds-api";

const STORAGE_KEY = "pythia_history";
const MAX_RUNS = 12;

export type Outcome = "correct" | "incorrect" | "unresolved";

export interface HistoryGame extends Prediction {
  outcome: Outcome;
}

export interface HistoryRun {
  id: string;
  sportId: string;
  sportLabel: string;
  weekOf: string;
  savedAt: string;
  games: HistoryGame[];
}

export function loadHistory(): HistoryRun[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(runs: HistoryRun[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
  } catch {
    // localStorage unavailable — history just won't persist this session.
  }
}

export function saveRun(sportLabel: string, predictions: PredictionsResponse): HistoryRun[] {
  const run: HistoryRun = {
    id: `${predictions.sport}-${predictions.weekOf}`,
    sportId: predictions.sport,
    sportLabel,
    weekOf: predictions.weekOf,
    savedAt: new Date().toISOString(),
    games: predictions.games.map((g) => ({ ...g, outcome: "unresolved" as const })),
  };

  const existing = loadHistory().filter((r) => r.id !== run.id);
  const next = [run, ...existing].slice(0, MAX_RUNS);
  saveHistory(next);
  return next;
}

/**
 * Grades every unresolved game in `run` against `results` (from
 * /api/scores), returning a new run with each game's outcome updated.
 * Games with no matching completed result are left "unresolved" — most
 * often because they're outside the odds provider's results window.
 */
function gradeRun(run: HistoryRun, results: FixtureResult[]): HistoryRun {
  const resultsById = new Map(results.map((r) => [r.id, r]));

  const games = run.games.map((game): HistoryGame => {
    if (game.outcome !== "unresolved") return game;

    const result = resultsById.get(game.id);
    if (!result || !result.completed || result.winner === null) return game;

    const actualPick =
      result.winner === "draw"
        ? "Draw"
        : result.winner === "home"
          ? game.homeTeam
          : game.awayTeam;

    const outcome: Outcome =
      game.claudePick.toLowerCase() === actualPick.toLowerCase() ? "correct" : "incorrect";

    return { ...game, outcome };
  });

  return { ...run, games };
}

export function applyResults(runId: string, results: FixtureResult[]): HistoryRun[] {
  const runs = loadHistory();
  const next = runs.map((run) => (run.id === runId ? gradeRun(run, results) : run));
  saveHistory(next);
  return next;
}

export interface AccuracyStats {
  resolved: number;
  correct: number;
  byConfidence: Record<"low" | "medium" | "high", { resolved: number; correct: number }>;
}

export function computeAccuracy(runs: HistoryRun[]): AccuracyStats {
  const stats: AccuracyStats = {
    resolved: 0,
    correct: 0,
    byConfidence: {
      low: { resolved: 0, correct: 0 },
      medium: { resolved: 0, correct: 0 },
      high: { resolved: 0, correct: 0 },
    },
  };

  for (const run of runs) {
    for (const game of run.games) {
      if (game.outcome === "unresolved") continue;
      stats.resolved++;
      stats.byConfidence[game.confidence].resolved++;
      if (game.outcome === "correct") {
        stats.correct++;
        stats.byConfidence[game.confidence].correct++;
      }
    }
  }

  return stats;
}
