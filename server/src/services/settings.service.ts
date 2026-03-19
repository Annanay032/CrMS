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
  data: { listeningFrequency?: number; competitiveFrequency?: number; emailDigest?: boolean },
) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}
