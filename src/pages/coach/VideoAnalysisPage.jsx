import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  Video
} from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import EmptyState from '../../components/EmptyState';
import { useFilteredData } from '../../hooks/useFilteredData';
import {
  listVideoAnalysisSessions,
  runVideoJobWorker,
  uploadVideoForAnalysis,
  validateVideoFile
} from '../../services/videoAnalysisService';

const sourceTypes = [
  { value: 'game', label: 'Game' },
  { value: 'training', label: 'Training' },
  { value: 'tryout', label: 'Tryout' },
  { value: 'scout', label: 'Scout' },
  { value: 'other', label: 'Other' }
];

const cameraRoles = [
  { value: 'main', label: 'Main camera' },
  { value: 'baseline', label: 'Baseline' },
  { value: 'sideline', label: 'Sideline' },
  { value: 'scoreboard', label: 'Scoreboard' },
  { value: 'other', label: 'Other angle' }
];

const statusStyles = {
  planned: 'bg-slate-100 text-slate-700',
  recording: 'bg-blue-100 text-blue-700',
  uploaded: 'bg-cyan-100 text-cyan-700',
  queued: 'bg-amber-100 text-amber-700',
  analysing: 'bg-indigo-100 text-indigo-700',
  review: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700'
};

const formatDate = (value) => {
  if (!value) return 'No date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString();
};

const readableStatus = (status = '') =>
  status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const initialForm = {
  sourceType: 'game',
  title: '',
  teamId: '',
  gameId: '',
  opponent: '',
  venue: '',
  sessionDate: '',
  cameraRole: 'main',
  cameraLabel: '',
  consentConfirmed: false
};

