/**
 * Help system content data.
 * All role-specific guides, FAQs, and search indexing live here.
 */

// ─── Page metadata (drives HelpHome cards + breadcrumbs) ───────────────────

export const HELP_PAGES = {
  admin: {
    slug: 'admin',
    title: 'Admin Guide',
    subtitle: 'System administration & club management',
    icon: 'Shield',
    badgeStyle: 'bg-purple-500/30',
    highlightColor: 'purple',
    applicableRoles: ['admin'],
    path: '/help/admin',
  },
  leadership: {
    slug: 'leadership',
    title: 'Leadership Guide',
    subtitle: 'Club oversight, governance & strategy',
    icon: 'Crown',
    badgeStyle: 'bg-purple-500/30',
    highlightColor: 'purple',
    applicableRoles: ['president', 'vice_president', 'coach_coordinator'],
    path: '/help/leadership',
  },
  coordinators: {
    slug: 'coordinators',
    title: 'Coordinators Guide',
    subtitle: 'Tryout management & program coordination',
    icon: 'BarChart3',
    badgeStyle: 'bg-pink-500/30',
    highlightColor: 'pink',
    applicableRoles: ['girls_coordinator', 'boys_coordinator'],
    path: '/help/coordinators',
  },
  coaches: {
    slug: 'coaches',
    title: 'Coach Guide',
    subtitle: 'Team management, assessments & training',
    icon: 'Users',
    badgeStyle: 'bg-green-500/30',
    highlightColor: 'green',
    applicableRoles: ['coach'],
    path: '/help/coaches',
  },
  'youth-coaches': {
    slug: 'youth-coaches',
    title: 'Youth Coach Guide',
    subtitle: 'Little Lakers & Lakers Ready programs',
    icon: 'BookOpen',
    badgeStyle: 'bg-amber-500/30',
    highlightColor: 'amber',
    applicableRoles: ['youth_coach', 'youth_head_coach'],
    path: '/help/youth-coaches',
  },
  assessors: {
    slug: 'assessors',
    title: 'Assessor Guide',
    subtitle: 'Tryout evaluation quick reference',
    icon: 'ClipboardCheck',
    badgeStyle: 'bg-violet-500/30',
    highlightColor: 'violet',
    applicableRoles: ['tryout_assessor'],
    path: '/help/assessors',
  },
  parents: {
    slug: 'parents',
    title: 'Parent Guide',
    subtitle: 'Track your child\'s progress & club info',
    icon: 'UserPlus',
    badgeStyle: 'bg-yellow-500/30',
    highlightColor: 'yellow',
    applicableRoles: ['parent'],
    path: '/help/parents',
  },
  players: {
    slug: 'players',
    title: 'Player Guide',
    subtitle: 'Your profile, skills & team info',
    icon: 'Star',
    badgeStyle: 'bg-blue-500/30',
    highlightColor: 'blue',
    applicableRoles: ['player'],
    path: '/help/players',
  },
};

// ─── Content per role ──────────────────────────────────────────────────────

