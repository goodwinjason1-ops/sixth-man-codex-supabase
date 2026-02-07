import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Users,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Save
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import { playerHQService } from '../../services/playerHQService';

// Sample teams
const sampleTeams = [
  { id: 't1', name: 'U14 Lakers', ageGroup: 'U14' },
  { id: 't2', name: 'U12 Emerald', ageGroup: 'U12' },
  { id: 't3', name: 'U10 Dragons', ageGroup: 'U10' },
  { id: 't4', name: 'U8 Cubs', ageGroup: 'U8' }
];

// Sample players data
const samplePlayers = [
  { id: 'p1', name: 'Emma Wilson', dateOfBirth: '2012-03-15', teamId: 't1', ageGroup: 'U14', playerNumber: 7, parentEmail: 'wilson@email.com', parentPhone: '0412345678', active: true },
  { id: 'p2', name: 'Liam Johnson', dateOfBirth: '2014-07-22', teamId: 't2', ageGroup: 'U12', playerNumber: 12, parentEmail: 'johnson@email.com', parentPhone: '0423456789', active: true },
  { id: 'p3', name: 'Sophia Garcia', dateOfBirth: '2014-01-08', teamId: 't2', ageGroup: 'U12', playerNumber: 23, parentEmail: 'garcia@email.com', parentPhone: '0434567890', active: true },
  { id: 'p4', name: 'Noah Davis', dateOfBirth: '2012-11-30', teamId: 't1', ageGroup: 'U14', playerNumber: 5, parentEmail: 'davis@email.com', parentPhone: '0445678901', active: true },
  { id: 'p5', name: 'Olivia Martinez', dateOfBirth: '2011-06-12', teamId: 't1', ageGroup: 'U14', playerNumber: 11, parentEmail: 'martinez@email.com', parentPhone: '0456789012', active: true },
  { id: 'p6', name: 'Ethan Brown', dateOfBirth: '2014-09-25', teamId: 't2', ageGroup: 'U12', playerNumber: 8, parentEmail: 'brown@email.com', parentPhone: '0467890123', active: true },
  { id: 'p7', name: 'Ava Thompson', dateOfBirth: '2012-04-18', teamId: 't1', ageGroup: 'U14', playerNumber: 15, parentEmail: 'thompson@email.com', parentPhone: '0478901234', active: true },
  { id: 'p8', name: 'Mason Lee', dateOfBirth: '2016-02-28', teamId: 't3', ageGroup: 'U10', playerNumber: 3, parentEmail: 'lee@email.com', parentPhone: '0489012345', active: true }
];

const RosterManagementPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addDocument, updateDocument, deleteDocument } = useData();
  const fileInputRef = useRef(null);

  // State
  const [players, setPlayers] = useState(samplePlayers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Filter players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (selectedTeam !== 'all') {
      result = result.filter(p => p.teamId === selectedTeam);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.parentEmail?.toLowerCase().includes(query) ||
        p.playerNumber?.toString().includes(query)
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [players, selectedTeam, searchQuery]);

  // Group players by team
  const playersByTeam = useMemo(() => {
    const grouped = {};
    sampleTeams.forEach(team => {
      grouped[team.id] = players.filter(p => p.teamId === team.id);
    });
    return grouped;
  }, [players]);

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

    // Reset file input
    event.target.value = '';
  };

  // Confirm import
  const confirmImport = () => {
    if (!importData) return;

    const newPlayers = importData.map((row, index) => ({
      id: `imported_${Date.now()}_${index}`,
      name: row.player_name || row.name || '',
      dateOfBirth: row.date_of_birth || row.dob || '',
      teamId: sampleTeams.find(t => t.name.toLowerCase().includes((row.team || '').toLowerCase()))?.id || '',
      ageGroup: row.age_group || '',
      playerNumber: parseInt(row.player_number || row.number) || 0,
      parentEmail: row.parent_email || row.email || '',
      parentPhone: row.parent_phone || row.phone || '',
      medicalNotes: row.medical_notes || '',
      emergencyContact: row.emergency_contact_name || '',
      emergencyPhone: row.emergency_contact_phone || '',
      active: true
    }));

    setPlayers([...players, ...newPlayers]);
    setImportSuccess(`Successfully imported ${newPlayers.length} players`);
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
    const playersToExport = selectedTeam === 'all' ? players : players.filter(p => p.teamId === selectedTeam);
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

  // Save player (add or edit)
  const savePlayer = (playerData) => {
    if (editingPlayer) {
      setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, ...playerData } : p));
    } else {
      const newPlayer = {
        id: `player_${Date.now()}`,
        ...playerData,
        active: true
      };
      setPlayers([...players, newPlayer]);
    }
    setShowAddModal(false);
    setEditingPlayer(null);
  };

  // Delete player
  const handleDelete = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
    setConfirmDelete(null);
  };

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <PageShell
      title="Roster Management"
      subtitle={`${players.length} players across ${sampleTeams.length} teams`}
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
            className="flex items-center gap-2 px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg hover:border-[#22c55e] transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Template</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg hover:border-[#22c55e] transition-colors"
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
            className="flex items-center gap-2 px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg hover:border-[#22c55e] transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => {
              setEditingPlayer(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-[#0a3d2e] rounded-lg font-semibold hover:bg-[#4ade80] transition-colors"
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
          <div className="bg-[#22c55e]/20 border border-[#22c55e] rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
            <p className="text-[#4ade80]">{importSuccess}</p>
          </div>
        )}

        {/* Team Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sampleTeams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(selectedTeam === team.id ? 'all' : team.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTeam === team.id
                  ? 'bg-[#22c55e]/20 border-[#22c55e]'
                  : 'bg-[#0d5943] border-[#1a8a68] hover:border-[#22c55e]'
              }`}
            >
              <p className="text-[#1a8a68] text-xs">{team.ageGroup}</p>
              <p className="text-white font-semibold truncate">{team.name}</p>
              <p className="text-[#4ade80] text-sm">{playersByTeam[team.id]?.length || 0} players</p>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a8a68]" />
            <input
              type="text"
              placeholder="Search players by name, email, or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#1a8a68] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Players List */}
        {filteredPlayers.length === 0 ? (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">No Players Found</h3>
            <p className="text-[#1a8a68] text-sm">
              {searchQuery ? 'Try a different search term' : 'Add players to get started'}
            </p>
          </div>
        ) : (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 bg-[#0a3d2e] border-b border-[#1a8a68] text-[#4ade80] text-sm font-medium">
              <div className="col-span-2">Player</div>
              <div>Team</div>
              <div>Age</div>
              <div>Number</div>
              <div>Contact</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Player Rows */}
            <div className="divide-y divide-[#1a8a68]">
              {filteredPlayers.map(player => {
                const team = sampleTeams.find(t => t.id === player.teamId);
                return (
                  <div
                    key={player.id}
                    className="p-4 hover:bg-[#0a3d2e]/50 transition-colors"
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-[#4ade80]" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{player.name}</p>
                            <p className="text-[#1a8a68] text-sm">#{player.playerNumber} • {team?.name}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingPlayer(player);
                              setShowAddModal(true);
                            }}
                            className="p-2 text-[#4ade80] hover:bg-[#22c55e]/20 rounded-lg"
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
                      <div className="flex items-center gap-4 text-sm text-[#1a8a68]">
                        <span>Age: {calculateAge(player.dateOfBirth)}</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {player.parentEmail || '-'}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-7 gap-4 items-center">
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[#4ade80]" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{player.name}</p>
                          <p className="text-[#1a8a68] text-xs">{player.dateOfBirth}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-white text-sm">{team?.name || '-'}</p>
                        <p className="text-[#1a8a68] text-xs">{team?.ageGroup}</p>
                      </div>
                      <div className="text-white">{calculateAge(player.dateOfBirth)}</div>
                      <div>
                        <span className="px-2 py-1 bg-[#22c55e]/20 text-[#4ade80] rounded-lg text-sm font-medium">
                          #{player.playerNumber}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm truncate">{player.parentEmail || '-'}</p>
                        <p className="text-[#1a8a68] text-xs">{player.parentPhone || '-'}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingPlayer(player);
                            setShowAddModal(true);
                          }}
                          className="p-2 text-[#4ade80] hover:bg-[#22c55e]/20 rounded-lg transition-colors"
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
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#1a8a68]">
        <p className="text-[#1a8a68] text-xs">Emerald Lakers Roster Management</p>
      </footer>

      {/* Add/Edit Player Modal */}
      {showAddModal && (
        <PlayerFormModal
          player={editingPlayer}
          teams={sampleTeams}
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

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#0d5943] border-2 border-red-500 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Delete Player?</h3>
              <p className="text-[#1a8a68] text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-xl"
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
        className="relative w-full sm:max-w-lg max-h-[90vh] bg-[#0d5943] border-2 border-[#1a8a68] rounded-t-3xl sm:rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#1a8a68] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{player ? 'Edit Player' : 'Add Player'}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center hover:border-[#22c55e]">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div>
            <label className="block text-[#4ade80] text-sm font-medium mb-1">Player Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#4ade80] text-sm font-medium mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#4ade80] text-sm font-medium mb-1">Player Number *</label>
              <input
                type="number"
                required
                min="0"
                max="99"
                value={formData.playerNumber}
                onChange={(e) => setFormData({ ...formData, playerNumber: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#4ade80] text-sm font-medium mb-1">Team *</label>
            <select
              required
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
            >
              <option value="">Select Team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name} ({team.ageGroup})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#4ade80] text-sm font-medium mb-1">Parent Email</label>
              <input
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#4ade80] text-sm font-medium mb-1">Parent Phone</label>
              <input
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#4ade80] text-sm font-medium mb-1">Medical Notes</label>
            <textarea
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none resize-none"
              placeholder="Allergies, conditions, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#4ade80] text-sm font-medium mb-1">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-[#4ade80] text-sm font-medium mb-1">Emergency Phone</label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              />
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-[#1a8a68]">
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full py-3 bg-[#22c55e] text-[#0a3d2e] rounded-xl font-semibold hover:bg-[#4ade80] transition-colors flex items-center justify-center gap-2"
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
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#1a8a68] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Import Preview</h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center hover:border-[#22c55e]">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 font-medium mb-2">Import Warnings:</p>
              <ul className="text-red-300 text-sm space-y-1">
                {errors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          )}

          <p className="text-[#4ade80] mb-3">{data?.length || 0} players ready to import:</p>

          <div className="space-y-2">
            {data?.slice(0, 10).map((row, index) => (
              <div key={index} className="p-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg">
                <p className="text-white font-medium">{row.player_name || row.name || 'Unknown'}</p>
                <p className="text-[#1a8a68] text-sm">
                  {row.team || '-'} • #{row.player_number || row.number || '-'}
                </p>
              </div>
            ))}
            {data?.length > 10 && (
              <p className="text-[#1a8a68] text-center text-sm">...and {data.length - 10} more</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#1a8a68] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#22c55e] text-[#0a3d2e] rounded-xl font-semibold"
          >
            Import {data?.length} Players
          </button>
        </div>
      </div>
    </div>
  );
};

export default RosterManagementPage;
