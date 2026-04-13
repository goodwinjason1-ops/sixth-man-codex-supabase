/**
 * Central role definitions for the Emerald Lakers Basketball Club system.
 * Every file that needs role information should import from here.
 */

export const ROLES = {
  ADMIN: 'admin',
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice_president',
  COACH_COORDINATOR: 'coach_coordinator',
  GIRLS_COORDINATOR: 'girls_coordinator',
  BOYS_COORDINATOR: 'boys_coordinator',
  YOUTH_HEAD_COACH: 'youth_head_coach',
  COACH: 'coach',
  YOUTH_COACH: 'youth_coach',
  TRYOUT_ASSESSOR: 'tryout_assessor',
  TEAM_MANAGER: 'team_manager',
  PLAYER: 'player',
  PARENT: 'parent',
  PENDING: 'pending',
};

// Leadership roles that get full admin access
export const ADMIN_ROLES = ['admin', 'president', 'vice_president', 'coach_coordinator'];

// Staff roles that can access coach-level features
export const STAFF_ROLES = ['admin', 'president', 'vice_president', 'coach_coordinator', 'coach'];

// Roles that can perform tryout assessments
export const TRYOUT_ASSESSOR_ROLES = ['admin', 'president', 'vice_president', 'coach_coordinator', 'coach', 'team_manager', 'tryout_assessor'];

// Roles that can view aggregated tryout results
export const TRYOUT_RESULTS_ROLES = ['admin', 'president', 'vice_president', 'coach_coordinator', 'girls_coordinator', 'boys_coordinator'];

// Roles that can assign assessors to tryout sessions
export const ASSESSOR_ASSIGNER_ROLES = ['admin', 'president', 'vice_president', 'coach_coordinator', 'girls_coordinator', 'boys_coordinator'];

// Coordinator roles
export const COORDINATOR_ROLES = ['girls_coordinator', 'boys_coordinator'];

// All valid roles in the system
export const ALL_ROLES = [
  'admin', 'president', 'vice_president', 'coach_coordinator',
  'girls_coordinator', 'boys_coordinator',
  'youth_head_coach', 'coach', 'youth_coach',
  'tryout_assessor', 'team_manager',
  'player', 'parent', 'pending',
];

// Display labels for each role
export const ROLE_LABELS = {
  admin: 'Administrator',
  president: 'President',
  vice_president: 'Vice President',
  coach_coordinator: 'Coach Coordinator',
  girls_coordinator: 'Girls Coordinator',
  boys_coordinator: 'Boys Coordinator',
  youth_head_coach: 'Youth Head Coach',
  coach: 'Coach',
  youth_coach: 'Youth Coach',
  tryout_assessor: 'Tryout Assessor',
  team_manager: 'Team Manager',
  player: 'Player',
  parent: 'Parent',
  pending: 'Pending Approval',
};

// Permission descriptions for each role (shown in user creation)
export const ROLE_DESCRIPTIONS = {
  admin: 'Full system access. Can manage all data, users, and settings.',
  president: 'Full admin access. Club leadership with oversight of all operations.',
  vice_president: 'Full admin access. Assists president with club operations.',
  coach_coordinator: 'Full admin access. Oversees all coaching staff, manages coaching assignments and training standards.',
  girls_coordinator: 'Manages girls tryout sessions and evaluations. Can view tryout results and assign assessors.',
  boys_coordinator: 'Manages boys tryout sessions and evaluations. Can view tryout results and assign assessors.',
  youth_head_coach: 'Can view tryout results and manage youth programs. Oversight of youth coaching staff.',
  coach: 'Team coaching, player assessments, training plans, and match day evaluations.',
  youth_coach: 'Manages youth program sessions. Access to youth programs and notifications.',
  tryout_assessor: 'Restricted access to assigned tryout sessions only. Cannot access other parts of the system.',
  team_manager: 'Team management and can assess tryouts when assigned.',
  player: 'View own profile, team info, training programs, and skills passport.',
  parent: 'View child progress, team schedules, and club notifications.',
  pending: 'Account awaiting admin approval. No access until approved.',
};

// Badge styles for WelcomePage role display
export const ROLE_BADGE_STYLES = {
  admin: 'bg-purple-100 text-purple-700 border border-purple-300',
  president: 'bg-purple-100 text-purple-700 border border-purple-300',
  vice_president: 'bg-purple-100 text-purple-700 border border-purple-300',
  coach_coordinator: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
  girls_coordinator: 'bg-pink-100 text-pink-700 border border-pink-300',
  boys_coordinator: 'bg-sky-100 text-sky-700 border border-sky-300',
  youth_head_coach: 'bg-amber-100 text-amber-700 border border-amber-300',
  coach: 'bg-[#005028]/15 text-[#005028] border border-[#00A651]/40',
  youth_coach: 'bg-lime-100 text-lime-700 border border-lime-300',
  tryout_assessor: 'bg-indigo-100 text-indigo-700 border border-indigo-300',
  team_manager: 'bg-blue-100 text-blue-700 border border-blue-300',
  player: 'bg-blue-100 text-blue-700 border border-blue-300',
  parent: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  pending: 'bg-orange-100 text-orange-700 border border-orange-300',
};
