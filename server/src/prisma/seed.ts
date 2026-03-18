import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crms.local' },
    update: {},
    create: {
      email: 'admin@crms.local',
      name: 'CrMS Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('Admin user:', admin.email);

  // Create sample creator
  const creatorPassword = await bcrypt.hash('creator123456', 12);
  const creator = await prisma.user.upsert({
    where: { email: 'creator@crms.local' },
    update: {},
    create: {
      email: 'creator@crms.local',
      name: 'Jane Creator',
      passwordHash: creatorPassword,
      role: Role.CREATOR,
      creatorProfile: {
        create: {
          bio: 'Fitness & lifestyle content creator',
          niche: ['fitness', 'lifestyle', 'wellness'],
          location: 'Los Angeles, CA',
          languages: ['en'],
          platformStats: {
            create: [
              {
                platform: 'INSTAGRAM',
                handle: '@janecreator',
                followers: 125000,
                avgLikes: 4500,
                avgComments: 320,
                avgViews: 18000,
                engagementRate: 3.86,
              },
              {
                platform: 'YOUTUBE',
                handle: 'JaneCreatorFit',
                followers: 45000,
                avgLikes: 1200,
                avgComments: 85,
                avgViews: 22000,
                engagementRate: 2.85,
              },
            ],
          },
        },
      },
    },
  });
  console.log('Creator user:', creator.email);

  // Create sample brand
  const brandPassword = await bcrypt.hash('brand123456', 12);
  const brand = await prisma.user.upsert({
    where: { email: 'brand@crms.local' },
    update: {},
    create: {
      email: 'brand@crms.local',
      name: 'FitGear Co',
      passwordHash: brandPassword,
      role: Role.BRAND,
      brandProfile: {
        create: {
          companyName: 'FitGear Co',
          industry: 'Health & Fitness',
          website: 'https://fitgear.example.com',
          targetAudience: { ageRange: '18-35', interests: ['fitness', 'nutrition'], locations: ['US'] },
          budgetRangeLow: 500,
          budgetRangeHigh: 10000,
        },
      },
    },
  });
  console.log('Brand user:', brand.email);

  // Create a sample campaign
  const brandProfile = await prisma.brandProfile.findUnique({ where: { userId: brand.id } });
  if (brandProfile) {
    const campaign = await prisma.campaign.create({
      data: {
        brandProfileId: brandProfile.id,
        title: 'Summer Fitness Challenge 2026',
        description: 'Looking for fitness creators to promote our new summer collection',
        budget: 5000,
        targetNiche: ['fitness', 'wellness'],
        targetPlatforms: ['INSTAGRAM', 'TIKTOK'],
        status: 'ACTIVE',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-31'),
        criteria: {
          create: {
            nicheWeight: 0.3,
            engagementWeight: 0.25,
            followerWeight: 0.15,
            locationWeight: 0.1,
            budgetWeight: 0.1,
            languageWeight: 0.1,
          },
        },
      },
    });
    console.log('Campaign:', campaign.title);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
