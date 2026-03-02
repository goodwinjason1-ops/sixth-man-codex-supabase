import React, { useState, useEffect, useMemo } from 'react';
import { useFilteredData } from '../hooks/useFilteredData';
import PageShell from '../components/PageShell';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Trophy,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Lock,
  Star,
  Loader2,
  AlertCircle,
  Shield,
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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/** Metric labels (same order as MatchDayAssessmentPage) */
const METRIC_LABELS = {
  teamWork: 'Team Work',
  defense: 'Defense',
  ballMovement: 'Ball Movement',
  offense: 'Offense',
  shotSelection: 'Shot Selection',
  sportsmanship: 'Sportsmanship',
};

const METRIC_IDS = Object.keys(METRIC_LABELS);

/** Color for a 1-5 rating */
const ratingColor = (v) => {
  if (v <= 1) return 'bg-red-500 text-white';
  if (v === 2) return 'bg-orange-500 text-white';
  if (v === 3) return 'bg-yellow-500 text-white';
  if (v === 4) return 'bg-[#005028] text-white';
  return 'bg-[#86efac] text-gray-800';
};

/** Result badge */
const ResultBadge = ({ result }) => {
  const config = {
    win: { label: 'W', cls: 'bg-green-600 text-white' },
    loss: { label: 'L', cls: 'bg-red-600 text-white' },
    draw: { label: 'D', cls: 'bg-gray-500 text-white' },
  };
  const c = config[result] || config.draw;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
const MatchHistoryPage = () => {
  const { teams, players, currentUser, loading, userTeamIds } = useFilteredData();

  // Firestore-direct state
  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  // UI state
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  // ---------------------------------------------------------------------------
  // Subscribe to the "games" collection for this coach's assessments.
  // The MatchDayAssessmentPage saves to `games` with coachId.
  // We listen for all games where coachId === current user OR teamId is in coach's teams.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser?.uid || !userTeamIds || userTeamIds.length === 0) {
      setAssessments([]);
      setAssessmentsLoading(false);
      return;
    }

    setAssessmentsLoading(true);

    // Firestore "in" queries are limited to 30 values.
    // For most coaches this won't be an issue, but guard against it.
    const teamBatch = userTeamIds.slice(0, 30);

    const q = query(
      collection(db, 'games'),
      where('teamId', 'in', teamBatch),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAssessments(data);
        setAssessmentsLoading(false);
      },
      (err) => {
        console.error('games snapshot error:', err);
        setAssessments([]);
        setAssessmentsLoading(false);
      }
    );

    return unsub;
  }, [currentUser?.uid, userTeamIds]);

  // ---------------------------------------------------------------------------
  // Build a player ID -> name lookup map
  // ---------------------------------------------------------------------------
  const playerNameMap = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p.name || p.displayName || 'Unknown';
    });
    return map;
  }, [players]);

  // ---------------------------------------------------------------------------
  // Filtered assessments
  // ---------------------------------------------------------------------------
  const filteredAssessments = useMemo(() => {
    if (selectedTeamId === 'all') return assessments;
    return assessments.filter((a) => a.teamId === selectedTeamId);
  }, [assessments, selectedTeamId]);

  // ---------------------------------------------------------------------------
  // Toggle expanded card
  // ---------------------------------------------------------------------------
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ---------------------------------------------------------------------------
  // Render a single assessment card
  // ---------------------------------------------------------------------------
  const renderAssessmentCard = (assessment) => {
    const dateParsed = parseDate(assessment.date);
    const isExpanded = expandedId === assessment.id;

    // Count assessed players
    const playerAssessments = assessment.playerAssessments || {};
    const assessedPlayerIds = Object.keys(playerAssessments);
    const assessedCount = assessedPlayerIds.length;

    return (
      <div
        key={assessment.id}
        className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden"
      >
        {/* Card Header - Clickable */}
        <button
          onClick={() => toggleExpand(assessment.id)}
          className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#F5F9F5] transition-colors text-left"
        >
          {/* Result badge */}
          <div className="flex-shrink-0">
            <ResultBadge result={assessment.result} />
          </div>

          {/* Match info */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-semibold text-sm truncate">
              {assessment.teamName || 'Team'} vs {assessment.opponent || 'Unknown'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7C6B] mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {fmtDate(dateParsed)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {assessedCount} player{assessedCount !== 1 ? 's' : ''} assessed
              </span>
            </div>
          </div>

          {/* Expand/Collapse icon */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#6B7C6B] flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#6B7C6B] flex-shrink-0" />
          )}
        </button>

        {/* Expanded Detail */}
        {isExpanded && (
          <div className="border-t border-[#D4E4D4] px-4 pb-4 pt-3 space-y-5">
            {/* Team Metrics Summary */}
            {assessment.teamMetrics && Object.keys(assessment.teamMetrics).length > 0 && (
              <div>
                <h4 className="text-gray-800 font-semibold text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#00A651]" />
                  Team Performance
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {METRIC_IDS.map((mId) => {
                    const val = assessment.teamMetrics[mId];
                    if (!val) return null;
                    return (
                      <div key={mId} className="text-center">
                        <p className="text-[10px] text-[#6B7C6B] mb-1 truncate">{METRIC_LABELS[mId]}</p>
                        <span className={`inline-block w-8 h-8 rounded-lg text-sm font-bold leading-8 ${ratingColor(val)}`}>
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Player Ratings Table */}
            {assessedCount > 0 && (
              <div>
                <h4 className="text-gray-800 font-semibold text-sm mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00A651]" />
                  Player Ratings
                </h4>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[#D4E4D4]">
                        <th className="text-left py-2 pr-2 text-[#6B7C6B] font-medium">Player</th>
                        {METRIC_IDS.map((mId) => (
                          <th key={mId} className="text-center py-2 px-1 text-[#6B7C6B] font-medium whitespace-nowrap">
                            {METRIC_LABELS[mId].split(' ').map((w) => w[0]).join('')}
                          </th>
                        ))}
                        <th className="text-center py-2 px-1 text-[#6B7C6B] font-medium">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessedPlayerIds.map((pId) => {
                        const pData = playerAssessments[pId];
                        const metrics = pData.metrics || {};
                        const playerName = pData.playerName || playerNameMap[pId] || 'Unknown';
                        const vals = METRIC_IDS.map((mId) => metrics[mId]).filter(Boolean);
                        const avg = vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '-';

                        return (
                          <tr key={pId} className="border-b border-[#D4E4D4]/50">
                            <td className="py-2 pr-2 text-gray-800 font-medium whitespace-nowrap">
                              {pData.playerNumber ? `#${pData.playerNumber} ` : ''}
                              {playerName}
                            </td>
                            {METRIC_IDS.map((mId) => {
                              const val = metrics[mId];
                              return (
                                <td key={mId} className="text-center py-2 px-1">
                                  {val ? (
                                    <span className={`inline-block w-6 h-6 rounded text-xs font-bold leading-6 ${ratingColor(val)}`}>
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-[#6B7C6B]">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center py-2 px-1">
                              <span className="font-bold text-gray-800">{avg}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table legend */}
                <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-[#6B7C6B]">
                  {METRIC_IDS.map((mId) => (
                    <span key={mId}>
                      {METRIC_LABELS[mId].split(' ').map((w) => w[0]).join('')} = {METRIC_LABELS[mId]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {(assessment.generalNotes || assessment.teamRatingNotes) && (
              <div>
                <h4 className="text-gray-800 font-semibold text-sm mb-2">Match Notes</h4>
                {assessment.teamRatingNotes && (
                  <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3 mb-2">
                    <p className="text-[10px] text-[#6B7C6B] font-medium uppercase tracking-wide mb-1">Team Performance Notes</p>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{assessment.teamRatingNotes}</p>
                  </div>
                )}
                {assessment.generalNotes && (
                  <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3">
                    <p className="text-[10px] text-[#6B7C6B] font-medium uppercase tracking-wide mb-1">General Notes</p>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{assessment.generalNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Private Notes - Only visible to the coach who wrote them */}
            {assessment.coachId === currentUser?.uid && (
              <>
                {/* Player-level private notes */}
                {assessedPlayerIds.some(
                  (pId) =>
                    playerAssessments[pId]?.notesPrivate !== false &&
                    playerAssessments[pId]?.notes
                ) && (
                  <div>
                    <h4 className="text-gray-800 font-semibold text-sm mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#6B7C6B]" />
                      Private Notes
                    </h4>
                    <div className="space-y-2">
                      {assessedPlayerIds
                        .filter(
                          (pId) =>
                            playerAssessments[pId]?.notesPrivate !== false &&
                            playerAssessments[pId]?.notes
                        )
                        .map((pId) => {
                          const pData = playerAssessments[pId];
                          const playerName = pData.playerName || playerNameMap[pId] || 'Unknown';
                          return (
                            <div key={pId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-[#6B7C6B] font-medium mb-1">{playerName}</p>
                              <p className="text-gray-800 text-sm whitespace-pre-wrap">{pData.notes}</p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Public player notes */}
            {assessedPlayerIds.some(
              (pId) =>
                playerAssessments[pId]?.notesPrivate === false &&
                playerAssessments[pId]?.notes
            ) && (
              <div>
                <h4 className="text-gray-800 font-semibold text-sm mb-2">Player Notes</h4>
                <div className="space-y-2">
                  {assessedPlayerIds
                    .filter(
                      (pId) =>
                        playerAssessments[pId]?.notesPrivate === false &&
                        playerAssessments[pId]?.notes
                    )
                    .map((pId) => {
                      const pData = playerAssessments[pId];
                      const playerName = pData.playerName || playerNameMap[pId] || 'Unknown';
                      return (
                        <div key={pId} className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3">
                          <p className="text-xs text-[#6B7C6B] font-medium mb-1">{playerName}</p>
                          <p className="text-gray-800 text-sm whitespace-pre-wrap">{pData.notes}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* MVP Votes */}
            {assessment.mvpVoting?.votes && (
              <div>
                <h4 className="text-gray-800 font-semibold text-sm mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#FFD700]" />
                  MVP Votes
                </h4>
                <div className="space-y-2">
                  {[3, 2, 1].map((points) => {
                    const playerId = assessment.mvpVoting.votes[points];
                    if (!playerId) return null;

                    // Look up player name from the assessment data first, then from players list
                    const fromAssessment = playerAssessments[playerId]?.playerName;
                    const playerName = fromAssessment || playerNameMap[playerId] || 'Unknown';

                    return (
                      <div
                        key={points}
                        className="flex items-center gap-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          points === 3 ? 'bg-[#FFD700] text-gray-800' :
                          points === 2 ? 'bg-gray-300 text-gray-700' :
                          'bg-amber-700 text-white'
                        }`}>
                          <Star className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-medium text-sm truncate">{playerName}</p>
                          <p className="text-[#6B7C6B] text-xs">
                            {points} vote{points > 1 ? 's' : ''} -
                            {points === 3 ? ' Best on Ground' : points === 2 ? ' Second Best' : ' Third Best'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <PageShell title="Match History" backTo="/dashboard">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
          <p className="text-gray-500">Loading match history...</p>
        </div>
      </PageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PageShell title="Match History" backTo="/dashboard" breadcrumbs={[{ label: 'Home', url: '/welcome' }, { label: 'Dashboard', url: '/dashboard' }, { label: 'Match History' }]}>
      <div className="space-y-4">
        {/* Team filter dropdown */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            <Users className="w-4 h-4 inline-block mr-1 text-[#005028]" />
            Filter by Team
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#D4E4D4] rounded-lg text-gray-800 bg-[#F5F9F5] focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
          >
            <option value="all">All Teams</option>
            {(teams || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || t.id}
              </option>
            ))}
          </select>
        </div>

        {/* Assessment count */}
        {!assessmentsLoading && filteredAssessments.length > 0 && (
          <p className="text-xs text-[#6B7C6B] px-1">
            {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Assessments list */}
        {assessmentsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading assessments...</p>
          </div>
        ) : filteredAssessments.length > 0 ? (
          <div className="space-y-3">
            {filteredAssessments.map((a) => renderAssessmentCard(a))}
          </div>
        ) : (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-1">No Match Assessments Found</h3>
            <p className="text-[#6B7C6B] text-sm">
              No match assessments found. Record your first assessment from Match Day.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default MatchHistoryPage;
