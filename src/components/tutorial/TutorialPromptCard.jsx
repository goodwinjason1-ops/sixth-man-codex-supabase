import React from 'react';
import { GraduationCap, X, Play } from 'lucide-react';
import useTutorial from '../../hooks/useTutorial';
import { TUTORIALS } from '../../data/tutorialContent';

const TutorialPromptCard = ({ tutorialId }) => {
  const {
    startTutorial,
    hasCompletedTutorial,
    hasSeenFirstTime,
    markFirstTimeSeen,
  } = useTutorial();

  const tutorial = TUTORIALS[tutorialId];
  const firstTimeKey = `tutorial_prompt_${tutorialId}`;

  // Don't show if no tutorial, already completed, or dismissed
  if (!tutorial || hasCompletedTutorial(tutorialId) || hasSeenFirstTime(firstTimeKey)) {
    return null;
  }

  const handleDismiss = () => {
    markFirstTimeSeen(firstTimeKey);
  };

  const handleStart = () => {
    markFirstTimeSeen(firstTimeKey);
    startTutorial(tutorialId);
  };

  return (
    <div className="bg-white border border-[#00A651]/30 rounded-xl p-4 mb-4 animate-scaleIn">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#00A651]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-[#00A651]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-gray-800 font-semibold text-sm">New here? Take the quick tour</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                {tutorial.subtitle} ({tutorial.estimatedMinutes} min)
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Dismiss tutorial prompt"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <button
            onClick={handleStart}
            className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#005028] text-white text-xs font-semibold hover:bg-[#16a34a] transition-colors min-h-[36px]"
          >
            <Play className="w-3.5 h-3.5" />
            Start Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialPromptCard;
