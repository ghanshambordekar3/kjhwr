import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Flame, ShieldCheck, DollarSign, TrendingUp, Sliders, CheckCircle2 } from 'lucide-react';
import { fetchProcurementPlan } from '../services/api';

const STRATEGIES = [
  { id: 'conservative_p90', label: 'Conservative P90 Buffer', shortLabel: 'P90 Buffer', desc: 'Hedges 90% of wind shortfall risk' },
  { id: 'bias_corrected', label: 'Bias-Corrected Forecast', shortLabel: 'Bias-Corrected', desc: 'Subtracts systematic over-forecast' },
  { id: 'mae_buffer', label: 'MAE Safety Margin', shortLabel: 'MAE Margin', desc: 'Buffers 75% of Mean Absolute Error' },
  { id: 'none', label: 'Naive Forecast (Zero Buffer)', shortLabel: 'Naive (Zero)', desc: 'Residual = Demand - Wind Forecast' },
];

export default function ThermalProcurementPlanner({ selectedDate, cutoffHour }) {
  const [strategy, setStrategy] = useState('conservative_p90');
  const [demandScale, setDemandScale] = useState(1.0);
  const [procurementData, setProcurementData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchProcurementPlan({
      deliveryDate: selectedDate,
      cutoffHour: cutoffHour,
      hedgingStrategy: strategy,
      demandScale: demandScale
    })
      .then((data) => {
        if (isMounted) {
          setProcurementData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Procurement plan fetch error:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedDate, cutoffHour, strategy, demandScale]);

  const summary = procurementData?.summary;
  const periods = procurementData?.periods || [];

  // Format data for Recharts
  const chartData = periods.map((p) => ({
    ...p,
    timeLabel: `SP ${p.settlementPeriod} (${p.startTime.slice(11, 16)})`,
  }));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 lg:p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 shrink-0" />
              <span>Thermal Power Procurement & Residual Demand</span>
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Additional power to procure (thermal/market) to meet demand beyond renewable wind generation.
          </p>
        </div>

        {/* Strategy selector buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStrategy(s.id)}
              className={`text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                strategy === s.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
              title={s.desc}
            >
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Financial Impact & Risk Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block font-semibold truncate">
            Demand (Day D)
          </span>
          <span className="text-sm sm:text-base lg:text-lg font-bold font-mono text-white mt-1 block truncate">
            {summary?.total_demand_mwh?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-400">MWh</span>
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block">Total energy load</span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block font-semibold truncate">
            Procured Thermal
          </span>
          <span className="text-sm sm:text-base lg:text-lg font-bold font-mono text-amber-400 mt-1 block truncate">
            {summary?.hedged_thermal_mwh?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-400">MWh</span>
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block">
            Buffer: +{summary?.risk_buffer_mw?.toLocaleString()} MW
          </span>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block font-semibold truncate">
            Naive Penalty
          </span>
          <span className="text-sm sm:text-base lg:text-lg font-bold font-mono text-rose-400 mt-1 block truncate">
            £{summary?.naive_imbalance_cost_gbp?.toLocaleString()}
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 truncate block">Zero-buffer cashout</span>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 sm:p-3">
          <span className="text-[9px] sm:text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold flex items-center gap-1 truncate">
            <ShieldCheck className="h-3 w-3 shrink-0" />
            Quant £ Savings
          </span>
          <span className="text-sm sm:text-base lg:text-lg font-bold font-mono text-emerald-300 mt-1 block truncate">
            £{summary?.net_savings_gbp?.toLocaleString()}
          </span>
          <span className="text-[9px] sm:text-[10px] text-emerald-400 truncate block">Net avoided penalty</span>
        </div>
      </div>

      {/* Stacked Chart: Demand vs Wind vs Thermal Procurement */}
      <div className="h-[280px] sm:h-[340px] lg:h-[380px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">
            Computing thermal procurement schedule and imbalance cashout costs...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <defs>
                <linearGradient id="windStack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="thermalStack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                interval={3}
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
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 text-xs font-mono shadow-2xl">
                      <div className="text-white font-bold font-sans pb-1 mb-1 border-b border-slate-800">
                        {d.timeLabel}
                      </div>
                      <div className="space-y-1 mt-1.5">
                        <div className="text-slate-300">Consumer Demand: {d.demand_mw?.toLocaleString()} MW</div>
                        <div className="text-emerald-400">Actual Wind Gen: {d.actual_wind_mw?.toLocaleString()} MW</div>
                        <div className="text-cyan-400">D-1 Wind Forecast: {d.forecast_wind_mw?.toLocaleString()} MW</div>
                        <div className="text-amber-400 font-bold">Hedged Thermal Power: {d.hedged_thermal_mw?.toLocaleString()} MW</div>
                        <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-400 font-sans">
                          {d.hedged_imbalance_mw >= 0 ? (
                            <span className="text-emerald-400">✓ Balance: +{Math.round(d.hedged_imbalance_mw)} MW (Hedged)</span>
                          ) : (
                            <span className="text-rose-400">⚠️ Balance: {Math.round(d.hedged_imbalance_mw)} MW Short</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              {/* Area 1: Actual Wind Generation */}
              <Area
                type="monotone"
                dataKey="actual_wind_mw"
                name="Actual Wind Generation (MW)"
                fill="url(#windStack)"
                stroke="#10b981"
                strokeWidth={2}
              />

              {/* Area 2: Hedged Thermal Procurement */}
              <Area
                type="monotone"
                dataKey="hedged_thermal_mw"
                name="Thermal Power Procured (MW)"
                fill="url(#thermalStack)"
                stroke="#f97316"
                strokeWidth={2}
              />

              {/* Top Reference: Customer Demand Line */}
              <Line
                type="monotone"
                dataKey="demand_mw"
                name="Total Customer Demand (MW)"
                stroke="#ffffff"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Decision Walkthrough Description */}
      <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Trading Desk Recommendation:</strong> By applying the <strong>{STRATEGIES.find(s => s.id === strategy)?.label}</strong>, the utility absorbs wind over-forecasting shocks before 11:00 GMT Day-Ahead gate closure, avoiding punitive Balancing Mechanism cashout charges of <strong>£135/MWh</strong>.
          </span>
        </div>
      </div>
    </div>
  );
}
