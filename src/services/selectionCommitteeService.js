export const SELECTION_COMMITTEE_STATUSES = [
  'draft',
  'in_review',
  'recommended',
  'approved',
  'deferred',
  'rejected'
];

export const SELECTION_COMMITTEE_DECISIONS = [
  'team_assignment',
  'development',
  'waitlist',
  'not_selected',
  'deferred',
  'none'
];

export const PARENT_SAFE_COMMITTEE_EXCLUDED_FIELDS = [
  'votes',
  'voteSummary',
  'privateNotes',
  'conflictNotes',
  'conflicts',
  'conflictDeclarations',
  'internalRanking',
  'internalRank',
  'rank',
  'email',
  'parentEmail',
  'medicalNotes'
];

const INCLUDED_ASSESSMENT_STATUSES = new Set(['submitted', 'finalized', 'closed', 'approved']);

const TRYOUT_METRIC_KEYS = [
  'athleticism',
  'ballSkills',
  'gameUnderstanding',
  'coachability',
  'effort'
];

const SCOUT_METRIC_KEYS = [
  'skillsTechnique',
  'gameAwareness',
  'athleticism',
  'attitudeCoachability',
  'teamworkCommunication'
];

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function asDecisionArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).map(([playerId, decision]) => (
    decision && typeof decision === 'object'
      ? { playerId, ...decision }
      : { playerId, decision }
  ));
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round(value, precision = 1) {
  const number = finiteNumber(value);
  if (number === null) return null;
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}

function normalizeId(value) {
  return value === null || value === undefined ? null : String(value);
}

function getPlayerName(player) {
  return (
    player.name ||
    player.displayName ||
    [player.firstName, player.lastName].filter(Boolean).join(' ') ||
    player.playerName ||
    normalizeId(player.id) ||
    'Unknown player'
  );
}

function getMemberName(member) {
  return (
    member.name ||
    member.displayName ||
    [member.firstName, member.lastName].filter(Boolean).join(' ') ||
    member.email ||
    normalizeId(member.id) ||
    'Committee member'
  );
}

function normalizeCommitteeMember(member) {
  const id = normalizeId(member.id || member.uid || member.userId || member.email || getMemberName(member));

  return {
    id,
    name: getMemberName(member),
    role: member.role || 'committee',
    canVote: member.canVote !== false
  };
}

function normalizeWeights(weights = {}) {
  const input = typeof weights === 'number' ? { tryout: weights } : (weights || {});
  const tryoutProvided = input.tryout !== undefined || input.tryoutWeight !== undefined;
  const scoutingProvided = (
    input.scouting !== undefined ||
    input.scout !== undefined ||
    input.scoutWeight !== undefined ||
    input.scoutingWeight !== undefined
  );

  let tryout = finiteNumber(input.tryout ?? input.tryoutWeight);
  let scouting = finiteNumber(input.scouting ?? input.scout ?? input.scoutWeight ?? input.scoutingWeight);

  if (tryout === null) tryout = scoutingProvided ? null : 0.6;
  if (scouting === null) {
    if (tryoutProvided && tryout !== null) {
      scouting = tryout > 1 ? Math.max(0, 100 - tryout) : Math.max(0, 1 - tryout);
    } else {
      scouting = 0.4;
    }
  }
  if (tryout === null) {
    tryout = scouting > 1 ? Math.max(0, 100 - scouting) : Math.max(0, 1 - scouting);
  }

  const total = tryout + scouting;
  if (!Number.isFinite(total) || total <= 0) {
    return { tryout: 0.6, scouting: 0.4 };
  }

  return {
    tryout: round(tryout / total, 2),
    scouting: round(scouting / total, 2)
  };
}

function hasIncludedAssessmentStatus(assessment) {
  const status = (assessment.evalStatus || assessment.status || '').toLowerCase();
  return !status || INCLUDED_ASSESSMENT_STATUSES.has(status);
}

