import { EventEmitter } from 'events';
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
import { CollaborationAgent } from './collaboration.agent.js';
import { CampaignAgent } from './campaign.agent.js';
import { LinkInBioAgent } from './linkinbio.agent.js';
import { prisma } from '../config/index.js';
import { logger } from '../config/logger.js';
import { checkBudget, recordUsage, getModelForAgent } from '../services/usage.service.js';

// ─── Event Types ────────────────────────────────────────────

export interface AgentEvent {
  type: 'agent:started' | 'agent:completed' | 'agent:failed' | 'workflow:step' | 'workflow:completed' | 'workflow:failed';
  agentType: string;
  userId: string;
  taskId?: string;
  data?: unknown;
}

export interface WorkflowStep {
  agentType: string;
  action?: string;
  inputMapping?: Record<string, string>; // maps prev step output fields → this step input fields
}

// ─── Orchestrator ───────────────────────────────────────────

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
  COLLABORATION: new CollaborationAgent(),
  CAMPAIGN: new CampaignAgent(),
  LINK_IN_BIO: new LinkInBioAgent(),
};

export class AgentOrchestrator extends EventEmitter {
  getAgent(type: AgentType): BaseAgent {
    const agent = agents[type];
    if (!agent) throw new Error(`Unknown agent type: ${type}`);
    return agent;
  }

  async run(type: AgentType, userId: string, input: AgentInput): Promise<AgentResult> {
    const agent = this.getAgent(type);
    logger.info(`Orchestrator dispatching to [${agent.name}] for user ${userId}`);

    // Budget gate
    await checkBudget(userId);

    this.emit('agent:started', { type: 'agent:started', agentType: type, userId } satisfies AgentEvent);

    try {
      const result = await agent.execute(userId, input);

      // Record usage
      if (result.tokensUsed) {
        const model = getModelForAgent(type);
        await recordUsage(userId, type, result.tokensUsed, model).catch(() => {});
      }

      this.emit('agent:completed', {
        type: 'agent:completed',
        agentType: type,
        userId,
        data: { tokensUsed: result.tokensUsed },
      } satisfies AgentEvent);
      return result;
    } catch (err) {
      this.emit('agent:failed', {
        type: 'agent:failed',
        agentType: type,
        userId,
        data: { error: err instanceof Error ? err.message : 'Unknown error' },
      } satisfies AgentEvent);
      throw err;
    }
  }

  /**
   * Run a multi-step agent pipeline. Each step's output is passed to the next
   * step using the inputMapping configuration.
   */
  async runPipeline(
    userId: string,
    steps: WorkflowStep[],
    initialInput: AgentInput,
    workflowRunId?: string,
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    let prevOutput: unknown = initialInput;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const agentType = step.agentType as AgentType;

      // Build input by merging initial input with mapped output from previous step
      let stepInput: AgentInput = { ...initialInput };
      if (step.action) stepInput.action = step.action;

      if (step.inputMapping && prevOutput && typeof prevOutput === 'object') {
        for (const [fromKey, toKey] of Object.entries(step.inputMapping)) {
          stepInput[toKey] = (prevOutput as Record<string, unknown>)[fromKey];
        }
      }

      this.emit('workflow:step', {
        type: 'workflow:step',
        agentType,
        userId,
        data: { step: i, total: steps.length, workflowRunId },
      } satisfies AgentEvent);

      // Update workflow run progress
      if (workflowRunId) {
        await prisma.workflowRun.update({
          where: { id: workflowRunId },
          data: { currentStep: i, status: 'RUNNING' },
        }).catch(() => {});
      }

      try {
        const result = await this.run(agentType, userId, stepInput);
        results.push(result);
        prevOutput = result.output;

        if (workflowRunId) {
          await prisma.workflowRun.update({
            where: { id: workflowRunId },
            data: {
              stepResults: results.map((r, idx) => ({
                step: idx,
                agentType: steps[idx].agentType,
                output: r.output,
                tokensUsed: r.tokensUsed,
              })) as any,
            },
          }).catch(() => {});
        }
      } catch (err) {
        if (workflowRunId) {
          await prisma.workflowRun.update({
            where: { id: workflowRunId },
            data: {
              status: 'FAILED',
              error: `Step ${i} (${agentType}) failed: ${err instanceof Error ? err.message : 'Unknown'}`,
              completedAt: new Date(),
            },
          }).catch(() => {});
        }
        this.emit('workflow:failed', {
          type: 'workflow:failed',
          agentType,
          userId,
          data: { step: i, workflowRunId, error: err instanceof Error ? err.message : 'Unknown' },
        } satisfies AgentEvent);
        throw err;
      }
    }

