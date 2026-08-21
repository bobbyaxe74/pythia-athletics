"use client";

import { useEffect, useState, type FormEvent } from "react";

interface ApiKeyGateProps {
  storageKey: string;
  label: string;
  placeholder: string;
  helpText: string;
  onKeyChange: (key: string | null) => void;
}

export function ApiKeyGate({ storageKey, label, placeholder, helpText, onKeyChange }: ApiKeyGateProps) {
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(storageKey);
      if (existing) {
        setStoredKey(existing);
        onKeyChange(existing);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — user re-enters each visit.
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      window.localStorage.setItem(storageKey, trimmed);
    } catch {
      // ignore — key still works for this session via state
    }
    setStoredKey(trimmed);
    setDraft("");
    onKeyChange(trimmed);
  }

  function handleForget() {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setStoredKey(null);
    onKeyChange(null);
  }

  if (!hydrated) {
    return null;
  }

  if (storedKey) {
    return (
      <div className="key-connected">
        <span>{label} connected (stored only in this browser)</span>
        <button type="button" className="secondary" onClick={handleForget}>
          Forget key
        </button>
      </div>
    );
  }

  return (
    <div className="key-gate">
      <p>{helpText}</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="off"
        />
        <button type="submit">Connect</button>
      </form>
    </div>
  );
}
