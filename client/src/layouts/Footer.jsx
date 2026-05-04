import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Instagram, Linkedin, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';

import { Button, Logo } from '@/components/common';
import useNewsletterSubscription from '@/hooks/useNewsletterSubscription';
import { cn } from '@/utils/cn';

const footerLinks = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Tìm việc làm', path: '/jobs' },
      { label: 'Công ty', path: '/companies' },
      { label: 'Chấm điểm CV bằng AI', path: '/ai-cv-scanner' },
      { label: 'Blog kiến thức', path: '/blog' },
    ],
  },
  {
    title: 'Khám phá',
    links: [
      { label: 'Về HireBot', path: '/about' },
      { label: 'Mức lương thị trường', path: '/salary-predictor' },
      { label: 'Liên hệ hợp tác', path: '/contact' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Chat tư vấn AI', path: '/chat' },
      { label: 'Đăng nhập', path: '/login' },
      { label: 'Tạo tài khoản', path: '/register' },
      { label: 'Dành cho nhà tuyển dụng', path: '/register' },
    ],
  },
];

const socialLinks = [
  {
    label: 'Email HireBot',
    href: 'mailto:contact@hirebot.vn',
    Icon: Mail,
    color: 'hover:text-primary',
  },
  {
    label: 'Gọi HireBot',
    href: 'tel:+842873001234',
    Icon: Phone,
    color: 'hover:text-success',
  },
  {
    label: 'Trang liên hệ HireBot',
    href: '/contact',
    Icon: Linkedin,
    color: 'hover:text-[#0A66C2]',
    internal: true,
  },
  {
    label: 'Blog HireBot',
    href: '/blog',
    Icon: Instagram,
    color: 'hover:text-[#E4405F]',
    internal: true,
  },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const newsletter = useNewsletterSubscription({
    source: 'footer',
    topic: 'weekly_hiring_insights',
    metadata: { page: 'global', placement: 'footer' },
  });

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-primary pb-12 pt-24 font-sans text-slate-300">
      <div className="absolute left-1/4 top-0 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]"></div>
      <div className="absolute bottom-0 right-1/4 h-64 w-64 translate-y-1/2 rounded-full bg-accent/10 blur-[100px]"></div>

      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid gap-16 border-b border-white/10 pb-20 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-4">
            <div className="space-y-6">
              <Link
                to="/"
                className="group flex w-fit items-center gap-3 transition-opacity hover:opacity-90"
              >
                <Logo asLink={false} className="h-16 w-16" />
              </Link>

              <p className="max-w-sm text-base leading-relaxed text-slate-400">
                Nền tảng tuyển dụng ứng dụng AI để rút ngắn thời gian sàng lọc, tăng độ chính xác
                khi ghép nối ứng viên và hỗ trợ ra quyết định tuyển dụng rõ ràng hơn.
              </p>

              <div className="flex w-fit items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
                <ShieldCheck size={14} />
                Tập trung vào trải nghiệm tuyển dụng thực tế
              </div>
            </div>

            <div className="glass-dark relative overflow-hidden rounded-xl border border-white/5 p-6 shadow-2xl">
              <h2 className="text-base font-bold tracking-normal text-white">
                Nhận bản tin HireBOT
              </h2>
              <p className="mt-2 text-base text-slate-500">
                Cập nhật xu hướng tuyển dụng, tính năng mới và nội dung hữu ích cho ứng viên lẫn nhà
                tuyển dụng. Chỉ gửi khi có giá trị thực tế.
              </p>
              <form
                className="relative z-10 mt-4 flex gap-2"
                onSubmit={newsletter.submit}
                noValidate
              >
                <input
                  type="email"
                  name="footer-newsletter-email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="ten@congty.com"
                  value={newsletter.email}
                  onChange={(e) => newsletter.setEmail(e.target.value)}
                  disabled={newsletter.isSubmitting}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300 shadow-inner transition-all placeholder:text-slate-600 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Email nhận bản tin"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={newsletter.isSubmitting}
                  className="border-0 px-5 py-3 !rounded-xl font-bold shadow-glow disabled:cursor-not-allowed disabled:opacity-80"
                >
                  <ArrowRight
                    size={18}
                    className={newsletter.isSubmitting ? 'animate-pulse' : ''}
                  />
                </Button>
              </form>
              {newsletter.message ? (
                <p
                  className={`mt-3 text-sm font-semibold leading-relaxed ${
                    newsletter.status === 'error' ? 'text-red-300' : 'text-emerald-300'
                  }`}
                  role={newsletter.status === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                >
                  {newsletter.message}
                </p>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Bằng cách đăng ký, bạn đồng ý nhận bản tin và có thể huỷ bất cứ lúc nào.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 lg:col-span-8 md:grid-cols-3">
            {footerLinks.map((column) => (
              <div key={column.title} className="space-y-6">
                <h3 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-sm font-bold uppercase tracking-normal text-transparent">
                  {column.title}
                </h3>
                <ul className="space-y-4">
                  {column.links.map((link) => (
                    <li key={`${link.label}-${link.path}`}>
                      <Link
                        to={link.path}
                        className="group/link flex items-center gap-2 text-base text-slate-400 transition-all hover:text-white"
                      >
                        <span className="h-1 w-1 -translate-x-2 rounded-full bg-primary opacity-0 transition-all duration-300 group-hover/link:translate-x-0 group-hover/link:opacity-100"></span>
                        <span className="transition-transform duration-300 group-hover/link:translate-x-1">
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-2 border-t border-white/10 pt-6 md:col-span-3">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-primary shadow-sm">
                    <Mail size={16} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold uppercase tracking-normal text-white">
                      Email
                    </p>
                    <a
                      href="mailto:contact@hirebot.vn"
                      className="text-sm text-slate-500 transition-colors hover:text-primary"
                    >
                      contact@hirebot.vn
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-primary shadow-sm">
                    <Phone size={16} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold uppercase tracking-normal text-white">
                      Hotline
                    </p>
                    <a
                      href="tel:+842873001234"
                      className="text-sm text-slate-500 transition-colors hover:text-primary"
                    >
                      +84 (28) 7300 1234
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-primary shadow-sm">
                    <MapPin size={16} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold uppercase tracking-normal text-white">
                      Văn phòng
                    </p>
                    <p className="text-base text-slate-500">Innovation Building, Quận 12, TP.HCM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-8 pt-10 lg:flex-row">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <p className="whitespace-nowrap text-base font-medium text-slate-400">
              © {currentYear} HireBot Corp. Phát triển tại Việt Nam.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link to="/contact" className="transition-colors hover:text-primary">
                Liên hệ
              </Link>
              <Link to="/about" className="transition-colors hover:text-primary">
                Về chúng tôi
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-sm font-semibold uppercase tracking-normal">
                  Hệ thống hoạt động ổn định
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, Icon, color, internal }) =>
              internal ? (
                <Link
                  key={label}
                  to={href}
                  aria-label={label}
                  className={cn(
                    'rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow/20',
                    color
                  )}
                >
                  <Icon size={20} />
                </Link>
              ) : (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className={cn(
                    'rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow/20',
                    color
                  )}
                >
                  <Icon size={20} />
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
