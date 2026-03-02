import React, { useMemo, useState } from 'react';
import { useFilteredData } from '../hooks/useFilteredData';
import PageShell from '../components/PageShell';
import {
  Users,
  Shield,
  ChevronDown,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Dumbbell,
  User,
  AlertCircle,
} from 'lucide-react';

const ParentTeamViewPage = () => {
  const {
    players,
    teams,
    allPlayers,
    schedule,
    loading,
    userChildrenIds,
    userProfile,
  } = useFilteredData();

  const [selectedTeamIdx, setSelectedTeamIdx] = useState(0);

  // Loading state
  if (loading) {
    return (
      <PageShell title="Team Info" backTo="/dashboard">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
          <p className="text-gray-500">Loading team information...</p>
        </div>
      </PageShell>
    );
  }

  // No children linked
  if (!players || players.length === 0) {
    return (
      <PageShell title="Team Info" backTo="/dashboard">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-[#6B7C6B] mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">No Team Found</h2>
          <p className="text-[#6B7C6B] text-sm text-center">
            Your account is not linked to any players yet. Please contact your club administrator.
          </p>
        </div>
      </PageShell>
    );
  }

  // teams is already filtered to the parent's children's teams
  const selectedTeam = teams[selectedTeamIdx] || teams[0] || null;

  // Get roster for the selected team (first names only for privacy)
  const teamRoster = useMemo(() => {
    if (!selectedTeam || !allPlayers) return [];
    const playerIds = selectedTeam.playerIds || [];
    // Also include players whose teamId matches the selected team
    return allPlayers
      .filter(p => playerIds.includes(p.id) || p.teamId === selectedTeam.id)
      .map(p => {
        const firstName = (p.name || '').split(' ')[0] || 'Player';
        const isMyChild = userChildrenIds.includes(p.id);
        return {
          id: p.id,
          firstName,
          playerNumber: p.playerNumber,
          position: p.position,
          isMyChild,
        };
      })
      .sort((a, b) => {
        // Show my children first, then alphabetical
        if (a.isMyChild && !b.isMyChild) return -1;
        if (!a.isMyChild && b.isMyChild) return 1;
        return a.firstName.localeCompare(b.firstName);
      });
  }, [selectedTeam, allPlayers, userChildrenIds]);

  // Coach info from the team doc
  const coachName = selectedTeam?.coachName || selectedTeam?.coach || null;

  // Upcoming schedule for this team
  const upcomingEvents = useMemo(() => {
    if (!selectedTeam || !schedule?.length) return [];
    const now = new Date();
    const teamName = (selectedTeam.name || '').toLowerCase();

    return schedule
      .filter(event => {
        const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
        if (eventDate < now) return false;
        if (event.teamId === selectedTeam.id) return true;
        if (event.teamName?.toLowerCase() === teamName) return true;
        return false;
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [selectedTeam, schedule]);

  return (
    <PageShell title="Team Info" backTo="/dashboard" breadcrumbs={[{ label: 'Home', url: '/welcome' }, { label: 'Dashboard', url: '/dashboard' }, { label: 'Team Info' }]}>
      <div className="space-y-4">
        {/* Team selector (if multiple teams) */}
        {teams.length > 1 && (
          <div className="relative">
            <select
              value={selectedTeamIdx}
              onChange={(e) => setSelectedTeamIdx(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border border-[#D4E4D4] rounded-xl text-gray-800 appearance-none focus:border-[#00A651] focus:outline-none"
            >
              {teams.map((team, idx) => (
                <option key={team.id} value={idx}>{team.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00A651] pointer-events-none" />
          </div>
        )}

        {/* Team Details Card */}
        {selectedTeam && (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#005028] to-[#00A651] rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selectedTeam.name}</h2>
                <div className="flex items-center gap-2 text-sm text-[#6B7C6B]">
                  {selectedTeam.ageGroup && <span>{selectedTeam.ageGroup}</span>}
                  {selectedTeam.ageGroup && selectedTeam.gender && <span>&middot;</span>}
                  {selectedTeam.gender && (
                    <span className="capitalize">{selectedTeam.gender}</span>
                  )}
                </div>
              </div>
            </div>

            {coachName && (
              <div className="bg-[#F5F9F5] rounded-lg p-3 flex items-center gap-3">
                <User className="w-5 h-5 text-[#00A651]" />
                <div>
                  <p className="text-xs text-[#6B7C6B]">Coach</p>
                  <p className="text-gray-800 font-medium text-sm">{coachName}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Roster */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-[#00A651]" />
            <h3 className="text-gray-800 font-semibold">
              Team Roster ({teamRoster.length} players)
            </h3>
          </div>

          {teamRoster.length > 0 ? (
            <div className="space-y-2">
              {teamRoster.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                    player.isMyChild
                      ? 'bg-[#00A651]/10 border border-[#00A651]/20'
                      : 'bg-[#F5F9F5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      player.isMyChild
                        ? 'bg-[#00A651] text-white'
                        : 'bg-[#D4E4D4] text-[#005028]'
                    }`}>
                      {player.playerNumber || player.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-gray-800 text-sm font-medium">
                        {player.firstName}
                        {player.isMyChild && (
                          <span className="ml-2 text-xs text-[#00A651] font-normal">(Your child)</span>
                        )}
                      </p>
                      {player.position && (
                        <p className="text-xs text-[#6B7C6B]">{player.position}</p>
                      )}
                    </div>
                  </div>
                  {player.playerNumber && (
                    <span className="text-xs font-medium text-[#6B7C6B]">#{player.playerNumber}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6B7C6B] text-sm text-center py-4">
              No players found on this team roster.
            </p>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-[#00A651]" />
            <h3 className="text-gray-800 font-semibold">Upcoming Schedule</h3>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event, i) => {
                const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                const isGame = event.type === 'game' || event.opponent;
                return (
                  <div key={event.id || i} className="bg-[#F5F9F5] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {isGame ? (
                        <Trophy className="w-4 h-4 text-[#FFD700]" />
                      ) : (
                        <Dumbbell className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="text-gray-800 font-medium text-sm">
                        {event.opponent ? `vs ${event.opponent}` : event.title || (isGame ? 'Game' : 'Training')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7C6B] ml-6">
                      <span>
                        {eventDate.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {event.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                      )}
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#6B7C6B] text-sm text-center py-4">
              No upcoming events scheduled for this team.
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default ParentTeamViewPage;
