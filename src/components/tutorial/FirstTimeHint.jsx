import React from 'react';
import useTutorial from '../../hooks/useTutorial';

const FirstTimeHint = ({ hintKey, children }) => {
  const { hasSeenFirstTime, markFirstTimeSeen } = useTutorial();

  const seen = hasSeenFirstTime(hintKey);

  const handleClick = () => {
    if (!seen) {
      markFirstTimeSeen(hintKey);
    }
  };

  return (
    <span className="relative inline-block" onClick={handleClick}>
      {children}
      {!seen && (
        <span className="absolute -top-1 -right-1 pointer-events-none">
          <span className="block w-3 h-3 rounded-full bg-[#00A651] animate-pulse-dot" />
        </span>
      )}
    </span>
  );
};

export default FirstTimeHint;
