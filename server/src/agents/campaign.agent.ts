import { env } from '../config/env.js';
import { prisma, openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

type CampaignAction = 'generate_brief' | 'suggest_creators' | 'track_deliverables' | 'calculate_roi' | 'generate_report';

export class CampaignAgent extends BaseAgent {
  readonly agentType = AgentType.CAMPAIGN;
  readonly name = 'Campaign';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as CampaignAction) || 'generate_brief';

    switch (action) {
      case 'generate_brief':
        return this.generateBrief(input);
      case 'suggest_creators':
        return this.suggestCreators(input);
      case 'track_deliverables':
        return this.trackDeliverables(input);
      case 'calculate_roi':
        return this.calculateROI(input);
      case 'generate_report':
        return this.generateReport(input);
      default:
        return this.generateBrief(input);
    }
  }

  private async generateBrief(input: AgentInput): Promise<AgentResult> {
    const { title, description, targetNiche, targetPlatforms, budget, goals } = input as {
      title: string;
      description?: string;
      targetNiche?: string[];
      targetPlatforms?: string[];
      budget?: number;
      goals?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a campaign strategist. Generate detailed campaign briefs for influencer marketing campaigns. Return JSON.',
        },
        {
          role: 'user',
          content: `Create a campaign brief for:
Title: "${title}"
Description: ${description ?? 'N/A'}
Niche: ${(targetNiche ?? []).join(', ') || 'general'}
Platforms: ${(targetPlatforms ?? []).join(', ') || 'all'}
Budget: $${budget ?? 'flexible'}
Goals: ${goals ?? 'brand awareness'}

Return JSON with: overview (2-3 sentences), objectives (string array), targetAudience (demographics description), contentGuidelines (string array of dos/donts), deliverables (array of { type, description, platform, quantity }), timeline (array of { milestone, weekNumber }), kpis (array of { metric, target, unit }), talkingPoints (string array), hashtagSuggestions (string array).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }

  private async suggestCreators(input: AgentInput): Promise<AgentResult> {
    const { campaignId } = input as { campaignId: string };

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { matches: { include: { creatorProfile: { include: { user: { select: { name: true } }, platformStats: true } } }, orderBy: { matchScore: 'desc' }, take: 10 } },
    });

    if (!campaign) throw new Error('Campaign not found');

    const matchSummary = campaign.matches.map((m) => ({
      name: m.creatorProfile.user.name,
      score: m.matchScore,
      niche: m.creatorProfile.niche,
      platforms: m.creatorProfile.platformStats.map((s) => ({ platform: s.platform, followers: s.followers, engagement: s.engagementRate })),
    }));

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a creator casting specialist. Analyze matched creators and provide strategic recommendations. Return JSON.',
        },
        {
          role: 'user',
          content: `Campaign: "${campaign.title}" — ${campaign.description ?? ''}
Budget: $${campaign.budget ?? 'flexible'}
Niche: ${campaign.targetNiche.join(', ')}

Top matched creators:
${JSON.stringify(matchSummary)}

For each creator, provide: name, recommendation ("strong_fit" | "good_fit" | "consider" | "skip"), reasoning (1 sentence), suggestedDeliverables (array of types), estimatedReach. Also provide an overall castingStrategy (2-3 sentences). Return JSON with "creators" array and "castingStrategy".`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return { output: JSON.parse(content), tokensUsed: response.usage?.total_tokens };
  }

  private async trackDeliverables(input: AgentInput): Promise<AgentResult> {
    const { campaignId } = input as { campaignId: string };

    const deliverables = await prisma.campaignDeliverable.findMany({
      where: { campaignId },
      include: { creatorProfile: { include: { user: { select: { name: true } } } } },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const summary = deliverables.map((d) => ({
      title: d.title,
      type: d.type,
      creator: d.creatorProfile.user.name,
      status: d.status,
      dueDate: d.dueDate?.toISOString(),
      isOverdue: d.dueDate ? d.dueDate < now && !['APPROVED', 'REJECTED'].includes(d.status) : false,
    }));

    const stats = {
      total: deliverables.length,
      pending: deliverables.filter((d) => d.status === 'PENDING').length,
      inProgress: deliverables.filter((d) => d.status === 'IN_PROGRESS').length,
      submitted: deliverables.filter((d) => d.status === 'SUBMITTED').length,
      approved: deliverables.filter((d) => d.status === 'APPROVED').length,
      overdue: summary.filter((s) => s.isOverdue).length,
    };

    return {
      output: { deliverables: summary, stats, totalPayment: deliverables.reduce((s, d) => s + (d.payment ?? 0), 0) },
      tokensUsed: 0,
    };
  }

  private async calculateROI(input: AgentInput): Promise<AgentResult> {
    const { campaignId } = input as { campaignId: string };

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        deliverables: { where: { status: 'APPROVED' } },
        reports: { orderBy: { generatedAt: 'desc' }, take: 1 },
      },
    });

    if (!campaign) throw new Error('Campaign not found');

    const spent = campaign.spent || 0;
    const budget = campaign.budget || 1;
    const latestReport = campaign.reports[0];
    const metrics = (latestReport?.metrics ?? {}) as Record<string, number>;

    const impressions = metrics.impressions ?? 0;
    const clicks = metrics.clicks ?? 0;
    const conversions = metrics.conversions ?? 0;

    const cpm = impressions > 0 ? (spent / impressions) * 1000 : 0;
    const cpc = clicks > 0 ? spent / clicks : 0;
    const cpa = conversions > 0 ? spent / conversions : 0;
    const budgetUtilization = (spent / budget) * 100;

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a campaign ROI analyst. Provide insights on campaign performance. Return JSON.',
        },
        {
          role: 'user',
          content: `Campaign "${campaign.title}" ROI analysis:
Budget: $${budget}, Spent: $${spent} (${budgetUtilization.toFixed(1)}%)
Impressions: ${impressions}, Clicks: ${clicks}, Conversions: ${conversions}
CPM: $${cpm.toFixed(2)}, CPC: $${cpc.toFixed(2)}, CPA: $${cpa.toFixed(2)}
Deliverables approved: ${campaign.deliverables.length}

Analyze and return JSON with: roi (percentage), performanceRating ("excellent"|"good"|"average"|"below_average"|"poor"), insights (string array of 3-5 key findings), recommendations (string array of 2-3 improvements), benchmarkComparison (how it compares to industry averages).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const analysis = JSON.parse(content);

    return {
      output: { ...analysis, metrics: { cpm, cpc, cpa, budgetUtilization, spent, budget, impressions, clicks, conversions } },
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async generateReport(input: AgentInput): Promise<AgentResult> {
    const { campaignId } = input as { campaignId: string };

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        matches: { where: { status: 'ACCEPTED' }, include: { creatorProfile: { include: { user: { select: { name: true } }, platformStats: true } } } },
        deliverables: true,
      },
    });

    if (!campaign) throw new Error('Campaign not found');

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a campaign reporting specialist. Generate comprehensive campaign performance summaries. Return JSON.',
        },
        {
          role: 'user',
          content: `Generate a report for campaign "${campaign.title}".
Budget: $${campaign.budget ?? 0}, Spent: $${campaign.spent}
Period: ${campaign.startDate?.toISOString().slice(0, 10) ?? 'N/A'} to ${campaign.endDate?.toISOString().slice(0, 10) ?? 'N/A'}
Creators: ${campaign.matches.length}
Deliverables: ${campaign.deliverables.length} total, ${campaign.deliverables.filter((d) => d.status === 'APPROVED').length} approved

Return JSON with: title (report title), summary (3-4 sentence executive summary), metrics (object with impressions, reach, engagement, clicks, conversions — estimate based on creator stats), highlights (string array), areasForImprovement (string array), overallGrade ("A"|"B"|"C"|"D"|"F").`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const reportData = JSON.parse(content);

    // Persist the report
    const report = await prisma.campaignReport.create({
      data: {
        campaignId,
        title: reportData.title ?? `${campaign.title} Report`,
        metrics: reportData.metrics ?? {},
        roi: reportData.roi,
        summary: reportData.summary,
      },
    });

    return {
      output: { ...reportData, reportId: report.id },
      tokensUsed: response.usage?.total_tokens,
    };
  }
}
