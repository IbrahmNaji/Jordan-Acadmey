import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardStats,
  fetchFollowUps,
  fetchReportOverview,
} from '../api/reports';

export const reportKeys = {
  all: ['reports'] as const,
  dashboard: ['dashboard'] as const,
  followUps: ['reports', 'follow-ups'] as const,
  overview: (range: { from: string; to: string }) =>
    ['reports', 'overview', range.from, range.to] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: reportKeys.dashboard,
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });
}

export function useFollowUps() {
  return useQuery({
    queryKey: reportKeys.followUps,
    queryFn: fetchFollowUps,
    staleTime: 30_000,
  });
}

export function useReportOverview(range: { from: string; to: string }) {
  return useQuery({
    queryKey: reportKeys.overview(range),
    queryFn: () => fetchReportOverview(range),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}
