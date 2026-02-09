import React from 'react';
import * as Icons from 'lucide-react';
import { Play, RotateCcw, Clock } from 'lucide-react';
import ProgressRing from './ProgressRing';
import { TUTORIALS, TUTORIAL_ORDER, ROLE_TO_TUTORIAL } from '../../data/tutorialContent';
import useTutorial from '../../hooks/useTutorial';

const QuickStartCarousel = ({ userRole }) => {
  const { startTutorial, hasCompletedTutorial, completedCount, totalCount } = useTutorial();

  const recommendedId = ROLE_TO_TUTORIAL[userRole];
  const orderedIds = recommendedId
    ? [recommendedId, ...TUTORIAL_ORDER.filter((id) => id !== recommendedId)]
    : TUTORIAL_ORDER;

  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Header with overall progress */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Icons.GraduationCap className="w-4 h-4 text-[#4ade80]" />
            Quick Start
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            {completedCount}/{totalCount} tutorials completed
          </p>
        </div>
        <ProgressRing size={44} strokeWidth={4} percent={overallPercent} />
      </div>

      {/* Scrollable cards */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
        {orderedIds.map((id) => {
          const tutorial = TUTORIALS[id];
          if (!tutorial) return null;
          const completed = hasCompletedTutorial(id);
          const isRecommended = id === recommendedId;
          const IconComponent = Icons[tutorial.icon] || Icons.BookOpen;

          return (
            <div
              key={id}
              className={`flex-shrink-0 w-52 rounded-xl p-4 border transition-all ${
                isRecommended && !completed
                  ? 'bg-[#22c55e]/10 border-[#22c55e]/40'
                  : 'bg-[#0d5943] border-[#1a8a68]'
              }`}
            >
              {isRecommended && !completed && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#4ade80] mb-2 block">
                  Recommended for you
                </span>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    completed ? 'bg-[#22c55e]/20' : 'bg-[#1a8a68]/40'
                  }`}
                >
                  {completed ? (
                    <Icons.CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  ) : (
                    <IconComponent className="w-4 h-4 text-[#4ade80]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-xs truncate">{tutorial.title}</h3>
                  <span className="text-white/30 text-[10px] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {tutorial.estimatedMinutes} min &bull; {tutorial.steps.length} steps
                  </span>
                </div>
              </div>

              <button
                onClick={() => startTutorial(id)}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                  completed
                    ? 'bg-[#1a8a68]/30 text-white/70 hover:bg-[#1a8a68]/50'
                    : 'bg-[#22c55e] text-white hover:bg-[#16a34a]'
                }`}
              >
                {completed ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Replay
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Start
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickStartCarousel;
