import {
  Platform, InteractionType, Sentiment, InboxChannelType, ChannelStatus,
} from '@prisma/client';
import { SeedContext, daysAgo } from './context.js';

export async function seedCommunity(ctx: SeedContext) {
  const { prisma, users, profiles } = ctx;
  const { creator1 } = users;
  const { cp1, cp2 } = profiles;

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
}
