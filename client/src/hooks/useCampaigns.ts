// client/src/hooks/useCampaigns.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  type CreateCampaignPayload,
  type UpdateCampaignPayload,
} from '../api/campaigns';
import type { CampaignSource } from '../types';

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (includeInactive: boolean) =>
    ['campaigns', 'list', includeInactive] as const,
};

function invalidateCampaignRelated(
  qc: ReturnType<typeof useQueryClient>,
) {
  qc.invalidateQueries({ queryKey: campaignKeys.all });
  // فلتر المصادر في Leads والمصادر في LeadForm يعتمدان عليها
  qc.invalidateQueries({ queryKey: ['leads'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCampaigns(includeInactive = false) {
  return useQuery({
    queryKey: campaignKeys.list(includeInactive),
    queryFn: () => fetchCampaigns(includeInactive),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) => createCampaign(payload),
    onSuccess: () => invalidateCampaignRelated(qc),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateCampaignPayload }) =>
      updateCampaign(vars.id, vars.payload),
    onSuccess: (updated: CampaignSource) => {
      qc.setQueryData(
        campaignKeys.list(true),
        (prev: CampaignSource[] | undefined) =>
          prev?.map((c) => (c.id === updated.id ? updated : c)),
      );
      invalidateCampaignRelated(qc);
    },
  });
}

/** تغيير حالة التفعيل فقط — اختصار على useUpdateCampaign */
export function useToggleCampaign() {
  const update = useUpdateCampaign();
  return {
    ...update,
    toggle: (id: string, isActive: boolean) =>
      update.mutate({ id, payload: { isActive } }),
  };
}