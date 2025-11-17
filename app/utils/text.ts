import type { AggregatedArticle, GenerationRequest, GenerationResult } from "./types";

const SENTENCE_REGEX = /(?<=[.!?])\s+/;

function sentenceSplit(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(SENTENCE_REGEX)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function summarize(text: string, maxSentences: number): string {
  const sentences = sentenceSplit(text);
  if (sentences.length === 0) {
    return text.trim();
  }
  return sentences.slice(0, maxSentences).join(" ");
}

function craftHighlight(article: AggregatedArticle): string {
  const base = summarize(article.summary, 1);
  return `${article.publisher}: ${base}`;
}

function toneModifier(voice: GenerationRequest["voice"], audience: GenerationRequest["audience"]): string {
  const voiceMap: Record<GenerationRequest["voice"], string> = {
    analytical: "Focus on the signal and quantify the impact.",
    optimistic: "Spot the opportunity and highlight upside potential.",
    urgent: "Flag what needs immediate attention and outline actions.",
    casual: "Keep it conversational and relatable.",
    visionary: "Connect the dots to the bigger-picture future." 
  };

  const audienceMap: Record<GenerationRequest["audience"], string> = {
    executives: "Prioritise strategic implications and bottom-line significance.",
    builders: "Surface technical shifts and implementation tips.",
    investors: "Watch for leading indicators and capital flows.",
    general: "Explain why this matters in plain language."
  };

  return `${voiceMap[voice]} ${audienceMap[audience]}`;
}

function sizeToSentences(length: GenerationRequest["length"]): number {
  switch (length) {
    case "brief":
      return 2;
    case "deep":
      return 5;
    default:
      return 3;
  }
}

function buildBullets(article: AggregatedArticle, length: GenerationRequest["length"], voice: GenerationRequest["voice"]): string[] {
  const detailSentences = sentenceSplit(article.content);
  const primary = summarize(article.summary, 1);
  const impactSentence = detailSentences.find((s) => /impact|implication|means|could/i.test(s));
  const forwardSentence = detailSentences.find((s) => /next|looking|expects|forecast|watch/i.test(s));

  const bullets: string[] = [
    `What happened: ${primary}`
  ];

  if (impactSentence) {
    bullets.push(`Why it matters: ${impactSentence}`);
  } else {
    bullets.push(
      `Why it matters: ${voice === "visionary" ? "Signals an inflection worth preparing for." : "Indicates a shift with near-term consequences."}`
    );
  }

  if (forwardSentence) {
    bullets.push(`What to watch: ${forwardSentence}`);
  } else {
    bullets.push(
      voice === "optimistic"
        ? "Opportunity: Position teams to capture the upswing early."
        : "Next move: Track follow-on announcements and reactions."
    );
  }

  if (length === "deep") {
    bullets.push(
      `Counterpoint: Balance this with ${article.publisher} coverage for blind spots.`
    );
  }

  return bullets.slice(0, length === "brief" ? 3 : bullets.length);
}

function craftInsight(article: AggregatedArticle, voice: GenerationRequest["voice"], audience: GenerationRequest["audience"]): string {
  const base = `${article.publisher} frames this as ${summarize(article.summary, 1).toLowerCase()}`;
  switch (audience) {
    case "executives":
      return `${base}. Translate that into board-ready talking points and align cross-functional owners.`;
    case "investors":
      return `${base}. Map the likely capital rotations and risk signals across the sector.`;
    case "builders":
      return `${base}. Plan the technical backlog adjustments before momentum compounds.`;
    default:
      return `${base}. Make it tangible with a real-world example for readers.`;
  }
}

function computeWordCount(result: Omit<GenerationResult, "meta">): number {
  const aggregateText = [
    result.hero?.headline,
    result.hero?.excerpt,
    result.introduction,
    ...result.sections.map((section) => `${section.title} ${section.summary} ${section.bullets.join(" ")} ${section.insight}`),
    result.conclusion,
    result.callToAction
  ]
    .filter(Boolean)
    .join(" ");

  return aggregateText.split(/\s+/).filter(Boolean).length;
}

export function assembleNewsletter(
  articles: AggregatedArticle[],
  request: GenerationRequest
): GenerationResult {
  const sectionCount = Math.min(
    articles.length,
    request.length === "brief" ? 3 : request.length === "deep" ? 6 : 4
  );
  const selected = articles.slice(0, sectionCount);
  const heroArticle = selected[0];

  const result: Omit<GenerationResult, "meta"> = {
    mode: "newsletter",
    topic: request.topic,
    audience: request.audience,
    voice: request.voice,
    length: request.length,
    generatedAt: new Date().toISOString(),
    highlights: selected.slice(0, 3).map(craftHighlight),
    hero: heroArticle
      ? {
          kicker: heroArticle.publisher,
          headline: heroArticle.title,
          excerpt: summarize(heroArticle.summary, sizeToSentences(request.length))
        }
      : undefined,
    sections: selected.map((article) => ({
      title: article.title,
      summary: summarize(article.summary, sizeToSentences(request.length)),
      bullets: buildBullets(article, request.length, request.voice),
      insight: craftInsight(article, request.voice, request.audience),
      source: {
        title: article.title,
        url: article.url,
        publisher: article.publisher,
        publishedAt: article.publishedAt
      }
    })),
    callToAction: request.audience === "executives"
      ? "Share with your leadership team and align the next operating review."
      : request.audience === "investors"
        ? "Send to LPs with your perspective before the weekly update."
        : "Forward to your community with a quick note on how to react.",
    conclusion: undefined,
    introduction: undefined,
    sources: selected.map((article) => ({
      title: article.title,
      url: article.url,
      publisher: article.publisher,
      publishedAt: article.publishedAt
    }))
  };

  const wordCount = computeWordCount(result);

  return {
    ...result,
    meta: {
      wordCount,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 220))
    }
  };
}

