// Match Day Benchmarks Data Structure
// Document ID format: {ageGroupId}_{metricId}
// Each document contains criteria for each of the 5 proficiency levels

export const MATCH_AGE_GROUPS = [
  { id: 'u8-u10', name: 'Under 8 - Under 10', minAge: 5, maxAge: 10 },
  { id: 'u10-u12', name: 'Under 10 - Under 12', minAge: 8, maxAge: 12 },
  { id: 'u12-u14', name: 'Under 12 - Under 14', minAge: 10, maxAge: 14 },
  { id: 'u14-u16', name: 'Under 14 - Under 16', minAge: 12, maxAge: 16 },
  { id: 'u16-u18', name: 'Under 16 - Under 18', minAge: 14, maxAge: 18 }
];

export const MATCH_METRICS = [
  { id: 'teamWork', name: 'Team Work', icon: 'Users', description: 'Working together with teammates, communication, and collaboration' },
  { id: 'defense', name: 'Defense', icon: 'Shield', description: 'Individual and team defensive effort and positioning' },
  { id: 'ballMovement', name: 'Ball Movement', icon: 'Target', description: 'Passing, spacing, and offensive flow' },
  { id: 'offense', name: 'Offense', icon: 'Crosshair', description: 'Scoring, shot creation, and offensive skills execution' },
  { id: 'shotSelection', name: 'Shot Selection', icon: 'Brain', description: 'Decision making on when and where to shoot' },
  { id: 'sportsmanship', name: 'Sportsmanship', icon: 'Award', description: 'Attitude, respect for opponents, coaches, and officials' }
];

export const MATCH_LEVEL_LABELS = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Proficient',
  5: 'Elite'
};

export const MATCH_LEVEL_COLORS = {
  1: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' },
  2: { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500' },
  3: { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500' },
  4: { bg: 'bg-[#22c55e]', text: 'text-[#4ade80]', border: 'border-[#22c55e]' },
  5: { bg: 'bg-[#86efac]', text: 'text-[#86efac]', border: 'border-[#86efac]' }
};

// Default benchmark structure with placeholder criteria
export const DEFAULT_MATCH_BENCHMARKS = {};

// Generate benchmark documents for all age group + metric combinations
MATCH_AGE_GROUPS.forEach(ageGroup => {
  MATCH_METRICS.forEach(metric => {
    const docId = `${ageGroup.id}_${metric.id}`;
    DEFAULT_MATCH_BENCHMARKS[docId] = {
      ageGroupId: ageGroup.id,
      ageGroupName: ageGroup.name,
      metricId: metric.id,
      metricName: metric.name,
      levels: {
        1: { label: 'Emerging', criteria: [] },
        2: { label: 'Developing', criteria: [] },
        3: { label: 'Competent', criteria: [] },
        4: { label: 'Proficient', criteria: [] },
        5: { label: 'Elite', criteria: [] }
      },
      lastUpdated: null,
      updatedBy: null
    };
  });
});

// Sample benchmarks with actual criteria for demonstration
// U8-U10 Team Work
DEFAULT_MATCH_BENCHMARKS['u8-u10_teamWork'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Sometimes passes to teammates',
      'Beginning to understand sharing the ball',
      'Responds to coach instructions'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Looks for open teammates before shooting',
      'Celebrates teammates\' successes',
      'Starting to communicate on court'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Regularly passes to better-positioned teammates',
      'Helps teammates on defense',
      'Encourages others during the game'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Excellent court awareness of teammates',
      'Makes extra pass for better shot',
      'Vocal leader on court'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Makes teammates better through play',
      'Puts team success above personal stats',
      'Natural leader who organizes team'
    ]
  }
};

// U8-U10 Defense
DEFAULT_MATCH_BENCHMARKS['u8-u10_defense'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Attempts to guard assigned player',
      'Stays in general defensive area',
      'Learning defensive stance'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Stays with assigned player most of the time',
      'Uses defensive stance in games',
      'Attempts to contest shots'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Good on-ball defense',
      'Contests shots without fouling',
      'Beginning to help teammates'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Strong individual defense',
      'Provides help defense',
      'Forces turnovers through positioning'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Dominant defender for age group',
      'Organizes team defense',
      'Anticipates plays and intercepts passes'
    ]
  }
};

// U8-U10 Ball Movement
DEFAULT_MATCH_BENCHMARKS['u8-u10_ballMovement'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Can make basic passes in games',
      'Understands passing is important',
      'Beginning to space out on offense'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Makes chest and bounce passes in games',
      'Moves to open space after passing',
      'Starting to find open teammates'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Good passing accuracy in games',
      'Ball doesn\'t stick - keeps offense flowing',
      'Creates passing lanes by moving'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Excellent vision and passing',
      'Makes team offense flow smoothly',
      'Rarely turns ball over on passes'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Outstanding playmaker',
      'Creates scoring opportunities for others',
      'Reads defense and exploits gaps'
    ]
  }
};

// U8-U10 Offense
DEFAULT_MATCH_BENCHMARKS['u8-u10_offense'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Attempts to score when near basket',
      'Moves toward basket on offense',
      'Learning to dribble in games'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Makes layups in practice situations',
      'Shoots when open',
      'Can dribble without losing ball often'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Scores regularly in games',
      'Shot selection improving',
      'Can finish with dominant hand'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Consistent scorer',
      'Creates own scoring opportunities',
      'Finishes with both hands'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Dominant scorer for age group',
      'Multiple offensive moves',
      'Scores under pressure'
    ]
  }
};

