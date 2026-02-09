import React, { useState } from 'react';
import { FlaskConical, RotateCcw, ShieldAlert } from 'lucide-react';
import PracticeAssessor from './PracticeAssessor';
import PracticeAttendance from './PracticeAttendance';
import PracticeMatchAssessment from './PracticeMatchAssessment';
import PracticeAdminTryout from './PracticeAdminTryout';

const practiceComponents = {
  'assessor': PracticeAssessor,
  'attendance': PracticeAttendance,
  'match-assessment': PracticeMatchAssessment,
  'admin-tryout': PracticeAdminTryout,
};

const practiceLabels = {
  'assessor': 'Assessor Sandbox',
  'attendance': 'Attendance Sandbox',
  'match-assessment': 'Match Assessment Sandbox',
  'admin-tryout': 'Admin Tryout Sandbox',
};

const PracticeArea = ({ practiceId }) => {
  const [resetKey, setResetKey] = useState(0);

  const PracticeComponent = practiceComponents[practiceId];

  if (!PracticeComponent) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] flex items-center justify-center p-4">
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-6 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-[#4ade80] mx-auto mb-4" />
          <h2 className="text-white font-bold text-lg mb-2">Practice Area Not Found</h2>
          <p className="text-white/60 text-sm">
            No practice sandbox exists for "{practiceId}".
          </p>
        </div>
      </div>
    );
  }

  const handleReset = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Practice Mode Header Banner */}
      <div className="bg-amber-600/20 border-b border-amber-500/40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-amber-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/50">
                  Practice Mode
                </span>
                <span className="text-white/60 text-xs truncate hidden sm:inline">
                  {practiceLabels[practiceId] || 'Sandbox'}
                </span>
              </div>
              <p className="text-amber-300/70 text-xs mt-0.5">
                Nothing you do here is saved
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-300 text-sm font-medium transition-colors min-w-[44px] min-h-[44px] justify-center"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Sandbox Content */}
      <div key={resetKey}>
        <PracticeComponent />
      </div>

      {/* Bottom Disclaimer */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-600/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <FlaskConical className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-medium">This is a practice sandbox</p>
              <p className="text-amber-300/60 text-xs mt-1">
                All data shown here is fake. Nothing you do will be saved to the database.
                Use this space to learn how the interface works before using the real thing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeArea;
