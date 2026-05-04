import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, BriefcaseBusiness, Building2, ShieldCheck } from 'lucide-react';

import { companyService } from '../../services';
import { normalizeCompanyEntity } from '../../utils/domain';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const DEFAULT_TITLE = 'Được tin dùng bởi doanh nghiệp tăng trưởng';
const MAX_VISIBLE_PARTNERS = 8;
const TRUSTED_LAYOUT_BASE_CLASS = 'mx-auto mt-8 flex flex-wrap justify-center gap-4 lg:gap-5';
const TWO_COLUMN_ITEM_CLASS = 'sm:basis-[calc(50%_-_0.5rem)]';
const THREE_COLUMN_ITEM_CLASS = 'lg:basis-[calc(33.333333%_-_0.833333rem)]';
const FOUR_COLUMN_ITEM_CLASS = 'xl:basis-[calc(25%_-_0.9375rem)]';

function initialsFromName(name = '') {
  const words = String(name || 'Doanh nghiệp')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'DN';

  return words
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatCount(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('vi-VN').format(number);
}

function getTrustedLayoutClasses(count) {
  if (count <= 1) {
    return {
      wrapperClassName: `${TRUSTED_LAYOUT_BASE_CLASS} max-w-md`,
      itemClassName: 'basis-full',
    };
  }

  if (count === 2) {
    return {
      wrapperClassName: `${TRUSTED_LAYOUT_BASE_CLASS} max-w-4xl`,
      itemClassName: `basis-full ${TWO_COLUMN_ITEM_CLASS}`,
    };
  }

  if (count === 3) {
    return {
      wrapperClassName: `${TRUSTED_LAYOUT_BASE_CLASS} max-w-5xl`,
      itemClassName: `basis-full ${TWO_COLUMN_ITEM_CLASS} ${THREE_COLUMN_ITEM_CLASS}`,
    };
  }

  return {
    wrapperClassName: `${TRUSTED_LAYOUT_BASE_CLASS} max-w-6xl`,
    itemClassName: `basis-full ${TWO_COLUMN_ITEM_CLASS} ${THREE_COLUMN_ITEM_CLASS} ${FOUR_COLUMN_ITEM_CLASS}`,
  };
}

function isPublicTrustedCompany(company = {}) {
  const verificationStatus = String(company.verification_status || '').toLowerCase();
  const userStatus = String(company.user_status || company.owner_status || '').toLowerCase();
  const isVerified =
    company.is_verified === true || company.is_verified === 1 || company.is_verified === '1';
  const isFlagged = company.flagged === true || company.flagged === 1 || company.flagged === '1';
  const isBlockedUser = ['banned', 'suspended', 'locked'].includes(userStatus);

  return (isVerified || verificationStatus === 'approved') && !isFlagged && !isBlockedUser;
}

function normalizePartner(item = {}, fallbackKey) {
  const company = normalizeCompanyEntity(item);
  const name = company.name || 'Doanh nghiệp tuyển dụng';

  return {
    key: company.id ? `company-${company.id}` : fallbackKey,
    id: company.id,
    name,
    initials: initialsFromName(name),
    imgUrl: resolveMediaUrl(company.logo),
    industry: company.industry || 'Đa ngành nghề',
    location: company.location || 'Linh hoạt',
    openPositions: company.openPositions || 0,
    isVerified: company.is_verified || company.verification_status === 'approved',
  };
}

function PartnerLogo({ partner, index, itemClassName = '' }) {
  const [hasError, setHasError] = useState(false);
  const logoSrc = useMemo(() => String(partner.imgUrl || '').trim(), [partner.imgUrl]);
  const showTextFallback = hasError || !logoSrc;
  const detailPath = partner.id ? `/companies/${partner.id}` : '/companies';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ delay: Math.min(index * 0.035, 0.35), duration: 0.38, ease: 'easeOut' }}
      className={`flex h-full min-w-0 flex-none ${itemClassName}`.trim()}
    >
      <Link
        to={detailPath}
        aria-label={`Xem hồ sơ tuyển dụng của ${partner.name}`}
        className="group relative flex h-full min-h-[172px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_16px_45px_-34px_rgba(15,23,42,0.85)] ring-1 ring-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_55px_-32px_rgba(16,185,129,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/5 blur-2xl transition-transform duration-500 group-hover:scale-125"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-inner transition-colors duration-300 group-hover:border-primary/20 group-hover:bg-primary/[0.03]">
            {showTextFallback ? (
              <span className="text-base font-black tracking-normal text-primary">
                {partner.initials}
              </span>
            ) : (
              <img
                src={logoSrc}
                alt={`${partner.name} logo`}
                className="max-h-12 max-w-[120px] object-contain transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={() => setHasError(true)}
              />
            )}
          </div>

          {partner.isVerified && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-normal text-emerald-700">
              <ShieldCheck className="size-3.5" />
              Verified
            </span>
          )}
        </div>

        <div className="relative mt-4 min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug tracking-normal text-slate-950 transition-colors group-hover:text-primary">
            {partner.name}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-500">
            {partner.industry}
          </p>
          <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-400">{partner.location}</p>
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 transition-colors group-hover:border-primary/15 group-hover:bg-primary/[0.035]">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
            <BriefcaseBusiness className="size-4 text-primary" />
            {formatCount(partner.openPositions)} vị trí
          </span>
          <ArrowRight className="size-4 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </Link>
    </motion.div>
  );
}

