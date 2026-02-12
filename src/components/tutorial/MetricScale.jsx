import React from 'react';
import * as Icons from 'lucide-react';

const LEVEL_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
];

const MetricScale = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="space-y-4">
      {metrics.map((metric, mi) => {
        const IconComponent = Icons[metric.icon] || Icons.Circle;
        return (
          <div key={mi} className="bg-[#F5F9F5] rounded-lg p-3 border border-[#D4E4D4]/50">
            <div className="flex items-center gap-2 mb-2">
              <IconComponent className="w-4 h-4 text-[#00A651]" />
              <h4 className="text-[#00A651] font-semibold text-sm">{metric.name}</h4>
            </div>
            <div className="space-y-1.5">
              {metric.levels.map((level, li) => (
                <div key={li} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full ${LEVEL_COLORS[li]} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-gray-800 text-[10px] font-bold">{li + 1}</span>
                  </div>
                  <span className="text-gray-600 text-xs">{level}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricScale;
