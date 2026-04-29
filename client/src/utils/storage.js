const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Handle quota exceeded: try clearing non-critical data and retry
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_FILE_CORRUPTED') {
        try {
          // Try to free space by removing non-essential cached items
          localStorage.removeItem('admin_cache_stats');
          localStorage.removeItem('admin_cache_chart');
          localStorage.removeItem('admin_cache_settings');
          localStorage.removeItem('admin_cache_categories');
          localStorage.removeItem('admin_cache_skills');
          localStorage.setItem(key, JSON.stringify(value));
          return;
        } catch {
          // Still failed — fall through to error handling
        }
      }
      if (import.meta.env.DEV) {
        console.error('Storage set error:', e);
      }
    }
  },
  remove: (key) => {
    localStorage.removeItem(key);
  },
  clear: () => {
    localStorage.clear();
  },
};

export default storage;
