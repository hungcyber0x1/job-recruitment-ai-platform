import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Quote, Star } from 'lucide-react';
import api from '@/services/api';

const AVATAR_PALETTE = [
  { bg: '#0f766e', fg: '#ecfeff' },
  { bg: '#047857', fg: '#ecfdf5' },
  { bg: '#1d4ed8', fg: '#eff6ff' },
  { bg: '#7c3aed', fg: '#f5f3ff' },
  { bg: '#be123c', fg: '#fff1f2' },
];

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return 'UV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function hashText(value = '') {
  return Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildAvatarDataUri(name = 'Người dùng') {
  const palette = AVATAR_PALETTE[hashText(name) % AVATAR_PALETTE.length];
  const initials = getInitials(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${initials}">
      <rect width="96" height="96" rx="48" fill="${palette.bg}" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="${palette.fg}">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function isRemoteHttpUrl(value = '') {
  return /^https?:\/\//i.test(String(value).trim());
}

function resolveAvatarSrc(avatar, name) {
  const trimmedAvatar = String(avatar || '').trim();
  const isOffline = typeof navigator !== 'undefined' ? navigator.onLine === false : false;

  if (!trimmedAvatar || (isOffline && isRemoteHttpUrl(trimmedAvatar))) {
    return buildAvatarDataUri(name);
  }

  return trimmedAvatar;
}

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [title, setTitle] = useState('Phản hồi từ người dùng');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchTestimonials = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await api.get('homepage/testimonials');
        if (cancelled) return;

        const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
        setReviews(
          items
            .map((item) => ({
              id: item.id,
              name: item.author_name || 'Người dùng',
              role: item.author_role || '',
              content: item.content || '',
              rating: Number(item.rating || 5),
              avatar: resolveAvatarSrc(item.author_avatar, item.author_name),
            }))
            .filter((item) => item.content)
        );

        if (res.data?.data?.title) {
          setTitle(res.data.data.title);
        }
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to load testimonials:', fetchError);
        setReviews([]);
        setError('Không tải được phản hồi người dùng từ API.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTestimonials();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border/40 bg-white text-slate-500 shadow-lg shadow-slate-200/40">
          <Loader2 className="mr-2 size-5 animate-spin text-primary" />
          Đang tải phản hồi từ API...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-6 text-center text-rose-700 shadow-lg shadow-rose-100/40">
          <AlertCircle className="mb-3 size-6" />
          <p className="text-base font-semibold">{error}</p>
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-border/40 bg-white px-6 text-center text-slate-500 shadow-lg shadow-slate-200/40">
          <Quote className="mb-3 size-6 text-primary" />
          <p className="text-base font-semibold text-slate-900">
            Chưa có phản hồi công khai từ API.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {reviews.map((review, i) => (
          <article
            key={review.id || i}
            className="group relative flex flex-col justify-between rounded-xl border border-border/40 bg-white p-8 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-primary/20 hover:border-primary/40"
          >
            <Quote className="absolute right-6 top-6 h-12 w-12 text-slate-100 transition-colors duration-300 group-hover:text-primary-50" />

            <div className="relative z-10">
              <div className="mb-6 flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    size={18}
                    className={
                      j < review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200'
                    }
                  />
                ))}
              </div>
              <p className="mb-8 text-lg leading-relaxed text-slate-700">"{review.content}"</p>
            </div>

            <div className="relative z-10 flex items-center gap-4 border-t border-slate-100 pt-6 transition-colors duration-300 group-hover:border-primary-50">
              <div className="relative">
                <img
                  src={review.avatar}
                  alt={review.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover ring-2 ring-transparent transition-all duration-300 group-hover:ring-primary group-hover:ring-offset-2"
                  loading="lazy"
                  onError={(e) => {
                    const fallbackAvatar = buildAvatarDataUri(review.name);
                    if (e.currentTarget.src !== fallbackAvatar) {
                      e.currentTarget.src = fallbackAvatar;
                    }
                  }}
                />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors duration-300">
                  {review.name}
                </h4>
                <p className="text-base font-medium text-slate-500">{review.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent" />
      <div className="absolute -left-40 top-40 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
      <div className="absolute -right-40 bottom-40 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />

      <div className="container relative mx-auto max-w-7xl px-4 2xl:px-0">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-sm font-semibold tracking-normal text-primary uppercase">{title}</h2>
          <p className="mt-3 text-3xl font-extrabold tracking-normal text-slate-900 sm:text-4xl lg:text-5xl">
            Người dùng nói gì về{' '}
            <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              HireBOT?
            </span>
          </p>
          <p className="mt-5 text-lg text-slate-600">
            Phản hồi được tải trực tiếp từ dữ liệu public của hệ thống.
          </p>
        </div>

        {renderContent()}
      </div>
    </section>
  );
};

export default Testimonials;
