"use client";

export type ConfidenceLevel = "high" | "medium" | "low";

interface ConfidenceFilterProps {
  selected: Set<ConfidenceLevel>;
  onToggle: (level: ConfidenceLevel) => void;
}

const LEVELS: { id: ConfidenceLevel; label: string }[] = [
  { id: "high", label: "High confidence" },
  { id: "medium", label: "Medium confidence" },
  { id: "low", label: "Low confidence" },
];

export function ConfidenceFilter({ selected, onToggle }: ConfidenceFilterProps) {
  return (
    <div className="confidence-filter">
      {LEVELS.map((level) => (
        <button
          key={level.id}
          type="button"
          className={`confidence-toggle ${level.id}${selected.has(level.id) ? " active" : ""}`}
          aria-pressed={selected.has(level.id)}
          onClick={() => onToggle(level.id)}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