export const HELP_CONTENT = {
  // ── ADMIN ────────────────────────────────────────────────────────────────
  admin: {
    overview: {
      title: 'Your Role',
      highlightColor: 'purple',
      text: 'As an administrator you have full access to the system. You can manage users, rosters, schedules, tryout sessions, team selection, analytics, rotation tracking, youth programs, beta feedback, and all club settings.',
    },
    sections: [
      {
        id: 'user-management',
        title: 'User Management',
        icon: 'Users',
        defaultOpen: true,
        keywords: ['users', 'create', 'roles', 'accounts', 'permissions', 'pending', 'approval'],
        content: [
          { type: 'paragraph', text: 'Manage all user accounts from the Admin Dashboard. You can create new users, assign roles, approve pending registrations, and update permissions.' },
          { type: 'steps', items: [
            'Navigate to Admin Dashboard > User Management.',
            'Click "Create User" to add a new account.',
            'Select the appropriate role (Admin, Coach, Player, Parent, etc.).',
            'Enter the user\'s email and display name.',
            'The user will receive login credentials via email.',
          ]},
          { type: 'tip', title: 'Pending approvals', text: 'When new users sign in via Google for the first time, they are assigned a "Pending" role. Check User Management for pending users and assign them the correct role to grant access.' },
          { type: 'tip', title: 'Bulk invitations', text: 'For parents, use the Parent Invitations page to send multiple invitation links at once. Parents sign up themselves using the link.' },
        ],
      },
      {
        id: 'roster-management',
        title: 'Roster Management',
        icon: 'ClipboardList',
        defaultOpen: false,
        keywords: ['roster', 'teams', 'players', 'assign', 'move'],
        content: [
          { type: 'paragraph', text: 'Build and manage team rosters for each age group and season.' },
          { type: 'steps', items: [
            'Go to Admin > Roster Management.',
            'Select the age group and team.',
            'Add players by searching or selecting from the player pool.',
            'Drag and drop to reorder or move players between teams.',
            'Changes are saved automatically.',
          ]},
        ],
      },
      {
        id: 'team-selection',
        title: 'Team Selection & Assignment',
        icon: 'Shield',
        defaultOpen: false,
        keywords: ['team', 'selection', 'assignment', 'configurable', 'teams', 'tryout'],
        content: [
          { type: 'paragraph', text: 'The Team Selection page lets you assign players to teams after tryouts. Teams are configurable per age group — you can have 2 to 8 teams with custom names and colours.' },
          { type: 'steps', items: [
            'Navigate to Assessments & Selection > Team Selection.',
            'Select an age group tab.',
            'Click "Manage Teams" to add, rename, or remove teams for that age group.',
            'Click players to assign them to a team. Click again to remove.',
            'Team configurations are saved per age group in Firestore.',
          ]},
          { type: 'tip', title: 'Dynamic teams', text: 'Each age group can have a different number of teams. Use "Manage Teams" to customise team names (e.g. "Development", "Representative", "Lakers Green").' },
        ],
      },
      {
        id: 'schedule-management',
        title: 'Schedule & Events',
        icon: 'Calendar',
        defaultOpen: false,
        keywords: ['schedule', 'events', 'calendar', 'games', 'training'],
        content: [
          { type: 'paragraph', text: 'Create and manage the club calendar including training sessions, games, and special events.' },
          { type: 'steps', items: [
            'Navigate to Admin > Schedule Management.',
            'Click "Add Event" and choose the event type (Game, Training, or Event).',
            'Set date, time, venue, and assign teams.',
            'Published events appear on all relevant user dashboards.',
          ]},
          { type: 'tip', title: 'Game results', text: 'After a game, record results via Admin > Game Results to keep the season record up to date.' },
        ],
      },
      {
        id: 'analytics',
        title: 'Analytics Hub',
        icon: 'BarChart3',
        defaultOpen: false,
        keywords: ['analytics', 'reports', 'data', 'statistics', 'insights', 'rotations', 'curriculum'],
        content: [
          { type: 'paragraph', text: 'Access comprehensive club analytics from the Analytics Hub, including player development, coaching effectiveness, rotation fairness, and curriculum analysis.' },
          { type: 'info-card', items: [
            { label: 'Club Overview', text: 'High-level metrics for the entire club.' },
            { label: 'Age Groups', text: 'Drill down into each age group\'s performance.' },
            { label: 'Coaching', text: 'Track coaching effectiveness and session quality.' },
            { label: 'Rotations', text: 'Cross-team rotation equity, coach fairness comparison, and playing time distribution.' },
            { label: 'Curriculum', text: 'Analyse skill evaluation coverage and match assessment trends by age group.' },
            { label: 'Rep Prospects', text: 'Identify top players for representative teams.' },
          ]},
        ],
      },
      {
        id: 'beta-feedback',
        title: 'Beta Feedback',
        icon: 'MessageSquare',
        defaultOpen: false,
        keywords: ['feedback', 'beta', 'bugs', 'feature', 'requests'],
        content: [
          { type: 'paragraph', text: 'During beta testing, users can submit feedback via the floating button. Review and manage feedback from Admin > Beta Feedback.' },
          { type: 'steps', items: [
            'Navigate to Admin Dashboard > Beta Feedback.',
            'Filter by category (Bug, Feature Request, Confusing, Works Great).',
            'Update status: New > Reviewed > In Progress > Resolved.',
            'Add admin notes for tracking.',
          ]},
        ],
      },
      {
        id: 'data-tools',
        title: 'Data Tools',
        icon: 'Database',
        defaultOpen: false,
        keywords: ['data', 'export', 'import', 'cleanup', 'sample'],
        content: [
          { type: 'paragraph', text: 'Advanced data management tools for importing, exporting, and maintaining club data.' },
          { type: 'info-card', items: [
            { label: 'Data Explorer', text: 'Query and browse raw data collections.' },
            { label: 'Reports Export', text: 'Generate downloadable PDF/CSV reports.' },
            { label: 'Data Cleanup', text: 'Remove stale or duplicate records.' },
            { label: 'Sample Data', text: 'Generate realistic sample data for testing.' },
          ]},
        ],
      },
    ],
    faqs: [
      { id: 'admin-faq-1', question: 'How do I approve new users who signed in with Google?', answer: 'New Google sign-in users get a "Pending" role. Go to User Management, filter by "Pending Approval", and assign the correct role to grant them access.', keywords: ['pending', 'approve', 'google', 'new user'] },
      { id: 'admin-faq-2', question: 'Can I assign multiple roles to one user?', answer: 'Each user has a single role. If someone needs access to features from multiple roles, assign the higher-level role that encompasses the required permissions.', keywords: ['roles', 'multiple', 'permissions'] },
      { id: 'admin-faq-3', question: 'How do I configure teams for an age group?', answer: 'Go to Team Selection, select the age group, and click "Manage Teams". You can add up to 8 teams with custom names and colours. Each age group has its own team configuration.', keywords: ['teams', 'configure', 'age group', 'selection'] },
      { id: 'admin-faq-4', question: 'How do I set up a new season?', answer: 'Create new team rosters via Roster Management, update the schedule, and ensure all coaches and players are assigned to the correct teams.', keywords: ['season', 'setup', 'new'] },
    ],
  },

  // ── LEADERSHIP ───────────────────────────────────────────────────────────
  leadership: {
    overview: {
      title: 'Your Role',
      highlightColor: 'purple',
      text: 'As a club leader (President, Vice President, or Coach Coordinator) you have full admin access with a focus on club oversight, strategic decisions, and staff management.',
    },
    sections: [
      {
        id: 'club-oversight',
        title: 'Club Oversight',
        icon: 'Eye',
        defaultOpen: true,
        keywords: ['overview', 'dashboard', 'club', 'status'],
        content: [
          { type: 'paragraph', text: 'Your Admin Dashboard provides a high-level view of all club operations including registration numbers, upcoming events, and action items requiring attention.' },
          { type: 'checklist', items: [
            'Review club analytics weekly for trends.',
            'Check tryout results after each evaluation session.',
            'Monitor coaching effectiveness reports monthly.',
            'Review parent engagement metrics each term.',
          ]},
        ],
      },
      {
        id: 'tryout-results',
        title: 'Tryout Results & Team Selection',
        icon: 'ClipboardCheck',
        defaultOpen: false,
        keywords: ['tryout', 'results', 'selection', 'teams', 'evaluation'],
        content: [
          { type: 'paragraph', text: 'Review aggregated tryout evaluation data to assist with team placement decisions.' },
          { type: 'steps', items: [
            'Navigate to Admin > Tryout Results.',
            'Select the tryout session to review.',
            'View aggregated scores across all assessors.',
            'Sort by overall score or individual metrics.',
            'Use the comparison view to evaluate borderline players.',
          ]},
          { type: 'tip', title: 'Multiple assessors', text: 'The system averages scores across all assessors. Look at the variance — high variance means assessors disagreed, which may warrant further review.' },
        ],
      },
      {
        id: 'coaching-staff',
        title: 'Coaching Staff Management',
        icon: 'Users',
        defaultOpen: false,
        keywords: ['coaches', 'staff', 'assign', 'teams', 'management'],
        content: [
          { type: 'paragraph', text: 'Manage coaching assignments, review performance, and ensure coverage across all teams and programs.' },
          { type: 'info-card', items: [
            { label: 'Assign Coaches', text: 'Link coaches to specific teams from Roster Management.' },
            { label: 'Effectiveness', text: 'Review coaching reports under Admin > Coaching.' },
            { label: 'Training Plans', text: 'Browse the shared library under Admin > Training Plans.' },
          ]},
        ],
      },
      {
        id: 'reports',
        title: 'Reports & Exports',
        icon: 'FileText',
        defaultOpen: false,
        keywords: ['reports', 'export', 'download', 'pdf', 'csv'],
        content: [
          { type: 'paragraph', text: 'Generate comprehensive reports for committee meetings, AGMs, or personal review.' },
          { type: 'steps', items: [
            'Navigate to Admin > Reports & Export.',
            'Select the report type and date range.',
            'Choose PDF or CSV format.',
            'Download or share the report.',
          ]},
        ],
      },
    ],
    faqs: [
      { id: 'lead-faq-1', question: 'What is the difference between Leadership and Admin roles?', answer: 'Leadership roles (President, VP, Coach Coordinator) have full admin access. The distinction helps the system personalise dashboards and recommendations. Functionally the access level is identical.', keywords: ['leadership', 'admin', 'difference'] },
      { id: 'lead-faq-2', question: 'How do I delegate tasks to coordinators?', answer: 'Coordinators (Girls/Boys) automatically have access to manage tryout sessions and evaluations for their program. Assign them via User Management.', keywords: ['delegate', 'coordinators'] },
    ],
  },

  // ── COORDINATORS ─────────────────────────────────────────────────────────
  coordinators: {
    overview: {
      title: 'Your Role',
      highlightColor: 'pink',
      text: 'As a program coordinator (Girls or Boys) you manage tryout sessions, assign assessors, and review evaluation results for your program.',
    },
    sections: [
      {
        id: 'managing-tryouts',
        title: 'Managing Tryout Sessions',
        icon: 'ClipboardCheck',
        defaultOpen: true,
        keywords: ['tryout', 'sessions', 'create', 'manage'],
        content: [
          { type: 'paragraph', text: 'Create and configure tryout sessions for your program\'s age groups.' },
          { type: 'steps', items: [
            'Navigate to Admin > Tryout Sessions.',
            'Click "Create Session" and select the age group.',
            'Set the date, time, venue, and session type (Development or Advanced).',
            'Add the player list — import from rosters or add manually.',
            'Publish the session to make it available to assessors.',
          ]},
          { type: 'tip', title: 'Two-stage tryouts', text: 'For age groups using two-stage evaluation, create separate sessions for each hour. Label them clearly (e.g. "U12 Girls - Hour 1 Development").' },
        ],
      },
      {
        id: 'assigning-assessors',
        title: 'Assigning Assessors',
        icon: 'UserPlus',
        defaultOpen: false,
        keywords: ['assessors', 'assign', 'evaluators'],
        content: [
          { type: 'paragraph', text: 'Assign assessors to each tryout session so they can access the evaluation screen.' },
          { type: 'steps', items: [
            'Open the tryout session from Admin > Tryout Sessions.',
            'Click "Manage Assessors".',
            'Select assessors from the list of available evaluators.',
            'Assigned assessors will see the session on their dashboard immediately.',
          ]},
          { type: 'info-card', items: [
            { label: 'Who can assess?', text: 'Users with roles: Admin, President, VP, Coach Coordinator, Coach, Team Manager, or Tryout Assessor.' },
            { label: 'Best practice', text: 'Assign 3-5 assessors per session for reliable averaged scores.' },
          ]},
        ],
      },
      {
        id: 'viewing-results',
        title: 'Viewing Results',
        icon: 'BarChart3',
        defaultOpen: false,
        keywords: ['results', 'scores', 'view', 'compare'],
        content: [
          { type: 'paragraph', text: 'Review evaluation results after sessions are complete.' },
          { type: 'steps', items: [
            'Go to the tryout session and click "View Results".',
            'See aggregated scores per player across all assessors.',
            'Sort by any metric or overall average.',
            'Use comparison tools for borderline placement decisions.',
          ]},
        ],
      },
    ],
    faqs: [
      { id: 'coord-faq-1', question: 'Can I see results from the other program?', answer: 'Coordinators can only view sessions for their assigned program (Girls or Boys). Admins and Leadership can see all programs.', keywords: ['other', 'program', 'access'] },
      { id: 'coord-faq-2', question: 'How do I close a tryout session?', answer: 'Open the session, click the settings menu, and select "Close Session". This prevents further evaluations from being submitted.', keywords: ['close', 'session', 'end'] },
    ],
  },

  // ── COACHES ──────────────────────────────────────────────────────────────
  coaches: {
    overview: {
      title: 'Your Role',
      highlightColor: 'green',
      text: 'As a coach you manage your team, run training sessions, conduct skill assessments and match day evaluations, build training plans, track rotations, and monitor player development throughout the season.',
    },
    sections: [
      {
        id: 'coach-dashboard',
        title: 'Your Dashboard',
        icon: 'LayoutDashboard',
        defaultOpen: true,
        keywords: ['dashboard', 'home', 'overview'],
        content: [
          { type: 'paragraph', text: 'Your Coach Dashboard is your home base. It shows your team roster, upcoming sessions, recent assessments, rotation analytics, and quick actions.' },
          { type: 'info-card', items: [
            { label: 'Team Roster', text: 'View all players assigned to your team.' },
            { label: 'Upcoming', text: 'Next training session and game details.' },
            { label: 'Assessments', text: 'Recent player evaluation summaries.' },
            { label: 'Rotation Analytics', text: 'Playing time fairness and distribution stats.' },
            { label: 'Quick Actions', text: 'Start assessment, view plans, record training, open messages.' },
          ]},
        ],
      },
      {
        id: 'player-assessments',
        title: 'Skill Assessments',
        icon: 'ClipboardCheck',
        defaultOpen: false,
        keywords: ['assessment', 'evaluate', 'skills', 'players', 'scoring', 'ball handling', 'shooting', 'defense'],
        content: [
          { type: 'paragraph', text: 'Evaluate your players on 8 skill areas: Ball Handling, Passing & Receiving, Shooting, Footwork, Defense, Off-Ball Movement, Team Play, and Basketball IQ. Rate each from 1 (Emerging) to 4 (Confident Leader).' },
          { type: 'steps', items: [
            'From the Welcome page or dashboard, tap "Assess Skills".',
            'Select a player from your team roster.',
            'Choose the assessment type (Start of Season, Mid-Season, or End of Season).',
            'Rate each skill area by tapping the 1-4 level buttons.',
            'Add optional notes per skill for context.',
            'Tap "Save Assessment" to submit. Use "Save Draft" if you need to finish later.',
          ]},
          { type: 'tip', title: 'Auto-save', text: 'Your work is auto-saved every 30 seconds as a safety net. If you navigate away accidentally, you can restore from the auto-save prompt.' },
        ],
      },
      {
        id: 'match-day',
        title: 'Match Day Assessment',
        icon: 'Trophy',
        defaultOpen: false,
        keywords: ['match', 'game', 'day', 'assessment', 'performance', 'team metrics'],
        content: [
          { type: 'paragraph', text: 'Match Day Assessment captures both team-level and player-level performance during games. On game day, you may be automatically redirected to the assessment screen.' },
          { type: 'steps', items: [
            'Navigate to Match Day from the Welcome page.',
            'Select or confirm the game details (opponent, date, venue).',
            'Rate team metrics: Team Work, Defense, Ball Movement, Offense, Shot Selection, and Sportsmanship (1-5 scale).',
            'Switch to individual player assessments and rate each player on the same 6 metrics.',
            'Add overall game notes and submit.',
          ]},
          { type: 'tip', title: 'Game day auto-redirect', text: 'If you have a game scheduled today, the app will automatically take you to Match Day Assessment when you open it. You can dismiss and return later.' },
        ],
      },
      {
        id: 'training-plans',
        title: 'Training Plans & Drills',
        icon: 'BookOpen',
        defaultOpen: false,
        keywords: ['training', 'plans', 'drills', 'sessions', 'practice', 'library', 'builder'],
        content: [
          { type: 'paragraph', text: 'Build structured training plans using the Drill Library. Plans can be scheduled for specific sessions and shared with other coaches.' },
          { type: 'steps', items: [
            'Go to Training Plans from the Welcome page.',
            'Browse existing plans or tap "Create New Plan".',
            'Add drills from the drill library — search by name, category, or skill focus.',
            'Set drill durations and arrange the session order.',
            'Toggle "Share to Library" to make it available to other coaches.',
            'Schedule the plan by linking it to an upcoming training session.',
          ]},
          { type: 'info-card', items: [
            { label: 'Drill Library', text: 'Browse, create, and manage basketball drills with descriptions and equipment lists.' },
            { label: 'Shared Plans', text: 'Access plans shared by other coaches and admin-promoted plans.' },
            { label: 'Scheduling', text: 'Link plans to specific dates on your schedule.' },
          ]},
        ],
      },
      {
        id: 'record-training',
        title: 'Recording Training Sessions',
        icon: 'ClipboardList',
        defaultOpen: false,
        keywords: ['record', 'training', 'attendance', 'notes', 'session', 'log'],
        content: [
          { type: 'paragraph', text: 'After each training session, record attendance, session notes, and observations.' },
          { type: 'steps', items: [
            'Navigate to Record Training from the Welcome page.',
            'Select the training session from your schedule.',
            'Mark player attendance (present/absent).',
            'Add session notes covering what was covered and any observations.',
            'Submit the training record.',
          ]},
        ],
      },
      {
        id: 'rotation-analytics',
        title: 'Rotation Analytics',
        icon: 'BarChart3',
        defaultOpen: false,
        keywords: ['rotation', 'playing time', 'fairness', 'minutes', 'analytics'],
        content: [
          { type: 'paragraph', text: 'Track playing time distribution and rotation fairness across your games.' },
          { type: 'info-card', items: [
            { label: 'Game View', text: 'Minutes per player chart, substitution timeline, and fair play indicator for a single game.' },
            { label: 'Season View', text: 'Average minutes, total minutes table, started vs bench chart, distribution analysis, and trend lines across all games.' },
          ]},
          { type: 'steps', items: [
            'Navigate to Rotation Analytics from the Coach Dashboard.',
            'Switch between Game View and Season View tabs.',
            'In Game View, select a specific game to see detailed rotation data.',
            'In Season View, review overall playing time fairness across all games.',
          ]},
        ],
      },
      {
        id: 'player-overview',
        title: 'Player Overview',
        icon: 'Users',
        defaultOpen: false,
        keywords: ['players', 'roster', 'overview', 'profile', 'development'],
        content: [
          { type: 'paragraph', text: 'View all players on your team with their assessment history, skill levels, and development plans.' },
          { type: 'steps', items: [
            'Navigate to My Players from the Welcome page.',
            'Browse your team roster with player cards showing key stats.',
            'Tap a player to see their full profile, assessment history, and skills passport.',
          ]},
        ],
      },
    ],
    faqs: [
      { id: 'coach-faq-1', question: 'How often should I assess players?', answer: 'Formal skill assessments are recommended at the start, middle, and end of each season. Match day assessments should be done for every game. You can update observations anytime.', keywords: ['frequency', 'assess', 'how often'] },
      { id: 'coach-faq-2', question: 'Can I see assessments from other coaches?', answer: 'Coaches can see their own assessments. Admins and leadership can view all assessments across teams for comparison.', keywords: ['other', 'coaches', 'view', 'access'] },
      { id: 'coach-faq-3', question: 'How do I share a training plan?', answer: 'When creating a training plan, toggle "Share to Library" to make it available to other coaches. Admins can also promote plans to the shared library.', keywords: ['share', 'training', 'plan'] },
      { id: 'coach-faq-4', question: 'What are the 8 skill areas for assessments?', answer: 'Ball Handling, Passing & Receiving, Shooting, Footwork, Defense, Off-Ball Movement, Team Play, and Basketball IQ. Each is rated 1-4: Emerging, Developing, Competent, Confident Leader.', keywords: ['skills', 'areas', 'categories', 'metrics'] },
    ],
  },

  // ── YOUTH COACHES (migrated from LittleLakersGuide) ──────────────────────
  'youth-coaches': {
    overview: {
      title: 'Program Overview',
      highlightColor: 'amber',
      text: 'As a youth coach you run Little Lakers (ages 4-5) or Lakers Ready (ages 6-7) sessions. These programs focus on fun, movement, coordination, and introducing basketball fundamentals in an age-appropriate way.',
    },
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        icon: 'Star',
        defaultOpen: true,
        keywords: ['start', 'login', 'access', 'setup'],
        content: [
          { type: 'paragraph', text: 'As a youth coach you have access to your assigned program sessions from the dashboard.' },
          { type: 'steps', items: [
            'Log in with your coach credentials.',
            'Navigate to Youth Programs from your dashboard or the menu.',
            'Select the program you are coaching (Little Lakers or Lakers Ready).',
            'You will see the term schedule with all session dates and plans.',
          ]},
        ],
      },
      {
        id: 'session-plans',
        title: 'Session Plans',
        icon: 'ClipboardList',
        defaultOpen: true,
        keywords: ['session', 'plan', 'warm-up', 'drills', 'games', 'format'],
        content: [
          { type: 'paragraph', text: 'Each session comes with a structured plan. Here is the typical session format:' },
          { type: 'info-card', items: [
            { label: 'Warm-Up (10 min)', text: 'Fun movement games to get kids active and engaged. Tag games, animal walks, relay races.' },
            { label: 'Skill Focus (15 min)', text: 'Age-appropriate basketball skill activity. Keep instructions short and demonstrations clear.' },
            { label: 'Game Time (15 min)', text: 'Modified games that reinforce the session skill. Small-sided, lots of touches for every child.' },
            { label: 'Cool Down (5 min)', text: 'Stretching, high-fives, and a positive summary of what they learned today.' },
          ]},
        ],
      },
      {
        id: 'attendance',
        title: 'Taking Attendance',
        icon: 'Users',
        defaultOpen: false,
        keywords: ['attendance', 'present', 'absent', 'roll', 'check-in'],
        content: [
          { type: 'steps', items: [
            'Open the session for the current date.',
            'Tap each child\'s name to mark them as present.',
            'Attendance saves automatically. Absent children remain unchecked.',
          ]},
          { type: 'tip', title: 'Why it matters', text: 'Consistent attendance records help the club track participation and identify children who may need follow-up.' },
        ],
      },
      {
        id: 'milestones',
        title: 'Milestone Tracking',
        icon: 'Award',
        defaultOpen: false,
        keywords: ['milestones', 'progress', 'development', 'achievements'],
        content: [
          { type: 'paragraph', text: 'Track developmental milestones for each child throughout the term.' },
          { type: 'info-card', items: [
            { label: 'Little Lakers', text: 'Can catch a bounced ball, can dribble standing still, understands taking turns, follows simple instructions, shows sportsmanship.' },
            { label: 'Lakers Ready', text: 'Can dribble while moving, chest pass to a partner, basic defensive stance, understands simple plays, shows teamwork and encouragement.' },
          ]},
          { type: 'tip', title: 'Tracking', text: 'Tick off milestones as you observe them. Progress carries over between sessions.' },
        ],
      },
      {
        id: 'schedule',
        title: 'Managing Your Schedule',
        icon: 'Calendar',
        defaultOpen: false,
        keywords: ['schedule', 'calendar', 'sessions', 'dates'],
        content: [
          { type: 'paragraph', text: 'Your program schedule shows all sessions for the current term.' },
          { type: 'checklist', items: [
            'Upcoming sessions are highlighted with date, time, and venue details.',
            'Past sessions show attendance numbers and completion status.',
            'Session notes let you record observations for the coordinator.',
          ]},
        ],
      },
      {
        id: 'parent-communication',
        title: 'Parent Communication',
        icon: 'MessageSquare',
        defaultOpen: false,
        keywords: ['parents', 'communication', 'notifications', 'reminders'],
        content: [
          { type: 'paragraph', text: 'Parents receive automatic notifications from the system. As a coach, here is how you can help:' },
          { type: 'checklist', items: [
            'Session reminders are sent automatically 24 hours before each session.',
            'Milestone achievements notify parents when their child reaches a new milestone.',
            'End-of-term reports are generated from milestone data and shared with parents.',
          ]},
          { type: 'tip', title: 'At the session', text: 'If parents have questions at the session, encourage them to check the app for schedules and progress, or contact the coordinator.' },
        ],
      },
    ],
    faqs: [
      { id: 'youth-faq-1', question: 'What age groups are Little Lakers and Lakers Ready?', answer: 'Little Lakers is for ages 4-5 and focuses on movement and fun. Lakers Ready is for ages 6-7 and introduces basic basketball skills.', keywords: ['age', 'groups', 'little lakers', 'lakers ready'] },
      { id: 'youth-faq-2', question: 'How long is each session?', answer: 'Sessions are typically 45 minutes: 10 min warm-up, 15 min skill focus, 15 min game time, and 5 min cool down.', keywords: ['duration', 'length', 'time', 'session'] },
      { id: 'youth-faq-3', question: 'What if a child is not ready for their age group?', answer: 'Speak with the program coordinator. Children can occasionally be placed in a younger or older group based on development, with coordinator approval.', keywords: ['ready', 'development', 'move', 'group'] },
    ],
  },

  // ── ASSESSORS (migrated verbatim from AssessorGuide) ─────────────────────
  assessors: {
    overview: {
      title: 'Your Role',
      highlightColor: 'violet',
      text: 'As an assessor you evaluate players across 5 skill areas on a 1-5 scale. Your scores help coaches place players into the right team for the season.',
    },
    sections: [
      {
        id: 'accessing-sessions',
        title: 'Accessing Your Sessions',
        icon: 'Smartphone',
        defaultOpen: true,
        keywords: ['login', 'session', 'dashboard', 'access'],
        content: [
          { type: 'paragraph', text: 'When you log in you will see your Assessor Dashboard with all sessions assigned to you.' },
          { type: 'steps', items: [
            'Log in with the email and password provided by the club.',
            'You will be taken directly to your Assessor Dashboard.',
            'Tap on a session card to open the evaluation screen.',
          ]},
          { type: 'tip', title: 'Session details', text: 'Each session shows the age group, date, time, venue, and number of players.' },
        ],
      },
      {
        id: 'evaluation-metrics',
        title: 'The 5 Evaluation Metrics',
        icon: 'Star',
        defaultOpen: true,
        keywords: ['metrics', 'scoring', 'criteria', 'athleticism', 'ball skills', 'game iq', 'coachability', 'effort'],
        content: [
          { type: 'paragraph', text: 'Rate each player from 1 (lowest) to 5 (highest) in these areas:' },
          { type: 'info-card', items: [
            { label: '1. Athleticism', text: 'Speed, agility, coordination, and jumping ability.' },
            { label: '2. Ball Skills', text: 'Dribbling, passing, catching, and shooting form.' },
            { label: '3. Game IQ', text: 'Court awareness, decision making, and positioning.' },
            { label: '4. Coachability', text: 'Listens to instructions, applies feedback, positive attitude.' },
            { label: '5. Effort / Hustle', text: 'Work rate, intensity, and determination. Never gives up.' },
          ]},
          { type: 'tip', title: 'Score guide', text: '1 = Well below average, 2 = Below average, 3 = Average, 4 = Above average, 5 = Outstanding' },
        ],
      },
      {
        id: 'how-to-evaluate',
        title: 'How to Evaluate a Player',
        icon: 'Users',
        defaultOpen: false,
        keywords: ['evaluate', 'steps', 'how', 'process', 'rate'],
        content: [
          { type: 'steps', items: [
            'Open your assigned session from the dashboard.',
            'Find the player in the list, or use search to filter by name or number.',
            'Tap on a player to open their evaluation card.',
            'Tap the 1-5 score buttons for each of the 5 metrics.',
            'Add an optional comment in the notes field for anything notable.',
            'Move to the next player. Your scores save automatically.',
          ]},
        ],
      },
      {
        id: 'saving-work',
        title: 'Saving Your Work',
        icon: 'Save',
        defaultOpen: false,
        keywords: ['save', 'offline', 'sync', 'auto-save'],
        content: [
          { type: 'paragraph', text: 'Scores are saved automatically as you tap each rating. You do not need to press a separate save button.' },
          { type: 'tip', title: 'Works offline too', text: 'If you lose internet connection during a session, your scores are stored on your device and will sync when you reconnect.' },
          { type: 'paragraph', text: 'You can return to a session later and update any scores before the session is closed by an admin.' },
        ],
      },
      {
        id: 'two-stage-tryouts',
        title: 'Two-Stage Tryout Sessions',
        icon: 'ClipboardCheck',
        defaultOpen: false,
        keywords: ['two-stage', 'hour 1', 'hour 2', 'development', 'advanced'],
        content: [
          { type: 'paragraph', text: 'Some age groups run a two-stage tryout:' },
          { type: 'info-card', items: [
            { label: 'Hour 1', text: 'Development session for newer players and Team 3. Focus on fundamentals.' },
            { label: 'Hour 2', text: 'Advanced session for Team 1 & 2 and promoted players. More game-based evaluation.' },
          ]},
          { type: 'paragraph', text: 'Each hour is a separate session on your dashboard. Evaluate all players in each session independently.' },
        ],
      },
      {
        id: 'evaluation-tips',
        title: 'Tips for Good Evaluations',
        icon: 'Lightbulb',
        defaultOpen: false,
        keywords: ['tips', 'best practices', 'consistency', 'objective'],
        content: [
          { type: 'checklist', items: [
            'Be consistent. Use the same standard for every player in the group. Compare players within the age group, not against older players.',
            'Use the full scale. Avoid giving everyone 3s. Spread your scores from 1-5 so coaches can see real differences.',
            'Add notes for standouts. If a player is particularly impressive or has areas of concern, note it. These comments help coaches make final decisions.',
            'Watch during drills AND games. Some players look different in structured drills versus live play. Consider both.',
            'Stay objective. Score what you see on the day, not what you know about the player from previous seasons.',
          ]},
        ],
      },
    ],
    faqs: [
      { id: 'assess-faq-1', question: 'Can I change my scores after submitting?', answer: 'Yes, you can update scores any time before the session is closed by an admin. Just reopen the player\'s evaluation card and adjust your ratings.', keywords: ['change', 'update', 'scores', 'edit'] },
      { id: 'assess-faq-2', question: 'What happens if I lose internet during evaluation?', answer: 'Your scores are saved locally on your device and will sync automatically when you reconnect. You will not lose any work.', keywords: ['offline', 'internet', 'lost', 'connection'] },
      { id: 'assess-faq-3', question: 'How many players should I expect per session?', answer: 'Typically 15-30 players per session depending on the age group. The session card shows the expected number.', keywords: ['players', 'number', 'session', 'expect'] },
      { id: 'assess-faq-4', question: 'Can I save a draft and come back later?', answer: 'Yes, your evaluations save automatically as you rate each player. You can leave and return to the session at any time — your progress will be preserved.', keywords: ['draft', 'save', 'later', 'continue'] },
    ],
  },

  // ── PARENTS ──────────────────────────────────────────────────────────────
  parents: {
    overview: {
      title: 'Your Role',
      highlightColor: 'yellow',
      text: 'As a parent you can track your child\'s basketball development, view team schedules, check skills progress, and stay connected with the club through notifications.',
    },
    sections: [
      {
        id: 'parent-dashboard',
        title: 'Your Dashboard',
        icon: 'LayoutDashboard',
        defaultOpen: true,
        keywords: ['dashboard', 'home', 'overview', 'child'],
        content: [
          { type: 'paragraph', text: 'Your Parent Dashboard is your main hub for your child\'s basketball activities. It shows their team, upcoming events, and recent progress.' },
          { type: 'steps', items: [
            'Log in with the credentials from your invitation link.',
            'You will see your child\'s name, team, and upcoming sessions.',
            'Scroll down for recent progress updates and announcements.',
            'Use the navigation tiles to access Schedule, Skills Progress, and Notifications.',
          ]},
        ],
      },
      {
        id: 'child-progress',
        title: 'Skills Progress & Development',
        icon: 'TrendingUp',
        defaultOpen: true,
        keywords: ['progress', 'skills', 'development', 'milestones', 'improvement', 'passport', 'scores'],
        content: [
          { type: 'paragraph', text: 'Track your child\'s development across 8 basketball skill areas. Coaches assess players periodically and results appear in the Skills Passport.' },
          { type: 'info-card', items: [
            { label: 'Skills Passport', text: 'Shows ratings in Ball Handling, Passing, Shooting, Footwork, Defense, Off-Ball Movement, Team Play, and Basketball IQ.' },
            { label: 'Level Scale', text: '1 = Emerging, 2 = Developing, 3 = Competent, 4 = Confident Leader. Levels are age-appropriate — a "3" for an U10 is excellent progress.' },
            { label: 'Assessments', text: 'Coaches conduct formal assessments at start, mid, and end of season. Each is a snapshot of development at that point.' },
            { label: 'Milestones', text: 'Youth program milestones (Little Lakers / Lakers Ready) are marked by coaches as children achieve them.' },
          ]},
          { type: 'tip', title: 'Understanding scores', text: 'Scores reflect age-appropriate expectations. A score of 2-3 means your child is progressing well for their age group. Focus on trends over time rather than individual scores.' },
        ],
      },
      {
        id: 'schedule-events',
        title: 'Schedule & Events',
        icon: 'Calendar',
        defaultOpen: false,
        keywords: ['schedule', 'events', 'calendar', 'games', 'training', 'when', 'where'],
        content: [
          { type: 'paragraph', text: 'View your child\'s complete training and game schedule from the Parent Schedule page.' },
          { type: 'steps', items: [
            'Navigate to Schedule from the Welcome page.',
            'View upcoming training sessions with time and venue.',
            'See game day details including opponent and location.',
            'Past events show attendance and results where available.',
          ]},
        ],
      },
      {
        id: 'team-info',
        title: 'Team Information',
        icon: 'Users',
        defaultOpen: false,
        keywords: ['team', 'roster', 'coach', 'teammates'],
        content: [
          { type: 'paragraph', text: 'View your child\'s team, teammates, and coaching staff.' },
          { type: 'steps', items: [
            'Navigate to Team Info from the Welcome page.',
            'See the team roster with all players.',
            'View coaching staff contact information.',
          ]},
        ],
      },
      {
        id: 'notifications',
        title: 'Notifications',
        icon: 'Bell',
        defaultOpen: false,
        keywords: ['notifications', 'alerts', 'messages', 'updates'],
        content: [
          { type: 'paragraph', text: 'Stay informed about your child\'s activities and club news via notifications.' },
          { type: 'steps', items: [
            'Tap Notifications from the Welcome page.',
            'View session reminders, milestone achievements, and club announcements.',
            'Unread notifications show a badge count on the tile.',
          ]},
        ],
      },
    ],
    faqs: [
      { id: 'parent-faq-1', question: 'How do I sign up as a parent?', answer: 'You need an invitation link from the club. Once you receive it, click the link and create your account with email/password or Google. You will be automatically linked to your child\'s profile.', keywords: ['sign up', 'register', 'join', 'invitation'] },
      { id: 'parent-faq-2', question: 'Can I see my child\'s tryout scores?', answer: 'Tryout scores are confidential to the coaching staff. You will be notified of team placement outcomes once the process is complete.', keywords: ['tryout', 'scores', 'results', 'see'] },
      { id: 'parent-faq-3', question: 'What do the skill levels mean?', answer: 'Skills are rated 1-4: Emerging (just starting), Developing (building foundations), Competent (solid skills), Confident Leader (advanced). These are age-appropriate — compare within the age group, not across age groups.', keywords: ['levels', 'scores', 'meaning', 'understand'] },
      { id: 'parent-faq-4', question: 'How do I update my contact details?', answer: 'Contact your club administrator to update your email or phone number. Account details are managed by admins for security.', keywords: ['update', 'contact', 'email', 'phone', 'details'] },
    ],
  },

  // ── PLAYERS ──────────────────────────────────────────────────────────────
  players: {
    overview: {
      title: 'Your Role',
      highlightColor: 'blue',
      text: 'As a player you can view your profile, track your skills progression, see team information, and access training programs.',
    },
    sections: [
      {
        id: 'player-profile',
        title: 'Your Profile',
        icon: 'User',
        defaultOpen: true,
        keywords: ['profile', 'personal', 'info', 'details'],
        content: [
          { type: 'paragraph', text: 'Your player profile shows your personal details, team assignment, and position.' },
          { type: 'steps', items: [
            'Log in with your credentials.',
            'Your dashboard shows your team and key information.',
            'Tap on your profile to see full details.',
          ]},
        ],
      },
      {
        id: 'skills-passport',
        title: 'Skills Passport',
        icon: 'Award',
        defaultOpen: false,
        keywords: ['skills', 'passport', 'benchmarks', 'progress', 'level'],
        content: [
          { type: 'paragraph', text: 'Your Skills Passport tracks your development across key basketball skills.' },
          { type: 'info-card', items: [
            { label: 'Skill Levels', text: 'See your current level in each skill area.' },
            { label: 'Benchmarks', text: 'Compare against age-group expectations.' },
            { label: 'Progress', text: 'Track how your skills have improved over time.' },
          ]},
        ],
      },
      {
        id: 'team-info',
        title: 'Team Information',
        icon: 'Users',
        defaultOpen: false,
        keywords: ['team', 'roster', 'teammates', 'coach'],
        content: [
          { type: 'paragraph', text: 'View your team roster, coaching staff, and upcoming schedule.' },
          { type: 'steps', items: [
            'Navigate to the Team page from your dashboard.',
            'See your teammates and coaching staff.',
            'View upcoming training sessions and games.',
          ]},
        ],
      },
      {
        id: 'training-programs',
        title: 'Training Programs',
        icon: 'Target',
        defaultOpen: false,
        keywords: ['training', 'programs', 'drills', 'practice', 'improve'],
        content: [
          { type: 'paragraph', text: 'Access training programs and drills to improve your game.' },
          { type: 'steps', items: [
            'Go to Training from your dashboard.',
            'Browse available programs and skill challenges.',
            'Follow the drills and track your completion.',
          ]},
        ],
      },
    ],
    faqs: [
      { id: 'player-faq-1', question: 'How do I see my team schedule?', answer: 'Navigate to the Team page from your dashboard. The schedule shows all upcoming training sessions and games with times and locations.', keywords: ['schedule', 'team', 'when', 'games'] },
      { id: 'player-faq-2', question: 'Can I see my assessment scores?', answer: 'You can see your Skills Passport which shows your development over time. Specific assessment details are available to your coach.', keywords: ['assessment', 'scores', 'see', 'view'] },
    ],
  },
};

