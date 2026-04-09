import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Facebook } from 'lucide-react';

const footerColumns = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Việc làm', path: '/jobs' },
      { label: 'Phân tích CV', path: '/ai-cv-scanner' },
      { label: 'Coach nghề nghiệp AI', path: '/chat' },
      { label: 'Lộ trình nghề nghiệp', path: '/career' },
    ],
  },
  {
    title: 'Về chúng tôi',
    links: [
      { label: 'Sứ mệnh & tầm nhìn', path: '/about' },
      { label: 'Đội ngũ', path: '/about' },
      { label: 'Liên hệ', path: '/contact' },
    ],
  },
  {
    title: 'Công ty',
    links: [
      { label: 'Blog', path: '/blog' },
      { label: 'Tuyển dụng nội bộ', path: '/jobs' },
      { label: 'Báo chí', path: '/contact' },
    ],
  },
  {
    title: 'Pháp lý',
    links: [
      { label: 'Điều khoản', path: '/terms' },
      { label: 'Bảo mật', path: '/privacy' },
    ],
  },
];

const LandingFooter = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 relative border-t border-white/[0.06] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 py-14">
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_4px_14px_rgba(16,185,129,0.25)]">
                <span className="text-white font-black text-xl">H</span>
              </div>
              <span className="text-lg font-black text-white tracking-tight sm:text-xl">
                HireAI<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="max-w-md text-base font-medium leading-relaxed text-slate-500">
              HireAI kết nối nhân tài và cơ hội việc làm bằng AI: gợi ý việc khớp kỹ năng, phân tích
              CV và đồng hành phát triển sự nghiệp — dành cho ứng viên và doanh nghiệp tại Việt Nam.
            </p>
            <div className="flex items-center gap-2">
              {[
                { Icon: Linkedin, label: 'LinkedIn', href: '#' },
                { Icon: Facebook, label: 'Facebook', href: '#' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="size-9 bg-white/[0.06] border border-white/[0.08] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-primary/20 hover:border-primary/30 transition-all"
                >
                  <Icon className="size-4" />
                </a>
              ))}
              <a
                href="#"
                aria-label="TikTok"
                className="size-9 bg-white/[0.06] border border-white/[0.08] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-primary/20 hover:border-primary/30 transition-all"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.path}
                        className="text-base font-medium text-slate-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
              Liên hệ
            </h4>
            <div className="space-y-3">
              <a href="#" className="flex items-start gap-3 group">
                <MapPin size={14} className="text-primary/80 mt-0.5 shrink-0" />
                <span className="text-base font-medium text-slate-500 group-hover:text-slate-300">
                  Quận 1, TP. Hồ Chí Minh
                </span>
              </a>
              <a href="tel:+842873001234" className="flex items-start gap-3 group">
                <Phone size={14} className="text-primary/80 mt-0.5 shrink-0" />
                <span className="text-base font-medium text-slate-500 group-hover:text-slate-300">
                  +84 28 7300 1234
                </span>
              </a>
              <a href="mailto:contact@hireai.vn" className="flex items-start gap-3 group">
                <Mail size={14} className="text-primary/80 mt-0.5 shrink-0" />
                <span className="text-base font-medium text-slate-500 group-hover:text-slate-300">
                  contact@hireai.vn
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-center text-sm font-medium text-slate-500 sm:text-left">
            © {new Date().getFullYear()} HireAI.vn — Đường tới thành công sự nghiệp
          </p>
          <p className="text-sm font-medium text-slate-500">Thiết kế giao diện theo chuẩn HireAI</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
