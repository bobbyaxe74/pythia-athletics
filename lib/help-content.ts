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
