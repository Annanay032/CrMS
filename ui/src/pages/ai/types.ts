export interface MessageAttachment {
  url: string;
  name: string;
  type: 'image' | 'video' | 'file';
}

export interface Message {
  role: 'user' | 'ai';
  content: string;
  attachments?: MessageAttachment[];
}

export interface AgentRouting {
  agentType: string;
  input: Record<string, unknown>;
}
