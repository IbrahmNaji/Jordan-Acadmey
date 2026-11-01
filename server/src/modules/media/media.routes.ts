import { MediaPurpose } from '@prisma/client';
import { Router, raw } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { authenticate, requirePermission } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const imageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
const uploadImage = raw({ type: [...imageTypes], limit: '5mb' });

router.get('/:id', asyncHandler(async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new AppError(404, 'MEDIA_NOT_FOUND');
  const asset = await prisma.mediaAsset.findUnique({ where: { id: id.data }, select: { mimeType: true, data: true } });
  if (!asset) throw new AppError(404, 'MEDIA_NOT_FOUND');
  res.setHeader('Content-Type', asset.mimeType);
  res.setHeader('Content-Length', asset.data.byteLength);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(Buffer.from(asset.data));
}));

router.post('/vehicles', authenticate, requirePermission('vehicles:write'), uploadImage, asyncHandler(async (req, res) => {
  const asset = await saveImage(req.body, req.headers['content-type'], 'VEHICLE_IMAGE', req.user!.id);
  res.status(201).json({ url: `/media/${asset.id}` });
}));

router.post('/instructors', authenticate, requirePermission('courses:write'), uploadImage, asyncHandler(async (req, res) => {
  const asset = await saveImage(req.body, req.headers['content-type'], 'INSTRUCTOR_IMAGE', req.user!.id);
  res.status(201).json({ url: `/media/${asset.id}` });
}));

router.post('/parts', authenticate, requirePermission('parts:write'), uploadImage, asyncHandler(async (req, res) => {
  const asset = await saveImage(req.body, req.headers['content-type'], 'SPARE_PART_IMAGE', req.user!.id);
  res.status(201).json({ url: `/media/${asset.id}` });
}));

async function saveImage(body: unknown, rawType: string | undefined, purpose: MediaPurpose, userId: string) {
  if (!Buffer.isBuffer(body) || !body.length) throw new AppError(400, 'IMAGE_REQUIRED');
  const mimeType = rawType?.split(';', 1)[0]?.trim().toLowerCase();
  if (!imageTypes.includes(mimeType as (typeof imageTypes)[number])) throw new AppError(400, 'UNSUPPORTED_IMAGE_TYPE');
  if (!hasValidSignature(body, mimeType!)) throw new AppError(400, 'INVALID_IMAGE_FILE');
  const storedBytes = new Uint8Array(body.length);
  storedBytes.set(body);
  return prisma.mediaAsset.create({ data: { purpose, mimeType: mimeType!, data: storedBytes, createdById: userId }, select: { id: true } });
}

function hasValidSignature(data: Buffer, mimeType: string) {
  if (mimeType === 'image/jpeg') return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mimeType === 'image/png') return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
}

export default router;
