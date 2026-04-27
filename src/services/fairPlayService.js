export const FAIR_PLAY_REASON_CODES = [
  'absent',
  'injury',
  'late_arrival',
  'disciplinary',
  'development_focus',
  'foul_trouble',
  'player_request',
  'finals_policy',
  'coach_discretion'
];

const REASON_DETAILS = {
  absent: {
    label: 'Absent',
    parentLabel: 'Absence',
    parentSummary: 'Minutes were adjusted because the player was unavailable for this game.',
    suppressesAlert: true
  },
  injury: {
    label: 'Injury',
    parentLabel: 'Injury',
    parentSummary: 'Minutes were adjusted for injury or health management.',
    suppressesAlert: true
  },
  late_arrival: {
    label: 'Late arrival',
    parentLabel: 'Late arrival',
    parentSummary: 'Minutes were adjusted because the player arrived after the game had started.',
    suppressesAlert: true
  },
  disciplinary: {
    label: 'Team standards',
    parentLabel: 'Team standards',
    parentSummary: 'Minutes were adjusted for team standards or match-day context.',
    suppressesAlert: true
  },
  development_focus: {
    label: 'Development focus',
    parentLabel: 'Development focus',
    parentSummary: 'Minutes were adjusted to support a development focus for this game.',
    suppressesAlert: true
  },
  foul_trouble: {
    label: 'Foul trouble',
    parentLabel: 'Foul trouble',
    parentSummary: 'Minutes were adjusted because foul trouble affected the rotation.',
    suppressesAlert: true
  },
  player_request: {
    label: 'Player request',
    parentLabel: 'Player request',
    parentSummary: 'Minutes were adjusted in response to a player request.',
    suppressesAlert: true
  },
  finals_policy: {
    label: 'Finals policy',
    parentLabel: 'Finals policy',
    parentSummary: 'Minutes were adjusted under the team finals or tournament policy.',
    suppressesAlert: true
  },
  coach_discretion: {
    label: 'Coach discretion',
    parentLabel: 'Coach discretion',
    parentSummary: 'Minutes were adjusted for match-day coaching decisions.',
    suppressesAlert: false
  }
};

export const FAIR_PLAY_REASON_DETAILS = REASON_DETAILS;

const REASON_ALIASES = {
  absence: 'absent',
  unavailable: 'absent',
  health: 'injury',
  injured: 'injury',
  late: 'late_arrival',
  latearrival: 'late_arrival',
  late_arrival: 'late_arrival',
  arrival: 'late_arrival',
  discipline: 'disciplinary',
  team_standards: 'disciplinary',
  standards: 'disciplinary',
  development: 'development_focus',
  development_focus: 'development_focus',
  focus: 'development_focus',
  fouls: 'foul_trouble',
  foul: 'foul_trouble',
  foul_trouble: 'foul_trouble',
  request: 'player_request',
  player_request: 'player_request',
  requested: 'player_request',
  finals: 'finals_policy',
  final: 'finals_policy',
  finals_policy: 'finals_policy',
  tournament_policy: 'finals_policy',
  coach: 'coach_discretion',
  coach_discretion: 'coach_discretion',
  discretion: 'coach_discretion'
};

const SAFE_DETAIL_FIELDS = [
  'arrivedAt',
  'expectedMinutes',
  'minutesCap',
  'period',
  'quarter',
  'half',
  'returnToPlay',
  'requestedBy',
  'policyName',
  'source',
  'createdAt',
  'updatedAt'
];

