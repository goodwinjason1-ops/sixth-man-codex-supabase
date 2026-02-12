import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { getProgram, getProgramSummaries } from '../../services/youthProgramService';
import { PROGRAM_TYPES, PROGRAM_CONFIG } from '../../data/youthPrograms';
import SessionSummaryCard from '../../components/youth/SessionSummaryCard';

const SessionSummaryHistory = () => {
  const { programId } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!programId) return;
    const load = async () => {
      const [progResult, summResult] = await Promise.all([
        getProgram(programId),
        getProgramSummaries(programId)
      ]);
      if (progResult.success) setProgram(progResult.data);
      else setError('Program not found');
      if (summResult.success) setSummaries(summResult.data);
      setLoading(false);
    };
    load();
  }, [programId]);

  const config = program ? (PROGRAM_CONFIG[program.programType] || PROGRAM_CONFIG[PROGRAM_TYPES.LITTLE_LAKERS]) : null;
  const isLittleLakers = program?.programType === PROGRAM_TYPES.LITTLE_LAKERS;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00A651] animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold">Program not found</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-[#00A651] hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F5] pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} p-4 pb-6`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/youth-programs/${programId}`)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Session History</h1>
              <p className="text-white/80 text-sm">{program.name}</p>
            </div>
            <span className="text-3xl">{isLittleLakers ? '\uD83C\uDFC0' : '\uD83C\uDF1F'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Write New Summary Button */}
        <button
          onClick={() => navigate(`/youth-programs/${programId}/session-summary`)}
          className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
        >
          <Plus className="w-5 h-5" />
          Write New Summary
        </button>

        {/* Summary Count */}
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <FileText className="w-4 h-4" />
          <span>{summaries.length} session {summaries.length === 1 ? 'summary' : 'summaries'}</span>
        </div>

        {/* Summaries List */}
        {summaries.length > 0 ? (
          <div className="space-y-4">
            {summaries.map(summary => (
              <SessionSummaryCard
                key={summary.id}
                summary={summary}
                programConfig={config}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No summaries yet</p>
            <p className="text-gray-400 text-sm mt-1">Write your first session summary after a session!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSummaryHistory;
