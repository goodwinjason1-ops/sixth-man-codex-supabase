import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb Navigation Component
 *
 * Props:
 * - path: Array of breadcrumb items [{label: string, url?: string}]
 *   - If url is provided, the segment is clickable
 *   - Last item should not have url (current page)
 * - showHomeIcon: boolean - Show home icon for first "Home" segment (default: true)
 * - className: Additional CSS classes for the container
 *
 * Example:
 * <Breadcrumb path={[
 *   { label: "Home", url: "/welcome" },
 *   { label: "Coach Dashboard", url: "/coach" },
 *   { label: "Skills Assessment" }
 * ]} />
 */
const Breadcrumb = ({ path = [], showHomeIcon = true, className = '' }) => {
  const navigate = useNavigate();

  if (!path || path.length === 0) return null;

  const handleClick = (url) => {
    if (url) {
      navigate(url);
    }
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {path.map((item, index) => {
          const isLast = index === path.length - 1;
          const isFirst = index === 0;
          const isClickable = !isLast && item.url;

          return (
            <li key={index} className="flex items-center">
              {/* Separator (not for first item) */}
              {!isFirst && (
                <ChevronRight className="w-3.5 h-3.5 text-[#1a8a68] mx-1 flex-shrink-0" />
              )}

              {/* Breadcrumb Item */}
              {isClickable ? (
                <button
                  onClick={() => handleClick(item.url)}
                  className="flex items-center gap-1.5 text-[#4ade80] hover:text-white hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:ring-offset-2 focus:ring-offset-[#0a3d2e] rounded px-1 -mx-1"
                >
                  {/* Home icon for first item if it's "Home" */}
                  {isFirst && showHomeIcon && item.label.toLowerCase() === 'home' && (
                    <Home className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{item.label}</span>
                  {/* Show abbreviated on mobile for first item */}
                  {isFirst && showHomeIcon && item.label.toLowerCase() === 'home' ? (
                    <span className="sm:hidden">Home</span>
                  ) : (
                    <span className="sm:hidden">{item.label}</span>
                  )}
                </button>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast
                      ? 'text-white font-medium'
                      : 'text-[#1a8a68]'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {/* Home icon for first item if it's "Home" and not clickable */}
                  {isFirst && showHomeIcon && item.label.toLowerCase() === 'home' && (
                    <Home className="w-3.5 h-3.5" />
                  )}
                  {/* Truncate long labels on mobile */}
                  <span className="truncate max-w-[150px] sm:max-w-none">
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
