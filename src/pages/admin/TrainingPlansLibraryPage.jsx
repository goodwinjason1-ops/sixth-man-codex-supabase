import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  ArrowLeft,
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
  BookOpen
} from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

// Sample training plans from all coaches
const allCoachPlans = [
  {
    id: 'plan-1',
    coachId: 'coach-1',
    coachName: 'Sarah Mitchell',
    teamId: 't1',
    teamName: 'U14 Lakers',
    ageGroup: 'U14',
    name: 'Pre-Season Skills Development',
    description: 'Comprehensive 4-week program focusing on ball handling, shooting mechanics, and defensive positioning.',
    duration: 'weekly',
    dateRange: { start: '2026-02-01', end: '2026-02-28' },
    focusAreas: ['Ball Handling', 'Shooting', 'Defense'],
    sessions: 4,
    totalDrills: 15,
    status: 'active',
    approvalStatus: 'approved',
    approvedBy: 'Admin',
    approvedAt: '2026-01-28T10:00:00Z',
    rating: 4.5,
    usageCount: 3,
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-02-01T14:30:00Z'
  },
  {
    id: 'plan-2',
    coachId: 'coach-2',
    coachName: 'Mike Thompson',
    teamId: 't2',
    teamName: 'U12 Emerald',
    ageGroup: 'U12',
    name: 'Fundamentals Focus Program',
    description: 'Week-long intensive program for younger players focusing on passing, receiving, and footwork basics.',
    duration: 'weekly',
    dateRange: { start: '2026-02-10', end: '2026-02-16' },
    focusAreas: ['Passing', 'Footwork', 'Basketball IQ'],
    sessions: 3,
    totalDrills: 12,
    status: 'active',
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    rating: null,
    usageCount: 0,
    createdAt: '2026-02-05T09:00:00Z',
    updatedAt: '2026-02-05T09:00:00Z'
  },
  {
    id: 'plan-3',
    coachId: 'coach-1',
    coachName: 'Sarah Mitchell',
    teamId: 't1',
    teamName: 'U14 Lakers',
    ageGroup: 'U14',
    name: 'Defense Intensive Workshop',
    description: 'Single-session intensive drill focusing on team defense and individual positioning.',
    duration: 'single',
    dateRange: { start: '2026-02-08', end: '2026-02-08' },
    focusAreas: ['Defense', 'Team Play'],
    sessions: 1,
    totalDrills: 8,
    status: 'draft',
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    rating: null,
    usageCount: 0,
    createdAt: '2026-02-03T16:00:00Z',
    updatedAt: '2026-02-03T16:00:00Z'
  },
  {
    id: 'plan-4',
    coachId: 'coach-3',
    coachName: 'James Wilson',
    teamId: 't3',
    teamName: 'U10 Green',
    ageGroup: 'U10',
    name: 'Fun Fundamentals for Beginners',
    description: 'Engaging program designed to make learning basketball basics enjoyable for young players.',
    duration: 'monthly',
    dateRange: { start: '2026-02-01', end: '2026-02-28' },
    focusAreas: ['Ball Handling', 'Shooting', 'Teamwork'],
    sessions: 8,
    totalDrills: 24,
    status: 'active',
    approvalStatus: 'approved',
    approvedBy: 'Admin',
    approvedAt: '2026-01-30T14:00:00Z',
    rating: 4.8,
    usageCount: 5,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-01T18:00:00Z'
  },
  {
    id: 'plan-5',
    coachId: 'coach-2',
    coachName: 'Mike Thompson',
    teamId: 't4',
    teamName: 'U16 Dragons',
    ageGroup: 'U16',
    name: 'Advanced Shooting Mechanics',
    description: 'Advanced program focusing on shooting form, three-point shooting, and free throw consistency.',
    duration: 'weekly',
    dateRange: { start: '2026-02-15', end: '2026-02-28' },
    focusAreas: ['Shooting', 'Form', 'Mental Focus'],
    sessions: 6,
    totalDrills: 18,
    status: 'active',
    approvalStatus: 'rejected',
    approvedBy: 'Admin',
    approvedAt: '2026-02-01T10:00:00Z',
    rejectionReason: 'Needs age-appropriate modifications for U16 players. Some drills are too basic.',
    rating: null,
    usageCount: 0,
    createdAt: '2026-01-28T11:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'plan-6',
    coachId: 'coach-4',
    coachName: 'Lisa Chen',
    teamId: 't5',
    teamName: 'U14 Gold',
    ageGroup: 'U14',
    name: 'Championship Preparation Plan',
    description: 'Intensive 2-week plan preparing the team for upcoming championship games.',
    duration: 'weekly',
    dateRange: { start: '2026-03-01', end: '2026-03-14' },
    focusAreas: ['Game Strategy', 'Team Play', 'Mental Toughness'],
    sessions: 8,
    totalDrills: 30,
    status: 'draft',
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    rating: null,
    usageCount: 0,
    createdAt: '2026-02-04T09:00:00Z',
    updatedAt: '2026-02-04T15:00:00Z'
  }
];

