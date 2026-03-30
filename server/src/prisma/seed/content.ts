import {
  Platform, PostStatus, PostType, IdeaStatus,
  ReportFormat, ReportStatus, PostActivityAction,
} from '@prisma/client';
import { SeedContext, daysAgo, futureDate, dateOnly } from './context.js';

export async function seedContent(ctx: SeedContext) {
  const { prisma, users, profiles } = ctx;
  const { creator1 } = users;
  const { cp1, cp2, cp3 } = profiles;

  // ── Content Posts for Jane ────────────────────────────────
  const posts = await Promise.all([
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.INSTAGRAM, postType: PostType.REEL,
        caption: '5-minute morning stretch routine to kickstart your day! 🧘‍♀️', hashtags: ['morningroutine', 'fitness', 'stretch', 'wellness'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(7), publishedAt: daysAgo(7),
        externalPostId: `ig_seed_${Date.now()}_1`,
        analytics: { create: { impressions: 45000, reach: 32000, likes: 4800, comments: 320, shares: 180, saves: 950, clicks: 120 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.TIKTOK, postType: PostType.SHORT,
        caption: 'Healthy meal prep for the week — under 30 mins! 🥗', hashtags: ['mealprep', 'healthyeating', 'fitnesslife'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(5), publishedAt: daysAgo(5),
        externalPostId: `tt_seed_${Date.now()}_2`,
        analytics: { create: { impressions: 120000, reach: 95000, likes: 12500, comments: 680, shares: 520, saves: 2200, clicks: 340 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp1.id, platform: Platform.YOUTUBE, postType: PostType.VIDEO,
        caption: 'Full Week of Workouts — No Equipment Needed! | Follow-along Series', hashtags: ['homeworkout', 'noequipment', 'fitness'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(3), publishedAt: daysAgo(3),
        externalPostId: `yt_seed_${Date.now()}_3`,
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

  // ── Activity Logs ─────────────────────────────────────────
  const activityData: { post: typeof posts[0]; actions: PostActivityAction[] }[] = [
    { post: posts[0], actions: [PostActivityAction.CREATED, PostActivityAction.SCHEDULED, PostActivityAction.PUBLISHED] },
    { post: posts[1], actions: [PostActivityAction.CREATED, PostActivityAction.EDITED, PostActivityAction.SCHEDULED, PostActivityAction.PUBLISHED] },
    { post: posts[2], actions: [PostActivityAction.CREATED, PostActivityAction.MEDIA_ADDED, PostActivityAction.CAPTION_EDITED, PostActivityAction.SCHEDULED, PostActivityAction.PUBLISHED] },
    { post: posts[3], actions: [PostActivityAction.CREATED, PostActivityAction.SCHEDULED] },
    { post: posts[4], actions: [PostActivityAction.CREATED, PostActivityAction.SCHEDULED] },
    { post: posts[5], actions: [PostActivityAction.CREATED] },
    { post: posts[6], actions: [PostActivityAction.CREATED, PostActivityAction.EDITED, PostActivityAction.STATUS_CHANGED] },
  ];

  for (const { post, actions } of activityData) {
    for (let i = 0; i < actions.length; i++) {
      await prisma.postActivityLog.create({
        data: {
          postId: post.id,
          userId: creator1.id,
          action: actions[i] as any,
          details: `${actions[i].replace(/_/g, ' ').toLowerCase()} by ${creator1.name}`,
          createdAt: new Date(post.createdAt.getTime() + i * 3600000), // 1hr apart
        },
      });
    }
  }
  console.log('Post activity logs seeded ✓');

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

  // ── Content Posts for Alex ────────────────────────────────
  await Promise.all([
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp2.id, platform: Platform.YOUTUBE, postType: PostType.VIDEO,
        caption: 'Nova Headphones Review — Best ANC Under $200?', hashtags: ['techreview', 'headphones', 'audiophile'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(4), publishedAt: daysAgo(4),
        externalPostId: `yt_seed_${Date.now()}_4`,
        analytics: { create: { impressions: 85000, reach: 67000, likes: 6200, comments: 890, shares: 320, saves: 1500, clicks: 700 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp2.id, platform: Platform.TIKTOK, postType: PostType.SHORT,
        caption: 'Budget PC build that runs everything in 2026 🖥️', hashtags: ['pcbuild', 'gaming', 'budget'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(2), publishedAt: daysAgo(2),
        externalPostId: `tt_seed_${Date.now()}_5`,
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
        externalPostId: `tt_seed_${Date.now()}_6`,
        analytics: { create: { impressions: 350000, reach: 280000, likes: 28000, comments: 1800, shares: 1200, saves: 8500, clicks: 900 } },
      },
    }),
    prisma.contentPost.create({
      data: {
        creatorProfileId: cp3.id, platform: Platform.INSTAGRAM, postType: PostType.CAROUSEL,
        caption: 'Summer skincare routine — dermatologist approved 🌞', hashtags: ['skincare', 'summer', 'beauty'],
        status: PostStatus.PUBLISHED, scheduledAt: daysAgo(3), publishedAt: daysAgo(3),
        externalPostId: `ig_seed_${Date.now()}_7`,
        analytics: { create: { impressions: 42000, reach: 35000, likes: 3800, comments: 290, shares: 150, saves: 2100, clicks: 280 } },
      },
    }),
  ]);
  console.log('All content posts seeded ✓');

  return { posts };
}
