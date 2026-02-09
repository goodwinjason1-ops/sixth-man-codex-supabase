import React from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import useTutorial from '../../hooks/useTutorial';
import useSwipeGesture from '../../hooks/useSwipeGesture';
import TutorialProgressBar from './TutorialProgressBar';
import TutorialCard from './TutorialCard';

const TutorialOverlay = () => {
  const {
    activeTutorial,
    currentStep,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
  } = useTutorial();

  const swipeHandlers = useSwipeGesture(
    // Swipe left → next
    () => {
      if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
        nextStep();
      }
    },
    // Swipe right → prev
    () => {
      if (currentStep > 0) {
        prevStep();
      }
    }
  );

  if (!activeTutorial) return null;

  const step = activeTutorial.steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === activeTutorial.steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={skipTutorial}
      />

      {/* Card */}
      <div
        className="relative w-full sm:max-w-md max-h-[90vh] bg-[#0d5943] rounded-t-3xl sm:rounded-2xl border border-[#1a8a68] shadow-2xl animate-slideUp flex flex-col"
        {...swipeHandlers}
      >
        {/* Header: progress bar + close */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white/60 text-xs font-medium uppercase tracking-wider">
              {activeTutorial.title}
            </h4>
            <button
              onClick={skipTutorial}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close tutorial"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          <TutorialProgressBar current={currentStep} total={activeTutorial.steps.length} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0">
          <TutorialCard
            step={step}
            stepIndex={currentStep}
            totalSteps={activeTutorial.steps.length}
          />
        </div>

        {/* Navigation buttons */}
        <div className="px-5 pb-5 pt-3 flex-shrink-0 border-t border-[#1a8a68]/50">
          <div className="flex items-center justify-between gap-3">
            {/* Back button */}
            {!isFirst ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1a8a68] text-white/70 text-sm hover:bg-[#1a8a68]/30 transition-colors min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                onClick={skipTutorial}
                className="px-4 py-2.5 rounded-xl text-white/40 text-sm hover:text-white/60 transition-colors min-h-[44px]"
              >
                Skip
              </button>
            )}

            {/* Next / Done button */}
            {!isLast ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a] transition-colors min-h-[44px]"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={completeTutorial}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#16a34a] transition-colors min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            )}
          </div>

          {/* Swipe hint on mobile */}
          <p className="text-center text-white/20 text-xs mt-3 sm:hidden animate-swipe-hint">
            Swipe left or right to navigate
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
