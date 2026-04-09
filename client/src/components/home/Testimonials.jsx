import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    name: 'Phạm Minh Tuấn',
    role: 'Software Engineer',
    company: 'FPT Software',
    location: 'Hà Nội',
    content:
      'Mình tìm được công việc phù hợp chỉ sau hai tuần. Gợi ý việc làm khớp kinh nghiệm thật, không spam như các trang khác.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/120?u=phamminhtuan',
  },
  {
    name: 'Trần Ngọc Hà',
    role: 'HR Manager',
    company: 'VNG Corporation',
    location: 'TP. Hồ Chí Minh',
    content:
      'Đội tuyển dụng tiết kiệm thời gian sàng lọc nhờ điểm phù hợp từ AI — phỏng vấn vòng đầu đã sát người cần tuyển.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/120?u=tranngochavng',
  },
  {
    name: 'Lê Hoàng Nam',
    role: 'Product Designer',
    company: 'Tiki',
    location: 'TP. Hồ Chí Minh',
    content:
      'Phân tích CV chỉ ra đúng chỗ cần sửa. Sau khi chỉnh theo gợi ý, lượt gọi phỏng vấn tăng rõ rệt.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/120?u=lehoangnamtiki',
  },
  {
    name: 'Nguyễn Thu Huyền',
    role: 'Marketing Specialist',
    company: 'VNPAY',
    location: 'Hà Nội',
    content:
      'Giao diện cực kỳ thân thiện và dễ sử dụng. Từ lúc tạo CV đến lúc apply job diễn ra rất mượt mà. Đánh giá 5 sao!',
    rating: 5,
    avatar: 'https://i.pravatar.cc/120?u=nguyenthuhuyen',
  },
  {
    name: 'Hoàng Văn Thái',
    role: 'Data Analyst',
    company: 'MoMo',
    location: 'Đà Nẵng',
    content:
      'Tính năng so sánh lương giúp mình tự tin hơn nhiều khi deal lương với HR. Các thông tin công ty khá chi tiết.',
    rating: 4,
    avatar: 'https://i.pravatar.cc/120?u=hoangvanthai',
  },
];

const Testimonials = () => {
  return (
    <section className="isolate border-t border-border/40 bg-white py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Phản hồi
            </p>
            <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Người dùng nói gì về <span className="text-primary">HireAI</span>?
            </h2>
            <p className="mt-4 text-base font-medium text-muted-foreground">
              Trải nghiệm thực tế từ ứng viên và nhà tuyển dụng đang dùng nền tảng.
            </p>
          </motion.div>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
          {reviews.map((review, index) => (
            <motion.li
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-full min-h-0"
            >
              <article className="flex w-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-[0_16px_40px_-12px_rgba(16,185,129,0.08)] md:p-7">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex gap-0.5" aria-label={`${review.rating} trên 5 sao`}>
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        size={16}
                        className={
                          j < review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-muted/30 text-muted/30'
                        }
                        aria-hidden
                      />
                    ))}
                  </div>
                  <Quote
                    size={22}
                    className="shrink-0 text-primary/20"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                </div>
                <blockquote className="flex-1 text-[15px] font-medium leading-relaxed text-foreground/90">
                  &ldquo;{review.content}&rdquo;
                </blockquote>
                <footer className="mt-6 flex items-center gap-3 border-t border-border/50 pt-6">
                  <img
                    src={review.avatar}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    className="size-12 shrink-0 rounded-full object-cover ring-2 ring-border/40"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {review.role} · {review.company}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/85">{review.location}</p>
                  </div>
                </footer>
              </article>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Testimonials;
