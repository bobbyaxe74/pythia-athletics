export interface HelpStep {
  title: string;
  description: string;
}

export const ANTHROPIC_KEY_HELP: HelpStep[] = [
  {
    title: "Create an Anthropic account",
    description: "Go to console.anthropic.com and sign up, or log in if you already have one.",
  },
  {
    title: "Create an API key",
    description:
      'In the left sidebar, click "API Keys", then "Create Key". Give it any name and copy the key — it starts with "sk-ant-...". You can\'t view it again after leaving the page, so copy it right away.',
  },
  {
    title: "Add credit to your account (required)",
    description:
      'This step is easy to miss: an API key with a $0 balance will fail every request. Go to "Plans & Billing" in the console and add funds — even $5 is enough to run many predictions.',
  },
  {
    title: "Paste it into Pythia Athletics",
    description:
      'Paste the key into the "Anthropic key" field above. It\'s stored only in your browser and sent directly to this app\'s server on each request — never saved anywhere else.',
  },
];

export const STATS_API_KEY_HELP: HelpStep[] = [
  {
    title: "Optional — improves head-to-head accuracy",
    description:
      "Without this key, Claude relies on web search to find head-to-head history, which varies in quality. With it, real head-to-head records are fetched directly and handed to Claude every time.",
  },
  {
    title: "Go to dashboard.api-football.com",
    description:
      "Open dashboard.api-football.com (API-Sports) in a new tab and sign up for a free account — no credit card required.",
  },
  {
    title: "Find your key",
    description:
      'Your API key is shown on your account dashboard after signing up. One key works for both football and basketball on API-Sports\' free tier (100 requests/day).',
  },
  {
    title: "Paste it into Pythia Athletics",
    description:
      'Paste the key into the "Stats API key" field above. Stored only in your browser, same as your other keys. Leave it blank and predictions still work — Claude just falls back to web search for head-to-head history.',
  },
];

export const ODDS_API_KEY_HELP: HelpStep[] = [
  {
    title: "Go to the-odds-api.com",
    description: "Open the-odds-api.com in a new tab.",
  },
  {
    title: "Sign up for a free API key",
    description:
      'Click "Get API Key" and fill out the short signup form. The free tier includes 500 requests/month and does not require a credit card.',
  },
  {
    title: "Find your key",
    description:
      "After signing up, your API key is shown on the confirmation page and emailed to you. You can also find it on your account page if you log back in later.",
  },
  {
    title: "Paste it into Pythia Athletics",
    description: 'Paste the key into the "Odds API key" field above. It\'s stored only in your browser.',
  },
];
