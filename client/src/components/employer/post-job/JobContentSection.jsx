import React from 'react';
import { Briefcase, Gift, ListChecks, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { RichTextEditor } from '../../common';

function EditorBlock({ icon: Icon, title, hint, required, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 ring-1 ring-inset ring-slate-200 shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{hint}</p>
          </div>
        </div>
        {required ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Bắt buộc
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const JobContentSection = ({ formData, onRichTextChange, onGenerateContent, generating }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5 sm:px-7">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              Nội dung JD
            </p>
            <h2 className="mt-1 text-base font-bold text-slate-950">Nội dung tin tuyển dụng</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Xây dựng mô tả rõ ràng, có cấu trúc và đủ sức thuyết phục để thu hút đúng nhóm ứng
              viên mục tiêu.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2">
          <Button
            type="button"
            onClick={onGenerateContent}
            disabled={generating || !formData.title}
            className="h-11 rounded-xl bg-slate-950 px-5 font-bold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            <Wand2 className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Đang tạo...' : 'Tạo nội dung'}
          </Button>
          <p className="text-xs font-medium text-slate-400">
            Tạo mô tả công việc dựa trên tiêu đề hiện tại.
          </p>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6 sm:px-7">
        <EditorBlock
          icon={Sparkles}
          title="Chi tiết công việc"
          hint="Mô tả phạm vi công việc, trách nhiệm chính, mục tiêu và cách đội ngũ đang vận hành."
          required
        >
          <RichTextEditor
            value={formData.description}
            onChange={(value) => onRichTextChange('description', value)}
            placeholder="Mô tả công việc, nhiệm vụ hằng ngày, quy mô team, sản phẩm hoặc dự án mà ứng viên sẽ tham gia..."
            minHeight="240px"
          />
        </EditorBlock>

        <EditorBlock
          icon={ListChecks}
          title="Yêu cầu ứng viên"
          hint="Nêu rõ kỹ năng, kinh nghiệm, công cụ, bằng cấp hoặc tiêu chí thực sự cần thiết cho vai trò."
        >
          <RichTextEditor
            value={formData.requirements}
            onChange={(value) => onRichTextChange('requirements', value)}
            placeholder="Kỹ năng chuyên môn, mức kinh nghiệm, sản phẩm đã từng làm, công cụ nên biết, yêu cầu giao tiếp..."
            minHeight="200px"
          />
        </EditorBlock>

        <EditorBlock
          icon={Gift}
          title="Quyền lợi và chế độ"
          hint="Nêu các chính sách nổi bật, môi trường làm việc, phúc lợi và lý do để ứng viên muốn gia nhập."
        >
          <RichTextEditor
            value={formData.benefits}
            onChange={(value) => onRichTextChange('benefits', value)}
            placeholder="Lương thưởng, bảo hiểm, thiết bị làm việc, review lương, hybrid/remote, hoạt động nội bộ..."
            minHeight="160px"
          />
        </EditorBlock>
      </div>
    </motion.section>
  );
};

export default JobContentSection;
