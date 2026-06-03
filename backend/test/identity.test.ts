import { describe, expect, it } from 'vitest';
import { getUserId } from '../src/shared/identity.js';

describe('getUserId', () => {
  it('returns the JWT subject claim', () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-123'
            }
          }
        }
      }
    };

    expect(getUserId(event as never)).toBe('user-123');
  });
});
