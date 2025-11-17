"use client";

import { FormEvent, useMemo, useState } from "react";
import { ResultView } from "@/app/components/ResultView";
import type { GenerationRequest, GenerationResult } from "@/app/utils/types";
import "@/app/styles/page.css";

const defaultForm: GenerationRequest = {
  topic: "Global AI policy shifts",
  mode: "newsletter" as const,
  voice: "analytical" as const,
  audience: "executives" as const,
  length: "standard" as const,
  includeSources: true
};

const voiceLabels: Record<GenerationRequest["voice"], string> = {
  analytical: "Analytical",
  optimistic: "Optimistic",
  urgent: "Urgent",
  casual: "Casual",
  visionary: "Visionary"
};

const audienceLabels: Record<GenerationRequest["audience"], string> = {
  executives: "Executive leaders",
  builders: "Product builders",
  investors: "Investors",
  general: "Curious readers"
};

const lengthLabels: Record<GenerationRequest["length"], string> = {
  brief: "Quick (≈3 sections)",
  standard: "Newsletter depth (≈4 sections)",
  deep: "In-depth (≈6 sections)"
};

export default function Home() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitDisabled = useMemo(() => form.topic.trim().length === 0 || status === "loading", [form.topic, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitDisabled) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to generate content." }));
        throw new Error(data.error ?? "Failed to run the agent.");
      }

      const data: GenerationResult = await response.json();
      setResult(data);
      setStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected issue generating content.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="eyebrow">Agentic newsroom</p>
          <h1>Latest Insights Studio</h1>
          <p className="lead">
            Auto-draft a newsletter or blog from the freshest headlines. Choose your angle, audience, and tone —
            the agent curates sources, surfaces highlights, and packages it ready to ship.
          </p>
        </div>
      </header>

      <section className="grid">
        <form className="control-panel" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="topic">Focus</label>
            <input
              id="topic"
              name="topic"
              value={form.topic}
              onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
              placeholder="e.g. Generative AI regulation in the EU"
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label>Format</label>
            <div className="segmented">
              <button
                type="button"
                className={form.mode === "newsletter" ? "active" : ""}
                onClick={() => setForm((prev) => ({ ...prev, mode: "newsletter" }))}
              >
                Newsletter
              </button>
              <button
                type="button"
                className={form.mode === "blog" ? "active" : ""}
                onClick={() => setForm((prev) => ({ ...prev, mode: "blog" }))}
              >
                Blog article
              </button>
            </div>
          </div>

          <div className="field">
            <label>Tone</label>
            <select
              value={form.voice}
              onChange={(event) => setForm((prev) => ({ ...prev, voice: event.target.value as typeof prev.voice }))}
            >
              {Object.entries(voiceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Audience</label>
            <select
              value={form.audience}
              onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value as typeof prev.audience }))}
            >
              {Object.entries(audienceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Depth</label>
            <select
              value={form.length}
              onChange={(event) => setForm((prev) => ({ ...prev, length: event.target.value as typeof prev.length }))}
            >
              <option value="brief">{lengthLabels.brief}</option>
              <option value="standard">{lengthLabels.standard}</option>
              <option value="deep">{lengthLabels.deep}</option>
            </select>
          </div>

          <div className="checkbox">
            <input
              id="sources"
              type="checkbox"
              checked={form.includeSources}
              onChange={(event) => setForm((prev) => ({ ...prev, includeSources: event.target.checked }))}
            />
            <label htmlFor="sources">Include source links</label>
          </div>

          <button className="primary" type="submit" disabled={submitDisabled}>
            {status === "loading" ? "Assembling..." : "Generate"}
          </button>

          {errorMessage && (
            <p className="error" role="alert">
              {errorMessage}
            </p>
          )}
        </form>

        <div className="output-panel">
          {status === "loading" && (
            <div className="loading">
              <span className="spinner" aria-hidden />
              <p>Scanning live feeds and drafting your {form.mode}…</p>
            </div>
          )}

          {result && status !== "loading" && <ResultView result={result} />}

          {!result && status !== "loading" && (
            <div className="placeholder">
              <h3>Ready when you are</h3>
              <p>
                Drop a topic above and the agent will curate the freshest coverage, analyse it with your chosen
                tone, and ship a ready-to-publish {form.mode} draft.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
