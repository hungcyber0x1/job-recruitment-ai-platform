import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  GraduationCap,
  Lightbulb,
  MapPin,
  Save,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiService } from '@/services';
import { useNotification } from '../../context/NotificationContext';
import { Input as FormInput, RichTextEditor } from '../../components/common';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import {
  FORM_VALUE_TO_JOB_TYPE,
  JOB_TYPE_TO_FORM_VALUE,
} from '../../constants/status';
import adminService from '../../services/adminService';
import categoryService from '../../services/categoryService';
import jobService from '../../services/jobService';
import { cn } from '../../utils/cn';

const DEFAULT_FORM = {
  title: '',
  location: '',
  address: '',
  salaryMin: '',
  salaryMax: '',
  salaryNegotiable: false,
  vacancies: 1,
  deadline: '',
  jobType: 'full_time',
  education: 'any',
  categoryId: '',
  description: '',
  benefits: '',
  requirements: '',
};

const JOB_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' },
  { value: 'internship', label: 'Thực tập' },
  { value: 'remote', label: 'Làm việc từ xa' },
];

const EDUCATION_LABELS = {
  any: 'Không bắt buộc',
  high_school: 'Trung học phổ thông',
  college: 'Cao đẳng',
  bachelor: 'Cử nhân',
  master: 'Thạc sĩ',
  phd: 'Tiến sĩ',
  other: 'Khác',
};

const EDUCATION_OPTIONS = [
  { value: 'any', label: 'Không bắt buộc' },
  { value: 'high_school', label: 'Trung học phổ thông' },
  { value: 'college', label: 'Cao đẳng' },
  { value: 'bachelor', label: 'Cử nhân' },
  { value: 'master', label: 'Thạc sĩ' },
  { value: 'phd', label: 'Tiến sĩ' },
  { value: 'other', label: 'Khác' },
];

const RATING_META = {
  Premium: {
    label: 'Rất tốt',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  Good: {
    label: 'Ổn định',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  'Needs Improvement': {
    label: 'Cần bổ sung',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
  },
};

const WORKFLOW_STAGE_STYLES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    hover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
  },
  blue: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    badge: 'bg-sky-50 text-sky-700 ring-sky-100',
    hover: 'hover:border-sky-200 hover:bg-sky-50/50',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    badge: 'bg-amber-50 text-amber-700 ring-amber-100',
    hover: 'hover:border-amber-200 hover:bg-amber-50/50',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    hover: 'hover:border-slate-300 hover:bg-slate-50/70',
  },
};

const todayYmdLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isTruthyFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

const stripHtml = (value = '') => String(value).replace(/<[^>]*>?/gm, '').trim();

function QuickActionButton({ icon: Icon, tone = 'default', className, children, ...props }) {
  const toneClass =
    tone === 'primary'
      ? 'border-slate-950 bg-slate-950 text-white hover:border-emerald-600 hover:bg-emerald-600 hover:text-white'
      : tone === 'soft'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
        : 'border-slate-200/90 bg-white/90 text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700';

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-11 justify-start rounded-xl px-4 text-sm font-semibold shadow-sm shadow-slate-950/[0.03]',
        toneClass,
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
      {children}
    </Button>
  );
}

