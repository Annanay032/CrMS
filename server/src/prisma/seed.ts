import {
  PrismaClient, Role, Platform, PostStatus, PostType, InteractionType,
  Sentiment, CampaignStatus, MatchStatus, AgentType, AgentTaskStatus,
  IdeaStatus, MentionSentiment, NotificationType, DeliverableType,
  DeliverableStatus, TeamRole, WorkflowStatus, ReportFormat, ReportStatus,
  RevenueType, InvoiceStatus, DealStatus, InboxChannelType, ChannelStatus, UsageTier,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function futureDate(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function main() {
  // ── Clean slate (delete in dependency order) ──────────────
  console.log('Cleaning existing data…');
  await prisma.startPageAnalytics.deleteMany();
  await prisma.startPageLink.deleteMany();
  await prisma.startPage.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.approvalWorkflow.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.workflowRun.deleteMany();
  await prisma.workflowTemplate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.agentUsageLog.deleteMany();
  await prisma.usageBudget.deleteMany();
  await prisma.agentTask.deleteMany();
  await prisma.platformRateLimit.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.mediaFolder.deleteMany();
  await prisma.competitorSnapshot.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.sentimentSnapshot.deleteMany();
  await prisma.mention.deleteMany();
  await prisma.listeningQuery.deleteMany();
  await prisma.userVoiceProfile.deleteMany();
  await prisma.commentScore.deleteMany();
  await prisma.savedReply.deleteMany();
  await prisma.communityInteraction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.brandDeal.deleteMany();
  await prisma.revenueStream.deleteMany();
  await prisma.inboxChannel.deleteMany();
  await prisma.campaignReport.deleteMany();
  await prisma.campaignDeliverable.deleteMany();
  await prisma.campaignMatch.deleteMany();
  await prisma.matchCriteria.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.analyticsReport.deleteMany();
  await prisma.audienceInsight.deleteMany();
  await prisma.postingSchedule.deleteMany();
  await prisma.contentTemplate.deleteMany();
  await prisma.contentIdeaTag.deleteMany();
  await prisma.contentTag.deleteMany();
  await prisma.contentIdea.deleteMany();
  await prisma.creatorAnalyticsSnapshot.deleteMany();
  await prisma.postAnalytics.deleteMany();
  await prisma.contentPost.deleteMany();
  await prisma.agencyCreator.deleteMany();
  await prisma.creatorPlatformStats.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.brandProfile.deleteMany();
  await prisma.agencyProfile.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.user.deleteMany();
  console.log('Clean slate ✓');

  const pw = await bcrypt.hash('password123', 12);

  // ── Users ─────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crms.local' },
    update: {},
    create: { email: 'admin@crms.local', name: 'CrMS Admin', passwordHash: pw, role: Role.ADMIN },
  });

  const creator1 = await prisma.user.upsert({
    where: { email: 'jane@crms.local' },
    update: {},
    create: {
      email: 'jane@crms.local', name: 'Jane Creator', passwordHash: pw, role: Role.CREATOR,
      creatorProfile: {
        create: {
          bio: 'Fitness & lifestyle content creator with 5+ years of experience. Specializing in home workouts, meal prep, and wellness tips.',
          niche: ['fitness', 'lifestyle', 'wellness'],
          location: 'Los Angeles, CA',
          languages: ['en', 'es'],
          platformStats: {
            create: [
              { platform: Platform.INSTAGRAM, handle: '@janecreates', followers: 125000, avgLikes: 4500, avgComments: 320, avgViews: 18000, engagementRate: 3.86 },
              { platform: Platform.YOUTUBE, handle: 'JaneCreatorFit', followers: 45000, avgLikes: 1200, avgComments: 85, avgViews: 22000, engagementRate: 2.85 },
              { platform: Platform.TIKTOK, handle: '@jane.creator', followers: 230000, avgLikes: 9800, avgComments: 540, avgViews: 85000, engagementRate: 4.49 },
            ],
          },
        },
      },
    },
  });

  const creator2 = await prisma.user.upsert({
    where: { email: 'alex@crms.local' },
    update: {},
    create: {
      email: 'alex@crms.local', name: 'Alex Tech', passwordHash: pw, role: Role.CREATOR,
      creatorProfile: {
        create: {
          bio: 'Tech reviewer & gaming streamer. Covering the latest gadgets, PC builds, and indie games.',
          niche: ['tech', 'gaming', 'education'],
          location: 'Austin, TX',
          languages: ['en'],
          platformStats: {
            create: [
              { platform: Platform.YOUTUBE, handle: 'AlexTechReviews', followers: 310000, avgLikes: 8200, avgComments: 650, avgViews: 120000, engagementRate: 2.86 },
              { platform: Platform.TIKTOK, handle: '@alextech', followers: 180000, avgLikes: 6200, avgComments: 380, avgViews: 95000, engagementRate: 3.66 },
            ],
          },
        },
      },
    },
  });

  const creator3 = await prisma.user.upsert({
    where: { email: 'mia@crms.local' },
    update: {},
    create: {
      email: 'mia@crms.local', name: 'Mia Beauty', passwordHash: pw, role: Role.CREATOR,
      creatorProfile: {
        create: {
          bio: 'Beauty & fashion influencer. Tutorials, hauls, and honest product reviews.',
          niche: ['beauty', 'fashion', 'lifestyle'],
          location: 'New York, NY',
          languages: ['en', 'fr'],
          platformStats: {
            create: [
              { platform: Platform.INSTAGRAM, handle: '@miabeauty', followers: 85000, avgLikes: 3200, avgComments: 210, avgViews: 12000, engagementRate: 4.0 },
              { platform: Platform.TIKTOK, handle: '@mia.beauty', followers: 420000, avgLikes: 18000, avgComments: 1200, avgViews: 200000, engagementRate: 4.57 },
            ],
          },
        },
      },
    },
  });

  // Dummy test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@crms.local' },
    update: {},
    create: {
      email: 'test@crms.local', name: 'Test Creator', passwordHash: pw, role: Role.CREATOR,
      creatorProfile: {
        create: {
          bio: 'Dummy test account for API validation. Covers travel, food, and photography.',
          niche: ['travel', 'food', 'photography'],
          location: 'San Francisco, CA',
          languages: ['en'],
          platformStats: {
            create: [
              { platform: Platform.INSTAGRAM, handle: '@testcreator', followers: 50000, avgLikes: 2000, avgComments: 150, avgViews: 8000, engagementRate: 4.3 },
              { platform: Platform.TIKTOK, handle: '@test.creator', followers: 75000, avgLikes: 3500, avgComments: 220, avgViews: 30000, engagementRate: 4.96 },
            ],
          },
        },
      },
    },
  });

  // Agency user
  const agencyUser = await prisma.user.upsert({
    where: { email: 'agency@crms.local' },
    update: {},
    create: {
      email: 'agency@crms.local', name: 'Talent Hub Agency', passwordHash: pw, role: Role.AGENCY,
      agencyProfile: {
        create: {
          agencyName: 'Talent Hub Agency',
          website: 'https://talenthub.example.com',
        },
      },
    },
  });

  const brand1 = await prisma.user.upsert({
    where: { email: 'brand@crms.local' },
    update: {},
    create: {
      email: 'brand@crms.local', name: 'FitGear Co', passwordHash: pw, role: Role.BRAND,
      brandProfile: {
        create: {
          companyName: 'FitGear Co', industry: 'Health & Fitness',
          website: 'https://fitgear.example.com',
          targetAudience: { ageRange: '18-35', interests: ['fitness', 'nutrition'], locations: ['US'] },
          budgetRangeLow: 500, budgetRangeHigh: 10000,
        },
      },
    },
  });

  const brand2 = await prisma.user.upsert({
    where: { email: 'techbrand@crms.local' },
    update: {},
    create: {
      email: 'techbrand@crms.local', name: 'Nova Electronics', passwordHash: pw, role: Role.BRAND,
      brandProfile: {
        create: {
          companyName: 'Nova Electronics', industry: 'Technology',
          website: 'https://nova-electronics.example.com',
          targetAudience: { ageRange: '16-40', interests: ['tech', 'gaming'], locations: ['US', 'EU'] },
          budgetRangeLow: 1000, budgetRangeHigh: 25000,
        },
      },
    },
  });

  console.log('Users seeded ✓');

  // ── Profiles lookup ───────────────────────────────────────
  const cp1 = await prisma.creatorProfile.findUnique({ where: { userId: creator1.id } });
  const cp2 = await prisma.creatorProfile.findUnique({ where: { userId: creator2.id } });
  const cp3 = await prisma.creatorProfile.findUnique({ where: { userId: creator3.id } });
  const cpTest = await prisma.creatorProfile.findUnique({ where: { userId: testUser.id } });
  const bp1 = await prisma.brandProfile.findUnique({ where: { userId: brand1.id } });
  const bp2 = await prisma.brandProfile.findUnique({ where: { userId: brand2.id } });
  const ap1 = await prisma.agencyProfile.findUnique({ where: { userId: agencyUser.id } });

  if (!cp1 || !cp2 || !cp3 || !cpTest || !bp1 || !bp2 || !ap1) throw new Error('Profile creation failed');

  // ── Agency-Creator links ──────────────────────────────────
  await prisma.agencyCreator.upsert({
    where: { agencyProfileId_creatorProfileId: { agencyProfileId: ap1.id, creatorProfileId: cp1.id } },
    update: {},
    create: { agencyProfileId: ap1.id, creatorProfileId: cp1.id },
  });
  await prisma.agencyCreator.upsert({
    where: { agencyProfileId_creatorProfileId: { agencyProfileId: ap1.id, creatorProfileId: cp3.id } },
    update: {},
    create: { agencyProfileId: ap1.id, creatorProfileId: cp3.id },
  });
  console.log('Agency links seeded ✓');

  // ── Content Posts for Jane ────────────────────────────────
  const posts = await Promise.all([
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.INSTAGRAM, postType: PostType.REEL,
        caption: '5-minute morning stretch routine to kickstart your day! 🧘‍♀️', hashtags: ['morningroutine', 'fitness', 'stretch', 'wellness'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(7), publishedAt: daysAgo(7),
        analytics: { create: { impressions: 45000, reach: 32000, likes: 4800, comments: 320, shares: 180, saves: 950, clicks: 120 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.TIKTOK, postType: PostType.SHORT,
        caption: 'Healthy meal prep for the week — under 30 mins! 🥗', hashtags: ['mealprep', 'healthyeating', 'fitnesslife'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(5), publishedAt: daysAgo(5),
        analytics: { create: { impressions: 120000, reach: 95000, likes: 12500, comments: 680, shares: 520, saves: 2200, clicks: 340 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.YOUTUBE, postType: PostType.VIDEO,
        caption: 'Full Week of Workouts — No Equipment Needed! | Follow-along Series', hashtags: ['homeworkout', 'noequipment', 'fitness'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(3), publishedAt: daysAgo(3),
        analytics: { create: { impressions: 28000, reach: 22000, likes: 1800, comments: 145, shares: 85, saves: 430, clicks: 200 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.INSTAGRAM, postType: PostType.CAROUSEL,
        caption: '10 foods that boost your metabolism ⚡ Save this for later!', hashtags: ['nutrition', 'metabolism', 'healthtips', 'wellness'],
        status: PostStatus.SCHEDULED, scheduledAt: futureDate(2),
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.TIKTOK, postType: PostType.SHORT,
        caption: 'Partner workout challenge! Tag your gym buddy 💪', hashtags: ['workoutchallenge', 'gympartner', 'fitness'],
        status: PostStatus.SCHEDULED, scheduledAt: futureDate(4),
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.INSTAGRAM, postType: PostType.STORY,
        caption: 'Behind the scenes of today\'s photoshoot 📸', hashtags: ['bts', 'contentcreator'],
        status: PostStatus.DRAFT,
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.YOUTUBE, postType: PostType.VIDEO,
        caption: 'My honest review of the top 5 protein powders 2026', hashtags: ['proteinreview', 'supplements', 'fitness'],
        status: PostStatus.REVIEW,
      },
    }),
  ]);
  console.log(`Content posts seeded: ${posts.length} ✓`);

  // ── Analytics snapshots for Jane (14 days) ────────────────
  const baseFollowers = 398000;
  for (let i = 14; i >= 0; i--) {
    const variance = Math.floor(Math.random() * 400) - 100;
    const dailyGain = Math.floor(Math.random() * 350) + 50;
    const totalFollowers = baseFollowers + (14 - i) * 280 + variance;
    await prisma.creatorAnalyticsSnapshot.upsert({
      where: { creatorProfileId_date: { creatorProfileId: cp1.id, date: dateOnly(daysAgo(i)) } },
      update: {},
      create: {
        creatorProfileId: cp1.id,
        date: dateOnly(daysAgo(i)),
        totalFollowers,
        totalEngagement: Math.floor(totalFollowers * 0.038) + Math.floor(Math.random() * 500),
        growthRate: (dailyGain / totalFollowers) * 100,
      },
    });
  }
  console.log('Analytics snapshots seeded ✓');

  // ── Content Ideas & Tags ──────────────────────────────────
  const tag1 = await prisma.contentTag.upsert({
    where: { creatorProfileId_name: { creatorProfileId: cp1.id, name: 'fitness' } },
    update: {}, create: { creatorProfileId: cp1.id, name: 'fitness', color: '#ef4444' },
  });
  const tag2 = await prisma.contentTag.upsert({
    where: { creatorProfileId_name: { creatorProfileId: cp1.id, name: 'wellness' } },
    update: {}, create: { creatorProfileId: cp1.id, name: 'wellness', color: '#22c55e' },
  });
  const tag3 = await prisma.contentTag.upsert({
    where: { creatorProfileId_name: { creatorProfileId: cp1.id, name: 'nutrition' } },
    update: {}, create: { creatorProfileId: cp1.id, name: 'nutrition', color: '#f59e0b' },
  });

  const idea1 = await prisma.contentIdea.create({
    data: { creatorProfileId: cp1.id, title: '30-day plank challenge series', body: 'A progressive plank challenge starting from 20s and building up to 5 mins.', status: IdeaStatus.READY, source: 'manual' },
  });
  const idea2 = await prisma.contentIdea.create({
    data: { creatorProfileId: cp1.id, title: 'Smoothie bowl recipe compilation', body: 'Top 10 smoothie bowl ideas with macros breakdown.', status: IdeaStatus.DEVELOPING, source: 'ai' },
  });
  await prisma.contentIdea.create({
    data: { creatorProfileId: cp1.id, title: 'Yoga for desk workers', status: IdeaStatus.SPARK, source: 'trend' },
  });
  await prisma.contentIdea.create({
    data: { creatorProfileId: cp1.id, title: 'Old protein bar comparison (outdated)', status: IdeaStatus.ARCHIVED, source: 'manual' },
  });

  await prisma.contentIdeaTag.createMany({
    data: [
      { ideaId: idea1.id, tagId: tag1.id },
      { ideaId: idea1.id, tagId: tag2.id },
      { ideaId: idea2.id, tagId: tag3.id },
      { ideaId: idea2.id, tagId: tag2.id },
    ],
    skipDuplicates: true,
  });
  console.log('Content ideas & tags seeded ✓');

  // ── Content Templates ─────────────────────────────────────
  await prisma.contentTemplate.createMany({
    data: [
      { name: 'Quick Tip', body: '💡 Did you know? {tip}\n\n#quicktip #{niche}', category: 'tip', isGlobal: true },
      { name: 'How-To Guide', body: 'How to {topic} in {number} easy steps:\n\n1. {step1}\n2. {step2}\n3. {step3}\n\nSave this for later! 🔖', category: 'how-to', isGlobal: true },
      { name: 'Behind the Scenes', body: '📸 BTS of today\'s shoot!\n\n{description}\n\nWhat do you want to see next?', category: 'behind-the-scenes', isGlobal: true },
      { name: 'Product Review', body: 'Honest review of {product} 👇\n\nPros: {pros}\nCons: {cons}\n\nOverall: {rating}/10', category: 'promotion', isGlobal: true },
      { name: 'My Workout Template', body: 'Today\'s workout:\n🔥 {exercise1} x{reps}\n🔥 {exercise2} x{reps}\n🔥 {exercise3} x{reps}\n\nNo equipment needed!', category: 'tip', isGlobal: false, userId: creator1.id },
    ],
  });
  console.log('Content templates seeded ✓');

  // ── Posting Schedules for Jane ────────────────────────────
  const schedSlots = [
    { platform: Platform.INSTAGRAM, dayOfWeek: 1, timeSlot: '09:00' },
    { platform: Platform.INSTAGRAM, dayOfWeek: 3, timeSlot: '12:00' },
    { platform: Platform.INSTAGRAM, dayOfWeek: 5, timeSlot: '18:00' },
    { platform: Platform.TIKTOK, dayOfWeek: 2, timeSlot: '17:00' },
    { platform: Platform.TIKTOK, dayOfWeek: 4, timeSlot: '19:00' },
    { platform: Platform.YOUTUBE, dayOfWeek: 6, timeSlot: '10:00' },
  ];
  for (const s of schedSlots) {
    await prisma.postingSchedule.upsert({
      where: { creatorProfileId_platform_dayOfWeek_timeSlot: { creatorProfileId: cp1.id, ...s } },
      update: {},
      create: { creatorProfileId: cp1.id, ...s },
    });
  }
  console.log('Posting schedules seeded ✓');

  // ── Audience Insights for Jane (7 days) ───────────────────
  for (let i = 7; i >= 1; i--) {
    for (const plat of [Platform.INSTAGRAM, Platform.TIKTOK]) {
      const d = dateOnly(daysAgo(i));
      await prisma.audienceInsight.upsert({
        where: { creatorProfileId_platform_date: { creatorProfileId: cp1.id, platform: plat, date: d } },
        update: {},
        create: {
          creatorProfileId: cp1.id, platform: plat, date: d,
          demographics: { ageRanges: { '18-24': 35, '25-34': 40, '35-44': 15, '45+': 10 }, genders: { M: 45, F: 52, NB: 3 } },
          activeHours: Object.fromEntries(Array.from({ length: 24 }, (_, h) => [String(h), Math.floor(Math.random() * 500) + 50])),
          topCountries: { US: 42, UK: 12, CA: 8, AU: 6, DE: 4 },
          topCities: { 'Los Angeles': 12, 'New York': 9, 'London': 7, 'Toronto': 4 },
          interests: ['fitness', 'wellness', 'nutrition', 'yoga'],
        },
      });
    }
  }
  console.log('Audience insights seeded ✓');

  // ── Analytics Reports ─────────────────────────────────────
  await prisma.analyticsReport.createMany({
    data: [
      {
        userId: creator1.id, creatorProfileId: cp1.id,
        title: 'Weekly Performance Report', description: 'Auto-generated weekly performance summary.',
        dateRangeStart: daysAgo(7), dateRangeEnd: new Date(),
        metrics: ['impressions', 'reach', 'engagement', 'followerGrowth'],
        platforms: [Platform.INSTAGRAM, Platform.TIKTOK],
        format: ReportFormat.PDF, status: ReportStatus.READY,
        generatedData: { totalImpressions: 165000, totalReach: 127000, avgEngagement: 4.12 },
        lastGeneratedAt: daysAgo(1),
      },
      {
        userId: creator1.id, creatorProfileId: cp1.id,
        title: 'Monthly Deep Dive', description: 'Detailed monthly analytics report.',
        dateRangeStart: daysAgo(30), dateRangeEnd: new Date(),
        metrics: ['impressions', 'reach', 'engagement', 'followerGrowth', 'saves'],
        platforms: [], format: ReportFormat.JSON, status: ReportStatus.DRAFT,
      },
    ],
  });
  console.log('Analytics reports seeded ✓');

  // ── Campaigns ─────────────────────────────────────────────
  const campaign1 = await prisma.campaign.create({
    data: {
      brandProfileId: bp1.id,
      title: 'Summer Fitness Challenge 2026',
      description: 'Looking for fitness creators to promote our new summer activewear collection with workout videos and lifestyle content.',
      budget: 5000, targetNiche: ['fitness', 'wellness'], targetPlatforms: [Platform.INSTAGRAM, Platform.TIKTOK],
      status: CampaignStatus.ACTIVE, startDate: daysAgo(10), endDate: futureDate(50),
      criteria: { create: { nicheWeight: 0.3, engagementWeight: 0.25, followerWeight: 0.15, locationWeight: 0.1, budgetWeight: 0.1, languageWeight: 0.1 } },
    },
  });

  await prisma.campaign.create({
    data: {
      brandProfileId: bp1.id,
      title: 'Protein Launch Campaign',
      description: 'New plant-based protein powder launch — need authentic reviews from health & fitness creators.',
      budget: 3000, targetNiche: ['fitness', 'food', 'wellness'], targetPlatforms: [Platform.YOUTUBE, Platform.INSTAGRAM],
      status: CampaignStatus.DRAFT, startDate: futureDate(14), endDate: futureDate(60),
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      brandProfileId: bp2.id,
      title: 'Nova Headphones Tech Review',
      description: 'Seeking tech reviewers for our new noise-cancelling headphones. Honest reviews encouraged!',
      budget: 8000, targetNiche: ['tech', 'gaming'], targetPlatforms: [Platform.YOUTUBE, Platform.TIKTOK],
      status: CampaignStatus.ACTIVE, startDate: daysAgo(5), endDate: futureDate(30),
      criteria: { create: { nicheWeight: 0.35, engagementWeight: 0.25, followerWeight: 0.2, locationWeight: 0.05, budgetWeight: 0.05, languageWeight: 0.1 } },
    },
  });

  const campaign4 = await prisma.campaign.create({
    data: {
      brandProfileId: bp2.id,
      title: 'Back-to-School Tech Essentials',
      description: 'College tech essentials campaign targeting student audiences.',
      budget: 12000, targetNiche: ['tech', 'education'], targetPlatforms: [Platform.TIKTOK, Platform.INSTAGRAM],
      status: CampaignStatus.ACTIVE, startDate: daysAgo(2), endDate: futureDate(45),
    },
  });
  console.log('Campaigns seeded ✓');

  // ── Campaign Matches ──────────────────────────────────────
  await Promise.all([
    prisma.campaignMatch.create({
      data: { campaignId: campaign1.id, creatorProfileId: cp1.id, matchScore: 92, scoreBreakdown: { niche: 0.95, engagement: 0.88, followers: 0.85, location: 0.9, language: 0.95 }, status: MatchStatus.ACCEPTED },
    }),
    prisma.campaignMatch.create({
      data: { campaignId: campaign1.id, creatorProfileId: cp3.id, matchScore: 68, scoreBreakdown: { niche: 0.5, engagement: 0.92, followers: 0.88, location: 0.7, language: 0.85 }, status: MatchStatus.PENDING },
    }),
    prisma.campaignMatch.create({
      data: { campaignId: campaign3.id, creatorProfileId: cp2.id, matchScore: 95, scoreBreakdown: { niche: 0.98, engagement: 0.9, followers: 0.92, location: 0.95, language: 1.0 }, status: MatchStatus.ACCEPTED },
    }),
    prisma.campaignMatch.create({
      data: { campaignId: campaign4.id, creatorProfileId: cp2.id, matchScore: 88, scoreBreakdown: { niche: 0.9, engagement: 0.85, followers: 0.92, location: 0.85, language: 1.0 }, status: MatchStatus.PENDING },
    }),
    prisma.campaignMatch.create({
      data: { campaignId: campaign3.id, creatorProfileId: cp1.id, matchScore: 45, scoreBreakdown: { niche: 0.2, engagement: 0.88, followers: 0.4, location: 0.9, language: 0.95 }, status: MatchStatus.REJECTED },
    }),
  ]);
  console.log('Campaign matches seeded ✓');

  // ── Campaign Deliverables ─────────────────────────────────
  await prisma.campaignDeliverable.createMany({
    data: [
      {
        campaignId: campaign1.id, creatorProfileId: cp1.id,
        type: DeliverableType.REEL, title: 'Summer workout reel', description: 'Quick activewear showcase workout reel for Instagram.',
        platform: Platform.INSTAGRAM, status: DeliverableStatus.APPROVED,
        dueDate: futureDate(10), submittedAt: daysAgo(2), approvedAt: daysAgo(1), payment: 800,
      },
      {
        campaignId: campaign1.id, creatorProfileId: cp3.id,
        type: DeliverableType.POST, title: 'Lifestyle activewear post', description: 'Lifestyle photo with activewear and wellness caption.',
        platform: Platform.INSTAGRAM, status: DeliverableStatus.PENDING,
        dueDate: futureDate(20), payment: 500,
      },
      {
        campaignId: campaign3.id, creatorProfileId: cp2.id,
        type: DeliverableType.VIDEO, title: 'Nova Headphones full review', description: 'In-depth review video with sound test comparison.',
        platform: Platform.YOUTUBE, status: DeliverableStatus.IN_PROGRESS,
        dueDate: futureDate(15), payment: 1500,
      },
      {
        campaignId: campaign3.id, creatorProfileId: cp2.id,
        type: DeliverableType.REEL, title: 'Quick ANC demo short', description: '60-second noise cancelling demo for TikTok.',
        platform: Platform.TIKTOK, status: DeliverableStatus.SUBMITTED,
        dueDate: futureDate(12), submittedAt: daysAgo(1), payment: 600,
      },
    ],
  });
  console.log('Campaign deliverables seeded ✓');

  // ── Campaign Reports ──────────────────────────────────────
  await prisma.campaignReport.createMany({
    data: [
      {
        campaignId: campaign1.id, title: 'Mid-campaign performance',
        metrics: { impressions: 320000, reach: 240000, engagement: 18500, clicks: 4200, conversions: 120 },
        roi: 3.2, summary: 'Campaign is tracking above target KPIs. Jane\'s content driving 68% of all engagement.',
      },
      {
        campaignId: campaign3.id, title: 'Week 1 results',
        metrics: { impressions: 295000, reach: 232000, engagement: 27400, clicks: 1300, conversions: 85 },
        roi: 2.8, summary: 'Strong initial performance from Alex\'s tech review content. TikTok outperforming YouTube on reach.',
      },
    ],
  });
  console.log('Campaign reports seeded ✓');

  // ── Community Interactions for Jane ───────────────────────
  const interactions = [
    { platform: Platform.INSTAGRAM, interactionType: InteractionType.COMMENT, authorName: 'FitFanatic22', content: 'This morning routine changed my life! How long did it take for you to see results?', sentiment: Sentiment.POSITIVE, aiSuggestion: 'Thank you so much! 🙏 I started seeing changes within about 2 weeks of consistent practice. The key is to stick with it daily — even 5 minutes makes a difference!' },
    { platform: Platform.INSTAGRAM, interactionType: InteractionType.COMMENT, authorName: 'SkepticalSteve', content: 'These "quick workouts" never actually work...', sentiment: Sentiment.NEGATIVE, aiSuggestion: 'I understand the skepticism! Consistency is really key — even small movements add up. I\'d love to share some studies that show the benefits of short daily exercise routines if you\'re interested!' },
    { platform: Platform.TIKTOK, interactionType: InteractionType.COMMENT, authorName: 'MealPrepQueen', content: 'Can you share the recipe for that green smoothie bowl? It looked amazing!', sentiment: Sentiment.QUESTION },
    { platform: Platform.INSTAGRAM, interactionType: InteractionType.DM, authorName: 'NutritionBrand_DM', content: 'Hi Jane! We love your content. Would you be interested in a collaboration for our new organic protein line?', sentiment: Sentiment.POSITIVE },
    { platform: Platform.TIKTOK, interactionType: InteractionType.COMMENT, authorName: 'WorkoutBuddy', content: 'Just did this workout — my legs are jelly! 😂 Asking for a rest day version next!', sentiment: Sentiment.POSITIVE, respondedAt: daysAgo(1) },
    { platform: Platform.YOUTUBE, interactionType: InteractionType.COMMENT, authorName: 'HomeGymHero', content: 'Great video! What resistance bands do you recommend for beginners?', sentiment: Sentiment.QUESTION, aiSuggestion: 'Great question! For beginners, I recommend starting with a light-medium set. I use the ones from FitGear — they have a starter pack that\'s perfect. Link in my bio!' },
    { platform: Platform.INSTAGRAM, interactionType: InteractionType.MENTION, authorName: 'YogaWithSarah', content: '@janecreates would be perfect for this challenge! Tag someone who inspires you 💪', sentiment: Sentiment.POSITIVE, respondedAt: daysAgo(2) },
    { platform: Platform.TIKTOK, interactionType: InteractionType.COMMENT, authorName: 'Anonymous123', content: 'The meal prep video had wrong calorie counts. You should fact check before posting.', sentiment: Sentiment.NEGATIVE },
    { platform: Platform.INSTAGRAM, interactionType: InteractionType.DM, authorName: 'FitNewbie', content: 'Hi! I\'m just starting my fitness journey. Do you offer any coaching or meal plans?', sentiment: Sentiment.QUESTION, aiSuggestion: 'Welcome to the fitness journey! 🎉 I don\'t do 1-on-1 coaching right now, but I have a free 7-day starter guide on my website. Check the link in my bio — and feel free to DM me anytime with questions!' },
    { platform: Platform.YOUTUBE, interactionType: InteractionType.COMMENT, authorName: 'GymBro99', content: 'This is the best no-equipment series on YouTube. Period.', sentiment: Sentiment.POSITIVE, respondedAt: daysAgo(3) },
  ];

  for (const ix of interactions) {
    await prisma.communityInteraction.create({
      data: {
        creatorProfileId: cp1.id,
        platform: ix.platform,
        interactionType: ix.interactionType,
        authorName: ix.authorName,
        content: ix.content,
        sentiment: ix.sentiment,
        aiSuggestion: ix.aiSuggestion ?? null,
        respondedAt: ix.respondedAt ?? null,
        createdAt: daysAgo(Math.floor(Math.random() * 7)),
      },
    });
  }
  console.log('Community interactions seeded ✓');

  // ── Saved Replies ─────────────────────────────────────────
  await prisma.savedReply.createMany({
    data: [
      { userId: creator1.id, title: 'Thank you', body: 'Thank you so much for the kind words! 🙏 Means a lot!', tags: ['positive', 'general'], usageCount: 12 },
      { userId: creator1.id, title: 'Collab inquiry', body: 'Thanks for reaching out! I\'d love to chat about a collaboration. Please email me at jane@example.com with details.', tags: ['business', 'collab'], usageCount: 5 },
      { userId: creator1.id, title: 'FAQ - Coaching', body: 'I don\'t offer 1-on-1 coaching at the moment, but check out my free guides at the link in my bio!', tags: ['faq', 'coaching'], usageCount: 8 },
      { userId: creator1.id, title: 'Negative feedback', body: 'I appreciate the feedback! I\'ll keep that in mind for future content. Always looking to improve.', tags: ['negative', 'professional'], usageCount: 3 },
    ],
  });
  console.log('Saved replies seeded ✓');

  // ── Comment Scores ────────────────────────────────────────
  await prisma.commentScore.upsert({
    where: { creatorProfileId_period: { creatorProfileId: cp1.id, period: '2026-03' } },
    update: {},
    create: { creatorProfileId: cp1.id, responseRate: 0.72, avgResponseTime: 45, consistency: 0.85, period: '2026-03' },
  });
  await prisma.commentScore.upsert({
    where: { creatorProfileId_period: { creatorProfileId: cp1.id, period: '2026-02' } },
    update: {},
    create: { creatorProfileId: cp1.id, responseRate: 0.68, avgResponseTime: 52, consistency: 0.8, period: '2026-02' },
  });
  console.log('Comment scores seeded ✓');

  // ── Voice Profile ─────────────────────────────────────────
  await prisma.userVoiceProfile.upsert({
    where: { userId: creator1.id },
    update: {},
    create: {
      userId: creator1.id,
      tonePreferences: ['friendly', 'motivational', 'casual'],
      exampleReplies: [
        'Love that you tried it! Keep showing up, even on tough days 💪',
        'Great question! Here\'s what I do...',
        'So appreciate the support — you guys make this worth it! 🙏',
      ],
      vocabulary: ['crushing it', 'let\'s go', 'you got this', 'stay consistent'],
    },
  });
  console.log('Voice profile seeded ✓');

  // ── Social Listening ──────────────────────────────────────
  const query1 = await prisma.listeningQuery.create({
    data: {
      userId: creator1.id, name: 'Brand mentions',
      keywords: ['@janecreates', 'jane creator', 'janecreator'],
      platforms: [Platform.INSTAGRAM, Platform.TIKTOK, Platform.YOUTUBE],
      isActive: true,
    },
  });
  const query2 = await prisma.listeningQuery.create({
    data: {
      userId: creator1.id, name: 'Fitness trends',
      keywords: ['home workout', 'no equipment workout', 'fitness challenge 2026'],
      platforms: [Platform.TIKTOK, Platform.INSTAGRAM],
      isActive: true,
    },
  });

  const mentionData = [
    { queryId: query1.id, platform: Platform.INSTAGRAM, source: '@fitlife_mag', content: 'Top 10 fitness creators to follow in 2026 — @janecreates at #3!', sentiment: MentionSentiment.POSITIVE, reach: 85000 },
    { queryId: query1.id, platform: Platform.TIKTOK, source: '@duet_user42', content: 'Dueting @jane.creator morning stretch — this actually works!', sentiment: MentionSentiment.POSITIVE, reach: 12000 },
    { queryId: query1.id, platform: Platform.YOUTUBE, source: 'FitReviewChannel', content: 'Jane Creator\'s workout series review — honest thoughts', sentiment: MentionSentiment.NEUTRAL, reach: 34000 },
    { queryId: query1.id, platform: Platform.INSTAGRAM, source: '@hater_account', content: 'Overrated content tbh, same stuff recycled', sentiment: MentionSentiment.NEGATIVE, reach: 500 },
    { queryId: query2.id, platform: Platform.TIKTOK, source: '@trendsetter', content: 'Home workout search up 340% this month — 2026 is the year of bodyweight fitness', sentiment: MentionSentiment.POSITIVE, reach: 200000 },
    { queryId: query2.id, platform: Platform.INSTAGRAM, source: '@wellness_daily', content: 'No equipment workouts are dominating Reels algorithm right now', sentiment: MentionSentiment.NEUTRAL, reach: 150000 },
  ];
  for (const m of mentionData) {
    await prisma.mention.create({
      data: { ...m, detectedAt: daysAgo(Math.floor(Math.random() * 7)), createdAt: daysAgo(Math.floor(Math.random() * 7)) },
    });
  }

  for (let i = 7; i >= 1; i--) {
    for (const q of [query1, query2]) {
      const d = dateOnly(daysAgo(i));
      await prisma.sentimentSnapshot.upsert({
        where: { queryId_date: { queryId: q.id, date: d } },
        update: {},
        create: {
          queryId: q.id, date: d,
          positiveCount: Math.floor(Math.random() * 20) + 5,
          negativeCount: Math.floor(Math.random() * 5),
          neutralCount: Math.floor(Math.random() * 15) + 3,
          mixedCount: Math.floor(Math.random() * 3),
          totalVolume: Math.floor(Math.random() * 40) + 10,
        },
      });
    }
  }
  console.log('Social listening seeded ✓');

  // ── Competitive Intelligence ──────────────────────────────
  const comp1 = await prisma.competitor.create({
    data: {
      userId: creator1.id, name: 'FitQueen Sarah',
      handles: { INSTAGRAM: '@fitqueensarah', TIKTOK: '@fitqueen.sarah' },
      platforms: [Platform.INSTAGRAM, Platform.TIKTOK],
      notes: 'Main competitor in fitness niche, similar audience demographics.',
    },
  });
  const comp2 = await prisma.competitor.create({
    data: {
      userId: creator1.id, name: 'WellnessWithMax',
      handles: { INSTAGRAM: '@wellnesswithmax', YOUTUBE: 'WellnessWithMax' },
      platforms: [Platform.INSTAGRAM, Platform.YOUTUBE],
      notes: 'Cross-over wellness and nutrition creator.',
    },
  });

  for (let i = 7; i >= 1; i--) {
    const d = dateOnly(daysAgo(i));
    await prisma.competitorSnapshot.upsert({
      where: { competitorId_date_platform: { competitorId: comp1.id, date: d, platform: Platform.INSTAGRAM } },
      update: {},
      create: {
        competitorId: comp1.id, date: d, platform: Platform.INSTAGRAM,
        followers: 140000 + i * 200, engagementRate: 3.5 + Math.random() * 0.5,
        postFrequency: 4.5, topContentTypes: ['REEL', 'CAROUSEL'], topHashtags: ['fitness', 'workout', 'motivation'],
        avgLikes: 5000 + Math.floor(Math.random() * 500), avgComments: 300 + Math.floor(Math.random() * 50),
      },
    });
    await prisma.competitorSnapshot.upsert({
      where: { competitorId_date_platform: { competitorId: comp2.id, date: d, platform: Platform.INSTAGRAM } },
      update: {},
      create: {
        competitorId: comp2.id, date: d, platform: Platform.INSTAGRAM,
        followers: 95000 + i * 150, engagementRate: 2.8 + Math.random() * 0.4,
        postFrequency: 3.0, topContentTypes: ['IMAGE', 'CAROUSEL'], topHashtags: ['wellness', 'nutrition', 'mindfulness'],
        avgLikes: 2800 + Math.floor(Math.random() * 300), avgComments: 180 + Math.floor(Math.random() * 30),
      },
    });
  }
  console.log('Competitive intelligence seeded ✓');

  // ── Teams & Collaboration ─────────────────────────────────
  await prisma.team.create({
    data: {
      name: 'Jane\'s Content Team', ownerId: creator1.id,
      members: {
        create: [
          { userId: creator1.id, role: TeamRole.OWNER },
          { userId: creator2.id, role: TeamRole.EDITOR },
          { userId: testUser.id, role: TeamRole.CONTRIBUTOR },
        ],
      },
      workflows: {
        create: {
          name: 'Standard Review',
          stages: [
            { name: 'Editor Review', approverRoles: ['EDITOR'] },
            { name: 'Owner Sign-off', approverRoles: ['OWNER', 'ADMIN'] },
          ],
          isDefault: true, isActive: true,
        },
      },
    },
  });

  // Post comments on Jane's first published post
  await prisma.postComment.createMany({
    data: [
      { postId: posts[0].id, userId: creator2.id, body: 'Great reel! The transitions are smooth. Ready to publish.', isApproval: true, approvalAction: 'approve' },
      { postId: posts[0].id, userId: creator1.id, body: 'Thanks Alex! Scheduling it for Monday morning.' },
      { postId: posts[6].id, userId: creator2.id, body: 'Protein powder section needs more detail on ingredients. Can you add comparison table?', isApproval: true, approvalAction: 'request_changes' },
    ],
  });
  console.log('Teams & collaboration seeded ✓');

  // ── Revenue OS ────────────────────────────────────────────
  await prisma.revenueStream.createMany({
    data: [
      { creatorProfileId: cp1.id, type: RevenueType.SPONSORSHIP,     source: 'FitGear Co',        amount: 75000, currency: 'INR', period: '2026-06', receivedAt: daysAgo(10) },
      { creatorProfileId: cp1.id, type: RevenueType.YOUTUBE_ADSENSE, source: 'YouTube AdSense',   amount: 18500, currency: 'INR', period: '2026-06', receivedAt: daysAgo(5) },
      { creatorProfileId: cp1.id, type: RevenueType.AFFILIATE,       source: 'Amazon Associates',  amount: 9200,  currency: 'INR', period: '2026-06', receivedAt: daysAgo(2) },
      { creatorProfileId: cp1.id, type: RevenueType.SPONSORSHIP,     source: 'Nova Electronics',   amount: 120000, currency: 'INR', period: '2026-05', receivedAt: daysAgo(35) },
      { creatorProfileId: cp1.id, type: RevenueType.YOUTUBE_ADSENSE, source: 'YouTube AdSense',   amount: 16200, currency: 'INR', period: '2026-05', receivedAt: daysAgo(30) },
    ],
  });

  const deal1 = await prisma.brandDeal.create({
    data: {
      creatorProfileId: cp1.id, brandName: 'FitGear Co', contactEmail: 'partnerships@fitgear.example.com',
      dealValue: 75000, currency: 'INR', deliverables: ['1 Reel', '2 Stories', '1 Blog Post'],
      status: DealStatus.PAID, startDate: daysAgo(30), endDate: daysAgo(5),
    },
  });
  const deal2 = await prisma.brandDeal.create({
    data: {
      creatorProfileId: cp1.id, brandName: 'VitaBlend Nutrition', contactEmail: 'collab@vitablend.example.com',
      dealValue: 50000, currency: 'INR', deliverables: ['1 YouTube Video', '3 Stories'],
      status: DealStatus.IN_PROGRESS, startDate: daysAgo(7), endDate: futureDate(14),
    },
  });
  await prisma.brandDeal.create({
    data: {
      creatorProfileId: cp1.id, brandName: 'ZenMat Yoga', contactEmail: 'hello@zenmat.example.com',
      dealValue: 30000, currency: 'INR', deliverables: ['1 Reel', '1 Story'],
      status: DealStatus.NEGOTIATING,
    },
  });

  await prisma.invoice.createMany({
    data: [
      { creatorProfileId: cp1.id, brandDealId: deal1.id, invoiceNumber: 'INV-2026-001', amount: 75000, currency: 'INR', status: InvoiceStatus.PAID, issuedAt: daysAgo(20), dueDate: daysAgo(5), paidAt: daysAgo(3) },
      { creatorProfileId: cp1.id, brandDealId: deal2.id, invoiceNumber: 'INV-2026-002', amount: 25000, currency: 'INR', status: InvoiceStatus.SENT, issuedAt: daysAgo(2), dueDate: futureDate(28), notes: '50% advance for VitaBlend deal' },
      { creatorProfileId: cp1.id, invoiceNumber: 'INV-2026-003', amount: 25000, currency: 'INR', status: InvoiceStatus.DRAFT, notes: 'Remaining 50% for VitaBlend — send on delivery' },
    ],
  });
  console.log('Revenue OS seeded ✓');

  // ── Inbox Channels ────────────────────────────────────────
  await prisma.inboxChannel.createMany({
    data: [
      { creatorProfileId: cp1.id, type: InboxChannelType.INSTAGRAM_DM, label: 'Instagram DMs',     status: ChannelStatus.CONNECTED, lastSyncAt: daysAgo(0) },
      { creatorProfileId: cp1.id, type: InboxChannelType.EMAIL,        label: 'jane@crms.local',   status: ChannelStatus.CONNECTED, lastSyncAt: daysAgo(0) },
      { creatorProfileId: cp1.id, type: InboxChannelType.WHATSAPP,     label: 'WhatsApp Business', status: ChannelStatus.DISCONNECTED },
      { creatorProfileId: cp2.id, type: InboxChannelType.INSTAGRAM_DM, label: 'Instagram DMs',     status: ChannelStatus.CONNECTED, lastSyncAt: daysAgo(1) },
      { creatorProfileId: cp2.id, type: InboxChannelType.EMAIL,        label: 'alex@crms.local',   status: ChannelStatus.CONNECTED, lastSyncAt: daysAgo(0) },
    ],
  });
  console.log('Inbox channels seeded ✓');

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
      create: { userId: u.id, dailyTokenLimit: t.limit, tokensUsedToday: 0 },
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

  // ── Content Posts for Alex ────────────────────────────────
  await Promise.all([
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp2.id, platform: Platform.YOUTUBE, postType: PostType.VIDEO,
        caption: 'Nova Headphones Review — Best ANC Under $200?', hashtags: ['techreview', 'headphones', 'audiophile'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(4), publishedAt: daysAgo(4),
        analytics: { create: { impressions: 85000, reach: 67000, likes: 6200, comments: 890, shares: 320, saves: 1500, clicks: 700 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp2.id, platform: Platform.TIKTOK, postType: PostType.SHORT,
        caption: 'Budget PC build that runs everything in 2026 🖥️', hashtags: ['pcbuild', 'gaming', 'budget'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(2), publishedAt: daysAgo(2),
        analytics: { create: { impressions: 210000, reach: 165000, likes: 19500, comments: 1200, shares: 890, saves: 4500, clicks: 600 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp2.id, platform: Platform.YOUTUBE, postType: PostType.VIDEO,
        caption: 'Top 10 Gadgets You NEED for College 2026', hashtags: ['backtoschool', 'techessentials', 'college'],
        status: PostStatus.SCHEDULED, scheduledAt: futureDate(3),
      },
    }),
  ]);

  // ── Content Posts for Mia ─────────────────────────────────
  await Promise.all([
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp3.id, platform: Platform.TIKTOK, postType: PostType.SHORT,
        caption: 'Get ready with me — everyday glam in 10 mins ✨', hashtags: ['grwm', 'beauty', 'makeup'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(6), publishedAt: daysAgo(6),
        analytics: { create: { impressions: 350000, reach: 280000, likes: 28000, comments: 1800, shares: 1200, saves: 8500, clicks: 900 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp3.id, platform: Platform.INSTAGRAM, postType: PostType.CAROUSEL,
        caption: 'Summer skincare routine — dermatologist approved 🌞', hashtags: ['skincare', 'summer', 'beauty'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(3), publishedAt: daysAgo(3),
        analytics: { create: { impressions: 42000, reach: 35000, likes: 3800, comments: 290, shares: 150, saves: 2100, clicks: 280 } },
      },
    }),
  ]);
  console.log('All content posts seeded ✓');

  console.log(`
╔═══════════════════════════════════════════════════════╗
║                  Seed Complete! 🎉                    ║
╠═══════════════════════════════════════════════════════╣
║  Login credentials (all use password: password123)    ║
║                                                       ║
║  Creator:  jane@crms.local                            ║
║  Creator:  alex@crms.local                            ║
║  Creator:  mia@crms.local                             ║
║  Creator:  test@crms.local   ← dummy test account     ║
║  Brand:    brand@crms.local                           ║
║  Brand:    techbrand@crms.local                       ║
║  Agency:   agency@crms.local                          ║
║  Admin:    admin@crms.local                           ║
╚═══════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
