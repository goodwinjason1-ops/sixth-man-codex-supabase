import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal, X, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDrills } from '../services/drillService';
import { DRILL_CATEGORIES, CATEGORY_COLORS, AGE_GROUPS, DRILL_EDIT_ROLES } from '../constants/drills';
import DrillCard from '../components/drills/DrillCard';
import PageShell from '../components/PageShell';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'most_used', label: 'Most Used' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'fun_rating', label: 'Most Fun' },
];

const DrillLibraryPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const canCreate = DRILL_EDIT_ROLES.includes(userProfile?.role);

  useEffect(() => {
    loadDrills();
  }, []);

  const loadDrills = async () => {
    setLoading(true);
    try {
      const data = await fetchDrills();
      setDrills(data);
    } catch (err) {
      console.error('Failed to fetch drills:', err);
    }
    setLoading(false);
  };

  const filteredDrills = useMemo(() => {
    let result = [...drills];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.tags?.some(t => t.toLowerCase().includes(q)) ||
        d.skillsFocus?.some(s => s.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter(d => d.category === categoryFilter);
    }

    // Age group filter
    if (ageFilter) {
      result = result.filter(d => d.ageGroups?.includes(ageFilter));
    }

    // Difficulty filter
    if (difficultyFilter) {
      result = result.filter(d => d.difficulty === difficultyFilter);
    }

    // Sort
    switch (sortBy) {
      case 'most_used':
        result.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'highest_rated':
        result.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
        break;
      case 'fun_rating':
        result.sort((a, b) => (b.funRating || 0) - (a.funRating || 0));
        break;
      default: // newest — already sorted by createdAt desc from Firestore
        break;
    }

    return result;
  }, [drills, search, categoryFilter, ageFilter, difficultyFilter, sortBy]);

  const activeFilterCount = [categoryFilter, ageFilter, difficultyFilter].filter(Boolean).length;

  const clearFilters = () => {
    setCategoryFilter('');
    setAgeFilter('');
    setDifficultyFilter('');
    setSearch('');
  };

  return (
    <PageShell title="Drill Library" backPath="/welcome">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7C6B]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drills..."
            className="w-full pl-10 pr-4 py-3 border border-[#D4E4D4] rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-lg font-medium text-sm transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-[#005028] text-white border-[#005028]'
                : 'bg-white text-gray-700 border-[#D4E4D4] hover:border-[#00A651]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-white text-[#005028] rounded-full text-xs font-bold flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-3 border border-[#D4E4D4] rounded-lg bg-white text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#00A651] outline-none"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {canCreate && (
            <button
              onClick={() => navigate('/drills/new')}
              className="flex items-center gap-2 px-4 py-3 bg-[#005028] text-white rounded-lg font-medium text-sm hover:bg-[#003018] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Drill</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-[#D4E4D4] rounded-xl p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">Filters</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div>
            <span className="text-xs font-medium text-[#6B7C6B] uppercase tracking-wide">Category</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(DRILL_CATEGORIES).map(([key, cat]) => {
                const colorSet = CATEGORY_COLORS[cat.color];
                return (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(categoryFilter === key ? '' : key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      categoryFilter === key
                        ? `${colorSet.iconBg} text-white border-transparent`
                        : `bg-white ${colorSet.text} ${colorSet.border} hover:${colorSet.bg}`
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Age Group Pills */}
          <div>
            <span className="text-xs font-medium text-[#6B7C6B] uppercase tracking-wide">Age Group</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {AGE_GROUPS.map(ag => (
                <button
                  key={ag}
                  onClick={() => setAgeFilter(ageFilter === ag ? '' : ag)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    ageFilter === ag
                      ? 'bg-[#005028] text-white border-[#005028]'
                      : 'bg-white text-gray-600 border-[#D4E4D4] hover:border-[#00A651]'
                  }`}
                >
                  {ag.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <span className="text-xs font-medium text-[#6B7C6B] uppercase tracking-wide">Difficulty</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {['beginner', 'intermediate', 'advanced'].map(d => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(difficultyFilter === d ? '' : d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    difficultyFilter === d
                      ? 'bg-[#005028] text-white border-[#005028]'
                      : 'bg-white text-gray-600 border-[#D4E4D4] hover:border-[#00A651]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDrills.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-[#005028]" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {search || activeFilterCount > 0 ? 'No drills match your filters' : 'No drills yet'}
          </h3>
          <p className="text-[#6B7C6B] mb-4">
            {search || activeFilterCount > 0 ? 'Try adjusting your search or filters' : 'Be the first to add a drill to the library'}
          </p>
          {(search || activeFilterCount > 0) && (
            <button onClick={clearFilters} className="text-[#00A651] hover:text-[#005028] font-medium">Clear Filters</button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-[#6B7C6B] mb-4">{filteredDrills.length} drill{filteredDrills.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrills.map(drill => (
              <DrillCard
                key={drill.id}
                drill={drill}
                onClick={() => navigate(`/drills/${drill.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
};

export default DrillLibraryPage;
