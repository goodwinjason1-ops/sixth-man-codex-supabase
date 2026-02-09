import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { TUTORIALS, TUTORIAL_ORDER } from '../data/tutorialContent';

export const TutorialContext = createContext(null);

// localStorage helpers
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export const TutorialProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  // Progress: which tutorials have been completed
  const [progress, setProgress] = useState({});
  // First-time flags: which keys have been seen (for prompt cards, hints)
  const [firstTime, setFirstTime] = useState({});
  // Active tutorial state
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Load from localStorage when user changes
  useEffect(() => {
    if (!uid) {
      setProgress({});
      setFirstTime({});
      return;
    }
    setProgress(loadJSON(`tutorial_progress_${uid}`, {}));
    setFirstTime(loadJSON(`tutorial_firsttime_${uid}`, {}));
  }, [uid]);

  // Persist progress
  const persistProgress = useCallback((next) => {
    if (!uid) return;
    setProgress(next);
    saveJSON(`tutorial_progress_${uid}`, next);
  }, [uid]);

  // Persist first-time flags
  const persistFirstTime = useCallback((next) => {
    if (!uid) return;
    setFirstTime(next);
    saveJSON(`tutorial_firsttime_${uid}`, next);
  }, [uid]);

  // Actions
  const startTutorial = useCallback((tutorialId) => {
    const tutorial = TUTORIALS[tutorialId];
    if (!tutorial) return;
    setActiveTutorial(tutorial);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (!activeTutorial) return;
    if (currentStep < activeTutorial.steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [activeTutorial, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setActiveTutorial(null);
    setCurrentStep(0);
  }, []);

  const completeTutorial = useCallback(() => {
    if (!activeTutorial) return;
    const next = { ...progress, [activeTutorial.id]: true };
    persistProgress(next);
    setActiveTutorial(null);
    setCurrentStep(0);
  }, [activeTutorial, progress, persistProgress]);

  // Helpers
  const hasCompletedTutorial = useCallback((id) => !!progress[id], [progress]);

  const hasSeenFirstTime = useCallback((key) => !!firstTime[key], [firstTime]);

  const markFirstTimeSeen = useCallback((key) => {
    const next = { ...firstTime, [key]: true };
    persistFirstTime(next);
  }, [firstTime, persistFirstTime]);

  // Stats
  const completedCount = useMemo(
    () => TUTORIAL_ORDER.filter((id) => progress[id]).length,
    [progress]
  );
  const totalCount = TUTORIAL_ORDER.length;

  const value = useMemo(() => ({
    activeTutorial,
    currentStep,
    progress,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    hasCompletedTutorial,
    hasSeenFirstTime,
    markFirstTimeSeen,
    completedCount,
    totalCount,
  }), [
    activeTutorial, currentStep, progress,
    startTutorial, nextStep, prevStep, skipTutorial, completeTutorial,
    hasCompletedTutorial, hasSeenFirstTime, markFirstTimeSeen,
    completedCount, totalCount,
  ]);

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
