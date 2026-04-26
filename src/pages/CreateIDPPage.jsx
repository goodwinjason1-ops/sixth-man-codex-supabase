import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/PageShell';
import {
  Target,
  Plus,
  Trash2,
  Save,
  Loader2,
  ChevronDown,
  Search,
  X,
  CheckCircle,
  BookOpen,
  Home as HomeIcon,
  AlertCircle
} from 'lucide-react';
import { SKILL_CATEGORIES } from '../data/idpConstants';
import HelpTooltip from '../components/tutorial/HelpTooltip';
import { fetchDrills } from '../services/drillService';
import { buildDevelopmentPlanPayload } from '../services/idpService';

const levelLabels = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Confident Leader'
};

const levelColors = {
  1: 'bg-[#D4E4D4]',
  2: 'bg-[#005028]',
  3: 'bg-[#00A651]',
  4: 'bg-[#86efac]'
};

const levelTextColors = {
  1: 'text-gray-800',
  2: 'text-white',
  3: 'text-white',
  4: 'text-gray-800'
};

const getCurrentSeason = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // Apr-Sep = Winter (southern hemisphere), Oct-Mar = Summer
  if (month >= 3 && month <= 8) {
    return `${year}-Winter`;
  }
  return `${year}-Summer`;
};

const emptyGoal = () => ({
  id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  skillCategory: '',
  currentLevel: 0,
  targetLevel: 0,
  specificTarget: '',
  drillsRecommended: [],
  drillSearchQuery: '',
  homePractice: '',
  status: 'not_started',
  coachNotes: ''
});

