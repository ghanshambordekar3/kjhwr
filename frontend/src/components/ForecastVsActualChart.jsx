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
  CartesianGrid,
  ReferenceArea
} from 'recharts';
import { Eye, Layers, Zap, Info } from 'lucide-react';

export default function ForecastVsActualChart({ timeSeries, cutoffHour, resolution }) {
  const [showErrorBars, setShowErrorBars] = useState(true);
  const [showPeakShading, setShowPeakShading] = useState(true);

  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
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
      overForecastError: d.error_mw > 0 ? d.error_mw : 0,
      underForecastError: d.error_mw < 0 ? d.error_mw : 0,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const isOver = data.error_mw > 0;

    return (
      <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[260px] z-50">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <span className="font-semibold text-white">{data.settlementDate} {data.timeLabel}</span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
            SP {data.settlementPeriod} {data.is_peak ? '• Peak' : ''}
          </span>
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Actual Generation:
            </span>
            <span className="text-emerald-400 font-bold">{Math.round(data.actual_mw)?.toLocaleString()} MW</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              D-1 {cutoffHour}:00 Forecast:
            </span>
            <span className="text-cyan-400 font-bold">{Math.round(data.forecast_mw)?.toLocaleString()} MW</span>
          </div>

          <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/80">
            <span className="text-slate-400">Forecast Error:</span>
            <span className={`font-bold ${isOver ? 'text-amber-400' : 'text-blue-400'}`}>
              {data.error_mw > 0 ? `+${Math.round(data.error_mw)?.toLocaleString()}` : Math.round(data.error_mw)?.toLocaleString()} MW ({data.pct_error}%)
            </span>
          </div>

          <div className="text-[11px] font-sans pt-1 text-slate-400">
            {isOver ? (
              <span className="text-amber-400">⚠️ Over-forecast: Utility short in balancing</span>
            ) : (
              <span className="text-blue-400">ℹ️ Under-forecast: Utility long (surplus)</span>
            )}
          </div>

          {data.publishTime && (
            <div className="text-[10px] font-sans text-slate-400 pt-1 border-t border-slate-800">
              Published: {data.publishTime.slice(11, 16)} UTC (Lead: {data.lead_time_hours}h)
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            Point-in-Time Renewable Generation: Forecast vs. Actual
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated at Day-Ahead cut-off ({cutoffHour}:00 GMT on D-1) across {timeSeries.length} settlement intervals
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showErrorBars}
              onChange={(e) => setShowErrorBars(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Show Error Delta</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPeakShading}
              onChange={(e) => setShowPeakShading(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
            />
            <span>Peak Hours (SP 15-38)</span>
          </label>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="displayTime"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={Math.max(1, Math.floor(formattedData.length / 12))}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
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
              activeDot={{ r: 5, fill: '#10b981' }}
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
              activeDot={{ r: 5, fill: '#38bdf8' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Metric interpretation footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded bg-emerald-500 inline-block" />
            <span>Actual (FUELHH: WIND)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-cyan-400 inline-block border-t border-dashed" />
            <span>Latest Forecast at D-1 {cutoffHour}:00 (WINDFOR)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400/60 inline-block" />
            <span>Error Spread (MW)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          Data resolution: {resolution === 'half_hourly' ? '30-minute Settlement Periods' : '1-Hour Aggregated'}
        </div>
      </div>
    </div>
  );
}
