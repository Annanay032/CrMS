import { prisma } from '../config/index.js';

export async function getSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId } });
  }
  return settings;
}

export async function updateSettings(
  userId: string,
  data: {
    listeningFrequency?: number;
    competitiveFrequency?: number;
    emailDigest?: boolean;
    pushNotifications?: boolean;
    notifyNewFollower?: boolean;
    notifyMention?: boolean;
    notifyCampaignUpdate?: boolean;
    notifyCommentReply?: boolean;
    defaultPlatform?: string | null;
    defaultPostType?: string | null;
    defaultHashtags?: string[];
    autoSchedule?: boolean;
    timezone?: string;
    aiTone?: string;
    aiLanguage?: string;
    aiAutoSuggest?: boolean;
    profileVisibility?: string;
    showAnalytics?: boolean;
  },
) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}
