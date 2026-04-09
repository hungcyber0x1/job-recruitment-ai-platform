/**
 * ID tạm cho phần tử chỉ tồn tại phía client (toast, tin chat optimistics).
 * Tránh trùng khi nhiều sự kiện trong cùng một ms.
 */
export function createClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
