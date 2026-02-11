import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Target,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Users,
  Shield,
  Crosshair,
  Brain,
  Award,
  Eye
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import { MATCH_METRICS, MATCH_AGE_GROUPS } from '../../data/matchBenchmarks';
import { subscribeToMetrics, updateMetricsForAgeGroup } from '../../services/metricsService';
import { logActivity } from '../../services/auditService';

// Available icons for metrics
const AVAILABLE_ICONS = [
  { id: 'Users', label: 'Team', component: Users },
  { id: 'Shield', label: 'Defense', component: Shield },
  { id: 'Target', label: 'Target', component: Target },
  { id: 'Crosshair', label: 'Crosshair', component: Crosshair },
  { id: 'Brain', label: 'Brain', component: Brain },
  { id: 'Award', label: 'Award', component: Award }
];

const ICON_MAP = {
  Users, Shield, Target, Crosshair, Brain, Award
};

const AssessmentMetricsPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(MATCH_AGE_GROUPS[0].id);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingMetricId, setEditingMetricId] = useState(null);

  // Subscribe to metrics for selected age group
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToMetrics(selectedAgeGroup, (data) => {
      if (data && data.metrics) {
        setMetrics(data.metrics.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      } else {
        // Fallback to defaults
        setMetrics(MATCH_METRICS.map((m, i) => ({
          id: m.id,
          name: m.name,
          icon: m.icon,
          description: m.description,
          order: i
        })));
      }
      setIsLoading(false);
      setHasChanges(false);
    });
    return () => unsubscribe();
  }, [selectedAgeGroup]);

  // Move metric up
  const moveUp = (index) => {
    if (index === 0) return;
    const newMetrics = [...metrics];
    [newMetrics[index - 1], newMetrics[index]] = [newMetrics[index], newMetrics[index - 1]];
    newMetrics.forEach((m, i) => m.order = i);
    setMetrics(newMetrics);
    setHasChanges(true);
  };

  // Move metric down
  const moveDown = (index) => {
    if (index === metrics.length - 1) return;
    const newMetrics = [...metrics];
    [newMetrics[index], newMetrics[index + 1]] = [newMetrics[index + 1], newMetrics[index]];
    newMetrics.forEach((m, i) => m.order = i);
    setMetrics(newMetrics);
    setHasChanges(true);
  };

  // Update metric field
  const updateMetric = (index, field, value) => {
    const newMetrics = [...metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setMetrics(newMetrics);
    setHasChanges(true);
  };

  // Add new metric
  const addMetric = () => {
    const newId = `custom_${Date.now()}`;
    setMetrics([...metrics, {
      id: newId,
      name: 'New Metric',
      icon: 'Target',
      description: 'Description of the metric',
      order: metrics.length
    }]);
    setEditingMetricId(newId);
    setHasChanges(true);
  };

  // Delete metric
  const deleteMetric = (index) => {
    const newMetrics = metrics.filter((_, i) => i !== index);
    newMetrics.forEach((m, i) => m.order = i);
    setMetrics(newMetrics);
    setHasChanges(true);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setMetrics(MATCH_METRICS.map((m, i) => ({
      id: m.id,
      name: m.name,
      icon: m.icon,
      description: m.description,
      order: i
    })));
    setHasChanges(true);
  };

  // Save metrics
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateMetricsForAgeGroup(selectedAgeGroup, metrics, currentUser?.uid);

      logActivity(
        { uid: currentUser?.uid, displayName: userProfile?.displayName, role: userProfile?.role },
        'metrics.updated',
        `Updated assessment metrics for ${MATCH_AGE_GROUPS.find(a => a.id === selectedAgeGroup)?.name}`,
        { ageGroupId: selectedAgeGroup, metricCount: metrics.length }
      );

      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell
      title="Match Assessment Metrics"
      subtitle="Configure assessment criteria by age group"
      backTo="/admin"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Admin', url: '/admin' },
        { label: 'Assessment Metrics' }
      ]}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Age Group Tabs */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-2">
          <div className="flex overflow-x-auto gap-1" style={{ scrollbarWidth: 'none' }}>
            {MATCH_AGE_GROUPS.map(ag => (
              <button
                key={ag.id}
                onClick={() => { setSelectedAgeGroup(ag.id); setEditingMetricId(null); }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedAgeGroup === ag.id
                    ? 'bg-[#22c55e] text-[#0a3d2e]'
                    : 'text-white hover:bg-[#0a3d2e]'
                }`}
              >
                {ag.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccess && (
          <div className="bg-[#22c55e]/20 border border-[#22c55e] rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
            <p className="text-[#4ade80] text-sm">Metrics saved successfully</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin" />
          </div>
        )}

        {/* Metrics List */}
        {!isLoading && (
          <div className="space-y-3">
            {metrics.map((metric, index) => {
              const IconComponent = ICON_MAP[metric.icon] || Target;
              const isEditing = editingMetricId === metric.id;

              return (
                <div key={metric.id} className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded transition-colors ${index === 0 ? 'text-[#1a8a68]/30' : 'text-[#1a8a68] hover:text-[#4ade80] hover:bg-[#0a3d2e]'}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === metrics.length - 1}
                        className={`p-1 rounded transition-colors ${index === metrics.length - 1 ? 'text-[#1a8a68]/30' : 'text-[#1a8a68] hover:text-[#4ade80] hover:bg-[#0a3d2e]'}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Icon */}
                    <div className="w-10 h-10 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-[#4ade80]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={metric.name}
                            onChange={(e) => updateMetric(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none text-sm"
                            placeholder="Metric name"
                          />
                          <input
                            type="text"
                            value={metric.description}
                            onChange={(e) => updateMetric(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-[#0a3d2e] border border-[#1a8a68] rounded-lg text-white focus:border-[#22c55e] focus:outline-none text-sm"
                            placeholder="Description"
                          />
                          <div>
                            <label className="block text-[#1a8a68] text-xs mb-1">Icon</label>
                            <div className="flex gap-2">
                              {AVAILABLE_ICONS.map(icon => {
                                const Ico = icon.component;
                                return (
                                  <button
                                    key={icon.id}
                                    type="button"
                                    onClick={() => updateMetric(index, 'icon', icon.id)}
                                    className={`p-2 rounded-lg transition-all ${
                                      metric.icon === icon.id
                                        ? 'bg-[#22c55e] text-[#0a3d2e]'
                                        : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] hover:border-[#22c55e]'
                                    }`}
                                    title={icon.label}
                                  >
                                    <Ico className="w-4 h-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingMetricId(null)}
                            className="text-[#4ade80] text-xs font-medium hover:text-white"
                          >
                            Done Editing
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-white font-medium text-sm">{metric.name}</h4>
                          <p className="text-[#1a8a68] text-xs mt-0.5">{metric.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      {!isEditing && (
                        <button
                          onClick={() => setEditingMetricId(metric.id)}
                          className="p-2 text-[#4ade80] hover:bg-[#22c55e]/20 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMetric(index)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Metric Button */}
            <button
              onClick={addMetric}
              className="w-full py-3 border-2 border-dashed border-[#1a8a68] rounded-xl text-[#1a8a68] hover:border-[#22c55e] hover:text-[#4ade80] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Metric
            </button>
          </div>
        )}

        {/* Preview Panel */}
        {!isLoading && metrics.length > 0 && (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4">
            <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#4ade80]" />
              Preview - How metrics appear during assessment
            </h3>
            <div className="space-y-2">
              {metrics.slice(0, 3).map(metric => {
                const Ico = ICON_MAP[metric.icon] || Target;
                return (
                  <div key={metric.id} className="bg-[#0a3d2e] border border-[#1a8a68] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Ico className="w-4 h-4 text-[#4ade80]" />
                      <span className="text-white text-xs font-medium">{metric.name}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div key={level} className="flex-1 py-1.5 rounded text-xs font-medium text-center bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68]">
                          {level}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {metrics.length > 3 && (
                <p className="text-[#1a8a68] text-xs text-center">+ {metrics.length - 3} more metrics</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isLoading && (
          <div className="flex gap-3">
            <button
              onClick={resetToDefaults}
              className="flex-1 py-3 bg-[#0a3d2e] border border-[#1a8a68] text-white rounded-xl font-medium hover:border-[#22c55e] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                hasChanges && !isSaving
                  ? 'bg-[#22c55e] text-[#0a3d2e] hover:bg-[#4ade80]'
                  : 'bg-[#0a3d2e] border border-[#1a8a68] text-[#1a8a68] cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Metrics
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <footer className="py-4 text-center border-t border-[#1a8a68]">
        <p className="text-[#1a8a68] text-xs">Emerald Lakers Assessment Configuration</p>
      </footer>
    </PageShell>
  );
};

export default AssessmentMetricsPage;
