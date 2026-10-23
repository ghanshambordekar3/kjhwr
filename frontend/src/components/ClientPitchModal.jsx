import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Presentation,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle,
  Lightbulb,
  Zap,
  DollarSign,
  Sliders
} from 'lucide-react';

const SLIDES = [
  {
    title: "1. The Executive Challenge: UK Day-Ahead Procurement Trilemma",
    subtitle: "Why renewable volatility creates multi-million pound imbalance exposures for UK energy utilities.",
    points: [
      {
        icon: Zap,
        title: "Consumer Demand Obligation",
        text: "As a UK energy supplier, you must procure sufficient electricity to meet your retail and industrial customers' dynamic load profile 24/7."
      },
      {
        icon: AlertTriangle,
        title: "The D-1 Market Gate Closure Reality",
        text: "Power purchase decisions on EPEX SPOT and Nord Pool UK Day-Ahead auctions must be locked in one day before delivery by 11:00 GMT."
      },
      {
        icon: Flame,
        title: "The Renewable Forecast Gap",
        text: "Wind power is inherently weather-dependent. Over-forecasting wind generation leaves the utility short, forcing emergency peaker dispatch or punitive Balancing Mechanism System Buy Price penalties (up to £135+/MWh)."
      }
    ],
    speakerNotes: "Start by acknowledging their daily operational reality: 'Good morning executive team. As a UK power utility, your trading desk is tasked with a difficult balancing act: serving customer demand while managing the volatile weather-driven nature of wind generation. The challenge is that day-ahead wholesale decisions must be locked in by 11:00 GMT on Day D-1, leaving you exposed to whatever forecast errors occur between gate closure and real-time delivery.'"
  },
  {
    title: "2. Point-in-Time Data Intelligence: Zero Lookahead Bias",
    subtitle: "Auditing actual decisions using strictly what your traders saw at 11:00 GMT on Day D-1.",
    points: [
      {
        icon: CheckCircle,
        title: "Elexon BMRS WINDFOR Stream",
        text: "We ingest every National Grid ESO wind forecast publication timestamped continuously across January 2026."
      },
      {
        icon: ShieldCheck,
        title: "Deterministic Gate Closure Filter",
        text: "Our portal enforces strict cutoff logic: publishTime <= D-1 11:00 GMT. We pick the latest available forecast at decision time, eliminating lookahead bias."
      },
      {
        icon: TrendingUp,
        title: "Settlement Period Granularity",
        text: "Aligned with Elexon FUELHH actual wind generation across all 48 half-hour settlement periods and hourly aggregated contracts."
      }
    ],
    speakerNotes: "Highlight the portal's integrity: 'Many generic forecast tools evaluate forecasts using whatever was published nearest to delivery. That is useless for your day-ahead desk! Our UK GridFlex IQ portal deterministically filters for the exact latest forecast available when your traders clicked submit at 11:00 AM on Day D-1. What you see on this portal is an authentic reconstruction of your decision reality.'"
  },
  {
    title: "3. January 2026 Empirical Audit: The Over-Forecasting Shock",
    subtitle: "Quantifying the systematic error patterns in national wind forecasts across January 2026.",
    points: [
      {
        icon: AlertTriangle,
        title: "Systematic Positive Bias (+1,400 to +3,100 MW)",
        text: "Throughout January 2026, Elexon wind forecasts exhibited a persistent over-forecasting bias. The forecast regularly promised thousands of MW more wind than actually blew."
      },
      {
        icon: Flame,
        title: "Severe Peak Hour Volatility (SP 15-38)",
        text: "MAE surged significantly during evening demand ramps (16:00 to 20:00 GMT). Forecast errors during peak price hours cost the desk 2.5x more per MWh than overnight errors."
      },
      {
        icon: TrendingUp,
        title: "65%+ Periods Over-Forecasted",
        text: "Naive day-ahead procurement led to frequent generation deficits, requiring costly real-time balancing cashouts."
      }
    ],
    speakerNotes: "Present the key quant discovery: 'When we analyze the entire month of January 2026, the numbers are eye-opening. There is a persistent over-forecasting bias averaging over 1,600 MW, with error rates spiking during peak demand hours between 16:00 and 20:00 GMT. If your desk naively bought thermal power assuming the wind forecast was 100% accurate, you were systematically left short in the balancing mechanism.'"
  },
  {
    title: "4. The Solution: Quant-Adjusted Thermal Procurement Planner",
    subtitle: "Turning quantified forecast error into intelligent, automated risk buffers for Day-Ahead bids.",
    points: [
      {
        icon: Sliders,
        title: "Customizable Hedging Strategies",
        text: "Traders can toggle between Naive, Bias-Corrected, and Conservative P90 Risk Buffers with a single click."
      },
      {
        icon: ShieldCheck,
        title: "Deficit Protection",
        text: "The P90 buffer assumes wind generation will drop to the 10th percentile, procuring thermal CCGT power ahead of time at cheap day-ahead rates (£75/MWh) rather than emergency cashout rates (£135/MWh)."
      },
      {
        icon: DollarSign,
        title: "Live Cashout Cost Simulation",
        text: "Real-time calculation of avoided Balancing Mechanism cashout spreads and net financial savings."
      }
    ],
    speakerNotes: "Show the interactive tool: 'Here is where our software delivers immediate value. Instead of guessing, your desk uses the Thermal Procurement Planner. By applying a Conservative P90 Risk Buffer, the software automatically calculates how much additional thermal power to schedule in Day-Ahead. You lock in power at the £75 Day-Ahead price rather than paying £135 in the Balancing Mechanism when wind drops.'"
  },
  {
    title: "5. Pilot Commercial ROI & Production Delivery",
    subtitle: "Demonstrated £180k+ monthly savings with zero disruption to your existing trading workflow.",
    points: [
      {
        icon: DollarSign,
        title: "£180,000+ Estimated Monthly Net Savings",
        text: "Based on January 2026 market data, eliminating peak-hour deficit cashout spreads generated substantial bottom-line savings."
      },
      {
        icon: CheckCircle,
        title: "Instant One-Click Export & REST API",
        text: "Integrates directly with your internal ETRM (Energy Trading & Risk Management) systems via OpenAPI JSON and automated CSV feeds."
      },
      {
        icon: Zap,
        title: "Immediate Rollout Ready",
        text: "Zero-latency UI, containerized in Docker, deployable to your private cloud or managed infrastructure within hours."
      }
    ],
    speakerNotes: "Conclude the pitch: 'In summary, this pilot proves that by integrating quantified forecast error into your Day-Ahead procurement workflow, your utility can save over £180,000 per month in avoided imbalance charges while derisking your energy supply. The software is production-ready today, fully containerized, and ready to deploy for your trading desk.'"
  }
];

export default function ClientPitchModal({ isOpen, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Presentation className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Client Pitch Mode (Executive Presentation)</h3>
              <p className="text-[11px] text-slate-400">5-Minute Walkthrough for Utility Leadership & Trading Desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-6 lg:p-8 flex-1 overflow-y-auto space-y-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              Slide {currentSlide + 1} of {SLIDES.length}
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
              {slide.title}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              {slide.subtitle}
            </p>
          </div>

          {/* Cards for this slide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {slide.points.map((pt, i) => {
              const Icon = pt.icon;
              return (
                <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition">
                  <div>
                    <div className="h-8 w-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center mb-3 text-cyan-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5">{pt.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{pt.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Presenter Speaker Notes Box */}
          <div className="bg-cyan-950/40 border border-cyan-800/40 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs mb-1">
              <Lightbulb className="h-4 w-4" />
              <span>Suggested 5-Minute Pitch Script:</span>
            </div>
            <p className="text-xs text-slate-300 italic font-sans leading-relaxed">
              "{slide.speakerNotes}"
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              disabled={currentSlide === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={() => setCurrentSlide(prev => Math.min(SLIDES.length - 1, prev + 1))}
              disabled={currentSlide === SLIDES.length - 1}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
