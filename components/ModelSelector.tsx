"use client";

import { CLAUDE_MODELS } from "@/lib/models";

interface ModelSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function ModelSelector({ selected, onSelect }: ModelSelectorProps) {
  return (
    <div className="model-selector">
      {CLAUDE_MODELS.map((model) => (
        <button
          key={model.id}
          type="button"
          className={model.id === selected ? "active" : ""}
          onClick={() => onSelect(model.id)}
          title={model.description}
        >
          {model.label}
          <span className="model-description">{model.description}</span>
        </button>
      ))}
    </div>
  );
}
