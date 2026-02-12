import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PageShell from '../../components/PageShell';
import {
  ShieldCheck,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Filter,
  Loader2,
  Award,
  Heart,
} from 'lucide-react';

// Reuse the same expiry check logic
const checkExpiryStatus = (expiryDate) => {
  if (!expiryDate) return 'not_set';
  const expiry = new Date(expiryDate);
  const today = new Date();
  const threeMonths = new Date();
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  if (expiry < today) return 'expired';
  if (expiry < threeMonths) return 'expiring';
  return 'active';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'text-green-400';
    case 'expiring': return 'text-yellow-400';
    case 'expired': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const getStatusBg = (status) => {
  switch (status) {
    case 'active': return 'bg-green-500/20 border-green-500/50';
    case 'expiring': return 'bg-yellow-500/20 border-yellow-500/50';
    case 'expired': return 'bg-red-500/20 border-red-500/50';
    default: return 'bg-gray-500/20 border-gray-500/50';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'active': return 'Valid';
    case 'expiring': return 'Expiring Soon';
    case 'expired': return 'Expired';
    default: return 'Missing';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const CoachCompliancePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | expiring | expired

  // Load all coach accreditation records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coach_accreditations'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Enrich records with computed row-level status
  const enrichedRecords = useMemo(() => {
    return records.map(rec => {
      const coachingStatus = checkExpiryStatus(rec.coaching?.expiryDate);
      const firstAidStatus = checkExpiryStatus(rec.firstAid?.expiryDate);
      const wwccStatus = checkExpiryStatus(rec.wwcc?.expiryDate);

      const statuses = [coachingStatus, firstAidStatus, wwccStatus];
      const rowStatus = statuses.includes('expired') || statuses.includes('not_set')
        ? 'expired'
        : statuses.includes('expiring')
        ? 'expiring'
        : 'active';

      // Find soonest expiry for sorting
      const dates = [rec.coaching?.expiryDate, rec.firstAid?.expiryDate, rec.wwcc?.expiryDate]
        .filter(Boolean)
        .map(d => new Date(d).getTime());
      const soonestExpiry = dates.length > 0 ? Math.min(...dates) : Infinity;

      return {
        ...rec,
        coachingStatus,
        firstAidStatus,
        wwccStatus,
        rowStatus,
        soonestExpiry,
      };
    });
  }, [records]);

  // Summary stats
  const stats = useMemo(() => {
    const total = enrichedRecords.length;
    const compliant = enrichedRecords.filter(r => r.rowStatus === 'active').length;
    const expiring = enrichedRecords.filter(r => r.rowStatus === 'expiring').length;
    const expired = enrichedRecords.filter(r => r.rowStatus === 'expired').length;
    return { total, compliant, expiring, expired };
  }, [enrichedRecords]);

  // Filter and sort
  const filteredRecords = useMemo(() => {
    let list = enrichedRecords;
    if (filter === 'expiring') list = list.filter(r => r.rowStatus === 'expiring');
    if (filter === 'expired') list = list.filter(r => r.rowStatus === 'expired');
    return list.sort((a, b) => a.soonestExpiry - b.soonestExpiry);
  }, [enrichedRecords, filter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Coach Name',
      'Coaching Level', 'Coaching Cert #', 'Coaching Expiry',
      'First Aid Level', 'FA Cert #', 'FA Expiry',
      'WWCC #', 'WWCC Expiry', 'WWCC State',
      'Overall Status',
    ];
    const rows = filteredRecords.map(r => [
      r.coachName || '',
      r.coaching?.level || '',
      r.coaching?.certificateNumber || '',
      r.coaching?.expiryDate || '',
      r.firstAid?.level || '',
      r.firstAid?.certificateNumber || '',
      r.firstAid?.expiryDate || '',
      r.wwcc?.checkNumber || '',
      r.wwcc?.expiryDate || '',
      r.wwcc?.state || '',
      getStatusLabel(r.rowStatus),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coach-compliance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatusCell = ({ status, label, expiry }) => (
    <div className="flex flex-col">
      <span className={`text-xs font-medium ${getStatusColor(status)}`}>{label || '—'}</span>
      <span className="text-[10px] text-[#1a8a68]">{formatDate(expiry)}</span>
    </div>
  );

  const RowStatusIcon = ({ status }) => {
    if (status === 'active') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === 'expiring') return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  return (
    <PageShell
      backTo="/admin"
      title="Coach Compliance"
      subtitle="Accreditation tracking & expiry alerts"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Coach Compliance' },
      ]}
      maxWidth="6xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-[#1a8a68] text-xs">Total Coaches</p>
            </div>
            <div className="bg-[#0d5943] border border-green-500/30 rounded-xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-400">{stats.compliant}</p>
              <p className="text-[#1a8a68] text-xs">Fully Compliant</p>
            </div>
            <div className="bg-[#0d5943] border border-yellow-500/30 rounded-xl p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-400">{stats.expiring}</p>
              <p className="text-[#1a8a68] text-xs">Expiring Soon</p>
            </div>
            <div className="bg-[#0d5943] border border-red-500/30 rounded-xl p-4 text-center">
              <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
              <p className="text-[#1a8a68] text-xs">Expired / Missing</p>
            </div>
          </div>

          {/* Filter & Export Bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#1a8a68]" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#0d5943] border border-[#1a8a68] rounded-lg text-white text-sm focus:border-[#22c55e] focus:outline-none"
              >
                <option value="all">All Coaches</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired & Missing</option>
              </select>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-[#4ade80] text-sm hover:border-[#22c55e] transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-[#0d5943] border-2 border-dashed border-[#1a8a68] rounded-2xl p-8 text-center">
              <ShieldCheck className="w-10 h-10 text-[#1a8a68] mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No records found</p>
              <p className="text-[#1a8a68] text-sm">
                {filter !== 'all' ? 'Try changing the filter.' : 'Coaches need to set up their accreditations.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1a8a68]">
                      <th className="text-left px-4 py-3 text-[#4ade80] text-xs font-medium uppercase tracking-wider">Coach</th>
                      <th className="text-left px-4 py-3 text-[#4ade80] text-xs font-medium uppercase tracking-wider">Coaching</th>
                      <th className="text-left px-4 py-3 text-[#4ade80] text-xs font-medium uppercase tracking-wider">First Aid</th>
                      <th className="text-left px-4 py-3 text-[#4ade80] text-xs font-medium uppercase tracking-wider">WWCC</th>
                      <th className="text-center px-4 py-3 text-[#4ade80] text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a8a68]/50">
                    {filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#0a3d2e]/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">{rec.coachName || 'Unknown'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusCell
                            status={rec.coachingStatus}
                            label={rec.coaching?.level}
                            expiry={rec.coaching?.expiryDate}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusCell
                            status={rec.firstAidStatus}
                            label={rec.firstAid?.level}
                            expiry={rec.firstAid?.expiryDate}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusCell
                            status={rec.wwccStatus}
                            label={rec.wwcc?.checkNumber ? `#${rec.wwcc.checkNumber}` : null}
                            expiry={rec.wwcc?.expiryDate}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RowStatusIcon status={rec.rowStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredRecords.map((rec) => (
                  <div key={rec.id} className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-medium text-sm">{rec.coachName || 'Unknown'}</p>
                      <RowStatusIcon status={rec.rowStatus} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Award className="w-3 h-3 text-[#1a8a68]" />
                          <span className="text-[#1a8a68] text-[10px] uppercase">Coaching</span>
                        </div>
                        <span className={`text-xs font-medium ${getStatusColor(rec.coachingStatus)}`}>
                          {rec.coaching?.level || '—'}
                        </span>
                        <p className="text-[10px] text-[#1a8a68]">{formatDate(rec.coaching?.expiryDate)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Heart className="w-3 h-3 text-[#1a8a68]" />
                          <span className="text-[#1a8a68] text-[10px] uppercase">First Aid</span>
                        </div>
                        <span className={`text-xs font-medium ${getStatusColor(rec.firstAidStatus)}`}>
                          {rec.firstAid?.level || '—'}
                        </span>
                        <p className="text-[10px] text-[#1a8a68]">{formatDate(rec.firstAid?.expiryDate)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <ShieldCheck className="w-3 h-3 text-[#1a8a68]" />
                          <span className="text-[#1a8a68] text-[10px] uppercase">WWCC</span>
                        </div>
                        <span className={`text-xs font-medium ${getStatusColor(rec.wwccStatus)}`}>
                          {rec.wwcc?.checkNumber ? `#${rec.wwcc.checkNumber}` : '—'}
                        </span>
                        <p className="text-[10px] text-[#1a8a68]">{formatDate(rec.wwcc?.expiryDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PageShell>
  );
};

export default CoachCompliancePage;
