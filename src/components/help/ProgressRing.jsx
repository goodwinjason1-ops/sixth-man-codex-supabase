import React from 'react';

/**
 * ProgressRing
 *
 * SVG circular progress indicator with percentage text in center.
 * Two concentric circles with stroke-dashoffset for the arc.
 *
 * Props:
 *   percent      - 0-100 progress value
 *   size         - Diameter in px (default 80)
 *   strokeWidth  - Ring stroke width (default 6)
 *   color        - Progress arc color (default '#4ade80')
 *   trackColor   - Background track color (default 'rgba(74, 222, 128, 0.15)')
 *   label        - Optional label below the percentage
 *   showPercent  - Show percentage text in center (default true)
 *   animated     - Animate the fill on mount (default true)
 */

const ProgressRing = ({
  percent = 0,
  size = 80,
  strokeWidth = 6,
  color = '#4ade80',
  trackColor = 'rgba(74, 222, 128, 0.15)',
  label,
  showPercent = true,
  animated = true,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercent / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={animated ? 'animate-progress-fill' : ''}
            style={{
              strokeDashoffset: offset,
              transition: animated ? 'stroke-dashoffset 1s ease-out' : 'none',
            }}
          />
        </svg>

        {/* Center text */}
        {showPercent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold"
              style={{
                color,
                fontSize: size * 0.22,
                lineHeight: 1,
              }}
            >
              {Math.round(clampedPercent)}%
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className="text-[10px] text-white/60 text-center leading-tight">{label}</span>
      )}
    </div>
  );
};

export default ProgressRing;