const SHORT_MINUTE_ALERT_TYPES = new Set([
  'short_minutes',
  'under_minutes',
  'low_minutes',
  'equity_alert',
  'under_fair_share',
  'under_playing_time'
]);

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKey(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeReasonCode(value) {
  const key = normalizeKey(value);
  if (FAIR_PLAY_REASON_CODES.includes(key)) return key;
  return REASON_ALIASES[key] || 'coach_discretion';
}

function pickSafeDetails(input) {
  const source = {
    ...(isPlainObject(input?.details) ? input.details : {}),
    ...(isPlainObject(input) ? input : {})
  };

  return SAFE_DETAIL_FIELDS.reduce((details, field) => {
    const value = source[field];
    if (value !== undefined && value !== null && value !== '') {
      details[field] = value;
    }
    return details;
  }, {});
}

function getStatSeconds(stat) {
  return Number(stat?.totalSeconds ?? stat?.seconds ?? stat?.durationSeconds ?? 0) || 0;
}

function round(value, precision = 1) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function hasReasonShape(value) {
  return isPlainObject(value) && (
    value.code ||
    value.reasonCode ||
    value.reason ||
    value.type ||
    value.reason_code
  );
}

function contextForPlayerId(context, fallbackPlayerId) {
  const playerId = context?.playerId || context?.player_id || context?.pid || fallbackPlayerId;
  const normalized = normalizeFairPlayContext(context);
  return playerId && normalized ? [playerId, normalized] : null;
}

function normalizeContextMap(contexts) {
  if (!contexts) return {};

  if (Array.isArray(contexts)) {
    return Object.fromEntries(contexts
      .map((context) => contextForPlayerId(context))
      .filter(Boolean));
  }

  if (hasReasonShape(contexts) && (contexts.playerId || contexts.player_id || contexts.pid)) {
    const entry = contextForPlayerId(contexts);
    return entry ? Object.fromEntries([entry]) : {};
  }

  if (isPlainObject(contexts)) {
    return Object.fromEntries(Object.entries(contexts)
      .map(([playerId, context]) => contextForPlayerId(context, playerId))
      .filter(Boolean));
  }

  return {};
}

function collectRecordContexts(record) {
  const fromRecord = normalizeContextMap(record?.fairPlayContexts || record?.fairPlayContext);
  const fromStats = Object.fromEntries(Object.entries(record?.playerStats || {})
    .map(([playerId, stat]) => contextForPlayerId(stat?.fairPlayContext, playerId))
    .filter(Boolean));

  return { ...fromStats, ...fromRecord };
}

function incrementReason(counts, code) {
  if (!code) return;
  counts[code] = (counts[code] || 0) + 1;
}

function buildFlags({ suppressedAlertCount, unresolvedShortMinuteCount, totalContextCount }) {
  const flags = [];
  if (suppressedAlertCount > 0) flags.push('context_explained_short_minutes');
  if (unresolvedShortMinuteCount > 0) flags.push('unresolved_short_minutes');
  if (totalContextCount > 0 && flags.length === 0) flags.push('context_recorded');
  return flags;
}

function getTeamSummary(teamMap, record) {
  const teamId = record.teamId || record.teamName || record.team || 'unknown';
  const teamName = record.teamName || record.team || teamId;

  if (!teamMap.has(teamId)) {
    teamMap.set(teamId, {
      teamId,
      teamName,
      recordCount: 0,
      contextCount: 0,
      shortMinuteAlerts: 0,
      suppressedAlertCount: 0,
      unresolvedShortMinuteCount: 0,
      reasonCounts: {},
      alerts: []
    });
  }

  return teamMap.get(teamId);
}

export function normalizeFairPlayContext(input = null) {
  if (!input) return null;

  const rawCode = typeof input === 'string'
    ? input
    : input.code || input.reasonCode || input.reason_code || input.reason || input.type || 'coach_discretion';
  const code = normalizeReasonCode(rawCode);
  const detail = REASON_DETAILS[code];
  const details = typeof input === 'string' ? {} : pickSafeDetails(input);

  return {
    code,
    label: detail.label,
    parentSummary: detail.parentSummary,
    parentVisible: true,
    suppressesAlert: Boolean(detail.suppressesAlert && input.suppressAlert !== false),
    details
  };
}

export function applyFairPlayContextToRecord(record = {}, contexts = null) {
  const fairPlayContexts = {
    ...collectRecordContexts(record),
    ...normalizeContextMap(contexts)
  };
  const playerStats = Object.fromEntries(Object.entries(record.playerStats || {}).map(([playerId, stat]) => {
    const context = fairPlayContexts[playerId];
    return [
      playerId,
      context ? { ...stat, fairPlayContext: context } : { ...stat }
    ];
  }));

  return {
    ...record,
    playerStats,
    fairPlayContexts
  };
}

export function shouldSuppressFairnessAlert(alert = {}, context = null) {
  const alertType = normalizeKey(alert.type || alert.alertType || alert.kind || 'short_minutes');
  if (!SHORT_MINUTE_ALERT_TYPES.has(alertType)) return false;

  const normalized = normalizeFairPlayContext(context || alert.fairPlayContext || alert.context);
  return Boolean(normalized?.suppressesAlert);
}

export function buildFairPlaySummaryFlags(records = [], options = {}) {
  const thresholdRatio = Number(options.shortMinuteThresholdRatio ?? options.thresholdRatio ?? 0.4);
  const recordRows = asArray(records);
  const teamMap = new Map();
  const summary = {
    recordCount: recordRows.length,
    totalContextCount: 0,
    totalShortMinuteAlerts: 0,
    suppressedAlertCount: 0,
    unresolvedShortMinuteCount: 0,
    reasonCounts: {},
    alerts: []
  };

  recordRows.forEach((record) => {
    const team = getTeamSummary(teamMap, record);
    team.recordCount += 1;

    const contexts = collectRecordContexts(record);
    Object.values(contexts).forEach((context) => {
      summary.totalContextCount += 1;
      team.contextCount += 1;
      incrementReason(summary.reasonCounts, context.code);
      incrementReason(team.reasonCounts, context.code);
    });

    const stats = Object.entries(record.playerStats || {});
    if (!stats.length) return;

    const totalSeconds = stats.reduce((sum, [, stat]) => sum + getStatSeconds(stat), 0);
    const averageSeconds = totalSeconds / stats.length;
    const shortMinuteThreshold = averageSeconds * thresholdRatio;
    if (averageSeconds <= 0 || shortMinuteThreshold <= 0) return;

    stats.forEach(([playerId, stat]) => {
      const playerSeconds = getStatSeconds(stat);
      if (playerSeconds >= shortMinuteThreshold) return;

      const context = contexts[playerId] || normalizeFairPlayContext(stat?.fairPlayContext);
      const alert = {
        recordId: record.id || record.recordId || null,
        teamId: team.teamId,
        teamName: team.teamName,
        playerId,
        playerName: stat.name || stat.playerName || playerId,
        type: 'short_minutes',
        playerMinutes: round(playerSeconds / 60),
        teamAverageMinutes: round(averageSeconds / 60),
        percentOfAverage: round((playerSeconds / averageSeconds) * 100, 0),
        contextCode: context?.code || null,
        suppressed: shouldSuppressFairnessAlert({ playerId, type: 'short_minutes' }, context)
      };

      summary.totalShortMinuteAlerts += 1;
      team.shortMinuteAlerts += 1;

      if (alert.suppressed) {
        summary.suppressedAlertCount += 1;
        team.suppressedAlertCount += 1;
      } else {
        summary.unresolvedShortMinuteCount += 1;
        team.unresolvedShortMinuteCount += 1;
      }

      summary.alerts.push(alert);
      team.alerts.push(alert);
    });
  });

  const teams = Array.from(teamMap.values())
    .map((team) => ({
      ...team,
      flags: buildFlags({
        suppressedAlertCount: team.suppressedAlertCount,
        unresolvedShortMinuteCount: team.unresolvedShortMinuteCount,
        totalContextCount: team.contextCount
      })
    }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName, undefined, { numeric: true }));

  return {
    ...summary,
    teams,
    flags: buildFlags(summary)
  };
}

export function createParentSafeContextSummary(context) {
  const normalized = normalizeFairPlayContext(context);
  if (!normalized) return null;

  const detail = REASON_DETAILS[normalized.code];
  return {
    code: normalized.code,
    label: detail.parentLabel,
    summary: detail.parentSummary,
    parentVisible: normalized.parentVisible
  };
}

export default {
  FAIR_PLAY_REASON_CODES,
  FAIR_PLAY_REASON_DETAILS,
  normalizeFairPlayContext,
  applyFairPlayContextToRecord,
  buildFairPlaySummaryFlags,
  shouldSuppressFairnessAlert,
  createParentSafeContextSummary
};
