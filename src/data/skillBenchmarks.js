// Skill Benchmarks Data Structure
// Document ID format: {ageGroupId}_{skillCategoryId}
// Each document contains criteria for each of the 4 proficiency levels

export const AGE_GROUPS = [
  { id: 'u8', name: 'Under 8', minAge: 5, maxAge: 8 },
  { id: 'u10', name: 'Under 10', minAge: 8, maxAge: 10 },
  { id: 'u12', name: 'Under 12', minAge: 10, maxAge: 12 },
  { id: 'u14', name: 'Under 14', minAge: 12, maxAge: 14 },
  { id: 'u16', name: 'Under 16', minAge: 14, maxAge: 16 }
];

export const SKILL_CATEGORIES = [
  { id: 'ball-handling', name: 'Ball Handling' },
  { id: 'passing-receiving', name: 'Passing & Receiving' },
  { id: 'shooting', name: 'Shooting' },
  { id: 'footwork', name: 'Footwork' },
  { id: 'defense', name: 'Defense' },
  { id: 'off-ball-movement', name: 'Off-Ball Movement' },
  { id: 'team-play', name: 'Team Play' },
  { id: 'basketball-iq', name: 'Basketball IQ' }
];

export const LEVEL_LABELS = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Confident Leader'
};

// Default benchmark structure with placeholder criteria
// This will be used as seed data for Firestore
export const DEFAULT_BENCHMARKS = {};

// Generate benchmark documents for all age group + skill combinations
AGE_GROUPS.forEach(ageGroup => {
  SKILL_CATEGORIES.forEach(skill => {
    const docId = `${ageGroup.id}_${skill.id}`;
    DEFAULT_BENCHMARKS[docId] = {
      ageGroupId: ageGroup.id,
      ageGroupName: ageGroup.name,
      skillId: skill.id,
      skillName: skill.name,
      levels: {
        1: {
          label: 'Emerging',
          criteria: [
            // Example: 'Can dribble the ball while stationary'
          ]
        },
        2: {
          label: 'Developing',
          criteria: []
        },
        3: {
          label: 'Competent',
          criteria: []
        },
        4: {
          label: 'Confident Leader',
          criteria: []
        }
      },
      lastUpdated: null,
      updatedBy: null
    };
  });
});

// Sample benchmarks with actual criteria for demonstration
// These will be editable by admins

// U10 Ball Handling
DEFAULT_BENCHMARKS['u10_ball-handling'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Can dribble with dominant hand while stationary',
      'Looks at the ball while dribbling',
      'Basic understanding of carrying/double-dribble rules'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Can dribble with both hands separately',
      'Beginning to move while dribbling',
      'Can protect the ball from a passive defender'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Can dribble with head up most of the time',
      'Can change direction while dribbling',
      'Comfortable with basic crossover moves'
    ]
  },
  4: {
    label: 'Confident Leader',
    criteria: [
      'Excellent ball control with either hand',
      'Can dribble through traffic effectively',
      'Demonstrates hesitation and change-of-pace moves',
      'Helps teach younger players'
    ]
  }
};

// U10 Shooting
DEFAULT_BENCHMARKS['u10_shooting'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Uses two hands to push the ball toward the basket',
      'Understands the concept of aiming',
      'Can shoot from very close range (1-2 meters)'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Beginning to use proper shooting form',
      'Can make layups from dominant side',
      'Shows consistent follow-through'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Proper shooting mechanics with good form',
      'Can make layups from both sides',
      'Consistent free throw technique'
    ]
  },
  4: {
    label: 'Confident Leader',
    criteria: [
      'Reliable shooting from close-mid range',
      'Good shot selection awareness',
      'Can shoot off the dribble',
      'Confident under pressure'
    ]
  }
};

