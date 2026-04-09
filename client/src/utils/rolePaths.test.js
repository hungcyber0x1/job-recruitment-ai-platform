import { describe, it, expect } from 'vitest';
import { getDashboardPath, isPathAllowedForRole } from './rolePaths.js';

describe('rolePaths', () => {
  it('getDashboardPath maps each role', () => {
    expect(getDashboardPath('admin')).toBe('/admin/dashboard');
    expect(getDashboardPath('employer')).toBe('/employer/dashboard');
    expect(getDashboardPath('candidate')).toBe('/candidate/dashboard');
    expect(getDashboardPath('unknown')).toBe('/');
  });

  it('isPathAllowedForRole restricts role prefixes', () => {
    expect(isPathAllowedForRole('candidate', '/candidate/jobs')).toBe(true);
    expect(isPathAllowedForRole('candidate', '/employer/jobs')).toBe(false);
    expect(isPathAllowedForRole('employer', '/jobs')).toBe(true);
    expect(isPathAllowedForRole('admin', '/admin/users')).toBe(true);
    expect(isPathAllowedForRole('candidate', '/admin/users')).toBe(false);
  });
});
