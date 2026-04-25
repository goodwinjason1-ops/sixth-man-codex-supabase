import { supabase } from './firebase';

const RAW_VIDEO_BUCKETS = {
  game: 'game-videos',
  training: 'video-recordings',
  tryout: 'video-recordings',
  scout: 'video-recordings',
  other: 'video-recordings'
};

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'application/octet-stream'
]);

const MAX_VIDEO_BYTES = 10 * 1024 * 1024 * 1024;

const safeFileName = (name = 'game-video.mp4') =>
  name
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'game-video.mp4';

const throwIfError = (result, fallbackMessage) => {
  if (result?.error) {
    throw new Error(result.error.message || fallbackMessage);
  }
  return result?.data;
};

const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error('You need to be signed in to upload video.');
  }
  return data.user.id;
};

export const validateVideoFile = (file) => {
  if (!file) return 'Choose a video file to upload.';
  if (file.size > MAX_VIDEO_BYTES) return 'Video files must be 10 GB or smaller.';
  if (file.type && !ALLOWED_VIDEO_TYPES.has(file.type)) {
    return 'Use MP4, MOV, WebM, or MKV video.';
  }
  return null;
};

export const listVideoAnalysisSessions = async () => {
  const sessions = throwIfError(
    await supabase
      .from('video_recording_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40),
    'Unable to load video sessions.'
  ) || [];

  const recordings = throwIfError(
    await supabase
      .from('video_recordings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(120),
    'Unable to load video recordings.'
  ) || [];

  const jobs = throwIfError(
    await supabase
      .from('video_analysis_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(160),
    'Unable to load analysis jobs.'
  ) || [];

  return sessions.map((session) => ({
    ...session,
    recordings: recordings.filter((recording) => recording.session_id === session.id),
    jobs: jobs.filter((job) => job.session_id === session.id)
  }));
};

export const uploadVideoForAnalysis = async ({
  file,
  title,
  sourceType = 'game',
  teamId,
  gameId,
  opponent,
  venue,
  sessionDate,
  cameraLabel,
  cameraRole = 'main',
  consentConfirmed = false
}) => {
  const validationError = validateVideoFile(file);
  if (validationError) throw new Error(validationError);
  if (!title?.trim()) throw new Error('Add a video title.');
  if (!consentConfirmed) throw new Error('Confirm consent before uploading junior sport video.');

  const uid = await getCurrentUserId();
  const bucketId = RAW_VIDEO_BUCKETS[sourceType] || RAW_VIDEO_BUCKETS.other;

  const session = throwIfError(
    await supabase
      .from('video_recording_sessions')
      .insert({
        source_type: sourceType,
        title: title.trim(),
        game_id: gameId || null,
        team_id: teamId || null,
        opponent: opponent?.trim() || null,
        venue: venue?.trim() || null,
        session_date: sessionDate || null,
        status: 'queued',
        privacy_level: 'staff',
        metadata: {
          consentConfirmed: true,
          captureWorkflow: 'single-upload',
          originalFileName: file.name,
          originalContentType: file.type || 'application/octet-stream',
          originalSizeBytes: file.size
        },
        created_by: uid,
        updated_by: uid
      })
      .select('*')
      .single(),
    'Unable to create video session.'
  );

  const objectPath = [
    sourceType,
    session.id,
    `${Date.now()}-${safeFileName(file.name)}`
  ].join('/');

  try {
    throwIfError(
      await supabase.storage
        .from(bucketId)
        .upload(objectPath, file, {
          cacheControl: '3600',
          contentType: file.type || 'application/octet-stream',
          upsert: false
        }),
      'Unable to upload video.'
    );

    const recording = throwIfError(
      await supabase
        .from('video_recordings')
        .insert({
          session_id: session.id,
          bucket_id: bucketId,
          object_path: objectPath,
          camera_label: cameraLabel?.trim() || 'Main camera',
          camera_role: cameraRole,
          upload_status: 'uploaded',
          size_bytes: file.size,
          metadata: {
            originalFileName: file.name,
            contentType: file.type || 'application/octet-stream'
          },
          uploaded_by: uid,
          updated_by: uid
        })
        .select('*')
        .single(),
      'Unable to save recording metadata.'
    );

    const jobs = ['transcode', 'vision_event_detection', 'stat_extraction'].map((jobKind, index) => ({
      session_id: session.id,
      recording_id: recording.id,
      job_kind: jobKind,
      status: 'queued',
      priority: 40 + index,
      input: {
        bucketId,
        objectPath,
        sourceType,
        teamId: teamId || null,
        gameId: gameId || null
      },
      parameters: {
        frameSampleSeconds: jobKind === 'vision_event_detection' ? 5 : null,
        reviewRequired: true
      },
      requested_by: uid,
      updated_by: uid
    }));

    throwIfError(
      await supabase
        .from('video_analysis_jobs')
        .insert(jobs)
        .select('*'),
      'Unable to queue video analysis.'
    );

    return { session, recording };
  } catch (error) {
    try {
      await supabase
        .from('video_recording_sessions')
        .update({ status: 'archived', updated_by: uid, metadata: { uploadError: error.message } })
        .eq('id', session.id);
    } catch (_) {
      // Preserve the original upload/queueing error for the user.
    }
    throw error;
  }
};
