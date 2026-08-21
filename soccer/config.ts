import type { SportConfig } from "@/lib/sports/types";

export const soccerConfig: SportConfig = {
  id: "soccer",
  label: "Football / Soccer",
  oddsApiSportKeys: [
    "soccer_epl",
    "soccer_spain_la_liga",
    "soccer_italy_serie_a",
    "soccer_germany_bundesliga",
    "soccer_france_ligue_one",
    "soccer_uefa_champs_league",
  ],
  weekWindowDays: 7,
};
