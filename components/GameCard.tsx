import type { Prediction } from "@/lib/sports/types";
import { PredictionBadge } from "./PredictionBadge";

interface GameCardProps {
  game: Prediction;
}

export function GameCard({ game }: GameCardProps) {
  const kickoff = new Date(game.kickoff);
  const kickoffLabel = Number.isNaN(kickoff.getTime())
    ? game.kickoff
    : kickoff.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

  return (
    <article className="game-card">
      <div className="matchup">
        <span className="teams">
          {game.homeTeam} vs {game.awayTeam}
        </span>
        <span className="kickoff">{kickoffLabel}</span>
      </div>
      {game.oddsImpliedFavorite && (
        <div className="odds-line">Odds-implied favorite: {game.oddsImpliedFavorite}</div>
      )}
      <div className="pick-row">
        <strong className={game.claudePick === "Draw" ? "pick-draw" : undefined}>
          Pick: {game.claudePick}
        </strong>
        <PredictionBadge confidence={game.confidence} />
      </div>
      <p className="reasoning">{game.reasoning}</p>
    </article>
  );
}
