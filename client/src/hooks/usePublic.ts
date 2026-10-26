import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPublicCourse,
  fetchPublicCourses,
  submitInquiry,
} from '../api/public';
import type { InquiryPayload } from '../types/public';

export const publicKeys = {
  courses: ['public', 'courses'] as const,
  course: (slug: string) => ['public', 'course', slug] as const,
};

export function usePublicCourses() {
  return useQuery({
    queryKey: publicKeys.courses,
    queryFn: fetchPublicCourses,
    staleTime: 5 * 60_000,
  });
}

export function usePublicCourse(slug: string | undefined) {
  return useQuery({
    queryKey: publicKeys.course(slug ?? ''),
    queryFn: () => fetchPublicCourse(slug as string),
    enabled: !!slug,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useSubmitInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InquiryPayload) => submitInquiry(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
