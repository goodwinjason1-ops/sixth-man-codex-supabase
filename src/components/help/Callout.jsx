import React from 'react';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Callout
 *
 * Styled callout box with variants for contextual messaging.
 *
 * Props:
 *   variant  - 'info' (blue), 'warning' (amber), 'success' (green)
 *   title    - Optional bold heading
 *   children - Body text or JSX
 *   text     - Alternative to children for simple text
 */

const VARIANTS = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: Info,
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-400',
    textColor: 'text-blue-200/80',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-400',
    textColor: 'text-amber-200/80',
  },
  success: {
    bg: 'bg-[#005028]/10',
    border: 'border-[#00A651]/30',
    icon: CheckCircle2,
    iconColor: 'text-[#00A651]',
    titleColor: 'text-[#00A651]',
    textColor: 'text-[#00A651]/80',
  },
};

const Callout = ({ variant = 'info', title, text, children }) => {
  const v = VARIANTS[variant] || VARIANTS.info;
  const Icon = v.icon;

  return (
    <div className={`${v.bg} border ${v.border} rounded-lg p-3`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`w-5 h-5 ${v.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="min-w-0 flex-1">
          {title && (
            <p className={`text-sm font-semibold ${v.titleColor} mb-0.5`}>{title}</p>
          )}
          {(text || children) && (
            <div className={`text-xs ${v.textColor} leading-relaxed`}>
              {children || text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Callout;
