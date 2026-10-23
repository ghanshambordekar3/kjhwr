import React from 'react';
import { Presentation, Code2, Download, Zap } from 'lucide-react';
import { getExportCsvUrl } from '../services/api';

export default function Header({
  systemStatus,
  onOpenPitch,
  onOpenTechReview,
  currentFilters
}) {
  const handleExport = () => {
    const url = getExportCsvUrl({
      dateFrom: currentFilters.dateFrom,
      dateTo: currentFilters.dateTo,
      cutoffHour: currentFilters.cutoffHour,
      resolution: currentFilters.resolution
    });
    window.open(url, '_blank');
  };

  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20 shrink-0">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                UK GridFlex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">IQ</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 whitespace-nowrap">
                UK Day-Ahead Power
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              Elexon BMRS Wind Forecast Accuracy & Thermal Procurement Portal (January 2026)
            </p>
          </div>
        </div>

        {/* Action Controls & Presentation Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5 justify-between sm:justify-end">
          {/* Elexon Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] sm:text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-mono text-[10px] sm:text-[11px] text-slate-400 hidden sm:inline">Elexon:</span>
            <span className="text-emerald-400 font-medium">LIVE • Jan 2026</span>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-medium transition active:scale-95"
            title="Download matched data as CSV"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="hidden xs:inline">Export</span> CSV
          </button>

          {/* 5-Min Client Pitch Modal Trigger */}
          <button
            onClick={onOpenPitch}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] sm:text-xs font-semibold shadow-md shadow-cyan-900/30 transition border border-cyan-400/30 active:scale-95"
          >
            <Presentation className="h-3.5 w-3.5 text-white shrink-0" />
            <span className="hidden sm:inline">Client Pitch (5 Min)</span>
            <span className="sm:hidden">Pitch</span>
          </button>

          {/* 5-Min Tech Lead Review Modal Trigger */}
          <button
            onClick={onOpenTechReview}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-[11px] sm:text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Code2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Tech Review (5 Min)</span>
            <span className="sm:hidden">Review</span>
          </button>
        </div>
      </div>
    </header>
  );
}
