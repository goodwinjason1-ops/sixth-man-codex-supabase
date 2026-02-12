import React from 'react';
import { Clock, Users, Star } from 'lucide-react';
import { DRILL_CATEGORIES, CATEGORY_COLORS, DIFFICULTY_COLORS } from '../../constants/drills';

const DrillCard = ({ drill, onClick }) => {
  const category = DRILL_CATEGORIES[drill.category] || {};
  const colorSet = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
  const difficultyStyle = DIFFICULTY_COLORS[drill.difficulty] || '';

  const renderStars = (rating) => {
    const stars = [];
    const rounded = Math.round(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rounded ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-xl border border-[#D4E4D4] hover:border-[#00A651]/50 hover:shadow-md transition-all text-left w-full p-5"
    >
      {/* Category & Difficulty */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorSet.badge}`}>
          {category.label}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${difficultyStyle}`}>
          {drill.difficulty}
        </span>
      </div>

      {/* Name */}
      <h3 className="font-bold text-gray-800 group-hover:text-[#005028] transition-colors mb-2 line-clamp-1">
        {drill.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-[#6B7C6B] mb-3 line-clamp-2">{drill.description}</p>

      {/* Meta Row */}
      <div className="flex items-center gap-4 text-xs text-[#6B7C6B] mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {drill.duration} min
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {drill.minPlayers}-{drill.maxPlayers}
        </span>
      </div>

      {/* Age Groups */}
      <div className="flex flex-wrap gap-1 mb-3">
        {drill.ageGroups?.map(ag => (
          <span key={ag} className="px-2 py-0.5 bg-[#F5F9F5] border border-[#D4E4D4] rounded text-xs text-[#6B7C6B] font-medium uppercase">
            {ag}
          </span>
        ))}
      </div>

      {/* Rating & Fun */}
      <div className="flex items-center justify-between pt-3 border-t border-[#D4E4D4]/50">
        <div className="flex items-center gap-1">
          {renderStars(drill.ratings?.average || 0)}
          {drill.ratings?.count > 0 && (
            <span className="text-xs text-[#6B7C6B] ml-1">({drill.ratings.count})</span>
          )}
        </div>
        {drill.funRating && (
          <span className="text-xs text-[#6B7C6B]">
            Fun: {['', '😐', '🙂', '😊', '😄', '🤩'][drill.funRating]}
          </span>
        )}
      </div>
    </button>
  );
};

export default DrillCard;
