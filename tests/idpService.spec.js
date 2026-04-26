import { test, expect } from '@playwright/test';
import {
  buildDevelopmentPlanPayload,
  buildReviewedDevelopmentPlan,
  selectVisiblePlanForPlayer,
  toParentSafeDevelopmentPlan
} from '../src/services/idpService.js';

const baselineSkills = {
  ball_handling: 2,
  passing: 2,
  shooting: 1,
  footwork: 2,
  defense: 3,
  off_ball: 2,
  team_play: 3,
  basketball_iq: 2
};

const baseGoal = {
  id: 'goal-1',
  skillCategory: 'shooting',
  currentLevel: 1,
  targetLevel: 3,
  specificTarget: 'Make 6 of 10 form shots from the elbows.',
  drillsRecommended: [{ id: 'drill-1', name: 'Form Shooting' }],
  homePractice: 'Ten minutes of form shooting twice a week.',
  status: 'not_started',
  coachNotes: 'Needs confidence before selection discussions.'
};

test.describe('IDP service', () => {
  test('creates a parent-visible plan with linked parent ids from the player', () => {
    const payload = buildDevelopmentPlanPayload({
      player: {
        id: 'player-1',
        name: 'Ethan Green',
        teamId: 'team-1',
        linkedParentIds: ['parent-1', 'parent-2']
      },
      team: { id: 'team-1', name: 'U12 Boys Green' },
      coach: { uid: 'coach-1' },
      season: '2026-Winter',
      baselineSkills,
      goals: [baseGoal],
      parentVisible: true,
      now: new Date('2026-04-26T10:00:00.000Z')
    });

    expect(payload.parentVisible).toBe(true);
    expect(payload.parentIds).toEqual(['parent-1', 'parent-2']);
    expect(payload.teamId).toBe('team-1');
    expect(payload.baselineAssessment.overallLevel).toBe(2.13);
  });

  test('appends a review, updates goal statuses, and stores latest assessed skill levels', () => {
    const plan = buildDevelopmentPlanPayload({
      player: { id: 'player-1', name: 'Ethan Green', teamId: 'team-1' },
      coach: { uid: 'coach-1' },
      season: '2026-Winter',
      baselineSkills,
      goals: [baseGoal],
      parentVisible: false,
      now: new Date('2026-04-26T10:00:00.000Z')
    });

    const reviewed = buildReviewedDevelopmentPlan(plan, {
      type: 'mid_season',
      assessedSkills: { shooting: 2, ball_handling: 3 },
      coachComments: 'Shot prep is improving. Keep the cue short.',
      goalsProgress: [
        { goalId: 'goal-1', status: 'in_progress', note: 'Form is cleaner under light pressure.' }
      ]
    }, {
      reviewer: { uid: 'coach-1', displayName: 'Coach User' },
      now: new Date('2026-05-15T09:30:00.000Z')
    });

    expect(reviewed.reviews).toHaveLength(1);
    expect(reviewed.goals[0]).toEqual(expect.objectContaining({
      status: 'in_progress',
      lastReviewNote: 'Form is cleaner under light pressure.'
    }));
    expect(reviewed.currentSkillLevels).toEqual(expect.objectContaining({
      shooting: 2,
      ball_handling: 3,
      defense: 3
    }));
    expect(reviewed.lastReviewAt).toBe('2026-05-15T09:30:00.000Z');
  });

  test('parent visibility filters plans and strips private coach notes', () => {
    const sharedPlan = buildDevelopmentPlanPayload({
      player: {
        id: 'player-1',
        name: 'Ethan Green',
        teamId: 'team-1',
        linkedParentIds: ['parent-1']
      },
      coach: { uid: 'coach-1' },
      season: '2026-Winter',
      baselineSkills,
      goals: [baseGoal],
      parentVisible: true,
      now: new Date('2026-04-26T10:00:00.000Z')
    });

    const privatePlan = buildDevelopmentPlanPayload({
      player: {
        id: 'player-2',
        name: 'Mia Lakes',
        teamId: 'team-1',
        linkedParentIds: ['parent-1']
      },
      coach: { uid: 'coach-1' },
      season: '2026-Winter',
      baselineSkills,
      goals: [baseGoal],
      parentVisible: false,
      now: new Date('2026-04-26T10:00:00.000Z')
    });

    const selected = selectVisiblePlanForPlayer({
      plans: [privatePlan, sharedPlan],
      playerId: 'player-1',
      userProfile: { role: 'parent', uid: 'parent-1', linkedPlayerIds: ['player-1'] },
      currentUser: { uid: 'parent-1' }
    });

    expect(selected?.playerId).toBe('player-1');

    const parentSafe = toParentSafeDevelopmentPlan({
      ...selected,
      reviews: [{ coachComments: 'Internal selection concern', goalsProgress: [] }]
    });

    expect(parentSafe.goals[0].coachNotes).toBeUndefined();
    expect(parentSafe.reviews[0].coachComments).toBeUndefined();
    expect(selectVisiblePlanForPlayer({
      plans: [privatePlan, sharedPlan],
      playerId: 'player-2',
      userProfile: { role: 'parent', uid: 'parent-1', linkedPlayerIds: ['player-1'] },
      currentUser: { uid: 'parent-1' }
    })).toBeNull();
  });
});
