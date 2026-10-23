const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchForecastEvaluation({
  dateFrom = '2026-01-01',
  dateTo = '2026-01-31',
  cutoffHour = 11,
  resolution = 'half_hourly',
  filterBy = 'delivery_date'
}) {
  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
    cutoff_hour: cutoffHour,
    resolution,
    filter_by: filterBy
  });
  const res = await fetch(`${API_BASE}/api/forecast/evaluation?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch forecast evaluation');
  }
  return res.json();
}

export async function fetchErrorHistogram({
  dateFrom = '2026-01-01',
  dateTo = '2026-01-31',
  cutoffHour = 11,
  bins = 25
}) {
  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
    cutoff_hour: cutoffHour,
    bins
  });
  const res = await fetch(`${API_BASE}/api/forecast/histogram?${params}`);
  if (!res.ok) throw new Error('Failed to fetch histogram');
  return res.json();
}

export async function fetchVintages({ deliveryDate = '2026-01-05', targetHour = 12 }) {
  const params = new URLSearchParams({
    delivery_date: deliveryDate,
    target_hour: targetHour
  });
  const res = await fetch(`${API_BASE}/api/forecast/vintages?${params}`);
  if (!res.ok) throw new Error('Failed to fetch vintages');
  return res.json();
}

export async function fetchProcurementPlan({
  deliveryDate = '2026-01-05',
  cutoffHour = 11,
  hedgingStrategy = 'conservative_p90',
  customBufferMw = null,
  demandScale = 1.0
}) {
  const params = new URLSearchParams({
    delivery_date: deliveryDate,
    cutoff_hour: cutoffHour,
    hedging_strategy: hedgingStrategy,
    demand_scale: demandScale
  });
  if (customBufferMw !== null && customBufferMw !== undefined) {
    params.append('custom_buffer_mw', customBufferMw);
  }
  const res = await fetch(`${API_BASE}/api/procurement/plan?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch procurement plan');
  }
  return res.json();
}

export function getExportCsvUrl({
  dateFrom = '2026-01-01',
  dateTo = '2026-01-31',
  cutoffHour = 11,
  resolution = 'half_hourly'
}) {
  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
    cutoff_hour: cutoffHour,
    resolution
  });
  return `${API_BASE}/api/export/csv?${params}`;
}
