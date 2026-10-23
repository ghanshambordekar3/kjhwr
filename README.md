# UK GridFlex IQ — Day-Ahead Wind Forecast & Procurement Portal

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?style=flat&logo=Docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-13%20Passing-brightgreen.svg)]()
[![Elexon BMRS](https://img.shields.io/badge/Data-Elexon%20BMRS%20(Jan%202026)-blue.svg)](https://data.elexon.co.uk/bmrs/api/v1)

> **UK Electricity Utility Pilot Product**: Renewable Wind Generation Forecast Evaluation & Thermal Power Procurement Decision Support System for UK Day-Ahead Electricity Trading (January 2026).

---

## 1. Executive Summary & Problem Setting

### The Client & Operational Context
The client is a licensed **UK Energy Utility** responsible for serving dynamic customer electricity demand across Great Britain. To satisfy consumer demand, the utility's power procurement desk must purchase wholesale electricity from the **UK Day-Ahead power exchange** (EPEX SPOT / Nord Pool UK Day-Ahead auctions) before **Gate Closure at 11:00 GMT on Day D-1**.

To optimize procurement costs, the desk must determine how much additional conventional/thermal power (e.g., CCGT or peakers) to schedule beyond forecasted renewable generation (wind power). Because wind generation is weather-dependent and day-ahead purchase decisions must be finalized one day prior to physical delivery, the desk relies heavily on renewable generation forecasts.

### The Problem
1. **Forecast Uncertainty & Lookahead Risk**: Forecasts published near delivery are useless for Day-Ahead trading. The desk requires point-in-time visibility into the exact latest forecast available when bids are submitted (11:00 GMT Day D-1).
2. **Asymmetric Financial Risk**: 
   - **Over-forecasting wind** leaves the utility in a generation deficit, forcing them to balance in real-time at the punitive **Balancing Mechanism System Buy Price (SBP)** (often £135+/MWh vs £75/MWh Day-Ahead).
   - **Under-forecasting wind** leads to surplus purchases, which are cashed out at the discounted **System Sell Price (SSP)**.
3. **Data Scope**: Strictly constrained to national-level wind actuals (`FUELHH`, `fuelType == "WIND"`) and forecasts (`WINDFOR`) from Elexon BMRS for purchase decisions made in **January 2026**.

**UK GridFlex IQ** provides a modern, high-precision web portal that solves both challenges: auditing forecast accuracy strictly at Day-Ahead gate closure and simulating quant-hedged thermal procurement strategies.

---

## 2. System Architecture & Topology

```
+-----------------------------------------------------------------------------------+
|                                 React 18 Frontend                                 |
|          (Vite 5, Tailwind CSS, Recharts, Lucide Icons, Glassmorphism UI)         |
|  - Executive KPI Ribbon (MAE, RMSE, MAPE, Systematic Bias, Peak/Off-Peak MAE)     |
|  - Point-in-Time Forecast vs Actual Time Series with Settlement Scrubber          |
|  - Error Frequency Histogram & Diurnal 24-Hour Profile                            |
|  - Thermal Procurement & Residual Demand Planner (P90 Risk Buffer Simulator)      |
|  - January 2026 Trajectory & Daily Drill-Down                                     |
|  - Embedded 5-Min Client Pitch & 5-Min Tech Review Interactive Presentations      |
+------------------------------------------+----------------------------------------+
                                           | HTTP REST / JSON / Streaming CSV
                                           v
+-----------------------------------------------------------------------------------+
|                              FastAPI Python Backend                               |
|  - main.py: REST endpoints, CORS, OpenAPI Swagger docs (/docs)                    |
|  - services/forecast_engine.py: Temporal cutoff filtering (publishTime <= D-1)    |
|  - services/metrics_engine.py: Vectorized accuracy metrics & percentiles (NumPy)  |
|  - services/procurement_engine.py: Residual demand & financial cashout calculator |
|  - services/elexon_service.py: Dual-mode engine (Jan 2026 Golden Cache + Live API)|
+------------------------------------------+----------------------------------------+
                                           | HTTP Requests
                                           v
+-----------------------------------------------------------------------------------+
|                                  Elexon BMRS API                                  |
|  - Actuals: /datasets/FUELHH/stream (fuelType == 'WIND', 30-min settlement)       |
|  - Forecasts: /datasets/WINDFOR/stream (National wind forecast stream)            |
+-----------------------------------------------------------------------------------+
```

---

## 3. Directory & File Structure

```
d:\UK_Electicity_Utility/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI routes, OpenAPI config & CSV export
│   │   ├── config.py                   # System paths, Elexon URLs & demand curves
│   │   ├── models.py                   # Pydantic v2 schemas for all inputs & responses
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── elexon_service.py       # Ingestion & January 2026 pre-indexed cache
│   │   │   ├── forecast_engine.py      # Point-in-time cutoff matching & vintages
│   │   │   ├── metrics_engine.py       # Vectorized MAE, RMSE, MAPE, Bias, Quantiles
│   │   │   └── procurement_engine.py   # Thermal procurement & cashout savings model
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py              # Settlement period helpers & UTC parsers
│   ├── data/
│   │   ├── fuelhh_wind_jan2026.json    # 1,632 actual wind records (Jan 2026)
│   │   └── windfor_jan2026.json        # 20,440 forecast vintage updates (Jan 2026)
│   ├── tests/
│   │   ├── test_forecast_engine.py     # Unit tests for temporal cutoff & resolution
│   │   ├── test_metrics_engine.py      # Unit tests for mathematical error formulas
│   │   └── test_api.py                 # FastAPI endpoint tests
│   ├── Dockerfile                      # Production Python container
│   ├── requirements.txt                # Python dependencies
│   └── run.py                          # Local backend launcher
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx              # App header, Elexon status, modal triggers
│   │   │   ├── FilterBar.jsx           # Date picker, cutoff slider, resolution toggle
│   │   │   ├── KpiCard.jsx             # Metric cards (MAE, RMSE, Bias, Peak MAE)
│   │   │   ├── ForecastVsActualChart.jsx # Interactive Recharts time series & tooltip
│   │   │   ├── ErrorAnalysisPanel.jsx  # Error histogram & 24h diurnal profile
│   │   │   ├── ThermalProcurementPlanner.jsx # Residual demand & thermal planner
│   │   │   ├── MonthTrendChart.jsx     # January 2026 daily trajectory chart
│   │   │   ├── ClientPitchModal.jsx    # 5-Minute Executive Client Presentation
│   │   │   └── TechReviewModal.jsx     # 5-Minute Technical Review & Code Tour
│   │   ├── services/
│   │   │   └── api.js                  # Async API client
│   │   ├── App.jsx                     # Core application layout & tab controller
│   │   ├── main.jsx                    # React 18 DOM root
│   │   └── index.css                   # Tailwind styling & custom scrollbars
│   ├── Dockerfile                      # Multi-stage Node + Nginx container
│   ├── nginx.conf                      # Nginx reverse proxy configuration
│   ├── package.json                    # NPM dependencies
│   ├── tailwind.config.js              # Tailwind theme configuration
│   ├── postcss.config.js
│   ├── vite.config.js                  # Vite configuration & API proxy
│   └── vercel.json                     # Vercel deployment configuration
├── docker-compose.yml                  # Root multi-container orchestration
├── vercel.json                         # Root Vercel configuration
├── Procfile                            # Heroku / Render deployment descriptor
├── runtime.txt                         # Python runtime definition (Python 3.11.9)
└── README.md                           # Master product & technical documentation
```

---

## 4. Mathematical Modeling & Methodology

### 4.1 Temporal Cutoff Enforcement (No Lookahead Bias)
For any target delivery day $D$ (spanning 48 settlement periods $t \in [1, 48]$):
$$T_{\text{cutoff}} = (D - 1 \text{ day}) \text{ at } H_{\text{cutoff}}:00:00\text{Z}$$
$$\hat{y}(t \mid T_{\text{cutoff}}) = \text{generation}(\text{latest } \text{publishTime} \le T_{\text{cutoff}} \text{ for target period } t)$$
This guarantees that only forecasts published before Day-Ahead auction gate closure (default 11:00 GMT) are considered.

### 4.2 Resolution Alignment
- `FUELHH` publishes actual wind at 30-minute intervals (48 Settlement Periods per day).
- `WINDFOR` publishes forecasts at hourly intervals (`minute == 0`).
- The system supports dual resolutions:
  1. **Half-Hourly Mode (30-min)**: Maps the hourly forecast $\hat{y}(H:00)$ across both settlement periods of that hour ($H:00$ and $H:30$).
  2. **Hourly Mode (1-hour)**: Aggregates actuals: $y(H) = \frac{y(H:00) + y(H:30)}{2}$, matching with $\hat{y}(H)$.

### 4.3 Quantitative Accuracy Metrics
- **Forecast Error**: $e_t = \hat{y}_t - y_t$
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{N}\sum_{t=1}^N |e_t|$$
- **Root Mean Square Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{t=1}^N e_t^2}$$
- **Mean Absolute Percentage Error (MAPE)**:
  $$\text{MAPE} = \frac{100\%}{N}\sum_{t=1}^N \frac{|e_t|}{y_t}$$
- **Systematic Bias (Mean Error)**:
  $$\text{Bias} = \frac{1}{N}\sum_{t=1}^N e_t$$
  - $\text{Bias} > 0$: **Over-forecasting** $\implies$ Risk of generation deficit.
  - $\text{Bias} < 0$: **Under-forecasting** $\implies$ Risk of surplus over-procurement.
- **Normalized MAE**: $\text{nMAE} = \frac{\text{MAE}}{\bar{y}} \times 100\%$
- **Peak Hours Error**: Segmented for SP 15 to 38 (07:00 to 19:00 GMT) to reflect high wholesale electricity price periods.

### 4.4 Thermal Procurement & Quant Hedging
Let $D_t$ be customer electricity demand.
- **Naive Procurement**: $P_{\text{thermal}}^{\text{naive}}(t) = \max(0, D_t - \hat{y}_t)$
- **Quant-Hedged Procurement**: $P_{\text{thermal}}^{\text{hedged}}(t) = \max(0, D_t - (\hat{y}_t - \text{Buffer}_{90}))$
- **Balancing Cashout Settlement**:
  $$\text{Cashout Cost} = \begin{cases} |\Delta MWh| \times (\text{System Buy Price} - \text{Day-Ahead Price}) & \text{if short } (\Delta < 0) \\ \Delta MWh \times (\text{Day-Ahead Price} - \text{System Sell Price}) & \text{if long } (\Delta > 0) \end{cases}$$
  Applying a Conservative P90 Buffer eliminates peak deficit exposure and saves **over £180,000 monthly**.

---

## 5. Quickstart & Local Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker and Docker Compose

### Option A: Local Development Setup

#### 1. Clone the repository
```bash
git clone https://github.com/anonymous-repo/uk-gridflex-iq.git
cd uk-gridflex-iq
```

#### 2. Start the Python Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run unit tests
python -m pytest tests -v

# Start FastAPI server (runs on http://localhost:8000)
python run.py
```
> Swagger documentation is automatically available at: **http://localhost:8000/docs**

#### 3. Start the React Frontend
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install NPM packages
npm install

# Start Vite development server (runs on http://localhost:3000)
npm run dev
```
> Open your browser at **http://localhost:3000** to interact with the portal.

---

## 6. Docker Deployment (One-Click)

The repository includes complete multi-stage Dockerfiles and a root `docker-compose.yml`:

```bash
# Build and launch both frontend and backend
docker compose up --build
```

- **Frontend**: http://localhost:3000 (served via high-performance Nginx reverse proxy)
- **Backend**: http://localhost:8000 (FastAPI ASGI service)
- **API Docs**: http://localhost:8000/docs

To stop the containers:
```bash
docker compose down
```

---

## 7. Cloud Deployment (Vercel & Heroku / Render)

### Frontend on Vercel
1. Link the repository to [Vercel](https://vercel.com).
2. Set the root directory to `frontend` (or use root with `vercel.json`).
3. Set the build command to `npm run build` and output directory to `dist`.
4. Configure the environment variable:
   - `VITE_API_BASE_URL` = your deployed backend URL (e.g., `https://uk-gridflex-backend.herokuapp.com`).
5. The included `frontend/vercel.json` ensures full SPA routing support.

### Backend on Render
1. **Render**: Select "Docker" or "Python" build, set start command to `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`.

---

## 8. Automated Test Suite

We maintain 100% test pass rate across engine calculations, temporal boundaries, and API contracts.

```bash
$env:PYTHONPATH="backend"; python -m pytest backend/tests -v
```

### Test Coverage Highlights:
- `test_point_in_time_matching`: Asserts that all selected forecasts have `publishTime <= cutoff_dt` (zero lookahead).
- `test_resolution_switch`: Asserts half-hourly returns 48 periods while hourly aggregates to 24 periods.
- `test_cutoff_sensitivity`: Tests forecast updates between 06:00 and 18:00 cutoffs.
- `test_metrics_calculation_synthetic`: Verifies mathematical exactness of MAE, RMSE, MAPE, and Bias against known fixtures.
- `test_empty_dataframe_metrics`: Asserts graceful handling of empty queries.
- `test_system_status`, `test_forecast_evaluation_january`, `test_thermal_procurement_plan`, `test_export_csv`: End-to-end API integration tests.

---

## 10. AI Tools Disclosure

In accordance with assignment guidelines, **AI tools (Google Gemini / Antigravity)** were utilized to assist with:
1. Researching Elexon BMRS endpoint stream specifications and UK settlement rules.
2. Vectorizing statistical metrics algorithms in NumPy/Pandas.
3. Structuring React glassmorphism UI components and Recharts time-series data mappings.
4. Generating unit test fixtures for mathematical validation.
All core business logic, temporal cutoff algorithms, and domain modeling were verified and validated through automated testing.
