const CompanyRepository = require('../models/Company');
const {
  CompanyMemberRepository,
  COMPANY_ROLES,
  PERMISSION_FIELDS,
} = require('../models/CompanyMember');

const ROLE_PRIORITY = {
  [COMPANY_ROLES.OWNER]: 3,
  [COMPANY_ROLES.ADMIN]: 2,
  [COMPANY_ROLES.RECRUITER]: 1,
};

function parseCompanyId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractUserId(actor) {
  if (actor && typeof actor === 'object') {
    return parseCompanyId(actor.id);
  }

  return parseCompanyId(actor);
}

function buildOwnerPermissions() {
  return PERMISSION_FIELDS.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {});
}

function normalizeMembershipPermissions(source = {}) {
  return PERMISSION_FIELDS.reduce((acc, field) => {
    acc[field] = Boolean(source[field]);
    return acc;
  }, {});
}

function pickPrimaryMembership(memberships = []) {
  if (!Array.isArray(memberships) || memberships.length === 0) {
    return null;
  }

  return [...memberships].sort((left, right) => {
    const roleDelta = (ROLE_PRIORITY[right.role] || 0) - (ROLE_PRIORITY[left.role] || 0);
    if (roleDelta !== 0) return roleDelta;

    const manageDelta = Number(Boolean(right.can_manage_applications)) - Number(Boolean(left.can_manage_applications));
    if (manageDelta !== 0) return manageDelta;

    const editDelta = Number(Boolean(right.can_edit_job)) - Number(Boolean(left.can_edit_job));
    if (editDelta !== 0) return editDelta;

    return 0;
  })[0];
}

async function resolveRecruiterCompanyContext(actor) {
  const userId = extractUserId(actor);
  if (!userId) return null;

  const cachedCompanyId = actor && typeof actor === 'object'
    ? parseCompanyId(actor.company_id || actor.companyId)
    : null;

  if (cachedCompanyId) {
    const company = await CompanyRepository.findById(cachedCompanyId);
    if (company) {
      const cachedRole = String(actor.company_role || '').trim().toLowerCase();
      const permissions = cachedRole === COMPANY_ROLES.OWNER
        ? buildOwnerPermissions()
        : normalizeMembershipPermissions(actor.company_permissions || actor);

      return {
        ...company,
        id: company.id,
        company_id: company.id,
        companyId: company.id,
        company_role: cachedRole || (Number(company.user_id) === userId ? COMPANY_ROLES.OWNER : null),
        company_permissions: permissions,
      };
    }
  }

  const ownedCompany = await CompanyRepository.findByUserId(userId);
  if (ownedCompany) {
    return {
      ...ownedCompany,
      id: ownedCompany.id,
      company_id: ownedCompany.id,
      companyId: ownedCompany.id,
      company_role: COMPANY_ROLES.OWNER,
      company_permissions: buildOwnerPermissions(),
    };
  }

  let memberships = [];
  try {
    memberships = await CompanyMemberRepository.findByUser(userId);
  } catch (error) {
    if (error?.code !== 'ER_NO_SUCH_TABLE') {
      throw error;
    }
  }

  const membership = pickPrimaryMembership(memberships);
  if (!membership) {
    return null;
  }

  const companyId = parseCompanyId(membership.company_id);
  const company = companyId ? await CompanyRepository.findById(companyId) : null;

  return {
    ...(company || {}),
    id: companyId,
    company_id: companyId,
    companyId: companyId,
    company_name: company?.company_name || membership.company_name || null,
    company_logo: company?.company_logo || membership.company_logo || null,
    company_role: membership.role || COMPANY_ROLES.RECRUITER,
    company_permissions: normalizeMembershipPermissions(membership),
    membership,
  };
}

function attachCompanyContextToUser(user, companyContext) {
  if (!user || !companyContext) {
    return user;
  }

  return {
    ...user,
    company_id: companyContext.company_id,
    companyId: companyContext.companyId,
    company_name: companyContext.company_name || user.company_name || null,
    company_logo: companyContext.company_logo || user.company_logo || null,
    company_role: companyContext.company_role || user.company_role || null,
    company_permissions: companyContext.company_permissions || user.company_permissions || {},
  };
}

function isCompanyAdmin(user) {
  return user?.company_role === COMPANY_ROLES.OWNER || user?.company_role === COMPANY_ROLES.ADMIN;
}

function hasCompanyPermission(user, permission) {
  if (!permission) return false;
  if (isCompanyAdmin(user)) return true;
  return Boolean(user?.company_permissions?.[permission] || user?.[permission]);
}

module.exports = {
  attachCompanyContextToUser,
  hasCompanyPermission,
  isCompanyAdmin,
  resolveRecruiterCompanyContext,
};
