const NUMBER_WORDS = new Map([
  ['zero', 0],
  ['one', 1],
  ['two', 2],
  ['three', 3],
  ['four', 4],
  ['for', 4],
  ['five', 5]
]);

const DEFAULT_METRIC_ALIASES = {
  teamWork: ['teamwork', 'team work', 'communication', 'talking'],
  defense: ['defense', 'defence', 'defensive effort', 'defensive'],
  ballMovement: ['ball movement', 'ballmovement', 'passing', 'ball sharing'],
  offense: ['offense', 'offence', 'attack', 'attacking'],
  shotSelection: ['shot selection', 'shooting selection', 'shot choice', 'shot choices'],
  sportsmanship: ['sportsmanship', 'attitude', 'respect']
};

const normalizeText = (value = '') =>
  value
    .toString()
    .normalize('NFKD')
    .replace(/[^\w\s#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const camelToWords = (value = '') =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

const uniq = (items) => [...new Set(items.filter(Boolean))];

const getScoreFromText = (value) => {
  if (value == null) return null;
  const normalized = normalizeText(value);
  if (/^[1-5]$/.test(normalized)) return Number(normalized);
  return NUMBER_WORDS.has(normalized) ? NUMBER_WORDS.get(normalized) : null;
};

const buildMetricAliases = (metric) => {
  const baseAliases = [
    metric.id,
    metric.name,
    camelToWords(metric.id),
    ...(metric.aliases || []),
    ...(DEFAULT_METRIC_ALIASES[metric.id] || [])
  ];

  return uniq(baseAliases.map(normalizeText))
    .sort((a, b) => b.length - a.length);
};

const getPlayerNameParts = (player) => {
  const name = normalizeText(player.name || player.displayName || player.playerName || '');
  const parts = name.split(' ').filter(Boolean);
  return { name, parts };
};

const buildPlayerMatchers = (players) => {
  const firstNameCounts = new Map();
  const lastNameCounts = new Map();

  players.forEach((player) => {
    const { parts } = getPlayerNameParts(player);
    if (parts[0]) firstNameCounts.set(parts[0], (firstNameCounts.get(parts[0]) || 0) + 1);
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      lastNameCounts.set(last, (lastNameCounts.get(last) || 0) + 1);
    }
  });

  return players.map((player) => {
    const { name, parts } = getPlayerNameParts(player);
    const aliases = [name, normalizeText(player.nickname || '')];
    if (parts[0] && firstNameCounts.get(parts[0]) === 1) aliases.push(parts[0]);
    if (parts.length > 1 && lastNameCounts.get(parts[parts.length - 1]) === 1) {
      aliases.push(parts[parts.length - 1]);
    }

    const number = player.number || player.playerNumber || player.jerseyNumber;
    if (number !== undefined && number !== null && number !== '') {
      aliases.push(`#${number}`, `number ${number}`, `jersey ${number}`);
    }

    return {
      player,
      aliases: uniq(aliases.map(normalizeText)).sort((a, b) => b.length - a.length)
    };
  });
};

const findPlayerMentions = (text, players) => {
  const mentions = [];

  buildPlayerMatchers(players).forEach(({ player, aliases }) => {
    aliases.forEach((alias) => {
      if (!alias) return;
      const pattern = alias.startsWith('#')
        ? escapeRegExp(alias)
        : `\\b${escapeRegExp(alias)}\\b`;
      const re = new RegExp(pattern, 'g');
      let match = re.exec(text);
      while (match) {
        mentions.push({
          player,
          alias,
          index: match.index,
          end: match.index + match[0].length
        });
        match = re.exec(text);
      }
    });
  });

  return mentions
    .sort((a, b) => a.index - b.index || b.alias.length - a.alias.length)
    .filter((mention, index, all) => {
      const previous = all[index - 1];
      return !previous || mention.index >= previous.end || mention.player.id === previous.player.id;
    });
};

const scoreTokenPattern = '(?:[1-5]|zero|one|two|three|four|for|five)';

const findMetricScores = (segment, metrics) => {
  const results = [];

  metrics.forEach((metric) => {
    const aliases = buildMetricAliases(metric);
    for (const alias of aliases) {
      const afterPattern = new RegExp(
        `\\b${escapeRegExp(alias)}\\b(?:\\s+(?:is|was|at|to|of|score|scored|rating|rated|gets|got|on))*\\s+(${scoreTokenPattern})\\b`,
        'i'
      );
      const beforePattern = new RegExp(
        `\\b(${scoreTokenPattern})\\b\\s+(?:for|on|in)?\\s*\\b${escapeRegExp(alias)}\\b`,
        'i'
      );
      const afterMatch = segment.match(afterPattern);
      const beforeMatch = segment.match(beforePattern);
      const score = getScoreFromText(afterMatch?.[1] || beforeMatch?.[1]);

      if (score != null && score >= 1 && score <= 5) {
        results.push({
          metricId: metric.id,
          metricName: metric.name || camelToWords(metric.id),
          score,
          sourceText: (afterMatch?.[0] || beforeMatch?.[0] || '').trim()
        });
        break;
      }
    }
  });

  return results;
};

export const parseVoiceAssessmentTranscript = ({
  transcript,
  players = [],
  metrics = []
}) => {
  const text = normalizeText(transcript);
  if (!text) {
    return { matches: [], warnings: ['No transcript text to analyse.'], unmatchedText: '' };
  }

  const mentions = findPlayerMentions(text, players);
  if (mentions.length === 0) {
    return { matches: [], warnings: ['No player names matched this transcript.'], unmatchedText: transcript };
  }

  const matches = [];
  const warnings = [];

  mentions.forEach((mention, index) => {
    const nextMention = mentions[index + 1];
    const segment = text.slice(mention.end, nextMention?.index ?? text.length);
    const metricScores = findMetricScores(segment, metrics);

    if (metricScores.length === 0) {
      warnings.push(`No metric score found for ${mention.player.name || mention.player.displayName || mention.alias}.`);
      return;
    }

    metricScores.forEach((metricScore) => {
      matches.push({
        playerId: mention.player.id,
        playerName: mention.player.name || mention.player.displayName || 'Unknown player',
        playerAlias: mention.alias,
        ...metricScore
      });
    });
  });

  return {
    matches,
    warnings,
    unmatchedText: '',
    summary: {
      playerCount: new Set(matches.map((match) => match.playerId)).size,
      valueCount: matches.length
    }
  };
};

export const mergeVoiceMatchesIntoPlayerMetrics = (currentAssessments = {}, matches = []) => {
  return matches.reduce((next, match) => {
    next[match.playerId] = {
      ...(next[match.playerId] || {}),
      metrics: {
        ...(next[match.playerId]?.metrics || {}),
        [match.metricId]: match.score
      }
    };
    return next;
  }, { ...currentAssessments });
};

export const mergeVoiceMatchesIntoTrainingMetrics = (currentMetrics = {}, matches = []) => {
  return matches.reduce((next, match) => {
    next[match.playerId] = {
      ...(next[match.playerId] || {}),
      [match.metricId]: match.score
    };
    return next;
  }, { ...currentMetrics });
};
