function buildFullName(user = {}) {
  const firstName = String(user.first_name ?? '').trim();
  const lastName = String(user.last_name ?? '').trim();
  return [firstName, lastName].filter(Boolean).join(' ').trim() || null;
}

function stripSensitiveUserFields(user = {}) {
  const { password: _password, password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function toUserContract(user = {}) {
  const hasPassword = !!(user.password || user.password_hash);
  const safeUser = stripSensitiveUserFields(user);
  const fullName = buildFullName(safeUser);

  return {
    ...safeUser,
    full_name: fullName,
    name: fullName,
    has_password: hasPassword,
    has_oauth: !!(safeUser.oauth_provider && safeUser.oauth_provider_id),
  };
}

module.exports = {
  buildFullName,
  stripSensitiveUserFields,
  toUserContract,
};
