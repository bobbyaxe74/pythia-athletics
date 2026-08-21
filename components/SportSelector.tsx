"use client";

interface Sport {
  id: string;
  label: string;
}

interface SportSelectorProps {
  sports: Sport[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function SportSelector({ sports, selected, onSelect }: SportSelectorProps) {
  return (
    <div className="sport-selector">
      {sports.map((sport) => (
        <button
          key={sport.id}
          type="button"
          className={sport.id === selected ? "active" : ""}
          onClick={() => onSelect(sport.id)}
        >
          {sport.label}
        </button>
      ))}
    </div>
  );
}
