import api from './client';
import type {
  AcademyBatch,
  AcademyCourse,
  AcademyCourseSummary,
  AttendanceSheet,
  AttendanceStatus,
  CourseCategory,
  CourseStatus,
  CourseType,
  Instructor,
} from '../types';

export async function fetchAcademyCourses(
  params: {
    status?: CourseStatus;
    courseType?: CourseType;
    search?: string;
  } = {},
) {
  const { data } = await api.get<{ items: AcademyCourseSummary[] }>(
    '/academy/courses',
    { params },
  );
  return data.items;
}

export async function fetchAcademyCourse(id: string) {
  const { data } = await api.get<AcademyCourse>(`/academy/courses/${id}`);
  return data;
}

export async function createAcademyCourse(payload: Record<string, unknown>) {
  const { data } = await api.post<AcademyCourse>('/academy/courses', payload);
  return data;
}

export async function updateAcademyCourse(
  id: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.patch<AcademyCourse>(
    `/academy/courses/${id}`,
    payload,
  );
  return data;
}

export async function fetchBatches(
  params: { courseId?: string; status?: AcademyBatch['status'] } = {},
) {
  const { data } = await api.get<{ items: AcademyBatch[] }>('/academy/batches', {
    params,
  });
  return data.items;
}

export async function createBatch(payload: Record<string, unknown>) {
  const { data } = await api.post<AcademyBatch>('/academy/batches', payload);
  return data;
}

export async function updateBatch(
  id: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.patch<AcademyBatch>(
    `/academy/batches/${id}`,
    payload,
  );
  return data;
}

export async function fetchCategories(includeInactive = true) {
  const { data } = await api.get<{ items: CourseCategory[] }>(
    '/academy/categories',
    { params: { includeInactive: includeInactive ? 'true' : 'false' } },
  );
  return data.items;
}

export async function createCategory(payload: Record<string, unknown>) {
  const { data } = await api.post<CourseCategory>(
    '/academy/categories',
    payload,
  );
  return data;
}

export async function updateCategory(
  id: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.patch<CourseCategory>(
    `/academy/categories/${id}`,
    payload,
  );
  return data;
}

export async function fetchInstructors(
  params: { search?: string; includeInactive?: boolean } = {},
) {
  const { data } = await api.get<{ items: Instructor[] }>(
    '/academy/instructors',
    {
      params: {
        ...(params.search ? { search: params.search } : {}),
        ...(params.includeInactive ? { includeInactive: 'true' } : {}),
      },
    },
  );
  return data.items;
}

export async function createInstructor(payload: Record<string, unknown>) {
  const { data } = await api.post<Instructor>(
    '/academy/instructors',
    payload,
  );
  return data;
}

export async function updateInstructor(
  id: string,
  payload: Record<string, unknown>,
) {
  const { data } = await api.patch<Instructor>(
    `/academy/instructors/${id}`,
    payload,
  );
  return data;
}

export async function fetchAttendanceSheet(batchId: string, date: string) {
  const { data } = await api.get<AttendanceSheet>('/academy/attendance', {
    params: { batchId, date },
  });
  return data;
}

export async function saveAttendance(payload: {
  batchId: string;
  sessionDate: string;
  records: Array<{
    enrollmentId: string;
    status: AttendanceStatus;
    note?: string | null;
  }>;
}) {
  const { data } = await api.post<{ saved: number; sessionDate: string }>(
    '/academy/attendance',
    payload,
  );
  return data;
}
