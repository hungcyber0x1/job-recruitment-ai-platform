import { describe, expect, it } from 'vitest';

import { extractAuthResponse, shouldPersistAuthSession } from './authSession';

describe('shouldPersistAuthSession', () => {
  it('persists candidate sessions after registration when token is present', () => {
    expect(
      shouldPersistAuthSession(
        {
          token: 'jwt-token',
          data: { role: 'candidate', status: 'active' },
        },
        'register'
      )
    ).toBe(true);
  });

  it('does not persist pending recruiter sessions after registration', () => {
    expect(
      shouldPersistAuthSession(
        {
          token: 'jwt-token',
          data: { role: 'recruiter', status: 'pending' },
        },
        'register'
      )
    ).toBe(false);
  });

  it('does not persist pending_verification recruiter sessions after registration', () => {
    expect(
      shouldPersistAuthSession(
        {
          token: 'jwt-token',
          data: { role: 'recruiter', status: 'pending_verification' },
        },
        'register'
      )
    ).toBe(false);
  });

  it('does not persist sessions when the backend marks the account as awaiting approval', () => {
    expect(
      shouldPersistAuthSession(
        {
          token: 'jwt-token',
          requires_approval: true,
          data: { role: 'recruiter', status: 'pending' },
        },
        'register'
      )
    ).toBe(false);
  });

  it('requires both role and token for login session persistence', () => {
    expect(shouldPersistAuthSession({ data: { role: 'candidate' } }, 'login')).toBe(false);
  });

  it('does not persist pending recruiter sessions after login either', () => {
    expect(
      shouldPersistAuthSession(
        {
          token: 'jwt-token',
          data: { role: 'recruiter', status: 'pending_verification' },
        },
        'login'
      )
    ).toBe(false);
  });

  it('extracts auth data from nested auth responses', () => {
    expect(
      extractAuthResponse({
        data: {
          role: 'recruiter',
          status: 'pending',
          token: 'jwt-token',
          requires_approval: true,
        },
      })
    ).toEqual({
      token: 'jwt-token',
      requiresApproval: true,
      userData: {
        role: 'recruiter',
        status: 'pending',
      },
      role: 'recruiter',
      status: 'pending',
    });
  });
});
