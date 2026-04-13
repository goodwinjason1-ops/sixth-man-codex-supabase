import { useState, useMemo } from 'react';
import { useFilteredData } from '../hooks/useFilteredData';
import PageShell from '../components/PageShell';
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
  MessageSquare,
  User,
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
  const { teams, players, matchAssessments, loading, userTeamIds } = useFilteredData();

  // UI state
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedMetrics, setExpandedMetrics] = useState({});

  const toggleMetric = (key) => {
    setExpandedMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------------------------------------------------------------------------
  // Filter match_assessments from DataContext to this coach's teams, sorted desc
  // ---------------------------------------------------------------------------
  const assessments = useMemo(() => {
    if (!userTeamIds || userTeamIds.length === 0) return [];
    return (matchAssessments || [])
      .filter(a => userTeamIds.includes(a.teamId))
      .sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });
  }, [matchAssessments, userTeamIds]);

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
            {/* 1. Team Performance — accordion metric rows */}
            {assessment.teamMetrics && Object.keys(assessment.teamMetrics).length > 0 && (
              <div>
                <h4 className="text-gray-800 font-semibold text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#00A651]" />
                  Team Performance
                </h4>
                <div className="space-y-1">
                  {METRIC_IDS.map((mId) => {
                    const val = assessment.teamMetrics[mId];
                    if (!val) return null;
                    const teamNote = assessment.teamMetricNotes?.[mId];
                    const hasNote = teamNote?.note;
                    const metricKey = `team-${assessment.id}-${mId}`;
                    const isOpen = expandedMetrics[metricKey];
                    return (
                      <div key={mId}>
                        <button
                          onClick={() => hasNote && toggleMetric(metricKey)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${hasNote ? 'hover:bg-[#F5F9F5] cursor-pointer' : 'cursor-default'} transition-colors`}
                        >
                          <span className="text-sm text-gray-800">{METRIC_LABELS[mId]}</span>
                          <div className="flex items-center gap-2">
                            {hasNote && <MessageSquare className="w-3 h-3 text-[#6B7C6B]" />}
                            {hasNote && teamNote.private && <Lock className="w-3 h-3 text-[#6B7C6B]" />}
                            <span className={`inline-block w-7 h-7 rounded text-xs font-bold leading-7 text-center ${ratingColor(val)}`}>{val}</span>
                            {hasNote && (isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#6B7C6B]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#6B7C6B]" />)}
                          </div>
                        </button>
                        {isOpen && hasNote && (
                          <div className={`mx-3 mb-2 px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${teamNote.private ? 'bg-gray-50 border border-gray-200' : 'bg-[#F5F9F5] border border-[#D4E4D4]'}`}>
                            {teamNote.private && <Lock className="w-3 h-3 text-[#6B7C6B] inline mr-1" />}
                            {teamNote.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Team Performance Notes */}
            {(() => {
              const teamPerfNotes = assessment.teamPerformanceNotes || {};
              const teamPerfNote = teamPerfNotes.note || assessment.teamRatingNotes || '';
              if (!teamPerfNote) return null;
              return (
                <div className={`rounded-lg p-3 ${teamPerfNotes.private ? 'bg-gray-50 border border-gray-200' : 'bg-[#F5F9F5] border border-[#D4E4D4]'}`}>
                  <p className="text-[10px] text-[#6B7C6B] font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
                    Team Performance Notes
                    {teamPerfNotes.private && <Lock className="w-3 h-3 text-[#6B7C6B]" />}
                  </p>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{teamPerfNote}</p>
                </div>
              );
            })()}

            {/* 3. General Match Notes */}
            {(() => {
              const generalNotes = assessment.generalMatchNotes || {};
              const generalNote = generalNotes.note || assessment.generalNotes || '';
              if (!generalNote) return null;
              return (
                <div className={`rounded-lg p-3 ${generalNotes.private ? 'bg-gray-50 border border-gray-200' : 'bg-[#F5F9F5] border border-[#D4E4D4]'}`}>
                  <p className="text-[10px] text-[#6B7C6B] font-medium uppercase tracking-wide mb-1 flex items-center gap-1">
                    General Notes
                    {generalNotes.private && <Lock className="w-3 h-3 text-[#6B7C6B]" />}
                  </p>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{generalNote}</p>
                </div>
              );
            })()}

            {/* 4. Individual Players — accordion metric rows per player */}
            {assessedCount > 0 && (
              <div className="space-y-4">
                {assessedPlayerIds.map((pId) => {
                  const pData = playerAssessments[pId];
                  const metrics = pData.metrics || {};
                  const playerName = pData.playerName || playerNameMap[pId] || 'Unknown';
                  const vals = METRIC_IDS.map((mId) => metrics[mId]).filter(Boolean);
                  const avg = vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '-';
                  const metricNotes = pData.metricNotes || {};
                  const noteText = pData.notes || '';
                  const publicNoteText = pData.publicNotes || '';
                  const privateNoteText = pData.privateNotes || '';
                  const isPrivate = pData.notesPrivate !== false;

                  return (
                    <div key={pId} className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
                      {/* Player header */}
                      <div className="px-3 py-2 bg-[#F5F9F5] border-b border-[#D4E4D4] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#00A651]" />
                          <span className="text-sm font-semibold text-gray-800">
                            {pData.playerNumber ? `#${pData.playerNumber} ` : ''}{playerName}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#005028]">Avg: {avg}</span>
                      </div>

                      {/* Player metric accordion rows */}
                      <div className="divide-y divide-[#D4E4D4]/50">
                        {METRIC_IDS.map((mId) => {
                          const val = metrics[mId];
                          if (!val) return null;
                          const mNote = metricNotes[mId];
                          const hasNote = mNote?.note;
                          const mKey = `player-${assessment.id}-${pId}-${mId}`;
                          const isOpen = expandedMetrics[mKey];
                          return (
                            <div key={mId}>
                              <button
                                onClick={() => hasNote && toggleMetric(mKey)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left ${hasNote ? 'hover:bg-[#F5F9F5] cursor-pointer' : 'cursor-default'} transition-colors`}
                              >
                                <span className="text-xs text-gray-700">{METRIC_LABELS[mId]}</span>
                                <div className="flex items-center gap-2">
                                  {hasNote && <MessageSquare className="w-3 h-3 text-[#6B7C6B]" />}
                                  {hasNote && mNote.private && <Lock className="w-3 h-3 text-[#6B7C6B]" />}
                                  <span className={`inline-block w-6 h-6 rounded text-xs font-bold leading-6 text-center ${ratingColor(val)}`}>{val}</span>
                                  {hasNote && (isOpen ? <ChevronUp className="w-3 h-3 text-[#6B7C6B]" /> : <ChevronDown className="w-3 h-3 text-[#6B7C6B]" />)}
                                </div>
                              </button>
                              {isOpen && hasNote && (
                                <div className={`mx-3 mb-2 px-3 py-2 rounded text-xs whitespace-pre-wrap ${mNote.private ? 'bg-gray-50 border border-gray-200' : 'bg-[#F5F9F5] border border-[#D4E4D4]'}`}>
                                  {mNote.private && <Lock className="w-3 h-3 text-[#6B7C6B] inline mr-1" />}
                                  {mNote.note}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Player-level notes */}
                      {(noteText || publicNoteText || privateNoteText) && (
                        <div className="px-3 py-2 border-t border-[#D4E4D4] space-y-1">
                          {noteText && (
                            <div className="flex items-start gap-1">
                              {isPrivate && <Lock className="w-3 h-3 text-[#6B7C6B] mt-0.5 flex-shrink-0" />}
                              <p className="text-gray-800 text-xs whitespace-pre-wrap">{noteText}</p>
                            </div>
                          )}
                          {publicNoteText && publicNoteText !== noteText && (
                            <p className="text-gray-800 text-xs whitespace-pre-wrap">{publicNoteText}</p>
                          )}
                          {privateNoteText && privateNoteText !== noteText && (
                            <div className="flex items-start gap-1">
                              <Lock className="w-3 h-3 text-[#6B7C6B] mt-0.5 flex-shrink-0" />
                              <p className="text-gray-800 text-xs whitespace-pre-wrap">{privateNoteText}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. MVP Votes */}
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
                          {assessment.mvpVoting.notes?.[points] && (
                            <p className="text-[#6B7C6B] text-xs mt-1 italic whitespace-pre-wrap">
                              &ldquo;{assessment.mvpVoting.notes[points]}&rdquo;
                            </p>
                          )}
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
        {!loading && filteredAssessments.length > 0 && (
          <p className="text-xs text-[#6B7C6B] px-1">
            {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Assessments list */}
        {filteredAssessments.length > 0 ? (
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
