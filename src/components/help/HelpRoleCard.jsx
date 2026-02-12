import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

const HelpRoleCard = ({ slug, title, subtitle, icon, badgeStyle, path }) => {
  const navigate = useNavigate();
  const IconComponent = Icons[icon] || Icons.HelpCircle;

  return (
    <button
      onClick={() => navigate(path)}
      className="w-full bg-white border border-[#D4E4D4] rounded-xl p-4 text-left hover:border-[#00A651] transition-all active:scale-[0.98] group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${badgeStyle || 'bg-[#D4E4D4]/50'}`}>
          <IconComponent className="w-5 h-5 text-gray-800" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-800 font-semibold text-sm">{title}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
    </button>
  );
};

export default HelpRoleCard;
