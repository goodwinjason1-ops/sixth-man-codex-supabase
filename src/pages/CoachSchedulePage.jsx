import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilteredData } from '../hooks/useFilteredData';
import PageShell from '../components/PageShell';
import { toJsDate, formatDateShortAU } from '../utils/dateUtils';
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertCircle,
  FileText,
  ClipboardList,
} from 'lucide-react';

const CoachSchedulePage = () => {
  const navigate = useNavigate();
  const { teams, games, trainingPlans, userTeamIds, loading } = useFilteredData();
  const [showPast, setShowPast] = useState(false);

  // Filter games to only the coach's assigned teams
  const { upcoming, past } = useMemo(() => {
    if (!games?.length || !userTeamIds?.length) return { upcoming: [], past: [] };

    const now = new Date();
    const teamIds = new Set(userTeamIds);

    const relevant = games.filter(event => {
      if (event.teamId && teamIds.has(event.teamId)) return true;
      return false;
    });

    const upcomingEvents = [];
    const pastEvents = [];

    relevant.forEach(event => {
      const eventDate = toJsDate(event.date);
      if (!eventDate) return;
      if (eventDate >= now) {
        upcomingEvents.push({ ...event, _parsedDate: eventDate });
      } else {
        pastEvents.push({ ...event, _parsedDate: eventDate });
      }
    });

    upcomingEvents.sort((a, b) => a._parsedDate - b._parsedDate);
    pastEvents.sort((a, b) => b._parsedDate - a._parsedDate);

    return { upcoming: upcomingEvents, past: pastEvents.slice(0, 20) };
  }, [games, userTeamIds]);

  // Build training plan lookup
  const planMap = useMemo(() => {
    const map = {};
    (trainingPlans || []).forEach(p => { map[p.id] = p; });
    return map;
  }, [trainingPlans]);

  // Group events by date
  const groupByDate = (events) => {
    const groups = {};
    events.forEach(event => {
      const dateKey = event._parsedDate.toLocaleDateString('en-AU', {
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

  if (loading) {
    return (
      <PageShell title="My Schedule" backTo="/welcome">
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
    const isGame = (event.type || 'game') === 'game';
    const isTraining = !isGame;
    const teamDoc = teams.find(t => t.id === event.teamId);
    const teamLabel = teamDoc?.name || event.teamName || '';
    const linkedPlan = event.trainingPlanId ? planMap[event.trainingPlanId] : null;

    const card = (
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isGame ? 'bg-[#FFD700]/20' : 'bg-blue-100'
        }`}>
          {isGame ? (
            <Trophy className="w-4 h-4 text-[#FFD700]" />
          ) : (
            <Dumbbell className="w-4 h-4 text-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isGame
                ? 'bg-[#FFD700]/20 text-[#B8860B]'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isGame ? 'Game' : 'Training'}
            </span>
            {isTraining && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#00A651]/15 text-[#00A651]">
                <ClipboardList className="w-3 h-3 inline mr-0.5" />
                Record
              </span>
            )}
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
          {linkedPlan && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#00A651]">
              <FileText className="w-3 h-3" />
              Plan: {linkedPlan.name}
            </div>
          )}
        </div>
        {isTraining && (
          <ChevronRight className="w-5 h-5 text-[#6B7C6B] flex-shrink-0 mt-2" />
        )}
      </div>
    );

    // Training sessions navigate to record page; games are display-only
    if (isTraining) {
      return (
        <button
          key={event.id}
          onClick={() => navigate(`/coach/training-session/${event.id}`)}
          className="w-full text-left bg-[#F5F9F5] rounded-lg p-3 hover:border-[#00A651] border border-transparent transition-colors"
        >
          {card}
        </button>
      );
    }

    return (
      <div key={event.id} className="bg-[#F5F9F5] rounded-lg p-3">
        {card}
      </div>
    );
  };

  return (
    <PageShell
      title="My Schedule"
      subtitle="Games and training for your teams"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'My Schedule' }
      ]}
    >
      <div className="space-y-4">
        {/* Team filter chips */}
        {teams.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {teams.map(t => (
              <span key={t.id} className="text-xs px-3 py-1 bg-[#005028]/10 text-[#005028] rounded-full font-medium">
                {t.name}
              </span>
            ))}
          </div>
        )}

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
              No upcoming games or training sessions scheduled for your teams.
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

export default CoachSchedulePage;
