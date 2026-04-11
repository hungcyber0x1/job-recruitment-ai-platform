import React from 'react';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    name: 'Nguyễn Văn Nam',
    role: 'Sinh viên IT - Bách Khoa',
    content:
      'Nhờ HireBOT, em đã tìm được thực tập sinh phù hợp chỉ sau 1 tuần. Trợ lý AI gợi ý lộ trình học và chỉnh sửa CV rất thực tế. Rất đáng trải nghiệm!',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=1',
  },
  {
    name: 'Trần Ngọc Hà',
    role: 'HR Manager - VNG Corp',
    content:
      'Hệ thống đánh giá ứng viên của HireBOT giúp team mình tiết kiệm 60% thời gian sàng lọc hồ sơ. AI lọc rất chuẩn các kĩ năng chuyên sâu.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=2',
  },
  {
    name: 'Phạm Minh Tuấn',
    role: 'Senior Developer - Tiki',
    content:
      'Mình thích tính năng phân tích độ fit của CV với JD. Giao diện cực kỳ thân thiện, tìm việc không còn là nỗi ám ảnh nữa.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=3',
  },
];

const Testimonials = () => {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
      {/* Decorative background elements */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent" />
      <div className="absolute -left-40 top-40 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
      <div className="absolute -right-40 bottom-40 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />

      <div className="container relative mx-auto max-w-7xl px-4 2xl:px-0">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-sm font-semibold tracking-wide text-primary uppercase">
            Phản hồi từ người dùng
          </h2>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
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
              key={i}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/40 bg-white p-8 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-primary/20 hover:border-primary/40"
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
