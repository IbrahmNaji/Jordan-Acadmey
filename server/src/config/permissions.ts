export const PERMISSIONS = [
  'leads:read',
  'leads:write',
  'leads:assign',
  'enrollments:read',
  'enrollments:write',
  'enrollments:manage',
  'payments:write',
  'campaigns:read',
  'campaigns:write',
  'reports:read',
  'users:read',
  'users:write',
  'audit:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type StaffRole = 'ADMIN' | 'MANAGER' | 'AGENT';

export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  MANAGER: [
    'leads:read',
    'leads:write',
    'leads:assign',
    'enrollments:read',
    'enrollments:write',
    'enrollments:manage',
    'payments:write',
    'campaigns:read',
    'campaigns:write',
    'reports:read',
    'users:read',
  ],
  AGENT: [
    'leads:read',
    'leads:write',
    'enrollments:read',
    'enrollments:write',
    'payments:write',
    'campaigns:read',
  ],
};

export function hasPermission(role: StaffRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}
