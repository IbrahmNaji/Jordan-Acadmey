import api from './client';
import type { DashboardStats, Lead, ReportOverview } from '../types';

export interface CurrencyAmount { currency: string; amount: string }
export interface BusinessLinesReport {
  range: { from: string; to: string };
  brokerage: { agreements: CurrencyAmount[]; collected: CurrencyAmount[]; outstanding: CurrencyAmount[] };
  workshop: { invoices: CurrencyAmount[]; collected: CurrencyAmount[]; outstanding: CurrencyAmount[] };
  parts: { requests: number; quotations: number; byStatus: Array<{status:string;count:number}> };
}

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

export async function fetchBusinessLinesReport(params:{from:string;to:string}):Promise<BusinessLinesReport>{
  const {data}=await api.get<BusinessLinesReport>('/reports/business-lines',{params});return data;
}
