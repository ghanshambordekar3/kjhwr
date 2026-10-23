import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Code2,
  Server,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  GitBranch,
  Terminal,
  FileText,
  Lightbulb
} from 'lucide-react';

const TECH_SLIDES = [
  {
    title: "1. System Architecture & Topology",
    subtitle: "High-performance, decoupled full-stack architecture built with React, FastAPI, and Docker.",
    diagram: `
+-------------------------------------------------------------+
|                      React 18 Frontend                      |
|  (Vite + Tailwind CSS + Recharts + Lucide Icons + Responsive)|
+------------------------------+------------------------------+
                               | REST JSON / Streaming CSV
                               v
+-------------------------------------------------------------+
|                     FastAPI Python Backend                  |
|  - main.py (REST API routes, CORS, OpenAPI Swagger /docs)    |
|  - forecast_engine.py (Point-in-time matching & vintages)   |
|  - metrics_engine.py (Vectorized MAE, RMSE, MAPE, Bias)     |
|  - procurement_engine.py (Thermal residual & quant hedging) |
|  - elexon_service.py (Dual-mode: Cached Jan 2026 / Live API)|
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      Elexon BMRS API                        |
|  - Actuals: /datasets/FUELHH/stream (fuelType == 'WIND')    |
|  - Forecasts: /datasets/WINDFOR/stream                      |
+-------------------------------------------------------------+
    `,
    details: [
      { label: "Frontend", val: "React 18, Vite 5, Tailwind CSS, Recharts for dynamic visual rendering" },
      { label: "Backend", val: "Python 3.11, FastAPI, Pydantic v2 schemas, Pandas, NumPy, Uvicorn" },
      { label: "Container", val: "Multi-stage Dockerfiles + root docker-compose.yml for one-click launch" }
    ],
    speakerNotes: "Welcome tech lead. I have structured this product using a clean, decoupled architecture: a lightweight React 18 client communicating with a high-performance Python FastAPI analytical service. The backend handles all heavy data processing, vectorized NumPy metrics calculations, and point-in-time matching, while the frontend provides sub-second interactive visualization."
  },
  {
    title: "2. Point-in-Time Forecast Matching Logic",
    subtitle: "Eliminating lookahead bias: strict temporal cutoffs and settlement period alignment.",
    diagram: `
Timeline for Delivery Date D:
Day D-1 (11:00 GMT Gate Closure)                     Day D (Delivery Day)
--------+------------------------------------------+-------------------->
        |                                          |
   Cutoff Time T_cutoff                            48 Settlement Periods
   (publishTime <= D-1 11:00)                      (SP 1 to SP 48)
        |                                          |
        v                                          v
   Find argmax(publishTime)                   Actual generation from
   for each target hour t                     FUELHH (fuelType == 'WIND')
    `,
    details: [
      { label: "Cutoff Enforcement", val: "Forecasts are strictly filtered to publishTime <= (DeliveryDate - 1 day at cutoff_hour:00:00Z)." },
      { label: "Resolution Alignment", val: "FUELHH is 30-min (48 SPs); WINDFOR is 1-hour. Supports both half-hourly expansion and 1-hour aggregation." },
      { label: "Lead Time Tracking", val: "Calculates exact lead time (hours) between forecast publication and physical power delivery." }
    ],
    speakerNotes: "A critical technical challenge in energy trading models is avoiding lookahead bias. In our forecast_engine.py, for any target delivery day D, we compute T_cutoff as D-1 at the gate closure hour (e.g. 11:00 GMT). We filter out all forecasts published after this timestamp and select the latest vintage available for each period. Furthermore, we cleanly bridge the resolution mismatch between Elexon's 30-minute FUELHH stream and the hourly WINDFOR stream."
  },
  {
    title: "3. Mathematical Modeling & Procurement Optimization",
    subtitle: "Formalizing forecast error metrics and risk-adjusted thermal procurement.",
    diagram: `
Core Mathematical Formulations:
1. Error:              e_t = Forecast_t - Actual_t
2. MAE:                MAE = (1/N) * sum(|e_t|)
3. RMSE:               RMSE = sqrt((1/N) * sum(e_t^2))
4. Systematic Bias:    Bias = (1/N) * sum(e_t)
5. Naive Thermal:      P_naive(t) = max(0, Demand(t) - Forecast(t))
6. Hedged Thermal:     P_hedged(t) = max(0, Demand(t) - (Forecast(t) - Buffer_P90))
7. Cashout Spread:     Short Penalty = |Imbalance| * (SystemBuyPrice - DayAheadPrice)
    `,
    details: [
      { label: "Volatility Penalty", val: "RMSE / MAE ratio gauges error distribution fat tails and storm outliers." },
      { label: "Diurnal Segmentation", val: "Evaluates Peak SP 15-38 (07:00-19:00 GMT) vs Off-Peak to reflect wholesale price premiums." },
      { label: "Quant Hedging", val: "Dynamic P90 quantile buffer shields the utility desk from high Balancing Mechanism penalties." }
    ],
    speakerNotes: "Our metrics_engine.py computes standard statistical metrics—MAE, RMSE, MAPE, and systematic Bias. To bridge data science to trading desk operations, our procurement_engine.py models residual demand. If the desk naively trusts the forecast, over-forecasting exposes them to the System Buy Price spread (£135 vs £75). By computing the empirical P90 error, we derive an optimal risk buffer that eliminates deficit shocks."
  },
  {
    title: "4. Codebase Organization & Key Dev Practices",
    subtitle: "Clean architecture, typed interfaces, automated unit testing, and sub-second responses.",
    diagram: `
Repository Directory Structure:
d:\\UK_Electicity_Utility/
|-- backend/
|   |-- app/
|   |   |-- main.py              <- FastAPI routing, OpenAPI /docs
|   |   |-- config.py            <- Environment & demand curve baseline
|   |   |-- models.py            <- Pydantic schemas & response models
|   |   |-- services/
|   |   |   |-- elexon_service.py      <- Ingestion & January 2026 cache
|   |   |   |-- forecast_engine.py     <- Temporal cutoff matching engine
|   |   |   |-- metrics_engine.py      <- Vectorized quantitative analytics
|   |   |   |-- procurement_engine.py  <- Thermal procurement simulator
|   |-- tests/                   <- 13 comprehensive Pytest unit tests (100% pass)
|-- frontend/
|   |-- src/components/          <- Reusable UI components & Recharts
|   |-- src/services/api.js      <- Typed async API client
|-- docker-compose.yml           <- Container orchestration
    `,
    details: [
      { label: "Type Safety", val: "Strict Pydantic schemas enforce input validation, date bounds, and type safety." },
      { label: "Unit Test Coverage", val: "13 automated tests covering engine logic, temporal cutoff enforcement, and API contracts." },
      { label: "Dual-Mode Ingestion", val: "Pre-indexed January 2026 cache guarantees instant 0-latency demo, with live Elexon sync support." }
    ],
    speakerNotes: "For codebase organization, I adhered to clean service-oriented design. Domain logic is segregated into dedicated services: elexon_service, forecast_engine, metrics_engine, and procurement_engine. All endpoints are guarded by Pydantic models with auto-generated OpenAPI documentation. We have 13 automated unit tests that verify cutoff enforcement, resolution switches, and metric calculations."
  },
  {
    title: "5. Containerization, Docker & Deployment Readiness",
    subtitle: "Ready for one-command deployment via Docker Compose, Vercel, or Heroku.",
    diagram: `
Deployment Ready Topology:
1. Local / Cloud VM:
   $ docker compose up --build
   -> Runs backend on :8000 and frontend on :3000 seamlessly.

2. Cloud PaaS (Vercel + Heroku/Render):
   - Frontend: Vercel (configured via vercel.json, static CDN edge)
   - Backend: Heroku / Render (configured via Procfile & Dockerfile)
   - Zero external DB dependency required: embedded high-speed cache.
    `,
    details: [
      { label: "Docker Compose", val: "Root docker-compose.yml builds backend and frontend in isolated bridge network." },
      { label: "Vercel Config", val: "vercel.json routing rules for SPA single-page application fallback." },
      { label: "Heroku / PaaS", val: "Procfile and runtime.txt (Python 3.11) ready for git push deployment." }
    ],
    speakerNotes: "Finally, the application is containerized and cloud-ready. A single command 'docker compose up' spins up both services with networking configured. For cloud deployment, we have vercel.json ready for the frontend and Procfile/Dockerfile for Heroku or Render. The application has zero external database dependencies, making it ultra-reliable and cost-effective to host."
  }
];

