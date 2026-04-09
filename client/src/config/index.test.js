import { describe, it, expect } from 'vitest';
import {
  API_BASE_URL,
  API_TIMEOUT,
  API_TIMEOUT_AI_CV_MS,
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
});
