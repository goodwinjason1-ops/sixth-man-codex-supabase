import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { DEFAULT_BENCHMARKS, LEVEL_LABELS } from '../data/skillBenchmarks';

const levelColors = {
  1: 'border-[#1a8a68] bg-[#1a8a68]/20',
  2: 'border-[#22c55e] bg-[#22c55e]/20',
  3: 'border-[#4ade80] bg-[#4ade80]/20',
  4: 'border-[#86efac] bg-[#86efac]/20'
};

const levelBadgeColors = {
  1: 'bg-[#1a8a68]',
  2: 'bg-[#22c55e]',
  3: 'bg-[#4ade80]',
  4: 'bg-[#86efac]'
};

/**
 * SkillBenchmarkView - Displays age-appropriate benchmark criteria for a skill
 *
 * Props:
 * - skillId: The skill category ID (e.g., 'ball-handling')
 * - skillName: Display name of the skill
 * - ageGroupId: The age group ID (e.g., 'u10')
 * - currentLevel: The currently assessed level (1-4) - highlights this level
 * - onClose: Function to close the view
 * - isModal: If true, renders as modal overlay; if false, renders inline
 */
const SkillBenchmarkView = ({
  skillId,
  skillName,
  ageGroupId,
  currentLevel = 0,
  onClose,
  isModal = true
}) => {
  const { fetchDocument } = useData();
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState({});

  // Fetch benchmark from Firestore or fall back to default data
  useEffect(() => {
    const loadBenchmark = async () => {
      setLoading(true);
      try {
        const docId = `${ageGroupId.toLowerCase()}_${skillId}`;

        // Try to fetch from Firestore first
        if (fetchDocument) {
          try {
            const firestoreBenchmark = await fetchDocument('skill_benchmarks', docId);
            if (firestoreBenchmark) {
              setBenchmark(firestoreBenchmark);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.log('Firestore benchmark not found, using default:', error);
          }
        }

        // Fall back to default data
        const defaultBenchmark = DEFAULT_BENCHMARKS[docId];
        if (defaultBenchmark) {
          setBenchmark(defaultBenchmark);
        } else {
          // Create generic placeholder if no benchmark exists
          setBenchmark({
            ageGroupId,
            skillId,
            skillName,
            levels: {
              1: { label: LEVEL_LABELS[1], criteria: ['No criteria defined yet'] },
              2: { label: LEVEL_LABELS[2], criteria: ['No criteria defined yet'] },
              3: { label: LEVEL_LABELS[3], criteria: ['No criteria defined yet'] },
              4: { label: LEVEL_LABELS[4], criteria: ['No criteria defined yet'] }
            }
          });
        }
      } catch (error) {
        console.error('Error loading benchmark:', error);
      } finally {
        setLoading(false);
      }
    };

    if (skillId && ageGroupId) {
      loadBenchmark();
    }
  }, [skillId, ageGroupId, fetchDocument]);

  // Auto-expand current level when set
  useEffect(() => {
    if (currentLevel > 0) {
      setExpandedLevels({ [currentLevel]: true });
    }
  }, [currentLevel]);

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const content = (
    <div className={`bg-[#0d5943] ${isModal ? 'border-2 border-[#1a8a68] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col' : 'rounded-xl'}`}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1a8a68] flex items-center justify-between sticky top-0 bg-[#0d5943] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
            <Info className="w-5 h-5 text-[#4ade80]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{skillName}</h3>
            <p className="text-[#4ade80] text-xs">
              {benchmark?.ageGroupName || ageGroupId.toUpperCase()} Benchmarks
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center hover:bg-[#1a8a68] transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
          </div>
        ) : (
          [1, 2, 3, 4].map((level) => {
            const levelData = benchmark?.levels?.[level] || {
              label: LEVEL_LABELS[level],
              criteria: []
            };
            const isExpanded = expandedLevels[level];
            const isCurrentLevel = currentLevel === level;
            const hasCriteria = levelData.criteria && levelData.criteria.length > 0;

            return (
              <div
                key={level}
                className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
                  isCurrentLevel
                    ? `${levelColors[level]} ring-2 ring-[#4ade80]`
                    : 'border-[#1a8a68] bg-[#0a3d2e]'
                }`}
              >
                <button
                  onClick={() => toggleLevel(level)}
                  className="w-full px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${levelBadgeColors[level]} flex items-center justify-center`}>
                      <span className="text-[#0a3d2e] font-bold">{level}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-white font-medium">{levelData.label}</span>
                      {isCurrentLevel && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 bg-[#4ade80] text-[#0a3d2e] rounded-full font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasCriteria && (
                      <span className="text-[#1a8a68] text-xs">
                        {levelData.criteria.length} criteria
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#4ade80]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#1a8a68]" />
                    )}
                  </div>
                </button>

                {/* Criteria List */}
                <div className={`overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'max-h-96' : 'max-h-0'
                }`}>
                  <div className="px-4 pb-4 space-y-2">
                    {hasCriteria ? (
                      levelData.criteria.map((criterion, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                          <span className="text-white/90">{criterion}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#1a8a68] text-sm italic">
                        No criteria defined for this level yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {isModal && (
        <div className="px-4 py-3 border-t border-[#1a8a68] bg-[#0a3d2e]">
          <p className="text-[#1a8a68] text-xs text-center">
            Tap a level to view assessment criteria
          </p>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * SkillBenchmarkButton - A small button/indicator that shows benchmark info is available
 * Clicking opens the SkillBenchmarkView modal
 */
export const SkillBenchmarkButton = ({
  skillId,
  skillName,
  ageGroupId,
  currentLevel = 0
}) => {
  const [showBenchmark, setShowBenchmark] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowBenchmark(true)}
        className="flex items-center gap-1 px-2 py-1 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-[10px] text-[#4ade80] hover:border-[#22c55e] hover:text-[#22c55e] transition-colors"
        title="View benchmark criteria"
      >
        <Info className="w-3 h-3" />
        <span className="hidden sm:inline">Benchmarks</span>
      </button>

      {showBenchmark && (
        <SkillBenchmarkView
          skillId={skillId}
          skillName={skillName}
          ageGroupId={ageGroupId}
          currentLevel={currentLevel}
          onClose={() => setShowBenchmark(false)}
          isModal={true}
        />
      )}
    </>
  );
};

export default SkillBenchmarkView;
