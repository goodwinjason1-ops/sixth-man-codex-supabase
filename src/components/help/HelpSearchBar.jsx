import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { searchHelpContent, HELP_PAGES } from '../../data/helpContent';

const POPULAR_TOPICS = [
  { label: 'Tryout scoring', query: 'tryout scoring' },
  { label: 'Attendance', query: 'attendance' },
  { label: 'Player assessment', query: 'assessment' },
  { label: 'Roles & permissions', query: 'roles permissions' },
  { label: 'Offline mode', query: 'offline' },
  { label: 'Training plans', query: 'training plans' },
];

const HelpSearchBar = ({ roleFilter = null }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
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
    setShowSuggestions(false);
    setActiveIndex(-1);
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
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (result) => {
    setShowDropdown(false);
    setShowSuggestions(false);
    setQuery('');
    navigate(result.path);
  };

  const handleSuggestionClick = (topic) => {
    setQuery(topic.query);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    } else if (query.trim().length < 2) {
      setShowSuggestions(true);
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, r) => {
    const group = r.type === 'global-faq' || r.type === 'faq' ? 'faqs' : 'sections';
    if (!acc[group]) acc[group] = [];
    acc[group].push(r);
    return acc;
  }, {});

  const flatResults = [...(groupedResults.sections || []), ...(groupedResults.faqs || [])];
  const sectionCount = (groupedResults.sections || []).length;

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(flatResults[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
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

  const renderResultItem = (r, idx) => (
    <button
      key={`${r.roleSlug}-${r.sectionId}`}
      onClick={() => handleSelect(r)}
      className={`w-full text-left px-4 py-3 transition-colors border-b border-[#1a8a68]/30 last:border-b-0 ${
        idx === activeIndex ? 'bg-[#1a8a68]/40' : 'hover:bg-[#1a8a68]/30'
      }`}
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
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search help topics..."
          className="w-full bg-[#0d5943] border border-[#1a8a68] rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#22c55e] transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); setShowSuggestions(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Popular suggestions on focus */}
      {showSuggestions && !showDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-[#0d5943] border border-[#1a8a68] rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-[#1a8a68]/30">
            <span className="text-white/40 text-xs font-medium">Popular topics</span>
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            {POPULAR_TOPICS.map((topic) => (
              <button
                key={topic.query}
                onClick={() => handleSuggestionClick(topic)}
                className="px-3 py-1.5 bg-[#1a8a68]/30 hover:bg-[#1a8a68]/50 rounded-lg text-white/80 text-xs transition-colors"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grouped search results */}
      {showDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-[#0d5943] border border-[#1a8a68] rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {(groupedResults.sections || []).length > 0 && (
            <>
              <div className="px-4 py-1.5 bg-[#0a3d2e]/50 border-b border-[#1a8a68]/30">
                <span className="text-white/40 text-[10px] font-medium uppercase tracking-wide">Guide Sections</span>
              </div>
              {groupedResults.sections.map((r, i) => renderResultItem(r, i))}
            </>
          )}
          {(groupedResults.faqs || []).length > 0 && (
            <>
              <div className="px-4 py-1.5 bg-[#0a3d2e]/50 border-b border-[#1a8a68]/30">
                <span className="text-white/40 text-[10px] font-medium uppercase tracking-wide">FAQs</span>
              </div>
              {groupedResults.faqs.map((r, i) => renderResultItem(r, sectionCount + i))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HelpSearchBar;
