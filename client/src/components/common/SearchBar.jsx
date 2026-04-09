import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

const QUICK_SEARCHES = ['React Developer', 'UI/UX Designer', 'Data Analyst', 'Product Manager'];

const SearchBar = ({ onSearch, className }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch({ query, location });
  };

  const handleQuickSearch = (term) => {
    setQuery(term);
    if (onSearch) onSearch({ query: term, location });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <form
        onSubmit={handleSearch}
        className={cn(
          'flex flex-col md:flex-row items-stretch bg-paper rounded-2xl md:rounded-full border transition-all duration-300',
          isFocused
            ? 'border-primary shadow-glow ring-4 ring-primary/10'
            : 'border-secondary shadow-premium hover:border-primary/30'
        )}
      >
        {/* Keyword Input */}
        <div className="flex-1 flex items-center gap-3 px-6 py-3.5 min-h-[64px] group">
          <Search
            size={20}
            className={cn(
              'shrink-0 transition-colors duration-300',
              isFocused && query !== ''
                ? 'text-primary'
                : 'text-txt-light group-hover:text-primary/70'
            )}
          />
          <input
            type="text"
            placeholder="Vị trí, kỹ năng, công ty..."
            className="flex-grow bg-transparent border-none outline-none text-foreground font-bold placeholder:text-txt-light text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-txt-light hover:text-error transition-colors rounded-full p-1.5 hover:bg-error/10"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:flex items-center">
          <div className="w-px h-10 bg-secondaryShadow"></div>
        </div>

        {/* Location Input */}
        <div className="flex items-center gap-3 px-6 py-3.5 md:w-64 min-h-[64px] group">
          <MapPin
            size={20}
            className={cn(
              'shrink-0 transition-colors duration-300',
              isFocused && location !== ''
                ? 'text-primary'
                : 'text-txt-light group-hover:text-primary/70'
            )}
          />
          <input
            type="text"
            placeholder="Địa điểm..."
            className="flex-grow bg-transparent border-none outline-none text-foreground font-bold placeholder:text-txt-light text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        {/* Search Button */}
        <div className="p-2.5">
          <Button
            type="submit"
            variant="primary"
            className="w-full md:w-auto h-full !rounded-2xl md:!rounded-full px-10 flex items-center justify-center gap-2 shadow-glow"
          >
            <Search size={18} />
            <span className="text-base">Tìm kiếm</span>
          </Button>
        </div>
      </form>

      {/* Quick search tags */}
      <div className="flex flex-wrap items-center gap-3 px-4">
        <span className="text-xs text-txt-muted font-bold tracking-tight uppercase">
          Tìm nhanh:
        </span>
        {QUICK_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => handleQuickSearch(term)}
            className="text-xs font-bold text-txt-muted hover:text-primary hover:bg-primary/10 px-4 py-2 rounded-full border border-secondary hover:border-primary/30 transition-all duration-300 hover-lift shadow-sm"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func,
  className: PropTypes.string,
};

SearchBar.defaultProps = {
  onSearch: undefined,
  className: '',
};

export default SearchBar;
