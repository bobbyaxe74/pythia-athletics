# Pythia Athletics — Build Plan

## Status (2026-08-21)

Phases 1–2 are built: Next.js app scaffolded, soccer + basketball both wired
end-to-end (fixtures/odds fetch → Claude w/ web search → structured picks →
UI). Build (`next build`) and a dev-server smoke test (`/api/sports`,
`/api/predictions` error path) both pass. Not yet deployed to Vercel.

Both the Anthropic key and The Odds API key are now bring-your-own, entered
in the browser — see the updated §2/§3/§8 below. There are no server-side
secrets left in this app.

### Getting started

```bash
npm install                          # already done
npm run dev                          # http://localhost:3000
```

No `.env.local` needed. Open the app and paste your own Anthropic key and
your own free key from the-odds-api.com — both are stored in your browser's
localStorage only.

### To deploy to Vercel

1. Push this repo to GitHub (or run `vercel` from the CLI directly).
2. Import the project in Vercel.
3. Deploy — no environment variables needed, it's a standard stateless
   Next.js app.


## 1. What we're building

A stateless web app where a user picks a sport (soccer, basketball, more later),
sees that week's games, and gets Claude-generated picks for which team is most
likely to win, with reasoning. Every user supplies their own Anthropic API key
*and* their own Odds API key at the browser level; the app never stores either.

## 2. Decisions (locked in)

| Decision | Choice |
|---|---|
| Stack | Next.js (App Router) — React frontend + Node API routes in one project |
| Hosting | Vercel, single deploy (frontend + serverless functions), zero env vars |
| Sports data | **The Odds API** (primary — fixtures + odds/moneyline in one call) + Claude's web search tool (fallback/enrichment — injuries, form, news) |
| Anthropic key | Entered by the user in-app, stored in `localStorage` only, sent per-request, never persisted server-side |
| Odds API key | Entered by the user in-app, same handling as the Anthropic key — each user brings their own, so the app owner isn't paying for or rate-limited by everyone else's usage |
| Sport framework | Generalized from day one — adding a sport is adding a config, not new plumbing |
| "Football" | Soccer (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League by default — configurable) |
| Persistence | None for v1 — fully stateless, no DB, no auth |

## 3. Why The Odds API

It returns fixtures *and* moneyline/win odds for soccer and basketball from one
endpoint with one key, which maps directly onto "who's playing" + "implied
favorite." Claude then reasons on top of that (and can web-search for injuries/
lineup news/form) rather than inventing odds from scratch. Originally this key
was app-owned (a Vercel env var); it's now bring-your-own like the Anthropic
key, so a public deployment doesn't run the operator's own Odds API quota dry
for every visitor. Each user's Odds API free tier (~500 requests/month) is
plenty for personal use.

## 4. Request lifecycle

1. User opens the app, picks a sport (soccer / basketball), pastes their
   Anthropic key and their Odds API key once each (saved to `localStorage`,
   shown as "connected" after).
