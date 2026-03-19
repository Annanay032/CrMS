import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';

interface RssItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  pubDate?: string;
}

interface RssFeedResponse {
  title?: string;
  items: RssItem[];
}

/**
 * Fetches and parses an RSS feed URL.
 * Uses a simple XML approach to avoid heavy dependencies.
 */
async function fetchFeed(url: string): Promise<RssFeedResponse> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CrMS RSS Fetcher/1.0' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseRssXml(xml);
}

/**
 * Minimal RSS/Atom XML parser — extracts items from <item> or <entry> elements.
 */
function parseRssXml(xml: string): RssFeedResponse {
  const items: RssItem[] = [];

  // Extract feed title
  const titleMatch = xml.match(/<channel>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
  const feedTitle = titleMatch?.[1] ?? undefined;

  // Match <item> (RSS 2.0) or <entry> (Atom)
  const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const getTag = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'));
      return m?.[1]?.trim();
    };

    // guid: try <guid>, fall back to <id>, then <link>
    const guid = getTag('guid') ?? getTag('id') ?? getTag('link');

    items.push({
      title: getTag('title'),
      link: getTag('link'),
      content: getTag('content:encoded') ?? getTag('content') ?? getTag('description'),
      contentSnippet: getTag('description'),
      guid: guid ?? undefined,
      pubDate: getTag('pubDate') ?? getTag('published') ?? getTag('updated'),
    });
  }

  return { title: feedTitle, items };
}

/**
 * Processes all active RSS feeds: fetches new items and creates ContentIdeas.
 */
export async function pollRssFeeds() {
  const feeds = await prisma.rssFeed.findMany({
    where: { isActive: true },
  });

  let totalNewIdeas = 0;

  for (const feed of feeds) {
    try {
      const parsed = await fetchFeed(feed.url);

      // Update feed title if we got one
      if (parsed.title && !feed.title) {
        await prisma.rssFeed.update({
          where: { id: feed.id },
          data: { title: parsed.title },
        });
      }

      let newItems = parsed.items;

      // Filter to only items after the last fetched item
      if (feed.lastItemGuid) {
        const lastIdx = newItems.findIndex((i) => i.guid === feed.lastItemGuid);
        if (lastIdx >= 0) {
          newItems = newItems.slice(0, lastIdx);
        }
      }

      if (newItems.length === 0) {
        await prisma.rssFeed.update({
          where: { id: feed.id },
          data: { lastFetchedAt: new Date() },
        });
        continue;
      }

      if (feed.autoCreateIdeas) {
        // Create ideas from new items (most recent first, limit 10 per poll)
        const toCreate = newItems.slice(0, 10);

        for (const item of toCreate) {
          await prisma.contentIdea.create({
            data: {
              creatorProfileId: feed.creatorProfileId,
              title: item.title ?? 'Untitled RSS Item',
              body: item.contentSnippet ?? item.content ?? item.link ?? '',
              status: 'SPARK',
              source: 'rss',
            },
          });
        }

        totalNewIdeas += toCreate.length;
      }

      // Update last fetched state
      await prisma.rssFeed.update({
        where: { id: feed.id },
        data: {
          lastFetchedAt: new Date(),
          lastItemGuid: newItems[0]?.guid ?? feed.lastItemGuid,
        },
      });

      logger.info(`RSS feed ${feed.id}: fetched ${newItems.length} new items`);
    } catch (err) {
      logger.error(`Failed to poll RSS feed ${feed.id} (${feed.url})`, err);
    }
  }

  logger.info(`RSS poll completed: ${totalNewIdeas} new ideas created from ${feeds.length} feeds`);
  return totalNewIdeas;
}

// ─── RSS Feed CRUD ──────────────────────────────────────────

export async function createFeed(creatorProfileId: string, data: {
  url: string;
  autoCreateIdeas?: boolean;
}) {
  // Validate by fetching the feed once
  const parsed = await fetchFeed(data.url);

  return prisma.rssFeed.create({
    data: {
      creatorProfileId,
      url: data.url,
      title: parsed.title,
      autoCreateIdeas: data.autoCreateIdeas ?? true,
    },
  });
}

export async function getFeeds(creatorProfileId: string) {
  return prisma.rssFeed.findMany({
    where: { creatorProfileId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteFeed(feedId: string, creatorProfileId: string) {
  return prisma.rssFeed.delete({
    where: { id: feedId, creatorProfileId },
  });
}

export async function toggleFeed(feedId: string, creatorProfileId: string, isActive: boolean) {
  return prisma.rssFeed.update({
    where: { id: feedId, creatorProfileId },
    data: { isActive },
  });
}
