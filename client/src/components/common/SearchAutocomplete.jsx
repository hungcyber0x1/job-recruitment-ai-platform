import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const SearchAutocomplete = ({
  placeholder = 'Tìm kiếm...',
  value = '',
  onChange,
  onSearch,
  suggestions = [],
  isLoading = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else {
        onSearch(value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion) => {
    const term = typeof suggestion === 'string' ? suggestion : suggestion.text;
    onChange(term);
    onSearch(term);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-medium transition-all focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 shadow-sm"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        ) : value ? (
          <button
            onClick={() => {
              onChange('');
              onSearch('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        ) : null}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[110] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto p-1">
            {suggestions.map((suggestion, index) => {
              const text = typeof suggestion === 'string' ? suggestion : suggestion.text;
              const subtext = typeof suggestion === 'string' ? null : suggestion.subtext;

              return (
                <button
                  key={index}
                  onClick={() => handleSelect(suggestion)}
                  className={cn(
                    'flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors',
                    index === activeIndex
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <span className="text-sm font-bold">{text}</span>
                  {subtext && (
                    <span className="text-[11px] text-slate-400 font-medium">{subtext}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
