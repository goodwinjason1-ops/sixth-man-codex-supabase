/**
 * Game Day Detection Hook
 * Detects if the coach has any games scheduled for today
 * and provides game data for auto-population
 */

import { useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { toJsDate, formatTimeStringAU } from '../utils/dateUtils';

/**
 * Check if a date is today
 * @param {any} dateValue - Date value (Firestore Timestamp, string, or Date)
 * @returns {boolean}
 */
const isToday = (dateValue) => {
  const gameDate = toJsDate(dateValue);
  if (!gameDate) return false;

  const today = new Date();
  return (
    gameDate.getFullYear() === today.getFullYear() &&
    gameDate.getMonth() === today.getMonth() &&
    gameDate.getDate() === today.getDate()
  );
};

/**
 * Parse time string and return minutes from midnight for sorting
 * @param {string} timeStr - Time string (e.g., "2:00 PM", "14:00")
 * @returns {number}
 */
const getTimeMinutes = (timeStr) => {
  if (!timeStr) return 0;

  // Handle already formatted times (e.g., "10:00 AM")
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Hook to detect games scheduled for today
 * @returns {Object} Game day detection result
 */
export const useGameDayDetection = () => {
  const { schedule, loading: dataLoading } = useData();
  const { userProfile, loading: authLoading } = useAuth();

  // Determine if we're still waiting for data
  const isDataReady = !dataLoading && !authLoading && userProfile !== null;
  const hasScheduleData = schedule && schedule.length > 0;

  // Debug logging
  useEffect(() => {
    console.log('[GameDay] Checking readiness...', {
      authLoading,
      dataLoading,
      userProfileReady: !!userProfile,
      userRole: userProfile?.role,
      scheduleCount: schedule?.length || 0,
      isDataReady,
      hasScheduleData
    });
  }, [authLoading, dataLoading, userProfile, schedule, isDataReady, hasScheduleData]);

  const result = useMemo(() => {
    // Still loading - return loading state
    if (!isDataReady) {
      console.log('[GameDay] Still loading... authLoading:', authLoading, 'dataLoading:', dataLoading, 'userProfile:', !!userProfile);
      return {
        isGameDay: false,
        todaysGames: [],
        primaryGame: null,
        hasMultipleGames: false,
        loading: true,
        dataReady: false
      };
    }

    // Data ready but no schedule
    if (!hasScheduleData) {
      console.log('[GameDay] No schedule data available');
      return {
        isGameDay: false,
        todaysGames: [],
        primaryGame: null,
        hasMultipleGames: false,
        loading: false,
        dataReady: true
      };
    }

    // Game Day is a coach feature - admins and non-coaches should not trigger it
    const coachRoles = ['coach', 'youth_coach', 'youth_head_coach', 'coach_coordinator'];
    if (!coachRoles.includes(userProfile?.role)) {
      console.log('[GameDay] User is not a coach (role:', userProfile?.role, ') - Game Day disabled');
      return {
        isGameDay: false,
        todaysGames: [],
        primaryGame: null,
        hasMultipleGames: false,
        loading: false,
        dataReady: true
      };
    }

    // Get coach's teams
    const coachTeams = userProfile?.assignedTeams || userProfile?.teamIds || [];

    console.log('[GameDay] Filtering games for teams:', coachTeams || 'ALL (admin)');

    // Filter for today's scheduled games
    const todaysGames = schedule.filter(game => {
      // Must be a game (not training)
      if (game.type && game.type !== 'game') return false;

      // Must be today
      if (!isToday(game.date)) return false;

      // Must be scheduled (not completed)
      if (game.status && game.status !== 'scheduled') return false;

      // Filter by coach's teams
      if (coachTeams.length > 0) {
        const gameTeamId = game.teamId;
        if (!gameTeamId || !coachTeams.includes(gameTeamId)) return false;
      }

      return true;
    });

    // Sort by time (earliest first)
    const sortedGames = [...todaysGames].sort((a, b) => {
      return getTimeMinutes(a.time) - getTimeMinutes(b.time);
    });

    // Primary game is the earliest one
    const primaryGame = sortedGames[0] || null;

    // Log result
    if (sortedGames.length > 0) {
      console.log('[GameDay] 🏀 GAME DAY ACTIVATED!', {
        gamesFound: sortedGames.length,
        primaryGame: primaryGame ? `${primaryGame.teamName} vs ${primaryGame.opponent}` : null
      });
    } else {
      console.log('[GameDay] No games scheduled for today');
    }

    return {
      isGameDay: sortedGames.length > 0,
      todaysGames: sortedGames,
      primaryGame,
      hasMultipleGames: sortedGames.length > 1,
      loading: false,
      dataReady: true
    };
  }, [schedule, isDataReady, hasScheduleData, userProfile, authLoading, dataLoading]);

  return result;
};

/**
 * Format game data for display
 * @param {Object} game - Game object
 * @returns {Object} Formatted game data
 */
export const formatGameForDisplay = (game) => {
  if (!game) return null;

  return {
    id: game.id,
    teamId: game.teamId,
    teamName: game.teamName || game.team,
    opponent: game.opponent,
    time: formatTimeStringAU(game.time),
    venue: game.venue,
    homeAway: game.homeAway,
    date: game.date,
    // Display string for banner
    displayString: `${game.teamName || game.team} vs ${game.opponent}`,
    timeString: formatTimeStringAU(game.time)
  };
};

export default useGameDayDetection;
