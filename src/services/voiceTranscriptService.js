export const appendVoiceTranscript = (existingTranscript = '', newTranscript = '') => {
  const existing = String(existingTranscript || '').trim();
  const incoming = String(newTranscript || '').trim();

  if (!incoming) return existing;
  if (!existing) return incoming;
  if (existing === incoming) return existing;

  return `${existing}\n\n${incoming}`;
};

export const formatRecordingDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};
