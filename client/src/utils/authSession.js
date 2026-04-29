function normalizeRole(role) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return normalizedRole === 'employer' ? 'recruiter' : normalizedRole;
}

function getNonEmptyToken(...candidates) {
  return (
    candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0) ||
    null
  );
}

function isRecruiterAwaitingApproval(role, status) {
  return (
    normalizeRole(role) === 'recruiter'
    && ['pending', 'pending_verification'].includes(String(status ?? '').trim().toLowerCase())
  );
}

export function extractAuthResponse(body = {}) {
  const rawData = body?.data && typeof body.data === 'object' ? body.data : null;
  const token = getNonEmptyToken(body?.token, rawData?.token);
  const requiresApproval =
    body?.requires_approval === true || rawData?.requires_approval === true;
  const userData = rawData ? { ...rawData } : null;

  if (userData) {
    delete userData.token;
    delete userData.requires_approval;
    userData.role = normalizeRole(userData.role);
  }

  return {
    token,
    requiresApproval,
    userData,
    role: normalizeRole(userData?.role),
    status: String(userData?.status ?? '')
      .trim()
      .toLowerCase(),
  };
}

export function shouldPersistAuthSession(body) {
  const { token, requiresApproval, role, status } = extractAuthResponse(body);

  if (!role || !token || requiresApproval) {
    return false;
  }

  if (isRecruiterAwaitingApproval(role, status)) {
    return false;
  }

  return true;
}
