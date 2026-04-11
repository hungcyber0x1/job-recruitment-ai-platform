import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Grid3X3,
  LayoutList,
  Lock,
  MapPin,
  Search,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotification } from '../../context/NotificationContext';

// ─── Mock data ───────────────────────────────────
const CANDIDATES = [
  {
    id: 1,
    name: 'Nguyễn Văn An',
    role: 'Senior UI/UX Designer',
    skills: ['FIGMA', 'REACT', 'DESIGN SYSTEM'],
    extraSkillCount: 4,
    experience: '8+ năm KN',
    location: 'Hà Nội',
    salaryMin: 2500,
    salaryMax: 3500,
    isUnlocked: true,
    avatar: 'A',
    matchScore: 98,
    bio: 'Từng làm việc tại các tập đoàn lớn (VinGroup, FPT). Chuyên về xây dựng...',
    online: true,
  },
  {
    id: 2,
    name: 'Lê Quang Hùng',
    role: 'Fullstack Engineer',
    skills: ['NODE.JS', 'AWS', 'MONGODB'],
    extraSkillCount: 0,
    experience: '4 năm KN',
    location: 'TP. Hồ Chí Minh',
    salaryMin: 1800,
    salaryMax: 2500,
    isUnlocked: false,
    avatar: 'H',
    matchScore: 85,
    bio: 'Chuyên gia về Backend và Cloud Infrastructure. Có kinh nghiệm triển khai...',
    online: false,
  },
  {
    id: 3,
    name: 'Phan Thị Thảo',
    role: 'Marketing Lead',
    skills: ['SEO/SEM', 'BRAND STRATEGY', 'DATA ANALYTICS'],
    extraSkillCount: 0,
    experience: '6 năm KN',
    location: 'Đà Nẵng',
    salaryMin: 1500,
    salaryMax: 2200,
    isUnlocked: true,
    avatar: 'T',
    matchScore: 92,
    bio: 'Tăng trưởng doanh thu 200% cho startup thương mại điện tử trong vòng 1 năm qua...',
    online: true,
  },
  {
    id: 4,
    name: 'Đặng Văn Bảo',
    role: 'Junior Frontend Developer',
    skills: ['HTML/CSS', 'VUE.JS'],
    extraSkillCount: 0,
    experience: '1 năm KN',
    location: 'Hải Phòng',
    salaryMin: 700,
    salaryMax: 1200,
    isUnlocked: false,
    avatar: 'B',
    matchScore: 72,
    bio: 'Có tư duy lập trình tốt, khả năng tự học nhanh. Đã hoàn thành các chứng chỉ quan...',
    online: false,
  },
];

const LEVEL_OPTIONS = ['Tất cả', 'Junior', 'Mid-level', 'Senior', 'Lead/Manager'];
const SALARY_OPTIONS = ['Mức lương', 'Dưới $1000', '$1000–$2000', '$2000–$4000', 'Trên $4000'];
const LEVEL_FILTER_OPTIONS = ['Trình độ', 'Intern', 'Junior', 'Mid-level', 'Senior'];

