/**
 * Sample Individual Development Plans for testing.
 * 3 plans at different stages:
 *   1. Just created (no reviews yet)
 *   2. Mid-season with one review
 *   3. End-of-season with achieved goal
 */

export const SKILL_CATEGORIES = [
  { id: 'ball_handling', label: 'Ball Handling' },
  { id: 'passing', label: 'Passing & Receiving' },
  { id: 'shooting', label: 'Shooting' },
  { id: 'footwork', label: 'Footwork' },
  { id: 'defense', label: 'Defense' },
  { id: 'off_ball', label: 'Off-Ball Movement' },
  { id: 'team_play', label: 'Team Play' },
  { id: 'basketball_iq', label: 'Basketball IQ' }
];

export const GOAL_STATUSES = [
  { id: 'not_started', label: 'Not Started', color: 'bg-gray-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'achieved', label: 'Achieved', color: 'bg-[#00A651]' },
  { id: 'needs_more_time', label: 'Needs More Time', color: 'bg-amber-500' }
];

export const REVIEW_TYPES = [
  { id: 'start_of_season', label: 'Start of Season' },
  { id: 'mid_season', label: 'Mid-Season' },
  { id: 'end_of_season', label: 'End of Season' },
  { id: 'ad_hoc', label: 'Ad Hoc' }
];

export const sampleIDPs = [
  // Plan 1: Just created, no reviews
  {
    id: 'idp-sample-1',
    playerId: 'p1',
    playerName: 'Emma Wilson',
    teamId: 'u10-green',
    coachId: 'coach-1',
    season: '2025-Winter',
    status: 'active',
    baselineAssessment: {
      date: new Date('2025-04-01'),
      skills: {
        ball_handling: 2,
        passing: 2,
        shooting: 1,
        footwork: 2,
        defense: 1,
        off_ball: 1,
        team_play: 3,
        basketball_iq: 2
      },
      overallLevel: 1.75
    },
    goals: [
      {
        id: 'g1',
        skillCategory: 'shooting',
        currentLevel: 1,
        targetLevel: 2,
        specificTarget: 'Make 5 out of 10 free throws consistently in practice',
        drillsRecommended: [],
        homePractice: 'Practice form shooting against a wall 10 minutes daily',
        status: 'not_started',
        coachNotes: ''
      },
      {
        id: 'g2',
        skillCategory: 'defense',
        currentLevel: 1,
        targetLevel: 2,
        specificTarget: 'Maintain defensive stance for full possession without standing up',
        drillsRecommended: [],
        homePractice: 'Wall sits and defensive slide drills at home',
        status: 'not_started',
        coachNotes: ''
      }
    ],
    reviews: [],
    parentIds: [],
    parentVisible: false,
    parentComments: [],
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date('2025-04-01')
  },

  // Plan 2: Mid-season with one review, in-progress goals
  {
    id: 'idp-sample-2',
    playerId: 'p6',
    playerName: 'Liam Johnson',
    teamId: 'u12-emerald',
    coachId: 'coach-1',
    season: '2025-Winter',
    status: 'active',
    baselineAssessment: {
      date: new Date('2025-03-15'),
      skills: {
        ball_handling: 3,
        passing: 2,
        shooting: 2,
        footwork: 3,
        defense: 2,
        off_ball: 2,
        team_play: 3,
        basketball_iq: 3
      },
      overallLevel: 2.5
    },
    goals: [
      {
        id: 'g3',
        skillCategory: 'passing',
        currentLevel: 2,
        targetLevel: 3,
        specificTarget: 'Execute accurate chest and bounce passes in 3v3 under pressure',
        drillsRecommended: [],
        homePractice: 'Partner passing drills — 50 chest passes and 50 bounce passes per session',
        status: 'in_progress',
        coachNotes: 'Good progress on chest passes, bounce pass accuracy still needs work'
      },
      {
        id: 'g4',
        skillCategory: 'shooting',
        currentLevel: 2,
        targetLevel: 3,
        specificTarget: 'Consistent form on catch-and-shoot from elbow range',
        drillsRecommended: [],
        homePractice: 'Form shooting from close range, focus on follow-through',
        status: 'in_progress',
        coachNotes: 'Form improving, needs to speed up release'
      },
      {
        id: 'g5',
        skillCategory: 'defense',
        currentLevel: 2,
        targetLevel: 3,
        specificTarget: 'Stay in help-side position and rotate on ball movement',
        drillsRecommended: [],
        homePractice: 'Watch defensive rotation videos, visualize positioning',
        status: 'not_started',
        coachNotes: ''
      }
    ],
    reviews: [
      {
        date: new Date('2025-05-10'),
        type: 'mid_season',
        assessedSkills: {
          passing: 2,
          shooting: 2,
          defense: 2
        },
        coachComments: 'Liam is making good progress overall. Passing accuracy has improved in practice drills. Shooting form is better but still needs consistency under game pressure. Defence hasn\'t been a focus yet — we\'ll prioritize that in the second half.',
        goalsProgress: [
          { goalId: 'g3', status: 'in_progress', note: 'Chest passes improved, bounce passes need work' },
          { goalId: 'g4', status: 'in_progress', note: 'Form is better, release speed needs improvement' },
          { goalId: 'g5', status: 'not_started', note: 'Will focus on this next half of season' }
        ]
      }
    ],
    parentIds: ['parent-1'],
    parentVisible: true,
    parentComments: [
      {
        parentId: 'parent-1',
        parentName: 'Sarah Johnson',
        date: new Date('2025-05-12'),
        comment: 'Thanks for the update! Liam has been practising his passing at home. Great to see the progress!'
      }
    ],
    createdAt: new Date('2025-03-15'),
    updatedAt: new Date('2025-05-10')
  },

  // Plan 3: End-of-season with achieved goal
  {
    id: 'idp-sample-3',
    playerId: 'p11',
    playerName: 'Mia Robinson',
    teamId: 'u14-lakers',
    coachId: 'coach-2',
    season: '2025-Winter',
    status: 'completed',
    baselineAssessment: {
      date: new Date('2025-03-01'),
      skills: {
        ball_handling: 2,
        passing: 3,
        shooting: 2,
        footwork: 2,
        defense: 3,
        off_ball: 2,
        team_play: 3,
        basketball_iq: 3
      },
      overallLevel: 2.5
    },
    goals: [
      {
        id: 'g6',
        skillCategory: 'ball_handling',
        currentLevel: 2,
        targetLevel: 3,
        specificTarget: 'Dribble confidently with both hands in full-court press situations',
        drillsRecommended: [],
        homePractice: 'Weak hand dribbling series — 10 minutes daily',
        status: 'achieved',
        coachNotes: 'Mia has made excellent progress. Can now handle press situations with either hand.'
      },
      {
        id: 'g7',
        skillCategory: 'shooting',
        currentLevel: 2,
        targetLevel: 3,
        specificTarget: 'Hit 60% from mid-range in practice',
        drillsRecommended: [],
        homePractice: 'Spot-up shooting from 5 spots, track makes/attempts',
        status: 'achieved',
        coachNotes: 'Consistently hitting 55-65% from mid-range. Goal achieved.'
      }
    ],
    reviews: [
      {
        date: new Date('2025-04-15'),
        type: 'mid_season',
        assessedSkills: {
          ball_handling: 2,
          shooting: 2
        },
        coachComments: 'Good effort on both goals. Ball handling improving steadily. Shooting form is better but accuracy not yet at target.',
        goalsProgress: [
          { goalId: 'g6', status: 'in_progress', note: 'Weak hand much improved' },
          { goalId: 'g7', status: 'in_progress', note: 'Hitting 45% from mid-range' }
        ]
      },
      {
        date: new Date('2025-06-01'),
        type: 'end_of_season',
        assessedSkills: {
          ball_handling: 3,
          passing: 3,
          shooting: 3,
          footwork: 2,
          defense: 3,
          off_ball: 3,
          team_play: 3,
          basketball_iq: 3
        },
        coachComments: 'Outstanding season for Mia! Both goals achieved. Ball handling transformed — she can now beat press with confidence. Mid-range shooting is consistent. Ready for U16 challenges next season.',
        goalsProgress: [
          { goalId: 'g6', status: 'achieved', note: 'Handles press situations with confidence' },
          { goalId: 'g7', status: 'achieved', note: 'Hitting 60%+ consistently from mid-range' }
        ]
      }
    ],
    parentIds: ['parent-2'],
    parentVisible: true,
    parentComments: [
      {
        parentId: 'parent-2',
        parentName: 'David Robinson',
        date: new Date('2025-06-02'),
        comment: 'So proud of Mia this season! The development plan really helped focus her practice. Thank you coach!'
      }
    ],
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-06-01')
  }
];
