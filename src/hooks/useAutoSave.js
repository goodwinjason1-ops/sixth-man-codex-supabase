import { useState, useEffect, useRef, useCallback } from 'react';

const AUTOSAVE_INTERVAL = 30000; // 30 seconds

/**
 * Auto-saves form data to localStorage every 30 seconds.
 * On mount, checks for previously saved data and offers to restore.
 * Clears saved data on successful Firestore save.
 *
 * @param {string} key - Unique key for this form (e.g. 'match-assessment')
 * @param {any} formData - Current form data to auto-save
 * @returns {{ savedData: any|null, clearSaved: Function, hasSavedData: boolean }}
 */
export function useAutoSave(key, formData) {
  const storageKey = `autosave_${key}`;
  const [savedData, setSavedData] = useState(null);
  const formDataRef = useRef(formData);

  // Keep ref current without re-triggering effects
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Check for saved data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.data && parsed?.timestamp) {
          // Only restore if saved less than 24 hours ago
          const age = Date.now() - parsed.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            setSavedData(parsed.data);
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (_) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const data = formDataRef.current;
      if (data && Object.keys(data).length > 0) {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch (_) {
          // localStorage full or unavailable — silently skip
        }
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [storageKey]);

  // Clear saved data (call after successful Firestore save)
  const clearSaved = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSavedData(null);
  }, [storageKey]);

  return {
    savedData,
    clearSaved,
    hasSavedData: savedData !== null
  };
}

export default useAutoSave;
