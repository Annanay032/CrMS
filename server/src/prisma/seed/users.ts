import { Role, Platform } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SeedContext } from './context.js';

export async function seedUsers(ctx: SeedContext) {
  const { prisma } = ctx;
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
          bio: 'Tech reviewer & gadget enthusiast. Covering the latest in consumer electronics, PC builds, and software.',
          niche: ['tech', 'gaming', 'software'],
          location: 'San Francisco, CA',
          languages: ['en'],
          platformStats: {
            create: [
              { platform: Platform.YOUTUBE, handle: 'AlexTechReviews', followers: 320000, avgLikes: 8500, avgComments: 620, avgViews: 45000, engagementRate: 2.89 },
              { platform: Platform.TIKTOK, handle: '@alex.tech', followers: 180000, avgLikes: 7200, avgComments: 380, avgViews: 65000, engagementRate: 4.21 },
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
          bio: 'Beauty & skincare creator. Cruelty-free product reviews, tutorials, and lifestyle content.',
          niche: ['beauty', 'skincare', 'lifestyle'],
          location: 'Miami, FL',
          languages: ['en', 'pt'],
          platformStats: {
            create: [
              { platform: Platform.INSTAGRAM, handle: '@mia.beauty', followers: 95000, avgLikes: 3200, avgComments: 210, avgViews: 14000, engagementRate: 3.58 },
              { platform: Platform.TIKTOK, handle: '@miabeautyofficial', followers: 410000, avgLikes: 18000, avgComments: 1100, avgViews: 120000, engagementRate: 4.66 },
            ],
          },
        },
      },
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'test@crms.local' },
    update: {},
    create: {
      email: 'test@crms.local', name: 'Test Creator', passwordHash: pw, role: Role.CREATOR,
      creatorProfile: {
        create: {
          bio: 'Test creator account for development and QA purposes.',
          niche: ['general'],
          location: 'Testville, TS',
          languages: ['en'],
        },
      },
    },
  });

  const agencyUser = await prisma.user.upsert({
    where: { email: 'agency@crms.local' },
    update: {},
    create: {
      email: 'agency@crms.local', name: 'Talent First Agency', passwordHash: pw, role: Role.AGENCY,
      agencyProfile: {
        create: {
          agencyName: 'Talent First', website: 'https://talentfirst.example.com',
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
          companyName: 'FitGear Co', website: 'https://fitgear.example.com',
          industry: 'Fitness & Activewear',
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
          companyName: 'Nova Electronics', website: 'https://nova-electronics.example.com',
          industry: 'Consumer Electronics',
        },
      },
    },
  });

  console.log('Users & profiles seeded ✓');

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

  // Populate shared context
  ctx.users = { admin, creator1, creator2, creator3, testUser, brand1, brand2, agencyUser };
  ctx.profiles = { cp1, cp2, cp3, cpTest, bp1, bp2, ap1 };
}
