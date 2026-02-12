import React, { useEffect } from 'react';
import { X, TrendingUp, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';

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

const levelTextColors = {
  1: 'text-[#6B7C6B]',
  2: 'text-[#00A651]',
  3: 'text-[#00A651]',
  4: 'text-[#86efac]'
};

const SkillDetailModal = ({ skill, onClose }) => {
  const { name, icon: Icon, level, description, levelDefinitions, assessmentHistory } = skill;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" />

      {/* Modal Content */}
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] bg-white border-2 border-[#D4E4D4] rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slideUp sm:animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#F5F9F5] border-b border-[#D4E4D4] p-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white border-2 border-[#D4E4D4] rounded-xl flex items-center justify-center">
              <Icon className="w-7 h-7 text-[#00A651]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">{name}</h2>
              <p className={`text-sm font-medium ${levelTextColors[level]}`}>
                Level {level}: {levelLabels[level]}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white border border-[#D4E4D4] rounded-full flex items-center justify-center hover:bg-gray-100 hover:border-[#00A651] transition-all"
            >
              <X className="w-5 h-5 text-gray-800" />
            </button>
          </div>

          {/* Current Level Progress */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((dot) => (
              <div
                key={dot}
                className={`flex-1 h-3 rounded-full transition-all duration-500 ${
                  dot <= level
                    ? levelColors[dot]
                    : 'bg-white border border-[#D4E4D4]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4 space-y-5">
          {/* Skill Description */}
          <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
            <h3 className="text-gray-800 font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00A651]" />
              About This Skill
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
          </div>

          {/* Level Definitions */}
          <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
            <h3 className="text-gray-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00A651]" />
              Level Definitions
            </h3>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={`p-3 rounded-lg border transition-all ${
                    lvl === level
                      ? 'bg-white border-[#00A651]'
                      : 'bg-[#F5F9F5]/50 border-[#D4E4D4]/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${levelColors[lvl]}`} />
                    <span className={`text-xs font-semibold ${lvl === level ? levelTextColors[lvl] : 'text-[#6B7C6B]'}`}>
                      Level {lvl}: {levelLabels[lvl]}
                    </span>
                    {lvl === level && (
                      <span className="ml-auto text-[10px] bg-[#005028] text-white px-2 py-0.5 rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed ${lvl === level ? 'text-gray-800' : 'text-gray-500'}`}>
                    {levelDefinitions[lvl]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment History */}
          <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
            <h3 className="text-gray-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00A651]" />
              Assessment History
            </h3>
            <div className="space-y-3">
              {assessmentHistory.map((assessment, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    index === 0
                      ? 'bg-white border-[#00A651]'
                      : 'bg-[#F5F9F5]/50 border-[#D4E4D4]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#00A651] font-medium">{assessment.date}</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${levelColors[assessment.level]}`} />
                      <span className="text-xs text-gray-800">Level {assessment.level}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700">{assessment.coach}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Notes History */}
          <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
            <h3 className="text-gray-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00A651]" />
              Coach Notes History
            </h3>
            <div className="space-y-3">
              {assessmentHistory.map((assessment, index) => (
                <div
                  key={index}
                  className="p-3 bg-white rounded-lg border border-[#D4E4D4]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#00A651]">{assessment.date}</span>
                    <span className="text-[10px] text-[#6B7C6B]">{assessment.coach}</span>
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed">{assessment.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Over Time */}
          <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
            <h3 className="text-gray-800 font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00A651]" />
              Progress Over Time
            </h3>
            <div className="flex items-end justify-between h-24 gap-2 px-2">
              {assessmentHistory.slice().reverse().map((assessment, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-lg ${levelColors[assessment.level]} transition-all duration-500`}
                    style={{ height: `${(assessment.level / 4) * 100}%` }}
                  />
                  <span className="text-[8px] text-[#6B7C6B] text-center leading-tight">
                    {assessment.date.split(',')[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-2">
              <span className="text-[10px] text-[#6B7C6B]">Oldest</span>
              <span className="text-[10px] text-[#6B7C6B]">Latest</span>
            </div>
          </div>
        </div>

        {/* Close Button Footer */}
        <div className="sticky bottom-0 p-4 bg-[#F5F9F5] border-t border-[#D4E4D4]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#D4E4D4] hover:bg-[#00A651] text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillDetailModal;
