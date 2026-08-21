import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pythia Athletics",
  description: "AI-assisted picks for this week's games, powered by your own Anthropic key.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {children}
          <footer className="disclaimer">
            For informational purposes only. Not financial advice. Bet responsibly
            and only where legal.
          </footer>
        </div>
      </body>
    </html>
  );
}
