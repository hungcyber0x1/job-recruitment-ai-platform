import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Gift,
  LayoutGrid,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import Button from '../common/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

const DEFAULT_FORM = {
  title: '',
  company_id: '',
  category_id: '',
  description: '',
  requirements: '',
  benefits: '',
  location: '',
  salary_min: '',
  salary_max: '',
  salary_negotiable: false,
  vacancies: 1,
  deadline: '',
  type: 'full-time',
};

const CATEGORY_OPTIONS = [
  { value: 'it', label: 'Công nghệ thông tin' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Thiết kế' },
  { value: 'sales', label: 'Kinh doanh' },
  { value: 'other', label: 'Khác' },
];

const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Toàn thời gian' },
  { value: 'part-time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' },
  { value: 'internship', label: 'Thực tập' },
  { value: 'freelance', label: 'Freelance' },
];

const publishingGuidelines = [
  {
    title: 'Rõ công ty và bối cảnh tuyển',
    description:
      'Tin đăng nên gắn đúng doanh nghiệp, loại hình và địa điểm trước khi xuất bản để dữ liệu hiển thị chính xác ở toàn hệ thống.',
  },
  {
    title: 'Mô tả đủ trách nhiệm và kỳ vọng',
    description:
      'JD càng cụ thể về phạm vi công việc, yêu cầu và quyền lợi thì tỉ lệ ứng viên phù hợp càng tốt.',
  },
];

