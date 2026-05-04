import { describe, it, expect } from 'vitest';
import {
  getDashboardPath,
  getProfilePath,
  getSettingsPath,
  isPathAllowedForRole,
  normalizeAuthRole,
} from './rolePaths.js';

describe('rolePaths', () => {
  it('getDashboardPath maps each canonical role', () => {
    expect(getDashboardPath('admin')).toBe('/admin/dashboard');
    expect(getDashboardPath('recruiter')).toBe('/employer/dashboard');
    expect(getDashboardPath('candidate')).toBe('/candidate/dashboard');
    expect(getDashboardPath('unknown')).toBe('/');
  });

  it('maps profile and settings paths for each canonical role', () => {
    expect(getProfilePath('admin')).toBe('/admin/profile');
    expect(getProfilePath('recruiter')).toBe('/employer/profile');
    expect(getProfilePath('candidate')).toBe('/candidate/profile');
    expect(getProfilePath('unknown')).toBe('/');

    expect(getSettingsPath('admin')).toBe('/admin/settings');
    expect(getSettingsPath('recruiter')).toBe('/employer/settings');
    expect(getSettingsPath('candidate')).toBe('/candidate/settings');
    expect(getSettingsPath('unknown')).toBe('/');
  });

  it('normalizes canonical roles by trimming and lowercasing', () => {
    expect(normalizeAuthRole(' RECRUITER ')).toBe('recruiter');
    expect(normalizeAuthRole('CANDIDATE')).toBe('candidate');
  });

  it('isPathAllowedForRole restricts role prefixes', () => {
    expect(isPathAllowedForRole('candidate', '/candidate/jobs')).toBe(true);
    expect(isPathAllowedForRole('candidate', '/employer/jobs')).toBe(false);
    expect(isPathAllowedForRole('recruiter', '/jobs')).toBe(true);
    expect(isPathAllowedForRole('recruiter', '/employer/jobs')).toBe(true);
    expect(isPathAllowedForRole('admin', '/admin/users')).toBe(true);
    expect(isPathAllowedForRole('candidate', '/admin/users')).toBe(false);
  });
});
