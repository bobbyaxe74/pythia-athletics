"use client";

import { useEffect } from "react";
import type { HelpStep } from "@/lib/help-content";
import { linkify } from "@/lib/linkify";

interface HelpModalProps {
  title: string;
  steps: HelpStep[];
  onClose: () => void;
}

export function HelpModal({ title, steps, onClose }: HelpModalProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="help-modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <ol className="modal-steps">
          {steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <p>{linkify(step.description)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
