import Anthropic from "@anthropic-ai/sdk";
import type { SportConfig } from "@/lib/sports/types";
import type { OddsApiFixture } from "@/lib/data-sources/odds-api";
import { PREDICTION_SYSTEM_PROMPT, buildPredictionPrompt } from "@/lib/prompts/prediction-prompt";

export interface ClaudePick {
  id: string;
  claudePick: string;
  confidence: "low" | "medium" | "high";
  reasoning: string;
}

export class InvalidAnthropicKeyError extends Error {}
export class InsufficientCreditsError extends Error {}

export async function getPicksFromClaude(
  anthropicKey: string,
  sport: SportConfig,
  fixtures: OddsApiFixture[],
): Promise<ClaudePick[]> {
  const client = new Anthropic({ apiKey: anthropicKey });

  const baseParams = {
    model: "claude-opus-5",
    max_tokens: 16000,
    system: PREDICTION_SYSTEM_PROMPT,
    tools: [{ type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 5 }],
  };

  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildPredictionPrompt(sport, fixtures) },
  ];
  let response: Anthropic.Message;

  try {
    response = await client.messages.create({ ...baseParams, messages });

    // Server-side web search can pause a turn mid-search; resume by echoing
    // the paused assistant turn back until Claude finishes or refuses.
    while (response.stop_reason === "pause_turn") {
      messages = [...messages, { role: "assistant", content: response.content }];
      response = await client.messages.create({ ...baseParams, messages });
    }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new InvalidAnthropicKeyError("Invalid Anthropic API key");
    }
    if (
      error instanceof Anthropic.BadRequestError &&
      /credit balance is too low/i.test(error.message)
    ) {
      throw new InsufficientCreditsError(
        "This Anthropic account is out of credit balance. Add credits at console.anthropic.com → Plans & Billing, then try again.",
      );
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to generate predictions for this request");
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return parsePicks(text);
}

function parsePicks(text: string): ClaudePick[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!parsed || !Array.isArray(parsed.games)) {
    throw new Error("Claude response did not include a games array");
  }
  return parsed.games as ClaudePick[];
}
