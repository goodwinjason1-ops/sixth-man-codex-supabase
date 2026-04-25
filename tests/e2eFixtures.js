export const roleUsers = {
  admin: { uid: 'admin-user', email: 'admin@test.com', displayName: 'Admin User', role: 'admin' },
  president: { uid: 'president-user', email: 'president@test.com', displayName: 'President User', role: 'president' },
  vice_president: { uid: 'vice_president-user', email: 'vice@test.com', displayName: 'Vice President', role: 'vice_president' },
  coach_coordinator: { uid: 'coach_coordinator-user', email: 'coordinator@test.com', displayName: 'Coach Coordinator', role: 'coach_coordinator' },
  girls_coordinator: { uid: 'girls_coordinator-user', email: 'girls@test.com', displayName: 'Girls Coordinator', role: 'girls_coordinator' },
  boys_coordinator: { uid: 'boys_coordinator-user', email: 'boys@test.com', displayName: 'Boys Coordinator', role: 'boys_coordinator' },
  youth_head_coach: { uid: 'youth_head_coach-user', email: 'youthhead@test.com', displayName: 'Youth Head Coach', role: 'youth_head_coach' },
  coach: { uid: 'coach-user', email: 'coach@test.com', displayName: 'Coach User', role: 'coach', assignedTeams: ['team-1'] },
  youth_coach: { uid: 'youth_coach-user', email: 'youth@test.com', displayName: 'Youth Coach', role: 'youth_coach' },
  player: { uid: 'player-user', email: 'player@test.com', displayName: 'Player User', role: 'player', playerId: 'player-1' },
  parent: { uid: 'parent-user', email: 'parent@test.com', displayName: 'Parent User', role: 'parent', linkedPlayerIds: ['player-1'] },
  team_manager: { uid: 'team_manager-user', email: 'manager@test.com', displayName: 'Team Manager', role: 'team_manager', assignedTeams: ['team-1'] },
  tryout_assessor: { uid: 'tryout_assessor-user', email: 'assessor@test.com', displayName: 'Tryout Assessor', role: 'tryout_assessor' },
  pending: { uid: 'pending-user', email: 'pending@test.com', displayName: 'Pending User', role: 'pending' }
};

const now = '2026-04-25T00:00:00.000Z';

const docRow = (collection, id, data) => ({
  collection,
  id,
  data,
  created_at: now,
  updated_at: now,
  created_by: 'e2e',
  updated_by: 'e2e'
});

