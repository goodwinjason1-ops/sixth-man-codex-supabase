import { test, expect } from '@playwright/test';
import {
  buildConflictDeclaration,
  buildSelectionCommitteeBoard,
  calculateSelectionCombinedScore,
  toParentSafeCommitteeSummary,
  validateSelectionDecision
} from '../src/services/selectionCommitteeService.js';

const committeeMembers = [
  { id: 'member-1', name: 'Coach Green', role: 'coach' },
  { id: 'member-2', displayName: 'Committee Rep', role: 'committee', canVote: true }
];

const players = [
  {
    id: 'player-1',
    name: 'Ava Green',
    number: 12,
    ageGroup: 'U12',
    parentEmail: 'parent@example.com',
    privateNotes: 'Parent asked about team one only.',
    internalRanking: 9
  },
  {
    id: 'player-2',
    firstName: 'Mia',
    lastName: 'Lakes',
    jerseyNumber: 22,
    age_group: 'U12'
  },
  {
    id: 'player-3',
    displayName: 'Zoe North',
    ageGroup: 'U14'
  }
];

const tryoutResults = [
  { id: 'tryout-1', playerId: 'player-1', overallImpression: 4, evalStatus: 'submitted' },
  { id: 'tryout-2', playerId: 'player-1', overallImpression: 5, evalStatus: 'finalized' },
  {
    id: 'tryout-3',
    playerId: 'player-2',
    evalStatus: 'submitted',
    ratings: {
      ballSkills: 3,
      gameUnderstanding: 3,
      athleticism: 2,
      coachability: 4,
      effort: 3
    }
  }
];

const scoutingReports = [
  {
    id: 'scout-1',
    playerId: 'player-1',
    status: 'submitted',
    ratings: {
      skillsTechnique: 4,
      gameAwareness: 4,
      athleticism: 5,
      attitudeCoachability: 4,
      teamworkCommunication: 5
    }
  },
  {
    id: 'scout-2',
    playerId: 'player-2',
    status: 'submitted',
    overallAvg: 2.5
  },
  {
    id: 'scout-draft',
    playerId: 'player-2',
    status: 'draft',
    overallAvg: 5
  }
];

