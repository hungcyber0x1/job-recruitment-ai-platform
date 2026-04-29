export function getHttpStatus(error) {
  return Number(error?.response?.status || 0);
}

export function isHandledAuthError(error) {
  const status = getHttpStatus(error);
  return Boolean(error?._authHandled) || status === 401 || status === 403;
}
