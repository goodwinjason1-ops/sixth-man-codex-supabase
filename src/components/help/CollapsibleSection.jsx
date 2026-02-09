import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as Icons from 'lucide-react';
import ContentBlockRenderer from './ContentBlockRenderer';

const CollapsibleSection = ({ id, title, icon, content, defaultOpen = false, forceOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen || forceOpen);
  const ref = useRef(null);
  const IconComponent = Icons[icon] || Icons.HelpCircle;

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [forceOpen]);

  return (
    <div id={id} ref={ref} className="bg-[#0d5943] border border-[#1a8a68] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0d5943]/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1a8a68]/50 rounded-lg flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-[#4ade80]" />
          </div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#4ade80]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#4ade80]" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-white/80 text-sm leading-relaxed">
          <ContentBlockRenderer blocks={content} />
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
