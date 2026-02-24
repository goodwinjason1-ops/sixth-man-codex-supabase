import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/PageShell';
import FirstTimeHint from '../components/tutorial/FirstTimeHint';
import {
  Target,
  Award,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Star,
  Plus,
  MessageSquare,
  Eye,
  EyeOff,
  Edit3,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { SKILL_CATEGORIES, GOAL_STATUSES, sampleIDPs } from '../data/sampleIDPs';
import { STAFF_ROLES } from '../constants/roles';

const PlayerIDPPage = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { players, updateDocument } = useData();
  const { userProfile } = useAuth();

  const [expandedReviews, setExpandedReviews] = useState({});
  const [parentVisible, setParentVisible] = useState(false);

  // Load IDP from sample data (will switch to Firestore collection later)
  const idp = useMemo(() => {
    return sampleIDPs.find(plan => plan.playerId === playerId) || null;
  }, [playerId]);

  // Sync parentVisible state with IDP data
  useEffect(() => {
    if (idp) {
      setParentVisible(idp.parentVisible);
    }
  }, [idp]);

  // Check if current user is a coach/staff member
  const isCoachOrStaff = useMemo(() => {
    return STAFF_ROLES.includes(userProfile?.role);
  }, [userProfile]);

  // Get player info from players collection as fallback
  const playerInfo = useMemo(() => {
    if (idp) {
      return { name: idp.playerName, team: idp.teamId };
    }
    const player = players.find(p => p.id === playerId);
    return player ? { name: player.name, team: player.team } : { name: 'Unknown Player', team: '' };
  }, [idp, players, playerId]);

  // Build radar chart data: baseline vs latest assessment
  const radarData = useMemo(() => {
    if (!idp) return [];

    const baselineSkills = idp.baselineAssessment?.skills || {};

    // Merge all review assessedSkills to get the latest value per skill
    const latestSkills = { ...baselineSkills };
    if (idp.reviews && idp.reviews.length > 0) {
      // Reviews are chronological; iterate forward so later reviews overwrite earlier
      idp.reviews.forEach(review => {
        if (review.assessedSkills) {
          Object.entries(review.assessedSkills).forEach(([skillId, value]) => {
            latestSkills[skillId] = value;
          });
        }
      });
    }

    return SKILL_CATEGORIES.map(cat => ({
      skill: cat.label,
      Baseline: baselineSkills[cat.id] || 0,
      Latest: latestSkills[cat.id] || 0
    }));
  }, [idp]);

  // Toggle a review's expanded/collapsed state
  const toggleReview = (index) => {
    setExpandedReviews(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Handle parent visible toggle
  const handleToggleParentVisible = async () => {
    const newValue = !parentVisible;
    setParentVisible(newValue);
    if (idp?.id) {
      await updateDocument('development_plans', idp.id, { parentVisible: newValue });
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border border-blue-300';
      case 'archived':
        return 'bg-gray-100 text-gray-600 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-300';
    }
  };

  // Get goal status info from GOAL_STATUSES constant
  const getGoalStatus = (statusId) => {
    return GOAL_STATUSES.find(s => s.id === statusId) || GOAL_STATUSES[0];
  };

  // Get goal status icon
  const getGoalStatusIcon = (statusId) => {
    switch (statusId) {
      case 'achieved':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'needs_more_time':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Get skill category label
  const getSkillLabel = (categoryId) => {
    const cat = SKILL_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.label : categoryId;
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get review type label
  const getReviewTypeLabel = (type) => {
    const labels = {
      start_of_season: 'Start of Season',
      mid_season: 'Mid-Season',
      end_of_season: 'End of Season',
      ad_hoc: 'Ad Hoc'
    };
    return labels[type] || type;
  };

  // Empty state: no IDP exists for this player
  if (!idp) {
    return (
      <PageShell
        title="Development Plan"
        subtitle={playerInfo.name}
        backTo={`/players/${playerId}`}
      >
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-10 text-center max-w-md">
            <Target className="w-16 h-16 text-[#D4E4D4] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              No Development Plan Yet
            </h2>
            <p className="text-[#6B7C6B] mb-6">
              An Individual Development Plan helps track skill goals, progress reviews,
              and targeted practice recommendations.
            </p>
            {isCoachOrStaff && (
              <FirstTimeHint hintKey="create-idp">
                <button
                  onClick={() => navigate(`/players/${playerId}/development-plan/new`)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A651] text-white font-semibold rounded-lg hover:bg-[#008c44] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Development Plan
                </button>
              </FirstTimeHint>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Development Plan"
      subtitle={`${idp.playerName} - ${idp.season}`}
      backTo={`/players/${playerId}`}
    >
      <div className="space-y-6">

        {/* A. Header Section */}
        <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-gray-800">{idp.playerName}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(idp.status)}`}>
                  {idp.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[#6B7C6B] text-sm">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {idp.teamId}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {idp.season}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B7C6B]">
              <span>Overall Baseline: </span>
              <span className="text-lg font-bold text-[#005028]">
                {idp.baselineAssessment?.overallLevel?.toFixed(1)}
              </span>
              <span className="text-xs">/4.0</span>
            </div>
          </div>
        </div>

        {/* B. Radar Chart */}
        <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#00A651]" />
            <h3 className="text-lg font-bold text-gray-800">Skill Assessment Overview</h3>
          </div>
          <div className="w-full" style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#D4E4D4" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: '#6B7C6B', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 4]}
                  tickCount={5}
                  tick={{ fill: '#6B7C6B', fontSize: 10 }}
                />
                <Radar
                  name="Baseline"
                  dataKey="Baseline"
                  stroke="#D4E4D4"
                  fill="#D4E4D4"
                  fillOpacity={0.5}
                />
                <Radar
                  name="Latest"
                  dataKey="Latest"
                  stroke="#00A651"
                  fill="#00A651"
                  fillOpacity={0.3}
                />
                <Legend
                  wrapperStyle={{ fontSize: 13, color: '#6B7C6B' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* C. Goals Section */}
        <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#00A651]" />
            <h3 className="text-lg font-bold text-gray-800">Development Goals</h3>
          </div>
          <div className="space-y-4">
            {idp.goals.map((goal) => {
              const goalStatus = getGoalStatus(goal.status);
              return (
                <div
                  key={goal.id}
                  className="border border-[#D4E4D4] rounded-lg p-5 bg-[#F5F9F5] hover:border-[#00A651]/40 transition-colors"
                >
                  {/* Goal header: skill + level target */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-[#D4E4D4]">
                        <Award className="w-5 h-5 text-[#005028]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {getSkillLabel(goal.skillCategory)}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-[#6B7C6B] mt-0.5">
                          <span className="font-medium text-gray-800">Level {goal.currentLevel}</span>
                          <ArrowRight className="w-4 h-4 text-[#00A651]" />
                          <span className="font-medium text-[#00A651]">Level {goal.targetLevel}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${goalStatus.color}`}>
                      {getGoalStatusIcon(goal.status)}
                      {goalStatus.label}
                    </span>
                  </div>

                  {/* Specific target */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium text-[#6B7C6B]">Target: </span>
                      {goal.specificTarget}
                    </p>
                  </div>

                  {/* Drills & home practice */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {goal.drillsRecommended && goal.drillsRecommended.length > 0 && (
                      <div className="p-3 bg-white rounded-lg border border-[#D4E4D4]">
                        <p className="text-xs font-semibold text-[#6B7C6B] mb-1 uppercase tracking-wide">
                          Recommended Drills
                        </p>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {goal.drillsRecommended.map((drill, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 text-[#00A651] flex-shrink-0" />
                              {typeof drill === 'object' && drill.id ? (
                                <button
                                  onClick={() => navigate(`/drills/${drill.id}`)}
                                  className="text-[#00A651] hover:underline"
                                >
                                  {drill.name || drill.id}
                                </button>
                              ) : (
                                <span>{typeof drill === 'string' ? drill : drill?.name || 'Drill'}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {goal.homePractice && (
                      <div className="p-3 bg-white rounded-lg border border-[#D4E4D4]">
                        <p className="text-xs font-semibold text-[#6B7C6B] mb-1 uppercase tracking-wide">
                          Home Practice
                        </p>
                        <p className="text-sm text-gray-800">{goal.homePractice}</p>
                      </div>
                    )}
                  </div>

                  {/* Coach notes */}
                  {goal.coachNotes && (
                    <div className="p-3 bg-white rounded-lg border border-[#D4E4D4]">
                      <p className="text-xs font-semibold text-[#6B7C6B] mb-1 uppercase tracking-wide">
                        Coach Notes
                      </p>
                      <p className="text-sm text-gray-600 italic">{goal.coachNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* D. Review Timeline */}
        {idp.reviews && idp.reviews.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[#00A651]" />
              <h3 className="text-lg font-bold text-gray-800">Review Timeline</h3>
            </div>
            <div className="space-y-3">
              {idp.reviews.map((review, index) => {
                const isExpanded = expandedReviews[index];
                return (
                  <div
                    key={index}
                    className="border border-[#D4E4D4] rounded-lg overflow-hidden"
                  >
                    {/* Review header (clickable) */}
                    <button
                      onClick={() => toggleReview(index)}
                      className="w-full flex items-center justify-between p-4 bg-[#F5F9F5] hover:bg-[#edf3ed] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#00A651] flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {getReviewTypeLabel(review.type)}
                          </p>
                          <p className="text-xs text-[#6B7C6B]">
                            {formatDate(review.date)}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-[#6B7C6B] transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Review details (expanded) */}
                    {isExpanded && (
                      <div className="p-4 border-t border-[#D4E4D4] space-y-4">
                        {/* Coach comments */}
                        {review.coachComments && (
                          <div>
                            <p className="text-xs font-semibold text-[#6B7C6B] mb-1 uppercase tracking-wide">
                              Coach Comments
                            </p>
                            <p className="text-sm text-gray-800">{review.coachComments}</p>
                          </div>
                        )}

                        {/* Goal progress updates */}
                        {review.goalsProgress && review.goalsProgress.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[#6B7C6B] mb-2 uppercase tracking-wide">
                              Goal Progress
                            </p>
                            <div className="space-y-2">
                              {review.goalsProgress.map((gp, gpIdx) => {
                                const matchingGoal = idp.goals.find(g => g.id === gp.goalId);
                                const gpStatus = getGoalStatus(gp.status);
                                return (
                                  <div
                                    key={gpIdx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#F5F9F5] rounded-lg gap-2"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-800">
                                        {matchingGoal ? getSkillLabel(matchingGoal.skillCategory) : gp.goalId}
                                      </p>
                                      {gp.note && (
                                        <p className="text-xs text-[#6B7C6B] mt-0.5">{gp.note}</p>
                                      )}
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${gpStatus.color}`}>
                                      {gpStatus.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Assessed skills in this review */}
                        {review.assessedSkills && Object.keys(review.assessedSkills).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[#6B7C6B] mb-2 uppercase tracking-wide">
                              Skills Assessed
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(review.assessedSkills).map(([skillId, level]) => (
                                <span
                                  key={skillId}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-xs"
                                >
                                  <span className="text-[#6B7C6B]">{getSkillLabel(skillId)}</span>
                                  <span className="font-bold text-[#005028]">{level}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* E. Action Buttons (coaches/staff only) */}
        {isCoachOrStaff && (
          <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="w-5 h-5 text-[#00A651]" />
              <h3 className="text-lg font-bold text-gray-800">Coach Actions</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={() => navigate(`/development-plans/${idp.id}/review`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00A651] text-white font-semibold rounded-lg hover:bg-[#008c44] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Review
              </button>

              <button
                onClick={handleToggleParentVisible}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold border transition-colors ${
                  parentVisible
                    ? 'bg-white border-[#00A651] text-[#00A651] hover:bg-green-50'
                    : 'bg-white border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651] hover:text-[#00A651]'
                }`}
              >
                {parentVisible ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Shared with Parents
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Share with Parents
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* F. Parent Comments */}
        {parentVisible && idp.parentComments && idp.parentComments.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-lg font-bold text-gray-800">Parent Comments</h3>
            </div>
            <div className="space-y-3">
              {idp.parentComments.map((comment, index) => (
                <div
                  key={index}
                  className="p-4 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800 text-sm">{comment.parentName}</p>
                    <p className="text-xs text-[#6B7C6B]">{formatDate(comment.date)}</p>
                  </div>
                  <p className="text-sm text-gray-600">{comment.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
};

export default PlayerIDPPage;
