/**
 * Drill Library constants — categories, colors, and labels
 */

export const DRILL_CATEGORIES = {
  ball_handling: { label: 'Ball Handling', color: 'blue', icon: 'Dribbble' },
  passing: { label: 'Passing', color: 'purple', icon: 'ArrowRightLeft' },
  shooting: { label: 'Shooting', color: 'orange', icon: 'Target' },
  footwork: { label: 'Footwork', color: 'teal', icon: 'Footprints' },
  defense: { label: 'Defense', color: 'red', icon: 'ShieldAlert' },
  off_ball: { label: 'Off-Ball Movement', color: 'green', icon: 'Move' },
  team_play: { label: 'Team Play', color: 'indigo', icon: 'Users' },
  basketball_iq: { label: 'Basketball IQ', color: 'amber', icon: 'Brain' },
};

export const CATEGORY_COLORS = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', iconBg: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', iconBg: 'bg-orange-500' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700', iconBg: 'bg-teal-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', iconBg: 'bg-red-500' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', iconBg: 'bg-green-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', iconBg: 'bg-indigo-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', iconBg: 'bg-amber-500' },
};

export const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-700 border-green-300',
  intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  advanced: 'bg-red-100 text-red-700 border-red-300',
};

export const AGE_GROUPS = ['u8', 'u10', 'u12', 'u14', 'u16', 'u19'];

export const EQUIPMENT_OPTIONS = [
  'basketballs', 'cones', 'markers', 'chairs', 'resistance bands',
  'agility ladder', 'whistle', 'stopwatch', 'pinnies', 'hoops',
  'jump ropes', 'medicine balls', 'poly spots'
];

export const TAG_OPTIONS = [
  'warm-up', 'individual', 'pairs', 'small-group', 'team',
  'competitive', 'fun', 'conditioning', 'skill-building', 'game-like',
  'cool-down', 'pre-game'
];

// Roles that can access drill library (view)
export const DRILL_VIEW_ROLES = [
  'admin', 'president', 'vice_president', 'coach_coordinator',
  'girls_coordinator', 'boys_coordinator', 'youth_head_coach',
  'coach', 'youth_coach', 'team_manager'
];

// Roles that can create/edit drills
export const DRILL_EDIT_ROLES = [
  'admin', 'president', 'vice_president', 'coach_coordinator',
  'girls_coordinator', 'boys_coordinator', 'youth_head_coach',
  'coach', 'youth_coach'
];
