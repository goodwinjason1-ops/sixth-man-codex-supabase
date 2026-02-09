/**
 * Interactive tutorial content data.
 * Each tutorial is a sequence of steps with visual types, content blocks, and pro tips.
 */

export const TUTORIALS = {
  // ── ASSESSOR (8 steps) ─────────────────────────────────────────────────────
  assessor: {
    id: 'assessor',
    title: 'Assessor Quick Start',
    subtitle: 'Learn to evaluate players like a pro',
    icon: 'ClipboardCheck',
    applicableRoles: ['tryout_assessor'],
    estimatedMinutes: 3,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Assessor!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'ClipboardCheck', label: 'Tryout Assessor' },
        content: [
          { type: 'paragraph', text: 'This quick tutorial will walk you through everything you need to evaluate players at tryouts. It only takes a few minutes.' },
          { type: 'paragraph', text: 'You will learn how to access sessions, rate players on 5 metrics, and submit your evaluations.' },
        ],
        proTip: null,
      },
      {
        id: 'your-dashboard',
        title: 'Your Dashboard',
        icon: 'LayoutDashboard',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Assessor Dashboard',
          annotations: [
            { label: 'Session cards', position: 'center', description: 'Tap any session to start evaluating' },
            { label: 'Status badge', position: 'top-right', description: 'Green = active, ready to score' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'When you log in, you will see all tryout sessions assigned to you. Each card shows the age group, date, time, and number of players.' },
        ],
        proTip: { text: 'Active sessions have a green badge. Tap one to jump straight into scoring.' },
      },
      {
        id: 'five-metrics',
        title: 'The 5 Metrics',
        icon: 'Star',
        visual: null,
        content: [
          { type: 'paragraph', text: 'You will rate each player from 1 to 5 on these five skill areas:' },
          {
            type: 'metric-scale',
            metrics: [
              {
                name: 'Athleticism',
                icon: 'Zap',
                levels: [
                  '1 - Well below average',
                  '2 - Below average',
                  '3 - Average for age group',
                  '4 - Above average',
                  '5 - Outstanding',
                ],
              },
              {
                name: 'Ball Skills',
                icon: 'Target',
                levels: [
                  '1 - Struggles with basics',
                  '2 - Developing fundamentals',
                  '3 - Solid fundamentals',
                  '4 - Advanced control',
                  '5 - Exceptional skill',
                ],
              },
              {
                name: 'Game IQ',
                icon: 'Brain',
                levels: [
                  '1 - Lost on court',
                  '2 - Basic awareness',
                  '3 - Reads the game',
                  '4 - Smart decisions',
                  '5 - Elite court vision',
                ],
              },
              {
                name: 'Coachability',
                icon: 'MessageSquare',
                levels: [
                  '1 - Resistant to feedback',
                  '2 - Sometimes listens',
                  '3 - Applies feedback',
                  '4 - Eager learner',
                  '5 - Absorbs and leads',
                ],
              },
              {
                name: 'Effort / Hustle',
                icon: 'Flame',
                levels: [
                  '1 - Low energy',
                  '2 - Inconsistent effort',
                  '3 - Steady effort',
                  '4 - High motor',
                  '5 - Relentless hustle',
                ],
              },
            ],
          },
        ],
        proTip: { text: 'Use the full 1-5 range! Giving everyone 3s makes it hard for coaches to differentiate players.' },
      },
      {
        id: 'scoring-a-player',
        title: 'Scoring a Player',
        icon: 'UserCheck',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Player Evaluation Card',
          annotations: [
            { label: '1-5 buttons', position: 'center', description: 'Tap a number for each metric' },
            { label: 'Notes field', position: 'bottom', description: 'Optional comments about the player' },
          ],
        },
        content: [
          { type: 'steps', items: [
            'Tap a player from the session list.',
            'Rate each of the 5 metrics by tapping 1-5.',
            'Add an optional note for anything notable.',
            'Scores save automatically — no submit button needed.',
          ]},
        ],
        proTip: { text: 'You can come back and adjust scores anytime before the session is closed.' },
      },
      {
        id: 'auto-save',
        title: 'Auto-Save & Offline',
        icon: 'Wifi',
        visual: { type: 'icon-hero', icon: 'WifiOff', label: 'Works Offline' },
        content: [
          { type: 'paragraph', text: 'Your scores save automatically as you tap each rating. If you lose internet during a session, scores are stored on your device and sync when you reconnect.' },
          { type: 'paragraph', text: 'You can return to a session later and update any scores before it is closed.' },
        ],
        proTip: null,
      },
      {
        id: 'two-stage',
        title: 'Two-Stage Tryouts',
        icon: 'Layers',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Some age groups run two-stage tryouts:' },
          { type: 'info-card', items: [
            { label: 'Hour 1 — Development', text: 'Newer players & Team 3. Focus on fundamentals.' },
            { label: 'Hour 2 — Advanced', text: 'Team 1 & 2 and promoted players. Game-based evaluation.' },
          ]},
          { type: 'paragraph', text: 'Each hour is a separate session on your dashboard. Score them independently.' },
        ],
        proTip: { text: 'Don\'t compare across hours — judge each player against their group.' },
      },
      {
        id: 'best-practices',
        title: 'Tips for Great Evals',
        icon: 'Lightbulb',
        visual: null,
        content: [
          { type: 'checklist', items: [
            'Be consistent — same standard for every player in the group.',
            'Use the full 1-5 scale to show real differences.',
            'Add notes for standout players or concerns.',
            'Watch during drills AND games — players can look different.',
            'Score what you see today, not past reputation.',
          ]},
        ],
        proTip: { text: 'Your evaluations directly help coaches make fair team placement decisions.' },
      },
      {
        id: 'complete',
        title: 'You\'re Ready!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'That\'s everything you need to know. Head to your dashboard to start evaluating players.' },
          { type: 'paragraph', text: 'You can revisit this tutorial anytime from the Help Center, or tap the "Quick Guide" button on your dashboard.' },
        ],
        proTip: null,
      },
    ],
  },

  // ── YOUTH COACH (7 steps) ──────────────────────────────────────────────────
  'youth-coach': {
    id: 'youth-coach',
    title: 'Youth Coach Quick Start',
    subtitle: 'Run amazing Little Lakers & Lakers Ready sessions',
    icon: 'BookOpen',
    applicableRoles: ['youth_coach', 'youth_head_coach'],
    estimatedMinutes: 3,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Coach!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'BookOpen', label: 'Youth Coach' },
        content: [
          { type: 'paragraph', text: 'This tutorial covers everything you need to run great youth sessions — from session plans to attendance and milestones.' },
        ],
        proTip: null,
      },
      {
        id: 'programs',
        title: 'The Programs',
        icon: 'Users',
        visual: null,
        content: [
          { type: 'info-card', items: [
            { label: 'Little Lakers (Ages 4-5)', text: 'Fun, movement, coordination, and introducing basketball. Keep it playful!' },
            { label: 'Lakers Ready (Ages 6-7)', text: 'Basic basketball skills, teamwork, and simple plays. More structure, still fun.' },
          ]},
        ],
        proTip: { text: 'For 4-5 year olds, keep instructions to 10 words or less. Demonstrate, don\'t explain.' },
      },
      {
        id: 'session-format',
        title: 'Session Format',
        icon: 'Clock',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Each 45-minute session follows this structure:' },
          { type: 'info-card', items: [
            { label: 'Warm-Up (10 min)', text: 'Fun movement games — tag, animal walks, relays.' },
            { label: 'Skill Focus (15 min)', text: 'One age-appropriate basketball skill. Short demos.' },
            { label: 'Game Time (15 min)', text: 'Modified games reinforcing the skill. Small-sided.' },
            { label: 'Cool Down (5 min)', text: 'Stretching, high-fives, positive summary.' },
          ]},
        ],
        proTip: { text: 'The session plan is pre-loaded in the app. You don\'t need to create it from scratch.' },
      },
      {
        id: 'attendance',
        title: 'Taking Attendance',
        icon: 'ClipboardList',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Session Attendance Screen',
          annotations: [
            { label: 'Player names', position: 'center', description: 'Tap to mark present' },
            { label: 'Auto-save', position: 'bottom', description: 'Saves as you go' },
          ],
        },
        content: [
          { type: 'steps', items: [
            'Open the session for today\'s date.',
            'Tap each child\'s name to mark them present.',
            'Absent children stay unchecked. It saves automatically.',
          ]},
        ],
        proTip: { text: 'Take attendance in the first few minutes while kids settle in.' },
      },
      {
        id: 'milestones',
        title: 'Milestone Tracking',
        icon: 'Award',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Track developmental milestones for each child throughout the term.' },
          { type: 'checklist', items: [
            'Little Lakers: catch bounced ball, dribble standing still, take turns, follow instructions, show sportsmanship.',
            'Lakers Ready: dribble while moving, chest pass, defensive stance, simple plays, teamwork.',
          ]},
          { type: 'paragraph', text: 'Tick off milestones as you observe them. Progress carries across sessions.' },
        ],
        proTip: { text: 'Parents are notified when their child hits a milestone — it\'s a great motivator!' },
      },
      {
        id: 'parent-comms',
        title: 'Parent Communication',
        icon: 'MessageSquare',
        visual: null,
        content: [
          { type: 'paragraph', text: 'The app handles most parent communication automatically:' },
          { type: 'checklist', items: [
            'Session reminders sent 24 hours before.',
            'Milestone achievements notified in real-time.',
            'End-of-term progress reports generated from milestone data.',
          ]},
        ],
        proTip: { text: 'If parents have questions at the session, point them to the app or their coordinator.' },
      },
      {
        id: 'complete',
        title: 'You\'re All Set!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'You\'re ready to run great youth sessions! Head to Youth Programs to see your schedule.' },
          { type: 'paragraph', text: 'Revisit this tutorial anytime from the Help Center.' },
        ],
        proTip: null,
      },
    ],
  },

  // ── COACH (7 steps) ────────────────────────────────────────────────────────
  coach: {
    id: 'coach',
    title: 'Coach Quick Start',
    subtitle: 'Manage your team, run assessments, track development',
    icon: 'Users',
    applicableRoles: ['coach'],
    estimatedMinutes: 3,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Coach!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'Users', label: 'Team Coach' },
        content: [
          { type: 'paragraph', text: 'This tutorial covers your key tools: dashboard, assessments, match day, training plans, and player development tracking.' },
        ],
        proTip: null,
      },
      {
        id: 'dashboard',
        title: 'Your Dashboard',
        icon: 'LayoutDashboard',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Coach Dashboard',
          annotations: [
            { label: 'Team roster', position: 'top-left', description: 'Your assigned players' },
            { label: 'Quick actions', position: 'bottom', description: 'Start assessment, view plans, messages' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Your dashboard shows your team roster, upcoming sessions, recent assessments, and quick action buttons.' },
        ],
        proTip: { text: 'The dashboard updates in real-time. Check it before each training session for the latest info.' },
      },
      {
        id: 'player-assessment',
        title: 'Player Assessments',
        icon: 'ClipboardCheck',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Assessment Screen',
          annotations: [
            { label: 'Player list', position: 'left', description: 'Select who to evaluate' },
            { label: 'Skill ratings', position: 'center', description: 'Rate each skill area' },
          ],
        },
        content: [
          { type: 'steps', items: [
            'From the dashboard, tap "Start Assessment".',
            'Select players from your team roster.',
            'Rate each skill area for the player\'s age group.',
            'Add notes for context. Scores save automatically.',
          ]},
        ],
        proTip: { text: 'Assess every 4-6 weeks to build a clear development picture.' },
      },
      {
        id: 'match-day',
        title: 'Match Day',
        icon: 'Trophy',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Game Day' },
        content: [
          { type: 'paragraph', text: 'Record live game performance observations using Match Day Assessment.' },
          { type: 'steps', items: [
            'Go to Coach > Match Assessment on game day.',
            'Select the game from your schedule.',
            'Record observations for each player.',
            'Submit after the game for analysis.',
          ]},
        ],
        proTip: { text: 'Use the swipe interface for quick ratings without leaving the game view.' },
      },
      {
        id: 'training-plans',
        title: 'Training Plans',
        icon: 'BookOpen',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Build and deliver structured training sessions.' },
          { type: 'steps', items: [
            'Go to Coach > Training Plans.',
            'Browse existing plans or create a new one.',
            'Add drills from the library and set durations.',
            'Assign the plan to upcoming sessions.',
          ]},
        ],
        proTip: { text: 'Toggle "Share to Library" when creating a plan to help other coaches.' },
      },
      {
        id: 'skills-passport',
        title: 'Player Development',
        icon: 'TrendingUp',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Track skill progression against age-group benchmarks through the Skills Passport.' },
          { type: 'steps', items: [
            'Open a player\'s profile from your roster.',
            'Navigate to their Skills Passport.',
            'Review current levels against benchmarks.',
            'Update after training blocks or assessments.',
          ]},
        ],
        proTip: { text: 'The Skills Passport gives parents visibility into their child\'s development.' },
      },
      {
        id: 'complete',
        title: 'You\'re Ready!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'You have all the tools to manage your team effectively. Head to your dashboard to get started.' },
          { type: 'paragraph', text: 'Revisit this tutorial anytime from the Help Center.' },
        ],
        proTip: null,
      },
    ],
  },

  // ── ADMIN (6 steps) ────────────────────────────────────────────────────────
  admin: {
    id: 'admin',
    title: 'Admin Quick Start',
    subtitle: 'Manage the club from one place',
    icon: 'Shield',
    applicableRoles: ['admin', 'president', 'vice_president', 'coach_coordinator'],
    estimatedMinutes: 2,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Admin!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'Shield', label: 'Club Administrator' },
        content: [
          { type: 'paragraph', text: 'This tutorial covers the key admin tools: user management, rosters, tryouts, analytics, and system settings.' },
        ],
        proTip: null,
      },
      {
        id: 'user-management',
        title: 'User Management',
        icon: 'Users',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'User Management Panel',
          annotations: [
            { label: 'Create user', position: 'top-right', description: 'Add new accounts' },
            { label: 'Role selector', position: 'center', description: 'Assign the right role' },
          ],
        },
        content: [
          { type: 'steps', items: [
            'Navigate to Admin Dashboard > User Management.',
            'Click "Create User" to add a new account.',
            'Select the role and enter their email.',
            'They will receive login credentials via email.',
          ]},
        ],
        proTip: { text: 'For parents, use Parent Invitations to send bulk sign-up links instead.' },
      },
      {
        id: 'rosters-schedule',
        title: 'Rosters & Schedule',
        icon: 'Calendar',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Build team rosters and manage the club calendar.' },
          { type: 'info-card', items: [
            { label: 'Rosters', text: 'Add players to teams, drag to reorder or move between teams.' },
            { label: 'Schedule', text: 'Create training sessions, games, and events.' },
            { label: 'Game Results', text: 'Record match outcomes to keep the season record current.' },
          ]},
        ],
        proTip: { text: 'Import players from PlayerHQ to avoid manual entry.' },
      },
      {
        id: 'tryouts',
        title: 'Tryout Management',
        icon: 'ClipboardCheck',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Create tryout sessions, assign assessors, and review results.' },
          { type: 'steps', items: [
            'Go to Admin > Tryouts to create sessions.',
            'Set age group, date, time, and add the player list.',
            'Assign assessors to each session.',
            'After evaluations, view aggregated results for team placement.',
          ]},
        ],
        proTip: { text: 'Assign 3-5 assessors per session for reliable averaged scores.' },
      },
      {
        id: 'analytics',
        title: 'Club Analytics',
        icon: 'BarChart3',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Access comprehensive data about your club.' },
          { type: 'info-card', items: [
            { label: 'Club Overview', text: 'High-level metrics across the entire club.' },
            { label: 'Age Groups', text: 'Drill into each group\'s performance.' },
            { label: 'Coaching', text: 'Track coaching effectiveness and session quality.' },
            { label: 'Rep Prospects', text: 'Identify top players for representative teams.' },
          ]},
        ],
        proTip: { text: 'Review analytics weekly to spot trends early.' },
      },
      {
        id: 'complete',
        title: 'You\'re All Set!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'You now know the key admin features. Explore the full Admin Guide in the Help Center for detailed coverage of every tool.' },
          { type: 'paragraph', text: 'Revisit this tutorial anytime from the Help Center.' },
        ],
        proTip: null,
      },
    ],
  },

  // ── COORDINATOR (6 steps) ────────────────────────────────────────────────
  coordinator: {
    id: 'coordinator',
    title: 'Coordinator Quick Start',
    subtitle: 'Manage tryouts, assessors, and team placement',
    icon: 'Network',
    applicableRoles: ['girls_coordinator', 'boys_coordinator'],
    estimatedMinutes: 3,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Coordinator!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'Network', label: 'Program Coordinator' },
        content: [
          { type: 'paragraph', text: 'This tutorial covers your key responsibilities: creating tryout sessions, assigning assessors, reviewing results, and managing team placement.' },
          { type: 'paragraph', text: 'As a coordinator, you oversee the entire tryout-to-team pipeline for your program.' },
        ],
        proTip: null,
      },
      {
        id: 'tryout-creation',
        title: 'Creating Tryout Sessions',
        icon: 'CalendarPlus',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Tryout Session Creator',
          annotations: [
            { label: 'Age group', position: 'top-left', description: 'Select the age group for this session' },
            { label: 'Date & time', position: 'center', description: 'Set when the session runs' },
            { label: 'Player list', position: 'bottom', description: 'Add registered players to evaluate' },
          ],
        },
        content: [
          { type: 'steps', items: [
            'Go to Tryouts > Create Session.',
            'Select the age group and set the date and time.',
            'Add players from the registered list or import from PlayerHQ.',
            'Save the session — it will appear on assessor dashboards.',
          ]},
        ],
        proTip: { text: 'Create sessions at least a week in advance so assessors can plan ahead.' },
      },
      {
        id: 'assessor-assignment',
        title: 'Assigning Assessors',
        icon: 'UserCheck',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Assessor Assignment Panel',
          annotations: [
            { label: 'Available assessors', position: 'left', description: 'People with the assessor role' },
            { label: 'Assign button', position: 'right', description: 'Tap to assign to this session' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Each tryout session needs assessors to evaluate players. Assign them from the available pool.' },
          { type: 'steps', items: [
            'Open the tryout session you created.',
            'Tap "Assign Assessors" to see available assessors.',
            'Select 3-5 assessors for reliable averaged scores.',
            'Assessors will see the session on their dashboard immediately.',
          ]},
        ],
        proTip: { text: 'Assign assessors who do not coach in the age group to avoid bias.' },
      },
      {
        id: 'results-review',
        title: 'Reviewing Results',
        icon: 'BarChart3',
        visual: {
          type: 'infographic',
          infographicType: 'flowchart',
          title: 'Tryout to Team Pipeline',
          description: 'End-to-end flow from creating a tryout session to final team placement.',
          nodes: [
            { id: 'create-session', icon: 'CalendarPlus', label: 'Create Session', x: 15, y: 20 },
            { id: 'assign-assessors', icon: 'UserCheck', label: 'Assign Assessors', x: 50, y: 20 },
            { id: 'collect-scores', icon: 'ClipboardCheck', label: 'Collect Scores', x: 85, y: 20 },
            { id: 'team-placement', icon: 'Users', label: 'Team Placement', x: 50, y: 75 },
          ],
          edges: [
            { from: 'create-session', to: 'assign-assessors' },
            { from: 'assign-assessors', to: 'collect-scores' },
            { from: 'collect-scores', to: 'team-placement' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Once assessors complete their evaluations, you can view aggregated results.' },
          { type: 'steps', items: [
            'Go to Tryouts > Results for the session.',
            'Review averaged scores across all assessors.',
            'Sort and filter by metric to identify standouts.',
            'Use the data to inform team placement decisions.',
          ]},
        ],
        proTip: { text: 'Look at score spreads — high variance between assessors may need a second look.' },
      },
      {
        id: 'two-stage',
        title: 'Two-Stage Management',
        icon: 'Layers',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Some age groups use two-stage tryouts for better evaluation:' },
          { type: 'info-card', items: [
            { label: 'Hour 1 — Development', text: 'Newer players and Team 3 candidates. Focuses on fundamentals and effort.' },
            { label: 'Hour 2 — Advanced', text: 'Team 1 & 2 candidates plus promoted players. Game-based evaluation.' },
          ]},
          { type: 'paragraph', text: 'Create separate sessions for each hour. Players can be promoted from Hour 1 to Hour 2 based on their scores.' },
        ],
        proTip: { text: 'Review Hour 1 scores quickly after the first session to decide promotions before Hour 2.' },
      },
      {
        id: 'complete',
        title: 'You\'re Ready!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'You now know how to manage the full tryout lifecycle. Head to Tryouts to create your first session or review existing results.' },
          { type: 'paragraph', text: 'Revisit this tutorial anytime from the Help Center.' },
        ],
        proTip: null,
      },
    ],
  },

  // ── YOUTH HEAD COACH (6 steps) ──────────────────────────────────────────
  'youth-head-coach': {
    id: 'youth-head-coach',
    title: 'Youth Head Coach Quick Start',
    subtitle: 'Oversee youth programs, coaches, and player development',
    icon: 'GraduationCap',
    applicableRoles: ['youth_head_coach'],
    estimatedMinutes: 3,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Head Coach!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'GraduationCap', label: 'Youth Head Coach' },
        content: [
          { type: 'paragraph', text: 'This tutorial covers your oversight role: managing youth programs, supporting coaches, ensuring session quality, and tracking player milestones.' },
          { type: 'paragraph', text: 'You have visibility across all youth coaching activity in the club.' },
        ],
        proTip: null,
      },
      {
        id: 'program-oversight',
        title: 'Program Oversight',
        icon: 'LayoutDashboard',
        visual: {
          type: 'infographic',
          infographicType: 'process-flow',
          title: 'Youth Session Structure',
          description: 'The standard 45-minute youth session format your coaches follow.',
          steps: [
            { icon: 'HeartPulse', label: 'Warm-Up (10 min)', description: 'Fun movement games — tag, animal walks, relays to get everyone active.' },
            { icon: 'Target', label: 'Skill Focus (15 min)', description: 'One age-appropriate basketball skill with short demonstrations.' },
            { icon: 'Gamepad2', label: 'Game Time (15 min)', description: 'Modified small-sided games that reinforce the session skill.' },
            { icon: 'Wind', label: 'Cool Down (5 min)', description: 'Stretching, high-fives, and a positive summary of the session.' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Your dashboard gives you a bird\'s-eye view of all youth programs — Little Lakers and Lakers Ready.' },
          { type: 'info-card', items: [
            { label: 'Little Lakers (Ages 4-5)', text: 'Fun, movement, coordination, and introducing basketball concepts.' },
            { label: 'Lakers Ready (Ages 6-7)', text: 'Basic basketball skills, teamwork, and simple plays with more structure.' },
          ]},
        ],
        proTip: { text: 'Check the dashboard weekly to spot attendance trends and coach engagement.' },
      },
      {
        id: 'coach-management',
        title: 'Coach Management',
        icon: 'Users',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Coach Management Panel',
          annotations: [
            { label: 'Coach list', position: 'center', description: 'All youth coaches and their assigned sessions' },
            { label: 'Performance', position: 'top-right', description: 'Attendance and milestone tracking rates' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Support and monitor your coaching team to ensure consistent quality.' },
          { type: 'checklist', items: [
            'Review each coach\'s session attendance rates.',
            'Check that milestone tracking is being completed regularly.',
            'Offer feedback based on session quality observations.',
            'Reassign coaches between groups if needed.',
          ]},
        ],
        proTip: { text: 'Schedule a quick check-in with each coach at least once per term.' },
      },
      {
        id: 'session-quality',
        title: 'Session Quality',
        icon: 'ClipboardCheck',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Ensure every session follows the club\'s youth development philosophy.' },
          { type: 'steps', items: [
            'Review session plans before they run.',
            'Drop in to observe sessions periodically.',
            'Check post-session reports for attendance and notes.',
            'Identify coaches who may need additional training or support.',
          ]},
          { type: 'paragraph', text: 'The app tracks key quality indicators automatically — session completeness, attendance rates, and milestone progress.' },
        ],
        proTip: { text: 'Focus on positive reinforcement first when providing coach feedback.' },
      },
      {
        id: 'milestone-tracking',
        title: 'Milestone Tracking',
        icon: 'Award',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Monitor developmental milestones across all youth players to ensure the program is effective.' },
          { type: 'info-card', items: [
            { label: 'Program Dashboard', text: 'See milestone completion percentages by age group and by individual child.' },
            { label: 'Coach Comparison', text: 'Compare milestone tracking rates between coaches to identify who may need help.' },
            { label: 'Term Reports', text: 'End-of-term reports are auto-generated from milestone data for parents.' },
          ]},
        ],
        proTip: { text: 'If a child is behind on milestones, coordinate with their coach on targeted activities.' },
      },
      {
        id: 'complete',
        title: 'You\'re All Set!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'You\'re ready to lead the youth program. Head to your dashboard to see program status, coach activity, and milestone progress.' },
          { type: 'paragraph', text: 'Revisit this tutorial anytime from the Help Center.' },
        ],
        proTip: null,
      },
    ],
  },

  // ── PARENT (5 steps) ────────────────────────────────────────────────────
  parent: {
    id: 'parent',
    title: 'Parent Quick Start',
    subtitle: 'Stay connected to your child\'s basketball journey',
    icon: 'Heart',
    applicableRoles: ['parent'],
    estimatedMinutes: 2,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Parent!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'Heart', label: 'Parent Portal' },
        content: [
          { type: 'paragraph', text: 'This quick guide shows you how to follow your child\'s progress, view schedules, and stay connected with the club.' },
          { type: 'paragraph', text: 'Everything you need is right in the app — no emails or paper forms needed.' },
        ],
        proTip: null,
      },
      {
        id: 'dashboard-tour',
        title: 'Your Dashboard',
        icon: 'LayoutDashboard',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Parent Dashboard',
          annotations: [
            { label: 'Child profile', position: 'top-left', description: 'Your child\'s name, team, and photo' },
            { label: 'Upcoming sessions', position: 'center', description: 'Next training or game date' },
            { label: 'Notifications', position: 'top-right', description: 'Milestone achievements and reminders' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Your dashboard shows everything at a glance — your child\'s team, upcoming sessions, and recent notifications.' },
        ],
        proTip: { text: 'Enable push notifications so you never miss a schedule change or milestone.' },
      },
      {
        id: 'progress-tracking',
        title: 'Progress Tracking',
        icon: 'TrendingUp',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Skills Passport View',
          annotations: [
            { label: 'Skill areas', position: 'left', description: 'Each basketball skill tracked' },
            { label: 'Progress bar', position: 'center', description: 'Current level vs benchmark' },
            { label: 'Milestones', position: 'bottom', description: 'Achievements unlocked' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'The Skills Passport shows your child\'s development across key basketball skills, compared to age-group benchmarks.' },
          { type: 'checklist', items: [
            'View current skill levels and progress over time.',
            'See milestones as they are achieved during sessions.',
            'Access end-of-term progress reports.',
          ]},
        ],
        proTip: { text: 'Celebrate milestones with your child — they work hard to earn them!' },
      },
      {
        id: 'schedule',
        title: 'Schedule & Reminders',
        icon: 'Calendar',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Stay on top of your child\'s basketball schedule.' },
          { type: 'info-card', items: [
            { label: 'Training Sessions', text: 'Regular training times with location and coach information.' },
            { label: 'Game Days', text: 'Match schedule with venue details and team info.' },
            { label: 'Reminders', text: 'Automatic reminders sent 24 hours before each session.' },
          ]},
        ],
        proTip: { text: 'Add the schedule to your phone calendar using the export button for easy tracking.' },
      },
      {
        id: 'complete',
        title: 'You\'re All Set!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'You\'re ready to follow your child\'s basketball journey. Head to your dashboard to see their latest progress.' },
          { type: 'paragraph', text: 'Revisit this tutorial anytime from the Help Center.' },
        ],
        proTip: null,
      },
    ],
  },

  // ── PLAYER (5 steps) ────────────────────────────────────────────────────
  player: {
    id: 'player',
    title: 'Player Quick Start',
    subtitle: 'Track your skills and team info',
    icon: 'Dribbble',
    applicableRoles: ['player'],
    estimatedMinutes: 2,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Player!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'Dribbble', label: 'Player Portal' },
        content: [
          { type: 'paragraph', text: 'This quick guide shows you how to use the app to view your profile, track your skills, and stay connected with your team.' },
        ],
        proTip: null,
      },
      {
        id: 'profile',
        title: 'Your Profile',
        icon: 'User',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Player Profile Screen',
          annotations: [
            { label: 'Photo & name', position: 'top-left', description: 'Your profile picture and details' },
            { label: 'Team badge', position: 'top-right', description: 'Your current team assignment' },
            { label: 'Quick stats', position: 'bottom', description: 'Key stats at a glance' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Your profile is your home base in the app. It shows your team, position, and key stats.' },
        ],
        proTip: { text: 'Keep your profile photo up to date so coaches and teammates can recognise you.' },
      },
      {
        id: 'skills-passport',
        title: 'Skills Passport',
        icon: 'TrendingUp',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Skills Passport',
          annotations: [
            { label: 'Skill chart', position: 'center', description: 'Your current skill levels' },
            { label: 'Benchmarks', position: 'right', description: 'Age-group targets to aim for' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Your Skills Passport tracks your development across key basketball skills.' },
          { type: 'checklist', items: [
            'See your current level in each skill area.',
            'Compare your progress against age-group benchmarks.',
            'Track how your skills improve over the season.',
          ]},
        ],
        proTip: { text: 'Focus on one skill area at a time to see the biggest improvement.' },
      },
      {
        id: 'team-info',
        title: 'Team Info',
        icon: 'Users',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Stay connected with your team and schedule.' },
          { type: 'info-card', items: [
            { label: 'Training Schedule', text: 'View upcoming training sessions, times, and locations.' },
            { label: 'Game Day', text: 'Match schedule with opponent info and venue details.' },
            { label: 'Teammates', text: 'See who is on your team and their positions.' },
          ]},
        ],
        proTip: { text: 'Check the schedule before each week so you never miss a session.' },
      },
      {
        id: 'complete',
        title: 'You\'re Ready!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'You\'re all set to use the app. Head to your profile to see your Skills Passport and team info.' },
          { type: 'paragraph', text: 'Revisit this tutorial anytime from the Help Center.' },
        ],
        proTip: null,
      },
    ],
  },

  // ── TEAM MANAGER (5 steps) ──────────────────────────────────────────────
  'team-manager': {
    id: 'team-manager',
    title: 'Team Manager Quick Start',
    subtitle: 'Manage logistics, rosters, and tryout support',
    icon: 'ClipboardList',
    applicableRoles: ['team_manager'],
    estimatedMinutes: 2,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome, Team Manager!',
        icon: 'Sparkles',
        visual: { type: 'icon-hero', icon: 'ClipboardList', label: 'Team Manager' },
        content: [
          { type: 'paragraph', text: 'This tutorial covers your key tools: team logistics, tryout access, and player management.' },
          { type: 'paragraph', text: 'As a team manager, you keep the team running smoothly behind the scenes.' },
        ],
        proTip: null,
      },
      {
        id: 'team-logistics',
        title: 'Team Logistics',
        icon: 'Settings',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Team Management Dashboard',
          annotations: [
            { label: 'Roster', position: 'top-left', description: 'Current team roster and player details' },
            { label: 'Schedule', position: 'center', description: 'Training and game schedule' },
            { label: 'Communications', position: 'bottom', description: 'Messages and notifications to the team' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'Your dashboard gives you everything you need to manage team operations.' },
          { type: 'checklist', items: [
            'View and manage the team roster.',
            'Check upcoming training sessions and games.',
            'Coordinate with coaches on logistics.',
            'Track attendance and availability.',
          ]},
        ],
        proTip: { text: 'Review the roster before each game to confirm player availability.' },
      },
      {
        id: 'tryout-access',
        title: 'Tryout Access',
        icon: 'ClipboardCheck',
        visual: {
          type: 'annotated-screenshot',
          placeholderLabel: 'Tryout Assessment Screen',
          annotations: [
            { label: 'Session list', position: 'top-left', description: 'Sessions you are assigned to' },
            { label: 'Score entry', position: 'center', description: 'Rate players on each metric' },
          ],
        },
        content: [
          { type: 'paragraph', text: 'When assigned to tryout sessions, you can assess players just like a dedicated assessor.' },
          { type: 'steps', items: [
            'Check your dashboard for assigned tryout sessions.',
            'Tap into a session to see the player list.',
            'Rate each player on 5 metrics (1-5 scale).',
            'Scores save automatically as you go.',
          ]},
        ],
        proTip: { text: 'Your tryout assessments help coordinators make fair team placement decisions.' },
      },
      {
        id: 'player-management',
        title: 'Player Management',
        icon: 'UserCog',
        visual: null,
        content: [
          { type: 'paragraph', text: 'Keep player information current and support the coaching staff.' },
          { type: 'info-card', items: [
            { label: 'Player Details', text: 'View and update player contact info, medical notes, and emergency contacts.' },
            { label: 'Attendance', text: 'Track training and game attendance for the team.' },
            { label: 'Communication', text: 'Send updates to players and parents about schedule changes.' },
          ]},
        ],
        proTip: { text: 'Keep emergency contact details up to date — check with parents at the start of each term.' },
      },
      {
        id: 'complete',
        title: 'You\'re Ready!',
        icon: 'CheckCircle',
        visual: { type: 'icon-hero', icon: 'Trophy', label: 'Tutorial Complete' },
        content: [
          { type: 'paragraph', text: 'You\'re all set to manage your team. Head to your dashboard to see the roster and upcoming schedule.' },
          { type: 'paragraph', text: 'Revisit this tutorial anytime from the Help Center.' },
        ],
        proTip: null,
      },
    ],
  },
};

export const TUTORIAL_ORDER = ['assessor', 'youth-coach', 'coach', 'admin', 'coordinator', 'youth-head-coach', 'parent', 'player', 'team-manager'];

export const ROLE_TO_TUTORIAL = {
  tryout_assessor: 'assessor',
  youth_coach: 'youth-coach',
  youth_head_coach: 'youth-head-coach',
  coach: 'coach',
  admin: 'admin',
  president: 'admin',
  vice_president: 'admin',
  coach_coordinator: 'admin',
  girls_coordinator: 'coordinator',
  boys_coordinator: 'coordinator',
  parent: 'parent',
  player: 'player',
  team_manager: 'team-manager',
};