const VideoAnalysisPage = () => {
  const navigate = useNavigate();
  const { teams = [], games = [] } = useFilteredData();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workerRunning, setWorkerRunning] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedGames = useMemo(() => {
    return [...games]
      .filter((game) => game?.id)
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
      .slice(0, 80);
  }, [games]);

  const selectedGame = useMemo(
    () => sortedGames.find((game) => game.id === form.gameId),
    [form.gameId, sortedGames]
  );

  useEffect(() => {
    if (!selectedGame) return;
    setForm((current) => ({
      ...current,
      title: current.title || `${selectedGame.teamName || selectedGame.team || 'Game'} vs ${selectedGame.opponent || 'Opponent'}`,
      teamId: current.teamId || selectedGame.teamId || '',
      opponent: current.opponent || selectedGame.opponent || '',
      venue: current.venue || selectedGame.venue || '',
      sessionDate: current.sessionDate || (selectedGame.date ? String(selectedGame.date).slice(0, 10) : '')
    }));
  }, [selectedGame]);

  const loadSessions = async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      setSessions(await listVideoAnalysisSessions());
    } catch (err) {
      setError(err.message || 'Unable to load video analysis sessions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    setError(nextFile ? validateVideoFile(nextFile) || '' : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSubmitting(true);
      const result = await uploadVideoForAnalysis({
        file,
        title: form.title,
        sourceType: form.sourceType,
        teamId: form.teamId,
        gameId: form.gameId,
        opponent: form.opponent,
        venue: form.venue,
        sessionDate: form.sessionDate,
        cameraLabel: form.cameraLabel,
        cameraRole: form.cameraRole,
        consentConfirmed: form.consentConfirmed
      });
      setForm(initialForm);
      setFile(null);
      const processedCount = result?.worker?.processed?.length || 0;
      setSuccess(processedCount
        ? `Video uploaded and ${processedCount} AI job${processedCount === 1 ? '' : 's'} processed for staff review.`
        : 'Video uploaded and AI analysis queued for staff review.'
      );
      await loadSessions({ quiet: true });
    } catch (err) {
      setError(err.message || 'Unable to upload video.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunWorker = async () => {
    setError('');
    setSuccess('');
    setWorkerRunning(true);

    try {
      const result = await runVideoJobWorker({ limit: 10 });
      const processedCount = result?.processed?.length || 0;
      setSuccess(processedCount
        ? `${processedCount} queued AI job${processedCount === 1 ? '' : 's'} processed.`
        : 'No queued AI jobs were waiting.'
      );
      await loadSessions({ quiet: true });
    } catch (err) {
      setError(err.message || 'Unable to run the video AI worker.');
    } finally {
      setWorkerRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      <div className="bg-white border-b border-[#D4E4D4]/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Dashboard', url: '/dashboard' },
              { label: 'Video Analysis' }
            ]}
            className="mb-3"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Video Analysis</h1>
              <p className="text-sm text-gray-500 mt-1">Upload private game footage and queue AI-assisted review.</p>
            </div>
            <button
              type="button"
              onClick={() => loadSessions({ quiet: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-700 hover:bg-[#F5F9F5] disabled:opacity-60"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
          <form onSubmit={handleSubmit} className="bg-white border border-[#D4E4D4] rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00A651]/10 flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-[#00A651]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Upload Video</h2>
                <p className="text-xs text-gray-500">MP4, MOV, WebM, or MKV up to 10 GB.</p>
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Video file</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#00A651]/10 file:text-[#005028] hover:file:bg-[#00A651]/20"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Type</span>
                <select
                  value={form.sourceType}
                  onChange={(event) => updateForm('sourceType', event.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                >
                  {sourceTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Camera angle</span>
                <select
                  value={form.cameraRole}
                  onChange={(event) => updateForm('cameraRole', event.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                >
                  {cameraRoles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="U12 Boys vs Hawks"
                className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Existing game</span>
              <select
                value={form.gameId}
                onChange={(event) => updateForm('gameId', event.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              >
                <option value="">No linked game</option>
                {sortedGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    {formatDate(game.date)} - {game.teamName || game.team || 'Team'} vs {game.opponent || 'Opponent'}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Team</span>
                <select
                  value={form.teamId}
                  onChange={(event) => updateForm('teamId', event.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                >
                  <option value="">No team</option>
                  {teams.map((team) => (
                    <option key={team.id || team.name} value={team.id || team.name}>
                      {team.name || team.teamName || team.displayName || team.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Date</span>
                <input
                  type="date"
                  value={form.sessionDate}
                  onChange={(event) => updateForm('sessionDate', event.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Opponent</span>
                <input
                  type="text"
                  value={form.opponent}
                  onChange={(event) => updateForm('opponent', event.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Venue</span>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(event) => updateForm('venue', event.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Camera label</span>
              <input
                type="text"
                value={form.cameraLabel}
                onChange={(event) => updateForm('cameraLabel', event.target.value)}
                placeholder="Sideline centre"
                className="mt-1 w-full px-3 py-2 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              />
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-[#D4E4D4] bg-[#F5F9F5] p-3">
              <input
                type="checkbox"
                checked={form.consentConfirmed}
                onChange={(event) => updateForm('consentConfirmed', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00A651] focus:ring-[#00A651]"
              />
              <span className="text-sm text-gray-700">
                I confirm this footage has club and guardian consent and should remain private until reviewed.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#00A651] hover:bg-[#008C44] text-white rounded-lg font-medium disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              Queue AI Analysis
            </button>
          </form>

          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoTile icon={ShieldCheck} title="Private Storage" text="Raw video stays in staff-only Supabase buckets." />
              <InfoTile icon={Clock} title="Queued Review" text="AI jobs are queued before coach approval." />
              <InfoTile icon={Camera} title="Multi-Angle Ready" text="Camera labels support later sync workflows." />
            </div>

            <div className="bg-white border border-[#D4E4D4] rounded-lg">
              <div className="flex flex-col gap-3 p-5 border-b border-[#D4E4D4]/60 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Analysis Queue</h2>
                  <p className="text-xs text-gray-500">Queued jobs are processed by the Supabase video AI worker.</p>
                </div>
                <button
                  type="button"
                  onClick={handleRunWorker}
                  disabled={workerRunning}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm text-gray-700 hover:bg-[#F5F9F5] disabled:opacity-60"
                >
                  {workerRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4 text-[#00A651]" />}
                  Run Worker
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00A651]" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No videos queued"
                    message="Upload the first game video to create a secure recording session."
                    icon={Video}
                  />
                </div>
              ) : (
                <div className="divide-y divide-[#D4E4D4]/60">
                  {sessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const InfoTile = ({ icon: Icon, title, text }) => (
  <div className="bg-white border border-[#D4E4D4] rounded-lg p-4">
    <Icon className="w-5 h-5 text-[#00A651] mb-3" />
    <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    <p className="text-xs text-gray-500 mt-1">{text}</p>
  </div>
);

const SessionRow = ({ session }) => {
  const completeJobs = (session.jobs || []).filter((job) => ['succeeded', 'needs_review'].includes(job.status)).length;
  const failedJobs = (session.jobs || []).filter((job) => job.status === 'failed').length;
  const reviewJobs = (session.jobs || []).filter((job) => job.status === 'needs_review').length;
  const totalJobs = session.jobs?.length || 0;
  const jobSummaries = (session.jobs || [])
    .map((job) => job.result?.summary)
    .filter(Boolean)
    .slice(0, 3);
  const eventCount = session.events?.length || 0;
  const statCount = session.stats?.length || 0;

  return (
    <article className="p-5 hover:bg-[#F5F9F5]/70 transition-colors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-800 truncate">{session.title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[session.status] || statusStyles.planned}`}>
              {readableStatus(session.status)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(session.session_date || session.created_at)}
            {session.opponent ? ` vs ${session.opponent}` : ''}
            {session.venue ? ` at ${session.venue}` : ''}
          </p>
        </div>
        <div className="text-xs text-gray-500 sm:text-right">
          <p>{session.recordings?.length || 0} recording{session.recordings?.length === 1 ? '' : 's'}</p>
          <p>
            {completeJobs}/{totalJobs} jobs complete
            {reviewJobs ? `, ${reviewJobs} need review` : ''}
            {failedJobs ? `, ${failedJobs} failed` : ''}
          </p>
        </div>
      </div>

      {session.jobs?.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          {session.jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-[#D4E4D4] bg-white px-3 py-2">
              <p className="text-xs font-semibold text-gray-700">{readableStatus(job.job_kind)}</p>
              <p className="text-xs text-gray-500">{readableStatus(job.status)}</p>
            </div>
          ))}
        </div>
      )}

      {(jobSummaries.length > 0 || eventCount > 0 || statCount > 0) && (
        <div className="mt-4 rounded-lg border border-[#D4E4D4] bg-white p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <CheckCircle className="w-4 h-4 text-[#00A651]" />
            AI Results
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {eventCount} event{eventCount === 1 ? '' : 's'} detected, {statCount} stat rollup{statCount === 1 ? '' : 's'} generated.
          </p>
          {jobSummaries.length > 0 && (
            <div className="mt-3 space-y-1">
              {jobSummaries.map((summary, index) => (
                <p key={`${session.id}-summary-${index}`} className="text-xs text-gray-600">{summary}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default VideoAnalysisPage;
