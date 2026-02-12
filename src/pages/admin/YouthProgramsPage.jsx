import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Users,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Eye,
  UserPlus,
  X,
  Save,
  Star,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Search,
  Baby,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Mail,
  Clipboard
} from 'lucide-react';
import PageShell from '../../components/PageShell';
import {
  createProgram,
  updateProgram,
  deleteProgram,
  subscribePrograms,
  enrollChild,
  removeEnrollment,
  subscribeEnrollments,
  getProgramStats
} from '../../services/youthProgramService';
import { fetchUsersByRole } from '../../services/tryoutService';
import { PROGRAM_TYPES, PROGRAM_CONFIG, MILESTONES } from '../../data/youthPrograms';

const YouthProgramsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [programStats, setProgramStats] = useState(null);
  const [error, setError] = useState(null);
  const [expandedProgram, setExpandedProgram] = useState(null);

  // Subscribe to programs
  useEffect(() => {
    const unsubscribe = subscribePrograms((data) => {
      setPrograms(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to enrollments when a program is selected/expanded
  useEffect(() => {
    if (!expandedProgram) {
      setEnrollments([]);
      return;
    }
    const unsubscribe = subscribeEnrollments(expandedProgram, (data) => {
      setEnrollments(data);
    });
    return () => unsubscribe();
  }, [expandedProgram]);

  // Load stats when program is expanded
  useEffect(() => {
    if (!expandedProgram) {
      setProgramStats(null);
      return;
    }
    const loadStats = async () => {
      const result = await getProgramStats(expandedProgram);
      if (result.success) {
        setProgramStats(result.data);
      }
    };
    loadStats();
  }, [expandedProgram]);

  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Delete this program? This cannot be undone.')) return;
    const result = await deleteProgram(programId);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId) => {
    if (!window.confirm('Remove this child from the program?')) return;
    const result = await removeEnrollment(enrollmentId, expandedProgram);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleToggleExpand = (programId) => {
    setExpandedProgram(expandedProgram === programId ? null : programId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] p-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      title="Youth Programs"
      subtitle="Little Lakers (4-5) & Lakers Ready (6-7)"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Youth Programs' }
      ]}
      maxWidth="6xl"
      headerActions={
        <button
          onClick={() => { setEditingProgram(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Program
        </button>
      }
    >
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Program Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.values(PROGRAM_CONFIG).map(config => {
            const programsOfType = programs.filter(p => p.programType === config.id);
            const activePrograms = programsOfType.filter(p => p.status === 'active');
            const totalEnrolled = programsOfType.reduce((sum, p) => sum + (p.enrolledCount || 0), 0);

            return (
              <div key={config.id} className={`bg-gray-800 border border-gray-700 rounded-xl p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-2xl`}>
                    {config.id === PROGRAM_TYPES.LITTLE_LAKERS ? '🏀' : '🌟'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{config.name}</h3>
                    <p className="text-xs text-gray-400">Ages {config.ageRange} | {config.sessionDuration} min sessions | {config.totalWeeks} weeks</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-800">{programsOfType.length}</p>
                    <p className="text-xs text-gray-400">Total Terms</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400">{activePrograms.length}</p>
                    <p className="text-xs text-gray-400">Active</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-blue-400">{totalEnrolled}</p>
                    <p className="text-xs text-gray-400">Enrolled</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Programs List */}
        {programs.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <Baby className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Programs Yet</h3>
            <p className="text-gray-400 mb-4">Create your first youth program to get started</p>
            <button
              onClick={() => { setEditingProgram(null); setShowCreateModal(true); }}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
            >
              Create Program
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map(program => {
              const config = PROGRAM_CONFIG[program.programType] || PROGRAM_CONFIG[PROGRAM_TYPES.LITTLE_LAKERS];
              const isExpanded = expandedProgram === program.id;

              return (
                <div key={program.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                  {/* Program Row */}
                  <div className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-lg flex-shrink-0`}>
                      {program.programType === PROGRAM_TYPES.LITTLE_LAKERS ? '🏀' : '🌟'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-gray-800 font-semibold">{program.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          program.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' :
                          program.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border-blue-500' :
                          'bg-gray-600/20 text-gray-300 border-gray-500'
                        }`}>
                          {program.status || 'draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{program.enrolledCount || 0} enrolled</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{config.totalWeeks} weeks</span>
                        {program.coachName && <span className="flex items-center gap-1">Coach: {program.coachName}</span>}
                        {program.startDate && <span>Starts: {program.startDate}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {program.status === 'draft' && (
                        <button
                          onClick={() => updateProgram(program.id, { status: 'active' })}
                          className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-600/30"
                        >
                          Activate
                        </button>
                      )}
                      {program.status === 'active' && (
                        <button
                          onClick={() => updateProgram(program.id, { status: 'completed' })}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-600 rounded-lg text-xs font-medium hover:bg-blue-600/30"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingProgram(program); setShowCreateModal(true); }}
                        className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-700 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(program.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleExpand(program.id)}
                        className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-700 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-700 p-4 bg-gray-850">
                      {/* Stats Row */}
                      {programStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-800">{programStats.totalEnrolled}</p>
                            <p className="text-xs text-gray-400">Enrolled</p>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-emerald-400">{programStats.attendanceRate}%</p>
                            <p className="text-xs text-gray-400">Attendance</p>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-blue-400">{programStats.sessionsCompleted}</p>
                            <p className="text-xs text-gray-400">Sessions Done</p>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-yellow-400">{programStats.achievedMilestones}</p>
                            <p className="text-xs text-gray-400">Milestones Achieved</p>
                          </div>
                        </div>
                      )}

                      {/* Enrollments */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-gray-800 font-semibold text-sm">Enrolled Children</h4>
                        <button
                          onClick={() => { setSelectedProgram(program); setShowEnrollModal(true); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-600/30"
                        >
                          <UserPlus className="w-3 h-3" />
                          Enroll Child
                        </button>
                      </div>

                      {enrollments.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm">
                          No children enrolled yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {enrollments.map(enrollment => (
                            <div key={enrollment.id} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-800 text-sm font-bold">
                                  {(enrollment.childName || '?')[0]}
                                </div>
                                <div>
                                  <p className="text-gray-800 text-sm font-medium">{enrollment.childName}</p>
                                  <p className="text-gray-400 text-xs">
                                    Age {enrollment.childAge} | {enrollment.parentName && `Parent: ${enrollment.parentName}`}
                                    {enrollment.parentEmail && ` | ${enrollment.parentEmail}`}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveEnrollment(enrollment.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 rounded"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Coach View Link */}
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <button
                          onClick={() => navigate(`/youth-programs/${program.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-500 hover:to-teal-500 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          Open Coach View
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Create/Edit Program Modal */}
      {showCreateModal && (
        <ProgramModal
          program={editingProgram}
          onClose={() => { setShowCreateModal(false); setEditingProgram(null); }}
          onSave={async (data) => {
            let result;
            if (editingProgram) {
              result = await updateProgram(editingProgram.id, data);
            } else {
              result = await createProgram({ ...data, createdBy: currentUser?.uid });
            }
            if (result.success) {
              setShowCreateModal(false);
              setEditingProgram(null);
            } else {
              setError(result.error);
            }
          }}
        />
      )}

      {/* Enroll Child Modal */}
      {showEnrollModal && selectedProgram && (
        <EnrollModal
          program={selectedProgram}
          onClose={() => { setShowEnrollModal(false); setSelectedProgram(null); }}
          onSave={async (data) => {
            const result = await enrollChild({
              ...data,
              programId: selectedProgram.id,
              programType: selectedProgram.programType
            });
            if (result.success) {
              setShowEnrollModal(false);
              setSelectedProgram(null);
            } else {
              setError(result.error);
            }
          }}
        />
      )}
    </PageShell>
  );
};

// ============================================
// Program Create/Edit Modal
// ============================================
const ProgramModal = ({ program, onClose, onSave }) => {
  const [coaches, setCoaches] = useState([]);
  const [form, setForm] = useState({
    name: program?.name || '',
    programType: program?.programType || PROGRAM_TYPES.LITTLE_LAKERS,
    coachId: program?.coachId || '',
    coachName: program?.coachName || '',
    startDate: program?.startDate || '',
    day: program?.day || '',
    time: program?.time || '',
    venue: program?.venue || '',
    maxCapacity: program?.maxCapacity || 20,
    notes: program?.notes || ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCoaches = async () => {
      const result = await fetchUsersByRole('coach');
      setCoaches(result);
    };
    loadCoaches();
  }, []);

  const config = PROGRAM_CONFIG[form.programType];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{program ? 'Edit Program' : 'Create New Program'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Program Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Program Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(PROGRAM_CONFIG).map(cfg => (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, programType: cfg.id }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    form.programType === cfg.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.id === PROGRAM_TYPES.LITTLE_LAKERS ? '🏀' : '🌟'}</span>
                    <div>
                      <p className="text-gray-800 text-sm font-medium">{cfg.name}</p>
                      <p className="text-gray-400 text-xs">Ages {cfg.ageRange} | {cfg.totalWeeks} weeks</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Program Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={`e.g. ${config.name} Term 1 2026`}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Coach */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Assigned Coach</label>
            <select
              value={form.coachId}
              onChange={e => {
                const coach = coaches.find(c => c.id === e.target.value);
                setForm(f => ({ ...f, coachId: e.target.value, coachName: coach?.displayName || '' }));
              }}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select a coach...</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{c.displayName}{c.teamNames?.length > 0 ? ` (${c.teamNames.join(', ')})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Day of Week</label>
              <select
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select...</option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Max Capacity</label>
              <input
                type="number"
                value={form.maxCapacity}
                onChange={e => setForm(f => ({ ...f, maxCapacity: parseInt(e.target.value) || 20 }))}
                min="1"
                max="50"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Venue</label>
            <input
              type="text"
              value={form.venue}
              onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              placeholder="e.g. Main Stadium Court 2"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Info box */}
          <div className={`p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
            <p className={`text-sm font-medium ${config.textColor}`}>{config.name} Info</p>
            <p className="text-xs text-gray-300 mt-1">
              {config.sessionDuration}-minute sessions | {config.totalWeeks}-week program | {MILESTONES[config.id]?.length || 0} milestones to track
            </p>
            <p className="text-xs text-gray-400 mt-1">{config.description}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : (program ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// Enroll Child Modal
// ============================================
const EnrollModal = ({ program, onClose, onSave }) => {
  const [form, setForm] = useState({
    childName: '',
    childAge: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    medicalNotes: '',
    emergencyContact: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.childName.trim() || !form.childAge) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const config = PROGRAM_CONFIG[program.programType] || PROGRAM_CONFIG[PROGRAM_TYPES.LITTLE_LAKERS];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Enroll Child</h2>
            <p className="text-xs text-gray-400">{program.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Child's Name *</label>
            <input
              type="text"
              value={form.childName}
              onChange={e => setForm(f => ({ ...f, childName: e.target.value }))}
              placeholder="Full name"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Age *</label>
            <select
              value={form.childAge}
              onChange={e => setForm(f => ({ ...f, childAge: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-500 focus:outline-none"
              required
            >
              <option value="">Select age...</option>
              {[3, 4, 5, 6, 7, 8].map(a => (
                <option key={a} value={a}>{a} years old</option>
              ))}
            </select>
            {form.childAge && (parseInt(form.childAge) < config.minAge || parseInt(form.childAge) > config.maxAge) && (
              <p className="text-yellow-400 text-xs mt-1">
                Note: This child is outside the recommended age range ({config.ageRange}) for {config.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Parent/Guardian Name</label>
            <input
              type="text"
              value={form.parentName}
              onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
              placeholder="Parent name"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Parent Email</label>
            <input
              type="email"
              value={form.parentEmail}
              onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))}
              placeholder="parent@email.com"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Parent Phone</label>
            <input
              type="tel"
              value={form.parentPhone}
              onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))}
              placeholder="04XX XXX XXX"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Medical Notes / Allergies</label>
            <textarea
              value={form.medicalNotes}
              onChange={e => setForm(f => ({ ...f, medicalNotes: e.target.value }))}
              placeholder="Any medical conditions, allergies, or special needs..."
              rows={2}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Emergency Contact</label>
            <input
              type="text"
              value={form.emergencyContact}
              onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))}
              placeholder="Name & phone number"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.childName.trim() || !form.childAge}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {saving ? 'Enrolling...' : 'Enroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default YouthProgramsPage;
