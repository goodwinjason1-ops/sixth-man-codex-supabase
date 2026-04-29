export const QA_DATASET_ID = 'lakers-end-user-qa';
export const QA_DATASET_LABEL = 'Emerald Lakers end-user QA dataset';
export const QA_DATASET_ACTOR = 'qa-dataset';

const DEFAULT_GENERATED_AT = '2026-04-29T00:00:00.000Z';
const SEASON = '2026 Winter';

const roles = [
  'admin',
  'president',
  'vice_president',
  'coach_coordinator',
  'girls_coordinator',
  'boys_coordinator',
  'youth_head_coach',
  'coach',
  'youth_coach',
  'player',
  'parent',
  'team_manager',
  'tryout_assessor',
  'pending'
];

const teamDefs = [
  {
    id: 'lakers-qa-u10-girls-green',
    name: 'Lakers U10 Girls Green',
    ageGroup: 'U10',
    gender: 'girls',
    coachRole: 'girls_coordinator',
    managerRole: 'team_manager',
    venue: 'Emerald Stadium Court 1'
  },
  {
    id: 'lakers-qa-u12-boys-green',
    name: 'Lakers U12 Boys Green',
    ageGroup: 'U12',
    gender: 'boys',
    coachRole: 'coach',
    managerRole: 'team_manager',
    venue: 'Emerald Stadium Court 2'
  },
  {
    id: 'lakers-qa-u14-girls-gold',
    name: 'Lakers U14 Girls Gold',
    ageGroup: 'U14',
    gender: 'girls',
    coachRole: 'coach',
    managerRole: 'girls_coordinator',
    venue: 'Hills Sports Centre'
  },
  {
    id: 'lakers-qa-u16-boys-white',
    name: 'Lakers U16 Boys White',
    ageGroup: 'U16',
    gender: 'boys',
    coachRole: 'boys_coordinator',
    managerRole: 'team_manager',
    venue: 'Westside Arena'
  },
  {
    id: 'lakers-qa-little-lakers',
    name: 'Little Lakers Development Squad',
    ageGroup: 'U8',
    gender: 'mixed',
    coachRole: 'youth_coach',
    managerRole: 'youth_head_coach',
    venue: 'Community Centre Gym'
  }
];

const playerDefs = [
  ['001', 'Ava', 'Hart', 'lakers-qa-u12-boys-green', 4, 'Point Guard', '2014-03-14'],
  ['002', 'Mia', 'Clarke', 'lakers-qa-u12-boys-green', 7, 'Shooting Guard', '2014-08-21'],
  ['003', 'Noah', 'Reed', 'lakers-qa-u12-boys-green', 11, 'Small Forward', '2013-12-09'],
  ['004', 'Leo', 'Bennett', 'lakers-qa-u12-boys-green', 15, 'Forward', '2014-05-03'],
  ['005', 'Sienna', 'Kelly', 'lakers-qa-u10-girls-green', 3, 'Guard', '2016-01-19'],
  ['006', 'Ruby', 'Fraser', 'lakers-qa-u10-girls-green', 8, 'Guard', '2016-09-11'],
  ['007', 'Olivia', 'Stone', 'lakers-qa-u10-girls-green', 12, 'Forward', '2015-07-28'],
  ['008', 'Zoe', 'Walsh', 'lakers-qa-u10-girls-green', 22, 'Center', '2016-11-04'],
  ['009', 'Grace', 'Miller', 'lakers-qa-u14-girls-gold', 5, 'Point Guard', '2012-06-17'],
  ['010', 'Ella', 'Parker', 'lakers-qa-u14-girls-gold', 9, 'Wing', '2012-10-30'],
  ['011', 'Charlotte', 'Young', 'lakers-qa-u14-girls-gold', 14, 'Forward', '2011-04-22'],
  ['012', 'Isla', 'Morris', 'lakers-qa-u14-girls-gold', 24, 'Center', '2012-02-08'],
  ['013', 'Liam', 'Price', 'lakers-qa-u16-boys-white', 6, 'Guard', '2010-01-26'],
  ['014', 'Ethan', 'Brooks', 'lakers-qa-u16-boys-white', 10, 'Wing', '2010-08-15'],
  ['015', 'Mason', 'Turner', 'lakers-qa-u16-boys-white', 21, 'Forward', '2009-12-03'],
  ['016', 'Jack', 'Hughes', 'lakers-qa-u16-boys-white', 33, 'Center', '2010-05-29']
].map(([suffix, firstName, lastName, teamId, number, position, dateOfBirth]) => {
  const id = `lakers-qa-player-${suffix}`;
  const team = teamDefs.find((row) => row.id === teamId);
  return {
    id,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    teamId,
    teamIds: [teamId],
    team: team.name,
    teamName: team.name,
    ageGroup: team.ageGroup,
    playerNumber: number,
    jerseyNumber: number,
    position,
    dateOfBirth,
    parentName: `${lastName} Parent`,
    parentEmail: `${firstName}.${lastName}.parent@example.test`.toLowerCase()
  };
});

