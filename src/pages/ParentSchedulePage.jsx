import React, { useMemo, useState } from 'react';
import { useFilteredData } from '../hooks/useFilteredData';
import PageShell from '../components/PageShell';
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

const ParentSchedulePage = () => {
  const { teams, allTeams, players, allPlayers, schedule, games, userChildrenIds, loading } = useFilteredData();
  const [showPast, setShowPast] = useState(false);

  // Compute child team IDs directly from player docs — more robust than relying on filtered teams
  const childTeamIds = useMemo(() => {
    const childIds = userChildrenIds || [];
    if (childIds.length === 0) return [];
    // Use allPlayers (unfiltered) to find child player docs
    const allPlayersList = allPlayers || players || [];
    const ids = new Set();
    allPlayersList.forEach(p => {
      if (childIds.includes(p.id)) {
        if (p.teamId) ids.add(p.teamId);
        (p.teamIds || []).forEach(tid => ids.add(tid));
      }
    });
    return [...ids];
  }, [userChildrenIds, allPlayers, players]);

  // Build team name lookup from all teams
  const teamNameMap = useMemo(() => {
    const map = {};
    (allTeams || teams || []).forEach(t => {
      map[t.id] = (t.name || '').toLowerCase();
    });
    return map;
  }, [allTeams, teams]);

  // Split schedule + games into upcoming and past events
  const { upcoming, past } = useMemo(() => {
    const hasSchedule = schedule?.length > 0;
    const hasGames = games?.length > 0;
    if ((!hasSchedule && !hasGames) || childTeamIds.length === 0) return { upcoming: [], past: [] };

    const now = new Date();
    const teamIdSet = new Set(childTeamIds);
    const childTeamNames = new Set(childTeamIds.map(id => teamNameMap[id]).filter(Boolean));

    const matchesTeam = (event) => {
      if (event.teamId && teamIdSet.has(event.teamId)) return true;
      if (event.teamName && childTeamNames.has(event.teamName.toLowerCase())) return true;
      // Also check if event's teamIds array overlaps
      if (event.teamIds) {
        for (const tid of event.teamIds) {
          if (teamIdSet.has(tid)) return true;
        }
      }
      return false;
    };

    // Merge schedule events and games, avoiding duplicates
    // Deduplicate by id AND by teamId+date+opponent fingerprint
    const allEvents = [];
    const seenIds = new Set();
    const seenFingerprints = new Set();

    const fingerprint = (ev) => {
      const d = ev.date?.toDate ? ev.date.toDate() : new Date(ev.date);
      const dateStr = !isNaN(d?.getTime()) ? d.toISOString().slice(0, 10) : '';
      return `${ev.teamId || ''}|${dateStr}|${(ev.opponent || '').toLowerCase()}`;
    };

    (schedule || []).forEach(event => {
      if (matchesTeam(event)) {
        allEvents.push(event);
        if (event.id) seenIds.add(event.id);
        const fp = fingerprint(event);
        if (fp) seenFingerprints.add(fp);
      }
    });

    (games || []).forEach(game => {
      if (seenIds.has(game.id)) return;
      const fp = fingerprint(game);
      if (fp && seenFingerprints.has(fp)) return;
      if (matchesTeam(game)) {
        allEvents.push({ ...game, type: game.type || 'game' });
        if (fp) seenFingerprints.add(fp);
      }
    });

    const upcomingEvents = [];
    const pastEvents = [];

    allEvents.forEach(event => {
      const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
      if (isNaN(eventDate?.getTime())) return;
      if (eventDate >= now) {
        upcomingEvents.push({ ...event, _parsedDate: eventDate });
      } else {
        pastEvents.push({ ...event, _parsedDate: eventDate });
      }
    });

    upcomingEvents.sort((a, b) => a._parsedDate - b._parsedDate);
    pastEvents.sort((a, b) => b._parsedDate - a._parsedDate);

    return { upcoming: upcomingEvents, past: pastEvents };
  }, [schedule, games, childTeamIds, teamNameMap]);

  // Group events by date string
  const groupByDate = (events) => {
    const groups = {};
    events.forEach(event => {
      const dateKey = event._parsedDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return Object.entries(groups);
  };

  // Loading state
  if (loading) {
    return (
      <PageShell title="Schedule" backTo="/dashboard">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#00A651] animate-spin mb-4" />
          <p className="text-gray-500">Loading schedule...</p>
        </div>
      </PageShell>
    );
  }

  const allTeamsList = allTeams || teams || [];
  const upcomingGroups = groupByDate(upcoming);
  const pastGroups = groupByDate(past);

  const renderEvent = (event) => {
    const isGame = event.type === 'game' || !!event.opponent;
    const teamDoc = allTeamsList.find(t => t.id === event.teamId);
    const teamLabel = teamDoc?.name || event.teamName || '';

    return (
      <div key={event.id || Math.random()} className="bg-[#F5F9F5] rounded-lg p-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isGame ? 'bg-[#FFD700]/20' : 'bg-blue-100'
          }`}>
            {isGame ? (
              <Trophy className="w-4.5 h-4.5 text-[#FFD700]" />
            ) : (
              <Dumbbell className="w-4.5 h-4.5 text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isGame
                  ? 'bg-[#FFD700]/20 text-[#B8860B]'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {isGame ? 'Game' : 'Training'}
              </span>
              {teamLabel && (
                <span className="text-xs text-[#6B7C6B] truncate">{teamLabel}</span>
              )}
            </div>
            <p className="text-gray-800 font-medium text-sm">
              {event.opponent ? `vs ${event.opponent}` : event.title || (isGame ? 'Game Day' : 'Training Session')}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7C6B] mt-1">
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
              {isGame && event.homeAway && (
                <span className="text-xs text-[#6B7C6B]">
                  ({event.homeAway === 'home' ? 'Home' : 'Away'})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageShell title="Schedule" backTo="/dashboard" breadcrumbs={[{ label: 'Home', url: '/welcome' }, { label: 'Dashboard', url: '/dashboard' }, { label: 'Schedule' }]}>
      <div className="space-y-4">
        {/* Upcoming Events */}
        {upcoming.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-[#00A651]" />
              <h2 className="text-gray-800 font-semibold">Upcoming Events</h2>
              <span className="text-xs text-[#6B7C6B] bg-[#D4E4D4]/50 px-2 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            </div>
            {upcomingGroups.map(([dateLabel, events]) => (
              <div key={dateLabel} className="bg-white border border-[#D4E4D4] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[#005028] mb-3">{dateLabel}</h3>
                <div className="space-y-2">
                  {events.map(renderEvent)}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-1">No Upcoming Events</h3>
            <p className="text-[#6B7C6B] text-sm">
              No upcoming events scheduled for your child&apos;s team.
            </p>
          </div>
        )}

        {/* Past Events (collapsed) */}
        {past.length > 0 && (
          <div>
            <button
              onClick={() => setShowPast(!showPast)}
              className="flex items-center gap-2 w-full text-left px-1 py-2 text-[#6B7C6B] hover:text-gray-800 transition-colors"
            >
              {showPast ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                Past Events ({past.length})
              </span>
            </button>

            {showPast && (
              <div className="space-y-3 mt-2">
                {pastGroups.map(([dateLabel, events]) => (
                  <div key={dateLabel} className="bg-white border border-[#D4E4D4] rounded-xl p-4 opacity-75">
                    <h3 className="text-sm font-semibold text-[#6B7C6B] mb-3">{dateLabel}</h3>
                    <div className="space-y-2">
                      {events.map(renderEvent)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default ParentSchedulePage;
