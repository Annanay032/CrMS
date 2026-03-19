import { PrismaClient } from '@prisma/client';
import { SeedContext } from './context.js';
import { seedUsers } from './users.js';
import { seedContent } from './content.js';
import { seedCampaigns } from './campaigns.js';
import { seedCommunity } from './community.js';
import { seedIntelligence } from './intelligence.js';
import { seedRevenue } from './revenue.js';
import { seedCollaboration } from './collaboration.js';
import { seedPlatform } from './platform.js';

const prisma = new PrismaClient();

async function cleanSlate() {
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
}

async function main() {
  await cleanSlate();

  // Shared context populated by seedUsers, consumed by all other seeders
  const ctx: SeedContext = {
    prisma,
    users: {} as SeedContext['users'],
    profiles: {} as SeedContext['profiles'],
  };

  await seedUsers(ctx);
  const { posts } = await seedContent(ctx);
  await seedCampaigns(ctx);
  await seedCommunity(ctx);
  await seedIntelligence(ctx);
  await seedRevenue(ctx);
  await seedCollaboration(ctx, posts);
  await seedPlatform(ctx);

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
