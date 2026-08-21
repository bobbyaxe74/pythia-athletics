import type { SportConfig } from "./types";
import { soccerConfig } from "@/soccer/config";
import { basketballConfig } from "@/basketball/config";

// Adding a new sport = add its config here. No other code changes needed.
const sports: SportConfig[] = [soccerConfig, basketballConfig];

const sportsById = new Map(sports.map((s) => [s.id, s]));

export function listSports(): SportConfig[] {
  return sports;
}

export function getSportConfig(id: string): SportConfig | undefined {
  return sportsById.get(id);
}
