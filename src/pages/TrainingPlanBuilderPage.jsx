import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Calendar,
  Clock,
  Target,
  Search,
  X,
  Copy,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  Users,
  FileText,
  Play,
  Award
} from 'lucide-react';
import PageShell from '../components/PageShell';
import {
  DRILL_LIBRARY,
  getDrillsByCategory,
  searchDrills,
  WARMUP_TEMPLATES,
  COOLDOWN_TEMPLATES,
  SMALL_SIDED_GAMES
} from '../data/drillLibrary';
import { SKILL_CATEGORIES, AGE_GROUPS } from '../data/skillBenchmarks';

// Sample teams for coach
const sampleTeams = [
  { id: 't1', name: 'U14 Lakers', ageGroup: 'U14' },
  { id: 't2', name: 'U12 Emerald', ageGroup: 'U12' }
];

const DURATION_OPTIONS = [
  { value: 'single', label: 'Single Session' },
  { value: 'weekly', label: 'Weekly Plan' },
  { value: 'monthly', label: 'Monthly Plan' },
  { value: 'season', label: 'Full Season' }
];

const TrainingPlanBuilderPage = () => {
  const navigate = useNavigate();
  const { id: planId } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateFrom = searchParams.get('duplicate');
  const { currentUser, userProfile } = useAuth();
  const { addDocument, updateDocument, fetchDocument } = useData();

  // Plan setup state
  const [planName, setPlanName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [duration, setDuration] = useState('single');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [focusAreas, setFocusAreas] = useState([]);
  const [status, setStatus] = useState('draft');

  // Sessions state
  const [sessions, setSessions] = useState([createEmptySession(1)]);
  const [expandedSessions, setExpandedSessions] = useState([0]);

  // UI state
  const [showDrillLibrary, setShowDrillLibrary] = useState(false);
  const [drillLibraryTarget, setDrillLibraryTarget] = useState(null); // { sessionIndex, insertAt }
  const [drillSearchQuery, setDrillSearchQuery] = useState('');
  const [selectedDrillCategory, setSelectedDrillCategory] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTemplates, setShowTemplates] = useState(null); // 'warmup', 'cooldown', 'game'

  // Load existing plan for editing
  useEffect(() => {
    const loadPlan = async () => {
      const loadId = planId || duplicateFrom;
      if (loadId) {
        const plan = await fetchDocument('training_plans', loadId);
        if (plan) {
          setPlanName(duplicateFrom ? `${plan.name} (Copy)` : plan.name);
          setSelectedTeam(plan.teamId);
          setAgeGroup(plan.ageGroup);
          setDuration(plan.duration);
          setStartDate(plan.dateRange?.start || '');
          setEndDate(plan.dateRange?.end || '');
          setFocusAreas(plan.focusAreas || []);
          setSessions(plan.sessions?.length > 0 ? plan.sessions : [createEmptySession(1)]);
          setStatus(duplicateFrom ? 'draft' : plan.status);
        }
      }
    };
    loadPlan();
  }, [planId, duplicateFrom, fetchDocument]);

  // Auto-fill age group when team is selected
  useEffect(() => {
    if (selectedTeam) {
      const team = sampleTeams.find(t => t.id === selectedTeam);
      if (team) {
        setAgeGroup(team.ageGroup);
      }
    }
  }, [selectedTeam]);

  // Create empty session
  function createEmptySession(number) {
    return {
      sessionNumber: number,
      name: `Session ${number}`,
      date: '',
      time: '',
      duration: 60,
      warmUp: '',
      drills: [],
      smallSidedGames: '',
      coolDown: '',
      notes: ''
    };
  }

  // Add new session
  const addSession = () => {
    const newSession = createEmptySession(sessions.length + 1);
    setSessions([...sessions, newSession]);
    setExpandedSessions([...expandedSessions, sessions.length]);
  };

  // Remove session
  const removeSession = (index) => {
    if (sessions.length === 1) return;
    const newSessions = sessions.filter((_, i) => i !== index);
    // Renumber sessions
    newSessions.forEach((s, i) => {
      s.sessionNumber = i + 1;
      if (s.name === `Session ${index + 1}`) {
        s.name = `Session ${i + 1}`;
      }
    });
    setSessions(newSessions);
    setExpandedSessions(expandedSessions.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  // Update session field
  const updateSession = (index, field, value) => {
    const newSessions = [...sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    setSessions(newSessions);
  };

  // Toggle session expansion
  const toggleSession = (index) => {
    if (expandedSessions.includes(index)) {
      setExpandedSessions(expandedSessions.filter(i => i !== index));
    } else {
      setExpandedSessions([...expandedSessions, index]);
    }
  };

  // Add drill to session
  const addDrillToSession = (sessionIndex, drill, insertAt = null) => {
    const newSessions = [...sessions];
    const newDrill = {
      id: `${drill.id}-${Date.now()}`,
      name: drill.name,
      description: drill.description,
      duration: drill.duration,
      equipment: drill.equipment?.join(', ') || '',
      skillFocus: drill.skillFocus,
      keyPoints: drill.keyPoints || []
    };

    if (insertAt !== null) {
      newSessions[sessionIndex].drills.splice(insertAt, 0, newDrill);
    } else {
      newSessions[sessionIndex].drills.push(newDrill);
    }
    setSessions(newSessions);
    setShowDrillLibrary(false);
  };

  // Remove drill from session
  const removeDrill = (sessionIndex, drillIndex) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].drills.splice(drillIndex, 1);
    setSessions(newSessions);
  };

  // Update drill in session
  const updateDrill = (sessionIndex, drillIndex, field, value) => {
    const newSessions = [...sessions];
    newSessions[sessionIndex].drills[drillIndex] = {
      ...newSessions[sessionIndex].drills[drillIndex],
      [field]: value
    };
    setSessions(newSessions);
  };

  // Move drill up/down
  const moveDrill = (sessionIndex, drillIndex, direction) => {
    const newSessions = [...sessions];
    const drills = newSessions[sessionIndex].drills;
    const newIndex = drillIndex + direction;

    if (newIndex < 0 || newIndex >= drills.length) return;

    [drills[drillIndex], drills[newIndex]] = [drills[newIndex], drills[drillIndex]];
    setSessions(newSessions);
  };

  // Toggle focus area
  const toggleFocusArea = (skillId) => {
    if (focusAreas.includes(skillId)) {
      setFocusAreas(focusAreas.filter(id => id !== skillId));
    } else if (focusAreas.length < 3) {
      setFocusAreas([...focusAreas, skillId]);
    }
  };

  // Filter drills for library modal
  const filteredDrills = useMemo(() => {
    let drills = DRILL_LIBRARY;

    // Filter by age group
    if (ageGroup) {
      drills = drills.filter(d => d.ageGroups.includes(ageGroup));
    }

    // Filter by category
    if (selectedDrillCategory !== 'all') {
      drills = drills.filter(d => d.skillFocus === selectedDrillCategory);
    }

    // Filter by search query
    if (drillSearchQuery.trim()) {
      drills = searchDrills(drillSearchQuery).filter(d =>
        selectedDrillCategory === 'all' || d.skillFocus === selectedDrillCategory
      );
    }

    return drills;
  }, [ageGroup, selectedDrillCategory, drillSearchQuery]);

  // Calculate coverage stats
  const coverageStats = useMemo(() => {
    const allDrills = sessions.flatMap(s => s.drills);
    const coveredSkills = new Set(allDrills.map(d => d.skillFocus));
    const totalSkills = SKILL_CATEGORIES.length;
    const totalDrillTime = allDrills.reduce((sum, d) => sum + (d.duration || 0), 0);
    const totalSessionTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    return {
      coveredSkills: coveredSkills.size,
      totalSkills,
      coverage: Math.round((coveredSkills.size / totalSkills) * 100),
      totalDrillTime,
      totalSessionTime,
      skillBreakdown: SKILL_CATEGORIES.map(skill => ({
        ...skill,
        covered: coveredSkills.has(skill.id),
        drillCount: allDrills.filter(d => d.skillFocus === skill.id).length
      }))
    };
  }, [sessions]);

  // Validate plan
  const validatePlan = () => {
    const newErrors = {};

    if (!planName.trim()) newErrors.planName = 'Plan name is required';
    if (!selectedTeam) newErrors.team = 'Please select a team';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (duration !== 'single' && !endDate) newErrors.endDate = 'End date is required';
    if (focusAreas.length === 0) newErrors.focusAreas = 'Select at least one focus area';

    sessions.forEach((session, index) => {
      if (!session.date) {
        newErrors[`session_${index}_date`] = 'Session date is required';
      }
      if (session.drills.length === 0) {
        newErrors[`session_${index}_drills`] = 'Add at least one drill';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save plan
  const handleSave = async (saveStatus = status) => {
    if (!validatePlan()) return;

    setSaving(true);
    try {
      const planData = {
        coachId: currentUser.uid,
        teamId: selectedTeam,
        teamName: sampleTeams.find(t => t.id === selectedTeam)?.name || '',
        ageGroup,
        name: planName,
        duration,
        dateRange: {
          start: startDate,
          end: endDate || startDate
        },
        focusAreas,
        sessions: sessions.map(s => ({
          ...s,
          drills: s.drills.map(d => ({
            name: d.name,
            description: d.description,
            duration: d.duration,
            equipment: d.equipment,
            skillFocus: d.skillFocus
          }))
        })),
        status: saveStatus,
        updatedAt: new Date().toISOString()
      };

      if (planId && !duplicateFrom) {
        await updateDocument('training_plans', planId, planData);
      } else {
        planData.createdAt = new Date().toISOString();
        await addDocument('training_plans', planData);
      }

      navigate('/coach/training-plans');
    } catch (error) {
      console.error('Error saving plan:', error);
      setErrors({ save: 'Failed to save plan. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Apply template
  const applyTemplate = (sessionIndex, field, template) => {
    updateSession(sessionIndex, field, template.description);
    setShowTemplates(null);
  };

  return (
    <PageShell
      title={planId ? 'Edit Training Plan' : 'New Training Plan'}
      subtitle={planName || 'Untitled Plan'}
      backTo="/coach/training-plans"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Coach', url: '/dashboard' },
        { label: 'Training Plans', url: '/coach/training-plans' },
        { label: planId ? 'Edit Plan' : 'New Plan' }
      ]}
      maxWidth="4xl"
      headerActions={
        <>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-lg hover:border-[#00A651] transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-[#D4E4D4] text-white rounded-lg hover:bg-[#00A651] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Error Banner */}
        {errors.save && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{errors.save}</p>
          </div>
        )}

        {/* Plan Setup Section */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
          <h2 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00A651]" />
            Plan Setup
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan Name */}
            <div className="sm:col-span-2">
              <label className="block text-[#00A651] text-sm font-medium mb-2">Plan Name *</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g., U12 Pre-Season Skills Development"
                className={`w-full px-4 py-3 bg-[#F5F9F5] border rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none ${
                  errors.planName ? 'border-red-500' : 'border-[#D4E4D4]'
                }`}
              />
              {errors.planName && <p className="text-red-400 text-xs mt-1">{errors.planName}</p>}
            </div>

            {/* Team Selector */}
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-2">Team *</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className={`w-full px-4 py-3 bg-[#F5F9F5] border rounded-xl text-gray-800 focus:border-[#00A651] focus:outline-none ${
                  errors.team ? 'border-red-500' : 'border-[#D4E4D4]'
                }`}
              >
                <option value="">Select a team</option>
                {sampleTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              {errors.team && <p className="text-red-400 text-xs mt-1">{errors.team}</p>}
            </div>

            {/* Age Group (auto-filled) */}
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-2">Age Group</label>
              <input
                type="text"
                value={ageGroup}
                readOnly
                className="w-full px-4 py-3 bg-[#F5F9F5]/50 border border-[#D4E4D4] rounded-xl text-[#00A651]"
                placeholder="Auto-filled from team"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-2">Plan Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 focus:border-[#00A651] focus:outline-none"
              >
                {DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[#00A651] text-sm font-medium mb-2">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-3 bg-[#F5F9F5] border rounded-xl text-gray-800 focus:border-[#00A651] focus:outline-none ${
                  errors.startDate ? 'border-red-500' : 'border-[#D4E4D4]'
                }`}
              />
              {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
            </div>

            {duration !== 'single' && (
              <div>
                <label className="block text-[#00A651] text-sm font-medium mb-2">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className={`w-full px-4 py-3 bg-[#F5F9F5] border rounded-xl text-gray-800 focus:border-[#00A651] focus:outline-none ${
                    errors.endDate ? 'border-red-500' : 'border-[#D4E4D4]'
                  }`}
                />
                {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
              </div>
            )}

            {/* Focus Areas */}
            <div className="sm:col-span-2">
              <label className="block text-[#00A651] text-sm font-medium mb-2">
                Primary Focus Areas (select 1-3) *
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILL_CATEGORIES.map(skill => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleFocusArea(skill.id)}
                    disabled={focusAreas.length >= 3 && !focusAreas.includes(skill.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      focusAreas.includes(skill.id)
                        ? 'bg-[#005028] text-white'
                        : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651] disabled:opacity-50'
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
              {errors.focusAreas && <p className="text-red-400 text-xs mt-1">{errors.focusAreas}</p>}
            </div>
          </div>
        </div>

        {/* Coverage Stats */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
          <h2 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#00A651]" />
            Skill Coverage
          </h2>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="h-3 bg-[#F5F9F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#005028] to-[#00A651] transition-all duration-500"
                  style={{ width: `${coverageStats.coverage}%` }}
                />
              </div>
            </div>
            <span className="text-gray-800 font-bold">{coverageStats.coverage}%</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {coverageStats.skillBreakdown.map(skill => (
              <div
                key={skill.id}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                  skill.covered
                    ? 'bg-[#005028]/20 text-[#00A651] border border-[#00A651]'
                    : 'bg-[#F5F9F5] text-[#6B7C6B] border border-[#D4E4D4]'
                }`}
              >
                {skill.covered && <CheckCircle2 className="w-3 h-3" />}
                {skill.name}
                {skill.drillCount > 0 && <span className="ml-1 font-bold">({skill.drillCount})</span>}
              </div>
            ))}
          </div>

          <p className="text-[#6B7C6B] text-sm mt-3">
            {coverageStats.coveredSkills} of {coverageStats.totalSkills} skills covered •
            Total drill time: {coverageStats.totalDrillTime} mins
          </p>
        </div>

        {/* Sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-800 font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00A651]" />
              Training Sessions ({sessions.length})
            </h2>
            <button
              onClick={addSession}
              className="flex items-center gap-2 px-3 py-2 bg-[#005028] text-white rounded-lg font-medium hover:bg-[#00A651] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Session
            </button>
          </div>

          {sessions.map((session, sessionIndex) => (
            <SessionBuilder
              key={sessionIndex}
              session={session}
              sessionIndex={sessionIndex}
              isExpanded={expandedSessions.includes(sessionIndex)}
              onToggle={() => toggleSession(sessionIndex)}
              onUpdate={(field, value) => updateSession(sessionIndex, field, value)}
              onRemove={() => removeSession(sessionIndex)}
              onAddDrill={() => {
                setDrillLibraryTarget({ sessionIndex, insertAt: null });
                setShowDrillLibrary(true);
              }}
              onRemoveDrill={(drillIndex) => removeDrill(sessionIndex, drillIndex)}
              onUpdateDrill={(drillIndex, field, value) => updateDrill(sessionIndex, drillIndex, field, value)}
              onMoveDrill={(drillIndex, direction) => moveDrill(sessionIndex, drillIndex, direction)}
              onShowTemplates={(type) => setShowTemplates({ sessionIndex, type })}
              canRemove={sessions.length > 1}
              errors={errors}
            />
          ))}
        </div>

        {/* Save Actions */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-xl font-medium hover:border-[#00A651] transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Save as Draft
            </button>
            <button
              onClick={() => handleSave('active')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#005028] text-white rounded-xl font-semibold hover:bg-[#00A651] transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              Save & Activate
            </button>
          </div>
        </div>
      </div>

      {/* Drill Library Modal */}
      {showDrillLibrary && (
        <DrillLibraryModal
          drills={filteredDrills}
          searchQuery={drillSearchQuery}
          onSearchChange={setDrillSearchQuery}
          selectedCategory={selectedDrillCategory}
          onCategoryChange={setSelectedDrillCategory}
          onSelectDrill={(drill) => addDrillToSession(drillLibraryTarget.sessionIndex, drill, drillLibraryTarget.insertAt)}
          onClose={() => {
            setShowDrillLibrary(false);
            setDrillSearchQuery('');
            setSelectedDrillCategory('all');
          }}
          ageGroup={ageGroup}
        />
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <TemplatesModal
          type={showTemplates.type}
          onSelect={(template) => {
            const field = showTemplates.type === 'warmup' ? 'warmUp' :
                          showTemplates.type === 'cooldown' ? 'coolDown' : 'smallSidedGames';
            applyTemplate(showTemplates.sessionIndex, field, template);
          }}
          onClose={() => setShowTemplates(null)}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          plan={{
            name: planName,
            team: sampleTeams.find(t => t.id === selectedTeam)?.name,
            ageGroup,
            duration,
            dateRange: { start: startDate, end: endDate },
            focusAreas,
            sessions
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </PageShell>
  );
};

// Session Builder Component
const SessionBuilder = ({
  session,
  sessionIndex,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onAddDrill,
  onRemoveDrill,
  onUpdateDrill,
  onMoveDrill,
  onShowTemplates,
  canRemove,
  errors
}) => {
  const totalDrillTime = session.drills.reduce((sum, d) => sum + (d.duration || 0), 0);

  return (
    <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl overflow-hidden">
      {/* Session Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[#F5F9F5]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#005028] rounded-lg flex items-center justify-center text-white font-bold">
            {session.sessionNumber}
          </div>
          <div className="text-left">
            <h3 className="text-gray-800 font-semibold">{session.name || `Session ${session.sessionNumber}`}</h3>
            <p className="text-[#6B7C6B] text-sm">
              {session.date || 'No date set'} • {session.drills.length} drills • {totalDrillTime} mins
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#00A651]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#00A651]" />
          )}
        </div>
      </button>

      {/* Session Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Session Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#00A651] text-xs font-medium mb-1">Session Name</label>
              <input
                type="text"
                value={session.name}
                onChange={(e) => onUpdate('name', e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#00A651] text-xs font-medium mb-1">Date *</label>
              <input
                type="date"
                value={session.date}
                onChange={(e) => onUpdate('date', e.target.value)}
                className={`w-full px-3 py-2 bg-[#F5F9F5] border rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none ${
                  errors[`session_${sessionIndex}_date`] ? 'border-red-500' : 'border-[#D4E4D4]'
                }`}
              />
            </div>
            <div>
              <label className="block text-[#00A651] text-xs font-medium mb-1">Duration (mins)</label>
              <input
                type="number"
                value={session.duration}
                onChange={(e) => onUpdate('duration', parseInt(e.target.value) || 0)}
                min="15"
                max="180"
                className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none"
              />
            </div>
          </div>

          {/* Warm-up */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#00A651] text-xs font-medium">Warm-up Activities</label>
              <button
                onClick={() => onShowTemplates('warmup')}
                className="text-[#00A651] text-xs hover:text-gray-800 transition-colors"
              >
                Use Template
              </button>
            </div>
            <textarea
              value={session.warmUp}
              onChange={(e) => onUpdate('warmUp', e.target.value)}
              placeholder="Describe warm-up activities..."
              rows={2}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none resize-none"
            />
          </div>

          {/* Drills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[#00A651] text-xs font-medium">
                Skill Drills ({session.drills.length})
              </label>
              <button
                onClick={onAddDrill}
                className="flex items-center gap-1 px-2 py-1 bg-[#005028] text-white rounded-lg text-xs font-medium hover:bg-[#00A651] transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Drill
              </button>
            </div>

            {session.drills.length === 0 ? (
              <div className={`p-4 border-2 border-dashed rounded-xl text-center ${
                errors[`session_${sessionIndex}_drills`] ? 'border-red-500 bg-red-500/10' : 'border-[#D4E4D4]'
              }`}>
                <p className="text-[#6B7C6B] text-sm">No drills added yet</p>
                <button
                  onClick={onAddDrill}
                  className="mt-2 text-[#00A651] text-sm font-medium hover:text-gray-800 transition-colors"
                >
                  Browse Drill Library
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {session.drills.map((drill, drillIndex) => (
                  <div
                    key={drill.id}
                    className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => onMoveDrill(drillIndex, -1)}
                          disabled={drillIndex === 0}
                          className="p-1 text-[#6B7C6B] hover:text-gray-800 disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onMoveDrill(drillIndex, 1)}
                          disabled={drillIndex === session.drills.length - 1}
                          className="p-1 text-[#6B7C6B] hover:text-gray-800 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-800 font-medium text-sm">{drill.name}</span>
                          <span className="px-2 py-0.5 bg-[#005028]/20 text-[#00A651] text-[10px] rounded-full">
                            {SKILL_CATEGORIES.find(s => s.id === drill.skillFocus)?.name}
                          </span>
                        </div>
                        <p className="text-[#6B7C6B] text-xs line-clamp-2">{drill.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[#00A651]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {drill.duration} mins
                          </span>
                          {drill.equipment && (
                            <span className="text-[#6B7C6B]">{drill.equipment}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveDrill(drillIndex)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Small-Sided Games */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#00A651] text-xs font-medium">Small-Sided Games (Optional)</label>
              <button
                onClick={() => onShowTemplates('game')}
                className="text-[#00A651] text-xs hover:text-gray-800 transition-colors"
              >
                Use Template
              </button>
            </div>
            <textarea
              value={session.smallSidedGames}
              onChange={(e) => onUpdate('smallSidedGames', e.target.value)}
              placeholder="Describe any game-like activities..."
              rows={2}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none resize-none"
            />
          </div>

          {/* Cool-down */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#00A651] text-xs font-medium">Cool-down Activities</label>
              <button
                onClick={() => onShowTemplates('cooldown')}
                className="text-[#00A651] text-xs hover:text-gray-800 transition-colors"
              >
                Use Template
              </button>
            </div>
            <textarea
              value={session.coolDown}
              onChange={(e) => onUpdate('coolDown', e.target.value)}
              placeholder="Describe cool-down activities..."
              rows={2}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#00A651] text-xs font-medium mb-1">Coach Notes</label>
            <textarea
              value={session.notes}
              onChange={(e) => onUpdate('notes', e.target.value)}
              placeholder="Any additional notes for this session..."
              rows={2}
              className="w-full px-3 py-2 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-gray-800 text-sm focus:border-[#00A651] focus:outline-none resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Drill Library Modal
const DrillLibraryModal = ({
  drills,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onSelectDrill,
  onClose,
  ageGroup
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-2xl max-h-[90vh] bg-white border-2 border-[#D4E4D4] rounded-t-3xl sm:rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#F5F9F5] border-b border-[#D4E4D4] p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Drill Library</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651] transition-colors"
            >
              <X className="w-5 h-5 text-gray-800" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search drills..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => onCategoryChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#005028] text-white'
                  : 'bg-white border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
              }`}
            >
              All
            </button>
            {SKILL_CATEGORIES.map(skill => (
              <button
                key={skill.id}
                onClick={() => onCategoryChange(skill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === skill.id
                    ? 'bg-[#005028] text-white'
                    : 'bg-white border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>

        {/* Drill List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4 space-y-3">
          {drills.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
              <p className="text-[#6B7C6B]">No drills found matching your criteria</p>
            </div>
          ) : (
            drills.map(drill => (
              <button
                key={drill.id}
                onClick={() => onSelectDrill(drill)}
                className="w-full text-left bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4 hover:border-[#00A651] transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-gray-800 font-semibold">{drill.name}</span>
                      <span className="px-2 py-0.5 bg-[#005028]/20 text-[#00A651] text-[10px] rounded-full">
                        {SKILL_CATEGORIES.find(s => s.id === drill.skillFocus)?.name}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                        drill.difficulty === 'beginner' ? 'bg-blue-500/20 text-blue-300' :
                        drill.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {drill.difficulty}
                      </span>
                    </div>
                    <p className="text-[#6B7C6B] text-sm line-clamp-2 mb-2">{drill.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[#00A651] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {drill.duration} mins
                      </span>
                      <span className="text-[#6B7C6B]">{drill.equipment?.join(', ') || 'No equipment'}</span>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-[#6B7C6B] group-hover:text-[#00A651] transition-colors flex-shrink-0 ml-2" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Templates Modal
const TemplatesModal = ({ type, onSelect, onClose }) => {
  const templates = type === 'warmup' ? WARMUP_TEMPLATES :
                    type === 'cooldown' ? COOLDOWN_TEMPLATES :
                    SMALL_SIDED_GAMES;

  const title = type === 'warmup' ? 'Warm-up Templates' :
                type === 'cooldown' ? 'Cool-down Templates' :
                'Small-Sided Game Templates';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white border-2 border-[#D4E4D4] rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#D4E4D4]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651] transition-colors"
            >
              <X className="w-4 h-4 text-gray-800" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="w-full text-left bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-3 hover:border-[#00A651] transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-800 font-medium text-sm">{template.name}</span>
                <span className="text-[#00A651] text-xs">{template.duration} mins</span>
              </div>
              <p className="text-[#6B7C6B] text-xs">{template.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Preview Modal
const PreviewModal = ({ plan, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-2xl max-h-[95vh] bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#F5F9F5] p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{plan.name || 'Untitled Plan'}</h2>
              <p className="text-[#00A651] text-sm">
                {plan.team} • {plan.ageGroup} • {plan.sessions.length} session(s)
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651] transition-colors"
            >
              <X className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)] p-6 bg-white">
          {/* Plan Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Training Plan Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date Range:</span>
                <p className="text-gray-800 font-medium">
                  {plan.dateRange?.start ? new Date(plan.dateRange.start).toLocaleDateString() : '-'}
                  {plan.dateRange?.end && ` - ${new Date(plan.dateRange.end).toLocaleDateString()}`}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Focus Areas:</span>
                <p className="text-gray-800 font-medium">
                  {plan.focusAreas?.map(id => SKILL_CATEGORIES.find(s => s.id === id)?.name).join(', ') || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Sessions */}
          {plan.sessions.map((session, index) => (
            <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#005028] rounded-lg flex items-center justify-center text-white font-bold">
                  {session.sessionNumber}
                </div>
                <div>
                  <h4 className="text-gray-800 font-bold">{session.name}</h4>
                  <p className="text-gray-500 text-sm">
                    {session.date ? new Date(session.date).toLocaleDateString() : 'No date'} • {session.duration} mins
                  </p>
                </div>
              </div>

              {session.warmUp && (
                <div className="mb-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Warm-up</h5>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{session.warmUp}</p>
                </div>
              )}

              {session.drills.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Drills</h5>
                  <div className="space-y-2">
                    {session.drills.map((drill, di) => (
                      <div key={di} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 text-sm">{drill.name}</span>
                          <span className="text-gray-500 text-xs">{drill.duration} mins</span>
                        </div>
                        <p className="text-gray-600 text-xs">{drill.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.smallSidedGames && (
                <div className="mb-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Games</h5>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{session.smallSidedGames}</p>
                </div>
              )}

              {session.coolDown && (
                <div className="mb-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-1">Cool-down</h5>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{session.coolDown}</p>
                </div>
              )}

              {session.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h5 className="text-sm font-semibold text-yellow-800 mb-1">Coach Notes</h5>
                  <p className="text-yellow-700 text-sm whitespace-pre-wrap">{session.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainingPlanBuilderPage;
