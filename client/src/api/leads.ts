// client/src/api/leads.ts
import api from './client';
import type {
  Lead,
  LeadsResponse,
  LeadStatus,
} from '../types';

// ─────────────────────────────────────────────
// Filters for GET /leads
// ─────────────────────────────────────────────
export interface LeadFilters {
  status?: LeadStatus;
  sourceId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────
export interface CreateLeadPayload {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  age?: number;
  interestedIn?: 'MECHANICS' | 'ELECTRICAL' | 'DIAGNOSTICS' | 'HYBRID';
  sourceId?: string;
  notes?: string;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────
export async function fetchLeads(
  params: LeadFilters = {},
): Promise<LeadsResponse> {
  const { data } = await api.get<LeadsResponse>('/leads', {
    params: {
      status: params.status || undefined,
      sourceId: params.sourceId || undefined,
      assignedToId: params.assignedToId || undefined,
      search: params.search?.trim() || undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
    },
  });
  return data;
}

export async function fetchLead(id: string): Promise<Lead> {
  const { data } = await api.get<Lead>(`/leads/${id}`);
  return data;
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────
export async function createLead(
  payload: CreateLeadPayload,
): Promise<Lead> {
  const { data } = await api.post<Lead>('/leads', payload);
  return data;
}

export async function updateLead(
  id: string,
  payload: UpdateLeadPayload,
): Promise<Lead> {
  const { data } = await api.patch<Lead>(`/leads/${id}`, payload);
  return data;
}

export async function changeLeadStatus(
  id: string,
  status: LeadStatus,
  reason?: string,
): Promise<Lead> {
  const { data } = await api.patch<Lead>(`/leads/${id}/status`, {
    status,
    ...(reason ? { reason } : {}),
  });
  return data;
}

export async function assignLead(
  id: string,
  assignedToId: string | null,
): Promise<Lead> {
  const { data } = await api.patch<Lead>(`/leads/${id}/assign`, {
    assignedToId,
  });
  return data;
}

export async function setLeadFollowUp(
  id: string,
  date: string | null,
): Promise<Lead> {
  const { data } = await api.patch<Lead>(`/leads/${id}/follow-up`, {
    nextFollowUpAt: date,
  });
  return data;
}
