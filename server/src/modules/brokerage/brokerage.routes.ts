import { BrokerageDealStatus, CommissionCalculationType, CommissionPayer, Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { authenticate, requirePermission } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit, requestIp } from '../../utils/audit';
import { validate } from '../../middleware/validate';
import { hasPermission } from '../../config/permissions';

const router = Router();
router.use(authenticate);
const uuid = z.string().uuid();
const money = z.number().finite().positive().max(1_000_000_000);
const scope = (user: NonNullable<Express.Request['user']>): Prisma.BrokerageDealWhereInput =>
  user.role === 'AGENT' ? { listing: { assignedToId: user.id } } : {};
const dealInclude = {
  listing: { select: { id: true, make: true, model: true, year: true, ownerCustomerId: true, assignedToId: true } },
  buyer: { select: { id: true, fullName: true, phone: true } },
  seller: { select: { id: true, fullName: true, phone: true } },
  history: { orderBy: { createdAt: 'desc' as const }, take: 20 },
  viewings: { orderBy: { scheduledAt: 'desc' as const } },
  commissions: { include: { payments: { orderBy: { paidAt: 'desc' as const } } } },
};
async function dealOr404(id: string, user: NonNullable<Express.Request['user']>) {
  const deal = await prisma.brokerageDeal.findFirst({ where: { id, ...scope(user) }, include: dealInclude });
  if (!deal) throw new AppError(404, 'DEAL_NOT_FOUND');
  return deal;
}
function hideFinancials<T extends { commissions?: unknown }>(deal: T, user: NonNullable<Express.Request['user']>) {
  if (hasPermission(user.role, 'brokerage:finance')) return deal;
  const { commissions: _commissions, ...visible } = deal;
  return visible;
}

router.get('/deal-options', requirePermission('deals:write'), asyncHandler(async (req, res) => {
  const q = z.object({ search: z.string().trim().max(100).default('') }).parse(req.query);
  const assignment = req.user!.role === 'AGENT' ? req.user!.id : undefined;
  const [listings, customers] = await Promise.all([
    prisma.vehicleListing.findMany({ where: { status: 'APPROVED', ...(assignment && { assignedToId: assignment }) }, select: { id: true, make: true, model: true, year: true, ownerCustomerId: true, owner: { select: { fullName: true } } }, orderBy: { publishedAt: 'desc' }, take: 100 }),
    prisma.customer.findMany({ where: { archivedAt: null, ...(q.search && { OR: [{ fullName: { contains: q.search, mode: 'insensitive' } }, { phone: { contains: q.search } }] }), ...(assignment && { leads: { some: { assignedToId: assignment } } }) }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: 'asc' }, take: 50 }),
  ]);
  res.json({ listings, customers });
}));

router.get('/deals', requirePermission('deals:read'), asyncHandler(async (req, res) => {
  const q = z.object({ status: z.nativeEnum(BrokerageDealStatus).optional(), search: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).max(10_000).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) }).parse(req.query);
  const where: Prisma.BrokerageDealWhereInput = { ...scope(req.user!), ...(q.status && { status: q.status }), ...(q.search && { OR: [{ listing: { make: { contains: q.search, mode: 'insensitive' } } }, { listing: { model: { contains: q.search, mode: 'insensitive' } } }, { buyer: { fullName: { contains: q.search, mode: 'insensitive' } } }, { seller: { fullName: { contains: q.search, mode: 'insensitive' } } }] }) };
  const [items, total] = await Promise.all([prisma.brokerageDeal.findMany({ where, include: dealInclude, orderBy: { updatedAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }), prisma.brokerageDeal.count({ where })]);
  res.json({ items: items.map(item => hideFinancials(item, req.user!)), total, page: q.page, pageSize: q.pageSize });
}));

