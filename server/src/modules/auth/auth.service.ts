import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { durationToMs } from '../../utils/duration';
import type { StaffRole } from '../../config/permissions';

interface TokenPayload {
  id: string;
  role: StaffRole;
}

export class AuthService {
  private refreshExpiry() {
    return new Date(
      Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN, '7d'),
    );
  }

  private signAccess(payload: TokenPayload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any);
  }

  private signRefresh(payload: TokenPayload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      jwtid: crypto.randomUUID(),
    } as any);
  }

  private hash(t: string) {
    return crypto.createHash('sha256').update(t).digest('hex');
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !user.isActive) throw new AppError(401, 'INVALID_CREDENTIALS');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError(401, 'INVALID_CREDENTIALS');

    const payload: TokenPayload = { id: user.id, role: user.role };
    const accessToken = this.signAccess(payload);
    const refreshToken = this.signRefresh(payload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        expiresAt: this.refreshExpiry(),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN');
    }

    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new AppError(401, 'REFRESH_REVOKED');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) throw new AppError(401, 'USER_INACTIVE');

    const newPayload: TokenPayload = { id: user.id, role: user.role };
    const accessToken = this.signAccess(newPayload);
    const newRefreshToken = this.signRefresh(newPayload);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hash(newRefreshToken),
          expiresAt: this.refreshExpiry(),
        },
      }),
    ]);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new AppError(400, 'INVALID_CURRENT_PASSWORD');
    if (currentPassword === newPassword) {
      throw new AppError(400, 'PASSWORD_UNCHANGED');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await bcrypt.hash(newPassword, 12) },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true, role: true,
        phone: true, isActive: true, lastLoginAt: true,
      },
    });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND');
    return user;
  }
}