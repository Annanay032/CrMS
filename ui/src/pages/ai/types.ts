export interface Message {
  role: 'user' | 'ai';
  content: string;
}

export interface AgentRouting {
  agentType: string;
  input: Record<string, unknown>;
}
