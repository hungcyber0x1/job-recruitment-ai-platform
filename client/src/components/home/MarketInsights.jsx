import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { month: 'Jan', hiring: 2000 },
  { month: 'Feb', hiring: 2500 },
  { month: 'Mar', hiring: 3800 },
  { month: 'Apr', hiring: 4500 },
  { month: 'May', hiring: 6000 },
  { month: 'Jun', hiring: 7200 },
  { month: 'Jul', hiring: 8500 },
  { month: 'Aug', hiring: 10800 },
  { month: 'Sep', hiring: 13500 },
  { month: 'Oct', hiring: 16400 },
  { month: 'Nov', hiring: 19800 },
  { month: 'Dec', hiring: 24500 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl py-2 px-3 border border-slate-100">
        <p className="text-sm font-semibold text-slate-500 mb-0.5">{label}</p>
        <p className="text-base font-bold text-slate-900">{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const formatYAxis = (tickItem) => {
  if (tickItem === 0) return '0';
  return tickItem / 1000 + 'k';
};

const CHART_MIN_W = 200;

/** Đo kích thước thật — tránh ResponsiveContainer (ResizeObserver → 0px trong motion/flex → width -1). */
function HiringAreaChart({ data: chartData }) {
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 260 });
  const gradId = `colorHiring-${useId().replace(/:/g, '')}`;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.floor(r.width);
      const h = Math.floor(r.height);
      if (w >= CHART_MIN_W && h > 0) {
        setDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    };

    measure();
    requestAnimationFrame(measure);
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="h-[260px] sm:h-[280px] w-full min-w-0 relative z-0 mt-2 px-2 pb-2"
    >
      {dims.width >= CHART_MIN_W && dims.height > 0 ? (
        <AreaChart
          width={dims.width}
          height={dims.height}
          data={chartData}
          margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
            dy={5}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
            tickFormatter={formatYAxis}
            tickCount={5}
          />

          <Tooltip content={<CustomTooltip />} cursor={false} />

          <Area
            type="monotone"
            dataKey="hiring"
            stroke="#10b981"
            strokeWidth={3}
            fill={`url(#${gradId})`}
            activeDot={{ r: 5, fill: '#fff', stroke: '#10b981', strokeWidth: 3 }}
            animationDuration={1500}
          />
        </AreaChart>
      ) : null}
    </div>
  );
}

const MarketInsights = () => {
  return (
    <section className="relative py-20 md:py-32 bg-stone-50/50 overflow-hidden font-sans">
      {/* Soft decorative background glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-300/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-300/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT: Text & Context */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-100/50 w-max mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-emerald-700 tracking-wide">Live Data</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black leading-[1.12] tracking-tight">
              <span className="text-slate-800 drop-shadow-sm">Phân tích</span>
              <br />
              <span className="text-[#3b3b98] drop-shadow-sm">xu hướng thị</span>
              <br />
              <span className="text-emerald-600 drop-shadow-sm">trường</span>
            </h2>
            <p className="mt-6 text-base font-medium leading-relaxed text-slate-500 max-w-sm">
              Cập nhật thời gian thực về mức độ tăng trưởng tuyển dụng và biến động nhu cầu nhân
              lực. AI của chúng tôi theo dõi hàng triệu điểm dữ liệu để kết nối bạn vào đúng thời
              điểm hoàn hảo nhất.
            </p>
          </motion.div>

          {/* CENTER: Premium Chart Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-6 relative w-full"
          >
            {/* The Large Chart Card */}
            <div className="relative rounded-[2rem] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col border border-slate-100/60 pb-6 min-h-0 min-w-0">
              {/* Card Header & Badge */}
              <div className="flex shrink-0 justify-between items-start pt-8 px-8 mb-2 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                    Tăng trưởng tuyển dụng
                  </h3>
                  <p className="text-sm font-medium text-slate-400 mt-1.5">
                    Việc làm mới mở theo tháng (2026)
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-100/50">
                  <TrendingUp size={14} className="stroke-[3]" />
                  <span className="text-sm">+23%</span>
                </div>
              </div>

              <HiringAreaChart data={data} />
            </div>

            {/* Floating Action Button exactly matching screenshot */}
            <div className="absolute -bottom-5 -right-5 w-16 h-16 rounded-[1.25rem] bg-[#5352ed] shadow-[0_10px_30px_-5px_rgba(83,82,237,0.5)] flex items-center justify-center cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-[0_15px_40px_-5px_rgba(83,82,237,0.6)] transition-all duration-300 z-20">
              <ArrowUpRight size={26} className="text-white" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* RIGHT: Stacked KPIs */}
          <div className="lg:col-span-3 flex flex-col gap-5 sm:gap-6 mt-6 lg:mt-0 xl:pl-4">
            {/* KPI 1 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-[1.75rem] p-5 sm:p-6 border border-slate-100/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.03)] flex gap-5 items-center hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="size-12 rounded-[14px] bg-emerald-50/80 text-emerald-500 flex items-center justify-center shrink-0">
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums leading-none mb-1.5">
                  +17.5%
                </h4>
                <p className="text-sm font-medium text-slate-500 leading-snug">
                  Tốc độ tăng trưởng mở mới
                </p>
              </div>
            </motion.div>

            {/* KPI 2 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-[1.75rem] p-5 sm:p-6 border border-slate-100/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.03)] flex gap-5 items-center hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="size-12 rounded-[14px] bg-[#eef2ff] text-[#6366f1] flex items-center justify-center shrink-0">
                <Users size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums leading-none mb-1.5">
                  48 Giờ
                </h4>
                <p className="text-sm font-medium text-slate-500 leading-snug">
                  Thời gian trung bình có offer
                </p>
              </div>
            </motion.div>

            {/* KPI 3 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-[1.75rem] p-5 sm:p-6 border border-slate-100/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.03)] flex gap-5 items-center hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="size-12 rounded-[14px] bg-[#f0f9ff] text-[#0ea5e9] flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight tabular-nums leading-none mb-1.5">
                  96.3%
                </h4>
                <p className="text-sm font-medium text-slate-500 leading-snug">
                  Mức độ tương hợp AI Match
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketInsights;
