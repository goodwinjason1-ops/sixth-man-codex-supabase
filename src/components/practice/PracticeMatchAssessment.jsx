import React, { useState, useMemo } from 'react';
import {
  Crosshair,
  Shield,
  Flame,
  Brain,
  Star,
  Trophy,
  Check,
  RotateCcw,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SAMPLE_PLAYER = {
  id: 'mp1',
  name: 'Jordan Rivera',
  number: 14,
  team: 'U14 Lakers',
};

const MATCH_METRICS = [
  {
    id: 'offense',
    name: 'Offense',
    icon: Crosshair,
    description: 'Scoring, shot selection, creating opportunities',
    levels: {
      1: 'Rarely involved in attack',
      2: 'Occasionally contributes',
      3: 'Solid contributor',
      4: 'Key playmaker',
      5: 'Dominant force',
    },
  },
  {
    id: 'defense',
    name: 'Defense',
    icon: Shield,
    description: 'Positioning, pressure, help defense',
    levels: {
      1: 'Lacks awareness',
      2: 'Basic positioning',
      3: 'Reliable defender',
      4: 'Strong stopper',
      5: 'Lockdown defender',
    },
  },
  {
    id: 'effort',
    name: 'Effort',
    icon: Flame,
    description: 'Hustle, energy, 50/50 balls',
    levels: {
      1: 'Low energy',
      2: 'Inconsistent effort',
      3: 'Steady contributor',
      4: 'High motor',
      5: 'Relentless competitor',
    },
  },
  {
    id: 'iq',
    name: 'Basketball IQ',
    icon: Brain,
    description: 'Court vision, decision making, spacing',
    levels: {
      1: 'Limited awareness',
      2: 'Learning the game',
      3: 'Sound decisions',
      4: 'Reads the game well',
      5: 'Elite court sense',
    },
  },
];

const PracticeMatchAssessment = () => {
  const [ratings, setRatings] = useState({});
  const [metricNotes, setMetricNotes] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleRate = (metricId, value) => {
    if (submitted) return;
    setRatings((prev) => ({
      ...prev,
      [metricId]: value,
    }));
  };

  const handleNoteChange = (metricId, note) => {
    setMetricNotes((prev) => ({
      ...prev,
      [metricId]: note,
    }));
  };

  const toggleNote = (metricId) => {
    setExpandedNotes((prev) => ({ ...prev, [metricId]: !prev[metricId] }));
  };

  const allRated = MATCH_METRICS.every((m) => ratings[m.id] > 0);

  const noteCount = Object.values(metricNotes).filter(n => n && n.trim()).length;

  const averageRating = useMemo(() => {
    if (!allRated) return 0;
    const sum = MATCH_METRICS.reduce((acc, m) => acc + ratings[m.id], 0);
    return (sum / MATCH_METRICS.length).toFixed(1);
  }, [ratings, allRated]);

  const overallLabel = useMemo(() => {
    const avg = parseFloat(averageRating);
    if (avg >= 4.5) return 'Outstanding Performance';
    if (avg >= 3.5) return 'Strong Performance';
    if (avg >= 2.5) return 'Solid Performance';
    if (avg >= 1.5) return 'Developing';
    return 'Needs Improvement';
  }, [averageRating]);

  const handleSubmit = () => {
    if (!allRated) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setRatings({});
    setMetricNotes({});
    setExpandedNotes({});
    setSubmitted(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Player Card */}
      <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-[#005028] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00A651]/20">
            <span className="text-white text-2xl font-bold">#{SAMPLE_PLAYER.number}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-gray-800 font-bold text-lg">{SAMPLE_PLAYER.name}</h2>
            <p className="text-[#00A651] text-sm">{SAMPLE_PLAYER.team}</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#F5F9F5] rounded-full border border-[#D4E4D4]">
            <Trophy className="w-3.5 h-3.5 text-[#00A651]" />
            <span className="text-gray-500 text-xs">Match Day</span>
          </div>
        </div>
      </div>

      {!submitted ? (
        <>
          {/* Assessment Form */}
          <div className="mb-4">
            <h3 className="text-gray-800 font-semibold">Rate Performance</h3>
            <p className="text-[#6B7C6B] text-sm mt-0.5">Tap 1-5 for each area, add notes for detailed feedback</p>
          </div>

          <div className="space-y-3 mb-6">
            {MATCH_METRICS.map((metric) => {
              const Icon = metric.icon;
              const currentValue = ratings[metric.id] || 0;
              const levelDescription = currentValue > 0 ? metric.levels[currentValue] : null;
              const isNoteOpen = expandedNotes[metric.id] || false;
              const currentNote = metricNotes[metric.id] || '';

              return (
                <div
                  key={metric.id}
                  className="bg-white border border-[#D4E4D4] rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#00A651]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-gray-800 font-medium text-sm">{metric.name}</h4>
                        {currentNote && !isNoteOpen && (
                          <span className="text-[10px] text-[#00A651] bg-[#005028]/20 px-1.5 py-0.5 rounded">notes</span>
                        )}
                      </div>
                      <p className="text-[#6B7C6B] text-xs">{metric.description}</p>
                    </div>
                    <span className="text-2xl font-bold text-[#00A651] w-8 text-right">
                      {currentValue || '-'}
                    </span>
                  </div>

                  {/* Rating Buttons */}
                  <div className="flex gap-2 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleRate(metric.id, level)}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 min-h-[44px] ${
                          currentValue === level
                            ? 'bg-[#005028] text-white scale-105'
                            : currentValue > 0 && currentValue >= level
                              ? 'bg-[#005028]/40 text-white'
                              : 'bg-[#F5F9F5] border border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651] hover:text-[#00A651]'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  {/* Level Description */}
                  {levelDescription && (
                    <p className="text-[#00A651] text-xs mt-2 pl-1 italic">
                      {levelDescription}
                    </p>
                  )}

                  {/* Notes toggle + collapsible textarea */}
                  <button
                    onClick={() => toggleNote(metric.id)}
                    className="mt-2 flex items-center gap-1 text-[10px] text-[#6B7C6B] hover:text-[#00A651] transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{isNoteOpen ? 'Hide note' : currentNote ? 'Edit note' : 'Add note'}</span>
                    {isNoteOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${isNoteOpen ? 'max-h-[120px] mt-1.5' : 'max-h-0'}`}>
                    <textarea
                      value={currentNote}
                      onChange={(e) => handleNoteChange(metric.id, e.target.value)}
                      placeholder={`${metric.name} notes for ${SAMPLE_PLAYER.name}...`}
                      rows={2}
                      className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-xs placeholder-gray-400 focus:border-[#00A651] focus:outline-none resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!allRated}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 min-h-[56px] ${
              allRated
                ? 'bg-[#D4E4D4] hover:bg-[#00A651] text-white active:scale-[0.98]'
                : 'bg-white border border-[#D4E4D4] text-[#6B7C6B] cursor-not-allowed'
            }`}
          >
            <Check className="w-6 h-6" />
            {allRated ? `Submit Assessment${noteCount > 0 ? ` (${noteCount} notes)` : ''}` : `Rate all ${MATCH_METRICS.length} areas to submit`}
          </button>
        </>
      ) : (
        <>
          {/* Result Card */}
          <div className="bg-gradient-to-br from-[#005028] to-[#0a4a38] border-2 border-[#00A651] rounded-2xl p-6 mb-6">
            {/* Overall Score */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#005028]/20 border-2 border-[#00A651] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[#00A651] text-3xl font-bold">{averageRating}</span>
              </div>
              <h3 className="text-gray-800 font-bold text-xl">{overallLabel}</h3>
              <p className="text-[#00A651] text-sm mt-1">{SAMPLE_PLAYER.name} - Match Assessment</p>
            </div>

            {/* Metric Breakdown */}
            <div className="space-y-3">
              {MATCH_METRICS.map((metric) => {
                const Icon = metric.icon;
                const value = ratings[metric.id];
                const note = metricNotes[metric.id];

                return (
                  <div key={metric.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F5F9F5] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#00A651]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-800 text-sm font-medium">{metric.name}</span>
                          <span className="text-[#00A651] text-sm font-bold">{value}/5</span>
                        </div>
                        {/* Rating Bar */}
                        <div className="h-2 bg-[#F5F9F5] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#005028] rounded-full transition-all duration-500"
                            style={{ width: `${(value / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">{metric.levels[value]}</p>
                      </div>
                    </div>
                    {note && (
                      <div className="ml-11 mt-1 px-3 py-2 bg-[#F5F9F5]/60 rounded-lg border border-[#D4E4D4]/30">
                        <div className="flex items-center gap-1 mb-0.5">
                          <MessageSquare className="w-3 h-3 text-[#00A651]" />
                          <span className="text-[10px] text-[#00A651] font-medium">Note</span>
                        </div>
                        <p className="text-gray-500 text-xs">{note}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Star Rating Visual */}
            <div className="flex justify-center gap-1 mt-6 pt-4 border-t border-[#D4E4D4]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 ${
                    parseFloat(averageRating) >= star
                      ? 'text-yellow-400 fill-yellow-400'
                      : parseFloat(averageRating) >= star - 0.5
                        ? 'text-yellow-400/50 fill-yellow-400/30'
                        : 'text-[#6B7C6B]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full py-3 bg-white border border-[#D4E4D4] hover:border-[#00A651] text-gray-800 rounded-xl font-medium transition-all flex items-center justify-center gap-2 min-h-[48px]"
          >
            <RotateCcw className="w-5 h-5" />
            Assess Again
          </button>
        </>
      )}
    </div>
  );
};

export default PracticeMatchAssessment;
