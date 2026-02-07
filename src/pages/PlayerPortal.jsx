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
  const { players, games, evaluations, skills, attendance, trainingNotes } = useData();
  const { userProfile } = useAuth();

  // Get player data
  const playerData = useMemo(() => {
    return players.find(p => p.id === userProfile?.playerId) || {};
  }, [players, userProfile]);

  // Calculate MVP stats
  const mvpStats = useMemo(() => {
    const playerGames = games.filter(g => g.team === playerData.team);
    const mvpVotes = playerGames.filter(g => g.mvp === playerData.id).length;

    const mvpCounts = {};
    playerGames.forEach(game => {
      if (game.mvp) {
        mvpCounts[game.mvp] = (mvpCounts[game.mvp] || 0) + 1;
      }
    });

    const rankings = Object.entries(mvpCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([playerId]) => playerId);

    const rank = rankings.indexOf(playerData.id) + 1;

    return {
      votes: mvpVotes,
      rank: rank > 0 ? rank : null,
      totalPlayers: rankings.length
    };
  }, [games, playerData]);

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
        borderColor: 'rgb(5, 150, 105)',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }, [playerEvaluations]);

  // Recent games
  const recentGames = useMemo(() => {
    return games
      .filter(g => g.team === playerData.team)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [games, playerData.team]);

  const LEVEL_LABELS = {
    1: { label: "Emerging", color: "bg-lakers-700 text-white border-lakers-600" },
    2: { label: "Developing", color: "bg-lakers-600 text-white border-lakers-500" },
    3: { label: "Competent", color: "bg-lakers-500 text-white border-lakers-400" },
    4: { label: "Leader", color: "bg-lakers-400 text-white border-lakers-300" }
  };

  return (
    <div className="min-h-screen bg-lakers-900">
      {/* Hero Section */}
      <div className="bg-lakers-800 border-b border-lakers-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-2 text-lakers-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{playerData.name}</h1>
              <p className="text-lakers-300 text-lg">{playerData.team}</p>
            </div>

            {/* MVP Badge */}
            {mvpStats.rank && mvpStats.rank <= 3 && (
              <div className="bg-lakers-700 border border-lakers-600 px-4 py-2 rounded-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-white" />
                <div className="text-right">
                  <p className="text-xs text-lakers-300">MVP Rank</p>
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
            <div className="bg-lakers-800 rounded-xl border border-lakers-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-lakers-400" />
                <h2 className="text-lg font-bold text-white">Skill Progression</h2>
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
                            color: '#a7f3d0',
                            callback: function(value) {
                              return ['', 'Emerging', 'Developing', 'Competent', 'Leader'][value] || '';
                            }
                          },
                          grid: { color: 'rgba(167, 243, 208, 0.1)' }
                        },
                        x: {
                          ticks: { color: '#a7f3d0' },
                          grid: { color: 'rgba(167, 243, 208, 0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-lakers-400 text-center py-12">No skill assessments yet</p>
              )}
            </div>

            {/* Skill Assessments */}
            <div className="bg-lakers-800 rounded-xl border border-lakers-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Recent Skill Assessments</h2>

              {playerEvaluations.length > 0 ? (
                <div className="space-y-3">
                  {playerEvaluations.slice(0, 10).map((evaluation, index) => (
                    <div
                      key={index}
                      className="p-4 bg-lakers-700 border border-lakers-600 rounded-lg hover:border-lakers-500 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{evaluation.skill?.name || 'Unknown Skill'}</h3>
                          <p className="text-xs text-lakers-400 mt-1">
                            {new Date(evaluation.date).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          LEVEL_LABELS[evaluation.level]?.color || 'bg-lakers-700 text-white'
                        }`}>
                          {LEVEL_LABELS[evaluation.level]?.label || 'Not Rated'}
                        </span>
                      </div>

                      {evaluation.notes && (
                        <div className="mt-2 p-3 bg-lakers-800 rounded-lg border border-lakers-600">
                          <p className="text-sm text-lakers-200">{evaluation.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-lakers-400 text-center py-8">No assessments recorded yet</p>
              )}
            </div>

            {/* Recent Games */}
            <div className="bg-lakers-800 rounded-xl border border-lakers-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Recent Games</h2>

              {recentGames.length > 0 ? (
                <div className="space-y-3">
                  {recentGames.map((game) => (
                    <div
                      key={game.id}
                      className="p-4 bg-lakers-700 border border-lakers-600 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-white">vs {game.opponent}</p>
                          <p className="text-xs text-lakers-400">
                            {new Date(game.date).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            game.result === 'win' ? 'bg-lakers-500 text-white' :
                            game.result === 'loss' ? 'bg-lakers-900 text-lakers-300' :
                            'bg-lakers-600 text-white'
                          }`}>
                            {game.result?.toUpperCase() || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {game.mvp === playerData.id && (
                        <div className="mt-2 flex items-center gap-2 bg-lakers-600 px-3 py-2 rounded-lg border border-lakers-500">
                          <Award className="w-4 h-4 text-white" />
                          <span className="text-sm font-semibold text-white">MVP of the Game!</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-lakers-400 text-center py-8">No games recorded yet</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Skill Distribution */}
            <div className="bg-lakers-800 rounded-xl border border-lakers-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-lakers-400" />
                <h2 className="text-lg font-bold text-white">Skill Levels</h2>
              </div>

              <div className="space-y-3">
                {Object.entries(LEVEL_LABELS).map(([level, config]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {skillDistribution[level] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* MVP Standing */}
            <div className="bg-lakers-700 rounded-xl border-2 border-lakers-600 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-lakers-300" />
                <h2 className="text-lg font-bold text-white">MVP Standing</h2>
              </div>

              <div className="text-center">
                <p className="text-5xl font-bold text-white mb-2">{mvpStats.votes}</p>
                <p className="text-sm text-lakers-300 mb-4">Total MVP Votes</p>

                {mvpStats.rank && (
                  <div className="bg-lakers-800 rounded-lg p-3 border border-lakers-600">
                    <p className="text-xs text-lakers-400 mb-1">Current Rank</p>
                    <p className="text-2xl font-bold text-white">
                      #{mvpStats.rank}
                      <span className="text-sm text-lakers-400 ml-1">of {mvpStats.totalPlayers}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Coach Notes */}
            <div className="bg-lakers-800 rounded-xl border border-lakers-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-lakers-400" />
                <h2 className="text-lg font-bold text-white">Coach Notes</h2>
              </div>

              {playerTrainingNotes.length > 0 ? (
                <div className="space-y-3">
                  {playerTrainingNotes.map((note, index) => (
                    <div key={index} className="p-3 bg-lakers-700 rounded-lg border border-lakers-600">
                      <p className="text-xs text-lakers-400 mb-2">
                        {new Date(note.date).toLocaleDateString('en-AU')}
                      </p>
                      <p className="text-sm text-lakers-200">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-lakers-400 text-center py-8">No notes yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Stat Component
const QuickStat = ({ icon: Icon, label, value }) => (
  <div className="bg-lakers-700 border border-lakers-600 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-lakers-300" />
      <p className="text-xs text-lakers-300">{label}</p>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default PlayerPortal;
