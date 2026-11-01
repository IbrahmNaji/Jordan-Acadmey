import api, { API_BASE } from './client';

export type ImagePurpose = 'vehicles' | 'instructors' | 'parts';
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 5 * 1024 * 1024;

export async function uploadImage(file: File, purpose: ImagePurpose) {
  if (!allowedTypes.has(file.type)) throw new Error('اختر صورة بصيغة JPG أو PNG أو WebP.');
  if (file.size > maxBytes) throw new Error('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.');
  const path = `/media/${purpose}`;
  const { data } = await api.post<{ url: string }>(path, file, {
    headers: { 'Content-Type': file.type },
    transformRequest: [(value) => value],
  });
  return data.url as string;
}

export function resolveMediaUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/media/')) return `${API_BASE.replace(/\/$/, '')}${path}`;
  return path.startsWith('/') ? path : `/${path}`;
}
