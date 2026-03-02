/**
 * Drill Library constants — aligned with practice assessment system
 * Categories match SKILL_CATEGORIES from skillBenchmarks.js
 * Difficulty levels match the 1-4 assessment scale (LEVEL_LABELS)
 */

// Categories aligned with SKILL_CATEGORIES from src/data/skillBenchmarks.js
// IDs use hyphens to match assessment system
export const DRILL_CATEGORIES = {
  'ball-handling':      { label: 'Ball Handling',       color: 'blue',   icon: 'Dribbble' },
  'passing-receiving':  { label: 'Passing & Receiving', color: 'purple', icon: 'ArrowRightLeft' },
  'shooting':           { label: 'Shooting',            color: 'orange', icon: 'Target' },
  'footwork':           { label: 'Footwork',            color: 'teal',   icon: 'Footprints' },
  'defense':            { label: 'Defense',             color: 'red',    icon: 'ShieldAlert' },
  'off-ball-movement':  { label: 'Off-Ball Movement',   color: 'green',  icon: 'Move' },
  'team-play':          { label: 'Team Play',           color: 'indigo', icon: 'Users' },
  'basketball-iq':      { label: 'Basketball IQ',       color: 'amber',  icon: 'Brain' },
};

export const CATEGORY_COLORS = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',     iconBg: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', iconBg: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', iconBg: 'bg-orange-500' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700',     iconBg: 'bg-teal-500' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',       iconBg: 'bg-red-500' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700',   iconBg: 'bg-green-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', iconBg: 'bg-indigo-500' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',   iconBg: 'bg-amber-500' },
};

// Difficulty levels aligned with practice assessment 1-4 scale
// Colors match levelColors used in SkillCard, CoachAssessmentPage, BenchmarkAdminPage
export const DIFFICULTY_LEVELS = {
  1: { label: 'Emerging',          short: 'Level 1', bg: 'bg-[#D4E4D4]', text: 'text-[#005028]',  badge: 'bg-[#D4E4D4] text-[#005028] border-[#6B7C6B]' },
  2: { label: 'Developing',        short: 'Level 2', bg: 'bg-[#005028]', text: 'text-white',      badge: 'bg-[#005028] text-white border-[#005028]' },
  3: { label: 'Competent',         short: 'Level 3', bg: 'bg-[#00A651]', text: 'text-white',      badge: 'bg-[#00A651] text-white border-[#00A651]' },
  4: { label: 'Confident Leader',  short: 'Level 4', bg: 'bg-[#86efac]', text: 'text-[#005028]',  badge: 'bg-[#86efac] text-[#005028] border-[#86efac]' },
};

export const LEVEL_LABELS = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Confident Leader'
};

export const AGE_GROUPS = ['u8', 'u10', 'u12', 'u14', 'u16', 'u18'];

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

// Roles that can create/edit drills (admin only — coaches have read-only access)
export const DRILL_EDIT_ROLES = [
  'admin', 'president', 'vice_president', 'coach_coordinator',
  'girls_coordinator', 'boys_coordinator', 'youth_head_coach'
];
