import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilteredData } from '../../hooks/useFilteredData';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { logActivity } from '../../services/auditService';
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
  Loader2,
  Dumbbell,
  AlertTriangle
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import { playerHQService } from '../../services/playerHQService';
import { formatDateAU, formatTimeStringAU, formatDateForStorage } from '../../utils/dateUtils';

// Training session types
const TRAINING_TYPES = [
  { id: 'regular', label: 'Regular Training' },
  { id: 'skills', label: 'Skills Session' },
  { id: 'scrimmage', label: 'Scrimmage' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'shooting', label: 'Shooting' },
  { id: 'other', label: 'Other' }
];

/**
 * Convert Firestore Timestamp or string to JavaScript Date
 */
const toJsDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return isNaN(dateValue.getTime()) ? null : dateValue;
  if (typeof dateValue.toDate === 'function') return dateValue.toDate();
  if (dateValue.seconds !== undefined) return new Date(dateValue.seconds * 1000);
  if (typeof dateValue === 'string') {
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const toDateString = (dateValue) => {
  const d = toJsDate(dateValue);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};




const ScheduleManagementPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { currentUser, userProfile, games: contextGames, teams, loading } = useFilteredData();

  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [editingTraining, setEditingTraining] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  useEffect(() => {
    if (contextGames) {
      setGames(contextGames);
      setIsLoading(false);
      if (contextGames.length > 0) {
        const firstDate = toJsDate(contextGames[0]?.date);
        if (firstDate) {
          setCurrentMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
        }
      }
    } else if (!loading) {
      setGames([]);
      setIsLoading(false);
    }
  }, [contextGames, loading]);

  // Count stats
  const gameCount = games.filter(g => (g.type || 'game') === 'game').length;
  const trainingCount = games.filter(g => g.type === 'training').length;

  const filteredGames = useMemo(() => {
    let result = [...games];

    // Filter by event type
    if (eventTypeFilter !== 'all') {
      result = result.filter(g => (g.type || 'game') === eventTypeFilter);
    }

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
        g.teamName?.toLowerCase().includes(query) ||
        g.trainingType?.toLowerCase().includes(query) ||
        g.notes?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      const dateA = toJsDate(a.date);
      const dateB = toJsDate(b.date);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  }, [games, selectedTeam, searchQuery, filterStatus, eventTypeFilter]);

  const calendarGames = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return filteredGames.filter(g => {
      const gameDate = toJsDate(g.date);
      if (!gameDate) return false;
      return gameDate.getFullYear() === year && gameDate.getMonth() === month;
    });
  }, [filteredGames, currentMonth]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, games: [] });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayGames = calendarGames.filter(g => toDateString(g.date) === dateStr);
      days.push({ date: d, dateStr, games: dayGames });
    }
    return days;
  }, [currentMonth, calendarGames]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await playerHQService.importFromCSV(text, 'games');
      if (result.data.length > 0) {
        const newGames = result.data.map((row, index) => ({
          id: `imported_${Date.now()}_${index}`,
          teamId: (teams || []).find(t => (t.name || t.teamName || '').toLowerCase().includes((row.team || '').toLowerCase()))?.id || '',
          teamName: row.team || '',
          opponent: row.opponent || '',
          date: row.date || '',
          time: row.time || '',
          venue: row.venue || '',
          homeAway: (row.home_away || row.homeaway || '').toLowerCase() === 'home' ? 'home' : 'away',
          playerHQGameId: row.playerhq_game_id || '',
          type: 'game',
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

  const exportSchedule = () => {
    const csv = playerHQService.exportToCSV(filteredGames, [
      { key: 'type', label: 'Type' },
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time' },
      { key: 'teamName', label: 'Team' },
      { key: 'opponent', label: 'Opponent' },
      { key: 'venue', label: 'Venue' },
      { key: 'homeAway', label: 'Home/Away' },
      { key: 'trainingType', label: 'Training Type' },
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

  const saveGame = async (gameData) => {
    setIsSaving(true);
    try {
      const team = (teams || []).find(t => t.id === gameData.teamId);
      const gameDoc = {
        ...gameData,
        teamName: team?.name || team?.teamName || gameData.teamName || '',
        type: 'game',
        status: 'scheduled',
        result: gameData.result || null,
        createdAt: editingGame ? (editingGame.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingGame) {
        const gameRef = doc(db, 'games', editingGame.id);
        await setDoc(gameRef, gameDoc, { merge: true });
        setGames(games.map(g => g.id === editingGame.id ? { ...g, ...gameDoc } : g));
      } else {
        const gameRef = doc(collection(db, 'games'));
        const newGame = { id: gameRef.id, ...gameDoc };
        await setDoc(gameRef, newGame);
        setGames([...games, newGame]);

        logActivity(
          { uid: currentUser?.uid, displayName: userProfile?.displayName, role: userProfile?.role },
          'schedule.game_created',
          `Scheduled game: ${gameDoc.teamName} vs ${gameData.opponent}`,
          { teamId: gameData.teamId, opponent: gameData.opponent, date: gameData.date }
        );
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

  const saveTraining = async (trainingData) => {
    setIsSaving(true);
    try {
      const team = (teams || []).find(t => t.id === trainingData.teamId);
      const trainingDoc = {
        ...trainingData,
        teamName: team?.name || team?.teamName || trainingData.teamName || '',
        type: 'training',
        status: 'scheduled',
        createdAt: editingTraining ? (editingTraining.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingTraining) {
        const ref = doc(db, 'games', editingTraining.id);
        await setDoc(ref, trainingDoc, { merge: true });
        setGames(games.map(g => g.id === editingTraining.id ? { ...g, ...trainingDoc } : g));
      } else {
        const ref = doc(collection(db, 'games'));
        const newTraining = { id: ref.id, ...trainingDoc };
        await setDoc(ref, newTraining);
        setGames([...games, newTraining]);

        logActivity(
          { uid: currentUser?.uid, displayName: userProfile?.displayName, role: userProfile?.role },
          'schedule.training_created',
          `Scheduled training: ${trainingDoc.teamName} - ${trainingData.trainingType}`,
          { teamId: trainingData.teamId, trainingType: trainingData.trainingType, date: trainingData.date }
        );
      }

      setShowTrainingModal(false);
      setEditingTraining(null);
    } catch (error) {
      console.error('Error saving training:', error);
      alert('Failed to save training session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (gameId) => {
    try {
      if (!gameId.startsWith('g')) {
        const gameRef = doc(db, 'games', gameId);
        await deleteDoc(gameRef);

        const deleted = games.find(g => g.id === gameId);
        logActivity(
          { uid: currentUser?.uid, displayName: userProfile?.displayName, role: userProfile?.role },
          'schedule.deleted',
          `Deleted ${deleted?.type || 'event'}: ${deleted?.teamName || ''} ${deleted?.opponent ? 'vs ' + deleted.opponent : ''}`.trim(),
          { eventId: gameId, type: deleted?.type }
        );
      }
      setGames(games.filter(g => g.id !== gameId));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  const formatDate = (dateValue) => {
    const jsDate = toJsDate(dateValue);
    if (!jsDate) return 'No date';
    return jsDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const handleEditEvent = (event) => {
    if (event.type === 'training') {
      setEditingTraining(event);
      setShowTrainingModal(true);
    } else {
      setEditingGame(event);
      setShowAddModal(true);
    }
  };

  return (
    <PageShell
      title="Schedule Management"
      subtitle={`${gameCount} games • ${trainingCount} training sessions`}
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Schedule Management' }
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
            className="flex items-center gap-2 px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg hover:border-[#00A651] transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => { setEditingTraining(null); setShowTrainingModal(true); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-amber-600 border border-amber-400 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
          >
            <Dumbbell className="w-5 h-5" />
            <span className="hidden sm:inline">Add Training</span>
          </button>
          <button
            onClick={() => { setEditingGame(null); setShowAddModal(true); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-[#005028] border border-[#00A651] rounded-lg font-semibold hover:bg-[#F5F9F5] transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Game</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {importSuccess && (
          <div className="bg-[#005028]/20 border border-[#00A651] rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
            <p className="text-[#00A651]">{importSuccess}</p>
          </div>
        )}

        {/* View Toggle & Filters */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex bg-[#F5F9F5] rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list' ? 'bg-[#005028] text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'calendar' ? 'bg-[#005028] text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Calendar
              </button>
            </div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none"
            >
              <option value="all">All Teams</option>
              {(teams || []).map(team => (
                <option key={team.id} value={team.id}>{team.name || team.teamName}</option>
              ))}
            </select>
          </div>

          {/* Event Type Filter */}
          <div className="flex gap-2 mb-3">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'game', label: 'Games' },
              { id: 'training', label: 'Training' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEventTypeFilter(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  eventTypeFilter === tab.id
                    ? 'bg-[#005028] text-white'
                    : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Search by opponent, venue, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 mt-3">
            {['all', 'upcoming', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-[#005028] text-white'
                    : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#D4E4D4]">
              <button onClick={prevMonth} className="p-2 hover:bg-[#F5F9F5] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <h3 className="text-xl font-bold text-gray-800">
                {currentMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-[#F5F9F5] rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-[#00A651] text-sm font-medium border-b border-[#D4E4D4]">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border-b border-r border-[#D4E4D4] ${
                    day.date ? 'bg-[#F5F9F5]/30' : 'bg-[#F5F9F5]/10'
                  }`}
                >
                  {day.date && (
                    <>
                      <p className="text-gray-800 text-sm mb-1">{day.date}</p>
                      {day.games.slice(0, 2).map(event => (
                        <button
                          key={event.id}
                          onClick={() => handleEditEvent(event)}
                          className={`w-full text-left text-xs p-1 rounded mb-1 truncate ${
                            event.type === 'training'
                              ? 'bg-amber-500/30 text-amber-300'
                              : event.homeAway === 'home'
                                ? 'bg-[#005028]/30 text-[#00A651]'
                                : 'bg-blue-500/30 text-blue-300'
                          }`}
                        >
                          {event.type === 'training'
                            ? `${event.time} ${event.trainingType || 'Training'}`
                            : `${event.time} vs ${event.opponent}`
                          }
                        </button>
                      ))}
                      {day.games.length > 2 && (
                        <p className="text-[#6B7C6B] text-xs">+{day.games.length - 2} more</p>
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
              <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
                <h3 className="text-gray-800 font-semibold mb-2">No Events Found</h3>
                <p className="text-[#6B7C6B] text-sm">
                  {searchQuery ? 'Try a different search term' : 'Add games or training sessions to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGames.map(event => {
                  const isTraining = event.type === 'training';
                  return (
                    <div
                      key={event.id}
                      className={`bg-white border-2 rounded-2xl p-4 transition-colors ${
                        isTraining
                          ? 'border-amber-500/50 hover:border-amber-400'
                          : event.result ? 'border-[#D4E4D4] opacity-80' : 'border-[#D4E4D4] hover:border-[#00A651]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                          <div className="text-center min-w-[60px] flex-shrink-0">
                            <p className={`font-bold ${isTraining ? 'text-amber-400' : 'text-[#00A651]'}`}>{formatDate(event.date)}</p>
                            <p className="text-gray-800 text-sm">{event.time}</p>
                            {event.endTime && <p className="text-[#6B7C6B] text-xs">to {event.endTime}</p>}
                          </div>

                          <div className="flex-1">
                            {isTraining ? (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <Dumbbell className="w-4 h-4 text-amber-400" />
                                  <span className="text-gray-800 font-semibold">{event.teamName}</span>
                                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full capitalize">
                                    {event.trainingType || 'Training'}
                                  </span>
                                </div>
                                <p className="text-[#6B7C6B] text-sm flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.venue}
                                </p>
                                {event.notes && (
                                  <p className="text-[#6B7C6B] text-xs mt-1 italic">{event.notes}</p>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-gray-800 font-semibold truncate">{event.teamName}</span>
                                  <span className="text-[#6B7C6B]">vs</span>
                                  <span className="text-gray-800 font-semibold truncate">{event.opponent}</span>
                                  {event.homeAway === 'home' ? (
                                    <span className="px-2 py-0.5 bg-[#005028]/20 text-[#00A651] text-xs rounded-full flex items-center gap-1">
                                      <Home className="w-3 h-3" /> Home
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full flex items-center gap-1">
                                      <Plane className="w-3 h-3" /> Away
                                    </span>
                                  )}
                                </div>
                                <p className="text-[#6B7C6B] text-sm flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.venue}
                                </p>
                                {event.result && (
                                  <p className={`mt-2 text-sm font-medium ${
                                    event.result === 'win' ? 'text-[#00A651]' : 'text-red-400'
                                  }`}>
                                    {event.result === 'win' ? 'Won' : 'Lost'} {event.finalScore?.home} - {event.finalScore?.away}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-2 text-[#00A651] hover:bg-[#00A651]/20 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(event.id)}
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
            )}
          </>
        )}
      </div>

      <footer className="py-4 text-center border-t border-[#D4E4D4]">
        <p className="text-[#6B7C6B] text-xs">Emerald Lakers Schedule Management</p>
      </footer>

      {/* Game Form Modal */}
      {showAddModal && (
        <GameFormModal
          game={editingGame}
          teams={teams || []}
          onSave={saveGame}
          onClose={() => { setShowAddModal(false); setEditingGame(null); }}
        />
      )}

      {/* Training Form Modal */}
      {showTrainingModal && (
        <TrainingFormModal
          training={editingTraining}
          teams={teams || []}
          allEvents={games}
          onSave={saveTraining}
          onClose={() => { setShowTrainingModal(false); setEditingTraining(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white border-2 border-red-500 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Event?</h3>
              <p className="text-[#6B7C6B] text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-xl">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

const convertDateForInput = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue.toDate === 'function') {
    const d = dateValue.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (dateValue.seconds !== undefined) {
    const d = new Date(dateValue.seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue;
  const d = new Date(dateValue);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return '';
};

// Game Form Modal (unchanged)
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
      saveData.finalScore = { home: parseInt(formData.homeScore) || 0, away: parseInt(formData.awayScore) || 0 };
    }
    onSave(saveData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-white border-2 border-[#D4E4D4] rounded-t-3xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#D4E4D4] flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{game ? 'Edit Game' : 'Add Game'}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651]">
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-1">Team *</label>
            <select required value={formData.teamId} onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none">
              <option value="">Select Team</option>
              {teams.map(team => <option key={team.id} value={team.id}>{team.name || team.teamName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-1">Opponent *</label>
            <input type="text" required value={formData.opponent} onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none" placeholder="e.g., Bankstown Thunder" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-1">Date *</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-1">Time *</label>
              <input type="time" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-1">Venue *</label>
            <input type="text" required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none" placeholder="e.g., Emerald Stadium Court 1" />
          </div>
          <div>
            <label className="block text-[#00A651] text-sm font-medium mb-1">Home/Away</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setFormData({ ...formData, homeAway: 'home' })}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${formData.homeAway === 'home' ? 'bg-[#005028] text-white' : 'bg-[#F5F9F5] border border-[#D4E4D4] text-white'}`}>
                <Home className="w-4 h-4" /> Home
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, homeAway: 'away' })}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${formData.homeAway === 'away' ? 'bg-blue-500 text-white' : 'bg-[#F5F9F5] border border-[#D4E4D4] text-white'}`}>
                <Plane className="w-4 h-4" /> Away
              </button>
            </div>
          </div>
          {game && (
            <>
              <div>
                <label className="block text-[#00A651] text-sm font-medium mb-1">Result (Optional)</label>
                <div className="flex gap-3">
                  {['', 'win', 'loss', 'draw'].map(result => (
                    <button key={result} type="button" onClick={() => setFormData({ ...formData, result })}
                      className={`flex-1 py-2 rounded-lg text-sm capitalize transition-all ${
                        formData.result === result
                          ? result === 'win' ? 'bg-[#005028] text-white' : result === 'loss' ? 'bg-red-500 text-white' : result === 'draw' ? 'bg-yellow-500 text-white' : 'bg-[#D4E4D4] text-white'
                          : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800'
                      }`}>
                      {result || 'None'}
                    </button>
                  ))}
                </div>
              </div>
              {formData.result && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#00A651] text-sm font-medium mb-1">Our Score</label>
                    <input type="number" min="0" value={formData.homeScore} onChange={(e) => setFormData({ ...formData, homeScore: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[#00A651] text-sm font-medium mb-1">Opponent Score</label>
                    <input type="number" min="0" value={formData.awayScore} onChange={(e) => setFormData({ ...formData, awayScore: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-[#00A651] focus:outline-none" />
                  </div>
                </div>
              )}
            </>
          )}
          <div className="pt-2">
            <button type="submit"
              className="w-full py-3 bg-[#005028] text-white rounded-xl font-semibold hover:bg-[#00A651] transition-colors flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />
              {game ? 'Save Changes' : 'Add Game'}
            </button>
            <div style={{height: '100px'}} />
          </div>
        </form>
      </div>
    </div>
  );
};

// Training Form Modal
const TrainingFormModal = ({ training, teams, allEvents, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    teamId: training?.teamId || '',
    date: convertDateForInput(training?.date) || '',
    time: training?.time || '',
    endTime: training?.endTime || '',
    venue: training?.venue || '',
    trainingType: training?.trainingType || 'regular',
    notes: training?.notes || ''
  });
  const [conflict, setConflict] = useState(null);

  // Check for scheduling conflicts
  useEffect(() => {
    if (!formData.date || !formData.venue || !formData.time) {
      setConflict(null);
      return;
    }
    const sameDayVenue = allEvents.filter(e => {
      if (training && e.id === training.id) return false;
      return toDateString(e.date) === formData.date && e.venue?.toLowerCase() === formData.venue.toLowerCase();
    });
    if (sameDayVenue.length > 0) {
      setConflict(`${sameDayVenue.length} other event(s) at this venue on this date: ${sameDayVenue.map(e => e.time).join(', ')}`);
    } else {
      setConflict(null);
    }
  }, [formData.date, formData.venue, formData.time, allEvents, training]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-white border-2 border-amber-500/50 rounded-t-3xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#D4E4D4] flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-amber-400" />
            {training ? 'Edit Training' : 'Add Training Session'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651]">
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div>
            <label className="block text-amber-400 text-sm font-medium mb-1">Team *</label>
            <select required value={formData.teamId} onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-amber-400 focus:outline-none">
              <option value="">Select Team</option>
              {teams.map(team => <option key={team.id} value={team.id}>{team.name || team.teamName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-amber-400 text-sm font-medium mb-1">Training Type *</label>
            <select required value={formData.trainingType} onChange={(e) => setFormData({ ...formData, trainingType: e.target.value })}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-amber-400 focus:outline-none">
              {TRAINING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1">Date *</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1">Start Time *</label>
              <input type="time" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1">End Time</label>
              <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1">Venue *</label>
              <input type="text" required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 focus:border-amber-400 focus:outline-none" placeholder="e.g., Emerald Indoor Courts" />
            </div>
          </div>
          <div>
            <label className="block text-amber-400 text-sm font-medium mb-1">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3} placeholder="Optional session notes..."
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:outline-none resize-none" />
          </div>

          {conflict && (
            <div className="flex items-start gap-2 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-xs">{conflict}</p>
            </div>
          )}

          <div className="pt-2">
            <button type="submit"
              className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />
              {training ? 'Save Changes' : 'Add Training Session'}
            </button>
            <div style={{height: '100px'}} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleManagementPage;
