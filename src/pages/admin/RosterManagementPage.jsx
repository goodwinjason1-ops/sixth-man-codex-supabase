import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  Upload,
  Download,
  Plus,
  Search,
  Edit3,
  Trash2,
  Users,
  User,
  UserPlus,
  Mail,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Save
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import InviteParentModal from '../../components/InviteParentModal';
import { playerHQService } from '../../services/playerHQService';

const RosterManagementPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    players: rawPlayers = [],
    teams: rawTeams = [],
    addDocument,
    updateDocument,
    deleteDocument,
    loading: dataLoading
  } = useData();
  const fileInputRef = useRef(null);

  // Normalize teams — Firestore may use "teamName" or "name"
  const teams = useMemo(() =>
    rawTeams.map(t => ({
      id: t.id,
      name: t.name || t.teamName || 'Unknown Team',
      ageGroup: t.ageGroup || ''
    })),
    [rawTeams]
  );

  // Normalize players — safe defaults for all fields
  const players = useMemo(() =>
    rawPlayers.map(p => ({
      ...p,
      name: p.name || 'Unknown Player',
      teamId: p.teamId || '',
      playerNumber: p.playerNumber ?? '',
      parentEmail: p.parentEmail || '',
      parentPhone: p.parentPhone || '',
      dateOfBirth: p.dateOfBirth || '',
      medicalNotes: p.medicalNotes || '',
      emergencyContact: p.emergencyContact || '',
      emergencyPhone: p.emergencyPhone || ''
    })),
    [rawPlayers]
  );


const formatDate = (ts) => {
  if (!ts) return '-';
  if (ts.seconds) {
    return new Date(ts.seconds * 1000).toISOString().split('T')[0];
  }
  return ts;
};

// State
const [searchQuery, setSearchQuery] = useState('');
const [selectedTeam, setSelectedTeam] = useState('all');
const [showAddModal, setShowAddModal] = useState(false);
const [editingPlayer, setEditingPlayer] = useState(null);
const [showImportModal, setShowImportModal] = useState(false);
const [importData, setImportData] = useState(null);
const [importErrors, setImportErrors] = useState([]);
const [importSuccess, setImportSuccess] = useState(null);
const [confirmDelete, setConfirmDelete] = useState(null);
const [invitePlayer, setInvitePlayer] = useState(null);

