import React, { useState, useMemo } from 'react';
import {
  User,
  ChevronRight,
  ArrowLeft,
  Star,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Zap,
  Dribbble,
  Brain,
  HeartHandshake,
  Flame,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const FAKE_PLAYERS = [
  { id: 'fp1', name: 'Zara Mitchell', number: 7 },
  { id: 'fp2', name: 'Cooper James', number: 12 },
  { id: 'fp3', name: 'Isla Nguyen', number: 3 },
  { id: 'fp4', name: 'Marcus Webb', number: 21 },
  { id: 'fp5', name: 'Tessa O\'Brien', number: 9 },
];

const METRICS = [
  { id: 'athleticism', name: 'Athleticism', icon: Zap, description: 'Speed, agility, coordination' },
  { id: 'ballSkills', name: 'Ball Skills', icon: Dribbble, description: 'Dribbling, passing, shooting' },
  { id: 'gameIQ', name: 'Game IQ', icon: Brain, description: 'Court awareness, decision making' },
  { id: 'coachability', name: 'Coachability', icon: HeartHandshake, description: 'Listens, adapts, follows direction' },
  { id: 'effort', name: 'Effort', icon: Flame, description: 'Hustle, intensity, consistency' },
];

const PracticeAssessor = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [ratings, setRatings] = useState({});
  // ratings shape: { [playerId]: { [metricId]: number } }
  const [metricNotes, setMetricNotes] = useState({});
  // metricNotes shape: { [playerId]: { [metricId]: string } }
  const [expandedNotes, setExpandedNotes] = useState({});
  // expandedNotes shape: { 'playerId-metricId': boolean }

  const handleRate = (playerId, metricId, value) => {
    setRatings((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [metricId]: value,
      },
    }));
  };

  const handleNoteChange = (playerId, metricId, note) => {
    setMetricNotes((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [metricId]: note,
      },
    }));
  };

  const toggleNote = (playerId, metricId) => {
    const key = `${playerId}-${metricId}`;
    setExpandedNotes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Get the current player's ratings
  const currentPlayerRatings = selectedPlayer ? (ratings[selectedPlayer.id] || {}) : {};
  const currentPlayerNotes = selectedPlayer ? (metricNotes[selectedPlayer.id] || {}) : {};

  // Check if all metrics are rated for current player
  const allRated = selectedPlayer
    ? METRICS.every((m) => currentPlayerRatings[m.id] > 0)
    : false;

  // Score distribution feedback
  const distributionFeedback = useMemo(() => {
    if (!selectedPlayer || !allRated) return null;

    const values = METRICS.map((m) => currentPlayerRatings[m.id]);
    const uniqueValues = new Set(values);

    if (uniqueValues.size === 1) {
      return { type: 'warning', message: 'Try using the full scale! All ratings are the same.' };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min;

    if (spread >= 2) {
      return { type: 'success', message: 'Good spread! Your ratings show meaningful differentiation.' };
    }

    return { type: 'warning', message: 'Try using the full scale! Spread your ratings more for better differentiation.' };
  }, [selectedPlayer, currentPlayerRatings, allRated]);

  // Count how many players have been fully rated
  const completedCount = FAKE_PLAYERS.filter((p) => {
    const pr = ratings[p.id] || {};
    return METRICS.every((m) => pr[m.id] > 0);
  }).length;

  // Count metric notes for a player
  const noteCount = (playerId) => {
    const notes = metricNotes[playerId] || {};
    return Object.values(notes).filter(n => n && n.trim()).length;
  };

  if (!selectedPlayer) {
    // Player selection view
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Section Header */}
        <div className="mb-5">
          <h2 className="text-white font-bold text-lg">Select Player to Assess</h2>
          <p className="text-[#1a8a68] text-sm mt-1">
            {completedCount}/{FAKE_PLAYERS.length} players assessed
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-1.5 mb-6">
          {FAKE_PLAYERS.map((player) => {
            const pr = ratings[player.id] || {};
            const done = METRICS.every((m) => pr[m.id] > 0);
            const started = Object.keys(pr).length > 0;
            return (
              <div
                key={player.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  done
                    ? 'bg-[#4ade80]'
                    : started
                      ? 'bg-[#22c55e]/40'
                      : 'bg-white/20'
                }`}
              />
            );
          })}
        </div>

        {/* Player Cards */}
        <div className="space-y-3">
          {FAKE_PLAYERS.map((player) => {
            const pr = ratings[player.id] || {};
            const done = METRICS.every((m) => pr[m.id] > 0);
            const ratedCount = METRICS.filter((m) => pr[m.id] > 0).length;
            const notes = noteCount(player.id);

            return (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className="w-full text-left bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 transition-all duration-200 hover:border-[#22c55e] hover:bg-[#0f6b52] active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-[#22c55e]/20 border-[#22c55e]'
                      : 'bg-[#0a3d2e] border-[#1a8a68] group-hover:border-[#22c55e]'
                  }`}>
                    {done ? (
                      <CheckCircle className="w-6 h-6 text-[#4ade80]" />
                    ) : (
                      <span className="text-white font-bold text-lg">#{player.number}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold">{player.name}</h3>
                    <p className="text-[#4ade80] text-xs">
                      {done
                        ? `Assessment complete${notes > 0 ? ` + ${notes} notes` : ''}`
                        : ratedCount > 0
                          ? `${ratedCount}/${METRICS.length} metrics rated`
                          : 'Tap to assess'
                      }
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#1a8a68] group-hover:text-[#4ade80] group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Assessment view for selected player
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Player Header Card */}
      <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-[#0a3d2e] border-2 border-[#1a8a68] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">#{selectedPlayer.number}</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{selectedPlayer.name}</h2>
              <p className="text-[#4ade80] text-sm">
                {allRated
                  ? `All metrics rated${noteCount(selectedPlayer.id) > 0 ? ` + ${noteCount(selectedPlayer.id)} notes` : ''}`
                  : `${METRICS.filter((m) => currentPlayerRatings[m.id] > 0).length}/${METRICS.length} rated`
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPlayer(null)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm hover:border-[#22c55e] transition-colors min-w-[44px] min-h-[44px] justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>

      {/* Metrics Rating Cards */}
      <div className="space-y-3 mb-6">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          const currentValue = currentPlayerRatings[metric.id] || 0;
          const noteKey = `${selectedPlayer.id}-${metric.id}`;
          const isNoteOpen = expandedNotes[noteKey] || false;
          const currentNote = currentPlayerNotes[metric.id] || '';

          return (
            <div
              key={metric.id}
              className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium text-sm">{metric.name}</h4>
                    {currentNote && !isNoteOpen && (
                      <span className="text-[10px] text-[#4ade80] bg-[#22c55e]/20 px-1.5 py-0.5 rounded">notes</span>
                    )}
                  </div>
                  <p className="text-[#1a8a68] text-xs">{metric.description}</p>
                </div>
                <span className="text-2xl font-bold text-[#4ade80] w-8 text-right">
                  {currentValue || '-'}
                </span>
              </div>

              {/* Rating Buttons 1-5 */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleRate(selectedPlayer.id, metric.id, level)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 min-h-[44px] ${
                      currentValue === level
                        ? 'bg-[#22c55e] text-[#0a3d2e] scale-105'
                        : currentValue > 0 && currentValue >= level
                          ? 'bg-[#22c55e]/40 text-white'
                          : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] hover:border-[#22c55e] hover:text-[#22c55e]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Notes toggle + collapsible textarea */}
              <button
                onClick={() => toggleNote(selectedPlayer.id, metric.id)}
                className="mt-2 flex items-center gap-1 text-[10px] text-[#1a8a68] hover:text-[#4ade80] transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                <span>{isNoteOpen ? 'Hide note' : currentNote ? 'Edit note' : 'Add note'}</span>
                {isNoteOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${isNoteOpen ? 'max-h-[120px] mt-1.5' : 'max-h-0'}`}>
                <textarea
                  value={currentNote}
                  onChange={(e) => handleNoteChange(selectedPlayer.id, metric.id, e.target.value)}
                  placeholder={`${metric.name} notes for ${selectedPlayer.name}...`}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-xs placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none resize-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Distribution Feedback */}
      {distributionFeedback && (
        <div className={`rounded-xl p-4 flex items-center gap-3 mb-6 ${
          distributionFeedback.type === 'success'
            ? 'bg-[#22c55e]/10 border border-[#22c55e]/40'
            : 'bg-amber-500/10 border border-amber-500/40'
        }`}>
          {distributionFeedback.type === 'success' ? (
            <BarChart3 className="w-5 h-5 text-[#4ade80] flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          )}
          <p className={`text-sm font-medium ${
            distributionFeedback.type === 'success' ? 'text-[#4ade80]' : 'text-amber-300'
          }`}>
            {distributionFeedback.message}
          </p>
        </div>
      )}

      {/* Summary Section (when all rated) */}
      {allRated && (
        <div className="bg-[#0d5943] border-2 border-[#22c55e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-[#4ade80]" />
            <h3 className="text-white font-bold">Rating Summary</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {METRICS.map((metric) => {
              const Icon = metric.icon;
              const note = currentPlayerNotes[metric.id];
              return (
                <div key={metric.id} className="bg-[#0a3d2e] rounded-lg p-3 text-center">
                  <Icon className="w-4 h-4 text-[#4ade80] mx-auto mb-1" />
                  <p className="text-white/60 text-xs">{metric.name}</p>
                  <p className="text-[#4ade80] text-xl font-bold">{currentPlayerRatings[metric.id]}</p>
                  {note && <p className="text-white/40 text-[10px] mt-1 truncate">{note}</p>}
                </div>
              );
            })}
            <div className="bg-[#0a3d2e] rounded-lg p-3 text-center">
              <BarChart3 className="w-4 h-4 text-[#4ade80] mx-auto mb-1" />
              <p className="text-white/60 text-xs">Average</p>
              <p className="text-[#4ade80] text-xl font-bold">
                {(METRICS.reduce((sum, m) => sum + currentPlayerRatings[m.id], 0) / METRICS.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeAssessor;
