const DEFAULT_TREND_GRANULARITY = 'day';
const DEFAULT_SAFE_MIN_CONFIDENCE = 0.7;

const SAFE_EXPORT_EXCLUDED_FIELDS = [
  'confidence',
  'source',
  'privateNotes',
  'privateCoachNotes',
  'internalNotes',
  'internalAnalysis',
  'analysis',
  'raw'
];

const ZONE_LABELS = {
  restricted_area: { label: 'Restricted Area', family: 'paint' },
  paint: { label: 'Paint', family: 'paint' },
  mid_range: { label: 'Mid Range', family: 'midrange' },
  left_corner_three: { label: 'Left Corner 3', family: 'three' },
  right_corner_three: { label: 'Right Corner 3', family: 'three' },
  above_break_three: { label: 'Above Break 3', family: 'three' },
  free_throw: { label: 'Free Throw', family: 'free_throw' },
  long_two: { label: 'Long 2', family: 'midrange' },
  unknown: { label: 'Unknown', family: 'unknown' }
};

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return value;
  return Math.min(max, Math.max(min, value));
}

function round(value, precision = 1) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function dateValue(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDateTime(value) {
  const parsed = dateValue(value);
  return parsed ? parsed.toISOString() : null;
}

function toDateStamp(value) {
  const parsed = dateValue(value);
  return parsed ? parsed.toISOString().slice(0, 10) : null;
}

function normalizeShotType(value) {
  const fallback = 'unknown';
  if (!value) return fallback;

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/3pt/g, 'three point')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || fallback;
}

function normalizeOutcome(raw) {
  if (typeof raw.made === 'boolean') {
    return { outcome: raw.made ? 'made' : 'missed', made: raw.made };
  }

  const rawOutcome = firstDefined(raw.outcome, raw.result, raw.status, raw.shotOutcome);
  if (typeof rawOutcome === 'boolean') {
    return { outcome: rawOutcome ? 'made' : 'missed', made: rawOutcome };
  }

  const normalized = String(rawOutcome || '').trim().toLowerCase();
  if (['made', 'make', 'scored', 'score', 'good', 'hit'].includes(normalized)) {
    return { outcome: 'made', made: true };
  }
  if (['missed', 'miss', 'no_good', 'no good', 'misses'].includes(normalized)) {
    return { outcome: 'missed', made: false };
  }

  return { outcome: 'unknown', made: false };
}

function normalizeConfidence(value) {
  const confidence = toNumber(value, 1);
  return round(clamp(confidence, 0, 1), 2);
}

function resolveShotValue(raw, shotType) {
  const explicitValue = toNumber(firstDefined(
    raw.value,
    raw.points,
    raw.pointValue,
    raw.shotValue
  ));

  if (explicitValue === 1 || explicitValue === 2 || explicitValue === 3) {
    return explicitValue;
  }

  if (shotType.includes('free_throw') || shotType === 'ft') return 1;
  if (shotType.includes('three') || shotType.includes('3')) return 3;
  return 2;
}

function resolveCoordinates(raw) {
  const x = toNumber(firstDefined(
    raw.x,
    raw.courtX,
    raw.locationX,
    raw.coordinates?.x,
    raw.location?.x
  ));
  const y = toNumber(firstDefined(
    raw.y,
    raw.courtY,
    raw.locationY,
    raw.coordinates?.y,
    raw.location?.y
  ));

  return {
    x: x === null ? null : round(clamp(x, 0, 100), 1),
    y: y === null ? null : round(clamp(y, 0, 100), 1)
  };
}

function zoneResult(id, extra = {}) {
  const definition = ZONE_LABELS[id] || ZONE_LABELS.unknown;
  return {
    id,
    label: definition.label,
    family: definition.family,
    ...extra
  };
}