const skillDefs = [
  { id: 'lakers-qa-skill-handles', title: 'Ball Handling', category: 'Offense' },
  { id: 'lakers-qa-skill-defense', title: 'On-ball Defense', category: 'Defense' },
  { id: 'lakers-qa-skill-shooting', title: 'Shooting Form', category: 'Shooting' },
  { id: 'lakers-qa-skill-teamwork', title: 'Team Communication', category: 'Game Sense' }
];

const resolveRoleFromAuthUser = (authUser, roleUsers) => {
  if (!authUser) return null;
  if (authUser.role) return authUser.role;
  if (authUser.app_metadata?.qa_role) return authUser.app_metadata.qa_role;
  if (authUser.user_metadata?.role) return authUser.user_metadata.role;

  const email = authUser.email?.toLowerCase();
  return Object.values(roleUsers || {}).find((profile) => profile.email?.toLowerCase() === email)?.role || null;
};

export function resolveRoleIds(roleUsers = {}, authUsers = []) {
  const authByRole = new Map();

  authUsers.forEach((authUser) => {
    const role = resolveRoleFromAuthUser(authUser, roleUsers);
    if (role && authUser.id) authByRole.set(role, authUser.id);
  });

  return Object.fromEntries(roles.map((role) => {
    const fixture = roleUsers[role] || {};
    return [role, authByRole.get(role) || fixture.uid || `qa-${role}-user`];
  }));
}

export function tagQaData(data = {}, { generatedAt = DEFAULT_GENERATED_AT } = {}) {
  return {
    ...data,
    isTestData: true,
    qa: {
      ...(data.qa || {}),
      datasetId: QA_DATASET_ID,
      label: QA_DATASET_LABEL,
      isTestData: true,
      generatedAt
    }
  };
}

const docRow = (collection, id, data, generatedAt) => ({
  collection,
  id,
  data: tagQaData(data, { generatedAt }),
  created_at: data.createdAt || generatedAt,
  updated_at: data.updatedAt || generatedAt,
  created_by: QA_DATASET_ACTOR,
  updated_by: QA_DATASET_ACTOR
});

const buildUserRows = ({ roleUsers, roleIds, generatedAt }) => {
  const assignedTeams = {
    coach: ['lakers-qa-u12-boys-green', 'lakers-qa-u14-girls-gold'],
    girls_coordinator: ['lakers-qa-u10-girls-green', 'lakers-qa-u14-girls-gold'],
    boys_coordinator: ['lakers-qa-u12-boys-green', 'lakers-qa-u16-boys-white'],
    youth_coach: ['lakers-qa-little-lakers'],
    youth_head_coach: ['lakers-qa-little-lakers'],
    team_manager: ['lakers-qa-u12-boys-green', 'lakers-qa-u16-boys-white']
  };

  return roles.map((role) => {
    const fixture = roleUsers[role] || {};
    const id = roleIds[role];
    const displayName = fixture.displayName || role.replace(/_/g, ' ');
    const profile = {
      uid: id,
      email: fixture.email || `${role}@example.test`,
      displayName,
      name: displayName,
      role,
      status: role === 'pending' ? 'pending' : 'approved',
      photoURL: null,
      createdAt: generatedAt,
      updatedAt: generatedAt
    };

    if (assignedTeams[role]) profile.assignedTeams = assignedTeams[role];
    if (role === 'player') profile.playerId = 'lakers-qa-player-001';
    if (role === 'parent') profile.linkedPlayerIds = ['lakers-qa-player-001', 'lakers-qa-player-002'];

    return docRow('users', id, profile, generatedAt);
  });
};

