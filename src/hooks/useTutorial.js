import { useContext } from 'react';
import { TutorialContext } from '../contexts/TutorialContext';

export default function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}