router.post('/deals', requirePermission('deals:write'), validate({ body: z.object({ listingId: uuid, buyerCustomerId: uuid, expectedAmount: money.optional(), currency: z.string().trim().length(3).transform(v => v.toUpperCase()).default('SYP'), note: z.string().trim().max(1000).optional() }).strict() }), asyncHandler(async (req, res) => {
  const body = req.body as { listingId: string; buyerCustomerId: string; expectedAmount?: number; currency: string; note?: string };
  const listing = await prisma.vehicleListing.findFirst({ where: { id: body.listingId, status: 'APPROVED', ...(req.user!.role === 'AGENT' ? { assignedToId: req.user!.id } : {}) }, select: { id: true, ownerCustomerId: true } });
  if (!listing) throw new AppError(404, 'APPROVED_LISTING_NOT_FOUND');
  if (body.buyerCustomerId === listing.ownerCustomerId) throw new AppError(400, 'BUYER_AND_SELLER_MUST_DIFFER');
  const [buyer, seller] = await Promise.all([prisma.customer.findFirst({ where: { id: body.buyerCustomerId, archivedAt: null }, select: { id: true } }), prisma.customer.findFirst({ where: { id: listing.ownerCustomerId, archivedAt: null }, select: { id: true } })]);
  if (!buyer || !seller) throw new AppError(404, 'CUSTOMER_NOT_FOUND');
  const deal = await prisma.$transaction(async tx => {
    const created = await tx.brokerageDeal.create({ data: { listingId: listing.id, buyerCustomerId: buyer.id, sellerCustomerId: seller.id, createdById: req.user!.id, expectedAmount: body.expectedAmount, currency: body.currency, history: { create: { to: 'NEW_INQUIRY', reason: body.note, actorId: req.user!.id } } } });
    return tx.brokerageDeal.findUniqueOrThrow({ where: { id: created.id }, include: dealInclude });
  });
  await recordAudit({ actor: req.user, action: 'brokerage.deal.create', entityType: 'BrokerageDeal', entityId: deal.id, summary: 'إنشاء صفقة وساطة', metadata: { listingId: listing.id }, ip: requestIp(req) });
  res.status(201).json(deal);
}));

router.get('/deals/:id', requirePermission('deals:read'), asyncHandler(async (req, res) => { res.json(hideFinancials(await dealOr404(uuid.parse(req.params.id), req.user!), req.user!)); }));

const transitions: Record<BrokerageDealStatus, BrokerageDealStatus[]> = {
  NEW_INQUIRY: ['CONTACTED', 'QUALIFIED', 'LOST', 'CANCELLED'], CONTACTED: ['QUALIFIED', 'VIEWING_SCHEDULED', 'NEGOTIATION', 'LOST', 'CANCELLED'],
  QUALIFIED: ['VIEWING_SCHEDULED', 'NEGOTIATION', 'LOST', 'CANCELLED'], VIEWING_SCHEDULED: ['NEGOTIATION', 'QUALIFIED', 'LOST', 'CANCELLED'],
  NEGOTIATION: ['AGREEMENT_PENDING', 'VIEWING_SCHEDULED', 'LOST', 'CANCELLED'], AGREEMENT_PENDING: ['NEGOTIATION', 'COMPLETED', 'LOST', 'CANCELLED'],
  COMPLETED: [], LOST: [], CANCELLED: [],
};
router.patch('/deals/:id/status', requirePermission('deals:write'), validate({ body: z.object({ status: z.nativeEnum(BrokerageDealStatus), reason: z.string().trim().min(3).max(1000).optional(), finalAmount: money.optional() }).strict() }), asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id); const body = req.body as { status: BrokerageDealStatus; reason?: string; finalAmount?: number };
  const current = await dealOr404(id, req.user!);
  if (!transitions[current.status].includes(body.status)) throw new AppError(409, 'INVALID_DEAL_TRANSITION');
  if (['LOST', 'CANCELLED'].includes(body.status) && !body.reason) throw new AppError(400, 'OUTCOME_REASON_REQUIRED');
  if (body.status === 'COMPLETED') {
    if (!body.finalAmount || current.commissions.length === 0) throw new AppError(400, 'FINAL_AMOUNT_AND_COMMISSION_AGREEMENT_REQUIRED');
  }
  const updated = await prisma.$transaction(async tx => {
    const deal = await tx.brokerageDeal.update({ where: { id }, data: { status: body.status, ...(body.finalAmount && { finalAmount: body.finalAmount }), ...(body.status === 'COMPLETED' && { completedAt: new Date() }), ...(['LOST', 'CANCELLED'].includes(body.status) && { outcomeNote: body.reason }) } });
    await tx.brokerageDealStageHistory.create({ data: { dealId: id, from: current.status, to: body.status, reason: body.reason, actorId: req.user!.id } });
    return tx.brokerageDeal.findUniqueOrThrow({ where: { id: deal.id }, include: dealInclude });
  });
  await recordAudit({ actor: req.user, action: 'brokerage.deal.status', entityType: 'BrokerageDeal', entityId: id, summary: `تحديث حالة الصفقة إلى ${body.status}`, metadata: { from: current.status, to: body.status }, ip: requestIp(req) });
  res.json(hideFinancials(updated, req.user!));
}));

router.post('/deals/:id/viewings', requirePermission('deals:write'), validate({ body: z.object({ scheduledAt: z.string().datetime(), location: z.string().trim().max(250).optional(), notes: z.string().trim().max(1000).optional() }).strict() }), asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id); await dealOr404(id, req.user!);
  const body = req.body as { scheduledAt: string; location?: string; notes?: string };
  const viewing = await prisma.vehicleViewing.create({ data: { dealId: id, scheduledAt: new Date(body.scheduledAt), location: body.location, notes: body.notes, createdById: req.user!.id } });
  res.status(201).json(viewing);
}));

