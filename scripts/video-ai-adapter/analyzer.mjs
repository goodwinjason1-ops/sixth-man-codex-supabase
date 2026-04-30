const DEFAULT_PORT = 8788;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const nonEmptyString = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
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
