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
  User
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
  const [submitted, setSubmitted] = useState(false);

  const handleRate = (metricId, value) => {
    if (submitted) return;
    setRatings((prev) => ({
      ...prev,
      [metricId]: value,
    }));
  };

  const allRated = MATCH_METRICS.every((m) => ratings[m.id] > 0);

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
    setSubmitted(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Player Card */}
      <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-[#22c55e] rounded-2xl flex items-center justify-center shadow-lg shadow-[#22c55e]/20">
            <span className="text-[#0a3d2e] text-2xl font-bold">#{SAMPLE_PLAYER.number}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">{SAMPLE_PLAYER.name}</h2>
            <p className="text-[#4ade80] text-sm">{SAMPLE_PLAYER.team}</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#0a3d2e] rounded-full border border-[#1a8a68]">
            <Trophy className="w-3.5 h-3.5 text-[#4ade80]" />
            <span className="text-white/60 text-xs">Match Day</span>
          </div>
        </div>
      </div>

      {!submitted ? (
        <>
          {/* Assessment Form */}
          <div className="mb-4">
            <h3 className="text-white font-semibold">Rate Performance</h3>
            <p className="text-[#1a8a68] text-sm mt-0.5">Tap 1-5 for each area</p>
          </div>

          <div className="space-y-3 mb-6">
            {MATCH_METRICS.map((metric) => {
              const Icon = metric.icon;
              const currentValue = ratings[metric.id] || 0;
              const levelDescription = currentValue > 0 ? metric.levels[currentValue] : null;

              return (
                <div
                  key={metric.id}
                  className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">{metric.name}</h4>
                      <p className="text-[#1a8a68] text-xs">{metric.description}</p>
                    </div>
                    <span className="text-2xl font-bold text-[#4ade80] w-8 text-right">
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

                  {/* Level Description */}
                  {levelDescription && (
                    <p className="text-[#4ade80] text-xs mt-2 pl-1 italic">
                      {levelDescription}
                    </p>
                  )}
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
                ? 'bg-[#1a8a68] hover:bg-[#22c55e] text-white active:scale-[0.98]'
                : 'bg-[#0d5943] border border-[#1a8a68] text-[#1a8a68] cursor-not-allowed'
            }`}
          >
            <Check className="w-6 h-6" />
            {allRated ? 'Submit Assessment' : `Rate all ${MATCH_METRICS.length} areas to submit`}
          </button>
        </>
      ) : (
        <>
          {/* Result Card */}
          <div className="bg-gradient-to-br from-[#0d5943] to-[#0a4a38] border-2 border-[#22c55e] rounded-2xl p-6 mb-6">
            {/* Overall Score */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#22c55e]/20 border-2 border-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[#4ade80] text-3xl font-bold">{averageRating}</span>
              </div>
              <h3 className="text-white font-bold text-xl">{overallLabel}</h3>
              <p className="text-[#4ade80] text-sm mt-1">{SAMPLE_PLAYER.name} - Match Assessment</p>
            </div>

            {/* Metric Breakdown */}
            <div className="space-y-3">
              {MATCH_METRICS.map((metric) => {
                const Icon = metric.icon;
                const value = ratings[metric.id];

                return (
                  <div key={metric.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0a3d2e] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#4ade80]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm font-medium">{metric.name}</span>
                        <span className="text-[#4ade80] text-sm font-bold">{value}/5</span>
                      </div>
                      {/* Rating Bar */}
                      <div className="h-2 bg-[#0a3d2e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22c55e] rounded-full transition-all duration-500"
                          style={{ width: `${(value / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">{metric.levels[value]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Star Rating Visual */}
            <div className="flex justify-center gap-1 mt-6 pt-4 border-t border-[#1a8a68]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 ${
                    parseFloat(averageRating) >= star
                      ? 'text-yellow-400 fill-yellow-400'
                      : parseFloat(averageRating) >= star - 0.5
                        ? 'text-yellow-400/50 fill-yellow-400/30'
                        : 'text-[#1a8a68]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full py-3 bg-[#0d5943] border border-[#1a8a68] hover:border-[#22c55e] text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 min-h-[48px]"
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
