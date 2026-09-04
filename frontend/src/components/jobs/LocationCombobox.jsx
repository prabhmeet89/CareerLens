import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, ChevronDown, Check, X } from 'lucide-react';
import api from '../../api/axiosClient';

/**
 * LocationCombobox
 *
 * Searchable popover combobox for filtering jobs by real locations in the database.
 * Fetches locations from GET /api/jobs/location-suggestions.
 *
 * Props:
 *   value          {string}   — currently selected location (or 'all' / empty)
 *   onChange       {fn}       — called with selected location string (or 'all')
 *   className      {string}   — optional container class
 */
const LocationCombobox = ({ value = 'all', onChange, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const isFiltered = value && value !== 'all';

  // Fetch locations from backend
  const fetchLocations = useCallback(async (searchQuery = '') => {
    try {
      setLoading(true);
      const endpoint = searchQuery.trim()
        ? `/jobs/location-suggestions?q=${encodeURIComponent(searchQuery.trim())}`
        : `/jobs/location-suggestions`;
      const res = await api.get(endpoint);
      if (res.data?.success && Array.isArray(res.data?.data?.locations)) {
        setLocations(res.data.data.locations);
      }
    } catch (err) {
      console.warn('[LocationCombobox] Failed to fetch locations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Debounced search when query changes
  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLocations(query);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, fetchLocations]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setHighlightedIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const handleSelect = (locName) => {
    onChange(locName);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('all');
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    const totalItems = 1 + locations.length; // 1 for 'All Cities'

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === 0) {
        handleSelect('all');
      } else if (highlightedIndex > 0 && locations[highlightedIndex - 1]) {
        handleSelect(locations[highlightedIndex - 1].name);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-xs ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] p-1 rounded-xl">
        <span className="text-[11px] font-bold text-linkedin-text-secondary px-1.5 flex items-center gap-1 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-linkedin-blue" /> Location:
        </span>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all min-h-[36px] flex items-center gap-1.5 shrink-0 ${
              isFiltered
                ? 'bg-linkedin-blue text-white shadow-2xs font-bold'
                : 'bg-white dark:bg-[#141414] text-linkedin-text-secondary hover:text-linkedin-blue border border-gray-200/80 dark:border-[#2A2A2A] hover:border-linkedin-blue/30'
          }`}
        >
          <span className="truncate max-w-[140px] text-left">
            {isFiltered ? value : 'All Cities'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-linkedin-danger rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors focus:outline-none"
            aria-label="Clear location filter"
            title="Clear location filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Filter jobs by city"
          className="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-[#1C1C1E] border border-linkedin-border rounded-xl shadow-xl dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-80"
        >
          {/* Search Header */}
          <div className="p-2 border-b border-linkedin-border bg-linkedin-inset">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search city / location…"
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-lg text-linkedin-text-primary placeholder:text-linkedin-text-muted focus:outline-none focus:border-linkedin-blue focus:ring-1 focus:ring-linkedin-blue transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Location List */}
          <div className="overflow-y-auto flex-1 divide-y divide-linkedin-border p-1">
            {/* 'All Cities' option */}
            {!query.trim() && (
              <button
                type="button"
                role="option"
                aria-selected={!isFiltered}
                onClick={() => handleSelect('all')}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors min-h-[34px] ${
                  highlightedIndex === 0
                    ? 'bg-linkedin-accent-light text-linkedin-blue'
                    : !isFiltered
                    ? 'bg-linkedin-accent-light text-linkedin-blue font-bold'
                    : 'text-linkedin-text-primary hover:bg-gray-50 dark:hover:bg-[#2A2A2A]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>All Cities & Locations</span>
                </div>
                {!isFiltered && <Check className="w-3.5 h-3.5 text-linkedin-blue" />}
              </button>
            )}

            {loading ? (
              <div className="py-6 text-center text-xs text-gray-400">
                Loading locations…
              </div>
            ) : locations.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No matching locations found
              </div>
            ) : (
              locations.map((loc, idx) => {
                const itemIndex = query.trim() ? idx : idx + 1;
                const isSelected = value?.toLowerCase() === loc.name.toLowerCase();
                const isHighlighted = highlightedIndex === itemIndex;

                return (
                  <button
                    key={loc.name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(loc.name)}
                    onMouseEnter={() => setHighlightedIndex(itemIndex)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors min-h-[34px] ${
                      isHighlighted
                        ? 'bg-linkedin-accent-light text-linkedin-blue'
                        : isSelected
                        ? 'bg-linkedin-accent-light text-linkedin-blue font-bold'
                        : 'text-linkedin-text-primary hover:bg-gray-50 dark:hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-linkedin-blue' : 'text-gray-400'}`} />
                      <span className="truncate">{loc.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-linkedin-text-muted bg-linkedin-inset dark:bg-[#2A2A2A] px-1.5 py-0.5 rounded-full">
                        {loc.count}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-linkedin-blue" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-linkedin-border bg-linkedin-inset text-[10px] text-linkedin-text-muted flex items-center justify-between">
            <span>Dynamic locations from live jobs</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationCombobox;
