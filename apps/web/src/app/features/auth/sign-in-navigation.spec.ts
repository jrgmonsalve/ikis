import { resolvePostSignInUrl } from './sign-in.component';

describe('resolvePostSignInUrl', () => {
  it('preserves an internal invitation URL', () => {
    expect(
      resolvePostSignInUrl(
        '/accept-invitation?familyId=family-a&invitationId=invitation-a',
      ),
    ).toBe('/accept-invitation?familyId=family-a&invitationId=invitation-a');
  });

  it('uses family selection for missing or unsafe URLs', () => {
    expect(resolvePostSignInUrl(null)).toBe('/select-family');
    expect(resolvePostSignInUrl('https://example.com')).toBe('/select-family');
    expect(resolvePostSignInUrl('//example.com')).toBe('/select-family');
    expect(resolvePostSignInUrl('/sign-in')).toBe('/select-family');
  });
});
