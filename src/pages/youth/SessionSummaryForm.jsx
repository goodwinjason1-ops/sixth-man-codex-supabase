import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
  CheckCircle,
  Star,
  Send,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import {
  getProgram,
  getProgramEnrollments,
  saveSessionSummary
} from '../../services/youthProgramService';
import {
  PROGRAM_TYPES,
  PROGRAM_CONFIG,
  MILESTONES
} from '../../data/youthPrograms';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import ConfettiCelebration from '../../components/youth/ConfettiCelebration';

const SKILLS = [
  { key: 'catching_throwing', label: 'Catching & Throwing', emoji: '\uD83E\uDD32' },
  { key: 'dribbling', label: 'Dribbling', emoji: '\u26F9\uFE0F' },
  { key: 'shooting_beginner', label: 'Shooting (beginner)', emoji: '\uD83C\uDFAF' },
  { key: 'movement_coordination', label: 'Movement & Coordination', emoji: '\uD83C\uDFC3' },
  { key: 'teamwork', label: 'Teamwork', emoji: '\uD83E\uDD1D' },
  { key: 'game_play', label: 'Game Play', emoji: '\uD83C\uDFC6' },
  { key: 'balance_agility', label: 'Balance & Agility', emoji: '\uD83E\uDD38' },
];

const FUN_ACTIVITIES = [
  'Sharks & Minnows',
  'Red Light Green Light',
  'Musical Basketballs',
  'Relay Races',
  'Knockout',
  'Team Tag',
  'Free Play'
];

