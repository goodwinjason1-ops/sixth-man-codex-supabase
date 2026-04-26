const STAFF_ROLES = new Set([
  'admin',
  'president',
  'vice_president',
  'coach_coordinator',
  'girls_coordinator',
  'boys_coordinator',
  'youth_head_coach',
  'coach',
  'youth_coach',
  'team_manager'
]);

const clone = (value) => {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
};

export const toISODateString = (value = new Date()) => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

export const parseIDPDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getLinkedParentIdsForPlayer = (player = {}) => {
  const ids = [
    ...(Array.isArray(player.linkedParentIds) ? player.linkedParentIds : []),
    ...(Array.isArray(player.parentIds) ? player.parentIds : []),
    ...(player.parentId ? [player.parentId] : [])
  ];
  return [...new Set(ids.filter(Boolean))];
};

export const computeOverallLevel = (skills = {}) => {
  const values = Object.values(skills)
    .map(Number)
    .filter((level) => Number.isFinite(level) && level > 0);
  if (values.length === 0) return 0;
  const average = values.reduce((sum, level) => sum + level, 0) / values.length;
  return Math.round(average * 100) / 100;
};

const normalizeGoal = (goal = {}) => ({
  id: goal.id || `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  skillCategory: goal.skillCategory || '',
  currentLevel: Number(goal.currentLevel || 0),
  targetLevel: Number(goal.targetLevel || 0),
  specificTarget: goal.specificTarget || '',
  drillsRecommended: clone(goal.drillsRecommended || []),
  homePractice: goal.homePractice || '',
  status: goal.status || 'not_started',
  coachNotes: goal.coachNotes || ''
});

export const buildDevelopmentPlanPayload = ({
  player,
  team = null,
  coach = null,
  season,
  baselineSkills = {},
  goals = [],
  parentVisible = false,
  now = new Date()
}) => {
  const timestamp = toISODateString(now);
  const parentIds = parentVisible ? getLinkedParentIdsForPlayer(player) : [];
  const skills = clone(baselineSkills || {});

  return {
    playerId: player?.id || '',
    playerName: player?.name || player?.displayName || 'Unknown',
    teamId: team?.id || player?.teamId || '',
    teamName: team?.name || player?.teamName || player?.team || '',
    coachId: coach?.uid || coach?.id || '',
    season,
    status: 'active',
    baselineAssessment: {
      date: timestamp,
      skills,
      overallLevel: computeOverallLevel(skills)
    },
    currentSkillLevels: { ...skills },
    goals: goals.map(normalizeGoal),
    reviews: [],
    parentIds,
    parentVisible: Boolean(parentVisible),
    parentComments: [],
    visibility: {
      parent: {
        shared: Boolean(parentVisible),
        parentIds
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export const getCurrentSkillLevels = (plan = {}, nextAssessedSkills = {}) => {
  const baseline = plan.baselineAssessment?.skills || {};
  const current = { ...baseline, ...(plan.currentSkillLevels || {}) };

  (plan.reviews || []).forEach((review) => {
    if (!review?.assessedSkills) return;
    Object.entries(review.assessedSkills).forEach(([skillId, level]) => {
      current[skillId] = level;
    });
  });

  Object.entries(nextAssessedSkills || {}).forEach(([skillId, level]) => {
    current[skillId] = level;
  });

  return current;
};

export const buildReviewedDevelopmentPlan = (
  plan,
  reviewInput,
  { reviewer = null, now = new Date() } = {}
) => {
  const timestamp = toISODateString(now);
  const assessedSkills = reviewInput?.assessedSkills || {};
  const goalsProgress = reviewInput?.goalsProgress || [];
  const progressByGoal = new Map(goalsProgress.map((progress) => [progress.goalId, progress]));

  const review = {
    id: `review-${Date.parse(timestamp) || Date.now()}`,
    date: timestamp,
    type: reviewInput?.type || 'ad_hoc',
    coachId: reviewer?.uid || reviewer?.id || plan?.coachId || '',
    coachName: reviewer?.displayName || reviewer?.name || '',
    assessedSkills: Object.keys(assessedSkills).length > 0 ? clone(assessedSkills) : null,
    coachComments: reviewInput?.coachComments || '',
    goalsProgress: goalsProgress.map((progress) => ({
      goalId: progress.goalId,
      status: progress.status || 'not_started',
      note: progress.note || ''
    }))
  };

  const nextGoals = (plan.goals || []).map((goal) => {
    const progress = progressByGoal.get(goal.id);
    if (!progress) return clone(goal);
    return {
      ...clone(goal),
      status: progress.status || goal.status || 'not_started',
      lastReviewNote: progress.note || '',
      lastReviewedAt: timestamp
    };
  });

  const currentSkillLevels = getCurrentSkillLevels(plan, assessedSkills);
  const nextReviews = [...(plan.reviews || []).map(clone), review];
  const allGoalsAchieved = nextGoals.length > 0 && nextGoals.every((goal) => goal.status === 'achieved');

  return {
    ...clone(plan),
    goals: nextGoals,
    reviews: nextReviews,
    currentSkillLevels,
    status: allGoalsAchieved ? 'completed' : (plan.status || 'active'),
    lastReviewAt: timestamp,
    updatedAt: timestamp
  };
};

export const toParentSafeDevelopmentPlan = (plan) => {
  if (!plan) return null;
  const safe = clone(plan);
  safe.goals = (safe.goals || []).map((goal) => {
    const { coachNotes, internalNotes, ...publicGoal } = goal;
    return publicGoal;
  });
  safe.reviews = (safe.reviews || []).map((review) => {
    const { coachComments, privateNotes, internalNotes, ...publicReview } = review;
    return publicReview;
  });
  return safe;
};

const hasParentPlanAccess = ({ plan, playerId, userProfile, currentUser }) => {
  const uid = userProfile?.uid || currentUser?.uid;
  const linkedPlayerIds = userProfile?.linkedPlayerIds || userProfile?.children || [];
  const parentIds = plan?.parentIds || [];
  return Boolean(
    plan?.parentVisible &&
    plan?.playerId === playerId &&
    uid &&
    parentIds.includes(uid) &&
    linkedPlayerIds.includes(playerId)
  );
};

const hasPlayerPlanAccess = ({ plan, playerId, userProfile, currentUser }) =>
  userProfile?.role === 'player' &&
  plan?.playerId === playerId &&
  (userProfile?.playerId === playerId || currentUser?.uid === plan?.playerUserId);

const sortMostRecentPlansFirst = (plans = []) =>
  [...plans].sort((a, b) => {
    const bDate = parseIDPDate(b.updatedAt || b.lastReviewAt || b.createdAt)?.getTime() || 0;
    const aDate = parseIDPDate(a.updatedAt || a.lastReviewAt || a.createdAt)?.getTime() || 0;
    return bDate - aDate;
  });

export const selectVisiblePlanForPlayer = ({
  plans = [],
  playerId,
  userProfile = null,
  currentUser = null
}) => {
  const plan = sortMostRecentPlansFirst(plans).find((candidate) => candidate.playerId === playerId);
  if (!plan) return null;

  const role = userProfile?.role;
  if (STAFF_ROLES.has(role)) return plan;
  if (hasParentPlanAccess({ plan, playerId, userProfile, currentUser })) {
    return toParentSafeDevelopmentPlan(plan);
  }
  if (hasPlayerPlanAccess({ plan, playerId, userProfile, currentUser })) {
    return toParentSafeDevelopmentPlan(plan);
  }
  return null;
};