const TrustedBy = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchPartners = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await companyService.getCompanies();
        if (cancelled) return;

        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        const normalizedPartners = rows
          .filter(isPublicTrustedCompany)
          .map((item, index) => normalizePartner(item, `company-${index}`));

        setPartners(normalizedPartners);
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to load trusted companies:', fetchError);
        setPartners([]);
        setError('Không tải được danh sách doanh nghiệp đã xác thực từ hệ thống.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPartners();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalOpenPositions = useMemo(
    () => partners.reduce((total, partner) => total + (Number(partner.openPositions) || 0), 0),
    [partners]
  );

  const visiblePartners = useMemo(() => partners.slice(0, MAX_VISIBLE_PARTNERS), [partners]);

  const renderContent = () => {
    if (loading) {
      const loadingLayout = getTrustedLayoutClasses(4);

      return (
        <div className={loadingLayout.wrapperClassName}>
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`${loadingLayout.itemClassName} min-h-[172px] flex-none animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.85)]`}
            >
              <div className="flex items-start justify-between">
                <div className="size-16 rounded-2xl bg-slate-100" />
                <div className="h-7 w-20 rounded-full bg-slate-100" />
              </div>
              <div className="mt-5 h-4 w-3/4 rounded bg-slate-100" />
              <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
              <div className="mt-6 h-10 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="mx-auto mt-8 flex min-h-[132px] max-w-5xl flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 text-center text-sm font-semibold text-rose-700">
          <AlertCircle className="mb-2 size-5" />
          {error}
        </div>
      );
    }

    if (partners.length === 0) {
      return (
        <div className="mx-auto mt-8 flex min-h-[132px] max-w-5xl flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-center text-sm font-semibold text-slate-500">
          <Building2 className="mb-2 size-5 text-primary" />
          Chưa có doanh nghiệp đã xác thực đủ điều kiện hiển thị công khai.
        </div>
      );
    }

    const trustedLayout = getTrustedLayoutClasses(visiblePartners.length);

    return (
      <div className={trustedLayout.wrapperClassName}>
        {visiblePartners.map((partner, index) => (
          <PartnerLogo
            key={partner.key}
            partner={partner}
            index={index}
            itemClassName={trustedLayout.itemClassName}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="relative py-2">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="h-px flex-1 bg-slate-200/90" aria-hidden />
          <p className="shrink-0 text-center text-sm font-semibold tracking-[0.02em] text-slate-500 md:text-[15px]">
            {DEFAULT_TITLE}
          </p>
          <div className="h-px flex-1 bg-slate-200/90" aria-hidden />
        </div>

        {!loading && !error && partners.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
              <ShieldCheck className="size-4" />
              {formatCount(partners.length)} doanh nghiệp đã xác thực
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
              <BriefcaseBusiness className="size-4 text-primary" />
              {formatCount(totalOpenPositions)} vị trí đang tuyển
            </span>
          </div>
        )}
      </div>

      {renderContent()}

      {!loading && !error && partners.length > 0 && (
        <div className="mx-auto mt-8 flex max-w-6xl justify-center">
          <Link
            to="/companies"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm transition-all hover:border-primary/25 hover:bg-primary hover:text-white hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            Khám phá toàn bộ doanh nghiệp
            {partners.length > visiblePartners.length && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 transition-colors group-hover:bg-white/15 group-hover:text-white">
                +{formatCount(partners.length - visiblePartners.length)}
              </span>
            )}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      <div className="mx-auto mt-12 max-w-6xl border-t border-slate-200/80" aria-hidden />
    </section>
  );
};

export default TrustedBy;
