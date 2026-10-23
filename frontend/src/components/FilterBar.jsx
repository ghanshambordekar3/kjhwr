import React from 'react';
import { Calendar, Clock, Sliders, ArrowRight } from 'lucide-react';

const PRESETS = [
  { label: 'Full Month (Jan 1-31)', start: '2026-01-01', end: '2026-01-31' },
  { label: 'High Wind Storm (Jan 1-5)', start: '2026-01-01', end: '2026-01-05' },
  { label: 'Mid-Month Volatility (Jan 12-18)', start: '2026-01-12', end: '2026-01-18' },
  { label: 'Low Wind Deficit (Jan 24-31)', start: '2026-01-24', end: '2026-01-31' },
];

const CUTOFF_OPTIONS = [7, 9, 11, 12, 14, 17];

export default function FilterBar({ filters, setFilters, isLoading }) {
  const handlePreset = (p) => {
    setFilters(prev => ({
      ...prev,
      dateFrom: p.start,
      dateTo: p.end
    }));
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-4 lg:p-5 shadow-xl backdrop-blur-sm space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: Date controls & Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <span>Time Horizon:</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-mono"
            />
            <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-mono"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESETS.map((p, idx) => {
              const active = filters.dateFrom === p.start && filters.dateTo === p.end;
              return (
                <button
                  key={idx}
                  onClick={() => handlePreset(p)}
                  className={`text-[10px] sm:text-[11px] font-medium px-2 sm:px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Decision Cutoff & Resolution */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          {/* Day-Ahead Cut-off selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">D-1 Gate Closure:</span>
              <span className="sm:hidden">D-1 Cutoff:</span>
            </div>
            <div className="flex items-center bg-slate-950 rounded-xl p-0.5 sm:p-1 border border-slate-800 overflow-x-auto">
              {CUTOFF_OPTIONS.map((hour) => (
                <button
                  key={hour}
                  onClick={() => setFilters(prev => ({ ...prev, cutoffHour: hour }))}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-mono rounded-lg transition ${
                    filters.cutoffHour === hour
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={hour === 11 ? 'EPEX/Nord Pool UK Day-Ahead Gate Closure (11:00 GMT)' : `Cutoff at ${hour}:00 GMT`}
                >
                  {hour}:00{hour === 11 ? '*' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-slate-950 rounded-xl p-0.5 sm:p-1 border border-slate-800 text-xs w-full sm:w-auto">
              <button
                onClick={() => setFilters(prev => ({ ...prev, resolution: 'half_hourly' }))}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition whitespace-nowrap text-center ${
                  filters.resolution === 'half_hourly'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="48 Settlement Periods per day (Half-Hourly)"
              >
                30-Min (Half-Hour)
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, resolution: 'hourly' }))}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition whitespace-nowrap text-center ${
                  filters.resolution === 'hourly'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="24 Hourly contracts per day"
              >
                1-Hour Aggregated
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-400 gap-1.5">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="text-cyan-400 font-mono">* 11:00 GMT:</span> UK day-ahead auction gate closure. Only forecasts with <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-300 font-mono text-[10px]">publishTime ≤ D-1 11:00</code> are used.
        </span>
        {isLoading && (
          <span className="text-cyan-400 font-medium flex items-center gap-1.5 animate-pulse shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Recalculating Metrics...
          </span>
        )}
      </div>
    </div>
  );
}
