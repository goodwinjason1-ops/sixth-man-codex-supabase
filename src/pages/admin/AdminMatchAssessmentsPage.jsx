import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import PageShell from '../../components/PageShell';
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
  BarChart3,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseDate = (d) => {
  if (!d) return null;
  if (d.toDate) return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const fmtDate = (d) => {
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const METRIC_LABELS = {
  teamWork: 'Team Work',
  defense: 'Defense',
  ballMovement: 'Ball Movement',
  offense: 'Offense',
  shotSelection: 'Shot Selection',
  sportsmanship: 'Sportsmanship',
};

const METRIC_IDS = Object.keys(METRIC_LABELS);

const ratingColor = (v) => {
  if (v <= 1) return 'bg-red-500 text-white';
  if (v === 2) return 'bg-orange-500 text-white';
  if (v === 3) return 'bg-yellow-500 text-white';
  if (v === 4) return 'bg-[#005028] text-white';
  return 'bg-[#86efac] text-gray-800';
};

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
const AdminMatchAssessmentsPage = () => {
  const { teams, players, matchAssessments, loading } = useData();

  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedMetrics, setExpandedMetrics] = useState({});

  const toggleMetric = (key) => {
    setExpandedMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // All assessments sorted desc
  const assessments = useMemo(() => {
    return (matchAssessments || []).slice().sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, [matchAssessments]);

  // Player name map
  const playerNameMap = useMemo(() => {
    const map = {};
    (players || []).forEach((p) => {
      map[p.id] = p.name || p.displayName || 'Unknown';
    });
    return map;
  }, [players]);

  // Team name map
  const teamNameMap = useMemo(() => {
    const map = {};
    (teams || []).forEach((t) => {
      map[t.id] = t.name || t.id;
    });
    return map;
  }, [teams]);

  // Filtered assessments
  const filteredAssessments = useMemo(() => {
    if (selectedTeamId === 'all') return assessments;
    return assessments.filter((a) => a.teamId === selectedTeamId);
  }, [assessments, selectedTeamId]);

  // ---------------------------------------------------------------------------
  // Summary stats
  // ---------------------------------------------------------------------------
  const summaryStats = useMemo(() => {
    const total = assessments.length;
    let wins = 0, losses = 0, draws = 0;
    const teamMetricTotals = {};
    const teamMetricCounts = {};

    assessments.forEach((a) => {
      if (a.result === 'win') wins++;
      else if (a.result === 'loss') losses++;
      else draws++;

      if (a.teamMetrics) {
        METRIC_IDS.forEach((mId) => {
          const val = a.teamMetrics[mId];
          if (val) {
            teamMetricTotals[mId] = (teamMetricTotals[mId] || 0) + val;
            teamMetricCounts[mId] = (teamMetricCounts[mId] || 0) + 1;
          }
        });
      }
    });

    const avgMetrics = {};
    METRIC_IDS.forEach((mId) => {
      if (teamMetricCounts[mId]) {
        avgMetrics[mId] = (teamMetricTotals[mId] / teamMetricCounts[mId]).toFixed(1);
      }
    });

    return { total, wins, losses, draws, avgMetrics };
  }, [assessments]);

  // ---------------------------------------------------------------------------
  // Team comparison
  // ---------------------------------------------------------------------------
  const teamComparison = useMemo(() => {
    const byTeam = {};
    assessments.forEach((a) => {
      const tid = a.teamId;
      if (!tid) return;
      if (!byTeam[tid]) {
        byTeam[tid] = { name: a.teamName || teamNameMap[tid] || tid, count: 0, wins: 0, losses: 0, draws: 0, metricTotals: {}, metricCounts: {} };
      }
      const t = byTeam[tid];
      t.count++;
      if (a.result === 'win') t.wins++;
      else if (a.result === 'loss') t.losses++;
      else t.draws++;

      if (a.teamMetrics) {
        METRIC_IDS.forEach((mId) => {
          const val = a.teamMetrics[mId];
          if (val) {
            t.metricTotals[mId] = (t.metricTotals[mId] || 0) + val;
            t.metricCounts[mId] = (t.metricCounts[mId] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(byTeam).map(([id, t]) => {
      const avgMetrics = {};
      METRIC_IDS.forEach((mId) => {
        if (t.metricCounts[mId]) {
          avgMetrics[mId] = (t.metricTotals[mId] / t.metricCounts[mId]).toFixed(1);
        }
      });
      return { id, ...t, avgMetrics };
    }).sort((a, b) => b.count - a.count);
  }, [assessments, teamNameMap]);

  // ---------------------------------------------------------------------------
  // Toggle expand
  // ---------------------------------------------------------------------------
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ---------------------------------------------------------------------------
  // Render assessment card (same accordion layout as coach MatchHistoryPage)
  // ---------------------------------------------------------------------------
  const renderAssessmentCard = (assessment) => {
    const dateParsed = parseDate(assessment.date);
    const isExpanded = expandedId === assessment.id;
    const playerAssessments = assessment.playerAssessments || {};
    const assessedPlayerIds = Object.keys(playerAssessments);
    const assessedCount = assessedPlayerIds.length;

    return (
      <div key={assessment.id} className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
        <button
          onClick={() => toggleExpand(assessment.id)}
          className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#F5F9F5] transition-colors text-left"
        >
          <div className="flex-shrink-0">
            <ResultBadge result={assessment.result} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-semibold text-sm truncate">
              {assessment.teamName || teamNameMap[assessment.teamId] || 'Team'} vs {assessment.opponent || 'Unknown'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7C6B] mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {fmtDate(dateParsed)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {assessedCount} player{assessedCount !== 1 ? 's' : ''}
              </span>
              {assessment.coachName && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {assessment.coachName}
                </span>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#6B7C6B] flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#6B7C6B] flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-[#D4E4D4] px-4 pb-4 pt-3 space-y-5">
            {/* Team Performance accordion */}
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

            {/* Team Performance Notes */}
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

            {/* General Match Notes */}
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

            {/* Individual Players */}
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
                      <div className="px-3 py-2 bg-[#F5F9F5] border-b border-[#D4E4D4] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#00A651]" />
                          <span className="text-sm font-semibold text-gray-800">
                            {pData.playerNumber ? `#${pData.playerNumber} ` : ''}{playerName}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#005028]">Avg: {avg}</span>
                      </div>

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
                    const fromAssessment = playerAssessments[playerId]?.playerName;
                    const pName = fromAssessment || playerNameMap[playerId] || 'Unknown';
                    return (
                      <div key={points} className="flex items-center gap-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          points === 3 ? 'bg-[#FFD700] text-gray-800' :
                          points === 2 ? 'bg-gray-300 text-gray-700' :
                          'bg-amber-700 text-white'
                        }`}>
                          <Star className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-medium text-sm truncate">{pName}</p>
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
  // Loading
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <PageShell title="Match Assessments" backTo="/admin/assessments-hub">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
          <p className="text-gray-500">Loading match assessments...</p>
        </div>
      </PageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PageShell
      title="Match Assessments"
      backTo="/admin/assessments-hub"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Assessments & Selection', url: '/admin/assessments-hub' },
        { label: 'Match Assessments' },
      ]}
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="bg-gradient-to-br from-[#005028] to-[#003018] rounded-xl p-4 text-white">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{summaryStats.total}</p>
              <p className="text-xs text-green-200">Total Assessed</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-300">{summaryStats.wins}</p>
              <p className="text-xs text-green-200">Wins</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-300">{summaryStats.losses}</p>
              <p className="text-xs text-green-200">Losses</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-300">{summaryStats.draws}</p>
              <p className="text-xs text-green-200">Draws</p>
            </div>
          </div>

          {/* Average team metrics */}
          {Object.keys(summaryStats.avgMetrics).length > 0 && (
            <div>
              <p className="text-xs text-green-200 mb-2">Avg Team Metrics (all teams)</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {METRIC_IDS.map((mId) => {
                  const val = summaryStats.avgMetrics[mId];
                  if (!val) return null;
                  return (
                    <div key={mId} className="text-center">
                      <p className="text-lg font-bold">{val}</p>
                      <p className="text-[10px] text-green-200 leading-tight">{METRIC_LABELS[mId]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Team Comparison */}
        {teamComparison.length > 1 && (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
            <h3 className="text-gray-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#005028]" />
              Team Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#D4E4D4]">
                    <th className="text-left py-2 pr-2 text-[#6B7C6B] font-medium">Team</th>
                    <th className="text-center py-2 px-1 text-[#6B7C6B] font-medium">Games</th>
                    <th className="text-center py-2 px-1 text-[#6B7C6B] font-medium">W/L/D</th>
                    {METRIC_IDS.map((mId) => (
                      <th key={mId} className="text-center py-2 px-1 text-[#6B7C6B] font-medium whitespace-nowrap">
                        {METRIC_LABELS[mId].split(' ').map(w => w[0]).join('')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamComparison.map((t) => (
                    <tr key={t.id} className="border-b border-[#D4E4D4]/50">
                      <td className="py-2 pr-2 font-medium text-gray-800 truncate max-w-[120px]">{t.name}</td>
                      <td className="text-center py-2 px-1 text-gray-600">{t.count}</td>
                      <td className="text-center py-2 px-1 text-gray-600">{t.wins}/{t.losses}/{t.draws}</td>
                      {METRIC_IDS.map((mId) => (
                        <td key={mId} className="text-center py-2 px-1">
                          {t.avgMetrics[mId] ? (
                            <span className={`inline-block w-7 h-6 rounded text-[10px] font-bold leading-6 text-center ${ratingColor(Math.round(parseFloat(t.avgMetrics[mId])))}`}>
                              {t.avgMetrics[mId]}
                            </span>
                          ) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Team filter */}
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

        {/* Count */}
        {filteredAssessments.length > 0 && (
          <p className="text-xs text-[#6B7C6B] px-1">
            {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Assessment list */}
        {filteredAssessments.length > 0 ? (
          <div className="space-y-3">
            {filteredAssessments.map((a) => renderAssessmentCard(a))}
          </div>
        ) : (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-1">No Match Assessments Found</h3>
            <p className="text-[#6B7C6B] text-sm">
              No match assessments have been submitted yet.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default AdminMatchAssessmentsPage;
