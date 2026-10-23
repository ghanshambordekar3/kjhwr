import React from 'react';
import { TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Compass, Flame, ShieldAlert } from 'lucide-react';

export default function KpiCard({ metrics, isLoading }) {
  if (!metrics || isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 h-32 flex flex-col justify-between">
            <div className="h-3 bg-slate-800 rounded w-2/3" />
            <div className="h-7 bg-slate-800 rounded w-4/5 my-2" />
            <div className="h-2 bg-slate-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const isOverforecast = metrics.bias > 0;
  const overRatio = metrics.total_periods > 0
    ? Math.round((metrics.over_forecast_count / metrics.total_periods) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
      {/* 1. MAE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Mean Absolute Error</span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">MAE</span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {metrics.mae?.toLocaleString()} <span className="text-sm font-sans text-slate-400 font-normal">MW</span>
          </div>
          <div className="text-[11px] text-cyan-400 mt-0.5 font-medium">
            nMAE: {metrics.nmae}% of mean gen
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          Average magnitude of day-ahead error
        </div>
      </div>

      {/* 2. RMSE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Root Mean Sq Error</span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">RMSE</span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-purple-300">
            {metrics.rmse?.toLocaleString()} <span className="text-sm font-sans text-slate-400 font-normal">MW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Ratio RMSE/MAE: {(metrics.rmse / (metrics.mae || 1)).toFixed(2)}x
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          Heavy penalty on severe volatility spikes
        </div>
      </div>

      {/* 3. MAPE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Percentage Error</span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">MAPE</span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-cyan-300">
            {metrics.mape}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Mean Gen: {Math.round(metrics.mean_actual_mw)?.toLocaleString()} MW
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          Relative scale of wind procurement error
        </div>
      </div>

      {/* 4. Systematic Bias */}
      <div className={`bg-slate-900/80 border rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition ${
        isOverforecast ? 'border-amber-900/40' : 'border-blue-900/40'
      }`}>
        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
          <span>Forecast Bias</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
            isOverforecast
              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
              : 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
          }`}>
            {isOverforecast ? 'Over-Forecast' : 'Under-Forecast'}
          </span>
        </div>
        <div className="my-2">
          <div className={`text-2xl font-bold font-mono tracking-tight flex items-center gap-1 ${
            isOverforecast ? 'text-amber-400' : 'text-blue-400'
          }`}>
            {metrics.bias > 0 ? `+${metrics.bias?.toLocaleString()}` : metrics.bias?.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-slate-400">MW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isOverforecast ? 'Shortfall deficit risk' : 'Surplus over-procure'}
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          Direction of systematic market error
        </div>
      </div>

      {/* 5. Peak vs Off-Peak MAE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Peak Hours MAE</span>
          <span className="font-mono text-[10px] bg-red-950/80 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded">
            SP 15-38
          </span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-rose-300">
            {metrics.peak_mae?.toLocaleString()} <span className="text-sm font-sans text-slate-400 font-normal">MW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Off-Peak: {metrics.off_peak_mae?.toLocaleString()} MW
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          07:00-19:00 GMT highest price exposure
        </div>
      </div>

      {/* 6. Over-Forecast Periods Ratio */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Imbalance Skew</span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
            {metrics.total_periods} Periods
          </span>
        </div>
        <div className="my-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
            <span>{overRatio}%</span>
            <span className="text-xs font-sans text-amber-400 font-medium">Over</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5 flex">
            <div className="bg-amber-400 h-full" style={{ width: `${overRatio}%` }} />
            <div className="bg-blue-400 h-full" style={{ width: `${100 - overRatio}%` }} />
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          {metrics.over_forecast_count} over vs {metrics.under_forecast_count} under
        </div>
      </div>
    </div>
  );
}
