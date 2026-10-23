import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { BarChart3, Clock, HelpCircle, Activity } from 'lucide-react';
import { fetchErrorHistogram } from '../services/api';

export default function ErrorAnalysisPanel({
  hourlyProfile,
  metrics,
  filters
}) {
  const [histogramData, setHistogramData] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingHist(true);
    fetchErrorHistogram({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      cutoffHour: filters.cutoffHour,
      bins: 22
    })
      .then((data) => {
        if (isMounted) {
          setHistogramData(data.bins || []);
          setLoadingHist(false);
        }
      })
      .catch((err) => {
        console.error('Histogram fetch error:', err);
        if (isMounted) setLoadingHist(false);
      });

    return () => { isMounted = false; };
  }, [filters.dateFrom, filters.dateTo, filters.cutoffHour]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Error Distribution Histogram */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                Forecast Error Distribution (MW)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency distribution of (Forecast - Actual). Skewness reveals over-forecasting.
              </p>
            </div>
            <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              Median: {metrics?.p50_error > 0 ? `+${metrics?.p50_error}` : metrics?.p50_error} MW
            </span>
          </div>

          <div className="h-64 w-full">
            {loadingHist ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading distribution...</div>
            ) : histogramData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="bin_center"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}`}
                    unit=" MW"
                  />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono shadow-xl">
                          <div className="text-slate-400 font-sans">
                            Range: {d.bin_start} to {d.bin_end} MW
                          </div>
                          <div className="text-cyan-400 font-bold mt-1">
                            Count: {d.count} periods
                          </div>
                          <div className="text-[10px] font-sans text-slate-400 mt-0.5">
                            {d.bin_center > 0 ? 'Over-forecast (Shortfall)' : 'Under-forecast (Surplus)'}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Bar
                    dataKey="count"
                    name="Frequency"
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No histogram data.</div>
            )}
          </div>
        </div>

        {/* Quantile Summary Strip */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-center font-mono">
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-sans text-slate-400 block">P10 Error</span>
            <span className="text-xs font-bold text-slate-200">
              {metrics?.p10_error > 0 ? `+${metrics?.p10_error}` : metrics?.p10_error} MW
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-sans text-slate-400 block">P50 (Median)</span>
            <span className="text-xs font-bold text-cyan-300">
              {metrics?.p50_error > 0 ? `+${metrics?.p50_error}` : metrics?.p50_error} MW
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-sans text-slate-400 block">P90 Error</span>
            <span className="text-xs font-bold text-amber-400">
              {metrics?.p90_error > 0 ? `+${metrics?.p90_error}` : metrics?.p90_error} MW
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-sans text-slate-400 block">IQR Spread</span>
            <span className="text-xs font-bold text-purple-300">
              {metrics?.iqr_error} MW
            </span>
          </div>
        </div>
      </div>

      {/* 2. Diurnal 24-Hour Error Profile */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                Diurnal Error Profile (Hour 00 to 23 GMT)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hourly breakdown of MAE & Bias. Peak hours (07:00-19:00) carry high wholesale price risk.
              </p>
            </div>
            <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded font-mono">
              Peak SP 15-38
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyProfile} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour_label" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit=" MW" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono shadow-xl">
                        <div className="text-white font-bold font-sans flex items-center justify-between">
                          <span>{d.hour_label} GMT</span>
                          {d.is_peak && <span className="text-[10px] text-red-400 font-mono">PEAK</span>}
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="text-cyan-400">MAE: {d.mae_mw} MW</div>
                          <div className="text-purple-400">RMSE: {d.rmse_mw} MW</div>
                          <div className="text-amber-400">Bias: {d.bias_mw > 0 ? `+${d.bias_mw}` : d.bias_mw} MW</div>
                          <div className="text-slate-400">MAPE: {d.mape_pct}%</div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="mae_mw"
                  name="MAE (MW)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="bias_mw"
                  name="Bias / ME (MW)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diurnal Insight Box */}
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2 mt-3">
          <Activity className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-cyan-300">Desk Insight:</strong> Wind forecast error peaks in late afternoon and evening (16:00 - 20:00 GMT) coinciding with the UK domestic electricity demand peak. Thermal peaker procurement buffers must be prioritized during these settlement periods.
          </span>
        </div>
      </div>
    </div>
  );
}
