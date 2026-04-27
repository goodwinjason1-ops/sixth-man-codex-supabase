import { test, expect } from '@playwright/test';
import {
  buildShotChartAnalytics,
  classifyShotZone,
  normalizeShotEvent,
  normalizeShotEvents,
  toParentSafeShotChartExport
} from '../src/services/shotChartService.js';

const rawShotEvents = [
  {
    id: 'shot-rim-1',
    playerId: 'player-1',
    playerName: 'Ava Green',
    teamId: 'team-1',
    teamName: 'U12 Green',
    gameId: 'game-1',
    gameDate: '2026-04-01T10:00:00.000Z',
    period: 1,
    clock: '07:32',
    x: 50,
    y: 8,
    made: true,
    value: 2,
    shotType: 'layup',
    source: 'coach_tap',
    confidence: 0.98
  },
  {
    id: 'shot-wing-1',
    playerId: 'player-1',
    playerName: 'Ava Green',
    teamId: 'team-1',
    teamName: 'U12 Green',
    gameId: 'game-1',
    gameDate: '2026-04-01T10:00:00.000Z',
    period: 2,
    clock: '03:12',
    coordinates: { x: 72, y: 58 },
    outcome: 'missed',
    points: 3,
    type: 'three point jumper',
    source: 'video_ai',
    confidence: 0.76,
    internalAnalysis: { contest: 'late closeout' }
  },
  {
    id: 'shot-corner-1',
    player_id: 'player-2',
    playerName: 'Mia Chen',
    team_id: 'team-1',
    teamName: 'U12 Green',
    game_id: 'game-2',
    date: '2026-04-08T10:00:00.000Z',
    quarter: 'Q3',
    x: 5,
    y: 16,
    result: 'make',
    points: 3,
    shotType: 'corner three',
    source: 'coach_tap',
    confidence: '0.91',
    privateNotes: 'Release cue from coach'
  },
  {
    id: 'shot-mid-1',
    playerId: 'player-3',
    playerName: 'Sam Lee',
    teamId: 'team-2',
    teamName: 'U14 Gold',
    gameId: 'game-3',
    gameDate: '2026-04-08T10:00:00.000Z',
    period: 4,
    x: 68,
    y: 30,
    made: false,
    value: 2,
    shotType: 'pull up',
    source: 'manual_entry',
    confidence: 0.88
  },
  {
    id: 'shot-low-confidence',
    playerId: 'player-3',
    playerName: 'Sam Lee',
    teamId: 'team-2',
    teamName: 'U14 Gold',
    gameId: 'game-4',
    gameDate: '2026-04-15T10:00:00.000Z',
    period: 1,
    x: 44,
    y: 24,
    made: true,
    value: 2,
    shotType: 'paint touch',
    source: 'video_ai',
    confidence: 0.42,
    internalNotes: 'Detector uncertain; verify from film',
    analysis: { trackingQuality: 'low' }
  }
];

