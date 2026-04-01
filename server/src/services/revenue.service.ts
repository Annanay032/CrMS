import { prisma } from '../config/index.js';
import { paginate } from '../utils/helpers.js';

// ─── Revenue Streams ─────────────────────────────────────────

export async function createRevenueStream(creatorProfileId: string, data: {
  type: string;
  source: string;
  amount: number;
  currency?: string;
  period?: string;
  campaignId?: string;
  notes?: string;
  receivedAt?: Date;
}) {
  return prisma.revenueStream.create({
    data: { creatorProfileId, ...data } as any,
  });
}

export async function listRevenueStreams(creatorProfileId: string, page: number, limit: number, filters?: {
  type?: string;
  period?: string;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { creatorProfileId };
  if (filters?.type) where.type = filters.type;
  if (filters?.period) where.period = filters.period;

  const [streams, total] = await Promise.all([
    prisma.revenueStream.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.revenueStream.count({ where }),
  ]);
  return { streams, total };
}

export async function deleteRevenueStream(id: string) {
  return prisma.revenueStream.delete({ where: { id } });
}

// ─── Brand Deals ─────────────────────────────────────────────

export async function createBrandDeal(creatorProfileId: string, data: {
  brandName: string;
  contactEmail?: string;
  dealValue: number;
  currency?: string;
  deliverables: string[];
  status?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}) {
  return prisma.brandDeal.create({
    data: { creatorProfileId, ...data } as any,
    include: { invoices: true },
  });
}

export async function listBrandDeals(creatorProfileId: string, page: number, limit: number, filters?: {
  status?: string;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { creatorProfileId };
  if (filters?.status) where.status = filters.status;

  const [deals, total] = await Promise.all([
    prisma.brandDeal.findMany({ where, skip, take, include: { invoices: true }, orderBy: { createdAt: 'desc' } }),
    prisma.brandDeal.count({ where }),
  ]);
  return { deals, total };
}

export async function updateBrandDeal(id: string, data: Record<string, unknown>) {
  return prisma.brandDeal.update({ where: { id }, data, include: { invoices: true } });
}

export async function deleteBrandDeal(id: string) {
  return prisma.brandDeal.delete({ where: { id } });
}

// ─── Invoices ────────────────────────────────────────────────

export async function createInvoice(creatorProfileId: string, data: {
  brandDealId?: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  status?: string;
  issuedAt?: Date;
  dueDate?: Date;
  notes?: string;
}) {
  return prisma.invoice.create({
    data: { creatorProfileId, ...data } as any,
    include: { brandDeal: true },
  });
}

export async function listInvoices(creatorProfileId: string, page: number, limit: number, filters?: {
  status?: string;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { creatorProfileId };
  if (filters?.status) where.status = filters.status;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, skip, take, include: { brandDeal: true }, orderBy: { createdAt: 'desc' } }),
    prisma.invoice.count({ where }),
  ]);
  return { invoices, total };
}

export async function updateInvoice(id: string, data: Record<string, unknown>) {
  return prisma.invoice.update({ where: { id }, data, include: { brandDeal: true } });
}

export async function deleteInvoice(id: string) {
  return prisma.invoice.delete({ where: { id } });
}

// ─── Summaries ───────────────────────────────────────────────

export async function getRevenueSummary(creatorProfileId: string, period?: string) {
  const where: Record<string, unknown> = { creatorProfileId };
  if (period) where.period = period;

  const streams = await prisma.revenueStream.findMany({ where });

  const byType: Record<string, number> = {};
  let totalEarnings = 0;
  for (const s of streams) {
    totalEarnings += s.amount;
    byType[s.type] = (byType[s.type] || 0) + s.amount;
  }

  const deals = await prisma.brandDeal.findMany({ where: { creatorProfileId } });
  const activeDealValue = deals
    .filter((d) => !['PAID', 'CANCELLED'].includes(d.status))
    .reduce((sum, d) => sum + d.dealValue, 0);

  const invoices = await prisma.invoice.findMany({ where: { creatorProfileId } });
  const pendingInvoiceAmount = invoices
    .filter((i) => ['DRAFT', 'SENT'].includes(i.status))
    .reduce((sum, i) => sum + i.amount, 0);
  const overdueInvoiceAmount = invoices
    .filter((i) => i.status === 'OVERDUE')
    .reduce((sum, i) => sum + i.amount, 0);

  return {
    totalEarnings,
    byType,
    activeDealValue,
    pendingInvoiceAmount,
    overdueInvoiceAmount,
    totalDeals: deals.length,
    totalInvoices: invoices.length,
  };
}

