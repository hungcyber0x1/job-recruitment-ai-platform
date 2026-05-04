import { describe, it, expect } from 'vitest';
import {
  API_BASE_URL,
  API_ORIGIN,
  API_TIMEOUT,
  API_TIMEOUT_AI_CV_MS,
  SOCKET_ORIGIN,
  resolveApiResourceUrl,
  resolveBrowserApiUrl,
} from './index.js';

describe('app config', () => {
  it('exports stable API settings', () => {
    expect(API_TIMEOUT).toBe(30000);
    expect(API_TIMEOUT_AI_CV_MS).toBe(180000);
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });

  it('resolveApiResourceUrl joins path without duplicating slashes', () => {
    const u = resolveApiResourceUrl('auth/oauth/status');
    expect(u).toContain('auth/oauth/status');
  });

  it('resolveBrowserApiUrl returns a string (absolute or path)', () => {
    const u = resolveBrowserApiUrl('auth/oauth/status');
    expect(typeof u).toBe('string');
    expect(u.length).toBeGreaterThan(0);
  });

  it('defaults Socket.IO origin to the API gateway origin', () => {
    expect(SOCKET_ORIGIN).toBe(import.meta.env.VITE_SOCKET_ORIGIN || API_ORIGIN);
  });

  it('keeps Socket.IO away from the Vite origin when an explicit socket origin is configured', () => {
    if (!import.meta.env.VITE_SOCKET_ORIGIN) return;

    expect(SOCKET_ORIGIN).toBe(import.meta.env.VITE_SOCKET_ORIGIN);
    expect(SOCKET_ORIGIN).not.toBe('http://127.0.0.1:3000');
    expect(SOCKET_ORIGIN).not.toBe('http://localhost:3000');
  });
});