export function classifyShotZone(shot = {}) {
  const { x, y } = resolveCoordinates(shot);
  const shotType = normalizeShotType(firstDefined(shot.shotType, shot.type));
  const value = resolveShotValue(shot, shotType);

  if (shotType.includes('free_throw') || value === 1) {
    return zoneResult('free_throw');
  }

  if (x === null || y === null) {
    return zoneResult('unknown');
  }

  const dx = x - 50;
  const dy = y - 5;
  const distanceFromHoop = round(Math.sqrt((dx * dx) + (dy * dy)), 1);
  const hasThreeCue = value === 3 || shotType.includes('three') || shotType.includes('3');

  if (hasThreeCue) {
    if (y <= 28 && x <= 12) {
      return zoneResult('left_corner_three', { distanceFromHoop });
    }
    if (y <= 28 && x >= 88) {
      return zoneResult('right_corner_three', { distanceFromHoop });
    }
    return zoneResult('above_break_three', { distanceFromHoop });
  }

  if (distanceFromHoop <= 10 || (x >= 42 && x <= 58 && y <= 16)) {
    return zoneResult('restricted_area', { distanceFromHoop });
  }

  if (x >= 34 && x <= 66 && y <= 42) {
    return zoneResult('paint', { distanceFromHoop });
  }

  if (distanceFromHoop <= 48) {
    return zoneResult('mid_range', { distanceFromHoop });
  }

  return zoneResult('long_two', { distanceFromHoop });
}

export function normalizeShotEvent(rawShot = {}) {
  const raw = rawShot || {};
  const shotType = normalizeShotType(firstDefined(raw.shotType, raw.type, raw.shot_type));
  const value = resolveShotValue(raw, shotType);
  const { outcome, made } = normalizeOutcome(raw);
  const { x, y } = resolveCoordinates(raw);
  const zone = classifyShotZone({ ...raw, x, y, value, shotType });

  const normalized = {
    id: firstDefined(raw.id, raw.shotId, raw.eventId) || `${firstDefined(raw.gameId, raw.game_id, 'game')}-${firstDefined(raw.playerId, raw.player_id, 'player')}-${x ?? 'x'}-${y ?? 'y'}`,
    playerId: firstDefined(raw.playerId, raw.player_id, raw.athleteId) || null,
    playerName: firstDefined(raw.playerName, raw.player_name, raw.name) || 'Unknown Player',
    teamId: firstDefined(raw.teamId, raw.team_id, raw.squadId) || null,
    teamName: firstDefined(raw.teamName, raw.team_name, raw.team) || 'Unknown Team',
    gameId: firstDefined(raw.gameId, raw.game_id, raw.matchId, raw.fixtureId) || null,
    gameDate: toIsoDateTime(firstDefined(raw.gameDate, raw.date, raw.timestamp, raw.createdAt)),
    opponent: firstDefined(raw.opponent, raw.opponentName) || null,
    period: firstDefined(raw.period, raw.quarter, raw.periodNumber) || null,
    clock: firstDefined(raw.clock, raw.gameClock, raw.timeRemaining) || null,
    possessionId: firstDefined(raw.possessionId, raw.possession_id) || null,
    x,
    y,
    outcome,
    made,
    value,
    shotType,
    zone,
    source: firstDefined(raw.source, raw.captureSource, raw.createdBySource) || 'manual_entry',
    confidence: normalizeConfidence(raw.confidence)
  };

  [
    'privateNotes',
    'privateCoachNotes',
    'internalNotes',
    'internalAnalysis',
    'analysis',
    'tags'
  ].forEach((field) => {
    if (raw[field] !== undefined) normalized[field] = raw[field];
  });

  return normalized;
}

export function normalizeShotEvents(shotEvents = []) {
  return asArray(shotEvents).map((shot) => normalizeShotEvent(shot));
}

function withinDateRange(shot, dateRange) {
  if (!dateRange?.start && !dateRange?.end) return true;

  const shotDate = dateValue(shot.gameDate);
  if (!shotDate) return false;

  const start = dateValue(dateRange.start);
  const end = dateValue(dateRange.end);

  if (start && shotDate < start) return false;
  if (end && shotDate > end) return false;
  return true;
}

function createAggregate(identity = {}) {
  return {
    ...identity,
    attempts: 0,
    makes: 0,
    misses: 0,
    points: 0,
    twoPointAttempts: 0,
    twoPointMakes: 0,
    threePointAttempts: 0,
    threePointMakes: 0,
    freeThrowAttempts: 0,
    freeThrowMakes: 0,
    confidenceTotal: 0,
    shots: []
  };
}

