import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function MonthTrendChart({ dailyTrend, onSelectDay, selectedDate }) {
  if (!dailyTrend || dailyTrend.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 lg:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>January 2026 Daily Forecast Performance Trajectory</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Day-by-day evolution of MAE and Bias. Click any day bar to drill down into its 48 settlement periods.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] sm:text-xs">
          <span className="text-slate-400">Selected:</span>
          <span className="font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
            {selectedDate}
          </span>
        </div>
      </div>

      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dailyTrend}
            margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const day = state.activePayload[0].payload.date;
                if (day && onSelectDay) onSelectDay(day);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(v) => v.slice(8)} // show just day '01', '02', etc.
            />
            <YAxis stroke="#64748b" fontSize={10} unit=" MW" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono shadow-2xl">
                    <div className="text-white font-bold font-sans pb-1 mb-1 border-b border-slate-800 flex justify-between items-center">
                      <span>Delivery: {d.date}</span>
                      <span className="text-[10px] text-slate-400">D-1: {d.decision_date}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-cyan-400">MAE: {d.mae} MW</div>
                      <div className="text-purple-400">RMSE: {d.rmse} MW</div>
                      <div className="text-amber-400">Bias: {d.bias > 0 ? `+${d.bias}` : d.bias} MW</div>
                      <div className="text-slate-400">MAPE: {d.mape}%</div>
                      <div className="text-emerald-400">Mean Actual: {d.mean_actual} MW</div>
                    </div>
                    <div className="mt-2 text-[10px] text-cyan-400 font-sans italic">
                      Click to load this day in main view
                    </div>
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />

            <Bar
              dataKey="mae"
              name="Daily MAE (MW)"
              fill="#38bdf8"
              opacity={0.85}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
            />

            <Line
              type="monotone"
              dataKey="bias"
              name="Daily Bias / ME (MW)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
