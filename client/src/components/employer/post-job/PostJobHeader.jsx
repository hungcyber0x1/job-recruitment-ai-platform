import React from 'react';
import { AlertTriangle, CheckCircle2, Eye, Save, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const RATING_META = {
  Premium: {
    label: 'Rất tốt',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    focusTitle: 'JD đã sẵn sàng cho bước rà soát cuối',
    focusHelper:
      'Các mục cốt lõi đã rõ ràng. Bạn có thể xem trước lần cuối trước khi chuyển sang bước công khai.',
    focusTone: 'emerald',
    icon: CheckCircle2,
  },
  Good: {
    label: 'Ổn định',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    focusTitle: 'Bố cục JD đã ổn, có thể tinh chỉnh thêm',
    focusHelper: 'Nội dung đang đi đúng hướng. Tối ưu thêm vài điểm để JD rõ ràng và thuyết phục hơn.',
    focusTone: 'sky',
    icon: Sparkles,
  },
  'Needs Improvement': {
    label: 'Cần bổ sung',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    focusTitle: 'Nên hoàn thiện thêm trước khi công khai',
    focusHelper:
      'Bổ sung các mục còn thiếu để JD liền mạch hơn, rõ tiêu chí hơn và dễ lọc đúng hồ sơ hơn.',
    focusTone: 'amber',
    icon: AlertTriangle,
  },
};

const TONE_STYLES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    card: 'border-emerald-100/80 bg-white/92',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    card: 'border-sky-100/80 bg-white/92',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    card: 'border-amber-100/80 bg-white/92',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    card: 'border-slate-200/90 bg-white/92',
  },
};

function HeaderStat({ icon: Icon, label, value, helper, tone = 'slate' }) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.slate;

  return (
    <div className={`rounded-[22px] border p-4 shadow-sm shadow-slate-950/[0.04] backdrop-blur sm:p-5 ${toneStyle.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-3 text-[2.15rem] font-bold leading-none tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset ${toneStyle.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

const PostJobHeader = ({
  id,
  onSaveDraft,
  onPreview,
  loading,
  advisor,
  completionPercent = 0,
  filledFieldCount = 0,
  totalImportantFields = 7,
}) => {
  const rating = advisor?.rating || 'Needs Improvement';
  const pendingSuggestions = Array.isArray(advisor?.scores)
    ? advisor.scores.filter((item) => !item.done).length
    : 0;
  const readyCount = Array.isArray(advisor?.scores)
    ? advisor.scores.filter((item) => item.done).length
    : 0;
  const ratingMeta = RATING_META[rating] || RATING_META['Needs Improvement'];
  const FocusIcon = ratingMeta.icon;
  const focusTone = TONE_STYLES[ratingMeta.focusTone] || TONE_STYLES.slate;

  const focusBadges = [
    pendingSuggestions > 0 ? `${pendingSuggestions} mục cần bổ sung` : 'Không còn mục cần bổ sung',
    readyCount > 0 ? `${readyCount} mục đã ổn` : 'Chưa có mục đạt chuẩn',
  ];

  return (
    <motion.section initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm backdrop-blur">
          Đồng bộ public view
        </Badge>
      </div>

      <div className="max-w-4xl">
        <p className="text-sm font-semibold text-emerald-600">Không gian soạn tin tuyển dụng</p>
        <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
          {id ? 'Cập nhật tin tuyển dụng' : 'Tạo tin tuyển dụng mới'}
        </h1>
        <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
          Hoàn thiện tiêu đề, nội dung JD, mức lương và tiêu chí lọc hồ sơ trong cùng một bố cục vận hành rõ ràng,
          đồng nhất với không gian tuyển dụng của doanh nghiệp.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <HeaderStat
          icon={Wand2}
          label="Cần bổ sung"
          value={pendingSuggestions}
          helper={pendingSuggestions > 0 ? 'Các mục nên chỉnh thêm trước khi đăng' : 'Không còn mục cần tối ưu'}
          tone="amber"
        />
        <HeaderStat
          icon={CheckCircle2}
          label="Đã ổn"
          value={readyCount}
          helper={readyCount > 0 ? 'Đã đạt yêu cầu cơ bản' : 'Chưa có mục đạt chuẩn'}
          tone="sky"
        />
        <HeaderStat
          icon={Sparkles}
          label="Mức hoàn thiện"
          value={`${completionPercent}%`}
          helper={`${filledFieldCount}/${totalImportantFields} trường trọng yếu đã có dữ liệu`}
          tone="emerald"
        />
      </div>

      <div className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${focusTone.icon}`}>
              <FocusIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{ratingMeta.focusTitle}</p>
                <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${ratingMeta.badgeClass}`}>{ratingMeta.label}</Badge>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">{ratingMeta.focusHelper}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {focusBadges.map((item) => (
              <Badge
                key={item}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={onSaveDraft}
          disabled={loading}
          variant="primary"
          size="lg"
          className="rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          <Save className="h-4 w-4" />
          Lưu bản nháp
        </Button>
        <Button
          type="button"
          onClick={onPreview}
          variant="outline"
          size="lg"
          className="rounded-lg border-white/80 bg-white/80 px-5 font-bold text-slate-700 shadow-sm backdrop-blur hover:bg-white"
        >
          <Eye className="h-4 w-4" />
          Xem trước
        </Button>
      </div>
    </motion.section>
  );
};

export default PostJobHeader;
