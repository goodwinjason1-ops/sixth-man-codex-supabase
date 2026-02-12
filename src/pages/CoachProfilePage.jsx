import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  User,
  Award,
  Heart,
  ShieldCheck,
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
  ChevronRight,
  Loader2
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

// Coaching level options
const COACHING_LEVELS = ['Community Coach', 'Development Coach', 'State Level', 'High Performance'];
const FIRST_AID_LEVELS = ['CPR Only', 'Level 1', 'Level 2'];
const AUSTRALIAN_STATES = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

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
  const { games, evaluations, teams, players, addDocument, updateDocument } = useData();

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

  // Accreditation state (Firestore-backed)
  const [accreditation, setAccreditation] = useState(null);
  const [accredDocId, setAccredDocId] = useState(null);
  const [accredLoading, setAccredLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null); // 'coaching' | 'firstAid' | 'wwcc'
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load accreditations from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'coach_accreditations'),
      where('coachId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setAccreditation(docSnap.data());
        setAccredDocId(docSnap.id);
      } else {
        setAccreditation(null);
        setAccredDocId(null);
      }
      setAccredLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

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
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  // Check if certification is expiring soon (within 3 months)
  const checkExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'not_set';
    const expiry = new Date(expiryDate);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (expiry < today) return 'expired';
    if (expiry < threeMonthsFromNow) return 'expiring';
    return 'active';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Valid';
      case 'expiring': return 'Expiring Soon';
      case 'expired': return 'Expired';
      default: return 'Not Set';
    }
  };

  // Compute warnings for expiring/expired accreditations
  const accredWarnings = useMemo(() => {
    if (!accreditation) return [];
    const warnings = [];
    const sections = [
      { key: 'coaching', label: 'Coaching' },
      { key: 'firstAid', label: 'First Aid' },
      { key: 'wwcc', label: 'WWCC' },
    ];
    sections.forEach(({ key, label }) => {
      const section = accreditation[key];
      if (!section?.expiryDate) return;
      const status = checkExpiryStatus(section.expiryDate);
      if (status === 'expired') {
        warnings.push({ type: 'expired', label, date: section.expiryDate });
      } else if (status === 'expiring') {
        warnings.push({ type: 'expiring', label, date: section.expiryDate });
      }
    });
    return warnings;
  }, [accreditation]);

  // Handle editing a section
  const startEditing = (section) => {
    const data = accreditation?.[section] || {};
    setEditForm({
      level: data.level || '',
      certificateNumber: data.certificateNumber || data.checkNumber || '',
      issueDate: data.issueDate || '',
      expiryDate: data.expiryDate || '',
      state: data.state || 'VIC',
    });
    setEditingSection(section);
  };

  // Save accreditation section
  const handleSaveSection = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const sectionData = {};
      if (editingSection === 'coaching') {
        sectionData.coaching = {
          level: editForm.level,
          certificateNumber: editForm.certificateNumber,
          issueDate: editForm.issueDate,
          expiryDate: editForm.expiryDate,
        };
      } else if (editingSection === 'firstAid') {
        sectionData.firstAid = {
          level: editForm.level,
          certificateNumber: editForm.certificateNumber,
          issueDate: editForm.issueDate,
          expiryDate: editForm.expiryDate,
        };
      } else if (editingSection === 'wwcc') {
        sectionData.wwcc = {
          checkNumber: editForm.certificateNumber,
          issueDate: editForm.issueDate,
          expiryDate: editForm.expiryDate,
          state: editForm.state,
        };
      }

      // Compute overall status
      const merged = { ...accreditation, ...sectionData };
      const statuses = ['coaching', 'firstAid', 'wwcc'].map(k => {
        const s = merged[k];
        return s?.expiryDate ? checkExpiryStatus(s.expiryDate) : 'not_set';
      });
      const overallStatus = statuses.includes('expired') ? 'expired'
        : statuses.includes('expiring') ? 'expiring'
        : statuses.includes('not_set') ? 'incomplete'
        : 'compliant';

      const payload = {
        ...sectionData,
        status: overallStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
      };

      if (accredDocId) {
        await updateDocument('coach_accreditations', accredDocId, payload);
      } else {
        await addDocument('coach_accreditations', {
          coachId: currentUser.uid,
          coachName: userProfile?.displayName || 'Unknown Coach',
          coaching: { level: '', certificateNumber: '', issueDate: '', expiryDate: '' },
          firstAid: { level: '', certificateNumber: '', issueDate: '', expiryDate: '' },
          wwcc: { checkNumber: '', issueDate: '', expiryDate: '', state: 'VIC' },
          ...sectionData,
          status: overallStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid,
        });
      }
      setEditingSection(null);
    } catch (err) {
      console.error('Failed to save accreditation:', err);
    } finally {
      setIsSaving(false);
    }
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

  // Render an accreditation card (coaching, firstAid, or wwcc)
  const renderAccredCard = ({ key, icon: Icon, title, data, levelLabel, certLabel, certValue }) => {
    const status = data?.expiryDate ? checkExpiryStatus(data.expiryDate) : 'not_set';
    const isEditing = editingSection === key;

    return (
      <div key={key} className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-[#4ade80]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-medium text-sm">{title}</h3>
                <span className="text-[#1a8a68] text-xs">— {levelLabel}</span>
              </div>
              {data?.expiryDate && (
                <p className="text-[#1a8a68] text-xs mt-0.5">
                  {certLabel}: {certValue || 'N/A'} &bull; {data.issueDate ? formatDate(data.issueDate) : '?'} → {formatDate(data.expiryDate)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(status)}`}>
              {getStatusLabel(status)}
            </span>
            {!isEditing && (
              <button
                onClick={() => startEditing(key)}
                className="p-1.5 text-[#4ade80] hover:bg-[#0a3d2e] rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <div className="mt-3 p-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl space-y-3">
            {key === 'coaching' && (
              <div>
                <label className="text-[#1a8a68] text-xs block mb-1">Coaching Level</label>
                <select
                  value={editForm.level}
                  onChange={(e) => setEditForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none"
                >
                  <option value="">Select level...</option>
                  {COACHING_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}
            {key === 'firstAid' && (
              <div>
                <label className="text-[#1a8a68] text-xs block mb-1">First Aid Level</label>
                <select
                  value={editForm.level}
                  onChange={(e) => setEditForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none"
                >
                  <option value="">Select level...</option>
                  {FIRST_AID_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}
            {key === 'wwcc' && (
              <div>
                <label className="text-[#1a8a68] text-xs block mb-1">State</label>
                <select
                  value={editForm.state}
                  onChange={(e) => setEditForm(f => ({ ...f, state: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none"
                >
                  {AUSTRALIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-[#1a8a68] text-xs block mb-1">{key === 'wwcc' ? 'Check Number' : 'Certificate Number'}</label>
              <input
                type="text"
                value={editForm.certificateNumber}
                onChange={(e) => setEditForm(f => ({ ...f, certificateNumber: e.target.value }))}
                className="w-full px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
                placeholder={key === 'wwcc' ? 'e.g. WWC12345678' : 'e.g. CERT-12345'}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#1a8a68] text-xs block mb-1">Issue Date</label>
                <input
                  type="date"
                  value={editForm.issueDate}
                  onChange={(e) => setEditForm(f => ({ ...f, issueDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[#1a8a68] text-xs block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editForm.expiryDate}
                  onChange={(e) => setEditForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveSection}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22c55e] rounded-lg text-[#0a3d2e] text-sm font-medium hover:bg-[#4ade80] transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
              <button
                onClick={() => setEditingSection(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[#1a8a68] rounded-lg text-white text-sm hover:bg-[#1a8a68]/20 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageShell
      title="Coach Profile"
      subtitle={`${yearsCoaching} Years Coaching \u2022 Season ${currentSeason}`}
      backTo="/dashboard"
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
        <div className="space-y-3">
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Accreditations & Certifications</h2>
              <p className="text-[#1a8a68] text-xs">Coaching, First Aid & WWCC</p>
            </div>
          </div>

          {/* Warning Banners */}
          {accredWarnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                w.type === 'expired'
                  ? 'bg-red-500/10 border-red-500/50 text-red-400'
                  : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                {w.type === 'expired'
                  ? `Your ${w.label} has expired. Please renew immediately.`
                  : `Your ${w.label} expires on ${formatDate(w.date)}. Please update.`}
              </p>
            </div>
          ))}

          {accredLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#4ade80] animate-spin" />
            </div>
          ) : !accreditation ? (
            <div className="bg-[#0d5943] border-2 border-dashed border-[#1a8a68] rounded-2xl p-8 text-center">
              <ShieldCheck className="w-10 h-10 text-[#1a8a68] mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No accreditations on file</p>
              <p className="text-[#1a8a68] text-sm mb-4">Set up your coaching, first aid, and WWCC details.</p>
              <button
                onClick={() => startEditing('coaching')}
                className="px-4 py-2 bg-[#22c55e] rounded-lg text-[#0a3d2e] text-sm font-medium hover:bg-[#4ade80] transition-colors"
              >
                Set Up Accreditations
              </button>
            </div>
          ) : (
            <>
              {/* Coaching Card */}
              {renderAccredCard({
                key: 'coaching',
                icon: Award,
                title: 'Coaching',
                data: accreditation.coaching,
                levelLabel: accreditation.coaching?.level || 'Not Set',
                certLabel: 'Certificate #',
                certValue: accreditation.coaching?.certificateNumber,
              })}

              {/* First Aid Card */}
              {renderAccredCard({
                key: 'firstAid',
                icon: Heart,
                title: 'First Aid',
                data: accreditation.firstAid,
                levelLabel: accreditation.firstAid?.level || 'Not Set',
                certLabel: 'Certificate #',
                certValue: accreditation.firstAid?.certificateNumber,
              })}

              {/* WWCC Card */}
              {renderAccredCard({
                key: 'wwcc',
                icon: ShieldCheck,
                title: 'Working with Children Check',
                data: accreditation.wwcc,
                levelLabel: accreditation.wwcc?.state || 'VIC',
                certLabel: 'Check #',
                certValue: accreditation.wwcc?.checkNumber,
              })}
            </>
          )}
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
            onClick={() => navigate('/dashboard')}
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
