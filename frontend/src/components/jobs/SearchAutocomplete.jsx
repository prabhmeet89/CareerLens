import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Briefcase, Code2 } from 'lucide-react';
import api from '../../api/axiosClient';

/**
 * SearchAutocomplete
 *
 * Wraps a search input with a typeahead dropdown that shows:
 *  - Matching job titles fetched from /api/jobs/suggestions (debounced)
 *  - Matching canonical skill names (from the same endpoint)
 *
 * Props:
 *   value          {string}   — controlled input value
 *   onChange       {fn}       — called with new string value on every keystroke
 *   onSubmit       {fn}       — called with the committed search term (Enter / click / arrow+Enter)
 *   placeholder    {string}
 *   inputClassName {string}   — extra Tailwind classes for the <input>
 *   id             {string}   — id for the input element
 */
const SearchAutocomplete = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  inputClassName = '',
  id,
}) => {
  const [suggestions, setSuggestions] = useState({ titles: [], skills: [] });
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1); // index across flattened list
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Flattened ordered list for keyboard navigation: titles first, then skills
  const flatItems = [
    ...suggestions.titles.map((t) => ({ type: 'title', value: t })),
    ...suggestions.skills.map((s) => ({ type: 'skill', value: s })),
  ];

  // Fetch suggestions with 270ms debounce
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSuggestions({ titles: [], skills: [] });
      setOpen(false);
      return;
    }
    try {
      const res = await api.get(`/jobs/suggestions?q=${encodeURIComponent(q.trim())}`);
      if (res.data?.success) {
        const { titles = [], skills = [] } = res.data.data;
        setSuggestions({ titles, skills });
        setOpen(titles.length > 0 || skills.length > 0);
        setHighlighted(-1);
      }
    } catch {
      // Fail silently — autocomplete is a UX enhancement, not critical path
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 270);
    return () => clearTimeout(debounceRef.current);
  }, [value, fetchSuggestions]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectItem = (item) => {
    onChange(item.value);
    onSubmit(item.value);
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!open || flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      selectItem(flatItems[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  const hasAny = flatItems.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (hasAny) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && hasAny}
        aria-controls={open ? 'search-suggestions-listbox' : undefined}
        aria-activedescendant={
          open && highlighted >= 0 ? `suggestion-${highlighted}` : undefined
        }
        className={inputClassName}
      />

      {/* Dropdown */}
      {open && hasAny && (
        <div
          id="search-suggestions-listbox"
          role="listbox"
          aria-label="Job search suggestions"
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-[#1C1C1E] border border-linkedin-border rounded-xl shadow-linkedin-dropdown overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Title suggestions */}
          {suggestions.titles.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 text-[10px] font-bold text-linkedin-text-muted uppercase tracking-wider">
                <Briefcase className="w-3 h-3 text-linkedin-blue" />
                <span>Job Titles</span>
              </div>
              {suggestions.titles.map((title, idx) => {
                const isActive = highlighted === idx;
                return (
                  <button
                    key={`title-${idx}`}
                    id={`suggestion-${idx}`}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onMouseDown={(e) => {
                      // Use mousedown so the click fires before the input blur hides the list
                      e.preventDefault();
                      selectItem({ type: 'title', value: title });
                    }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 min-h-[40px] ${
                      isActive
                        ? 'bg-linkedin-blue text-white'
                        : 'text-linkedin-text-primary hover:bg-[#EDF3F8] dark:hover:bg-[#1A2B3C]'
                    }`}
                  >
                    <Briefcase className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-linkedin-text-secondary'}`} />
                    <span className="truncate">{title}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Skill suggestions */}
          {suggestions.skills.length > 0 && (
            <>
              {suggestions.titles.length > 0 && (
                <div className="mx-3 my-1 border-t border-linkedin-border" />
              )}
              <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 text-[10px] font-bold text-linkedin-text-muted uppercase tracking-wider">
                <Code2 className="w-3 h-3 text-linkedin-blue" />
                <span>Skills</span>
              </div>
              {suggestions.skills.map((skill, idx) => {
                const flatIdx = suggestions.titles.length + idx;
                const isActive = highlighted === flatIdx;
                return (
                  <button
                    key={`skill-${idx}`}
                    id={`suggestion-${flatIdx}`}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectItem({ type: 'skill', value: skill });
                    }}
                    onMouseEnter={() => setHighlighted(flatIdx)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 min-h-[40px] ${
                      isActive
                        ? 'bg-linkedin-blue text-white'
                        : 'text-linkedin-text-primary hover:bg-[#EDF3F8] dark:hover:bg-[#1A2B3C]'
                    }`}
                  >
                    <Code2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-linkedin-blue'}`} />
                    <span className="truncate">{skill}</span>
                    <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-linkedin-blue-light text-linkedin-blue'
                    }`}>
                      skill
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-linkedin-border bg-gray-50 dark:bg-[#141414] text-[10px] text-linkedin-text-muted">
            ↑↓ navigate · Enter select · Esc close
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