const CreateIDPPage = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { players, evaluations, teams, addDocument } = useData();
  const { currentUser, userProfile } = useAuth();

  // Baseline assessment state
  const [baselineSkills, setBaselineSkills] = useState({});
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [hasExistingAssessment, setHasExistingAssessment] = useState(false);

  // Goals state
  const [goals, setGoals] = useState([]);

  // Parent sharing
  const [parentVisible, setParentVisible] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Drill library
  const [allDrills, setAllDrills] = useState([]);
  const [drillsLoaded, setDrillsLoaded] = useState(false);

  // Find player
  const player = useMemo(() => {
    return players.find(p => p.id === playerId) || null;
  }, [players, playerId]);

  // Find player's team
  const playerTeam = useMemo(() => {
    if (!player) return null;
    const teamId = player.teamId || player.team;
    return teams.find(t => t.id === teamId || t.name === player.teamName) || null;
  }, [player, teams]);

  const season = getCurrentSeason();

  // Load drills from Firestore
  useEffect(() => {
    const loadDrills = async () => {
      try {
        const data = await fetchDrills();
        setAllDrills(data);
      } catch (err) {
        console.error('Failed to load drills:', err);
      } finally {
        setDrillsLoaded(true);
      }
    };
    loadDrills();
  }, []);

  // Load baseline from existing evaluations
  useEffect(() => {
    if (!playerId || !evaluations) return;

    const playerEvals = {};
    Object.entries(evaluations).forEach(([key, evalData]) => {
      if (evalData.playerId === playerId) {
        const skillId = evalData.skillId;
        if (skillId && evalData.level) {
          // Map evaluation skill IDs (hyphenated) to our IDs (underscored)
          const mappedId = skillId.replace(/-/g, '_');
          // Keep the latest (highest date) evaluation per skill
          if (!playerEvals[mappedId] || (evalData.date && playerEvals[mappedId].date && evalData.date > playerEvals[mappedId].date)) {
            playerEvals[mappedId] = evalData;
          }
        }
      }
    });

    const skills = {};
    let foundAny = false;
    SKILL_CATEGORIES.forEach(cat => {
      // Try both the underscore and hyphen format
      const hyphenId = cat.id.replace(/_/g, '-');
      const evalEntry = playerEvals[cat.id] || playerEvals[hyphenId];
      if (evalEntry && evalEntry.level) {
        skills[cat.id] = evalEntry.level;
        foundAny = true;
      }
    });

    if (foundAny) {
      setBaselineSkills(skills);
      setHasExistingAssessment(true);
      setEditingBaseline(false);
    } else {
      setHasExistingAssessment(false);
      setEditingBaseline(true);
    }
  }, [playerId, evaluations]);

  // Handle baseline skill change
  const handleBaselineSkillChange = (skillId, level) => {
    setBaselineSkills(prev => ({
      ...prev,
      [skillId]: level
    }));
  };

  // Goal management
  const addGoal = () => {
    if (goals.length >= 3) return;
    setGoals(prev => [...prev, emptyGoal()]);
  };

  const removeGoal = (goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const updateGoal = (goalId, field, value) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const updated = { ...g, [field]: value };
      // Auto-fill current level when skill category changes
      if (field === 'skillCategory') {
        updated.currentLevel = baselineSkills[value] || 0;
        updated.targetLevel = 0;
      }
      return updated;
    }));
  };

  // Drill search for a specific goal
  const getFilteredDrills = (query) => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return allDrills
      .filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q) ||
        d.tags?.some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 8);
  };

  const addDrillToGoal = (goalId, drill) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      // Prevent duplicates
      if (g.drillsRecommended.some(d => d.id === drill.id)) return g;
      return {
        ...g,
        drillsRecommended: [...g.drillsRecommended, { id: drill.id, name: drill.name }],
        drillSearchQuery: ''
      };
    }));
  };

  const removeDrillFromGoal = (goalId, drillId) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      return {
        ...g,
        drillsRecommended: g.drillsRecommended.filter(d => d.id !== drillId)
      };
    }));
  };

  // Compute overall level
  const overallLevel = useMemo(() => {
    const values = SKILL_CATEGORIES.map(cat => baselineSkills[cat.id] || 0).filter(v => v > 0);
    if (values.length === 0) return 0;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  }, [baselineSkills]);

  // Validation
  const baselineComplete = SKILL_CATEGORIES.every(cat => baselineSkills[cat.id] > 0);
  const goalsValid = goals.length > 0 && goals.every(g =>
    g.skillCategory &&
    g.targetLevel > 0 &&
    g.specificTarget.trim().length > 0
  );
  const canSave = baselineComplete && goalsValid;

  // Save handler
  const handleSave = async () => {
    if (!canSave || !currentUser || !player) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const data = buildDevelopmentPlanPayload({
        player,
        team: playerTeam,
        coach: currentUser,
        season,
        baselineSkills,
        goals: goals.map(g => ({
          id: g.id,
          skillCategory: g.skillCategory,
          currentLevel: g.currentLevel,
          targetLevel: g.targetLevel,
          specificTarget: g.specificTarget,
          drillsRecommended: g.drillsRecommended,
          homePractice: g.homePractice,
          status: 'not_started',
          coachNotes: g.coachNotes || ''
        })),
        parentVisible
      });

      const result = await addDocument('development_plans', data);
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create plan. Please try again.');
      }
      navigate(`/players/${playerId}/development-plan`);
    } catch (error) {
      console.error('Error creating IDP:', error);
      setSaveError(error.message || 'Failed to create plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (!player) {
    return (
      <PageShell
        title="Create Development Plan"
        backTo={`/players/${playerId}`}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-[#6B7C6B] mb-4" />
          <p className="text-gray-800 font-medium">Player not found</p>
          <p className="text-[#6B7C6B] text-sm mt-1">The player may not exist or data is still loading.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Create Development Plan"
      subtitle={player.name || player.displayName}
      backTo={`/players/${playerId}`}
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Players', url: '/players' },
        { label: player.name || player.displayName || 'Player', url: `/players/${playerId}` },
        { label: 'New IDP' }
      ]}
    >
      <div className="space-y-6">

        {/* A. PLAYER INFO HEADER */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gray-800 font-bold text-lg">
                #{player.number || player.jerseyNumber || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-gray-800 font-bold text-lg truncate">
                {player.name || player.displayName}
              </h2>
              <p className="text-[#00A651] text-sm">
                {playerTeam?.name || player.teamName || 'No team assigned'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="inline-block bg-[#005028] text-white text-xs font-medium px-3 py-1 rounded-full">
                {season}
              </span>
            </div>
          </div>
        </div>

        {/* B. BASELINE ASSESSMENT */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#00A651]" />
              <h3 className="text-gray-800 font-semibold">Baseline Assessment</h3>
            </div>
            {hasExistingAssessment && (
              <button
                onClick={() => setEditingBaseline(!editingBaseline)}
                className="text-xs font-medium text-[#00A651] hover:text-[#005028] transition-colors px-3 py-1 rounded-lg border border-[#D4E4D4] hover:border-[#00A651]"
              >
                {editingBaseline ? 'Done' : 'Edit'}
              </button>
            )}
          </div>

          {hasExistingAssessment && !editingBaseline ? (
            // Read-only display of existing assessment
            <div className="space-y-2">
              <p className="text-[#6B7C6B] text-xs mb-3">Pre-filled from latest skill assessment</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SKILL_CATEGORIES.map(cat => {
                  const level = baselineSkills[cat.id] || 0;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2"
                    >
                      <span className="text-gray-800 text-sm font-medium">{cat.label}</span>
                      {level > 0 ? (
                        <span className={`${levelColors[level]} ${levelTextColors[level]} text-xs font-semibold px-2.5 py-1 rounded-md`}>
                          {level} - {levelLabels[level]}
                        </span>
                      ) : (
                        <span className="text-[#6B7C6B] text-xs">Not assessed</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {overallLevel > 0 && (
                <div className="mt-3 pt-3 border-t border-[#D4E4D4] flex items-center justify-between">
                  <span className="text-[#6B7C6B] text-sm">Overall Level</span>
                  <span className="text-gray-800 font-bold">{overallLevel}</span>
                </div>
              )}
            </div>
          ) : (
            // Editable baseline form
            <div className="space-y-3">
              {!hasExistingAssessment && (
                <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3 mb-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#00A651] flex-shrink-0 mt-0.5" />
                  <p className="text-[#6B7C6B] text-xs">
                    No existing assessment found for this player. Set the baseline skill levels below.
                  </p>
                </div>
              )}
              <p className="text-[#6B7C6B] text-xs">Tap a level (1-4) for each skill</p>
              {SKILL_CATEGORIES.map(cat => {
                const currentLevel = baselineSkills[cat.id] || 0;
                return (
                  <div key={cat.id} className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-800 text-sm font-medium">{cat.label}</span>
                      <span className="text-[#00A651] text-xs">
                        {currentLevel > 0 ? levelLabels[currentLevel] : 'Not set'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(level => (
                        <button
                          key={level}
                          onClick={() => handleBaselineSkillChange(cat.id, level)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            currentLevel === level
                              ? `${levelColors[level]} ${levelTextColors[level]}`
                              : 'bg-white border border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651] hover:text-[#00A651]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {overallLevel > 0 && (
                <div className="pt-3 border-t border-[#D4E4D4] flex items-center justify-between">
                  <span className="text-[#6B7C6B] text-sm">Overall Level</span>
                  <span className="text-gray-800 font-bold">{overallLevel}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* C. GOAL BUILDER */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#00A651]" />
              <h3 className="text-gray-800 font-semibold">Goals</h3>
              <span className="text-[#6B7C6B] text-xs">({goals.length}/3)</span>
            </div>
            {goals.length < 3 && (
              <button
                onClick={addGoal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005028] hover:bg-[#006838] text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Goal
              </button>
            )}
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-10 h-10 text-[#D4E4D4] mx-auto mb-3" />
              <p className="text-[#6B7C6B] text-sm">No goals added yet</p>
              <p className="text-[#6B7C6B] text-xs mt-1">Add up to 3 development goals for this player</p>
              <button
                onClick={addGoal}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[#005028] hover:bg-[#006838] text-white rounded-lg text-sm font-medium transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={index}
                  baselineSkills={baselineSkills}
                  allDrills={allDrills}
                  drillsLoaded={drillsLoaded}
                  onUpdate={updateGoal}
                  onRemove={removeGoal}
                  onAddDrill={addDrillToGoal}
                  onRemoveDrill={removeDrillFromGoal}
                  getFilteredDrills={getFilteredDrills}
                />
              ))}
            </div>
          )}
        </div>

        {/* D. PARENT SHARING */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HomeIcon className="w-5 h-5 text-[#00A651]" />
              <h3 className="text-gray-800 font-semibold">Parent Sharing</h3>
              <HelpTooltip text="When enabled, parents can view this development plan and add encouraging comments." />
            </div>
            <button
              onClick={() => setParentVisible(!parentVisible)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                parentVisible ? 'bg-[#00A651]' : 'bg-[#D4E4D4]'
              }`}
              aria-label="Toggle parent sharing"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  parentVisible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {parentVisible && (
            <div className="mt-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#00A651] flex-shrink-0 mt-0.5" />
              <p className="text-[#6B7C6B] text-sm">
                Parents will be able to view this plan and add encouraging comments.
              </p>
            </div>
          )}
        </div>

        {/* Validation hints */}
        {(!baselineComplete || !goalsValid) && (
          <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-4">
            <h4 className="text-gray-800 text-sm font-medium mb-2">Before you can save:</h4>
            <ul className="space-y-1">
              {!baselineComplete && (
                <li className="flex items-center gap-2 text-xs text-[#6B7C6B]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  Set all 8 baseline skill levels
                </li>
              )}
              {goals.length === 0 && (
                <li className="flex items-center gap-2 text-xs text-[#6B7C6B]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  Add at least one goal
                </li>
              )}
              {goals.length > 0 && !goalsValid && (
                <li className="flex items-center gap-2 text-xs text-[#6B7C6B]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  Complete all goal fields (skill, target level, specific target)
                </li>
              )}
            </ul>
          </div>
        )}

        {/* E. SAVE BUTTON */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{saveError}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            !canSave || isSaving
              ? 'bg-[#D4E4D4] text-[#6B7C6B] cursor-not-allowed'
              : 'bg-[#005028] hover:bg-[#006838] text-white active:scale-[0.98]'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Creating Plan...
            </>
          ) : (
            <>
              <Save className="w-6 h-6" />
              Create Plan
            </>
          )}
        </button>

        {/* Level Legend */}
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-4">
          <h4 className="text-gray-800 font-medium text-sm mb-3">Level Guide</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[1, 2, 3, 4].map(level => (
              <div key={level} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded ${levelColors[level]} flex items-center justify-center ${levelTextColors[level]} font-bold`}>
                  {level}
                </div>
                <span className="text-gray-800">{levelLabels[level]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

/* ------------------------------------------------------------------ */
/* GoalCard sub-component                                              */
/* ------------------------------------------------------------------ */
const GoalCard = ({
  goal,
  index,
  baselineSkills,
  allDrills,
  drillsLoaded,
  onUpdate,
  onRemove,
  onAddDrill,
  onRemoveDrill,
  getFilteredDrills
}) => {
  const [drillSearch, setDrillSearch] = useState('');
  const [showDrillResults, setShowDrillResults] = useState(false);
  const [drillFreeText, setDrillFreeText] = useState('');

  const filteredDrills = useMemo(() => {
    return getFilteredDrills(drillSearch);
  }, [drillSearch, getFilteredDrills]);

  const currentLevel = goal.skillCategory ? (baselineSkills[goal.skillCategory] || 0) : 0;
  const targetOptions = [];
  for (let i = currentLevel + 1; i <= 4; i++) {
    targetOptions.push(i);
  }

  // Handle adding a free-text drill
  const handleAddFreeTextDrill = () => {
    if (!drillFreeText.trim()) return;
    const fakeDrill = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: drillFreeText.trim()
    };
    onAddDrill(goal.id, fakeDrill);
    setDrillFreeText('');
  };

  return (
    <div className="border-2 border-[#D4E4D4] rounded-xl p-4 bg-[#F5F9F5]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-gray-800 font-semibold text-sm">Goal {index + 1}</h4>
        <button
          onClick={() => onRemove(goal.id)}
          className="p-2 text-[#6B7C6B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Remove goal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Skill Category Dropdown */}
      <div className="mb-3">
        <label className="block text-gray-800 text-xs font-medium mb-1">Skill Category</label>
        <div className="relative">
          <select
            value={goal.skillCategory}
            onChange={(e) => onUpdate(goal.id, 'skillCategory', e.target.value)}
            className="w-full appearance-none bg-white border border-[#D4E4D4] rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:border-[#00A651] focus:outline-none pr-8"
          >
            <option value="">Select a skill...</option>
            {SKILL_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#6B7C6B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Current Level (read-only) */}
      {goal.skillCategory && (
        <div className="mb-3">
          <label className="block text-gray-800 text-xs font-medium mb-1">Current Level</label>
          <div className="bg-white border border-[#D4E4D4] rounded-lg px-3 py-2.5 text-sm">
            {currentLevel > 0 ? (
              <span className="flex items-center gap-2">
                <span className={`inline-block w-5 h-5 rounded ${levelColors[currentLevel]} ${levelTextColors[currentLevel]} text-xs font-bold flex items-center justify-center text-center leading-5`}>
                  {currentLevel}
                </span>
                <span className="text-gray-800">{levelLabels[currentLevel]}</span>
              </span>
            ) : (
              <span className="text-[#6B7C6B]">Not assessed</span>
            )}
          </div>
        </div>
      )}

      {/* Target Level Dropdown */}
      {goal.skillCategory && (
        <div className="mb-3">
          <label className="block text-gray-800 text-xs font-medium mb-1">Target Level</label>
          {targetOptions.length > 0 ? (
            <div className="flex gap-2">
              {targetOptions.map(level => (
                <button
                  key={level}
                  onClick={() => onUpdate(goal.id, 'targetLevel', level)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    goal.targetLevel === level
                      ? `${levelColors[level]} ${levelTextColors[level]}`
                      : 'bg-white border border-[#D4E4D4] text-[#6B7C6B] hover:border-[#00A651] hover:text-[#00A651]'
                  }`}
                >
                  {level} - {levelLabels[level]}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[#6B7C6B] text-xs bg-white border border-[#D4E4D4] rounded-lg px-3 py-2.5">
              {currentLevel === 4 ? 'Already at maximum level' : 'Set baseline level first'}
            </p>
          )}
        </div>
      )}

      {/* Specific Target */}
      <div className="mb-3">
        <label className="block text-gray-800 text-xs font-medium mb-1">
          Specific, Measurable Target
        </label>
        <textarea
          value={goal.specificTarget}
          onChange={(e) => onUpdate(goal.id, 'specificTarget', e.target.value)}
          placeholder="e.g., Make 5 out of 10 free throws consistently in practice"
          rows={2}
          className="w-full px-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:border-[#00A651] focus:outline-none resize-none"
        />
      </div>

      {/* Drill Search */}
      <div className="mb-3">
        <label className="block text-gray-800 text-xs font-medium mb-1">
          Recommended Drills
        </label>

        {/* Show already-added drills */}
        {goal.drillsRecommended.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {goal.drillsRecommended.map(drill => (
              <span
                key={drill.id}
                className="inline-flex items-center gap-1 bg-[#005028] text-white text-xs px-2.5 py-1 rounded-full"
              >
                {drill.name}
                <button
                  onClick={() => onRemoveDrill(goal.id, drill.id)}
                  className="hover:text-red-300 transition-colors"
                  aria-label={`Remove ${drill.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Drill search or free text input */}
        {allDrills.length > 0 ? (
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B7C6B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={drillSearch}
              onChange={(e) => {
                setDrillSearch(e.target.value);
                setShowDrillResults(true);
              }}
              onFocus={() => setShowDrillResults(true)}
              onBlur={() => {
                // Delay to allow click on results
                setTimeout(() => setShowDrillResults(false), 200);
              }}
              placeholder="Search drills..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
            {showDrillResults && drillSearch.trim().length >= 2 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#D4E4D4] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredDrills.length > 0 ? (
                  filteredDrills.map(drill => (
                    <button
                      key={drill.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onAddDrill(goal.id, drill);
                        setDrillSearch('');
                        setShowDrillResults(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-[#F5F9F5] transition-colors border-b border-[#D4E4D4] last:border-b-0"
                    >
                      <span className="font-medium">{drill.name}</span>
                      {drill.category && (
                        <span className="text-[#6B7C6B] text-xs ml-2">{drill.category}</span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-[#6B7C6B] text-xs">No drills found</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={drillFreeText}
              onChange={(e) => setDrillFreeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFreeTextDrill();
                }
              }}
              placeholder="Type a drill name and press Enter"
              className="flex-1 px-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
            <button
              onClick={handleAddFreeTextDrill}
              disabled={!drillFreeText.trim()}
              className="px-3 py-2 bg-[#005028] text-white rounded-lg text-sm font-medium hover:bg-[#006838] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Home Practice */}
      <div>
        <label className="block text-gray-800 text-xs font-medium mb-1">
          Home Practice Suggestions
        </label>
        <textarea
          value={goal.homePractice}
          onChange={(e) => onUpdate(goal.id, 'homePractice', e.target.value)}
          placeholder="e.g., Practice form shooting against a wall 10 minutes daily"
          rows={2}
          className="w-full px-3 py-2 bg-white border border-[#D4E4D4] rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:border-[#00A651] focus:outline-none resize-none"
        />
      </div>
    </div>
  );
};

export default CreateIDPPage;
