import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Zap } from 'lucide-react';

const CustomChartTooltip = ({ active, payload, cutoffHour }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const isOver = data.error_mw > 0;

  return (
    <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-2.5 sm:p-3.5 shadow-2xl backdrop-blur-md text-[11px] sm:text-xs max-w-[270px] sm:max-w-xs z-50">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
        <span className="font-semibold text-white">{data.settlementDate} {data.timeLabel}</span>
        <span className="font-mono text-[9px] sm:text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
          SP {data.settlementPeriod} {data.is_peak ? '• Peak' : ''}
        </span>
      </div>

      <div className="space-y-1 font-mono">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Actual:
          </span>
          <span className="text-emerald-400 font-bold">{Math.round(data.actual_mw)?.toLocaleString()} MW</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            D-1 {cutoffHour}:00:
          </span>
          <span className="text-cyan-400 font-bold">{Math.round(data.forecast_mw)?.toLocaleString()} MW</span>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
          <span className="text-slate-400">Error:</span>
          <span className={`font-bold ${isOver ? 'text-amber-400' : 'text-blue-400'}`}>
            {data.error_mw > 0 ? `+${Math.round(data.error_mw)?.toLocaleString()}` : Math.round(data.error_mw)?.toLocaleString()} MW ({data.pct_error}%)
          </span>
        </div>

        <div className="text-[10px] font-sans pt-1 text-slate-400">
          {isOver ? (
            <span className="text-amber-400">⚠️ Over-forecast: Shortfall</span>
          ) : (
            <span className="text-blue-400">ℹ️ Under-forecast: Surplus</span>
          )}
        </div>

        {data.publishTime && (
          <div className="text-[9px] font-sans text-slate-400 pt-1 border-t border-slate-800">
            Pub: {data.publishTime.slice(11, 16)} UTC (Lead: {data.lead_time_hours}h)
          </div>
        )}
      </div>
    </div>
  );
};

export default function ForecastVsActualChart({ timeSeries, cutoffHour, resolution }) {
  const [showErrorBars, setShowErrorBars] = useState(true);
  const [showPeakShading, setShowPeakShading] = useState(true);

  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="h-64 sm:h-80 flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs sm:text-sm p-4 text-center">
        No forecast and actual data points to plot for selected filters.
      </div>
    );
  }

  // Format data for chart
  const formattedData = timeSeries.map((d) => {
    const timeLabel = d.minute !== undefined
      ? `${String(d.hour).padStart(2, '0')}:${String(d.minute).padStart(2, '0')}`
      : `${String(d.hour).padStart(2, '0')}:00`;
    const label = `${d.settlementDate?.slice(5)} ${timeLabel} (SP${d.settlementPeriod})`;

    return {
      ...d,
      displayTime: label,
      timeLabel: timeLabel,
    };
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 lg:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-800 gap-2.5 sm:gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Renewable Generation: Forecast vs. Actual</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Evaluated at Day-Ahead cutoff ({cutoffHour}:00 GMT D-1) across {timeSeries.length} intervals
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-3 text-[11px] sm:text-xs flex-wrap">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showErrorBars}
              onChange={(e) => setShowErrorBars(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Error Delta</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPeakShading}
              onChange={(e) => setShowPeakShading(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
            />
            <span>Peak SP15-38</span>
          </label>
        </div>
      </div>

      {/* Chart container with responsive height */}
      <div className="h-[280px] sm:h-[350px] lg:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="displayTime"
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
              interval={Math.max(1, Math.floor(formattedData.length / 8))}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip content={<CustomChartTooltip cutoffHour={cutoffHour} />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '10px' }}
            />

            {/* Error Bars */}
            {showErrorBars && (
              <Bar
                dataKey="error_mw"
                name="Forecast Error (MW)"
                fill="#f59e0b"
                opacity={0.35}
                maxBarSize={6}
              />
            )}

            {/* Actual Wind Generation Line */}
            <Area
              type="monotone"
              dataKey="actual_mw"
              name="Actual Wind (FUELHH)"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#actualGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />

            {/* Day-Ahead Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast_mw"
              name={`D-1 ${cutoffHour}:00 Forecast (WINDFOR)`}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, fill: '#38bdf8' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Metric interpretation footer */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-400 gap-1.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2.5 rounded bg-emerald-500 inline-block" />
            <span>Actual (FUELHH)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-cyan-400 inline-block border-t border-dashed" />
            <span>Forecast D-1 {cutoffHour}:00</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400/60 inline-block" />
            <span>Error (MW)</span>
          </div>
        </div>

        <div className="italic">
          Resolution: {resolution === 'half_hourly' ? '30-minute SPs' : '1-Hour Aggregated'}
        </div>
      </div>
    </div>
  );
}
