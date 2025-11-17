export type FeedDescriptor = {
  url: string;
  label: string;
  tags: string[];
};

export const FEEDS: FeedDescriptor[] = [
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    label: "NYTimes Technology",
    tags: ["technology", "innovation", "business"]
  },
  {
    url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    label: "WSJ World News",
    tags: ["world", "geopolitics", "economy"]
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    label: "The Verge",
    tags: ["technology", "culture", "gadgets"]
  },
  {
    url: "https://feeds.feedburner.com/TechCrunch/",
    label: "TechCrunch",
    tags: ["startups", "venture", "innovation"]
  },
  {
    url: "https://www.reddit.com/r/worldnews/.rss",
    label: "Reddit World News",
    tags: ["world", "trending", "breaking"]
  },
  {
    url: "https://hnrss.org/frontpage",
    label: "Hacker News Front Page",
    tags: ["technology", "startups", "engineering"]
  }
];
