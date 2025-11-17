"use client";

import { useMemo, useState } from "react";
import type { GenerationResult } from "@/app/utils/types";

interface ResultViewProps {
  result: GenerationResult;
}

function renderMarkdown(result: GenerationResult): string {
  const header = `# ${result.mode === "newsletter" ? "Newsletter" : "Blog"}: ${result.topic}\n`;
  const meta = `*Audience:* ${result.audience}\n\n*Voice:* ${result.voice}\n\n*Generated:* ${new Date(result.generatedAt).toLocaleString()}\n\n`;

  const hero = result.hero
    ? `## ${result.hero.headline}\n${result.hero.excerpt}\n\n`
    : result.introduction
      ? `## Introduction\n${result.introduction}\n\n`
      : "";

  const sections = result.sections
    .map((section) => {
      const bullets = section.bullets.map((bullet) => `- ${bullet}`).join("\n");
      const source = section.source ? `\n\n[Source](${section.source.url}) — ${section.source.publisher ?? ""}` : "";
      return `### ${section.title}\n${section.summary}\n\n${bullets}\n\n${section.insight}${source}\n`;
    })
    .join("\n");

  const conclusion = result.conclusion ? `\n## Conclusion\n${result.conclusion}\n` : "";
  const cta = result.callToAction ? `\n> ${result.callToAction}\n` : "";
  const sources = result.sources.length
    ? `\n## Sources\n${result.sources.map((src) => `- [${src.title}](${src.url})`).join("\n")}\n`
    : "";

  return `${header}${meta}${hero}${sections}${conclusion}${cta}${sources}`.trim();
}

export function ResultView({ result }: ResultViewProps) {
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => renderMarkdown(result), [result]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      console.error("Clipboard error", error);
    }
  };

  return (
    <section className="fade-in" aria-live="polite">
      <div className="result-card">
        <header className="result-header">
          <div>
            <span className="badge">{result.mode === "newsletter" ? "Newsletter" : "Blog"}</span>
            <h2>{result.topic || "Latest Moves"}</h2>
            <p className="meta">
              {result.audience.toUpperCase()} • tone: {result.voice} • approx. {result.meta.wordCount} words
            </p>
          </div>
          <button className="ghost" onClick={handleCopy} type="button">
            {copied ? "Copied" : "Copy as Markdown"}
          </button>
        </header>

        {result.hero && (
          <article className="hero">
            <span className="badge subtle">{result.hero.kicker}</span>
            <h3>{result.hero.headline}</h3>
            <p>{result.hero.excerpt}</p>
          </article>
        )}

        {!result.hero && result.introduction && (
          <article className="intro">
            <h3>Opening</h3>
            <p>{result.introduction}</p>
          </article>
        )}

        <div className="highlights">
          {result.highlights.map((highlight) => (
            <div key={highlight} className="highlight">
              {highlight}
            </div>
          ))}
        </div>

        <div className="sections">
          {result.sections.map((section) => (
            <article key={section.title} className="section">
              <header>
                <h3>{section.title}</h3>
                {section.source && (
                  <a href={section.source.url} target="_blank" rel="noreferrer">
                    {section.source.publisher ?? "Source"}
                  </a>
                )}
              </header>
              <p>{section.summary}</p>
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <p className="insight">{section.insight}</p>
            </article>
          ))}
        </div>

        {result.conclusion && (
          <article className="closing">
            <h3>Conclusion</h3>
            <p>{result.conclusion}</p>
          </article>
        )}

        {result.callToAction && (
          <div className="cta">{result.callToAction}</div>
        )}

        {result.sources.length > 0 && (
          <footer className="sources">
            <h4>{result.mode === "newsletter" ? "Citations" : "Further Reading"}</h4>
            <ul>
              {result.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.publisher ? `${source.publisher}: ${source.title}` : source.title}
                  </a>
                  {source.publishedAt && (
                    <span className="timestamp">
                      {new Date(source.publishedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </footer>
        )}
      </div>
    </section>
  );
}