// ─── Global FAQs (migrated from HelpCenter) ───────────────────────────────

export const GLOBAL_FAQS = [
  {
    id: 'global-faq-1',
    question: 'How do I reset my password?',
    answer: 'On the login screen, tap "Forgot Password" and enter your email address. You will receive a reset link. If you do not see the email, check your spam folder. Contact an admin if you still need help.',
    keywords: ['password', 'reset', 'forgot', 'login'],
  },
  {
    id: 'global-faq-2',
    question: 'How do parents access the app?',
    answer: 'Parents need an invitation from an admin or coach. Once invited, they sign up with their email and are linked to their child\'s profile. They can view progress, schedules, and notifications.',
    keywords: ['parents', 'access', 'invitation', 'sign up'],
  },
  {
    id: 'global-faq-3',
    question: 'How do tryout sessions work?',
    answer: 'Admins and coordinators create tryout sessions for each age group. Assessors are assigned to sessions and evaluate players on 5 metrics (Athleticism, Ball Skills, Game IQ, Coachability, Effort) using a 1-5 scale. Results are aggregated across all assessors to help coaches make team selections.',
    keywords: ['tryout', 'sessions', 'evaluation', 'how'],
  },
  {
    id: 'global-faq-4',
    question: 'How do I manage players on my team?',
    answer: 'Coaches can view their team roster from the Coach Dashboard. Admins can add or remove players from teams via the Roster Management page in the Admin Portal.',
    keywords: ['manage', 'players', 'team', 'roster'],
  },
  {
    id: 'global-faq-5',
    question: 'What are the different roles in the system?',
    answer: 'The system has 13 roles: Administrator, President, Vice President, Coach Coordinator, Girls Coordinator, Boys Coordinator, Youth Head Coach, Coach, Youth Coach, Tryout Assessor, Team Manager, Player, and Parent. Each role has specific permissions. Admins, President, VP, and Coach Coordinator have full access. Coordinators manage tryout evaluations. Coaches handle teams and assessments. Assessors only access their assigned tryout sessions.',
    keywords: ['roles', 'permissions', 'what', 'types'],
  },
  {
    id: 'global-faq-6',
    question: 'Can I use the app offline?',
    answer: 'Yes. The app works offline for most features. Data you enter while offline (scores, attendance, etc.) is stored on your device and syncs automatically when you reconnect to the internet.',
    keywords: ['offline', 'internet', 'connection', 'sync'],
  },
  {
    id: 'global-faq-7',
    question: 'How do I view tryout results?',
    answer: 'Tryout results are available to Admins, President, VP, Coach Coordinator, Coordinators, and Youth Head Coaches. Navigate to Tryout Results from the Admin Dashboard to see aggregated scores, player comparisons, and sorting by individual metrics.',
    keywords: ['tryout', 'results', 'view', 'scores'],
  },
  {
    id: 'global-faq-8',
    question: 'How are notifications sent?',
    answer: 'Notifications appear in the bell icon in the top navigation bar. They include session reminders, tryout assignments, milestone achievements, and club announcements. You can manage your notification preferences from your profile.',
    keywords: ['notifications', 'alerts', 'bell', 'sent'],
  },
];

