import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilteredData } from '../../hooks/useFilteredData';
import { toJsDate } from '../../utils/dateUtils';
import PageShell from '../../components/PageShell';
import {
  Loader2,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  Edit3,
  Eye,
  XCircle,
  Calendar,
} from 'lucide-react';

const RecordTrainingSelectionPage = () => {
  const navigate = useNavigate();
  const { games, teams, trainingRecords, loading } = useFilteredData();

  // Build training sessions for coach's teams
  const sessions = useMemo(() => {
    if (!games || !teams) return [];

    const teamIds = new Set((teams || []).map(t => t.id));
    const teamNameMap = {};
    (teams || []).forEach(t => { teamNameMap[t.id] = t.name || t.teamName || ''; });

    // Get all training-type games for coach's teams
    const trainingSessions = (games || [])
      .filter(g => (g.type || '').toLowerCase() === 'training' && teamIds.has(g.teamId))
      .map(g => {
        const d = toJsDate(g.date);
        return { ...g, _parsedDate: d, teamLabel: teamNameMap[g.teamId] || g.teamName || '' };
      })
      .filter(g => g._parsedDate && !isNaN(g._parsedDate.getTime()))
      .sort((a, b) => b._parsedDate - a._parsedDate);

    // Build record lookup
    const recordByGameId = {};
    (trainingRecords || []).forEach(r => {
      if (r.gameId) recordByGameId[r.gameId] = r;
    });

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    return trainingSessions.map(session => {
      const sessionDate = new Date(session._parsedDate);
      sessionDate.setHours(0, 0, 0, 0);
      const hasRecord = !!recordByGameId[session.id];

      // 6-day edit window: editable if today <= session date + 6 days
      const editDeadline = new Date(sessionDate);
      editDeadline.setDate(editDeadline.getDate() + 6);
      editDeadline.setHours(23, 59, 59, 999);
      const todayMidnight = new Date(today);
      todayMidnight.setHours(0, 0, 0, 0);
      const withinEditWindow = todayMidnight <= editDeadline;

      const isToday = sessionDate.getTime() === today.getTime();
      const isFuture = sessionDate > todayEnd;
      const isPast = sessionDate < today;

      let status, statusLabel, statusColor, actionLabel;

      if (isFuture || isToday) {
        // Upcoming or today — always "Record"
        status = 'record';
        statusLabel = isToday ? 'Today' : 'Upcoming';
        statusColor = 'green';
        actionLabel = 'Record';
      } else if (isPast && withinEditWindow && !hasRecord) {
        // Recent, no record yet — "Record"
        status = 'record';
        statusLabel = 'Recent';
        statusColor = 'green';
        actionLabel = 'Record';
      } else if (isPast && withinEditWindow && hasRecord) {
        // Recent, has record — "Edit"
        status = 'edit';
        statusLabel = 'Recorded';
        statusColor = 'amber';
        actionLabel = 'Edit';
      } else if (isPast && !withinEditWindow && hasRecord) {
        // Older, has record — "View"
        status = 'view';
        statusLabel = 'Recorded';
        statusColor = 'gray';
        actionLabel = 'View';
      } else {
        // Older, no record — "Missed"
        status = 'missed';
        statusLabel = 'Missed';
        statusColor = 'gray';
        actionLabel = 'Missed';
      }

      return { ...session, hasRecord, status, statusLabel, statusColor, actionLabel, isToday };
    });
  }, [games, teams, trainingRecords]);

  if (loading) {
    return (
      <PageShell title="Record Training" backTo="/dashboard">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
          <p className="text-[#6B7C6B]">Loading sessions...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Record Training"
      subtitle="Select a training session to record"
      backTo="/dashboard"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Dashboard', url: '/dashboard' },
        { label: 'Record Training' }
      ]}
    >
      <div className="space-y-3 pb-8">
        {sessions.length === 0 ? (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-1">No Training Sessions</h3>
            <p className="text-[#6B7C6B] text-sm">
              No training sessions found for your teams. Ask your admin to add training sessions to the schedule.
            </p>
          </div>
        ) : (
          sessions.map(session => {
            const dateStr = session._parsedDate.toLocaleDateString('en-AU', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            const isMissed = session.status === 'missed';

            return (
              <div
                key={session.id}
                className={`bg-white border rounded-xl p-4 ${
                  session.isToday ? 'border-[#00A651] border-2' : 'border-[#D4E4D4]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        session.isToday ? 'bg-[#00A651]/20 text-[#005028]' :
                        session.statusColor === 'green' ? 'bg-[#00A651]/10 text-[#00A651]' :
                        session.statusColor === 'amber' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {session.statusLabel}
                      </span>
                      <span className="text-xs text-[#6B7C6B] truncate">{session.teamLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Calendar className="w-3.5 h-3.5 text-[#6B7C6B] flex-shrink-0" />
                      <span className="font-medium">{dateStr}</span>
                      {session.time && (
                        <span className="text-[#6B7C6B]">@ {session.time}</span>
                      )}
                    </div>
                    {session.title && session.title !== 'Training' && (
                      <p className="text-xs text-[#6B7C6B] mt-0.5 truncate">{session.title}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isMissed ? (
                      <span className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Missed
                      </span>
                    ) : (
                      <button
                        onClick={() => navigate(`/coach/training-session/${session.id}`)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          session.status === 'record'
                            ? 'bg-[#005028] hover:bg-[#00A651] text-white'
                            : session.status === 'edit'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {session.status === 'record' && <ClipboardList className="w-4 h-4" />}
                        {session.status === 'edit' && <Edit3 className="w-4 h-4" />}
                        {session.status === 'view' && <Eye className="w-4 h-4" />}
                        {session.actionLabel}
                      </button>
                    )}
                  </div>
                </div>

                {session.hasRecord && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-[#00A651]">
                    <CheckCircle2 className="w-3 h-3" />
                    Training recorded
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
};

export default RecordTrainingSelectionPage;
