import { PrismaClient, Role, Platform, PostStatus, PostType, InteractionType, Sentiment, CampaignStatus, MatchStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function futureDate(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function main() {
  const pw = await bcrypt.hash('password123', 12);

  // ── Users ─────────────────────────────────────────────────
  await prisma.user.upsert({
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
  const bp1 = await prisma.brandProfile.findUnique({ where: { userId: brand1.id } });
  const bp2 = await prisma.brandProfile.findUnique({ where: { userId: brand2.id } });

  if (!cp1 || !cp2 || !cp3 || !bp1 || !bp2) throw new Error('Profile creation failed');

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
      where: { creatorProfileId_date: { creatorProfileId: cp1.id, date: daysAgo(i) } },
      update: {},
      create: {
        creatorProfileId: cp1.id,
        date: daysAgo(i),
        totalFollowers,
        totalEngagement: Math.floor(totalFollowers * 0.038) + Math.floor(Math.random() * 500),
        growthRate: (dailyGain / totalFollowers) * 100,
      },
    });
  }
  console.log('Analytics snapshots seeded ✓');

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
║  Brand:    brand@crms.local                           ║
║  Brand:    techbrand@crms.local                       ║
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
