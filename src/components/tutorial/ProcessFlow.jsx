import React from 'react';
import * as Icons from 'lucide-react';

/**
 * ProcessFlow
 *
 * Simpler linear step sequence: icon circles connected by lines.
 * Flexbox layout, always vertical on mobile. Used for session flows.
 *
 * Props:
 *   steps       - Array of { icon, label, description, color, completed }
 *   title       - Optional title above the flow
 *   description - Optional description text
 *   vertical    - Force vertical on all screens (default: false; auto-vertical on mobile)
 */

const DEFAULT_COLOR = '#4ade80';

const ProcessFlow = ({ steps = [], title, description, vertical = false }) => {
  /** Resolve a lucide-react icon by name, fallback to Circle */
  const getIcon = (iconName) => {
    if (!iconName) return Icons.Circle;
    return Icons[iconName] || Icons.Circle;
  };

  if (!steps.length) return null;

  return (
    <div className="space-y-2">
      {title && <p className="text-xs text-[#4ade80] font-semibold">{title}</p>}
      {description && <p className="text-white/70 text-xs">{description}</p>}

      {/* Horizontal layout for larger screens (unless forced vertical) */}
      {!vertical && (
        <div className="hidden sm:block bg-[#0a3d2e] border-2 border-dashed border-[#1a8a68] rounded-xl p-4 overflow-x-auto">
          <div className="flex items-start justify-center gap-0 min-w-fit">
            {steps.map((step, i) => {
              const StepIcon = getIcon(step.icon);
              const color = step.color || DEFAULT_COLOR;
              const isLast = i === steps.length - 1;

              return (
                <React.Fragment key={i}>
                  {/* Step */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 90 }}>
                    <div
                      className="flex items-center justify-center rounded-full border-2 shadow-lg transition-all"
                      style={{
                        width: 44,
                        height: 44,
                        minWidth: 44,
                        minHeight: 44,
                        borderColor: step.completed ? color : `${color}60`,
                        backgroundColor: step.completed ? `${color}20` : `${color}08`,
                      }}
                    >
                      {step.completed ? (
                        <Icons.Check className="w-5 h-5" style={{ color }} />
                      ) : (
                        <StepIcon className="w-5 h-5" style={{ color: step.completed ? color : `${color}90` }} />
                      )}
                    </div>
                    <span className="text-[10px] text-white font-medium text-center leading-tight max-w-[80px]">
                      {step.label}
                    </span>
                    {step.description && (
                      <span className="text-[9px] text-white/50 text-center leading-tight max-w-[80px]">
                        {step.description}
                      </span>
                    )}
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex items-center flex-shrink-0 mt-[20px]">
                      <div className="w-8 h-0.5 bg-[#4ade80]/30 relative">
                        <div
                          className="absolute right-0 top-1/2 -translate-y-1/2"
                          style={{
                            width: 0,
                            height: 0,
                            borderTop: '3px solid transparent',
                            borderBottom: '3px solid transparent',
                            borderLeft: '5px solid rgba(74, 222, 128, 0.4)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Vertical layout (always on mobile, or when forced) */}
      <div className={`${vertical ? 'block' : 'sm:hidden'} bg-[#0a3d2e] border-2 border-dashed border-[#1a8a68] rounded-xl p-4`}>
        <div className="flex flex-col items-start gap-0">
          {steps.map((step, i) => {
            const StepIcon = getIcon(step.icon);
            const color = step.color || DEFAULT_COLOR;
            const isLast = i === steps.length - 1;

            return (
              <React.Fragment key={i}>
                {/* Step row */}
                <div className="flex items-center gap-3 w-full">
                  <div
                    className="flex items-center justify-center rounded-full border-2 shadow-lg flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      minWidth: 44,
                      minHeight: 44,
                      borderColor: step.completed ? color : `${color}60`,
                      backgroundColor: step.completed ? `${color}20` : `${color}08`,
                    }}
                  >
                    {step.completed ? (
                      <Icons.Check className="w-5 h-5" style={{ color }} />
                    ) : (
                      <StepIcon className="w-5 h-5" style={{ color: step.completed ? color : `${color}90` }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white font-medium">{step.label}</p>
                    {step.description && (
                      <p className="text-[10px] text-white/50 leading-tight mt-0.5">{step.description}</p>
                    )}
                  </div>
                  {/* Step number */}
                  <span className="text-[10px] text-white/30 font-mono flex-shrink-0">
                    {i + 1}/{steps.length}
                  </span>
                </div>

                {/* Vertical connector */}
                {!isLast && (
                  <div className="flex items-center" style={{ paddingLeft: 20 }}>
                    <svg width="4" height="20" className="block">
                      <line
                        x1="2" y1="0" x2="2" y2="16"
                        stroke={`${color}50`}
                        strokeWidth="2"
                      />
                      <polygon points="0,16 4,16 2,20" fill={`${color}60`} />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcessFlow;
