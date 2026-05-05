import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFfmpegFrameArgs,
  createFfmpegFrameSampler,
  createRoboflowHostedDetector,
  runInferenceForJob
} from './inference-worker.mjs';

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

test('createRoboflowHostedDetector posts base64 frames and normalizes predictions', async () => {
  const requests = [];
  const detector = createRoboflowHostedDetector({
    endpoint: 'https://detect.roboflow.com/basketball-shots/3',
    apiKey: 'rf-test-key',
    confidence: 35,
    overlap: 20,
    fetch: async (input, init) => {
      requests.push({ input: String(input), init });
      return Response.json({
        image: { width: 1280, height: 720 },
        predictions: [
          { class: 'rim', x: 612, y: 222, width: 80, height: 50, confidence: 0.9 },
          { class: 'basketball', x: 626, y: 218, width: 22, height: 22, confidence: 0.81 }
        ]
      });
    }
  });

  const frame = await detector({
    timestampMs: 10_420,
    imageBase64: 'base64-frame-data'
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].input, 'https://detect.roboflow.com/basketball-shots/3?api_key=rf-test-key&confidence=35&overlap=20');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.body, 'base64-frame-data');
  assert.equal(frame.timestampMs, 10_420);
  assert.equal(frame.width, 1280);
  assert.equal(frame.height, 720);
  assert.equal(frame.predictions.length, 2);
  assert.equal(frame.predictions[0].class, 'rim');
});

test('runInferenceForJob samples frames, calls detector, and maps detections into shot candidates', async () => {
  const result = await runInferenceForJob(samplePayload, {
    adapterName: 'roboflow-shot-mvp',
    modelName: 'basketball-shots/3',
    allowSmokeFallback: false,
    frameSampler: async ({ videoUrl }) => {
      assert.equal(videoUrl, samplePayload.videoUrl);
      return [{
        timestampMs: 10_420,
        imageBase64: 'base64-frame-data'
      }];
    },
    frameDetector: async (frame) => ({
      ...frame,
      width: 1280,
      height: 720,
      predictions: [
        { class: 'rim', x: 612, y: 222, width: 80, height: 50, confidence: 0.9 },
        { class: 'basketball', x: 626, y: 218, width: 22, height: 22, confidence: 0.81 }
      ]
    })
  });

  assert.equal(result.provider, 'roboflow-shot-mvp');
  assert.equal(result.model, 'basketball-shots/3');
  assert.equal(result.needsReview, true);
  assert.match(result.summary, /Detected 1 shot candidate/i);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].attributes.source, 'open-source-detection-mapper');
  assert.equal(result.stats[0].stat_value, 1);
  assert.equal(result.metadata.inferenceFrames, 1);
});

test('runInferenceForJob returns manual review result when no frames are available and smoke fallback is disabled', async () => {
  const result = await runInferenceForJob(samplePayload, {
    adapterName: 'roboflow-shot-mvp',
    modelName: 'basketball-shots/3',
    allowSmokeFallback: false
  });

  assert.equal(result.provider, 'roboflow-shot-mvp');
  assert.equal(result.needsReview, true);
  assert.equal(result.events.length, 0);
  assert.equal(result.stats.length, 0);
  assert.match(result.summary, /No video frames were available/i);
});

test('buildFfmpegFrameArgs creates low-fps bounded JPEG extraction arguments', () => {
  assert.deepEqual(buildFfmpegFrameArgs({
    inputPath: 'input.mp4',
    outputPattern: 'frame-%04d.jpg',
    fps: 0.5,
    maxFrames: 8
  }), [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    'input.mp4',
    '-vf',
    'fps=0.5',
    '-frames:v',
    '8',
    'frame-%04d.jpg'
  ]);
});

test('createFfmpegFrameSampler downloads signed video and returns base64 sampled frames', async () => {
  const calls = [];
  const removed = [];
  const sampler = createFfmpegFrameSampler({
    ffmpegPath: 'ffmpeg-test',
    fps: 0.5,
    fetch: async (url) => {
      calls.push({ type: 'fetch', url });
      return new Response(new Uint8Array([1, 2, 3]));
    },
    fs: {
      mkdtemp: async (prefix) => {
        calls.push({ type: 'mkdtemp', prefix });
        return 'tmp-video-ai';
      },
      writeFile: async (path, bytes) => {
        calls.push({ type: 'writeFile', path, size: bytes.byteLength });
      },
      readdir: async () => ['frame-0002.jpg', 'input-video', 'frame-0001.jpg'],
      readFile: async (path) => Buffer.from(`jpeg:${path}`),
      rm: async (path, options) => {
        removed.push({ path, options });
      }
    },
    path: {
      join: (...parts) => parts.join('/')
    },
    tmpDir: 'tmp-root',
    spawnRunner: async (command, args) => {
      calls.push({ type: 'spawn', command, args });
    }
  });

  const frames = await sampler({
    videoUrl: 'https://storage.example/signed-game.mp4',
    maxFrames: 2
  });

  const fetchCall = calls.find((call) => call.type === 'fetch');
  assert.equal(fetchCall.url, 'https://storage.example/signed-game.mp4');
  assert.equal(calls.find((call) => call.type === 'spawn').command, 'ffmpeg-test');
  assert.equal(frames.length, 2);
  assert.equal(frames[0].timestampMs, 0);
  assert.equal(frames[1].timestampMs, 2000);
  assert.match(frames[0].imageBase64, /^[A-Za-z0-9+/]+=*$/);
  assert.equal(removed[0].path, 'tmp-video-ai');
});