const buildTeamRows = ({ roleIds, generatedAt }) => teamDefs.map((team) => {
  const players = playerDefs.filter((player) => player.teamId === team.id).map((player) => player.id);
  return docRow('teams', team.id, {
    teamId: team.id,
    name: team.name,
    ageGroup: team.ageGroup,
    gender: team.gender,
    season: SEASON,
    active: true,
    venue: team.venue,
    coachId: roleIds[team.coachRole],
    coachName: team.coachRole.replace(/_/g, ' '),
    managerId: roleIds[team.managerRole],
    managerName: team.managerRole.replace(/_/g, ' '),
    playerIds: players,
    players,
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt);
});

const buildPlayerRows = ({ roleIds, generatedAt }) => playerDefs.map((player, index) => {
  const linkedParentIds = index < 2 ? [roleIds.parent] : [];
  const authUserId = index === 0 ? roleIds.player : null;

  return docRow('players', player.id, {
    ...player,
    email: authUserId ? 'player@test.com' : null,
    authUserId,
    linkedParentIds,
    status: 'active',
    developmentFocus: index % 2 === 0 ? 'Decision making under pressure' : 'Defensive footwork',
    medicalNotes: index === 3 ? 'Asthma action plan on file' : '',
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt);
});

const buildCurriculumRows = (generatedAt) => [
  ...skillDefs.map((skill, index) => docRow('curriculum', skill.id, {
    ...skill,
    name: skill.title,
    order: index + 1,
    drills: [`lakers-qa-drill-${index + 1}`],
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt)),
  ...skillDefs.map((skill, index) => docRow('drills', `lakers-qa-drill-${index + 1}`, {
    title: `${skill.title} progression`,
    name: `${skill.title} progression`,
    category: skill.category,
    difficulty: index < 2 ? 'Beginner' : 'Intermediate',
    durationMinutes: 12 + (index * 3),
    usageCount: 4 + index,
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt))
];

const buildEvaluationRows = ({ roleIds, generatedAt }) => playerDefs.slice(0, 12).map((player, index) => {
  const skill = skillDefs[index % skillDefs.length];
  return docRow('evaluations', `lakers-qa-eval-${String(index + 1).padStart(2, '0')}`, {
    playerId: player.id,
    playerName: player.name,
    skillId: skill.id,
    skillName: skill.title,
    level: 3 + (index % 3),
    score: 3 + (index % 3),
    coachId: index % 2 === 0 ? roleIds.coach : roleIds.girls_coordinator,
    coachName: index % 2 === 0 ? 'Coach User' : 'Girls Coordinator',
    notes: index % 2 === 0 ? 'Strong engagement and coachability.' : 'Needs more game-speed reps.',
    date: `2026-04-${String(10 + index).padStart(2, '0')}T09:00:00.000Z`,
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt);
});

const buildGameRows = ({ roleIds, generatedAt }) => {
  const opponents = ['Hills Hornets', 'Westside Wolves', 'Valley Falcons', 'Northside Comets', 'City Breakers'];
  return teamDefs.slice(0, 4).flatMap((team, teamIndex) => [0, 1].map((roundIndex) => {
    const id = `lakers-qa-game-${teamIndex + 1}-${roundIndex + 1}`;
    return docRow('games', id, {
      gameId: id,
      teamId: team.id,
      teamName: team.name,
      opponent: opponents[(teamIndex + roundIndex) % opponents.length],
      venue: roundIndex === 0 ? team.venue : 'Away Stadium Court 1',
      date: `2026-04-${String(18 + teamIndex + (roundIndex * 7)).padStart(2, '0')}T10:00:00.000Z`,
      time: roundIndex === 0 ? '10:00 AM' : '12:00 PM',
      homeAway: roundIndex === 0 ? 'home' : 'away',
      round: roundIndex + 1,
      season: SEASON,
      coachId: roleIds[team.coachRole],
      status: roundIndex === 0 ? 'completed' : 'scheduled',
      result: roundIndex === 0 ? { for: 42 + teamIndex, against: 35 + teamIndex, outcome: 'win' } : null,
      type: 'game',
      createdAt: generatedAt,
      updatedAt: generatedAt
    }, generatedAt);
  }));
};

const buildScheduleRows = (generatedAt) => teamDefs.flatMap((team, index) => [
  docRow('schedule', `lakers-qa-training-${index + 1}`, {
    title: `${team.name} training`,
    teamId: team.id,
    teamName: team.name,
    venue: team.venue,
    date: `2026-04-${String(21 + index).padStart(2, '0')}T17:30:00.000Z`,
    type: 'training',
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt),
  docRow('schedule', `lakers-qa-fixture-${index + 1}`, {
    title: `${team.name} fixture`,
    teamId: team.id,
    teamName: team.name,
    venue: team.venue,
    date: `2026-05-${String(2 + index).padStart(2, '0')}T10:00:00.000Z`,
    type: 'game',
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt)
]);

const buildTrainingRows = ({ roleIds, generatedAt }) => teamDefs.slice(0, 4).flatMap((team, index) => {
  const teamPlayers = playerDefs.filter((player) => player.teamId === team.id);
  const planId = `lakers-qa-plan-${index + 1}`;
  const recordId = `lakers-qa-training-record-${index + 1}`;
  return [
    docRow('training_plans', planId, {
      name: `${team.name} weekly plan`,
      title: `${team.name} weekly plan`,
      teamId: team.id,
      coachId: roleIds[team.coachRole],
      status: 'active',
      updatedAt: generatedAt,
      sessions: [
        {
          title: 'Pressure handling and spacing',
          focus: 'Decision making',
          drills: skillDefs.slice(0, 2).map((skill, drillIndex) => ({
            id: `lakers-qa-drill-${drillIndex + 1}`,
            name: `${skill.title} progression`,
            minutes: 12
          }))
        }
      ],
      createdAt: generatedAt
    }, generatedAt),
    docRow('training_records', recordId, {
      teamId: team.id,
      teamName: team.name,
      coachId: roleIds[team.coachRole],
      planId,
      date: `2026-04-${String(22 + index).padStart(2, '0')}T17:30:00.000Z`,
      attendance: {
        present: teamPlayers.slice(0, 3).map((player) => player.id),
        absent: teamPlayers.slice(3).map((player) => player.id)
      },
      notes: 'Completed core block and finished with controlled scrimmage.',
      voiceCaptures: [
        {
          id: `${recordId}-voice-1`,
          transcript: `${teamPlayers[0]?.name} effort four, ${teamPlayers[1]?.name} defense three.`,
          createdAt: generatedAt
        }
      ],
      createdAt: generatedAt,
      updatedAt: generatedAt
    }, generatedAt),
    docRow('training_notes', `lakers-qa-training-note-${index + 1}`, {
      playerId: teamPlayers[0]?.id,
      playerName: teamPlayers[0]?.name,
      teamId: team.id,
      coachId: roleIds[team.coachRole],
      date: `2026-04-${String(22 + index).padStart(2, '0')}T18:40:00.000Z`,
      note: 'Good intent. Next focus is scanning before receiving.',
      parentVisible: index % 2 === 0,
      createdAt: generatedAt,
      updatedAt: generatedAt
    }, generatedAt)
  ];
});

const playerAssessmentFor = (players, offset = 0) => Object.fromEntries(players.map((player, index) => [
  player.id,
  {
    playerId: player.id,
    playerName: player.name,
    teamWork: 3 + ((index + offset) % 3),
    defense: 3 + ((index + offset + 1) % 3),
    ballMovement: 3 + ((index + offset + 2) % 3),
    offense: 3 + ((index + offset) % 2),
    shotSelection: 3 + ((index + offset + 1) % 2),
    sportsmanship: 4,
    notes: index === 0 ? 'Led the group well in transition.' : ''
  }
]));

const buildMatchAssessmentRows = ({ roleIds, generatedAt }) => teamDefs.slice(0, 4).map((team, index) => {
  const teamPlayers = playerDefs.filter((player) => player.teamId === team.id);
  const id = `lakers-qa-match-assessment-${index + 1}`;
  return docRow('match_assessments', id, {
    gameId: `lakers-qa-game-${index + 1}-1`,
    teamId: team.id,
    teamName: team.name,
    coachId: roleIds[team.coachRole],
    date: `2026-04-${String(18 + index).padStart(2, '0')}T12:00:00.000Z`,
    matchDate: `2026-04-${String(18 + index).padStart(2, '0')}`,
    opponentName: ['Hills Hornets', 'Westside Wolves', 'Valley Falcons', 'Northside Comets'][index],
    gameResult: index === 1 ? 'loss' : 'win',
    teamRatings: {
      teamWork: 4,
      defense: 3 + (index % 2),
      ballMovement: 4,
      offense: 3,
      shotSelection: 4,
      sportsmanship: 5
    },
    teamRatingNotes: 'Strong effort and positive bench engagement.',
    teamRatingNotesPrivate: false,
    gameNotes: 'Rotation intent achieved with one development exception noted.',
    gameNotesPrivate: false,
    mvpVotes: {
      vote3: teamPlayers[0]?.id,
      vote2: teamPlayers[1]?.id,
      vote1: teamPlayers[2]?.id
    },
    playerAssessments: playerAssessmentFor(teamPlayers, index),
    voiceCaptures: [
      {
        id: `${id}-voice-1`,
        transcript: `${teamPlayers[0]?.name} teamwork five and defense four. ${teamPlayers[1]?.name} shot selection four.`,
        matches: [
          { playerId: teamPlayers[0]?.id, metricId: 'teamWork', score: 5 },
          { playerId: teamPlayers[0]?.id, metricId: 'defense', score: 4 },
          { playerId: teamPlayers[1]?.id, metricId: 'shotSelection', score: 4 }
        ],
        createdAt: generatedAt
      }
    ],
    status: 'submitted',
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt);
});

const buildDevelopmentPlanRows = ({ roleIds, generatedAt }) => playerDefs.slice(0, 8).map((player, index) => docRow('development_plans', `lakers-qa-idp-${index + 1}`, {
  playerId: player.id,
  playerName: player.name,
  teamId: player.teamId,
  coachId: index % 2 === 0 ? roleIds.coach : roleIds.girls_coordinator,
  title: `${player.firstName} development plan`,
  status: index === 7 ? 'draft' : 'active',
  parentVisible: index % 3 !== 1,
  nextReviewDate: `2026-05-${String(5 + index).padStart(2, '0')}`,
  goals: [
    {
      id: `lakers-qa-idp-${index + 1}-goal-1`,
      title: index % 2 === 0 ? 'Scan before dribble' : 'Stay square on closeouts',
      status: 'active',
      skillId: index % 2 === 0 ? 'lakers-qa-skill-handles' : 'lakers-qa-skill-defense',
      targetLevel: 4,
      dueDate: `2026-06-${String(1 + index).padStart(2, '0')}`
    },
    {
      id: `lakers-qa-idp-${index + 1}-goal-2`,
      title: 'Positive communication every possession',
      status: index % 4 === 0 ? 'completed' : 'active',
      skillId: 'lakers-qa-skill-teamwork',
      targetLevel: 4
    }
  ],
  reviews: [
    {
      reviewedAt: '2026-04-20T09:00:00.000Z',
      summary: 'Progress visible in training intensity.',
      reviewerId: roleIds.coach
    }
  ],
  createdAt: generatedAt,
  updatedAt: generatedAt
}, generatedAt));

const buildOperationsRows = ({ roleIds, generatedAt }) => [
  docRow('notifications', 'lakers-qa-notification-1', {
    title: 'Round 2 fixture update',
    message: 'Court allocation changed for U12 Boys Green.',
    targetRoles: ['admin', 'coach', 'parent', 'team_manager'],
    readBy: [],
    deletedBy: [],
    date: generatedAt,
    sentAt: generatedAt
  }, generatedAt),
  docRow('parent_invitations', 'lakers-qa-invite-1', {
    invitationCode: 'LAKERS-QA-PARENT',
    playerIds: ['lakers-qa-player-001', 'lakers-qa-player-002'],
    parentEmail: 'parent@test.com',
    parentName: 'Parent User',
    status: 'pending',
    createdAt: generatedAt,
    expiresAt: '2026-12-31T00:00:00.000Z'
  }, generatedAt),
  docRow('scoring_assignments', 'lakers-qa-scoring-1', {
    gameId: 'lakers-qa-game-2-2',
    teamId: 'lakers-qa-u12-boys-green',
    assignedToId: roleIds.parent,
    assignedToEmail: 'parent@test.com',
    status: 'pending',
    gameDate: '2026-05-02T10:00:00.000Z',
    createdAt: generatedAt
  }, generatedAt),
  docRow('swap_requests', 'lakers-qa-swap-1', {
    assignmentId: 'lakers-qa-scoring-1',
    swapToId: roleIds.parent,
    status: 'pending',
    createdAt: generatedAt
  }, generatedAt),
  docRow('mvp_votes', 'lakers-qa-mvp-1', {
    gameId: 'lakers-qa-game-2-1',
    teamId: 'lakers-qa-u12-boys-green',
    votes: { 3: 'lakers-qa-player-001', 2: 'lakers-qa-player-002', 1: 'lakers-qa-player-003' },
    createdAt: generatedAt
  }, generatedAt),
  docRow('coach_accreditations', 'lakers-qa-coach-accreditation-1', {
    coachId: roleIds.coach,
    coachName: 'Coach User',
    level: 'Community Coach',
    expiresAt: '2026-12-31T00:00:00.000Z',
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt),
  docRow('assessment_metrics', 'U12', {
    metrics: [
      { id: 'teamWork', name: 'Team Work', order: 1 },
      { id: 'defense', name: 'Defense', order: 2 },
      { id: 'shotSelection', name: 'Shot Selection', order: 3 },
      { id: 'sportsmanship', name: 'Sportsmanship', order: 4 }
    ],
    updatedAt: generatedAt
  }, generatedAt)
];

const buildTryoutRows = ({ roleIds, generatedAt }) => {
  const sessionIds = ['lakers-qa-tryout-u12', 'lakers-qa-tryout-u14'];
  const sessions = [
    docRow('tryout_sessions', sessionIds[0], {
      name: 'Lakers U12 tryout',
      ageGroup: 'U12',
      date: '2026-05-09T09:00:00.000Z',
      status: 'active',
      sessionType: 'hour-1',
      assessors: [roleIds.tryout_assessor],
      players: playerDefs.slice(0, 6).map((player) => player.id),
      createdAt: generatedAt,
      updatedAt: generatedAt
    }, generatedAt),
    docRow('tryout_sessions', sessionIds[1], {
      name: 'Lakers U14 tryout',
      ageGroup: 'U14',
      date: '2026-05-09T11:00:00.000Z',
      status: 'active',
      sessionType: 'hour-2',
      assessors: [roleIds.tryout_assessor],
      players: playerDefs.slice(8, 14).map((player) => player.id),
      createdAt: generatedAt,
      updatedAt: generatedAt
    }, generatedAt)
  ];

  const tryoutPlayers = [...playerDefs.slice(0, 6), ...playerDefs.slice(8, 14)];
  const evaluations = tryoutPlayers.map((player, index) => docRow('tryout_evaluations', `lakers-qa-tryout-eval-${index + 1}`, {
    sessionId: index < 6 ? sessionIds[0] : sessionIds[1],
    playerId: player.id,
    playerName: player.name,
    assessorId: roleIds.tryout_assessor,
    status: 'submitted',
    metrics: {
      athleticism: 3 + (index % 3),
      ballSkills: 3 + ((index + 1) % 3),
      gameUnderstanding: 3 + ((index + 2) % 3),
      coachability: 4,
      effort: 4 + (index % 2)
    },
    compositeAvg: 3.6 + ((index % 4) * 0.2),
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt));

  return [...sessions, ...evaluations];
};

const buildScoutingRows = ({ roleIds, generatedAt }) => playerDefs.slice(0, 10).map((player, index) => docRow('scout_evaluations', `lakers-qa-scout-eval-${index + 1}`, {
  gameId: `lakers-qa-game-${(index % 4) + 1}-1`,
  playerId: player.id,
  playerName: player.name,
  scoutId: index % 2 === 0 ? roleIds.coach : roleIds.coach_coordinator,
  status: 'submitted',
  metrics: {
    skillsTechnique: 3 + (index % 3),
    gameAwareness: 3 + ((index + 1) % 3),
    athleticism: 3 + ((index + 2) % 3),
    attitudeCoachability: 4,
    teamworkCommunication: 4
  },
  notes: 'Scout view captured during round fixture.',
  createdAt: generatedAt,
  updatedAt: generatedAt
}, generatedAt));

const buildPlayingTimeRows = ({ roleIds, generatedAt }) => teamDefs.slice(0, 4).map((team, index) => {
  const teamPlayers = playerDefs.filter((player) => player.teamId === team.id);
  const stats = Object.fromEntries(teamPlayers.map((player, playerIndex) => {
    const shortMinute = playerIndex === 3 && index % 2 === 0;
    return [
      player.id,
      {
        playerId: player.id,
        playerName: player.name,
        totalSeconds: shortMinute ? 420 : 900 + (playerIndex * 60),
        seconds: shortMinute ? 420 : 900 + (playerIndex * 60),
        stints: [
          { start: 0, end: shortMinute ? 420 : 600 },
          ...(shortMinute ? [] : [{ start: 900, end: 1200 + (playerIndex * 60) }])
        ],
        fairPlayContext: shortMinute
          ? {
              code: index === 0 ? 'injury' : 'coach_discretion',
              label: index === 0 ? 'Injury' : 'Coach discretion',
              parentVisible: true,
              suppressesAlert: index === 0,
              details: { source: 'QA reset dataset' }
            }
          : null
      }
    ];
  }));

  return docRow('playing_time', `lakers-qa-playing-time-${index + 1}`, {
    gameId: `lakers-qa-game-${index + 1}-1`,
    teamId: team.id,
    teamName: team.name,
    coachId: roleIds[team.coachRole],
    date: `2026-04-${String(18 + index).padStart(2, '0')}T10:00:00.000Z`,
    playerStats: stats,
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt);
});

const buildShotEventRows = ({ generatedAt }) => {
  const zones = [
    { x: 50, y: 8, value: 2, type: 'layup' },
    { x: 42, y: 24, value: 2, type: 'paint' },
    { x: 8, y: 18, value: 3, type: 'three' },
    { x: 92, y: 18, value: 3, type: 'three' },
    { x: 48, y: 56, value: 3, type: 'above break three' }
  ];

  return playerDefs.slice(0, 10).flatMap((player, playerIndex) => [0, 1].map((attemptIndex) => {
    const zone = zones[(playerIndex + attemptIndex) % zones.length];
    const made = (playerIndex + attemptIndex) % 3 !== 0;
    return docRow('shot_events', `lakers-qa-shot-${playerIndex + 1}-${attemptIndex + 1}`, {
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      teamName: player.teamName,
      gameId: `lakers-qa-game-${(playerIndex % 4) + 1}-1`,
      gameDate: `2026-04-${String(18 + (playerIndex % 4)).padStart(2, '0')}T10:00:00.000Z`,
      opponent: ['Hills Hornets', 'Westside Wolves', 'Valley Falcons', 'Northside Comets'][playerIndex % 4],
      period: attemptIndex + 1,
      clock: attemptIndex === 0 ? '07:42' : '03:18',
      x: zone.x,
      y: zone.y,
      outcome: made ? 'made' : 'missed',
      made,
      value: zone.value,
      shotType: zone.type,
      source: attemptIndex === 0 ? 'manual_entry' : 'video_ai_reviewed',
      confidence: attemptIndex === 0 ? 1 : 0.82,
      createdAt: generatedAt,
      updatedAt: generatedAt
    }, generatedAt);
  }));
};

const buildSelectionRows = ({ roleIds, generatedAt }) => playerDefs.slice(0, 10).map((player, index) => docRow('selection_decisions', `lakers-qa-selection-${index + 1}`, {
  playerId: player.id,
  playerName: player.name,
  ageGroup: player.ageGroup,
  status: index < 4 ? 'approved' : index < 7 ? 'in_review' : 'recommended',
  decision: index < 6 ? 'team_assignment' : 'development',
  targetTeamId: player.teamId,
  recommendedTeamId: player.teamId,
  committeeNotes: index % 3 === 0 ? 'Strong combined tryout and scouting evidence.' : '',
  privateNotes: 'Internal QA-only committee note.',
  decidedBy: roleIds.admin,
  reviewedAt: `2026-04-${String(24 + (index % 4)).padStart(2, '0')}T12:00:00.000Z`,
  createdAt: generatedAt,
  updatedAt: generatedAt
}, generatedAt));

const buildYouthRows = ({ roleIds, generatedAt }) => [
  docRow('youth_programs', 'lakers-qa-youth-program-1', {
    name: 'Little Lakers Skills',
    type: 'little_lakers',
    status: 'active',
    leadCoachId: roleIds.youth_coach,
    createdAt: generatedAt,
    updatedAt: generatedAt
  }, generatedAt),
  docRow('youth_enrollments', 'lakers-qa-youth-enrollment-1', {
    programId: 'lakers-qa-youth-program-1',
    childName: 'Harper Lake',
    parentEmail: 'harper.parent@example.test',
    status: 'active',
    enrolledAt: generatedAt
  }, generatedAt),
  docRow('youth_sessions', 'lakers-qa-youth-session-1', {
    programId: 'lakers-qa-youth-program-1',
    weekNumber: 1,
    sessionDate: '2026-04-27T09:00:00.000Z',
    title: 'Week 1 ball confidence',
    coachId: roleIds.youth_coach
  }, generatedAt),
  docRow('youth_attendance', 'lakers-qa-youth-attendance-1', {
    programId: 'lakers-qa-youth-program-1',
    sessionId: 'lakers-qa-youth-session-1',
    enrollmentId: 'lakers-qa-youth-enrollment-1',
    present: true,
    recordedAt: generatedAt
  }, generatedAt),
  docRow('session_summaries', 'lakers-qa-session-summary-1', {
    programId: 'lakers-qa-youth-program-1',
    sessionId: 'lakers-qa-youth-session-1',
    summary: 'Positive start with strong engagement from new participants.',
    createdAt: generatedAt
  }, generatedAt)
];

export function buildLakersQaDataset({
  roleUsers = {},
  authUsers = [],
  generatedAt = DEFAULT_GENERATED_AT
} = {}) {
  const roleIds = resolveRoleIds(roleUsers, authUsers);

  return [
    ...buildUserRows({ roleUsers, roleIds, generatedAt }),
    ...buildTeamRows({ roleIds, generatedAt }),
    ...buildPlayerRows({ roleIds, generatedAt }),
    ...buildCurriculumRows(generatedAt),
    ...buildEvaluationRows({ roleIds, generatedAt }),
    ...buildGameRows({ roleIds, generatedAt }),
    ...buildScheduleRows(generatedAt),
    ...buildTrainingRows({ roleIds, generatedAt }),
    ...buildMatchAssessmentRows({ roleIds, generatedAt }),
    ...buildDevelopmentPlanRows({ roleIds, generatedAt }),
    ...buildOperationsRows({ roleIds, generatedAt }),
    ...buildTryoutRows({ roleIds, generatedAt }),
    ...buildScoutingRows({ roleIds, generatedAt }),
    ...buildPlayingTimeRows({ roleIds, generatedAt }),
    ...buildShotEventRows({ generatedAt }),
    ...buildSelectionRows({ roleIds, generatedAt }),
    ...buildYouthRows({ roleIds, generatedAt })
  ];
}

export function summarizeRows(rows = []) {
  const collections = {};

  rows.forEach((row) => {
    collections[row.collection] = (collections[row.collection] || 0) + 1;
  });

  return {
    datasetId: QA_DATASET_ID,
    totalRows: rows.length,
    collections: Object.fromEntries(Object.entries(collections).sort(([a], [b]) => a.localeCompare(b)))
  };
}

export function buildDeleteBatches(rows = []) {
  const grouped = new Map();

  rows.forEach((row) => {
    if (!grouped.has(row.collection)) grouped.set(row.collection, new Set());
    grouped.get(row.collection).add(row.id);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([collection, ids]) => ({
      collection,
      ids: Array.from(ids).sort()
    }));
}

export function mergeRowsByCollectionAndId(...rowGroups) {
  const byKey = new Map();

  rowGroups.flat().forEach((row) => {
    byKey.set(`${row.collection}/${row.id}`, row);
  });

  return Array.from(byKey.values());
}
