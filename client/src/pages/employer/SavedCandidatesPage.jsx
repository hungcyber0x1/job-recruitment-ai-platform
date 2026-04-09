import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
  FolderPlus,
  Mail,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

// ─── Mock data ───────────────────────────────────
const FOLDERS = [
  { id: 'all', name: 'Tất cả ứng viên', count: 48 },
  { id: 'dev', name: 'Lập trình viên', count: 24 },
  { id: 'design', name: 'UI/UX Designer', count: 12 },
  { id: 'marketing', name: 'Marketing', count: 12 },
];

const CANDIDATES = [
  {
    id: 1,
    name: 'Nguyễn Văn An',
    role: 'Senior Frontend Dev',
    roleColor: 'text-emerald-400',
    experience: '5 năm kinh nghiệm',
    jobType: 'Full-time',
    location: 'Quận 1, TP. Hồ Chí Minh',
    skills: ['ReactJS', 'TypeScript', 'Tailwind'],
    folder: 'dev',
    avatar: 'A',
    avatarGradient: 'from-emerald-600 to-teal-800',
  },
  {
    id: 2,
    name: 'Trần Thị Mai',
    role: 'UI/UX Designer',
    roleColor: 'text-pink-400',
    experience: '3 năm kinh nghiệm',
    jobType: 'Remote',
    location: 'Hà Nội',
    skills: ['Figma', 'Adobe XD', 'Prototyping'],
    folder: 'design',
    avatar: 'M',
    avatarGradient: 'from-pink-600 to-rose-800',
  },
  {
    id: 3,
    name: 'Lê Minh Tâm',
    role: 'Backend Engineer',
    roleColor: 'text-blue-400',
    experience: '4 năm kinh nghiệm',
    jobType: 'Hybrid',
    location: 'Đà Nẵng',
    skills: ['Node.js', 'PostgreSQL', 'AWS'],
    folder: 'dev',
    avatar: 'T',
    avatarGradient: 'from-blue-600 to-blue-900',
  },
  {
    id: 4,
    name: 'Hoàng Thùy Dương',
    role: 'Marketing Lead',
    roleColor: 'text-amber-400',
    experience: '7 năm kinh nghiệm',
    jobType: 'Full-time',
    location: 'Quận 7, TP. Hồ Chí Minh',
    skills: ['SEO', 'Data Analysis', 'Growth'],
    folder: 'marketing',
    avatar: 'D',
    avatarGradient: 'from-amber-600 to-orange-800',
  },
];

const ITEMS_PER_PAGE = 4;

