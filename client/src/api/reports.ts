import api from './client';
import type { DashboardStats, Lead, ReportOverview } from '../types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/reports/dashboard');
  return data;
}

export async function fetchFollowUps(): Promise<Lead[]> {
  const { data } = await api.get<Lead[]>('/reports/follow-ups');
  return data;
}

export async function fetchReportOverview(params: {
  from: string;
  to: string;
}): Promise<ReportOverview> {
  const { data } = await api.get<ReportOverview>('/reports/overview', {
    params,
  });
  return data;
}
