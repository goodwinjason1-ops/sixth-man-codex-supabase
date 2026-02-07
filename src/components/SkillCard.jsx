import React from 'react';
import { ChevronRight } from 'lucide-react';

const levelLabels = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Confident Leader'
};

const levelColors = {
  1: 'bg-[#1a8a68]',
  2: 'bg-[#22c55e]',
  3: 'bg-[#4ade80]',
  4: 'bg-[#86efac]'
};

const SkillCard = ({ skill, onClick }) => {
  const { name, icon: Icon, level, lastAssessment, coachNotes } = skill;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-5 transition-all duration-300 hover:border-[#22c55e] hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
    >
      {/* Header with Icon and Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-[#22c55e] transition-colors">
          <Icon className="w-6 h-6 text-[#4ade80]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm leading-tight">{name}</h3>
          <p className="text-[#4ade80] text-xs mt-0.5">{levelLabels[level]}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-[#1a8a68] group-hover:text-[#4ade80] group-hover:translate-x-1 transition-all" />
      </div>

      {/* Progress Indicator - 4 Dots */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4].map((dot) => (
          <div
            key={dot}
            className={`flex-1 h-3 rounded-full transition-all duration-300 ${
              dot <= level
                ? levelColors[dot]
                : 'bg-[#0a3d2e] border border-[#1a8a68]'
            }`}
          />
        ))}
      </div>

      {/* Level Labels */}
      <div className="flex justify-between text-[10px] text-[#1a8a68] mb-4 px-1">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
      </div>

      {/* Last Assessment */}
      <div className="border-t border-[#1a8a68] pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#1a8a68]">Last Assessed:</span>
          <span className="text-white">{lastAssessment || 'Not yet'}</span>
        </div>

        {/* Coach Notes Preview */}
        {coachNotes && (
          <div className="mt-3 p-2 bg-[#0a3d2e] rounded-lg border border-[#1a8a68]">
            <p className="text-[10px] text-[#1a8a68] uppercase tracking-wide mb-1">Latest Note</p>
            <p className="text-xs text-white leading-relaxed line-clamp-2">{coachNotes}</p>
          </div>
        )}

        {/* Tap for details hint */}
        <p className="text-[10px] text-[#1a8a68] text-center mt-3 group-hover:text-[#4ade80] transition-colors">
          Tap for details
        </p>
      </div>
    </button>
  );
};

export default SkillCard;