const filteredPlayers = useMemo(() => {
  let result = players;

  // Team Manager only sees their assigned team(s)
  if (currentUser?.role === 'team_manager' && currentUser.assignedTeams) {
    result = result.filter(p => currentUser.assignedTeams.includes(p.teamId));
  } 
  else if (selectedTeam !== 'all') {
    result = result.filter(p => p.teamId === selectedTeam);
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.parentEmail.toLowerCase().includes(query) ||
      String(p.playerNumber).includes(query)
    );
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}, [players, selectedTeam, searchQuery, currentUser]);

  // Group players by team
  const playersByTeam = useMemo(() => {
    const grouped = {};
    teams.forEach(team => {
      grouped[team.id] = players.filter(p => p.teamId === team.id);
    });
    return grouped;
  }, [players, teams]);

  // Handle CSV upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await playerHQService.importFromCSV(text, 'players');

      if (result.data.length > 0) {
        setImportData(result.data);
        setImportErrors(result.errors);
        setShowImportModal(true);
      } else {
        setImportErrors(['No valid data found in CSV']);
      }
    } catch (error) {
      setImportErrors([error.message]);
    }

    event.target.value = '';
  };

  // Confirm import — always writes to Firestore
  const confirmImport = async () => {
    if (!importData) return;

    const newPlayers = importData.map((row) => ({
      name: row.player_name || row.name || '',
      dateOfBirth: row.date_of_birth || row.dob || '',
      teamId: teams.find(t =>
        t.name.toLowerCase().includes((row.team || '').toLowerCase())
      )?.id || '',
      ageGroup: row.age_group || '',
      playerNumber: parseInt(row.player_number || row.number) || 0,
      parentEmail: row.parent_email || row.email || '',
      parentPhone: row.parent_phone || row.phone || '',
      medicalNotes: row.medical_notes || '',
      emergencyContact: row.emergency_contact_name || '',
      emergencyPhone: row.emergency_contact_phone || '',
      active: true
    }));

    try {
      for (const player of newPlayers) {
        await addDocument('players', player);
      }
      setImportSuccess(`Successfully imported ${newPlayers.length} players`);
    } catch (error) {
      console.error('Error importing players:', error);
      setImportSuccess('Import partially completed. Check console for errors.');
    }

    setShowImportModal(false);
    setImportData(null);
    setImportErrors([]);
    setTimeout(() => setImportSuccess(null), 5000);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = playerHQService.getCSVTemplate('players');
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'player_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export current roster
  const exportRoster = () => {
    const playersToExport = selectedTeam === 'all'
      ? players
      : players.filter(p => p.teamId === selectedTeam);

    const csv = playerHQService.exportToCSV(playersToExport, [
      { key: 'name', label: 'Player Name' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'ageGroup', label: 'Age Group' },
      { key: 'playerNumber', label: 'Player Number' },
      { key: 'parentEmail', label: 'Parent Email' },
      { key: 'parentPhone', label: 'Parent Phone' },
      { key: 'medicalNotes', label: 'Medical Notes' }
    ]);

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

// Save player (add or edit) — always writes to Firestore + forces the list to refresh
const savePlayer = async (playerData) => {
  try {
    if (editingPlayer) {
      await updateDocument('players', editingPlayer.id, playerData);
    } else {
      await addDocument('players', { ...playerData, active: true });
    }
    
    // Force the list to refresh and show the new player
    setTimeout(() => {
      setSelectedTeam('all');
      setSearchQuery('');
    }, 500);

  } catch (error) {
    console.error('Error saving player:', error);
  }
  
  setShowAddModal(false);
  setEditingPlayer(null);
};

  // Delete player — always deletes from Firestore
  const handleDelete = async (playerId) => {
    try {
      await deleteDocument('players', playerId);
    } catch (error) {
      console.error('Error deleting player:', error);
    }
    setConfirmDelete(null);
  };

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get team name for a player
  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || '-';
  };

  const getTeamAgeGroup = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team?.ageGroup || '';
  };

  if (dataLoading) {
    return (
      <PageShell
        title="Roster Management"
        subtitle="Loading..."
        backTo="/welcome"
        breadcrumbs={[
          { label: 'Home', url: '/welcome' },
          { label: 'Roster Management' }
        ]}
        maxWidth="6xl"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-800 font-medium">Loading roster...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Roster Management"
      subtitle={
        players.length > 0
          ? `${players.length} player${players.length !== 1 ? 's' : ''} across ${teams.length} team${teams.length !== 1 ? 's' : ''}`
          : 'Manage your team roster'
      }
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Roster Management' }
      ]}
      maxWidth="6xl"
      headerActions={
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg hover:border-[#00A651] transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Template</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg hover:border-[#00A651] transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={exportRoster}
            className="flex items-center gap-2 px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg hover:border-[#00A651] transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => {
              setEditingPlayer(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#005028] text-white rounded-lg font-semibold hover:bg-[#00A651] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Player
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Success Message */}
        {importSuccess && (
          <div className="bg-[#005028]/20 border border-[#00A651] rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
            <p className="text-[#00A651]">{importSuccess}</p>
          </div>
        )}

        {/* Team Summary Cards */}
        {teams.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(selectedTeam === team.id ? 'all' : team.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedTeam === team.id
                    ? 'bg-[#005028]/20 border-[#00A651]'
                    : 'bg-white border-[#D4E4D4] hover:border-[#00A651]'
                }`}
              >
                <p className="text-[#6B7C6B] text-xs">{team.ageGroup}</p>
                <p className="text-gray-800 font-semibold truncate">{team.name}</p>
                <p className="text-[#00A651] text-sm">{playersByTeam[team.id]?.length || 0} players</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-[#D4E4D4] rounded-2xl p-6 text-center">
            <Users className="w-10 h-10 text-[#6B7C6B] mx-auto mb-2" />
            <p className="text-gray-800 font-medium mb-1">No Teams Set Up</p>
            <p className="text-[#6B7C6B] text-sm">Teams need to be created before players can be assigned.</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Search players by name, email, or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7C6B] hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Players List */}
        {players.length === 0 ? (
          /* No players at all — friendly empty state */
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-10 text-center">
            <div className="w-16 h-16 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#6B7C6B]" />
            </div>
            <h3 className="text-gray-800 font-semibold text-lg mb-2">No Players Yet</h3>
            <p className="text-[#6B7C6B] text-sm mb-6 max-w-md mx-auto">
              No players have been added to the roster yet. You can add players manually
              or import them from a CSV file.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setEditingPlayer(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#005028] text-white rounded-lg font-medium hover:bg-[#00A651] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Player
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg font-medium hover:border-[#00A651] transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>
            </div>
          </div>
        ) : filteredPlayers.length === 0 ? (
          /* Has players but filters/search returned nothing */
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-2">No Players Found</h3>
            <p className="text-[#6B7C6B] text-sm">
              {searchQuery
                ? 'No players match your search. Try a different term.'
                : 'No players in the selected team.'}
            </p>
            {(searchQuery || selectedTeam !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedTeam('all'); }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg text-sm hover:border-[#00A651] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 bg-[#F5F9F5] border-b border-[#D4E4D4] text-[#00A651] text-sm font-medium">
              <div className="col-span-2">Player</div>
              <div>Team</div>
              <div>Age</div>
              <div>Number</div>
              <div>Contact</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Player Rows */}
            <div className="divide-y divide-[#D4E4D4]">
              {filteredPlayers.map(player => (
                <div
                  key={player.id}
                  className="p-4 hover:bg-[#F5F9F5]/50 transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[#00A651]" />
                        </div>
                        <div>
                          <p className="text-gray-800 font-semibold">{player.name}</p>
                          <p className="text-[#6B7C6B] text-sm">
                            {player.playerNumber ? `#${player.playerNumber} \u2022 ` : ''}{getTeamName(player.teamId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setInvitePlayer(player)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                          title="Invite Parent"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPlayer(player);
                            setShowAddModal(true);
                          }}
                          className="p-2 text-[#00A651] hover:bg-[#00A651]/20 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(player.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#6B7C6B]">
                      <span>Age: {formatDate(player.dateOfBirth)}</span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {player.parentEmail || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-7 gap-4 items-center">
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#00A651]" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-semibold">{player.name}</p>
                        <p className="text-[#6B7C6B] text-xs">{formatDate(player.dateOfBirth)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-800 text-sm">{getTeamName(player.teamId)}</p>
                      <p className="text-[#6B7C6B] text-xs">{getTeamAgeGroup(player.teamId)}</p>
                    </div>
                    <div className="text-gray-800">{formatDate(player.dateOfBirth)}</div>
                    <div>
                      {player.playerNumber ? (
                        <span className="px-2 py-1 bg-[#005028]/20 text-[#00A651] rounded-lg text-sm font-medium">
                          #{player.playerNumber}
                        </span>
                      ) : (
                        <span className="text-[#6B7C6B] text-sm">-</span>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-800 text-sm truncate">{player.parentEmail || '-'}</p>
                      <p className="text-[#6B7C6B] text-xs">{player.parentPhone || '-'}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setInvitePlayer(player)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Invite Parent"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPlayer(player);
                          setShowAddModal(true);
                        }}
                        className="p-2 text-[#00A651] hover:bg-[#00A651]/20 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(player.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#D4E4D4]">
        <p className="text-[#6B7C6B] text-xs">Emerald Lakers Roster Management</p>
      </footer>

      {/* Add/Edit Player Modal */}
      {showAddModal && (
        <PlayerFormModal
          player={editingPlayer}
          teams={teams}
          onSave={savePlayer}
          onClose={() => {
            setShowAddModal(false);
            setEditingPlayer(null);
          }}
        />
      )}

      {/* Import Preview Modal */}
      {showImportModal && (
        <ImportPreviewModal
          data={importData}
          errors={importErrors}
          onConfirm={confirmImport}
          onClose={() => {
            setShowImportModal(false);
            setImportData(null);
            setImportErrors([]);
          }}
        />
      )}

      {/* Invite Parent Modal */}
      {invitePlayer && (
        <InviteParentModal
          player={invitePlayer}
          onClose={() => setInvitePlayer(null)}
          onSuccess={() => {}}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white border-2 border-red-500 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Player?</h3>
              <p className="text-[#6B7C6B] text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

// Player Form Modal Component
const PlayerFormModal = ({ player, teams, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    dateOfBirth: player?.dateOfBirth || '',
    teamId: player?.teamId || '',
    playerNumber: player?.playerNumber || '',
    parentEmail: player?.parentEmail || '',
    parentPhone: player?.parentPhone || '',
    medicalNotes: player?.medicalNotes || '',
    emergencyContact: player?.emergencyContact || '',
    emergencyPhone: player?.emergencyPhone || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const team = teams.find(t => t.id === formData.teamId);
    onSave({
      ...formData,
      ageGroup: team?.ageGroup || '',
      playerNumber: parseInt(formData.playerNumber) || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] bg-white border-2 border-[#D4E4D4] rounded-t-3xl sm:rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#D4E4D4] flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{player ? 'Edit Player' : 'Add Player'}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651]">
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-1">Player Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-1">Player Number *</label>
              <input
                type="number"
                required
                min="0"
                max="99"
                value={formData.playerNumber}
                onChange={(e) => setFormData({ ...formData, playerNumber: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-1">Team *</label>
            <select
              required
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
            >
              <option value="">Select Team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}{team.ageGroup ? ` (${team.ageGroup})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-1">Parent Email</label>
              <input
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-1">Parent Phone</label>
              <input
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-1">Medical Notes</label>
            <textarea
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none resize-none"
              placeholder="Allergies, conditions, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-1">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-1">Emergency Phone</label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
              />
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-[#D4E4D4]">
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-[#005028] text-white rounded-xl font-semibold hover:bg-[#00A651] transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {player ? 'Save Changes' : 'Add Player'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Import Preview Modal
const ImportPreviewModal = ({ data, errors, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white border-2 border-[#D4E4D4] rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#D4E4D4] flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Import Preview</h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651]">
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 font-medium mb-2">Import Warnings:</p>
              <ul className="text-red-300 text-sm space-y-1">
                {errors.map((err, i) => <li key={i}>&bull; {err}</li>)}
              </ul>
            </div>
          )}

          <p className="text-[#00A651] mb-3">{data?.length || 0} players ready to import:</p>

          <div className="space-y-2">
            {data?.slice(0, 10).map((row, index) => (
              <div key={index} className="p-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg">
                <p className="text-gray-800 font-medium">{row.player_name || row.name || 'Unknown'}</p>
                <p className="text-[#6B7C6B] text-sm">
                  {row.team || '-'} &bull; #{row.player_number || row.number || '-'}
                </p>
              </div>
            ))}
            {data?.length > 10 && (
              <p className="text-[#6B7C6B] text-center text-sm">...and {data.length - 10} more</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#D4E4D4] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#005028] text-white rounded-xl font-semibold"
          >
            Import {data?.length} Players
          </button>
        </div>
      </div>
    </div>
  );
};

export default RosterManagementPage;