export const seedDocuments = () => {
  const users = Object.values(roleUsers).map((user) => docRow('users', user.uid, {
    ...user,
    createdAt: now,
    photoURL: null
  }));

  return [
    ...users,
    docRow('teams', 'team-1', {
      name: 'U12 Boys Green',
      ageGroup: 'U12',
      gender: 'boys',
      season: '2026 Winter',
      coachId: 'coach-user',
      coachName: 'Coach User',
      managerId: 'team_manager-user',
      managerName: 'Team Manager',
      playerIds: ['player-1', 'player-2']
    }),
    docRow('teams', 'team-2', {
      name: 'U14 Girls Gold',
      ageGroup: 'U14',
      gender: 'girls',
      season: '2026 Winter',
      coachId: 'coach-user',
      playerIds: ['player-3']
    }),
    docRow('players', 'player-1', {
      name: 'Ethan Green',
      firstName: 'Ethan',
      lastName: 'Green',
      email: 'player@test.com',
      parentEmail: 'parent@test.com',
      playerNumber: 12,
      ageGroup: 'U12',
      team: 'U12 Boys Green',
      teamId: 'team-1',
      teamIds: ['team-1'],
      linkedParentIds: ['parent-user'],
      dateOfBirth: '2016-02-25T00:00:00.000Z',
      position: 'Guard'
    }),
    docRow('players', 'player-2', {
      name: 'Mia Lakes',
      firstName: 'Mia',
      lastName: 'Lakes',
      parentEmail: 'parent2@test.com',
      playerNumber: 7,
      ageGroup: 'U12',
      team: 'U12 Boys Green',
      teamId: 'team-1',
      teamIds: ['team-1']
    }),
    docRow('players', 'player-3', {
      name: 'Ava Gold',
      firstName: 'Ava',
      lastName: 'Gold',
      parentEmail: 'parent3@test.com',
      playerNumber: 4,
      ageGroup: 'U14',
      team: 'U14 Girls Gold',
      teamId: 'team-2',
      teamIds: ['team-2']
    }),
    docRow('curriculum', 'skill-1', {
      title: 'Ball Handling',
      name: 'Ball Handling',
      category: 'Offense',
      drills: ['drill-1']
    }),
    docRow('drills', 'drill-1', {
      title: 'Cone Handles',
      name: 'Cone Handles',
      category: 'Ball Handling',
      difficulty: 'Beginner',
      usageCount: 1,
      createdAt: now
    }),
    docRow('evaluations', 'eval-1', {
      playerId: 'player-1',
      skillId: 'skill-1',
      level: 3,
      notes: 'Solid progress',
      date: now
    }),
    docRow('games', 'game-1', {
      teamId: 'team-1',
      teamName: 'U12 Boys Green',
      opponent: 'Hawks',
      venue: 'Emerald Stadium',
      date: '2026-04-25T10:00:00.000Z',
      coachId: 'coach-user',
      status: 'scheduled'
    }),
    docRow('schedule', 'schedule-1', {
      title: 'Training',
      teamId: 'team-1',
      date: '2026-04-26T17:00:00.000Z',
      type: 'training'
    }),
    docRow('attendance', 'attendance-1', {
      playerId: 'player-1',
      team: 'U12 Boys Green',
      teamId: 'team-1',
      sessionId: 'schedule-1',
      present: ['player-1', 'player-2'],
      absent: [],
      date: now
    }),
    docRow('training_notes', 'note-1', {
      playerId: 'player-1',
      coachId: 'coach-user',
      date: now,
      note: 'Keep working on left hand.'
    }),
    docRow('training_plans', 'plan-1', {
      name: 'U12 Development Plan',
      title: 'U12 Development Plan',
      teamId: 'team-1',
      updatedAt: now,
      sessions: [{ title: 'Session 1', drills: [{ id: 'drill-1', name: 'Cone Handles' }] }]
    }),
    docRow('training_records', 'session-1', {
      teamId: 'team-1',
      coachId: 'coach-user',
      planId: 'plan-1',
      date: now,
      notes: 'Completed'
    }),
    docRow('match_assessments', 'match-1', {
      gameId: 'game-1',
      playerId: 'player-1',
      teamId: 'team-1',
      coachId: 'coach-user',
      date: now,
      metrics: { effort: 4 }
    }),
    docRow('development_plans', 'idp-1', {
      playerId: 'player-1',
      coachId: 'coach-user',
      title: 'Ethan IDP',
      goals: [{ title: 'Improve ball handling', status: 'active' }],
      reviews: []
    }),
    docRow('notifications', 'notif-1', {
      title: 'Welcome',
      message: 'Test notification',
      targetRoles: ['admin', 'coach', 'parent'],
      readBy: [],
      deletedBy: [],
      date: now,
      sentAt: now
    }),
    docRow('parent_invitations', 'invite-1', {
      invitationCode: 'TEST-CODE',
      playerIds: ['player-1'],
      parentEmail: 'parent@test.com',
      parentName: 'Parent User',
      status: 'pending',
      createdAt: now,
      expiresAt: '2026-12-31T00:00:00.000Z'
    }),
    docRow('scoring_assignments', 'assign-1', {
      gameId: 'game-1',
      teamId: 'team-1',
      assignedToId: 'parent-user',
      assignedToEmail: 'parent@test.com',
      status: 'pending',
      gameDate: now,
      createdAt: now
    }),
    docRow('swap_requests', 'swap-1', {
      assignmentId: 'assign-1',
      swapToId: 'parent-user',
      status: 'pending',
      createdAt: now
    }),
    docRow('mvp_votes', 'mvp-1', {
      gameId: 'game-1',
      votes: { 3: 'player-1', 2: 'player-2' }
    }),
    docRow('playing_time', 'playing-1', {
      gameId: 'game-1',
      teamId: 'team-1',
      coachId: 'coach-user',
      date: now,
      playerStats: { 'player-1': { seconds: 1200 } }
    }),
    docRow('coach_accreditations', 'coach-accreditation-1', {
      coachId: 'coach-user',
      level: 'Community',
      expiresAt: '2026-12-31T00:00:00.000Z'
    }),
    docRow('assessment_metrics', 'U12', {
      metrics: [{ id: 'effort', name: 'Effort', order: 1 }]
    }),
    docRow('tryout_sessions', 'session-1', {
      name: 'U12 Tryout',
      ageGroup: 'U12',
      date: '2026-04-30T10:00:00.000Z',
      status: 'active',
      sessionType: 'hour-1',
      assessors: ['tryout_assessor-user'],
      players: ['player-1', 'player-2'],
      createdAt: now,
      updatedAt: now
    }),
    docRow('tryout_evaluations', 'tryout-eval-1', {
      sessionId: 'session-1',
      playerId: 'player-1',
      assessorId: 'tryout_assessor-user',
      status: 'submitted',
      metrics: { effort: 4 },
      createdAt: now,
      updatedAt: now
    }),
    docRow('scout_evaluations', 'scout-eval-1', {
      gameId: 'game-1',
      playerId: 'player-1',
      scoutId: 'coach-user',
      status: 'submitted',
      createdAt: now
    }),
    docRow('youth_programs', 'program-1', {
      name: 'Little Lakers',
      type: 'little_lakers',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }),
    docRow('youth_enrollments', 'enrollment-1', {
      programId: 'program-1',
      childName: 'Ethan Green',
      parentEmail: 'parent@test.com',
      status: 'active',
      enrolledAt: now
    }),
    docRow('youth_sessions', 'youth-session-1', {
      programId: 'program-1',
      weekNumber: 1,
      sessionDate: now,
      title: 'Week 1'
    }),
    docRow('youth_attendance', 'youth-attendance-1', {
      programId: 'program-1',
      sessionId: 'youth-session-1',
      enrollmentId: 'enrollment-1',
      present: true,
      recordedAt: now
    }),
    docRow('youth_milestones', 'milestone-1', {
      enrollmentId: 'enrollment-1',
      milestoneId: 'dribbling',
      status: 'achieved',
      updatedAt: now
    }),
    docRow('youth_parent_messages', 'message-1', {
      programId: 'program-1',
      parentEmail: 'parent@test.com',
      message: 'Great session',
      sentAt: now
    }),
    docRow('session_summaries', 'summary-1', {
      programId: 'program-1',
      sessionId: 'youth-session-1',
      summary: 'Good energy',
      createdAt: now
    }),
    docRow('selection_teams', 'U12', {
      teams: [{ id: 'selection-team-1', name: 'U12 Green', playerIds: ['player-1'] }],
      updatedAt: now
    }),
    docRow('beta_feedback', 'feedback-1', {
      userId: 'admin-user',
      category: 'bug',
      page: 'Dashboard',
      description: 'E2E feedback',
      status: 'new',
      createdAt: now
    }),
    docRow('audit_logs', 'audit-1', {
      action: 'test.seeded',
      actorUid: 'admin-user',
      createdAt: now
    })
  ];
};

const supabaseUser = (profile) => ({
  id: profile.uid,
  email: profile.email,
  user_metadata: {
    display_name: profile.displayName
  },
  app_metadata: {
    provider: 'email'
  }
});

export async function installE2EMock(page, role = null) {
  const documents = seedDocuments();
  const user = role ? supabaseUser(roleUsers[role]) : null;
  await page.addInitScript(({ documents: seededDocuments, user: seededUser }) => {
    if (!window.localStorage.getItem('sixthMan.e2eDocuments')) {
      window.localStorage.setItem('sixthMan.e2eDocuments', JSON.stringify(seededDocuments));
    }
    if (seededUser) {
      window.localStorage.setItem('sixthMan.e2eUser', JSON.stringify(seededUser));
    }
  }, { documents, user });
}
