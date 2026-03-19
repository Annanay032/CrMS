import { Platform, MentionSentiment } from '@prisma/client';
import { SeedContext, daysAgo, dateOnly } from './context.js';

export async function seedIntelligence(ctx: SeedContext) {
  const { prisma, users } = ctx;
  const { creator1 } = users;

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
}
