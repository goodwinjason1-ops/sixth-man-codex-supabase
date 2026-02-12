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
          <h2 className="text-gray-800 font-bold text-base flex items-center gap-2">
            <Icons.GraduationCap className="w-4 h-4 text-[#00A651]" />
            Quick Start
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
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
              className={`flex-shrink-0 w-64 rounded-xl p-5 border transition-all ${
                isRecommended && !completed
                  ? 'bg-[#005028]/10 border-[#00A651]/40'
                  : 'bg-white border-[#D4E4D4]'
              }`}
            >
              {isRecommended && !completed && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#00A651] mb-2 block">
                  Recommended for you
                </span>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    completed ? 'bg-[#005028]/20' : 'bg-[#D4E4D4]/40'
                  }`}
                >
                  {completed ? (
                    <Icons.CheckCircle2 className="w-5 h-5 text-[#00A651]" />
                  ) : (
                    <IconComponent className="w-5 h-5 text-[#00A651]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-gray-800 font-semibold text-sm truncate">{tutorial.title}</h3>
                  <span className="text-gray-800/30 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {tutorial.estimatedMinutes} min &bull; {tutorial.steps.length} steps
                  </span>
                </div>
              </div>

              <button
                onClick={() => startTutorial(id)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-[40px] ${
                  completed
                    ? 'bg-[#D4E4D4]/30 text-gray-600 hover:bg-gray-100/50'
                    : 'bg-[#005028] text-white hover:bg-[#16a34a]'
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
