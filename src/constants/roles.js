/**
 * Central role definitions for the Emerald Lakers Basketball Club system.
 * Every file that needs role information should import from here.
 */

export const ROLES = {
  ADMIN: 'admin',
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice_president',
  GIRLS_COORDINATOR: 'girls_coordinator',
  BOYS_COORDINATOR: 'boys_coordinator',
  YOUTH_HEAD_COACH: 'youth_head_coach',
  COACH: 'coach',
  YOUTH_COACH: 'youth_coach',
  TRYOUT_ASSESSOR: 'tryout_assessor',
  TEAM_MANAGER: 'team_manager',
  PLAYER: 'player',
  PARENT: 'parent',
};

// Leadership roles that get full admin access
export const ADMIN_ROLES = ['admin', 'president', 'vice_president'];

// Staff roles that can access coach-level features
export const STAFF_ROLES = ['admin', 'president', 'vice_president', 'coach'];

// Roles that can perform tryout assessments
export const TRYOUT_ASSESSOR_ROLES = ['admin', 'president', 'vice_president', 'coach', 'team_manager', 'tryout_assessor'];

// Roles that can view aggregated tryout results
export const TRYOUT_RESULTS_ROLES = ['admin', 'president', 'vice_president', 'girls_coordinator', 'boys_coordinator', 'youth_head_coach'];

// Roles that can assign assessors to tryout sessions
export const ASSESSOR_ASSIGNER_ROLES = ['admin', 'president', 'vice_president', 'girls_coordinator', 'boys_coordinator'];

// Coordinator roles
export const COORDINATOR_ROLES = ['girls_coordinator', 'boys_coordinator'];

// All valid roles in the system
export const ALL_ROLES = [
  'admin', 'president', 'vice_president',
  'girls_coordinator', 'boys_coordinator',
  'youth_head_coach', 'coach', 'youth_coach',
  'tryout_assessor', 'team_manager',
  'player', 'parent',
];

// Display labels for each role
export const ROLE_LABELS = {
  admin: 'Administrator',
  president: 'President',
  vice_president: 'Vice President',
  girls_coordinator: 'Girls Coordinator',
  boys_coordinator: 'Boys Coordinator',
  youth_head_coach: 'Youth Head Coach',
  coach: 'Coach',
  youth_coach: 'Youth Coach',
  tryout_assessor: 'Tryout Assessor',
  team_manager: 'Team Manager',
  player: 'Player',
  parent: 'Parent',
};

// Permission descriptions for each role (shown in user creation)
export const ROLE_DESCRIPTIONS = {
  admin: 'Full system access. Can manage all data, users, and settings.',
  president: 'Full admin access. Club leadership with oversight of all operations.',
  vice_president: 'Full admin access. Assists president with club operations.',
  girls_coordinator: 'Manages girls tryout sessions and evaluations. Can view tryout results and assign assessors.',
  boys_coordinator: 'Manages boys tryout sessions and evaluations. Can view tryout results and assign assessors.',
  youth_head_coach: 'Can view tryout results and manage youth programs. Oversight of youth coaching staff.',
  coach: 'Team coaching, player assessments, training plans, and match day evaluations.',
  youth_coach: 'Manages youth program sessions. Access to youth programs and notifications.',
  tryout_assessor: 'Restricted access to assigned tryout sessions only. Cannot access other parts of the system.',
  team_manager: 'Team management and can assess tryouts when assigned.',
  player: 'View own profile, team info, training programs, and skills passport.',
  parent: 'View child progress, team schedules, and club notifications.',
};

// Badge styles for WelcomePage role display
export const ROLE_BADGE_STYLES = {
  admin: 'bg-purple-500/20 text-purple-300 border border-purple-500',
  president: 'bg-purple-500/20 text-purple-300 border border-purple-500',
  vice_president: 'bg-purple-500/20 text-purple-300 border border-purple-500',
  girls_coordinator: 'bg-pink-500/20 text-pink-300 border border-pink-500',
  boys_coordinator: 'bg-sky-500/20 text-sky-300 border border-sky-500',
  youth_head_coach: 'bg-amber-500/20 text-amber-300 border border-amber-500',
  coach: 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]',
  youth_coach: 'bg-lime-500/20 text-lime-300 border border-lime-500',
  tryout_assessor: 'bg-violet-500/20 text-violet-300 border border-violet-500',
  team_manager: 'bg-blue-500/20 text-blue-300 border border-blue-500',
  player: 'bg-blue-500/20 text-blue-300 border border-blue-500',
  parent: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500',
};
