import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'HireAI hoạt động như thế nào?',
    a: 'HireAI sử dụng trí tuệ nhân tạo để phân tích hồ sơ, kỹ năng và kinh nghiệm của bạn, sau đó gợi ý những việc làm phù hợp nhất. Hệ thống cũng hỗ trợ phân tích CV, luyện phỏng vấn và định hướng lộ trình sự nghiệp.',
  },
  {
    q: 'Sử dụng HireAI có mất phí không?',
    a: 'Ứng viên sử dụng hoàn toàn miễn phí. Nhà tuyển dụng có gói cơ bản miễn phí và các gói nâng cao với tính năng bổ sung cho doanh nghiệp lớn.',
  },
  {
    q: 'AI matching hoạt động chính xác đến mức nào?',
    a: 'Hệ thống AI đạt độ chính xác 94.7% trong việc kết nối ứng viên với công việc phù hợp, dựa trên phân tích đa chiều về kỹ năng, kinh nghiệm, mức lương kỳ vọng và văn hoá công ty.',
  },
  {
    q: 'Dữ liệu cá nhân của tôi có được bảo mật không?',
    a: 'Tuyệt đối. HireAI tuân thủ các tiêu chuẩn bảo mật quốc tế. Hồ sơ của bạn được mã hoá và chỉ chia sẻ với nhà tuyển dụng khi bạn chủ động ứng tuyển.',
  },
  {
    q: 'Tôi có thể sử dụng tính năng AI CV Scanner bao nhiêu lần?',
    a: 'Không giới hạn. Bạn có thể tải lên và phân tích CV bao nhiêu lần tuỳ thích để liên tục cải thiện hồ sơ của mình.',
  },
  {
    q: 'HireAI phù hợp với ngành nghề nào?',
    a: 'HireAI hỗ trợ tất cả ngành nghề, từ CNTT, Marketing, Tài chính đến Thiết kế, Nhân sự và nhiều lĩnh vực khác. Hiện có hơn 8,000 việc làm đang mở trên nền tảng.',
  },
];

const FAQItem = ({ faq, isOpen, onToggle }) => (
  <div className="landing-card rounded-2xl bg-background overflow-hidden">
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? `Đóng: ${faq.q}` : `Mở: ${faq.q}`}
      className="w-full flex items-center justify-between p-5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 rounded-2xl"
    >
      <span className="font-semibold text-foreground pr-4 text-[15px] group-hover:text-primary transition-colors">
        {faq.q}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="shrink-0 size-8 rounded-lg flex items-center justify-center bg-muted/50 group-hover:bg-primary/10 transition-colors"
      >
        <ChevronDown
          size={16}
          className="text-muted-foreground group-hover:text-primary"
          aria-hidden="true"
        />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-5 pb-5 pt-4 text-muted-foreground leading-relaxed text-[14px] border-t border-border/50">
            {faq.a}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-16 bg-background border-t border-border/30">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <p className="section-badge mb-4">Hỏi đáp</p>
          <h2 className="section-heading text-balance">
            Câu hỏi <span className="section-heading-muted">thường gặp</span>
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              viewport={{ once: true }}
            >
              <FAQItem
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
