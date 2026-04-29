import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import api from '@/services/api';

const DEFAULT_TITLE = 'Được tin tưởng bởi';

const WIKI_PARTNER_FALLBACKS = {
  'fpt software': {
    imgUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/FPT%20Software%20logo.svg',
    websiteUrl: 'https://fpt.com.vn',
    className: 'h-[42px] w-auto max-w-[174px] object-contain',
  },
  'viettel': {
    imgUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Viettel%20logo%202021.svg',
    websiteUrl: 'https://viettel.com.vn',
    className: 'h-[40px] w-auto max-w-[170px] object-contain',
  },
  'viettel solutions': {
    imgUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Viettel%20logo%202021.svg',
    websiteUrl: 'https://viettelsolutions.vn',
    className: 'h-[40px] w-auto max-w-[170px] object-contain',
  },
  'vng': {
    imgUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/VNG%20Corp.%20logo.svg',
    websiteUrl: 'https://vng.com.vn',
    className: 'h-[42px] w-auto max-w-[152px] object-contain',
  },
  'vng corporation': {
    imgUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/VNG%20Corp.%20logo.svg',
    websiteUrl: 'https://vng.com.vn',
    className: 'h-[42px] w-auto max-w-[152px] object-contain',
  },
  'cmc': {
    imgUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/CMC%20logo%202018.png',
    websiteUrl: 'https://cmctelecom.vn',
    className: 'h-[42px] w-auto max-w-[164px] object-contain',
  },
  'cmc telecom': {
    imgUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/CMC%20logo%202018.png',
    websiteUrl: 'https://cmctelecom.vn',
    className: 'h-[42px] w-auto max-w-[164px] object-contain',
  },
  'cmc corporation': {
    imgUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/CMC%20logo%202018.png',
    websiteUrl: 'https://cmctelecom.vn',
    className: 'h-[42px] w-auto max-w-[164px] object-contain',
  },
};

const DEFAULT_PARTNERS = [
  {
    key: 'partner-fpt',
    name: 'FPT Software',
    imgUrl: WIKI_PARTNER_FALLBACKS['fpt software'].imgUrl,
    websiteUrl: 'https://fpt.com.vn',
    className: WIKI_PARTNER_FALLBACKS['fpt software'].className,
  },
  {
    key: 'partner-viettel',
    name: 'Viettel Solutions',
    imgUrl: WIKI_PARTNER_FALLBACKS['viettel solutions'].imgUrl,
    websiteUrl: 'https://viettelsolutions.vn',
    className: WIKI_PARTNER_FALLBACKS['viettel solutions'].className,
  },
  {
    key: 'partner-vng',
    name: 'VNG Corporation',
    imgUrl: WIKI_PARTNER_FALLBACKS['vng corporation'].imgUrl,
    websiteUrl: 'https://vng.com.vn',
    className: WIKI_PARTNER_FALLBACKS['vng corporation'].className,
  },
  {
    key: 'partner-cmc',
    name: 'CMC Corporation',
    imgUrl: WIKI_PARTNER_FALLBACKS['cmc corporation'].imgUrl,
    websiteUrl: 'https://cmctelecom.vn',
    className: WIKI_PARTNER_FALLBACKS['cmc corporation'].className,
  },
];

function normalizePartnerName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSectionTitle(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .trim()
    .toLowerCase();
}

function getTrustedByTitle(value) {
  const normalized = normalizeSectionTitle(value);
  if (!normalized) return DEFAULT_TITLE;
  if (normalized === 'trusted by' || normalized === 'duoc tin tuong boi') return DEFAULT_TITLE;
  return String(value).trim();
}

function getWikiPartnerFallback(item = {}) {
  return WIKI_PARTNER_FALLBACKS[normalizePartnerName(item?.name)] || null;
}

function getPartnerLogoSrc(item = {}) {
  const logoUrl = String(item?.imgUrl || item?.logo_url || '').trim();
  const logoSvg = String(item?.logo_svg || '').trim();
  const fallback = getWikiPartnerFallback(item);

  if (fallback?.imgUrl) return fallback.imgUrl;

  if (logoUrl) return logoUrl;

  if (logoSvg.startsWith('<svg')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(logoSvg)}`;
  }

  if (logoSvg) return logoSvg;

  return '';
}

function normalizePartner(item, fallbackKey) {
  const fallback = getWikiPartnerFallback(item);

  return {
    key: fallbackKey,
    name: item?.name || 'Partner',
    imgUrl: getPartnerLogoSrc(item),
    logo_svg: item?.logo_svg || '',
    websiteUrl: item?.websiteUrl || item?.website_url || fallback?.websiteUrl || '',
    className: item?.className || fallback?.className || 'h-[40px] w-auto max-w-[160px] object-contain',
  };
}

function PartnerLogo({ partner }) {
  const [hasError, setHasError] = useState(false);
  const logoSrc = useMemo(() => getPartnerLogoSrc(partner), [partner]);
  const showTextFallback = hasError || !logoSrc;
  const Wrapper = partner.websiteUrl ? 'a' : 'div';

  return (
    <Wrapper
      {...(partner.websiteUrl
        ? {
            href: partner.websiteUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
          }
        : {})}
      aria-label={partner.websiteUrl ? `Open ${partner.name}` : partner.name}
      className="group relative flex h-[104px] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200/85 bg-white px-7 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.045)] ring-1 ring-white transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_14px_28px_-24px_rgba(15,23,42,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent"
      />

      {showTextFallback ? (
        <span className="text-center text-sm font-semibold tracking-[0.02em] text-slate-700">
          {partner.name}
        </span>
      ) : (
        <div className="flex w-full items-center justify-center">
          <img
            src={logoSrc}
            alt={`${partner.name} logo`}
            className={`${partner.className || 'h-[40px] w-auto max-w-[160px] object-contain'} transition-transform duration-300 group-hover:scale-[1.01]`}
            loading="lazy"
            onError={() => setHasError(true)}
          />
        </div>
      )}
    </Wrapper>
  );
}

const TrustedBy = () => {
  const [partners, setPartners] = useState(() =>
    DEFAULT_PARTNERS.map((item) => normalizePartner(item, item.key))
  );
  const [title, setTitle] = useState(DEFAULT_TITLE);

  useEffect(() => {
    let cancelled = false;

    const fetchPartners = async () => {
      try {
        const res = await api.get('homepage/partners');
        const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];

        if (cancelled || items.length === 0) return;

        setPartners(
          items.map((item, index) =>
            normalizePartner(
              item,
              `partner-${item.id || item.name?.toLowerCase().replace(/\s+/g, '-') || index}`
            )
          )
        );

        const nextTitle = getTrustedByTitle(res.data?.data?.title);
        if (nextTitle) {
          setTitle(nextTitle);
        }
      } catch (error) {
        console.warn('Failed to fetch partners, using defaults:', error);
      }
    };

    fetchPartners();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative">
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="h-px flex-1 bg-slate-200/90" aria-hidden />
        <p className="shrink-0 text-center text-sm font-semibold tracking-[0.02em] text-slate-500 md:text-[15px]">
          {title}
        </p>
        <div className="h-px flex-1 bg-slate-200/90" aria-hidden />
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.key}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="flex h-full min-w-0"
          >
            <PartnerLogo partner={partner} />
          </motion.div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-5xl border-t border-slate-200/80" aria-hidden />
    </section>
  );
};

export default TrustedBy;
