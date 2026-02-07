import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  User,
  Award,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  AlertCircle,
  ClipboardCheck,
  Dumbbell,
  Shield,
  Star,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import PageShell from '../components/PageShell';

// Sample data for coaches without real data
const sampleAccreditations = [
  { id: '1', name: 'Level 2 Basketball Coach', issuer: 'Basketball Australia', expiryDate: '2027-03-15', status: 'active' },
  { id: '2', name: 'First Aid Certificate', issuer: 'St John Ambulance', expiryDate: '2025-08-20', status: 'expiring' },
  { id: '3', name: 'Working with Children Check', issuer: 'NSW Government', expiryDate: '2028-01-10', status: 'active' },
  { id: '4', name: 'CPR Certification', issuer: 'Red Cross', expiryDate: '2024-12-01', status: 'expired' }
];

const sampleCoachingRecord = {
  totalGames: 87,
  wins: 52,
  losses: 30,
  draws: 5,
  seasonBreakdown: [
    { season: '2023', wins: 15, losses: 10, draws: 2 },
    { season: '2024', wins: 18, losses: 9, draws: 1 },
    { season: '2025', wins: 19, losses: 11, draws: 2 }
  ]
};

const sampleTeamsCoached = [
  { id: '1', name: 'U14 Lakers', season: '2025', ageGroup: 'U14', current: true },
  { id: '2', name: 'U12 Emerald', season: '2025', ageGroup: 'U12', current: true },
  { id: '3', name: 'U12 Green', season: '2024', ageGroup: 'U12', current: false },
  { id: '4', name: 'U10 Dragons', season: '2023', ageGroup: 'U10', current: false }
];

const samplePlayerDevStats = {
  totalPlayersCoached: 48,
  playersImproved2Plus: 12,
  avgSkillProgression: 1.4,
  starPerformers: [
    { id: '1', name: 'Emma Wilson', improvement: 2.5, team: 'U14 Lakers' },
    { id: '2', name: 'Liam Johnson', improvement: 2.3, team: 'U12 Emerald' },
    { id: '3', name: 'Sophia Garcia', improvement: 2.1, team: 'U12 Emerald' }
  ]
};

const sampleRecentActivity = [
  { id: '1', type: 'assessment', description: 'Skills assessment for Emma Wilson', date: '2026-02-04', team: 'U14 Lakers' },
  { id: '2', type: 'match', description: 'Match Day vs Thunder', date: '2026-02-03', team: 'U14 Lakers', result: 'W 45-38' },
  { id: '3', type: 'assessment', description: 'Skills assessment for Liam Johnson', date: '2026-02-02', team: 'U12 Emerald' },
  { id: '4', type: 'training', description: 'Training session - Ball handling drills', date: '2026-02-01', team: 'U12 Emerald' },
  { id: '5', type: 'assessment', description: 'Mid-season assessment for team', date: '2026-01-30', team: 'U14 Lakers' },
  { id: '6', type: 'match', description: 'Match Day vs Celtics', date: '2026-01-28', team: 'U12 Emerald', result: 'L 32-36' },
  { id: '7', type: 'training', description: 'Training session - Defense fundamentals', date: '2026-01-27', team: 'U14 Lakers' },
  { id: '8', type: 'assessment', description: 'Skills assessment for Noah Davis', date: '2026-01-25', team: 'U14 Lakers' }
];

const CHART_COLORS = ['#22c55e', '#ef4444', '#eab308'];

