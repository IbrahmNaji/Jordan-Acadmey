import api from './client';
import type { Role } from '../types';

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorRole: Role | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; fullName: string; role: Role } | null;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchAuditLogs(filters: {
  action?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
}): Promise<AuditLogResponse> {
  const { data } = await api.get<AuditLogResponse>('/audit-logs', {
    params: {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.page ? { page: filters.page } : {}),
      ...(filters.pageSize ? { pageSize: filters.pageSize } : {}),
    },
  });
  return data;
}
