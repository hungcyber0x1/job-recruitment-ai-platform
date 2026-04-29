import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';

const AIAssistantSidebar = ({ advisor, onOptimizeTitle, isOptimizing }) => {
  const { scores = [] } = advisor || {};

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 }}
      className="space-y-4"
    >
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">Gợi ý tối ưu JD</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">Các điểm nên tinh chỉnh để JD rõ và hấp dẫn hơn.</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {scores.length > 0 ? (
                scores.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          item.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${item.done ? 'text-slate-900' : 'text-slate-700'}`}>
                          {item.label}: {item.status}
                        </p>
                        {!item.done && item.tip ? <p className="mt-1 text-xs leading-5 text-slate-500">{item.tip}</p> : null}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <p className="text-sm leading-6 text-slate-500">
                    Hãy nhập tiêu đề và phần mô tả để hệ thống bắt đầu gợi ý cách tối ưu tin tuyển dụng.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            type="button"
            onClick={onOptimizeTitle}
            disabled={isOptimizing}
            variant="outline"
            className="mt-5 h-11 w-full rounded-xl border-emerald-200 bg-emerald-50 font-bold text-emerald-700 hover:bg-emerald-100"
          >
            <SlidersHorizontal className={`mr-2 h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Đang phân tích...' : 'Tối ưu tiêu đề'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </motion.div>
  );
};

export default AIAssistantSidebar;
