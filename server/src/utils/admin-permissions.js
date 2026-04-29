const ADMIN_PERMISSIONS = Object.freeze({
  ALL: 'all',
  DASHBOARD: 'dashboard',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  USERS_DELETE: 'users:delete',
  ADMIN_PERMISSIONS: 'admin:permissions',
  COMPANIES_MANAGE: 'companies:manage',
  COMPANIES_DELETE: 'companies:delete',
  JOBS_MANAGE: 'jobs:manage',
  JOBS_DELETE: 'jobs:delete',
  APPLICATIONS_MANAGE: 'applications:manage',
  CONTENT_MANAGE: 'content:manage',
  CONTENT_DELETE: 'content:delete',
  TAXONOMY_MANAGE: 'taxonomy:manage',
  AI_MANAGE: 'ai:manage',
  SUPPORT_MANAGE: 'support:manage',
  ANALYTICS_READ: 'analytics:read',
  AUDIT_READ: 'audit:read',
  SETTINGS_MANAGE: 'settings:manage',
  BACKUP_MANAGE: 'backup:manage',
});

const SUPER_ADMIN_EMAILS = new Set([
  'superadmin@hirebot.vn',
  'superadmin@hireai.vn',
]);

const ADMIN_PERMISSION_ALIASES = Object.freeze({
  users: [ADMIN_PERMISSIONS.USERS_READ, ADMIN_PERMISSIONS.USERS_MANAGE],
  jobs: [ADMIN_PERMISSIONS.JOBS_MANAGE],
  companies: [ADMIN_PERMISSIONS.COMPANIES_MANAGE],
  applications: [ADMIN_PERMISSIONS.APPLICATIONS_MANAGE],
  content: [ADMIN_PERMISSIONS.CONTENT_MANAGE],
  reports: [ADMIN_PERMISSIONS.ANALYTICS_READ],
  analytics: [ADMIN_PERMISSIONS.ANALYTICS_READ],
  support: [ADMIN_PERMISSIONS.SUPPORT_MANAGE],
  ai: [ADMIN_PERMISSIONS.AI_MANAGE],
  settings: [ADMIN_PERMISSIONS.SETTINGS_MANAGE],
  'users:read': [ADMIN_PERMISSIONS.USERS_READ],
});

const ADMIN_PERMISSION_IDS = Object.freeze(Object.values(ADMIN_PERMISSIONS));

const ADMIN_PRESETS = Object.freeze({
  super_admin: Object.freeze([ADMIN_PERMISSIONS.ALL]),
  admin: Object.freeze([
    ADMIN_PERMISSIONS.DASHBOARD,
    ADMIN_PERMISSIONS.USERS_READ,
    ADMIN_PERMISSIONS.USERS_MANAGE,
    ADMIN_PERMISSIONS.COMPANIES_MANAGE,
    ADMIN_PERMISSIONS.JOBS_MANAGE,
    ADMIN_PERMISSIONS.APPLICATIONS_MANAGE,
    ADMIN_PERMISSIONS.CONTENT_MANAGE,
    ADMIN_PERMISSIONS.TAXONOMY_MANAGE,
    ADMIN_PERMISSIONS.AI_MANAGE,
    ADMIN_PERMISSIONS.SUPPORT_MANAGE,
    ADMIN_PERMISSIONS.ANALYTICS_READ,
    ADMIN_PERMISSIONS.AUDIT_READ,
  ]),
});

function normalizeRole(role) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return normalizedRole === 'employer' ? 'recruiter' : normalizedRole;
}

function parsePermissionValue(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function normalizeAdminPermissions(value) {
  const result = new Set();
  parsePermissionValue(value).forEach((item) => {
    const key = String(item ?? '').trim().toLowerCase();
    if (!key) return;
    if (key === ADMIN_PERMISSIONS.ALL) {
      result.add(ADMIN_PERMISSIONS.ALL);
      return;
    }
    const aliases = ADMIN_PERMISSION_ALIASES[key];
    const expanded = aliases || [key];
    expanded.forEach((permission) => {
      if (ADMIN_PERMISSION_IDS.includes(permission)) {
        result.add(permission);
      }
    });
  });
  return Array.from(result);
}

function isSuperAdminIdentity(user = {}) {
  if (normalizeRole(user.role) !== 'admin') return false;
  const email = String(user.email ?? '').trim().toLowerCase();
  if (SUPER_ADMIN_EMAILS.has(email)) return true;
  return normalizeAdminPermissions(user.permissions).includes(ADMIN_PERMISSIONS.ALL);
}

function getEffectiveAdminPermissions(user = {}) {
  if (normalizeRole(user.role) !== 'admin') return [];
  if (isSuperAdminIdentity(user)) return [...ADMIN_PRESETS.super_admin];

  const explicitPermissions = normalizeAdminPermissions(user.permissions);
  if (explicitPermissions.length) return explicitPermissions;

  return [...ADMIN_PRESETS.admin];
}

function hasAdminPermission(user = {}, requiredPermission) {
  const permissions = getEffectiveAdminPermissions(user);
  if (permissions.includes(ADMIN_PERMISSIONS.ALL)) return true;
  const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  return required.some((permission) => permissions.includes(permission));
}

function getAdminPreset(user = {}) {
  if (normalizeRole(user.role) !== 'admin') return null;
  return isSuperAdminIdentity(user) ? 'super_admin' : 'admin';
}

module.exports = {
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_IDS,
  ADMIN_PRESETS,
  SUPER_ADMIN_EMAILS,
  getAdminPreset,
  getEffectiveAdminPermissions,
  hasAdminPermission,
  isSuperAdminIdentity,
  normalizeAdminPermissions,
};
