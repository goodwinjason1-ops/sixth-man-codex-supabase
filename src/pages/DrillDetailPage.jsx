import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, Users, Star, Edit2, Lightbulb, ChevronDown, ChevronUp,
  PlayCircle, Package, ListOrdered
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDrill, rateDrill, incrementDrillUsage } from '../services/drillService';
import { DRILL_CATEGORIES, CATEGORY_COLORS, DIFFICULTY_LEVELS, DRILL_EDIT_ROLES } from '../constants/drills';
import { ADMIN_ROLES } from '../constants/roles';
import PageShell from '../components/PageShell';
import Breadcrumb from '../components/Breadcrumb';

const DrillDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [drill, setDrill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVariation, setExpandedVariation] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const canEdit = drill && (
    ADMIN_ROLES.includes(userProfile?.role) ||
    ['girls_coordinator', 'boys_coordinator', 'youth_head_coach'].includes(userProfile?.role) ||
    drill.createdBy === userProfile?.uid
  );

  useEffect(() => {
    loadDrill();
  }, [id]);

  const loadDrill = async () => {
    setLoading(true);
    try {
      const data = await fetchDrill(id);
      setDrill(data);
      // Increment usage count
      if (data) incrementDrillUsage(id).catch(() => {});
    } catch (err) {
      console.error('Failed to fetch drill:', err);
    }
    setLoading(false);
  };

  const handleRate = async (rating) => {
    setUserRating(rating);
    try {
      await rateDrill(id, rating);
      setRatingSubmitted(true);
      // Refresh drill to show updated rating
      const updated = await fetchDrill(id);
      setDrill(updated);
    } catch (err) {
      console.error('Failed to rate drill:', err);
    }
  };

  if (loading) {
    return (
      <PageShell title="Loading..." backTo="/drills">
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageShell>
    );
  }

  if (!drill) {
    return (
      <PageShell title="Drill Not Found" backTo="/drills">
        <div className="text-center py-20">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Drill not found</h3>
          <p className="text-[#6B7C6B]">This drill may have been deleted.</p>
        </div>
      </PageShell>
    );
  }

  const category = DRILL_CATEGORIES[drill.category] || {};
  const colorSet = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
  const diffLevel = DIFFICULTY_LEVELS[drill.difficulty] || DIFFICULTY_LEVELS[1];

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <div className="bg-[#005028]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Drill Library', url: '/drills' },
              { label: drill.name }
            ]}
            className="mb-3 [&_*]:text-green-200 [&_button]:!text-green-300 [&_button:hover]:!text-white [&_span.font-medium]:!text-white"
          />

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{drill.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorSet.badge}`}>
                  {category.label}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${diffLevel.badge}`}>
                  {diffLevel.short} — {diffLevel.label}
                </span>
                <span className="flex items-center gap-1 text-green-200 text-sm">
                  <Clock className="w-4 h-4" /> {drill.duration} min
                </span>
                <span className="flex items-center gap-1 text-green-200 text-sm">
                  <Users className="w-4 h-4" /> {drill.minPlayers}-{drill.maxPlayers} players
                </span>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => navigate(`/drills/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )}
          </div>

          {/* Age Groups */}
          <div className="flex flex-wrap gap-2 mt-4">
            {drill.ageGroups?.map(ag => (
              <span key={ag} className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white font-medium uppercase">
                {ag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Description */}
        <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
          <p className="text-gray-700 leading-relaxed">{drill.description}</p>
        </div>

        {/* Equipment */}
        {drill.equipment?.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#00A651]" /> Equipment Needed
            </h2>
            <div className="flex flex-wrap gap-2">
              {drill.equipment.map((eq, i) => (
                <span key={i} className="px-3 py-1.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg text-sm text-gray-700 capitalize">
                  {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Setup */}
        {drill.setup && (
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
            <h2 className="font-bold text-gray-800 mb-3">Setup</h2>
            <p className="text-gray-700 leading-relaxed">{drill.setup}</p>
          </div>
        )}

        {/* Instructions */}
        {drill.instructions?.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <ListOrdered className="w-5 h-5 text-[#00A651]" /> Instructions
            </h2>
            <ol className="space-y-3">
              {drill.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-[#005028] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <p className="text-gray-700 pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Coaching Points */}
        {drill.coachingPoints?.length > 0 && (
          <div className="bg-[#FFD700]/5 rounded-xl border border-[#FFD700]/30 p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-[#FFD700]" /> Coaching Points
            </h2>
            <ul className="space-y-3">
              {drill.coachingPoints.map((point, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 text-[#FFD700] mt-0.5">💡</span>
                  <p className="text-gray-700">{point}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variations */}
        {drill.variations?.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
            <h2 className="font-bold text-gray-800 mb-4">Variations</h2>
            <div className="space-y-2">
              {drill.variations.map((v, i) => (
                <div key={i} className="border border-[#D4E4D4] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedVariation(expandedVariation === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F5F9F5] transition-colors"
                  >
                    <span className="font-medium text-gray-800">{v.name}</span>
                    {expandedVariation === i ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  {expandedVariation === i && (
                    <div className="px-4 pb-4 text-gray-700 text-sm border-t border-[#D4E4D4]">
                      <p className="pt-3">{v.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video */}
        {drill.videoUrl ? (
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <PlayCircle className="w-5 h-5 text-[#00A651]" /> Video
            </h2>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <iframe
                src={drill.videoUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={drill.name}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
            <div className="flex items-center justify-center py-8 text-[#6B7C6B]">
              <PlayCircle className="w-8 h-8 mr-2 opacity-30" />
              <span className="text-sm">No video available for this drill</span>
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="bg-white rounded-xl border border-[#D4E4D4] p-6">
          <h2 className="font-bold text-gray-800 mb-4">Rate this Drill</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  disabled={ratingSubmitted}
                  className="p-1 transition-transform hover:scale-110 disabled:cursor-default"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || userRating)
                        ? 'text-[#FFD700] fill-[#FFD700]'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-sm text-[#6B7C6B]">
              {ratingSubmitted ? (
                <span className="text-[#00A651] font-medium">Thanks for rating!</span>
              ) : (
                <span>Click to rate</span>
              )}
            </div>
          </div>
          {drill.ratings?.count > 0 && (
            <p className="text-sm text-[#6B7C6B] mt-3">
              Average: {drill.ratings.average}/5 ({drill.ratings.count} rating{drill.ratings.count !== 1 ? 's' : ''})
            </p>
          )}
        </div>

        {/* Tags & Skills */}
        <div className="flex flex-wrap gap-4">
          {drill.tags?.length > 0 && (
            <div className="flex-1 min-w-[200px] bg-white rounded-xl border border-[#D4E4D4] p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {drill.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full text-xs text-[#6B7C6B]">{tag}</span>
                ))}
              </div>
            </div>
          )}
          {drill.skillsFocus?.length > 0 && (
            <div className="flex-1 min-w-[200px] bg-white rounded-xl border border-[#D4E4D4] p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Skills Focus</h3>
              <div className="flex flex-wrap gap-2">
                {drill.skillsFocus.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[#005028]/10 text-[#005028] rounded-full text-xs font-medium">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrillDetailPage;
