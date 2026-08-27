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

// The dynamic-filtering web search tool only works on Opus 5 and Sonnet 5;
// Haiku 4.5 needs the older basic variant or requests fail with a 400.
const DYNAMIC_WEB_SEARCH_MODELS = new Set(["claude-opus-5", "claude-sonnet-5"]);

export function webSearchToolType(model: string): "web_search_20260209" | "web_search_20250305" {
  return DYNAMIC_WEB_SEARCH_MODELS.has(model) ? "web_search_20260209" : "web_search_20250305";
}
