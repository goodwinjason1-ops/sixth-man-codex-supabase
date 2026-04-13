import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import PageShell from '../../components/PageShell';
import {
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  FileText,
  Dumbbell,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Filter,
  BarChart3,
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
  return dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminTrainingRecordsPage = () => {
  const { trainingRecords, teams, players, trainingPlans, loading } = useData();
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [coachFilter, setCoachFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Build lookup maps
  const teamMap = useMemo(() => {
    const m = {};
    (teams || []).forEach(t => { m[t.id] = t.name || t.id; });
    return m;
  }, [teams]);

  const playerMap = useMemo(() => {
    const m = {};
    (players || []).forEach(p => { m[p.id] = p.name || p.firstName + ' ' + p.lastName || p.id; });
    return m;
  }, [players]);

  const planMap = useMemo(() => {
    const m = {};
    (trainingPlans || []).forEach(p => { m[p.id] = p.name || p.title || 'Unnamed Plan'; });
    return m;
  }, [trainingPlans]);

  // Unique coaches from records
  const coaches = useMemo(() => {
    const map = {};
    (trainingRecords || []).forEach(r => {
      if (r.coachId) map[r.coachId] = r.coachName || r.coachId;
    });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [trainingRecords]);

  // Filtered + sorted records
  const filtered = useMemo(() => {
    let list = [...(trainingRecords || [])];

    if (teamFilter !== 'all') list = list.filter(r => r.teamId === teamFilter);
    if (coachFilter !== 'all') list = list.filter(r => r.coachId === coachFilter);

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter(r => { const d = parseDate(r.date); return d && d >= from; });
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      list = list.filter(r => { const d = parseDate(r.date); return d && d <= to; });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        (r.coachName || '').toLowerCase().includes(q) ||
        (teamMap[r.teamId] || '').toLowerCase().includes(q) ||
        (planMap[r.trainingPlanId] || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const da = parseDate(a.date), db = parseDate(b.date);
      return (db || 0) - (da || 0);
    });

    return list;
  }, [trainingRecords, teamFilter, coachFilter, dateFrom, dateTo, search, teamMap, planMap]);

  // Summary stats
  const stats = useMemo(() => {
    const records = trainingRecords || [];
    const totalSessions = records.length;

    let totalPresent = 0, totalRoster = 0;
    records.forEach(r => {
      const att = r.attendance || {};
      const vals = Object.values(att);
      totalRoster += vals.length;
      totalPresent += vals.filter(v => v === 'present' || v === 'late').length;
    });
    const avgAttendance = totalRoster > 0 ? Math.round((totalPresent / totalRoster) * 100) : 0;

    // Most active coach
    const coachCounts = {};
    records.forEach(r => {
      const name = r.coachName || 'Unknown';
      coachCounts[name] = (coachCounts[name] || 0) + 1;
    });
    const mostActive = Object.entries(coachCounts).sort((a, b) => b[1] - a[1])[0];

    return { totalSessions, avgAttendance, mostActiveCoach: mostActive ? `${mostActive[0]} (${mostActive[1]})` : '—' };
  }, [trainingRecords]);

  const getAttendanceCounts = (attendance) => {
    const vals = Object.values(attendance || {});
    return {
      present: vals.filter(v => v === 'present').length,
      late: vals.filter(v => v === 'late').length,
      absent: vals.filter(v => v === 'absent').length,
      total: vals.length,
    };
  };

  if (loading) {
    return (
      <PageShell title="Training Records" breadcrumbs={[{ label: 'Home', url: '/welcome' }, { label: 'Assessments & Selection', url: '/admin/assessments-hub' }, { label: 'Training Records' }]}>
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#00A651]" size={32} /></div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Training Records" breadcrumbs={[{ label: 'Home', url: '/welcome' }, { label: 'Assessments & Selection', url: '/admin/assessments-hub' }, { label: 'Training Records' }]}>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Dumbbell size={16} className="text-[#00A651]" />
            <span className="text-xs text-gray-500">Total Sessions</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalSessions}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users size={16} className="text-blue-500" />
            <span className="text-xs text-gray-500">Avg Attendance</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.avgAttendance}%</p>
        </div>
        <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BarChart3 size={16} className="text-violet-500" />
            <span className="text-xs text-gray-500">Most Active</span>
          </div>
          <p className="text-sm font-bold text-gray-800 truncate">{stats.mostActiveCoach}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30"
            />
          </div>
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="w-full px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30">
            <option value="all">All Teams</option>
            {(teams || []).map(t => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
          </select>
          <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)} className="w-full px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30">
            <option value="all">All Coaches</option>
            {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30" placeholder="From" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-[#D4E4D4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/30" placeholder="To" />
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-8 text-center">
            <FileText size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No training records found</p>
          </div>
        ) : (
          filtered.map(record => {
            const expanded = expandedId === record.id;
            const att = getAttendanceCounts(record.attendance);
            const teamName = teamMap[record.teamId] || 'Unknown Team';
            const planName = record.trainingPlanId ? (planMap[record.trainingPlanId] || 'Unknown Plan') : null;

            return (
              <div key={record.id} className="bg-white rounded-xl border border-[#D4E4D4]/30 overflow-hidden">
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : record.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{fmtDate(record.date)}</span>
                      <span className="px-2 py-0.5 bg-[#005028]/10 text-[#005028] rounded-full text-xs font-medium">{teamName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><User size={12} /> {record.coachName || 'Unknown'}</span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {att.present + att.late}/{att.total} present
                      </span>
                      {planName && (
                        <span className="flex items-center gap-1 truncate"><Dumbbell size={12} /> {planName}</span>
                      )}
                    </div>
                  </div>
                  {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {/* Expanded Detail */}
                {expanded && (
                  <div className="border-t border-[#D4E4D4]/30 p-4 space-y-4">
                    {/* Attendance List */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Users size={14} /> Attendance ({att.present + att.late}/{att.total})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(record.attendance || {}).map(([pid, status]) => (
                          <div key={pid} className="flex items-center gap-2 text-sm">
                            {status === 'present' && <CheckCircle2 size={14} className="text-green-500" />}
                            {status === 'late' && <Clock size={14} className="text-yellow-500" />}
                            {status === 'absent' && <XCircle size={14} className="text-red-400" />}
                            <span className={status === 'absent' ? 'text-gray-400 line-through' : 'text-gray-700'}>
                              {playerMap[pid] || pid}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Session Notes */}
                    {record.sessionNotes && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2"><MessageSquare size={14} /> Session Notes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{record.sessionNotes}</p>
                      </div>
                    )}

                    {/* Drill Completion */}
                    {record.drillsCompleted && record.drillsCompleted.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2"><Dumbbell size={14} /> Drills Completed ({record.drillsCompleted.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.drillsCompleted.map((drillKey, i) => (
                            <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                              {drillKey}
                              {record.drillNotes?.[drillKey] && (
                                <span className="ml-1 text-green-500">— {record.drillNotes[drillKey]}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Player Notes */}
                    {record.playerNotes && Object.keys(record.playerNotes).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2"><FileText size={14} /> Player Notes</h4>
                        <div className="space-y-2">
                          {Object.entries(record.playerNotes).map(([pid, note]) => (
                            <div key={pid} className="bg-gray-50 rounded-lg p-2 text-sm">
                              <span className="font-medium text-gray-700">{playerMap[pid] || pid}:</span>{' '}
                              <span className="text-gray-600">{note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
};

export default AdminTrainingRecordsPage;
