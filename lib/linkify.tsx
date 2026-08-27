import type { ReactNode } from "react";

const LINK_PATTERNS: { match: string; href: string }[] = [
  { match: "console.anthropic.com", href: "https://console.anthropic.com" },
  { match: "the-odds-api.com", href: "https://the-odds-api.com" },
];

/** Turns known domain mentions in plain text into clickable links. */
export function linkify(text: string): ReactNode[] {
  let remaining = text;
  const nodes: ReactNode[] = [];
  let key = 0;

  while (remaining.length > 0) {
    let earliestIndex = -1;
    let matchedPattern: { match: string; href: string } | null = null;

    for (const pattern of LINK_PATTERNS) {
      const index = remaining.indexOf(pattern.match);
      if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
        earliestIndex = index;
        matchedPattern = pattern;
      }
    }

    if (!matchedPattern) {
      nodes.push(remaining);
      break;
    }

    if (earliestIndex > 0) {
      nodes.push(remaining.slice(0, earliestIndex));
    }
    nodes.push(
      <a key={key++} href={matchedPattern.href} target="_blank" rel="noopener noreferrer">
        {matchedPattern.match}
      </a>,
    );
    remaining = remaining.slice(earliestIndex + matchedPattern.match.length);
  }

  return nodes;
}