// ─── Search index builder ──────────────────────────────────────────────────

function buildSearchIndex() {
  const index = [];

  // Index role page sections
  for (const [roleSlug, content] of Object.entries(HELP_CONTENT)) {
    const page = HELP_PAGES[roleSlug];
    if (!page) continue;

    for (const section of content.sections) {
      // Flatten content text for searching
      const contentText = section.content
        .map((block) => {
          if (block.type === 'paragraph') return block.text;
          if (block.type === 'steps') return block.items.join(' ');
          if (block.type === 'tip') return `${block.title} ${block.text}`;
          if (block.type === 'info-card') return block.items.map((i) => `${i.label} ${i.text}`).join(' ');
          if (block.type === 'checklist') return block.items.join(' ');
          if (block.type === 'callout') return `${block.title || ''} ${block.text || ''}`;
          if (block.type === 'annotated-screenshot') return (block.annotations || []).map((a) => a.label + ' ' + (a.description || '')).join(' ');
          if (block.type === 'animated-walkthrough') return (block.steps || []).map((s) => s.description || s.label || '').join(' ');
          return '';
        })
        .join(' ');

      index.push({
        type: 'section',
        roleSlug,
        sectionId: section.id,
        title: section.title,
        pageTitle: page.title,
        keywords: section.keywords || [],
        contentText,
        path: `${page.path}#${section.id}`,
      });
    }

    // Index role-level FAQs
    for (const faq of content.faqs) {
      index.push({
        type: 'faq',
        roleSlug,
        sectionId: faq.id,
        title: faq.question,
        pageTitle: page.title,
        keywords: faq.keywords || [],
        contentText: faq.answer,
        path: `${page.path}#${faq.id}`,
      });
    }
  }

  // Index global FAQs
  for (const faq of GLOBAL_FAQS) {
    index.push({
      type: 'global-faq',
      roleSlug: null,
      sectionId: faq.id,
      title: faq.question,
      pageTitle: 'General',
      keywords: faq.keywords || [],
      contentText: faq.answer,
      path: `/help#${faq.id}`,
    });
  }

  return index;
}

