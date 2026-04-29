import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, BookOpen, TrendingUp, Lightbulb } from 'lucide-react';

const articles = [
  {
    title: 'Xây dựng hồ sơ gây ấn tượng với nhà tuyển dụng',
    category: 'Kỹ năng',
    categoryIcon: Lightbulb,
    excerpt:
      'Cách tận dụng công cụ tối ưu để cải thiện CV, hồ sơ cá nhân và tăng khả năng được mời phỏng vấn.',
    date: '15/03/2026',
    readTime: '5 phút đọc',
  },
  {
    title: 'Xu hướng tuyển dụng ngành IT năm 2026: Công nghệ thay đổi mọi thứ',
    category: 'Thị trường',
    categoryIcon: TrendingUp,
    excerpt:
      'Phân tích dữ liệu 8,000+ vị trí tuyển dụng IT. Những kỹ năng nào đang được săn đón nhất?',
    date: '12/03/2026',
    readTime: '8 phút đọc',
  },
  {
    title: 'Lộ trình từ cấp cơ bản lên lập trình viên cấp cao: Hướng dẫn thực tế',
    category: 'Phát triển',
    categoryIcon: BookOpen,
    excerpt:
      'Bản đồ chi tiết với mốc thời gian, kỹ năng cần học và mức lương kỳ vọng tại mỗi giai đoạn.',
    date: '08/03/2026',
    readTime: '10 phút đọc',
  },
];

const BlogHub = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div className="space-y-4">
            <span className="landing-badge">
              <BookOpen size={14} aria-hidden />
              Trung tâm kiến thức
            </span>
            <h2 className="landing-heading">
              Kiến thức <span className="landing-heading-muted">sự nghiệp</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed font-medium">
              Bài viết chuyên sâu từ chuyên gia về xu hướng nghề nghiệp, kỹ năng và phát triển bản thân
            </p>
          </div>
          <Link
            to="/public/blog"
            className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-primary/80 transition-colors group whitespace-nowrap landing-focus rounded-lg py-1"
          >
            Xem tất cả bài viết
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {articles.map((article, index) => (
            <motion.article
              key={article.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group landing-card overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-primary/[0.06] to-muted/30 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <article.categoryIcon size={48} className="text-primary/15" />
                </div>
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 border border-primary/12 text-primary rounded-lg text-sm font-bold">
                    <article.categoryIcon size={12} />
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-foreground font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-3 pt-2 text-muted-foreground/60 text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {article.date}
                  </span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogHub;
