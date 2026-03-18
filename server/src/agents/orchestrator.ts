import type { AgentType } from '../types/enums.js';
import type { BaseAgent, AgentInput, AgentResult } from './base.js';
import { ContentGenerationAgent } from './content.agent.js';
import { PublishingAgent } from './publishing.agent.js';
import { SchedulingAgent } from './scheduling.agent.js';
import { MatchingAgent } from './matching.agent.js';
import { AnalyticsAgent } from './analytics.agent.js';
import { EngagementAgent } from './engagement.agent.js';
import { TrendDetectionAgent } from './trends.agent.js';
import { SocialListeningAgent } from './listening.agent.js';
import { CompetitiveIntelligenceAgent } from './competitive.agent.js';
import { logger } from '../config/logger.js';

const agents: Record<string, BaseAgent> = {
  CONTENT_GENERATION: new ContentGenerationAgent(),
  PUBLISHING: new PublishingAgent(),
  SCHEDULING: new SchedulingAgent(),
  MATCHING: new MatchingAgent(),
  ANALYTICS: new AnalyticsAgent(),
  ENGAGEMENT: new EngagementAgent(),
  TREND_DETECTION: new TrendDetectionAgent(),
  LISTENING: new SocialListeningAgent(),
  COMPETITIVE: new CompetitiveIntelligenceAgent(),
};

export class AgentOrchestrator {
  getAgent(type: AgentType): BaseAgent {
    const agent = agents[type];
    if (!agent) throw new Error(`Unknown agent type: ${type}`);
    return agent;
  }

  async run(type: AgentType, userId: string, input: AgentInput): Promise<AgentResult> {
    const agent = this.getAgent(type);
    logger.info(`Orchestrator dispatching to [${agent.name}] for user ${userId}`);
    return agent.execute(userId, input);
  }

  listAgents(): Array<{ type: string; name: string }> {
    return Object.entries(agents).map(([type, agent]) => ({
      type,
      name: agent.name,
    }));
  }
}

export const orchestrator = new AgentOrchestrator();
