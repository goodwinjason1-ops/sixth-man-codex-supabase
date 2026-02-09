import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { searchHelpContent, HELP_PAGES } from '../../data/helpContent';

const HelpSearchBar = ({ roleFilter = null }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const doSearch = useCallback((q) => {
    if (q.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const r = searchHelpContent(q, roleFilter);
    setResults(r);
    setShowDropdown(r.length > 0);
  }, [roleFilter]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (result) => {
    setShowDropdown(false);
    setQuery('');
    navigate(result.path);
  };

  const highlightMatch = (text, q) => {
    if (!q || q.length < 2) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#4ade80]/30 text-white rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search help topics..."
          className="w-full bg-[#0d5943] border border-[#1a8a68] rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#22c55e] transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-[#0d5943] border border-[#1a8a68] rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {results.map((r) => (
            <button
              key={`${r.roleSlug}-${r.sectionId}`}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 hover:bg-[#1a8a68]/30 transition-colors border-b border-[#1a8a68]/30 last:border-b-0"
            >
              <div className="flex items-center gap-2 mb-0.5">
                {r.pageTitle && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a8a68]/50 text-white/60">
                    {r.pageTitle}
                  </span>
                )}
                <span className="text-white text-sm font-medium">
                  {highlightMatch(r.title, query)}
                </span>
              </div>
              {r.snippet && (
                <p className="text-white/50 text-xs line-clamp-2 mt-0.5">
                  {highlightMatch(r.snippet, query)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpSearchBar;
