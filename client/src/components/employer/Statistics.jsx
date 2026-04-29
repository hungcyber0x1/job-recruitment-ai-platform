import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import ChartSurface, {
  CHART_LEGEND_STYLE,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/components/charts/ChartSurface';

const data = [
  { name: 'T2', views: 400, applications: 12 },
  { name: 'T3', views: 300, applications: 8 },
  { name: 'T4', views: 550, applications: 25 },
  { name: 'T5', views: 480, applications: 18 },
  { name: 'T6', views: 600, applications: 30 },
  { name: 'T7', views: 450, applications: 15 },
  { name: 'CN', views: 350, applications: 10 },
];

const Statistics = () => {
  return (
    <div className="relative h-full min-h-[280px] w-full min-w-0 group/chart">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-secondary/10 blur-3xl opacity-0 transition-opacity duration-1000 group-hover/chart:opacity-100"></div>

      <ChartSurface className="h-full min-h-[200px]" minChartHeight={200}>
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={1} />
              <stop offset="95%" stopColor="#0F766E" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={CHART_TICK_STYLE}
            dy={15}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={CHART_TICK_STYLE}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={CHART_TICK_STYLE}
          />
          <Tooltip
            cursor={{ stroke: '#CBD5E1', strokeWidth: 2, strokeDasharray: '5 5' }}
            contentStyle={{
              ...CHART_TOOLTIP_STYLE,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              borderRadius: '20px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 20px 25px -5px rgb(15 23 42 / 0.08)',
              padding: '16px',
            }}
            itemStyle={{
              fontSize: 16,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0,
            }}
            labelStyle={{
              fontSize: 16,
              fontWeight: 700,
              color: '#475569',
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              ...CHART_LEGEND_STYLE,
              paddingBottom: '40px',
            }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="views"
            name="VIEWS"
            stroke="#1D4ED8"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorViews)"
            animationDuration={2000}
          />
          <Bar
            yAxisId="right"
            dataKey="applications"
            name="APPS"
            barSize={12}
            fill="url(#colorApps)"
            radius={[6, 6, 0, 0]}
            animationDuration={1500}
          />
        </ComposedChart>
      </ChartSurface>
    </div>
  );
};

export default Statistics;
