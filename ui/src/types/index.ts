// ============================================
// CrMS Type Definitions
// ============================================

export type UserRole = 'CREATOR' | 'BRAND' | 'AGENCY' | 'ADMIN';
export type TeamRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER';

export interface UserTeam {
  id: string;
  name: string;
  avatarUrl?: string | null;
  ownerId: string;
  teamRole: TeamRole;
  memberCount?: number;
  isOwner?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  hasPassword?: boolean;
  createdAt: string;
  tier?: UsageTier;
  creatorProfile?: CreatorProfile;
  brandProfile?: BrandProfile;
  teams?: UserTeam[];
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
export type CampaignStage = 'BRIEF' | 'RECRUITING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type DeliverableStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'REJECTED';
export type DeliverableType = 'POST' | 'STORY' | 'REEL' | 'VIDEO' | 'REVIEW' | 'UNBOXING' | 'TUTORIAL' | 'OTHER';

export interface Campaign {
  id: string;
  brandProfileId: string;
  title: string;
  description?: string;
  budget?: number;
  spent?: number;
  targetNiche: string[];
  targetPlatforms: string[];
  status: CampaignStatus;
  stage?: CampaignStage;
  timeline?: { milestones?: Array<{ name: string; date: string; completed: boolean }> };
  kpis?: Array<{ metric: string; target: number; current: number }>;
  briefUrl?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  _count?: { matches: number; deliverables: number };
  brandProfile?: { user: { name: string } };
  deliverables?: CampaignDeliverable[];
  reports?: CampaignReportItem[];
}

export interface CampaignDeliverable {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  type: DeliverableType;
  title: string;
  description?: string;
  platform?: string;
  status: DeliverableStatus;
  contentUrl?: string;
  dueDate?: string;
  submittedAt?: string;
  approvedAt?: string;
  feedback?: string;
  payment?: number;
  createdAt: string;
  creatorProfile?: { user: { name: string; avatarUrl?: string } };
}

export interface CampaignReportItem {
  id: string;
  campaignId: string;
  title: string;
  metrics: Record<string, number>;
  roi?: number;
  summary?: string;
  generatedAt: string;
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
  externalPostId?: string;
  approvalStatus?: ApprovalStatus;
  teamId?: string;
  comments?: PostComment[];
  // Threading
  parentPostId?: string;
  threadOrder?: number;
  threadParts?: ContentPost[];
  // Recurring
  isRecurring?: boolean;
  recurrenceRule?: string;
  maxRecurrences?: number;
  recurrenceCount?: number;
  sourcePostId?: string;
  // Repost
  repostSourceUrl?: string;
  repostType?: string;
  // Media
  thumbnailUrl?: string;
  mediaUrls?: string[];
  // Reliability
  retryCount?: number;
  lastError?: string;
  // Relations (when included)
  analytics?: PostAnalytics;
  activityLogs?: PostActivityLog[];
}

export interface PostAnalytics {
  id: string;
  postId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  videoViews: number;
  avgWatchTime: number;
  profileVisits: number;
  estimatedRevenue?: number;
  boosted: boolean;
  fetchedAt: string;
}

export interface PostActivityLog {
  id: string;
  postId: string;
  userId: string;
  action: string;
  details?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: { id: string; name: string; avatarUrl?: string };
}

export interface CalendarNote {
  id: string;
  creatorProfileId: string;
  date: string;
  title: string;
  description?: string;
  color: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface RssFeed {
  id: string;
  creatorProfileId: string;
  url: string;
  title?: string;
  isActive: boolean;
  autoCreateIdeas: boolean;
  lastFetchedAt?: string;
  createdAt: string;
}

export interface HashtagAnalytics {
  id: string;
  creatorProfileId: string;
  hashtag: string;
  platform?: string;
  totalPosts: number;
  totalImpressions: number;
  totalReach: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  lastUsedAt?: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
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

// ─── Social Listening ───────────────────────────────────────

export interface ListeningQuery {
  id: string;
  userId: string;
  name: string;
  keywords: string[];
  platforms: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { mentions: number };
}

export interface Mention {
  id: string;
  queryId: string;
  platform: string;
  source?: string;
  content: string;
  url?: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  reach: number;
  createdAt: string;
  detectedAt: string;
}

export interface SentimentSnapshot {
  id: string;
  queryId: string;
  date: string;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  mixedCount: number;
  totalVolume: number;
}

export interface SentimentSummary {
  sentimentCounts: Record<string, number>;
  totalMentions: number;
  last24h: number;
}

// ─── Competitive Intelligence ───────────────────────────────

export interface Competitor {
  id: string;
  userId: string;
  name: string;
  handles: Record<string, string>;
  platforms: string[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  snapshots?: CompetitorSnapshot[];
  _count?: { snapshots: number };
}

export interface CompetitorSnapshot {
  id: string;
  competitorId: string;
  date: string;
  platform: string;
  followers: number;
  engagementRate: number;
  postFrequency: number;
  topContentTypes: string[];
  topHashtags: string[];
  avgLikes: number;
  avgComments: number;
}

// ─── Analytics & Reports ────────────────────────────────────

export type ReportFormat = 'PDF' | 'CSV' | 'JSON';
export type ReportStatus = 'DRAFT' | 'GENERATING' | 'READY' | 'FAILED' | 'SCHEDULED';

export interface AnalyticsReport {
  id: string;
  userId: string;
  creatorProfileId?: string;
  title: string;
  description?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  metrics: string[];
  platforms: string[];
  format: ReportFormat;
  status: ReportStatus;
  fileUrl?: string;
  schedule?: string;
  lastGeneratedAt?: string;
  generatedData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AudienceInsight {
  id: string;
  creatorProfileId: string;
  platform: string;
  date: string;
  demographics: Record<string, unknown>;
  activeHours: Record<string, number>;
  topCountries: Record<string, number>;
  topCities: Record<string, number>;
  interests: string[];
}

export interface ContentTypeBreakdown {
  type: string;
  count: number;
  totalEngagement: number;
  totalReach: number;
  avgEngRate: number;
}

// ─── Teams & Collaboration ──────────────────────────────────

export type TeamRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER';
export type ApprovalStatus = 'NONE' | 'PENDING_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
  workflows?: ApprovalWorkflow[];
  _count?: { members: number; posts: number; workflows: number };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user?: { id: string; name: string; email: string; avatarUrl?: string; role: string };
}

export interface ApprovalWorkflow {
  id: string;
  teamId: string;
  name: string;
  stages: Array<{ name: string; approverRoles: string[] }>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  isApproval: boolean;
  approvalAction?: string;
  createdAt: string;
  user?: { id: string; name: string; avatarUrl?: string };
}

// ─── Start Page / Link-in-Bio ──────────────────────────────

export interface StartPage {
  id: string;
  userId: string;
  slug: string;
  title: string;
  bio?: string;
  avatarUrl?: string;
  theme: string;
  blocks: unknown[];
  customCSS?: string;
  favicon?: string;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  links?: StartPageLink[];
  user?: { name: string; avatarUrl?: string };
}

export interface StartPageLink {
  id: string;
  pageId: string;
  title: string;
  url: string;
  icon?: string;
  thumbnail?: string;
  sortOrder: number;
  isActive: boolean;
  clicks: number;
  createdAt: string;
}

export interface StartPageAnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  ctr: number;
  daily: Array<{ date: string; views: number; clicks: number }>;
  topLinks: Array<{ id: string; title: string; clicks: number }>;
}

// ─── Notifications ──────────────────────────────────────────

export type NotificationType = 'AGENT_COMPLETED' | 'AGENT_FAILED' | 'TREND_ALERT' | 'MENTION' | 'APPROVAL_REQUEST' | 'APPROVAL_RESOLVED' | 'CAMPAIGN_UPDATE' | 'COMMENT_SPIKE' | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

// ─── Chat / Pipeline ───────────────────────────────────────

export interface ChatResponse {
  mode: 'single' | 'pipeline';
  agentType?: string;
  output?: unknown;
  tokensUsed?: number;
  steps?: Array<{ agentType: string; output: unknown; tokensUsed?: number }>;
}

// ─── V2: Usage & Budgets ────────────────────────────────────

export type UsageTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface UsageSummary {
  tier: UsageTier;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  resetAt: string;
  breakdown: Array<{ agentType: string; tokensUsed: number; calls: number }>;
}

export interface UsageHistoryEntry {
  date: string;
  tokens: number;
  calls: number;
}

// ─── V2: User Settings ─────────────────────────────────────

export interface UserSettings {
  id: string;
  userId: string;
  // Data refresh
  listeningFrequency: number;
  competitiveFrequency: number;
  // Notifications
  emailDigest: boolean;
  pushNotifications: boolean;
  notifyNewFollower: boolean;
  notifyMention: boolean;
  notifyCampaignUpdate: boolean;
  notifyCommentReply: boolean;
  // Publishing defaults
  defaultPlatform: string | null;
  defaultPostType: string | null;
  defaultHashtags: string[];
  autoSchedule: boolean;
  timezone: string;
  // AI preferences
  aiTone: string;
  aiLanguage: string;
  aiAutoSuggest: boolean;
  // Privacy
  profileVisibility: string;
  showAnalytics: boolean;
}

// ─── V2: Media Library ──────────────────────────────────────

export interface MediaFolder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  createdAt: string;
  _count?: { assets: number; children: number };
}

export interface MediaAsset {
  id: string;
  userId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  folderId?: string;
  createdAt: string;
}
