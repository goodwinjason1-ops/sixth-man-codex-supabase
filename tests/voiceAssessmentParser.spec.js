import { test, expect } from '@playwright/test';
import {
  mergeVoiceMatchesIntoPlayerMetrics,
  mergeVoiceMatchesIntoTrainingMetrics,
  parseVoiceAssessmentTranscript
} from '../src/services/voiceAssessmentParser.js';

const players = [
  { id: 'p1', name: 'Ava Johnson', number: 7 },
  { id: 'p2', name: 'Mia Chen', number: 9 },
  { id: 'p3', name: 'Sam Parker', playerNumber: 12 }
];

const metrics = [
  { id: 'teamWork', name: 'Team Work' },
  { id: 'defense', name: 'Defense' },
  { id: 'shotSelection', name: 'Shot Selection' },
  { id: 'ballMovement', name: 'Ball Movement' }
];

test.describe('voice assessment parser', () => {
  test('maps spoken player names, metric aliases, and scores', () => {
    const result = parseVoiceAssessmentTranscript({
      transcript: 'Ava defense four and shot selection three. Mia teamwork five. number 12 ball movement 2.',
      players,
      metrics
    });

    expect(result.warnings).toEqual([]);
    expect(result.matches).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p1', metricId: 'defense', score: 4 }),
      expect.objectContaining({ playerId: 'p1', metricId: 'shotSelection', score: 3 }),
      expect.objectContaining({ playerId: 'p2', metricId: 'teamWork', score: 5 }),
      expect.objectContaining({ playerId: 'p3', metricId: 'ballMovement', score: 2 })
    ]));
  });

  test('keeps ambiguous first names unmatched unless the full name or number is spoken', () => {
    const result = parseVoiceAssessmentTranscript({
      transcript: 'Ava defense four. Ava Brown defense five. number 7 teamwork three.',
      players: [
        { id: 'p1', name: 'Ava Johnson', number: 7 },
        { id: 'p4', name: 'Ava Brown', number: 4 }
      ],
      metrics
    });

    expect(result.matches).toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p4', metricId: 'defense', score: 5 }),
      expect.objectContaining({ playerId: 'p1', metricId: 'teamWork', score: 3 })
    ]));
    expect(result.matches).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ playerId: 'p1', metricId: 'defense', score: 4 })
    ]));
  });

  test('merges parsed values into match and training assessment shapes', () => {
    const result = parseVoiceAssessmentTranscript({
      transcript: 'Mia defence five and passing four.',
      players,
      metrics
    });

    const matchShape = mergeVoiceMatchesIntoPlayerMetrics({}, result.matches);
    expect(matchShape.p2.metrics).toEqual({ defense: 5, ballMovement: 4 });

    const trainingShape = mergeVoiceMatchesIntoTrainingMetrics({}, result.matches);
    expect(trainingShape.p2).toEqual({ defense: 5, ballMovement: 4 });
  });
});
