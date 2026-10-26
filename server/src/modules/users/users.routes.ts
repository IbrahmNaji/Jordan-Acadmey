// server/src/modules/users/users.routes.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';

    const users = await prisma.user.findMany({
      where: includeInactive ? undefined : { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(users);
  }),
);

export default router;