export function assembleBlog(
  articles: AggregatedArticle[],
  request: GenerationRequest
): GenerationResult {
  const sectionCount = Math.min(
    articles.length,
    request.length === "brief" ? 3 : request.length === "deep" ? 6 : 4
  );
  const selected = articles.slice(0, sectionCount);
  const tone = toneModifier(request.voice, request.audience);

  const introduction = selected
    .slice(0, 2)
    .map((article) => summarize(article.summary, 1))
    .join(" ");

  const sections = selected.map((article, index) => ({
    title: `Trend ${index + 1}: ${article.title}`,
    summary: summarize(article.content, sizeToSentences(request.length) + 1),
    bullets: buildBullets(article, request.length, request.voice),
    insight: `${tone} Leverage this development by crafting a response plan within the next sprint.`,
    source: {
      title: article.title,
      url: article.url,
      publisher: article.publisher,
      publishedAt: article.publishedAt
    }
  }));

  const conclusion =
    request.voice === "visionary"
      ? "These signals sketch the outline of the next wave. Set bold goals, back them with resources, and communicate the narrative before rivals do."
      : "Stay close to these moves, translate them into action items, and update stakeholders before momentum shifts again.";

  const result: Omit<GenerationResult, "meta"> = {
    mode: "blog",
    topic: request.topic,
    audience: request.audience,
    voice: request.voice,
    length: request.length,
    generatedAt: new Date().toISOString(),
    highlights: selected.slice(0, 3).map(craftHighlight),
    introduction: introduction.length > 0 ? `${introduction} ${tone}` : `${tone}`,
    sections,
    conclusion,
    callToAction: request.audience === "builders"
      ? "Invite readers to comment with the experiments they are running."
      : request.audience === "investors"
        ? "Prompt readers to subscribe for weekly deal-flow signals."
        : "Ask readers to share their perspective and subscribe for more breakdowns.",
    hero: undefined,
    sources: selected.map((article) => ({
      title: article.title,
      url: article.url,
      publisher: article.publisher,
      publishedAt: article.publishedAt
    }))
  };

  const wordCount = computeWordCount(result);

  return {
    ...result,
    meta: {
      wordCount,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 210))
    }
  };
}