export default function TechReviewModal({ isOpen, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slide = TECH_SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b1329] border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center">
              <Code2 className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Technical Lead Architecture & Code Review</h3>
              <p className="text-[11px] text-slate-400">5-Minute Engineering Knowledge Transfer & Design Review</p>
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
        <div className="p-6 lg:p-8 flex-1 overflow-y-auto space-y-5">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
              Topic {currentSlide + 1} of {TECH_SLIDES.length}
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {slide.title}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {slide.subtitle}
            </p>
          </div>

          {/* ASCII Architecture / Math Diagram */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto shadow-inner leading-relaxed">
            <pre className="whitespace-pre">{slide.diagram.trim()}</pre>
          </div>

          {/* Key Specifications / Bullet Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {slide.details.map((d, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block font-semibold mb-1">
                  {d.label}
                </span>
                <span className="text-xs text-slate-300 leading-snug block">
                  {d.val}
                </span>
              </div>
            ))}
          </div>

          {/* Tech Lead Knowledge Transfer Script */}
          <div className="bg-cyan-950/40 border border-cyan-800/40 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs mb-1">
              <Lightbulb className="h-4 w-4" />
              <span>Recommended 5-Minute Tech Review Script:</span>
            </div>
            <p className="text-xs text-slate-300 italic font-sans leading-relaxed">
              "{slide.speakerNotes}"
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TECH_SLIDES.map((_, idx) => (
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
              onClick={() => setCurrentSlide(prev => Math.min(TECH_SLIDES.length - 1, prev + 1))}
              disabled={currentSlide === TECH_SLIDES.length - 1}
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
