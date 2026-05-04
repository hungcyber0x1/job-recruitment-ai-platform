import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminService from '../services/adminService';
import useDebounce from './useDebounce';
import { useNotification } from '../context/NotificationContext';

const INDUSTRY_KEYWORDS = {
  tech: ['tech', 'software', 'it', 'cong nghe', 'cong-nghe', 'công nghệ'],
  finance: ['finance', 'bank', 'fintech', 'tai chinh', 'tài chính'],
  manufacturing: ['manufact', 'factory', 'industrial', 'san xuat', 'sản xuất'],
};

const useAdminCompanies = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page'), 10) || 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    verification: searchParams.get('verification') || 'all',
    industry: searchParams.get('industry') || 'all',
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        is_verified:
          filters.verification === 'verified'
            ? true
            : filters.verification === 'unverified'
              ? false
              : undefined,
        flagged: filters.verification === 'flagged' ? true : undefined,
      };

      const response = await adminService.getCompanies(params);
      const rawData = response.data;

      if (rawData?.success) {
        setCompanies(rawData.data || []);
        if (rawData.pagination) {
          setPagination((prev) => ({ ...prev, ...rawData.pagination }));
        }
        return;
      }

      throw new Error(rawData?.message || 'Failed to fetch companies');
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.message);
      showNotification('Không thể tải danh sách công ty', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.verification, pagination.page, pagination.limit, showNotification]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch) nextParams.set('search', debouncedSearch);
    if (filters.verification !== 'all') nextParams.set('verification', filters.verification);
    if (filters.industry !== 'all') nextParams.set('industry', filters.industry);
    if (pagination.page > 1) nextParams.set('page', String(pagination.page));

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    debouncedSearch,
    filters.verification,
    filters.industry,
    pagination.page,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const processedCompanies = useMemo(() => {
    if (filters.industry === 'all') return companies;

    return companies.filter((company) => {
      const searchableIndustry =
        `${company.industry || ''} ${company.category_name || ''}`.toLowerCase();
      return INDUSTRY_KEYWORDS[filters.industry]?.some((keyword) =>
        searchableIndustry.includes(keyword)
      );
    });
  }, [companies, filters.industry]);

  const handleVerifyToggle = async (company) => {
    try {
      await adminService.verifyCompany(company.id, !company.is_verified);
      showNotification(
        !company.is_verified ? 'Đã xác thực công ty.' : 'Đã chuyển về trạng thái chờ.',
        'success'
      );
      fetchCompanies();
    } catch {
      showNotification('Không thể cập nhật trạng thái xác thực', 'error');
    }
  };

  const handleFlagToggle = async (company) => {
    try {
      await adminService.flagCompany(company.id, !company.flagged);
      showNotification(!company.flagged ? 'Đã gắn cờ công ty.' : 'Đã bỏ gắn cờ.', 'success');
      fetchCompanies();
    } catch {
      showNotification('Không thể cập nhật trạng thái gắn cờ', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công ty này?')) return;

    try {
      await adminService.deleteCompany(id);
      showNotification('Đã xóa công ty thành công.', 'success');
      fetchCompanies();
    } catch {
      showNotification('Không thể xóa công ty', 'error');
    }
  };

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const setPage = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return {
    companies: processedCompanies,
    allCompanies: companies,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    setPage,
    handleVerifyToggle,
    handleFlagToggle,
    handleDelete,
    refresh: fetchCompanies,
  };
};

export default useAdminCompanies;