// U12 Ball Handling
DEFAULT_BENCHMARKS['u12_ball-handling'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Can dribble while walking with either hand',
      'Basic crossover dribble attempted',
      'Still looks at ball frequently'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Can dribble at jogging pace with control',
      'Crossover dribble becoming consistent',
      'Can protect ball from active defender'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Confident dribbling with either hand at speed',
      'Multiple dribble moves in repertoire',
      'Can drive to basket off the dribble',
      'Good head position while dribbling'
    ]
  },
  4: {
    label: 'Confident Leader',
    criteria: [
      'Advanced handles - between legs, behind back',
      'Can break down defenders 1-on-1',
      'Creates opportunities for teammates',
      'Mentors younger players on ball handling'
    ]
  }
};

// U12 Passing & Receiving
DEFAULT_BENCHMARKS['u12_passing-receiving'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Can make chest pass to stationary target',
      'Receives pass but may fumble',
      'Understands when to pass vs dribble'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Chest and bounce pass with decent accuracy',
      'Can catch and secure passes consistently',
      'Beginning to read open teammates'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Multiple pass types executed well',
      'Can pass on the move',
      'Receives passes and transitions quickly',
      'Good court vision developing'
    ]
  },
  4: {
    label: 'Confident Leader',
    criteria: [
      'Excellent court vision and passing accuracy',
      'Can make skip passes and entry passes',
      'Creates scoring opportunities for others',
      'Leads by example in ball movement'
    ]
  }
};

// U14 Defense
DEFAULT_BENCHMARKS['u14_defense'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Understands basic defensive stance',
      'Can guard ball handler in isolation',
      'Beginning to learn help defense concept'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Maintains defensive stance for longer periods',
      'Can slide laterally to stay with opponent',
      'Understands on-ball vs off-ball positioning'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Good close-out technique',
      'Provides help defense and recovers',
      'Can defend screens with proper technique',
      'Contests shots without fouling'
    ]
  },
  4: {
    label: 'Confident Leader',
    criteria: [
      'Excellent anticipation and positioning',
      'Communicates defensive assignments',
      'Can guard multiple positions',
      'Forces turnovers through smart play',
      'Organizes team defense'
    ]
  }
};

// U14 Basketball IQ
DEFAULT_BENCHMARKS['u14_basketball-iq'].levels = {
  1: {
    label: 'Emerging',
    criteria: [
      'Understands basic rules of the game',
      'Knows player positions',
      'Beginning to recognize when to shoot vs pass'
    ]
  },
  2: {
    label: 'Developing',
    criteria: [
      'Makes reasonable decisions with the ball',
      'Understands basic offensive concepts',
      'Beginning to read defense'
    ]
  },
  3: {
    label: 'Competent',
    criteria: [
      'Good decision making under pressure',
      'Understands spacing and floor balance',
      'Recognizes and reacts to defensive schemes',
      'Makes smart plays consistently'
    ]
  },
  4: {
    label: 'Confident Leader',
    criteria: [
      'Excellent court awareness and anticipation',
      'Makes teammates better through smart play',
      'Can coach others on positioning',
      'Understands game situations (clock, fouls, score)'
    ]
  }
};

// Helper function to get benchmarks for a specific age group and skill
export const getBenchmark = (ageGroupId, skillId) => {
  const docId = `${ageGroupId.toLowerCase()}_${skillId}`;
  return DEFAULT_BENCHMARKS[docId] || null;
};

// Helper function to determine age group from player age or team name
export const getAgeGroupFromTeam = (teamName) => {
  const teamNameUpper = teamName?.toUpperCase() || '';
  for (const ageGroup of AGE_GROUPS) {
    if (teamNameUpper.includes(ageGroup.id.toUpperCase())) {
      return ageGroup;
    }
  }
  return AGE_GROUPS[1]; // Default to U10 if not found
};

// Helper function to get age group from player's birth date
export const getAgeGroupFromBirthDate = (birthDate) => {
  if (!birthDate) return AGE_GROUPS[1]; // Default to U10

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  // Find appropriate age group
  for (const group of AGE_GROUPS) {
    if (age < group.maxAge) {
      return group;
    }
  }
  return AGE_GROUPS[AGE_GROUPS.length - 1]; // Return oldest group if over 16
};
