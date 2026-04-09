import React from 'react';
import { Target, Users, Sparkles, Zap, ArrowRight, Star, ShieldCheck, Globe } from 'lucide-react';
import { Card, Button, Badge, ScrollReveal, AnimatedCounter } from '../../components/common';
const AboutPage = () => {
  return (
    <>
      <div className="overflow-hidden mesh-gradient-bg pb-20 pt-8 md:pt-10">
        <div className="container mx-auto px-6">
          {/* Hero Section */}
          <section className="text-center max-w-4xl mx-auto mb-32 relative">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-600 font-bold text-xs uppercase tracking-widest mb-8">
                <Sparkles size={14} />
                Về sứ mệnh của chúng tôi
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight text-wrap-balance">
                Nâng tầm sự nghiệp bằng <br />
                <span className="text-primary-600 neon-text">Trí tuệ nhân tạo</span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed font-medium">
                HireAI không chỉ là một nền tảng tuyển dụng. Chúng tôi là người bạn đồng hành thông
                minh, giúp hàng triệu người Việt tìm thấy công việc mơ ước và giúp doanh nghiệp xây
                dựng đội ngũ huyền thoại.
              </p>
            </ScrollReveal>
          </section>

          {/* Vision & Mission Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-32">
            <ScrollReveal direction="left">
              <div className="bg-slate-900 rounded-[40px] p-12 md:p-16 text-white relative overflow-hidden group h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -z-0"></div>
                <Target
                  className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700"
                  size={240}
                />
                <Badge
                  variant="primary"
                  className="mb-6 bg-primary-500/20 text-primary-400 border-primary-500/20"
                >
                  Tầm nhìn
                </Badge>
                <h3 className="text-4xl font-black mb-8 relative z-10 text-wrap-balance">
                  Trở thành nền tảng <br /> Jobs-AI số 1 Đông Nam Á.
                </h3>
                <p className="text-slate-400 leading-relaxed text-lg font-medium relative z-10">
                  Chúng tôi nỗ lực xóa bỏ rào cản thông tin và sự thiếu chính xác trong tuyển dụng
                  truyền thống bằng cách áp dụng những mô hình AI tiên tiến nhất thế giới.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="bg-primary-600 rounded-[40px] p-12 md:p-16 text-white relative overflow-hidden group h-full shadow-2xl shadow-blue-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -z-0"></div>
                <Zap
                  className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700"
                  size={240}
                />
                <Badge variant="primary" className="mb-6 bg-white/20 text-white border-white/10">
                  Sứ mệnh
                </Badge>
                <h3 className="text-4xl font-black mb-8 relative z-10 text-wrap-balance">
                  Hàng triệu cơ hội, <br /> Giải quyết trong 1 chạm.
                </h3>
                <p className="text-white/80 leading-relaxed text-lg font-medium relative z-10">
                  HireAI cam kết mang lại sự minh bạch, tốc độ và độ chính xác tuyệt đối trong mọi
                  kết nối giữa ứng viên và nhà tuyển dụng.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Stats Bar */}
          <section className="bg-white/70 backdrop-blur-xl rounded-[40px] p-12 border border-white shadow-2xl shadow-primary/5 mb-32">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { label: 'Người dùng', val: 500000, suffix: '+' },
                { label: 'Doanh nghiệp', val: 15000, suffix: '+' },
                { label: 'Tin tuyển dụng', val: 100000, suffix: '+' },
                { label: 'Tỷ lệ Hài lòng', val: 9.8, suffix: '/10' },
              ].map((stat, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="space-y-2">
                    <AnimatedCounter
                      end={stat.val}
                      suffix={stat.suffix}
                      decimals={stat.val % 1 !== 0 ? 1 : 0}
                      className="text-4xl font-black text-primary-600"
                    />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {stat.label}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* Core Values */}
          <section className="mb-32">
            <ScrollReveal>
              <div className="text-center max-w-2xl mx-auto mb-20">
                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight text-wrap-balance">
                  Giá trị của HireAI
                </h2>
                <div className="w-20 h-1.5 bg-primary-600 mx-auto rounded-full mb-6"></div>
                <p className="text-slate-500 font-medium">
                  Chúng tôi xây dựng nền tảng dựa trên những nguyên tắc bền vững để phục vụ cộng
                  đồng.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users size={32} />,
                  title: 'Người dùng là ưu tiên',
                  desc: 'Mọi tính năng đều được tối ưu cho trải nghiệm tốt nhất của bạn.',
                },
                {
                  icon: <ShieldCheck size={32} />,
                  title: 'Bảo mật tuyệt đối',
                  desc: 'Thông tin cá nhân và doanh nghiệp được mã hóa đa lớp cực kỳ an toàn.',
                },
                {
                  icon: <Globe size={32} />,
                  title: 'Tầm vóc toàn cầu',
                  desc: 'Kết nối tài năng Việt với các thị trường phát triển nhất thế giới.',
                },
              ].map((v, i) => (
                <ScrollReveal key={i} delay={i * 200} direction="up">
                  <Card className="p-10 hover-lift text-center flex flex-col items-center h-full group">
                    <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-8 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                      {v.icon}
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-4">{v.title}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{v.desc}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* Culture / CTA */}
          <section className="bg-slate-900 rounded-[60px] p-10 md:p-20 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -z-0"></div>

            <div className="lg:w-1/2 relative z-10">
              <ScrollReveal direction="left">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight tracking-tight text-wrap-balance">
                  Gia nhập đội ngũ <br /> xây dựng tương lai.
                </h2>
                <p className="text-slate-400 text-lg font-medium mb-10 leading-relaxed max-w-lg">
                  Tại HireAI, chúng tôi luôn chào đón những nhân tố sáng tạo, nhiệt huyết và khao
                  khát ứng dụng công nghệ để giải quyết các vấn đề lớn cho hàng triệu người.
                </p>
                <Button
                  className="px-10 py-5 rounded-2xl text-lg font-extrabold flex items-center gap-3 bg-primary-600 border-none hover:shadow-glow transition-all"
                  icon={<ArrowRight size={20} />}
                >
                  Khám phá các vị trí tuyển dụng
                </Button>
              </ScrollReveal>
            </div>

            <div className="lg:w-1/2 grid grid-cols-2 gap-4 relative z-10">
              <div className="space-y-4">
                <ScrollReveal delay={200}>
                  <div className="aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                    <img
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop"
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                      alt="Culture"
                    />
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={400}>
                  <div className="aspect-square rounded-[32px] bg-primary-600 flex flex-col items-center justify-center p-6 text-white text-center shadow-2xl shadow-primary/20">
                    <Star size={40} className="mb-4 fill-white" />
                    <p className="text-lg font-black tracking-tight leading-none">
                      Best Place to Work 2026
                    </p>
                  </div>
                </ScrollReveal>
              </div>
              <div className="space-y-4 pt-12">
                <ScrollReveal delay={300}>
                  <div className="aspect-square rounded-[32px] bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center p-8 text-white relative overflow-hidden group">
                    <span className="text-6xl font-black relative z-10 opacity-20 group-hover:opacity-40 transition-opacity">
                      AI
                    </span>
                    <p className="absolute bottom-6 left-6 font-bold text-xs uppercase tracking-widest text-primary-500">
                      Tech First Culture
                    </p>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={500}>
                  <div className="aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                    <img
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&auto=format&fit=crop"
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                      alt="Culture"
                    />
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
