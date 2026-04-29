import { test, expect } from '@playwright/test';
import {
  appendVoiceTranscript,
  formatRecordingDuration
} from '../src/services/voiceTranscriptService.js';

test.describe('voice transcript helpers', () => {
  test('appends a new transcription without deleting the existing note', () => {
    expect(
      appendVoiceTranscript(
        'Ava defense four.',
        'Mia teamwork five.'
      )
    ).toBe('Ava defense four.\n\nMia teamwork five.');
  });

  test('does not duplicate the same transcription when retrying the same audio', () => {
    expect(
      appendVoiceTranscript(
        'Ava defense four.',
        'Ava defense four.'
      )
    ).toBe('Ava defense four.');
  });

  test('formats recording duration for a live recording indicator', () => {
    expect(formatRecordingDuration(0)).toBe('00:00');
    expect(formatRecordingDuration(67)).toBe('01:07');
  });
});
