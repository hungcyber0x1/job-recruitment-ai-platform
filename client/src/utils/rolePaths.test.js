import { describe, it, expect } from 'vitest';
import {
  getDashboardPath,
  getProfilePath,
  getSettingsPath,
  isPathAllowedForRole,
  normalizeAuthRole,
} from './rolePaths.js';

describe('rolePaths', () => {
  it('getDashboardPath maps each role', () => {
    expect(getDashboardPath('admin')).toBe('/admin/dashboard');
    expect(getDashboardPath('recruiter')).toBe('/employer/dashboard');
    expect(getDashboardPath('employer')).toBe('/employer/dashboard');
    expect(getDashboardPath(' Employer ')).toBe('/employer/dashboard');
    expect(getDashboardPath('candidate')).toBe('/candidate/dashboard');
    expect(getDashboardPath('unknown')).toBe('/');
  });

  it('maps profile and settings paths for each role', () => {
    expect(getProfilePath('admin')).toBe('/admin/profile');
    expect(getProfilePath('recruiter')).toBe('/employer/profile');
    expect(getProfilePath('employer')).toBe('/employer/profile');
    expect(getProfilePath('candidate')).toBe('/candidate/profile');
    expect(getProfilePath('unknown')).toBe('/');

    expect(getSettingsPath('admin')).toBe('/admin/settings');
    expect(getSettingsPath('recruiter')).toBe('/employer/settings');
    expect(getSettingsPath('employer')).toBe('/employer/settings');
    expect(getSettingsPath('candidate')).toBe('/candidate/settings');
    expect(getSettingsPath('unknown')).toBe('/');
  });

  it('normalizes legacy employer role to recruiter', () => {
    expect(normalizeAuthRole('employer')).toBe('recruiter');
    expect(normalizeAuthRole('RECRUITER')).toBe('recruiter');
  });

  it('isPathAllowedForRole restricts role prefixes', () => {
    expect(isPathAllowedForRole('candidate', '/candidate/jobs')).toBe(true);
    expect(isPathAllowedForRole('candidate', '/employer/jobs')).toBe(false);
    expect(isPathAllowedForRole('employer', '/jobs')).toBe(true);
    expect(isPathAllowedForRole('admin', '/admin/users')).toBe(true);
    expect(isPathAllowedForRole('candidate', '/admin/users')).toBe(false);
  });
});
