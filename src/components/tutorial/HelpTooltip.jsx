import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';

const HelpTooltip = ({ text, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const handleOutsideClick = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.target)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [open, handleOutsideClick]);

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      {children}
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Show help"
      >
        <HelpCircle className="w-3 h-3 text-white/60" />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-scaleIn">
          <div className="bg-[#0a3d2e] border border-[#1a8a68] rounded-lg p-3 shadow-xl max-w-[200px]">
            <p className="text-white/80 text-xs leading-relaxed">{text}</p>
          </div>
          {/* Arrow */}
          <div className="w-2 h-2 bg-[#0a3d2e] border-b border-r border-[#1a8a68] rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
        </div>
      )}
    </span>
  );
};

export default HelpTooltip;
