import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createEnrollment,
  fetchEnrollment,
  fetchEnrollments,
  recordPayment,
  updateEnrollment,
  type CreateEnrollmentPayload,
  type EnrollmentFilters,
  type RecordPaymentPayload,
  type UpdateEnrollmentPayload,
} from '../api/enrollments';
import type { Enrollment } from '../types';

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  list: (filters: EnrollmentFilters) =>
    ['enrollments', 'list', filters] as const,
  detail: (id: string) => ['enrollments', 'detail', id] as const,
};

function invalidateEnrollmentRelated(
  qc: ReturnType<typeof useQueryClient>,
) {
  qc.invalidateQueries({ queryKey: enrollmentKeys.all });
  qc.invalidateQueries({ queryKey: ['leads'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useEnrollments(filters: EnrollmentFilters = {}) {
  return useQuery({
    queryKey: enrollmentKeys.list(filters),
    queryFn: () => fetchEnrollments(filters),
    staleTime: 30_000,
  });
}

export function useEnrollment(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id ?? ''),
    queryFn: () => fetchEnrollment(id as string),
    enabled: enabled && !!id,
    staleTime: 15_000,
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEnrollmentPayload) => createEnrollment(payload),
    onSuccess: () => invalidateEnrollmentRelated(qc),
  });
}

export function useUpdateEnrollment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEnrollmentPayload) =>
      updateEnrollment(id, payload),
    onSuccess: (enrollment: Enrollment) => {
      qc.setQueryData(enrollmentKeys.detail(id), enrollment);
      invalidateEnrollmentRelated(qc);
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { enrollmentId: string; payload: RecordPaymentPayload }) =>
      recordPayment(vars.enrollmentId, vars.payload),
    onSuccess: () => invalidateEnrollmentRelated(qc),
  });
}
