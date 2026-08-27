import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { SportConfig } from "@/lib/sports/types";
import type { OddsApiFixture } from "@/lib/data-sources/odds-api";
import { PREDICTION_SYSTEM_PROMPT, buildPredictionPrompt } from "@/lib/prompts/prediction-prompt";
import { webSearchToolType } from "@/lib/models";

const PredictionsSchema = z.object({
  games: z.array(
    z.object({
      id: z.string(),
      claudePick: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
      reasoning: z.string(),
    }),
  ),
});

export type ClaudePick = z.infer<typeof PredictionsSchema>["games"][number];

export class InvalidAnthropicKeyError extends Error {}
export class InsufficientCreditsError extends Error {}

export async function getPicksFromClaude(
  anthropicKey: string,
  model: string,
  sport: SportConfig,
  fixtures: OddsApiFixture[],
): Promise<ClaudePick[]> {
  const client = new Anthropic({ apiKey: anthropicKey });

  const baseParams = {
    model,
    max_tokens: 16000,
    system: PREDICTION_SYSTEM_PROMPT,
    tools: [{ type: webSearchToolType(model), name: "web_search" as const, max_uses: 5 }],
    output_config: { format: zodOutputFormat(PredictionsSchema) },
  };

  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildPredictionPrompt(sport, fixtures) },
  ];

  let response;
  try {
    response = await client.messages.parse({ ...baseParams, messages });

    // Server-side web search can pause a turn mid-search; resume by echoing
    // the paused assistant turn back until Claude finishes or refuses.
    while (response.stop_reason === "pause_turn") {
      messages = [...messages, { role: "assistant", content: response.content }];
      response = await client.messages.parse({ ...baseParams, messages });
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

  if (!response.parsed_output) {
    throw new Error("Claude's response did not match the expected format");
  }

  return response.parsed_output.games;
}
