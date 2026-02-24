import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFilteredData } from '../hooks/useFilteredData';
import PageShell from '../components/PageShell';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  ClipboardList,
  Calendar,
  Trophy,
  Check,
  X,
  ArrowRightLeft,
  Send,
  AlertCircle,
  User,
  Users,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Loader2,
  UserPlus,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely parse a Firestore date field into a JS Date */
const parseDate = (d) => {
  if (!d) return null;
  if (d.toDate) return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/** Format a Date object into a readable string */
const fmtDate = (d) => {
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const fmtLongDate = (d) => {
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ---------------------------------------------------------------------------
// Status badge component
// ---------------------------------------------------------------------------
const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    confirmed: 'bg-green-100 text-green-700 border border-green-300',
    swap_requested: 'bg-orange-100 text-orange-700 border border-orange-300',
    declined: 'bg-red-100 text-red-700 border border-red-300',
    completed: 'bg-gray-100 text-gray-600 border border-gray-300',
  };

  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    swap_requested: 'Swap Requested',
    declined: 'Declined',
    completed: 'Completed',
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Assign Modal
// ---------------------------------------------------------------------------
const AssignModal = ({ isOpen, onClose, onAssign, game, existingAssignment, teamParents }) => {
  const [selectedParentId, setSelectedParentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const isManualEntry = selectedParentId === '__manual__';

  const hasParents = teamParents && teamParents.length > 0;

  useEffect(() => {
    if (isOpen) {
      // If editing an existing assignment, try to match to a known parent
      if (existingAssignment) {
        const matchedParent = teamParents?.find(
          (p) =>
            p.displayName === existingAssignment.assignedName ||
            p.email === existingAssignment.assignedEmail
        );
        if (matchedParent) {
          setSelectedParentId(matchedParent.id);
          setParentName(matchedParent.displayName || '');
          setParentEmail(matchedParent.email || '');
        } else {
          setSelectedParentId('__manual__');
          setParentName(existingAssignment.assignedName || '');
          setParentEmail(existingAssignment.assignedEmail || '');
        }
      } else if (!hasParents) {
        // No parents available, default to manual entry
        setSelectedParentId('__manual__');
        setParentName('');
        setParentEmail('');
      } else {
        setSelectedParentId('');
        setParentName('');
        setParentEmail('');
      }
    }
  }, [isOpen, existingAssignment, teamParents, hasParents]);

  // When a parent is selected from the dropdown, auto-fill name and email
  const handleParentSelect = (value) => {
    setSelectedParentId(value);
    if (value && value !== '__manual__') {
      const parent = teamParents?.find((p) => p.id === value);
      if (parent) {
        setParentName(parent.displayName || '');
        setParentEmail(parent.email || '');
      }
    } else if (value === '__manual__') {
      setParentName('');
      setParentEmail('');
    } else {
      setParentName('');
      setParentEmail('');
    }
  };

  if (!isOpen || !game) return null;

  const gameDateParsed = parseDate(game.date);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentName.trim()) return;
    setSaving(true);
    try {
      await onAssign({
        assignedName: parentName.trim(),
        assignedEmail: parentEmail.trim() || null,
        assignedTo: (selectedParentId && selectedParentId !== '__manual__') ? selectedParentId : null,
      });
      onClose();
    } catch (err) {
      console.error('Assign error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 border border-[#D4E4D4]">
        <div className="p-5 border-b border-[#D4E4D4]">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00A651]" />
            {existingAssignment ? 'Reassign Scorer' : 'Assign Scorer'}
          </h3>
          <p className="text-sm text-[#6B7C6B] mt-1">
            {game.opponent ? `vs ${game.opponent}` : 'Game'} &mdash; {gameDateParsed ? fmtDate(gameDateParsed) : ''}{game.time ? ` at ${game.time}` : ''}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Parent selection dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Select Parent <span className="text-red-500">*</span>
            </label>
            {hasParents ? (
              <select
                value={selectedParentId}
                onChange={(e) => handleParentSelect(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#D4E4D4] rounded-lg text-gray-800 bg-[#F5F9F5] focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
                autoFocus
              >
                <option value="">-- Choose a parent --</option>
                {teamParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}{p.email ? ` (${p.email})` : ''}
                  </option>
                ))}
                <option value="__manual__">Other (manual entry)</option>
              </select>
            ) : (
              <p className="text-sm text-[#6B7C6B] italic mb-2">
                No parents registered for this team yet.
              </p>
            )}
          </div>

          {/* Manual entry fields (shown when "Other" selected or no parents exist) */}
          {(isManualEntry || !hasParents) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Parent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="w-full px-3 py-2.5 border border-[#D4E4D4] rounded-lg text-gray-800 bg-[#F5F9F5] focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
                  autoFocus={!hasParents}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Parent Email <span className="text-[#6B7C6B] text-xs">(optional)</span>
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="e.g. jane@example.com"
                  className="w-full px-3 py-2.5 border border-[#D4E4D4] rounded-lg text-gray-800 bg-[#F5F9F5] focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#D4E4D4] rounded-lg text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !parentName.trim()}
              className="flex-1 px-4 py-2.5 bg-[#005028] text-white rounded-lg text-sm font-medium hover:bg-[#005028]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {existingAssignment ? 'Reassign' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
const ScoringRosterPage = () => {
  const {
    teams,
    schedule,
    allPlayers,
    loading,
    currentUser,
    userProfile,
    addDocument,
    updateDocument,
  } = useFilteredData();

  // Firestore-direct state
  const [assignments, setAssignments] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [teamParents, setTeamParents] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [swapsLoading, setSwapsLoading] = useState(true);

  // UI state
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, game: null, existing: null });
  const [actionFeedback, setActionFeedback] = useState(null);

  // Select default team
  useEffect(() => {
    if (teams?.length && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  // Subscribe to scoring_assignments for selected team
  useEffect(() => {
    if (!selectedTeamId) {
      setAssignments([]);
      setAssignmentsLoading(false);
      return;
    }

    setAssignmentsLoading(true);
    const q = query(
      collection(db, 'scoring_assignments'),
      where('teamId', '==', selectedTeamId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAssignments(data);
        setAssignmentsLoading(false);
      },
      (err) => {
        console.error('scoring_assignments snapshot error:', err);
        setAssignments([]);
        setAssignmentsLoading(false);
      }
    );

    return unsub;
  }, [selectedTeamId]);

  // Subscribe to swap_requests for selected team
  useEffect(() => {
    if (!selectedTeamId) {
      setSwapRequests([]);
      setSwapsLoading(false);
      return;
    }

    setSwapsLoading(true);
    const q = query(
      collection(db, 'swap_requests'),
      where('teamId', '==', selectedTeamId),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSwapRequests(data);
        setSwapsLoading(false);
      },
      (err) => {
        console.error('swap_requests snapshot error:', err);
        setSwapRequests([]);
        setSwapsLoading(false);
      }
    );

    return unsub;
  }, [selectedTeamId]);

  // Load parents linked to the selected team
  useEffect(() => {
    if (!selectedTeamId || !allPlayers?.length) {
      setTeamParents([]);
      return;
    }

    // Get player IDs that belong to the selected team
    const teamPlayerIds = allPlayers
      .filter((p) => {
        const pTeams = p.teamIds || (p.teamId ? [p.teamId] : []);
        return pTeams.includes(selectedTeamId);
      })
      .map((p) => p.id);

    if (teamPlayerIds.length === 0) {
      setTeamParents([]);
      return;
    }

    // Query all parent users then filter client-side
    const fetchParents = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'parent')
        );
        const snap = await getDocs(q);
        const parents = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((parent) => {
            const linkedIds = parent.linkedPlayerIds || parent.children || [];
            return linkedIds.some((pid) => teamPlayerIds.includes(pid));
          })
          .map((parent) => ({
            id: parent.id,
            displayName: parent.displayName || parent.name || 'Unknown Parent',
            email: parent.email || '',
          }));
        // Sort alphabetically by name
        parents.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setTeamParents(parents);
      } catch (err) {
        console.error('Error fetching team parents:', err);
        setTeamParents([]);
      }
    };

    fetchParents();
  }, [selectedTeamId, allPlayers]);

  // Flash feedback helper
  const showFeedback = useCallback((msg, type = 'success') => {
    setActionFeedback({ msg, type });
    setTimeout(() => setActionFeedback(null), 3000);
  }, []);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const selectedTeam = useMemo(
    () => teams?.find((t) => t.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  // Upcoming + past games for selected team
  const { upcomingGames, pastGames } = useMemo(() => {
    if (!schedule?.length || !selectedTeamId) return { upcomingGames: [], pastGames: [] };

    const now = new Date();
    const teamGames = schedule.filter((ev) => {
      if (ev.type && ev.type !== 'game') return false;
      // Match by teamId or teamName
      if (ev.teamId === selectedTeamId) return true;
      if (selectedTeam && ev.teamName && ev.teamName.toLowerCase() === (selectedTeam.name || '').toLowerCase()) return true;
      return false;
    });

    const upcoming = [];
    const past = [];

    teamGames.forEach((g) => {
      const d = parseDate(g.date);
      if (!d) return;
      const entry = { ...g, _parsedDate: d };
      if (d >= now) {
        upcoming.push(entry);
      } else {
        past.push(entry);
      }
    });

    upcoming.sort((a, b) => a._parsedDate - b._parsedDate);
    past.sort((a, b) => b._parsedDate - a._parsedDate);

    return { upcomingGames: upcoming, pastGames: past };
  }, [schedule, selectedTeamId, selectedTeam]);

  // Build a map of gameId -> assignment for quick look-up
  const assignmentByGame = useMemo(() => {
    const map = {};
    assignments.forEach((a) => {
      map[a.gameId] = a;
    });
    return map;
  }, [assignments]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleAssign = useCallback(
    async (game, { assignedName, assignedEmail, assignedTo }) => {
      const existing = assignmentByGame[game.id];
      const gameDateParsed = parseDate(game.date);

      if (existing) {
        // Update existing assignment
        const res = await updateDocument('scoring_assignments', existing.id, {
          assignedName,
          assignedEmail: assignedEmail || null,
          assignedTo: assignedTo || null,
          status: 'pending',
        });
        if (res.success) {
          showFeedback(`Scorer reassigned to ${assignedName}`);
        } else {
          showFeedback('Failed to reassign scorer', 'error');
        }
      } else {
        // Create new assignment
        const res = await addDocument('scoring_assignments', {
          teamId: selectedTeamId,
          gameId: game.id,
          gameDate: gameDateParsed ? gameDateParsed.toISOString() : game.date,
          gameTime: game.time || null,
          opponent: game.opponent || null,
          assignedTo: assignedTo || null,
          assignedName,
          assignedEmail: assignedEmail || null,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.uid,
        });
        if (res.success) {
          showFeedback(`${assignedName} assigned as scorer`);
        } else {
          showFeedback('Failed to assign scorer', 'error');
        }
      }
    },
    [assignmentByGame, selectedTeamId, currentUser, addDocument, updateDocument, showFeedback]
  );

  const handleSendReminder = useCallback(
    async (game, assignment) => {
      const gameDateParsed = parseDate(game.date);
      const res = await addDocument('notifications', {
        type: 'scoring_reminder',
        title: 'Scoring Duty Reminder',
        message: `Reminder: You are assigned to score for ${game.opponent ? `vs ${game.opponent}` : 'the upcoming game'} on ${gameDateParsed ? fmtDate(gameDateParsed) : ''}${game.time ? ` at ${game.time}` : ''}.`,
        recipientName: assignment.assignedName,
        recipientEmail: assignment.assignedEmail || null,
        gameId: game.id,
        teamId: selectedTeamId,
        status: 'unread',
        date: new Date().toISOString(),
        createdBy: currentUser?.uid,
      });
      if (res.success) {
        showFeedback(`Reminder sent to ${assignment.assignedName}`);
      } else {
        showFeedback('Failed to send reminder', 'error');
      }
    },
    [selectedTeamId, currentUser, addDocument, showFeedback]
  );

  const handleSwapAction = useCallback(
    async (swap, action) => {
      const res = await updateDocument('swap_requests', swap.id, {
        status: action, // 'approved' or 'declined'
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser?.uid,
      });

      if (res.success && action === 'approved' && swap.gameId) {
        // Also update the scoring_assignment to reflect the new scorer
        const assignment = assignmentByGame[swap.gameId];
        if (assignment && swap.swapToName) {
          await updateDocument('scoring_assignments', assignment.id, {
            assignedName: swap.swapToName,
            assignedEmail: swap.swapToEmail || null,
            assignedTo: swap.swapToId || null,
            status: 'pending',
          });
        }
      }

      if (res.success) {
        showFeedback(`Swap request ${action}`);
      } else {
        showFeedback(`Failed to ${action} swap request`, 'error');
      }
    },
    [currentUser, assignmentByGame, updateDocument, showFeedback]
  );

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderGameCard = (game, isPast = false) => {
    const assignment = assignmentByGame[game.id];
    const gameDateParsed = game._parsedDate;

    return (
      <div
        key={game.id}
        className={`bg-white border border-[#D4E4D4] rounded-xl p-4 ${isPast ? 'opacity-70' : ''}`}
      >
        {/* Game Info Row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFD700]/20 flex-shrink-0">
            <Trophy className="w-5 h-5 text-[#B8860B]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-semibold text-sm">
              {game.opponent ? `vs ${game.opponent}` : 'Game'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7C6B] mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {fmtDate(gameDateParsed)}
              </span>
              {game.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {game.time}
                </span>
              )}
              {game.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {game.venue}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-day deadline warning */}
        {!isPast && (() => {
          const now = new Date();
          const msUntil = gameDateParsed - now;
          const daysUntil = Math.ceil(msUntil / (1000 * 60 * 60 * 24));
          if (daysUntil <= 3 && daysUntil >= 0 && (!assignment || assignment.status === 'pending')) {
            return (
              <div className="flex items-center gap-2 mb-2 px-1">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-xs text-orange-600 font-medium">
                  Game in {daysUntil} day{daysUntil !== 1 ? 's' : ''} — {assignment ? 'not confirmed' : 'no scorer assigned'}
                </span>
              </div>
            );
          }
          return null;
        })()}

        {/* Assignment Row */}
        <div className="bg-[#F5F9F5] rounded-lg p-3">
          {assignment ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 text-[#005028] flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {assignment.assignedName}
                </span>
                <StatusBadge status={assignment.status} />
              </div>

              {!isPast && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {assignment.status === 'pending' && (
                    <button
                      onClick={() => handleSendReminder(game, assignment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Send reminder"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setAssignModal({ open: true, game, existing: assignment })
                    }
                    className="p-2 text-[#005028] hover:bg-[#D4E4D4]/50 rounded-lg transition-colors"
                    title="Reassign"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7C6B] italic">No scorer assigned</span>
              {!isPast && (
                <button
                  onClick={() =>
                    setAssignModal({ open: true, game, existing: null })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005028] text-white rounded-lg text-xs font-medium hover:bg-[#005028]/90 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Assign
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <PageShell title="Scoring Roster" backTo="/welcome">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
          <p className="text-gray-500">Loading scoring roster...</p>
        </div>
      </PageShell>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <PageShell title="Scoring Roster" backTo="/welcome">
      <div className="space-y-6">
        {/* Feedback toast */}
        {actionFeedback && (
          <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
              actionFeedback.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-[#005028] text-white'
            }`}
          >
            {actionFeedback.msg}
          </div>
        )}

        {/* Team selector (if multiple teams) */}
        {teams?.length > 1 && (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              <Users className="w-4 h-4 inline-block mr-1 text-[#005028]" />
              Select Team
            </label>
            <select
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#D4E4D4] rounded-lg text-gray-800 bg-[#F5F9F5] focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Single team label */}
        {teams?.length === 1 && selectedTeam && (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#005028]" />
            <h2 className="text-gray-800 font-semibold">{selectedTeam.name}</h2>
          </div>
        )}

        {/* Swap Requests Section */}
        {!swapsLoading && swapRequests.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-5 h-5 text-orange-500" />
              <h2 className="text-gray-800 font-semibold">Swap Requests</h2>
              <span className="text-xs text-white bg-orange-500 px-2 py-0.5 rounded-full">
                {swapRequests.length}
              </span>
            </div>

            <div className="space-y-3">
              {swapRequests.map((swap) => {
                const swapGameDate = parseDate(swap.gameDate);
                return (
                  <div
                    key={swap.id}
                    className="bg-white border border-orange-200 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <ArrowRightLeft className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">
                          <span className="font-semibold">{swap.requestedByName || 'Unknown'}</span>
                          {' wants to swap with '}
                          <span className="font-semibold">{swap.swapToName || 'Unknown'}</span>
                        </p>
                        <p className="text-xs text-[#6B7C6B] mt-1">
                          {swap.opponent ? `vs ${swap.opponent}` : 'Game'}{' '}
                          {swapGameDate ? `on ${fmtDate(swapGameDate)}` : ''}
                        </p>
                        {swap.reason && (
                          <p className="text-xs text-[#6B7C6B] mt-1 italic">
                            Reason: {swap.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pl-13">
                      <button
                        onClick={() => handleSwapAction(swap, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleSwapAction(swap, 'declined')}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {swapsLoading && (
          <div className="flex items-center gap-2 text-[#6B7C6B] text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading swap requests...
          </div>
        )}

        {/* Upcoming Games */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-[#00A651]" />
            <h2 className="text-gray-800 font-semibold">Upcoming Games</h2>
            {upcomingGames.length > 0 && (
              <span className="text-xs text-[#6B7C6B] bg-[#D4E4D4]/50 px-2 py-0.5 rounded-full">
                {upcomingGames.length}
              </span>
            )}
          </div>

          {assignmentsLoading ? (
            <div className="flex items-center gap-2 text-[#6B7C6B] text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading assignments...
            </div>
          ) : upcomingGames.length > 0 ? (
            <div className="space-y-3">
              {upcomingGames.map((game) => renderGameCard(game, false))}
            </div>
          ) : (
            <div className="bg-white border border-[#D4E4D4] rounded-xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
              <h3 className="text-gray-800 font-semibold mb-1">No Upcoming Games</h3>
              <p className="text-[#6B7C6B] text-sm">
                No upcoming games scheduled for this team.
              </p>
            </div>
          )}
        </div>

        {/* Past Assignments (collapsed) */}
        {pastGames.length > 0 && (
          <div>
            <button
              onClick={() => setShowPast(!showPast)}
              className="flex items-center gap-2 w-full text-left px-1 py-2 text-[#6B7C6B] hover:text-gray-800 transition-colors"
            >
              {showPast ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                Past Assignments ({pastGames.length})
              </span>
            </button>

            {showPast && (
              <div className="space-y-3 mt-2">
                {pastGames.map((game) => renderGameCard(game, true))}
              </div>
            )}
          </div>
        )}

        {/* No swap requests message (only show after loading) */}
        {!swapsLoading && swapRequests.length === 0 && upcomingGames.length > 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-[#6B7C6B]">No pending swap requests</p>
          </div>
        )}
      </div>

      {/* Assign/Reassign Modal */}
      <AssignModal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, game: null, existing: null })}
        onAssign={(data) => handleAssign(assignModal.game, data)}
        game={assignModal.game}
        existingAssignment={assignModal.existing}
        teamParents={teamParents}
      />
    </PageShell>
  );
};

export default ScoringRosterPage;
