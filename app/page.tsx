"use client";

import { useEffect, useState } from "react";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { SportSelector } from "@/components/SportSelector";
import { GameCard } from "@/components/GameCard";
import type { PredictionsResponse } from "@/lib/sports/types";

interface Sport {
  id: string;
  label: string;
}

export default function HomePage() {
  const [anthropicKey, setAnthropicKey] = useState<string | null>(null);
  const [oddsApiKey, setOddsApiKey] = useState<string | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sports")
      .then((res) => res.json())
      .then((data: { sports: Sport[] }) => {
        setSports(data.sports);
        if (data.sports.length > 0) {
          setSelectedSport(data.sports[0].id);
        }
      })
      .catch(() => setError("Could not load the list of sports."));
  }, []);

  useEffect(() => {
    if (!anthropicKey || !oddsApiKey || !selectedSport) {
      setPredictions(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPredictions(null);

    fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport: selectedSport, anthropicKey, oddsApiKey }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load predictions");
        }
        return data as PredictionsResponse;
      })
      .then((data) => {
        if (!cancelled) setPredictions(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [anthropicKey, oddsApiKey, selectedSport]);

  const keysReady = Boolean(anthropicKey && oddsApiKey);

  return (
    <main>
      <header className="app-header">
        <h1>Pythia Athletics</h1>
        <p>Pick a sport, see this week&apos;s games, get Claude&apos;s take on who wins.</p>
      </header>

      <div className="key-gates">
        <ApiKeyGate
          storageKey="pythia_anthropic_key"
          label="Anthropic key"
          placeholder="sk-ant-..."
          helpText="Paste your Anthropic API key. It's stored only in this browser's local storage and sent directly to this app's server on each request — never saved server-side."
          onKeyChange={setAnthropicKey}
        />
        <ApiKeyGate
          storageKey="pythia_odds_api_key"
          label="Odds API key"
          placeholder="The Odds API key..."
          helpText="Paste your own free key from the-odds-api.com to fetch this week's fixtures and odds. Also stored only in this browser."
          onKeyChange={setOddsApiKey}
        />
      </div>

      {sports.length > 0 && (
        <SportSelector sports={sports} selected={selectedSport} onSelect={setSelectedSport} />
      )}

      {!keysReady && (
        <p className="status-line">
          Connect both your Anthropic key and Odds API key above to see predictions.
        </p>
      )}

      {loading && <p className="status-line">Fetching this week&apos;s games and asking Claude&hellip;</p>}

      {error && <p className="status-line error">{error}</p>}

      {predictions && !loading && predictions.games.length === 0 && (
        <p className="status-line">No games found for this sport in the next week.</p>
      )}

      {predictions && predictions.games.length > 0 && (
        <div className="games-list">
          {predictions.games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}
