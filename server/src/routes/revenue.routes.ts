import { Router } from 'express';
import { z } from 'zod';
import * as revenueController from '../controllers/revenue.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requirePlan } from '../middleware/plan-gate.js';

const router = Router();
router.use(authenticate, requirePlan('PRO'));

// ─── Validation Schemas ──────────────────────────────────────

const revenueTypeEnum = z.enum(['BRAND_DEAL', 'YOUTUBE_ADSENSE', 'AFFILIATE', 'SPONSORSHIP', 'OTHER']);
const invoiceStatusEnum = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']);
const dealStatusEnum = z.enum(['PROSPECT', 'CONTACTED', 'LEAD', 'NEGOTIATING', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'PAID', 'CANCELLED', 'LOST']);

const createRevenueStreamSchema = z.object({
  type: revenueTypeEnum,
  source: z.string().min(1).max(200),
  amount: z.number().min(0),
  currency: z.string().max(10).optional(),
  period: z.string().max(20).optional(),
  campaignId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  receivedAt: z.coerce.date().optional(),
});

const createBrandDealSchema = z.object({
  brandName: z.string().min(1).max(200),
  contactEmail: z.string().email().optional(),
  dealValue: z.number().min(0),
  currency: z.string().max(10).optional(),
  deliverables: z.array(z.string()).min(1),
  status: dealStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

const updateBrandDealSchema = z.object({
  brandName: z.string().min(1).max(200).optional(),
  contactEmail: z.string().email().optional(),
  dealValue: z.number().min(0).optional(),
  deliverables: z.array(z.string()).optional(),
  status: dealStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

const createInvoiceSchema = z.object({
  brandDealId: z.string().optional(),
  invoiceNumber: z.string().min(1).max(50),
  amount: z.number().min(0),
  currency: z.string().max(10).optional(),
  status: invoiceStatusEnum.optional(),
  issuedAt: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

const updateInvoiceSchema = z.object({
  status: invoiceStatusEnum.optional(),
  amount: z.number().min(0).optional(),
  issuedAt: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

// ─── Summaries ───────────────────────────────────────────────

router.get('/summary', revenueController.getRevenueSummary);
router.get('/post-roi', revenueController.getPostROI);
router.get('/trends', revenueController.getRevenueTrends);
router.get('/pipeline-summary', revenueController.getPipelineSummary);
router.get('/invoice-stats', revenueController.getInvoiceStats);

// ─── Revenue Streams ─────────────────────────────────────────

router.get('/streams', revenueController.listRevenueStreams);
router.post('/streams', validate(createRevenueStreamSchema), revenueController.createRevenueStream);
router.delete('/streams/:id', revenueController.deleteRevenueStream);

// ─── Brand Deals ─────────────────────────────────────────────

router.get('/deals', revenueController.listBrandDeals);
router.post('/deals', validate(createBrandDealSchema), revenueController.createBrandDeal);
router.put('/deals/:id', validate(updateBrandDealSchema), revenueController.updateBrandDeal);
router.delete('/deals/:id', revenueController.deleteBrandDeal);

// ─── Invoices ────────────────────────────────────────────────

router.get('/invoices', revenueController.listInvoices);
router.post('/invoices', validate(createInvoiceSchema), revenueController.createInvoice);
router.put('/invoices/:id', validate(updateInvoiceSchema), revenueController.updateInvoice);
router.delete('/invoices/:id', revenueController.deleteInvoice);
router.get('/invoices/:id/pdf', revenueController.downloadInvoicePdf);

export default router;
