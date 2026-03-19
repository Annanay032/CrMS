import { env } from '../config/env.js';
import { prisma, openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

type LinkInBioAction = 'generate_page' | 'suggest_layout' | 'optimize_links' | 'ab_test_suggestion';

export class LinkInBioAgent extends BaseAgent {
  readonly agentType = AgentType.LINK_IN_BIO;
  readonly name = 'LinkInBio';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as LinkInBioAction) || 'generate_page';

    switch (action) {
      case 'generate_page':
        return this.generatePage(input);
      case 'suggest_layout':
        return this.suggestLayout(input);
      case 'optimize_links':
        return this.optimizeLinks(input);
      case 'ab_test_suggestion':
        return this.abTestSuggestion(input);
      default:
        return this.generatePage(input);
    }
  }

  private async generatePage(input: AgentInput): Promise<AgentResult> {
    const { userId, niche, bio, name, platforms } = input as {
      userId?: string;
      niche?: string;
      bio?: string;
      name?: string;
      platforms?: string[];
    };

    let existingLinks: Array<{ title: string; url: string }> = [];
    if (userId) {
      const pages = await prisma.startPage.findMany({
        where: { userId },
        include: { links: { orderBy: { sortOrder: 'asc' } } },
        take: 1,
      });
      if (pages.length > 0) {
        existingLinks = pages[0].links.map((l) => ({ title: l.title, url: l.url }));
      }
    }

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a link-in-bio page designer. Generate a compelling start page layout with suggested blocks. Return JSON with fields: title, bio, theme (one of: default, minimal, bold, gradient, dark), blocks (array of { type, content }), suggestedLinks (array of { title, url, icon }).',
        },
        {
          role: 'user',
          content: JSON.stringify({
            name: name ?? 'Creator',
            niche: niche ?? 'general',
            bio: bio ?? '',
            platforms: platforms ?? [],
            existingLinks,
          }),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return {
      output: result,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async suggestLayout(input: AgentInput): Promise<AgentResult> {
    const { pageId } = input as { pageId: string };

    const page = await prisma.startPage.findUnique({
      where: { id: pageId },
      include: { links: { orderBy: { sortOrder: 'asc' } }, analytics: { orderBy: { date: 'desc' }, take: 30 } },
    });

    if (!page) throw new Error('Start page not found');

    const analytics = page.analytics.map((a) => ({
      date: a.date,
      views: a.views,
      clicks: a.clicks,
    }));

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a conversion optimization specialist for link-in-bio pages. Analyze the current page layout and its analytics, then suggest improvements. Return JSON with fields: recommendations (array of { area, suggestion, impact }), suggestedTheme, blockReorder (array of block indices), newBlocks (array of { type, content }).',
        },
        {
          role: 'user',
          content: JSON.stringify({
            title: page.title,
            bio: page.bio,
            theme: page.theme,
            blocks: page.blocks,
            links: page.links.map((l) => ({ title: l.title, url: l.url, clicks: l.clicks, isActive: l.isActive })),
            analytics,
          }),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return {
      output: result,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async optimizeLinks(input: AgentInput): Promise<AgentResult> {
    const { pageId } = input as { pageId: string };

    const page = await prisma.startPage.findUnique({
      where: { id: pageId },
      include: {
        links: { orderBy: { sortOrder: 'asc' } },
        analytics: { orderBy: { date: 'desc' }, take: 14 },
      },
    });

    if (!page) throw new Error('Start page not found');

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a link optimization expert. Analyze the current links, their click performance, and the overall page analytics. Suggest reordering, title changes, removals, and new link additions. Return JSON with fields: optimizedOrder (array of link ids in new order), titleSuggestions (array of { linkId, newTitle }), removals (array of link ids to deactivate), newLinks (array of { title, url, reason }).',
        },
        {
          role: 'user',
          content: JSON.stringify({
            links: page.links.map((l) => ({
              id: l.id,
              title: l.title,
              url: l.url,
              clicks: l.clicks,
              isActive: l.isActive,
            })),
            recentViews: page.analytics.reduce((sum, a) => sum + a.views, 0),
            recentClicks: page.analytics.reduce((sum, a) => sum + a.clicks, 0),
          }),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return {
      output: result,
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async abTestSuggestion(input: AgentInput): Promise<AgentResult> {
    const { pageId } = input as { pageId: string };

    const page = await prisma.startPage.findUnique({
      where: { id: pageId },
      include: { links: { orderBy: { sortOrder: 'asc' } }, analytics: { orderBy: { date: 'desc' }, take: 30 } },
    });

    if (!page) throw new Error('Start page not found');

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an A/B testing strategist for link-in-bio pages. Suggest A/B test variants to improve conversion. Return JSON with fields: tests (array of { name, hypothesis, variantA, variantB, metric, estimatedImpact }).',
        },
        {
          role: 'user',
          content: JSON.stringify({
            title: page.title,
            bio: page.bio,
            theme: page.theme,
            linkCount: page.links.length,
            totalClicks: page.links.reduce((s, l) => s + l.clicks, 0),
            avgDailyViews: page.analytics.length > 0
              ? Math.round(page.analytics.reduce((s, a) => s + a.views, 0) / page.analytics.length)
              : 0,
          }),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return {
      output: result,
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