const SessionSummaryForm = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { addDocument } = useData();

  const [program, setProgram] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Form state
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [funActivity, setFunActivity] = useState('');
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(false);
  const [achievements, setAchievements] = useState({});
  const [coachNote, setCoachNote] = useState('');

  useEffect(() => {
    if (!programId) return;
    const load = async () => {
      const [progResult, enrollResult] = await Promise.all([
        getProgram(programId),
        getProgramEnrollments(programId)
      ]);
      if (progResult.success) setProgram(progResult.data);
      else setError('Program not found');
      if (enrollResult.success) setEnrollments(enrollResult.data.filter(e => e.status === 'active'));
      setLoading(false);
    };
    load();
  }, [programId]);

  const config = program ? (PROGRAM_CONFIG[program.programType] || PROGRAM_CONFIG[PROGRAM_TYPES.LITTLE_LAKERS]) : null;
  const milestoneList = program ? (MILESTONES[program.programType] || []) : [];
  const isLittleLakers = program?.programType === PROGRAM_TYPES.LITTLE_LAKERS;

  const accentBg = isLittleLakers ? 'bg-amber-50' : 'bg-emerald-50';
  const accentBorder = isLittleLakers ? 'border-amber-200' : 'border-emerald-200';
  const accentText = isLittleLakers ? 'text-amber-700' : 'text-emerald-700';
  const accentBtn = isLittleLakers
    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
    : 'bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600';
  const chipActive = isLittleLakers
    ? 'bg-amber-100 border-amber-400 text-amber-800'
    : 'bg-emerald-100 border-emerald-400 text-emerald-800';

  const toggleSkill = (key) => {
    setSelectedSkills(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const toggleMilestone = (enrollmentId, milestone) => {
    setAchievements(prev => {
      const current = prev[enrollmentId] || [];
      const exists = current.includes(milestone.label);
      const updated = exists
        ? current.filter(l => l !== milestone.label)
        : [...current, milestone.label];

      if (!exists) {
        setConfettiTrigger(t => t + 1);
      }

      return { ...prev, [enrollmentId]: updated };
    });
  };

  const buildParentMessage = (summary) => {
    const parts = [];
    if (summary.skillsPracticed?.length > 0) {
      const skillLabels = summary.skillsPracticed.map(
        key => SKILLS.find(s => s.key === key)?.label || key
      );
      parts.push(`We practiced ${skillLabels.join(' and ').toLowerCase()} today!`);
    }
    if (summary.funActivity) {
      parts.push(`Fun game: ${summary.funActivity} \uD83C\uDFAE`);
    }
    if (summary.coachNote) {
      parts.push(`Coach says: ${summary.coachNote}`);
    }
    return parts.join('\n');
  };

  const handleSubmit = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill practiced');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const achievementsList = enrollments
        .filter(e => (achievements[e.id] || []).length > 0)
        .map(e => ({
          enrollmentId: e.id,
          childName: e.childName,
          milestoneLabels: achievements[e.id]
        }));

      const summaryData = {
        programId,
        programType: program.programType,
        programName: program.name,
        sessionDate: new Date(),
        skillsPracticed: selectedSkills,
        funActivity: funActivity.trim(),
        achievements: achievementsList,
        coachNote: coachNote.trim(),
        coachId: currentUser?.uid,
        coachName: userProfile?.displayName || ''
      };

      const result = await saveSessionSummary(summaryData);
      if (!result.success) {
        setError(result.error || 'Failed to save summary');
        setSubmitting(false);
        return;
      }

      // Create notifications for parents who have accounts
      try {
        const parentEmails = [...new Set(enrollments.map(e => e.parentEmail).filter(Boolean))];
        if (parentEmails.length > 0) {
          // Batch lookup parent emails in chunks of 10 (Firestore 'in' limit)
          const parentUsers = [];
          for (let i = 0; i < parentEmails.length; i += 10) {
            const chunk = parentEmails.slice(i, i + 10);
            const usersQuery = query(
              collection(db, 'users'),
              where('email', 'in', chunk)
            );
            const snap = await getDocs(usersQuery);
            snap.docs.forEach(d => parentUsers.push({ id: d.id, ...d.data() }));
          }

          const message = buildParentMessage(summaryData);

          // Build per-child achievement lines
          const achievementLines = achievementsList.map(a =>
            `\uD83C\uDFC0 ${a.childName} earned: ${a.milestoneLabels.join(', ')} \u2B50`
          ).join('\n');
          const fullMessage = achievementLines
            ? `${message}\n${achievementLines}`
            : message;

          for (const parent of parentUsers) {
            await addDocument('notifications', {
              type: 'announcement',
              subject: `Today at ${program.name}! \uD83C\uDFC0`,
              message: fullMessage,
              priority: 'normal',
              targetAudience: { type: 'individual', userIds: [parent.id] },
              sentAt: new Date().toISOString(),
              status: 'sent',
              readBy: [],
              deletedBy: []
            });
          }
        }
      } catch (notifError) {
        console.error('Error creating notifications (non-blocking):', notifError);
      }

      navigate(`/youth-programs/${programId}`);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00A651] animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold">Program not found</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-[#00A651] hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F5] pb-20">
      <ConfettiCelebration trigger={confettiTrigger} />

      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} p-4 pb-6`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/youth-programs/${programId}`)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Session Summary</h1>
              <p className="text-white/80 text-sm">{program.name}</p>
            </div>
            <span className="text-3xl">{isLittleLakers ? '\uD83C\uDFC0' : '\uD83C\uDF1F'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Date Badge */}
        <div className={`${accentBg} border ${accentBorder} rounded-xl p-3 flex items-center gap-3`}>
          <span className="text-2xl">{'\uD83D\uDCC5'}</span>
          <div>
            <p className={`font-semibold ${accentText}`}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isLittleLakers ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'} font-medium`}>
              {config.name}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Skills Practiced */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <h3 className="text-gray-800 font-semibold mb-1">Skills Practiced *</h3>
          <p className="text-gray-500 text-xs mb-3">What did we work on today?</p>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(skill => {
              const active = selectedSkills.includes(skill.key);
              return (
                <button
                  key={skill.key}
                  onClick={() => toggleSkill(skill.key)}
                  className={`px-3 py-2 rounded-full border text-sm font-medium transition-all ${
                    active
                      ? chipActive
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{skill.emoji}</span>
                  {skill.label}
                  {active && <CheckCircle className="w-3.5 h-3.5 inline ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fun Activity */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <h3 className="text-gray-800 font-semibold mb-1">{'\uD83C\uDFAE'} Fun Activity</h3>
          <p className="text-gray-500 text-xs mb-3">What fun game did we play?</p>
          <div className="relative">
            <input
              type="text"
              value={funActivity}
              onChange={(e) => setFunActivity(e.target.value)}
              onFocus={() => setShowActivitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowActivitySuggestions(false), 200)}
              placeholder="Type or pick a game..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
            {showActivitySuggestions && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {FUN_ACTIVITIES.filter(a =>
                  !funActivity || a.toLowerCase().includes(funActivity.toLowerCase())
                ).map(activity => (
                  <button
                    key={activity}
                    onMouseDown={() => {
                      setFunActivity(activity);
                      setShowActivitySuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {activity}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Star Achievements */}
        {enrollments.length > 0 && (
          <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
            <h3 className="text-gray-800 font-semibold mb-1">{'\u2B50'} Star Achievements</h3>
            <p className="text-gray-500 text-xs mb-3">Celebrate what each child achieved today!</p>
            <div className="space-y-4">
              {enrollments.map(enrollment => {
                const childAchievements = achievements[enrollment.id] || [];
                return (
                  <div key={enrollment.id} className={`border ${accentBorder} rounded-lg p-3`}>
                    <p className="text-gray-800 font-medium text-sm mb-2">
                      {'\uD83C\uDF1F'} {enrollment.childName}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {milestoneList.map(milestone => {
                        const isSelected = childAchievements.includes(milestone.label);
                        return (
                          <button
                            key={milestone.id}
                            onClick={() => toggleMilestone(enrollment.id, milestone)}
                            className={`px-2 py-1 rounded-full border text-xs transition-all ${
                              isSelected
                                ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-medium'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {isSelected && <Star className="w-3 h-3 inline mr-0.5 text-yellow-500 fill-yellow-500" />}
                            {milestone.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Note */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <h3 className="text-gray-800 font-semibold mb-1">{'\uD83D\uDCDD'} Quick Note</h3>
          <p className="text-gray-500 text-xs mb-3">Anything else to share with parents?</p>
          <textarea
            value={coachNote}
            onChange={(e) => setCoachNote(e.target.value)}
            rows={3}
            placeholder="Everyone did great today!"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none text-sm"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || selectedSkills.length === 0}
          className={`w-full py-3.5 ${accentBtn} text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Share with Parents
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SessionSummaryForm;
