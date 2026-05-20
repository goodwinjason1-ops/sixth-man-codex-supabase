import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export function useFilteredData() {
  const { currentUser, userProfile } = useAuth();
  const { players, teams, playboards = [], loading, errors, ...rest } = useData();

  const userTeamIds = useMemo(() => {
    if (!userProfile) return [];
    // Support both field names — assignedTeams is the primary one used in the app
    const fromProfile = userProfile.assignedTeams || userProfile.teamIds || [];
    // Also check teams where user is the coach (coachId matches)
    if (currentUser && ['coach', 'youth_coach'].includes(userProfile.role)) {
      const coachTeamIds = (teams || [])
        .filter(t => t.coachId === currentUser.uid)
        .map(t => t.id);
      // Merge both sources, deduplicate
      return [...new Set([...fromProfile, ...coachTeamIds])];
    }
    // Also check teams where user is the manager (managerId matches)
    if (currentUser && userProfile.role === 'team_manager') {
      const managerTeamIds = (teams || [])
        .filter(t => t.managerId === currentUser.uid)
        .map(t => t.id);
      return [...new Set([...fromProfile, ...managerTeamIds])];
    }
    return fromProfile;
  }, [userProfile, currentUser, teams]);

  const userChildrenIds = useMemo(() => {
    if (!userProfile) return [];
    return userProfile.linkedPlayerIds || userProfile.children || [];
  }, [userProfile]);

  const filteredTeams = useMemo(() => {
    if (!userProfile || !teams) return [];
    const role = userProfile.role;

    // Leadership + coach coordinator: see all
    if (['admin', 'president', 'vice_president', 'coach_coordinator'].includes(role)) {
      return teams;
    }
    // Gender coordinators: filter by gender
    if (role === 'girls_coordinator') {
      return teams.filter(t => t.gender === 'girls' || t.gender === 'mixed');
    }
    if (role === 'boys_coordinator') {
      return teams.filter(t => t.gender === 'boys' || t.gender === 'mixed');
    }
    // Youth head coach: youth programs only
    if (role === 'youth_head_coach') {
      return teams.filter(t => t.program === 'youth');
    }
    // Coach, youth coach, team manager: their assigned teams
    if (['coach', 'youth_coach', 'team_manager'].includes(role)) {
      return teams.filter(t => userTeamIds.includes(t.id));
    }
    // Parent: teams their children are on
    if (role === 'parent') {
      const childTeamIds = (players || [])
        .filter(p => userChildrenIds.includes(p.id))
        .flatMap(p => p.teamIds || (p.teamId ? [p.teamId] : []));
      return teams.filter(t => childTeamIds.includes(t.id));
    }
    // Player: their own team
    if (role === 'player') {
      const playerDoc = (players || []).find(p => p.userId === currentUser?.uid || p.id === userProfile.playerId);
      if (!playerDoc) return [];
      const pTeamIds = playerDoc.teamIds || (playerDoc.teamId ? [playerDoc.teamId] : []);
      return teams.filter(t => pTeamIds.includes(t.id));
    }
    // Pending, assessor: no teams
    return [];
  }, [userProfile, currentUser, teams, players, userTeamIds, userChildrenIds]);

  const filteredPlayers = useMemo(() => {
    if (!userProfile || !players) return [];
    const role = userProfile.role;

    // Leadership + coach coordinator: see all
    if (['admin', 'president', 'vice_president', 'coach_coordinator'].includes(role)) {
      return players;
    }
    // Gender coordinators
    if (role === 'girls_coordinator') {
      return players.filter(p => p.gender === 'girls');
    }
    if (role === 'boys_coordinator') {
      return players.filter(p => p.gender === 'boys');
    }
    // Youth head coach: youth players only
    if (role === 'youth_head_coach') {
      return players.filter(p => ['little-lakers', 'lakers-ready'].includes(p.ageGroup));
    }
    // Coach, youth coach, team manager: players on their teams
    if (['coach', 'youth_coach', 'team_manager'].includes(role)) {
      return players.filter(p => {
        const pTeams = p.teamIds || (p.teamId ? [p.teamId] : []);
        return pTeams.some(tid => userTeamIds.includes(tid));
      });
    }
    // Parent: only their children
    if (role === 'parent') {
      return players.filter(p => userChildrenIds.includes(p.id));
    }
    // Player: only themselves
    if (role === 'player') {
      return players.filter(p => p.userId === currentUser?.uid || p.id === userProfile.playerId);
    }
    // Pending, assessor: no players
    return [];
  }, [userProfile, currentUser, players, userTeamIds, userChildrenIds]);

  const filteredPlayboards = useMemo(() => {
    if (!userProfile || !playboards) return [];
    const role = userProfile.role;

    if (['admin', 'president', 'vice_president', 'coach_coordinator'].includes(role)) {
      return playboards;
    }

    if (role === 'coach') {
      return playboards.filter(board =>
        board.coachId === currentUser?.uid ||
        (board.teamId && userTeamIds.includes(board.teamId)) ||
        board.visibility === 'club'
      );
    }

    return [];
  }, [userProfile, currentUser, playboards, userTeamIds]);

  return {
    ...rest,
    players: filteredPlayers,
    teams: filteredTeams,
    playboards: filteredPlayboards,
    allPlayers: players,
    allTeams: teams,
    allPlayboards: playboards,
    loading,
    errors,
    userTeamIds,
    userChildrenIds,
    currentUser,
    userProfile,
  };
}
