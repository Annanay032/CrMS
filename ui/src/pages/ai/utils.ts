import type { AgentRouting } from './types';

const WELCOME_MESSAGE = "Hi! I'm your CrMS AI assistant. I can help you generate content ideas, optimize your schedule, find trends, and more. What would you like to do?";

export { WELCOME_MESSAGE };

export function routeAgent(userMessage: string): AgentRouting {
  const lower = userMessage.toLowerCase();

  if (lower.includes('schedule') || lower.includes('best time') || lower.includes('when to post')) {
    return {
      agentType: 'SCHEDULING',
      input: { platform: 'INSTAGRAM', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    };
  }
  if (lower.includes('trend') || lower.includes('trending') || lower.includes('viral')) {
    return {
      agentType: 'TREND_DETECTION',
      input: { niche: ['general'], platforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'] },
    };
  }
  if (lower.includes('analytics') || lower.includes('insights') || lower.includes('performance')) {
    return {
      agentType: 'ANALYTICS',
      input: { period: 'week' },
    };
  }
  if (lower.includes('reply') || lower.includes('comment') || lower.includes('engage')) {
    return {
      agentType: 'ENGAGEMENT',
      input: {},
    };
  }

  return {
    agentType: 'CONTENT_GENERATION',
    input: { niche: 'general', platform: 'INSTAGRAM', topic: userMessage, count: 3 },
  };
}
