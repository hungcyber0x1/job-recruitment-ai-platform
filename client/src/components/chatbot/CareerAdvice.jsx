import React from 'react';
import { Trophy, Lightbulb, Target, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const CareerAdvice = () => {
  const advices = [
    {
      title: 'Tối ưu Portfolio',
      desc: 'Dự án "E-commerce App" của bạn thiếu phần Unit Test. Thêm nó sẽ tăng điểm kỹ thuật lên 15%.',
      icon: <Lightbulb className="text-amber-500" />,
    },
    {
      title: 'Lộ trình Fullstack',
      desc: 'Với nền tảng React hiện tại, bạn nên học thêm Node.js và PostgreSQL để trở thành Fullstack Developer.',
      icon: <Target className="text-emerald-600" />,
    },
    {
      title: 'Kỹ năng phỏng vấn',
      desc: 'Khóa học "Behavioral Interview" đang miễn phí cho thành viên Gold. Đừng bỏ lỡ!',
      icon: <BookOpen className="text-green-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Sparkles size={18} />
        </div>
        <h3 className="text-xl font-black text-slate-900">Lời khuyên của AI</h3>
      </div>

      {advices.map((advice, i) => (
        <Card
          key={i}
          className="p-6 border-none shadow-xl shadow-slate-100/50 hover:scale-[1.02] transition-all group"
        >
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
              {React.cloneElement(advice.icon, { size: 24 })}
            </div>
            <div className="flex-grow">
              <h4 className="font-black text-slate-900 mb-2 truncate">{advice.title}</h4>
              <p className="text-base text-slate-500 font-medium leading-relaxed mb-4">
                {advice.desc}
              </p>
              <button className="text-emerald-600 font-bold text-sm uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Chi tiết <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </Card>
      ))}

      <Card className="p-8 bg-slate-900 text-white relative overflow-hidden mt-10">
        <Trophy className="absolute -right-4 -bottom-4 opacity-10" size={120} />
        <div className="relative z-10 text-center">
          <h4 className="text-xl font-black mb-4">Mở khóa Career Roadmaps</h4>
          <p className="text-slate-400 text-base font-medium mb-8">
            Tính năng phân tích lộ trình chuyên sâu dựa trên xu hướng thị trường 2026.
          </p>
          <Button variant="primary" className="w-full bg-emerald-600 border-none font-black">
            Nâng cấp Premium
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CareerAdvice;
