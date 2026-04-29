import { test, expect } from '@playwright/test';
import {
  AUTH_SESSION_MAX_AGE_MS,
  shouldExpireAuthSession
} from '../src/services/authSessionPolicy.js';

test.describe('auth session policy', () => {
  test('expires sessions older than the configured maximum age', () => {
    const now = Date.parse('2026-04-29T10:00:00.000Z');

    expect(
      shouldExpireAuthSession({
        now,
        startedAt: now - AUTH_SESSION_MAX_AGE_MS - 1,
        lastActiveAt: now - 60_000
      })
    ).toBe(true);
  });

  test('keeps fresh active sessions signed in', () => {
    const now = Date.parse('2026-04-29T10:00:00.000Z');

    expect(
      shouldExpireAuthSession({
        now,
        startedAt: now - 60_000,
        lastActiveAt: now - 30_000
      })
    ).toBe(false);
  });
});
