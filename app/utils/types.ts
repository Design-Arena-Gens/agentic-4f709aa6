export type WritingMode = "newsletter" | "blog";

export type WritingLength = "brief" | "standard" | "deep";

export interface GenerationRequest {
  topic: string;
  mode: WritingMode;
  voice: "analytical" | "optimistic" | "urgent" | "casual" | "visionary";
  audience: "executives" | "builders" | "investors" | "general";
  length: WritingLength;
  includeSources: boolean;
}

export interface SourceLink {
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;
}

export interface ContentSection {
  title: string;
  summary: string;
  bullets: string[];
  insight: string;
  source?: SourceLink;
}

export interface GenerationResult {
  mode: WritingMode;
  topic: string;
  audience: GenerationRequest["audience"];
  voice: GenerationRequest["voice"];
  length: WritingLength;
  generatedAt: string;
  highlights: string[];
  hero?: {
    kicker: string;
    headline: string;
    excerpt: string;
  };
  introduction?: string;
  sections: ContentSection[];
  conclusion?: string;
  callToAction?: string;
  sources: SourceLink[];
  meta: {
    wordCount: number;
    readingTimeMinutes: number;
  };
}

export interface AggregatedArticle {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt?: string;
  summary: string;
  content: string;
  categories: string[];
  score: number;
}
