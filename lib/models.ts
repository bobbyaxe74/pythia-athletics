export interface ModelOption {
  id: string;
  label: string;
  description: string;
}

export const CLAUDE_MODELS: ModelOption[] = [
  { id: "claude-opus-5", label: "Opus 5", description: "Most capable, highest cost" },
  { id: "claude-sonnet-5", label: "Sonnet 5", description: "Balanced cost and quality" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5", description: "Fastest and cheapest" },
];

export const DEFAULT_CLAUDE_MODEL = CLAUDE_MODELS[0].id;

export function isValidClaudeModel(id: string): boolean {
  return CLAUDE_MODELS.some((model) => model.id === id);
}
