import React, { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import api from '@/services/api';

const AVATAR_PALETTE = [
  { bg: '#0f766e', fg: '#ecfeff' },
  { bg: '#047857', fg: '#ecfdf5' },
  { bg: '#1d4ed8', fg: '#eff6ff' },
  { bg: '#7c3aed', fg: '#f5f3ff' },
  { bg: '#be123c', fg: '#fff1f2' },
];

function getInitials(name = '') {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'HB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function hashText(value = '') {
  return Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildAvatarDataUri(name = 'HireBOT') {
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

const DEFAULT_REVIEWS = [
  {
    name: 'Nguyễn Văn Nam',
    role: 'Sinh viên công nghệ thông tin - Bách Khoa',
    content: 'Nhờ HireBOT, em đã tìm được vị trí thực tập phù hợp chỉ sau 1 tuần. Trợ lý gợi ý lộ trình học và chỉnh sửa CV rất thực tế. Rất đáng trải nghiệm!',
    rating: 5,
    avatar: buildAvatarDataUri('Nguyễn Văn Nam'),
  },
  {
    name: 'Trần Ngọc Hà',
    role: 'Quản lý nhân sự - VNG Corp',
    content: 'Hệ thống đánh giá ứng viên của HireBOT giúp đội ngũ của mình tiết kiệm 60% thời gian sàng lọc hồ sơ. Hệ thống lọc rất chuẩn các kỹ năng chuyên sâu.',
    rating: 5,
    avatar: buildAvatarDataUri('Trần Ngọc Hà'),
  },
  {
    name: 'Phạm Minh Tuấn',
    role: 'Lập trình viên cấp cao - Tiki',
    content: 'Mình thích tính năng phân tích độ phù hợp của CV với mô tả công việc. Giao diện cực kỳ thân thiện, tìm việc không còn là nỗi ám ảnh nữa.',
    rating: 5,
    avatar: buildAvatarDataUri('Phạm Minh Tuấn'),
  },
];

const Testimonials = () => {
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [title, setTitle] = useState('Phản hồi từ người dùng');

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get('homepage/testimonials');
        if (res.data?.success && res.data?.data?.items?.length > 0) {
          const items = res.data.data.items;
          setReviews(items.map(item => ({
            id: item.id,
            name: item.author_name,
            role: item.author_role || '',
            content: item.content,
            rating: item.rating || 5,
            avatar: resolveAvatarSrc(item.author_avatar, item.author_name),
          })));
          if (res.data.data.title) {
            setTitle(res.data.data.title);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch testimonials, using defaults:', error);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
      {/* Decorative background elements */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent" />
      <div className="absolute -left-40 top-40 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
      <div className="absolute -right-40 bottom-40 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />

      <div className="container relative mx-auto max-w-7xl px-4 2xl:px-0">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-sm font-semibold tracking-normal text-primary uppercase">
            {title}
          </h2>
          <p className="mt-3 text-3xl font-extrabold tracking-normal text-slate-900 sm:text-4xl lg:text-5xl">
            Người dùng nói gì về{' '}
            <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              HireBOT?
            </span>
          </p>
          <p className="mt-5 text-lg text-slate-600">
            Hàng ngàn ứng viên và nhà tuyển dụng đã kết nối thành công mỗi ngày qua nền tảng của
            chúng tôi.
          </p>
        </div>

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
      </div>
    </section>
  );
};

export default Testimonials;
