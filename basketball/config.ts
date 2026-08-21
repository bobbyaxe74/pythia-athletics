import type { SportConfig } from "@/lib/sports/types";

export const basketballConfig: SportConfig = {
  id: "basketball",
  label: "Basketball (NBA)",
  oddsApiSportKeys: ["basketball_nba"],
  weekWindowDays: 7,
};
