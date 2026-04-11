import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  MapPin,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Target,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AIPublicToolShell from '@/components/public/AIPublicToolShell';
import publicToolsService from '@/services/publicToolsService';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(Math.round(amount))
    .replace('₫', 'VNĐ');

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

const EXPERIENCE_OPTIONS = [
  { value: 'fresher', label: 'Dưới 1 năm (Fresher)' },
  { value: 'junior', label: '1–3 năm (Junior)' },
  { value: 'mid', label: '3–5 năm (Mid-level)' },
  { value: 'senior', label: '5–8 năm (Senior)' },
  { value: 'expert', label: 'Trên 8 năm (Expert / Manager)' },
];

const LOCATION_OPTIONS = [
  { value: 'hcm', label: 'Hồ Chí Minh' },
  { value: 'hn', label: 'Hà Nội' },
  { value: 'dn', label: 'Đà Nẵng' },
  { value: 'other', label: 'Khác (Toàn quốc)' },
  { value: 'remote', label: 'Remote (Quốc tế)' },
];

const INDUSTRY_OPTIONS = [
  { value: 'it', label: 'IT - Phần mềm' },
  { value: 'marketing', label: 'Marketing / Truyền thông' },
  { value: 'accounting', label: 'Kế toán / Kiểm toán / Thuế' },
  { value: 'sales', label: 'Bán hàng / Kinh doanh' },
  { value: 'design', label: 'Thiết kế / Mỹ thuật' },
];

const BASE_BY_EXP = {
  fresher: 10_000_000,
  junior: 16_000_000,
  mid: 24_000_000,
  senior: 34_000_000,
  expert: 46_000_000,
};

const LOC_MULT = { hcm: 1.1, hn: 1.06, dn: 0.93, other: 1, remote: 1.14 };
const IND_MULT = { it: 1.22, marketing: 0.95, accounting: 0.9, sales: 1.05, design: 0.98 };

function computeSalaryEstimate({ title, experience, location, industry }) {
  const t = (title || '').trim();
  const base = BASE_BY_EXP[experience] ?? BASE_BY_EXP.mid;
  const lm = LOC_MULT[location] ?? 1;
  const im = IND_MULT[industry] ?? 1;
  const jitter = 1 + (hashStr(t || 'x') % 19) / 100;
  const titleBoost = t.length > 28 ? 1.04 : t.length > 12 ? 1 : 0.97;
  const mid = base * lm * im * jitter * titleBoost;
  const growthPct = 7 + (hashStr(`${t}|${experience}|${location}`) % 12);
  return {
    mid,
    low: mid * 0.72,
    high: mid * 1.38,
    growthPct,
  };
}

function labelOf(options, value) {
  return options.find((o) => o.value === value)?.label ?? value;
}

const SalaryPredictorPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    industry: 'it',
    location: 'hcm',
    experience: 'junior',
  });
  const [predicted, setPredicted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [estimateSource, setEstimateSource] = useState(null);

  const rangeBarPct = useMemo(() => {
    if (!estimate) return 50;
    const { low, mid, high } = estimate;
    if (high <= low) return 50;
    const p = ((mid - low) / (high - low)) * 100;
    return Math.min(92, Math.max(8, p));
  }, [estimate]);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setLoading(true);
    setPredicted(false);
    setEstimate(null);
    setEstimateSource(null);
    try {
      const { data } = await publicToolsService.salaryEstimate({
        title: formData.title.trim(),
        industry: formData.industry,
        location: formData.location,
        experience: formData.experience,
      });
      if (data?.success && data.data) {
        setEstimate(data.data);
        setEstimateSource('api');
      } else {
        throw new Error('Invalid response');
      }
    } catch {
      setEstimate(computeSalaryEstimate(formData));
      setEstimateSource('offline');
    } finally {
      setLoading(false);
      setPredicted(true);
    }
  };

  const resetPrediction = () => {
    setPredicted(false);
    setEstimate(null);
    setEstimateSource(null);
  };

  const titleNode = (
    <>
      Dự báo lương <span className="text-primary">thông minh</span>
    </>
  );

  return (
    <AIPublicToolShell
      kicker="HireAI · Ứng viên"
      icon={DollarSign}
      title={titleNode}
      description="Ước lượng khoảng lương tham khảo theo chức danh, kinh nghiệm, ngành và khu vực — hỗ trợ ứng viên định hướng kỳ vọng và đàm phán offer. Số liệu mô hình nội bộ HireAI, không thay thế khảo sát lương tại từng công ty."
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
        <div
          className={`w-full ${predicted ? 'lg:w-[400px] lg:shrink-0' : 'lg:mx-auto lg:max-w-xl'}`}
        >
          <div className="ai-tool-panel p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
              <Target className="text-primary" size={22} strokeWidth={1.8} />
              Thông tin tra cứu
            </h2>

            <form onSubmit={handlePredict} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="salary-title" className="text-base font-bold text-foreground">
                  Chức danh / Vị trí
                </Label>
                <div className="relative">
                  <Briefcase
                    className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="salary-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Senior Frontend Developer, Marketing Manager…"
                    className="h-12 rounded-xl border-border/60 bg-muted/50 pl-11 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salary-exp" className="text-base font-bold text-foreground">
                    Số năm kinh nghiệm
                  </Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(val) => setFormData({ ...formData, experience: val })}
                  >
                    <SelectTrigger
                      id="salary-exp"
                      className="h-12 w-full rounded-xl border-border/60 bg-muted/50 px-4 text-base font-medium text-foreground focus:ring-2 focus:ring-primary/20"
                    >
                      <SelectValue placeholder="Chọn kinh nghiệm" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-xl">
                      {EXPERIENCE_OPTIONS.map((o) => (
                        <SelectItem
                          key={o.value}
                          value={o.value}
                          className="text-base font-medium py-3"
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary-loc" className="text-base font-bold text-foreground">
                    Địa điểm làm việc
                  </Label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Select
                      value={formData.location}
                      onValueChange={(val) => setFormData({ ...formData, location: val })}
                    >
                      <SelectTrigger
                        id="salary-loc"
                        className="h-12 w-full rounded-xl border-border/60 bg-muted/50 pl-11 pr-4 text-base font-medium text-foreground focus:ring-2 focus:ring-primary/20"
                      >
                        <SelectValue placeholder="Chọn địa điểm" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-xl">
                        {LOCATION_OPTIONS.map((o) => (
                          <SelectItem
                            key={o.value}
                            value={o.value}
                            className="text-base font-medium py-3"
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary-ind" className="text-base font-bold text-foreground">
                  Ngành nghề
                </Label>
                <div className="relative">
                  <Building
                    className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Select
                    value={formData.industry}
                    onValueChange={(val) => setFormData({ ...formData, industry: val })}
                  >
                    <SelectTrigger
                      id="salary-ind"
                      className="h-12 w-full rounded-xl border-border/60 bg-muted/50 pl-11 pr-4 text-base font-medium text-foreground focus:ring-2 focus:ring-primary/20"
                    >
                      <SelectValue placeholder="Chọn ngành nghề" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-xl">
                      {INDUSTRY_OPTIONS.map((o) => (
                        <SelectItem
                          key={o.value}
                          value={o.value}
                          className="text-base font-medium py-3"
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full flex-1 gap-2 text-base font-bold sm:w-auto"
                  disabled={loading}
                >
                  {loading ? 'Đang phân tích…' : 'Xem mức lương dự báo'}
                  {!loading && <ChevronRight className="size-[18px]" aria-hidden />}
                </Button>
                {predicted && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full text-base font-bold sm:w-auto"
                    onClick={resetPrediction}
                  >
                    Thu gọn kết quả
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {predicted && estimate && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="ai-tool-panel flex h-full flex-col p-8">
              <div className="mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge variant="secondary" className="mb-3 text-sm font-bold">
                    Báo cáo tham khảo 2026
                  </Badge>
                  <h2 className="text-2xl font-black text-foreground md:text-3xl">
                    {formData.title.trim()}
                  </h2>
                  <p className="mt-1 text-base font-medium text-muted-foreground">
                    {labelOf(EXPERIENCE_OPTIONS, formData.experience)} ·{' '}
                    {labelOf(LOCATION_OPTIONS, formData.location)} ·{' '}
                    {labelOf(INDUSTRY_OPTIONS, formData.industry)}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-base font-bold" asChild>
                  <Link to="/jobs">Việc làm gợi ý</Link>
                </Button>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-border/40 bg-muted/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-muted-foreground">
                      Lương trung bình (gross ước lượng)
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <TrendingUp className="size-4" aria-hidden />
                    </div>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-foreground md:text-4xl">
                    {formatCurrency(estimate.mid)}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-base font-bold text-primary">
                    <TrendingUp className="size-3.5" aria-hidden />+{estimate.growthPct.toFixed(1)}%
                    so với mặt bằng năm trước (mô phỏng)
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-muted/50 p-6">
                  <p className="mb-4 text-base font-bold text-muted-foreground">
                    Khoảng lương phổ biến
                  </p>
                  <p className="text-xl font-black text-primary md:text-2xl">
                    {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
                  </p>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${rangeBarPct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm font-medium text-muted-foreground">
                    <span>Thấp hơn</span>
                    <span>Trung vị ước lượng</span>
                    <span>Cao hơn</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/10 bg-primary/5 p-6">
                <h3 className="mb-2 text-lg font-bold text-primary md:text-xl">Đánh giá nhanh</h3>
                <p className="text-base font-medium leading-relaxed text-foreground/90">
                  Với <strong className="text-primary">{formData.title.trim()}</strong> tại{' '}
                  <strong>{labelOf(LOCATION_OPTIONS, formData.location)}</strong>, nhóm{' '}
                  <strong>{labelOf(INDUSTRY_OPTIONS, formData.industry)}</strong> thường có biên độ
                  offer rộng hơn khi kinh nghiệm nằm ở mức{' '}
                  <strong>{labelOf(EXPERIENCE_OPTIONS, formData.experience)}</strong>. Hãy dùng
                  khoảng lương như một cọc mốc đàm phán, kèm phúc lợi và lộ trình thăng tiến.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-primary/20 pt-4">
                  {estimateSource === 'offline' && (
                    <Badge
                      variant="outline"
                      className="text-sm font-bold text-amber-700 dark:text-amber-400"
                    >
                      Đang dùng tính toán ngoại tuyến (API không khả dụng)
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-sm font-bold text-primary">
                    Không thay thế khảo sát thị trường
                  </Badge>
                </div>
              </div>

              <p className="mt-6 text-center text-base font-medium text-muted-foreground">
                * Ước lượng tham khảo; thực tế phụ thuộc công ty, quy mô và kỹ năng cụ thể.
              </p>
            </div>
          </div>
        )}
      </div>
    </AIPublicToolShell>
  );
};

export default SalaryPredictorPage;
