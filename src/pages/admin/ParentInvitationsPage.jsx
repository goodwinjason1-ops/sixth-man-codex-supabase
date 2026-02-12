import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  RefreshCw,
  User
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import InviteParentModal from '../../components/InviteParentModal';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  listInvitations,
  revokeInvitation,
  revokeAllPending,
  createInvitation
} from '../../services/parentInvitationService';

const ParentInvitationsPage = () => {
  const { currentUser } = useAuth();
  const { players } = useData();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [copiedCode, setCopiedCode] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);
  const [revokeAllResult, setRevokeAllResult] = useState(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [invitePlayer, setInvitePlayer] = useState(null);
  const playerSearchRef = useRef(null);
  const dropdownRef = useRef(null);

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

  // Player search results
  const playerResults = useMemo(() => {
    if (!playerSearch.trim() || !players?.length) return [];
    const q = playerSearch.toLowerCase();
    return players
      .filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.parentEmail?.toLowerCase().includes(q) ||
        p.playerNumber?.toString().includes(q)
      )
      .slice(0, 8);
  }, [playerSearch, players]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        playerSearchRef.current && !playerSearchRef.current.contains(e.target)
      ) {
        setPlayerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlayerSelect = (player) => {
    setInvitePlayer(player);
    setPlayerSearch('');
    setPlayerDropdownOpen(false);
    setHighlightedIdx(-1);
  };

  const handlePlayerSearchKeyDown = (e) => {
    if (!playerDropdownOpen || playerResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(prev => Math.min(prev + 1, playerResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      handlePlayerSelect(playerResults[highlightedIdx]);
    } else if (e.key === 'Escape') {
      setPlayerDropdownOpen(false);
    }
  };

  // Helper to compute display status
  const getInvStatus = (inv) => {
    if (inv.status === 'pending' && inv.expiresAt && new Date(inv.expiresAt) < new Date()) return 'expired';
    return inv.status;
  };

  // Filtered + sorted invitations
  const filtered = useMemo(() => {
    let result = invitations;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(inv => getInvStatus(inv) === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.invitationCode?.toLowerCase().includes(q) ||
        inv.parentEmail?.toLowerCase().includes(q) ||
        inv.parentName?.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'createdAt' || sortField === 'expiresAt') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [invitations, searchQuery, statusFilter, sortField, sortDir]);

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

  // Revoke All Pending
  const handleRevokeAllPending = async () => {
    setRevokeAllLoading(true);
    setRevokeAllResult(null);
    try {
      const result = await revokeAllPending();
      if (result.success) {
        setRevokeAllResult({ count: result.count });
        await fetchInvitations();
      } else {
        setError(result.error || 'Failed to revoke invitations');
      }
    } catch (err) {
      setError(err.message || 'Revoke all failed');
    } finally {
      setRevokeAllLoading(false);
      setConfirmRevokeAll(false);
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
    <div className="flex flex-wrap gap-2">
      {counts.pending > 0 && (
        <button
          onClick={() => setConfirmRevokeAll(true)}
          disabled={revokeAllLoading}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {revokeAllLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          Revoke All Pending ({counts.pending})
        </button>
      )}
      <button
        onClick={handleBulkGenerate}
        disabled={bulkLoading}
        className="flex items-center gap-2 px-4 py-2 bg-[#005028]/20 text-[#00A651] border border-[#00A651] rounded-lg text-sm font-medium hover:bg-[#00A651]/30 transition-colors disabled:opacity-50"
      >
        {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UsersIcon className="w-4 h-4" />}
        Bulk Generate
      </button>
      <button
        onClick={fetchInvitations}
        className="flex items-center gap-2 px-4 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm font-medium hover:border-[#00A651] transition-colors"
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
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Parent Invitations' }
      ]}
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Pending" count={counts.pending} color="text-blue-600" bgColor="bg-blue-50" active={statusFilter === 'pending'} onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')} />
          <SummaryCard label="Accepted" count={counts.accepted} color="text-green-600" bgColor="bg-green-50" active={statusFilter === 'accepted'} onClick={() => setStatusFilter(statusFilter === 'accepted' ? 'all' : 'accepted')} />
          <SummaryCard label="Expired" count={counts.expired} color="text-yellow-600" bgColor="bg-yellow-50" active={statusFilter === 'expired'} onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')} />
          <SummaryCard label="Revoked" count={counts.revoked} color="text-red-600" bgColor="bg-red-50" active={statusFilter === 'revoked'} onClick={() => setStatusFilter(statusFilter === 'revoked' ? 'all' : 'revoked')} />
        </div>

        {/* Confirm Revoke All */}
        {confirmRevokeAll && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-red-400 text-sm">
              Are you sure you want to revoke all {counts.pending} pending invitations? This cannot be undone.
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleRevokeAllPending}
                disabled={revokeAllLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {revokeAllLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Revoke All
              </button>
              <button
                onClick={() => setConfirmRevokeAll(false)}
                className="px-4 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg text-sm font-medium hover:border-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Revoke All Result */}
        {revokeAllResult && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4">
            <p className="text-red-400 text-sm">
              {revokeAllResult.count} pending invitation(s) revoked.
            </p>
          </div>
        )}

        {/* Bulk Result */}
        {bulkResult && (
          <div className="bg-[#005028]/10 border border-[#00A651] rounded-xl p-4">
            <p className="text-[#00A651] text-sm">
              Bulk generation complete: {bulkResult.created} of {bulkResult.total} invitations created.
            </p>
          </div>
        )}

        {/* Invite Player Search */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-[#00A651]" />
            <label className="text-[#00A651] text-sm font-medium">Invite a Parent</label>
          </div>
          <div className="relative" ref={playerSearchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Search player by name, email, or number..."
              value={playerSearch}
              onChange={(e) => {
                setPlayerSearch(e.target.value);
                setPlayerDropdownOpen(true);
                setHighlightedIdx(-1);
              }}
              onFocus={() => playerSearch.trim() && setPlayerDropdownOpen(true)}
              onKeyDown={handlePlayerSearchKeyDown}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F9F5] border border-[#00A651]/50 rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
            {playerSearch && (
              <button
                onClick={() => { setPlayerSearch(''); setPlayerDropdownOpen(false); }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7C6B] hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Player Search Dropdown */}
          {playerDropdownOpen && playerSearch.trim() && (
            <div
              ref={dropdownRef}
              className="absolute z-30 w-full mt-1 bg-white border border-[#D4E4D4] rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
            >
              {playerResults.length === 0 ? (
                <div className="px-4 py-3 text-[#6B7C6B] text-sm text-center">No players found</div>
              ) : (
                playerResults.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePlayerSelect(p)}
                    onMouseEnter={() => setHighlightedIdx(idx)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer ${
                      idx === highlightedIdx
                        ? 'bg-[#005028]/20 border-l-2 border-[#00A651]'
                        : 'hover:bg-[#F5F9F5] border-l-2 border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#00A651]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[#6B7C6B] text-xs truncate">
                        {p.playerNumber ? `#${p.playerNumber}` : ''}{p.ageGroup ? ` · ${p.ageGroup}` : ''}{p.parentEmail ? ` · ${p.parentEmail}` : ''}
                      </p>
                    </div>
                    <UserPlus className="w-4 h-4 text-[#00A651] flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Filter Existing Invitations */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-gray-500" />
            <label className="text-gray-500 text-sm font-medium">Filter Invitations</label>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Filter by email or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7C6B] hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
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
            <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading invitations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-2">No Invitations Found</h3>
            <p className="text-[#6B7C6B] text-sm">
              {searchQuery ? 'Try a different search term' : 'Create invitations from the Roster Management page'}
            </p>
          </div>
        ) : (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl overflow-hidden">
            {/* Table Header (desktop) */}
            <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 bg-[#F5F9F5] border-b border-[#D4E4D4] text-[#00A651] text-sm font-medium">
              {[
                { label: 'Code', field: 'invitationCode' },
                { label: 'Parent', field: 'parentName' },
                { label: 'Player(s)', field: null },
                { label: 'Status', field: 'status' },
                { label: 'Expires', field: 'expiresAt' },
              ].map(col => (
                <button
                  key={col.label}
                  onClick={() => {
                    if (!col.field) return;
                    if (sortField === col.field) {
                      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField(col.field);
                      setSortDir('asc');
                    }
                  }}
                  className={`text-left flex items-center gap-1 ${col.field ? 'hover:text-[#005028] cursor-pointer' : 'cursor-default'}`}
                >
                  {col.label}
                  {col.field && sortField === col.field && (
                    <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              ))}
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y divide-[#D4E4D4]">
              {filtered.map(inv => {
                const status = getStatusDisplay(inv);
                const StatusIcon = status.icon;

                return (
                  <div key={inv.id} className="p-4 hover:bg-[#F5F9F5]/50 transition-colors">
                    {/* Mobile */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-mono font-bold">{inv.invitationCode}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm">{inv.parentEmail || 'No email'}</p>
                      <p className="text-[#6B7C6B] text-xs">
                        {inv.playerIds?.length || 0} player(s) &bull; Expires {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => handleCopyLink(inv.invitationCode)} className="flex-1 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-xs flex items-center justify-center gap-1">
                          {copiedCode === inv.invitationCode ? <Check className="w-3 h-3 text-[#00A651]" /> : <Copy className="w-3 h-3" />}
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
                      <div className="text-gray-800 font-mono font-bold text-sm">{inv.invitationCode}</div>
                      <div>
                        <p className="text-gray-800 text-sm truncate">{inv.parentEmail || '-'}</p>
                        <p className="text-[#6B7C6B] text-xs truncate">{inv.parentName || ''}</p>
                      </div>
                      <div className="text-gray-800 text-sm">{inv.playerIds?.length || 0} player(s)</div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <div className="text-[#6B7C6B] text-sm">
                        {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleCopyLink(inv.invitationCode)}
                          className="p-2 text-[#00A651] hover:bg-[#00A651]/20 rounded-lg transition-colors"
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

      {/* Invite Parent Modal */}
      {invitePlayer && (
        <InviteParentModal
          player={invitePlayer}
          onClose={() => setInvitePlayer(null)}
          onSuccess={() => fetchInvitations()}
        />
      )}
    </PageShell>
  );
};

const SummaryCard = ({ label, count, color, bgColor, active, onClick }) => (
  <button
    onClick={onClick}
    className={`${bgColor} rounded-xl p-4 text-left w-full transition-all ${
      active ? 'ring-2 ring-[#00A651] ring-offset-1' : 'hover:opacity-80'
    }`}
  >
    <p className={`text-2xl font-bold ${color}`}>{count}</p>
    <p className="text-gray-500 text-sm">{label}</p>
  </button>
);

export default ParentInvitationsPage;
