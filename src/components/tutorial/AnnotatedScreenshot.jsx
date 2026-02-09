import React from 'react';
import { Monitor } from 'lucide-react';

const POSITION_CLASSES = {
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom': 'bottom-3 left-1/2 -translate-x-1/2',
  'left': 'top-1/2 left-3 -translate-y-1/2',
  'right': 'top-1/2 right-3 -translate-y-1/2',
};

const AnnotatedScreenshot = ({ placeholderLabel, annotations = [] }) => {
  return (
    <div className="relative bg-[#0a3d2e] border-2 border-dashed border-[#1a8a68] rounded-xl p-6 min-h-[140px]">
      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center text-center opacity-40">
        <Monitor className="w-10 h-10 text-[#4ade80] mb-2" />
        <p className="text-white/60 text-xs">{placeholderLabel || 'Screenshot coming soon'}</p>
      </div>

      {/* Annotation labels */}
      {annotations.map((ann, i) => (
        <div
          key={i}
          className={`absolute ${POSITION_CLASSES[ann.position] || POSITION_CLASSES.center}`}
        >
          <div className="bg-[#4ade80] text-[#0a3d2e] px-2 py-1 rounded-md text-xs font-bold shadow-lg animate-bounce-arrow whitespace-nowrap">
            {ann.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnotatedScreenshot;
