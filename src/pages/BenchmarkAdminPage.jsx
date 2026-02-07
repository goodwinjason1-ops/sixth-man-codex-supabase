import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  ArrowLeft,
  Settings,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Download,
  Database,
  Upload
} from 'lucide-react';
import {
  AGE_GROUPS,
  SKILL_CATEGORIES,
  LEVEL_LABELS,
  DEFAULT_BENCHMARKS
} from '../data/skillBenchmarks';
import Breadcrumb from '../components/Breadcrumb';

const levelColors = {
  1: 'bg-[#1a8a68]',
  2: 'bg-[#22c55e]',
  3: 'bg-[#4ade80]',
  4: 'bg-[#86efac]'
};

const BenchmarkAdminPage = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  const { setDocument, updateDocument, fetchDocument, isOnline } = useData();

  // Selection state
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(AGE_GROUPS[0].id);
  const [selectedSkill, setSelectedSkill] = useState(SKILL_CATEGORIES[0].id);

  // Benchmark data state
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Expanded levels for accordion
  const [expandedLevels, setExpandedLevels] = useState({ 1: true });

  // Seeding state
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState({ current: 0, total: 0 });
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  // Get document ID for current selection
  const getDocId = useCallback(() => {
    return `${selectedAgeGroup}_${selectedSkill}`;
  }, [selectedAgeGroup, selectedSkill]);

  // Load benchmark data when selection changes
  const loadBenchmark = useCallback(async () => {
    setLoading(true);
    setError(null);
    const docId = getDocId();

    try {
      // Try to fetch from Firestore
      let data = null;
      if (fetchDocument) {
        try {
          data = await fetchDocument('skill_benchmarks', docId);
        } catch (err) {
          console.log('No Firestore data, using default:', err);
        }
      }

      // Fall back to default data
      if (!data) {
        data = DEFAULT_BENCHMARKS[docId] || {
          ageGroupId: selectedAgeGroup,
          ageGroupName: AGE_GROUPS.find(g => g.id === selectedAgeGroup)?.name,
          skillId: selectedSkill,
          skillName: SKILL_CATEGORIES.find(s => s.id === selectedSkill)?.name,
          levels: {
            1: { label: LEVEL_LABELS[1], criteria: [] },
            2: { label: LEVEL_LABELS[2], criteria: [] },
            3: { label: LEVEL_LABELS[3], criteria: [] },
            4: { label: LEVEL_LABELS[4], criteria: [] }
          }
        };
      }

      setBenchmarkData(data);
      setOriginalData(JSON.stringify(data));
      setHasChanges(false);
    } catch (err) {
      console.error('Error loading benchmark:', err);
      setError('Failed to load benchmark data');
    } finally {
      setLoading(false);
    }
  }, [getDocId, fetchDocument, selectedAgeGroup, selectedSkill]);

  useEffect(() => {
    loadBenchmark();
  }, [loadBenchmark]);

  // Check for changes
  useEffect(() => {
    if (benchmarkData && originalData) {
      setHasChanges(JSON.stringify(benchmarkData) !== originalData);
    }
  }, [benchmarkData, originalData]);

  // Toggle level expansion
  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  // Handle criterion change
  const handleCriterionChange = (level, index, value) => {
    setBenchmarkData(prev => {
      const newData = { ...prev };
      newData.levels = { ...newData.levels };
      newData.levels[level] = { ...newData.levels[level] };
      newData.levels[level].criteria = [...newData.levels[level].criteria];
      newData.levels[level].criteria[index] = value;
      return newData;
    });
  };

  // Add new criterion
  const handleAddCriterion = (level) => {
    setBenchmarkData(prev => {
      const newData = { ...prev };
      newData.levels = { ...newData.levels };
      newData.levels[level] = { ...newData.levels[level] };
      newData.levels[level].criteria = [...(newData.levels[level].criteria || []), ''];
      return newData;
    });
    // Expand the level if not already
    setExpandedLevels(prev => ({ ...prev, [level]: true }));
  };

  // Remove criterion
  const handleRemoveCriterion = (level, index) => {
    setBenchmarkData(prev => {
      const newData = { ...prev };
      newData.levels = { ...newData.levels };
      newData.levels[level] = { ...newData.levels[level] };
      newData.levels[level].criteria = newData.levels[level].criteria.filter((_, i) => i !== index);
      return newData;
    });
  };

  // Save benchmark
  const handleSave = async () => {
    if (!benchmarkData || !currentUser) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const docId = getDocId();
      const dataToSave = {
        ...benchmarkData,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser.uid,
        updatedByName: userProfile?.displayName || 'Admin'
      };

      // Save to Firestore using setDocument (creates or updates)
      await setDocument('skill_benchmarks', docId, dataToSave);

      setOriginalData(JSON.stringify(dataToSave));
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving benchmark:', err);
      setError('Failed to save benchmark. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleResetToDefaults = () => {
    const docId = getDocId();
    const defaultData = DEFAULT_BENCHMARKS[docId];
    if (defaultData) {
      setBenchmarkData({ ...defaultData });
    }
  };

  // Seed all benchmarks to Firestore
  const handleSeedAllBenchmarks = async () => {
    if (!currentUser || !isOnline) return;

    setSeeding(true);
    setShowSeedConfirm(false);
    setError(null);

    const allDocIds = Object.keys(DEFAULT_BENCHMARKS);
    setSeedProgress({ current: 0, total: allDocIds.length });

    try {
      for (let i = 0; i < allDocIds.length; i++) {
        const docId = allDocIds[i];
        const benchmarkToSave = {
          ...DEFAULT_BENCHMARKS[docId],
          lastUpdated: new Date().toISOString(),
          updatedBy: currentUser.uid,
          updatedByName: userProfile?.displayName || 'Admin',
          seeded: true
        };

        await setDocument('skill_benchmarks', docId, benchmarkToSave);
        setSeedProgress({ current: i + 1, total: allDocIds.length });
      }

      // Reload current benchmark after seeding
      await loadBenchmark();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error seeding benchmarks:', err);
      setError('Failed to seed benchmarks. Please try again.');
    } finally {
      setSeeding(false);
      setSeedProgress({ current: 0, total: 0 });
    }
  };

  // Get current skill and age group names
  const currentSkillName = SKILL_CATEGORIES.find(s => s.id === selectedSkill)?.name;
  const currentAgeGroupName = AGE_GROUPS.find(g => g.id === selectedAgeGroup)?.name;

  return (
    <div className="min-h-screen bg-[#0a3d2e]">
      {/* Header */}
      <div className="bg-[#0d5943] border-b border-[#1a8a68] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Admin Dashboard', url: '/admin' },
              { label: 'Manage Benchmarks' }
            ]}
            className="mb-3"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0a3d2e] border-2 border-[#1a8a68] rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-[#4ade80]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Benchmark Editor</h1>
                <p className="text-[#4ade80] text-sm">Manage skill criteria by age group</p>
              </div>
            </div>

            {/* Online Status */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              isOnline
                ? 'bg-[#065f46] text-[#4ade80] border border-[#22c55e]'
                : 'bg-yellow-900/50 text-yellow-400 border border-yellow-600'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Selection Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Age Group Selector */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Age Group</label>
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d5943] border border-[#1a8a68] rounded-xl text-white focus:border-[#22c55e] focus:outline-none appearance-none cursor-pointer"
            >
              {AGE_GROUPS.map(group => (
                <option key={group.id} value={group.id} className="bg-[#0d5943]">
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Selector */}
          <div>
            <label className="block text-white font-medium text-sm mb-2">Skill Category</label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d5943] border border-[#1a8a68] rounded-xl text-white focus:border-[#22c55e] focus:outline-none appearance-none cursor-pointer"
            >
              {SKILL_CATEGORIES.map(skill => (
                <option key={skill.id} value={skill.id} className="bg-[#0d5943]">
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="bg-[#0d5943] border border-[#1a8a68] rounded-xl p-4 mb-6">
          <h2 className="text-white font-semibold">
            Editing: {currentSkillName}
          </h2>
          <p className="text-[#4ade80] text-sm">
            {currentAgeGroupName} ({selectedAgeGroup.toUpperCase()})
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
          </div>
        ) : (
          /* Level Editors */
          <div className="space-y-4 mb-6">
            {[1, 2, 3, 4].map((level) => {
              const levelData = benchmarkData?.levels?.[level] || {
                label: LEVEL_LABELS[level],
                criteria: []
              };
              const isExpanded = expandedLevels[level];
              const criteriaCount = levelData.criteria?.length || 0;

              return (
                <div
                  key={level}
                  className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden"
                >
                  {/* Level Header */}
                  <button
                    onClick={() => toggleLevel(level)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#0a4a38] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${levelColors[level]} flex items-center justify-center`}>
                        <span className="text-[#0a3d2e] font-bold">{level}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-white font-medium">
                          Level {level}: {levelData.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#1a8a68] text-sm">
                        {criteriaCount} {criteriaCount === 1 ? 'criterion' : 'criteria'}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[#4ade80]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[#1a8a68]" />
                      )}
                    </div>
                  </button>

                  {/* Criteria Editor */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[#1a8a68] pt-4">
                      {levelData.criteria?.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={criterion}
                              onChange={(e) => handleCriterionChange(level, idx, e.target.value)}
                              placeholder={`Criterion ${idx + 1}...`}
                              className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white text-sm placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveCriterion(level, idx)}
                            className="w-8 h-8 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center justify-center hover:bg-red-900/50 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}

                      {/* Add Criterion Button */}
                      <button
                        onClick={() => handleAddCriterion(level)}
                        className="w-full py-2 border-2 border-dashed border-[#1a8a68] rounded-lg text-[#4ade80] text-sm font-medium hover:border-[#22c55e] hover:bg-[#0a3d2e] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Criterion
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              saving
                ? 'bg-[#1a8a68] text-white opacity-75 cursor-not-allowed'
                : hasChanges
                  ? 'bg-[#1a8a68] hover:bg-[#22c55e] text-white'
                  : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleResetToDefaults}
              className="py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white font-medium text-sm hover:border-[#22c55e] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <button
              onClick={loadBenchmark}
              disabled={loading}
              className="py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white font-medium text-sm hover:border-[#22c55e] transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Reload Data
            </button>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-xl">
            <p className="text-yellow-400 text-sm text-center">
              You have unsaved changes
            </p>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mt-8">
          <h3 className="text-white font-medium mb-3">Quick Navigation</h3>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedAgeGroup(group.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedAgeGroup === group.id
                    ? 'bg-[#22c55e] text-[#0a3d2e]'
                    : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#4ade80] hover:border-[#22c55e]'
                }`}
              >
                {group.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Seed All Benchmarks Section */}
        <div className="mt-8 p-4 bg-[#0d5943] border border-[#1a8a68] rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-[#4ade80]" />
            <h3 className="text-white font-medium">Initialize All Benchmarks</h3>
          </div>
          <p className="text-[#1a8a68] text-sm mb-4">
            Seed all {Object.keys(DEFAULT_BENCHMARKS).length} benchmark documents to Firestore with default criteria.
            This will create/update all age group × skill combinations.
          </p>
          {seeding ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white">Seeding benchmarks...</span>
                <span className="text-[#4ade80]">
                  {seedProgress.current} / {seedProgress.total}
                </span>
              </div>
              <div className="w-full bg-[#0a3d2e] rounded-full h-2">
                <div
                  className="bg-[#4ade80] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(seedProgress.current / seedProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSeedConfirm(true)}
              disabled={!isOnline}
              className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                isOnline
                  ? 'bg-[#0a3d2e] border border-[#1a8a68] text-white hover:border-[#22c55e] hover:text-[#4ade80]'
                  : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              Seed All Benchmarks to Firestore
            </button>
          )}
          {!isOnline && (
            <p className="text-yellow-400 text-xs mt-2 text-center">
              Must be online to seed benchmarks
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-[#1a8a68]">
        <p className="text-[#1a8a68] text-xs">Emerald Lakers Benchmark Administration</p>
      </footer>

      {/* Seed Confirmation Modal */}
      {showSeedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Confirm Seed Operation</h3>
                <p className="text-[#1a8a68] text-sm">This will overwrite existing data</p>
              </div>
            </div>

            <p className="text-white/80 text-sm mb-6">
              This will create or update <strong className="text-[#4ade80]">{Object.keys(DEFAULT_BENCHMARKS).length} benchmark documents</strong> in
              Firestore with the default criteria. Any custom criteria you've added will be replaced with defaults.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSeedConfirm(false)}
                className="flex-1 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white font-medium hover:border-[#22c55e] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSeedAllBenchmarks}
                className="flex-1 py-3 bg-[#22c55e] rounded-xl text-[#0a3d2e] font-semibold hover:bg-[#4ade80] transition-colors"
              >
                Seed All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkAdminPage;
