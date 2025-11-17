import Parser from "rss-parser";
import { FEEDS } from "./feeds";
import type { AggregatedArticle, GenerationRequest } from "./types";
import { assembleBlog, assembleNewsletter } from "./text";

const parser = new Parser({ timeout: 10000 });

const FALLBACK_CONTENT = "A notable development shaping the current news cycle.";

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeText(text?: string): string {
  if (!text) return FALLBACK_CONTENT;
  return text.replace(/\s+/g, " ").trim();
}

function computeScore(
  article: AggregatedArticle,
  request: GenerationRequest,
  matchesTopic: boolean
): number {
  const now = Date.now();
  const publishedAt = article.publishedAt ? new Date(article.publishedAt).getTime() : now;
  const hoursOld = Math.max(1, (now - publishedAt) / 36e5);
  const recencyBoost = Math.max(0, 3 - Math.log(hoursOld));
  const topicBoost = matchesTopic ? 4 : 0;
  const voiceBoost = request.voice === "urgent" ? Math.max(0, 2.5 - Math.log(hoursOld)) : 0;
  return recencyBoost + topicBoost + voiceBoost + Math.random() * 0.3;
}

function normaliseUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.split("?ref")[0];
}

async function parseFeed(url: string) {
  try {
    return await parser.parseURL(url);
  } catch (error) {
    console.error("Failed to parse feed", url, error);
    return null;
  }
}

export async function collectArticles(topic: string, request: GenerationRequest): Promise<AggregatedArticle[]> {
  const topicQuery = topic.trim().toLowerCase();
  const collections = await Promise.all(FEEDS.map((feed) => parseFeed(feed.url)));

  const articlesMap = new Map<string, AggregatedArticle>();

  collections.forEach((feed, index) => {
    if (!feed?.items) return;
    const feedInfo = FEEDS[index];

    feed.items.forEach((item) => {
      const url = normaliseUrl(item.link || item.guid || "");
      const title = sanitizeText(item.title || item.link || "");
      const summary = sanitizeText(item.contentSnippet || stripHtml(item.content || ""));
      const content = sanitizeText(stripHtml(item["content:encoded"] || item.content || summary));
      if (!url || !title) return;

      const matchesTopic = topicQuery.length === 0
        ? true
        : `${title} ${summary}`.toLowerCase().includes(topicQuery);

      const publishedAt = item.isoDate || item.pubDate;

      const article: AggregatedArticle = {
        id: url,
        title,
        url,
        publisher: feedInfo?.label || stripHtml(feed.title) || "Latest Feed",
        publishedAt,
        summary: summary || FALLBACK_CONTENT,
        content: content || summary || FALLBACK_CONTENT,
        categories: feedInfo?.tags ?? [],
        score: 0
      };

      const score = computeScore(article, request, matchesTopic);
      article.score = score;

      if (!articlesMap.has(url) && (matchesTopic || topicQuery.length === 0)) {
        articlesMap.set(url, article);
      } else if (articlesMap.has(url)) {
        const existing = articlesMap.get(url)!;
        if (score > existing.score) {
          articlesMap.set(url, article);
        }
      }
    });
  });

  const deduped = Array.from(articlesMap.values())
    .filter((article) => article.summary.length > 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, request.length === "deep" ? 8 : 6);

  return deduped;
}

export async function runAgent(request: GenerationRequest) {
  const articles = await collectArticles(request.topic, request);

  if (articles.length === 0) {
    throw new Error("No relevant stories found for that topic just yet. Try broadening the search.");
  }

  const response = request.mode === "newsletter"
    ? assembleNewsletter(articles, request)
    : assembleBlog(articles, request);

  if (!request.includeSources) {
    response.sources = [];
    response.sections = response.sections.map((section) => ({
      ...section,
      source: undefined
    }));
  }

  return response;
}
