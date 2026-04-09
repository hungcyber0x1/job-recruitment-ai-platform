import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Instagram } from 'lucide-react';

const footerLinks = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Tìm việc làm', path: '/jobs' },
      { label: 'Công ty', path: '/companies' },
      { label: 'Chấm điểm CV AI', path: '/ai-cv-scanner' },
      { label: 'Luyện phỏng vấn', path: '/ai-interview' },
      { label: 'Dự báo lương', path: '/salary-predictor' },
    ],
  },
  {
    title: 'Tài nguyên',
    links: [
      { label: 'Blog kiến thức', path: '/blog' },
      { label: 'Định hướng nghề nghiệp', path: '/career' },
      { label: 'Chat tư vấn AI', path: '/chat' },
      { label: 'Danh mục ngành', path: '/categories' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Dành cho nhà tuyển dụng', path: '/register' },
      { label: 'Về chúng tôi', path: '/about' },
      { label: 'Liên hệ', path: '/contact' },
    ],
  },
];

const socialLinks = [
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Mail, href: 'mailto:contact@hireai.vn', label: 'Email' },
];

const ModernFooter = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-white/5">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 py-16 lg:py-20">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-6">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xl">H</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                HireAI<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Kiến tạo tương lai nghề nghiệp bằng sức mạnh của Trí tuệ nhân tạo. Kết nối nhân tài
              với cơ hội xứng tầm.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary/20 hover:border-primary/30 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  <Icon className="size-5" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm font-medium text-slate-500 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Liên hệ
            </h4>
            <div className="space-y-3">
              <a
                href="#"
                className="flex items-start gap-3 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
              >
                <MapPin className="size-4 text-primary mt-0.5 shrink-0" aria-hidden />
                Quận 1, TP. Hồ Chí Minh
              </a>
              <a
                href="tel:+842873001234"
                className="flex items-start gap-3 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Phone className="size-4 text-primary mt-0.5 shrink-0" aria-hidden />
                +84 28 7300 1234
              </a>
              <a
                href="mailto:contact@hireai.vn"
                className="flex items-start gap-3 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Mail className="size-4 text-primary mt-0.5 shrink-0" aria-hidden />
                contact@hireai.vn
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} HireAI. Phát triển tại Việt Nam.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Chính sách bảo mật
            </Link>
            <Link
              to="/terms"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ModernFooter;
