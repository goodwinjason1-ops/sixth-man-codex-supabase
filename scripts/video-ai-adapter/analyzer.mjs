const DEFAULT_PORT = 8788;

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

const BALL_LABELS = new Set(['ball', 'basketball']);
const TARGET_LABELS = new Set(['rim', 'hoop', 'basket', 'backboard']);
const SHOT_GROUP_GAP_MS = 1500;

const finiteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeDetection = (prediction, frame, index) => {
  const source = asRecord(prediction);
  const label = nonEmptyString(source.label || source.class || source.name || source.type) || 'unknown';
  const width = finiteNumber(source.width ?? source.w, 0);
  const height = finiteNumber(source.height ?? source.h, 0);
  const x = finiteNumber(source.x ?? source.left, 0);
  const y = finiteNumber(source.y ?? source.top, 0);

  return {
    label: label.toLowerCase(),
    originalLabel: label,
    x,
    y,
    width,
    height,
    confidence: clamp(finiteNumber(source.confidence ?? source.score ?? source.probability, 0), 0, 1),
    timestampMs: finiteNumber(frame.timestampMs ?? frame.timestamp_ms ?? frame.timeMs, 0),
    frameWidth: finiteNumber(frame.width ?? frame.frameWidth, 0),
    frameHeight: finiteNumber(frame.height ?? frame.frameHeight, 0),
    sourceIndex: index
  };
};

const detectionDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const isShotEvidence = (ball, target) => {
  const frameScale = Math.max(ball.frameWidth || target.frameWidth || 0, ball.frameHeight || target.frameHeight || 0);
  const targetScale = Math.max(target.width || 0, target.height || 0);
  const threshold = Math.max(90, targetScale * 1.5, frameScale * 0.08);
  return detectionDistance(ball, target) <= threshold;
};

const evidenceBox = (detection) => ({
  label: detection.originalLabel,
  x: detection.x,
  y: detection.y,
  width: detection.width,
  height: detection.height,
  confidence: detection.confidence,
  timestampMs: detection.timestampMs
});

const confidenceAverage = (detections) => {
  if (detections.length === 0) return null;
  const total = detections.reduce((sum, detection) => sum + detection.confidence, 0);
  return Math.round((total / detections.length) * 100) / 100;
};

const courtPositionForGroup = (group) => {
  const target = group.evidence.find((detection) => TARGET_LABELS.has(detection.label)) || group.evidence[0];
  if (!target?.frameWidth || !target?.frameHeight) return { x: 50, y: 25 };

  return {
    x: clamp(Math.round((target.x / target.frameWidth) * 100), 0, 100),
    y: clamp(Math.round((target.y / target.frameHeight) * 50), 0, 50)
  };
};

const candidateFromGroup = (group, options) => {
  const evidence = group.evidence
    .filter((detection) => BALL_LABELS.has(detection.label) || TARGET_LABELS.has(detection.label))
    .map(evidenceBox);

  return {
    event_type: 'shot_attempt',
    start_ms: group.startMs,
    end_ms: group.endMs,
    team_id: options.teamId || null,
    player_id: null,
    confidence: confidenceAverage(group.evidence),
    court_position: courtPositionForGroup(group),
    bounding_boxes: evidence,
    attributes: {
      source: 'open-source-detection-mapper',
      candidateFrames: group.frameCount,
      outcome: 'unknown',
      reviewNote: 'Candidate generated when ball detections appear near rim/backboard detections.'
    }
  };
};

export const buildShotCandidatesFromFrames = (frames, options = {}) => {
  const groups = [];

  for (const frame of Array.isArray(frames) ? frames : []) {
    const frameRecord = asRecord(frame);
    const detections = asArray(frameRecord.predictions || frameRecord.detections || frameRecord.objects)
      .map((prediction, index) => normalizeDetection(prediction, frameRecord, index));
    const balls = detections.filter((detection) => BALL_LABELS.has(detection.label));
    const targets = detections.filter((detection) => TARGET_LABELS.has(detection.label));

    for (const ball of balls) {
      const target = targets.find((candidate) => isShotEvidence(ball, candidate));
      if (!target) continue;

      const timestampMs = finiteNumber(frameRecord.timestampMs ?? frameRecord.timestamp_ms ?? frameRecord.timeMs, 0);
      const previous = groups[groups.length - 1];
      if (previous && timestampMs - previous.endMs <= SHOT_GROUP_GAP_MS) {
        previous.endMs = Math.max(previous.endMs, timestampMs);
        previous.frameCount += 1;
        previous.evidence.push(ball, target);
      } else {
        groups.push({
          startMs: timestampMs,
          endMs: timestampMs,
          frameCount: 1,
          evidence: [ball, target]
        });
      }
    }
  }

  return groups.map((group) => candidateFromGroup(group, options));
};

