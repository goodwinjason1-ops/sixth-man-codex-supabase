import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Star,
  BookOpen,
  Send,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Play,
  Target,
  MessageCircle,
  Award,
  TrendingUp,
  AlertCircle,
  X,
  Save,
  Lightbulb,
  Heart,
  Clipboard,
  Eye
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import {
  getProgram,
  subscribeEnrollments,
  subscribeSessions,
  createSession,
  updateSession,
  batchRecordAttendance,
  updateMilestone,
  getChildMilestones,
  sendBatchParentMessages,
  getSessionAttendance,
  getProgramStats
} from '../services/youthProgramService';
import {
  PROGRAM_TYPES,
  PROGRAM_CONFIG,
  MILESTONES,
  MILESTONE_STATUS,
  LITTLE_LAKERS_ACTIVITIES,
  LAKERS_READY_ACTIVITIES,
  ALL_ACTIVITIES,
  LITTLE_LAKERS_CURRICULUM,
  LAKERS_READY_CURRICULUM,
  COACH_TIPS
} from '../data/youthPrograms';

const YouthCoachPage = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [program, setProgram] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('session');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [error, setError] = useState(null);

  // Load program data
  useEffect(() => {
    if (!programId) return;
    const loadProgram = async () => {
      const result = await getProgram(programId);
      if (result.success) {
        setProgram(result.data);
      } else {
        setError('Program not found');
      }
      setLoading(false);
    };
    loadProgram();
  }, [programId]);

  // Subscribe to enrollments and sessions
  useEffect(() => {
    if (!programId) return;
    const unsub1 = subscribeEnrollments(programId, setEnrollments);
    const unsub2 = subscribeSessions(programId, (data) => {
      setSessions(data);
      // Set current week to latest session + 1
      if (data.length > 0) {
        const maxWeek = Math.max(...data.map(s => s.weekNumber || 0));
        setCurrentWeek(Math.min(maxWeek + 1, (config?.totalWeeks || 8)));
      }
    });
    return () => { unsub1(); unsub2(); };
  }, [programId]);

  const config = program ? (PROGRAM_CONFIG[program.programType] || PROGRAM_CONFIG[PROGRAM_TYPES.LITTLE_LAKERS]) : null;
  const curriculum = program?.programType === PROGRAM_TYPES.LITTLE_LAKERS
    ? LITTLE_LAKERS_CURRICULUM
    : LAKERS_READY_CURRICULUM;
  const activities = program?.programType === PROGRAM_TYPES.LITTLE_LAKERS
    ? LITTLE_LAKERS_ACTIVITIES
    : LAKERS_READY_ACTIVITIES;
  const tips = program ? (COACH_TIPS[program.programType] || []) : [];
  const milestoneList = program ? (MILESTONES[program.programType] || []) : [];

  const tabs = [
    { id: 'session', label: 'Session Plan', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'milestones', label: 'Milestones', icon: Target },
    { id: 'activities', label: 'Activities', icon: Play },
    { id: 'parents', label: 'Parent Notes', icon: MessageCircle }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold">Program not found</p>
          <button onClick={() => navigate('/admin/youth-programs')} className="mt-3 text-emerald-400 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} p-4 pb-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/admin/youth-programs')} className="p-2 rounded-lg bg-gray-200 hover:bg-white/30 text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">{program.name}</h1>
              <p className="text-gray-700 text-sm">{config.name} | Ages {config.ageRange} | Week {currentWeek} of {config.totalWeeks}</p>
            </div>
            <div className="text-3xl">{program.programType === PROGRAM_TYPES.LITTLE_LAKERS ? '🏀' : '🌟'}</div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-200 rounded-lg p-2 text-center">
              <p className="text-gray-800 font-bold text-lg">{enrollments.filter(e => e.status === 'active').length}</p>
              <p className="text-gray-600 text-xs">Enrolled</p>
            </div>
            <div className="bg-gray-200 rounded-lg p-2 text-center">
              <p className="text-gray-800 font-bold text-lg">{sessions.filter(s => s.status === 'completed').length}</p>
              <p className="text-gray-600 text-xs">Sessions Done</p>
            </div>
            <div className="bg-gray-200 rounded-lg p-2 text-center">
              <p className="text-gray-800 font-bold text-lg">{config.totalWeeks}</p>
              <p className="text-gray-600 text-xs">Total Weeks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {activeTab === 'session' && (
          <SessionPlanTab
            config={config}
            curriculum={curriculum}
            activities={activities}
            tips={tips}
            currentWeek={currentWeek}
            setCurrentWeek={setCurrentWeek}
            programId={programId}
            sessions={sessions}
            onCreateSession={async (weekData) => {
              const result = await createSession({
                ...weekData,
                programId,
                programType: program.programType,
                coachId: currentUser?.uid,
                coachName: userProfile?.displayName
              });
              if (!result.success) setError(result.error);
              return result;
            }}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            enrollments={enrollments}
            sessions={sessions}
            programId={programId}
            currentWeek={currentWeek}
            onRecordAttendance={async (sessionId, records) => {
              const result = await batchRecordAttendance(sessionId, programId, records);
              if (!result.success) setError(result.error);
              return result;
            }}
            onCreateSession={async (weekNumber) => {
              const result = await createSession({
                programId,
                programType: program.programType,
                weekNumber,
                status: 'active',
                coachId: currentUser?.uid,
                coachName: userProfile?.displayName
              });
              if (!result.success) setError(result.error);
              return result;
            }}
          />
        )}

        {activeTab === 'milestones' && (
          <MilestonesTab
            enrollments={enrollments}
            milestoneList={milestoneList}
            programId={programId}
            programType={program.programType}
            currentUserId={currentUser?.uid}
          />
        )}

        {activeTab === 'activities' && (
          <ActivitiesTab activities={activities} config={config} />
        )}

        {activeTab === 'parents' && (
          <ParentNotesTab
            enrollments={enrollments}
            programId={programId}
            currentWeek={currentWeek}
            coachName={userProfile?.displayName}
            curriculum={curriculum}
            onSendMessages={async (sessionId, messages) => {
              const result = await sendBatchParentMessages(sessionId, programId, messages);
              if (!result.success) setError(result.error);
              return result;
            }}
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// Session Plan Tab
// ============================================
const SessionPlanTab = ({ config, curriculum, activities, tips, currentWeek, setCurrentWeek, programId, sessions, onCreateSession }) => {
  const weekPlan = curriculum[currentWeek - 1];
  const sessionExists = sessions.some(s => s.weekNumber === currentWeek);
  const [showTip, setShowTip] = useState(true);

  const weekActivities = useMemo(() => {
    if (!weekPlan) return [];
    return weekPlan.activities.map(id => activities.find(a => a.id === id)).filter(Boolean);
  }, [weekPlan, activities]);

  const randomTip = useMemo(() => {
    return tips[Math.floor(Math.random() * tips.length)];
  }, [currentWeek, tips]);

  if (!weekPlan) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p>No session plan for week {currentWeek}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl p-3">
        <button
          onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
          disabled={currentWeek <= 1}
          className="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30 rounded-lg hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-gray-800 font-bold">Week {currentWeek}: {weekPlan.theme}</p>
          <p className="text-gray-400 text-xs">Focus: {weekPlan.focus}</p>
        </div>
        <button
          onClick={() => setCurrentWeek(Math.min(config.totalWeeks, currentWeek + 1))}
          disabled={currentWeek >= config.totalWeeks}
          className="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30 rounded-lg hover:bg-gray-700"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Coach Tip */}
      {showTip && randomTip && (
        <div className="bg-amber-900/30 border border-amber-600/50 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-300 text-sm font-medium">Coach Tip</p>
              <p className="text-amber-100/80 text-sm mt-1">{randomTip}</p>
            </div>
            <button onClick={() => setShowTip(false)} className="text-amber-500/50 hover:text-amber-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Session Flow */}
      <div className="space-y-3">
        {/* Warm-Up */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-gray-800 font-semibold text-sm">Warm-Up</h3>
              <p className="text-gray-400 text-xs">{config.id === PROGRAM_TYPES.LITTLE_LAKERS ? '5 min' : '7 min'}</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm ml-10">{weekPlan.warmUp}</p>
        </div>

        {/* Activities */}
        {weekActivities.map((activity, idx) => (
          <div key={activity.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-gray-800 font-semibold text-sm">{activity.name}</h3>
                <p className="text-gray-400 text-xs">{activity.duration} min | {activity.category}</p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: activity.funRating }, (_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>

            <div className="ml-10 space-y-2">
              <p className="text-gray-300 text-sm">{activity.instructions}</p>

              {activity.equipment?.length > 0 && (
                <div className="flex items-start gap-1">
                  <Clipboard className="w-3 h-3 text-gray-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-500 text-xs">{activity.equipment.join(' | ')}</p>
                </div>
              )}

              <div className="bg-gray-900/50 rounded-lg p-2">
                <p className="text-emerald-400 text-xs font-medium mb-1">Key Points:</p>
                <ul className="space-y-0.5">
                  {activity.keyPoints.map((point, i) => (
                    <li key={i} className="text-gray-400 text-xs flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5">-</span> {point}
                    </li>
                  ))}
                </ul>
              </div>

              {activity.variations && (
                <div className="text-xs text-gray-500">
                  <span className="text-gray-400 font-medium">Variations: </span>
                  {activity.variations.join(' | ')}
                </div>
              )}

              {activity.safetyNotes && (
                <div className="text-xs text-red-400/70 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {activity.safetyNotes}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Cool-Down */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-gray-800 font-semibold text-sm">Cool-Down</h3>
              <p className="text-gray-400 text-xs">5 min</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm ml-10">{weekPlan.coolDown}</p>
        </div>

        {/* Parent Tip */}
        <div className="bg-purple-900/30 border border-purple-600/50 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-purple-300 text-sm font-medium">Parent Tip of the Week</p>
              <p className="text-purple-100/80 text-sm mt-1">{weekPlan.parentTip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Session Complete */}
      {!sessionExists && (
        <button
          onClick={async () => {
            await onCreateSession({
              weekNumber: currentWeek,
              theme: weekPlan.theme,
              focus: weekPlan.focus,
              activities: weekPlan.activities,
              status: 'completed',
              completedAt: new Date().toISOString()
            });
          }}
          className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
        >
          <CheckCircle className="w-5 h-5" />
          Mark Week {currentWeek} as Completed
        </button>
      )}
      {sessionExists && (
        <div className="bg-emerald-900/30 border border-emerald-600/50 rounded-xl p-3 text-center">
          <p className="text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Week {currentWeek} session completed
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Attendance Tab
// ============================================
const AttendanceTab = ({ enrollments, sessions, programId, currentWeek, onRecordAttendance, onCreateSession }) => {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadedAttendance, setLoadedAttendance] = useState(false);

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const weekSession = sessions.find(s => s.weekNumber === selectedWeek);

  // Load existing attendance when week changes
  useEffect(() => {
    if (!weekSession) {
      // Initialize all as present by default
      const initial = {};
      activeEnrollments.forEach(e => { initial[e.id] = { present: true, note: '' }; });
      setAttendance(initial);
      setLoadedAttendance(false);
      return;
    }

    const loadAtt = async () => {
      const result = await getSessionAttendance(weekSession.id);
      if (result.success && result.data.length > 0) {
        const map = {};
        result.data.forEach(a => { map[a.enrollmentId] = { present: a.present, note: a.note || '' }; });
        // Fill in any missing enrollments
        activeEnrollments.forEach(e => {
          if (!map[e.id]) map[e.id] = { present: true, note: '' };
        });
        setAttendance(map);
        setLoadedAttendance(true);
      } else {
        const initial = {};
        activeEnrollments.forEach(e => { initial[e.id] = { present: true, note: '' }; });
        setAttendance(initial);
        setLoadedAttendance(false);
      }
    };
    loadAtt();
  }, [selectedWeek, weekSession?.id, activeEnrollments.length]);

  const handleSave = async () => {
    setSaving(true);
    let sessionId = weekSession?.id;

    // Create session if it doesn't exist
    if (!sessionId) {
      const result = await onCreateSession(selectedWeek);
      if (result.success) {
        sessionId = result.id;
      } else {
        setSaving(false);
        return;
      }
    }

    const records = activeEnrollments.map(e => ({
      enrollmentId: e.id,
      childName: e.childName,
      present: attendance[e.id]?.present ?? true,
      note: attendance[e.id]?.note || ''
    }));

    await onRecordAttendance(sessionId, records);
    setLoadedAttendance(true);
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter(a => a.present).length;

  return (
    <div className="space-y-4">
      {/* Week Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 8 }, (_, i) => i + 1).map(week => {
          const hasSession = sessions.some(s => s.weekNumber === week);
          return (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-colors ${
                selectedWeek === week
                  ? 'bg-emerald-600 text-white'
                  : hasSession
                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-600'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              <span className="text-[10px]">Wk</span>
              <span className="text-sm font-bold">{week}</span>
            </button>
          );
        })}
      </div>

      {/* Attendance Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 font-semibold">Week {selectedWeek} Attendance</h3>
          <span className="text-emerald-400 text-sm font-medium">{presentCount}/{activeEnrollments.length} present</span>
        </div>

        {activeEnrollments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No children enrolled</p>
        ) : (
          <div className="space-y-2">
            {activeEnrollments.map(enrollment => {
              const isPresent = attendance[enrollment.id]?.present ?? true;
              return (
                <div key={enrollment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50">
                  <button
                    onClick={() => setAttendance(a => ({
                      ...a,
                      [enrollment.id]: { ...a[enrollment.id], present: !isPresent }
                    }))}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isPresent
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                        : 'bg-red-500/20 text-red-400 border border-red-500'
                    }`}
                  >
                    {isPresent ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isPresent ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                      {enrollment.childName}
                    </p>
                    <p className="text-gray-500 text-xs">Age {enrollment.childAge}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || activeEnrollments.length === 0}
          className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : loadedAttendance ? 'Update Attendance' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
};

// ============================================
// Milestones Tab
// ============================================
const MilestonesTab = ({ enrollments, milestoneList, programId, programType, currentUserId }) => {
  const [selectedChild, setSelectedChild] = useState(null);
  const [childMilestones, setChildMilestones] = useState({});
  const [saving, setSaving] = useState(null);

  const activeEnrollments = enrollments.filter(e => e.status === 'active');

  // Load milestones when child is selected
  useEffect(() => {
    if (!selectedChild) return;
    const loadMilestones = async () => {
      const result = await getChildMilestones(selectedChild);
      if (result.success) {
        const map = {};
        result.data.forEach(m => { map[m.milestoneId] = m.status; });
        setChildMilestones(map);
      }
    };
    loadMilestones();
  }, [selectedChild]);

  const handleMilestoneToggle = async (milestoneId, currentStatus) => {
    // Cycle: not_started -> improving -> achieved -> not_started
    const nextStatus = currentStatus === MILESTONE_STATUS.NOT_STARTED
      ? MILESTONE_STATUS.IMPROVING
      : currentStatus === MILESTONE_STATUS.IMPROVING
      ? MILESTONE_STATUS.ACHIEVED
      : MILESTONE_STATUS.NOT_STARTED;

    setSaving(milestoneId);
    const result = await updateMilestone({
      enrollmentId: selectedChild,
      milestoneId,
      programId,
      programType,
      status: nextStatus,
      updatedBy: currentUserId
    });

    if (result.success) {
      setChildMilestones(prev => ({ ...prev, [milestoneId]: nextStatus }));
    }
    setSaving(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case MILESTONE_STATUS.ACHIEVED:
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case MILESTONE_STATUS.IMPROVING:
        return <TrendingUp className="w-5 h-5 text-yellow-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case MILESTONE_STATUS.ACHIEVED: return 'Achieved';
      case MILESTONE_STATUS.IMPROVING: return 'Improving';
      default: return 'Not Started';
    }
  };

  return (
    <div className="space-y-4">
      {/* Child Selector */}
      <div>
        <h3 className="text-gray-800 font-semibold text-sm mb-2">Select Child</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activeEnrollments.map(enrollment => (
            <button
              key={enrollment.id}
              onClick={() => setSelectedChild(enrollment.id)}
              className={`p-3 rounded-xl text-left transition-colors ${
                selectedChild === enrollment.id
                  ? 'bg-emerald-600/20 border-emerald-500 border'
                  : 'bg-gray-800 border-gray-700 border hover:border-gray-600'
              }`}
            >
              <p className="text-gray-800 text-sm font-medium truncate">{enrollment.childName}</p>
              <p className="text-gray-400 text-xs">Age {enrollment.childAge}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Milestones */}
      {selectedChild && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="text-gray-800 font-semibold mb-3">Developmental Milestones</h3>
          <p className="text-gray-400 text-xs mb-4">Tap to cycle: Not Started → Improving → Achieved</p>

          <div className="space-y-2">
            {milestoneList.map(milestone => {
              const status = childMilestones[milestone.id] || MILESTONE_STATUS.NOT_STARTED;
              const isSaving = saving === milestone.id;

              return (
                <button
                  key={milestone.id}
                  onClick={() => handleMilestoneToggle(milestone.id, status)}
                  disabled={isSaving}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    status === MILESTONE_STATUS.ACHIEVED ? 'bg-emerald-900/20 border border-emerald-700' :
                    status === MILESTONE_STATUS.IMPROVING ? 'bg-yellow-900/20 border border-yellow-700' :
                    'bg-gray-900/50 border border-gray-700 hover:border-gray-600'
                  } ${isSaving ? 'opacity-50' : ''}`}
                >
                  {getStatusIcon(status)}
                  <div className="flex-1">
                    <p className={`text-sm ${status === MILESTONE_STATUS.ACHIEVED ? 'text-emerald-300' : status === MILESTONE_STATUS.IMPROVING ? 'text-yellow-300' : 'text-gray-300'}`}>
                      {milestone.label}
                    </p>
                    <p className="text-gray-500 text-xs">{milestone.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    status === MILESTONE_STATUS.ACHIEVED ? 'bg-emerald-500/20 text-emerald-400' :
                    status === MILESTONE_STATUS.IMPROVING ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-700 text-gray-500'
                  }`}>
                    {getStatusLabel(status)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress Summary */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="text-gray-800 font-medium">
                {Object.values(childMilestones).filter(s => s === MILESTONE_STATUS.ACHIEVED).length}/{milestoneList.length} achieved
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${milestoneList.length > 0
                    ? (Object.values(childMilestones).filter(s => s === MILESTONE_STATUS.ACHIEVED).length / milestoneList.length) * 100
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {!selectedChild && activeEnrollments.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-sm">Select a child to view and track milestones</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Activities Browser Tab
// ============================================
const ActivitiesTab = ({ activities, config }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedActivity, setExpandedActivity] = useState(null);

  const categories = useMemo(() => {
    const cats = [...new Set(activities.map(a => a.category))];
    return ['all', ...cats.sort()];
  }, [activities]);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.instructions.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activities, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search activities..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}
          >
            {cat === 'all' ? 'All' : cat.replace('-', ' ')}
          </button>
        ))}
      </div>

      <p className="text-gray-500 text-xs">{filtered.length} activities</p>

      {/* Activity Cards */}
      <div className="space-y-2">
        {filtered.map(activity => {
          const isExpanded = expandedActivity === activity.id;
          return (
            <div key={activity.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                  <Play className="w-5 h-5 text-gray-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium text-sm">{activity.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span>{activity.duration} min</span>
                    <span>|</span>
                    <span className="capitalize">{activity.category.replace('-', ' ')}</span>
                    <span>|</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: activity.funRating }, (_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-3">
                  <p className="text-gray-300 text-sm">{activity.instructions}</p>

                  {activity.equipment?.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs font-medium mb-1">Equipment:</p>
                      <p className="text-gray-500 text-xs">{activity.equipment.join(' | ')}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-emerald-400 text-xs font-medium mb-1">Key Points:</p>
                    <ul className="space-y-0.5">
                      {activity.keyPoints.map((p, i) => (
                        <li key={i} className="text-gray-400 text-xs">- {p}</li>
                      ))}
                    </ul>
                  </div>

                  {activity.variations && (
                    <div>
                      <p className="text-blue-400 text-xs font-medium mb-1">Variations:</p>
                      {activity.variations.map((v, i) => (
                        <p key={i} className="text-gray-500 text-xs">- {v}</p>
                      ))}
                    </div>
                  )}

                  {activity.safetyNotes && (
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-2">
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {activity.safetyNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// Parent Notes Tab
// ============================================
const ParentNotesTab = ({ enrollments, programId, currentWeek, coachName, curriculum, onSendMessages }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const weekPlan = curriculum[currentWeek - 1];

  const generateDefaultMessage = () => {
    if (!weekPlan) return '';
    return `Hi! This week in our session we focused on "${weekPlan.theme}" (${weekPlan.focus}).\n\n` +
      `Your child did a great job today! Here are some things we worked on:\n` +
      `- ${weekPlan.warmUp}\n` +
      `- Activities covering: ${weekPlan.focus}\n\n` +
      `Parent tip for this week: ${weekPlan.parentTip}\n\n` +
      `See you next week!\n- Coach ${coachName || ''}`;
  };

  useEffect(() => {
    if (!message && weekPlan) {
      setMessage(generateDefaultMessage());
    }
  }, [currentWeek]);

  const handleSend = async () => {
    if (!message.trim() || activeEnrollments.length === 0) return;
    setSending(true);

    const messages = activeEnrollments.map(e => ({
      enrollmentId: e.id,
      childName: e.childName,
      parentEmail: e.parentEmail || '',
      subject: `Week ${currentWeek} Session Update - ${weekPlan?.theme || 'Session'}`,
      message: message,
      coachName: coachName || '',
      weekNumber: currentWeek
    }));

    const result = await onSendMessages(`week-${currentWeek}`, messages);
    if (result?.success) {
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="text-gray-800 font-semibold mb-1">Week {currentWeek} Parent Note</h3>
        <p className="text-gray-400 text-xs mb-3">
          This message will be saved for all {activeEnrollments.length} enrolled families
        </p>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={10}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm"
          placeholder="Write a message to parents..."
        />

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setMessage(generateDefaultMessage())}
            className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
          >
            Reset Template
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || activeEnrollments.length === 0}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Saving...' : sent ? 'Saved!' : 'Save & Send Notes'}
          </button>
        </div>
      </div>

      {/* Recipients Preview */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h4 className="text-gray-800 font-semibold text-sm mb-2">Recipients ({activeEnrollments.length})</h4>
        <div className="space-y-1">
          {activeEnrollments.map(e => (
            <div key={e.id} className="flex items-center justify-between text-sm py-1">
              <span className="text-gray-300">{e.childName}</span>
              <span className="text-gray-500 text-xs">{e.parentEmail || 'No email'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YouthCoachPage;
