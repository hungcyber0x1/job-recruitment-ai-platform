import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderOpen,
  FolderPlus,
  Mail,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import { useNotification } from '../../context/NotificationContext';
import { employerCandidateService } from '../../services';
import { cn } from '../../utils';

const PAGE_SIZE = 12;
const CUSTOM_FOLDER_KEY = 'employerTalentPoolFolders';

const BASE_FOLDERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'general', label: 'Đã lưu' },
  { id: 'engineering', label: 'Kỹ thuật' },
  { id: 'design', label: 'Thiết kế' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'leadership', label: 'Trưởng nhóm / Quản lý' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Lưu gần đây' },
  { value: 'name', label: 'Tên A-Z' },
  { value: 'experience', label: 'Kinh nghiệm cao' },
];

const CARD_TONES = {
  emerald: {
    accent: 'bg-emerald-500',
    line: 'from-emerald-400/80 via-emerald-300/25 to-transparent',
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    soft: 'bg-emerald-50 text-emerald-700',
  },
  blue: {
    accent: 'bg-sky-500',
    line: 'from-sky-400/80 via-sky-300/25 to-transparent',
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    soft: 'bg-sky-50 text-sky-700',
  },
  amber: {
    accent: 'bg-amber-500',
    line: 'from-amber-400/80 via-amber-300/25 to-transparent',
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    soft: 'bg-amber-50 text-amber-700',
  },
  violet: {
    accent: 'bg-violet-500',
    line: 'from-violet-400/80 via-violet-300/25 to-transparent',
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
    soft: 'bg-violet-50 text-violet-700',
  },
  slate: {
    accent: 'bg-slate-400',
    line: 'from-slate-400/70 via-slate-300/25 to-transparent',
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    soft: 'bg-slate-50 text-slate-700',
  },
};

const getCardTone = (tone) => CARD_TONES[tone] || CARD_TONES.emerald;

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'UV';

const formatExperience = (years) => {
  const value = Number(years) || 0;
  if (value <= 0) return 'Mới tốt nghiệp';
  if (value === 1) return '1 năm kinh nghiệm';
  return `${value} năm kinh nghiệm`;
};

const formatSavedAt = (value) => {
  if (!value) return 'Vừa lưu';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Vừa lưu';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const createFolderId = (name) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'custom';

const getStoredFolders = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_FOLDER_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function SearchBox({ value, onChange }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm theo tên, vị trí, kỹ năng..."
        className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function FolderTab({ folder, active, isCustom, onSelect, onDelete }) {
  const FolderIcon = folder.id === 'all' ? Bookmark : FolderOpen;
  const styles = getCardTone(folder.id === 'all' ? 'emerald' : isCustom ? 'violet' : 'slate');

  return (
    <div className="group relative flex items-center">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 pr-3 text-sm font-bold transition-colors duration-200',
          active
            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
        )}
      >
        <FolderIcon className="h-3.5 w-3.5" />
        <span>{folder.label}</span>
        <span
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
            active ? 'bg-white/20 text-white' : styles.soft
          )}
        >
          {formatNumber(folder.count)}
        </span>
      </button>

      {isCustom ? (
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs transition-all',
            active
              ? 'bg-rose-500 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600'
              : 'bg-slate-200 text-slate-500 hover:bg-rose-500 hover:text-white'
          )}
          title="Xóa thư mục"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function CandidateCard({ candidate, folders, updating, onMoveFolder, onRemove }) {
  const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const detailPath = candidate.application_id
    ? `/employer/applications/${candidate.application_id}`
    : `/employer/search-candidates?q=${encodeURIComponent(candidate.name || '')}`;
  const folderLabel =
    folders.find((folder) => folder.id === (candidate.saved_folder || 'general'))?.label ||
    'Đã lưu';
  return (
    <article className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.025] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400/90 via-emerald-300/30 to-transparent" />
      <div className="absolute right-8 top-8 h-20 w-20 rounded-full bg-emerald-50/80 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch xl:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <Avatar className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white bg-slate-950 shadow-md shadow-slate-950/10 ring-1 ring-slate-200">
              <AvatarFallback className="rounded-2xl bg-slate-950 text-base font-black text-white">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="line-clamp-1 text-lg font-black leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-emerald-700">
                    {candidate.name || 'Ứng viên đang cập nhật'}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-sm font-bold text-slate-700">
                    {candidate.role || 'Vị trí đang cập nhật'}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                    <FolderOpen className="h-3.5 w-3.5 text-emerald-600" />
                    {folderLabel}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
                <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate">{formatExperience(candidate.experience_years)}</span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate">{candidate.location || 'Linh hoạt'}</span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <Clock3 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">Lưu {formatSavedAt(candidate.saved_at)}</span>
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  <>
                    {skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 6 ? (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                        +{skills.length - 6} kỹ năng
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                    Hồ sơ chưa cập nhật kỹ năng
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 xl:w-[264px] xl:justify-between">
            <div className="grid grid-cols-2 gap-2">
              <Button
                asChild
                size="sm"
                className="col-span-2 h-10 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-700"
              >
                <Link to={detailPath}>
                  Xem hồ sơ
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Link
                  to={`/employer/messages?candidateId=${candidate.id}&candidateName=${encodeURIComponent(candidate.name || '')}`}
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Nhắn tin
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={updating}
                onClick={() => onRemove(candidate)}
                className="h-10 rounded-xl border-slate-200 bg-white px-3 text-xs font-black text-slate-500 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Xóa
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                Phân loại hồ sơ
              </p>
              <Select
                value={candidate.saved_folder || 'general'}
                onValueChange={(folder) => onMoveFolder(candidate, folder)}
                disabled={updating}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm">
                  <SelectValue placeholder="Chọn thư mục" />
                </SelectTrigger>
                <SelectContent>
                  {folders
                    .filter((folder) => folder.id !== 'all')
                    .map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-lg border border-slate-200 bg-slate-50"
        />
      ))}
    </div>
  );
}

