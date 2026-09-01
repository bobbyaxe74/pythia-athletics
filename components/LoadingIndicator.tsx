"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Fetching this week's fixtures…",
  "Pulling the latest odds…",
  "Checking recent form and injuries…",
  "Looking up head-to-head history…",
  "Weighing it all up…",
  "Finalizing predictions…",
];

const TYPE_DELAY_MS = 45;
const DELETE_DELAY_MS = 25;
const HOLD_MS = 1200;

export function LoadingIndicator() {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = PHRASES[phraseIndex % PHRASES.length];
    const fullyTyped = !deleting && text === currentPhrase;
    const delay = fullyTyped ? HOLD_MS : deleting ? DELETE_DELAY_MS : TYPE_DELAY_MS;

    const timer = setTimeout(() => {
      if (deleting) {
        if (text.length > 0) {
          setText(currentPhrase.slice(0, text.length - 1));
        } else {
          setDeleting(false);
          setPhraseIndex((i) => (i + 1) % PHRASES.length);
        }
        return;
      }

      if (text.length < currentPhrase.length) {
        setText(currentPhrase.slice(0, text.length + 1));
      } else {
        setDeleting(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, phraseIndex]);

  return (
    <p className="status-line loading-indicator" aria-live="polite">
      <span>{text}</span>
      <span className="loading-cursor" aria-hidden="true" />
    </p>
  );
}
