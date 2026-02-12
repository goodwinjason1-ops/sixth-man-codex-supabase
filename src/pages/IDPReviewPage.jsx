import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/PageShell';
import {
  Target,
  Save,
  Loader2,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import {
  SKILL_CATEGORIES,
  GOAL_STATUSES,
  REVIEW_TYPES,
  sampleIDPs
} from '../data/sampleIDPs';

const LEVEL_LABELS = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Confident Leader'
};

const LEVEL_COLORS = {
  1: 'bg-[#D4E4D4] text-gray-800',
  2: 'bg-[#005028] text-white',
  3: 'bg-[#00A651] text-white',
  4: 'bg-[#86efac] text-gray-800'
};

const STATUS_ICONS = {
  not_started: Clock,
  in_progress: TrendingUp,
  achieved: CheckCircle,
  needs_more_time: AlertCircle
};

const IDPReviewPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Find the plan from sample data
  const plan = useMemo(() => {
    return sampleIDPs.find(p => p.id === planId) || null;
  }, [planId]);

  // State for the review form
  const [reviewType, setReviewType] = useState('mid_season');
  const [goalsProgress, setGoalsProgress] = useState(() => {
    if (!plan) return [];
    return plan.goals.map(goal => ({
      goalId: goal.id,
      status: goal.status,
      note: ''
    }));
  });
  const [assessedSkills, setAssessedSkills] = useState({});
  const [coachComments, setCoachComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewTypeOpen, setReviewTypeOpen] = useState(false);

  // Get current skill levels — last review's assessed skills merged over baseline
  const currentSkillLevels = useMemo(() => {
    if (!plan) return {};
    const baseline = { ...plan.baselineAssessment.skills };
    // Apply any assessed skills from previous reviews (in order)
    plan.reviews.forEach(review => {
      if (review.assessedSkills) {
        Object.entries(review.assessedSkills).forEach(([skillId, level]) => {
          baseline[skillId] = level;
        });
      }
    });
    return baseline;
  }, [plan]);

  // Handle goal status change
  const updateGoalStatus = (goalId, newStatus) => {
    setGoalsProgress(prev =>
      prev.map(gp =>
        gp.goalId === goalId ? { ...gp, status: newStatus } : gp
      )
    );
  };

  // Handle goal note change
  const updateGoalNote = (goalId, note) => {
    setGoalsProgress(prev =>
      prev.map(gp =>
        gp.goalId === goalId ? { ...gp, note } : gp
      )
    );
  };

  // Handle skill level change
  const updateSkillLevel = (skillId, level) => {
    setAssessedSkills(prev => {
      // If clicking the same level, toggle it off (remove reassessment)
      if (prev[skillId] === level) {
        const next = { ...prev };
        delete next[skillId];
        return next;
      }
      return { ...prev, [skillId]: level };
    });
  };

  // Save review
  const handleSaveReview = async () => {
    setSaving(true);

    const review = {
      date: new Date(),
      type: reviewType,
      assessedSkills: Object.keys(assessedSkills).length > 0 ? assessedSkills : null,
      coachComments,
      goalsProgress: goalsProgress.map(({ goalId, status, note }) => ({
        goalId,
        status,
        note
      }))
    };

    // Log to console since we cannot update sample data
    console.log('Review saved:', review);
    console.log('Plan ID:', planId);

    // Simulate a brief save delay
    await new Promise(resolve => setTimeout(resolve, 800));

    setSaving(false);
    navigate(-1);
  };

  // Get the skill category label from its id
  const getSkillLabel = (skillId) => {
    const cat = SKILL_CATEGORIES.find(c => c.id === skillId);
    return cat ? cat.label : skillId;
  };

  // Error state - plan not found
  if (!plan) {
    return (
      <PageShell
        title="Review Not Found"
        backTo="/development-plans"
      >
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle size={48} className="text-[#6B7C6B] mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Development Plan Not Found
          </h2>
          <p className="text-[#6B7C6B] text-sm text-center max-w-md mb-6">
            The development plan you are looking for does not exist or may have been removed.
          </p>
          <button
            onClick={() => navigate('/development-plans')}
            className="px-4 py-2 bg-[#005028] text-white rounded-lg hover:bg-[#005028]/90 transition-colors"
          >
            Back to Development Plans
          </button>
        </div>
      </PageShell>
    );
  }

  const selectedReviewType = REVIEW_TYPES.find(rt => rt.id === reviewType);

  return (
    <PageShell
      title="Review Development Plan"
      subtitle={plan.playerName}
      backTo={`/development-plans/${planId}`}
    >
      <div className="space-y-6">

        {/* A. Plan Summary */}
        <section className="bg-white rounded-xl border border-[#D4E4D4] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-[#005028]" />
            <h2 className="text-lg font-semibold text-gray-800">Plan Summary</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-[#6B7C6B] uppercase tracking-wide">Player</p>
              <p className="text-sm font-medium text-gray-800">{plan.playerName}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7C6B] uppercase tracking-wide">Season</p>
              <p className="text-sm font-medium text-gray-800">{plan.season}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7C6B] uppercase tracking-wide">Baseline Date</p>
              <p className="text-sm font-medium text-gray-800">
                {plan.baselineAssessment.date.toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B7C6B] uppercase tracking-wide">Status</p>
              <p className="text-sm font-medium text-gray-800 capitalize">
                {plan.status.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Current goals summary */}
          <div>
            <p className="text-xs text-[#6B7C6B] uppercase tracking-wide mb-2">Current Goals</p>
            <div className="space-y-2">
              {plan.goals.map(goal => {
                const statusDef = GOAL_STATUSES.find(s => s.id === goal.status);
                const StatusIcon = STATUS_ICONS[goal.status] || Clock;
                return (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 py-2 px-3 bg-[#F5F9F5] rounded-lg"
                  >
                    <StatusIcon size={16} className="text-[#6B7C6B] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {getSkillLabel(goal.skillCategory)}: Level {goal.currentLevel} → {goal.targetLevel}
                      </p>
                    </div>
                    {statusDef && (
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusDef.color}`}>
                        {statusDef.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* B. Review Type Selector */}
        <section className="bg-white rounded-xl border border-[#D4E4D4] p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Review Type</h2>
          <div className="relative">
            <button
              onClick={() => setReviewTypeOpen(!reviewTypeOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-sm text-gray-800 hover:border-[#005028] transition-colors"
            >
              <span>{selectedReviewType?.label || 'Select review type'}</span>
              <ChevronDown
                size={18}
                className={`text-[#6B7C6B] transition-transform ${reviewTypeOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {reviewTypeOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-[#D4E4D4] rounded-lg shadow-lg overflow-hidden">
                {REVIEW_TYPES.map(rt => (
                  <button
                    key={rt.id}
                    onClick={() => {
                      setReviewType(rt.id);
                      setReviewTypeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      reviewType === rt.id
                        ? 'bg-[#005028] text-white'
                        : 'text-gray-800 hover:bg-[#F5F9F5]'
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* C. Goal Status Updates */}
        <section className="bg-white rounded-xl border border-[#D4E4D4] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-[#005028]" />
            <h2 className="text-lg font-semibold text-gray-800">Goal Progress</h2>
          </div>

          <div className="space-y-5">
            {plan.goals.map((goal, idx) => {
              const progress = goalsProgress.find(gp => gp.goalId === goal.id);
              return (
                <div
                  key={goal.id}
                  className="border border-[#D4E4D4] rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#005028] bg-[#D4E4D4] px-2 py-0.5 rounded">
                      Goal {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {getSkillLabel(goal.skillCategory)}
                    </span>
                  </div>

                  <p className="text-sm text-[#6B7C6B] mb-1">
                    Level {goal.currentLevel} <ArrowRight size={12} className="inline mx-1" /> Level {goal.targetLevel}
                  </p>
                  <p className="text-sm text-gray-800 mb-3">{goal.specificTarget}</p>

                  {/* Status selector */}
                  <div className="mb-3">
                    <label className="text-xs text-[#6B7C6B] uppercase tracking-wide block mb-1.5">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_STATUSES.map(status => {
                        const isSelected = progress?.status === status.id;
                        return (
                          <button
                            key={status.id}
                            onClick={() => updateGoalStatus(goal.id, status.id)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              isSelected
                                ? `${status.color} text-white border-transparent`
                                : 'border-[#D4E4D4] text-[#6B7C6B] hover:border-[#005028] hover:text-[#005028]'
                            }`}
                          >
                            {status.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Note input */}
                  <div>
                    <label className="text-xs text-[#6B7C6B] uppercase tracking-wide block mb-1.5">
                      Progress Note
                    </label>
                    <input
                      type="text"
                      value={progress?.note || ''}
                      onChange={(e) => updateGoalNote(goal.id, e.target.value)}
                      placeholder="Add a note about progress..."
                      className="w-full px-3 py-2 text-sm border border-[#D4E4D4] rounded-lg bg-[#F5F9F5] text-gray-800 placeholder-[#6B7C6B]/60 focus:outline-none focus:ring-2 focus:ring-[#005028]/30 focus:border-[#005028] transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* D. Skill Reassessment */}
        <section className="bg-white rounded-xl border border-[#D4E4D4] p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={20} className="text-[#005028]" />
            <h2 className="text-lg font-semibold text-gray-800">Skill Reassessment</h2>
          </div>
          <p className="text-xs text-[#6B7C6B] mb-4">
            Optionally update skill levels. Click a level to set it, click again to clear.
          </p>

          <div className="space-y-4">
            {SKILL_CATEGORIES.map(category => {
              const baselineLevel = currentSkillLevels[category.id] || 0;
              const newLevel = assessedSkills[category.id];
              return (
                <div key={category.id} className="border border-[#D4E4D4] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">{category.label}</span>
                    <span className="text-xs text-[#6B7C6B]">
                      Current: Level {baselineLevel} ({LEVEL_LABELS[baselineLevel] || 'N/A'})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(level => {
                      const isSelected = newLevel === level;
                      const isCurrent = baselineLevel === level && !newLevel;
                      return (
                        <button
                          key={level}
                          onClick={() => updateSkillLevel(category.id, level)}
                          className={`flex-1 py-2 px-1 rounded-lg text-center text-xs font-medium border transition-all ${
                            isSelected
                              ? `${LEVEL_COLORS[level]} border-transparent ring-2 ring-[#005028]/30`
                              : isCurrent
                              ? 'border-[#005028] bg-[#F5F9F5] text-[#005028]'
                              : 'border-[#D4E4D4] text-[#6B7C6B] hover:border-[#005028]/50'
                          }`}
                          title={LEVEL_LABELS[level]}
                        >
                          <div className="font-bold text-base">{level}</div>
                          <div className="hidden sm:block truncate">{LEVEL_LABELS[level]}</div>
                        </button>
                      );
                    })}
                  </div>
                  {newLevel && newLevel !== baselineLevel && (
                    <p className="text-xs mt-2 text-[#00A651] font-medium">
                      {newLevel > baselineLevel ? 'Improved' : 'Adjusted'}: Level {baselineLevel} → Level {newLevel}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* E. Coach Comments */}
        <section className="bg-white rounded-xl border border-[#D4E4D4] p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={20} className="text-[#005028]" />
            <h2 className="text-lg font-semibold text-gray-800">Coach Comments</h2>
          </div>
          <textarea
            value={coachComments}
            onChange={(e) => setCoachComments(e.target.value)}
            rows={4}
            placeholder="Overall comments on player development, areas of focus, next steps..."
            className="w-full px-3 py-2.5 text-sm border border-[#D4E4D4] rounded-lg bg-[#F5F9F5] text-gray-800 placeholder-[#6B7C6B]/60 focus:outline-none focus:ring-2 focus:ring-[#005028]/30 focus:border-[#005028] transition-colors resize-none"
          />
        </section>

        {/* F. Baseline vs Current Comparison */}
        <section className="bg-white rounded-xl border border-[#D4E4D4] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-[#005028]" />
            <h2 className="text-lg font-semibold text-gray-800">Skill Comparison</h2>
          </div>
          <p className="text-xs text-[#6B7C6B] mb-4">
            Baseline vs current level for each skill category.
          </p>

          <div className="space-y-4">
            {SKILL_CATEGORIES.map(category => {
              const baselineLevel = plan.baselineAssessment.skills[category.id] || 0;
              const currentLevel = assessedSkills[category.id] || currentSkillLevels[category.id] || baselineLevel;
              const baselineWidth = (baselineLevel / 4) * 100;
              const currentWidth = (currentLevel / 4) * 100;

              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800">{category.label}</span>
                    <span className="text-xs text-[#6B7C6B]">
                      {baselineLevel !== currentLevel
                        ? `${baselineLevel} → ${currentLevel}`
                        : `Level ${baselineLevel}`
                      }
                    </span>
                  </div>

                  {/* Baseline bar */}
                  <div className="relative h-3 bg-gray-100 rounded-full mb-1.5 overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gray-300 rounded-full transition-all duration-300"
                      style={{ width: `${baselineWidth}%` }}
                    />
                  </div>

                  {/* Current bar */}
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#00A651] rounded-full transition-all duration-300"
                      style={{ width: `${currentWidth}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-[#6B7C6B]">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                      Baseline
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#6B7C6B]">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#00A651]" />
                      Current
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* G. Save Button */}
        <div className="pb-4">
          <button
            onClick={handleSaveReview}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#005028] text-white font-semibold rounded-xl hover:bg-[#005028]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Saving Review...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Save Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default IDPReviewPage;
