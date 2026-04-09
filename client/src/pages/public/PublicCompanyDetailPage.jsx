import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Building2, MapPin, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMockCompanyById } from '@/data';
import { cn } from '@/utils';

function initialsFromName(name) {
  return (
    String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO'
  );
}

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

/**
 * Chi tiết công ty công khai — không cần đăng nhập (dữ liệu mẫu; sau này thay API).
 */
const PublicCompanyDetailPage = () => {
  const { id } = useParams();
  const company = getMockCompanyById(id);

  if (!company) {
    return (
      <div className="min-h-[50vh] bg-emerald-50/30 px-4 py-16">
        <div className="container mx-auto max-w-lg text-center">
          <h1 className="text-xl font-bold text-foreground">Không tìm thấy công ty</h1>
          <p className="mt-2 text-muted-foreground">
            Mã công ty không hợp lệ hoặc đã gỡ khỏi danh sách.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/companies">Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    );
  }

  const ini = initialsFromName(company.name);

  return (
    <div className="min-h-screen bg-emerald-50/30 pb-20">
      {/* Hero — cùng ngôn ngữ nền với /companies */}
      <section className="page-hero-bg page-hero-grain relative overflow-hidden border-b border-border/40">
        <div className="page-hero-pattern" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]"
          aria-hidden
        />
        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 md:pb-12 md:pt-8">
          <Link
            to="/companies"
            className="group mb-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft
              className="size-4 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
            Danh sách công ty
          </Link>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-6">
                <div
                  className={cn(
                    'flex size-[4.5rem] shrink-0 items-center justify-center rounded-2xl text-lg font-bold shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)] ring-1 ring-black/5 dark:ring-white/10',
                    avatarPalette(company.name)
                  )}
                  aria-hidden
                >
                  {ini}
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="size-3" strokeWidth={2} aria-hidden />
                    {company.industry}
                  </span>
                  <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-[2.35rem] md:leading-[1.15]">
                    {company.name}
                  </h1>
                  <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm md:gap-x-4">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-white/80 text-primary shadow-sm ring-1 ring-border/50 dark:bg-slate-900/80">
                        <MapPin className="size-3.5" aria-hidden />
                      </span>
                      <span className="font-medium">{company.location}</span>
                    </span>
                    <span className="hidden text-border sm:inline" aria-hidden>
                      ·
                    </span>
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-white/80 text-primary shadow-sm ring-1 ring-border/50 dark:bg-slate-900/80">
                        <Users className="size-3.5" aria-hidden />
                      </span>
                      <span className="font-medium">
                        <span className="text-foreground/90">{company.size}</span> nhân viên
                      </span>
                    </span>
                    <span className="hidden text-border sm:inline" aria-hidden>
                      ·
                    </span>
                    <span className="inline-flex items-center gap-2 font-semibold text-primary">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/15">
                        <Briefcase className="size-3.5" aria-hidden />
                      </span>
                      {company.openPositions} việc đang tuyển
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:min-w-[280px] lg:flex-col lg:items-stretch">
              <Button
                size="lg"
                className="h-12 w-full gap-2 font-semibold shadow-md sm:flex-1 lg:flex-none"
                asChild
              >
                <Link to="/jobs">
                  Xem việc làm
                  <ArrowRight className="size-4 opacity-90" aria-hidden />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full border-primary/25 bg-white/90 font-semibold text-foreground hover:bg-primary/5 hover:text-primary dark:bg-slate-950/90 sm:flex-1 lg:flex-none"
                asChild
              >
                <Link to="/register">Tạo tài khoản ứng viên</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pt-10 sm:px-6 md:pt-12">
        <div className="ai-tool-panel overflow-hidden">
          <div className="border-b border-border/50 bg-muted/30 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Building2 className="size-[1.15rem]" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Giới thiệu
                </h2>
                <p className="text-xs font-medium text-muted-foreground">
                  Tổng quan nhà tuyển dụng
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <div className="mx-auto max-w-3xl">
              <p className="text-[15px] leading-[1.7] text-foreground/85 sm:text-base">
                <span className="font-semibold text-foreground">{company.name}</span> tuyển dụng tại{' '}
                {company.location}. Tại HireAI bạn có thể xem tin việc phù hợp, theo dõi nhà tuyển
                dụng và ứng tuyển trực tuyến — mọi thông tin được cập nhật theo dữ liệu nền tảng.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Đăng nhập bằng tài khoản ứng viên để xem thêm chi tiết về văn hóa, phúc lợi và lưu
                công ty vào danh sách theo dõi.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-3xl border-t border-border/60 pt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <Button
                  variant="outline"
                  className="h-11 w-full shrink-0 border-primary/20 font-semibold sm:w-auto sm:min-w-[240px]"
                  asChild
                >
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/candidate/companies/${company.id}` } }}
                  >
                    Đăng nhập ứng viên
                  </Link>
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-md sm:text-right">
                  Sau đăng nhập, bạn có thể mở đầy đủ hồ sơ công ty trong khu vực ứng viên.{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Đăng ký miễn phí
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCompanyDetailPage;
