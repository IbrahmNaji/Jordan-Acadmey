import api from './client';
import type {
  CourseType,
  Enrollment,
  EnrollmentStatus,
  Payment,
  PaymentMethod,
} from '../types';

export interface EnrollmentFilters {
  status?: EnrollmentStatus;
  course?: CourseType;
  search?: string;
}

export interface CreateEnrollmentPayload {
  leadId: string;
  course: CourseType;
  totalFee: number;
  paymentPlan?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateEnrollmentPayload {
  status?: EnrollmentStatus;
  totalFee?: number;
  paymentPlan?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
}

export interface RecordPaymentPayload {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
}

export async function fetchEnrollments(
  params: EnrollmentFilters = {},
): Promise<Enrollment[]> {
  const { data } = await api.get<Enrollment[]>('/enrollments', {
    params: {
      status: params.status || undefined,
      course: params.course || undefined,
      search: params.search?.trim() || undefined,
    },
  });
  return data;
}

export async function fetchEnrollment(id: string): Promise<Enrollment> {
  const { data } = await api.get<Enrollment>(`/enrollments/${id}`);
  return data;
}

export async function createEnrollment(
  payload: CreateEnrollmentPayload,
): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>('/enrollments', payload);
  return data;
}

export async function updateEnrollment(
  id: string,
  payload: UpdateEnrollmentPayload,
): Promise<Enrollment> {
  const { data } = await api.patch<Enrollment>(`/enrollments/${id}`, payload);
  return data;
}

export async function recordPayment(
  enrollmentId: string,
  payload: RecordPaymentPayload,
): Promise<Payment> {
  const { data } = await api.post<Payment>(
    `/enrollments/${enrollmentId}/payments`,
    payload,
  );
  return data;
}
