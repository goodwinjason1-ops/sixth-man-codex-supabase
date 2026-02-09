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
};

export const TUTORIAL_ORDER = ['assessor', 'youth-coach', 'coach', 'admin'];

export const ROLE_TO_TUTORIAL = {
  tryout_assessor: 'assessor',
  youth_coach: 'youth-coach',
  youth_head_coach: 'youth-coach',
  coach: 'coach',
  admin: 'admin',
  president: 'admin',
  vice_president: 'admin',
  coach_coordinator: 'admin',
};
