import api from './client';
import type { Role } from '../types';

export interface DirectoryUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export async function fetchUsers(includeInactive = false): Promise<DirectoryUser[]> {
  const { data } = await api.get<DirectoryUser[]>('/users', {
    params: includeInactive ? { includeInactive: 'true' } : undefined,
  });
  return data;
}
