import React from 'react';

const TutorialProgressBar = ({ current, total }) => {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i <= current
              ? 'bg-[#4ade80]'
              : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );
};

export default TutorialProgressBar;