const CoachProfilePage = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  const { games, evaluations, teams, players } = useData();

  // Derive teams coached from Firestore teams collection
  const teamsCoached = useMemo(() => {
    if (!teams || teams.length === 0 || !currentUser) return sampleTeamsCoached;
    const myTeams = teams.filter(t => t.coachId === currentUser.uid);
    if (myTeams.length === 0) return sampleTeamsCoached;
    return myTeams.map(t => ({
      id: t.id,
      name: t.name || t.teamName || 'Unknown Team',
      season: t.season || '2025',
      ageGroup: t.ageGroup || '',
      current: t.active !== false
    }));
  }, [teams, currentUser]);

  // Derive player development stats from real data
  const realPlayerDevStats = useMemo(() => {
    if (!players || players.length === 0 || !currentUser) return samplePlayerDevStats;
    // Get players on coach's teams
    const myTeamIds = (teams || []).filter(t => t.coachId === currentUser.uid).map(t => t.id);
    if (myTeamIds.length === 0) return samplePlayerDevStats;
    const myPlayers = players.filter(p => myTeamIds.includes(p.teamId) || myTeamIds.includes(p.team));
    if (myPlayers.length === 0) return samplePlayerDevStats;
    return {
      ...samplePlayerDevStats,
      totalPlayersCoached: myPlayers.length
    };
  }, [players, teams, currentUser]);

  // Accreditation management state
  const [accreditations, setAccreditations] = useState(sampleAccreditations);
  const [showAddAccreditation, setShowAddAccreditation] = useState(false);
  const [editingAccreditation, setEditingAccreditation] = useState(null);
  const [newAccreditation, setNewAccreditation] = useState({
    name: '',
    issuer: '',
    expiryDate: ''
  });

  // Calculate coaching record from real data or use sample
  const coachingRecord = useMemo(() => {
    if (!games || games.length === 0) {
      return sampleCoachingRecord;
    }

    // Filter games where this coach was involved
    const coachGames = games.filter(g => g.coachId === currentUser?.uid);

    if (coachGames.length === 0) {
      return sampleCoachingRecord;
    }

    const wins = coachGames.filter(g => g.result === 'win').length;
    const losses = coachGames.filter(g => g.result === 'loss').length;
    const draws = coachGames.filter(g => g.result === 'draw').length;

    return {
      totalGames: coachGames.length,
      wins,
      losses,
      draws,
      seasonBreakdown: sampleCoachingRecord.seasonBreakdown // Would need real calculation
    };
  }, [games, currentUser]);

  // Calculate win percentage
  const winPercentage = coachingRecord.totalGames > 0
    ? Math.round((coachingRecord.wins / coachingRecord.totalGames) * 100)
    : 0;

  // Pie chart data for win/loss/draw
  const recordPieData = [
    { name: 'Wins', value: coachingRecord.wins },
    { name: 'Losses', value: coachingRecord.losses },
    { name: 'Draws', value: coachingRecord.draws }
  ].filter(d => d.value > 0);

  // Use real player dev stats (computed above) or sample fallback
  const playerDevStats = realPlayerDevStats;

  // Get certification status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]';
      case 'expiring': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500';
      default: return 'bg-[#1a8a68]/20 text-[#4ade80] border-[#1a8a68]';
    }
  };

  // Check if certification is expiring soon (within 3 months)
  const checkExpiryStatus = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (expiry < today) return 'expired';
    if (expiry < threeMonthsFromNow) return 'expiring';
    return 'active';
  };

  // Handle add accreditation
  const handleAddAccreditation = () => {
    if (!newAccreditation.name || !newAccreditation.issuer) return;

    const accreditation = {
      id: Date.now().toString(),
      ...newAccreditation,
      status: newAccreditation.expiryDate ? checkExpiryStatus(newAccreditation.expiryDate) : 'active'
    };

    setAccreditations(prev => [...prev, accreditation]);
    setNewAccreditation({ name: '', issuer: '', expiryDate: '' });
    setShowAddAccreditation(false);
  };

  // Handle delete accreditation
  const handleDeleteAccreditation = (id) => {
    setAccreditations(prev => prev.filter(a => a.id !== id));
  };

  // Get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case 'assessment': return <ClipboardCheck className="w-4 h-4 text-[#4ade80]" />;
      case 'match': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'training': return <Dumbbell className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-[#1a8a68]" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Years coaching (sample - would come from profile)
  const yearsCoaching = userProfile?.yearsCoaching || 5;
  const currentSeason = '2025/2026';

  return (
    <PageShell
      title="Coach Profile"
      subtitle={`${yearsCoaching} Years Coaching \u2022 Season ${currentSeason}`}
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Dashboard', url: '/dashboard' },
        { label: 'Coach Profile' }
      ]}
      maxWidth="4xl"
    >
      {/* Profile Header */}
      <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-[#0a3d2e] border-2 border-[#1a8a68] rounded-full flex items-center justify-center">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-[#4ade80]" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">
              {userProfile?.displayName || 'Coach'}
            </h2>
            <p className="text-[#4ade80] text-sm mt-1">
              {yearsCoaching} Years Coaching &bull; Season {currentSeason}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-[#22c55e]/20 border border-[#22c55e] rounded-full text-[#4ade80] text-xs font-medium">
                Head Coach
              </span>
              <span className="px-2 py-1 bg-[#1a8a68]/20 border border-[#1a8a68] rounded-full text-[#4ade80] text-xs font-medium">
                {teamsCoached.filter(t => t.current).length} Active Teams
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Accreditations & Certifications */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-[#4ade80]" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Accreditations & Certifications</h2>
                <p className="text-[#1a8a68] text-xs">{accreditations.length} qualifications</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddAccreditation(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-[#4ade80] text-sm hover:border-[#22c55e] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {/* Add Accreditation Form */}
          {showAddAccreditation && (
            <div className="mb-4 p-4 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Qualification name"
                  value={newAccreditation.name}
                  onChange={(e) => setNewAccreditation(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Issuing organization"
                  value={newAccreditation.issuer}
                  onChange={(e) => setNewAccreditation(prev => ({ ...prev, issuer: e.target.value }))}
                  className="px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
                />
                <input
                  type="date"
                  placeholder="Expiry date"
                  value={newAccreditation.expiryDate}
                  onChange={(e) => setNewAccreditation(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddAccreditation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22c55e] rounded-lg text-[#0a3d2e] text-sm font-medium hover:bg-[#4ade80] transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddAccreditation(false);
                    setNewAccreditation({ name: '', issuer: '', expiryDate: '' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[#1a8a68] rounded-lg text-white text-sm hover:bg-[#1a8a68]/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Accreditations List */}
          <div className="space-y-2">
            {accreditations.map((accred) => (
              <div
                key={accred.id}
                className="flex items-center justify-between p-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-medium text-sm truncate">{accred.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(accred.status)}`}>
                      {accred.status === 'active' ? 'Active' : accred.status === 'expiring' ? 'Expiring Soon' : 'Expired'}
                    </span>
                  </div>
                  <p className="text-[#1a8a68] text-xs mt-1">
                    {accred.issuer} • {accred.expiryDate ? `Expires ${formatDate(accred.expiryDate)}` : 'No expiry'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAccreditation(accred.id)}
                  className="ml-2 p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Coaching Record */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Coaching Record</h2>
              <p className="text-[#1a8a68] text-xs">{coachingRecord.totalGames} games coached</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#22c55e]">{coachingRecord.wins}</p>
              <p className="text-[#1a8a68] text-xs">Wins</p>
            </div>
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{coachingRecord.losses}</p>
              <p className="text-[#1a8a68] text-xs">Losses</p>
            </div>
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{coachingRecord.draws}</p>
              <p className="text-[#1a8a68] text-xs">Draws</p>
            </div>
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{winPercentage}%</p>
              <p className="text-[#1a8a68] text-xs">Win Rate</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-4">
              <h3 className="text-white text-sm font-medium mb-2">Overall Record</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recordPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {recordPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0d5943',
                        border: '1px solid #1a8a68',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#4ade80', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart - Season Breakdown */}
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-4">
              <h3 className="text-white text-sm font-medium mb-2">By Season</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coachingRecord.seasonBreakdown}>
                    <XAxis dataKey="season" tick={{ fill: '#4ade80', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#4ade80', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0d5943',
                        border: '1px solid #1a8a68',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="wins" fill="#22c55e" name="Wins" />
                    <Bar dataKey="losses" fill="#ef4444" name="Losses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Teams Coached */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Teams Coached</h2>
              <p className="text-[#1a8a68] text-xs">
                {teamsCoached.filter(t => t.current).length} current, {teamsCoached.filter(t => !t.current).length} historical
              </p>
            </div>
          </div>

          {/* Current Teams */}
          <div className="mb-4">
            <h3 className="text-[#4ade80] text-xs font-medium mb-2 uppercase tracking-wider">Current Teams</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teamsCoached.filter(t => t.current).map((team) => (
                <button
                  key={team.id}
                  onClick={() => navigate(`/team?teamId=${team.id}`)}
                  title="Click to view team details"
                  className="group flex items-center justify-between p-3 bg-[#0a3d2e] border border-[#22c55e] rounded-xl cursor-pointer text-left transition-all duration-200 hover:bg-[#0d5943] hover:border-[#4ade80] hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#22c55e]/20 rounded-lg flex items-center justify-center group-hover:bg-[#22c55e]/30 transition-colors">
                      <Shield className="w-5 h-5 text-[#22c55e]" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm group-hover:text-[#4ade80] transition-colors">{team.name}</h4>
                      <p className="text-[#4ade80] text-xs">{team.ageGroup} • Season {team.season}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1a8a68] group-hover:text-[#4ade80] group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Historical Teams */}
          <div>
            <h3 className="text-[#1a8a68] text-xs font-medium mb-2 uppercase tracking-wider">Historical Teams</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teamsCoached.filter(t => !t.current).map((team) => (
                <button
                  key={team.id}
                  onClick={() => navigate(`/team?teamId=${team.id}&season=${team.season}`)}
                  title="Click to view team history"
                  className="group flex items-center justify-between p-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl opacity-75 cursor-pointer text-left transition-all duration-200 hover:opacity-100 hover:bg-[#0d5943] hover:border-[#22c55e] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a8a68]/20 rounded-lg flex items-center justify-center group-hover:bg-[#1a8a68]/30 transition-colors">
                      <Shield className="w-5 h-5 text-[#1a8a68] group-hover:text-[#4ade80] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm group-hover:text-[#4ade80] transition-colors">{team.name}</h4>
                      <p className="text-[#1a8a68] text-xs">{team.ageGroup} • Season {team.season}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1a8a68] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player Development Stats */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Player Development Stats</h2>
              <p className="text-[#1a8a68] text-xs">Impact on player growth</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{playerDevStats.totalPlayersCoached}</p>
              <p className="text-[#1a8a68] text-xs">Total Players</p>
            </div>
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#22c55e]">{playerDevStats.playersImproved2Plus}</p>
              <p className="text-[#1a8a68] text-xs">Improved 2+ Levels</p>
            </div>
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#4ade80]">+{playerDevStats.avgSkillProgression}</p>
              <p className="text-[#1a8a68] text-xs">Avg Progression</p>
            </div>
            <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{playerDevStats.starPerformers.length}</p>
              <p className="text-[#1a8a68] text-xs">Star Performers</p>
            </div>
          </div>

          {/* Star Performers */}
          <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-xl p-4">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Top Performers This Season
            </h3>
            <div className="space-y-2">
              {playerDevStats.starPerformers.map((player, index) => (
                <button
                  key={player.id}
                  onClick={() => navigate(`/skills-passport?playerId=${player.id}`)}
                  title="Click to view player profile"
                  className="group w-full flex items-center justify-between p-3 rounded-xl cursor-pointer text-left transition-all duration-200 hover:bg-[#0d5943] hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] border border-transparent hover:border-[#1a8a68]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 ${
                      index === 0 ? 'bg-yellow-500 text-[#0a3d2e] shadow-lg shadow-yellow-500/30' :
                      index === 1 ? 'bg-gray-400 text-[#0a3d2e] shadow-lg shadow-gray-400/30' :
                      'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-[#4ade80] transition-colors">{player.name}</p>
                      <p className="text-[#1a8a68] text-xs">{player.team}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#22c55e] font-semibold text-sm">+{player.improvement} levels</span>
                    <ChevronRight className="w-4 h-4 text-[#1a8a68] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            {/* View All Players Link */}
            <button
              onClick={() => navigate('/coach-assessment')}
              className="w-full mt-4 py-2 text-center text-[#4ade80] text-sm hover:text-white transition-colors border-t border-[#1a8a68] pt-4"
            >
              View All Players & Assessments →
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Recent Activity</h2>
              <p className="text-[#1a8a68] text-xs">Your latest coaching activities</p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-0">
            {sampleRecentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className="flex gap-3 pb-4 relative"
              >
                {/* Timeline line */}
                {index < sampleRecentActivity.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-[#1a8a68]" />
                )}

                {/* Icon */}
                <div className="w-8 h-8 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center flex-shrink-0 z-10">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[#1a8a68] text-xs">{formatDate(activity.date)}</span>
                    <span className="text-[#1a8a68] text-xs">•</span>
                    <span className="text-[#4ade80] text-xs">{activity.team}</span>
                    {activity.result && (
                      <>
                        <span className="text-[#1a8a68] text-xs">•</span>
                        <span className={`text-xs font-medium ${
                          activity.result.startsWith('W') ? 'text-[#22c55e]' : 'text-red-400'
                        }`}>
                          {activity.result}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Link */}
          <button
            onClick={() => navigate('/coach')}
            className="w-full mt-2 py-2 text-center text-[#4ade80] text-sm hover:text-white transition-colors"
          >
            View All Activity →
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default CoachProfilePage;
