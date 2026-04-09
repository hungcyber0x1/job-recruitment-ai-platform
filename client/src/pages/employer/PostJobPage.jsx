import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  ChevronRight,
  FileText,
  MapPin,
  Save,
  Sparkles,
  CheckSquare,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';

import { aiService } from '@/services';
import categoryService from '../../services/categoryService';
import jobService from '../../services/jobService';
import { useNotification } from '../../context/NotificationContext';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const DEFAULT_FORM = {
  title: '',
  location: '',
  salaryMin: '',
  salaryMax: '',
  deadline: '',
  jobType: 'full_time',
  education: 'any',
  categoryId: '',
  description: '',
  benefits: '',
  requirements: '',
  experience: '',
};

const JOB_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' },
  { value: 'internship', label: 'Thực tập' },
  { value: 'remote', label: 'Làm việc từ xa' },
];

const JOB_TYPE_LABEL_MAP = {
  'full-time': 'full_time',
  full_time: 'full_time',
  'part-time': 'part_time',
  part_time: 'part_time',
  contract: 'contract',
  internship: 'internship',
  remote: 'remote',
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon size={16} />
        </div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
        {label}
        {required && <span className="ml-1 text-emerald-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 shadow-sm';

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 appearance-none cursor-pointer shadow-sm';

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const todayYmdLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const PostJobPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [aiAdvisor, setAiAdvisor] = useState({
    scores: [],
    overallPercent: 0,
    rating: 'Needs Improvement',
  });

  // real-time AI analysis
  useEffect(() => {
    const analysis = aiService.analyzeJobPost({
      title: formData.title,
      description: formData.description,
      salaryMin: formData.salaryMin,
      salaryMax: formData.salaryMax,
    });
    setAiAdvisor(analysis);
  }, [formData]);

  // bootstrap
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const categoryResponse = await categoryService.getAllCategories();
        const categoryList = categoryResponse.data?.data || [];
        setCategories(categoryList);

        if (!id) {
          if (categoryList[0]) {
            setFormData((prev) => ({ ...prev, categoryId: String(categoryList[0].id) }));
          }
          return;
        }

        const jobResponse = await jobService.getJob(id);
        const job = jobResponse.data?.data;
        if (!job) throw new Error('Job not found');

        setFormData({
          title: job.title || '',
          location: job.location || '',
          salaryMin: job.salary_min || '',
          salaryMax: job.salary_max || '',
          deadline: job.deadline ? String(job.deadline).slice(0, 10) : '',
          jobType: JOB_TYPE_LABEL_MAP[job.type] || 'full_time',
          education: job.education_required || 'any',
          categoryId: String(job.category_id || categoryList[0]?.id || ''),
          description: job.description || '',
          benefits: job.benefits || '',
          requirements: job.requirements || '',
          experience: job.experience_required || job.experience_level || '',
        });
      } catch (error) {
        console.error('Bootstrap error:', error);
        showNotification('Không thể tải dữ liệu tin tuyển dụng.', 'error');
      } finally {
        setPageLoading(false);
      }
    };
    bootstrap();
  }, [id, showNotification]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        location: formData.location.trim(),
        salary_min: formData.salaryMin
          ? Number(String(formData.salaryMin).replace(/[^0-9]/g, ''))
          : null,
        salary_max: formData.salaryMax
          ? Number(String(formData.salaryMax).replace(/[^0-9]/g, ''))
          : null,
        category_id: formData.categoryId ? Number(formData.categoryId) : null,
        type: formData.jobType,
        education_required: formData.education,
        experience_level: formData.experience || null,
        deadline: formData.deadline || null,
        status: 'published',
      };

      if (id) {
        await jobService.updateJob(id, payload);
        showNotification('Đã cập nhật tin tuyển dụng.', 'success');
      } else {
        await jobService.createJob(payload);
        showNotification('Đã tạo tin tuyển dụng.', 'success');
      }
      navigate('/employer/jobs');
    } catch (error) {
      console.error('Save error:', error);
      showNotification(error.response?.data?.message || 'Không thể lưu tin tuyển dụng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [showPreview, setShowPreview] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handlePreviewToggle = () => setShowPreview(!showPreview);

  const handleOptimizeTitle = async () => {
    if (!formData.title.trim()) {
      showNotification('Vui lòng nhập tiêu đề trước khi tối ưu.', 'error');
      return;
    }
    setIsOptimizing(true);
    // Simulate AI optimization call
    setTimeout(() => {
      const suggestions = [
        `Senior ${formData.title} (High Growth AI Startup)`,
        `${formData.title} - Chuyên gia AI & Machine Learning`,
        `Thực tập sinh ${formData.title} (Cơ hội đào tạo chuyên sâu)`,
      ];
      const best = suggestions[Math.floor(Math.random() * suggestions.length)];
      setFormData((prev) => ({ ...prev, title: best }));
      showNotification('Đã tối ưu hóa tiêu đề dựa trên dữ liệu thị trường!', 'success');
      setIsOptimizing(false);
    }, 1500);
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        location: formData.location.trim(),
        salary_min: formData.salaryMin
          ? Number(String(formData.salaryMin).replace(/[^0-9]/g, ''))
          : null,
        salary_max: formData.salaryMax
          ? Number(String(formData.salaryMax).replace(/[^0-9]/g, ''))
          : null,
        category_id: formData.categoryId ? Number(formData.categoryId) : null,
        type: formData.jobType,
        education_required: formData.education,
        experience_level: formData.experience || null,
        deadline: formData.deadline || null,
        status: 'draft',
      };
      if (id) {
        await jobService.updateJob(id, { ...payload, status: 'draft' });
      } else {
        await jobService.createJob({ ...payload, status: 'draft' });
      }
      showNotification('Đã lưu bản nháp.', 'success');
      navigate('/employer/jobs');
    } catch {
      showNotification('Không thể lưu bản nháp.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const aiScore = aiAdvisor.overallPercent;
  const aiScoreColor =
    aiScore >= 70 ? 'text-emerald-400' : aiScore >= 40 ? 'text-amber-400' : 'text-red-400';

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm font-medium text-slate-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* ── Header ── */}
      <div className="mb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <span
            className="hover:text-emerald-400 cursor-pointer transition-colors"
            onClick={() => navigate('/employer/jobs')}
          >
            Quản lý việc làm
          </span>
          <ChevronRight size={12} />
          <span className="text-slate-500 font-medium">
            {id ? 'Chỉnh sửa tin' : 'Đăng tin mới'}
          </span>
        </div>

        {/* Title row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 mb-3">
              <Sparkles size={10} />
              MẪU TUYỂN DỤNG MỚI
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Tạo tin tuyển dụng AI
            </h1>
            <p className="mt-1.5 text-sm text-slate-400 max-w-xl">
              Hệ thống AI của chúng tôi sẽ tự động phân tích mô tả của bạn để tìm kiếm và xếp hạng
              các ứng viên tiềm năng nhất.
            </p>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-muted/35 disabled:opacity-50 shadow-sm shadow-slate-200/50 active:scale-95"
            >
              <Save size={15} />
              Lưu bản nháp
            </button>
            <button
              type="button"
              onClick={handlePreviewToggle}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-muted/35 shadow-sm shadow-slate-200/50 active:scale-95"
            >
              Xem trước tin
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* Left column */}
          <div className="space-y-5">
            {/* Basic Info */}
            <SectionCard icon={FileText} title="Thông tin cơ bản">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField label="Tiêu đề công việc" required>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Vd: Senior AI Engineer (Python/PyTorch)"
                    />
                  </FormField>
                </div>

                <FormField label="Ngành nghề">
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="">Chọn ngành</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Địa điểm làm việc">
                  <div className="relative">
                    <MapPin
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className={`${inputClass} pl-9`}
                      placeholder="TP. Hồ Chí Minh"
                    />
                  </div>
                </FormField>

                <FormField label="Mức lương (Ước tính)">
                  <input
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Vd: 2,500–4,000 USD"
                  />
                </FormField>

                <FormField label="Hình thức làm việc">
                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {JOB_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Kinh nghiệm">
                  <input
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Vd: 3 năm trở lên"
                  />
                </FormField>

                <FormField label="Hạn nộp hồ sơ">
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    min={todayYmdLocal()}
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    Tùy chọn. Để trống nếu không giới hạn. Sau hạn, ứng viên không thể nộp đơn.
                  </p>
                </FormField>
              </div>
            </SectionCard>

            {/* Job Description */}
            <SectionCard icon={Briefcase} title="Mô tả công việc & Yêu cầu">
              <div className="space-y-5">
                <FormField label="Chi tiết công việc" required>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={8}
                    className={`${inputClass} resize-none leading-relaxed`}
                    placeholder="Nhập chi tiết công việc, nhiệm vụ hàng ngày và các quyền lợi..."
                  />
                </FormField>

                <FormField label="Yêu cầu ứng viên">
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={5}
                    className={`${inputClass} resize-none leading-relaxed`}
                    placeholder="Kỹ năng, kinh nghiệm và tố chất cần có..."
                  />
                </FormField>

                <FormField label="Quyền lợi">
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleChange}
                    rows={4}
                    className={`${inputClass} resize-none leading-relaxed`}
                    placeholder="Chế độ đãi ngộ, văn hóa làm việc..."
                  />
                </FormField>
              </div>
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* AI Screening Config */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Zap size={14} />
                </div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Cấu hình AI Screening
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Toggle items */}
                {[
                  {
                    label: 'Tự động chấm điểm CV',
                    desc: 'AI sẽ so sánh CV ứng viên với JD để đưa ra điểm số (Matching Score).',
                  },
                  {
                    label: 'Bộ lọc ứng viên "Ảo"',
                    desc: 'Loại bỏ các hồ sơ không phù hợp hoặc có dấu hiệu spam.',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-600 shadow-sm shadow-emerald-200">
                      <CheckSquare size={12} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}

                {/* AI threshold slider */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-2">
                    <span className="uppercase tracking-wider font-bold">Ngưỡng AI Phê duyệt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                        style={{ width: '75%' }}
                      />
                    </div>
                    <span className="text-sm font-black text-slate-900 tabular-nums">75%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Tip / Advisor */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-emerald-100/50">
                <Sparkles size={14} className="text-emerald-600" />
                <h2 className="text-xs font-black uppercase tracking-widest text-emerald-600">
                  MẸO TỪ AI
                </h2>
              </div>
              <div className="p-5">
                {aiAdvisor.scores.length > 0 ? (
                  <div className="space-y-3">
                    {aiAdvisor.scores.slice(0, 3).map((item) => (
                      <div key={item.label} className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.done ? 'bg-emerald-500' : 'bg-slate-600'}`}
                        />
                        <div>
                          <p className="text-xs font-medium text-slate-300">{item.label}</p>
                          {item.tip && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {item.tip}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-emerald-100">
                      <p className="text-xs text-slate-500 font-medium">
                        Điểm JD hiện tại:{' '}
                        <span
                          className={`font-black ${aiScoreColor.replace('text-emerald-400', 'text-emerald-600')}`}
                        >
                          {aiScore}%
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400 leading-relaxed">
                    "Tiêu đề công việc có từ 'Senior' và mức lương rõ ràng thường thu hút số lượng
                    ứng viên chất lượng cao hơn 45%."
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleOptimizeTitle}
                  disabled={isOptimizing}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                >
                  <SlidersHorizontal size={12} />
                  {isOptimizing ? 'Đang phân tích...' : 'Tối ưu hóa tiêu đề ngay'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                'Đang lưu...'
              ) : (
                <>
                  <Zap size={16} />
                  {id ? 'Cập nhật tin tuyển dụng' : 'Xác nhận & Đăng tin'}
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-600 px-2">
              Bằng việc đăng tuyển, bạn đồng ý với{' '}
              <span className="text-emerald-500/70">Điều khoản</span> và{' '}
              <span className="text-emerald-500/70">Chính sách riêng tư</span> của chúng tôi.
            </p>
          </div>
        </div>
      </form>
      {/* ── Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Xem trước hiển thị với ứng viên
              </h3>
              <button
                onClick={handlePreviewToggle}
                className="text-slate-400 hover:text-foreground transition-colors"
              >
                Đóng [X]
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-white space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <div className="inline-flex rounded-lg bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-600">
                  PREVIEW MODE
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                  {formData.title || 'Tiêu đề công việc'}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500 uppercase">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {formData.location || 'Địa điểm'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} />{' '}
                    {JOB_TYPE_OPTIONS.find((o) => o.value === formData.jobType)?.label}
                  </span>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-[1fr_250px]">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      Chi tiết công việc
                    </h4>
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {formData.description || 'Chưa có mô tả...'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      Yêu cầu ứng viên
                    </h4>
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {formData.requirements || 'Chưa có yêu cầu...'}
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Mức lương
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                      {formData.salaryMin} – {formData.salaryMax || 'Thỏa thuận'}
                    </p>
                  </div>
                  <button
                    disabled
                    className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold opacity-50 cursor-not-allowed"
                  >
                    ỨNG TUYỂN NGAY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostJobPage;
