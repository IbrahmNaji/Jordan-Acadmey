// client/src/hooks/useLeads.ts
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchLeads,
  fetchLead,
  createLead,
  updateLead,
  changeLeadStatus,
  assignLead,
  setLeadFollowUp,
  type LeadFilters,
  type CreateLeadPayload,
  type UpdateLeadPayload,
} from '../api/leads';
import type { Lead, LeadStatus } from '../types';

export const leadKeys = {
  all: ['leads'] as const,
  list: (filters: LeadFilters) => ['leads', 'list', filters] as const,
  detail: (id: string) => ['leads', 'detail', id] as const,
};

function invalidateLeadRelated(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: leadKeys.all });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => fetchLeads(filters),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: leadKeys.detail(id ?? ''),
    queryFn: () => fetchLead(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(payload),
    onSuccess: (lead: Lead) => {
      invalidateLeadRelated(qc);
      qc.setQueryData(leadKeys.detail(lead.id), lead);
    },
  });
}

export function useUpdateLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLeadPayload) => updateLead(id, payload),
    onSuccess: (lead: Lead) => {
      qc.setQueryData(leadKeys.detail(id), lead);
      invalidateLeadRelated(qc);
    },
  });
}

export function useChangeLeadStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { status: LeadStatus; reason?: string }) =>
      changeLeadStatus(id, vars.status, vars.reason),
    onSuccess: (lead: Lead) => {
      qc.setQueryData(leadKeys.detail(id), lead);
      invalidateLeadRelated(qc);
    },
  });
}

export function useAssignLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignedToId: string | null) => assignLead(id, assignedToId),
    onSuccess: (lead: Lead) => {
      qc.setQueryData(leadKeys.detail(id), lead);
      invalidateLeadRelated(qc);
    },
  });
}

export function useSetFollowUp(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string | null) => setLeadFollowUp(id, date),
    onSuccess: (lead: Lead) => {
      qc.setQueryData(leadKeys.detail(id), lead);
      invalidateLeadRelated(qc);
    },
  });
}