function addShotToAggregate(aggregate, shot) {
  aggregate.attempts += 1;
  aggregate.makes += shot.made ? 1 : 0;
  aggregate.misses = aggregate.attempts - aggregate.makes;
  aggregate.points += shot.made ? shot.value : 0;
  aggregate.confidenceTotal += shot.confidence;
  aggregate.shots.push(shot);

  if (shot.value === 3) {
    aggregate.threePointAttempts += 1;
    aggregate.threePointMakes += shot.made ? 1 : 0;
  } else if (shot.value === 1) {
    aggregate.freeThrowAttempts += 1;
    aggregate.freeThrowMakes += shot.made ? 1 : 0;
  } else {
    aggregate.twoPointAttempts += 1;
    aggregate.twoPointMakes += shot.made ? 1 : 0;
  }
}

function finalizeAggregate(aggregate) {
  const {
    confidenceTotal,
    shots,
    ...summary
  } = aggregate;

  return {
    ...summary,
    fieldGoalPct: summary.attempts ? round((summary.makes / summary.attempts) * 100, 1) : 0,
    effectiveFieldGoalPct: summary.attempts ? round(((summary.makes + (0.5 * summary.threePointMakes)) / summary.attempts) * 100, 1) : 0,
    pointsPerShot: summary.attempts ? round(summary.points / summary.attempts, 2) : 0,
    threePointPct: summary.threePointAttempts ? round((summary.threePointMakes / summary.threePointAttempts) * 100, 1) : 0,
    twoPointPct: summary.twoPointAttempts ? round((summary.twoPointMakes / summary.twoPointAttempts) * 100, 1) : 0,
    freeThrowPct: summary.freeThrowAttempts ? round((summary.freeThrowMakes / summary.freeThrowAttempts) * 100, 1) : 0,
    threePointRate: summary.attempts ? round((summary.threePointAttempts / summary.attempts) * 100, 1) : 0,
    averageConfidence: summary.attempts ? round(confidenceTotal / summary.attempts, 2) : 0
  };
}

function sortSummaries(a, b) {
  return (
    b.attempts - a.attempts ||
    b.points - a.points ||
    String(a.playerName || a.teamName || a.zoneLabel || a.period || '').localeCompare(String(b.playerName || b.teamName || b.zoneLabel || b.period || ''), undefined, { numeric: true })
  );
}

function buildOverallSummary(shots) {
  const aggregate = createAggregate();
  shots.forEach((shot) => addShotToAggregate(aggregate, shot));
  return finalizeAggregate(aggregate);
}

function buildZoneSummaries(shots) {
  const zones = new Map();

  shots.forEach((shot) => {
    const zoneId = shot.zone?.id || 'unknown';
    if (!zones.has(zoneId)) {
      zones.set(zoneId, createAggregate({
        zoneId,
        zoneLabel: shot.zone?.label || ZONE_LABELS[zoneId]?.label || zoneId,
        family: shot.zone?.family || ZONE_LABELS[zoneId]?.family || 'unknown'
      }));
    }
    addShotToAggregate(zones.get(zoneId), shot);
  });

  return Array.from(zones.values())
    .map(finalizeAggregate)
    .sort(sortSummaries);
}

function buildEntitySummaries(shots, entity) {
  const rows = new Map();
  const isPlayer = entity === 'player';

  shots.forEach((shot) => {
    const id = isPlayer ? shot.playerId || 'unknown-player' : shot.teamId || 'unknown-team';
    if (!rows.has(id)) {
      rows.set(id, createAggregate(isPlayer ? {
        playerId: shot.playerId,
        playerName: shot.playerName,
        teamId: shot.teamId,
        teamName: shot.teamName
      } : {
        teamId: shot.teamId,
        teamName: shot.teamName
      }));
    }
    addShotToAggregate(rows.get(id), shot);
  });

  return Array.from(rows.values())
    .map((row) => ({
      ...finalizeAggregate(row),
      zones: buildZoneSummaries(row.shots)
    }))
    .sort(sortSummaries);
}

function getTrendPeriod(date, granularity) {
  const stamp = toDateStamp(date);
  if (!stamp) return 'Unknown';
  if (granularity === 'month') return stamp.slice(0, 7);

  if (granularity === 'week') {
    const parsed = dateValue(stamp);
    const day = parsed.getUTCDay() || 7;
    parsed.setUTCDate(parsed.getUTCDate() - day + 1);
    return parsed.toISOString().slice(0, 10);
  }

  return stamp;
}

