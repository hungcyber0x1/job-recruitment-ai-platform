import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, Users, Briefcase, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import candidateService from '@/services/candidateService';

function avatarPalette(name) {
  const s = String(name || 'x');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
  const idx = Math.abs(h) % 3;
  const palettes = [
    'bg-slate-900 text-white',
    'bg-emerald-100 text-emerald-900',
    'bg-slate-100 text-slate-800',
  ];
  return palettes[idx];
}

const CompanyCard = ({ company }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const isCandidate = user?.role === 'candidate';

  const [isSaved, setIsSaved] = useState(Boolean(company.is_saved));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsSaved(Boolean(company.is_saved));
  }, [company.id, company.is_saved]);

  useEffect(() => {
    if (!isCandidate || isSaved || !company.id || company.is_saved != null) return;
    // Optional: check if already saved if not provided in props
    candidateService
      .checkCompanySaved(company.id)
      .then((res) => setIsSaved(!!res.data?.data?.saved))
      .catch(() => {});
  }, [company.id, company.is_saved, isCandidate, isSaved]);

  const handleToggleSave = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        if (
          window.confirm(
            'Bạn cần đăng nhập với vai trò ứng viên để lưu công ty. Chuyển đến trang đăng nhập?'
          )
        ) {
          navigate('/login', { state: { from: { pathname: window.location.pathname } } });
        }
        return;
      }

      if (!isCandidate) {
        showNotification('Tính năng này chỉ dành cho ứng viên', 'info');
        return;
      }

      if (saving) return;

      setSaving(true);
      try {
        if (isSaved) {
          await candidateService.unsaveCompany(company.id);
          setIsSaved(false);
          showNotification('Đã bỏ lưu công ty', 'info');
        } else {
          await candidateService.saveCompany(company.id);
          setIsSaved(true);
          showNotification('Đã lưu công ty thành công', 'success');
        }
      } catch (err) {
        console.error('Failed to toggle company save:', err);
        showNotification('Không thể thực hiện tác vụ này', 'error');
      } finally {
        setSaving(false);
      }
    },
    [company.id, isCandidate, isAuthenticated, isSaved, navigate, saving, showNotification]
  );

  const initials =
    company.name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO';

  const hasLogo = Boolean(company.logo?.trim());
  const logoSrc = resolveMediaUrl(company.logo);

  return (
    <Card
      hover
      className={cn(
        'card-premium-hover group relative flex h-full flex-col overflow-hidden border-border/40 bg-card transition-all duration-300'
      )}
    >
      {/* Decorative Banner Background */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Save Button */}
      <div className="absolute top-3 right-3 z-20">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={saving}
          onClick={handleToggleSave}
          className={cn(
            'size-9 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm ring-1 ring-black/[0.03] transition-all duration-300 dark:bg-slate-900/90',
            isSaved
              ? 'text-emerald-600 ring-emerald-500/20 shadow-emerald-600/10'
              : 'text-slate-400 hover:text-primary hover:bg-primary/5 hover:ring-primary/20 hover:scale-105 active:scale-95'
          )}
        >
          {isSaved ? (
            <BookmarkCheck className="size-5 fill-emerald-600/10" aria-hidden />
          ) : (
            <Bookmark className="size-5" aria-hidden />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-12 sm:px-6">
        {/* Logo & Header Info */}
        <div className="flex flex-col items-center text-center">
          <Avatar
            className={cn(
              'size-20 shrink-0 rounded-xl border-4 border-white shadow-xl ring-1 ring-black/[0.03] dark:border-slate-900',
              'transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/10'
            )}
          >
            {hasLogo ? (
              <AvatarImage src={logoSrc} alt={company.name} className="object-cover" />
            ) : null}
            <AvatarFallback
              className={cn('rounded-xl text-xl font-bold', avatarPalette(company.name))}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="mt-4 min-w-0">
            <h3 className="line-clamp-2 text-xl font-extrabold tracking-normal text-foreground transition-colors group-hover:text-primary leading-tight">
              {company.name}
            </h3>
            <div className="mt-2.5 flex justify-center">
              <span className="inline-flex items-center rounded-lg bg-primary/8 px-2.5 py-1 text-sm font-bold uppercase tracking-normal text-primary border border-primary/10">
                {company.industry}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Integrated Dashboard Look */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center rounded-xl bg-slate-50/80 p-3 text-center transition-colors group-hover:bg-white group-hover:ring-1 group-hover:ring-primary/10 dark:bg-slate-900/40">
            <MapPin className="mb-1.5 size-4 text-primary/60" />
            <span className="text-sm font-semibold text-foreground/80 leading-tight line-clamp-1">
              {company.location?.split(',')[0]}
            </span>
            <span className="text-sm font-medium text-muted-foreground">Địa điểm</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-slate-50/80 p-3 text-center transition-colors group-hover:bg-white group-hover:ring-1 group-hover:ring-primary/10 dark:bg-slate-900/40">
            <Users className="mb-1.5 size-4 text-primary/60" />
            <span className="text-sm font-semibold text-foreground/80 leading-tight">
              {company.size}
            </span>
            <span className="text-sm font-medium text-muted-foreground">Quy mô</span>
          </div>
        </div>

        {/* Positions Highlight */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/20 bg-primary/[0.02] p-3 transition-colors group-hover:bg-primary/[0.04]">
          <Briefcase className="size-4 text-primary" />
          <span className="text-sm font-bold text-primary">
            {company.openPositions} vị trí đang tuyển
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-auto border-t border-border/40 bg-slate-50/30 px-5 py-4 dark:bg-white/5 sm:px-6">
        <Link
          to={`/companies/${company.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-foreground shadow-sm ring-1 ring-black/[0.05] transition-all hover:bg-primary hover:text-white hover:ring-primary hover:shadow-primary/20 active:scale-[0.98]"
        >
          Chi tiết doanh nghiệp
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Card>
  );
};

CompanyCard.propTypes = {
  company: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    logo: PropTypes.string,
    name: PropTypes.string,
    industry: PropTypes.string,
    industryKey: PropTypes.string,
    location: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    openPositions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

export default CompanyCard;
