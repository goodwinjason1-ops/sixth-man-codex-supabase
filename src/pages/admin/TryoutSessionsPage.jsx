import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Calendar,
  Users,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Eye,
  UserPlus,
  ClipboardList,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  ArrowUpCircle,
  Link2,
  Timer,
  Zap,
  Lock,
  Unlock,
  Search,
  Clipboard
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import {
  createTryoutSession,
  updateTryoutSession,
  deleteTryoutSession,
  subscribeTryoutSessions,
  promotePlayersToHour2,
  closeSession,
  calculateDuration,
  autoCalcEndTime,
  formatTime24to12,
  durationBetween,
  fetchUsersByRole,
  SESSION_TYPES,
  AGE_GROUPS,
  AGE_GROUP_MAX_AGE
} from '../../services/tryoutService';
import { useData } from '../../contexts/DataContext';

const TryoutSessionsPage = () => {
  const navigate = useNavigate();
  const { userProfile, isAdmin, isLeadership } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [error, setError] = useState(null);
  const [showPromoteModal, setShowPromoteModal] = useState(null); // session to promote from

  // Subscribe to sessions
  useEffect(() => {
    const unsubscribe = subscribeTryoutSessions((data) => {
      setSessions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle session status change
  const handleStatusChange = async (sessionId, newStatus) => {
    const result = await updateTryoutSession(sessionId, { status: newStatus });
    if (!result.success) {
      setError(result.error);
    }
  };

  // Handle delete session
  const handleDelete = async (sessionId) => {
    if (!window.confirm('Delete this tryout session? This cannot be undone.')) return;
    const result = await deleteTryoutSession(sessionId);
    if (!result.success) {
      setError(result.error);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'TBD';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle close session
  const handleCloseSession = async (sessionId) => {
    if (!window.confirm('Close this session? All evaluations will be locked as finalized. This cannot be undone.')) return;
    const result = await closeSession(sessionId);
    if (!result.success) {
      setError(result.error);
    }
  };

  // Handle unlock session (admin only)
  const handleUnlockSession = async (sessionId) => {
    if (!window.confirm('Unlock this session? Evaluations will become editable again.')) return;
    const result = await updateTryoutSession(sessionId, { status: 'completed' });
    if (!result.success) {
      setError(result.error);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-500/20 text-gray-300 border-gray-500',
      active: 'bg-green-500/20 text-green-400 border-green-500',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500',
      closed: 'bg-red-500/20 text-red-400 border-red-500'
    };
    const labels = {
      draft: 'Draft',
      active: 'Active',
      completed: 'Completed',
      closed: 'Closed'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.draft} flex items-center gap-1`}>
        {status === 'closed' && <Lock className="w-3 h-3" />}
        {labels[status] || 'Draft'}
      </span>
    );
  };

  // Get session type badge
  const getSessionTypeBadge = (sessionType) => {
    if (sessionType === 'hour-1') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500">
          Hour 1 - Dev
        </span>
      );
    } else if (sessionType === 'hour-2') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500">
          Hour 2 - Adv
        </span>
      );
    }
    return null;
  };

  // Get linked Hour 2 sessions for an Hour 1 session
  const getLinkedHour2Sessions = (hour1SessionId) => {
    return sessions.filter(s => s.linkedHour1SessionId === hour1SessionId);
  };

  // Get linked Hour 1 session for an Hour 2 session
  const getLinkedHour1Session = (hour2Session) => {
    if (!hour2Session.linkedHour1SessionId) return null;
    return sessions.find(s => s.id === hour2Session.linkedHour1SessionId);
  };

  // Count promoted players
  const getPromotedCount = (session) => {
    if (!session.players) return 0;
    return session.players.filter(p => p.promotedFromHour1).length;
  };

  // Group sessions by age group and date
  const groupedSessions = sessions.reduce((acc, session) => {
    const key = `${session.ageGroup || 'Unassigned'} - ${formatDate(session.date)}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});

  return (
    <PageShell
      title="Tryout Sessions"
      subtitle="2-Stage Tryout Format"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Tryout Sessions' }
      ]}
      maxWidth="6xl"
      headerActions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Session</span>
        </button>
      }
    >
      {/* Info Banner */}
      <div className="pt-0">
        <div className="bg-gradient-to-r from-violet-500/20 to-orange-500/20 border border-violet-500/30 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-violet-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Timer className="w-4 h-4 text-violet-300" />
              </div>
              <div>
                <p className="text-violet-300 font-medium">Hour 1 (60 min)</p>
                <p className="text-gray-500 text-xs">Team 3 + newcomers. Identify 2-3 top players to promote.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-orange-300" />
              </div>
              <div>
                <p className="text-orange-300 font-medium">Hour 2 (60 min)</p>
                <p className="text-gray-500 text-xs">Team 1 & 2 + promoted players. Select final teams.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-2">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-800">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          /* Empty State */
          <div className="bg-white border-2 border-dashed border-[#D4E4D4] rounded-xl p-12 text-center">
            <ClipboardList className="w-16 h-16 text-[#6B7C6B] mx-auto mb-4" />
            <h3 className="text-gray-800 font-bold text-lg mb-2">No Tryout Sessions Yet</h3>
            <p className="text-[#00A651] mb-6">Create your first tryout session to start evaluating players</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Tryout Session
            </button>
          </div>
        ) : (
          /* Sessions List */
          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                sessions={sessions}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                getSessionTypeBadge={getSessionTypeBadge}
                getLinkedHour1Session={getLinkedHour1Session}
                getLinkedHour2Sessions={getLinkedHour2Sessions}
                getPromotedCount={getPromotedCount}
                onEdit={() => setEditingSession(session)}
                onDelete={() => handleDelete(session.id)}
                onStatusChange={handleStatusChange}
                onCloseSession={() => handleCloseSession(session.id)}
                onUnlockSession={() => handleUnlockSession(session.id)}
                canUnlock={isAdmin || isLeadership}
                onPromote={() => setShowPromoteModal(session)}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSession) && (
        <SessionModal
          session={editingSession}
          sessions={sessions}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSession(null);
          }}
          onSave={async (data) => {
            const result = editingSession
              ? await updateTryoutSession(editingSession.id, data)
              : await createTryoutSession({ ...data, createdBy: userProfile?.uid });

            if (result.success) {
              setShowCreateModal(false);
              setEditingSession(null);
            } else {
              setError(result.error);
            }
          }}
        />
      )}

      {/* Promote Players Modal */}
      {showPromoteModal && (
        <PromotePlayersModal
          session={showPromoteModal}
          sessions={sessions}
          onClose={() => setShowPromoteModal(null)}
          onPromote={async (hour2SessionId, playerIds) => {
            const result = await promotePlayersToHour2(showPromoteModal.id, hour2SessionId, playerIds);
            if (result.success) {
              setShowPromoteModal(null);
            } else {
              setError(result.error);
            }
            return result;
          }}
        />
      )}
    </PageShell>
  );
};

