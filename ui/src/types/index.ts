export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'CREATOR' | 'BRAND' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  bio?: string;
  niche?: string;
  location?: string;
  languages: string[];
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'NOT_AVAILABLE';
}

export interface BrandProfile {
  id: string;
  userId: string;
  companyName: string;
  industry?: string;
  website?: string;
  budgetRangeLow?: number;
  budgetRangeHigh?: number;
}

export interface Campaign {
  id: string;
  brandProfileId: string;
  title: string;
  description?: string;
  budget?: number;
  targetNiche?: string;
  targetPlatforms: string[];
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
}

export interface ContentPost {
  id: string;
  creatorProfileId: string;
  platform: string;
  postType: string;
  caption?: string;
  hashtags: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledAt?: string;
  publishedAt?: string;
}

export interface AgentTask {
  id: string;
  agentType: string;
  userId?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  tokensUsed?: number;
  error?: string;
}

export interface CampaignMatch {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  matchScore: number;
  scoreBreakdown?: Record<string, number>;
  status: string;
}
