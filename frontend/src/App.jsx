import React, { useState, useEffect } from 'react';
import {
  Zap,
  Flame,
  Calendar,
  BarChart2,
  Info,
  RefreshCw,
  ExternalLink,
  Shield,
  HelpCircle
} from 'lucide-react';

import Header from './components/Header';
import FilterBar from './components/FilterBar';
import KpiCard from './components/KpiCard';
import ForecastVsActualChart from './components/ForecastVsActualChart';
import ErrorAnalysisPanel from './components/ErrorAnalysisPanel';
import ThermalProcurementPlanner from './components/ThermalProcurementPlanner';
import MonthTrendChart from './components/MonthTrendChart';
import ClientPitchModal from './components/ClientPitchModal';
import TechReviewModal from './components/TechReviewModal';

import { fetchSystemStatus, fetchForecastEvaluation } from './services/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("UI Error caught by boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="h-16 w-16 bg-red-950/80 border border-red-700/60 rounded-2xl flex items-center justify-center text-red-400 mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong loading the dashboard</h2>
          <p className="text-xs text-slate-400 max-w-md mb-4 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'procurement' | 'month_trend'
  const [filters, setFilters] = useState({
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    cutoffHour: 11,
    resolution: 'half_hourly',
    filterBy: 'delivery_date'
  });

  const [selectedDay, setSelectedDay] = useState('2026-01-05');
  const [evalData, setEvalData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isPitchOpen, setIsPitchOpen] = useState(false);
  const [isTechReviewOpen, setIsTechReviewOpen] = useState(false);

  // Fetch system status on load
  useEffect(() => {
    fetchSystemStatus()
      .then(setSystemStatus)
      .catch((err) => console.warn('Status check warning:', err));
  }, []);

  // Fetch forecast evaluation whenever filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchForecastEvaluation(filters)
      .then((data) => {
        if (isMounted) {
          setEvalData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load evaluation data');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [filters]);

  const handleSelectDayFromTrend = (day) => {
    setSelectedDay(day);
    setFilters(prev => ({
      ...prev,
      dateFrom: day,
      dateTo: day
    }));
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        systemStatus={systemStatus}
        onOpenPitch={() => setIsPitchOpen(true)}
        onOpenTechReview={() => setIsTechReviewOpen(true)}
        currentFilters={filters}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Forecast Accuracy & Time Series</span>
              <span className="sm:hidden">Forecasts</span>
            </button>

            <button
              onClick={() => setActiveTab('procurement')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                activeTab === 'procurement'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">Thermal Procurement & Residual Demand</span>
              <span className="sm:hidden">Procurement</span>
            </button>

            <button
              onClick={() => setActiveTab('month_trend')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                activeTab === 'month_trend'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">January 2026 Trajectory</span>
              <span className="sm:hidden">Trajectory</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <span className="font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              Elexon: FUELHH & WINDFOR
            </span>
          </div>
        </div>

        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          isLoading={loading}
        />

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center justify-between">
            <span>Error: {error}</span>
            <button
              onClick={() => setFilters(prev => ({ ...prev }))}
              className="underline text-red-300 hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Executive KPI Ribbon */}
        <KpiCard metrics={evalData?.metrics} isLoading={loading && !evalData} />

        {/* Tab 1: Overview - Forecast vs Actual & Error Analysis */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ForecastVsActualChart
              timeSeries={evalData?.time_series || []}
              cutoffHour={filters.cutoffHour}
              resolution={filters.resolution}
            />

            <ErrorAnalysisPanel
              hourlyProfile={evalData?.hourly_profile || []}
              metrics={evalData?.metrics}
              filters={filters}
            />
          </div>
        )}

        {/* Tab 2: Thermal Procurement & Residual Demand */}
        {activeTab === 'procurement' && (
          <div className="space-y-6">
            <ThermalProcurementPlanner
              selectedDate={filters.dateFrom === filters.dateTo ? filters.dateFrom : selectedDay}
              cutoffHour={filters.cutoffHour}
            />

            <ForecastVsActualChart
              timeSeries={evalData?.time_series || []}
              cutoffHour={filters.cutoffHour}
              resolution={filters.resolution}
            />
          </div>
        )}

        {/* Tab 3: Full Month Trajectory */}
        {activeTab === 'month_trend' && (
          <div className="space-y-6">
            <MonthTrendChart
              dailyTrend={evalData?.daily_trend || []}
              onSelectDay={handleSelectDayFromTrend}
              selectedDate={selectedDay}
            />

            <ErrorAnalysisPanel
              hourlyProfile={evalData?.hourly_profile || []}
              metrics={evalData?.metrics}
              filters={filters}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-4 px-4 lg:px-8 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">UK GridFlex IQ</span>
            <span>•</span>
            <span>Elexon BMRS Data Engine (FUELHH + WINDFOR)</span>
            <span>•</span>
            <span>Purchase Decisions in January 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://bmrs.elexon.co.uk/api-documentation"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
            >
              Elexon BMRS Docs <ExternalLink className="h-3 w-3" />
            </a>
            <span>FastAPI Backend • React 18 • Docker</span>
          </div>
        </div>
      </footer>

      {/* Presentation Modals */}
      <ClientPitchModal
        isOpen={isPitchOpen}
        onClose={() => setIsPitchOpen(false)}
      />

      <TechReviewModal
        isOpen={isTechReviewOpen}
        onClose={() => setIsTechReviewOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
