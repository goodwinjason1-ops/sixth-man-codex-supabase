import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeVideoJob,
  buildShotCandidatesFromFrames,
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

test('buildShotCandidatesFromFrames converts ball-near-rim detections into grouped shot candidates', () => {
  const candidates = buildShotCandidatesFromFrames([
    {
      timestampMs: 10_000,
      width: 1280,
      height: 720,
      predictions: [
        { class: 'rim', x: 610, y: 220, width: 80, height: 50, confidence: 0.92 },
        { class: 'ball', x: 618, y: 202, width: 22, height: 22, confidence: 0.86 },
        { class: 'player', x: 540, y: 430, width: 120, height: 240, confidence: 0.79 }
      ]
    },
    {
      timestampMs: 10_420,
      width: 1280,
      height: 720,
      predictions: [
        { class: 'hoop', x: 612, y: 222, width: 80, height: 50, confidence: 0.9 },
        { class: 'basketball', x: 626, y: 218, width: 22, height: 22, confidence: 0.81 }
      ]
    }
  ], { teamId: 'team-1' });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].event_type, 'shot_attempt');
  assert.equal(candidates[0].team_id, 'team-1');
  assert.equal(candidates[0].start_ms, 10_000);
  assert.equal(candidates[0].end_ms, 10_420);
  assert.equal(candidates[0].bounding_boxes.length, 4);
  assert.equal(candidates[0].attributes.source, 'open-source-detection-mapper');
  assert.equal(candidates[0].court_position.x, 48);
  assert.equal(candidates[0].court_position.y, 15);
});

test('analyzeVideoJob uses frame detections instead of deterministic smoke output when provided', async () => {
  const result = await analyzeVideoJob({
    ...samplePayload,
    inference: {
      frames: [{
        timestampMs: 2500,
        width: 1000,
        height: 500,
        predictions: [
          { label: 'backboard', x: 480, y: 140, width: 110, height: 80, confidence: 0.76 },
          { label: 'ball', x: 505, y: 124, width: 20, height: 20, confidence: 0.88 }
        ]
      }]
    }
  });

  assert.match(result.summary, /Detected 1 shot candidate/i);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].attributes.source, 'open-source-detection-mapper');
  assert.equal(result.stats.length, 1);
  assert.equal(result.stats[0].stat_value, 1);
});
