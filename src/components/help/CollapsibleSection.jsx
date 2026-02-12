import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import iconMap from '../../utils/iconMap';
import ContentBlockRenderer from './ContentBlockRenderer';

const CollapsibleSection = ({ id, title, icon, content, defaultOpen = false, forceOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen || forceOpen);
  const ref = useRef(null);
  const IconComponent = iconMap[icon] || iconMap.HelpCircle;

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [forceOpen]);

  return (
    <div id={id} ref={ref} className="bg-white border border-[#D4E4D4] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4E4D4]/50 rounded-lg flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-[#00A651]" />
          </div>
          <h3 className="text-gray-800 font-semibold text-sm">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#00A651]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#00A651]" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-gray-700 text-sm leading-relaxed">
          <ContentBlockRenderer blocks={content} />
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
