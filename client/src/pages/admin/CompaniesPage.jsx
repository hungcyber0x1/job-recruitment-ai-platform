import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Building,
  CheckCircle,
  Clock,
  Flag,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Filter,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import AdminLayout from '../../layouts/AdminLayout';
import adminService from '../../services/adminService';
import useDebounce from '../../hooks/useDebounce';

const CompaniesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(inputValue, 500);
  const [verificationFilter, setVerificationFilter] = useState(
    () => searchParams.get('verification') || 'all'
  );
  const [industryTab, setIndustryTab] = useState(() => searchParams.get('industry') || 'all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch || undefined,
        is_verified: verificationFilter === 'all' ? undefined : verificationFilter === 'verified',
      };
      const response = await adminService.getCompanies(params);
      const rawData = response.data;
      if (rawData?.success) {
        const list = Array.isArray(rawData?.data) ? rawData.data : [];
        const sanitized = list.map((c) => ({
          id: c?.id ?? 0,
          company_name: String(c?.company_name ?? ''),
          company_logo: String(c?.company_logo ?? ''),
          company_website: String(c?.company_website ?? ''),
          company_description: String(c?.company_description ?? ''),
          location: String(c?.location ?? ''),
          city: String(c?.city ?? ''),
          industry: String(c?.industry ?? ''),
          category_name: String(c?.category_name ?? ''),
          company_size: String(c?.company_size ?? ''),
          is_verified: Boolean(c?.is_verified ?? false),
          flagged: Boolean(c?.flagged ?? false),
          job_count: Number(c?.job_count ?? c?.open_jobs_count ?? 0),
        }));
        setCompanies(sanitized);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, verificationFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, verificationFilter, industryTab]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (verificationFilter !== 'all') nextParams.set('verification', verificationFilter);
    if (industryTab !== 'all') nextParams.set('industry', industryTab);
    if (page > 1) nextParams.set('page', String(page));
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, searchParams, setSearchParams, verificationFilter, industryTab, page]);

  const industryKeywords = {
    tech: ['tech', 'software', 'it', 'cong nghe', 'công nghệ'],
    finance: ['finance', 'bank', 'fintech', 'tai chinh', 'tài chính'],
    manufacturing: ['manufact', 'factory', 'industrial', 'san xuat', 'sản xuất'],
  };

  const filteredCompanies = companies.filter((company) => {
    if (industryTab === 'all') {
      return true;
    }

    const searchableIndustry = `${company.industry} ${company.category_name}`.toLowerCase();
    return industryKeywords[industryTab]?.some((keyword) => searchableIndustry.includes(keyword));
  });

  const totalCompanies = filteredCompanies.length;
  const pendingCount = filteredCompanies.filter((c) => !c.is_verified).length;
  const flaggedCount = filteredCompanies.filter((c) => c.flagged).length;
  const displayedCompanies = filteredCompanies.slice((page - 1) * limit, page * limit);

  const statsCards = [
    {
      label: 'Tổng số công ty',
      value: totalCompanies.toLocaleString('vi-VN'),
      change: '+5.2%',
      changeUp: true,
    },
    {
      label: 'Chờ xác thực',
      value: pendingCount.toLocaleString('vi-VN'),
      change: '+12%',
      changeUp: true,
    },
    {
      label: 'Công ty bị gắn cờ',
      value: flaggedCount,
      change: '-2%',
      changeUp: false,
    },
  ];

  const industryTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'tech', label: 'Công nghệ' },
    { id: 'finance', label: 'Tài chính' },
    { id: 'manufacturing', label: 'Sản xuất' },
  ];

  const getStatusBadge = (company) => {
    if (company.flagged) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
          <Flag size={12} />
          ĐÃ GẮN CỜ
        </span>
      );
    }
    if (company.is_verified) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <CheckCircle size={12} />
          ĐÃ XÁC THỰC
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
        <Clock size={12} />
        CHỜ XÁC THỰC
      </span>
    );
  };

  const getTrustScore = (company) => {
    // Stable scoring based on verification status and job count
    const base = company.is_verified ? 8.5 : 4.2;
    const bonus = Math.min(1.5, (company.job_count || 0) * 0.1);
    return (base + bonus).toFixed(1);
  };

  const start = totalCompanies ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, totalCompanies);

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        {/* Tiêu đề + Search (trong header layout đã có search, có thể chỉ cần title) */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Công ty</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và xác minh các công ty trong hệ thống RecruitAI
          </p>
        </div>

        {/* 3 thẻ KPI */}
        <div className="grid gap-4 sm:grid-cols-3">
          {statsCards.map((card) => (
            <div key={card.label} className="p-5 rounded-2xl bg-white border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
              <p
                className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
                  card.changeUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {card.changeUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {card.change}
              </p>
            </div>
          ))}
        </div>

        {/* Tab ngành + Dropdown lọc */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Tìm kiếm công ty..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <div className="flex rounded-xl bg-white border border-slate-200 p-1">
            {industryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setIndustryTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  industryTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-primary/10 hover:text-emerald-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="all">Mức độ xác thực</option>
            <option value="verified">Đã xác thực</option>
            <option value="unverified">Chờ xác thực</option>
          </select>
          <button
            type="button"
            className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Filter size={18} />
            Lọc nâng cao
          </button>
        </div>

        {/* Bảng công ty */}
        <div className="data-table-shell">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
            </div>
          ) : (
            <>
              <div className="data-table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Công ty</th>
                      <th className="px-6 py-4">Ngành nghề</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Tin đăng</th>
                      <th className="px-6 py-4">Trust Score</th>
                      <th className="px-6 py-4 text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCompanies.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                          Không tìm thấy công ty
                        </td>
                      </tr>
                    ) : (
                      displayedCompanies.map((company) => {
                        const score = parseFloat(getTrustScore(company));
                        const scoreColor =
                          score >= 8
                            ? 'bg-emerald-500'
                            : score >= 5
                              ? 'bg-amber-500'
                              : 'bg-red-500';
                        return (
                          <tr key={company.id}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                  {company.company_logo ? (
                                    <img
                                      src={company.company_logo}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Building size={20} className="text-slate-500" />
                                  )}
                                </div>
                                <div>
                                  <Link
                                    to={`/admin/companies/${company.id}`}
                                    className="font-semibold text-slate-900 hover:text-emerald-400"
                                  >
                                    {company.company_name}
                                  </Link>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {company.location || company.city || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {company.industry || company.category_name || '—'}
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(company)}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                              {company.job_count ?? company.open_jobs_count ?? 0}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${scoreColor}`}
                                    style={{ width: `${score * 10}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-slate-900">
                                  {score}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                className="p-2 rounded-lg text-slate-500 hover:bg-muted/55 hover:text-foreground"
                                aria-label="Menu"
                              >
                                <MoreVertical size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {totalCompanies > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border bg-muted/25 px-6 py-4">
                  <p className="text-sm text-slate-500">
                    Hiển thị {start}-{end} trong số {totalCompanies.toLocaleString('vi-VN')} công ty
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    {Array.from({ length: Math.ceil(totalCompanies / limit) }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          Math.abs(p - page) <= 2 ||
                          p === 1 ||
                          p === Math.ceil(totalCompanies / limit)
                      )
                      .map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold ${
                            page === p
                              ? 'bg-emerald-500 text-white'
                              : 'border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(totalCompanies / limit)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CompaniesPage;
