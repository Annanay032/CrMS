import {
  NotificationType, WorkflowStatus, AgentType, AgentTaskStatus, UsageTier,
} from '@prisma/client';
import { SeedContext, daysAgo, futureDate, dateOnly } from './context.js';

export async function seedPlatform(ctx: SeedContext) {
  const { prisma, users } = ctx;
  const { admin, creator1, creator2, creator3, testUser, brand1, brand2, agencyUser } = users;

  // ── Start Pages (Link-in-Bio) ─────────────────────────────
  const startPage = await prisma.startPage.create({
    data: {
      userId: creator1.id, slug: 'janecreates', title: 'Jane Creator',
      bio: 'Fitness & Lifestyle | LA 📍 | Helping you build healthy habits',
      theme: 'gradient-sunset', published: true,
      seoTitle: 'Jane Creator — Fitness & Wellness Content', seoDescription: 'Follow Jane for daily workout tips, meal prep ideas, and wellness content.',
      blocks: [{ type: 'header', content: 'Welcome to my page!' }, { type: 'social', platforms: ['instagram', 'tiktok', 'youtube'] }],
      links: {
        create: [
          { title: 'Free 7-Day Workout Guide', url: 'https://janecreator.example.com/free-guide', icon: 'dumbbell', sortOrder: 0, clicks: 342 },
          { title: 'YouTube Channel', url: 'https://youtube.example.com/@JaneCreatorFit', icon: 'youtube', sortOrder: 1, clicks: 187 },
          { title: 'FitGear Discount (20% off)', url: 'https://fitgear.example.com/jane20', icon: 'shopping-bag', sortOrder: 2, clicks: 523 },
          { title: 'Meal Prep E-Book', url: 'https://janecreator.example.com/ebook', icon: 'book', sortOrder: 3, clicks: 98 },
          { title: 'Contact / Collabs', url: 'mailto:jane@example.com', icon: 'mail', sortOrder: 4, clicks: 45 },
        ],
      },
    },
  });

  for (let i = 7; i >= 1; i--) {
    const d = dateOnly(daysAgo(i));
    await prisma.startPageAnalytics.upsert({
      where: { pageId_date: { pageId: startPage.id, date: d } },
      update: {},
      create: {
        pageId: startPage.id, date: d,
        views: Math.floor(Math.random() * 500) + 100,
        clicks: Math.floor(Math.random() * 150) + 30,
        topLinks: [{ title: 'FitGear Discount', clicks: Math.floor(Math.random() * 50) + 10 }, { title: 'Free Guide', clicks: Math.floor(Math.random() * 40) + 5 }],
      },
    });
  }
  console.log('Start pages seeded ✓');

  // ── Notifications ─────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: creator1.id, type: NotificationType.AGENT_COMPLETED, title: 'Content generated', body: 'AI generated 3 post ideas for your fitness niche.', read: true, createdAt: daysAgo(2) },
      { userId: creator1.id, type: NotificationType.TREND_ALERT, title: 'Trending: Home workouts', body: '"No equipment workout" is trending on TikTok with 2.3M views this week.', read: false, createdAt: daysAgo(1) },
      { userId: creator1.id, type: NotificationType.MENTION, title: 'New mention', body: '@fitlife_mag mentioned you in their Top 10 list.', read: false, data: { platform: 'INSTAGRAM', source: '@fitlife_mag' } },
      { userId: creator1.id, type: NotificationType.CAMPAIGN_UPDATE, title: 'Campaign match accepted', body: 'FitGear Co accepted your application for Summer Fitness Challenge.', read: true, createdAt: daysAgo(5) },
      { userId: creator1.id, type: NotificationType.APPROVAL_REQUEST, title: 'Post needs review', body: 'Alex requested changes on your protein powder review post.', read: false },
      { userId: creator1.id, type: NotificationType.SYSTEM, title: 'Welcome to CrMS!', body: 'Your account is set up. Start creating content and growing your brand!', read: true, createdAt: daysAgo(14) },
      { userId: brand1.id, type: NotificationType.CAMPAIGN_UPDATE, title: 'New match found', body: 'Jane Creator matched your Summer Fitness Challenge campaign with 92% score.', read: false },
      { userId: testUser.id, type: NotificationType.SYSTEM, title: 'Welcome to CrMS!', body: 'Your test account is ready. Explore the platform!', read: false },
    ],
  });
  console.log('Notifications seeded ✓');

  // ── Workflow Templates & Runs ─────────────────────────────
  const wfTemplate = await prisma.workflowTemplate.create({
    data: {
      name: 'Content Pipeline',
      description: 'Generate content ideas, schedule posts, and analyze performance.',
      steps: [
        { agentType: 'CONTENT_GENERATION', action: 'generate', inputMapping: { niche: '{{niche}}', platform: '{{platform}}' } },
        { agentType: 'SCHEDULING', action: 'optimize', inputMapping: { platform: '{{platform}}' } },
        { agentType: 'ANALYTICS', action: 'insights', inputMapping: { period: 'week' } },
      ],
    },
  });
  await prisma.workflowRun.createMany({
    data: [
      { templateId: wfTemplate.id, userId: creator1.id, status: WorkflowStatus.COMPLETED, currentStep: 3, stepResults: [{ step: 0, output: '3 ideas generated' }, { step: 1, output: 'Optimal times: Mon 9am, Wed 12pm' }, { step: 2, output: 'Engagement up 12%' }], startedAt: daysAgo(3), completedAt: daysAgo(3) },
      { templateId: wfTemplate.id, userId: creator1.id, status: WorkflowStatus.RUNNING, currentStep: 1, stepResults: [{ step: 0, output: '5 ideas generated' }], startedAt: daysAgo(0) },
    ],
  });
  console.log('Workflows seeded ✓');

  // ── Agent Tasks ───────────────────────────────────────────
  await prisma.agentTask.createMany({
    data: [
      { agentType: AgentType.CONTENT_GENERATION, userId: creator1.id, input: { niche: 'fitness', platform: 'INSTAGRAM', tone: 'motivational' }, output: { ideas: ['Post 1', 'Post 2', 'Post 3'] }, status: AgentTaskStatus.COMPLETED, tokensUsed: 1250, createdAt: daysAgo(3), completedAt: daysAgo(3) },
      { agentType: AgentType.ANALYTICS, userId: creator1.id, input: { period: 'week' }, output: { summary: 'Engagement up 12% WoW' }, status: AgentTaskStatus.COMPLETED, tokensUsed: 800, createdAt: daysAgo(2), completedAt: daysAgo(2) },
      { agentType: AgentType.SCHEDULING, userId: creator1.id, input: { platform: 'TIKTOK' }, output: { slots: ['Tue 5pm', 'Thu 7pm'] }, status: AgentTaskStatus.COMPLETED, tokensUsed: 450, createdAt: daysAgo(1), completedAt: daysAgo(1) },
      { agentType: AgentType.ENGAGEMENT, userId: creator1.id, input: { interactionIds: [], tone: 'friendly' }, status: AgentTaskStatus.FAILED, error: 'No interactions provided', tokensUsed: 50, createdAt: daysAgo(1) },
    ],
  });
  console.log('Agent tasks seeded ✓');

  // ── Usage Budgets & Logs ──────────────────────────────────
  const tierMap: Record<string, { tier: UsageTier; limit: number }> = {
    [admin.id]:     { tier: UsageTier.ENTERPRISE, limit: 1_000_000 },
    [creator1.id]:  { tier: UsageTier.PRO,        limit: 200_000 },
    [creator2.id]:  { tier: UsageTier.FREE,       limit: 50_000 },
    [creator3.id]:  { tier: UsageTier.FREE,       limit: 50_000 },
    [testUser.id]:  { tier: UsageTier.FREE,       limit: 50_000 },
    [brand1.id]:    { tier: UsageTier.PRO,        limit: 200_000 },
    [brand2.id]:    { tier: UsageTier.FREE,       limit: 50_000 },
    [agencyUser.id]:{ tier: UsageTier.ENTERPRISE, limit: 1_000_000 },
  };
  const allUsers = [creator1, creator2, creator3, testUser, brand1, brand2, agencyUser, admin];
  for (const u of allUsers) {
    const t = tierMap[u.id] ?? { tier: UsageTier.FREE, limit: 50_000 };
    await prisma.usageBudget.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, tier: t.tier, dailyTokenLimit: t.limit, tokensUsedToday: 0 },
    });
  }

  const agentTypes = [AgentType.CONTENT_GENERATION, AgentType.ANALYTICS, AgentType.SCHEDULING, AgentType.ENGAGEMENT];
  for (let i = 7; i >= 1; i--) {
    for (const at of agentTypes) {
      await prisma.agentUsageLog.create({
        data: { userId: creator1.id, agentType: at, model: 'gpt-4', tokensUsed: Math.floor(Math.random() * 2000) + 200, date: daysAgo(i) },
      });
    }
  }
  console.log('Usage budgets & logs seeded ✓');

  // ── Platform Rate Limits ──────────────────────────────────
  const rateLimits = [
    { platform: 'INSTAGRAM', endpoint: 'publish', requestsRemaining: 25, windowResetAt: futureDate(1) },
    { platform: 'INSTAGRAM', endpoint: 'insights', requestsRemaining: 200, windowResetAt: futureDate(1) },
    { platform: 'TIKTOK', endpoint: 'publish', requestsRemaining: 50, windowResetAt: futureDate(1) },
    { platform: 'YOUTUBE', endpoint: 'upload', requestsRemaining: 10, windowResetAt: futureDate(1) },
  ];
  for (const rl of rateLimits) {
    await prisma.platformRateLimit.upsert({
      where: { platform_endpoint: { platform: rl.platform, endpoint: rl.endpoint } },
      update: {},
      create: rl,
    });
  }
  console.log('Platform rate limits seeded ✓');

  // ── User Settings ─────────────────────────────────────────
  for (const u of allUsers) {
    await prisma.userSettings.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        listeningFrequency: 2,
        competitiveFrequency: 1,
        emailDigest: true,
        pushNotifications: true,
        notifyNewFollower: true,
        notifyMention: true,
        notifyCampaignUpdate: true,
        notifyCommentReply: true,
        defaultPlatform: 'INSTAGRAM',
        defaultPostType: 'POST',
        defaultHashtags: ['crms', 'creator'],
        autoSchedule: false,
        timezone: 'America/New_York',
        aiTone: 'friendly',
        aiLanguage: 'en',
        aiAutoSuggest: true,
        profileVisibility: 'public',
        showAnalytics: true,
      },
    });
  }
  console.log('User settings seeded ✓');

  // ── Media Library ─────────────────────────────────────────
  const rootFolder = await prisma.mediaFolder.create({
    data: { userId: creator1.id, name: 'All Media' },
  });
  const photosFolder = await prisma.mediaFolder.create({
    data: { userId: creator1.id, name: 'Photos', parentId: rootFolder.id },
  });
  await prisma.mediaFolder.create({
    data: { userId: creator1.id, name: 'Videos', parentId: rootFolder.id },
  });

  await prisma.mediaAsset.createMany({
    data: [
      { userId: creator1.id, filename: 'workout-reel-01.mp4', mimeType: 'video/mp4', size: 15_000_000, url: '/uploads/workout-reel-01.mp4', tags: ['workout', 'reel'], folderId: rootFolder.id },
      { userId: creator1.id, filename: 'meal-prep-thumbnail.jpg', mimeType: 'image/jpeg', size: 450_000, url: '/uploads/meal-prep-thumbnail.jpg', thumbnailUrl: '/uploads/thumbs/meal-prep-thumbnail.jpg', tags: ['food', 'thumbnail'], folderId: photosFolder.id },
      { userId: creator1.id, filename: 'profile-photo-2026.png', mimeType: 'image/png', size: 800_000, url: '/uploads/profile-photo-2026.png', thumbnailUrl: '/uploads/thumbs/profile-photo-2026.png', tags: ['profile'], folderId: photosFolder.id },
      { userId: creator1.id, filename: 'stretch-routine-b-roll.mp4', mimeType: 'video/mp4', size: 28_000_000, url: '/uploads/stretch-routine-b-roll.mp4', tags: ['broll', 'stretch'] },
    ],
  });
  console.log('Media library seeded ✓');
}
