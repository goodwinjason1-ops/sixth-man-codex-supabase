import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  FileAudio,
  Loader2,
  Mic,
  Square,
  Wand2
} from 'lucide-react';
import { parseVoiceAssessmentTranscript } from '../services/voiceAssessmentParser';
import {
  createVoiceCaptureRecord,
  supportsVoiceRecording,
  transcribeVoiceNote
} from '../services/voiceNoteService';

const VoiceAssessmentCapture = ({
  title = 'Voice Notes',
  contextLabel,
  players = [],
  metrics = [],
  context = {},
  disabled = false,
  onApply
}) => {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const canRecord = useMemo(() => supportsVoiceRecording(), []);

  const startRecording = async () => {
    setStatus(null);
    setAnalysis(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setAudioBlob(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (error) {
      setStatus(error?.name === 'NotAllowedError'
        ? 'Microphone permission was not granted. You can paste a transcript below.'
        : 'Unable to start voice recording on this device. You can paste a transcript below.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setBusy(true);
    setStatus(null);
    try {
      const result = await transcribeVoiceNote({
        audioBlob,
        context,
        fallbackTranscript: transcript
      });
      setTranscript(result.transcript || transcript);
      setStatus(result.message || `Transcript ready via ${result.provider}.`);
    } catch (error) {
      setStatus(error.message || 'Unable to transcribe this voice note.');
    } finally {
      setBusy(false);
    }
  };

  const handleAnalyse = () => {
    const result = parseVoiceAssessmentTranscript({ transcript, players, metrics });
    setAnalysis(result);
    if (result.matches.length === 0) {
      setStatus(result.warnings[0] || 'No player metric scores found.');
    } else {
      setStatus(`${result.matches.length} value${result.matches.length === 1 ? '' : 's'} ready to apply.`);
    }
  };

  const handleApply = () => {
    if (!analysis?.matches?.length) return;
    const capture = createVoiceCaptureRecord({
      transcript,
      matches: analysis.matches,
      warnings: analysis.warnings,
      context
    });
    onApply?.(analysis.matches, capture);
    setStatus(`Applied ${analysis.matches.length} value${analysis.matches.length === 1 ? '' : 's'}.`);
  };

  return (
    <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-gray-800 font-semibold flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#00A651]" />
            {title}
          </h2>
          {contextLabel && <p className="text-[#6B7C6B] text-xs mt-1">{contextLabel}</p>}
        </div>
        {audioBlob && (
          <span className="text-[10px] text-[#00A651] bg-[#00A651]/10 px-2 py-1 rounded-full">
            {(audioBlob.size / 1024).toFixed(0)} KB
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={disabled || !canRecord || busy}
          className={`min-h-[44px] rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
            recording
              ? 'bg-red-500 text-white'
              : 'bg-[#005028] text-white hover:bg-[#00A651] disabled:bg-[#D4E4D4] disabled:text-[#6B7C6B]'
          }`}
        >
          {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {recording ? 'Stop' : 'Record'}
        </button>
        <button
          type="button"
          onClick={handleTranscribe}
          disabled={disabled || !audioBlob || busy}
          className="min-h-[44px] rounded-lg bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 font-medium text-sm flex items-center justify-center gap-2 hover:border-[#00A651] disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileAudio className="w-4 h-4" />}
          Transcribe
        </button>
        <button
          type="button"
          onClick={handleAnalyse}
          disabled={disabled || !transcript.trim()}
          className="min-h-[44px] rounded-lg bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 font-medium text-sm flex items-center justify-center gap-2 hover:border-[#00A651] disabled:opacity-50"
        >
          <Wand2 className="w-4 h-4" />
          Analyse
        </button>
      </div>

      {!canRecord && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 text-xs">Voice recording is not available in this browser. Paste a transcript below.</p>
        </div>
      )}

      <textarea
        value={transcript}
        onChange={(event) => {
          setTranscript(event.target.value);
          setAnalysis(null);
        }}
        placeholder="Example: Ava defense four, Mia teamwork five and shot selection three..."
        disabled={disabled}
        rows={4}
        className="w-full px-3 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm placeholder-[#6B7C6B] focus:border-[#00A651] focus:outline-none resize-none"
      />

      {status && (
        <p className="mt-2 text-xs text-[#6B7C6B]">{status}</p>
      )}

      {analysis?.matches?.length > 0 && (
        <div className="mt-3 border border-[#D4E4D4] rounded-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto divide-y divide-[#D4E4D4]/70">
            {analysis.matches.map((match, index) => (
              <div key={`${match.playerId}-${match.metricId}-${index}`} className="px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{match.playerName}</p>
                  <p className="text-xs text-[#6B7C6B] truncate">{match.metricName}</p>
                </div>
                <span className="w-9 h-9 rounded-lg bg-[#005028] text-white font-bold flex items-center justify-center">
                  {match.score}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleApply}
            disabled={disabled}
            className="w-full py-3 bg-[#00A651] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Apply Values
          </button>
        </div>
      )}

      {analysis?.warnings?.length > 0 && (
        <div className="mt-3 space-y-1">
          {analysis.warnings.slice(0, 3).map((warning) => (
            <p key={warning} className="text-xs text-amber-700">{warning}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceAssessmentCapture;