function buildTrendSummaries(shots, granularity = DEFAULT_TREND_GRANULARITY) {
  const rows = new Map();

  shots.forEach((shot) => {
    const period = getTrendPeriod(shot.gameDate, granularity);
    if (!rows.has(period)) {
      rows.set(period, createAggregate({ period }));
    }
    addShotToAggregate(rows.get(period), shot);
  });

  return Array.from(rows.values())
    .map((row) => ({
      ...finalizeAggregate(row),
      zones: buildZoneSummaries(row.shots)
    }))
    .sort((a, b) => {
      if (a.period === 'Unknown') return 1;
      if (b.period === 'Unknown') return -1;
      return a.period.localeCompare(b.period);
    });
}

function sanitizeSummary(summary) {
  const {
    averageConfidence,
    zones,
    ...safeSummary
  } = summary;

  if (zones) {
    safeSummary.zones = zones.map(sanitizeSummary);
  }

  return safeSummary;
}

function toSafeShotEvent(shot) {
  return {
    id: shot.id,
    playerId: shot.playerId,
    playerName: shot.playerName,
    teamId: shot.teamId,
    teamName: shot.teamName,
    gameId: shot.gameId,
    gameDate: shot.gameDate,
    opponent: shot.opponent,
    period: shot.period,
    clock: shot.clock,
    x: shot.x,
    y: shot.y,
    outcome: shot.outcome,
    made: shot.made,
    value: shot.value,
    shotType: shot.shotType,
    zone: shot.zone
  };
}

export function buildShotChartAnalytics({
  shotEvents = [],
  dateRange = null,
  generatedAt = new Date().toISOString(),
  trendGranularity = DEFAULT_TREND_GRANULARITY
} = {}) {
  const normalizedEvents = normalizeShotEvents(shotEvents);
  const filteredEvents = normalizedEvents.filter((shot) => withinDateRange(shot, dateRange));

  return {
    meta: {
      reportType: 'shot_chart_analytics',
      generatedAt,
      totalEvents: normalizedEvents.length,
      includedEvents: filteredEvents.length,
      trendGranularity,
      dateRange: dateRange ? {
        start: dateRange.start || null,
        end: dateRange.end || null
      } : null
    },
    overview: buildOverallSummary(filteredEvents),
    players: buildEntitySummaries(filteredEvents, 'player'),
    teams: buildEntitySummaries(filteredEvents, 'team'),
    zones: buildZoneSummaries(filteredEvents),
    trends: buildTrendSummaries(filteredEvents, trendGranularity),
    events: filteredEvents
  };
}

export function toParentSafeShotChartExport(analyticsOrEvents, {
  minConfidence = DEFAULT_SAFE_MIN_CONFIDENCE,
  generatedAt = new Date().toISOString()
} = {}) {
  const sourceEvents = Array.isArray(analyticsOrEvents)
    ? analyticsOrEvents
    : asArray(analyticsOrEvents?.events);
  const normalizedEvents = normalizeShotEvents(sourceEvents);
  const threshold = clamp(toNumber(minConfidence, DEFAULT_SAFE_MIN_CONFIDENCE), 0, 1);
  const safeEvents = normalizedEvents.filter((shot) => shot.confidence >= threshold);
  const safeAnalytics = buildShotChartAnalytics({
    shotEvents: safeEvents,
    generatedAt,
    trendGranularity: analyticsOrEvents?.meta?.trendGranularity || DEFAULT_TREND_GRANULARITY
  });

  return {
    meta: {
      reportType: 'shot_chart_parent_safe_export',
      generatedAt,
      privacyLevel: 'parent_player_safe',
      minConfidence: threshold,
      sourceEvents: normalizedEvents.length,
      includedEvents: safeEvents.length
    },
    overview: sanitizeSummary(safeAnalytics.overview),
    players: safeAnalytics.players.map(sanitizeSummary),
    teams: safeAnalytics.teams.map(sanitizeSummary),
    zones: safeAnalytics.zones.map(sanitizeSummary),
    trends: safeAnalytics.trends.map(sanitizeSummary),
    events: safeEvents.map(toSafeShotEvent),
    privacy: {
      suppressedLowConfidenceEvents: normalizedEvents.length - safeEvents.length,
      excludedFields: SAFE_EXPORT_EXCLUDED_FIELDS,
      policy: 'Parent/player shot-chart exports include only high-confidence shot facts and remove capture source, confidence scoring, private notes, and internal analysis fields.'
    }
  };
}
