import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PageShell from '../../components/PageShell';
import {
  subscribeToTeams, createTeam, updateTeam, deleteTeam,
  addPlayerToTeam, removePlayerFromTeam, getCoaches,
  importTeamsFromCSV, bulkCreateTeams
} from '../../services/teamService';
import { subscribeToUsers } from '../../services/userService';
import {
  Shield, Plus, Search, X, Edit3, Trash2, Eye, Users, UserPlus,
  Upload, CheckCircle, AlertCircle, Info, ChevronDown, FileText,
  UserMinus, Loader2
} from 'lucide-react';

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'];
const GENDERS = [
  { value: 'boys', label: 'Boys' },
  { value: 'girls', label: 'Girls' },
  { value: 'mixed', label: 'Mixed' },
];

const TeamManagementPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // Modals
  const [viewTeam, setViewTeam] = useState(null);
  const [editTeam, setEditTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showCSVImport, setShowCSVImport] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Coordinator gender auto-filter
  const coordinatorGender = userProfile?.role === 'girls_coordinator' ? 'girls'
    : userProfile?.role === 'boys_coordinator' ? 'boys' : null;

  useEffect(() => {
    const unsubTeams = subscribeToTeams(data => {
      setTeams(data);
      setLoading(false);
    });
    const unsubUsers = subscribeToUsers(data => setAllUsers(data));
    getCoaches().then(res => { if (res.success) setCoaches(res.data); });
    return () => { unsubTeams(); unsubUsers(); };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Players = users with role 'player'
  const players = useMemo(() => allUsers.filter(u => u.role === 'player' && !u.deleted), [allUsers]);

  // Stats
  const stats = useMemo(() => {
    const visibleTeams = coordinatorGender
      ? teams.filter(t => t.gender === coordinatorGender)
      : teams;
    const needCoach = visibleTeams.filter(t => !t.coachId).length;
    const assignedPlayerIds = new Set(visibleTeams.flatMap(t => t.playerIds || []));
    const unassigned = players.filter(p => !assignedPlayerIds.has(p.id)).length;
    const avgRoster = visibleTeams.length > 0
      ? Math.round(visibleTeams.reduce((sum, t) => sum + (t.playerIds?.length || 0), 0) / visibleTeams.length)
      : 0;
    return { total: visibleTeams.length, needCoach, unassigned, avgRoster };
  }, [teams, players, coordinatorGender]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    let result = [...teams];

    // Coordinator auto-filter
    if (coordinatorGender) result = result.filter(t => t.gender === coordinatorGender);

    if (ageFilter !== 'all') result = result.filter(t => t.ageGroup === ageFilter);
    if (genderFilter !== 'all') result = result.filter(t => t.gender === genderFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.coachName || '').toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [teams, searchQuery, ageFilter, genderFilter, coordinatorGender]);

  const handleDeleteTeam = async () => {
    if (!deleteConfirm) return;
    const res = await deleteTeam(deleteConfirm.id);
    if (res.success) showToast(`Team "${deleteConfirm.name}" deleted.`);
    else showToast(res.error, 'error');
    setDeleteConfirm(null);
    setViewTeam(null);
  };

  const getUserName = (uid) => {
    const u = allUsers.find(u => u.id === uid);
    return u ? (u.displayName || u.email) : uid;
  };

  if (loading) {
    return (
      <PageShell title="Team Management" subtitle="Loading teams..." backTo="/admin"
        breadcrumbs={[{ label: 'Home', url: '/welcome' }, { label: 'Admin', url: '/admin' }, { label: 'Team Management' }]}>
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Team Management"
      subtitle={`${stats.total} team${stats.total !== 1 ? 's' : ''}`}
      backTo="/admin"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Team Management' }
      ]}
      headerActions={
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCSVImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm transition-colors">
            <Upload size={14} /> Import
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#005028] hover:bg-[#00A651] text-white rounded-lg font-medium text-sm transition-colors">
            <Plus size={16} /> New Team
          </button>
        </div>
      }
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Teams" value={stats.total} icon={Shield} color="text-blue-400" />
        <StatCard label="Need Coach" value={stats.needCoach} icon={AlertCircle} color="text-yellow-400" />
        <StatCard label="Unassigned Players" value={stats.unassigned} icon={Users} color="text-purple-400" />
        <StatCard label="Avg Roster" value={stats.avgRoster} icon={Users} color="text-green-400" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search teams or coaches..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-white/40 focus:border-[#00A651] focus:outline-none text-sm" />
        </div>
        <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none">
          <option value="all">All Ages</option>
          {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
        </select>
        {!coordinatorGender && (
          <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none">
            <option value="all">All Genders</option>
            {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        )}
      </div>

      <p className="text-gray-400 text-xs mb-3">{filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} found</p>

      {/* Team Cards Grid */}
      {filteredTeams.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-16">No teams match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map(team => (
            <div key={team.id} className="bg-white rounded-xl border border-[#D4E4D4]/30 p-4 hover:border-[#00A651]/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-gray-800 font-bold truncate">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {team.ageGroup}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${
                      team.gender === 'girls' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                      team.gender === 'boys' ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' :
                      'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    }`}>
                      {team.gender}
                    </span>
                    {team.season && <span className="text-gray-400 text-xs">{team.season}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={14} className="text-gray-400" />
                  {team.coachId ? (
                    <span className="text-gray-700">{getUserName(team.coachId)}</span>
                  ) : (
                    <span className="text-yellow-400 text-xs">No Coach Assigned</span>
                  )}
                </div>
                {team.managerId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield size={14} className="text-gray-400" />
                    <span className="text-gray-700">{getUserName(team.managerId)}</span>
                    <span className="text-gray-400 text-xs">(Manager)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-[#005028] rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(100, ((team.playerIds?.length || 0) / 12) * 100)}%` }} />
                  </div>
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    {team.playerIds?.length || 0}/12
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#D4E4D4]/20">
                <button onClick={() => setViewTeam(team)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                  <Eye size={13} /> View
                </button>
                <button onClick={() => setEditTeam({ ...team })}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                  <Edit3 size={13} /> Edit
                </button>
                <button onClick={() => setDeleteConfirm(team)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/5 rounded-lg">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── View Team Modal ─── */}
      {viewTeam && (
        <Modal onClose={() => setViewTeam(null)} title={viewTeam.name}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <DetailItem label="Age Group" value={viewTeam.ageGroup} />
              <DetailItem label="Gender" value={viewTeam.gender} />
              <DetailItem label="Season" value={viewTeam.season || '—'} />
              <DetailItem label="Coach" value={viewTeam.coachId ? getUserName(viewTeam.coachId) : 'None'} />
              <DetailItem label="Manager" value={viewTeam.managerId ? getUserName(viewTeam.managerId) : 'None'} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-gray-800 font-medium text-sm">Roster ({viewTeam.playerIds?.length || 0})</h4>
                <button onClick={() => { setViewTeam(null); setEditTeam({ ...viewTeam }); }}
                  className="text-xs text-[#00A651] hover:text-gray-800">Manage Players</button>
              </div>
              {(!viewTeam.playerIds || viewTeam.playerIds.length === 0) ? (
                <p className="text-gray-400 text-sm">No players assigned.</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {viewTeam.playerIds.map(pid => (
                    <div key={pid} className="flex items-center justify-between bg-[#F5F9F5] rounded-lg px-3 py-2">
                      <span className="text-gray-800 text-sm">{getUserName(pid)}</span>
                      <button onClick={async () => {
                        const res = await removePlayerFromTeam(viewTeam.id, pid);
                        if (res.success) {
                          setViewTeam(prev => ({ ...prev, playerIds: prev.playerIds.filter(id => id !== pid) }));
                          showToast('Player removed.');
                        } else showToast(res.error, 'error');
                      }}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400/60 hover:text-red-400">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#D4E4D4]/30">
              <button onClick={() => { setViewTeam(null); setEditTeam({ ...viewTeam }); }}
                className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30">
                Edit Team
              </button>
              <button onClick={() => setDeleteConfirm(viewTeam)}
                className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">
                Delete Team
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Create / Edit Team Modal ─── */}
      {(showCreateModal || editTeam) && (
        <TeamFormModal
          team={editTeam}
          coaches={coaches}
          allUsers={allUsers}
          players={players}
          allTeams={teams}
          coordinatorGender={coordinatorGender}
          currentUserId={currentUser?.uid}
          onClose={() => { setShowCreateModal(false); setEditTeam(null); }}
          onSuccess={(msg) => {
            showToast(msg);
            setShowCreateModal(false);
            setEditTeam(null);
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* ─── Delete Confirmation ─── */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)} title="Delete Team" danger>
          <div className="space-y-4">
            <p className="text-gray-700 text-sm">
              Delete <strong className="text-gray-800">{deleteConfirm.name}</strong>?
            </p>
            {(deleteConfirm.playerIds?.length || 0) > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
                This team has {deleteConfirm.playerIds.length} player{deleteConfirm.playerIds.length !== 1 ? 's' : ''} assigned.
                They will become unassigned.
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={handleDeleteTeam}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── CSV Import Modal ─── */}
      {showCSVImport && (
        <CSVImportModal
          coaches={coaches}
          currentUserId={currentUser?.uid}
          coordinatorGender={coordinatorGender}
          onClose={() => setShowCSVImport(false)}
          onSuccess={(count) => {
            showToast(`${count} team${count !== 1 ? 's' : ''} imported successfully.`);
            setShowCSVImport(false);
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
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
const DetailItem = ({ label, value }) => (
  <div className="bg-[#F5F9F5] rounded-lg p-3">
    <p className="text-gray-400 text-xs mb-1">{label}</p>
    <p className="text-gray-800 font-medium text-sm">{value}</p>
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

// ─── Team Form Modal (Create + Edit) ───
const TeamFormModal = ({ team, coaches: initialCoaches, allUsers, players, allTeams, coordinatorGender, currentUserId, onClose, onSuccess, onError }) => {
  const isEdit = !!team;
  const [coaches, setLocalCoaches] = useState(initialCoaches);
  const [form, setForm] = useState({
    name: team?.name || '',
    ageGroup: team?.ageGroup || '',
    gender: coordinatorGender || team?.gender || '',
    season: team?.season || '',
    coachId: team?.coachId || '',
    managerId: team?.managerId || '',
    playerIds: team?.playerIds || [],
  });

  // Filter allUsers for team_manager role
  const managers = useMemo(() =>
    (allUsers || []).filter(u => u.role === 'team_manager' && !u.deleted),
    [allUsers]
  );
  const [saving, setSaving] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');

  // Add New Coach inline form
  const [showNewCoach, setShowNewCoach] = useState(false);
  const [newCoach, setNewCoach] = useState({ name: '', email: '', password: '' });
  const [creatingCoach, setCreatingCoach] = useState(false);
  const [coachError, setCoachError] = useState('');

  const handleCreateCoach = async () => {
    if (!newCoach.name.trim() || !newCoach.email.trim()) {
      setCoachError('Name and email are required.');
      return;
    }
    const password = newCoach.password.trim() || 'Temp1234!';
    if (password.length < 6) {
      setCoachError('Password must be at least 6 characters.');
      return;
    }
    setCreatingCoach(true);
    setCoachError('');
    let secondaryApp = null;
    try {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      };
      secondaryApp = initializeApp(config, 'CoachCreate_' + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      const result = await createUserWithEmailAndPassword(
        secondaryAuth, newCoach.email.trim().toLowerCase(), password
      );
      const profile = {
        uid: result.user.uid,
        email: newCoach.email.trim().toLowerCase(),
        displayName: newCoach.name.trim(),
        role: 'coach',
        createdAt: new Date().toISOString(),
        createdByAdmin: true,
        photoURL: null,
      };
      await setDoc(doc(db, 'users', result.user.uid), profile);
      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);
      secondaryApp = null;

      // Add to local coaches list and auto-select
      const newCoachEntry = { id: result.user.uid, ...profile };
      setLocalCoaches(prev => [...prev, newCoachEntry]);
      setForm(prev => ({ ...prev, coachId: result.user.uid }));
      setShowNewCoach(false);
      setNewCoach({ name: '', email: '', password: '' });
    } catch (err) {
      if (secondaryApp) { try { await deleteApp(secondaryApp); } catch (_) {} }
      if (err.code === 'auth/email-already-in-use') setCoachError('An account with this email already exists.');
      else if (err.code === 'auth/invalid-email') setCoachError('Invalid email address.');
      else setCoachError(err.message || 'Failed to create coach.');
    } finally {
      setCreatingCoach(false);
    }
  };

  // Add New Player inline form
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', email: '', password: '' });
  const [creatingPlayer, setCreatingPlayer] = useState(false);
  const [playerError, setPlayerError] = useState('');

  const handleCreatePlayer = async () => {
    if (!newPlayer.name.trim() || !newPlayer.email.trim()) {
      setPlayerError('Name and email are required.');
      return;
    }
    const password = newPlayer.password.trim() || 'Temp1234!';
    if (password.length < 6) {
      setPlayerError('Password must be at least 6 characters.');
      return;
    }
    setCreatingPlayer(true);
    setPlayerError('');
    let secondaryApp = null;
    try {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      };
      secondaryApp = initializeApp(config, 'PlayerCreate_' + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      const result = await createUserWithEmailAndPassword(
        secondaryAuth, newPlayer.email.trim().toLowerCase(), password
      );
      const profile = {
        uid: result.user.uid,
        email: newPlayer.email.trim().toLowerCase(),
        displayName: newPlayer.name.trim(),
        role: 'player',
        createdAt: new Date().toISOString(),
        createdByAdmin: true,
        photoURL: null,
      };
      await setDoc(doc(db, 'users', result.user.uid), profile);
      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);
      secondaryApp = null;

      // Auto-add to team roster
      setForm(prev => ({ ...prev, playerIds: [...prev.playerIds, result.user.uid] }));
      setShowNewPlayer(false);
      setNewPlayer({ name: '', email: '', password: '' });
    } catch (err) {
      if (secondaryApp) { try { await deleteApp(secondaryApp); } catch (_) {} }
      if (err.code === 'auth/email-already-in-use') setPlayerError('An account with this email already exists.');
      else if (err.code === 'auth/invalid-email') setPlayerError('Invalid email address.');
      else setPlayerError(err.message || 'Failed to create player.');
    } finally {
      setCreatingPlayer(false);
    }
  };

  const coachName = form.coachId ? (coaches.find(c => c.id === form.coachId)?.displayName || '') : '';
  const managerName = form.managerId ? (managers.find(m => m.id === form.managerId)?.displayName || '') : '';

  const assignedElsewhere = useMemo(() => {
    const map = new Map();
    allTeams.forEach(t => {
      if (t.id !== team?.id) (t.playerIds || []).forEach(pid => map.set(pid, t.name));
    });
    return map;
  }, [allTeams, team]);

  const availablePlayers = useMemo(() => {
    return players.filter(p =>
      !form.playerIds.includes(p.id) &&
      (playerSearch ? (p.displayName || p.email || '').toLowerCase().includes(playerSearch.toLowerCase()) : true)
    );
  }, [players, form.playerIds, playerSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.ageGroup || !form.gender) {
      onError('Name, age group, and gender are required.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        ageGroup: form.ageGroup,
        gender: form.gender,
        season: form.season.trim(),
        coachId: form.coachId || null,
        coachName: coachName,
        managerId: form.managerId || null,
        managerName: managerName,
        playerIds: form.playerIds,
      };

      let teamId;
      if (isEdit) {
        teamId = team.id;
        const res = await updateTeam(team.id, data);
        if (res.success) {
          // Update new coach's user doc
          if (form.coachId) {
            await updateDoc(doc(db, 'users', form.coachId), {
              assignedTeams: arrayUnion(teamId)
            });
          }
          // Remove team from old coach if coach changed
          if (team.coachId && team.coachId !== form.coachId) {
            await updateDoc(doc(db, 'users', team.coachId), {
              assignedTeams: arrayRemove(teamId)
            });
          }
          // Update new manager's user doc
          if (form.managerId) {
            await updateDoc(doc(db, 'users', form.managerId), {
              assignedTeams: arrayUnion(teamId)
            });
          }
          // Remove team from old manager if manager changed
          if (team.managerId && team.managerId !== form.managerId) {
            await updateDoc(doc(db, 'users', team.managerId), {
              assignedTeams: arrayRemove(teamId)
            });
          }
          onSuccess(`Team "${form.name}" updated.`);
        } else {
          onError(res.error);
        }
      } else {
        const res = await createTeam({ ...data, createdBy: currentUserId });
        if (res.success) {
          teamId = res.data.id;
          // Update new coach's user doc
          if (form.coachId) {
            await updateDoc(doc(db, 'users', form.coachId), {
              assignedTeams: arrayUnion(teamId)
            });
          }
          // Update new manager's user doc
          if (form.managerId) {
            await updateDoc(doc(db, 'users', form.managerId), {
              assignedTeams: arrayUnion(teamId)
            });
          }
          onSuccess(`Team "${form.name}" created.`);
        } else {
          onError(res.error);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={isEdit ? 'Edit Team' : 'Create Team'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[#00A651] text-sm font-medium mb-1.5 block">Team Name</label>
          <input type="text" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. U14 Boys Green"
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
            required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#00A651] text-sm font-medium mb-1.5 block">Age Group</label>
            <select value={form.ageGroup} onChange={e => setForm(p => ({ ...p, ageGroup: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
              required>
              <option value="">Select...</option>
              {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#00A651] text-sm font-medium mb-1.5 block">Gender</label>
            <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
              disabled={!!coordinatorGender}
              className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none disabled:opacity-50"
              required>
              <option value="">Select...</option>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#00A651] text-sm font-medium mb-1.5 block">Season</label>
            <input type="text" value={form.season}
              onChange={e => setForm(p => ({ ...p, season: e.target.value }))}
              placeholder="e.g. 2026 Winter"
              className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none" />
          </div>
          <div>
            <label className="text-[#00A651] text-sm font-medium mb-1.5 block">Coach</label>
            <select value={form.coachId} onChange={e => setForm(p => ({ ...p, coachId: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none">
              <option value="">No Coach</option>
              {coaches.map(c => <option key={c.id} value={c.id}>{c.displayName ? `${c.displayName} (${c.email})` : c.email}</option>)}
            </select>
            <button type="button" onClick={() => setShowNewCoach(!showNewCoach)}
              className="mt-1.5 text-xs text-[#00A651] hover:text-gray-800 flex items-center gap-1">
              <Plus size={12} /> Add New Coach
            </button>
            {showNewCoach && (
              <div className="mt-2 p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg space-y-2">
                <input type="text" placeholder="Full Name" value={newCoach.name}
                  onChange={e => setNewCoach(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-2.5 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-xs focus:border-[#00A651] focus:outline-none" />
                <input type="email" placeholder="Email" value={newCoach.email}
                  onChange={e => setNewCoach(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-2.5 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-xs focus:border-[#00A651] focus:outline-none" />
                <input type="text" placeholder="Password (default: Temp1234!)" value={newCoach.password}
                  onChange={e => setNewCoach(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-2.5 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-xs focus:border-[#00A651] focus:outline-none" />
                {coachError && <p className="text-red-400 text-xs">{coachError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowNewCoach(false)}
                    className="flex-1 py-1.5 text-xs bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button type="button" onClick={handleCreateCoach} disabled={creatingCoach}
                    className="flex-1 py-1.5 text-xs bg-[#005028] text-white rounded-lg font-bold hover:bg-[#00A651] disabled:opacity-50 flex items-center justify-center gap-1">
                    {creatingCoach ? <><Loader2 size={12} className="animate-spin" /> Creating...</> : 'Create Coach'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Manager */}
        <div>
          <label className="text-[#00A651] text-sm font-medium mb-1.5 block">Team Manager</label>
          <select value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}
            className="w-full px-3 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none">
            <option value="">No Manager</option>
            {managers.map(m => <option key={m.id} value={m.id}>{m.displayName ? `${m.displayName} (${m.email})` : m.email}</option>)}
          </select>
        </div>

        {/* Player Assignment */}
        <div>
          <label className="text-[#00A651] text-sm font-medium mb-1.5 block">
            Players ({form.playerIds.length})
          </label>

          {/* Selected players */}
          {form.playerIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.playerIds.map(pid => {
                const p = players.find(pl => pl.id === pid);
                return (
                  <span key={pid} className="flex items-center gap-1 px-2 py-1 bg-[#005028]/20 text-[#00A651] rounded-full text-xs">
                    {p?.displayName || p?.email || pid}
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, playerIds: prev.playerIds.filter(id => id !== pid) }))}>
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Player search + add */}
          <div className="relative">
            <input type="text" placeholder="Search players to add..."
              value={playerSearch} onChange={e => setPlayerSearch(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none" />
          </div>
          {playerSearch && availablePlayers.length > 0 && (
            <div className="mt-1 max-h-32 overflow-y-auto bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg">
              {availablePlayers.slice(0, 10).map(p => (
                <button key={p.id} type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, playerIds: [...prev.playerIds, p.id] }));
                    setPlayerSearch('');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 flex items-center gap-2">
                  <UserPlus size={12} className="text-[#00A651]" />
                  <span className="flex-1">{p.displayName || p.email}</span>
                  {assignedElsewhere.has(p.id) && (
                    <span className="text-[10px] text-[#6B7C6B] bg-[#D4E4D4]/50 px-1.5 py-0.5 rounded">
                      {assignedElsewhere.get(p.id)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setShowNewPlayer(!showNewPlayer)}
            className="mt-1.5 text-xs text-[#00A651] hover:text-gray-800 flex items-center gap-1">
            <Plus size={12} /> Add New Player
          </button>
          {showNewPlayer && (
            <div className="mt-2 p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg space-y-2">
              <input type="text" placeholder="Full Name" value={newPlayer.name}
                onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))}
                className="w-full px-2.5 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-xs focus:border-[#00A651] focus:outline-none" />
              <input type="email" placeholder="Email" value={newPlayer.email}
                onChange={e => setNewPlayer(p => ({ ...p, email: e.target.value }))}
                className="w-full px-2.5 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-xs focus:border-[#00A651] focus:outline-none" />
              <input type="text" placeholder="Password (default: Temp1234!)" value={newPlayer.password}
                onChange={e => setNewPlayer(p => ({ ...p, password: e.target.value }))}
                className="w-full px-2.5 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-xs focus:border-[#00A651] focus:outline-none" />
              {playerError && <p className="text-red-400 text-xs">{playerError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNewPlayer(false)}
                  className="flex-1 py-1.5 text-xs bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="button" onClick={handleCreatePlayer} disabled={creatingPlayer}
                  className="flex-1 py-1.5 text-xs bg-[#005028] text-white rounded-lg font-bold hover:bg-[#00A651] disabled:opacity-50 flex items-center justify-center gap-1">
                  {creatingPlayer ? <><Loader2 size={12} className="animate-spin" /> Creating...</> : 'Create Player'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
          <button type="submit" disabled={saving || !form.name || !form.ageGroup || !form.gender}
            className="flex-1 py-2.5 bg-[#005028] text-white rounded-lg text-sm font-bold hover:bg-[#00A651] disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : isEdit ? 'Update Team' : 'Create Team'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── CSV Import Modal ───
const CSVImportModal = ({ coaches, currentUserId, coordinatorGender, onClose, onSuccess, onError }) => {
  const fileRef = useRef(null);
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file);
  };

  const handlePreview = () => {
    if (!csvText.trim()) {
      onError('No CSV data.');
      return;
    }
    const result = importTeamsFromCSV(csvText, coaches);
    // If coordinator, filter valid teams to matching gender
    if (coordinatorGender) {
      result.valid = result.valid.filter(t => t.gender === coordinatorGender);
    }
    setPreview(result);
  };

  const handleImport = async () => {
    if (!preview || preview.valid.length === 0) return;
    setImporting(true);
    const res = await bulkCreateTeams(preview.valid, currentUserId);
    if (res.success) onSuccess(res.data.count);
    else onError(res.error);
    setImporting(false);
  };

  return (
    <Modal onClose={onClose} title="Import Teams from CSV">
      <div className="space-y-4">
        <div className="bg-[#F5F9F5] border border-[#D4E4D4]/50 rounded-lg p-3">
          <p className="text-gray-600 text-xs mb-1">Expected CSV format:</p>
          <code className="text-[#00A651] text-xs">team_name,age_group,gender,season,coach_email</code>
        </div>

        <div>
          <input type="file" accept=".csv,.txt" ref={fileRef} onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="w-full py-3 bg-[#F5F9F5] border-2 border-dashed border-[#D4E4D4] rounded-lg text-gray-500 text-sm hover:border-[#00A651] hover:text-gray-800 transition-colors flex items-center justify-center gap-2">
            <Upload size={16} /> Choose CSV File
          </button>
        </div>

        {csvText && !preview && (
          <button onClick={handlePreview}
            className="w-full py-2.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30">
            Preview Import
          </button>
        )}

        {preview && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                <p className="text-green-400 text-lg font-bold">{preview.valid.length}</p>
                <p className="text-green-300 text-xs">Valid</p>
              </div>
              <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                <p className="text-red-400 text-lg font-bold">{preview.errors.length}</p>
                <p className="text-red-300 text-xs">Errors</p>
              </div>
            </div>

            {preview.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {preview.errors.map((err, i) => (
                  <div key={i} className="bg-red-500/10 rounded px-2 py-1 text-xs text-red-300">
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            )}

            {preview.valid.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {preview.valid.map((t, i) => (
                  <div key={i} className="bg-green-500/10 rounded px-2 py-1 text-xs text-green-300 flex items-center gap-2">
                    <CheckCircle size={12} /> {t.name} — {t.ageGroup} {t.gender}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
          <button onClick={handleImport}
            disabled={!preview || preview.valid.length === 0 || importing}
            className="flex-1 py-2.5 bg-[#005028] text-white rounded-lg text-sm font-bold hover:bg-[#00A651] disabled:opacity-50 disabled:cursor-not-allowed">
            {importing ? 'Importing...' : `Import ${preview?.valid.length || 0} Teams`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TeamManagementPage;
