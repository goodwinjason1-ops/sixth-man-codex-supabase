import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Upload,
  Download,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Home,
  Plane,
  Loader2
} from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { playerHQService } from '../../services/playerHQService';
import { formatDateAU, formatTimeStringAU, formatDateForStorage } from '../../utils/dateUtils';

/**
 * Convert Firestore Timestamp or string to JavaScript Date
 * Handles: Firestore Timestamp, ISO string, YYYY-MM-DD string, or Date object
 */
const toJsDate = (dateValue) => {
  if (!dateValue) return null;

  // Already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  // Firestore Timestamp (has toDate method)
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // Firestore Timestamp with seconds (from JSON)
  if (dateValue.seconds !== undefined) {
    return new Date(dateValue.seconds * 1000);
  }

  // String date
  if (typeof dateValue === 'string') {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

/**
 * Convert date to YYYY-MM-DD string for comparison
 */
const toDateString = (dateValue) => {
  const d = toJsDate(dateValue);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Sample teams - IDs must match NotificationsPage sample data format for consistency
const sampleTeams = [
  { id: 'lakers-u8', name: 'Lakers U8', ageGroup: 'U8' },
  { id: 'lakers-u10', name: 'Lakers U10', ageGroup: 'U10' },
  { id: 'lakers-u12', name: 'Lakers U12', ageGroup: 'U12' },
  { id: 'lakers-u14', name: 'Lakers U14', ageGroup: 'U14' },
  { id: 'lakers-u16', name: 'Lakers U16', ageGroup: 'U16' },
  { id: 'lakers-u19', name: 'Lakers U19', ageGroup: 'U19' }
];

// Helper to get next Saturday
const getNextSaturday = (weeksFromNow) => {
  const today = new Date();
  const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
  const nextSat = new Date(today);
  nextSat.setDate(today.getDate() + daysUntilSat + (weeksFromNow * 7));
  return nextSat.toISOString().split('T')[0];
};

// Sample games data - using consistent teamId format and 12-hour time
const sampleGames = [
  { id: 'g1', teamId: 'lakers-u12', teamName: 'Lakers U12', opponent: 'Hills Hawks', date: getNextSaturday(0), time: '9:00 AM', venue: 'Emerald Indoor Courts', homeAway: 'home', result: null },
  { id: 'g2', teamId: 'lakers-u14', teamName: 'Lakers U14', opponent: 'North Stars', date: getNextSaturday(0), time: '11:00 AM', venue: 'Emerald Indoor Courts', homeAway: 'home', result: null },
  { id: 'g3', teamId: 'lakers-u10', teamName: 'Lakers U10', opponent: 'Western Warriors', date: getNextSaturday(1), time: '10:00 AM', venue: 'Sports Centre', homeAway: 'home', result: null },
  { id: 'g4', teamId: 'lakers-u8', teamName: 'Lakers U8', opponent: 'South Side', date: getNextSaturday(1), time: '2:00 PM', venue: 'Emerald Indoor Courts', homeAway: 'home', result: null },
  { id: 'g5', teamId: 'lakers-u16', teamName: 'Lakers U16', opponent: 'Eastern Eagles', date: getNextSaturday(2), time: '9:00 AM', venue: 'Sports Centre', homeAway: 'away', result: null },
  { id: 'g6', teamId: 'lakers-u12', teamName: 'Lakers U12', opponent: 'Northern Stars', date: getNextSaturday(2), time: '11:00 AM', venue: 'Sports Centre', homeAway: 'home', result: null },
  { id: 'g7', teamId: 'lakers-u14', teamName: 'Lakers U14', opponent: 'Western Warriors', date: getNextSaturday(3), time: '9:00 AM', venue: 'Emerald Indoor Courts', homeAway: 'away', result: null }
];

const ScheduleManagementPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { games: contextGames } = useData();

  // State
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // list or calendar
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Default to current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, completed

  // Load games from Firestore or use sample data
  useEffect(() => {
    if (contextGames && contextGames.length > 0) {
      console.log('[Schedule] Loaded', contextGames.length, 'games from Firestore');

      // Log first game's date for debugging
      const firstGame = contextGames[0];
      console.log('[Schedule] First game date raw:', firstGame?.date);
      const firstDate = toJsDate(firstGame?.date);
      console.log('[Schedule] First game date converted:', firstDate);

      setGames(contextGames);
      setIsLoading(false);

      // Auto-navigate calendar to first game's month
      if (firstDate) {
        setCurrentMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
        console.log('[Schedule] Set calendar to:', firstDate.getFullYear(), firstDate.getMonth() + 1);
      }
    } else {
      console.log('[Schedule] No Firestore games, using sample data');
      // Use sample data if no Firestore games
      setGames(sampleGames);
      setIsLoading(false);
    }
  }, [contextGames]);

  // Filter games
  const filteredGames = useMemo(() => {
    let result = [...games];

    if (selectedTeam !== 'all') {
      result = result.filter(g => g.teamId === selectedTeam);
    }

    if (filterStatus === 'upcoming') {
      result = result.filter(g => !g.result);
    } else if (filterStatus === 'completed') {
      result = result.filter(g => g.result);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.opponent?.toLowerCase().includes(query) ||
        g.venue?.toLowerCase().includes(query) ||
        g.teamName?.toLowerCase().includes(query)
      );
    }

    // Sort by date using proper conversion
    return result.sort((a, b) => {
      const dateA = toJsDate(a.date);
      const dateB = toJsDate(b.date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  }, [games, selectedTeam, searchQuery, filterStatus]);

  // Get games for calendar view
  const calendarGames = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const matchingGames = filteredGames.filter(g => {
      const gameDate = toJsDate(g.date);
      if (!gameDate) {
        return false;
      }
      return gameDate.getFullYear() === year && gameDate.getMonth() === month;
    });

    console.log('[Calendar] Found', matchingGames.length, 'games for', year, month + 1);
    return matchingGames;
  }, [filteredGames, currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    // Padding days from previous month
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, games: [] });
    }

    // Days of current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      // Compare using converted date strings (handles Timestamps)
      const dayGames = calendarGames.filter(g => toDateString(g.date) === dateStr);
      days.push({ date: d, dateStr, games: dayGames });
    }

    return days;
  }, [currentMonth, calendarGames]);

  // Handle CSV upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await playerHQService.importFromCSV(text, 'games');

      if (result.data.length > 0) {
        const newGames = result.data.map((row, index) => ({
          id: `imported_${Date.now()}_${index}`,
          teamId: sampleTeams.find(t => t.name.toLowerCase().includes((row.team || '').toLowerCase()))?.id || '',
          teamName: row.team || '',
          opponent: row.opponent || '',
          date: row.date || '',
          time: row.time || '',
          venue: row.venue || '',
          homeAway: (row.home_away || row.homeaway || '').toLowerCase() === 'home' ? 'home' : 'away',
          playerHQGameId: row.playerhq_game_id || '',
          result: null
        }));

        setGames([...games, ...newGames]);
        setImportSuccess(`Successfully imported ${newGames.length} games`);
        setTimeout(() => setImportSuccess(null), 5000);
      }
    } catch (error) {
      console.error('Import error:', error);
    }

    event.target.value = '';
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = playerHQService.getCSVTemplate('games');
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game_schedule_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export schedule
  const exportSchedule = () => {
    const csv = playerHQService.exportToCSV(filteredGames, [
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time' },
      { key: 'teamName', label: 'Team' },
      { key: 'opponent', label: 'Opponent' },
      { key: 'venue', label: 'Venue' },
      { key: 'homeAway', label: 'Home/Away' },
      { key: 'result', label: 'Result' }
    ]);

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save game to Firestore
  const saveGame = async (gameData) => {
    setIsSaving(true);
    try {
      const team = sampleTeams.find(t => t.id === gameData.teamId);

      // Validate date is in the future
      const gameDate = new Date(gameData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (gameDate < today) {
        console.warn('Warning: Creating game with past date:', gameData.date);
      }

      const gameDoc = {
        ...gameData,
        teamName: team?.name || gameData.teamName || '',
        type: 'game',
        status: 'scheduled',
        result: gameData.result || null,
        createdAt: editingGame ? (editingGame.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingGame) {
        // Update existing game in Firestore
        const gameRef = doc(db, 'games', editingGame.id);
        await setDoc(gameRef, gameDoc, { merge: true });
        setGames(games.map(g => g.id === editingGame.id ? { ...g, ...gameDoc } : g));
      } else {
        // Create new game in Firestore
        const gameRef = doc(collection(db, 'games'));
        const newGame = {
          id: gameRef.id,
          ...gameDoc
        };
        await setDoc(gameRef, newGame);
        setGames([...games, newGame]);
      }

      setShowAddModal(false);
      setEditingGame(null);
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Failed to save game. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete game from Firestore
  const handleDelete = async (gameId) => {
    try {
      // Delete from Firestore if it exists there
      if (!gameId.startsWith('g')) {
        // Only delete from Firestore if it's not a sample data ID
        const gameRef = doc(db, 'games', gameId);
        await deleteDoc(gameRef);
      }
      setGames(games.filter(g => g.id !== gameId));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game. Please try again.');
    }
  };

  // Format date (handles Firestore Timestamps, strings, Date objects)
  const formatDate = (dateValue) => {
    const jsDate = toJsDate(dateValue);
    if (!jsDate) {
      console.warn('[formatDate] Invalid date:', typeof dateValue, dateValue);
      return 'No date';
    }

    return jsDate.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Navigate calendar
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Header */}
      <div className="bg-[#0d5943] border-b border-[#1a8a68]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Admin Dashboard', url: '/admin' },
              { label: 'Schedule Management' }
            ]}
            className="mb-4"
          />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#0a3d2e] border-2 border-[#1a8a68] rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-[#4ade80]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Schedule Management</h1>
                <p className="text-[#4ade80] text-sm">
                  {games.filter(g => !g.result).length} upcoming • {games.filter(g => g.result).length} completed
                </p>
              </div>
            </div>

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
                <span className="hidden sm:inline">Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={exportSchedule}
                className="flex items-center gap-2 px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-lg hover:border-[#22c55e] transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => {
                  setEditingGame(null);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] text-[#0a3d2e] rounded-lg font-semibold hover:bg-[#4ade80] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Game
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        {importSuccess && (
          <div className="bg-[#22c55e]/20 border border-[#22c55e] rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
            <p className="text-[#4ade80]">{importSuccess}</p>
          </div>
        )}

        {/* View Toggle & Filters */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            {/* View Toggle */}
            <div className="flex bg-[#0a3d2e] rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list' ? 'bg-[#22c55e] text-[#0a3d2e]' : 'text-white'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'calendar' ? 'bg-[#22c55e] text-[#0a3d2e]' : 'text-white'
                }`}
              >
                Calendar
              </button>
            </div>

            {/* Team Filter */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
            >
              <option value="all">All Teams</option>
              {sampleTeams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a8a68]" />
            <input
              type="text"
              placeholder="Search by opponent or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 mt-3">
            {['all', 'upcoming', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-[#22c55e] text-[#0a3d2e]'
                    : 'bg-[#0a3d2e] border border-[#1a8a68] text-white hover:border-[#22c55e]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1a8a68]">
              <button onClick={prevMonth} className="p-2 hover:bg-[#0a3d2e] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h3 className="text-xl font-bold text-white">
                {currentMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-[#0a3d2e] rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-[#4ade80] text-sm font-medium border-b border-[#1a8a68]">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border-b border-r border-[#1a8a68] ${
                    day.date ? 'bg-[#0a3d2e]/30' : 'bg-[#0a3d2e]/10'
                  }`}
                >
                  {day.date && (
                    <>
                      <p className="text-white text-sm mb-1">{day.date}</p>
                      {day.games.slice(0, 2).map(game => (
                        <button
                          key={game.id}
                          onClick={() => {
                            setEditingGame(game);
                            setShowAddModal(true);
                          }}
                          className={`w-full text-left text-xs p-1 rounded mb-1 truncate ${
                            game.homeAway === 'home'
                              ? 'bg-[#22c55e]/30 text-[#4ade80]'
                              : 'bg-blue-500/30 text-blue-300'
                          }`}
                        >
                          {game.time} vs {game.opponent}
                        </button>
                      ))}
                      {day.games.length > 2 && (
                        <p className="text-[#1a8a68] text-xs">+{day.games.length - 2} more</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {filteredGames.length === 0 ? (
              <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">No Games Found</h3>
                <p className="text-[#1a8a68] text-sm">
                  {searchQuery ? 'Try a different search term' : 'Add games to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGames.map(game => (
                  <div
                    key={game.id}
                    className={`bg-[#0d5943] border-2 rounded-2xl p-4 transition-colors ${
                      game.result ? 'border-[#1a8a68] opacity-80' : 'border-[#1a8a68] hover:border-[#22c55e]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Date/Time */}
                        <div className="text-center min-w-[70px]">
                          <p className="text-[#4ade80] font-bold">{formatDate(game.date)}</p>
                          <p className="text-white text-sm">{game.time}</p>
                        </div>

                        {/* Game Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold">{game.teamName}</span>
                            <span className="text-[#1a8a68]">vs</span>
                            <span className="text-white font-semibold">{game.opponent}</span>
                            {game.homeAway === 'home' ? (
                              <span className="px-2 py-0.5 bg-[#22c55e]/20 text-[#4ade80] text-xs rounded-full flex items-center gap-1">
                                <Home className="w-3 h-3" /> Home
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full flex items-center gap-1">
                                <Plane className="w-3 h-3" /> Away
                              </span>
                            )}
                          </div>
                          <p className="text-[#1a8a68] text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {game.venue}
                          </p>
                          {game.result && (
                            <p className={`mt-2 text-sm font-medium ${
                              game.result === 'win' ? 'text-[#4ade80]' : 'text-red-400'
                            }`}>
                              {game.result === 'win' ? 'Won' : 'Lost'} {game.finalScore?.home} - {game.finalScore?.away}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingGame(game);
                            setShowAddModal(true);
                          }}
                          className="p-2 text-[#4ade80] hover:bg-[#22c55e]/20 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(game.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#1a8a68]">
        <p className="text-[#1a8a68] text-xs">Emerald Lakers Schedule Management</p>
      </footer>

      {/* Add/Edit Game Modal */}
      {showAddModal && (
        <GameFormModal
          game={editingGame}
          teams={sampleTeams}
          onSave={saveGame}
          onClose={() => {
            setShowAddModal(false);
            setEditingGame(null);
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
              <h3 className="text-xl font-bold text-white mb-2">Delete Game?</h3>
              <p className="text-[#1a8a68] text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-xl">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for modal (needs to be outside component or passed as prop)
const convertDateForInput = (dateValue) => {
  if (!dateValue) return '';

  // Firestore Timestamp
  if (typeof dateValue.toDate === 'function') {
    const d = dateValue.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Firestore Timestamp from JSON
  if (dateValue.seconds !== undefined) {
    const d = new Date(dateValue.seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Already a string in YYYY-MM-DD format
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateValue;
  }

  // Try to parse as date
  const d = new Date(dateValue);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  return '';
};

// Game Form Modal
const GameFormModal = ({ game, teams, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    teamId: game?.teamId || '',
    opponent: game?.opponent || '',
    date: convertDateForInput(game?.date) || '',
    time: game?.time || '',
    venue: game?.venue || '',
    homeAway: game?.homeAway || 'home',
    result: game?.result || '',
    homeScore: game?.finalScore?.home || '',
    awayScore: game?.finalScore?.away || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const saveData = {
      teamId: formData.teamId,
      opponent: formData.opponent,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      homeAway: formData.homeAway
    };

    if (formData.result) {
      saveData.result = formData.result;
      saveData.finalScore = {
        home: parseInt(formData.homeScore) || 0,
        away: parseInt(formData.awayScore) || 0
      };
    }

    onSave(saveData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-[#0d5943] border-2 border-[#1a8a68] rounded-t-3xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#1a8a68] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{game ? 'Edit Game' : 'Add Game'}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center hover:border-[#22c55e]">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
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
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#4ade80] text-sm font-medium mb-1">Opponent *</label>
            <input
              type="text"
              required
              value={formData.opponent}
              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              placeholder="e.g., Bankstown Thunder"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#4ade80] text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#4ade80] text-sm font-medium mb-1">Time *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#4ade80] text-sm font-medium mb-1">Venue *</label>
            <input
              type="text"
              required
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
              placeholder="e.g., Emerald Stadium Court 1"
            />
          </div>

          <div>
            <label className="block text-[#4ade80] text-sm font-medium mb-1">Home/Away</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, homeAway: 'home' })}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  formData.homeAway === 'home'
                    ? 'bg-[#22c55e] text-[#0a3d2e]'
                    : 'bg-[#0a3d2e] border border-[#1a8a68] text-white'
                }`}
              >
                <Home className="w-4 h-4" /> Home
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, homeAway: 'away' })}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  formData.homeAway === 'away'
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#0a3d2e] border border-[#1a8a68] text-white'
                }`}
              >
                <Plane className="w-4 h-4" /> Away
              </button>
            </div>
          </div>

          {/* Result (for editing completed games) */}
          {game && (
            <>
              <div>
                <label className="block text-[#4ade80] text-sm font-medium mb-1">Result (Optional)</label>
                <div className="flex gap-3">
                  {['', 'win', 'loss', 'draw'].map(result => (
                    <button
                      key={result}
                      type="button"
                      onClick={() => setFormData({ ...formData, result })}
                      className={`flex-1 py-2 rounded-lg text-sm capitalize transition-all ${
                        formData.result === result
                          ? result === 'win' ? 'bg-[#22c55e] text-[#0a3d2e]'
                            : result === 'loss' ? 'bg-red-500 text-white'
                            : result === 'draw' ? 'bg-yellow-500 text-[#0a3d2e]'
                            : 'bg-[#1a8a68] text-white'
                          : 'bg-[#0a3d2e] border border-[#1a8a68] text-white'
                      }`}
                    >
                      {result || 'None'}
                    </button>
                  ))}
                </div>
              </div>

              {formData.result && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#4ade80] text-sm font-medium mb-1">Our Score</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.homeScore}
                      onChange={(e) => setFormData({ ...formData, homeScore: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#4ade80] text-sm font-medium mb-1">Opponent Score</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.awayScore}
                      onChange={(e) => setFormData({ ...formData, awayScore: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </form>

        <div className="p-4 border-t border-[#1a8a68]">
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full py-3 bg-[#22c55e] text-[#0a3d2e] rounded-xl font-semibold hover:bg-[#4ade80] transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {game ? 'Save Changes' : 'Add Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagementPage;