export async function getPostROI(creatorProfileId: string) {
  const posts = await prisma.contentPost.findMany({
    where: { creatorProfileId },
    include: { analytics: true },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  });

  return posts
    .filter((p) => p.analytics?.estimatedRevenue != null)
    .map((p) => ({
      postId: p.id,
      title: p.caption ?? '(untitled)',
      platform: p.platform,
      revenue: p.analytics!.estimatedRevenue,
      impressions: p.analytics?.impressions ?? 0,
      engagement: (p.analytics?.likes ?? 0) + (p.analytics?.comments ?? 0) + (p.analytics?.shares ?? 0),
      publishedAt: p.publishedAt,
    }));
}

// ─── Revenue Trends (Charts) ────────────────────────────────

export async function getRevenueTrends(creatorProfileId: string, months: number = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const streams = await prisma.revenueStream.findMany({
    where: { creatorProfileId, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
  });

  // Group by month
  const monthly: Record<string, { revenue: number; byType: Record<string, number> }> = {};
  for (const s of streams) {
    const key = s.period ?? `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = { revenue: 0, byType: {} };
    monthly[key].revenue += s.amount;
    monthly[key].byType[s.type] = (monthly[key].byType[s.type] || 0) + s.amount;
  }

  // Also include deal payments marked as PAID
  const paidDeals = await prisma.brandDeal.findMany({
    where: { creatorProfileId, status: 'PAID', updatedAt: { gte: since } },
  });
  for (const d of paidDeals) {
    const key = `${d.updatedAt.getFullYear()}-${String(d.updatedAt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = { revenue: 0, byType: {} };
    monthly[key].revenue += d.dealValue;
    monthly[key].byType['BRAND_DEAL'] = (monthly[key].byType['BRAND_DEAL'] || 0) + d.dealValue;
  }

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

// ─── Pipeline Summary (Deal Stages) ────────────────────────

export async function getPipelineSummary(creatorProfileId: string) {
  const deals = await prisma.brandDeal.findMany({
    where: { creatorProfileId },
    include: { contact: true },
    orderBy: { updatedAt: 'desc' },
  });

  const byStatus: Record<string, typeof deals> = {};
  let openPipelineValue = 0;
  let wonValue = 0;
  let lostValue = 0;

  for (const d of deals) {
    if (!byStatus[d.status]) byStatus[d.status] = [];
    byStatus[d.status].push(d);

    if (['PROSPECT', 'CONTACTED', 'LEAD', 'NEGOTIATING', 'CONFIRMED', 'IN_PROGRESS'].includes(d.status)) {
      openPipelineValue += d.dealValue;
    } else if (['DELIVERED', 'PAID'].includes(d.status)) {
      wonValue += d.dealValue;
    } else if (d.status === 'LOST') {
      lostValue += d.dealValue;
    }
  }

  const weightedPipeline = deals
    .filter((d) => !['PAID', 'CANCELLED', 'LOST', 'DELIVERED'].includes(d.status))
    .reduce((sum, d) => sum + d.dealValue * (d.probability / 100), 0);

  return {
    byStatus,
    totalDeals: deals.length,
    openPipelineValue,
    wonValue,
    lostValue,
    weightedPipeline,
  };
}

// ─── Invoice Stats ──────────────────────────────────────────

export async function getInvoiceStats(creatorProfileId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { creatorProfileId },
    include: { brandDeal: true },
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const paidAmount = invoices.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter((i) => ['DRAFT', 'SENT'].includes(i.status)).reduce((sum, i) => sum + i.amount, 0);
  const overdueAmount = invoices.filter((i) => i.status === 'OVERDUE').reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

  return {
    totalInvoiced,
    paidAmount,
    pendingAmount,
    overdueAmount,
    overdueCount,
    totalCount: invoices.length,
  };
}
