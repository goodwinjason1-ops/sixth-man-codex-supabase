import React from 'react';
import { Lightbulb } from 'lucide-react';

const ProTip = ({ text }) => {
  if (!text) return null;
  return (
    <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/90">
          <strong className="text-amber-400">Pro Tip:</strong> {text}
        </p>
      </div>
    </div>
  );
};

export default ProTip;