export const SEARCH_INDEX = buildSearchIndex();

// ─── Search function ───────────────────────────────────────────────────────

export function searchHelpContent(query, roleFilter = null, limit = 8) {
  if (!query || query.trim().length < 2) return [];

  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/);

  const scored = SEARCH_INDEX
    .filter((item) => !roleFilter || item.roleSlug === roleFilter || item.roleSlug === null)
    .map((item) => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const contentLower = item.contentText.toLowerCase();
      const keywordsLower = item.keywords.map((k) => k.toLowerCase());

      for (const term of terms) {
        // Keyword exact match (highest)
        if (keywordsLower.includes(term)) score += 10;
        // Title match
        if (titleLower.includes(term)) score += 8;
        // Keyword partial match
        if (keywordsLower.some((k) => k.includes(term))) score += 5;
        // Content match
        if (contentLower.includes(term)) score += 3;
      }

      // Build snippet
      let snippet = '';
      if (score > 0) {
        const idx = contentLower.indexOf(terms[0]);
        if (idx >= 0) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(item.contentText.length, idx + 80);
          snippet = (start > 0 ? '...' : '') + item.contentText.slice(start, end) + (end < item.contentText.length ? '...' : '');
        } else {
          snippet = item.contentText.slice(0, 100) + (item.contentText.length > 100 ? '...' : '');
        }
      }

      return { ...item, score, snippet };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // Deduplicate by sectionId
  const seen = new Set();
  const results = [];
  for (const item of scored) {
    if (seen.has(item.sectionId)) continue;
    seen.add(item.sectionId);
    results.push(item);
    if (results.length >= limit) break;
  }

  return results;
}
