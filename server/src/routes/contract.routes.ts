import { Router } from 'express';
import { z } from 'zod';
import * as contractController from '../controllers/contract.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requirePlan } from '../middleware/plan-gate.js';

const router = Router();
router.use(authenticate, requirePlan('PRO'));

// ─── Validation Schemas ──────────────────────────────────────

const contractStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']);

const deliverableSchema = z.object({
  title: z.string().min(1).max(200),
  dueDate: z.string(),
  completed: z.boolean().default(false),
});

const paymentMilestoneSchema = z.object({
  amount: z.number().min(0),
  dueDate: z.string(),
  paid: z.boolean().default(false),
});

const createContractSchema = z.object({
  title: z.string().min(1).max(300),
  brandDealId: z.string().optional(),
  terms: z.string().max(10000).optional(),
  deliverables: z.array(deliverableSchema).optional(),
  paymentSchedule: z.array(paymentMilestoneSchema).optional(),
  status: contractStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  totalValue: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

const updateContractSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  terms: z.string().max(10000).optional(),
  deliverables: z.array(deliverableSchema).optional(),
  paymentSchedule: z.array(paymentMilestoneSchema).optional(),
  status: contractStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  totalValue: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// ─── Routes ──────────────────────────────────────────────────

router.get('/', contractController.listContracts);
router.post('/', validate(createContractSchema), contractController.createContract);
router.get('/calendar-events', contractController.getCalendarEvents);
router.get('/:id', contractController.getContract);
router.put('/:id', validate(updateContractSchema), contractController.updateContract);
router.delete('/:id', contractController.deleteContract);

export default router;
