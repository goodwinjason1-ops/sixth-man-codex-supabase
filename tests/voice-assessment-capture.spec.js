import { test, expect } from '@playwright/test';
import { installE2EMock } from './e2eFixtures.js';

test('match assessment voice recording shows live capture feedback', async ({ page }) => {
  await installE2EMock(page, 'coach');
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop() {} }]
        })
      }
    });

    window.MediaRecorder = class MockMediaRecorder {
      constructor() {
        this.mimeType = 'audio/webm';
        this.state = 'inactive';
      }

      start() {
        this.state = 'recording';
        this.ondataavailable?.({
          data: new Blob(['voice note audio'], { type: 'audio/webm' })
        });
      }

      stop() {
        this.state = 'inactive';
        this.onstop?.();
      }
    };
  });

  await page.goto('/coach/match-assessment');
  await expect(page.getByText('Voice Player Ratings')).toBeVisible({ timeout: 20000 });

  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Recording 00:/ })).toBeVisible();
  await expect(page.getByText('Audio is being captured')).toBeVisible();

  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText('Recording saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Transcribe' })).toBeEnabled();
});
