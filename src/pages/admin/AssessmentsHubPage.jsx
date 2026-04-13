import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import PageShell from '../../components/PageShell';
import {
  ClipboardCheck,
  Dumbbell,
  Trophy,
  Users,
  Calendar,
  ChevronRight,
  BarChart3,
  User,
  ExternalLink,
} from 'lucide-react';

const parseDate = (d) => {
  if (!d) return null;
  if (d.toDate) return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const fmtDate = (d) => {
  const dt = parseDate(d);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
};

const TABS = [
  { id: 'match', label: 'Match Assessments', icon: ClipboardCheck },
  { id: 'training', label: 'Training Records', icon: Dumbbell },
  { id: 'selection', label: 'Team Selection', icon: Trophy },
];

const AssessmentsHubPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('match');
  const { matchAssessments, trainingRecords, teams, players } = useData();

  // Match assessment stats
  const matchStats = useMemo(() => {
    const list = matchAssessments || [];
    const uniqueGames = new Set(list.map(a => a.gameId)).size;
    const uniqueCoaches = new Set(list.map(a => a.coachId)).size;
    const recent = [...list].sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0)).slice(0, 5);
    return { total: list.length, uniqueGames, uniqueCoaches, recent };
  }, [matchAssessments]);

  // Training record stats
  const trainingStats = useMemo(() => {
    const list = trainingRecords || [];
    let totalPresent = 0, totalRoster = 0;
    list.forEach(r => {
      const vals = Object.values(r.attendance || {});
      totalRoster += vals.length;
      totalPresent += vals.filter(v => v === 'present' || v === 'late').length;
    });
    const avgAtt = totalRoster > 0 ? Math.round((totalPresent / totalRoster) * 100) : 0;
    const coachCounts = {};
    list.forEach(r => { coachCounts[r.coachName || 'Unknown'] = (coachCounts[r.coachName || 'Unknown'] || 0) + 1; });
    const topCoach = Object.entries(coachCounts).sort((a, b) => b[1] - a[1])[0];
    const recent = [...list].sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0)).slice(0, 5);
    return { total: list.length, avgAtt, topCoach: topCoach ? topCoach[0] : '—', recent };
  }, [trainingRecords]);

  const teamMap = useMemo(() => {
    const m = {};
    (teams || []).forEach(t => { m[t.id] = t.name || t.id; });
    return m;
  }, [teams]);

  return (
    <PageShell
      title="Assessments & Selection"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Assessments & Selection' },
      ]}
      backTo="/admin"
    >
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center ${
                active ? 'bg-white text-[#005028] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Match Assessments Tab */}
      {tab === 'match' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={ClipboardCheck} label="Assessments" value={matchStats.total} color="text-emerald-500" />
            <StatCard icon={Calendar} label="Games Assessed" value={matchStats.uniqueGames} color="text-blue-500" />
            <StatCard icon={User} label="Coaches" value={matchStats.uniqueCoaches} color="text-violet-500" />
          </div>
          {matchStats.recent.length > 0 && (
            <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Assessments</h3>
              <div className="space-y-2">
                {matchStats.recent.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 font-medium">{teamMap[a.teamId] || a.teamName || 'Unknown'}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="text-gray-600">{a.opponent || '—'}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{fmtDate(a.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => navigate('/admin/match-assessments')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#003018] transition-colors">
            Open Match Assessments <ExternalLink size={14} />
          </button>
        </div>
      )}

      {/* Training Records Tab */}
      {tab === 'training' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Dumbbell} label="Sessions" value={trainingStats.total} color="text-lime-500" />
            <StatCard icon={Users} label="Avg Attendance" value={`${trainingStats.avgAtt}%`} color="text-blue-500" />
            <StatCard icon={BarChart3} label="Top Coach" value={trainingStats.topCoach} color="text-violet-500" small />
          </div>
          {trainingStats.recent.length > 0 && (
            <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Training Records</h3>
              <div className="space-y-2">
                {trainingStats.recent.map((r, i) => {
                  const att = Object.values(r.attendance || {});
                  const present = att.filter(v => v === 'present' || v === 'late').length;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800 font-medium">{teamMap[r.teamId] || 'Unknown'}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600">{r.coachName || 'Coach'}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{present}/{att.length}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{fmtDate(r.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button onClick={() => navigate('/admin/training-records')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#003018] transition-colors">
            Open Training Records <ExternalLink size={14} />
          </button>
        </div>
      )}

      {/* Team Selection Tab */}
      {tab === 'selection' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-6 text-center">
            <Trophy size={32} className="mx-auto text-violet-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Team Selection Hub</h3>
            <p className="text-sm text-gray-500 mb-4">Tryout evaluations, game scouting reports, combined player profiles, and team assignment.</p>
            <button onClick={() => navigate('/admin/team-selection')} className="px-6 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#003018] transition-colors inline-flex items-center gap-2">
              Open Team Selection <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

const StatCard = ({ icon: Icon, label, value, color, small }) => (
  <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4 text-center">
    <div className="flex items-center justify-center gap-2 mb-1">
      <Icon size={16} className={color} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <p className={`font-bold text-gray-800 ${small ? 'text-sm truncate' : 'text-2xl'}`}>{value}</p>
  </div>
);

export default AssessmentsHubPage;
