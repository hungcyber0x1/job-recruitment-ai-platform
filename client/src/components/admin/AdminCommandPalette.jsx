/**
 * Command Palette v2 — Unified navigation search
 *
 * Changes from v1:
 * - Uses ADMIN_NAV_GROUPS from adminNavigation.js
 * - Cleaner dark theme UI
 * - Keyboard navigation with ArrowUp/Down
 * - ESC to close, Enter to select
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, X } from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '@/config/adminNavigation';
import { cn } from '@/utils';

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const flattenedItems = useMemo(() => {
    return ADMIN_NAV_GROUPS.flatMap(group =>
      group.items.map(item => ({
        ...item,
        groupLabel: group.title.replace(/^[0-9]+\.\s*/, ''),
      }))
    );
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return flattenedItems;
    const query = search.toLowerCase();
    return flattenedItems.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.groupLabel.toLowerCase().includes(query)
    );
  }, [search, flattenedItems]);

  const handleClose = useCallback(() => {
    setSearch('');
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((item) => {
    navigate(item.path);
    handleClose();
  }, [handleClose, navigate]);

  const handleSearchChange = useCallback((event) => {
    setSearch(event.target.value);
    setSelectedIndex(0);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter' && filteredItems.length > 0) {
        e.preventDefault();
        handleSelect(filteredItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleSelect, filteredItems, isOpen, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-white/10 bg-[#0B1120]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          <Search size={18} className="shrink-0 text-primary" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none"
            placeholder="Tìm trang, menu, tác vụ..."
            value={search}
            onChange={handleSearchChange}
          />
          <button
            onClick={handleClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm font-bold text-slate-500">Không tìm thấy kết quả nào</p>
              <p className="mt-1 text-xs text-slate-600">Thử từ khóa khác</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const active = index === selectedIndex;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150',
                      active
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-slate-300 hover:bg-white/5'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-primary/20'
                    )}>
                      <Icon size={15} className={active ? 'text-white' : 'text-slate-400 group-hover:text-primary'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-bold truncate', active ? 'text-white' : 'text-slate-200')}>
                        {item.label}
                      </p>
                      <p className={cn('text-xs font-medium truncate', active ? 'text-white/60' : 'text-slate-500')}>
                        {item.groupLabel}
                      </p>
                    </div>
                    {active && <ArrowRight size={13} className="shrink-0 text-white/50" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs">↑↓</kbd> Di chuyển
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs">↵</kbd> Chọn
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-normal text-primary/50">
            HireBOT Command
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
