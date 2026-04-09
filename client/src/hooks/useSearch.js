import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import useDebounce from './useDebounce';

const useSearch = (endpoint, initialParams = {}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState(initialParams);

  const debouncedQuery = useDebounce(query, 500);

  const search = useCallback(async () => {
    // Don't search if query is empty
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(endpoint, {
        params: { search: debouncedQuery, ...params },
      });
      setResults(response.data.data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, debouncedQuery, params]);

  // Auto-trigger search when debounced query or params change
  useEffect(() => {
    search();
  }, [search]);

  return { query, setQuery, results, loading, search, setParams };
};

export default useSearch;
