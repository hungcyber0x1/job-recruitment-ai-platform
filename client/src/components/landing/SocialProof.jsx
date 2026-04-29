import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, TrendingUp, Users, Briefcase, Award } from 'lucide-react';

const testimonials = [
  {
    name: 'Phạm Minh Tuấn',
    role: 'Kỹ sư phần mềm',
    company: 'FPT Software',
    initials: 'PT',
    text: 'Hệ thống của HireBOT phân tích CV và gợi ý vị trí lập trình giao diện cấp cao cực kỳ chính xác. Từ lúc đăng ký đến lúc nhận đề nghị chỉ 2 tuần. Ấn tượng nhất là các bước tiếp theo mà AI đề xuất rất sát với hồ sơ của tôi.',
    rating: 5,
  },
  {
    name: 'Trần Ngọc Hà',
    role: 'Quản lý nhân sự',
    company: 'VNG Corporation',
    initials: 'TH',
    text: 'Với tư cách nhà tuyển dụng, HireBOT giúp chúng tôi giảm 70% thời gian sàng lọc CV. Hệ thống gợi ý hồ sơ rõ ràng, dễ theo dõi và tiết kiệm rất nhiều thời gian cho đội ngũ.',
    rating: 5,
  },
  {
    name: 'Lê Hoàng Nam',
    role: 'Nhà thiết kế sản phẩm',
    company: 'Tiki',
    initials: 'LN',
    text: 'Tính năng cố vấn nghề nghiệp thật sự hữu ích. Hệ thống không chỉ gợi ý việc mà còn chỉ ra những kỹ năng nên ưu tiên và đề xuất tài liệu học phù hợp. Đây chính xác là điều tôi cần.',
    rating: 5,
  },
];

const stats = [
  { icon: Users, value: '47,200+', label: 'Ứng viên tin tưởng' },
  { icon: Briefcase, value: '1,247', label: 'Doanh nghiệp đối tác' },
  { icon: TrendingUp, value: 'Nhanh hơn 70%', label: 'Thời gian sàng lọc tiết kiệm' },
  { icon: Award, value: '8,340', label: 'Việc làm đang mở' },
];

const companies = [
  'FPT Software',
  'VNG Corporation',
  'Tiki',
  'VinGroup',
  'MoMo',
  'Techcombank',
  'Shopee Vietnam',
  'VNPAY',
  'KMS Technology',
  'Nash Tech',
  'Zalo',
  'Masan Group',
];

const SocialProof = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="landing-card p-6 text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                <stat.icon
                  size={22}
                  className="text-primary group-hover:text-white transition-colors"
                />
              </div>
              <p className="text-2xl lg:text-3xl font-extrabold text-foreground tabular-nums tracking-normal">
                {stat.value}
              </p>
              <p className="text-muted-foreground text-base font-medium mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 space-y-4"
        >
          <span className="landing-badge">Câu chuyện thành công</span>
          <h2 className="landing-heading">
            Được tin tưởng <span className="landing-heading-muted">bởi hàng nghìn người</span>
          </h2>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="landing-card p-7"
            >
              <div className="flex items-center gap-1 mb-5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <div className="relative mb-6">
                <Quote size={20} className="text-primary/15 absolute -top-1 -left-1" />
                <p className="text-foreground/80 text-base leading-relaxed pl-6">{item.text}</p>
              </div>
              <div className="flex items-center gap-3 pt-5 border-t border-border/40">
                <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center text-primary text-sm font-bold">
                  {item.initials}
                </div>
                <div>
                  <p className="text-foreground font-bold text-base">{item.name}</p>
                  <p className="text-muted-foreground text-base font-medium">
                    {item.role} · {item.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Company Marquee */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <p className="text-center text-base font-semibold uppercase tracking-normal text-muted-foreground mb-8">
            Tin tưởng bởi 1,200+ doanh nghiệp tại Việt Nam
          </p>
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-12 items-center whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              {[...companies, ...companies].map((company, i) => (
                <span
                  key={i}
                  className="text-lg font-bold text-foreground/15 hover:text-foreground/40 transition-colors cursor-default tracking-normal"
                >
                  {company}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
