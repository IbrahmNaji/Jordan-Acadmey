import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

interface TokenPayload {
  id: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
}

export class AuthService {
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
    const user = await prisma.user.findUnique({ where: { email } });
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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