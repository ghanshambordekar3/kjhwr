import React from 'react';

export default function KpiCard({ metrics, isLoading }) {
  if (!metrics || isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 h-28 sm:h-32 flex flex-col justify-between">
            <div className="h-3 bg-slate-800 rounded w-2/3" />
            <div className="h-6 sm:h-7 bg-slate-800 rounded w-4/5 my-1.5" />
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
      {/* 1. MAE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-medium">
          <span className="truncate">Mean Abs Error</span>
          <span className="font-mono text-[9px] sm:text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded shrink-0">MAE</span>
        </div>
        <div className="my-1.5 sm:my-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-tight text-white truncate">
            {metrics.mae?.toLocaleString()} <span className="text-xs sm:text-sm font-sans text-slate-400 font-normal">MW</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-cyan-400 mt-0.5 font-medium truncate">
            nMAE: {metrics.nmae}% of gen
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
          Avg day-ahead error
        </div>
      </div>

      {/* 2. RMSE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-medium">
          <span className="truncate">Root Mean Sq</span>
          <span className="font-mono text-[9px] sm:text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded shrink-0">RMSE</span>
        </div>
        <div className="my-1.5 sm:my-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-tight text-purple-300 truncate">
            {metrics.rmse?.toLocaleString()} <span className="text-xs sm:text-sm font-sans text-slate-400 font-normal">MW</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            Ratio: {(metrics.rmse / (metrics.mae || 1)).toFixed(2)}x MAE
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
          Outlier penalty factor
        </div>
      </div>

      {/* 3. MAPE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-medium">
          <span className="truncate">Percentage Error</span>
          <span className="font-mono text-[9px] sm:text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded shrink-0">MAPE</span>
        </div>
        <div className="my-1.5 sm:my-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-tight text-cyan-300 truncate">
            {metrics.mape}%
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            Mean: {Math.round(metrics.mean_actual_mw)?.toLocaleString()} MW
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
          Relative wind error
        </div>
      </div>

      {/* 4. Systematic Bias */}
      <div className={`bg-slate-900/80 border rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:border-slate-700 transition ${
        isOverforecast ? 'border-amber-900/40' : 'border-blue-900/40'
      }`}>
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium text-slate-400">
          <span className="truncate">Forecast Bias</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 ${
            isOverforecast
              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
              : 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
          }`}>
            {isOverforecast ? 'Over' : 'Under'}
          </span>
        </div>
        <div className="my-1.5 sm:my-2">
          <div className={`text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-tight flex items-center gap-1 truncate ${
            isOverforecast ? 'text-amber-400' : 'text-blue-400'
          }`}>
            {metrics.bias > 0 ? `+${metrics.bias?.toLocaleString()}` : metrics.bias?.toLocaleString()}{' '}
            <span className="text-xs sm:text-sm font-sans font-normal text-slate-400">MW</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            {isOverforecast ? 'Deficit shortfall risk' : 'Surplus over-buy'}
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
          Market imbalance bias
        </div>
      </div>

      {/* 5. Peak vs Off-Peak MAE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-medium">
          <span className="truncate">Peak Hours MAE</span>
          <span className="font-mono text-[9px] bg-red-950/80 text-red-400 border border-red-800/40 px-1 py-0.5 rounded shrink-0">
            SP15-38
          </span>
        </div>
        <div className="my-1.5 sm:my-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-tight text-rose-300 truncate">
            {metrics.peak_mae?.toLocaleString()} <span className="text-xs sm:text-sm font-sans text-slate-400 font-normal">MW</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            Off-Peak: {metrics.off_peak_mae?.toLocaleString()} MW
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
          07:00-19:00 GMT peak
        </div>
      </div>

      {/* 6. Over-Forecast Periods Ratio */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-medium">
          <span className="truncate">Imbalance Skew</span>
          <span className="font-mono text-[9px] bg-slate-800 text-slate-300 px-1 py-0.5 rounded shrink-0">
            {metrics.total_periods}
          </span>
        </div>
        <div className="my-1.5 sm:my-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-1.5 truncate">
            <span>{overRatio}%</span>
            <span className="text-xs font-sans text-amber-400 font-medium">Over</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5 flex">
            <div className="bg-amber-400 h-full" style={{ width: `${overRatio}%` }} />
            <div className="bg-blue-400 h-full" style={{ width: `${100 - overRatio}%` }} />
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
          {metrics.over_forecast_count} over vs {metrics.under_forecast_count} under
        </div>
      </div>
    </div>
  );
}