function WorkflowStageLink({ href, icon: Icon, label, helper, value, tone = 'slate' }) {
  const styles = WORKFLOW_STAGE_STYLES[tone] || WORKFLOW_STAGE_STYLES.slate;

  return (
    <a
      href={href}
      title={helper}
      className={cn(
        'group inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700',
        styles.hover
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
      <span
        className={cn(
          'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ring-1 ring-inset',
          styles.badge
        )}
      >
        {value}
      </span>
      <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 transition-colors group-hover:text-emerald-500" />
    </a>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, description, meta }) {
  return (
    <div className="border-b border-slate-100/60 bg-gradient-to-br from-slate-50/50 via-white/50 to-emerald-50/10 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 text-emerald-600 ring-1 ring-emerald-500/20">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80">{eyebrow}</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {meta ? <div className="sm:self-center">{meta}</div> : null}
      </div>
    </div>
  );
}

const PostJobPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const isAdminPath = location.pathname.startsWith('/admin/');

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiAdvisor, setAiAdvisor] = useState({ scores: [], overallPercent: 0, rating: 'Needs Improvement' });

  useEffect(() => {
    const analysis = aiService.analyzeJobPost({
      title: formData.title,
      description: formData.description,
      salaryMin: formData.salaryMin,
      salaryMax: formData.salaryMax,
    });
    setAiAdvisor(analysis);
  }, [formData]);

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
          address: job.address || '',
          salaryMin: job.salary_min || '',
          salaryMax: job.salary_max || '',
          salaryNegotiable: isTruthyFlag(job.salary_negotiable),
          vacancies: job.vacancies || 1,
          deadline: job.deadline ? String(job.deadline).slice(0, 10) : '',
          jobType: FORM_VALUE_TO_JOB_TYPE[job.type] || 'full_time',
          education: job.education_required || 'any',
          categoryId: String(job.category_id || categoryList[0]?.id || ''),
          description: job.description || '',
          benefits: job.benefits || '',
          requirements: job.requirements || '',
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

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRichTextChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleGenerateAI = async () => {
    if (!formData.title) {
      showNotification('Vui lòng nhập tiêu đề để tạo nội dung phù hợp.', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedCategory = categories.find(
        (category) => String(category.id) === String(formData.categoryId)
      )?.name;
      const result = await aiService.generateJobDescription(formData.title, selectedCategory);

      if (result?.data) {
        setFormData((prev) => ({
          ...prev,
          description: result.data,
        }));
        showNotification('Đã tạo mô tả công việc.', 'success');
      }
    } catch {
      showNotification('Không thể tạo mô tả lúc này.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeTitle = async () => {
    if (!formData.title.trim()) {
      showNotification('Vui lòng nhập tiêu đề trước khi tối ưu.', 'error');
      return;
    }

    setIsOptimizing(true);
    window.setTimeout(() => {
      const suggestions = [
        `Vị trí ${formData.title} cấp cao cho đội ngũ sản phẩm tăng trưởng`,
        `${formData.title} - Cơ hội phát triển cùng đội ngũ công nghệ`,
        `${formData.title} | Ưu tiên ứng viên có kinh nghiệm thực chiến`,
      ];
      const best = suggestions[Math.floor(Math.random() * suggestions.length)];
      setFormData((prev) => ({ ...prev, title: best }));
      showNotification('Đã tối ưu hóa tiêu đề dựa trên gợi ý.', 'success');
      setIsOptimizing(false);
    }, 1500);
  };

  const validateForm = () => {
    const salaryMin = formData.salaryMin
      ? Number(String(formData.salaryMin).replace(/[^0-9]/g, ''))
      : 0;
    const salaryMax = formData.salaryMax
      ? Number(String(formData.salaryMax).replace(/[^0-9]/g, ''))
      : 0;
    const vacancies = Number.parseInt(formData.vacancies, 10);

    if (salaryMin > 0 && salaryMax > 0 && salaryMin > salaryMax) {
      return 'Mức lương tối thiểu không được lớn hơn mức lương tối đa.';
    }

    if (!Number.isFinite(vacancies) || vacancies < 1 || vacancies > 9999) {
      return 'Số lượng cần tuyển phải từ 1 đến 9999.';
    }

    return null;
  };

  const preparePayload = (status) => ({
    title: formData.title.trim(),
    description: formData.description,
    requirements: formData.requirements,
    benefits: formData.benefits,
    location: formData.location.trim(),
    address: formData.address.trim() || null,
    salary_min: formData.salaryMin
      ? Number(String(formData.salaryMin).replace(/[^0-9]/g, ''))
      : null,
    salary_max: formData.salaryMax
      ? Number(String(formData.salaryMax).replace(/[^0-9]/g, ''))
      : null,
    salary_negotiable: formData.salaryNegotiable ? 1 : 0,
    vacancies: Number.parseInt(formData.vacancies, 10) || 1,
    category_id: formData.categoryId ? Number(formData.categoryId) : null,
    type: JOB_TYPE_TO_FORM_VALUE[formData.jobType] || formData.jobType,
    education_required: formData.education,
    deadline: formData.deadline || null,
    status,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      showNotification(validationError, 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = preparePayload('published');
      const apiCall = id
        ? () => (isAdminPath ? adminService.updateJob(id, payload) : jobService.updateJob(id, payload))
        : () => (isAdminPath ? adminService.createJob(payload) : jobService.createJob(payload));

      const response = await apiCall();
      const nextStatus = response?.data?.data?.status;
      const requiresReview = ['pending', 'pending_review'].includes(nextStatus);

      showNotification(
        requiresReview
          ? 'Tin đã được gửi và đang chờ kiểm duyệt.'
          : 'Đã đăng tin tuyển dụng thành công.',
        'success'
      );

      navigate(
        isAdminPath
          ? requiresReview
            ? '/admin/jobs?status=pending_review'
            : '/admin/jobs'
          : requiresReview
            ? '/employer/jobs?status=pending_review'
            : '/employer/jobs'
      );
    } catch (error) {
      showNotification(error.response?.data?.message || 'Không thể đăng tin tuyển dụng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    const validationError = validateForm();
    if (validationError) {
      showNotification(validationError, 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = preparePayload('draft');
      const response = id
        ? await (isAdminPath ? adminService.updateJob(id, payload) : jobService.updateJob(id, payload))
        : await (isAdminPath ? adminService.createJob(payload) : jobService.createJob(payload));

      showNotification('Đã lưu bản nháp thành công.', 'success');

      if (!id && response?.data?.data?.id) {
        navigate(
          isAdminPath
            ? `/admin/jobs/edit/${response.data.data.id}`
            : `/employer/jobs/edit/${response.data.data.id}`
        );
      }
    } catch {
      showNotification('Không thể lưu bản nháp.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/80">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">
            Đang chuẩn bị trình soạn tin tuyển dụng...
          </p>
        </div>
      </div>
    );
  }

  const selectedCategoryLabel =
    categories.find((category) => String(category.id) === String(formData.categoryId))?.name || 'Chưa chọn';
  const jobTypeLabel =
    JOB_TYPE_OPTIONS.find((option) => option.value === formData.jobType)?.label || 'Chưa chọn';
  const educationLabel = EDUCATION_LABELS[formData.education] || formData.education || 'Chưa chọn';
  const publishButtonLabel = id ? 'Cập nhật tin tuyển dụng' : 'Công khai ngay';
  const salaryPreviewLabel =
    formData.salaryNegotiable
      ? 'Thỏa thuận'
      : formData.salaryMin || formData.salaryMax
        ? `${formData.salaryMin || 'Thỏa thuận'}${formData.salaryMax ? ` - ${formData.salaryMax}` : ''}`
        : 'Thỏa thuận';
  const vacanciesPreviewLabel = `${Number.parseInt(formData.vacancies, 10) || 1} người`;
  const filledFieldCount = [
    formData.title,
    formData.location,
    formData.categoryId,
    formData.description,
    formData.requirements,
    formData.benefits,
    formData.deadline,
  ].filter((value) => String(value || '').trim()).length;

  const scores = aiAdvisor?.scores || [];
  const pendingCount = scores.filter((score) => !score.done).length;
  const readyCount = scores.filter((score) => score.done).length;
  const rating = aiAdvisor?.rating || 'Needs Improvement';
  const ratingMeta = RATING_META[rating] || RATING_META['Needs Improvement'];
  const completionPercent = Math.min(100, Math.round((filledFieldCount / 7) * 100));
  const overallPercent = Math.min(100, Math.round(aiAdvisor?.overallPercent || 0));
  const setupReadyCount = [
    formData.title,
    formData.categoryId,
    formData.jobType,
  ].filter((value) => String(value || '').trim()).length;
  const basicsReadyCount = [
    formData.location,
    formData.salaryNegotiable ? 'negotiable' : `${formData.salaryMin}${formData.salaryMax}`,
    formData.vacancies,
    formData.deadline,
  ].filter((value) => String(value || '').trim()).length;
  const contentReadyCount = [
    formData.description,
    formData.requirements,
    formData.benefits,
  ].filter((value) => stripHtml(value).length > 0).length;

  const getToneFromProgress = (current, total) => {
    if (current >= total) return 'emerald';
    if (current > 0) return 'blue';
    return 'amber';
  };

  const heroOverviewCards = [
    {
      icon: FileText,
      label: 'Tiến độ biểu mẫu',
      value: `${completionPercent}%`,
      helper: `${filledFieldCount}/7 trường chính đã sẵn sàng để đăng.`,
      tone: completionPercent >= 85 ? 'emerald' : completionPercent >= 50 ? 'blue' : 'amber',
    },
    {
      icon: Sparkles,
      label: 'Chất lượng JD',
      value: `${overallPercent}%`,
      helper: `Đánh giá hiện tại: ${ratingMeta.label}.`,
      tone: rating === 'Premium' ? 'emerald' : rating === 'Good' ? 'blue' : 'amber',
    },
    {
      icon: Lightbulb,
      label: 'Mục cần rà soát',
      value: String(pendingCount),
      helper:
        pendingCount > 0
          ? 'Nên rà lại trước khi công khai để tăng chất lượng đầu vào.'
          : 'Không còn điểm nghẽn đáng kể trước khi đăng tin.',
      tone: pendingCount > 0 ? 'amber' : 'emerald',
    },
  ];

  const workflowStages = [
    {
      href: '#job-setup',
      icon: Briefcase,
      label: 'Định vị vai trò',
      helper: 'Tiêu đề, ngành nghề, loại hình',
      value: `${setupReadyCount}/3`,
      tone: getToneFromProgress(setupReadyCount, 3),
    },
    {
      href: '#job-basics',
      icon: MapPin,
      label: 'Thông tin cơ bản',
      helper: 'Địa điểm, lương, hạn nộp',
      value: `${basicsReadyCount}/4`,
      tone: getToneFromProgress(basicsReadyCount, 4),
    },
    {
      href: '#job-content',
      icon: FileText,
      label: 'Nội dung JD',
      helper: 'Mô tả, yêu cầu, quyền lợi',
      value: `${contentReadyCount}/3`,
      tone: getToneFromProgress(contentReadyCount, 3),
    },
  ];

  const selectClassName =
    'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10';

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-4xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm shadow-slate-900/10">
                <Building2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-inset ring-slate-200/80">
                  Đăng tin tuyển dụng
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">
                  {id ? 'Điều chỉnh chiến dịch tuyển dụng' : 'Trung tâm soạn tin tuyển dụng'}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Bố cục được đồng bộ với trang quản lý việc: phần tổng quan, thanh điều hướng nhanh và các khối nhập liệu dạng card giúp recruiter kiểm soát chiến dịch trước khi công khai.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {heroOverviewCards.map((card) => (
              <EmployerStatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <QuickActionButton
              icon={Save}
              onClick={handleSaveDraft}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Lưu bản nháp
            </QuickActionButton>
            <QuickActionButton
              icon={Eye}
              onClick={() => setShowPreview(true)}
              className="w-full sm:w-auto"
            >
              Xem trước
            </QuickActionButton>
            <QuickActionButton
              icon={Zap}
              tone="primary"
              type="submit"
              form="post-job-form"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {publishButtonLabel}
            </QuickActionButton>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <form id="post-job-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-2">
                {workflowStages.map((stage) => (
                  <WorkflowStageLink key={stage.href} {...stage} />
                ))}
              </div>
            </div>
          </div>

          <section id="job-setup" className="scroll-mt-24 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={Briefcase}
              eyebrow="Định vị vai trò"
              title="Thiết lập nhanh cho tin đăng"
              description="Dùng cùng cách bố trí như màn quản lý việc làm: tiêu đề chính, ngành nghề và loại hình luôn nằm ở lớp đầu để recruiter nhìn là hiểu chiến dịch."
              meta={
                <Button
                  type="button"
                  onClick={handleOptimizeTitle}
                  disabled={isOptimizing || !formData.title.trim()}
                  className="h-10 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-40"
                >
                  <SlidersHorizontal className={cn('mr-1.5 h-3.5 w-3.5', isOptimizing && 'animate-spin')} />
                  {isOptimizing ? 'Đang phân tích...' : 'Tối ưu tiêu đề'}
                </Button>
              }
            />

            <div className="px-5 py-5 sm:px-6">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-1">
                    <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Tiêu đề công việc, ví dụ: Senior Full-stack Developer"
                      className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 shadow-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 md:w-[220px]"
                  >
                    <option value="">Ngành nghề</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleChange}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 md:w-[190px]"
                  >
                    {JOB_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>
                    Đang soạn <strong className="text-slate-700">{formData.title || 'tin tuyển dụng mới'}</strong>
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                    {completionPercent}% hoàn thiện
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-semibold text-slate-600">
                    {selectedCategoryLabel}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-semibold text-slate-600">
                    {jobTypeLabel}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section id="job-basics" className="scroll-mt-24 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={MapPin}
              eyebrow="Thông tin nền"
              title="Thông tin cơ bản"
              description="Cấu trúc khối này bám theo ngôn ngữ card của trang quản lý việc làm: rõ tín hiệu, gọn trường nhập và ưu tiên các dữ liệu recruiter cần kiểm soát hằng ngày."
            />

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Địa điểm"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="TP. Hồ Chí Minh"
                  icon={MapPin}
                />
                <FormInput
                  label="Địa chỉ chi tiết"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Tầng 15, Bitexco, Q.1"
                  icon={Award}
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm shadow-slate-950/[0.03]">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-inset ring-slate-200 shadow-sm">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">Dải lương và nhu cầu tuyển</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Khoảng lương minh bạch giúp tăng độ tin cậy và làm danh sách hồ sơ đầu vào chính xác hơn.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormInput
                    label="Lương tối thiểu"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    placeholder="15.000.000"
                    icon={BarChart3}
                  />
                  <FormInput
                    label="Lương tối đa"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    placeholder="30.000.000"
                    icon={BarChart3}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-semibold leading-6 text-foreground">Số lượng</label>
                    <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <span className="text-sm text-slate-400">Tuyển</span>
                      <input
                        name="vacancies"
                        type="number"
                        value={formData.vacancies}
                        onChange={handleChange}
                        min="1"
                        max="9999"
                        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none"
                      />
                      <span className="text-sm text-slate-400">người</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Cho phép thương lượng lương</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Bật khi bạn chưa muốn khóa cứng khoảng lương ngay trên tin đăng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: { name: 'salaryNegotiable', value: !formData.salaryNegotiable },
                      })
                    }
                    className={cn(
                      'ml-auto inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-bold transition-colors',
                      formData.salaryNegotiable
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        formData.salaryNegotiable ? 'bg-emerald-500' : 'bg-slate-300'
                      )}
                    />
                    <span>{formData.salaryNegotiable ? 'Đang bật' : 'Đang tắt'}</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold leading-6 text-foreground">Hạn nộp</label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      min={todayYmdLocal()}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold leading-6 text-foreground">Yêu cầu học vấn</label>
                  <select name="education" value={formData.education} onChange={handleChange} className={selectClassName}>
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold leading-6 text-foreground">Loại hình</label>
                  <select name="jobType" value={formData.jobType} onChange={handleChange} className={selectClassName}>
                    {JOB_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section id="job-content" className="scroll-mt-24 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={Briefcase}
              eyebrow="Nội dung JD"
              title="Nội dung tin tuyển dụng"
              description="Nhóm mô tả, yêu cầu và quyền lợi theo cùng logic block của trang điều phối để recruiter nhìn nhanh được mức độ hoàn thiện của từng phần."
              meta={
                <Button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !formData.title}
                  className="h-10 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-40"
                >
                  <Wand2 className={cn('mr-1.5 h-3.5 w-3.5', isGenerating && 'animate-spin')} />
                  {isGenerating ? 'Đang tạo...' : 'Tạo với AI'}
                </Button>
              }
            />

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm shadow-slate-950/[0.03]">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-inset ring-slate-200 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Mô tả công việc</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Nêu phạm vi công việc, nhiệm vụ chính, mục tiêu và bối cảnh vận hành hằng ngày.
                    </p>
                  </div>
                </div>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleRichTextChange('description', value)}
                  placeholder="Mô tả công việc, nhiệm vụ hằng ngày, quy mô đội ngũ, sản phẩm hoặc dự án ứng viên sẽ tham gia..."
                  minHeight="220px"
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm shadow-slate-950/[0.03]">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 ring-1 ring-inset ring-slate-200 shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">Yêu cầu ứng viên</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Làm rõ kỹ năng, kinh nghiệm, công cụ và các tiêu chí bắt buộc để giảm hồ sơ lệch.
                      </p>
                    </div>
                  </div>
                  <RichTextEditor
                    value={formData.requirements}
                    onChange={(value) => handleRichTextChange('requirements', value)}
                    placeholder="Kỹ năng chuyên môn, kinh nghiệm, công cụ, sản phẩm đã từng làm, yêu cầu giao tiếp..."
                    minHeight="180px"
                  />
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm shadow-slate-950/[0.03]">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 ring-1 ring-inset ring-slate-200 shadow-sm">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">Quyền lợi và chế độ</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Trình bày phúc lợi thực tế, chính sách làm việc và các điểm hấp dẫn của môi trường.
                      </p>
                    </div>
                  </div>
                  <RichTextEditor
                    value={formData.benefits}
                    onChange={(value) => handleRichTextChange('benefits', value)}
                    placeholder="Lương thưởng, bảo hiểm, thiết bị làm việc, kỳ xét lương, linh hoạt kết hợp/từ xa, hoạt động nội bộ..."
                    minHeight="180px"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40">
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
            <div className="p-5 pl-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                      {overallPercent}% chất lượng JD
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                      {readyCount} mục đã ổn · {pendingCount} mục cần rà soát
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-bold tracking-tight text-slate-950">
                    Sẵn sàng đưa tin vào quy trình quản lý việc
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Lưu nháp để hoàn thiện tiếp, xem trước trải nghiệm ứng viên hoặc công khai để chuyển tin về trung tâm quản lý.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="h-11 rounded-lg border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Lưu nháp
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="h-11 rounded-lg border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Xem trước
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-lg bg-emerald-600 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    {publishButtonLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      <AnimatePresence>
        {showPreview ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                    Bản xem trước ứng viên
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-950">Xem trước trải nghiệm ứng viên</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-8">
                <div className="space-y-5">
                  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          Tin tuyển dụng đã tối ưu
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                          Xem trước public view
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                          {formData.title || 'Tiêu đề công việc'}
                        </h2>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                            {formData.location || 'Địa điểm'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
                            {jobTypeLabel}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            {selectedCategoryLabel}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          Thông tin nhanh
                        </p>
                        <p className="mt-2 text-xl font-bold text-emerald-600">{salaryPreviewLabel}</p>

                        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-emerald-600" />
                            {educationLabel}
                          </p>
                          <p className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-emerald-600" />
                            Tuyển {vacanciesPreviewLabel}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                            {formData.deadline ? `Hạn nộp ${formData.deadline}` : 'Không đặt hạn nộp'}
                          </p>
                        </div>

                        <Button
                          disabled
                          className="mt-4 h-10 w-full rounded-lg bg-slate-950 font-bold text-white opacity-90"
                        >
                          Ứng tuyển ngay
                        </Button>
                      </div>
                    </div>
                  </section>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-4">
                      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-950">Mô tả công việc</h4>
                        <div
                          className="prose prose-slate mt-3 max-w-none text-sm text-slate-600"
                          dangerouslySetInnerHTML={{
                            __html: formData.description || 'Nội dung đang được cập nhật...',
                          }}
                        />
                      </section>

                      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-950">Yêu cầu ứng viên</h4>
                        <div
                          className="prose prose-slate mt-3 max-w-none text-sm text-slate-600"
                          dangerouslySetInnerHTML={{
                            __html: formData.requirements || 'Nội dung đang được cập nhật...',
                          }}
                        />
                      </section>

                      {formData.benefits ? (
                        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-950">Quyền lợi và chế độ</h4>
                          <div
                            className="prose prose-slate mt-3 max-w-none text-sm text-slate-600"
                            dangerouslySetInnerHTML={{ __html: formData.benefits }}
                          />
                        </section>
                      ) : null}
                    </div>

                    <aside className="space-y-4">
                      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                          Gợi ý hiển thị
                        </p>
                        <p className="mt-2 text-xs leading-5 text-emerald-800">
                          Phiên bản xem trước này mô phỏng cách ứng viên nhìn thấy tin đăng sau khi công khai.
                        </p>
                      </section>
                    </aside>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default PostJobPage;