test.describe('shot chart service', () => {
  test('normalizes mixed shot event shapes and classifies court zones', () => {
    const shot = normalizeShotEvent(rawShotEvents[2]);

    expect(shot).toMatchObject({
      id: 'shot-corner-1',
      playerId: 'player-2',
      playerName: 'Mia Chen',
      teamId: 'team-1',
      teamName: 'U12 Green',
      gameId: 'game-2',
      gameDate: '2026-04-08T10:00:00.000Z',
      period: 'Q3',
      x: 5,
      y: 16,
      outcome: 'made',
      made: true,
      value: 3,
      shotType: 'corner_three',
      source: 'coach_tap',
      confidence: 0.91
    });
    expect(shot.zone).toMatchObject({
      id: 'left_corner_three',
      label: 'Left Corner 3',
      family: 'three'
    });
    expect(shot.privateNotes).toBe('Release cue from coach');

    expect(classifyShotZone({ x: 50, y: 8, value: 2, shotType: 'layup' })).toMatchObject({
      id: 'restricted_area',
      family: 'paint'
    });
    expect(classifyShotZone({ x: 68, y: 30, value: 2, shotType: 'pull_up' })).toMatchObject({
      id: 'mid_range',
      family: 'midrange'
    });
  });

  test('builds player, team, zone, and daily trend summaries from normalized shots', () => {
    const analytics = buildShotChartAnalytics({
      shotEvents: rawShotEvents,
      generatedAt: '2026-04-26T00:00:00.000Z',
      trendGranularity: 'day'
    });

    expect(analytics.meta).toMatchObject({
      reportType: 'shot_chart_analytics',
      generatedAt: '2026-04-26T00:00:00.000Z',
      totalEvents: 5,
      includedEvents: 5
    });
    expect(analytics.overview).toMatchObject({
      attempts: 5,
      makes: 3,
      misses: 2,
      points: 7,
      fieldGoalPct: 60,
      effectiveFieldGoalPct: 70,
      pointsPerShot: 1.4
    });

    expect(analytics.players).toEqual(expect.arrayContaining([
      expect.objectContaining({
        playerId: 'player-1',
        playerName: 'Ava Green',
        attempts: 2,
        makes: 1,
        points: 2,
        fieldGoalPct: 50
      }),
      expect.objectContaining({
        playerId: 'player-2',
        playerName: 'Mia Chen',
        attempts: 1,
        makes: 1,
        points: 3,
        effectiveFieldGoalPct: 150
      })
    ]));
    expect(analytics.teams).toEqual(expect.arrayContaining([
      expect.objectContaining({
        teamId: 'team-1',
        teamName: 'U12 Green',
        attempts: 3,
        makes: 2,
        points: 5
      }),
      expect.objectContaining({
        teamId: 'team-2',
        teamName: 'U14 Gold',
        attempts: 2,
        makes: 1,
        points: 2
      })
    ]));
    expect(analytics.zones).toEqual(expect.arrayContaining([
      expect.objectContaining({ zoneId: 'restricted_area', attempts: 1, makes: 1, points: 2 }),
      expect.objectContaining({ zoneId: 'left_corner_three', attempts: 1, makes: 1, points: 3 })
    ]));
    expect(analytics.trends).toEqual([
      expect.objectContaining({ period: '2026-04-01', attempts: 2, makes: 1, points: 2 }),
      expect.objectContaining({ period: '2026-04-08', attempts: 2, makes: 1, points: 3 }),
      expect.objectContaining({ period: '2026-04-15', attempts: 1, makes: 1, points: 2 })
    ]);
  });

  test('creates a parent/player-safe export without low-confidence or private analysis details', () => {
    const analytics = buildShotChartAnalytics({
      shotEvents: normalizeShotEvents(rawShotEvents),
      generatedAt: '2026-04-26T00:00:00.000Z'
    });

    const safeExport = toParentSafeShotChartExport(analytics, {
      minConfidence: 0.7,
      generatedAt: '2026-04-26T00:00:00.000Z'
    });

    expect(safeExport.meta).toMatchObject({
      reportType: 'shot_chart_parent_safe_export',
      generatedAt: '2026-04-26T00:00:00.000Z',
      privacyLevel: 'parent_player_safe',
      minConfidence: 0.7
    });
    expect(safeExport.privacy).toMatchObject({
      suppressedLowConfidenceEvents: 1
    });
    expect(safeExport.events.map((event) => event.id)).toEqual([
      'shot-rim-1',
      'shot-wing-1',
      'shot-corner-1',
      'shot-mid-1'
    ]);
    expect(safeExport.overview).toMatchObject({
      attempts: 4,
      makes: 2,
      points: 5
    });

    const serialized = JSON.stringify(safeExport);
    expect(serialized).not.toContain('"privateNotes":');
    expect(serialized).not.toContain('"internalAnalysis":');
    expect(serialized).not.toContain('"internalNotes":');
    expect(serialized).not.toContain('"analysis":');
    expect(serialized).not.toContain('video_ai');
    expect(serialized).not.toContain('"confidence":');
    expect(serialized).not.toContain('"source":');
    expect(safeExport.privacy.excludedFields).toEqual(expect.arrayContaining([
      'confidence',
      'source',
      'privateNotes',
      'internalNotes',
      'internalAnalysis',
      'analysis',
      'raw'
    ]));
  });
});
