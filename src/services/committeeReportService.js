const DEFAULT_PRIVACY_LEVEL = 'committee';

export const COMMITTEE_REPORT_EXCLUDED_FIELDS = [
  'email',
  'parentEmail',
  'parent1Email',
  'parent2Email',
  'phone',
  'mobile',
  'dob',
  'dateOfBirth',
  'medicalNotes',
  'internalNotes',
  'privateNotes',
  'selectionNotes',
  'coachNotes'
];

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function dateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateStamp(value) {
  const parsed = dateValue(value);
  return parsed ? parsed.toISOString().slice(0, 10) : null;
}

function withinDateRange(item, dateRange) {
  if (!dateRange?.start && !dateRange?.end) return true;

  const itemDate = dateValue(item.date || item.createdAt || item.updatedAt || item.reviewedAt);
  if (!itemDate) return false;

  const start = dateValue(dateRange.start);
  const end = dateValue(dateRange.end);

  if (start && itemDate < start) return false;
  if (end && itemDate > end) return false;
  return true;
}

function round(value, precision = 1) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getPlayerTeamId(player) {
  return player.teamId || player.teamIds?.[0] || player.assignedTeamId || null;
}

function buildTeamLookup(teams) {
  const byId = new Map();
  const byName = new Map();

  asArray(teams).forEach((team) => {
    if (team?.id) byId.set(team.id, team);
    if (team?.name) byName.set(team.name, team);
  });

  return { byId, byName };
}

function getPlayerTeamName(player, teamLookup) {
  if (player.team || player.teamName) return player.team || player.teamName;

  const teamId = getPlayerTeamId(player);
  if (teamId && teamLookup.byId.has(teamId)) {
    return teamLookup.byId.get(teamId).name || teamId;
  }

  return 'Unassigned';
}

function getPlayerAgeGroup(player, teamLookup) {
  if (player.ageGroup) return player.ageGroup;

  const teamId = getPlayerTeamId(player);
  if (teamId && teamLookup.byId.has(teamId)) {
    return teamLookup.byId.get(teamId).ageGroup || 'Unassigned';
  }

  return 'Unassigned';
}

function getPlayerById(players) {
  return new Map(asArray(players).map((player) => [player.id, player]));
}

function getPlanStatus(plan) {
  return (plan.status || (plan.archivedAt ? 'archived' : 'active')).toLowerCase();
}

function sanitizeGoals(goals) {
  return asArray(goals).map((goal) => ({
    id: goal.id || goal.goalId || null,
    title: goal.title || goal.specificTarget || goal.name || 'Development goal',
    status: goal.status || 'active',
    skillId: goal.skillId || null,
    targetLevel: goal.targetLevel ?? null,
    dueDate: goal.dueDate || null
  })).map((goal) => (
    Object.fromEntries(Object.entries(goal).filter(([, value]) => value !== null && value !== undefined))
  ));
}

