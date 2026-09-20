import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useHabitsStore } from '@/store/useHabitsStore';
import { toLocalDateString } from '@/lib/time';
import { Card } from '@/components/ui/Card';

// Custom label rendered directly on the chart line points
function CustomizedLabel(props: any) {
  const { x, y, value } = props;
  if (value === undefined || value === null || value === 0) return null;
  return (
    <text 
      x={x} 
      y={y - 10} 
      fill="#4ade80" 
      fontSize={9} 
      fontWeight="850" 
      textAnchor="middle"
      className="drop-shadow-[0_0_6px_rgba(74,222,128,0.5)] select-none pointer-events-none"
    >
      {value}%
    </text>
  );
}

export function TrendlineGraph() {
  const habits = useHabitsStore((s) => s.habits);

  const daysInMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        day: i + 1,
        dateStr: toLocalDateString(date),
        label: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      };
    });
  }, []);

  const chartData = useMemo(() => {
    if (habits.length === 0) {
      return daysInMonth.map((d) => ({
        day: d.day,
        label: d.label,
        consistency: 0,
      }));
    }

    return daysInMonth.map((d) => {
      const completed = habits.filter((h) => h.checkIns.includes(d.dateStr)).length;
      const consistency = Math.round((completed / habits.length) * 100);
      return {
        day: d.day,
        label: d.label,
        consistency,
      };
    });
  }, [habits, daysInMonth]);

  const averageConsistency = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, curr) => acc + curr.consistency, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  return (
    <Card className="w-full relative overflow-hidden flex flex-col gap-4 p-6 bg-slate-950/40 border-slate-900/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Background neon green glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Local CSS injection to apply the SVG wave filter to Recharts area and curve paths */}
      <style>{`
        .antigravity-wavy-chart .recharts-area-area, 
        .antigravity-wavy-chart .recharts-area-curve {
          filter: url(#antigravity-wave-filter);
        }
      `}</style>

      {/* Hidden SVG Filter Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="antigravity-wave-filter" x="-5%" y="-10%" width="110%" height="130%">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.015 0.04" 
              numOctaves="1" 
              result="noise"
            >
              <animate 
                attributeName="baseFrequency" 
                values="0.015 0.04; 0.018 0.06; 0.015 0.04" 
                dur="16s" 
                repeatCount="indefinite" 
              />
            </feTurbulence>
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="6" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>
        </defs>
      </svg>

      {/* Header Info */}
      <div className="flex justify-between items-center z-10">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Consistency Trendline</h2>
          <p className="text-xs text-ink-muted">Daily overall completion percentage</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-ink-muted font-medium">Monthly Average</span>
          <span className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
            {averageConsistency}%
          </span>
        </div>
      </div>

      {/* Antigravity floating chart container with wavy anim */}
      <motion.div 
        className="w-full h-72 z-10"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 15, left: -20, bottom: 15 }}
          >
            <defs>
              <linearGradient id="colorConsistency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255,255,255,0.03)" 
            />
            <XAxis 
              dataKey="day" 
              stroke="#94a3b8" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'rgba(16, 185, 129, 0.15)', strokeWidth: 1.5 }}
            />
            <Area 
              className="antigravity-wavy-chart"
              type="monotone" 
              dataKey="consistency" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorConsistency)"
              label={<CustomizedLabel />}
              activeDot={{ 
                r: 6, 
                stroke: '#10b981', 
                strokeWidth: 2, 
                fill: '#090d16',
                className: "shadow-lg filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
      <div className="text-center text-[10px] text-ink-muted mt-[-10px] z-10">Day</div>
    </Card>
  );
}

// Custom Tooltip component with floating Framer Motion animation
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 450, damping: 22 }}
        className="bg-slate-950/95 backdrop-blur-md border border-emerald-500/35 rounded-xl p-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex flex-col gap-1 z-50 pointer-events-none"
      >
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{data.label}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span className="text-sm font-bold text-white">Consistency: {data.consistency}%</span>
        </div>
      </motion.div>
    );
  }
  return null;
}

