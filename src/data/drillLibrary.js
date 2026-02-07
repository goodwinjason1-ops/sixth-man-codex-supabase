// Drill Library - Pre-built drills organized by skill category
// Used by the Training Plan Builder

import { SKILL_CATEGORIES } from './skillBenchmarks';

export const DRILL_LIBRARY = [
  // Ball Handling Drills
  {
    id: 'bh-1',
    name: 'Stationary Dribbling Series',
    skillFocus: 'ball-handling',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12'],
    description: 'Players dribble in place with right hand, left hand, alternating hands. Focus on keeping head up and pushing the ball down firmly.',
    keyPoints: [
      'Fingertips, not palms',
      'Eyes up, not on the ball',
      'Stay low in athletic stance'
    ]
  },
  {
    id: 'bh-2',
    name: 'Cone Weave Dribbling',
    skillFocus: 'ball-handling',
    duration: 15,
    equipment: ['Basketballs', 'Cones (6-8)'],
    difficulty: 'intermediate',
    ageGroups: ['U10', 'U12', 'U14'],
    description: 'Set up cones in a line 3 feet apart. Players weave through cones using crossover dribbles, switching hands at each cone.',
    keyPoints: [
      'Change direction with crossover',
      'Protect the ball when changing hands',
      'Accelerate out of moves'
    ]
  },
  {
    id: 'bh-3',
    name: 'Dribble Tag',
    skillFocus: 'ball-handling',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12'],
    description: 'All players dribble in a confined area. One player is "it" and must tag others while everyone dribbles. If tagged or lose the ball, you become "it".',
    keyPoints: [
      'Keep head up to see taggers',
      'Change speed and direction',
      'Protect the ball'
    ]
  },
  {
    id: 'bh-4',
    name: 'Two-Ball Dribbling',
    skillFocus: 'ball-handling',
    duration: 12,
    equipment: ['2 Basketballs per player'],
    difficulty: 'advanced',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'Players dribble two balls simultaneously - same rhythm, alternating rhythm, one high/one low. Progress to walking then jogging.',
    keyPoints: [
      'Start stationary',
      'Focus on equal power both hands',
      'Keep balls at same height'
    ]
  },
  {
    id: 'bh-5',
    name: 'Speed Dribble Relay',
    skillFocus: 'ball-handling',
    duration: 10,
    equipment: ['Basketballs', 'Cones'],
    difficulty: 'intermediate',
    ageGroups: ['U10', 'U12', 'U14'],
    description: 'Teams race to dribble full court and back. Focus on controlled speed dribbling with the ball out in front.',
    keyPoints: [
      'Push ball ahead at speed',
      'Outside hand for protection',
      'Sprint, dont jog'
    ]
  },

  // Passing & Receiving Drills
  {
    id: 'pr-1',
    name: 'Partner Passing',
    skillFocus: 'passing-receiving',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12'],
    description: 'Partners face each other 10 feet apart. Practice chest passes, bounce passes, and overhead passes. 10 of each type.',
    keyPoints: [
      'Step into passes',
      'Thumbs down on follow through',
      'Receive with hands ready'
    ]
  },
  {
    id: 'pr-2',
    name: 'Star Passing',
    skillFocus: 'passing-receiving',
    duration: 12,
    equipment: ['Basketballs (2-3)'],
    difficulty: 'intermediate',
    ageGroups: ['U10', 'U12', 'U14'],
    description: '5 players form a star pattern. Pass to player two spots away. Add second and third ball for challenge. Rotate positions.',
    keyPoints: [
      'Call for the ball',
      'Lead the receiver',
      'Keep moving after passing'
    ]
  },
  {
    id: 'pr-3',
    name: 'Monkey in the Middle',
    skillFocus: 'passing-receiving',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12'],
    description: 'Three players - two on outside, one defender in middle. Outside players pass while defender tries to intercept. Rotate after 5 passes or steal.',
    keyPoints: [
      'Use fakes before passing',
      'Pass away from defender',
      'Move to create passing lanes'
    ]
  },
  {
    id: 'pr-4',
    name: 'Outlet Pass Drill',
    skillFocus: 'passing-receiving',
    duration: 12,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'Practice fast break outlet passes. Rebounder grabs ball, pivots, and throws overhead outlet pass to guard on the wing who sprints up the court.',
    keyPoints: [
      'Chin the ball after rebound',
      'Strong two-hand overhead pass',
      'Hit the running player in stride'
    ]
  },

  // Shooting Drills
  {
    id: 'sh-1',
    name: 'Form Shooting',
    skillFocus: 'shooting',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12'],
    description: 'Players shoot from 3-5 feet from the basket focusing on proper form. BEEF: Balance, Eyes, Elbow, Follow-through.',
    keyPoints: [
      'Feet shoulder width apart',
      'Elbow under the ball',
      'Hold follow through'
    ]
  },
  {
    id: 'sh-2',
    name: 'Around the World',
    skillFocus: 'shooting',
    duration: 15,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U10', 'U12', 'U14'],
    description: 'Players shoot from 5-7 spots around the key. Must make a shot before moving to next spot. First to complete circuit wins.',
    keyPoints: [
      'Consistent routine at each spot',
      'Square up to basket',
      'Same form every shot'
    ]
  },
  {
    id: 'sh-3',
    name: 'Mikan Drill',
    skillFocus: 'shooting',
    duration: 8,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12', 'U14'],
    description: 'Players stand under the basket and continuously make layups, alternating sides. Focus on footwork and using the backboard.',
    keyPoints: [
      'Use opposite foot to push off',
      'Use backboard',
      'Soft touch off glass'
    ]
  },
  {
    id: 'sh-4',
    name: 'Spot Shooting Competition',
    skillFocus: 'shooting',
    duration: 15,
    equipment: ['Basketballs', 'Cones'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'Players shoot from 5 marked spots. Score 1 point per make. First to 10 wins. Loser does 5 pushups.',
    keyPoints: [
      'Quick release',
      'Consistent footwork',
      'Mental toughness under pressure'
    ]
  },
  {
    id: 'sh-5',
    name: 'Free Throw Challenge',
    skillFocus: 'shooting',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U10', 'U12', 'U14', 'U16'],
    description: 'Each player shoots 10 free throws. Track team total. Establish routine: bounce, breath, shoot.',
    keyPoints: [
      'Same routine every time',
      'Focus on a specific spot on the rim',
      'Relax shoulders before shooting'
    ]
  },

  // Footwork Drills
  {
    id: 'fw-1',
    name: 'Pivot Series',
    skillFocus: 'footwork',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12'],
    description: 'Players practice front pivots and reverse pivots on whistle commands. Alternate pivot foot. Progress to pivoting with ball.',
    keyPoints: [
      'Establish pivot foot first',
      'Stay low and balanced',
      'Protect the ball while pivoting'
    ]
  },
  {
    id: 'fw-2',
    name: 'Jump Stop Practice',
    skillFocus: 'footwork',
    duration: 8,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12'],
    description: 'Players dribble and perform jump stops on whistle. Land on both feet simultaneously. Practice picking up dribble cleanly.',
    keyPoints: [
      'Land on both feet at same time',
      'Knees bent, ready to move',
      'Either foot can become pivot'
    ]
  },
  {
    id: 'fw-3',
    name: 'Defensive Slide Drill',
    skillFocus: 'footwork',
    duration: 10,
    equipment: ['Cones'],
    difficulty: 'intermediate',
    ageGroups: ['U10', 'U12', 'U14'],
    description: 'Set up cones in zigzag pattern. Players defensive slide between cones, staying low. Focus on not crossing feet.',
    keyPoints: [
      'Stay low in stance',
      'Push off back foot',
      'Never cross your feet'
    ]
  },
  {
    id: 'fw-4',
    name: 'Triple Threat Position',
    skillFocus: 'footwork',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U10', 'U12', 'U14'],
    description: 'Players catch ball and get into triple threat position (can shoot, pass, or dribble). Practice jab steps, shot fakes, and drive moves.',
    keyPoints: [
      'Ball on hip, ready to move',
      'Knees bent, athletic stance',
      'Eyes on defense, not ball'
    ]
  },

  // Defense Drills
  {
    id: 'df-1',
    name: 'Defensive Stance Drill',
    skillFocus: 'defense',
    duration: 8,
    equipment: [],
    difficulty: 'beginner',
    ageGroups: ['U8', 'U10', 'U12'],
    description: 'Players hold defensive stance for timed intervals (20-30 seconds). Focus on proper positioning: feet wide, butt low, hands active.',
    keyPoints: [
      'Feet wider than shoulders',
      'Butt down, chest up',
      'Hands ready to contest'
    ]
  },
  {
    id: 'df-2',
    name: 'Closeout Drill',
    skillFocus: 'defense',
    duration: 12,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'Defender starts under basket, closes out to offensive player on wing. Offense tries to score. Focus on choppy steps and hands up.',
    keyPoints: [
      'Sprint then choppy steps',
      'Hands high to contest shot',
      'Stay balanced, dont fly by'
    ]
  },
  {
    id: 'df-3',
    name: 'Shell Drill',
    skillFocus: 'defense',
    duration: 15,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: '4 on 4 half court. Offense passes around perimeter while defense practices help positioning, rotations, and communication.',
    keyPoints: [
      'See ball and man',
      'Communicate switches',
      'Jump to the ball on passes'
    ]
  },
  {
    id: 'df-4',
    name: '1-on-1 Live Defense',
    skillFocus: 'defense',
    duration: 12,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U10', 'U12', 'U14'],
    description: 'Pairs play 1-on-1 from the wing. Defense must stay in front without fouling. Offense gets 3 dribbles max. Rotate after each possession.',
    keyPoints: [
      'Stay between player and basket',
      'Use feet, not hands',
      'Contest every shot'
    ]
  },

  // Off-Ball Movement Drills
  {
    id: 'ob-1',
    name: 'V-Cut Drill',
    skillFocus: 'off-ball-movement',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U10', 'U12', 'U14'],
    description: 'Players practice V-cuts to get open. Walk defender down, plant, push off and cut back to ball. Receive pass and shoot or drive.',
    keyPoints: [
      'Sell the cut with your eyes',
      'Change of speed is key',
      'Call for the ball'
    ]
  },
  {
    id: 'ob-2',
    name: 'Backdoor Cut Drill',
    skillFocus: 'off-ball-movement',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'When overplayed, offensive player sets up defender then cuts backdoor to basket. Passer delivers bounce pass for layup.',
    keyPoints: [
      'Set up the cut',
      'Explode to basket',
      'Receive ball with outside hand'
    ]
  },
  {
    id: 'ob-3',
    name: 'Screen Away Drill',
    skillFocus: 'off-ball-movement',
    duration: 12,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'Practice setting and using screens away from the ball. Screener sets solid screen, cutter uses screen to get open for catch and shoot.',
    keyPoints: [
      'Screener: wide base, hands in',
      'Cutter: set up defender first',
      'Read the defense'
    ]
  },

  // Team Play Drills
  {
    id: 'tp-1',
    name: '3-on-2 Fast Break',
    skillFocus: 'team-play',
    duration: 15,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: '3 offensive players attack 2 defenders in fast break situation. Focus on filling lanes, making quick decisions, and getting best shot.',
    keyPoints: [
      'Fill the lanes wide',
      'Middle player is the decision maker',
      'Attack before defense sets'
    ]
  },
  {
    id: 'tp-2',
    name: 'Give and Go Drill',
    skillFocus: 'team-play',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'beginner',
    ageGroups: ['U10', 'U12', 'U14'],
    description: 'Basic give and go action. Player passes to teammate, cuts to basket, receives return pass for layup. Add defender for challenge.',
    keyPoints: [
      'Pass and cut immediately',
      'Cut hard to the basket',
      'Passer leads the cutter'
    ]
  },
  {
    id: 'tp-3',
    name: 'Pick and Roll Basics',
    skillFocus: 'team-play',
    duration: 15,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'Practice basic pick and roll action. Screener sets screen, ball handler uses screen, screener rolls to basket. Focus on timing and reads.',
    keyPoints: [
      'Screener must be set',
      'Ball handler sets up defender',
      'Roll hard to the basket'
    ]
  },
  {
    id: 'tp-4',
    name: '5-on-0 Motion Offense',
    skillFocus: 'team-play',
    duration: 12,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'Team runs through motion offense without defense. Focus on spacing, cutting, screening, and ball movement. Call out actions.',
    keyPoints: [
      'Maintain proper spacing',
      'Move with purpose',
      'Communicate constantly'
    ]
  },

  // Basketball IQ Drills
  {
    id: 'bq-1',
    name: 'Advantage/Disadvantage Recognition',
    skillFocus: 'basketball-iq',
    duration: 15,
    equipment: ['Basketballs'],
    difficulty: 'intermediate',
    ageGroups: ['U12', 'U14', 'U16'],
    description: 'Play 3-on-3 but coach calls out advantages (2-on-1, etc). Players must quickly recognize and exploit the advantage.',
    keyPoints: [
      'See the floor',
      'Attack mismatches',
      'Make quick decisions'
    ]
  },
  {
    id: 'bq-2',
    name: 'Clock Management Drill',
    skillFocus: 'basketball-iq',
    duration: 10,
    equipment: ['Basketballs'],
    difficulty: 'advanced',
    ageGroups: ['U14', 'U16'],
    description: 'Scrimmage with game situations: up by 3 with 30 seconds left, down by 1 needing to foul, etc. Focus on smart decision making.',
    keyPoints: [
      'Know the score and time',
      'When to foul, when to let play',
      'Manage possessions wisely'
    ]
  },
  {
    id: 'bq-3',
    name: 'Film Session Discussion',
    skillFocus: 'basketball-iq',
    duration: 15,
    equipment: ['Video playback device'],
    difficulty: 'beginner',
    ageGroups: ['U10', 'U12', 'U14', 'U16'],
    description: 'Watch game film together. Pause and discuss: What should happen here? Why did this work? What could be better?',
    keyPoints: [
      'Learn to read the game',
      'Understand spacing',
      'Recognize patterns'
    ]
  }
];

// Group drills by skill category
export const getDrillsByCategory = (skillId) => {
  return DRILL_LIBRARY.filter(drill => drill.skillFocus === skillId);
};

// Get drills suitable for an age group
export const getDrillsByAgeGroup = (ageGroup) => {
  return DRILL_LIBRARY.filter(drill => drill.ageGroups.includes(ageGroup));
};

// Search drills by name or description
export const searchDrills = (query) => {
  const lowerQuery = query.toLowerCase();
  return DRILL_LIBRARY.filter(drill =>
    drill.name.toLowerCase().includes(lowerQuery) ||
    drill.description.toLowerCase().includes(lowerQuery) ||
    drill.skillFocus.toLowerCase().includes(lowerQuery)
  );
};

// Get drill by ID
export const getDrillById = (drillId) => {
  return DRILL_LIBRARY.find(drill => drill.id === drillId);
};

// Sample warm-up activities
export const WARMUP_TEMPLATES = [
  {
    id: 'wu-1',
    name: 'Dynamic Stretching',
    duration: 5,
    description: 'Arm circles, leg swings, high knees, butt kicks, lunges with twist. 30 seconds each exercise.'
  },
  {
    id: 'wu-2',
    name: 'Jogging and Layup Lines',
    duration: 8,
    description: '2 laps jogging around the court, then right hand layups for 2 minutes, left hand layups for 2 minutes.'
  },
  {
    id: 'wu-3',
    name: 'Ball Handling Warm-up',
    duration: 5,
    description: 'Stationary dribbling: pound dribbles, crossovers, between legs, behind back. 30 seconds each.'
  },
  {
    id: 'wu-4',
    name: 'Partner Passing Warm-up',
    duration: 5,
    description: 'Pairs spread out. 10 chest passes, 10 bounce passes, 10 overhead passes each. Increase distance.'
  }
];

// Sample cool-down activities
export const COOLDOWN_TEMPLATES = [
  {
    id: 'cd-1',
    name: 'Static Stretching',
    duration: 5,
    description: 'Hold each stretch 30 seconds: quad stretch, hamstring stretch, calf stretch, shoulder stretch, tricep stretch.'
  },
  {
    id: 'cd-2',
    name: 'Free Throw Shooting',
    duration: 5,
    description: 'Each player shoots 5 free throws. Focus on relaxation and proper form.'
  },
  {
    id: 'cd-3',
    name: 'Team Circle Discussion',
    duration: 5,
    description: 'Gather team in circle. Review what was learned today. Praise effort and teamwork.'
  }
];

// Sample small-sided games
export const SMALL_SIDED_GAMES = [
  {
    id: 'sg-1',
    name: '3-on-3 Half Court',
    duration: 10,
    description: 'Teams of 3 play half court. Make it, take it. First to 5 wins. Losers do 5 pushups.'
  },
  {
    id: 'sg-2',
    name: 'King of the Court',
    duration: 12,
    description: '2-on-2 or 3-on-3. Winners stay on, losers off. Team must win 3 in a row to be crowned.'
  },
  {
    id: 'sg-3',
    name: '1-on-1 Tournament',
    duration: 15,
    description: 'Bracket tournament. Games to 3 points. Winner advances. Great for competitive intensity.'
  },
  {
    id: 'sg-4',
    name: 'Scrimmage with Modifications',
    duration: 15,
    description: 'Full 5-on-5 but with rules: must pass 3 times before shooting, or only layups allowed, etc.'
  }
];

export default DRILL_LIBRARY;
