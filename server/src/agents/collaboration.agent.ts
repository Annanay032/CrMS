import { env } from '../config/env.js';
import { openai } from '../config/index.js';
import { BaseAgent } from './base.js';
import type { AgentInput, AgentResult } from './base.js';
import { AgentType } from '../types/enums.js';

type CollaborationAction = 'route_for_approval' | 'notify_reviewer' | 'aggregate_feedback' | 'check_permissions';

export class CollaborationAgent extends BaseAgent {
  readonly agentType = AgentType.COLLABORATION;
  readonly name = 'Collaboration';

  async run(input: AgentInput): Promise<AgentResult> {
    const action = (input.action as CollaborationAction) || 'route_for_approval';

    switch (action) {
      case 'route_for_approval':
        return this.routeForApproval(input);
      case 'notify_reviewer':
        return this.notifyReviewer(input);
      case 'aggregate_feedback':
        return this.aggregateFeedback(input);
      case 'check_permissions':
        return this.checkPermissions(input);
      default:
        return this.routeForApproval(input);
    }
  }

  private async routeForApproval(input: AgentInput): Promise<AgentResult> {
    const { postCaption, postType, platform, teamMembers, workflowStages } = input as {
      postCaption?: string;
      postType?: string;
      platform?: string;
      teamMembers?: Array<{ name: string; role: string }>;
      workflowStages?: Array<{ name: string; approverRoles: string[] }>;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a content workflow assistant that helps route posts through approval stages. Analyze the content and recommend which team member(s) should review it and in what order. Return JSON.',
        },
        {
          role: 'user',
          content: `A ${postType ?? 'post'} for ${platform ?? 'social media'} needs approval routing.
Caption preview: "${(postCaption ?? '').slice(0, 200)}"
Team members: ${JSON.stringify(teamMembers ?? [])}
Workflow stages: ${JSON.stringify(workflowStages ?? [])}

Recommend the approval routing: which stage should handle first, suggested reviewers per stage, and any flags (e.g. "contains brand mention, needs legal review"). Return JSON with "routing" object containing: stages (array of { stageName, suggestedReviewers, reason }), priority ("normal" | "urgent"), flags (string array).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{"routing":{}}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async notifyReviewer(input: AgentInput): Promise<AgentResult> {
    const { postCaption, postType, platform, reviewerName, stageName } = input as {
      postCaption?: string;
      postType?: string;
      platform?: string;
      reviewerName?: string;
      stageName?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a team notification assistant. Generate concise, friendly notification messages for content reviewers. Return JSON.',
        },
        {
          role: 'user',
          content: `Generate a notification message for reviewer "${reviewerName ?? 'Team Member'}" about a ${postType ?? 'post'} for ${platform ?? 'social media'} at the "${stageName ?? 'review'}" stage.
Caption preview: "${(postCaption ?? '').slice(0, 200)}"

Return JSON with: subject (short notification title), body (2-3 sentence message), actionItems (array of what the reviewer should check).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content ?? '{"subject":"","body":"","actionItems":[]}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async aggregateFeedback(input: AgentInput): Promise<AgentResult> {
    const { comments, postCaption } = input as {
      comments?: Array<{ author: string; body: string; approvalAction?: string }>;
      postCaption?: string;
    };

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a feedback synthesis assistant. Summarize multiple reviewer comments into actionable feedback for the content creator. Return JSON.',
        },
        {
          role: 'user',
          content: `Summarize the following reviewer feedback on a post.
Post caption: "${(postCaption ?? '').slice(0, 300)}"
Comments: ${JSON.stringify(comments ?? [])}

Return JSON with: summary (overall sentiment & key themes in 2-3 sentences), actionItems (array of specific changes requested), consensus ("approved" | "needs_changes" | "mixed" | "rejected"), keyThemes (string array of recurring topics).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '{"summary":"","actionItems":[],"consensus":"mixed","keyThemes":[]}';
    return {
      output: JSON.parse(content),
      tokensUsed: response.usage?.total_tokens,
    };
  }

  private async checkPermissions(input: AgentInput): Promise<AgentResult> {
    const { userRole, action: requestedAction, resourceType } = input as {
      userRole?: string;
      action?: string;
      resourceType?: string;
    };

    // Permission matrix — deterministic, no LLM needed
    const permissionMatrix: Record<string, Record<string, string[]>> = {
      post: {
        create: ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR'],
        edit: ['OWNER', 'ADMIN', 'EDITOR'],
        delete: ['OWNER', 'ADMIN'],
        approve: ['OWNER', 'ADMIN', 'EDITOR'],
        publish: ['OWNER', 'ADMIN'],
        view: ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER'],
      },
      team: {
        manage_members: ['OWNER', 'ADMIN'],
        edit_settings: ['OWNER', 'ADMIN'],
        manage_workflows: ['OWNER', 'ADMIN'],
        view: ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER'],
      },
      workflow: {
        create: ['OWNER', 'ADMIN'],
        edit: ['OWNER', 'ADMIN'],
        delete: ['OWNER', 'ADMIN'],
        view: ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER'],
      },
    };

    const resource = resourceType ?? 'post';
    const act = requestedAction ?? 'view';
    const role = userRole ?? 'VIEWER';

    const allowedRoles = permissionMatrix[resource]?.[act] ?? [];
    const allowed = allowedRoles.includes(role);

    return {
      output: { allowed, role, action: act, resource, allowedRoles },
      tokensUsed: 0,
    };
  }
}
