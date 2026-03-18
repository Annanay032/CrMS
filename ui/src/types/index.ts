// ============================================
// CrMS Type Definitions
// ============================================

export type UserRole = 'CREATOR' | 'BRAND' | 'AGENCY' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  creatorProfile?: CreatorProfile;
  brandProfile?: BrandProfile;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  bio?: string;
  niche: string[];
  location?: string;
  languages: string[];
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'NOT_AVAILABLE';
  platformStats?: PlatformStat[];
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

export interface PlatformStat {
  platform: string;
  followers: number;
  engagementRate: number;
  handle?: string;
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Campaign {
  id: string;
  brandProfileId: string;
  title: string;
  description?: string;
  budget?: number;
  targetNiche: string[];
  targetPlatforms: string[];
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  _count?: { matches: number };
  brandProfile?: { user: { name: string } };
}

export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export interface ContentPost {
  id: string;
  creatorProfileId: string;
  platform: string;
  postType: string;
  caption?: string;
  hashtags: string[];
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  firstComment?: string;
  platformOverrides?: Record<string, { caption?: string; hashtags?: string[] }>;
  bulkGroupId?: string;
  ideaId?: string;
}

// ─── Ideas & Tags ──────────────────────────────────────────

export type IdeaStatus = 'SPARK' | 'DEVELOPING' | 'READY' | 'ARCHIVED';

export interface ContentIdea {
  id: string;
  creatorProfileId: string;
  title: string;
  body?: string;
  status: IdeaStatus;
  source?: string;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  tags: Array<{ tag: ContentTag }>;
}

export interface ContentTag {
  id: string;
  creatorProfileId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  body: string;
  platform?: string;
  category: string;
  isGlobal: boolean;
  userId?: string;
  createdAt: string;
}

// ─── Agents ─────────────────────────────────────────────────

export type AgentType = 'CONTENT_GENERATION' | 'PUBLISHING' | 'SCHEDULING' | 'TREND_DETECTION' | 'ANALYTICS' | 'ENGAGEMENT' | 'MATCHING' | 'LISTENING' | 'COMPETITIVE' | 'CAMPAIGN' | 'COLLABORATION' | 'LINK_IN_BIO';
export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AgentTask {
  id: string;
  agentType: AgentType;
  userId?: string;
  status: TaskStatus;
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

export interface Trend {
  title: string;
  platform: string | string[];
  category: string;
  description: string;
  relevanceScore: number;
  urgency: string;
  contentIdea: string;
  estimatedReach: string;
}

export interface AnalyticsInsights {
  summary?: string;
  trend?: string;
  insights?: string[];
  recommendations?: string[];
  rawMetrics?: AnalyticsMetrics;
}

export interface AnalyticsMetrics {
  postsCount: number;
  totalImpressions: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  followerGrowth: number;
  platformBreakdown: Array<{
    platform: string;
    followers: number;
    engagementRate: number;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