// ─── Main page ────────────────────────────────────
const SavedCandidatesPage = () => {
  const { showNotification } = useNotification();
  const [activeFolder, setActiveFolder] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [removedIds, setRemovedIds] = useState(new Set());
  const [searchQuery] = useState('');

  const handleCreateFolder = () => {
    const name = window.prompt('Nhập tên thư mục mới:');
    if (name) showNotification(`Đã tạo thư mục "${name}" thành công!`, 'success');
  };

  const handleFilter = () => {
    showNotification('Tính năng lọc đang được phát triển.', 'info');
  };

  const filtered = useMemo(() => {
    let result = CANDIDATES.filter((c) => !removedIds.has(c.id));
    if (activeFolder !== 'all') result = result.filter((c) => c.folder === activeFolder);
    return result.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeFolder, removedIds, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleRemove = (id) => {
    setRemovedIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Ứng viên đã lưu
          </h1>
          <p className="text-base font-medium text-slate-500 mt-1">
            Quản lý các hồ sơ tiềm năng bạn đã đánh dấu để cân nhắc.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFilter}
            className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-base font-black text-slate-600 hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
          >
            <Filter size={14} />
            LỌC
          </button>
          <button
            onClick={handleCreateFolder}
            className="flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
          >
            <FolderPlus size={14} />
            TẠO THƯ MỤC MỚI
          </button>
        </div>
      </div>

      {/* ── Folder tabs ── */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 p-1 rounded-t-2xl">
        {FOLDERS.map((folder) => (
          <button
            key={folder.id}
            onClick={() => {
              setActiveFolder(folder.id);
              setCurrentPage(1);
            }}
            className={`relative flex items-center gap-2 px-6 py-4 text-base font-black transition-all ${
              activeFolder === folder.id
                ? 'text-emerald-600 after:absolute after:bottom-0 after:inset-x-0 after:h-1 after:bg-emerald-600 after:rounded-full'
                : 'text-slate-400 hover:text-foreground hover:bg-muted/35 rounded-xl'
            }`}
          >
            {folder.name.toUpperCase()}
            <span
              className={`rounded-lg px-2 py-0.5 text-base font-black tabular-nums transition-all ${
                activeFolder === folder.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {folder.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Candidate grid ── */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
            <Bookmark size={40} />
          </div>
          <p className="text-slate-900 font-black text-xl tracking-tight">
            Không có ứng viên nào trong danh sách này
          </p>
          <p className="text-slate-400 mt-2 font-medium">
            Hãy bắt đầu tìm kiếm và lưu lại những tài năng tiềm năng.
          </p>
          <Link
            to="/employer/search-candidates"
            className="mt-8 flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-8 py-3.5 text-base font-black text-white hover:bg-black transition-all shadow-xl active:scale-95 uppercase tracking-widest"
          >
            <Plus size={16} />
            Tìm ứng viên mới
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {paged.map((candidate) => (
            <div
              key={candidate.id}
              className="rounded-[32px] border border-slate-200 bg-white p-6 hover:border-emerald-200 hover:shadow-2xl transition-all group duration-300 hover:-translate-y-1"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div
                  className={`h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br ${candidate.avatarGradient} flex items-center justify-center text-white text-2xl font-black shadow-lg group-hover:scale-110 transition-transform duration-500`}
                >
                  {candidate.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-slate-900 text-lg tracking-tight group-hover:text-emerald-600 transition-colors">
                        {candidate.name}
                      </p>
                      <p
                        className={`text-base font-black uppercase tracking-widest mt-0.5 ${candidate.roleColor.replace('text-emerald-400', 'text-emerald-600').replace('text-pink-400', 'text-pink-600').replace('text-blue-400', 'text-blue-600').replace('text-amber-400', 'text-amber-600')}`}
                      >
                        {candidate.role}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(candidate.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 opacity-0 group-hover:opacity-100 bg-emerald-50 border border-emerald-100 transition-all hover:bg-emerald-600 hover:text-white"
                      title="Bỏ lưu ứng viên"
                    >
                      <BookmarkCheck size={16} fill="currentColor" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-base font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <Briefcase size={12} className="text-slate-400" />
                      {(candidate.experience || 'N/A').toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <MapPin size={12} className="text-slate-400" />
                      {candidate.location.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {(candidate.skills || []).map((s) => (
                  <span
                    key={s}
                    className="rounded-lg bg-emerald-50/50 border border-emerald-100 px-3 py-1 text-base font-black text-emerald-700 uppercase tracking-widest"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 border-t border-slate-50 pt-6">
                <Link
                  to="/employer/messages"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-md transition-all active:scale-95"
                  title="Nhắn tin"
                >
                  <Mail size={18} />
                </Link>
                <button
                  onClick={() => handleRemove(candidate.id)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 hover:shadow-md transition-all active:scale-95"
                  title="Xóa ứng viên"
                >
                  <Trash2 size={18} />
                </button>
                <Link
                  to={`/employer/applications/${candidate.id}`}
                  className="flex-1 h-12 flex items-center justify-center rounded-2xl bg-emerald-600 text-base font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95 transition-all uppercase tracking-widest"
                >
                  XEM HỒ SƠ CHI TIẾT
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12 bg-white border border-slate-200 p-2 rounded-[24px] shadow-sm w-fit mx-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 text-slate-400 hover:text-foreground transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1.5 px-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-base font-black transition-all ${
                  page === currentPage
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-400 hover:text-foreground hover:bg-muted/35'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 text-slate-400 hover:text-foreground transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SavedCandidatesPage;
