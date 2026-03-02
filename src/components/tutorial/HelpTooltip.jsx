import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';

const HelpTooltip = ({ text, children }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState('center');
  const ref = useRef(null);
  const tooltipRef = useRef(null);

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

  // Adjust tooltip position to stay within viewport
  useEffect(() => {
    if (open && tooltipRef.current && ref.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = ref.current.getBoundingClientRect();

      if (tooltipRect.right > window.innerWidth - 8) {
        setPosition('right');
      } else if (tooltipRect.left < 8) {
        setPosition('left');
      } else {
        setPosition('center');
      }
    }
  }, [open]);

  const tooltipPositionClass =
    position === 'right'
      ? 'right-0'
      : position === 'left'
      ? 'left-0'
      : 'left-1/2 -translate-x-1/2';

  const arrowPositionClass =
    position === 'right'
      ? 'right-3'
      : position === 'left'
      ? 'left-3'
      : 'left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      {children}
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Show help"
      >
        <HelpCircle className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div
          ref={tooltipRef}
          className={`absolute top-full ${tooltipPositionClass} mt-2 z-[9999] animate-scaleIn`}
        >
          {/* Arrow pointing up */}
          <div className={`w-2 h-2 bg-[#F5F9F5] border-t border-l border-[#D4E4D4] rotate-45 absolute ${arrowPositionClass} -top-1`} />
          <div className="bg-[#F5F9F5] border border-[#D4E4D4] rounded-lg p-3 shadow-xl max-w-[300px] min-w-[200px]">
            <p className="text-gray-700 text-xs leading-relaxed">{text}</p>
          </div>
        </div>
      )}
    </span>
  );
};

export default HelpTooltip;
