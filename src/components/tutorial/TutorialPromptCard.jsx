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
    <div className="bg-[#0d5943] border border-[#4ade80]/30 rounded-xl p-4 mb-4 animate-scaleIn">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#4ade80]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-[#4ade80]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-white font-semibold text-sm">New here? Take the quick tour</h3>
              <p className="text-white/60 text-xs mt-0.5">
                {tutorial.subtitle} ({tutorial.estimatedMinutes} min)
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Dismiss tutorial prompt"
            >
              <X className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>
          <button
            onClick={handleStart}
            className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#22c55e] text-white text-xs font-semibold hover:bg-[#16a34a] transition-colors min-h-[36px]"
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