// Sample coaches
const sampleCoaches = [
  { id: 'coach-1', name: 'Sarah Mitchell', teams: ['U14 Lakers', 'U12 Emerald'] },
  { id: 'coach-2', name: 'Mike Thompson', teams: ['U12 Emerald', 'U16 Dragons'] },
  { id: 'coach-3', name: 'James Wilson', teams: ['U10 Green'] },
  { id: 'coach-4', name: 'Lisa Chen', teams: ['U14 Gold'] }
];

const TrainingPlansLibraryPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { players } = useData();

  // State
  const [plans, setPlans] = useState(allCoachPlans);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const ageGroups = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'];

  // Filter plans
  const filteredPlans = useMemo(() => {
    let result = [...plans];

    // Filter by coach
    if (selectedCoach !== 'all') {
      result = result.filter(p => p.coachId === selectedCoach);
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
        p.name.toLowerCase().includes(query) ||
        p.coachName.toLowerCase().includes(query) ||
        p.teamName.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Sort: pending first, then by date
    result.sort((a, b) => {
      if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
      if (b.approvalStatus === 'pending' && a.approvalStatus !== 'pending') return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return result;
  }, [plans, selectedCoach, selectedAgeGroup, selectedApprovalStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: plans.length,
    pending: plans.filter(p => p.approvalStatus === 'pending').length,
    approved: plans.filter(p => p.approvalStatus === 'approved').length,
    rejected: plans.filter(p => p.approvalStatus === 'rejected').length,
    totalCoaches: [...new Set(plans.map(p => p.coachId))].length
  }), [plans]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get approval status badge
  const getApprovalBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  // Handle approval
  const handleApprove = (planId) => {
    setPlans(plans.map(p =>
      p.id === planId
        ? {
            ...p,
            approvalStatus: 'approved',
            approvedBy: 'Admin',
            approvedAt: new Date().toISOString()
          }
        : p
    ));
    setShowApprovalModal(null);
  };

  // Handle rejection
  const handleReject = (planId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setPlans(plans.map(p =>
      p.id === planId
        ? {
            ...p,
            approvalStatus: 'rejected',
            approvedBy: 'Admin',
            approvedAt: new Date().toISOString(),
            rejectionReason
          }
        : p
    ));
    setShowApprovalModal(null);
    setRejectionReason('');
  };

  // Handle copy to library
  const handleCopyToLibrary = (plan) => {
    alert(`"${plan.name}" has been added to the club template library.`);
  };

  return (
    <div className="min-h-screen bg-[#0a3d2e] pb-20">
      {/* Header */}
      <div className="bg-[#0d5943] border-b border-[#1a8a68]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Breadcrumb
            path={[
              { label: 'Admin', url: '/admin' },
              { label: 'Training Plans Library' }
            ]}
            className="mb-4"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Training Plans Library</h1>
                <p className="text-white/60 text-sm">
                  Review and approve coach training plans
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-[#1a8a68] text-xs">Total Plans</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-[#1a8a68] text-xs">Pending Review</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-[#22c55e]/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#4ade80]">{stats.approved}</p>
            <p className="text-[#1a8a68] text-xs">Approved</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
            <p className="text-[#1a8a68] text-xs">Needs Revision</p>
          </div>
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.totalCoaches}</p>
            <p className="text-[#1a8a68] text-xs">Active Coaches</p>
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
              <p className="text-white/60 text-sm">
                Please review and approve or request revisions for pending plans.
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a8a68]" />
            <input
              type="text"
              placeholder="Search plans by name, coach, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0a3d2e] border border-[#1a8a68] rounded-xl text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[#4ade80] text-sm hover:text-white transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#1a8a68] grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Coach Filter */}
              <div>
                <label className="block text-[#1a8a68] text-xs font-medium mb-2">Coach</label>
                <select
                  value={selectedCoach}
                  onChange={(e) => setSelectedCoach(e.target.value)}
                  className="w-full bg-[#0a3d2e] border border-[#1a8a68] rounded-lg px-3 py-2 text-white focus:border-[#22c55e] focus:outline-none"
                >
                  <option value="all">All Coaches</option>
                  {sampleCoaches.map(coach => (
                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                  ))}
                </select>
              </div>

              {/* Age Group Filter */}
              <div>
                <label className="block text-[#1a8a68] text-xs font-medium mb-2">Age Group</label>
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  className="w-full bg-[#0a3d2e] border border-[#1a8a68] rounded-lg px-3 py-2 text-white focus:border-[#22c55e] focus:outline-none"
                >
                  <option value="all">All Age Groups</option>
                  {ageGroups.map(ag => (
                    <option key={ag} value={ag}>{ag}</option>
                  ))}
                </select>
              </div>

              {/* Approval Status Filter */}
              <div>
                <label className="block text-[#1a8a68] text-xs font-medium mb-2">Approval Status</label>
                <select
                  value={selectedApprovalStatus}
                  onChange={(e) => setSelectedApprovalStatus(e.target.value)}
                  className="w-full bg-[#0a3d2e] border border-[#1a8a68] rounded-lg px-3 py-2 text-white focus:border-[#22c55e] focus:outline-none"
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

        {/* Plans List */}
        {filteredPlans.length === 0 ? (
          <div className="bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-[#1a8a68] mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">No Training Plans Found</h3>
            <p className="text-[#1a8a68] text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map(plan => (
              <div
                key={plan.id}
                className={`bg-[#0d5943] border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${
                  plan.approvalStatus === 'pending'
                    ? 'border-yellow-500/50'
                    : 'border-[#1a8a68] hover:border-[#22c55e]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Plan Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-white font-bold text-lg">{plan.name}</h3>
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

                    <p className="text-white/70 text-sm mb-3 line-clamp-2">{plan.description}</p>

                    <div className="flex items-center gap-4 text-sm text-[#1a8a68] mb-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {plan.coachName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {plan.teamName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(plan.dateRange.start)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-4 h-4" />
                        {plan.sessions} sessions • {plan.totalDrills} drills
                      </span>
                    </div>

                    {/* Focus Areas */}
                    <div className="flex flex-wrap gap-2">
                      {plan.focusAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#22c55e]/20 text-[#4ade80] text-xs rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                    </div>

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
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>

                    {plan.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(plan.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#1a8a68] rounded-lg text-white text-sm font-medium transition-colors"
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
                <div className="mt-4 pt-3 border-t border-[#1a8a68]/50 flex items-center justify-between text-xs text-[#1a8a68]">
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
            className="relative bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">{selectedPlan.name}</h2>

            <div className="space-y-4">
              <div>
                <p className="text-[#1a8a68] text-sm mb-1">Description</p>
                <p className="text-white">{selectedPlan.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#1a8a68] text-sm mb-1">Coach</p>
                  <p className="text-white">{selectedPlan.coachName}</p>
                </div>
                <div>
                  <p className="text-[#1a8a68] text-sm mb-1">Team</p>
                  <p className="text-white">{selectedPlan.teamName}</p>
                </div>
                <div>
                  <p className="text-[#1a8a68] text-sm mb-1">Duration</p>
                  <p className="text-white">{formatDate(selectedPlan.dateRange.start)} - {formatDate(selectedPlan.dateRange.end)}</p>
                </div>
                <div>
                  <p className="text-[#1a8a68] text-sm mb-1">Sessions & Drills</p>
                  <p className="text-white">{selectedPlan.sessions} sessions • {selectedPlan.totalDrills} drills</p>
                </div>
              </div>

              <div>
                <p className="text-[#1a8a68] text-sm mb-2">Focus Areas</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.focusAreas.map((area, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#22c55e]/20 text-[#4ade80] rounded-full text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {selectedPlan.approvalStatus === 'approved' && selectedPlan.approvedAt && (
                <div className="p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg">
                  <p className="text-[#4ade80] text-sm">
                    Approved by {selectedPlan.approvedBy} on {formatDate(selectedPlan.approvedAt)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                Close
              </button>
              {selectedPlan.approvalStatus === 'pending' && (
                <button
                  onClick={() => {
                    handleApprove(selectedPlan.id);
                    setSelectedPlan(null);
                  }}
                  className="flex-1 py-3 bg-[#22c55e] hover:bg-[#1a8a68] rounded-xl text-white font-medium transition-colors"
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
            className="relative bg-[#0d5943] border-2 border-[#1a8a68] rounded-2xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Request Revision</h3>
            <p className="text-white/70 text-sm mb-4">
              Please provide feedback for Coach {showApprovalModal.coachName} on what needs to be revised:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter revision feedback..."
              rows={4}
              className="w-full bg-[#0a3d2e] border border-[#1a8a68] rounded-xl px-4 py-3 text-white placeholder-[#1a8a68] focus:border-[#22c55e] focus:outline-none resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(null);
                  setRejectionReason('');
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
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
    </div>
  );
};

export default TrainingPlansLibraryPage;
