import React from 'react';
import { ChevronRight } from 'lucide-react';

const levelLabels = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Confident Leader'
};

const levelColors = {
  1: 'bg-[#D4E4D4]',
  2: 'bg-[#005028]',
  3: 'bg-[#00A651]',
  4: 'bg-[#86efac]'
};

const SkillCard = ({ skill, onClick }) => {
  const { name, icon: Icon, level, lastAssessment, coachNotes } = skill;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border-2 border-[#D4E4D4] rounded-2xl p-5 transition-all duration-300 hover:border-[#00A651] hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
    >
      {/* Header with Icon and Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-[#00A651] transition-colors">
          <Icon className="w-6 h-6 text-[#00A651]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-800 font-semibold text-sm leading-tight">{name}</h3>
          <p className="text-[#00A651] text-xs mt-0.5">{levelLabels[level]}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-[#6B7C6B] group-hover:text-[#00A651] group-hover:translate-x-1 transition-all" />
      </div>

      {/* Progress Indicator - 4 Dots */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4].map((dot) => (
          <div
            key={dot}
            className={`flex-1 h-3 rounded-full transition-all duration-300 ${
              dot <= level
                ? levelColors[dot]
                : 'bg-[#F5F9F5] border border-[#D4E4D4]'
            }`}
          />
        ))}
      </div>

      {/* Level Labels */}
      <div className="flex justify-between text-[10px] text-[#6B7C6B] mb-4 px-1">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
      </div>

      {/* Last Assessment */}
      <div className="border-t border-[#D4E4D4] pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7C6B]">Last Assessed:</span>
          <span className="text-gray-800">{lastAssessment || 'Not yet'}</span>
        </div>

        {/* Coach Notes Preview */}
        {coachNotes && (
          <div className="mt-3 p-2 bg-[#F5F9F5] rounded-lg border border-[#D4E4D4]">
            <p className="text-[10px] text-[#6B7C6B] uppercase tracking-wide mb-1">Latest Note</p>
            <p className="text-xs text-gray-800 leading-relaxed line-clamp-2">{coachNotes}</p>
          </div>
        )}

        {/* Tap for details hint */}
        <p className="text-[10px] text-[#6B7C6B] text-center mt-3 group-hover:text-[#00A651] transition-colors">
          Tap for details
        </p>
      </div>
    </button>
  );
};

export default SkillCard;
