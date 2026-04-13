import React from 'react';
import { X, Dumbbell } from 'lucide-react';
import { SKILL_CATEGORIES } from '../data/skillBenchmarks';

const TrainingPlanPreviewModal = ({ plan, onClose }) => {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-2xl max-h-[95vh] bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#F5F9F5] p-4 z-10 border-b border-[#D4E4D4]">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-800 truncate">{plan.name || 'Untitled Plan'}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[#00A651] text-sm">
                  {plan.sessions?.length || 0} session{(plan.sessions?.length || 0) !== 1 ? 's' : ''}
                  {' \u2022 '}
                  {(plan.sessions || []).reduce((t, s) => t + (s.drills?.length || 0), 0)} drills
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651] transition-colors flex-shrink-0 ml-3"
            >
              <X className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-6 bg-white">
          {/* Plan Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            {plan.description && (
              <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {plan.coachName && (
                <div>
                  <span className="text-[#6B7C6B]">Coach:</span>
                  <p className="text-gray-800 font-medium">{plan.coachName}</p>
                </div>
              )}
              <div>
                <span className="text-[#6B7C6B]">Team:</span>
                <p className="text-gray-800 font-medium">{plan.teamName || plan.ageGroup || '-'}</p>
              </div>
              <div>
                <span className="text-[#6B7C6B]">Date Range:</span>
                <p className="text-gray-800 font-medium">
                  {plan.dateRange?.start ? new Date(plan.dateRange.start).toLocaleDateString('en-AU') : '-'}
                  {plan.dateRange?.end && plan.dateRange.end >= plan.dateRange?.start
                    ? ` - ${new Date(plan.dateRange.end).toLocaleDateString('en-AU')}`
                    : (plan.sessions?.length > 1 ? ' — End date not set' : '')}
                </p>
              </div>
            </div>
            {plan.focusAreas && plan.focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {plan.focusAreas.map((area, idx) => {
                  const skill = SKILL_CATEGORIES.find(s => s.id === area);
                  return (
                    <span key={idx} className="px-3 py-1 bg-[#005028]/10 text-[#00A651] rounded-full text-xs">
                      {skill?.name || area}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sessions */}
          {plan.sessions && plan.sessions.length > 0 ? (
            plan.sessions.map((session, index) => (
              <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#005028] rounded-lg flex items-center justify-center text-white font-bold">
                    {session.sessionNumber || index + 1}
                  </div>
                  <div>
                    <h4 className="text-gray-800 font-bold">{session.name || `Session ${index + 1}`}</h4>
                    <p className="text-[#6B7C6B] text-sm">
                      {session.date ? new Date(session.date).toLocaleDateString('en-AU') : 'No date'}
                      {session.duration ? ` \u2022 ${session.duration} mins` : ''}
                    </p>
                  </div>
                </div>

                {session.warmUp && (
                  <div className="mb-3">
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Warm-up</h5>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{session.warmUp}</p>
                  </div>
                )}

                {session.drills && session.drills.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Drills ({session.drills.length})</h5>
                    <div className="space-y-2">
                      {session.drills.map((drill, di) => (
                        <div key={di} className="bg-[#F5F9F5] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800 text-sm">{drill.name}</span>
                            {drill.duration && <span className="text-[#6B7C6B] text-xs">{drill.duration} mins</span>}
                          </div>
                          {drill.description && <p className="text-gray-600 text-xs">{drill.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {session.smallSidedGames && (
                  <div className="mb-3">
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Games</h5>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{session.smallSidedGames}</p>
                  </div>
                )}

                {session.coolDown && (
                  <div className="mb-3">
                    <h5 className="text-sm font-semibold text-gray-700 mb-1">Cool-down</h5>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{session.coolDown}</p>
                  </div>
                )}

                {session.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-yellow-800 mb-1">Coach Notes</h5>
                    <p className="text-yellow-700 text-sm whitespace-pre-wrap">{session.notes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="w-10 h-10 text-[#6B7C6B] mx-auto mb-2" />
              <p className="text-[#6B7C6B] text-sm">No sessions defined in this plan</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#D4E4D4] p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-800 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingPlanPreviewModal;
