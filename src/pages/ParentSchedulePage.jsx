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
  const { teams, schedule, loading } = useFilteredData();
  const [showPast, setShowPast] = useState(false);

  // Split schedule into upcoming and past events for the parent's children's teams
  const { upcoming, past } = useMemo(() => {
    if (!schedule?.length || !teams?.length) return { upcoming: [], past: [] };

    const now = new Date();
    const teamIds = teams.map(t => t.id);
    const teamNames = teams.map(t => (t.name || '').toLowerCase());

    const relevant = schedule.filter(event => {
      if (event.teamId && teamIds.includes(event.teamId)) return true;
      if (event.teamName && teamNames.includes(event.teamName.toLowerCase())) return true;
      return false;
    });

    const upcomingEvents = [];
    const pastEvents = [];

    relevant.forEach(event => {
      const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
      if (eventDate >= now) {
        upcomingEvents.push({ ...event, _parsedDate: eventDate });
      } else {
        pastEvents.push({ ...event, _parsedDate: eventDate });
      }
    });

    // Sort upcoming ascending, past descending
    upcomingEvents.sort((a, b) => a._parsedDate - b._parsedDate);
    pastEvents.sort((a, b) => b._parsedDate - a._parsedDate);

    return { upcoming: upcomingEvents, past: pastEvents };
  }, [schedule, teams]);

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

  const upcomingGroups = groupByDate(upcoming);
  const pastGroups = groupByDate(past);

  const renderEvent = (event) => {
    const isGame = event.type === 'game' || !!event.opponent;
    const teamDoc = teams.find(t => t.id === event.teamId);
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
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageShell title="Schedule" backTo="/dashboard">
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
