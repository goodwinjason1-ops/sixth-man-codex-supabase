import { DEFAULT_COURT_PRESET } from '../presets/courtPresets';

export const PLAYBOARD_SCHEMA_VERSION = 1;

export const createPlayboardId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `playboard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const getDefaultBoardName = (teamName = '') => (
  teamName ? `${teamName} Playboard` : 'Untitled Playboard'
);

export const normalizeBoard = (board = {}) => ({
  id: board.id || '',
  schemaVersion: board.schemaVersion || PLAYBOARD_SCHEMA_VERSION,
  name: board.name || getDefaultBoardName(board.teamName),
  description: board.description || '',
  teamId: board.teamId || '',
  teamName: board.teamName || '',
  coachId: board.coachId || '',
  coachName: board.coachName || '',
  visibility: board.visibility || 'team',
  status: board.status || 'draft',
  court: board.court || DEFAULT_COURT_PRESET,
  players: Array.isArray(board.players) ? board.players : [],
  objects: Array.isArray(board.objects) ? board.objects : [],
  actions: Array.isArray(board.actions) ? board.actions : [],
  frames: Array.isArray(board.frames) ? board.frames : [],
  tags: Array.isArray(board.tags) ? board.tags : [],
  sourceType: board.sourceType || '',
  sourceRefs: board.sourceRefs || {},
  linkedDrillId: board.linkedDrillId || null,
  linkedTrainingPlanId: board.linkedTrainingPlanId || null,
  linkedGameId: board.linkedGameId || null,
  createdAt: board.createdAt || '',
  createdBy: board.createdBy || board.coachId || '',
  updatedAt: board.updatedAt || '',
  updatedBy: board.updatedBy || '',
});

export const createEmptyBoard = ({
  teamId = '',
  teamName = '',
  coachId = '',
  coachName = '',
  sourceType = '',
  sourceRefs = {},
} = {}) => ({
  schemaVersion: PLAYBOARD_SCHEMA_VERSION,
  name: 'Untitled Playboard',
  description: '',
  teamId,
  teamName,
  coachId,
  coachName,
  visibility: 'team',
  status: 'draft',
  court: DEFAULT_COURT_PRESET,
  players: [],
  objects: [],
  actions: [],
  frames: [],
  tags: [],
  sourceType,
  sourceRefs,
  linkedDrillId: sourceRefs.drillId || null,
  linkedTrainingPlanId: sourceRefs.trainingPlanId || null,
  linkedGameId: sourceRefs.gameId || null,
});
