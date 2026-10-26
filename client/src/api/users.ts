import api from './client';
import type { Role } from '../types';

export interface DirectoryUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  phone?: string | null;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  password: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string | null;
  role?: Role;
  isActive?: boolean;
}

export async function fetchUsers(includeInactive = false): Promise<DirectoryUser[]> {
  const { data } = await api.get<DirectoryUser[]>('/users', {
    params: includeInactive ? { includeInactive: 'true' } : undefined,
  });
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<DirectoryUser> {
  const { data } = await api.post<DirectoryUser>('/users', payload);
  return data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<DirectoryUser> {
  const { data } = await api.patch<DirectoryUser>(`/users/${id}`, payload);
  return data;
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  await api.post(`/users/${id}/password`, { password });
}