    if (workflowRunId) {
      await prisma.workflowRun.update({
        where: { id: workflowRunId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      }).catch(() => {});
    }

    this.emit('workflow:completed', {
      type: 'workflow:completed',
      agentType: steps[steps.length - 1].agentType,
      userId,
      data: { workflowRunId, stepsCompleted: steps.length },
    } satisfies AgentEvent);

    return results;
  }

  /**
   * Run a workflow from a saved template.
   */
  async runWorkflow(templateId: string, userId: string, input: AgentInput): Promise<AgentResult[]> {
    const template = await prisma.workflowTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new Error('Workflow template not found');

    const run = await prisma.workflowRun.create({
      data: { templateId, userId, status: 'RUNNING' },
    });

    const steps = template.steps as unknown as WorkflowStep[];
    return this.runPipeline(userId, steps, input, run.id);
  }

  /**
   * Route a natural language message to the appropriate agent(s).
   * Returns the agent type and input for single-agent routing,
   * or multiple steps for a pipeline.
   */
  routeMessage(message: string): { steps: WorkflowStep[]; input: AgentInput } {
    const lower = message.toLowerCase();

    // Multi-agent pipeline detection
    if (
      (lower.includes('analyze') || lower.includes('performance')) &&
      (lower.includes('suggest') || lower.includes('recommend') || lower.includes('post'))
    ) {
      return {
        steps: [
          { agentType: 'ANALYTICS', action: 'weekly_summary' },
          { agentType: 'CONTENT_GENERATION', inputMapping: { insights: 'context' } },
        ],
        input: { period: 'week', platform: 'INSTAGRAM', topic: message, count: 3 },
      };
    }

    if (lower.includes('trend') && (lower.includes('draft') || lower.includes('create') || lower.includes('write'))) {
      return {
        steps: [
          { agentType: 'TREND_DETECTION' },
          { agentType: 'CONTENT_GENERATION', inputMapping: { trends: 'context' } },
        ],
        input: { niche: ['general'], platforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'], topic: message, count: 3 },
      };
    }

    if (lower.includes('campaign') && (lower.includes('find') || lower.includes('match') || lower.includes('creator'))) {
      return {
        steps: [
          { agentType: 'CAMPAIGN', action: 'generate_brief' },
          { agentType: 'MATCHING', action: 'rank_by_roi', inputMapping: { brief: 'context' } },
        ],
        input: { title: message, description: message },
      };
    }

    // Single-agent routing
    if (lower.includes('schedule') || lower.includes('best time') || lower.includes('when to post')) {
      return {
        steps: [{ agentType: 'SCHEDULING' }],
        input: { platform: 'INSTAGRAM', timezone: 'UTC' },
      };
    }
    if (lower.includes('trend') || lower.includes('trending') || lower.includes('viral')) {
      return {
        steps: [{ agentType: 'TREND_DETECTION' }],
        input: { niche: ['general'], platforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'] },
      };
    }
    if (lower.includes('analytics') || lower.includes('insight') || lower.includes('performance')) {
      return {
        steps: [{ agentType: 'ANALYTICS' }],
        input: { period: 'week' },
      };
    }
    if (lower.includes('reply') || lower.includes('comment') || lower.includes('engage')) {
      return {
        steps: [{ agentType: 'ENGAGEMENT' }],
        input: {},
      };
    }
    if (lower.includes('campaign') || lower.includes('brief') || lower.includes('influencer')) {
      return {
        steps: [{ agentType: 'CAMPAIGN', action: 'generate_brief' }],
        input: { title: message, description: message },
      };
    }
    if (lower.includes('listen') || lower.includes('mention') || lower.includes('sentiment')) {
      return {
        steps: [{ agentType: 'LISTENING' }],
        input: {},
      };
    }
    if (lower.includes('competitor') || lower.includes('competitive') || lower.includes('benchmark')) {
      return {
        steps: [{ agentType: 'COMPETITIVE' }],
        input: {},
      };
    }
    if (lower.includes('bio') || lower.includes('link page') || lower.includes('start page')) {
      return {
        steps: [{ agentType: 'LINK_IN_BIO', action: 'generate_page' }],
        input: {},
      };
    }

    // Default: content generation
    return {
      steps: [{ agentType: 'CONTENT_GENERATION' }],
      input: { niche: 'general', platform: 'INSTAGRAM', topic: message, count: 3 },
    };
  }

  listAgents(): Array<{ type: string; name: string }> {
    return Object.entries(agents).map(([type, agent]) => ({
      type,
      name: agent.name,
    }));
  }
}

export const orchestrator = new AgentOrchestrator();
