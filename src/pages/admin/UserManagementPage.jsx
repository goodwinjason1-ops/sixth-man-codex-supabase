import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageShell from '../../components/PageShell';
import {
  subscribeToUsers, updateUser, updateUserRole, disableUser, enableUser,
  softDeleteUser, sendPasswordReset, getUserStats, approveUser, rejectUser
} from '../../services/userService';
import { ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_BADGE_STYLES } from '../../constants/roles';
import {
  Users, UserPlus, Search, Filter, ChevronDown, ChevronUp,
  Mail, Lock, User, Shield, CheckCircle, AlertCircle, Info,
  Edit3, Trash2, Eye, Key, Ban, CheckSquare, X, MoreVertical,
  ArrowUpDown, UserX, UserCheck, Clock
} from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Users' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'deleted', label: 'Deleted' },
];

const UserManagementPage = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const pendingSectionRef = useRef(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  // Sorting
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Modals
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [rejectConfirm, setRejectConfirm] = useState(null);

  // Toasts
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Auto-scroll to pending section when navigated from notification
  useEffect(() => {
    if (searchParams.get('highlight') === 'pending' && !loading && pendingSectionRef.current) {
      pendingSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams, loading]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Stats
  const stats = useMemo(() => getUserStats(users), [users]);

  // Filtered + sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Status filter
    if (statusFilter === 'active') result = result.filter(u => !u.disabled && !u.deleted);
    else if (statusFilter === 'disabled') result = result.filter(u => u.disabled && !u.deleted);
    else if (statusFilter === 'deleted') result = result.filter(u => u.deleted);

    // Role filter
    if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, roleFilter, statusFilter, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-gray-800/30" />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-[#00A651]" />
      : <ChevronDown size={14} className="text-[#00A651]" />;
  };

  // ─── Action Handlers ───
  const handleDisable = async (user) => {
    if (user.id === currentUser.uid) {
      showToast('You cannot disable your own account.', 'error');
      return;
    }
    const res = await disableUser(user.id, currentUser.uid);
    if (res.success) showToast(`${user.displayName} has been disabled.`);
    else showToast(res.error, 'error');
    setViewUser(null);
  };

  const handleEnable = async (user) => {
    const res = await enableUser(user.id);
    if (res.success) showToast(`${user.displayName} has been re-enabled.`);
    else showToast(res.error, 'error');
    setViewUser(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.id === currentUser.uid) {
      showToast('You cannot delete your own account.', 'error');
      setDeleteConfirm(null);
      return;
    }
    const res = await softDeleteUser(deleteConfirm.id, currentUser.uid);
    if (res.success) showToast(`${deleteConfirm.displayName} has been deleted.`);
    else showToast(res.error, 'error');
    setDeleteConfirm(null);
    setViewUser(null);
  };

  const handlePasswordReset = async () => {
    if (!resetConfirm) return;
    const res = await sendPasswordReset(resetConfirm.email);
    if (res.success) showToast(`Password reset email sent to ${resetConfirm.email}.`);
    else showToast(res.error, 'error');
    setResetConfirm(null);
  };

  // Pending users for the approval section
  const pendingUsers = useMemo(() => users.filter(u => u.role === 'pending' && !u.deleted), [users]);

  const handleApprove = async (user, selectedRole) => {
    const actorInfo = { uid: currentUser.uid, displayName: currentUser.displayName || currentUser.email, role: 'admin' };
    const res = await approveUser(user.id, selectedRole, actorInfo);
    if (res.success) showToast(`${user.displayName || user.email} approved as ${ROLE_LABELS[selectedRole]}.`);
    else showToast(res.error, 'error');
    setApproveModal(null);
  };

  const handleReject = async () => {
    if (!rejectConfirm) return;
    const actorInfo = { uid: currentUser.uid, displayName: currentUser.displayName || currentUser.email, role: 'admin' };
    const res = await rejectUser(rejectConfirm.id, actorInfo);
    if (res.success) showToast(`${rejectConfirm.displayName || rejectConfirm.email} has been rejected.`);
    else showToast(res.error, 'error');
    setRejectConfirm(null);
  };

  const getStatusBadge = (user) => {
    if (user.deleted) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/50">Deleted</span>;
    if (user.disabled) return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">Disabled</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/50">Active</span>;
  };

  if (loading) {
    return (
      <PageShell title="User Management" subtitle="Loading users..." backTo="/admin"
        breadcrumbs={[{ label: 'Home', url: '/welcome' }, { label: 'Admin', url: '/admin' }, { label: 'User Management' }]}>
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="User Management"
      subtitle={`${stats.active} active users`}
      backTo="/admin"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'User Management' }
      ]}
      headerActions={
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg font-medium text-sm transition-colors">
          <UserPlus size={16} /> Add User
        </button>
      }
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Users" value={stats.total} icon={Users} color="text-blue-400" />
        <StatCard label="Active" value={stats.active} icon={UserCheck} color="text-green-400" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="text-orange-400" />
        <StatCard label="Disabled" value={stats.disabled} icon={Ban} color="text-yellow-400" />
        <StatCard label="Deleted" value={stats.deleted} icon={UserX} color="text-red-400" />
      </div>

      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <div ref={pendingSectionRef} className="mb-6 bg-orange-50 border-2 border-orange-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 bg-orange-100/60 border-b border-orange-200 flex items-center gap-2">
            <Clock size={18} className="text-orange-600" />
            <h3 className="font-bold text-orange-800">Pending Approvals</h3>
            <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{pendingUsers.length}</span>
          </div>
          <div className="divide-y divide-orange-100">
            {pendingUsers.map(user => (
              <div key={user.id} className="px-5 py-3 hover:bg-orange-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-sm flex-shrink-0">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium text-sm truncate">{user.displayName || '(No name)'}</p>
                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    <p className="text-gray-400 text-xs mt-0.5">Signed up {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-AU') : '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setApproveModal(user)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <UserCheck size={14} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectConfirm(user)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <UserX size={14} /> Reject
                    </button>
                  </div>
                </div>
                {/* Extra registration info */}
                {(user.requestedRole || user.requestedTeam || user.registrationNote || user.phone) && (
                  <div className="mt-2 ml-14 flex flex-wrap gap-2 text-xs">
                    {user.requestedRole && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        Requested: {ROLE_LABELS[user.requestedRole] || user.requestedRole}
                      </span>
                    )}
                    {user.requestedTeam && user.requestedTeam !== 'Not sure' && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                        Team: {user.requestedTeam}
                      </span>
                    )}
                    {user.phone && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {user.phone}
                      </span>
                    )}
                    {user.registrationNote && (
                      <p className="w-full text-gray-500 italic mt-1">"{user.registrationNote}"</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-white/40 focus:border-[#00A651] focus:outline-none text-sm"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none">
          <option value="all">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none">
          {STATUS_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Results count */}
      <p className="text-gray-400 text-xs mb-3">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found</p>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-[#D4E4D4]/30 overflow-hidden">
        <div className="grid grid-cols-[1fr_1.2fr_0.8fr_0.7fr_0.6fr_0.5fr] gap-2 px-4 py-3 bg-[#F5F9F5]/50 border-b border-[#D4E4D4]/30 text-xs font-medium text-gray-500">
          <button className="flex items-center gap-1 text-left" onClick={() => handleSort('displayName')}>
            Name <SortIcon field="displayName" />
          </button>
          <button className="flex items-center gap-1 text-left" onClick={() => handleSort('email')}>
            Email <SortIcon field="email" />
          </button>
          <button className="flex items-center gap-1 text-left" onClick={() => handleSort('role')}>
            Role <SortIcon field="role" />
          </button>
          <button className="flex items-center gap-1 text-left" onClick={() => handleSort('createdAt')}>
            Joined <SortIcon field="createdAt" />
          </button>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {filteredUsers.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400 text-sm">No users match your filters.</div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id}
              className="grid grid-cols-[1fr_1.2fr_0.8fr_0.7fr_0.6fr_0.5fr] gap-2 px-4 py-3 border-b border-[#D4E4D4]/10 hover:bg-gray-100 items-center text-sm">
              <span className="text-gray-800 truncate">{user.displayName || '—'}</span>
              <span className="text-gray-600 truncate">{user.email}</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium w-fit ${ROLE_BADGE_STYLES[user.role] || 'bg-gray-500/20 text-gray-400'}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <span className="text-gray-400 text-xs">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
              {getStatusBadge(user)}
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => setViewUser(user)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View">
                  <Eye size={14} className="text-gray-500" />
                </button>
                <button onClick={() => setEditUser({ ...user })} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                  <Edit3 size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">No users match your filters.</div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-800 font-medium truncate">{user.displayName || '—'}</p>
                  <p className="text-gray-400 text-xs truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => setViewUser(user)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <Eye size={14} className="text-gray-500" />
                  </button>
                  <button onClick={() => setEditUser({ ...user })} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <Edit3 size={14} className="text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_STYLES[user.role] || 'bg-gray-500/20 text-gray-400'}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                {getStatusBadge(user)}
                <span className="text-gray-400 text-xs ml-auto">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── View User Modal ─── */}
      {viewUser && (
        <Modal onClose={() => setViewUser(null)} title="User Details">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#D4E4D4] flex items-center justify-center text-gray-800 text-xl font-bold">
                {(viewUser.displayName || viewUser.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-bold text-lg truncate">{viewUser.displayName || '—'}</p>
                <p className="text-gray-500 text-sm truncate">{viewUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DetailItem label="Role" value={ROLE_LABELS[viewUser.role] || viewUser.role} />
              <DetailItem label="Status" value={viewUser.deleted ? 'Deleted' : viewUser.disabled ? 'Disabled' : 'Active'} />
              <DetailItem label="Joined" value={viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString() : '—'} />
              <DetailItem label="UID" value={viewUser.uid || viewUser.id} small />
            </div>

            {viewUser.disabled && viewUser.disabledBy && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
                Disabled on {viewUser.disabledAt ? new Date(viewUser.disabledAt).toLocaleDateString() : 'unknown date'}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#D4E4D4]/30">
              <button onClick={() => { setViewUser(null); setEditUser({ ...viewUser }); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30">
                <Edit3 size={14} /> Edit
              </button>
              <button onClick={() => setResetConfirm(viewUser)}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30">
                <Key size={14} /> Reset Password
              </button>
              {viewUser.disabled ? (
                <button onClick={() => handleEnable(viewUser)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30">
                  <CheckSquare size={14} /> Enable
                </button>
              ) : (
                <button onClick={() => handleDisable(viewUser)}
                  disabled={viewUser.id === currentUser.uid}
                  className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Ban size={14} /> Disable
                </button>
              )}
              {!viewUser.deleted && (
                <button onClick={() => setDeleteConfirm(viewUser)}
                  disabled={viewUser.id === currentUser.uid}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Edit User Modal ─── */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={async (uid, updates) => {
            const res = await updateUser(uid, updates);
            if (res.success) {
              showToast('User updated successfully.');
              setEditUser(null);
            } else {
              showToast(res.error, 'error');
            }
          }}
        />
      )}

      {/* ─── Create User Modal ─── */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(name) => {
            showToast(`User "${name}" created successfully.`);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} title="Delete User" danger>
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Are you sure you want to delete <strong className="text-gray-800">{deleteConfirm.displayName}</strong>?
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
              This is a soft delete. The user's Supabase Auth account will remain but they won't be able to log in.
              This cannot be undone from the UI.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                Delete User
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Approve User Modal ─── */}
      {approveModal && (
        <ApproveUserModal
          user={approveModal}
          onClose={() => setApproveModal(null)}
          onApprove={handleApprove}
        />
      )}

      {/* ─── Reject User Confirmation ─── */}
      {rejectConfirm && (
        <Modal onClose={() => setRejectConfirm(null)} title="Reject User" danger>
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Reject <strong className="text-gray-800">{rejectConfirm.displayName || rejectConfirm.email}</strong>?
              Their account will be removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRejectConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handleReject}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                Reject User
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Password Reset Confirmation ─── */}
      {resetConfirm && (
        <Modal onClose={() => setResetConfirm(null)} title="Reset Password">
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Send a password reset email to <strong className="text-gray-800">{resetConfirm.email}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setResetConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handlePasswordReset}
                className="flex-1 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600">
                Send Reset Email
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
};

// ─── Stat Card ───
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={16} className={color} />
      <span className="text-gray-400 text-xs">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

// ─── Detail Item ───
const DetailItem = ({ label, value, small }) => (
  <div className="bg-[#F5F9F5] rounded-lg p-3">
    <p className="text-gray-400 text-xs mb-1">{label}</p>
    <p className={`text-gray-800 font-medium ${small ? 'text-xs break-all' : 'text-sm'}`}>{value}</p>
  </div>
);

// ─── Modal Wrapper ───
const Modal = ({ children, title, onClose, danger }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
    <div className="bg-white rounded-2xl border border-[#D4E4D4]/30 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
      onClick={e => e.stopPropagation()}>
      <div className={`flex items-center justify-between px-5 py-4 border-b ${danger ? 'border-red-500/30' : 'border-[#D4E4D4]/30'}`}>
        <h3 className={`font-bold ${danger ? 'text-red-400' : 'text-gray-800'}`}>{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  </div>
);

// ─── Edit User Modal ───
const EditUserModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    role: user.role || 'player',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(user.id, {
      displayName: form.displayName.trim(),
      role: form.role,
    });
    setSaving(false);
  };

  return (
    <Modal onClose={onClose} title="Edit User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-1.5">
            <User size={14} /> Display Name
          </label>
          <input type="text" value={form.displayName}
            onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
            required />
        </div>

        <div>
          <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-1.5">
            <Mail size={14} /> Email
          </label>
          <input type="email" value={form.email} disabled
            className="w-full px-3 py-2.5 bg-[#F5F9F5]/50 border border-[#D4E4D4]/50 rounded-lg text-gray-400 text-sm cursor-not-allowed" />
          <p className="text-gray-800/30 text-xs mt-1">Email cannot be changed from this screen.</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-1.5">
            <Shield size={14} /> Role
          </label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none appearance-none">
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {form.role && (
          <div className="bg-[#F5F9F5] border border-[#D4E4D4]/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-[#00A651] flex-shrink-0 mt-0.5" />
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${ROLE_BADGE_STYLES[form.role]}`}>
                  {ROLE_LABELS[form.role]}
                </span>
                <p className="text-gray-600 text-xs">{ROLE_DESCRIPTIONS[form.role]}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.displayName.trim()}
            className="flex-1 py-2.5 bg-[#005028] text-white rounded-lg text-sm font-bold hover:bg-[#00A651] disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Create User Modal ───
const CreateUserModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ email: '', displayName: '', password: '', role: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.displayName || !form.password || !form.role) {
      setError('All fields are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setCreating(true);
    let secondaryApp = null;
    try {
      const config = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      };
      secondaryApp = initializeApp(config, 'SecondaryApp_' + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      const result = await createUserWithEmailAndPassword(
        secondaryAuth, form.email.trim().toLowerCase(), form.password
      );

      const profile = {
        uid: result.user.uid,
        email: form.email.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        role: form.role,
        createdAt: new Date().toISOString(),
        createdByAdmin: true,
        photoURL: null,
      };
      await setDoc(doc(db, 'users', result.user.uid), profile);

      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);
      secondaryApp = null;

      onSuccess(form.displayName.trim());
    } catch (err) {
      if (secondaryApp) { try { await deleteApp(secondaryApp); } catch (_) {} }
      if (err.code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.');
      else if (err.code === 'auth/weak-password') setError('Password is too weak.');
      else setError(err.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Create User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-1.5">
            <Mail size={14} /> Email Address
          </label>
          <input type="email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="user@example.com"
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:border-[#00A651] focus:outline-none"
            required />
        </div>

        <div>
          <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-1.5">
            <User size={14} /> Display Name
          </label>
          <input type="text" value={form.displayName}
            onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
            placeholder="Full name"
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:border-[#00A651] focus:outline-none"
            required />
        </div>

        <div>
          <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-1.5">
            <Lock size={14} /> Temporary Password
          </label>
          <input type="text" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="Minimum 6 characters"
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:border-[#00A651] focus:outline-none"
            required minLength={6} />
          <p className="text-gray-800/30 text-xs mt-1">The user should change this after first login.</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-1.5">
            <Shield size={14} /> Role
          </label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none appearance-none"
            required>
            <option value="">Select a role...</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {form.role && (
          <div className="bg-[#F5F9F5] border border-[#D4E4D4]/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-[#00A651] flex-shrink-0 mt-0.5" />
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${ROLE_BADGE_STYLES[form.role]}`}>
                  {ROLE_LABELS[form.role]}
                </span>
                <p className="text-gray-600 text-xs">{ROLE_DESCRIPTIONS[form.role]}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">
            Cancel
          </button>
          <button type="submit"
            disabled={creating || !form.email || !form.displayName || !form.password || !form.role}
            className="flex-1 py-2.5 bg-[#005028] text-white rounded-lg text-sm font-bold hover:bg-[#00A651] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {creating ? (
              <><div className="w-4 h-4 border-2 border-[#D4E4D4] border-t-transparent rounded-full animate-spin" /> Creating...</>
            ) : (
              <><UserPlus size={16} /> Create User</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Approve User Modal ───
const ApproveUserModal = ({ user, onClose, onApprove }) => {
  const [selectedRole, setSelectedRole] = useState(user.requestedRole || '');
  const [saving, setSaving] = useState(false);
  const assignableRoles = ALL_ROLES.filter(r => r !== 'pending');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setSaving(true);
    await onApprove(user, selectedRole);
    setSaving(false);
  };

  return (
    <Modal onClose={onClose} title="Approve User">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[#F5F9F5] rounded-lg border border-[#D4E4D4]">
          <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-sm">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-gray-800 font-medium text-sm">{user.displayName || '(No name)'}</p>
            <p className="text-gray-500 text-xs">{user.email}</p>
          </div>
        </div>

        {/* Registration details from the user */}
        {(user.requestedRole || user.requestedTeam || user.registrationNote || user.phone) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5">
            <p className="text-blue-800 text-xs font-semibold">Registration Details</p>
            {user.requestedRole && (
              <p className="text-blue-700 text-xs">Requested role: <strong>{ROLE_LABELS[user.requestedRole] || user.requestedRole}</strong></p>
            )}
            {user.requestedTeam && user.requestedTeam !== 'Not sure' && (
              <p className="text-blue-700 text-xs">Requested team: <strong>{user.requestedTeam}</strong></p>
            )}
            {user.phone && (
              <p className="text-blue-700 text-xs">Phone: {user.phone}</p>
            )}
            {user.registrationNote && (
              <p className="text-blue-700 text-xs italic">"{user.registrationNote}"</p>
            )}
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-[#00A651] text-sm font-medium mb-1.5">
            <Shield size={14} /> Assign Role
          </label>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none appearance-none"
            required>
            <option value="">Select a role...</option>
            {assignableRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {selectedRole && (
          <div className="bg-[#F5F9F5] border border-[#D4E4D4]/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-[#00A651] flex-shrink-0 mt-0.5" />
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${ROLE_BADGE_STYLES[selectedRole]}`}>
                  {ROLE_LABELS[selectedRole]}
                </span>
                <p className="text-gray-600 text-xs">{ROLE_DESCRIPTIONS[selectedRole]}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">
            Cancel
          </button>
          <button type="submit" disabled={saving || !selectedRole}
            className="flex-1 py-2.5 bg-[#005028] text-white rounded-lg text-sm font-bold hover:bg-[#00A651] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? 'Approving...' : <><UserCheck size={16} /> Approve</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserManagementPage;
