import {
  RevenueType, InvoiceStatus, DealStatus,
} from '@prisma/client';
import { SeedContext, daysAgo, futureDate } from './context.js';

export async function seedRevenue(ctx: SeedContext) {
  const { prisma, profiles } = ctx;
  const { cp1 } = profiles;

  // ── Revenue Streams ───────────────────────────────────────
  await prisma.revenueStream.createMany({
    data: [
      { creatorProfileId: cp1.id, type: RevenueType.SPONSORSHIP,     source: 'FitGear Co',        amount: 75000, currency: 'INR', period: '2026-06', receivedAt: daysAgo(10) },
      { creatorProfileId: cp1.id, type: RevenueType.YOUTUBE_ADSENSE, source: 'YouTube AdSense',   amount: 18500, currency: 'INR', period: '2026-06', receivedAt: daysAgo(5) },
      { creatorProfileId: cp1.id, type: RevenueType.AFFILIATE,       source: 'Amazon Associates',  amount: 9200,  currency: 'INR', period: '2026-06', receivedAt: daysAgo(2) },
      { creatorProfileId: cp1.id, type: RevenueType.SPONSORSHIP,     source: 'Nova Electronics',   amount: 120000, currency: 'INR', period: '2026-05', receivedAt: daysAgo(35) },
      { creatorProfileId: cp1.id, type: RevenueType.YOUTUBE_ADSENSE, source: 'YouTube AdSense',   amount: 16200, currency: 'INR', period: '2026-05', receivedAt: daysAgo(30) },
    ],
  });

  // ── Brand Deals ───────────────────────────────────────────
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

  // ── Invoices ──────────────────────────────────────────────
  await prisma.invoice.createMany({
    data: [
      { creatorProfileId: cp1.id, brandDealId: deal1.id, invoiceNumber: 'INV-2026-001', amount: 75000, currency: 'INR', status: InvoiceStatus.PAID, issuedAt: daysAgo(20), dueDate: daysAgo(5), paidAt: daysAgo(3) },
      { creatorProfileId: cp1.id, brandDealId: deal2.id, invoiceNumber: 'INV-2026-002', amount: 25000, currency: 'INR', status: InvoiceStatus.SENT, issuedAt: daysAgo(2), dueDate: futureDate(28), notes: '50% advance for VitaBlend deal' },
      { creatorProfileId: cp1.id, invoiceNumber: 'INV-2026-003', amount: 25000, currency: 'INR', status: InvoiceStatus.DRAFT, notes: 'Remaining 50% for VitaBlend — send on delivery' },
    ],
  });
  console.log('Revenue OS seeded ✓');
}
