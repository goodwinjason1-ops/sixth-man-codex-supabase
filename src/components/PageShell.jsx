import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Breadcrumb from './Breadcrumb';

const maxWidthClasses = {
  lg: 'max-w-lg',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

const PageShell = ({
  title,
  subtitle,
  breadcrumbs,
  backTo,
  headerActions,
  maxWidth = '7xl',
  noPadding = false,
  children,
}) => {
  const navigate = useNavigate();
  const mwClass = maxWidthClasses[maxWidth] || 'max-w-7xl';

  return (
    <div className="min-h-screen bg-[#0a3d2e] text-white pb-20">
      {/* Sticky header */}
      <div className="bg-[#0d5943] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-white/60 text-sm truncate">{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="px-4 py-2">
          <Breadcrumb path={breadcrumbs} />
        </div>
      )}

      {/* Content area */}
      <div className={noPadding ? '' : `${mwClass} mx-auto px-4 py-4`}>
        {children}
      </div>
    </div>
  );
};

export default PageShell;
