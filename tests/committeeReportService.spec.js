import { test, expect } from '@playwright/test';
import { buildCommitteeReportPack } from '../src/services/committeeReportService.js';

const samplePlayers = [
  {
    id: 'player-1',
    name: 'Ethan Green',
    email: 'ethan@example.com',
    parentEmail: 'parent@example.com',
    dateOfBirth: '2016-02-25T00:00:00.000Z',
    medicalNotes: 'Asthma inhaler in bag',
    internalNotes: 'Private selection context',
    team: 'U12 Boys Green',
    teamIds: ['team-1'],
    ageGroup: 'U12'
  },
  {
    id: 'player-2',
    name: 'Mia Lakes',
    parentEmail: 'parent2@example.com',
    team: 'U12 Boys Green',
    teamIds: ['team-1'],
    ageGroup: 'U12'
  },
  {
    id: 'player-3',
    name: 'Ava Gold',
    parentEmail: 'parent3@example.com',
    team: 'U14 Girls Gold',
    teamIds: ['team-2'],
    ageGroup: 'U14'
  }
];

const sampleTeams = [
  { id: 'team-1', name: 'U12 Boys Green', ageGroup: 'U12', coachId: 'coach-1', coachName: 'Coach One' },
  { id: 'team-2', name: 'U14 Girls Gold', ageGroup: 'U14', coachId: 'coach-2', coachName: 'Coach Two' }
];

const sampleEvaluations = [
  { id: 'eval-1', playerId: 'player-1', coachId: 'coach-1', coachName: 'Coach One', skillId: 'defense', level: 3, date: '2026-04-01T10:00:00.000Z' },
  { id: 'eval-2', playerId: 'player-1', coachId: 'coach-1', coachName: 'Coach One', skillId: 'shooting', level: 4, date: '2026-04-05T10:00:00.000Z' },
  { id: 'eval-3', playerId: 'player-2', coachId: 'coach-2', coachName: 'Coach Two', skillId: 'passing', level: 2, date: '2026-04-07T10:00:00.000Z' },
  { id: 'eval-old', playerId: 'player-3', coachId: 'coach-2', coachName: 'Coach Two', skillId: 'passing', level: 4, date: '2026-02-07T10:00:00.000Z' }
];

const sampleDevelopmentPlans = [
  {
    id: 'plan-1',
    playerId: 'player-1',
    status: 'active',
    goals: [
      { id: 'goal-1', title: 'Improve handle', status: 'active', coachNotes: 'Private coaching note' },
      { id: 'goal-2', title: 'Defensive stance', status: 'completed' }
    ],
    reviews: [{ id: 'review-1', reviewedAt: '2026-04-10T10:00:00.000Z' }],
    parentVisible: true
  },
  {
    id: 'plan-2',
    playerId: 'player-2',
    status: 'draft',
    goals: [{ id: 'goal-3', title: 'Passing under pressure', status: 'active' }],
    nextReviewDate: '2026-04-15T10:00:00.000Z',
    parentVisible: false
  }
];

const samplePlayingTimeRecords = [
  {
    id: 'game-1',
    teamId: 'team-1',
    teamName: 'U12 Boys Green',
    coachId: 'coach-1',
    coachName: 'Coach One',
    date: '2026-04-12T10:00:00.000Z',
    fairnessScore: 'Good',
    playerStats: {
      'player-1': { name: 'Ethan Green', totalSeconds: 1200 },
      'player-2': { name: 'Mia Lakes', totalSeconds: 300 }
    }
  },
  {
    id: 'game-2',
    teamId: 'team-2',
    teamName: 'U14 Girls Gold',
    coachId: 'coach-2',
    coachName: 'Coach Two',
    date: '2026-04-18T10:00:00.000Z',
    fairnessScore: 'Needs Improvement',
    playerStats: {
      'player-3': { name: 'Ava Gold', seconds: 900 }
    }
  }
];

