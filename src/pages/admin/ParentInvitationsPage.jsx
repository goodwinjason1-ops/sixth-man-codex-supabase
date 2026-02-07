import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  X,
  UserPlus,
  AlertCircle,
  Loader2,
  Ban,
  Clock,
  CheckCircle2,
  XCircle,
  Users as UsersIcon,
  RefreshCw
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  listInvitations,
  revokeInvitation,
  createInvitation
} from '../../services/parentInvitationService';

const ParentInvitationsPage = () => {
  const { currentUser } = useAuth();
  const { players } = useData();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const fetchInvitations = async () => {
    setLoading(true);
    const result = await listInvitations();
    if (result.success) {
      setInvitations(result.data);
    } else {
      setError(result.error || 'Failed to load invitations');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  // Summary counts
  const counts = useMemo(() => {
    const c = { pending: 0, accepted: 0, expired: 0, revoked: 0 };
    invitations.forEach(inv => {
      if (inv.status === 'pending' && inv.expiresAt && new Date(inv.expiresAt) < new Date()) {
        c.expired++;
      } else if (c[inv.status] !== undefined) {
        c[inv.status]++;
      }
    });
    return c;
  }, [invitations]);

  // Filtered invitations
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return invitations;
    const q = searchQuery.toLowerCase();
    return invitations.filter(inv =>
      inv.invitationCode?.toLowerCase().includes(q) ||
      inv.parentEmail?.toLowerCase().includes(q) ||
      inv.parentName?.toLowerCase().includes(q)
    );
  }, [invitations, searchQuery]);

  const handleRevoke = async (invId) => {
    const result = await revokeInvitation(invId);
    if (result.success) {
      setInvitations(prev => prev.map(inv =>
        inv.id === invId ? { ...inv, status: 'revoked' } : inv
      ));
    }
  };

  const handleCopyLink = async (code) => {
    try {
      const link = `${window.location.origin}/signup/${code}`;
      await navigator.clipboard.writeText(link);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const getStatusDisplay = (inv) => {
    if (inv.status === 'pending' && inv.expiresAt && new Date(inv.expiresAt) < new Date()) {
      return { label: 'Expired', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500', icon: Clock };
    }
    switch (inv.status) {
      case 'pending': return { label: 'Pending', color: 'text-blue-400 bg-blue-500/20 border-blue-500', icon: Clock };
      case 'accepted': return { label: 'Accepted', color: 'text-green-400 bg-green-500/20 border-green-500', icon: CheckCircle2 };
      case 'revoked': return { label: 'Revoked', color: 'text-red-400 bg-red-500/20 border-red-500', icon: XCircle };
      default: return { label: inv.status, color: 'text-gray-400 bg-gray-500/20 border-gray-500', icon: AlertCircle };
    }
  };

  // Bulk Generate
  const handleBulkGenerate = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    try {
      // Find players with parentEmail but no existing invitation
      const existingEmails = new Set(
        invitations
          .filter(inv => inv.status === 'pending' || inv.status === 'accepted')
          .map(inv => inv.parentEmail?.toLowerCase())
          .filter(Boolean)
      );

      const eligiblePlayers = (players || []).filter(
        p => p.parentEmail && !existingEmails.has(p.parentEmail.toLowerCase())
      );

      // Group siblings by parentEmail
      const byEmail = {};
      eligiblePlayers.forEach(p => {
        const email = p.parentEmail.toLowerCase();
        if (!byEmail[email]) byEmail[email] = { email: p.parentEmail, playerIds: [] };
        byEmail[email].playerIds.push(p.id);
      });

      const groups = Object.values(byEmail);
      let created = 0;

      for (const group of groups) {
        const res = await createInvitation({
          playerIds: group.playerIds,
          parentEmail: group.email,
          parentName: '',
          createdBy: currentUser.uid
        });
        if (res.success) created++;
      }

      setBulkResult({ created, total: groups.length });
      await fetchInvitations();
    } catch (err) {
      setError(err.message || 'Bulk generation failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const headerActions = (
    <div className="flex gap-2">
      <button
        onClick={handleBulkGenerate}
        disabled={bulkLoading}
        className="flex items-center gap-2 px-4 py-2 bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e] rounded-lg text-sm font-medium hover:bg-[#22c55e]/30 transition-colors disabled:opacity-50"
      >
        {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UsersIcon className="w-4 h-4" />}
        Bulk Generate
      </button>
      <button
        onClick={fetchInvitations}
        className="flex items-center gap-2 px-4 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm font-medium hover:border-[#22c55e] transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>
    </div>
  );

  return (
    <PageShell
      title="Parent Invitations"
      subtitle="Manage parent signup invitation codes"
      breadcrumb={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Parent Invitations' }
      ]}
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Pending" count={counts.pending} color="text-blue-400" bgColor="bg-blue-500/10" />
          <SummaryCard label="Accepted" count={counts.accepted} color="text-green-400" bgColor="bg-green-500/10" />
          <SummaryCard label="Expired" count={counts.expired} color="text-yellow-400" bgColor="bg-yellow-500/10" />
          <SummaryCard label="Revoked" count={counts.revoked} color="text-red-400" bgColor="bg-red-500/10" />
        </div>

        {/* Bulk Result */}
        {bulkResult && (
          <div className="bg-[#22c55e]/10 border border-[#22c55e] rounded-xl p-4">
            <p className="text-[#4ade80] text-sm">
              Bulk generation complete: {bulkResult.created} of {bulkResult.total} invitations created.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a8a68]" />
          <input
            type="text"
            placeholder="Search by email or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#1a8a68] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin mx-auto mb-2" />
            <p className="text-white/60">Loading invitations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">No Invitations Found</h3>
            <p className="text-[#1a8a68] text-sm">
              {searchQuery ? 'Try a different search term' : 'Create invitations from the Roster Management page'}
            </p>
          </div>
        ) : (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl overflow-hidden">
            {/* Table Header (desktop) */}
            <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 bg-[#0a3d2e] border-b border-[#1a8a68] text-[#4ade80] text-sm font-medium">
              <div>Code</div>
              <div>Parent</div>
              <div>Player(s)</div>
              <div>Status</div>
              <div>Expires</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y divide-[#1a8a68]">
              {filtered.map(inv => {
                const status = getStatusDisplay(inv);
                const StatusIcon = status.icon;

                return (
                  <div key={inv.id} className="p-4 hover:bg-[#0a3d2e]/50 transition-colors">
                    {/* Mobile */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-mono font-bold">{inv.invitationCode}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-white text-sm">{inv.parentEmail || 'No email'}</p>
                      <p className="text-[#1a8a68] text-xs">
                        {inv.playerIds?.length || 0} player(s) &bull; Expires {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => handleCopyLink(inv.invitationCode)} className="flex-1 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-xs flex items-center justify-center gap-1">
                          {copiedCode === inv.invitationCode ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
                          {copiedCode === inv.invitationCode ? 'Copied' : 'Copy Link'}
                        </button>
                        {inv.status === 'pending' && (
                          <button onClick={() => handleRevoke(inv.id)} className="py-2 px-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-xs flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Revoke
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:grid md:grid-cols-6 gap-4 items-center">
                      <div className="text-white font-mono font-bold text-sm">{inv.invitationCode}</div>
                      <div>
                        <p className="text-white text-sm truncate">{inv.parentEmail || '-'}</p>
                        <p className="text-[#1a8a68] text-xs truncate">{inv.parentName || ''}</p>
                      </div>
                      <div className="text-white text-sm">{inv.playerIds?.length || 0} player(s)</div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <div className="text-[#1a8a68] text-sm">
                        {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleCopyLink(inv.invitationCode)}
                          className="p-2 text-[#4ade80] hover:bg-[#22c55e]/20 rounded-lg transition-colors"
                          title="Copy signup link"
                        >
                          {copiedCode === inv.invitationCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Revoke invitation"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

const SummaryCard = ({ label, count, color, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-4`}>
    <p className={`text-2xl font-bold ${color}`}>{count}</p>
    <p className="text-white/60 text-sm">{label}</p>
  </div>
);

export default ParentInvitationsPage;
