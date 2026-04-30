import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeVideoJob,
  isAuthorized,
  normalizePort
} from './analyzer.mjs';

const samplePayload = {
  job: {
    id: 'job-1',
    session_id: 'session-1',
    job_kind: 'vision_event_detection'
  },
  session: {
    id: 'session-1',
    team_id: 'team-1'
  },
  recording: {
    id: 'recording-1'
  },
  videoUrl: 'https://example.supabase.co/storage/v1/object/sign/game.mp4?token=test',
  task: 'vision_event_detection'
};

test('isAuthorized accepts matching bearer token', () => {
  const headers = new Headers({ Authorization: 'Bearer secret-token' });

  assert.equal(isAuthorized(headers, 'secret-token'), true);
});

test('isAuthorized rejects missing or mismatched bearer token', () => {
  assert.equal(isAuthorized(new Headers(), 'secret-token'), false);
  assert.equal(isAuthorized(new Headers({ Authorization: 'Bearer wrong' }), 'secret-token'), false);
});

test('normalizePort uses safe default and clamps invalid values', () => {
  assert.equal(normalizePort(undefined), 8788);
  assert.equal(normalizePort('not-a-port'), 8788);
  assert.equal(normalizePort('70000'), 8788);
  assert.equal(normalizePort('9000'), 9000);
});

test('analyzeVideoJob returns reviewable shot candidate events and stats', async () => {
  const result = await analyzeVideoJob(samplePayload, {
    adapterName: 'roboflow-shot-mvp',
    modelName: 'deterministic-smoke-test'
  });

  assert.equal(result.provider, 'roboflow-shot-mvp');
  assert.equal(result.model, 'deterministic-smoke-test');
  assert.equal(result.needsReview, true);
  assert.match(result.summary, /shot candidate/i);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].event_type, 'shot_attempt');
  assert.equal(result.events[0].team_id, 'team-1');
  assert.equal(result.events[0].attributes.adapter, 'roboflow-shot-mvp');
  assert.equal(result.stats.length, 1);
  assert.equal(result.stats[0].stat_type, 'shot_attempt_count');
  assert.equal(result.stats[0].stat_value, 1);
});

test('analyzeVideoJob marks unsupported tasks for review without throwing', async () => {
  const result = await analyzeVideoJob({ ...samplePayload, task: 'transcode' });

  assert.equal(result.needsReview, true);
  assert.equal(result.events.length, 0);
  assert.equal(result.stats.length, 0);
  assert.match(result.summary, /does not process/i);
});