// Session Card Component
const SessionCard = ({
  session,
  sessions,
  formatDate,
  getStatusBadge,
  getSessionTypeBadge,
  getLinkedHour1Session,
  getLinkedHour2Sessions,
  getPromotedCount,
  onEdit,
  onDelete,
  onStatusChange,
  onCloseSession,
  onUnlockSession,
  canUnlock,
  onPromote,
  navigate
}) => {
  const linkedHour1 = session.sessionType === 'hour-2' ? getLinkedHour1Session(session) : null;
  const linkedHour2Sessions = session.sessionType === 'hour-1' ? getLinkedHour2Sessions(session.id) : [];
  const promotedCount = getPromotedCount(session);
  const durationMins = durationBetween(session.startTime, session.endTime);
  const durationDisplay = durationMins ? `${durationMins} min` : null;
  const startDisplay = formatTime24to12(session.startTime);
  const endDisplay = formatTime24to12(session.endTime);

  return (
    <div className={`bg-white border rounded-xl p-5 hover:border-[#00A651] transition-colors ${
      session.sessionType === 'hour-1' ? 'border-violet-500/30' :
      session.sessionType === 'hour-2' ? 'border-orange-500/30' :
      'border-[#D4E4D4]'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-gray-800 font-bold text-lg">{session.name}</h3>
            {getSessionTypeBadge(session.sessionType)}
            {getStatusBadge(session.status)}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-[#00A651]">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(session.date)}
            </span>
            {(startDisplay || endDisplay) && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {startDisplay}{endDisplay && ` - ${endDisplay}`}
                {durationDisplay && <span className="text-gray-400 ml-1">({durationDisplay})</span>}
              </span>
            )}
            {session.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {session.venue}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {session.players?.length || 0} players
              {promotedCount > 0 && (
                <span className="text-orange-400">({promotedCount} promoted)</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <UserPlus className="w-4 h-4" />
              {session.assessors?.length || 0} assessors
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {session.ageGroup && (
              <span className="px-2 py-1 bg-[#D4E4D4]/50 text-gray-800 text-xs rounded">
                {session.ageGroup}
              </span>
            )}
            {linkedHour1 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-300 text-xs rounded">
                <Link2 className="w-3 h-3" />
                Linked to: {linkedHour1.name}
              </span>
            )}
            {linkedHour2Sessions.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded">
                <Link2 className="w-3 h-3" />
                {linkedHour2Sessions.length} Hour 2 session{linkedHour2Sessions.length > 1 ? 's' : ''} linked
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Prominent Assessor View Button */}
          {(session.status === 'active' || session.status === 'closed') && (
            <button
              onClick={() => navigate(`/tryout/${session.id}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                session.status === 'active'
                  ? 'bg-gradient-to-r from-[#00A651] to-[#00A651] text-white hover:from-[#00A651] hover:to-[#86efac] assessor-btn-glow'
                  : 'bg-gradient-to-r from-gray-500 to-gray-400 text-white'
              }`}
              title={session.status === 'closed' ? 'View Evaluations (Locked)' : 'Open Assessor View'}
            >
              <Clipboard className="w-5 h-5" />
              <span className="hidden sm:inline">
                {session.status === 'closed' ? 'View Evals' : 'Assessor View'}
              </span>
            </button>
          )}

          {/* Promote Players (Hour 1 only) */}
          {session.sessionType === 'hour-1' && session.status === 'active' && (
            <button
              onClick={onPromote}
              className="p-2 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 rounded-lg transition-colors"
              title="Promote Players to Hour 2"
            >
              <ArrowUpCircle className="w-5 h-5" />
            </button>
          )}

          {/* View Results */}
          <button
            onClick={() => navigate(`/admin/tryouts/${session.id}/results`)}
            className="p-2 bg-[#D4E4D4] hover:bg-[#00A651] text-white rounded-lg transition-colors"
            title="View Results"
          >
            <Eye className="w-5 h-5" />
          </button>

          {/* Edit (disabled when closed) */}
          <button
            onClick={onEdit}
            disabled={session.status === 'closed'}
            className={`p-2 rounded-lg transition-colors ${
              session.status === 'closed'
                ? 'bg-[#D4E4D4]/30 text-gray-800/20 cursor-not-allowed'
                : 'bg-[#D4E4D4] hover:bg-[#00A651] text-white'
            }`}
            title={session.status === 'closed' ? 'Session is locked' : 'Edit Session'}
          >
            <Edit2 className="w-5 h-5" />
          </button>

          {/* Unlock (admin only, closed sessions only) */}
          {session.status === 'closed' && canUnlock && (
            <button
              onClick={onUnlockSession}
              className="p-2 bg-amber-600/50 hover:bg-amber-500 text-amber-300 hover:text-white rounded-lg transition-colors"
              title="Unlock Session (Admin)"
            >
              <Unlock className="w-5 h-5" />
            </button>
          )}

          {/* Status Toggle */}
          {session.status === 'draft' && (
            <button
              onClick={() => onStatusChange(session.id, 'active')}
              className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              title="Start Session"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
          {session.status === 'active' && (
            <button
              onClick={() => onStatusChange(session.id, 'completed')}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              title="Complete Session"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
          {(session.status === 'active' || session.status === 'completed') && (
            <button
              onClick={onCloseSession}
              className="p-2 bg-red-900/50 hover:bg-red-700 text-red-400 hover:text-white rounded-lg transition-colors"
              title="Close & Lock Session"
            >
              <Lock className="w-5 h-5" />
            </button>
          )}

          {/* Delete (disabled when closed) */}
          <button
            onClick={onDelete}
            disabled={session.status === 'closed'}
            className={`p-2 rounded-lg transition-colors ${
              session.status === 'closed'
                ? 'bg-red-900/20 text-red-400/20 cursor-not-allowed'
                : 'bg-red-900/50 hover:bg-red-600 text-red-400 hover:text-white'
            }`}
            title={session.status === 'closed' ? 'Unlock session first' : 'Delete Session'}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
};

// Session Create/Edit Modal
const SessionModal = ({ session, sessions, onClose, onSave }) => {
  const { players: allPlayers, teams } = useData();
  const [formData, setFormData] = useState({
    name: session?.name || '',
    sessionType: session?.sessionType || 'hour-1',
    date: session?.date ? new Date(session.date.seconds * 1000).toISOString().split('T')[0] : '',
    startTime: session?.startTime || '',
    endTime: session?.endTime || '',
    endTimeAutoFilled: false,
    venue: session?.venue || '',
    ageGroup: session?.ageGroup || '',
    linkedHour1SessionId: session?.linkedHour1SessionId || '',
    players: session?.players || [],
    assessors: session?.assessors || []
  });
  const [saving, setSaving] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', age: '', playerAgeGroup: '' });
  const [playerMode, setPlayerMode] = useState('existing'); // 'existing' | 'new'
  const [playerSearch, setPlayerSearch] = useState('');
  const [newAssessor, setNewAssessor] = useState({ name: '', email: '', role: 'volunteer' });
  const [systemCoaches, setSystemCoaches] = useState([]);
  const [coachSearch, setCoachSearch] = useState('');
  const [showCoachDropdown, setShowCoachDropdown] = useState(false);

  // Fetch system coaches on mount
  useEffect(() => {
    const loadCoaches = async () => {
      const [coaches, assessors] = await Promise.all([
        fetchUsersByRole('coach'),
        fetchUsersByRole('tryout_assessor')
      ]);
      setSystemCoaches([...coaches, ...assessors]);
    };
    loadCoaches();
  }, []);

  // Helper to get team name by ID
  const getTeamName = (teamId) => {
    const team = teams?.find(t => t.id === teamId);
    return team?.name || '';
  };

  // Calculate player age from dateOfBirth
  const calcAge = (dob) => {
    if (!dob) return '';
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return String(age);
  };

  // Check if a player is overage for the session's age group
  const isPlayerOverage = (player) => {
    if (!formData.ageGroup || formData.ageGroup === 'Senior') return false;
    const maxAge = AGE_GROUP_MAX_AGE[formData.ageGroup];
    if (!maxAge) return false;
    const age = parseInt(calcAge(player.dateOfBirth));
    return !isNaN(age) && age >= maxAge;
  };

  // Filter existing players for search dropdown
  const filteredPlayers = (allPlayers || []).filter(p => {
    if (!playerSearch.trim()) return true;
    const search = playerSearch.toLowerCase();
    const teamName = getTeamName(p.teamId).toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(search) ||
      teamName.includes(search) ||
      (p.ageGroup || '').toLowerCase().includes(search)
    );
  }).sort((a, b) => {
    // Show eligible players first, overage at bottom
    const aOver = isPlayerOverage(a) ? 1 : 0;
    const bOver = isPlayerOverage(b) ? 1 : 0;
    return aOver - bOver;
  });

  // Filter coaches for search dropdown
  const filteredCoaches = systemCoaches.filter(c => {
    if (!coachSearch.trim()) return true;
    const search = coachSearch.toLowerCase();
    const teamLabel = (c.teamNames || []).join(', ').toLowerCase();
    return (
      (c.displayName || '').toLowerCase().includes(search) ||
      (c.email || '').toLowerCase().includes(search) ||
      teamLabel.includes(search)
    );
  });

  // Get available Hour 1 sessions for linking
  const hour1Sessions = sessions?.filter(s =>
    s.sessionType === 'hour-1' &&
    s.id !== session?.id &&
    (!formData.ageGroup || s.ageGroup === formData.ageGroup)
  ) || [];

  // Get session type config
  const currentSessionType = SESSION_TYPES.find(t => t.id === formData.sessionType);

  // Calculate duration for display
  const durationMins = durationBetween(formData.startTime, formData.endTime);

  // Auto-fill end time when start time or session type changes
  const handleStartTimeChange = (newStartTime) => {
    const defaultDuration = currentSessionType?.defaultDurationMins || 90;
    const newEndTime = autoCalcEndTime(newStartTime, defaultDuration);
    setFormData(prev => ({
      ...prev,
      startTime: newStartTime,
      endTime: newEndTime,
      endTimeAutoFilled: true
    }));
  };

  // When session type changes, re-calc end time if start is set
  const handleSessionTypeChange = (newType) => {
    const typeConfig = SESSION_TYPES.find(t => t.id === newType);
    const update = {
      sessionType: newType,
      linkedHour1SessionId: newType === 'hour-1' ? '' : formData.linkedHour1SessionId
    };
    if (formData.startTime && typeConfig) {
      update.endTime = autoCalcEndTime(formData.startTime, typeConfig.defaultDurationMins);
      update.endTimeAutoFilled = true;
    }
    setFormData(prev => ({ ...prev, ...update }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Clean up the endTimeAutoFilled flag before saving
    const { endTimeAutoFilled, ...dataToSave } = formData;
    await onSave({
      ...dataToSave,
      date: dataToSave.date ? new Date(dataToSave.date) : null
    });

    setSaving(false);
  };

  const addPlayer = () => {
    if (!newPlayer.name.trim()) return;
    setFormData(prev => ({
      ...prev,
      players: [...prev.players, {
        id: `player-${Date.now()}`,
        name: newPlayer.name.trim(),
        number: newPlayer.number.trim(),
        age: newPlayer.age.trim(),
        playerAgeGroup: newPlayer.playerAgeGroup || formData.ageGroup || ''
      }]
    }));
    setNewPlayer({ name: '', number: '', age: '', playerAgeGroup: '' });
  };

  const addExistingPlayer = (player) => {
    // Prevent duplicates
    if (formData.players.some(p => p.linkedPlayerId === player.id)) return;
    const teamName = getTeamName(player.teamId);
    const age = calcAge(player.dateOfBirth);
    setFormData(prev => ({
      ...prev,
      players: [...prev.players, {
        id: `player-${Date.now()}`,
        linkedPlayerId: player.id,
        name: player.name || '',
        number: player.playerNumber ? String(player.playerNumber) : '',
        age: age,
        playerAgeGroup: player.ageGroup || formData.ageGroup || '',
        teamName: teamName
      }]
    }));
    setPlayerSearch('');
  };

  const removePlayer = (playerId) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
  };

  const addAssessor = () => {
    if (!newAssessor.name.trim()) return;
    const assessorRecord = {
      id: `assessor-${Date.now()}`,
      name: newAssessor.name.trim(),
      email: newAssessor.email.trim(),
      role: newAssessor.role,
      addedAt: new Date().toISOString()
    };
    if (newAssessor.userId) {
      assessorRecord.userId = newAssessor.userId;
    }
    setFormData(prev => ({
      ...prev,
      assessors: [...prev.assessors, assessorRecord]
    }));
    setNewAssessor({ name: '', email: '', role: 'volunteer' });
    setCoachSearch('');
    setShowCoachDropdown(false);
  };

  const selectCoach = (coach) => {
    const teamLabel = (coach.teamNames || []).join(', ');
    setNewAssessor(prev => ({
      name: coach.displayName,
      email: coach.email,
      role: prev.role,
      userId: coach.id
    }));
    setCoachSearch(coach.displayName + (teamLabel ? ` (${teamLabel})` : ''));
    setShowCoachDropdown(false);
  };

  const removeAssessor = (assessorId) => {
    setFormData(prev => ({
      ...prev,
      assessors: prev.assessors.filter(a => a.id !== assessorId)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#D4E4D4] p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {session ? 'Edit Tryout Session' : 'Create Tryout Session'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Session Type Selection */}
          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-2">Session Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {SESSION_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleSessionTypeChange(type.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.sessionType === type.id
                      ? type.id === 'hour-1'
                        ? 'border-violet-500 bg-violet-500/20'
                        : 'border-orange-500 bg-orange-500/20'
                      : 'border-[#D4E4D4] hover:border-[#00A651]'
                  }`}
                >
                  <p className={`font-medium ${
                    formData.sessionType === type.id
                      ? type.id === 'hour-1' ? 'text-violet-300' : 'text-orange-300'
                      : 'text-gray-800'
                  }`}>
                    {type.label}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{type.description}</p>
                  <p className="text-[#00A651] text-xs mt-1">{type.durationLabel}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-2">Session Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={`e.g., ${formData.ageGroup || 'U12'} Boys - ${formData.sessionType === 'hour-1' ? 'Hour 1' : 'Hour 2'}`}
                className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#00A651] text-sm font-medium mb-2">Age Group *</label>
                <select
                  value={formData.ageGroup}
                  onChange={(e) => setFormData(prev => ({ ...prev, ageGroup: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
                  required
                >
                  <option value="">Select age group</option>
                  {AGE_GROUPS.map(ag => (
                    <option key={ag} value={ag}>{ag}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#00A651] text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
                />
              </div>
            </div>

            {/* Time Range - native time pickers with auto-fill */}
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-2">
                Session Time
                {durationMins && (
                  <span className="ml-2 text-gray-400 font-normal">({durationMins} min)</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Start</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">
                    End
                    {formData.endTimeAutoFilled && formData.endTime && (
                      <span className="text-[#00A651] ml-1">(auto-filled)</span>
                    )}
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value, endTimeAutoFilled: false }))}
                    className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
                  />
                </div>
              </div>
              {formData.startTime && formData.endTime && (
                <p className="text-gray-400 text-xs mt-2">
                  {formatTime24to12(formData.startTime)} - {formatTime24to12(formData.endTime)}
                  {durationMins && ` (${durationMins} min)`}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-2">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                placeholder="e.g., Emerald Indoor Courts"
                className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
              />
            </div>

            {/* Link to Hour 1 Session (for Hour 2 only) */}
            {formData.sessionType === 'hour-2' && (
              <div>
                <label className="block text-[#00A651] text-sm font-medium mb-2">
                  <Link2 className="w-4 h-4 inline mr-1" />
                  Link to Hour 1 Session
                </label>
                <select
                  value={formData.linkedHour1SessionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedHour1SessionId: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
                >
                  <option value="">No link (standalone session)</option>
                  {hour1Sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.ageGroup}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-xs mt-1">
                  Linking allows you to promote top players from Hour 1 to this session
                </p>
              </div>
            )}
          </div>

          {/* Players Section */}
          <div>
            <h3 className="text-gray-800 font-medium mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00A651]" />
              Players ({formData.players.length})
              {formData.sessionType === 'hour-1' && (
                <span className="text-violet-300 text-xs ml-2">Team 3 + Newcomers</span>
              )}
              {formData.sessionType === 'hour-2' && (
                <span className="text-orange-300 text-xs ml-2">Team 1 & 2 + Promoted</span>
              )}
            </h3>

            {/* Player Mode Toggle */}
            <div className="flex mb-3 bg-[#F5F9F5] rounded-lg p-1 border border-[#D4E4D4]">
              <button
                type="button"
                onClick={() => setPlayerMode('existing')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  playerMode === 'existing'
                    ? 'bg-[#005028] text-white'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Existing Player
              </button>
              <button
                type="button"
                onClick={() => setPlayerMode('new')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  playerMode === 'new'
                    ? 'bg-[#005028] text-white'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                New Player
              </button>
            </div>

            {/* Add Player Form */}
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3 mb-3 space-y-2">
              {playerMode === 'existing' ? (
                /* Existing Player - searchable dropdown */
                <div className="relative">
                  <div className="flex items-center gap-1 bg-white border border-[#D4E4D4] rounded-lg px-3 py-2">
                    <Search className="w-4 h-4 text-[#6B7C6B] flex-shrink-0" />
                    <input
                      type="text"
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      placeholder="Search players by name, team, age group..."
                      className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm focus:outline-none"
                    />
                  </div>
                  {playerSearch.trim() && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-[#D4E4D4] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredPlayers.length > 0 ? (
                        filteredPlayers.slice(0, 20).map(player => {
                          const teamName = getTeamName(player.teamId);
                          const age = calcAge(player.dateOfBirth);
                          const alreadyAdded = formData.players.some(p => p.linkedPlayerId === player.id);
                          const overage = isPlayerOverage(player);
                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => {
                                if (alreadyAdded) return;
                                if (overage && !window.confirm(`${player.name} is age ${age}, overage for ${formData.ageGroup}. Add anyway?`)) return;
                                addExistingPlayer(player);
                              }}
                              disabled={alreadyAdded}
                              className={`w-full text-left px-3 py-2 text-sm ${
                                alreadyAdded
                                  ? 'opacity-40 cursor-not-allowed'
                                  : overage ? 'hover:bg-red-500/10 bg-red-500/5' : 'hover:bg-gray-100'
                              }`}
                            >
                              <span className={`font-medium ${overage ? 'text-red-300' : 'text-gray-800'}`}>{player.name}</span>
                              {teamName && <span className="text-[#00A651] ml-1">- {teamName}</span>}
                              {player.ageGroup && <span className="text-gray-400 ml-1">- {player.ageGroup}</span>}
                              {age && <span className="text-gray-400 ml-1">- Age {age}</span>}
                              {overage && <span className="text-red-400 ml-2 font-medium">(overage)</span>}
                              {alreadyAdded && <span className="text-orange-400 ml-2">(added)</span>}
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-2 text-[#6B7C6B] text-sm">No players found</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* New Player - manual entry */
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Player name"
                      className="flex-1 px-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:border-[#00A651] focus:outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlayer())}
                    />
                    <input
                      type="text"
                      value={newPlayer.number}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="#"
                      className="w-14 px-2 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:border-[#00A651] focus:outline-none text-center"
                    />
                    <input
                      type="text"
                      value={newPlayer.age}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Age"
                      className="w-14 px-2 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:border-[#00A651] focus:outline-none text-center"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={newPlayer.playerAgeGroup}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, playerAgeGroup: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
                    >
                      <option value="">Age Group: {formData.ageGroup || 'same as session'}</option>
                      {AGE_GROUPS.map(ag => (
                        <option key={ag} value={ag}>{ag}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addPlayer}
                      className="px-4 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg font-medium text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Players List */}
            {formData.players.length > 0 ? (
              <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg divide-y divide-[#D4E4D4] max-h-48 overflow-y-auto">
                {formData.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="w-8 h-8 bg-[#D4E4D4] rounded-full flex items-center justify-center text-gray-800 text-xs font-bold flex-shrink-0">
                        {player.number || '?'}
                      </span>
                      <span className="text-gray-800 text-sm">{player.name}</span>
                      {player.age && <span className="text-[#00A651] text-xs">Age {player.age}</span>}
                      {(player.playerAgeGroup || player.ageGroup) && (
                        <span className="px-1.5 py-0.5 bg-[#D4E4D4]/50 text-gray-800 text-xs rounded">
                          {player.playerAgeGroup || player.ageGroup}
                        </span>
                      )}
                      {player.linkedPlayerId && (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                          linked
                        </span>
                      )}
                      {player.promotedFromHour1 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded">
                          <ArrowUpCircle className="w-3 h-3" />
                          Promoted
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlayer(player.id)}
                      className="text-red-400 hover:text-red-300 flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6B7C6B] text-sm text-center py-4">No players added yet</p>
            )}
          </div>

          {/* Assessors Section */}
          <div>
            <h3 className="text-gray-800 font-medium mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#00A651]" />
              Assessors ({formData.assessors.length})
            </h3>

            {/* Add Assessor Form */}
            <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3 mb-3 space-y-2">
              <div className="flex gap-2 items-center">
                <select
                  value={newAssessor.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    setNewAssessor({ name: '', email: '', role });
                    setCoachSearch('');
                    setShowCoachDropdown(false);
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="coach">Coach</option>
                  <option value="team_manager">Team Manager</option>
                  <option value="tryout_assessor">Tryout Assessor</option>
                </select>
              </div>

              {/* Coach selection from system users */}
              {(newAssessor.role === 'coach' || newAssessor.role === 'tryout_assessor') ? (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="flex items-center gap-1 bg-white border border-[#D4E4D4] rounded-lg px-3 py-2">
                      <Search className="w-4 h-4 text-[#6B7C6B] flex-shrink-0" />
                      <input
                        type="text"
                        value={coachSearch}
                        onChange={(e) => {
                          setCoachSearch(e.target.value);
                          setShowCoachDropdown(true);
                          // Clear previous selection if user edits
                          if (newAssessor.userId) {
                            setNewAssessor(prev => ({ ...prev, name: '', email: '', userId: undefined }));
                          }
                        }}
                        onFocus={() => setShowCoachDropdown(true)}
                        placeholder="Search coaches..."
                        className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm focus:outline-none"
                      />
                    </div>
                    {showCoachDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-[#D4E4D4] rounded-lg shadow-xl max-h-40 overflow-y-auto">
                        {filteredCoaches.length > 0 ? (
                          filteredCoaches.map(coach => {
                            const teamLabel = (coach.teamNames || []).join(', ');
                            return (
                              <button
                                key={coach.id}
                                type="button"
                                onClick={() => selectCoach(coach)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                              >
                                <span className="text-gray-800">{coach.displayName}</span>
                                {teamLabel && (
                                  <span className="text-[#00A651] ml-1">({teamLabel})</span>
                                )}
                                {coach.email && (
                                  <span className="text-gray-400 ml-1 text-xs">{coach.email}</span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-3 py-2 text-[#6B7C6B] text-sm">No coaches found</p>
                        )}
                      </div>
                    )}
                  </div>
                  {newAssessor.userId && (
                    <p className="text-[#00A651] text-xs">
                      Selected: {newAssessor.name} ({newAssessor.email})
                    </p>
                  )}
                </div>
              ) : (
                /* Manual entry for Volunteer, Team Manager, Committee */
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAssessor.name}
                    onChange={(e) => setNewAssessor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Assessor name"
                    className="flex-1 px-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:border-[#00A651] focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAssessor())}
                  />
                  <input
                    type="email"
                    value={newAssessor.email}
                    onChange={(e) => setNewAssessor(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email (optional)"
                    className="flex-1 px-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:border-[#00A651] focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addAssessor}
                  disabled={!newAssessor.name.trim()}
                  className="px-4 py-2 bg-[#005028] hover:bg-[#00A651] disabled:bg-[#D4E4D4] disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Assessors List */}
            {formData.assessors.length > 0 ? (
              <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg divide-y divide-[#D4E4D4]">
                {formData.assessors.map((assessor) => (
                  <div key={assessor.id} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 text-sm">{assessor.name}</span>
                      {assessor.email && <span className="text-[#00A651] text-xs">{assessor.email}</span>}
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        assessor.role === 'coach' ? 'bg-green-500/20 text-green-300' :
                        assessor.role === 'tryout_assessor' ? 'bg-violet-500/20 text-violet-300' :
                        assessor.role === 'team_manager' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-[#D4E4D4]/50 text-gray-600'
                      }`}>
                        {assessor.role === 'team_manager' ? 'Team Manager' :
                         assessor.role === 'tryout_assessor' ? 'Assessor' :
                         assessor.role || 'volunteer'}
                      </span>
                      {assessor.userId && (
                        <span className="text-[#00A651] text-xs">(linked)</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssessor(assessor.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6B7C6B] text-sm text-center py-4">No assessors added yet</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#D4E4D4]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg font-medium hover:border-[#00A651] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim() || !formData.ageGroup}
              className="flex-1 py-3 bg-[#005028] hover:bg-[#00A651] disabled:bg-[#D4E4D4] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#D4E4D4] border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {session ? 'Update Session' : 'Create Session'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Promote Players Modal
const PromotePlayersModal = ({ session, sessions, onClose, onPromote }) => {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [targetSessionId, setTargetSessionId] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState(null);

  // Get available Hour 2 sessions for this age group
  const hour2Sessions = sessions.filter(s =>
    s.sessionType === 'hour-2' &&
    s.ageGroup === session.ageGroup &&
    (s.linkedHour1SessionId === session.id || !s.linkedHour1SessionId)
  );

  // Filter out already promoted players
  const availablePlayers = session.players?.filter(p => !p.promotedToHour2) || [];

  const togglePlayer = (playerId) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handlePromote = async () => {
    if (!targetSessionId || selectedPlayers.length === 0) return;

    setPromoting(true);
    const promoteResult = await onPromote(targetSessionId, selectedPlayers);
    setResult(promoteResult);
    setPromoting(false);

    if (promoteResult.success) {
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border-2 border-orange-500/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#D4E4D4] p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ArrowUpCircle className="w-6 h-6 text-orange-400" />
              Promote Players
            </h2>
            <p className="text-orange-300 text-sm">Move top performers to Hour 2</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Success/Error Result */}
          {result && (
            <div className={`p-4 rounded-lg ${
              result.success
                ? 'bg-green-500/20 border border-green-500'
                : 'bg-red-500/20 border border-red-500'
            }`}>
              {result.success ? (
                <p className="text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {result.promotedCount} player{result.promotedCount > 1 ? 's' : ''} promoted successfully!
                </p>
              ) : (
                <p className="text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {result.error}
                </p>
              )}
            </div>
          )}

          {/* Target Session Selection */}
          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-2">
              Promote to Hour 2 Session
            </label>
            {hour2Sessions.length > 0 ? (
              <select
                value={targetSessionId}
                onChange={(e) => setTargetSessionId(e.target.value)}
                className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select Hour 2 session...</option>
                {hour2Sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.players?.length || 0} players)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  No Hour 2 sessions available for {session.ageGroup}. Create one first.
                </p>
              </div>
            )}
          </div>

          {/* Player Selection */}
          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-2">
              Select Players to Promote ({selectedPlayers.length} selected)
            </label>
            {availablePlayers.length > 0 ? (
              <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg divide-y divide-[#D4E4D4] max-h-60 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => togglePlayer(player.id)}
                      className="w-5 h-5 rounded border-[#D4E4D4] bg-[#F5F9F5] text-orange-500 focus:ring-orange-500"
                    />
                    <span className="w-10 h-10 bg-[#D4E4D4] rounded-full flex items-center justify-center text-gray-800 font-bold">
                      {player.number || '?'}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{player.name}</p>
                      {player.age && <p className="text-[#00A651] text-xs">Age {player.age}</p>}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-center">
                <p className="text-[#6B7C6B]">All players have been promoted</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#D4E4D4]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg font-medium hover:border-[#00A651] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePromote}
              disabled={promoting || !targetSessionId || selectedPlayers.length === 0}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-[#D4E4D4] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {promoting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Promoting...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5" />
                  Promote {selectedPlayers.length} Player{selectedPlayers.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TryoutSessionsPage;
