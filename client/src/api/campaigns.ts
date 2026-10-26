// client/src/api/campaigns.ts
import api from './client';
import type { CampaignSource, Channel } from '../types';

// ─────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────
export interface CreateCampaignPayload {
  name: string;
  channel: Channel;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  description?: string;
  isActive?: boolean;
}

export type UpdateCampaignPayload = Partial<CreateCampaignPayload>;

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────
export async function fetchCampaigns(
  includeInactive = false,
): Promise<CampaignSource[]> {
  const { data } = await api.get<CampaignSource[]>('/campaigns', {
    params: includeInactive ? { includeInactive: true } : undefined,
  });
  return data;
}

// ─────────────────────────────────────────────
// Mutations (تُستخدم في المرحلة B)
// ─────────────────────────────────────────────
export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<CampaignSource> {
  const { data } = await api.post<CampaignSource>('/campaigns', payload);
  return data;
}

export async function updateCampaign(
  id: string,
  payload: UpdateCampaignPayload,
): Promise<CampaignSource> {
  const { data } = await api.patch<CampaignSource>(
    `/campaigns/${id}`,
    payload,
  );
  return data;
}