function MatchBadge({ score }) {
  const isHighMatch = score >= 90;
  const isMidMatch = score >= 80;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white p-1 shadow-sm transition-all group-hover:shadow-md">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-lg ${isHighMatch ? 'bg-emerald-500' : isMidMatch ? 'bg-amber-500' : 'bg-slate-400'} text-white shadow-sm`}
        >
          <Sparkles size={14} className={isHighMatch ? 'animate-pulse' : ''} />
        </div>
        <div>
          <p className="text-base font-black uppercase tracking-[0.1em] text-muted-foreground/60 leading-none mb-0.5">
            Match Score
          </p>
          <p
            className={`text-base font-black leading-none ${isHighMatch ? 'text-emerald-600' : isMidMatch ? 'text-amber-600' : 'text-slate-600'}`}
          >
            {score}%
          </p>
        </div>
      </div>
      {/* Subtle progress bar at bottom */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-slate-50">
        <div
          className={`h-full ${isHighMatch ? 'bg-emerald-500' : isMidMatch ? 'bg-amber-500' : 'bg-slate-400'} transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function CandidateCard({ candidate, onSave, saved, onUnlock }) {
  const gradientMap = {
    A: 'from-emerald-500 to-teal-700',
    H: 'from-blue-500 to-indigo-700',
    T: 'from-violet-500 to-purple-700',
    B: 'from-amber-500 to-orange-700',
  };
  const gradient = gradientMap[candidate.avatar] || 'from-slate-500 to-slate-700';

  return (
    <div className="card-premium-hover group relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-white p-6 shadow-sm transition-all duration-300">
      {/* Status Overlay */}
      {candidate.online && (
        <div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-black uppercase tracking-widest text-emerald-600 border border-emerald-100 shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          Online
        </div>
      )}

      {/* Header Profile Section */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-0.5 shadow-lg group-hover:scale-110 transition-transform duration-500`}
        >
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-black/10 backdrop-blur-sm text-2xl font-black text-white">
            {candidate.avatar}
          </div>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="line-clamp-1 text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
            {candidate.name}
          </h3>
          <p className="mt-1 text-base font-black uppercase tracking-[0.1em] text-primary">
            {candidate.role}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
              <Briefcase size={13} className="text-muted-foreground/40" />
              {candidate.experience}
            </span>
            <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
              <MapPin size={13} className="text-muted-foreground/40" />
              {candidate.location}
            </span>
          </div>
        </div>
      </div>

      {/* Info Tiles Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MatchBadge score={candidate.matchScore} />
        <div className="rounded-xl border border-border/40 bg-slate-50/50 p-2.5 flex flex-col justify-center">
          <p className="text-base font-black uppercase tracking-[0.1em] text-muted-foreground/60 leading-none mb-1.5">
            Kỳ vọng lương
          </p>
          <p className="text-base font-black text-foreground tracking-tight">
            ${candidate.salaryMin.toLocaleString()} – ${candidate.salaryMax.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Skills Section */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {(candidate.skills || []).slice(0, 3).map((s) => (
          <span
            key={s}
            className="rounded-lg bg-white border border-border/60 px-2.5 py-1 text-sm font-black uppercase tracking-widest text-muted-foreground shadow-sm transition-colors group-hover:border-primary/30 group-hover:text-primary/70"
          >
            {s}
          </span>
        ))}
        {candidate.extraSkillCount > 0 && (
          <span className="flex items-center justify-center rounded-lg bg-muted/40 px-2 py-1 text-sm font-black text-muted-foreground/40">
            +{candidate.extraSkillCount}
          </span>
        )}
      </div>

      {/* Bio / Summary */}
      <div className="relative mb-6">
        <div className="absolute -left-2 top-0 h-full w-0.5 bg-muted transition-colors group-hover:bg-primary/20" />
        <p className="line-clamp-2 pl-3 text-base font-semibold leading-relaxed text-muted-foreground/80 lowercase first-letter:uppercase italic">
          "{candidate.bio}"
        </p>
      </div>

      {/* Actions Footer */}
      <div className="mt-auto flex items-center gap-3 pt-5 border-t border-border/40">
        <Button
          onClick={() => onSave(candidate.id)}
          variant="outline"
          size="icon"
          className={`h-12 w-12 shrink-0 rounded-xl transition-all ${
            saved
              ? 'border-primary/20 bg-primary/10 text-primary shadow-inner'
              : 'border-border/60 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground/40'
          }`}
        >
          {saved ? <BookmarkCheck size={20} fill="currentColor" /> : <Bookmark size={20} />}
        </Button>

        {candidate.isUnlocked ? (
          <Button
            asChild
            className="h-12 flex-1 rounded-xl bg-slate-900 border-none text-sm font-black uppercase tracking-widest text-white hover:bg-black shadow-lg transition-all active:scale-95"
          >
            <Link to={`/employer/messages?candidateName=${encodeURIComponent(candidate.name)}`}>
              Xem hồ sơ ứng viên
            </Link>
          </Button>
        ) : (
          <Button
            onClick={() => onUnlock(candidate.id)}
            className="h-12 flex-1 rounded-xl bg-emerald-600 border-none text-sm font-black uppercase tracking-widest text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Lock size={16} className="mr-2" />
            Mở khóa thông tin
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────
const SearchCandidatesPage = () => {
  const { showNotification } = useNotification();
  const [keyword, setKeyword] = useState('');
  const [skillQuery, setSkillQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Tất cả');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [savedIds, setSavedIds] = useState(new Set([1]));
  const [sortBy, setSortBy] = useState('match');

  const filteredCandidates = useMemo(() => {
    let result = [...CANDIDATES];
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (skillQuery.trim()) {
      const q = skillQuery.trim().toLowerCase();
      result = result.filter((c) => c.skills.some((s) => s.toLowerCase().includes(q)));
    }
    if (locationQuery.trim()) {
      const q = locationQuery.trim().toLowerCase();
      result = result.filter((c) => c.location.toLowerCase().includes(q));
    }
    if (selectedLevel !== 'Tất cả') {
      result = result.filter(
        (c) =>
          c.experience.includes(selectedLevel) ||
          (selectedLevel === 'Lead/Manager' && c.role.includes('Lead'))
      );
    }
    result.sort((a, b) =>
      sortBy === 'match' ? b.matchScore - a.matchScore : a.salaryMin - b.salaryMin
    );
    return result;
  }, [keyword, skillQuery, locationQuery, selectedLevel, sortBy]);

  const toggleSave = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      const isSaving = !next.has(id);
      isSaving ? next.add(id) : next.delete(id);
      showNotification(isSaving ? 'Đã lưu ứng viên!' : 'Đã bỏ lưu ứng viên.', 'success');
      return next;
    });
  };

  const handleUnlock = (_id) => {
    if (window.confirm('Bạn có muốn dùng 1 tín dụng để mở khóa hồ sơ này?')) {
      showNotification('Đã mở khóa hồ sơ ứng viên!', 'success');
    }
  };

  const handleAdvancedFilter = () => {
    showNotification('Tính năng Bộ lọc nâng cao đang được cập nhật!', 'info');
  };

  return (
    <div className="pb-20 max-w-[1400px] mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Tìm kiếm ứng viên
          </h1>
          <p className="text-base font-medium text-slate-500">
            Khám phá <span className="text-emerald-600 font-bold">50,000+</span> tài năng hàng đầu
            trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-black text-slate-500 hover:text-foreground transition-all shadow-sm">
            TÀI KHOẢN: <span className="text-emerald-600">PREMIUM</span>
          </button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 bg-white p-4 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="relative group">
          <Search
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên ứng viên, vị trí..."
            className="w-full h-14 rounded-2xl bg-slate-50/50 border border-slate-100 pl-12 pr-4 text-base text-slate-900 font-bold outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="relative group">
          <Sparkles
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
          />
          <input
            type="text"
            value={skillQuery}
            onChange={(e) => setSkillQuery(e.target.value)}
            placeholder="Kỹ năng chính..."
            className="w-full h-14 rounded-2xl bg-slate-50/50 border border-slate-100 pl-12 pr-4 text-base text-slate-900 font-bold outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="relative group">
          <MapPin
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
          />
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder="Địa điểm làm việc..."
            className="w-full h-14 rounded-2xl bg-slate-50/50 border border-slate-100 pl-12 pr-4 text-base text-slate-900 font-bold outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 transition-all"
          />
        </div>
        <button className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-8 text-base font-black text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 shrink-0 uppercase tracking-widest">
          <Search size={18} />
          Tìm kiếm
        </button>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleAdvancedFilter}
          className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 px-5 py-2.5 text-base font-black text-emerald-600 hover:bg-primary/15 transition-colors duration-200 ease-out shadow-sm"
        >
          <SlidersHorizontal size={14} />
          BỘ LỌC NÂNG CAO
        </button>
        <Select value={selectedLevel} onValueChange={(val) => setSelectedLevel(val)}>
          <SelectTrigger className="h-10 w-[180px] rounded-xl border border-slate-200 bg-white px-4 text-base font-black uppercase tracking-tight text-slate-600 outline-none hover:border-emerald-300 hover:text-emerald-600 hover:bg-primary/5 transition-all shadow-sm">
            <SelectValue placeholder="KINH NGHIỆM" />
          </SelectTrigger>
          <SelectContent>
            {LEVEL_OPTIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {o.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="h-10 w-[180px] rounded-xl border border-slate-200 bg-white px-4 text-base font-black uppercase tracking-tight text-slate-600 outline-none hover:border-emerald-300 hover:text-emerald-600 hover:bg-primary/5 transition-all shadow-sm">
            <SelectValue placeholder="MỨC LƯƠNG" />
          </SelectTrigger>
          <SelectContent>
            {SALARY_OPTIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {o.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="h-10 w-[180px] rounded-xl border border-slate-200 bg-white px-4 text-base font-black uppercase tracking-tight text-slate-600 outline-none hover:border-emerald-300 hover:text-emerald-600 hover:bg-primary/5 transition-all shadow-sm">
            <SelectValue placeholder="TRÌNH ĐỘ" />
          </SelectTrigger>
          <SelectContent>
            {LEVEL_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {o.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-foreground hover:bg-muted/35'}`}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-foreground hover:bg-muted/35'}`}
          >
            <LayoutList size={18} />
          </button>
        </div>
      </div>

      {/* ── Result count & sort ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <p className="text-base font-medium text-slate-500">
          Đã tìm thấy{' '}
          <span className="font-black text-slate-900 border-b-2 border-emerald-500">
            {filteredCandidates.length.toLocaleString()}
          </span>{' '}
          kết hợp phù hợp với yêu cầu
        </p>
        <div className="flex items-center gap-3 text-base font-black uppercase tracking-widest text-slate-400">
          SẮP XẾP:
          <button
            onClick={() => setSortBy('match')}
            className={`transition-all ${sortBy === 'match' ? 'text-emerald-600' : 'hover:text-foreground'}`}
          >
            ĐỘ TƯƠNG THÍCH
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <button
            onClick={() => setSortBy('salary')}
            className={`transition-all ${sortBy === 'salary' ? 'text-emerald-600' : 'hover:text-foreground'}`}
          >
            LƯƠNG TỪ THẤP ĐẾN CAOT
          </button>
        </div>
      </div>

      {/* ── Candidate grid/list ── */}
      {filteredCandidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-slate-200 bg-white shadow-sm">
          <div className="h-24 w-24 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
            <Search size={48} />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            Không tìm thấy ứng viên phù hợp
          </p>
          <p className="text-slate-400 font-medium mt-2">
            Thử điều chỉnh từ khóa hoặc bộ lọc để mở rộng phạm vi tìm kiếm.
          </p>
          <button
            onClick={() => {
              setKeyword('');
              setSkillQuery('');
              setLocationQuery('');
            }}
            className="mt-8 rounded-2xl bg-slate-900 px-8 py-3.5 text-base font-black text-white hover:bg-black transition-all shadow-xl active:scale-95 uppercase tracking-widest"
          >
            XÓA TẤT CẢ BỘ LỌC
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3'
              : 'space-y-6'
          }
        >
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onSave={toggleSave}
              saved={savedIds.has(candidate.id)}
              onUnlock={handleUnlock}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchCandidatesPage;
