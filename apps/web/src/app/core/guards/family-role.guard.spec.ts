import { isRoleAllowed } from './family-role.guard';

describe('isRoleAllowed', () => {
  it('allows owners and admins to manage financial setup', () => {
    const allowedRoles = ['owner', 'admin'] as const;

    expect(isRoleAllowed('owner', allowedRoles)).toBe(true);
    expect(isRoleAllowed('admin', allowedRoles)).toBe(true);
    expect(isRoleAllowed('member', allowedRoles)).toBe(false);
  });

  it('reserves invitations for owners', () => {
    expect(isRoleAllowed('owner', ['owner'])).toBe(true);
    expect(isRoleAllowed('admin', ['owner'])).toBe(false);
    expect(isRoleAllowed('member', ['owner'])).toBe(false);
  });
});