function selectCommitteePlayerFields({ player, plan, evaluations, teamLookup }) {
  const levels = evaluations
    .map((evaluation) => Number(evaluation.level ?? evaluation.score))
    .filter(Number.isFinite);
  const latestAssessmentAt = evaluations
    .map((evaluation) => evaluation.date || evaluation.createdAt || evaluation.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  const activeGoals = asArray(plan?.goals).filter((goal) => (goal.status || 'active') === 'active').length;
  const completedGoals = asArray(plan?.goals).filter((goal) => goal.status === 'completed').length;

  return {
    playerId: player.id,
    name: player.name || [player.firstName, player.lastName].filter(Boolean).join(' ') || player.id,
    team: getPlayerTeamName(player, teamLookup),
    ageGroup: getPlayerAgeGroup(player, teamLookup),
    assessmentCount: evaluations.length,
    averageLevel: levels.length ? round(levels.reduce((sum, level) => sum + level, 0) / levels.length) : 0,
    latestAssessmentAt: toDateStamp(latestAssessmentAt),
    planId: plan?.id || null,
    planStatus: plan ? getPlanStatus(plan) : 'none',
    parentVisible: Boolean(plan?.parentVisible),
    activeGoals,
    completedGoals,
    goals: sanitizeGoals(plan?.goals)
  };
}

export function buildClubOverview({ players, teams, evaluations, developmentPlans, teamLookup }) {
  const playerRows = asArray(players);
  const teamRows = asArray(teams);
  const ageGroupMap = new Map();

  playerRows.forEach((player) => {
    const ageGroup = getPlayerAgeGroup(player, teamLookup);
    if (!ageGroupMap.has(ageGroup)) {
      ageGroupMap.set(ageGroup, { ageGroup, players: 0, teams: new Set() });
    }
    const row = ageGroupMap.get(ageGroup);
    row.players += 1;
    const teamName = getPlayerTeamName(player, teamLookup);
    if (teamName && teamName !== 'Unassigned') row.teams.add(teamName);
  });

  teamRows.forEach((team) => {
    const ageGroup = team.ageGroup || 'Unassigned';
    if (!ageGroupMap.has(ageGroup)) {
      ageGroupMap.set(ageGroup, { ageGroup, players: 0, teams: new Set() });
    }
    ageGroupMap.get(ageGroup).teams.add(team.name || team.id);
  });

  return {
    totalPlayers: playerRows.length,
    totalTeams: teamRows.length,
    totalAssessments: asArray(evaluations).length,
    activeDevelopmentPlans: asArray(developmentPlans).filter((plan) => getPlanStatus(plan) === 'active').length,
    ageGroups: Array.from(ageGroupMap.values())
      .map((row) => ({ ageGroup: row.ageGroup, players: row.players, teams: row.teams.size }))
      .sort((a, b) => a.ageGroup.localeCompare(b.ageGroup, undefined, { numeric: true }))
  };
}

export function buildPlayerDevelopmentSummary({
  players,
  evaluations,
  developmentPlans,
  teamLookup,
  generatedAt
}) {
  const planRows = asArray(developmentPlans);
  const evaluationRows = asArray(evaluations);
  const plansByPlayer = new Map(planRows.map((plan) => [plan.playerId, plan]));
  const evaluationsByPlayer = new Map();

  evaluationRows.forEach((evaluation) => {
    if (!evaluation.playerId) return;
    if (!evaluationsByPlayer.has(evaluation.playerId)) evaluationsByPlayer.set(evaluation.playerId, []);
    evaluationsByPlayer.get(evaluation.playerId).push(evaluation);
  });

  const generatedDate = dateValue(generatedAt) || new Date();
  const goals = planRows.flatMap((plan) => asArray(plan.goals));
  const statusCounts = planRows.reduce((counts, plan) => {
    const status = getPlanStatus(plan);
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  return {
    totalPlans: planRows.length,
    activePlans: statusCounts.active || 0,
    draftPlans: statusCounts.draft || 0,
    archivedPlans: statusCounts.archived || 0,
    playersWithPlans: new Set(planRows.map((plan) => plan.playerId).filter(Boolean)).size,
    goals: {
      total: goals.length,
      active: goals.filter((goal) => (goal.status || 'active') === 'active').length,
      completed: goals.filter((goal) => goal.status === 'completed').length
    },
    reviewsDue: planRows.filter((plan) => {
      const reviewDate = dateValue(plan.nextReviewDate || plan.reviewDueAt);
      return reviewDate ? reviewDate <= generatedDate : false;
    }).length,
    players: asArray(players)
      .map((player) => selectCommitteePlayerFields({
        player,
        plan: plansByPlayer.get(player.id),
        evaluations: evaluationsByPlayer.get(player.id) || [],
        teamLookup
      }))
      .sort((a, b) => (
        a.team.localeCompare(b.team, undefined, { numeric: true }) ||
        a.name.localeCompare(b.name)
      ))
  };
}

export function buildCoachActivitySummary({ evaluations, players, teamLookup }) {
  const playerMap = getPlayerById(players);
  const coachMap = new Map();

  asArray(evaluations).forEach((evaluation) => {
    const coachId = evaluation.coachId || evaluation.createdBy || 'unknown';
    const coachName = evaluation.coachName || evaluation.createdByName || (coachId === 'unknown' ? 'Unknown' : coachId);
    const player = playerMap.get(evaluation.playerId);

    if (!coachMap.has(coachId)) {
      coachMap.set(coachId, {
        coachId,
        coachName,
        assessmentCount: 0,
        players: new Set(),
        teams: new Set(),
        lastActivityAt: null
      });
    }

    const row = coachMap.get(coachId);
    row.assessmentCount += 1;
    if (evaluation.playerId) row.players.add(evaluation.playerId);
    if (player) row.teams.add(getPlayerTeamName(player, teamLookup));

    const activityAt = dateValue(evaluation.date || evaluation.createdAt || evaluation.updatedAt);
    if (activityAt && (!row.lastActivityAt || activityAt > row.lastActivityAt)) {
      row.lastActivityAt = activityAt;
    }
  });

  const coaches = Array.from(coachMap.values())
    .map((row) => ({
      coachId: row.coachId,
      coachName: row.coachName,
      assessmentCount: row.assessmentCount,
      playerCount: row.players.size,
      teamCount: Array.from(row.teams).filter((team) => team && team !== 'Unassigned').length,
      teams: Array.from(row.teams).filter((team) => team && team !== 'Unassigned').sort(),
      lastActivityAt: toDateStamp(row.lastActivityAt)
    }))
    .sort((a, b) => (
      b.assessmentCount - a.assessmentCount ||
      a.coachName.localeCompare(b.coachName)
    ));

  return {
    totalAssessments: asArray(evaluations).length,
    activeCoaches: coaches.length,
    coaches
  };
}

function getStatSeconds(stat) {
  return Number(stat.totalSeconds ?? stat.seconds ?? stat.durationSeconds ?? 0) || 0;
}

function buildEquityAlerts(teamAggregates) {
  const alerts = [];

  teamAggregates.forEach((team) => {
    const players = Array.from(team.players.values()).map((player) => ({
      ...player,
      averageMinutes: player.gameCount ? player.totalSeconds / player.gameCount / 60 : 0
    }));
    if (!players.length) return;

    const teamAverage = players.reduce((sum, player) => sum + player.averageMinutes, 0) / players.length;
    const threshold = teamAverage * 0.4;

    players.forEach((player) => {
      if (teamAverage > 0 && player.averageMinutes <= threshold) {
        alerts.push({
          playerId: player.playerId,
          playerName: player.name,
          teamId: team.teamId,
          teamName: team.teamName,
          playerAvgMinutes: round(player.averageMinutes),
          teamAvgMinutes: round(teamAverage),
          percentOfAvg: round((player.averageMinutes / teamAverage) * 100, 0)
        });
      }
    });
  });

  return alerts.sort((a, b) => a.percentOfAvg - b.percentOfAvg);
}

export function buildFairPlaySummary({ playingTimeRecords }) {
  const records = asArray(playingTimeRecords);
  const teamAggregates = new Map();

  records.forEach((record) => {
    const teamId = record.teamId || record.teamName || 'unknown';
    const teamName = record.teamName || record.team || teamId;

    if (!teamAggregates.has(teamId)) {
      teamAggregates.set(teamId, {
        teamId,
        teamName,
        gameCount: 0,
        fairGames: 0,
        totalPlayerMinutes: 0,
        playerGameEntries: 0,
        players: new Map()
      });
    }

    const team = teamAggregates.get(teamId);
    team.gameCount += 1;
    if (record.fairnessScore === 'Excellent' || record.fairnessScore === 'Good') {
      team.fairGames += 1;
    }

    Object.entries(record.playerStats || {}).forEach(([playerId, stat]) => {
      const totalSeconds = getStatSeconds(stat);
      const name = stat.name || stat.playerName || playerId;

      team.totalPlayerMinutes += totalSeconds / 60;
      team.playerGameEntries += 1;

      if (!team.players.has(playerId)) {
        team.players.set(playerId, { playerId, name, totalSeconds: 0, gameCount: 0 });
      }
      const player = team.players.get(playerId);
      player.totalSeconds += totalSeconds;
      player.gameCount += 1;
    });
  });

  const teamRows = Array.from(teamAggregates.values());
  const totalGames = records.length;
  const fairGames = records.filter((record) => (
    record.fairnessScore === 'Excellent' || record.fairnessScore === 'Good'
  )).length;
  const equityAlerts = buildEquityAlerts(teamRows);

  return {
    status: 'foundation',
    note: 'Fair-play report pack uses existing playing_time records and can be extended with coach context fields.',
    totalGames,
    fairGames,
    fairnessRate: totalGames ? Math.round((fairGames / totalGames) * 100) : 0,
    equityAlertCount: equityAlerts.length,
    equityAlerts,
    teamSummaries: teamRows
      .map((team) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        gameCount: team.gameCount,
        fairGames: team.fairGames,
        fairnessRate: team.gameCount ? Math.round((team.fairGames / team.gameCount) * 100) : 0,
        playerCount: team.players.size,
        averageMinutes: team.playerGameEntries ? round(team.totalPlayerMinutes / team.playerGameEntries) : 0
      }))
      .sort((a, b) => a.teamName.localeCompare(b.teamName, undefined, { numeric: true }))
  };
}

export function buildCommitteeReportPack({
  players = [],
  teams = [],
  evaluations = [],
  developmentPlans = [],
  playingTimeRecords = [],
  dateRange = null,
  generatedAt = new Date().toISOString(),
  privacyLevel = DEFAULT_PRIVACY_LEVEL
} = {}) {
  const teamLookup = buildTeamLookup(teams);
  const filteredEvaluations = asArray(evaluations).filter((evaluation) => withinDateRange(evaluation, dateRange));
  const filteredPlayingTimeRecords = asArray(playingTimeRecords).filter((record) => withinDateRange(record, dateRange));

  return {
    meta: {
      reportType: 'committee_pack',
      generatedAt,
      privacyLevel,
      dateRange: dateRange ? {
        start: dateRange.start || null,
        end: dateRange.end || null
      } : null
    },
    clubOverview: buildClubOverview({
      players,
      teams,
      evaluations: filteredEvaluations,
      developmentPlans,
      teamLookup
    }),
    playerDevelopment: buildPlayerDevelopmentSummary({
      players,
      evaluations: filteredEvaluations,
      developmentPlans,
      teamLookup,
      generatedAt
    }),
    coachActivity: buildCoachActivitySummary({
      evaluations: filteredEvaluations,
      players,
      teamLookup
    }),
    fairPlay: buildFairPlaySummary({
      playingTimeRecords: filteredPlayingTimeRecords
    }),
    privacy: {
      level: privacyLevel,
      excludedFields: COMMITTEE_REPORT_EXCLUDED_FIELDS,
      policy: 'Committee packs include operational summaries only and omit direct contact, birthdate, medical, private selection, and coach-note fields.'
    }
  };
}