// U8-U10 Shot Selection
DEFAULT_MATCH_BENCHMARKS['u8-u10_shotSelection'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Shoots whenever they get the ball',
      'Learning when to shoot vs pass',
      'Needs reminders about shot choices'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Sometimes passes up bad shots',
      'Shoots from closer range',
      'Beginning to understand good vs bad shots'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Takes mostly good shots',
      'Knows shooting range',
      'Passes when covered'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Excellent shot selection',
      'Creates open shots for self',
      'Takes smart shots only'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Always makes smart decisions',
      'High percentage shooter due to shot choice',
      'Takes over when needed, defers when appropriate'
    ]
  }
};

// U8-U10 Sportsmanship
DEFAULT_MATCH_BENCHMARKS['u8-u10_sportsmanship'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Sometimes shows frustration during games',
      'Learning to accept referee calls',
      'Needs reminders about attitude'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Usually positive attitude',
      'Accepts most referee decisions',
      'Shakes hands after games'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Good attitude throughout games',
      'Respects opponents and referees',
      'Helps teammates stay positive'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Excellent role model',
      'Stays positive even when losing',
      'Congratulates good plays by opponents'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Outstanding sportsperson',
      'Leadership in positive attitude',
      'Never argues, always respectful'
    ]
  }
};

// U12-U14 benchmarks (more advanced expectations)
DEFAULT_MATCH_BENCHMARKS['u12-u14_teamWork'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Participates in team plays',
      'Listens to coach and teammates',
      'Needs guidance on team concepts'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Executes basic team plays',
      'Communicates on switches',
      'Supports teammates vocally'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Runs team offense effectively',
      'Makes help defense rotations',
      'Sets effective screens'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Organizes teammates on court',
      'Anticipates teammates\' needs',
      'Leads by example'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Makes everyone better',
      'Floor general mentality',
      'Team plays best when they\'re on court'
    ]
  }
};

DEFAULT_MATCH_BENCHMARKS['u12-u14_defense'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Can guard position in man defense',
      'Sometimes loses assignment',
      'Learning help defense concepts'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Stays with assignment consistently',
      'Knows help position when off ball',
      'Closes out to shooters'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Strong individual defender',
      'Good help defense',
      'Contests without fouling'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Can guard multiple positions',
      'Forces difficult shots',
      'Vocal defensive leader'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Lockdown defender',
      'Changes opponent game plan',
      'Generates steals and deflections'
    ]
  }
};

DEFAULT_MATCH_BENCHMARKS['u12-u14_offense'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Scores on open layups',
      'Takes shots within range',
      'Can handle ball under light pressure'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Scores from multiple positions',
      'Can create off the dribble',
      'Finishes through contact'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Reliable scorer',
      'Uses pump fakes effectively',
      'Draws fouls on drives'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Go-to scorer for team',
      'Multiple moves to basket',
      'Mid-range game developing'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Dominant scorer',
      'Scores against any defense',
      'Clutch performer'
    ]
  }
};

// U14-U16 advanced benchmarks
DEFAULT_MATCH_BENCHMARKS['u14-u16_defense'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Understands defensive assignments',
      'Can switch on screens',
      'Positioning needs work'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Consistent man defense',
      'Fights through screens',
      'Help and recover developing'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Solid perimeter defender',
      'Smart help defense',
      'Can guard pick and roll'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Takes on tough assignments',
      'Anchor of team defense',
      'Forces turnovers regularly'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'All-defensive caliber',
      'Guards best opponent player',
      'Game-changing defensive impact'
    ]
  }
};

DEFAULT_MATCH_BENCHMARKS['u14-u16_shotSelection'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Takes some contested shots',
      'Range awareness developing',
      'Needs reminders on shot clock'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Mostly takes good shots',
      'Reads defense before shooting',
      'Shot selection improving'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'High IQ shot selection',
      'Shoots in rhythm',
      'Passes up tough shots'
    ]
  },
  4: {
    label: 'Proficient',
    criteria: [
      'Creates quality looks',
      'Late game shot selection excellent',
      'Knows when to shoot vs drive'
    ]
  },
  5: {
    label: 'Elite',
    criteria: [
      'Perfect shot selection',
      'High efficiency scorer',
      'Big shot maker'
    ]
  }
};

// Helper function to get benchmarks for a specific age group and metric
export const getMatchBenchmark = (ageGroupId, metricId) => {
  const docId = `${ageGroupId}_${metricId}`;
  return DEFAULT_MATCH_BENCHMARKS[docId] || null;
};

// Helper function to determine match age group from team age group
export const getMatchAgeGroupFromTeam = (teamAgeGroup) => {
  if (!teamAgeGroup) return MATCH_AGE_GROUPS[0];

  const age = teamAgeGroup.toUpperCase();

  if (age.includes('U8') || age.includes('U9') || age.includes('U10')) {
    return MATCH_AGE_GROUPS[0]; // u8-u10
  }
  if (age.includes('U10') || age.includes('U11') || age.includes('U12')) {
    return MATCH_AGE_GROUPS[1]; // u10-u12
  }
  if (age.includes('U12') || age.includes('U13') || age.includes('U14')) {
    return MATCH_AGE_GROUPS[2]; // u12-u14
  }
  if (age.includes('U14') || age.includes('U15') || age.includes('U16')) {
    return MATCH_AGE_GROUPS[3]; // u14-u16
  }
  if (age.includes('U16') || age.includes('U17') || age.includes('U18')) {
    return MATCH_AGE_GROUPS[4]; // u16-u18
  }

  return MATCH_AGE_GROUPS[1]; // Default to u10-u12
};

// Helper function to get all criteria for a level
export const getLevelCriteria = (ageGroupId, metricId, level) => {
  const benchmark = getMatchBenchmark(ageGroupId, metricId);
  if (!benchmark || !benchmark.levels[level]) return [];
  return benchmark.levels[level].criteria || [];
};

export default DEFAULT_MATCH_BENCHMARKS;
