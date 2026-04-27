import { test, expect } from '@playwright/test';
import {
  FAIR_PLAY_REASON_CODES,
  applyFairPlayContextToRecord,
  buildFairPlaySummaryFlags,
  createParentSafeContextSummary,
  normalizeFairPlayContext,
  shouldSuppressFairnessAlert
} from '../src/services/fairPlayService.js';

const expectedReasonCodes = [
  'absent',
  'injury',
  'late_arrival',
  'disciplinary',
  'development_focus',
  'foul_trouble',
  'player_request',
  'finals_policy',
  'coach_discretion'
];

test.describe('fair play service', () => {
  test('normalizes supported context codes without carrying private notes', () => {
    const context = normalizeFairPlayContext({
      reasonCode: 'Late arrival',
      coachNotes: 'Arrived after the first quarter because of a private family issue.',
      privateNote: 'Do not show this to families.',
      publicNote: 'Traffic delay',
      arrivedAt: 'Q2',
      expectedMinutes: 18
    });

    expect(FAIR_PLAY_REASON_CODES).toEqual(expectedReasonCodes);
    expect(context).toMatchObject({
      code: 'late_arrival',
      label: 'Late arrival',
      suppressesAlert: true,
      parentVisible: true,
      details: {
        arrivedAt: 'Q2',
        expectedMinutes: 18
      }
    });
    expect(JSON.stringify(context)).not.toContain('private family issue');
    expect(JSON.stringify(context)).not.toContain('Do not show');
    expect(JSON.stringify(context)).not.toContain('Traffic delay');
  });

  test('applies normalized context to a playing time record without mutation', () => {
    const record = {
      id: 'game-1',
      teamId: 'team-1',
      teamName: 'U12 Green',
      playerStats: {
        'player-1': { name: 'Ava', totalSeconds: 240 },
        'player-2': { name: 'Mia', totalSeconds: 1200 }
      }
    };

    const enriched = applyFairPlayContextToRecord(record, {
      'player-1': {
        reasonCode: 'injury',
        coachNotes: 'Rolled ankle details for coaches only.',
        expectedMinutes: 20
      }
    });

    expect(record.playerStats['player-1']).not.toHaveProperty('fairPlayContext');
    expect(enriched).not.toBe(record);
    expect(enriched.playerStats).not.toBe(record.playerStats);
    expect(enriched.fairPlayContexts['player-1']).toMatchObject({
      code: 'injury',
      label: 'Injury',
      suppressesAlert: true
    });
    expect(enriched.playerStats['player-1'].fairPlayContext).toEqual(enriched.fairPlayContexts['player-1']);
    expect(enriched.playerStats['player-2']).not.toHaveProperty('fairPlayContext');
    expect(JSON.stringify(enriched)).not.toContain('Rolled ankle');
  });

  test('suppresses short-minute alerts for concrete context but not coach discretion alone', () => {
    expect(shouldSuppressFairnessAlert(
      { playerId: 'player-1', type: 'short_minutes' },
      normalizeFairPlayContext({ reasonCode: 'foul_trouble' })
    )).toBe(true);

    expect(shouldSuppressFairnessAlert(
      { playerId: 'player-1', type: 'short_minutes' },
      normalizeFairPlayContext({ reasonCode: 'coach_discretion' })
    )).toBe(false);

    expect(shouldSuppressFairnessAlert(
      { playerId: 'player-1', type: 'over_minutes' },
      normalizeFairPlayContext({ reasonCode: 'injury' })
    )).toBe(false);
  });

  test('builds admin and team flags for explained and unresolved short minutes', () => {
    const records = [
      applyFairPlayContextToRecord({
        id: 'game-1',
        teamId: 'team-1',
        teamName: 'U12 Green',
        playerStats: {
          'player-1': { name: 'Ava', totalSeconds: 240 },
          'player-2': { name: 'Mia', totalSeconds: 1200 }
        }
      }, {
        'player-1': { reasonCode: 'injury' }
      }),
      {
        id: 'game-2',
        teamId: 'team-1',
        teamName: 'U12 Green',
        playerStats: {
          'player-3': { name: 'Sam', totalSeconds: 180 },
          'player-4': { name: 'Noah', totalSeconds: 1080 }
        }
      }
    ];

    const summary = buildFairPlaySummaryFlags(records);

    expect(summary).toMatchObject({
      recordCount: 2,
      totalContextCount: 1,
      totalShortMinuteAlerts: 2,
      suppressedAlertCount: 1,
      unresolvedShortMinuteCount: 1,
      reasonCounts: {
        injury: 1
      },
      flags: ['context_explained_short_minutes', 'unresolved_short_minutes']
    });
    expect(summary.teams).toEqual([
      expect.objectContaining({
        teamId: 'team-1',
        teamName: 'U12 Green',
        contextCount: 1,
        shortMinuteAlerts: 2,
        suppressedAlertCount: 1,
        unresolvedShortMinuteCount: 1,
        flags: ['context_explained_short_minutes', 'unresolved_short_minutes']
      })
    ]);
  });

  test('creates parent-safe summaries without exposing coach notes', () => {
    const summary = createParentSafeContextSummary({
      reasonCode: 'disciplinary',
      coachNotes: 'Missed training and breached team rules.',
      privateNote: 'Escalated to committee.'
    });

    expect(summary).toEqual({
      code: 'disciplinary',
      label: 'Team standards',
      summary: 'Minutes were adjusted for team standards or match-day context.',
      parentVisible: true
    });
    expect(JSON.stringify(summary)).not.toContain('Missed training');
    expect(JSON.stringify(summary)).not.toContain('committee');
  });
});