function SectionCard({ icon: Icon, title, description, action, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

function FieldBlock({ icon: Icon, label, hint, className = '', children }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <Label className="text-sm font-bold text-slate-800">{label}</Label>
          {hint ? <p className="mt-1 text-sm leading-6 text-slate-500">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function SummaryStat({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

const normalizeText = (value) => String(value ?? '').trim();

const isTruthyFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

const formatDateInput = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
};

const formatCurrencyPreview = (salaryMin, salaryMax, salaryNegotiable = false) => {
  if (salaryNegotiable) return 'Thỏa thuận';

  const hasMin = salaryMin !== '' && salaryMin !== null && salaryMin !== undefined;
  const hasMax = salaryMax !== '' && salaryMax !== null && salaryMax !== undefined;

  if (!hasMin && !hasMax) return 'Thỏa thuận';

  const formattedMin = hasMin ? Number(salaryMin).toLocaleString('vi-VN') : 'Thỏa thuận';
  const formattedMax = hasMax ? Number(salaryMax).toLocaleString('vi-VN') : 'Thỏa thuận';

  if (hasMin && hasMax) return `${formattedMin} - ${formattedMax} VND`;
  if (hasMin) return `Từ ${formattedMin} VND`;
  return `Đến ${formattedMax} VND`;
};

const formatDeadlinePreview = (value) => {
  if (!value) return 'Chưa đặt hạn';

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Chưa đặt hạn';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
};

const AdminJobForm = ({ job = null, onSuccess, onCancel }) => {
  const isEdit = Boolean(job);
  const { showNotification } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        const [companiesRes, categoriesRes] = await Promise.all([
          adminService.getCompanies({ limit: 100 }),
          adminService.getCategories({ include_inactive: false }),
        ]);
        setCompanies(companiesRes.data?.data || []);
        setCategories(categoriesRes.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch admin job form options', error);
      }
    };

    fetchFormOptions();
  }, []);

  useEffect(() => {
    if (!job) {
      setFormData(DEFAULT_FORM);
      return;
    }

    setFormData({
      title: job.title || '',
      company_id: String(job.company_id || job.employer_id || ''),
      category_id: String(job.category_id || ''),
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      location: job.location || '',
      salary_min: job.salary_min ?? '',
      salary_max: job.salary_max ?? '',
      salary_negotiable: isTruthyFlag(job.salary_negotiable),
      vacancies: job.vacancies ?? 1,
      deadline: formatDateInput(job.deadline || job.expires_at),
      type: job.type || job.job_type || 'full-time',
    });
  }, [job]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const categoryOptions = useMemo(
    () =>
      categories.length
        ? categories.map((category) => ({
            value: String(category.id),
            label: category.name || category.category_name || `Danh mục #${category.id}`,
          }))
        : CATEGORY_OPTIONS,
    [categories]
  );

  const selectedCategoryLabel = useMemo(
    () => categoryOptions.find((item) => item.value === formData.category_id)?.label || 'Chưa chọn danh mục',
    [categoryOptions, formData.category_id]
  );

  const selectedCompanyName = useMemo(
    () =>
      companies.find((company) => String(company.id) === String(formData.company_id))?.company_name ||
      'Chưa chọn công ty',
    [companies, formData.company_id]
  );

  const selectedJobTypeLabel = useMemo(
    () => JOB_TYPE_OPTIONS.find((item) => item.value === formData.type)?.label || 'Chưa chọn hình thức',
    [formData.type]
  );

  const validateForm = () => {
    if (!normalizeText(formData.title)) {
      return 'Tiêu đề công việc không được để trống.';
    }
    if (!formData.company_id) {
      return 'Vui lòng chọn công ty.';
    }
    if (!Number.isFinite(Number.parseInt(formData.category_id, 10))) {
      return 'Vui lòng chọn danh mục tuyển dụng.';
    }
    if (!normalizeText(formData.location)) {
      return 'Địa điểm không được để trống.';
    }
    if (!normalizeText(formData.description)) {
      return 'Mô tả công việc không được để trống.';
    }
    if (!normalizeText(formData.requirements)) {
      return 'Yêu cầu ứng viên không được để trống.';
    }
    if (!normalizeText(formData.benefits)) {
      return 'Quyền lợi không được để trống.';
    }

    const salaryMin = Number(formData.salary_min || 0);
    const salaryMax = Number(formData.salary_max || 0);
    if (salaryMin > 0 && salaryMax > 0 && salaryMin > salaryMax) {
      return 'Mức lương tối thiểu không được lớn hơn mức lương tối đa.';
    }

    const vacancies = Number.parseInt(formData.vacancies, 10);
    if (!Number.isFinite(vacancies) || vacancies < 1 || vacancies > 9999) {
      return 'Số lượng cần tuyển phải từ 1 đến 9999.';
    }

    return null;
  };

  const buildPayload = () => {
    const categoryId = Number.parseInt(formData.category_id, 10);

    return {
      title: normalizeText(formData.title),
      company_id: Number(formData.company_id),
      employer_id: Number(formData.company_id),
      category_id: Number.isFinite(categoryId) ? categoryId : null,
      description: normalizeText(formData.description),
      requirements: normalizeText(formData.requirements),
      benefits: normalizeText(formData.benefits),
      location: normalizeText(formData.location),
      salary_min: formData.salary_min === '' ? null : Number(formData.salary_min),
      salary_max: formData.salary_max === '' ? null : Number(formData.salary_max),
      salary_negotiable: formData.salary_negotiable ? 1 : 0,
      vacancies: Number.parseInt(formData.vacancies, 10) || 1,
      deadline: formData.deadline || null,
      type: formData.type,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showNotification(validationError, 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await adminService.updateJob(job.id, payload);
        showNotification('Cập nhật tin tuyển dụng thành công.', 'success');
      } else {
        await adminService.createJob(payload);
        showNotification('Tạo tin tuyển dụng mới thành công.', 'success');
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save admin job', error);
      showNotification(
        error?.response?.data?.message || 'Lỗi khi lưu dữ liệu. Vui lòng thử lại.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const completionItems = useMemo(
    () => [
      {
        label: 'Tiêu đề công việc',
        ready: Boolean(normalizeText(formData.title)),
        pendingText: 'Cần đặt tên vị trí rõ ràng.',
        readyText: 'Tiêu đề đã sẵn sàng để hiển thị.',
      },
      {
        label: 'Công ty tuyển dụng',
        ready: Boolean(formData.company_id),
        pendingText: 'Chưa gán doanh nghiệp cho tin đăng.',
        readyText: 'Đã xác định doanh nghiệp sở hữu tin.',
      },
      {
        label: 'Mô tả & yêu cầu',
        ready: Boolean(normalizeText(formData.description) && normalizeText(formData.requirements)),
        pendingText: 'Nội dung tuyển dụng vẫn chưa đủ.',
        readyText: 'Phần nhiệm vụ và yêu cầu đã có nội dung.',
      },
      {
        label: 'Quyền lợi ứng viên',
        ready: Boolean(normalizeText(formData.benefits)),
        pendingText: 'Nên bổ sung chế độ để tăng hấp dẫn.',
        readyText: 'Đã có phần quyền lợi để truyền thông tốt hơn.',
      },
    ],
    [formData.benefits, formData.company_id, formData.description, formData.requirements, formData.title]
  );

  const filledFieldCount = useMemo(
    () =>
      [
        formData.title,
        formData.company_id,
        formData.category_id,
        formData.type,
        formData.location,
        formData.description,
        formData.requirements,
        formData.benefits,
        formData.deadline,
      ].filter((value) => String(value || '').trim()).length,
    [formData]
  );

  const completionPercent = Math.round((filledFieldCount / 9) * 100);
  const readyToPublish = completionItems.every((item) => item.ready);
  const salaryPreview = formatCurrencyPreview(
    formData.salary_min,
    formData.salary_max,
    formData.salary_negotiable
  );
  const deadlinePreview = formatDeadlinePreview(formData.deadline);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <SectionCard
          icon={BriefcaseBusiness}
          title="Thiết lập tin đăng"
          description="Nhập các thông tin nền tảng để tin tuyển dụng bám đúng doanh nghiệp, bối cảnh và mức độ hiển thị mong muốn."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FieldBlock
              icon={FileText}
              label="Tiêu đề công việc"
              hint="Tên vị trí sẽ là điểm chạm đầu tiên khi ứng viên nhìn thấy tin đăng."
              className="md:col-span-2"
            >
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Senior Frontend Engineer (React/TypeScript)"
                required
                className="h-12 rounded-lg border-slate-200 px-4 text-base font-semibold focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </FieldBlock>

            <FieldBlock
              icon={Building2}
              label="Công ty"
              hint="Admin có thể gán tin đăng cho bất kỳ doanh nghiệp nào trong hệ thống."
            >
              <Select
                onValueChange={(value) => setFormData((prev) => ({ ...prev, company_id: value }))}
                value={String(formData.company_id || '')}
              >
                <SelectTrigger className="h-12 rounded-lg border-slate-200 px-4 font-semibold">
                  <SelectValue placeholder="Chọn công ty" />
                </SelectTrigger>
                <SelectContent className="max-h-[320px] rounded-lg border-slate-200">
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={String(company.id)} className="cursor-pointer rounded-md py-2.5">
                      {company.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>

            <FieldBlock
              icon={LayoutGrid}
              label="Danh mục"
              hint="Dùng để nhóm tin và điều hướng hiển thị phù hợp trong hệ thống."
            >
              <Select
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category_id: value }))}
                value={String(formData.category_id || '')}
              >
                <SelectTrigger className="h-12 rounded-lg border-slate-200 px-4 font-semibold">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200">
                  {categoryOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="cursor-pointer rounded-md py-2.5">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>

            <FieldBlock
              icon={Clock3}
              label="Hình thức làm việc"
              hint="Cho ứng viên biết ngay mô hình làm việc của vị trí này."
            >
              <Select
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                value={formData.type}
              >
                <SelectTrigger className="h-12 rounded-lg border-slate-200 px-4 font-semibold">
                  <SelectValue placeholder="Chọn hình thức" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200">
                  {JOB_TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="cursor-pointer rounded-md py-2.5">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>

            <FieldBlock
              icon={MapPin}
              label="Địa điểm"
              hint="Có thể nhập địa điểm onsite, hybrid hoặc remote theo nhu cầu tuyển dụng."
            >
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ví dụ: Ho Chi Minh City, Remote"
                required
                className="h-12 rounded-lg border-slate-200 px-4 font-semibold focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </FieldBlock>

            <FieldBlock
              icon={DollarSign}
              label="Khung lương"
              hint="Khoảng lương rõ ràng giúp ứng viên tự lọc mức độ phù hợp nhanh hơn."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Input
                    type="number"
                    name="salary_min"
                    value={formData.salary_min}
                    onChange={handleChange}
                    placeholder="Tối thiểu"
                    className="h-12 rounded-lg border-slate-200 pl-4 pr-14 font-semibold tabular-nums focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VND
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    name="salary_max"
                    value={formData.salary_max}
                    onChange={handleChange}
                    placeholder="Tối đa"
                    className="h-12 rounded-lg border-slate-200 pl-4 pr-14 font-semibold tabular-nums focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VND
                  </span>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">Lương thỏa thuận</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, salary_negotiable: !prev.salary_negotiable }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 ${
                      formData.salary_negotiable ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={formData.salary_negotiable}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.salary_negotiable ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4">
                  <Users className="h-4 w-4 shrink-0 text-slate-500" />
                  <Input
                    type="number"
                    name="vacancies"
                    value={formData.vacancies}
                    onChange={handleChange}
                    min="1"
                    max="9999"
                    placeholder="Số lượng tuyển"
                    className="h-10 flex-1 border-0 bg-transparent p-0 text-sm font-semibold focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            </FieldBlock>

            <FieldBlock
              icon={Calendar}
              label="Hạn nhận hồ sơ"
              hint="Ngày hết hạn sẽ được dùng để kiểm soát vòng đời của tin tuyển dụng."
            >
              <Input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="h-12 rounded-lg border-slate-200 px-4 font-semibold focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </FieldBlock>
          </div>
        </SectionCard>

        <SectionCard
          icon={FileText}
          title="Nội dung tuyển dụng"
          description="Giữ cấu trúc mô tả, yêu cầu và quyền lợi rõ ràng để quá trình duyệt tin và hiển thị ra ngoài được nhất quán hơn."
        >
          <div className="space-y-5">
            <FieldBlock
              icon={FileText}
              label="Mô tả công việc"
              hint="Tập trung vào phạm vi công việc, nhiệm vụ chính và kết quả kỳ vọng từ vị trí này."
            >
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả nhiệm vụ, trách nhiệm, phạm vi công việc và mục tiêu của vị trí..."
                required
                className="min-h-[220px] resize-y rounded-lg border-slate-200 p-4 font-medium leading-7 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-800">
                AI có thể hỗ trợ tạo hoặc tinh chỉnh phần mô tả, nhưng admin vẫn nên rà lại ngôn ngữ
                trước khi lưu để đảm bảo đúng chính sách nội dung.
              </div>
            </FieldBlock>

            <div className="grid gap-5 lg:grid-cols-2">
              <FieldBlock
                icon={ListChecks}
                label="Yêu cầu ứng viên"
                hint="Liệt kê kỹ năng, kinh nghiệm, học vấn hoặc điều kiện cần có."
              >
                <Textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="Liệt kê kỹ năng, kinh nghiệm, học vấn và các điều kiện cần có..."
                  required
                  className="min-h-[220px] resize-y rounded-lg border-slate-200 p-4 font-medium leading-7 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </FieldBlock>

              <FieldBlock
                icon={Gift}
                label="Quyền lợi"
                hint="Nêu các lợi ích thực tế để tăng sức hút cho tin đăng."
              >
                <Textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="Mô tả lương thưởng, phụ cấp, chế độ, môi trường làm việc và cơ hội phát triển..."
                  required
                  className="min-h-[220px] resize-y rounded-lg border-slate-200 p-4 font-medium leading-7 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </FieldBlock>
            </div>
          </div>
        </SectionCard>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="secondary"
              onClick={onCancel}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-8 font-bold text-slate-600 hover:bg-slate-50 sm:w-auto"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              className="h-12 w-full rounded-lg bg-emerald-600 px-10 font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 sm:w-auto"
            >
              {isEdit ? 'Lưu thay đổi' : 'Tạo tin mới'}
            </Button>
          </div>
        </section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <SectionCard
          icon={ShieldCheck}
          title="Tóm tắt tin đăng"
          description="Theo dõi nhanh mức độ hoàn thiện và các thông tin cốt lõi trước khi lưu."
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Tiến độ form
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{filledFieldCount}/9</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {readyToPublish
                      ? 'Các thành phần quan trọng đã sẵn sàng để lưu.'
                      : 'Vẫn còn một vài trường nên hoàn thiện thêm trước khi xuất bản.'}
                  </p>
                </div>
                <Badge
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    readyToPublish
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {readyToPublish ? 'Sẵn sàng lưu' : 'Cần bổ sung'}
                </Badge>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <SummaryStat label="Công ty" value={selectedCompanyName} helper="Doanh nghiệp sở hữu tin đăng" />
              <SummaryStat label="Danh mục" value={selectedCategoryLabel} helper="Nhóm hiển thị của vị trí tuyển dụng" />
              <SummaryStat label="Hình thức" value={selectedJobTypeLabel} helper="Mô hình làm việc sẽ được công khai" />
              <SummaryStat label="Mức lương" value={salaryPreview} helper="Khoảng lương đang cấu hình" />
              <SummaryStat
                label="Số lượng"
                value={`${Number.parseInt(formData.vacancies, 10) || 1} người`}
                helper="Nhu cầu cần tuyển"
              />
              <SummaryStat label="Hạn hồ sơ" value={deadlinePreview} helper="Mốc thời gian để ứng viên theo dõi" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 ring-1 ring-inset ring-slate-100">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                Checklist nghiệp vụ
              </p>
              <div className="mt-4 space-y-3">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        item.ready ? 'text-emerald-600' : 'text-slate-300'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.ready ? item.readyText : item.pendingText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Sparkles}
          title="Nguyên tắc xuất bản"
          description="Giữ trải nghiệm quản trị gọn, nhưng vẫn đảm bảo chất lượng dữ liệu tuyển dụng."
        >
          <div className="space-y-3">
            {publishingGuidelines.map((item) => (
              <div key={item.title} className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-bold text-emerald-800">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </aside>
    </form>
  );
};

AdminJobForm.propTypes = {
  job: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AdminJobForm;
