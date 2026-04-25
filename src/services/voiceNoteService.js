import { supabase } from './firebase';

const TRANSCRIPTION_ENDPOINT = import.meta.env.VITE_VOICE_TRANSCRIPTION_ENDPOINT;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export const supportsVoiceRecording = () =>
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof window.MediaRecorder !== 'undefined';

export const validateVoiceNoteBlob = (blob) => {
  if (!blob) return 'Record a voice note first.';
  if (blob.size > MAX_AUDIO_BYTES) return 'Voice notes must be 25 MB or smaller.';
  return null;
};

export const transcribeVoiceNote = async ({ audioBlob, context = {}, fallbackTranscript = '' }) => {
  const validationError = validateVoiceNoteBlob(audioBlob);
  if (validationError) throw new Error(validationError);

  if (!TRANSCRIPTION_ENDPOINT) {
    return {
      status: fallbackTranscript ? 'manual_transcript' : 'needs_transcript',
      provider: 'manual',
      transcript: fallbackTranscript,
      message: 'Set VITE_VOICE_TRANSCRIPTION_ENDPOINT to enable server-side AI transcription.'
    };
  }

  const formData = new FormData();
  formData.append('audio', audioBlob, `coach-voice-note-${Date.now()}.webm`);
  formData.append('context', JSON.stringify(context));

  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const response = await fetch(TRANSCRIPTION_ENDPOINT, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Transcription failed (${response.status}).`);
  }

  const payload = await response.json();
  return {
    status: 'transcribed',
    provider: payload.provider || 'external',
    model: payload.model || null,
    transcript: payload.transcript || '',
    confidence: payload.confidence ?? null
  };
};

export const createVoiceCaptureRecord = ({
  transcript,
  matches,
  warnings = [],
  provider = 'manual',
  context = {}
}) => ({
  id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date().toISOString(),
  provider,
  transcript: transcript || '',
  matchCount: matches.length,
  matches,
  warnings,
  context
});

