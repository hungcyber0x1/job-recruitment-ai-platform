import React, { useState } from 'react';
import {
  Sparkles,
  BrainCircuit,
  Target,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Award,
  Zap,
  BarChart3,
  ShieldCheck,
  Map,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';

const CareerPage = () => {
  const [step, setStep] = useState(0); // 0: Intro, 1-4: Assessment, 5: Analyzing, 6: Results

  // Form State
  const [formData, setFormData] = useState({
    education: '',
    skills: [],
    interests: '',
    goal: '',
  });

  const [loadingStage, setLoadingStage] = useState(0);

  // Mock Data
  const SKILLS_LIST = [
    'Programming',
    'Design',
    'Data Analysis',
    'Project Mgmt',
    'Marketing',
    'Leadership',
    'Problem Solving',
    'English',
  ];

  const handleStart = () => setStep(1);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Start Analysis
      setStep(5);
      // Simulate Analysis Stages
      let stage = 0;
      const interval = setInterval(() => {
        stage++;
        setLoadingStage(stage);
        if (stage > 3) {
          clearInterval(interval);
          setTimeout(() => setStep(6), 500);
        }
      }, 800);
    }
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 leading-relaxed">
      {/* 1. Corporate Header */}
      <div className="relative border-b border-slate-700 pt-32 pb-16 overflow-hidden bg-slate-900">
        {/* Background Image - Mountain Summit (Career Growth) */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100"
            alt="Mountain Summit"
            className="w-full h-full object-cover"
          />
          {/* Dark tint for contrast */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <BrainCircuit className="text-primary-300" size={24} />
              </div>
              <span className="text-primary-200 font-bold uppercase tracking-wider text-sm">
                AI Career Intelligence System
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1] text-wrap-balance">
              Định hướng sự nghiệp <br />
              <span className="text-primary-400">Chuẩn xác cùng AI</span>
            </h1>

            <p className="text-slate-200 text-xl font-medium mb-10 max-w-2xl leading-relaxed">
              Phân tích toàn diện hồ sơ năng lực, so sánh với 5.000+ vị trí tuyển dụng thực tế để đề
              xuất lộ trình phát triển tối ưu nhất.
            </p>

            {step === 0 && (
              <div className="flex gap-4">
                <Button
                  onClick={handleStart}
                  className="!bg-primary-600 !text-white !font-bold !text-lg !px-8 !py-4 !rounded-xl shadow-lg shadow-primary/20 hover:!bg-primary-700 hover:!scale-[1.02] transition-all"
                >
                  Bắt đầu đánh giá (Miễn phí)
                </Button>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 px-4">
                  <ShieldCheck size={18} className="text-green-500" />
                  <span>Bảo mật 100%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* 2. Professional Assessment Form */}
        {step >= 1 && step <= 4 && (
          <div className="max-w-3xl mx-auto">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-slate-400 font-bold text-sm uppercase tracking-wide">
                Bước {step}/4
              </span>
              <div className="h-2 flex-grow mx-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-500 ease-out"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
              <span className="text-slate-900 font-bold text-sm">
                {step === 1
                  ? 'Học vấn'
                  : step === 2
                    ? 'Kỹ năng'
                    : step === 3
                      ? 'Sở thích'
                      : 'Mục tiêu'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 md:p-12 animate-fade-in-up">
              {/* Step 1: Education */}
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">
                    Trình độ học vấn hiện tại
                  </h2>
                  <p className="text-slate-500 mb-8">
                    Dữ liệu này giúp AI xác định điểm xuất phát của bạn.
                  </p>
                  <div className="space-y-3">
                    {[
                      'THPT / Mới tốt nghiệp',
                      'Sinh viên Cao đẳng / Đại học',
                      'Đã tốt nghiệp Đại học',
                      'Thạc sĩ / Tiến sĩ',
                      'Khác',
                    ].map((opt) => (
                      <div
                        key={opt}
                        onClick={() => setFormData({ ...formData, education: opt })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                          formData.education === opt
                            ? 'border-primary-600 bg-primary-50/50'
                            : 'border-slate-100 hover:border-primary-200 hover:bg-muted/35'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.education === opt ? 'border-primary-600' : 'border-slate-300'}`}
                          >
                            {formData.education === opt && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary-600"></div>
                            )}
                          </div>
                          <span
                            className={`font-bold ${formData.education === opt ? 'text-primary-900' : 'text-slate-700'}`}
                          >
                            {opt}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Skills */}
              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Kỹ năng chuyên môn</h2>
                  <p className="text-slate-500 mb-8">
                    Chọn những kỹ năng bạn tự tin nhất (Tối thiểu 3).
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {SKILLS_LIST.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                          formData.skills.includes(skill)
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary/20'
                            : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <AlertCircle className="text-primary-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-base text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-900">Mẹo AI:</span> Đừng lo lắng nếu bạn
                      chưa thành thạo. Hệ thống sẽ đề xuất lộ trình học tập để lấp đầy các khoảng
                      trống kỹ năng này.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Interests */}
              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Phong cách làm việc</h2>
                  <p className="text-slate-500 mb-8">
                    Môi trường nào giúp bạn phát huy tối đa năng lực?
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        id: 'creative',
                        label: 'Sáng tạo & Đổi mới',
                        desc: 'Agency, Product Lab',
                        icon: <Sparkles />,
                      },
                      {
                        id: 'logic',
                        label: 'Dữ liệu & Logic',
                        desc: 'Fintech, Backend',
                        icon: <BrainCircuit />,
                      },
                      {
                        id: 'social',
                        label: 'Kết nối con người',
                        desc: 'HR, Sales, Community',
                        icon: <MessageSquare />,
                      },
                      {
                        id: 'system',
                        label: 'Quy trình & Vận hành',
                        desc: 'Operations, Admin',
                        icon: <Target />,
                      },
                    ].map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setFormData({ ...formData, interests: item.id })}
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                          formData.interests === item.id
                            ? 'border-primary-600 bg-primary-50/50'
                            : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${formData.interests === item.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {React.cloneElement(item.icon, { size: 20 })}
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{item.label}</h3>
                        <p className="text-slate-500 text-base">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Goals */}
              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">
                    Mục tiêu nghề nghiệp (3 năm)
                  </h2>
                  <p className="text-slate-500 mb-8">Đích đến tiếp theo của bạn là gì?</p>
                  <div className="space-y-3">
                    {[
                      'Trở thành Chuyên gia (Specialist)',
                      'Thăng tiến Quản lý (Manager)',
                      'Khởi nghiệp (Founder)',
                      'Thu nhập cao & Ổn định',
                      'Cân bằng (Work-Life Balance)',
                    ].map((goal) => (
                      <div
                        key={goal}
                        onClick={() => setFormData({ ...formData, goal: goal })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          formData.goal === goal
                            ? 'border-primary-600 bg-primary-50/50'
                            : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`font-bold ${formData.goal === goal ? 'text-primary-900' : 'text-slate-700'}`}
                        >
                          {goal}
                        </span>
                        {formData.goal === goal && (
                          <CheckCircle2 className="text-primary-600" size={20} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setStep(step - 1)}
                  className="text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
                >
                  Quay lại
                </button>
                <Button
                  onClick={handleNext}
                  className="!bg-slate-900 !text-white !font-bold !rounded-lg !px-8 hover:!bg-black shadow-lg shadow-slate-900/10"
                  disabled={step === 2 && formData.skills.length === 0}
                >
                  {step === 4 ? 'Phân tích ngay' : 'Tiếp tục'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 3. AI Analysis Simulation */}
        {step === 5 && (
          <div className="max-w-2xl mx-auto py-20 text-center">
            <div className="mb-12 relative flex justify-center">
              <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center relative z-10">
                <BrainCircuit className="text-primary-600 animate-pulse" size={40} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-primary-100 animate-ping"></div>
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-6">Đang xử lý dữ liệu…</h2>

            <div className="space-y-4 max-w-sm mx-auto text-left">
              {[
                { stage: 1, text: 'Đánh giá hồ sơ năng lực…' },
                { stage: 2, text: 'Quét dữ liệu thị trường 2026…' },
                { stage: 3, text: 'Xây dựng lộ trình cá nhân hóa…' },
              ].map((item) => (
                <div key={item.stage} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                      loadingStage >= item.stage
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-slate-200'
                    }`}
                  >
                    {loadingStage >= item.stage && <CheckCircle2 size={12} />}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      loadingStage >= item.stage ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Professional Results Dashboard */}
        {step === 6 && (
          <div className="max-w-5xl mx-auto animate-fade-in -mt-8">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden mb-8">
              <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 text-primary-300 font-bold text-sm uppercase tracking-widest mb-2">
                    <Award size={14} /> Recommended Career Path
                  </div>
                  <h2 className="text-3xl font-black mb-2">Frontend Developer</h2>
                  <p className="text-slate-400 max-w-xl">
                    Dựa trên kỹ năng "Design" và tư duy "Logic", đây là hướng đi phù hợp nhất để bạn
                    đạt mục tiêu "Chuyên gia" trong 3 năm tới.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-green-400 mb-1">94%</div>
                  <div className="text-sm font-bold text-slate-400 uppercase">Match Score</div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-sm uppercase">
                    <TrendingUp size={14} /> Nhu cầu thị trường
                  </div>
                  <div className="text-2xl font-black text-slate-900">Rất Cao</div>
                  <div className="text-sm text-green-600 font-bold mt-1">
                    +24% so với cùng kỳ năm trước
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-sm uppercase">
                    <Briefcase size={14} /> Lương trung bình
                  </div>
                  <div className="text-2xl font-black text-slate-900">15 - 25M</div>
                  <div className="text-sm text-slate-500 font-bold mt-1">Level: Junior - Mid</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-slate-500 font-bold text-sm uppercase">
                    <BarChart3 size={14} /> Độ khó
                  </div>
                  <div className="text-2xl font-black text-slate-900">Trung bình</div>
                  <div className="text-sm text-slate-500 font-bold mt-1">Cần 6 tháng đào tạo</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Left Col: Roadmap */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Map className="text-primary-600" size={20} />
                  Lộ trình 5 năm
                </h3>

                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <div className="relative border-l-2 border-slate-100 ml-3 space-y-10 pl-8 py-2">
                    {[
                      {
                        role: 'Fresher / Junior',
                        time: '0 - 1.5 năm',
                        desc: 'Tập trung vào React ecosystem, State Management và UI Principles.',
                      },
                      {
                        role: 'Mid-Senior Dev',
                        time: '1.5 - 3.5 năm',
                        desc: 'Chuyên sâu Performance, System Design và Mentorship.',
                      },
                      {
                        role: 'Tech Lead / Manager',
                        time: '4+ năm',
                        desc: 'Quản lý dự án, Kiến trúc hệ thống và Product Strategy.',
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full border-4 border-white bg-primary-600 shadow-md"></div>
                        <h4 className="font-bold text-lg text-slate-900">{item.role}</h4>
                        <span className="text-sm font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md mb-2 inline-block">
                          {item.time}
                        </span>
                        <p className="text-slate-500 text-base leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Actions */}
              <div className="space-y-6">
                {/* Skill Gap */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="text-orange-500" size={18} /> Skill Gap Analysis
                  </h4>
                  <div className="space-y-3">
                    {['TypeScript', 'Next.js', 'System Design'].map((s) => (
                      <div
                        key={s}
                        className="flex justify-between items-center p-3 rounded-lg bg-orange-50/50 border border-orange-100"
                      >
                        <span className="text-sm font-bold text-slate-700">{s}</span>
                        <span className="text-sm font-bold text-orange-600 uppercase bg-white px-2 py-0.5 rounded border border-orange-100">
                          Missing
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Course */}
                <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
                  <div className="flex items-center gap-2 text-primary-200 font-bold text-sm uppercase mb-4">
                    <Sparkles size={14} /> AI Recommendation
                  </div>
                  <h4 className="font-bold text-lg mb-2">ReactJS Advanced Course</h4>
                  <p className="text-primary-100 text-base mb-6 opacity-90">
                    Khóa học được đánh giá cao nhất để lấp đầy "TypeScript" gap của bạn.
                  </p>
                  <button className="w-full py-3 bg-white text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition-colors text-sm">
                    Xem chi tiết khóa học
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center pb-12">
              <h3 className="text-slate-400 font-medium text-sm mb-4">
                Bạn muốn khám phá thêm các cơ hội khác?
              </h3>
              <Link to="/jobs">
                <Button className="!rounded-full !px-8 !border-slate-300 font-bold hover:!text-primary-600 hover:!border-primary-600">
                  Xem việc làm đề xuất
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerPage;
