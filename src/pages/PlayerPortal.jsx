import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Award,
  TrendingUp,
  Calendar,
  Target,
  Trophy,
  Activity,
  MessageSquare,
  BarChart2,
  ArrowLeft
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

const PlayerPortal = () => {
  const navigate = useNavigate();
  const { players, games, matchAssessments, evaluations, skills, attendance, trainingNotes } = useData();
  const { userProfile } = useAuth();

  // Get player data
  const playerData = useMemo(() => {
    return players.find(p => p.id === userProfile?.playerId) || {};
  }, [players, userProfile]);

  // Calculate MVP stats using 3-2-1 voting system (matches CoachDashboard)
  const mvpStats = useMemo(() => {
    const playerAssessments = (matchAssessments || []).filter(a =>
      a.team === playerData.team || a.teamId === playerData.teamId
    );

    // Count MVP points using the 3-2-1 voting system
    const mvpPoints = {};

    playerAssessments.forEach(assessment => {
      const votes = assessment.mvpVoting?.votes;
      if (!votes) return;

      Object.entries(votes).forEach(([points, playerId]) => {
        if (!playerId) return;
        const pts = parseInt(points, 10);
        if (isNaN(pts)) return;
        mvpPoints[playerId] = (mvpPoints[playerId] || 0) + pts;
      });
    });

    const myPoints = mvpPoints[playerData.id] || 0;

    // Calculate rank
    const rankings = Object.entries(mvpPoints)
      .sort((a, b) => b[1] - a[1])
      .map(([playerId]) => playerId);

    const rank = rankings.indexOf(playerData.id) + 1;

    return {
      votes: myPoints,
      rank: rank > 0 ? rank : null,
      totalPlayers: rankings.length
    };
  }, [matchAssessments, playerData]);

  // Get player evaluations
  const playerEvaluations = useMemo(() => {
    return Object.values(evaluations)
      .filter(e => e.playerId === playerData.id)
      .map(e => ({
        ...e,
        skill: skills.find(s => s.id === e.skillId)
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [evaluations, playerData.id, skills]);

  // Calculate skill distribution
  const skillDistribution = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
    playerEvaluations.forEach(e => {
      if (e.level) {
        distribution[e.level]++;
      }
    });
    return distribution;
  }, [playerEvaluations]);

  // Get training notes
  const playerTrainingNotes = useMemo(() => {
    return trainingNotes
      .filter(n => n.playerId === playerData.id && n.public)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [trainingNotes, playerData.id]);

  // Attendance stats
  const attendanceStats = useMemo(() => {
    const teamAttendance = attendance.filter(a => a.team === playerData.team);
    const playerPresent = teamAttendance.filter(a => a.present?.includes(playerData.id)).length;
    const attendanceRate = teamAttendance.length > 0
      ? ((playerPresent / teamAttendance.length) * 100).toFixed(1)
      : 0;

    return {
      present: playerPresent,
      total: teamAttendance.length,
      rate: attendanceRate
    };
  }, [attendance, playerData]);

  // Skill progression chart
  const skillProgressionData = useMemo(() => {
    const last10Evals = playerEvaluations.slice(0, 10).reverse();

    return {
      labels: last10Evals.map(e => {
        return e.skill?.name?.substring(0, 15) || 'Skill';
      }),
      datasets: [{
        label: 'Skill Level',
        data: last10Evals.map(e => e.level || 0),
        borderColor: '#00A651',
        backgroundColor: 'rgba(0, 166, 81, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }, [playerEvaluations]);

  // Recent games (from match assessments)
  const recentGames = useMemo(() => {
    return (matchAssessments || [])
      .filter(a => a.team === playerData.team || a.teamId === playerData.teamId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [matchAssessments, playerData.team, playerData.teamId]);

  const LEVEL_LABELS = {
    1: { label: "Emerging", color: "bg-gray-100 text-gray-700 border-gray-300" },
    2: { label: "Developing", color: "bg-blue-50 text-blue-700 border-blue-300" },
    3: { label: "Competent", color: "bg-green-50 text-green-700 border-green-300" },
    4: { label: "Leader", color: "bg-[#FFD700]/10 text-[#005028] border-[#FFD700]" }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Hero Section — dark header */}
      <div className="bg-[#005028] border-b border-[#005028]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-2 text-green-200 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{playerData.name}</h1>
              <p className="text-green-200 text-lg">{playerData.team}</p>
            </div>

            {/* MVP Badge */}
            {mvpStats.rank && mvpStats.rank <= 3 && (
              <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FFD700]" />
                <div className="text-right">
                  <p className="text-xs text-green-200">MVP Rank</p>
                  <p className="text-lg font-bold text-white">#{mvpStats.rank}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <QuickStat icon={Award} label="MVP Votes" value={mvpStats.votes} />
            <QuickStat icon={Calendar} label="Attendance" value={`${attendanceStats.rate}%`} />
            <QuickStat icon={Activity} label="Games Played" value={recentGames.length} />
            <QuickStat icon={Target} label="Skills Assessed" value={playerEvaluations.length} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skill Progress Chart */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#00A651]" />
                <h2 className="text-lg font-bold text-gray-800">Skill Progression</h2>
              </div>

              {playerEvaluations.length > 0 ? (
                <div className="h-64">
                  <Line
                    data={skillProgressionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 4,
                          ticks: {
                            color: '#6B7C6B',
                            callback: function(value) {
                              return ['', 'Emerging', 'Developing', 'Competent', 'Leader'][value] || '';
                            }
                          },
                          grid: { color: 'rgba(212, 228, 212, 0.5)' }
                        },
                        x: {
                          ticks: { color: '#6B7C6B' },
                          grid: { color: 'rgba(212, 228, 212, 0.5)' }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-[#6B7C6B] text-center py-12">No skill assessments yet</p>
              )}
            </div>

            {/* Skill Assessments */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Skill Assessments</h2>

              {playerEvaluations.length > 0 ? (
                <div className="space-y-3">
                  {playerEvaluations.slice(0, 10).map((evaluation, index) => (
                    <div
                      key={index}
                      className="p-4 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg hover:border-[#00A651] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{evaluation.skill?.name || 'Unknown Skill'}</h3>
                          <p className="text-xs text-[#6B7C6B] mt-1">
                            {new Date(evaluation.date).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          LEVEL_LABELS[evaluation.level]?.color || 'bg-gray-100 text-gray-600'
                        }`}>
                          {LEVEL_LABELS[evaluation.level]?.label || 'Not Rated'}
                        </span>
                      </div>

                      {evaluation.notes && (
                        <div className="mt-2 p-3 bg-white rounded-lg border border-[#D4E4D4]">
                          <p className="text-sm text-gray-600">{evaluation.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B7C6B] text-center py-8">No assessments recorded yet</p>
              )}
            </div>

            {/* Recent Games */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Games</h2>

              {recentGames.length > 0 ? (
                <div className="space-y-3">
                  {recentGames.map((game) => (
                    <div
                      key={game.id}
                      className="p-4 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">vs {game.opponent}</p>
                          <p className="text-xs text-[#6B7C6B]">
                            {new Date(game.date).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            game.result === 'win' ? 'bg-green-100 text-green-700' :
                            game.result === 'loss' ? 'bg-red-100 text-red-700' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {game.result?.toUpperCase() || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {game.mvpVoting?.votes && Object.values(game.mvpVoting.votes).includes(playerData.id) && (
                        <div className="mt-2 flex items-center gap-2 bg-[#FFD700]/10 px-3 py-2 rounded-lg border border-[#FFD700]">
                          <Award className="w-4 h-4 text-[#FFD700]" />
                          <span className="text-sm font-semibold text-gray-800">MVP of the Game!</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B7C6B] text-center py-8">No games recorded yet</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Skill Distribution */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-[#00A651]" />
                <h2 className="text-lg font-bold text-gray-800">Skill Levels</h2>
              </div>

              <div className="space-y-3">
                {Object.entries(LEVEL_LABELS).map(([level, config]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {skillDistribution[level] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* MVP Standing */}
            <div className="bg-white rounded-xl border-2 border-[#D4E4D4] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-[#FFD700]" />
                <h2 className="text-lg font-bold text-gray-800">MVP Standing</h2>
              </div>

              <div className="text-center">
                <p className="text-5xl font-bold text-[#005028] mb-2">{mvpStats.votes}</p>
                <p className="text-sm text-[#6B7C6B] mb-4">Total MVP Votes</p>

                {mvpStats.rank && (
                  <div className="bg-[#F5F9F5] rounded-lg p-3 border border-[#D4E4D4]">
                    <p className="text-xs text-[#6B7C6B] mb-1">Current Rank</p>
                    <p className="text-2xl font-bold text-[#005028]">
                      #{mvpStats.rank}
                      <span className="text-sm text-[#6B7C6B] ml-1">of {mvpStats.totalPlayers}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Coach Notes */}
            <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[#00A651]" />
                <h2 className="text-lg font-bold text-gray-800">Coach Notes</h2>
              </div>

              {playerTrainingNotes.length > 0 ? (
                <div className="space-y-3">
                  {playerTrainingNotes.map((note, index) => (
                    <div key={index} className="p-3 bg-[#F5F9F5] rounded-lg border border-[#D4E4D4]">
                      <p className="text-xs text-[#6B7C6B] mb-2">
                        {new Date(note.date).toLocaleDateString('en-AU')}
                      </p>
                      <p className="text-sm text-gray-600">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B7C6B] text-center py-8">No notes yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Stat Component — sits on dark header
const QuickStat = ({ icon: Icon, label, value }) => (
  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-green-200" />
      <p className="text-xs text-green-200">{label}</p>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default PlayerPortal;
