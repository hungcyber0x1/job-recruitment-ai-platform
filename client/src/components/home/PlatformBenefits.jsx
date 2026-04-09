import React from 'react';
import { Rocket, Clock, Target, Handshake, Star } from 'lucide-react';

const PlatformBenefits = () => {
  const benefits = [
    {
      icon: <Rocket />,
      title: 'Cá nhân hóa bằng AI',
      desc: 'AI phân tích hồ sơ và sở thích của bạn để gợi ý việc làm phù hợp nhất',
      gradient: 'from-primary to-primary',
      bgColor: 'bg-white',
    },
    {
      icon: <Clock />,
      title: 'Tiết kiệm thời gian tìm việc',
      desc: 'Tìm kiếm thông minh giúp bạn nhanh chóng tìm thấy cơ hội việc làm phù hợp',
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-white',
    },
    {
      icon: <Target />,
      title: 'Định hướng đúng nghề',
      desc: 'Chatbot AI tư vấn chi tiết về nghề nghiệp, kỹ năng cần thiết và cơ hội phát triển',
      gradient: 'from-rose-500 to-pink-500',
      bgColor: 'bg-white',
    },
    {
      icon: <Handshake />,
      title: 'Kết nối nhanh doanh nghiệp',
      desc: 'Kết nối trực tiếp với nhà tuyển dụng, nhận phản hồi nhanh chóng và hiệu quả',
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-white',
    },
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Star size={24} className="text-primary-600 fill-blue-600" />
            <h2 className="text-4xl font-black text-slate-900 leading-tight">
              Lợi ích khi sử dụng nền tảng
            </h2>
          </div>
          <p className="text-lg text-slate-500 font-medium">
            Trải nghiệm tuyển dụng thông minh với công nghệ AI tiên tiến
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, i) => (
            <div key={i} className="group relative">
              <div className="h-full p-8 bg-white rounded-[32px] border border-slate-100 hover:border-primary-200 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-100/50 flex flex-col items-center text-center">
                {/* Icon */}
                <div className="mb-6 relative">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors duration-300">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white bg-gradient-to-br ${benefit.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {React.cloneElement(benefit.icon, { size: 24 })}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-primary-600 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-slate-500 leading-relaxed font-medium text-sm">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformBenefits;
