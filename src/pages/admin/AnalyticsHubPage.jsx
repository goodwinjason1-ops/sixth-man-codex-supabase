import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import PageShell from '../../components/PageShell';
import {
  BarChart3,
  Users,
  GraduationCap,
  ExternalLink,
  TrendingUp,
  Shield,
  Target,
  Award,
  Clock,
} from 'lucide-react';

const TABS = [
  { id: 'analytics', label: 'Club Analytics', icon: BarChart3 },
  { id: 'age-groups', label: 'Age Groups', icon: Users },
  { id: 'coaching', label: 'Coaching', icon: GraduationCap },
  { id: 'rotations', label: 'Rotations', icon: Clock },
  { id: 'advanced', label: 'Advanced', icon: TrendingUp },
];

const AnalyticsHubPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('analytics');
  const { players, evaluations, teams, matchAssessments, trainingRecords } = useData();

  const clubStats = useMemo(() => {
    const totalPlayers = (players || []).length;
    const totalTeams = (teams || []).length;
    const totalMatchAssessments = (matchAssessments || []).length;
    const totalTrainingRecords = (trainingRecords || []).length;
    const totalEvals = totalMatchAssessments + totalTrainingRecords;

    // Age group breakdown
    const ageGroups = {};
    (players || []).forEach(p => {
      const ag = p.ageGroup || p.age_group || 'Unknown';
      ageGroups[ag] = (ageGroups[ag] || 0) + 1;
    });

    // Unique coaches
    const coachSet = new Set();
    (teams || []).forEach(t => {
      if (t.coachId) coachSet.add(t.coachId);
      (t.coaches || []).forEach(c => coachSet.add(c));
    });

    return { totalPlayers, totalTeams, totalEvals, totalMatchAssessments, totalTrainingRecords, ageGroups, coachCount: coachSet.size };
  }, [players, evaluations, teams, matchAssessments, trainingRecords]);

  return (
    <PageShell
      title="Analytics & Reports"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Analytics & Reports' },
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
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Club Analytics Tab */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Players" value={clubStats.totalPlayers} color="text-blue-500" />
            <StatCard icon={Shield} label="Teams" value={clubStats.totalTeams} color="text-purple-500" />
            <StatCard icon={Target} label="Assessments" value={clubStats.totalEvals} color="text-green-500" subtitle={`Match: ${clubStats.totalMatchAssessments} | Training: ${clubStats.totalTrainingRecords}`} />
            <StatCard icon={GraduationCap} label="Coaches" value={clubStats.coachCount} color="text-orange-500" />
          </div>
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-6 text-center">
            <BarChart3 size={32} className="mx-auto text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Club-Wide Analytics</h3>
            <p className="text-sm text-gray-500 mb-4">Performance metrics, trends, and club-wide statistics.</p>
            <button onClick={() => navigate('/admin/analytics')} className="px-6 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#003018] transition-colors inline-flex items-center gap-2">
              Open Club Analytics <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Age Groups Tab */}
      {tab === 'age-groups' && (
        <div className="space-y-4">
          {Object.keys(clubStats.ageGroups).length > 0 && (
            <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Players by Age Group</h3>
              <div className="space-y-2">
                {Object.entries(clubStats.ageGroups).sort((a, b) => a[0].localeCompare(b[0])).map(([group, count]) => (
                  <div key={group} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-800 font-medium">{group}</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{count} players</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => navigate('/admin/age-groups')} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#003018] transition-colors">
            Open Age Group Reports <ExternalLink size={14} />
          </button>
        </div>
      )}

      {/* Coaching Tab */}
      {tab === 'coaching' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-6 text-center">
            <GraduationCap size={32} className="mx-auto text-green-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Coaching Effectiveness</h3>
            <p className="text-sm text-gray-500 mb-4">Coach performance metrics, training analysis, and compliance tracking.</p>
            <button onClick={() => navigate('/admin/coaching')} className="px-6 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#003018] transition-colors inline-flex items-center gap-2">
              Open Coaching Effectiveness <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Rotations Tab */}
      {tab === 'rotations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-6 text-center">
            <Clock size={32} className="mx-auto text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Rotation Analytics</h3>
            <p className="text-sm text-gray-500 mb-4">Club-wide playing time analysis, fairness tracking, and equity alerts across all teams.</p>
            <button onClick={() => navigate('/admin/rotation-analytics')} className="px-6 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#003018] transition-colors inline-flex items-center gap-2">
              Open Rotation Analytics <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Advanced Tab */}
      {tab === 'advanced' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={Target} label="Shot Charts" value="Ready" color="text-blue-500" />
            <StatCard icon={Shield} label="Fair Play" value="Context" color="text-purple-500" />
            <StatCard icon={Award} label="Selection" value="Governed" color="text-amber-500" />
          </div>
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-6 text-center">
            <TrendingUp size={32} className="mx-auto text-emerald-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Advanced Analytics</h3>
            <p className="text-sm text-gray-500 mb-4">Shot charts, movement-ready trends, fair-play context, and committee selection checks.</p>
            <button onClick={() => navigate('/admin/advanced-analytics')} className="px-6 py-3 bg-[#005028] text-white rounded-xl text-sm font-medium hover:bg-[#003018] transition-colors inline-flex items-center gap-2">
              Open Advanced Analytics <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4 text-center">
    <div className="flex items-center justify-center gap-2 mb-1">
      <Icon size={16} className={color} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

export default AnalyticsHubPage;
