import { prisma } from '../config/index.js';
import { paginate } from '../utils/helpers.js';

// ─── CRUD ───────────────────────────────────────────────────

export async function createContract(creatorProfileId: string, data: {
  title: string;
  brandDealId?: string;
  terms?: string;
  deliverables?: { title: string; dueDate: string; completed: boolean }[];
  paymentSchedule?: { amount: number; dueDate: string; paid: boolean }[];
  status?: string;
  startDate?: Date;
  endDate?: Date;
  totalValue?: number;
  notes?: string;
}) {
  return prisma.contract.create({
    data: {
      creatorProfileId,
      title: data.title,
      brandDealId: data.brandDealId,
      terms: data.terms,
      deliverables: data.deliverables ?? [],
      paymentSchedule: data.paymentSchedule ?? [],
      status: (data.status as any) ?? 'DRAFT',
      startDate: data.startDate,
      endDate: data.endDate,
      totalValue: data.totalValue ?? 0,
      notes: data.notes,
    },
    include: { brandDeal: true },
  });
}

export async function listContracts(creatorProfileId: string, page: number, limit: number, filters?: {
  status?: string;
}) {
  const { skip, take } = paginate(page, limit);
  const where: Record<string, unknown> = { creatorProfileId };
  if (filters?.status) where.status = filters.status;

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      skip,
      take,
      include: { brandDeal: { select: { brandName: true, dealValue: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contract.count({ where }),
  ]);
  return { contracts, total };
}

export async function getContractById(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: { brandDeal: { include: { invoices: true, contact: true } } },
  });
}

export async function updateContract(id: string, data: Record<string, unknown>) {
  return prisma.contract.update({
    where: { id },
    data,
    include: { brandDeal: true },
  });
}

export async function deleteContract(id: string) {
  return prisma.contract.delete({ where: { id } });
}

// ─── Calendar Events ────────────────────────────────────────

/** Get upcoming contract deadlines (deliverables + payment milestones) for calendar overlay. */
export async function getContractCalendarEvents(creatorProfileId: string) {
  const contracts = await prisma.contract.findMany({
    where: { creatorProfileId, status: { in: ['ACTIVE', 'DRAFT'] } },
    include: { brandDeal: { select: { brandName: true } } },
  });

  const events: {
    id: string;
    contractId: string;
    title: string;
    type: 'deliverable' | 'payment';
    dueDate: string;
    completed: boolean;
    brandName?: string;
  }[] = [];

  for (const c of contracts) {
    const deliverables = (c.deliverables as any[]) ?? [];
    for (const d of deliverables) {
      if (d.dueDate) {
        events.push({
          id: `${c.id}-d-${d.title}`,
          contractId: c.id,
          title: `📦 ${d.title}`,
          type: 'deliverable',
          dueDate: d.dueDate,
          completed: d.completed ?? false,
          brandName: c.brandDeal?.brandName,
        });
      }
    }

    const payments = (c.paymentSchedule as any[]) ?? [];
    for (const p of payments) {
      if (p.dueDate) {
        events.push({
          id: `${c.id}-p-${p.dueDate}`,
          contractId: c.id,
          title: `💰 ₹${(p.amount ?? 0).toLocaleString()} due`,
          type: 'payment',
          dueDate: p.dueDate,
          completed: p.paid ?? false,
          brandName: c.brandDeal?.brandName,
        });
      }
    }
  }

  return events.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
