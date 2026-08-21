interface PredictionBadgeProps {
  confidence: "low" | "medium" | "high";
}

export function PredictionBadge({ confidence }: PredictionBadgeProps) {
  return <span className={`badge ${confidence}`}>{confidence} confidence</span>;
}
