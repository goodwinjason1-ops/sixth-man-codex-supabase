import React, { useMemo, useState } from 'react';
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
  ChevronLeft,
  AlertCircle,
  FileText,
  X,
  Users,
  List,
  LayoutGrid,
} from 'lucide-react';
import TrainingPlanPreviewModal from '../components/TrainingPlanPreviewModal';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CoachSchedulePage = () => {
  const { teams, games, trainingPlans, userTeamIds, loading } = useFilteredData();
  const [showPast, setShowPast] = useState(false);
  const [previewEvent, setPreviewEvent] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [calendarView, setCalendarView] = useState('monthly'); // 'monthly' | 'weekly'
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(null); // null = all teams
  const [planPreview, setPlanPreview] = useState(null); // full plan preview modal

  // Filter games to only the coach's assigned teams
  const { upcoming, past, allEvents } = useMemo(() => {
    if (!games?.length || !userTeamIds?.length) return { upcoming: [], past: [], allEvents: [] };

    const now = new Date();
    const teamIds = new Set(userTeamIds);

    const relevant = games.filter(event => {
      if (event.teamId && teamIds.has(event.teamId)) return true;
      return false;
    });

    const upcomingEvents = [];
    const pastEvents = [];
    const all = [];

    relevant.forEach(event => {
      const eventDate = toJsDate(event.date);
      if (!eventDate) return;
      const enriched = { ...event, _parsedDate: eventDate };
      all.push(enriched);
      if (eventDate >= now) {
        upcomingEvents.push(enriched);
      } else {
        pastEvents.push(enriched);
      }
    });

    upcomingEvents.sort((a, b) => a._parsedDate - b._parsedDate);
    pastEvents.sort((a, b) => b._parsedDate - a._parsedDate);

    return { upcoming: upcomingEvents, past: pastEvents.slice(0, 20), allEvents: all };
  }, [games, userTeamIds]);

  // Apply team filter
  const filteredUpcoming = useMemo(() => {
    if (!selectedTeamFilter) return upcoming;
    return upcoming.filter(e => e.teamId === selectedTeamFilter);
  }, [upcoming, selectedTeamFilter]);

  const filteredPast = useMemo(() => {
    if (!selectedTeamFilter) return past;
    return past.filter(e => e.teamId === selectedTeamFilter);
  }, [past, selectedTeamFilter]);

  const filteredAllEvents = useMemo(() => {
    if (!selectedTeamFilter) return allEvents;
    return allEvents.filter(e => e.teamId === selectedTeamFilter);
  }, [allEvents, selectedTeamFilter]);

  // Build training plan lookup
  const planMap = useMemo(() => {
    const map = {};
    (trainingPlans || []).forEach(p => { map[p.id] = p; });
    return map;
  }, [trainingPlans]);

  // Events indexed by date key for calendar
  const eventsByDateKey = useMemo(() => {
    const map = {};
    filteredAllEvents.forEach(event => {
      const d = event._parsedDate;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [filteredAllEvents]);

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

  // Calendar helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();

  const navigateCalendar = (direction) => {
    const d = new Date(calendarDate);
    if (calendarView === 'monthly') {
      d.setMonth(d.getMonth() + direction);
    } else {
      d.setDate(d.getDate() + direction * 7);
    }
    setCalendarDate(d);
    setSelectedCalendarDay(null);
  };

  // Get week days for weekly view
  const weekDays = useMemo(() => {
    const start = new Date(calendarDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // start of week (Sunday)
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [calendarDate]);

  // Events for selected calendar day
  const selectedDayEvents = useMemo(() => {
    if (!selectedCalendarDay) return [];
    const key = `${selectedCalendarDay.getFullYear()}-${selectedCalendarDay.getMonth()}-${selectedCalendarDay.getDate()}`;
    return eventsByDateKey[key] || [];
  }, [selectedCalendarDay, eventsByDateKey]);

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

  const upcomingGroups = groupByDate(filteredUpcoming);
  const pastGroups = groupByDate(filteredPast);

  const renderEventCard = (event, clickable = true) => {
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
        {clickable && (
          <ChevronRight className="w-5 h-5 text-[#6B7C6B] flex-shrink-0 mt-2" />
        )}
      </div>
    );

    if (clickable) {
      return (
        <button
          key={event.id}
          onClick={() => setPreviewEvent(event)}
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

  // Calendar month grid
  const renderMonthlyCalendar = () => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfWeek(calYear, calMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${calYear}-${calMonth}-${day}`;
      const dayEvents = eventsByDateKey[dateKey] || [];
      const hasTraining = dayEvents.some(e => (e.type || 'game') !== 'game');
      const hasGame = dayEvents.some(e => (e.type || 'game') === 'game');
      const cellDate = new Date(calYear, calMonth, day);
      const isToday = cellDate.getTime() === today.getTime();
      const isSelected = selectedCalendarDay &&
        selectedCalendarDay.getFullYear() === calYear &&
        selectedCalendarDay.getMonth() === calMonth &&
        selectedCalendarDay.getDate() === day;

      cells.push(
        <button
          key={day}
          onClick={() => {
            if (dayEvents.length > 0) {
              setSelectedCalendarDay(new Date(calYear, calMonth, day));
            }
          }}
          className={`h-10 rounded-lg flex flex-col items-center justify-center relative transition-colors ${
            isSelected
              ? 'bg-[#005028] text-white'
              : isToday
                ? 'bg-[#00A651]/15 text-[#005028] font-bold'
                : dayEvents.length > 0
                  ? 'bg-[#F5F9F5] hover:bg-[#D4E4D4]/50 text-gray-800 cursor-pointer'
                  : 'text-gray-400'
          }`}
        >
          <span className="text-xs">{day}</span>
          {(hasTraining || hasGame) && (
            <div className="flex gap-0.5 mt-0.5">
              {hasTraining && <div className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />}
              {hasGame && <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />}
            </div>
          )}
        </button>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-[10px] font-medium text-[#6B7C6B]">
            {d}
          </div>
        ))}
        {cells}
      </div>
    );
  };

  // Calendar weekly view
  const renderWeeklyCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="space-y-2">
        {weekDays.map(day => {
          const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const dayEvents = eventsByDateKey[dateKey] || [];
          const isToday = day.getTime() === today.getTime();
          const isSelected = selectedCalendarDay &&
            selectedCalendarDay.getFullYear() === day.getFullYear() &&
            selectedCalendarDay.getMonth() === day.getMonth() &&
            selectedCalendarDay.getDate() === day.getDate();

          return (
            <button
              key={dateKey}
              onClick={() => {
                if (dayEvents.length > 0) setSelectedCalendarDay(new Date(day));
              }}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                isSelected
                  ? 'bg-[#005028] text-white'
                  : isToday
                    ? 'bg-[#00A651]/10 border border-[#00A651]'
                    : 'bg-[#F5F9F5] border border-transparent'
              } ${dayEvents.length > 0 ? 'hover:border-[#00A651] cursor-pointer' : ''}`}
            >
              <div className="text-center w-10">
                <div className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'text-[#6B7C6B]'}`}>
                  {DAY_LABELS[day.getDay()]}
                </div>
                <div className={`text-lg font-bold ${isSelected ? 'text-white' : isToday ? 'text-[#005028]' : 'text-gray-800'}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="flex-1 flex gap-1.5 flex-wrap">
                {dayEvents.length === 0 ? (
                  <span className={`text-xs ${isSelected ? 'text-white/50' : 'text-gray-300'}`}>No events</span>
                ) : (
                  dayEvents.map(e => {
                    const isGame = (e.type || 'game') === 'game';
                    return (
                      <span
                        key={e.id}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isGame
                              ? 'bg-[#FFD700]/20 text-[#B8860B]'
                              : 'bg-[#00A651]/15 text-[#00A651]'
                        }`}
                      >
                        {isGame ? 'Game' : 'Training'}
                        {e.time ? ` ${e.time}` : ''}
                      </span>
                    );
                  })
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const calendarTitle = calendarView === 'monthly'
    ? `${MONTH_NAMES[calMonth]} ${calYear}`
    : `Week of ${weekDays[0].toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;

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
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white border border-[#D4E4D4] rounded-xl p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              viewMode === 'list' ? 'bg-[#005028] text-white' : 'text-gray-600 hover:bg-[#F5F9F5]'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              viewMode === 'calendar' ? 'bg-[#005028] text-white' : 'text-gray-600 hover:bg-[#F5F9F5]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Calendar
          </button>
        </div>

        {/* Team filter chips */}
        {teams.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTeamFilter(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                !selectedTeamFilter
                  ? 'bg-[#005028] text-white'
                  : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
              }`}
            >
              All Teams
            </button>
            {teams.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTeamFilter(selectedTeamFilter === t.id ? null : t.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  selectedTeamFilter === t.id
                    ? 'bg-[#005028] text-white'
                    : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {viewMode === 'list' ? (
          <>
            {/* Upcoming Events */}
            {filteredUpcoming.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-[#00A651]" />
                  <h2 className="text-gray-800 font-semibold">Upcoming Events</h2>
                  <span className="text-xs text-[#6B7C6B] bg-[#D4E4D4]/50 px-2 py-0.5 rounded-full">
                    {filteredUpcoming.length}
                  </span>
                </div>
                {upcomingGroups.map(([dateLabel, events]) => (
                  <div key={dateLabel} className="bg-white border border-[#D4E4D4] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-[#005028] mb-3">{dateLabel}</h3>
                    <div className="space-y-2">
                      {events.map(e => renderEventCard(e))}
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
            {filteredPast.length > 0 && (
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
                    Past Events ({filteredPast.length})
                  </span>
                </button>

                {showPast && (
                  <div className="space-y-3 mt-2">
                    {pastGroups.map(([dateLabel, events]) => (
                      <div key={dateLabel} className="bg-white border border-[#D4E4D4] rounded-xl p-4 opacity-75">
                        <h3 className="text-sm font-semibold text-[#6B7C6B] mb-3">{dateLabel}</h3>
                        <div className="space-y-2">
                          {events.map(e => renderEventCard(e))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Calendar View */
          <div className="space-y-4">
            {/* Calendar sub-view tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCalendarView('monthly'); setSelectedCalendarDay(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  calendarView === 'monthly' ? 'bg-[#00A651] text-white' : 'bg-[#F5F9F5] text-gray-600 border border-[#D4E4D4]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => { setCalendarView('weekly'); setSelectedCalendarDay(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  calendarView === 'weekly' ? 'bg-[#00A651] text-white' : 'bg-[#F5F9F5] text-gray-600 border border-[#D4E4D4]'
                }`}
              >
                Weekly
              </button>
            </div>

            {/* Calendar navigation */}
            <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateCalendar(-1)}
                  className="p-2 hover:bg-[#F5F9F5] rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#005028]" />
                </button>
                <h3 className="text-sm font-bold text-[#005028]">{calendarTitle}</h3>
                <button
                  onClick={() => navigateCalendar(1)}
                  className="p-2 hover:bg-[#F5F9F5] rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[#005028]" />
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-3 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00A651]" />
                  <span className="text-[10px] text-[#6B7C6B]">Training</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
                  <span className="text-[10px] text-[#6B7C6B]">Game</span>
                </div>
              </div>

              {calendarView === 'monthly' ? renderMonthlyCalendar() : renderWeeklyCalendar()}
            </div>

            {/* Selected day events */}
            {selectedCalendarDay && (
              <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[#005028] mb-3">
                  {selectedCalendarDay.toLocaleDateString('en-AU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-[#6B7C6B]">No events on this day.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map(e => renderEventCard(e))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Preview Modal */}
      {previewEvent && (() => {
        const isGame = (previewEvent.type || 'game') === 'game';
        const teamDoc = teams.find(t => t.id === previewEvent.teamId);
        const teamLabel = teamDoc?.name || previewEvent.teamName || 'Unknown Team';
        const linkedPlan = previewEvent.trainingPlanId ? planMap[previewEvent.trainingPlanId] : null;
        const eventDate = previewEvent._parsedDate;

        return (
          <div className="fixed inset-0 z-50" onClick={() => setPreviewEvent(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="fixed bottom-0 left-0 right-0 max-h-[70vh] bg-white rounded-t-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="p-5 pt-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isGame ? 'bg-[#FFD700]/20' : 'bg-[#00A651]/15'
                    }`}>
                      {isGame ? <Trophy className="w-5 h-5 text-[#FFD700]" /> : <Dumbbell className="w-5 h-5 text-[#00A651]" />}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isGame ? 'bg-[#FFD700]/20 text-[#B8860B]' : 'bg-[#00A651]/15 text-[#00A651]'
                    }`}>
                      {isGame ? 'Game' : 'Training Session'}
                    </span>
                  </div>
                  <button onClick={() => setPreviewEvent(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-800">
                    <Calendar className="w-4 h-4 text-[#6B7C6B] flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {eventDate ? eventDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown date'}
                    </span>
                  </div>
                  {previewEvent.time && (
                    <div className="flex items-center gap-3 text-gray-800">
                      <Clock className="w-4 h-4 text-[#6B7C6B] flex-shrink-0" />
                      <span className="text-sm">{previewEvent.time}</span>
                    </div>
                  )}
                  {previewEvent.venue && (
                    <div className="flex items-center gap-3 text-gray-800">
                      <MapPin className="w-4 h-4 text-[#6B7C6B] flex-shrink-0" />
                      <span className="text-sm">{previewEvent.venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-gray-800">
                    <Users className="w-4 h-4 text-[#6B7C6B] flex-shrink-0" />
                    <span className="text-sm">{teamLabel}</span>
                  </div>
                  {isGame && previewEvent.opponent && (
                    <div className="flex items-center gap-3 text-gray-800">
                      <Trophy className="w-4 h-4 text-[#6B7C6B] flex-shrink-0" />
                      <span className="text-sm font-medium">vs {previewEvent.opponent}</span>
                    </div>
                  )}
                  {linkedPlan && (
                    <button
                      onClick={() => { setPreviewEvent(null); setPlanPreview(linkedPlan); }}
                      className="flex items-center gap-3 hover:bg-[#00A651]/5 rounded-lg px-1 -mx-1 py-1 transition-colors w-full text-left"
                    >
                      <FileText className="w-4 h-4 text-[#00A651] flex-shrink-0" />
                      <span className="text-sm text-[#00A651] font-medium underline">Plan: {linkedPlan.name}</span>
                      <ChevronRight className="w-4 h-4 text-[#00A651] flex-shrink-0 ml-auto" />
                    </button>
                  )}
                </div>

                {/* Linked plan details (read-only) */}
                {linkedPlan && (
                  <div className="mb-4">
                    {linkedPlan.description && (
                      <p className="text-sm text-[#6B7C6B] mb-3">{linkedPlan.description}</p>
                    )}
                    {(() => {
                      const drills = [];
                      (linkedPlan.sessions || []).forEach(sess => {
                        (sess.drills || []).forEach(drill => {
                          drills.push(drill);
                        });
                      });
                      if (drills.length === 0) return null;
                      return (
                        <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-3">
                          <h4 className="text-xs font-bold text-[#005028] mb-2 flex items-center gap-1.5">
                            <Dumbbell className="w-3.5 h-3.5" />
                            Drills ({drills.length})
                          </h4>
                          <div className="space-y-1.5">
                            {drills.map((drill, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-gray-800">{drill.name || 'Unnamed Drill'}</span>
                                {drill.duration && (
                                  <span className="text-xs text-[#6B7C6B]">{drill.duration} min</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Full Plan Preview Modal */}
      <TrainingPlanPreviewModal plan={planPreview} onClose={() => setPlanPreview(null)} />
    </PageShell>
  );
};

export default CoachSchedulePage;
