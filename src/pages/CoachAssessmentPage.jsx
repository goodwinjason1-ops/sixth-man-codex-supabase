import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  ArrowLeft,
  ClipboardCheck,
  User,
  ChevronRight,
  ChevronDown,
  CircleDot,
  Target,
  Crosshair,
  Footprints,
  Shield,
  Move,
  Users,
  Brain,
  Save,
  Check,
  X,
  MessageSquare,
  Loader2,
  AlertCircle,
  Calendar,
  Wifi,
  WifiOff,
  CloudOff,
  RefreshCw,
  Home,
  FileText,
  Trash2,
  Download,
  Info
} from 'lucide-react';
import { SkillBenchmarkButton } from '../components/SkillBenchmarkView';
import { getAgeGroupFromTeam } from '../data/skillBenchmarks';
import Breadcrumb from '../components/Breadcrumb';

// Sample teams data - will connect to Firestore later
const sampleTeamsData = [
  { id: 'u10-green', name: 'U10 Green', ageGroup: 'U10' },
  { id: 'u12-emerald', name: 'U12 Emerald', ageGroup: 'U12' },
  { id: 'u14-lakers', name: 'U14 Lakers', ageGroup: 'U14' },
  { id: 'u16-senior', name: 'U16 Senior', ageGroup: 'U16' }
];

// Sample players data - will connect to Firestore later
const samplePlayersData = {
  'u10-green': [
    { id: 'p1', name: 'Emma Wilson', number: 5 },
    { id: 'p2', name: 'Jack Thompson', number: 8 },
    { id: 'p3', name: 'Olivia Brown', number: 12 },
    { id: 'p4', name: 'Noah Davis', number: 3 },
    { id: 'p5', name: 'Ava Martinez', number: 7 }
  ],
  'u12-emerald': [
    { id: 'p6', name: 'Liam Johnson', number: 11 },
    { id: 'p7', name: 'Sophia Garcia', number: 22 },
    { id: 'p8', name: 'Mason Lee', number: 4 },
    { id: 'p9', name: 'Isabella Clark', number: 15 },
    { id: 'p10', name: 'Ethan White', number: 9 }
  ],
  'u14-lakers': [
    { id: 'p11', name: 'Mia Robinson', number: 23 },
    { id: 'p12', name: 'Lucas Hall', number: 10 },
    { id: 'p13', name: 'Charlotte Young', number: 6 },
    { id: 'p14', name: 'Aiden King', number: 14 },
    { id: 'p15', name: 'Amelia Wright', number: 21 }
  ],
  'u16-senior': [
    { id: 'p16', name: 'James Scott', number: 33 },
    { id: 'p17', name: 'Harper Adams', number: 1 },
    { id: 'p18', name: 'Benjamin Turner', number: 24 },
    { id: 'p19', name: 'Evelyn Hill', number: 13 },
    { id: 'p20', name: 'Alexander Green', number: 30 }
  ]
};

// Skills categories
const skillCategories = [
  { id: 'ball-handling', name: 'Ball Handling', icon: CircleDot },
  { id: 'passing-receiving', name: 'Passing & Receiving', icon: Target },
  { id: 'shooting', name: 'Shooting', icon: Crosshair },
  { id: 'footwork', name: 'Footwork', icon: Footprints },
  { id: 'defense', name: 'Defense', icon: Shield },
  { id: 'off-ball-movement', name: 'Off-Ball Movement', icon: Move },
  { id: 'team-play', name: 'Team Play', icon: Users },
  { id: 'basketball-iq', name: 'Basketball IQ', icon: Brain }
];

// Assessment types
const assessmentTypes = [
  { id: 'start_season', label: 'Start of Season', description: 'Initial baseline assessment' },
  { id: 'mid_season', label: 'Mid-Season', description: 'Progress check' },
  { id: 'end_season', label: 'End of Season', description: 'Final evaluation' }
];

const levelLabels = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Confident Leader'
};

const levelColors = {
  1: 'bg-[#1a8a68]',
  2: 'bg-[#22c55e]',
  3: 'bg-[#4ade80]',
  4: 'bg-[#86efac]'
};

const CoachAssessmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile, currentUser } = useAuth();
  const { addDocument, deleteDocument, isOnline, pendingSync } = useData();
  const tabsContainerRef = useRef(null);
  const draftIdFromUrl = searchParams.get('draftId');

  // Get coach's teams (sample data for now)
  const coachTeams = useMemo(() => {
    return sampleTeamsData;
  }, []);

  const hasMultipleTeams = coachTeams.length > 1;

  // State
  const [activeTeamId, setActiveTeamId] = useState(coachTeams[0]?.id || '');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [assessmentType, setAssessmentType] = useState('mid_season');
  const [assessments, setAssessments] = useState({});
  const [skillNotes, setSkillNotes] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [sessionNotes, setSessionNotes] = useState('');

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  // Draft states
  const [existingDraft, setExistingDraft] = useState(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);

  // Get players for active team
  const teamPlayers = useMemo(() => {
    return samplePlayersData[activeTeamId] || [];
  }, [activeTeamId]);

  // Get active team info
  const activeTeam = useMemo(() => {
    return coachTeams.find(t => t.id === activeTeamId);
  }, [coachTeams, activeTeamId]);

  // Check for existing draft when player is selected
  const checkForDraft = useCallback(async (playerId) => {
    if (!currentUser || !playerId) return;

    setLoadingDraft(true);
    try {
      // Check localStorage for drafts (works offline)
      const draftKey = `assessment_draft_${currentUser.uid}_${playerId}`;
      const savedDraft = localStorage.getItem(draftKey);

      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setExistingDraft(draft);
        setShowDraftBanner(true);
      } else {
        setExistingDraft(null);
        setShowDraftBanner(false);
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    } finally {
      setLoadingDraft(false);
    }
  }, [currentUser]);

  // Reset form
  const resetForm = () => {
    setAssessments({});
    setSkillNotes({});
    setExpandedNotes({});
    setSessionNotes('');
    setSaveError(null);
    setExistingDraft(null);
    setShowDraftBanner(false);
    setSavedOffline(false);
  };

  // Handle team tab click
  const handleTeamChange = (teamId) => {
    setActiveTeamId(teamId);
    setSelectedPlayer(null);
    resetForm();
  };

  // Handle player selection
  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    resetForm();
    checkForDraft(player.id);
  };

  // Load draft into form
  const handleLoadDraft = () => {
    if (!existingDraft) return;

    setAssessments(existingDraft.assessments || {});
    setSkillNotes(existingDraft.skillNotes || {});
    setSessionNotes(existingDraft.sessionNotes || '');
    setAssessmentType(existingDraft.assessmentType || 'mid_season');
    setShowDraftBanner(false);
  };

  // Discard draft
  const handleDiscardDraft = () => {
    if (!currentUser || !selectedPlayer) return;

    const draftKey = `assessment_draft_${currentUser.uid}_${selectedPlayer.id}`;
    localStorage.removeItem(draftKey);
    setExistingDraft(null);
    setShowDraftBanner(false);
  };

  // Handle skill note change
  const handleSkillNoteChange = (skillId, note) => {
    setSkillNotes(prev => ({
      ...prev,
      [skillId]: note
    }));
  };

  // Toggle skill notes expansion
  const toggleNoteExpansion = (skillId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [skillId]: !prev[skillId]
    }));
  };

  // Handle skill level change
  const handleSkillChange = (skillId, level) => {
    setAssessments(prev => ({
      ...prev,
      [skillId]: level
    }));
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!selectedPlayer || !currentUser) return;

    setIsSavingDraft(true);
    setSaveError(null);

    try {
      const draftData = {
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        teamId: activeTeamId,
        coachId: currentUser.uid,
        assessmentType,
        assessments,
        skillNotes,
        sessionNotes,
        savedAt: new Date().toISOString(),
        lastModified: Date.now()
      };

      // Save to localStorage (works offline)
      const draftKey = `assessment_draft_${currentUser.uid}_${selectedPlayer.id}`;
      localStorage.setItem(draftKey, JSON.stringify(draftData));

      // Also save to Firestore if online (for cross-device access)
      if (isOnline) {
        await addDocument('assessment_drafts', {
          ...draftData,
          createdAt: new Date()
        });
      }

      setExistingDraft(draftData);

      // Show brief confirmation
      setSavedOffline(true);
      setTimeout(() => setSavedOffline(false), 2000);

    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveError('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle save assessment
  const handleSaveAssessment = async () => {
    if (!selectedPlayer || !currentUser) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Build skills data with levels and individual notes
      const skillsData = {};
      skillCategories.forEach(skill => {
        skillsData[skill.id] = {
          level: assessments[skill.id] || 0,
          notes: skillNotes[skill.id] || ''
        };
      });

      // Create evaluation document
      const evaluationData = {
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        coachId: currentUser.uid,
        coachName: userProfile?.displayName || 'Unknown Coach',
        teamId: activeTeamId,
        teamName: activeTeam?.name,
        ageGroup: activeTeam?.ageGroup,
        date: new Date(),
        assessmentType: assessmentType,
        skills: skillsData,
        generalNotes: sessionNotes,
        createdAt: new Date(),
        savedOffline: !isOnline
      };

      // Save to Firestore (queued if offline)
      await addDocument('evaluations', evaluationData);

      // Delete draft if exists
      const draftKey = `assessment_draft_${currentUser.uid}_${selectedPlayer.id}`;
      localStorage.removeItem(draftKey);

      // Track if saved offline
      setSavedOffline(!isOnline);

      // Show success modal
      setShowPostSaveModal(true);

    } catch (error) {
      console.error('Error saving assessment:', error);
      setSaveError(error.message || 'Failed to save assessment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Post-save actions
  const handleSaveAndNew = () => {
    setShowPostSaveModal(false);
    setSelectedPlayer(null);
    resetForm();
    window.scrollTo(0, 0);
  };

  const handleReturnToDashboard = () => {
    setShowPostSaveModal(false);
    navigate('/coach');
  };

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (tabsContainerRef.current && activeTeamId) {
      const activeTab = tabsContainerRef.current.querySelector(`[data-team-id="${activeTeamId}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTeamId]);

  // Load draft from URL parameter
  useEffect(() => {
    if (draftIdFromUrl && currentUser) {
      try {
        const draftData = localStorage.getItem(draftIdFromUrl);
        if (draftData) {
          const draft = JSON.parse(draftData);

          // Set the team
          if (draft.teamId) {
            setActiveTeamId(draft.teamId);
          }

          // Find and select the player
          const allPlayers = Object.values(samplePlayersData).flat();
          const player = allPlayers.find(p => p.id === draft.playerId);
          if (player) {
            setSelectedPlayer(player);
          }

          // Load draft data into form
          setAssessments(draft.assessments || {});
          setSkillNotes(draft.skillNotes || {});
          setSessionNotes(draft.sessionNotes || '');
          setAssessmentType(draft.assessmentType || 'mid_season');

          // Hide the draft banner since we're auto-loading
          setShowDraftBanner(false);
          setExistingDraft(draft);

          // Clear the URL parameter to prevent reloading
          navigate('/coach-assessment', { replace: true });
        }
      } catch (error) {
        console.error('Error loading draft from URL:', error);
      }
    }
  }, [draftIdFromUrl, currentUser, navigate]);

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Header */}
      <div className="bg-[#0d5943] border-b border-[#1a8a68] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Coach Dashboard', url: '/coach' },
              { label: 'Skills Assessment' }
            ]}
            className="mb-3"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0a3d2e] border-2 border-[#1a8a68] rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-[#4ade80]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Skills Assessment</h1>
                <p className="text-[#4ade80] text-sm">
                  {userProfile?.displayName || 'Coach'}
                </p>
              </div>
            </div>

            {/* Online/Offline Indicator with Sync Status */}
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isOnline
                  ? 'bg-[#065f46] text-[#4ade80] border border-[#22c55e]'
                  : 'bg-yellow-900/50 text-yellow-400 border border-yellow-600'
              }`}>
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
              </div>
              {pendingSync > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-yellow-400">
                  <CloudOff className="w-3 h-3" />
                  <span>{pendingSync} pending sync</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Tabs - Only show if multiple teams */}
        {hasMultipleTeams ? (
          <div className="border-t border-[#1a8a68]">
            <div
              ref={tabsContainerRef}
              className="flex overflow-x-auto hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {coachTeams.map((team) => (
                <button
                  key={team.id}
                  data-team-id={team.id}
                  onClick={() => handleTeamChange(team.id)}
                  className={`flex-shrink-0 px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                    activeTeamId === team.id
                      ? 'bg-[#065f46] text-white border-[#4ade80]'
                      : 'bg-[#0d5943] text-[#4ade80] border-transparent hover:bg-[#0a4a38] hover:text-white'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-[#1a8a68] px-4 py-3 bg-[#065f46]">
            <p className="text-white font-medium">{activeTeam?.name || 'Team'}</p>
            <p className="text-[#4ade80] text-xs">{activeTeam?.ageGroup} Division</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!selectedPlayer ? (
          /* Player Selection */
          <div>
            <div className="mb-4">
              <h2 className="text-white font-semibold mb-1">Select Player to Assess</h2>
              <p className="text-[#1a8a68] text-sm">{teamPlayers.length} players in {activeTeam?.name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamPlayers.map((player) => {
                // Check if player has a draft
                const draftKey = `assessment_draft_${currentUser?.uid}_${player.id}`;
                const hasDraft = localStorage.getItem(draftKey) !== null;

                return (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player)}
                    className="w-full text-left bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 transition-all duration-200 hover:border-[#22c55e] hover:bg-[#0f6b52] active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center group-hover:border-[#22c55e] transition-colors">
                        <span className="text-white font-bold text-lg">#{player.number}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{player.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-[#4ade80] text-xs">Tap to assess</p>
                          {hasDraft && (
                            <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#1a8a68] group-hover:text-[#4ade80] group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Assessment Form */
          <div>
            {/* Draft Banner */}
            {showDraftBanner && existingDraft && (
              <div className="bg-yellow-900/30 border-2 border-yellow-600 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-yellow-400 font-semibold text-sm">Unfinished Assessment Found</h3>
                    <p className="text-yellow-300/80 text-xs mt-1">
                      You have a draft from {new Date(existingDraft.savedAt).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleLoadDraft}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Load Draft
                      </button>
                      <button
                        onClick={handleDiscardDraft}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-yellow-600 hover:bg-yellow-600/20 text-yellow-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Discard
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDraftBanner(false)}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Player Header */}
            <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-[#0a3d2e] border-2 border-[#1a8a68] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">#{selectedPlayer.number}</span>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">{selectedPlayer.name}</h2>
                    <p className="text-[#4ade80] text-sm">{activeTeam?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-full flex items-center justify-center hover:bg-[#1a8a68] transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Assessment Type Selector */}
            <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 mb-6">
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4ade80]" />
                Assessment Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {assessmentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAssessmentType(type.id)}
                    className={`py-3 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      assessmentType === type.id
                        ? 'bg-[#22c55e] text-[#0a3d2e]'
                        : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] hover:border-[#22c55e] hover:text-[#22c55e]'
                    }`}
                  >
                    <div className="text-center">
                      <div className={assessmentType === type.id ? 'text-[#0a3d2e]' : 'text-white'}>
                        {type.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Skills Assessment */}
            <div className="mb-4">
              <h3 className="text-white font-semibold mb-1">Skill Levels</h3>
              <p className="text-[#1a8a68] text-sm">Tap to set level (1-4)</p>
            </div>

            <div className="space-y-3 mb-6">
              {skillCategories.map((skill) => {
                const Icon = skill.icon;
                const currentLevel = assessments[skill.id] || 0;
                const isExpanded = expandedNotes[skill.id] || false;
                const hasNote = skillNotes[skill.id]?.length > 0;

                return (
                  <div
                    key={skill.id}
                    className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#4ade80]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-medium text-sm">{skill.name}</h4>
                          <SkillBenchmarkButton
                            skillId={skill.id}
                            skillName={skill.name}
                            ageGroupId={activeTeam?.ageGroup?.toLowerCase() || 'u10'}
                            currentLevel={currentLevel}
                          />
                        </div>
                        <p className="text-[#4ade80] text-xs">
                          {currentLevel > 0 ? levelLabels[currentLevel] : 'Not assessed'}
                        </p>
                      </div>
                    </div>

                    {/* Level Buttons */}
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleSkillChange(skill.id, level)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            currentLevel === level
                              ? `${levelColors[level]} text-[#0a3d2e]`
                              : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] hover:border-[#22c55e] hover:text-[#22c55e]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>

                    {/* Add Note Toggle Button */}
                    <button
                      onClick={() => toggleNoteExpansion(skill.id)}
                      className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        hasNote
                          ? 'bg-[#0a3d2e] border border-[#22c55e] text-[#4ade80]'
                          : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] hover:border-[#22c55e] hover:text-[#22c55e]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{hasNote ? 'Edit Note' : 'Add Note'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Collapsible Notes Text Area */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-32 mt-3 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <textarea
                        value={skillNotes[skill.id] || ''}
                        onChange={(e) => handleSkillNoteChange(skill.id, e.target.value)}
                        placeholder={`Notes for ${skill.name}... (optional)`}
                        rows={2}
                        className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General Session Notes */}
            <div className="mb-6 bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#4ade80]" />
                General Session Notes
              </label>
              <p className="text-[#1a8a68] text-xs mb-3">Overall observations for this assessment session</p>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Add general notes about this assessment session... (optional)"
                rows={3}
                className="w-full px-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none resize-none"
              />
            </div>

            {/* Error Message */}
            {saveError && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{saveError}</p>
              </div>
            )}

            {/* Save Buttons */}
            <div className="space-y-3">
              {/* Save Assessment Button */}
              <button
                onClick={handleSaveAssessment}
                disabled={isSaving}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  isSaving
                    ? 'bg-[#1a8a68] text-white opacity-75 cursor-not-allowed'
                    : 'bg-[#1a8a68] hover:bg-[#22c55e] text-white active:scale-[0.98]'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    Save Assessment
                  </>
                )}
              </button>

              {/* Save as Draft Button */}
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isSavingDraft
                    ? 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] cursor-not-allowed'
                    : 'bg-[#0a3d2e] border border-[#1a8a68] text-white hover:border-[#22c55e] hover:text-[#4ade80] active:scale-[0.98]'
                }`}
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Draft...
                  </>
                ) : savedOffline && !showPostSaveModal ? (
                  <>
                    <Check className="w-4 h-4 text-[#4ade80]" />
                    Draft Saved!
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Save as Draft
                  </>
                )}
              </button>
            </div>

            {!isOnline && (
              <p className="text-center text-yellow-400 text-xs mt-3">
                You're offline. Assessment will sync when connection is restored.
              </p>
            )}

            {/* Level Legend */}
            <div className="mt-6 bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4">
              <h4 className="text-white font-medium text-sm mb-3">Level Guide</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[1, 2, 3, 4].map((level) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded ${levelColors[level]} flex items-center justify-center text-[#0a3d2e] font-bold`}>
                      {level}
                    </div>
                    <span className="text-white">{levelLabels[level]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#1a8a68]">
        <p className="text-[#1a8a68] text-xs">Emerald Lakers Skills Assessment</p>
      </footer>

      {/* Post-Save Success Modal */}
      {showPostSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl w-full max-w-md p-6 shadow-2xl"
            style={{ animation: 'fadeIn 0.2s ease-out, scaleIn 0.2s ease-out' }}
          >
            {/* Success Icon */}
            <div className="w-16 h-16 bg-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-2">
              Assessment Saved!
            </h2>
            <p className="text-[#4ade80] text-center text-sm mb-2">
              {selectedPlayer?.name}'s assessment has been recorded.
            </p>
            {savedOffline && (
              <p className="text-yellow-400 text-center text-xs mb-4">
                Saved locally. Will sync when online.
              </p>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <button
                onClick={handleSaveAndNew}
                className="w-full py-3 bg-[#1a8a68] hover:bg-[#22c55e] text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Assess Another Player
              </button>
              <button
                onClick={handleReturnToDashboard}
                className="w-full py-3 bg-[#0a3d2e] border border-[#1a8a68] hover:border-[#22c55e] text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachAssessmentPage;