export default function SavedCandidatesPage() {
  const { showNotification } = useNotification();
  const [activeFolder, setActiveFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState({ savedCandidates: 0, folderCounts: [] });
  const [customFolders, setCustomFolders] = useState(getStoredFolders);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingIds, setUpdatingIds] = useState(() => new Set());

  const folders = useMemo(() => {
    const countMap = new Map();
    (stats.folderCounts || []).forEach((item) => {
      countMap.set(item.folder, Number(item.count || 0));
    });

    const dynamicFolders = (stats.folderCounts || []).map((item) => ({
      id: item.folder,
      label:
        [...BASE_FOLDERS, ...customFolders].find((folder) => folder.id === item.folder)?.label ||
        item.folder,
    }));

    const merged = [...BASE_FOLDERS, ...customFolders, ...dynamicFolders].reduce((acc, folder) => {
      if (!acc.some((item) => item.id === folder.id)) acc.push(folder);
      return acc;
    }, []);

    return merged.map((folder) => ({
      ...folder,
      count: folder.id === 'all' ? stats.savedCandidates || 0 : countMap.get(folder.id) || 0,
    }));
  }, [customFolders, stats.folderCounts, stats.savedCandidates]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const params = {
          page: currentPage,
          limit: PAGE_SIZE,
          sort: sortBy,
        };
        if (activeFolder !== 'all') params.folder = activeFolder;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const response = await employerCandidateService.getTalentPool(params);
        if (cancelled) return;

        setCandidates(Array.isArray(response.data?.data) ? response.data.data : []);
        setPagination(
          response.data?.meta?.pagination || {
            page: currentPage,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 1,
          }
        );
        setStats(response.data?.meta?.stats || { savedCandidates: 0, folderCounts: [] });
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to fetch talent pool:', fetchError);
        setCandidates([]);
        setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
        setStats({ savedCandidates: 0, folderCounts: [] });
        setError('Không tải được kho ứng viên. Vui lòng kiểm tra API hoặc đăng nhập lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeFolder, currentPage, refreshKey, searchQuery, sortBy]);

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const persistCustomFolders = (nextFolders) => {
    setCustomFolders(nextFolders);
    localStorage.setItem(CUSTOM_FOLDER_KEY, JSON.stringify(nextFolders));
  };

  const handleDeleteFolder = (folder) => {
    if (!customFolders.some((f) => f.id === folder.id)) {
      showNotification('Không thể xóa thư mục mặc định.', 'warning');
      return;
    }

    const confirmed = window.confirm(
      `Xóa thư mục "${folder.label}"? Các ứng viên trong thư mục này sẽ được chuyển về "Đã lưu".`
    );
    if (!confirmed) return;

    const nextFolders = customFolders.filter((f) => f.id !== folder.id);
    persistCustomFolders(nextFolders);

    if (activeFolder === folder.id) {
      setActiveFolder('general');
    }

    setCurrentPage(1);
    showNotification(`Đã xóa thư mục "${folder.label}".`, 'success');
  };

  const handleCreateFolder = () => {
    const name = window.prompt('Nhập tên thư mục kho ứng viên mới:');
    const label = String(name || '').trim();
    if (!label) return;

    const id = createFolderId(label);
    if (folders.some((folder) => folder.id === id)) {
      showNotification('Thư mục này đã tồn tại.', 'info');
      setActiveFolder(id);
      return;
    }

    const nextFolders = [...customFolders, { id, label }];
    persistCustomFolders(nextFolders);
    setActiveFolder(id);
    setCurrentPage(1);
    showNotification(`Đã tạo thư mục "${label}".`, 'success');
  };

  const updateCandidateInFlight = (candidateId, updating) => {
    setUpdatingIds((previous) => {
      const next = new Set(previous);
      if (updating) next.add(candidateId);
      else next.delete(candidateId);
      return next;
    });
  };

  const handleMoveFolder = async (candidate, folder) => {
    if (folder === candidate.saved_folder) return;

    updateCandidateInFlight(candidate.id, true);
    const previousFolder = candidate.saved_folder;
    setCandidates((previous) =>
      previous.map((item) => (item.id === candidate.id ? { ...item, saved_folder: folder } : item))
    );

    try {
      await employerCandidateService.updateSavedCandidate(candidate.id, { folder });
      showNotification('Đã cập nhật thư mục kho ứng viên.', 'success');
      setRefreshKey((value) => value + 1);
    } catch (moveError) {
      console.error('Failed to move saved candidate:', moveError);
      setCandidates((previous) =>
        previous.map((item) =>
          item.id === candidate.id ? { ...item, saved_folder: previousFolder } : item
        )
      );
      showNotification('Không cập nhật được thư mục. Vui lòng thử lại.', 'error');
    } finally {
      updateCandidateInFlight(candidate.id, false);
    }
  };

  const handleRemove = async (candidate) => {
    const confirmed = window.confirm(`Bỏ "${candidate.name}" khỏi kho ứng viên?`);
    if (!confirmed) return;

    updateCandidateInFlight(candidate.id, true);
    const previousCandidates = candidates;
    setCandidates((current) => current.filter((item) => item.id !== candidate.id));

    try {
      await employerCandidateService.removeSavedCandidate(candidate.id);
      showNotification('Đã xóa ứng viên khỏi kho ứng viên.', 'success');
      setRefreshKey((value) => value + 1);
    } catch (removeError) {
      console.error('Failed to remove saved candidate:', removeError);
      setCandidates(previousCandidates);
      showNotification('Không xóa được ứng viên. Vui lòng thử lại.', 'error');
    } finally {
      updateCandidateInFlight(candidate.id, false);
    }
  };

  const resetFilters = () => {
    setActiveFolder('all');
    setSearchQuery('');
    setSortBy('recent');
    setCurrentPage(1);
  };

  const activeFolderMeta =
    folders.find((folder) => folder.id === activeFolder) || folders[0] || BASE_FOLDERS[0];
  const activeSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortBy)?.label || SORT_OPTIONS[0].label;
  const customFolderCount = customFolders.length;
  const managedFolderCount = Math.max(folders.length - 1, 0);
  const activeFilters = [
    activeFolder !== 'all' ? `Nhóm: ${activeFolderMeta.label}` : null,
    searchQuery.trim() ? `Từ khóa: ${searchQuery.trim()}` : null,
    sortBy !== 'recent' ? `Sắp xếp: ${activeSortLabel}` : null,
  ].filter(Boolean);
  const activeFilterCount = activeFilters.length;

  const insightHeader = useMemo(() => {
    if (loading) {
      return {
        title: 'Đang đồng bộ kho ứng viên',
        description:
          'Hệ thống đang rà lại các hồ sơ đã lưu để cập nhật nhanh trạng thái theo nhóm.',
      };
    }

    if (error) {
      return {
        title: 'Cần kiểm tra kết nối dữ liệu',
        description:
          'Các nhận định trong kho ứng viên tạm thời chưa sẵn sàng vì dữ liệu chưa tải được.',
      };
    }

    if (!stats.savedCandidates) {
      return {
        title: 'Kho ứng viên đang trống',
        description:
          'Bắt đầu từ tìm kiếm ứng viên để lưu các hồ sơ tiềm năng và tổ chức thành từng nhóm.',
      };
    }

    if (activeFolder !== 'all') {
      return {
        title: `Đang rà soát nhóm ${activeFolderMeta.label}`,
        description:
          'Bạn có thể tiếp tục phân loại, nhắn tin hoặc dọn lại nhóm hiện tại để dễ theo dõi.',
      };
    }

    return {
      title: 'Kho ứng viên đã sẵn sàng để điều phối',
      description:
        'Tiếp tục gom hồ sơ theo nhóm chuyên biệt để dễ quản lý quy trình tuyển dụng và liên hệ đúng thời điểm.',
    };
  }, [activeFolder, activeFolderMeta.label, error, loading, stats.savedCandidates]);

  return (
    <div className="min-h-screen bg-transparent pb-16 animate-fade-in">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-4xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm shadow-slate-900/10">
                <Building2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-inset ring-slate-200/80">
                  Kho ứng viên
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">
                  Trung tâm điều phối ứng viên đã lưu
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  {insightHeader.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <EmployerStatCard
              icon={Bookmark}
              label="Đã lưu"
              value={formatNumber(stats.savedCandidates || 0)}
              helper="Hồ sơ trong kho"
              tone="emerald"
              loading={loading}
            />
            <EmployerStatCard
              icon={FolderOpen}
              label="Thư mục"
              value={formatNumber(managedFolderCount)}
              helper={`${formatNumber(customFolderCount)} thư mục tùy chỉnh`}
              tone="violet"
              loading={loading}
            />
            <EmployerStatCard
              icon={Users}
              label="Nhóm đang xem"
              value={formatNumber(activeFolderMeta.count || 0)}
              helper={activeFolder !== 'all' ? activeFolderMeta.label : 'Toàn bộ danh sách'}
              tone="blue"
              loading={loading}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              asChild
              variant="outline"
              className="h-11 justify-start rounded-xl border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:border-emerald-600 hover:bg-emerald-600 hover:text-white sm:w-auto"
            >
              <Link to="/employer/search-candidates">
                <Plus className="mr-2 h-4 w-4 text-white" />
                Tìm ứng viên
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCreateFolder}
              className="h-11 justify-start rounded-xl border-slate-200/90 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-white hover:text-emerald-700 sm:w-auto"
            >
              <FolderPlus className="mr-2 h-4 w-4 text-emerald-600" />
              Tạo thư mục
            </Button>

            {activeFilterCount ? (
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="h-11 justify-start rounded-xl border-slate-200/90 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-white hover:text-emerald-700 sm:w-auto"
              >
                Xóa lọc
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {folders.map((folder) => {
                const isCustom = customFolders.some(
                  (customFolder) => customFolder.id === folder.id
                );

                return (
                  <FolderTab
                    key={folder.id}
                    folder={folder}
                    active={activeFolder === folder.id}
                    isCustom={isCustom}
                    onSelect={() => {
                      setActiveFolder(folder.id);
                      setCurrentPage(1);
                    }}
                    onDelete={(event) => {
                      event.stopPropagation();
                      handleDeleteFolder(folder);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <section className="min-w-0 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <SearchBox
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
              />

              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-12 w-full rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700 md:w-[200px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-sm font-medium"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFilterCount ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-12 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                >
                  Xóa lọc
                </Button>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                Hiển thị{' '}
                <strong className="text-slate-700">{formatNumber(pagination.total || 0)}</strong>{' '}
                ứng viên · {activeFolderMeta.label}
              </span>
              <span>
                <strong className="text-slate-700">{formatNumber(customFolderCount)}</strong> thư
                mục tùy chỉnh
              </span>
              {activeFilterCount > 0 ? (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {activeFilterCount} bộ lọc
                </span>
              ) : null}
              {activeFilters.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {activeFilters.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-700">
                  {loading
                    ? 'Đang đồng bộ ứng viên'
                    : `${formatNumber(pagination.total || 0)} ứng viên`}
                </span>
              </div>
              {totalPages > 1 ? (
                <span className="text-xs text-slate-400">
                  Trang {currentPage}/{totalPages}
                </span>
              ) : null}
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : candidates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-50 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">
                  Chưa có ứng viên trong nhóm này
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Lưu ứng viên từ trang tìm kiếm hoặc đổi sang nhóm khác để tiếp tục xem danh sách
                  rút gọn đang có trong kho ứng viên.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                  <Button
                    asChild
                    className="h-11 rounded-lg bg-emerald-600 px-6 font-bold hover:bg-emerald-700"
                  >
                    <Link to="/employer/search-candidates">
                      <Plus className="mr-2 h-4 w-4" />
                      Tìm ứng viên mới
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    className="h-11 rounded-lg border-slate-200 px-6 font-bold"
                  >
                    Đặt lại bộ lọc
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      folders={folders}
                      updating={updatingIds.has(candidate.id)}
                      onMoveFolder={handleMoveFolder}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'flex h-10 min-w-[40px] items-center justify-center rounded-lg px-3 text-sm font-bold transition-all',
                          page === currentPage
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-600'
                        )}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