router.post('/deals/:id/commissions', requirePermission('brokerage:finance'), validate({ body: z.object({ payer: z.nativeEnum(CommissionPayer), otherPayerName: z.string().trim().min(2).max(120).optional(), calculationType: z.nativeEnum(CommissionCalculationType), calculationBasis: z.string().trim().min(3).max(250), basisAmount: money, rateOrAmount: money, currency: z.string().trim().length(3).transform(v => v.toUpperCase()).default('SYP'), agreementReference: z.string().trim().min(3).max(250), notes: z.string().trim().max(1000).optional() }).strict() }), asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id); await dealOr404(id, req.user!);
  const body = req.body as { payer: CommissionPayer; otherPayerName?: string; calculationType: CommissionCalculationType; calculationBasis: string; basisAmount: number; rateOrAmount: number; currency: string; agreementReference: string; notes?: string };
  if (body.payer === 'OTHER' && !body.otherPayerName) throw new AppError(400, 'OTHER_PAYER_NAME_REQUIRED');
  if (body.calculationType === 'PERCENTAGE' && body.rateOrAmount > 100) throw new AppError(400, 'COMMISSION_PERCENTAGE_OUT_OF_RANGE');
  const cents = Math.round(body.calculationType === 'FIXED' ? body.rateOrAmount * 100 : body.basisAmount * body.rateOrAmount);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new AppError(400, 'INVALID_COMMISSION_AMOUNT');
  const amountDue = new Prisma.Decimal(cents).div(100).toDecimalPlaces(2);
  try {
    const agreement = await prisma.commissionAgreement.create({ data: { dealId: id, payer: body.payer, otherPayerName: body.otherPayerName, calculationType: body.calculationType, calculationBasis: body.calculationBasis, basisAmount: body.basisAmount, rateOrAmount: body.rateOrAmount, amountDue, currency: body.currency, agreementReference: body.agreementReference, notes: body.notes, approvedById: req.user!.id }, include: { payments: true } });
    await recordAudit({ actor: req.user, action: 'brokerage.commission.agree', entityType: 'CommissionAgreement', entityId: agreement.id, summary: 'تسجيل اتفاق عمولة', metadata: { dealId: id, payer: agreement.payer, amountDue: agreement.amountDue.toString(), currency: agreement.currency }, ip: requestIp(req) });
    res.status(201).json(agreement);
  } catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new AppError(409, 'COMMISSION_PAYER_ALREADY_AGREED'); throw e; }
}));

router.post('/commissions/:id/payments', requirePermission('brokerage:finance'), validate({ body: z.object({ amount: money, method: z.enum(['CASH', 'BANK_TRANSFER', 'SHAM_CASH', 'OTHER']).default('CASH'), reference: z.string().trim().max(200).optional(), note: z.string().trim().max(1000).optional(), paidAt: z.string().datetime().optional() }).strict() }), asyncHandler(async (req, res) => {
  const id = uuid.parse(req.params.id); const body = req.body as { amount: number; method: 'CASH' | 'BANK_TRANSFER' | 'SHAM_CASH' | 'OTHER'; reference?: string; note?: string; paidAt?: string };
  let totals: { payment: Prisma.CommissionPaymentGetPayload<object>; totalPaid: number; balance: number };
  try {
    totals = await prisma.$transaction(async tx => {
      const agreement = await tx.commissionAgreement.findUnique({ where: { id }, include: { payments: true } });
      if (!agreement) throw new AppError(404, 'COMMISSION_AGREEMENT_NOT_FOUND');
      const paidCents = agreement.payments.reduce((sum, payment) => sum + Math.round(Number(payment.amount) * 100), 0);
      const amountCents = Math.round(body.amount * 100); const dueCents = Math.round(Number(agreement.amountDue) * 100);
      if (paidCents + amountCents > dueCents) throw new AppError(400, 'PAYMENT_EXCEEDS_COMMISSION_BALANCE');
      const payment = await tx.commissionPayment.create({ data: { agreementId: id, amount: body.amount, currency: agreement.currency, method: body.method, reference: body.reference, note: body.note, paidAt: body.paidAt ? new Date(body.paidAt) : new Date(), recordedById: req.user!.id } });
      return { payment, totalPaid: (paidCents + amountCents) / 100, balance: (dueCents - paidCents - amountCents) / 100 };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') throw new AppError(409, 'COMMISSION_PAYMENT_CONFLICT_RETRY');
    throw e;
  }
  const { payment } = totals;
  await recordAudit({ actor: req.user, action: 'brokerage.commission.payment', entityType: 'CommissionPayment', entityId: payment.id, summary: 'تسجيل دفعة عمولة', metadata: { agreementId: id, amount: payment.amount.toString(), currency: payment.currency }, ip: requestIp(req) });
  res.status(201).json(totals);
}));

export default router;