function averageNumericValues(values) {
  const numericValues = values.map(finiteNumber).filter((value) => value !== null && value > 0);
  if (numericValues.length === 0) return null;
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function scoreFromRatings(ratings, metricKeys) {
  if (!ratings || typeof ratings !== 'object') return null;

  const keyedValues = metricKeys
    .map((key) => ratings[key])
    .filter((value) => finiteNumber(value) !== null);

  if (keyedValues.length > 0) return averageNumericValues(keyedValues);
  return averageNumericValues(Object.values(ratings));
}

function extractAssessmentScore(assessment, source) {
  const directScore = finiteNumber(
    assessment.compositeAvg ??
    assessment.avgOverall ??
    assessment.overallAvg ??
    assessment.overall ??
    assessment.combinedScore ??
    assessment.score ??
    assessment.rating ??
    assessment.overallImpression
  );

  if (directScore !== null) return directScore;

  const metricKeys = source === 'scouting' ? SCOUT_METRIC_KEYS : TRYOUT_METRIC_KEYS;
  return scoreFromRatings(
    assessment.ratings || assessment.averages || assessment.metrics,
    metricKeys
  );
}

function summarizeAssessments(assessments, source) {
  const included = asArray(assessments).filter(hasIncludedAssessmentStatus);
  let weightedScoreTotal = 0;
  let weightTotal = 0;

  included.forEach((assessment) => {
    const score = extractAssessmentScore(assessment, source);
    if (score === null) return;

    const weight = finiteNumber(assessment.evaluationCount ?? assessment.evalCount ?? assessment.count) || 1;
    weightedScoreTotal += score * weight;
    weightTotal += weight;
  });

  const averageScore = weightTotal > 0 ? round(weightedScoreTotal / weightTotal) : null;

  return {
    averageScore,
    count: included.length,
    submittedCount: included.filter((assessment) => {
      const status = (assessment.evalStatus || assessment.status || '').toLowerCase();
      return status === 'submitted' || status === 'finalized' || status === 'closed' || status === 'approved';
    }).length
  };
}

function groupByPlayer(rows) {
  const groups = new Map();

  asArray(rows).forEach((row) => {
    const playerId = normalizeId(row.playerId || row.player_id || row.player?.id);
    if (!playerId) return;
    if (!groups.has(playerId)) groups.set(playerId, []);
    groups.get(playerId).push(row);
  });

  return groups;
}

export function calculateSelectionCombinedScore({
  tryoutScore = null,
  scoutingScore = null,
  weights = {}
} = {}) {
  const normalizedWeights = normalizeWeights(weights);
  const tryout = round(tryoutScore);
  const scouting = round(scoutingScore);

  if (tryout !== null && scouting !== null) {
    return {
      tryout,
      scouting,
      combined: round((tryout * normalizedWeights.tryout) + (scouting * normalizedWeights.scouting)),
      weights: normalizedWeights
    };
  }

  if (tryout !== null) {
    return {
      tryout,
      scouting: null,
      combined: tryout,
      weights: { tryout: 1, scouting: 0 }
    };
  }

  if (scouting !== null) {
    return {
      tryout: null,
      scouting,
      combined: scouting,
      weights: { tryout: 0, scouting: 1 }
    };
  }

  return {
    tryout: null,
    scouting: null,
    combined: null,
    weights: normalizedWeights
  };
}

export function buildConflictDeclaration({
  member = {},
  player = {},
  memberId,
  playerId,
  conflictType = 'other',
  notes = '',
  status = 'active',
  declaredAt = new Date().toISOString(),
  id
} = {}) {
  const normalizedMemberId = normalizeId(memberId || member.id || member.uid || member.userId || member.email);
  const normalizedPlayerId = normalizeId(playerId || player.id || player.playerId);
  const normalizedConflictType = conflictType || 'other';

  return {
    id: id || [normalizedMemberId, normalizedPlayerId, normalizedConflictType].filter(Boolean).join(':'),
    memberId: normalizedMemberId,
    memberName: getMemberName(member),
    playerId: normalizedPlayerId,
    playerName: getPlayerName(player),
    conflictType: normalizedConflictType,
    notes,
    status,
    declaredAt
  };
}

function normalizeConflictDeclaration(conflict, fallbackPlayer = {}) {
  return buildConflictDeclaration({
    id: conflict.id,
    member: {
      id: conflict.memberId || conflict.member?.id,
      name: conflict.memberName || conflict.member?.name || conflict.member?.displayName
    },
    player: {
      id: conflict.playerId || fallbackPlayer.id,
      name: conflict.playerName || getPlayerName(fallbackPlayer)
    },
    conflictType: conflict.conflictType || conflict.type || 'other',
    notes: conflict.notes || conflict.conflictNotes || '',
    status: conflict.status || 'active',
    declaredAt: conflict.declaredAt || conflict.createdAt || new Date().toISOString()
  });
}

function getDecisionStatus(decision) {
  return (decision.status || decision.decisionStatus || 'undecided').toLowerCase();
}

function getDecisionType(decision) {
  return (decision.decision || decision.outcome || decision.recommendation || 'none').toLowerCase();
}

function getTargetTeamId(decision, context) {
  return normalizeId(
    decision.targetTeamId ||
    decision.teamId ||
    decision.assignedTeamId ||
    context.targetTeamId
  );
}

function getRecommendedTeamId(decision, context) {
  return normalizeId(
    decision.recommendedTeamId ||
    decision.systemRecommendedTeamId ||
    context.recommendedTeamId
  );
}

export function validateSelectionDecision(decision = {}, context = {}) {
  const errors = [];
  const warnings = [];

  if (!decision || Object.keys(decision).length === 0) {
    return {
      valid: true,
      errors,
      warnings,
      status: 'undecided',
      decision: 'none',
      requiresOverrideRationale: false
    };
  }

  const status = getDecisionStatus(decision);
  const decisionType = getDecisionType(decision);
  const targetTeamId = getTargetTeamId(decision, context);
  const recommendedTeamId = getRecommendedTeamId(decision, context);
  const isSupportedStatus = SELECTION_COMMITTEE_STATUSES.includes(status);
  const isSupportedDecision = SELECTION_COMMITTEE_DECISIONS.includes(decisionType);
  const isTeamDecision = decisionType === 'team_assignment';
  const isFinalPlacementStatus = status === 'approved' || status === 'recommended';
  const isOverride = Boolean(
    decision.override ||
    decision.isOverride ||
    (targetTeamId && recommendedTeamId && targetTeamId !== recommendedTeamId)
  );
  const overrideRationale = (
    decision.overrideRationale ||
    decision.overrideReason ||
    decision.rationale ||
    ''
  ).trim();

  if (!isSupportedStatus) {
    errors.push(`Status "${status}" is not supported.`);
  }

  if (!isSupportedDecision) {
    errors.push(`Decision "${decisionType}" is not supported.`);
  }

  if (isTeamDecision && isFinalPlacementStatus && !targetTeamId) {
    errors.push('Target team is required for approved or recommended team assignments.');
  }

  if (isOverride && !overrideRationale) {
    errors.push('Override rationale is required when a decision overrides the recommendation.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    status,
    decision: decisionType,
    requiresOverrideRationale: isOverride
  };
}

function normalizeVoteValue(vote) {
  const value = typeof vote === 'string' ? vote : (vote.vote || vote.value || vote.decision || '');
  const normalized = value.toLowerCase();

  if (['yes', 'approve', 'approved', 'support'].includes(normalized)) return 'yes';
  if (['no', 'reject', 'rejected', 'oppose'].includes(normalized)) return 'no';
  if (['abstain', 'conflict', 'recuse', 'recused'].includes(normalized)) return 'abstain';
  return 'other';
}

function summarizeVotes(votes) {
  const summary = { yes: 0, no: 0, abstain: 0, total: 0 };

  asArray(votes).forEach((vote) => {
    const normalized = normalizeVoteValue(vote);
    if (summary[normalized] !== undefined) summary[normalized] += 1;
    summary.total += 1;
  });

  return summary;
}

function getDecisionUpdatedAt(decision) {
  return decision.updatedAt || decision.decidedAt || decision.createdAt || decision.date || '';
}

function buildDecisionLookup(decisions) {
  const lookup = new Map();

  asDecisionArray(decisions)
    .filter((decision) => decision && decision.playerId)
    .sort((a, b) => String(getDecisionUpdatedAt(a)).localeCompare(String(getDecisionUpdatedAt(b))))
    .forEach((decision) => {
      lookup.set(normalizeId(decision.playerId), decision);
    });

  return lookup;
}

function normalizeAssignment(value) {
  if (!value) return { teamId: null, details: null };
  if (typeof value === 'string') return { teamId: value, details: { teamId: value } };

  const teamId = normalizeId(
    value.teamId ||
    value.targetTeamId ||
    value.assignedTeamId ||
    value.assignment ||
    value.id
  );

  return { teamId, details: { ...value, teamId } };
}

function buildAssignmentLookup(assignments) {
  if (Array.isArray(assignments)) {
    return new Map(assignments.map((assignment) => [
      normalizeId(assignment.playerId || assignment.player_id),
      normalizeAssignment(assignment)
    ]));
  }

  if (assignments && typeof assignments === 'object') {
    return new Map(Object.entries(assignments).map(([playerId, assignment]) => [
      normalizeId(playerId),
      normalizeAssignment(assignment)
    ]));
  }

  return new Map();
}

function normalizeDecision(decision, context) {
  if (!decision) {
    return {
      status: 'undecided',
      decision: 'none',
      targetTeamId: null,
      valid: true,
      errors: [],
      warnings: [],
      requiresOverrideRationale: false
    };
  }

  const validation = validateSelectionDecision(decision, context);
  const targetTeamId = getTargetTeamId(decision, context);
  const recommendedTeamId = getRecommendedTeamId(decision, context);
  const overrideRationale = (
    decision.overrideRationale ||
    decision.overrideReason ||
    decision.rationale ||
    ''
  ).trim();

  return compactObject({
    ...decision,
    id: decision.id || null,
    playerId: normalizeId(decision.playerId || context.playerId),
    status: validation.status,
    decision: validation.decision,
    targetTeamId,
    recommendedTeamId,
    override: validation.requiresOverrideRationale,
    overrideRationale: overrideRationale || undefined,
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    requiresOverrideRationale: validation.requiresOverrideRationale,
    votes: asArray(decision.votes),
    conflictDeclarations: asArray(decision.conflictDeclarations || decision.conflicts)
      .map((conflict) => normalizeConflictDeclaration(conflict, context.player))
  });
}

function getRecommendedTeamFromPlayer(player, tryoutRows) {
  if (player.recommendedTeamId || player.teamRecommendation || player.recommendedTeam) {
    return normalizeId(player.recommendedTeamId || player.teamRecommendation || player.recommendedTeam);
  }

  const recommendation = asArray(tryoutRows)
    .map((row) => row.topRecommendation || row.teamRecommendation || row.recommendedTeamId)
    .find(Boolean);

  return normalizeId(recommendation);
}

function buildStatusCounts(players) {
  const counts = {
    undecided: 0,
    draft: 0,
    in_review: 0,
    recommended: 0,
    approved: 0,
    deferred: 0,
    rejected: 0
  };

  players.forEach((player) => {
    const status = player.decision?.status || 'undecided';
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
}

function sortBoardPlayers(a, b) {
  const scoreA = a.score.combined;
  const scoreB = b.score.combined;

  if (scoreA === null && scoreB !== null) return 1;
  if (scoreA !== null && scoreB === null) return -1;
  if (scoreA !== null && scoreB !== null && scoreA !== scoreB) return scoreB - scoreA;

  return a.playerName.localeCompare(b.playerName, undefined, { numeric: true });
}

export function buildSelectionCommitteeBoard({
  players = [],
  tryoutResults = [],
  tryoutEvaluations,
  scoutingReports = [],
  scoutReports,
  currentAssignments = {},
  assignments,
  committeeMembers = [],
  existingDecisions = [],
  decisions,
  scoreWeights = { tryout: 0.6, scouting: 0.4 },
  generatedAt = new Date().toISOString()
} = {}) {
  const tryoutRows = tryoutEvaluations || tryoutResults;
  const scoutingRows = scoutReports || scoutingReports;
  const decisionRows = decisions || existingDecisions;
  const assignmentRows = assignments || currentAssignments;
  const tryoutsByPlayer = groupByPlayer(tryoutRows);
  const scoutsByPlayer = groupByPlayer(scoutingRows);
  const decisionsByPlayer = buildDecisionLookup(decisionRows);
  const assignmentsByPlayer = buildAssignmentLookup(assignmentRows);
  const members = asArray(committeeMembers).map(normalizeCommitteeMember);

  const boardPlayers = asArray(players)
    .map((player) => {
      const playerId = normalizeId(player.id || player.playerId);
      const playerTryouts = tryoutsByPlayer.get(playerId) || [];
      const playerScouts = scoutsByPlayer.get(playerId) || [];
      const tryoutSummary = summarizeAssessments(playerTryouts, 'tryout');
      const scoutingSummary = summarizeAssessments(playerScouts, 'scouting');
      const score = calculateSelectionCombinedScore({
        tryoutScore: tryoutSummary.averageScore,
        scoutingScore: scoutingSummary.averageScore,
        weights: scoreWeights
      });
      const assignment = assignmentsByPlayer.get(playerId) || { teamId: null, details: null };
      const rawDecision = decisionsByPlayer.get(playerId);
      const recommendedTeamId = (
        getRecommendedTeamId(rawDecision || {}, {}) ||
        getRecommendedTeamFromPlayer(player, playerTryouts) ||
        assignment.teamId
      );
      const decision = normalizeDecision(rawDecision, {
        player,
        playerId,
        recommendedTeamId
      });
      const conflicts = asArray(decision.conflictDeclarations);
      const votes = asArray(decision.votes);

      return compactObject({
        playerId,
        playerName: getPlayerName(player),
        ageGroup: player.ageGroup || player.age_group || null,
        jerseyNumber: player.number || player.jerseyNumber || player.playerNumber || null,
        currentAssignment: assignment.teamId,
        assignment: assignment.details,
        score,
        tryoutSummary,
        scoutingSummary,
        recommendedTeamId,
        decision,
        votes,
        voteSummary: summarizeVotes(votes),
        conflicts,
        hasConflictDeclared: conflicts.length > 0,
        privateNotes: decision.privateNotes || player.privateNotes || player.selectionNotes,
        internalRanking: decision.internalRanking ?? decision.internalRank ?? player.internalRanking ?? player.internalRank
      });
    })
    .sort(sortBoardPlayers)
    .map((player, index) => ({ ...player, rank: index + 1 }));

  const conflicts = boardPlayers.flatMap((player) => player.conflicts || []);

  return {
    meta: {
      boardType: 'selection_committee',
      generatedAt,
      playerCount: boardPlayers.length
    },
    committeeMembers: members,
    players: boardPlayers,
    statusCounts: buildStatusCounts(boardPlayers),
    conflicts,
    scoreWeights: normalizeWeights(scoreWeights),
    validation: {
      invalidDecisionCount: boardPlayers.filter((player) => player.decision && !player.decision.valid).length,
      invalidDecisions: boardPlayers
        .filter((player) => player.decision && !player.decision.valid)
        .map((player) => ({
          playerId: player.playerId,
          playerName: player.playerName,
          errors: player.decision.errors
        }))
    }
  };
}

export function toParentSafeCommitteeSummary(board = {}) {
  return {
    meta: {
      ...(board.meta || {}),
      privacyLevel: 'parent_safe'
    },
    players: asArray(board.players).map((player) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      ageGroup: player.ageGroup,
      jerseyNumber: player.jerseyNumber,
      currentAssignment: player.currentAssignment,
      decisionStatus: player.decision?.status || 'undecided',
      decision: player.decision?.decision || 'none',
      targetTeamId: player.decision?.targetTeamId || null,
      score: {
        combined: player.score?.combined ?? null,
        tryout: player.score?.tryout ?? null,
        scouting: player.score?.scouting ?? null
      },
      hasConflictDeclared: Boolean(player.hasConflictDeclared)
    })),
    privacy: {
      excludedFields: PARENT_SAFE_COMMITTEE_EXCLUDED_FIELDS,
      policy: 'Parent-safe selection summaries omit vote details, private notes, conflict notes, and internal rankings.'
    }
  };
}

export default {
  SELECTION_COMMITTEE_STATUSES,
  SELECTION_COMMITTEE_DECISIONS,
  PARENT_SAFE_COMMITTEE_EXCLUDED_FIELDS,
  buildConflictDeclaration,
  buildSelectionCommitteeBoard,
  calculateSelectionCombinedScore,
  toParentSafeCommitteeSummary,
  validateSelectionDecision
};
