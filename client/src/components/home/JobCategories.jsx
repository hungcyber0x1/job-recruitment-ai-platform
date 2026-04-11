import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code,
  Briefcase,
  Megaphone,
  Database,
  Layers,
  Users,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';

const categoriesRaw = [
  { name: 'Công nghệ thông tin', icon: Code, count: 1247 },
  { name: 'Kinh doanh & Sales', icon: Briefcase, count: 853 },
  { name: 'Marketing / PR', icon: Megaphone, count: 467 },
  { name: 'Tài chính / Ngân hàng', icon: Database, count: 921 },
  { name: 'Thiết kế / Sáng tạo', icon: Layers, count: 318 },
  { name: 'Nhân sự / HR', icon: Users, count: 243 },
  { name: 'Dữ liệu & AI', icon: Sparkles, count: 156 },
  { name: 'Quản trị dự án', icon: TrendingUp, count: 208 },
];
const categories = [...categoriesRaw]
  .sort((a, b) => b.count - a.count)
  .map((c) => ({ ...c, count: c.count.toLocaleString('vi-VN') }));

const JobCategories = () => {
  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-5"
          >
            <p className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
              Ngành nghề
            </p>
            <h2 className="text-4xl md:text-6xl font-extrabold text-foreground leading-[0.95] tracking-tighter">
              Khám phá <span className="text-primary">cơ hội theo ngành</span>
            </h2>
          </motion.div>

          <Link
            to="/categories"
            className="landing-link group flex items-center gap-3 text-sm font-semibold rounded landing-focus"
          >
            Xem tất cả
            <ArrowUpRight
              size={16}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 100, damping: 20 }}
              viewport={{ once: true }}
            >
              <Link
                to={`/jobs?category=${encodeURIComponent(cat.name)}`}
                className="group landing-card relative p-6 bg-background rounded-2xl flex flex-col h-full card-premium-hover shadow-sm"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                }}
              >
                <div className="size-11 rounded-xl bg-muted/60 text-muted-foreground border border-border flex items-center justify-center mb-5 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                  <cat.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </div>

                <h3 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:text-foreground transition-colors">
                  {cat.name}
                </h3>

                <div className="mt-auto pt-4 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-extrabold tabular-nums tracking-tight leading-none text-foreground">
                      {cat.count}
                    </p>
                    <p className="text-base text-muted-foreground font-medium mt-1">
                      việc làm đang mở
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
