import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilteredData } from '../hooks/useFilteredData';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Target,
  Edit3,
  Eye,
  Copy,
  Share2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Dumbbell,
  Play,
  Archive,
  MoreVertical,
  X,
  Unlink
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { SKILL_CATEGORIES } from '../data/skillBenchmarks';
import { TEMPLATE_PLANS } from '../data/templatePlans';
import { toJsDate, formatDateShortAU } from '../utils/dateUtils';

const TrainingPlansListPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, trainingPlans: firestorePlans, teams: firestoreTeams, games, userTeamIds, deleteDocument, updateDocument, setDocument, loading: dataLoading } = useFilteredData();

  // Seed templates into Firestore on first load (deterministic IDs prevent duplicates)
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (dataLoading || seeded) return;
    const existingIds = new Set((firestorePlans || []).map(p => p.id));
    const missing = TEMPLATE_PLANS.filter(t => !existingIds.has(t.id));
    if (missing.length === 0) { setSeeded(true); return; }
    (async () => {
      for (const tpl of missing) {
        const { id, ...data } = tpl;
        try { await setDocument('training_plans', id, data); } catch (e) { console.error('Seed template error:', e); }
      }
      setSeeded(true);
    })();
  }, [dataLoading, firestorePlans, seeded, setDocument]);

  // Combine Firestore plans with local templates (for instant display before seed completes)
  const allPlans = useMemo(() => {
    const plans = [...(firestorePlans || [])];
    const existingIds = new Set(plans.map(p => p.id));
    TEMPLATE_PLANS.forEach(t => { if (!existingIds.has(t.id)) plans.push(t); });
    return plans;
  }, [firestorePlans]);

  // Helper to get the coach owner ID from a plan (some plans use coachId, others use createdBy)
  const getPlanOwnerId = (plan) => plan.coachId || plan.createdBy || null;

  // Split into sections
  const templatePlans = useMemo(() =>
    allPlans.filter(p => p.isTemplate || (p.id && p.id.startsWith('template_'))),
    [allPlans]
  );

  const sharedPlans = useMemo(() =>
    allPlans.filter(p =>
      p.isShared &&
      !p.isTemplate &&
      !(p.id && p.id.startsWith('template_')) &&
      !p.promotedToTemplate &&
      getPlanOwnerId(p) !== currentUser?.uid
    ),
    [allPlans, currentUser]
  );

  const myPlans = useMemo(() =>
    allPlans.filter(p =>
      getPlanOwnerId(p) === currentUser?.uid &&
      !p.isTemplate &&
      !(p.id && p.id.startsWith('template_'))
    ),
    [allPlans, currentUser]
  );

  // "plans" for stats and backwards compat = my plans
  const plans = myPlans;

  const teamsList = useMemo(() => {
    if (firestoreTeams && firestoreTeams.length > 0) {
      return firestoreTeams.map(t => ({
        id: t.id,
        name: t.name || t.teamName || 'Unknown Team',
        ageGroup: t.ageGroup || ''
      }));
    }
    return [];
  }, [firestoreTeams]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuPlan, setActionMenuPlan] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [schedulePlanId, setSchedulePlanId] = useState(null);
  const [previewPlan, setPreviewPlan] = useState(null);

  // Future training sessions — include ALL (even already-linked) for the scheduling dialog
  // Already-linked sessions are shown greyed-out so the coach can see the full picture
  const upcomingTrainings = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const results = [];
    const gamesArr = games || [];

    gamesArr.forEach(g => {
      if ((g.type || '').toLowerCase() !== 'training') return;
      const d = toJsDate(g.date);
      if (!d || d < now) return;
      results.push({ ...g, _isLinked: !!g.trainingPlanId });
    });

    results.sort((a, b) => {
      const da = toJsDate(a.date);
      const db2 = toJsDate(b.date);
      return (da || 0) - (db2 || 0);
    });

    return results;
  }, [games]);

  // Filter helper applied to each section
  const { filteredTemplates, filteredShared, filteredMyPlans } = useMemo(() => {
    const applyFilters = (planList) => {
      let result = [...planList];
      if (selectedTeam !== 'all') {
        result = result.filter(p => p.teamId === selectedTeam);
      }
      if (selectedStatus !== 'all') {
        result = result.filter(p => p.status === selectedStatus);
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(p =>
          (p.name || '').toLowerCase().includes(query) ||
          (p.teamName || '').toLowerCase().includes(query)
        );
      }
      result.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      return result;
    };
    return {
      filteredTemplates: applyFilters(templatePlans),
      filteredShared: applyFilters(sharedPlans),
      filteredMyPlans: applyFilters(myPlans)
    };
  }, [templatePlans, sharedPlans, myPlans, selectedTeam, selectedStatus, searchQuery]);

  // Map: planId → array of linked game objects (for showing "Scheduled" badge and unlinking)
  const linkedSessionsByPlan = useMemo(() => {
    const map = {};
    (games || []).forEach(g => {
      if (g.trainingPlanId) {
        if (!map[g.trainingPlanId]) map[g.trainingPlanId] = [];
        map[g.trainingPlanId].push(g);
      }
    });
    return map;
  }, [games]);

  // Get quick stats
  const stats = useMemo(() => {
    const active = plans.filter(p => p.status === 'active').length;
    const draft = plans.filter(p => p.status === 'draft').length;
    const completed = plans.filter(p => p.status === 'completed').length;
    const needsRevision = plans.filter(p => p.status === 'needs-revision').length;

    // Find next session from active plans
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextSession = null;
    plans
      .filter(p => p.status === 'active')
      .forEach(plan => {
        (plan.sessions || []).forEach(session => {
          const sessionDate = new Date(session.date);
          if (sessionDate >= today) {
            if (!nextSession || sessionDate < new Date(nextSession.date)) {
              nextSession = { ...session, planName: plan.name, teamName: plan.teamName };
            }
          }
        });
      });

    return { active, draft, completed, needsRevision, nextSession };
  }, [plans]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format relative date
  const formatRelativeDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-[#005028]/20 text-[#00A651] border-[#00A651]';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'needs-revision':
        return 'bg-red-500/20 text-red-500 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  // Handle actions
  const handleEdit = (planId) => {
    navigate(`/coach/training-plans/${planId}`);
    setActionMenuPlan(null);
  };

  const handleDuplicate = (planId) => {
    navigate(`/coach/training-plans/new?duplicate=${planId}`);
    setActionMenuPlan(null);
  };

  const handleDelete = async (planId) => {
    try {
      await deleteDocument('training_plans', planId);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleToggleShare = async (plan) => {
    const newShared = !plan.isShared;
    try {
      const updates = {
        isShared: newShared,
        sharedAt: newShared ? new Date().toISOString() : null
      };
      // Ensure coachId and coachName are set so other coaches can see who shared it
      if (newShared) {
        if (!plan.coachId) updates.coachId = currentUser?.uid || null;
        if (!plan.coachName) updates.coachName = userProfile?.displayName || currentUser?.displayName || 'Unknown Coach';
      }
      await updateDocument('training_plans', plan.id, updates);
    } catch (err) {
      console.error('Error toggling share:', err);
    }
  };

  const handleStatusChange = async (planId, newStatus) => {
    try {
      await updateDocument('training_plans', planId, { status: newStatus, updatedAt: new Date().toISOString() });
      setActionMenuPlan(null);
    } catch (error) {
      console.error('Error updating plan status:', error);
    }
  };

  if (dataLoading) {
    return (
      <PageShell
        title="Training Plans"
        subtitle="Loading..."
        backTo="/dashboard"
        breadcrumbs={[
          { label: 'Home', url: '/welcome' },
          { label: 'Dashboard', url: '/dashboard' },
          { label: 'Training Plans' }
        ]}
        maxWidth="4xl"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D4E4D4] border-t-[#00A651] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-800 font-medium">Loading training plans...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Training Plans"
      subtitle={plans.length > 0 ? `${plans.length} total plan${plans.length !== 1 ? 's' : ''} \u2022 ${stats.active} active` : 'No plans yet'}
      backTo="/dashboard"
      breadcrumbs={[
        { label: 'Home', url: '/welcome' },
        { label: 'Dashboard', url: '/dashboard' },
        { label: 'Training Plans' }
      ]}
      maxWidth="4xl"
      headerActions={
        <button
          onClick={() => navigate('/coach/training-plans/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005028] text-white rounded-xl font-semibold hover:bg-[#00A651] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Plan</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Active Plans', count: stats.active, icon: Play, color: 'text-[#00A651]', filter: 'active' },
            { label: 'Draft Plans', count: stats.draft, icon: Edit3, color: 'text-yellow-500', filter: 'draft' },
            { label: 'Needs Revision', count: stats.needsRevision, icon: AlertCircle, color: 'text-red-500', filter: 'needs-revision' },
            { label: 'Completed', count: stats.completed, icon: CheckCircle2, color: 'text-blue-500', filter: 'completed' },
          ].map(card => (
            <button
              key={card.filter}
              onClick={() => setSelectedStatus(selectedStatus === card.filter ? 'all' : card.filter)}
              className={`bg-white border-2 rounded-xl p-4 text-left transition-all ${
                selectedStatus === card.filter
                  ? 'border-[#00A651] ring-1 ring-[#00A651]/20'
                  : 'border-[#D4E4D4] hover:border-[#00A651]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#6B7C6B] text-xs">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.count}</p>
                </div>
                <card.icon className={`w-8 h-8 ${card.color}`} />
              </div>
            </button>
          ))}
          <div className="bg-white border-2 border-[#D4E4D4] rounded-xl p-4">
            <div>
              <p className="text-[#6B7C6B] text-xs">Next Session</p>
              {stats.nextSession ? (
                <>
                  <p className="text-gray-800 font-semibold text-sm truncate">{stats.nextSession.planName}</p>
                  <p className="text-[#00A651] text-xs">{formatDate(stats.nextSession.date)}</p>
                </>
              ) : (
                <p className="text-[#6B7C6B] text-sm">No upcoming</p>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl text-gray-800 placeholder-gray-400 focus:border-[#00A651] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7C6B] hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[#00A651] text-sm hover:text-gray-800 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#D4E4D4] grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Team Filter */}
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-2">Team</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTeam('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedTeam === 'all'
                        ? 'bg-[#005028] text-white'
                        : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                    }`}
                  >
                    All Teams
                  </button>
                  {teamsList.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedTeam === team.id
                          ? 'bg-[#005028] text-white'
                          : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                      }`}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[#6B7C6B] text-xs font-medium mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'active', 'draft', 'needs-revision', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                        selectedStatus === status
                          ? 'bg-[#005028] text-white'
                          : 'bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 hover:border-[#00A651]'
                      }`}
                    >
                      {status === 'all' ? 'All Status' : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Templates Section — always show */}
        <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-[#FFD700]" />
              <h2 className="text-lg font-bold text-gray-800">Templates</h2>
              <span className="text-sm font-normal text-[#6B7C6B]">({filteredTemplates.length})</span>
            </div>
            {filteredTemplates.length === 0 ? (
              <p className="text-[#6B7C6B] text-sm bg-white border border-[#D4E4D4] rounded-xl p-4 text-center">
                {templatePlans.length === 0
                  ? 'Loading templates...'
                  : 'No templates match your filters.'}
              </p>
            ) : (
              filteredTemplates.map(plan => (
                <div key={plan.id} className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4 hover:border-[#FFD700] transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#FFD700]/10 border-2 border-[#FFD700]/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Archive className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-gray-800 font-semibold truncate">{plan.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[#FFD700]/20 text-[#B8860B] border-[#FFD700]">
                          Template
                        </span>
                        {plan.createdBy && plan.createdBy !== 'system' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-purple-500/20 text-purple-600 border-purple-400">
                            Coach Created
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#6B7C6B] mb-2 flex-wrap">
                        {plan.teamName && (
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.teamName}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {plan.sessions?.length || 0} session{(plan.sessions?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {plan.focusAreas && (
                        <div className="flex flex-wrap gap-1.5">
                          {plan.focusAreas.map(skillId => {
                            const skill = SKILL_CATEGORIES.find(s => s.id === skillId);
                            return skill ? (
                              <span key={skillId} className="px-2 py-0.5 bg-[#005028]/20 text-[#00A651] text-[10px] rounded-full">{skill.name}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPreviewPlan(plan)} className="p-2 text-[#00A651] hover:bg-[#00A651]/20 rounded-lg transition-colors" title="View Full Preview">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDuplicate(plan.id)} className="p-2 text-[#005028] hover:bg-[#005028]/10 rounded-lg transition-colors" title="Use Template">
                        <Copy className="w-5 h-5" />
                      </button>
                      <button onClick={() => setSchedulePlanId(plan.id)} className="p-2 text-[#005028] hover:bg-[#005028]/10 rounded-lg transition-colors" title="Schedule">
                        <Calendar className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        {/* Shared Plans Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#005028]" />
            <h2 className="text-lg font-bold text-gray-800">Shared Plans</h2>
            <span className="text-sm font-normal text-[#6B7C6B]">({filteredShared.length})</span>
          </div>
          {filteredShared.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#D4E4D4] rounded-2xl p-6 text-center">
              <Share2 className="w-8 h-8 text-[#6B7C6B] mx-auto mb-2" />
              <p className="text-[#6B7C6B] text-sm">
                {sharedPlans.length === 0
                  ? "Plans shared by other coaches will appear here. Your own shared plans are shown in My Plans with a blue Shared badge."
                  : "No shared plans match your filters."}
              </p>
            </div>
          ) : (
            filteredShared.map(plan => (
              <div key={plan.id} className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4 hover:border-[#00A651] transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-[#00A651] transition-colors">
                    <Share2 className="w-6 h-6 text-[#005028]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-gray-800 font-semibold truncate">{plan.name}</h3>
                      {plan.ratings?.average > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FFD700]/20 text-[#B8860B] border border-[#FFD700]">
                          ★ {plan.ratings.average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#6B7C6B] mb-2 flex-wrap">
                      {plan.coachName && (
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />By {plan.coachName}</span>
                      )}
                      {plan.teamName && (
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" />{plan.teamName}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {plan.sessions?.length || 0} session{(plan.sessions?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {plan.focusAreas && (
                      <div className="flex flex-wrap gap-1.5">
                        {plan.focusAreas.map(skillId => {
                          const skill = SKILL_CATEGORIES.find(s => s.id === skillId);
                          return skill ? (
                            <span key={skillId} className="px-2 py-0.5 bg-[#005028]/20 text-[#00A651] text-[10px] rounded-full">{skill.name}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewPlan(plan)} className="p-2 text-[#00A651] hover:bg-[#00A651]/20 rounded-lg transition-colors" title="View Full Preview">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDuplicate(plan.id)} className="p-2 text-[#005028] hover:bg-[#005028]/10 rounded-lg transition-colors" title="Copy to My Plans">
                      <Copy className="w-5 h-5" />
                    </button>
                    <button onClick={() => setSchedulePlanId(plan.id)} className="p-2 text-[#005028] hover:bg-[#005028]/10 rounded-lg transition-colors" title="Schedule">
                      <Calendar className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* My Plans Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#005028]" />
            <h2 className="text-lg font-bold text-gray-800">My Plans</h2>
            <span className="text-sm font-normal text-[#6B7C6B]">({filteredMyPlans.length})</span>
          </div>
          {filteredMyPlans.length === 0 ? (
            <div className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-[#6B7C6B] mx-auto mb-3" />
              <h3 className="text-gray-800 font-semibold mb-2">No Plans Found</h3>
              <p className="text-[#6B7C6B] text-sm mb-4">
                {searchQuery || selectedTeam !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first training plan to get started'}
              </p>
              <button
                onClick={() => navigate('/coach/training-plans/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#005028] text-white rounded-lg font-medium hover:bg-[#00A651] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Plan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMyPlans.map(plan => (
              <div
                key={plan.id}
                className="bg-white border-2 border-[#D4E4D4] rounded-2xl p-4 hover:border-[#00A651] transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Plan Icon */}
                  <div className="w-12 h-12 bg-[#F5F9F5] border-2 border-[#D4E4D4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-[#00A651] transition-colors">
                    <Dumbbell className="w-6 h-6 text-[#00A651]" />
                  </div>

                  {/* Plan Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-gray-800 font-semibold truncate">{plan.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(plan.status)}`}>
                        {plan.status === 'needs-revision' ? 'Needs Revision' : plan.status}
                      </span>
                      {plan.isShared && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-blue-500/20 text-blue-500 border-blue-500" title="Other coaches can see this plan in their Shared Plans section">
                          Shared
                        </span>
                      )}
                      {plan.promotedToTemplate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-purple-500/20 text-purple-600 border-purple-400">
                          Promoted to Template
                        </span>
                      )}
                      {(linkedSessionsByPlan[plan.id] || []).length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[#00A651]/20 text-[#00A651] border-[#00A651]" title={`Linked to ${linkedSessionsByPlan[plan.id].length} training session(s)`}>
                          Scheduled ({linkedSessionsByPlan[plan.id].length})
                        </span>
                      )}
                      {plan.status === 'needs-revision' && (
                        <button
                          onClick={() => handleEdit(plan.id)}
                          className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded-full hover:bg-red-600 transition-colors"
                        >
                          Revise Now
                        </button>
                      )}
                    </div>
                    {plan.status === 'needs-revision' && plan.revisionNotes && (
                      <div className="mb-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-xs">{plan.revisionNotes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm text-[#6B7C6B] mb-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {plan.teamName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(plan.dateRange?.start)}
                        {plan.dateRange?.end && plan.dateRange.end !== plan.dateRange.start && ` - ${formatDate(plan.dateRange.end)}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {plan.sessions?.length || 0} session{(plan.sessions?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Focus Areas */}
                    <div className="flex flex-wrap gap-1.5">
                      {(plan.focusAreas || []).map(skillId => {
                        const skill = SKILL_CATEGORIES.find(s => s.id === skillId);
                        return skill ? (
                          <span
                            key={skillId}
                            className="px-2 py-0.5 bg-[#005028]/20 text-[#00A651] text-[10px] rounded-full"
                          >
                            {skill.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 sm:gap-2 relative">
                    <button
                      onClick={() => setPreviewPlan(plan)}
                      className="p-2 text-[#00A651] hover:bg-[#00A651]/20 rounded-lg transition-colors"
                      title="View Full Preview"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleShare(plan); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        plan.isShared
                          ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={plan.isShared ? 'Stop sharing' : 'Share with other coaches'}
                    >
                      <Share2 size={14} />
                      {plan.isShared ? 'Shared' : 'Share'}
                    </button>
                    <button
                      onClick={() => setSchedulePlanId(plan.id)}
                      className="p-2 text-[#005028] hover:bg-[#005028]/10 rounded-lg transition-colors"
                      title="Schedule"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(plan.id)}
                      className="p-2 text-[#00A651] hover:bg-[#00A651]/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setActionMenuPlan(actionMenuPlan === plan.id ? null : plan.id)}
                      className="p-2 text-[#6B7C6B] hover:text-gray-800 hover:bg-gray-100/20 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Action Menu Dropdown */}
                    {actionMenuPlan === plan.id && (
                      <div className="absolute right-0 top-12 z-20 bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                        <button
                          onClick={() => handleDuplicate(plan.id)}
                          className="w-full flex items-center gap-2 px-4 py-3 text-gray-800 text-sm hover:bg-gray-100/30 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        {plan.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(plan.id, 'active')}
                            className="w-full flex items-center gap-2 px-4 py-3 text-[#00A651] text-sm hover:bg-gray-100/30 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Activate
                          </button>
                        )}
                        {plan.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(plan.id, 'completed')}
                            className="w-full flex items-center gap-2 px-4 py-3 text-blue-400 text-sm hover:bg-gray-100/30 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Complete
                          </button>
                        )}
                        {plan.status === 'needs-revision' && (
                          <button
                            onClick={() => handleEdit(plan.id)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-red-500 text-sm hover:bg-gray-100/30 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit & Resubmit
                          </button>
                        )}
                        {plan.status === 'completed' && (
                          <button
                            onClick={() => handleStatusChange(plan.id, 'active')}
                            className="w-full flex items-center gap-2 px-4 py-3 text-[#00A651] text-sm hover:bg-gray-100/30 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Reactivate
                          </button>
                        )}
                        {(linkedSessionsByPlan[plan.id] || []).length > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                const linked = linkedSessionsByPlan[plan.id] || [];
                                for (const g of linked) {
                                  await updateDocument('games', g.id, { trainingPlanId: null });
                                }
                                setActionMenuPlan(null);
                              } catch (err) {
                                console.error('Error unlinking plan:', err);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-orange-500 text-sm hover:bg-orange-500/10 transition-colors"
                          >
                            <Unlink className="w-4 h-4" />
                            Unlink Sessions ({(linkedSessionsByPlan[plan.id] || []).length})
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActionMenuPlan(null);
                            setConfirmDelete(plan.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Updated timestamp */}
                <div className="mt-3 pt-3 border-t border-[#D4E4D4]/50 text-[10px] text-[#6B7C6B]">
                  Last updated {formatRelativeDate(plan.updatedAt)}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Plan Preview Modal */}
      {previewPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setPreviewPlan(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-2xl max-h-[95vh] bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#F5F9F5] p-4 z-10 border-b border-[#D4E4D4]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-800 truncate">{previewPlan.name || 'Untitled Plan'}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {previewPlan.isTemplate || previewPlan.id?.startsWith('template_') ? (
                      <span className="px-1.5 py-0.5 bg-[#FFD700]/20 text-[#B8860B] text-[10px] rounded font-medium">Template</span>
                    ) : previewPlan.isShared ? (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-medium">Shared</span>
                    ) : null}
                    <span className="text-[#00A651] text-sm">
                      {previewPlan.sessions?.length || 0} session{(previewPlan.sessions?.length || 0) !== 1 ? 's' : ''}
                      {' \u2022 '}
                      {(previewPlan.sessions || []).reduce((t, s) => t + (s.drills?.length || 0), 0)} drills
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewPlan(null)}
                  className="w-10 h-10 bg-white border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651] transition-colors flex-shrink-0 ml-3"
                >
                  <X className="w-5 h-5 text-gray-800" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-6 bg-white">
              {/* Plan Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                {previewPlan.description && (
                  <p className="text-gray-600 text-sm mb-4">{previewPlan.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {previewPlan.coachName && (
                    <div>
                      <span className="text-[#6B7C6B]">Coach:</span>
                      <p className="text-gray-800 font-medium">{previewPlan.coachName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[#6B7C6B]">Team:</span>
                    <p className="text-gray-800 font-medium">{previewPlan.teamName || previewPlan.ageGroup || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[#6B7C6B]">Date Range:</span>
                    <p className="text-gray-800 font-medium">
                      {previewPlan.dateRange?.start ? new Date(previewPlan.dateRange.start).toLocaleDateString('en-AU') : '-'}
                      {previewPlan.dateRange?.end && ` - ${new Date(previewPlan.dateRange.end).toLocaleDateString('en-AU')}`}
                    </p>
                  </div>
                </div>
                {previewPlan.focusAreas && previewPlan.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {previewPlan.focusAreas.map((area, idx) => {
                      const skill = SKILL_CATEGORIES.find(s => s.id === area);
                      return (
                        <span key={idx} className="px-3 py-1 bg-[#005028]/10 text-[#00A651] rounded-full text-xs">
                          {skill?.name || area}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sessions */}
              {previewPlan.sessions && previewPlan.sessions.length > 0 ? (
                previewPlan.sessions.map((session, index) => (
                  <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#005028] rounded-lg flex items-center justify-center text-white font-bold">
                        {session.sessionNumber || index + 1}
                      </div>
                      <div>
                        <h4 className="text-gray-800 font-bold">{session.name || `Session ${index + 1}`}</h4>
                        <p className="text-[#6B7C6B] text-sm">
                          {session.date ? new Date(session.date).toLocaleDateString('en-AU') : 'No date'}
                          {session.duration ? ` \u2022 ${session.duration} mins` : ''}
                        </p>
                      </div>
                    </div>

                    {session.warmUp && (
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-1">Warm-up</h5>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{session.warmUp}</p>
                      </div>
                    )}

                    {session.drills && session.drills.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Drills ({session.drills.length})</h5>
                        <div className="space-y-2">
                          {session.drills.map((drill, di) => (
                            <div key={di} className="bg-[#F5F9F5] rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-800 text-sm">{drill.name}</span>
                                {drill.duration && <span className="text-[#6B7C6B] text-xs">{drill.duration} mins</span>}
                              </div>
                              {drill.description && <p className="text-gray-600 text-xs">{drill.description}</p>}
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
                ))
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="w-10 h-10 text-[#6B7C6B] mx-auto mb-2" />
                  <p className="text-[#6B7C6B] text-sm">No sessions defined in this plan</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[#D4E4D4] p-4 flex gap-3">
              <button
                onClick={() => setPreviewPlan(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-800 font-medium transition-colors"
              >
                Close
              </button>
              {getPlanOwnerId(previewPlan) === currentUser?.uid && (
                <button
                  onClick={() => { handleEdit(previewPlan.id); setPreviewPlan(null); }}
                  className="flex-1 py-3 bg-[#005028] hover:bg-[#00A651] rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Plan
                </button>
              )}
              {getPlanOwnerId(previewPlan) !== currentUser?.uid && !previewPlan.isTemplate && (
                <button
                  onClick={() => { handleDuplicate(previewPlan.id); setPreviewPlan(null); }}
                  className="flex-1 py-3 bg-[#005028] hover:bg-[#00A651] rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy to My Plans
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {schedulePlanId && (
        <div className="fixed inset-0 z-50" onClick={() => setSchedulePlanId(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[calc(100vh-2rem)] bg-white border-2 border-[#D4E4D4] rounded-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#D4E4D4] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Schedule Plan</h3>
                <p className="text-[#6B7C6B] text-xs mt-0.5">
                  {allPlans.find(p => p.id === schedulePlanId)?.name}
                </p>
              </div>
              <button
                onClick={() => setSchedulePlanId(null)}
                className="w-8 h-8 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center hover:border-[#00A651] transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-800" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {upcomingTrainings.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-10 h-10 text-[#6B7C6B] mx-auto mb-2" />
                  <p className="text-gray-800 font-medium text-sm">No upcoming training sessions</p>
                  <p className="text-[#6B7C6B] text-xs mt-1">
                    Add training events in Schedule Management first.
                  </p>
                </div>
              ) : (
                upcomingTrainings.map(event => {
                  const eventDate = toJsDate(event.date);
                  const teamName = teamsList.find(t => t.id === event.teamId)?.name || event.teamName || 'Unknown Team';
                  const isLinked = event._isLinked;
                  const linkedPlanName = isLinked
                    ? (allPlans.find(p => p.id === event.trainingPlanId)?.name || 'Another plan')
                    : null;

                  if (isLinked) {
                    return (
                      <div
                        key={event.id}
                        className="w-full text-left bg-gray-50 border border-gray-200 rounded-xl p-3 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 font-medium text-sm">
                              {eventDate ? formatDateShortAU(eventDate) : 'Unknown date'}
                            </p>
                            <p className="text-gray-400 text-xs">{teamName}</p>
                            <p className="text-gray-400 text-[10px] mt-0.5">Linked to: {linkedPlanName}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Linked</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={event.id}
                      onClick={async () => {
                        try {
                          await updateDocument('games', event.id, { trainingPlanId: schedulePlanId });
                          const sessionDate = toJsDate(event.date);
                          if (sessionDate) {
                            const dateStr = sessionDate.toISOString().split('T')[0];
                            // Auto-populate dates from linked session (FIX 5)
                            const thePlan = allPlans.find(p => p.id === schedulePlanId);
                            const sessionCount = thePlan?.sessions?.length || 0;
                            const weeksToAdd = sessionCount > 0 ? sessionCount * 7 : 12 * 7;
                            const endDate = new Date(sessionDate);
                            endDate.setDate(endDate.getDate() + weeksToAdd);
                            const endDateStr = endDate.toISOString().split('T')[0];
                            const startTime = event.startTime || event.time || '';
                            const endTime = startTime ? (() => {
                              const [h, m] = startTime.split(':').map(Number);
                              const endH = h + 1;
                              return `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
                            })() : '';
                            await updateDocument('training_plans', schedulePlanId, {
                              'dateRange.start': dateStr,
                              'dateRange.end': endDateStr,
                              scheduledDate: dateStr,
                              scheduledStartTime: startTime,
                              scheduledEndTime: endTime,
                            });
                          }
                          setSchedulePlanId(null);
                        } catch (err) {
                          console.error('Error linking plan to schedule:', err);
                        }
                      }}
                      className="w-full text-left bg-[#F5F9F5] border border-[#D4E4D4] rounded-xl p-3 hover:border-[#00A651] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-800 font-medium text-sm">
                            {eventDate ? formatDateShortAU(eventDate) : 'Unknown date'}
                          </p>
                          <p className="text-[#6B7C6B] text-xs">{teamName}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#00A651]" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm max-h-[calc(100vh-2rem)] bg-white border-2 border-red-500 rounded-2xl p-6 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Training Plan?</h3>
              <p className="text-[#6B7C6B] text-sm mb-6">
                This action cannot be undone. The plan and all its sessions will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 bg-[#F5F9F5] border border-[#D4E4D4] text-gray-800 rounded-xl font-medium hover:border-[#00A651] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuPlan && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenuPlan(null)}
        />
      )}
    </PageShell>
  );
};

export default TrainingPlansListPage;
