import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

/**
 * AnimatedWalkthrough
 *
 * Plays a sequence of simulated UI interactions with an animated cursor,
 * click ripple effects, typing indicators, and swipe trails.
 *
 * Props:
 *   steps       - Array of step objects: { x, y, action, label, duration }
 *                 action: 'click' | 'type' | 'swipe' | 'wait'
 *                 For 'swipe': provide toX, toY as well
 *   autoPlay    - Boolean, start automatically (default true)
 *   loop        - Boolean, loop the animation (default false)
 *   stepDelay   - Default duration per step in ms (default 2000)
 *   title       - Optional title shown above the visual
 */

const ACTIONS = {
  click: 'click',
  type: 'type',
  swipe: 'swipe',
  wait: 'wait',
};

const AnimatedWalkthrough = ({
  steps = [],
  autoPlay = true,
  loop = false,
  stepDelay = 2000,
  title,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [showRipple, setShowRipple] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [swipeTrail, setSwipeTrail] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);

  const step = steps[currentStep] || {};

  /** Advance to the next step */
  const goNext = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      if (loop) {
        setCurrentStep(0);
        setIsComplete(false);
      } else {
        setIsPlaying(false);
        setIsComplete(true);
      }
      return;
    }
    setCurrentStep((prev) => prev + 1);
  }, [currentStep, steps.length, loop]);

  /** Go to previous step */
  const goPrev = useCallback(() => {
    setIsComplete(false);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  /** Restart from the beginning */
  const restart = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(true);
    setIsComplete(false);
  }, []);

  /** Toggle play/pause */
  const togglePlay = useCallback(() => {
    if (isComplete) {
      restart();
      return;
    }
    setIsPlaying((prev) => !prev);
  }, [isComplete, restart]);

  /** Run step effect */
  useEffect(() => {
    if (!steps.length) return;
    const s = steps[currentStep];
    if (!s) return;

    // Move cursor to target position
    setCursorPos({ x: s.x ?? 50, y: s.y ?? 50 });

    // Reset effects
    setShowRipple(false);
    setShowTyping(false);
    setSwipeTrail(null);

    // Trigger action effect after cursor arrives (300ms transition)
    const effectTimer = setTimeout(() => {
      switch (s.action) {
        case ACTIONS.click:
          setShowRipple(true);
          setTimeout(() => setShowRipple(false), 600);
          break;
        case ACTIONS.type:
          setShowTyping(true);
          setTimeout(() => setShowTyping(false), (s.duration || stepDelay) - 500);
          break;
        case ACTIONS.swipe:
          if (s.toX != null && s.toY != null) {
            setSwipeTrail({ fromX: s.x, fromY: s.y, toX: s.toX, toY: s.toY });
            setTimeout(() => {
              setCursorPos({ x: s.toX, y: s.toY });
              setTimeout(() => setSwipeTrail(null), 400);
            }, 200);
          }
          break;
        default:
          break;
      }
    }, 350);

    return () => clearTimeout(effectTimer);
  }, [currentStep, steps, stepDelay]);

  /** Auto-advance timer */
  useEffect(() => {
    if (!isPlaying || !steps.length || isComplete) {
      clearTimeout(timerRef.current);
      return;
    }

    const duration = steps[currentStep]?.duration || stepDelay;
    timerRef.current = setTimeout(goNext, duration);

    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentStep, goNext, stepDelay, steps, isComplete]);

  if (!steps.length) return null;

  return (
    <div className="space-y-3">
      {title && (
        <p className="text-xs text-[#00A651] font-semibold">{title}</p>
      )}

      {/* Visual container */}
      <div className="relative bg-[#F5F9F5] border-2 border-dashed border-[#D4E4D4] rounded-xl min-h-[180px] overflow-hidden select-none">
        {/* Background grid hint */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #00A651 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Placeholder icon */}
        <div className="flex flex-col items-center justify-center text-center opacity-20 pt-8">
          <Monitor className="w-8 h-8 text-[#00A651] mb-1" />
          <p className="text-gray-400 text-[10px]">Interactive walkthrough</p>
        </div>

        {/* Swipe trail */}
        {swipeTrail && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <line
              x1={`${swipeTrail.fromX}%`}
              y1={`${swipeTrail.fromY}%`}
              x2={`${swipeTrail.toX}%`}
              y2={`${swipeTrail.toY}%`}
              stroke="rgba(74, 222, 128, 0.4)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          </svg>
        )}

        {/* Animated cursor dot */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
            transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), top 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Cursor dot */}
          <div className="w-3 h-3 rounded-full bg-[#00A651] shadow-lg animate-cursor-blink" />

          {/* Click ripple */}
          {showRipple && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#00A651] animate-ripple" />
            </div>
          )}

          {/* Typing indicator */}
          {showTyping && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex gap-1 bg-white px-2 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] animate-typing-dot" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] animate-typing-dot" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] animate-typing-dot" style={{ animationDelay: '400ms' }} />
            </div>
          )}
        </div>

        {/* Step indicator dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentStep(i); setIsComplete(false); }}
              className={`w-2 h-2 rounded-full transition-all min-w-[8px] min-h-[8px] ${
                i === currentStep
                  ? 'bg-[#00A651] scale-125'
                  : i < currentStep
                    ? 'bg-[#00A651]/50'
                    : 'bg-gray-200'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Controls and description */}
      <div className="flex items-center gap-2">
        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous step"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[#D4E4D4]/40 text-[#00A651] hover:bg-gray-100/60 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isComplete ? (
              <RotateCcw className="w-4 h-4" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={goNext}
            disabled={currentStep >= steps.length - 1 && !loop}
            className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Step description */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-700 truncate">
            <span className="text-[#00A651] font-semibold">Step {currentStep + 1}/{steps.length}:</span>{' '}
            {step.label || 'Processing...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnimatedWalkthrough;
