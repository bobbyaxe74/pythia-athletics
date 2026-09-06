"use client";

import { computeAccuracy, type HistoryRun } from "@/lib/history";

interface HistoryPanelProps {
  runs: HistoryRun[];
  oddsApiKey: string | null;
  checkingRunId: string | null;
  onCheckResults: (runId: string) => void;
}

export function HistoryPanel({ runs, oddsApiKey, checkingRunId, onCheckResults }: HistoryPanelProps) {
  if (runs.length === 0) {
    return <p className="status-line">Run a prediction to start building a track record.</p>;
  }

  const stats = computeAccuracy(runs);

  return (
    <div className="history-panel">
      {stats.resolved > 0 && (
        <div className="history-summary">
          <div className="history-stat">
            <span className="history-stat-value">
              {stats.correct}/{stats.resolved}
            </span>
            <span className="history-stat-label">overall</span>
          </div>
          {(["high", "medium", "low"] as const).map((level) => {
            const s = stats.byConfidence[level];
            return (
              <div className="history-stat" key={level}>
                <span className="history-stat-value">
                  {s.resolved > 0 ? `${s.correct}/${s.resolved}` : "—"}
                </span>
                <span className="history-stat-label">{level}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="history-runs">
        {runs.map((run) => {
          const resolvedCount = run.games.filter((g) => g.outcome !== "unresolved").length;
          const correctCount = run.games.filter((g) => g.outcome === "correct").length;
          const allResolved = resolvedCount === run.games.length;

          return (
            <div className="history-run" key={run.id}>
              <div className="history-run-header">
                <span>
                  {run.sportLabel} — week of{" "}
                  {new Date(run.weekOf).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="history-run-actions">
                  {resolvedCount > 0 && (
                    <span className="history-run-score">
                      {correctCount}/{resolvedCount}
                    </span>
                  )}
                  {!allResolved && (
                    <button
                      type="button"
                      className="secondary"
                      disabled={!oddsApiKey || checkingRunId === run.id}
                      onClick={() => onCheckResults(run.id)}
                    >
                      {checkingRunId === run.id ? "Checking…" : "Check results"}
                    </button>
                  )}
                </div>
              </div>
              <ul className="history-game-list">
                {run.games.map((game) => (
                  <li key={game.id} className={`history-game ${game.outcome}`}>
                    <span className="history-game-matchup">
                      {game.homeTeam} vs {game.awayTeam}
                    </span>
                    <span className="history-game-pick">{game.claudePick}</span>
                    <span className="history-game-outcome">
                      {game.outcome === "correct" ? "✓" : game.outcome === "incorrect" ? "✗" : "…"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