export const normalizePort = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) return DEFAULT_PORT;
  return parsed;
};

export const isAuthorized = (headers, expectedToken) => {
  if (!expectedToken) return true;
  const header = headers.get('authorization') || headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() === expectedToken;
};

export const analyzeVideoJob = async (payload, options = {}) => {
  const source = asRecord(payload);
  const session = asRecord(source.session);
  const recording = asRecord(source.recording);
  const job = asRecord(source.job);
  const task = nonEmptyString(source.task || job.job_kind) || 'vision_event_detection';
  const adapterName = options.adapterName || 'open-source-shot-mvp';
  const modelName = options.modelName || 'deterministic-adapter-smoke';
  const inference = asRecord(source.inference);
  const frames = source.frames || inference.frames || inference.frameDetections;

  if (task !== 'vision_event_detection') {
    return {
      provider: adapterName,
      model: modelName,
      needsReview: true,
      summary: `${adapterName} does not process ${task} jobs yet.`,
      events: [],
      stats: [],
      metadata: {
        adapterVersion: '0.1.0',
        task,
        sessionId: session.id || null,
        recordingId: recording.id || null
      }
    };
  }

  const teamId = session.team_id || session.teamId || null;
  const videoUrlPresent = Boolean(nonEmptyString(source.videoUrl));
  const shotCandidates = buildShotCandidatesFromFrames(frames, { teamId });

  if (shotCandidates.length > 0) {
    return {
      provider: adapterName,
      model: modelName,
      needsReview: true,
      summary: `Detected ${shotCandidates.length} shot candidate${shotCandidates.length === 1 ? '' : 's'} for coach review.`,
      events: shotCandidates,
      stats: [{
        stat_type: 'shot_attempt_count',
        stat_value: shotCandidates.length,
        team_id: teamId,
        player_id: null,
        confidence: confidenceAverage(shotCandidates.filter((event) => event.confidence !== null).map((event) => ({
          confidence: event.confidence
        }))),
        metadata: {
          source: 'open-source-detection-mapper',
          adapter: adapterName,
          jobId: job.id || null
        }
      }],
      metadata: {
        adapterVersion: '0.2.0',
        task,
        sessionId: session.id || null,
        recordingId: recording.id || null,
        videoUrlPresent,
        framesProcessed: Array.isArray(frames) ? frames.length : 0
      }
    };
  }

  return {
    provider: adapterName,
    model: modelName,
    needsReview: true,
    summary: 'Detected 1 deterministic shot candidate for coach review. Real Roboflow/OpenCV inference is not enabled yet.',
    events: [{
      event_type: 'shot_attempt',
      start_ms: 0,
      end_ms: null,
      team_id: teamId,
      player_id: null,
      confidence: 0.25,
      court_position: { x: 50, y: 25 },
      bounding_boxes: [],
      attributes: {
        adapter: adapterName,
        adapterVersion: '0.1.0',
        source: 'deterministic-smoke',
        videoUrlPresent,
        jobId: job.id || null,
        sessionId: session.id || null,
        recordingId: recording.id || null,
        reviewNote: 'Placeholder event proves the Supabase worker integration path before model inference is enabled.'
      }
    }],
    stats: [{
      stat_type: 'shot_attempt_count',
      stat_value: 1,
      team_id: teamId,
      player_id: null,
      confidence: 0.25,
      metadata: {
        source: 'deterministic-smoke',
        adapter: adapterName,
        jobId: job.id || null
      }
    }],
    metadata: {
      adapterVersion: '0.1.0',
      task,
      sessionId: session.id || null,
      recordingId: recording.id || null,
      videoUrlPresent
    }
  };
};

export const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {})
    }
  });
