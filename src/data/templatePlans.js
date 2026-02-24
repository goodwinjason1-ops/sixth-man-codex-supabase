/**
 * Template Training Plans
 * These are system-provided templates that coaches can duplicate and customise.
 * IDs are deterministic (template_*) to prevent duplicate seeding.
 */

export const TEMPLATE_PLANS = [
  {
    id: 'template_ball_handling',
    name: 'Ball Handling & Dribbling Focus',
    isTemplate: true,
    status: 'active',
    duration: 'weekly',
    focusAreas: ['ball-handling'],
    sessions: [
      {
        sessionNumber: 1,
        warmUp: 'Dynamic stretching circuit (5 min), light jog with ball (3 min)',
        drills: [
          { name: 'Stationary Dribble Series', duration: 10, description: 'Right hand, left hand, crossover, between legs — 30 sec each' },
          { name: 'Cone Zigzag Dribble', duration: 10, description: 'Weave through cones using crossover dribbles at speed' },
          { name: 'Partner Mirror Dribble', duration: 10, description: 'One player leads, other mirrors movements while dribbling' }
        ],
        coolDown: 'Static stretching, ball control challenge (around the waist, figure 8)'
      },
      {
        sessionNumber: 2,
        warmUp: 'Ball-handling warm-up (figure 8s, spider dribble) 5 min',
        drills: [
          { name: 'Full Court Dribble Attack', duration: 12, description: 'Speed dribble baseline to baseline with change of direction at half court' },
          { name: 'Pressure Dribble 1v1', duration: 12, description: 'Live defender, dribbler must advance past half court' },
          { name: '2-Ball Dribble Challenge', duration: 8, description: 'Dribble two balls simultaneously — stationary then walking' }
        ],
        coolDown: 'Free throw shooting (focus on routine), light stretch'
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'template_shooting',
    name: 'Shooting Fundamentals Workshop',
    isTemplate: true,
    status: 'active',
    duration: 'weekly',
    focusAreas: ['shooting'],
    sessions: [
      {
        sessionNumber: 1,
        warmUp: 'Form shooting (close range, no backboard) 5 min, dynamic stretching',
        drills: [
          { name: 'Catch & Shoot Series', duration: 12, description: '5 spots around the arc — catch from passer, square up, shoot. 3 makes per spot.' },
          { name: 'Free Throw Routine', duration: 8, description: 'Shoot 2 free throws, rotate. Focus on consistent pre-shot routine.' },
          { name: 'Elbow Shooting', duration: 10, description: 'Mid-range shots from both elbows — catch, one dribble pull-up' }
        ],
        coolDown: 'Partner shooting game (H-O-R-S-E or knockout), stretch'
      },
      {
        sessionNumber: 2,
        warmUp: 'Mikan drill (2 min each side), layup lines (3 min)',
        drills: [
          { name: 'Spot-Up 3-Point Shooting', duration: 12, description: 'Rotate through 5 spots behind the arc. Track makes out of 10 per spot.' },
          { name: 'Off-Screen Shooting', duration: 10, description: 'Sprint off a screen (chair/cone), catch pass, shoot. Alternate sides.' },
          { name: 'Contested Close-Outs', duration: 10, description: 'Shooter catches ball, defender closes out. Shoot, drive, or pass based on close-out angle.' }
        ],
        coolDown: 'Free throw challenge (make 10 before leaving), cool-down stretch'
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'template_defense',
    name: 'Defensive Skills Session',
    isTemplate: true,
    status: 'active',
    duration: 'single',
    focusAreas: ['defense'],
    sessions: [
      {
        sessionNumber: 1,
        warmUp: 'Defensive slides (baseline to baseline), close-out footwork drill (5 min)',
        drills: [
          { name: '1-on-1 Deny & Contest', duration: 12, description: 'Defender denies wing entry pass. If offence catches, play live 1v1 to a stop.' },
          { name: 'Shell Drill (4-on-4)', duration: 15, description: 'Offence passes around the perimeter. Defence practices help-side positioning and rotations.' },
          { name: 'Box-Out Rebounding', duration: 10, description: 'Coach shoots, defenders must box out and secure rebound. Offence crashes the boards.' },
          { name: 'Transition Defence Sprint', duration: 8, description: '3v2 fast break — two defenders must communicate and stop the ball until help arrives.' }
        ],
        coolDown: 'Team talk on defensive principles, light jog, stretching'
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'template_passing',
    name: 'Passing & Court Vision',
    isTemplate: true,
    status: 'active',
    duration: 'weekly',
    focusAreas: ['passing-receiving'],
    sessions: [
      {
        sessionNumber: 1,
        warmUp: 'Partner passing warm-up (chest, bounce, overhead) 5 min, dynamic stretching',
        drills: [
          { name: 'Two-Ball Partner Passing', duration: 10, description: 'Partners pass two balls simultaneously — one chest, one bounce. Builds coordination and peripheral vision.' },
          { name: 'Circle Passing Drill', duration: 10, description: 'Players in a circle, 2 balls moving. Call names before passing. Develops communication and court awareness.' },
          { name: 'Baseball Pass Outlet', duration: 10, description: 'Full-court outlet passes to a running partner. Focus on accuracy and leading the receiver.' }
        ],
        coolDown: 'Free throw shooting with pass-first entry, light stretch'
      },
      {
        sessionNumber: 2,
        warmUp: 'Jog with ball, passing on the move in pairs (5 min)',
        drills: [
          { name: '3-Man Weave', duration: 12, description: 'Classic 3-man weave full court. Finish with a layup. Rotate lines.' },
          { name: 'Skip Pass & Drive', duration: 10, description: 'Skip pass across, catch and drive or kick out. Read the defence.' },
          { name: 'Pressure Passing 2v1', duration: 10, description: 'Two offensive players must complete 10 passes while one defender tries to intercept. No dribbling.' }
        ],
        coolDown: 'Passing accuracy challenge (hit targets on wall), cool-down stretch'
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'template_team_play',
    name: 'Team Play & Offensive Sets',
    isTemplate: true,
    status: 'active',
    duration: 'weekly',
    focusAreas: ['team-play', 'basketball-iq'],
    sessions: [
      {
        sessionNumber: 1,
        warmUp: 'Dynamic warm-up with ball (layup lines, passing lanes) 8 min',
        drills: [
          { name: 'Set Plays Walkthrough', duration: 12, description: 'Walk through 2-3 offensive sets at half speed, then full speed. Focus on timing and spacing.' },
          { name: '5-on-0 Motion Offence', duration: 10, description: 'Run motion offence principles without defence. Emphasise cuts, screens, and ball reversal.' },
          { name: 'Screen & Roll Series', duration: 10, description: 'Pick-and-roll, pick-and-pop variations. Ball handler reads defender and makes decision.' }
        ],
        coolDown: 'Free throw shooting, team huddle to review sets'
      },
      {
        sessionNumber: 2,
        warmUp: 'Passing warm-up, 3-man weave (5 min)',
        drills: [
          { name: 'Controlled Scrimmage', duration: 15, description: '5v5 with coach whistles — stop and correct. Focus on executing offensive sets.' },
          { name: 'Press Break', duration: 10, description: 'Practice inbound vs full-court press — 2 different formations. Communication is key.' },
          { name: 'End-of-Game Scenarios', duration: 8, description: 'Down 2 with 30 seconds left, inbound plays, free throw situations. Clock awareness.' }
        ],
        coolDown: 'Team talk on game plan, light jog, stretching'
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'template_game_prep',
    name: 'Game Day Preparation',
    isTemplate: true,
    status: 'active',
    duration: 'single',
    focusAreas: ['team-play', 'basketball-iq', 'shooting'],
    sessions: [
      {
        sessionNumber: 1,
        warmUp: 'Light jog, dynamic stretching, layup lines (10 min). Keep energy controlled — save legs for the game.',
        drills: [
          { name: 'Shooting Warm-Up', duration: 8, description: 'Form shots close range, move out to mid-range and 3-point. No rushing — focus on rhythm.' },
          { name: 'Set Plays Review', duration: 10, description: 'Walk through primary offensive sets and inbound plays at 75% speed. Verbal cues only.' },
          { name: 'Defensive Assignments', duration: 8, description: 'Review defensive matchups, help-side rotations, and transition responsibilities. Brief and focused.' },
          { name: 'Free Throw Routine', duration: 5, description: 'Each player shoots 5 free throws with their pre-game routine. Build confidence and consistency.' }
        ],
        coolDown: 'Team huddle — game plan summary, positive energy, hydration reminder'
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];
