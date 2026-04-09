/**
 * Đọc biến môi trường dạng URL/base: trim và bỏ slash cuối.
 * @param {string} envKey
 * @param {string} [fallback='']
 * @returns {string}
 */
function envBaseUrl(envKey, fallback = '') {
  return String(process.env[envKey] ?? fallback)
    .trim()
    .replace(/\/+$/, '');
}

/**
 * Giống envBaseUrl nhưng trả về undefined khi sau trim không còn ký tự (dùng cho URL tùy chọn).
 * @param {string} envKey
 * @returns {string|undefined}
 */
function optionalEnvUrl(envKey) {
  const s = envBaseUrl(envKey, '');
  return s || undefined;
}

module.exports = { envBaseUrl, optionalEnvUrl };