test.describe('selection committee service', () => {
  test('builds a committee board from players, assessments, assignments, members and decisions', () => {
    const conflict = buildConflictDeclaration({
      member: committeeMembers[1],
      player: players[0],
      conflictType: 'family',
      notes: 'Committee Rep is related to this player.',
      declaredAt: '2026-04-27T02:00:00.000Z'
    });

    const board = buildSelectionCommitteeBoard({
      players,
      tryoutResults,
      scoutingReports,
      currentAssignments: {
        'player-1': 'team-green',
        'player-2': { teamId: 'team-gold', assignedBy: 'coach-green' }
      },
      committeeMembers,
      existingDecisions: [
        {
          id: 'decision-1',
          playerId: 'player-1',
          status: 'approved',
          decision: 'team_assignment',
          targetTeamId: 'team-green',
          recommendedTeamId: 'team-green',
          override: true,
          overrideRationale: 'Approved despite declared conflict because the member abstained.',
          privateNotes: 'Vote was discussed after the family declaration.',
          votes: [
            { memberId: 'member-1', vote: 'yes', note: 'Clear team fit' },
            { memberId: 'member-2', vote: 'abstain', note: 'Conflict declared' }
          ],
          conflictDeclarations: [conflict],
          updatedAt: '2026-04-27T03:00:00.000Z'
        },
        {
          id: 'decision-2',
          playerId: 'player-2',
          status: 'in_review',
          decision: 'development',
          privateNotes: 'Borderline for gold team.',
          updatedAt: '2026-04-27T02:30:00.000Z'
        }
      ],
      scoreWeights: { tryout: 0.7, scouting: 0.3 },
      generatedAt: '2026-04-27T04:00:00.000Z'
    });

    expect(board.meta).toMatchObject({
      boardType: 'selection_committee',
      generatedAt: '2026-04-27T04:00:00.000Z'
    });
    expect(board.committeeMembers).toEqual([
      { id: 'member-1', name: 'Coach Green', role: 'coach', canVote: true },
      { id: 'member-2', name: 'Committee Rep', role: 'committee', canVote: true }
    ]);
    expect(board.statusCounts).toEqual(expect.objectContaining({
      approved: 1,
      in_review: 1,
      undecided: 1
    }));
    expect(board.conflicts).toEqual([expect.objectContaining({
      memberId: 'member-2',
      playerId: 'player-1',
      conflictType: 'family',
      notes: 'Committee Rep is related to this player.'
    })]);

    const ava = board.players[0];
    expect(ava).toMatchObject({
      playerId: 'player-1',
      playerName: 'Ava Green',
      ageGroup: 'U12',
      jerseyNumber: 12,
      currentAssignment: 'team-green',
      rank: 1,
      score: {
        tryout: 4.5,
        scouting: 4.4,
        combined: 4.5,
        weights: { tryout: 0.7, scouting: 0.3 }
      },
      decision: {
        id: 'decision-1',
        status: 'approved',
        decision: 'team_assignment',
        targetTeamId: 'team-green',
        valid: true,
        requiresOverrideRationale: true
      },
      voteSummary: {
        yes: 1,
        no: 0,
        abstain: 1,
        total: 2
      }
    });
    expect(ava.conflicts).toHaveLength(1);
    expect(board.players.map((player) => player.playerId)).toEqual(['player-1', 'player-2', 'player-3']);
  });

  test('validates decisions, override rationales and conflict declarations', () => {
    expect(calculateSelectionCombinedScore({
      tryoutScore: 4.2,
      scoutingScore: 3.4,
      weights: { tryout: 75, scouting: 25 }
    })).toEqual({
      tryout: 4.2,
      scouting: 3.4,
      combined: 4,
      weights: { tryout: 0.75, scouting: 0.25 }
    });

    const invalid = validateSelectionDecision({
      playerId: 'player-1',
      status: 'approved',
      decision: 'team_assignment',
      targetTeamId: 'team-gold',
      recommendedTeamId: 'team-green',
      override: true
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toEqual(expect.arrayContaining([
      'Override rationale is required when a decision overrides the recommendation.'
    ]));

    expect(validateSelectionDecision({
      playerId: 'player-1',
      status: 'moved',
      decision: 'team_assignment',
      targetTeamId: 'team-green'
    })).toEqual(expect.objectContaining({
      valid: false,
      errors: expect.arrayContaining(['Status "moved" is not supported.'])
    }));

    expect(validateSelectionDecision({
      playerId: 'player-1',
      status: 'approved',
      decision: 'team-nine',
      targetTeamId: 'team-green'
    })).toEqual(expect.objectContaining({
      valid: false,
      errors: expect.arrayContaining(['Decision "team-nine" is not supported.'])
    }));

    const conflict = buildConflictDeclaration({
      member: { id: 'member-3', name: 'Coach Blue' },
      player: { id: 'player-2', name: 'Mia Lakes' },
      conflictType: 'coach_relationship',
      notes: 'Coach Blue privately trains this player.',
      declaredAt: '2026-04-27T05:00:00.000Z'
    });

    expect(conflict).toEqual({
      id: 'member-3:player-2:coach_relationship',
      memberId: 'member-3',
      memberName: 'Coach Blue',
      playerId: 'player-2',
      playerName: 'Mia Lakes',
      conflictType: 'coach_relationship',
      notes: 'Coach Blue privately trains this player.',
      status: 'active',
      declaredAt: '2026-04-27T05:00:00.000Z'
    });
  });

  test('creates parent-safe summaries without votes, private notes, conflict notes or rankings', () => {
    const board = buildSelectionCommitteeBoard({
      players,
      tryoutResults,
      scoutingReports,
      committeeMembers,
      existingDecisions: [
        {
          id: 'decision-1',
          playerId: 'player-1',
          status: 'approved',
          decision: 'team_assignment',
          targetTeamId: 'team-green',
          privateNotes: 'Private committee deliberation.',
          internalRanking: 1,
          votes: [{ memberId: 'member-1', vote: 'yes', note: 'Internal vote note' }],
          conflictDeclarations: [
            buildConflictDeclaration({
              member: committeeMembers[1],
              player: players[0],
              conflictType: 'family',
              notes: 'This note must stay internal.',
              declaredAt: '2026-04-27T02:00:00.000Z'
            })
          ]
        }
      ],
      generatedAt: '2026-04-27T04:00:00.000Z'
    });

    const summary = toParentSafeCommitteeSummary(board);
    const ava = summary.players.find((player) => player.playerId === 'player-1');
    const serialized = JSON.stringify(summary);

    expect(summary.meta).toMatchObject({
      boardType: 'selection_committee',
      privacyLevel: 'parent_safe'
    });
    expect(ava).toEqual(expect.objectContaining({
      playerId: 'player-1',
      playerName: 'Ava Green',
      ageGroup: 'U12',
      decisionStatus: 'approved',
      decision: 'team_assignment',
      targetTeamId: 'team-green',
      hasConflictDeclared: true
    }));

    expect(ava).not.toHaveProperty('votes');
    expect(ava).not.toHaveProperty('voteSummary');
    expect(ava).not.toHaveProperty('privateNotes');
    expect(ava).not.toHaveProperty('conflicts');
    expect(ava).not.toHaveProperty('rank');
    expect(ava).not.toHaveProperty('internalRanking');
    expect(serialized).not.toContain('Private committee deliberation');
    expect(serialized).not.toContain('Internal vote note');
    expect(serialized).not.toContain('This note must stay internal');
    expect(serialized).not.toContain('parent@example.com');
  });
});
