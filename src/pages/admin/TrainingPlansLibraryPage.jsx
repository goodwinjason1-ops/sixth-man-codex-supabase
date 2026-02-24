import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  User,
  Dumbbell,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Copy,
  Star,
  AlertCircle,
  ChevronDown,
  Shield,
  Award,
  TrendingUp,
  BookOpen,
  Trash2,
  Plus
} from 'lucide-react';
import PageShell from '../../components/PageShell';

// Parse Firestore Timestamps or ISO strings safely
const parseDate = (val) => {
  if (!val) return null;
  if (val.toDate) return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const TrainingPlansLibraryPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { trainingPlans, teams, updateDocument, addDocument, deleteDocument, setDocument } = useData();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const ageGroups = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'];

  // Split plans into sections
  const templates = useMemo(() => {
    return (trainingPlans || []).filter(p => p.isTemplate || (p.id && p.id.startsWith('template_')));
  }, [trainingPlans]);

  const sharedPlans = useMemo(() => {
    return (trainingPlans || []).filter(p => p.isShared && !p.isTemplate && !(p.id && p.id.startsWith('template_')));
  }, [trainingPlans]);

  const coachPlans = useMemo(() => {
    return (trainingPlans || []).filter(p => !p.isTemplate && !(p.id && p.id.startsWith('template_')) && !p.isShared);
  }, [trainingPlans]);

  // Combined for stats and filtering
  const plans = useMemo(() => [...templates, ...sharedPlans, ...coachPlans], [templates, sharedPlans, coachPlans]);

  // Build coach list dynamically from unique coaches in plans
  const coaches = useMemo(() => {
    const coachMap = new Map();
    plans.forEach(p => {
      const coachKey = p.coachName || p.createdBy || 'Unknown Coach';
      if (!coachMap.has(coachKey)) {
        coachMap.set(coachKey, { id: coachKey, name: coachKey });
      }
    });
    return Array.from(coachMap.values());
  }, [plans]);

  // Compute session and drill counts from plan data
  const getSessionCount = (plan) => plan.sessions?.length || 0;
  const getTotalDrills = (plan) => {
    if (!plan.sessions || !Array.isArray(plan.sessions)) return 0;
    return plan.sessions.reduce((total, session) => {
      if (session.drills && Array.isArray(session.drills)) {
        return total + session.drills.length;
      }
      return total;
    }, 0);
  };

  // Filter plans
  const filteredPlans = useMemo(() => {
    let result = [...coachPlans];

    // Filter by coach
    if (selectedCoach !== 'all') {
      result = result.filter(p => (p.coachName || p.createdBy || 'Unknown Coach') === selectedCoach);
    }

    // Filter by age group
    if (selectedAgeGroup !== 'all') {
      result = result.filter(p => p.ageGroup === selectedAgeGroup);
    }

    // Filter by approval status
    if (selectedApprovalStatus !== 'all') {
      result = result.filter(p => p.approvalStatus === selectedApprovalStatus);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(query) ||
        (p.coachName || '').toLowerCase().includes(query) ||
        (p.teamName || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      );
    }

    // Sort: pending first, then by date
    result.sort((a, b) => {
      if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
      if (b.approvalStatus === 'pending' && a.approvalStatus !== 'pending') return 1;
      const dateA = parseDate(a.updatedAt);
      const dateB = parseDate(b.updatedAt);
      return (dateB || 0) - (dateA || 0);
    });

    return result;
  }, [coachPlans, selectedCoach, selectedAgeGroup, selectedApprovalStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: plans.length,
    templates: templates.length,
    shared: sharedPlans.length,
    pending: coachPlans.filter(p => p.approvalStatus === 'pending').length,
    approved: coachPlans.filter(p => p.approvalStatus === 'approved').length,
    rejected: coachPlans.filter(p => p.approvalStatus === 'rejected').length,
    totalCoaches: coaches.length
  }), [plans, templates, sharedPlans, coachPlans, coaches]);

  // Format date
  const formatDate = (dateValue) => {
    const d = parseDate(dateValue);
    if (!d) return '-';
    return d.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get approval status badge
  const getApprovalBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-[#005028]/20 text-[#00A651] border-[#00A651]';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  // Handle approval
  const handleApprove = async (planId) => {
    await updateDocument('training_plans', planId, {
      approvalStatus: 'approved',
      approvedBy: currentUser?.displayName || 'Admin',
      approvedAt: new Date().toISOString()
    });
    setShowApprovalModal(null);
  };

  // Handle rejection
  const handleReject = async (planId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    await updateDocument('training_plans', planId, {
      approvalStatus: 'rejected',
      approvedBy: currentUser?.displayName || 'Admin',
      approvedAt: new Date().toISOString(),
      rejectionReason
    });
    setShowApprovalModal(null);
    setRejectionReason('');
  };

  // Handle copy to library — uses a deterministic ID to prevent duplicates
  const handleCopyToLibrary = async (plan) => {
    const { id, ...planData } = plan;
    const templateId = `template_promoted_${id}`;
    await setDocument('training_plans', templateId, {
      ...planData,
      isTemplate: true,
      isShared: false,
      copiedFrom: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    alert(`"${plan.name}" has been added to the club template library.`);
  };

  // Handle delete template
  const handleDeleteTemplate = async (planId) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    await deleteDocument('training_plans', planId);
  };

  return (
    <PageShell
      title="Training Plans Library"
      subtitle="Review and approve coach training plans"
      backTo="/welcome"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Training Plans Library' }
      ]}
      maxWidth="6xl"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border-2 border-[#005028]/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#005028]">{stats.templates}</p>
            <p className="text-[#6B7C6B] text-xs">Templates</p>
          </div>
          <div className="bg-white border-2 border-blue-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.shared}</p>
            <p className="text-[#6B7C6B] text-xs">Shared Plans</p>
          </div>
          <div className="bg-white border-2 border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-[#6B7C6B] text-xs">Pending Review</p>
          </div>
          <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-[#6B7C6B] text-xs">Total Plans</p>
          </div>
        </div>

        {/* Pending Approval Alert */}
        {stats.pending > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-medium">
                {stats.pending} training plan{stats.pending !== 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-gray-500 text-sm">
                Please review and approve or request revisions for pending plans.
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Search plans by name, coach, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[#00A651] text-sm hover:text-gray-800 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#D4E4D4] grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Coach Filter */}
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-2">Coach</label>
                <select
                  value={selectedCoach}
                  onChange={(e) => setSelectedCoach(e.target.value)}
                  className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2 text-gray-800 focus:border-[#00A651] focus:outline-none"
                >
                  <option value="all">All Coaches</option>
                  {coaches.map(coach => (
                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                  ))}
                </select>
              </div>

              {/* Age Group Filter */}
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-2">Age Group</label>
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2 text-gray-800 focus:border-[#00A651] focus:outline-none"
                >
                  <option value="all">All Age Groups</option>
                  {ageGroups.map(ag => (
                    <option key={ag} value={ag}>{ag}</option>
                  ))}
                </select>
              </div>

              {/* Approval Status Filter */}
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-2">Approval Status</label>
                <select
                  value={selectedApprovalStatus}
                  onChange={(e) => setSelectedApprovalStatus(e.target.value)}
                  className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg px-3 py-2 text-gray-800 focus:border-[#00A651] focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Needs Revision</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* System Templates Section */}
        {templates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-800 font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#005028]" />
                System Templates ({templates.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(plan => (
                <div key={plan.id} className={`bg-white border-2 rounded-xl p-4 ${plan.id?.startsWith('template_') ? 'border-[#005028]/20' : 'border-amber-400/40'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-gray-800 font-bold text-sm">{plan.name || 'Untitled Template'}</h4>
                      <p className="text-[#6B7C6B] text-[10px] font-mono mt-0.5">{plan.id}</p>
                      {!plan.id?.startsWith('template_') && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-medium">
                          Copy (not a system template)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(plan.id)}
                      className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mb-2 line-clamp-2">{plan.description || ''}</p>
                  {plan.focusAreas && plan.focusAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.focusAreas.map((area, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#005028]/10 text-[#00A651] text-[10px] rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Plans Section */}
        {sharedPlans.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-gray-800 font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Shared by Coaches ({sharedPlans.length})
            </h3>
            <div className="space-y-3">
              {sharedPlans.map(plan => (
                <div key={plan.id} className="bg-white border-2 border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-gray-800 font-bold text-sm">{plan.name || 'Untitled Plan'}</h4>
                      <p className="text-[#6B7C6B] text-xs">by {plan.coachName || plan.createdBy || 'Unknown Coach'}</p>
                    </div>
                    <button
                      onClick={() => handleCopyToLibrary(plan)}
                      className="flex items-center gap-1 px-2 py-1 bg-[#005028]/10 text-[#00A651] text-xs rounded-lg hover:bg-[#005028]/20 transition-colors"
                    >
                      <Copy size={12} />
                      Promote to Template
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs line-clamp-2">{plan.description || ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach Plans for Review */}
        <h3 className="text-gray-800 font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#6B7C6B]" />
          Coach Plans for Review ({coachPlans.length})
        </h3>

        {/* Plans List */}
        {filteredPlans.length === 0 ? (
          <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
            <h3 className="text-gray-800 font-semibold mb-2">No Training Plans Found</h3>
            <p className="text-[#6B7C6B] text-sm">
              {coachPlans.length === 0
                ? 'No coach training plans have been submitted yet. Plans will appear here when coaches create and submit them.'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map(plan => (
              <div
                key={plan.id}
                className={`bg-white border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${
                  plan.approvalStatus === 'pending'
                    ? 'border-yellow-500/50'
                    : 'border-[#D4E4D4] hover:border-[#00A651]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Plan Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-gray-800 font-bold text-lg">{plan.name || 'Untitled Plan'}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getApprovalBadge(plan.approvalStatus)}`}>
                        {plan.approvalStatus === 'pending' ? 'Pending Review' :
                         plan.approvalStatus === 'approved' ? 'Approved' : 'Needs Revision'}
                      </span>
                      {plan.rating && (
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Star className="w-4 h-4 fill-current" />
                          {plan.rating}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{plan.description || ''}</p>

                    <div className="flex items-center gap-4 text-sm text-[#6B7C6B] mb-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {plan.coachName || plan.createdBy || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {plan.teamName || 'No Team'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(plan.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-4 h-4" />
                        {getSessionCount(plan)} sessions • {getTotalDrills(plan)} drills
                      </span>
                    </div>

                    {/* Focus Areas */}
                    {plan.focusAreas && plan.focusAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {plan.focusAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-[#005028]/20 text-[#00A651] text-xs rounded-full"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {plan.approvalStatus === 'rejected' && plan.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">
                          <strong>Revision needed:</strong> {plan.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>

                    {plan.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(plan.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#005028] hover:bg-gray-100 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => setShowApprovalModal(plan)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Request Revision
                        </button>
                      </>
                    )}

                    {plan.approvalStatus === 'approved' && (
                      <button
                        onClick={() => handleCopyToLibrary(plan)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Add to Templates
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-[#D4E4D4]/50 flex items-center justify-between text-xs text-[#6B7C6B]">
                  <span>Created {formatDate(plan.createdAt)}</span>
                  {plan.usageCount > 0 && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Used {plan.usageCount} time{plan.usageCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPlan(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-white border-2 border-[#D4E4D4] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedPlan.name || 'Untitled Plan'}</h2>

            <div className="space-y-4">
              <div>
                <p className="text-[#6B7C6B] text-sm mb-1">Description</p>
                <p className="text-gray-800">{selectedPlan.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#6B7C6B] text-sm mb-1">Coach</p>
                  <p className="text-gray-800">{selectedPlan.coachName || selectedPlan.createdBy || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[#6B7C6B] text-sm mb-1">Team</p>
                  <p className="text-gray-800">{selectedPlan.teamName || 'No Team'}</p>
                </div>
                <div>
                  <p className="text-[#6B7C6B] text-sm mb-1">Age Group</p>
                  <p className="text-gray-800">{selectedPlan.ageGroup || '-'}</p>
                </div>
                <div>
                  <p className="text-[#6B7C6B] text-sm mb-1">Sessions & Drills</p>
                  <p className="text-gray-800">{getSessionCount(selectedPlan)} sessions • {getTotalDrills(selectedPlan)} drills</p>
                </div>
              </div>

              {selectedPlan.focusAreas && selectedPlan.focusAreas.length > 0 && (
                <div>
                  <p className="text-[#6B7C6B] text-sm mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlan.focusAreas.map((area, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#005028]/20 text-[#00A651] rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlan.approvalStatus === 'approved' && selectedPlan.approvedAt && (
                <div className="p-3 bg-[#005028]/10 border border-[#00A651]/30 rounded-lg">
                  <p className="text-[#00A651] text-sm">
                    Approved by {selectedPlan.approvedBy} on {formatDate(selectedPlan.approvedAt)}
                  </p>
                </div>
              )}

              {selectedPlan.approvalStatus === 'rejected' && selectedPlan.rejectionReason && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    <strong>Revision needed:</strong> {selectedPlan.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-800 font-medium transition-colors"
              >
                Close
              </button>
              {selectedPlan.approvalStatus === 'pending' && (
                <button
                  onClick={() => {
                    handleApprove(selectedPlan.id);
                    setSelectedPlan(null);
                  }}
                  className="flex-1 py-3 bg-[#005028] hover:bg-gray-100 rounded-xl text-white font-medium transition-colors"
                >
                  Approve Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowApprovalModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-white border-2 border-[#D4E4D4] rounded-2xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Request Revision</h3>
            <p className="text-gray-600 text-sm mb-4">
              Please provide feedback for Coach {showApprovalModal.coachName || showApprovalModal.createdBy || 'Unknown'} on what needs to be revised:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter revision feedback..."
              rows={4}
              className="w-full bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(null);
                  setRejectionReason('');
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showApprovalModal.id)}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-medium transition-colors"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default TrainingPlansLibraryPage;