test.describe('committee report service', () => {
  test('builds a committee-ready pack from existing app data sections', () => {
    const pack = buildCommitteeReportPack({
      players: samplePlayers,
      teams: sampleTeams,
      evaluations: sampleEvaluations,
      developmentPlans: sampleDevelopmentPlans,
      playingTimeRecords: samplePlayingTimeRecords,
      generatedAt: '2026-04-26T00:00:00.000Z',
      dateRange: {
        start: '2026-04-01T00:00:00.000Z',
        end: '2026-04-30T23:59:59.999Z'
      }
    });

    expect(pack.meta).toMatchObject({
      reportType: 'committee_pack',
      generatedAt: '2026-04-26T00:00:00.000Z',
      privacyLevel: 'committee'
    });

    expect(pack.clubOverview).toMatchObject({
      totalPlayers: 3,
      totalTeams: 2,
      totalAssessments: 3,
      activeDevelopmentPlans: 1
    });
    expect(pack.clubOverview.ageGroups).toEqual([
      { ageGroup: 'U12', players: 2, teams: 1 },
      { ageGroup: 'U14', players: 1, teams: 1 }
    ]);

    expect(pack.playerDevelopment).toMatchObject({
      totalPlans: 2,
      activePlans: 1,
      draftPlans: 1,
      playersWithPlans: 2,
      goals: { total: 3, active: 2, completed: 1 },
      reviewsDue: 1
    });
    expect(pack.playerDevelopment.players[0]).toEqual(expect.objectContaining({
      playerId: 'player-1',
      name: 'Ethan Green',
      team: 'U12 Boys Green',
      assessmentCount: 2,
      averageLevel: 3.5,
      planStatus: 'active',
      activeGoals: 1
    }));

    expect(pack.coachActivity.coaches).toEqual([
      expect.objectContaining({ coachId: 'coach-1', coachName: 'Coach One', assessmentCount: 2, playerCount: 1, teamCount: 1 }),
      expect.objectContaining({ coachId: 'coach-2', coachName: 'Coach Two', assessmentCount: 1, playerCount: 1, teamCount: 1 })
    ]);

    expect(pack.fairPlay).toMatchObject({
      status: 'foundation',
      totalGames: 2,
      fairGames: 1,
      fairnessRate: 50,
      equityAlertCount: 1
    });
    expect(pack.fairPlay.teamSummaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ teamId: 'team-1', teamName: 'U12 Boys Green', gameCount: 1, averageMinutes: 12.5 }),
      expect.objectContaining({ teamId: 'team-2', teamName: 'U14 Girls Gold', gameCount: 1, averageMinutes: 15 })
    ]));
  });

  test('uses privacy-aware field selection for committee report rows', () => {
    const pack = buildCommitteeReportPack({
      players: samplePlayers,
      teams: sampleTeams,
      evaluations: sampleEvaluations,
      developmentPlans: sampleDevelopmentPlans,
      playingTimeRecords: samplePlayingTimeRecords,
      generatedAt: '2026-04-26T00:00:00.000Z'
    });

    const firstPlayer = pack.playerDevelopment.players.find((player) => player.playerId === 'player-1');
    expect(firstPlayer).toBeTruthy();

    expect(firstPlayer).not.toHaveProperty('email');
    expect(firstPlayer).not.toHaveProperty('parentEmail');
    expect(firstPlayer).not.toHaveProperty('dateOfBirth');
    expect(firstPlayer).not.toHaveProperty('medicalNotes');
    expect(firstPlayer).not.toHaveProperty('internalNotes');
    expect(firstPlayer.goals).toEqual([
      { id: 'goal-1', title: 'Improve handle', status: 'active' },
      { id: 'goal-2', title: 'Defensive stance', status: 'completed' }
    ]);
    expect(firstPlayer.goals[0]).not.toHaveProperty('coachNotes');
    expect(pack.privacy.excludedFields).toEqual(expect.arrayContaining([
      'email',
      'parentEmail',
      'dateOfBirth',
      'medicalNotes',
      'internalNotes',
      'coachNotes'
    ]));
  });
});