2. Frontend calls `POST /api/predictions` with `{ sport, anthropicKey, oddsApiKey }`.
3. API route:
   a. Loads that sport's config (league IDs, display info).
   b. Fetches this week's fixtures + odds from The Odds API using the user's key.
   c. Builds a prompt containing the fixture/odds data.
   d. Calls Claude (using the user's key, via the Anthropic SDK) with the web
      search tool enabled, asking it to cross-check news/injuries and return
      structured picks.
   e. Parses Claude's structured JSON response.
4. Frontend renders game cards: matchup, kickoff time, odds-implied favorite,
   Claude's pick, and a short reasoning blurb.
5. Nothing is written to a database. A page refresh re-fetches everything live.

## 5. Sport framework

Each sport is a folder at the repo root (matching what's already there:
`football/`, `basketball/`) containing a `config.ts` that implements a shared
interface:

```ts
// lib/sports/types.ts
interface SportConfig {
  id: string;                // "soccer"
  label: string;              // "Football / Soccer"
  oddsApiSportKeys: string[]; // e.g. ["soccer_epl", "soccer_spain_la_liga", ...]
  weekWindowDays: number;     // how many days ahead counts as "this week"
}
```

`lib/sports/registry.ts` imports every sport folder's config and exports a
lookup map. Adding a new sport later = new folder + config file + one
registry line. No other code changes.

Note: the `football/` folder is renamed to `soccer/` to match the sport id
exactly and avoid confusion with American football.

## 6. Folder structure

```
pythia-athletics/
  app/
    layout.tsx
    page.tsx                    # sport picker + results view
    api/
      predictions/route.ts      # POST { sport, anthropicKey, oddsApiKey } -> predictions
      sports/route.ts           # GET -> list of configured sports (for the picker)
  components/
    SportSelector.tsx
    ApiKeyGate.tsx               # generic key-entry gate, reused for both keys
    GameCard.tsx
    PredictionBadge.tsx
  lib/
    sports/
      types.ts
      registry.ts
    data-sources/
      odds-api.ts                # fetch fixtures/odds from The Odds API
      claude.ts                  # build prompt, call Anthropic w/ web search, parse JSON
    prompts/
      prediction-prompt.ts
  soccer/                        # was football/ — see §5 naming note
    config.ts
  basketball/
    config.ts
  plan.md
  .env.local.example             # no server secrets — informational only
  package.json
```

## 7. API contracts

`GET /api/sports` → `{ sports: [{ id, label }] }`

`POST /api/predictions`
```json
// request
{ "sport": "soccer", "anthropicKey": "sk-ant-...", "oddsApiKey": "..." }

// response
{
  "sport": "soccer",
  "weekOf": "2026-08-24",
  "games": [
    {
      "id": "...",
      "homeTeam": "Arsenal",
      "awayTeam": "Chelsea",
      "kickoff": "2026-08-24T14:00:00Z",
      "oddsImpliedFavorite": "Arsenal",
      "claudePick": "Arsenal",
      "confidence": "medium",
      "reasoning": "Short explanation citing odds + any news found."
    }
  ]
}
```

## 8. Environment variables

None. Both the Anthropic key and the Odds API key are supplied by the client
on every request and never persisted server-side or set as env vars.

## 9. Non-functional notes

- **Error handling**: if The Odds API has no odds for a fixture yet, still show
  the matchup with "odds not posted" rather than dropping the game. A bad
  Odds API key returns a clean 401 (`InvalidOddsApiKeyError`); a bad Anthropic
  key or an out-of-credit Anthropic account return clean 401/402s too, instead
  of raw upstream error bodies.
- **Rate limits**: The Odds API free tier is limited (~500 req/month) *per
  user's own key* now, so one visitor's usage no longer eats into another's
  quota. Fixture/odds responses are still cached for 10 minutes via Next.js's
  built-in `fetch` cache (`next: { revalidate: 600 }`) to avoid burning quota
  on repeat loads within a session.
- **Responsible gambling copy**: small persistent footer disclaimer
  (informational only, not financial advice, 18+/21+ where applicable).
- **No auth**: acceptable since there's no persistence and neither key ever
  leaves the browser except to your own API route for that one request.

## 10. Build phases

1. **Scaffold**: `create-next-app`, TypeScript, base layout, sport
   registry/types, empty routes.
2. **Soccer end-to-end**: Odds API integration → Claude prompt/parsing →
   working `/api/predictions` for soccer → basic UI rendering.
3. **Basketball**: add second sport config, confirm framework holds up with
   zero changes outside its folder + registry line.
4. **UI polish**: API key gate/modal, loading/error states, game cards,
   disclaimer footer.
5. **Deploy**: Vercel project, env vars, smoke test in production.

## 11. Notes

- Default leagues for soccer v1: Premier League, La Liga, Serie A, Bundesliga,
  Ligue 1, Champions League — trim or expand later by editing
  `soccer/config.ts`.
