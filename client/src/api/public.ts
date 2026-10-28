import axios from 'axios';
import { API_BASE } from './client';
import type {
  InquiryPayload,
  InquiryResponse,
  PublicCourse,
  PublicCourseDetail,
  PublicInstructor,
} from '../types/public';

export const publicApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export async function fetchPublicCourses(): Promise<PublicCourse[]> {
  const { data } = await publicApi.get<{ items: PublicCourse[] }>(
    '/public/courses',
  );
  return data.items;
}

export async function fetchPublicInstructors(): Promise<PublicInstructor[]> {
  const { data } = await publicApi.get<{ items: PublicInstructor[] }>(
    '/public/instructors',
  );
  return data.items;
}

export async function fetchPublicCourse(
  slug: string,
): Promise<PublicCourseDetail> {
  const { data } = await publicApi.get<PublicCourseDetail>(
    `/public/courses/${encodeURIComponent(slug)}`,
  );
  return data;
}

export async function submitInquiry(
  payload: InquiryPayload,
): Promise<InquiryResponse> {
  const { data } = await publicApi.post<InquiryResponse>(
    '/public/inquiries',
    payload,
  );
  return data;
}
