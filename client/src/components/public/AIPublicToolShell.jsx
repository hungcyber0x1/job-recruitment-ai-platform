import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Khung chung trang công cụ AI: breadcrumb, hero (cùng hệ nền trang Việc làm), vùng nội dung có page-content-bg.
 */
const AIPublicToolShell = ({ icon: Icon, kicker = 'Công cụ AI', title, description, children }) => {
  return (
    <div className="min-h-screen bg-emerald-50/30">
      <section className="page-hero-bg page-hero-grain relative overflow-hidden">
        <div className="page-hero-pattern" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 md:pb-14 md:pt-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex flex-wrap items-center gap-1.5 text-base"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <Home className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              Trang chủ
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
            <span className="font-bold text-foreground">{kicker}</span>
          </nav>

          <header className="text-center">
            <div className="mx-auto mb-5 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-emerald-50 text-primary shadow-[0_10px_36px_-10px_rgba(16,185,129,0.35)] ring-1 ring-primary/15 dark:bg-primary/15 dark:ring-primary/25">
              <Icon className="size-9" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="mb-3 text-base font-bold uppercase tracking-widest text-primary">
              {kicker}
            </p>
            <h1 className="text-balance text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl md:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>
          </header>
        </div>
      </section>

      <div className="relative pb-16 pt-2 md:pt-4">
        <div className="page-content-bg relative">
          <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AIPublicToolShell;
