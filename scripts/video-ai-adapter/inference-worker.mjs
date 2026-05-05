import { analyzeVideoJob } from './analyzer.mjs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import nodeFs from 'node:fs/promises';
import nodeOs from 'node:os';
import nodePath from 'node:path';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

const nonEmptyString = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
};

const truthyFlag = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'y'].includes(String(value).trim().toLowerCase());
};

const numericParam = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(Math.trunc(parsed)) : null;
};

const appendQuery = (endpoint, params) => {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(params)) {
    const text = nonEmptyString(value);
    if (text) url.searchParams.set(key, text);
  }
  return url.toString();
};

const hasDetections = (frame) => {
  const source = asRecord(frame);
  return asArray(source.predictions || source.detections || source.objects).length > 0;
};

const runSpawn = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { windowsHide: true });
  let stderr = '';
  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  child.on('error', reject);
  child.on('close', (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`${command} exited with code ${code}: ${stderr.slice(0, 500)}`));
  });
});

export const buildFfmpegFrameArgs = ({
  inputPath,
  outputPattern,
  fps = 0.5,
  maxFrames = 12
}) => [
  '-hide_banner',
  '-loglevel',
  'error',
  '-i',
  inputPath,
  '-vf',
  `fps=${fps}`,
  '-frames:v',
  String(maxFrames),
  outputPattern
];

export const createFfmpegFrameSampler = ({
  ffmpegPath = 'ffmpeg',
  fps = 0.5,
  fetch: fetcher = fetch,
  fs = nodeFs,
  path = nodePath,
  tmpDir = nodeOs.tmpdir(),
  spawnRunner = runSpawn,
  idFactory = randomUUID
} = {}) => async ({
  videoUrl,
  maxFrames = 12
} = {}) => {
  const signedUrl = nonEmptyString(videoUrl);
  if (!signedUrl) return [];

  const workDir = await fs.mkdtemp(path.join(tmpDir, `sixth-man-video-ai-${idFactory()}-`));
  try {
    const response = await fetcher(signedUrl);
    if (!response.ok) {
      throw new Error(`Unable to download signed video (${response.status}).`);
    }

    const inputPath = path.join(workDir, 'input-video');
    const outputPattern = path.join(workDir, 'frame-%04d.jpg');
    await fs.writeFile(inputPath, new Uint8Array(await response.arrayBuffer()));
    await spawnRunner(ffmpegPath, buildFfmpegFrameArgs({
      inputPath,
      outputPattern,
      fps,
      maxFrames
    }));

    const frameFiles = (await fs.readdir(workDir))
      .filter((file) => /^frame-\d+\.jpg$/i.test(file))
      .sort()
      .slice(0, maxFrames);
    const frameIntervalMs = Math.round(1000 / Number(fps || 1));

    return Promise.all(frameFiles.map(async (file, index) => ({
      timestampMs: index * frameIntervalMs,
      imageBase64: (await fs.readFile(path.join(workDir, file))).toString('base64'),
      filename: file
    })));
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
};

export const createFfmpegFrameSamplerFromEnv = ({
  env = process.env,
  fetch: fetcher = fetch
} = {}) => {
  if (!truthyFlag(env.VIDEO_AI_ENABLE_FFMPEG, false)) return null;
  return createFfmpegFrameSampler({
    ffmpegPath: env.VIDEO_AI_FFMPEG_PATH || 'ffmpeg',
    fps: Number(env.VIDEO_AI_SAMPLE_FPS || 0.5),
    fetch: fetcher
  });
};

const normalizeRoboflowFrame = (payload, frame) => {
  const source = asRecord(payload);
  const image = asRecord(source.image);
  return {
    ...frame,
    width: Number(image.width || frame.width || 0),
    height: Number(image.height || frame.height || 0),
    predictions: asArray(source.predictions)
  };
};

export const createRoboflowHostedDetector = ({
  endpoint,
  apiKey,
  confidence,
  overlap,
  classes,
  fetch: fetcher = fetch
} = {}) => {
  const baseEndpoint = nonEmptyString(endpoint);
  const key = nonEmptyString(apiKey);
  if (!baseEndpoint || !key) return null;

  const query = {
    api_key: key,
    confidence: numericParam(confidence),
    overlap: numericParam(overlap),
    classes
  };

  return async (frame) => {
    const frameRecord = asRecord(frame);
    const imageBase64 = nonEmptyString(frameRecord.imageBase64 || frameRecord.base64);
    const imageUrl = nonEmptyString(frameRecord.imageUrl || frameRecord.url);
    if (!imageBase64 && !imageUrl) {
      throw new Error('Roboflow detector needs imageBase64 or imageUrl on each sampled frame.');
    }

    const url = appendQuery(baseEndpoint, {
      ...query,
      image: imageBase64 ? null : imageUrl
    });
    const response = await fetcher(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: imageBase64 || undefined
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Roboflow inference failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    return normalizeRoboflowFrame(await response.json(), frameRecord);
  };
};

export const createRoboflowHostedDetectorFromEnv = ({
  env = process.env,
  fetch: fetcher = fetch
} = {}) => {
  const endpoint = nonEmptyString(env.ROBOFLOW_INFER_ENDPOINT) ||
    (nonEmptyString(env.ROBOFLOW_MODEL_ID)
      ? `https://detect.roboflow.com/${env.ROBOFLOW_MODEL_ID}`
      : null);

  return createRoboflowHostedDetector({
    endpoint,
    apiKey: env.ROBOFLOW_API_KEY,
    confidence: env.ROBOFLOW_CONFIDENCE,
    overlap: env.ROBOFLOW_OVERLAP,
    classes: env.ROBOFLOW_CLASSES,
    fetch: fetcher
  });
};

export const collectInferenceFrames = async (payload, {
  frameSampler,
  frameDetector,
  maxFrames = 12
} = {}) => {
  const source = asRecord(payload);
  const inference = asRecord(source.inference);
  let frames = asArray(source.frames || inference.frames || inference.frameDetections).slice(0, maxFrames);

  if (frames.length === 0 && frameSampler && nonEmptyString(source.videoUrl)) {
    frames = asArray(await frameSampler({
      payload,
      videoUrl: source.videoUrl,
      maxFrames
    })).slice(0, maxFrames);
  }

  if (!frameDetector) return frames;

  const detectedFrames = [];
  for (const frame of frames) {
    detectedFrames.push(hasDetections(frame) ? frame : await frameDetector(frame));
  }
  return detectedFrames;
};

export const runInferenceForJob = async (payload, options = {}) => {
  const adapterName = options.adapterName || 'open-source-shot-mvp';
  const modelName = options.modelName || 'deterministic-adapter-smoke';
  const allowSmokeFallback = options.allowSmokeFallback ?? true;
  const frames = await collectInferenceFrames(payload, options);

  if (frames.length === 0 && !allowSmokeFallback) {
    return {
      provider: adapterName,
      model: modelName,
      needsReview: true,
      summary: 'No video frames were available for AI inference. The recording is ready for manual coach review.',
      events: [],
      stats: [],
      metadata: {
        adapterVersion: '0.3.0',
        inferenceFrames: 0,
        smokeFallback: false
      }
    };
  }

  const result = await analyzeVideoJob({
    ...payload,
    inference: {
      ...asRecord(payload?.inference),
      frames
    }
  }, {
    adapterName,
    modelName,
    allowSmokeFallback
  });

  return {
    ...result,
    metadata: {
      ...asRecord(result.metadata),
      inferenceFrames: frames.length,
      smokeFallback: truthyFlag(allowSmokeFallback, true)
    }
  };
};
