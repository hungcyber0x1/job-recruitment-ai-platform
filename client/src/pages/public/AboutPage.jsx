import React from 'react';
import {
  Search,
  Building2,
  FileText,
  Bot,
  BrainCircuit,
  Map,
  Users,
  Briefcase,
  Shield,
  CheckCircle2,
  Cpu,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Badge, ScrollReveal } from '../../components/common';

const SectionHeading = ({ children, align = 'center' }) => (
  <h2
    className={`text-2xl font-semibold text-slate-900 mb-8 ${align === 'center' ? 'text-center' : ''}`}
  >
    {children}
  </h2>
);

const AboutPage = () => {
  const features = [
    {
      icon: <Search className="w-6 h-6 text-primary" />,
      bg: 'bg-primary/10',
      title: 'Hệ thống tìm kiếm linh hoạt',
      desc: 'Hỗ trợ tìm kiếm việc làm và ứng tuyển dễ dàng với nhiều bộ lọc nâng cao.',
    },
    {
      icon: <Building2 className="w-6 h-6 text-primary" />,
      bg: 'bg-primary/10',
      title: 'Hồ sơ Công ty & Tuyển dụng',
      desc: 'Giúp doanh nghiệp xây dựng thương hiệu tuyển dụng chuyên nghiệp và quản lý quy trình ứng tuyển khép kín.',
    },
    {
      icon: <FileText className="w-6 h-6 text-primary" />,
      bg: 'bg-primary/10',
      title: 'Theo dõi Ứng tuyển & CV',
      desc: 'Ứng viên dễ dàng tạo, quản lý CV và theo dõi trạng thái ứng tuyển theo thời gian thực.',
    },
    {
      icon: <Bot className="w-6 h-6 text-primary" />,
      bg: 'bg-primary/10',
      title: 'Career Chatbot',
      desc: 'Trợ lý ảo thông minh giải đáp thắc mắc và tư vấn nghề nghiệp tức thời.',
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-primary" />,
      bg: 'bg-primary/10',
      title: 'AI Resume Analysis',
      desc: 'Tự động phân tích và chấm điểm CV, giúp chắt lọc ứng viên tiềm năng nhanh chóng.',
    },
    {
      icon: <Map className="w-6 h-6 text-primary" />,
      bg: 'bg-primary/10',
      title: 'Dự đoán Lương bằng AI',
      desc: 'Phân tích dữ liệu thị trường để đưa ra mức lương tham khảo phù hợp với kỹ năng và kinh nghiệm.',
    },
  ];

  const benefits = [
    'Tuyển dụng thông minh nhờ sức mạnh dữ liệu.',
    'Kết nối ứng viên và nhà tuyển dụng dễ dàng.',
    'Hỗ trợ AI chuyên sâu từ Chatbot đến chấm điểm CV.',
    'Trải nghiệm người dùng cực kỳ hiện đại, thân thiện.',
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-80px)]">
      {/* 1. Hero Section */}
      <section className="page-hero-bg page-hero-grain relative overflow-hidden">
        <div className="page-hero-pattern" aria-hidden />
        <div className="page-hero-blob page-hero-blob-1" aria-hidden />
        <div className="page-hero-blob page-hero-blob-2" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
                <Sparkles size={16} />
                <span>Nền tảng Tuyển Dụng AI</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-normal text-slate-900 mb-6 leading-tight">
                Khám phá Nền tảng <br className="hidden sm:block" />
                <span className="text-primary bg-primary/10 px-4 py-1 rounded-xl inline-block mt-2">
                  Tuyển Dụng & Việc Làm
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
                Giải pháp tuyển dụng toàn diện tích hợp Trí tuệ Nhân tạo. Nâng cao trải nghiệm ứng
                tuyển và tối ưu hóa quản lý nhân sự một cách nhanh chóng, chuẩn xác.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/jobs">
                  <Button className="w-full sm:w-auto px-8 py-3 text-base">
                    Khám phá Việc làm
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="w-full sm:w-auto px-8 py-3 text-base">
                    Tham gia Ngay
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Project Introduction Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <ScrollReveal>
            <SectionHeading>Hệ thống phục vụ những ai?</SectionHeading>
            <p className="text-center text-base text-slate-600 mb-12 max-w-3xl mx-auto">
              Hệ thống được thiết kế khép kín nhằm tạo ra một môi trường tương tác liền mạch giữa ba
              thành phần cốt lõi của quy trình tuyển dụng chuẩn mực.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-[45px] left-0 w-full h-[2px] bg-slate-100 z-0" />

              <Card
                hover
                className="h-full p-8 transition-all duration-300 bg-white relative z-10 group"
              >
                <div className="w-14 h-14 border border-border/40 shadow-sm rounded-xl flex items-center justify-center mb-6 bg-slate-50/50 group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-300">
                  <Users className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Ứng viên
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  Tìm kiếm cơ hội việc làm, tạo hồ sơ, tự động phân tích CV và nhận tư vấn hướng
                  nghiệp từ Chatbot.
                </p>
              </Card>

              <Card
                hover
                className="h-full p-8 transition-all duration-300 bg-white relative z-10 group"
              >
                <div className="w-14 h-14 border border-border/40 shadow-sm rounded-xl flex items-center justify-center mb-6 bg-slate-50/50 group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-300">
                  <Briefcase className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Nhà tuyển dụng
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  Đăng tin, quản lý hồ sơ ứng viên và sử dụng AI để tự động sàng lọc những CV tài
                  năng nhất.
                </p>
              </Card>

              <Card
                hover
                className="h-full p-8 transition-all duration-300 border-border/40 bg-white relative z-10 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl group"
              >
                <div className="w-14 h-14 border border-border/40 shadow-sm rounded-xl flex items-center justify-center mb-6 bg-slate-50/50 group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-300">
                  <Shield className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Quản trị viên
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  Theo dõi, kiểm duyệt hoạt động hệ thống và đảm bảo trải nghiệm an toàn cho mọi
                  người dùng.
                </p>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. Main Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <ScrollReveal>
            <SectionHeading>Tính năng Cốt lõi</SectionHeading>
          </ScrollReveal>
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <Card key={idx} hover variant="premium" className="p-6 transition-all duration-500">
                  <div
                    className={`mb-5 w-14 h-14 rounded-xl flex items-center justify-center ${feature.bg} shadow-sm border border-transparent group-hover:border-primary/20 group-hover:bg-primary/10 transition-all duration-300`}
                  >
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-base text-slate-600 leading-relaxed">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. Why Choose This Platform */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-5xl">
          <ScrollReveal>
            <Card className="overflow-hidden border-0 shadow-2xl rounded-[2rem]">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-5/12 p-10 md:p-14 bg-slate-900 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/60 via-primary/10 to-transparent opacity-80" />
                  <div className="absolute -top-10 -right-10 opacity-10 transform group-hover:rotate-12 transition-transform duration-700">
                    <Sparkles className="w-48 h-48 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
                      Tại sao chọn nền tảng của chúng tôi?
                    </h2>
                    <p className="text-base lg:text-lg text-slate-300 mb-0 font-medium leading-relaxed">
                      Công cụ của chúng tôi không chỉ số hóa hồ sơ mà còn rút ngắn khoảng cách giữa
                      nhà tuyển dụng và những tài năng phù hợp thực sự.
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-7/12 p-10 md:p-14 bg-white flex flex-col justify-center relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full z-0" />
                  <ul className="space-y-6 relative z-10">
                    {benefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        className="flex items-start group/item hover:bg-slate-50 p-3 -m-3 rounded-xl transition-colors duration-300"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-4 group-hover/item:bg-primary group-hover/item:text-white transition-colors duration-300 shadow-sm border border-primary/20">
                          <CheckCircle2 className="w-6 h-6 text-primary group-hover/item:text-white transition-colors duration-300" />
                        </div>
                        <span className="text-base lg:text-lg text-slate-700 font-bold pt-1.5 group-hover/item:text-slate-900 transition-colors">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. Vision / Mission Section & 6. Highlights */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal animation="fade-right">
              <div>
                <Badge variant="outline" className="mb-4 text-primary border-primary bg-primary/5">
                  Nguồn gốc & Tầm nhìn
                </Badge>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Giải Bài Toán Thực Tiễn</h2>
                <p className="text-base text-slate-600 mb-5 leading-relaxed">
                  Được phát triển dưới khuôn khổ của một <strong>Đồ án Tốt nghiệp</strong>, hệ thống
                  ra đời với định hướng giải quyết một bài toán quản trị thực tiễn: Số hóa và Trí
                  tuệ nhân tạo hóa quy trình tuyển dụng.
                </p>
                <p className="text-base text-slate-600 leading-relaxed mb-8">
                  Sứ mệnh của chúng tôi là minh chứng việc công nghệ lõi như AI có thể ứng dụng vào
                  cuộc sống để xóa bỏ những rào cản truyền thống, từ đó mở ra tương lai cho thị
                  trường làm việc số hiện đại.
                </p>
                <Link to="/ai-cv-scanner">
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 px-0">
                    Trải nghiệm AI Scanner <Search className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card hover className="p-6 text-center group transition-all duration-300 bg-white">
                  <div className="w-16 h-16 mx-auto mb-4 border border-border/40 bg-slate-50/50 rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-300">
                    <Users className="w-8 h-8 text-primary opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                  <h4 className="text-xl font-extrabold text-foreground mb-2 group-hover:text-primary transition-colors">
                    3 Vai trò
                  </h4>
                  <p className="text-base text-muted-foreground">
                    Được phân quyền quản trị độc lập
                  </p>
                </Card>
                <Card
                  hover
                  className="p-6 text-center group transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg border-border/40 bg-white"
                >
                  <div className="w-16 h-16 mx-auto mb-4 border border-border/40 bg-slate-50/50 rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-300">
                    <Cpu className="w-8 h-8 text-primary opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                  <h4 className="text-xl font-extrabold text-foreground mb-2 group-hover:text-primary transition-colors">
                    Công cụ AI
                  </h4>
                  <p className="text-base text-muted-foreground">
                    Tích hợp chấm điểm & tư vấn nghề nghiệp
                  </p>
                </Card>
                <Card
                  hover
                  className="p-6 text-center md:col-span-2 group transition-all duration-300 border-border/40 bg-gradient-to-br from-slate-50 to-primary/5"
                >
                  <div className="w-16 h-16 mx-auto mb-4 border border-primary/10 bg-white shadow-sm rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary/10 transition-all duration-300">
                    <Workflow className="w-8 h-8 text-primary opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                  <h4 className="text-xl font-extrabold text-foreground mb-2 group-hover:text-primary transition-colors">
                    Luồng tuyển dụng xuyên suốt
                  </h4>
                  <p className="text-base text-muted-foreground">
                    Từ lúc đăng tin đến khi ứng viên nhận lời mời phỏng vấn thành công
                  </p>
                </Card>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 7. CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl">
          <ScrollReveal>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-normal text-white mb-6">
              Bắt đầu trải nghiệm ngay!
            </h2>
            <p className="text-lg text-white/90 mb-10 font-medium leading-relaxed max-w-2xl mx-auto">
              Trải nghiệm toàn bộ những tính năng và lợi ích tuyệt vời nhất của đồ án chỉ bằng một
              vài thao tác đăng ký đơn giản.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button className="h-14 px-8 w-full sm:w-auto text-base font-bold rounded-xl bg-white text-primary hover:bg-slate-50 shadow-[0_0_40px_rgba(255,255,255,0.7)] hover:shadow-[0_0_60px_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-0.5">
                  Tạo Tài khoản
                </Button>
              </Link>
              <Link to="/jobs">
                <Button
                  variant="outline"
                  className="h-14 px-8 w-full sm:w-auto text-base font-bold rounded-xl border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 bg-transparent"
                >
                  Khám phá Việc làm
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
