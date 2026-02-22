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
    id: 'template_full_skills',
    name: 'Full Skills Development (Multi-Session)',
    isTemplate: true,
    status: 'active',
    duration: 'monthly',
    focusAreas: ['ball-handling', 'shooting', 'defense', 'passing-receiving'],
    sessions: [
      {
        sessionNumber: 1,
        warmUp: 'Dynamic stretching, ball-handling warm-up (5 min)',
        drills: [
          { name: 'Ball Handling Circuit', duration: 10, description: 'Stations: crossovers, between legs, behind back, spin moves' },
          { name: 'Passing Pairs', duration: 10, description: 'Chest pass, bounce pass, overhead pass — stationary then moving' }
        ],
        coolDown: 'Free throws and stretch'
      },
      {
        sessionNumber: 2,
        warmUp: 'Layup lines both sides (5 min)',
        drills: [
          { name: 'Shooting Stations', duration: 15, description: 'Rotate through mid-range, 3-point, and free throw stations' },
          { name: 'Defensive Slides', duration: 10, description: 'Lateral slides, drop steps, close-outs at game speed' }
        ],
        coolDown: 'Cool-down jog and team stretch'
      },
      {
        sessionNumber: 3,
        warmUp: 'Partner passing warm-up on the move (5 min)',
        drills: [
          { name: '3v3 Half Court', duration: 15, description: 'Small-sided game focusing on spacing and movement' },
          { name: 'Fast Break 2v1', duration: 10, description: 'Outlet pass to fast break — decision making under pressure' }
        ],
        coolDown: 'Game review discussion, static stretching'
      },
      {
        sessionNumber: 4,
        warmUp: 'Shooting warm-up (form shots close range) 5 min',
        drills: [
          { name: 'Scrimmage', duration: 20, description: '5v5 full court — coaches stop play to teach situations' },
          { name: 'End-of-Game Scenarios', duration: 10, description: 'Down 2 with 30 seconds left, inbound plays, free throw situations' }
        ],
        coolDown: 'Season goals discussion, stretch'
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'template_game_ready',
    name: 'Game-Ready Practice',
    isTemplate: true,
    status: 'active',
    duration: 'single',
    focusAreas: ['team-play', 'basketball-iq'],
    sessions: [
      {
        sessionNumber: 1,
        warmUp: 'Dynamic warm-up with ball (layup lines, passing lanes) 8 min',
        drills: [
          { name: 'Set Plays Walkthrough', duration: 10, description: 'Walk through 2-3 offensive sets at half speed, then full speed' },
          { name: 'Defensive Rotations', duration: 10, description: 'Shell drill into live 5v5 — focus on help rotations and communication' },
          { name: 'Press Break', duration: 8, description: 'Practice inbound vs full-court press — 2 different formations' },
          { name: 'Controlled Scrimmage', duration: 15, description: '5v5 with coach whistles — stop and correct, focus on executing sets' }
        ],
        smallSidedGames: '3v3 king of the court — losers out, winners stay. First to 7.',
        coolDown: 'Team huddle — go over game plan, free throws, light stretch'
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];
