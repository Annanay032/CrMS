export interface Interaction {
  id: string;
  platform: string;
  interactionType: string;
  authorName?: string;
  content: string;
  sentiment?: string;
  aiSuggestion?: string;
  respondedAt?: string;
  createdAt: string;
  isRead: boolean;
  caseStatus?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
  assignedTo?: string;
  assignee?: { id: string; name: string; avatarUrl?: string };
}

export interface SavedReply {
  id: string;
  title: string;
  body: string;
  tags: string[];
  shortcut?: string;
  usageCount: number;
  createdAt: string;
}

export interface VoiceProfile {
  id: string;
  tonePreferences: string[];
  vocabulary: string[];
  formalityLevel: number;
  personalityTraits: string[];
  sampleReplies: string[];
}

export interface CommunityStats {
  total: number;
  pending: number;
  unread: number;
  positive: number;
  negative: number;
  questions: number;
  highPriority: number;
  responseRate: number;
}
