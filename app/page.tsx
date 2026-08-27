"use client";

import { useEffect, useState } from "react";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { SportSelector } from "@/components/SportSelector";
import { ModelSelector } from "@/components/ModelSelector";
import { GameCard } from "@/components/GameCard";
import type { PredictionsResponse } from "@/lib/sports/types";
import { DEFAULT_CLAUDE_MODEL } from "@/lib/models";
import { buildShareText } from "@/lib/share";
import { ANTHROPIC_KEY_HELP, ODDS_API_KEY_HELP } from "@/lib/help-content";

const MODEL_STORAGE_KEY = "pythia_claude_model";

interface Sport {
  id: string;
  label: string;
}

export default function HomePage() {
  const [anthropicKey, setAnthropicKey] = useState<string | null>(null);
  const [oddsApiKey, setOddsApiKey] = useState<string | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CLAUDE_MODEL);
  const [predictions, setPredictions] = useState<PredictionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const storedModel = window.localStorage.getItem(MODEL_STORAGE_KEY);
      if (storedModel) setSelectedModel(storedModel);
    } catch {
      // localStorage unavailable — fall back to the default model.
    }
  }, []);

  function handleModelSelect(model: string) {
    setSelectedModel(model);
    try {
      window.localStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch {
      // ignore — selection still works for this session via state
    }
  }

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

  const keysReady = Boolean(anthropicKey && oddsApiKey);
  const canPredict = keysReady && Boolean(selectedSport) && !loading;

  async function runPrediction() {
    if (!anthropicKey || !oddsApiKey || !selectedSport) return;

    setLoading(true);
    setError(null);
    setPredictions(null);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: selectedSport,
          anthropicKey,
          oddsApiKey,
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load predictions");
      }
      setPredictions(data as PredictionsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!predictions) return;
    const sportLabel = sports.find((s) => s.id === selectedSport)?.label ?? predictions.sport;
    const text = buildShareText(sportLabel, predictions);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  return (
    <main>
      <header className="app-header">
        <h1>Pythia Athletics</h1>
        <p>Pick a sport, see this week&apos;s games, get Claude&apos;s take on who wins.</p>
      </header>

      <section className="card">
        <h2 className="card-title">1. Connect your keys</h2>
        <div className="key-gates">
          <ApiKeyGate
            storageKey="pythia_anthropic_key"
            label="Anthropic key"
            placeholder="sk-ant-..."
            helpText="Paste your Anthropic API key. It's stored only in this browser's local storage and sent directly to this app's server on each request — never saved server-side."
            helpTitle="How to get an Anthropic API key"
            helpSteps={ANTHROPIC_KEY_HELP}
            onKeyChange={setAnthropicKey}
          />
          <ApiKeyGate
            storageKey="pythia_odds_api_key"
            label="Odds API key"
            placeholder="The Odds API key..."
            helpText="Paste your own free key from the-odds-api.com to fetch this week's fixtures and odds. Also stored only in this browser."
            helpTitle="How to get an Odds API key"
            helpSteps={ODDS_API_KEY_HELP}
            onKeyChange={setOddsApiKey}
          />
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">2. Choose sport &amp; model</h2>
        {sports.length > 0 && (
          <SportSelector sports={sports} selected={selectedSport} onSelect={setSelectedSport} />
        )}

        <ModelSelector selected={selectedModel} onSelect={handleModelSelect} />

        <button type="button" className="predict-button" onClick={runPrediction} disabled={!canPredict}>
          {loading ? "Predicting…" : "Predict"}
        </button>

        {!keysReady && (
          <p className="status-line">
            Connect both your Anthropic key and Odds API key above to run predictions.
          </p>
        )}
      </section>

      {(loading || error || predictions) && (
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">3. Results</h2>
            {predictions && predictions.games.length > 0 && (
              <button type="button" className="secondary copy-button" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy for a friend"}
              </button>
            )}
          </div>

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
        </section>
      )}
    </main>
  );
}
