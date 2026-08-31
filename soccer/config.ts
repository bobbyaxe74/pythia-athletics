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
  // La Liga (and other leagues) sometimes schedule the next round only 3-4
  // days after the previous one, so a 7-day window can span two rounds and
  // show the same team twice. Keep only each team's earliest match.
  oneFixturePerTeam: true,
  apiSportsPath: "football",
};
