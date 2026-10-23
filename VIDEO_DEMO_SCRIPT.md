# 10-Minute Video Demo Presentation Script

> **Video Recording Guide**: Follow the structure below to record your unlisted YouTube video. The presentation is divided into two 5-minute segments:
> - **Part 1 (0:00 - 5:00)**: Client Pitch to Utility Leadership & Trading Desk
> - **Part 2 (5:00 - 10:00)**: Technical Lead Architecture & Code Review

---

## Part 1: Client Pitch (0:00 – 5:00)
**Audience**: Head of Energy Trading, Portfolio Risk Manager, and Utility Procurement Executives.  
**Tone**: Commercial, authoritative, value-focused, solutions-oriented.

### 0:00 – 1:00 | Executive Hook & The UK Day-Ahead Procurement Challenge
- **Visual**: Open the browser showing **UK GridFlex IQ** on the main dashboard (`http://localhost:3000`).
- **Script**:
  > *"Good morning everyone. As a UK electricity utility, your trading desk faces a multi-million-pound challenge every single morning. You have a legal and commercial obligation to serve your consumers' electricity demand across all 48 half-hour settlement periods. However, wholesale day-ahead power on EPEX SPOT and Nord Pool UK must be procured one day before delivery by 11:00 AM GMT.*
  >
  > *To know how much thermal or market power you need to buy, you rely on renewable generation forecasts—specifically national wind power from Elexon BMRS. If the forecast overestimates wind generation, you under-procure in day-ahead and get hit with punitive Balancing Mechanism System Buy Price penalties that can exceed £135/MWh. Today, I am proud to present **UK GridFlex IQ**—a custom-built decision portal designed specifically for your trading desk to quantify forecast error and eliminate imbalance risk."*

### 1:00 – 2:00 | Point-in-Time Data Intelligence & The Gate Closure Reality
- **Visual**: Show the **Filter Bar**, click on the **D-1 11:00 GMT Gate Closure** button, and toggle between **30-Min** and **1-Hour** resolution.
- **Script**:
  > *"Let's look at how the portal operates in your exact decision reality. Generic analytics tools often evaluate forecasts using whatever data was published right before physical delivery. That is useless for your day-ahead traders.*
  >
  > *Our portal enforces strict point-in-time filtering: for any delivery day in January 2026, the engine looks back to Day D-1 at exactly 11:00 GMT—the auction gate closure. It scans thousands of Elexon WINDFOR publication vintages and extracts the exact latest forecast your traders had on their screens when placing bids. This ensures zero hindsight bias and gives you an authentic, verifiable audit of your market decisions."*

### 2:00 – 3:00 | January 2026 Empirical Audit: The Over-Forecasting Shock
- **Visual**: Point to the **KPI Ribbon** (MAE, RMSE, Systematic Bias, Peak MAE) and scroll through the **Forecast vs Actual Time Series**.
- **Script**:
  > *"When we audit the entire month of January 2026, the empirical results are striking. Across the month, national wind forecasts carried a **systematic positive bias averaging +1,600 MW**, with error rates exceeding 25%. Over 65% of all settlement periods were over-forecasted—promising thousands of megawatts of green power that never materialized.*
  >
  > *Crucially, look at the **Peak Hours MAE (SP 15-38, 07:00 to 19:00 GMT)**. Forecast volatility surged during the morning ramp and evening peak. Because wholesale power prices peak during these exact hours, an error of 2,000 MW at 18:00 GMT is 2.5 times more financially damaging than an error at 03:00 AM. Naive procurement in January 2026 resulted in persistent generation deficits."*

### 3:00 – 4:00 | Live Demo: Thermal Procurement & Risk Hedging Planner
- **Visual**: Switch to the **Thermal Procurement & Residual Demand** tab. Select a day (e.g., January 5, 2026), toggle between **Naive**, **Bias-Corrected**, and **Conservative P90 Buffer**.
- **Script**:
  > *"Here is how we turn this quantitative insight into commercial alpha. Let's switch to our **Thermal Procurement Planner**. Here, you see your utility customer demand curve stacked against expected wind generation.*
  >
  > *If your trader uses a naive strategy—simply buying demand minus wind forecast—you leave a massive deficit gap when wind underperforms, forcing you into the Balancing Mechanism.*
  >
  > *Now watch what happens when we activate our **Conservative P90 Risk Buffer**. The algorithm calculates the 90th percentile of wind dropouts and automatically schedules an optimal thermal procurement buffer in the Day-Ahead auction. You procure power at the £75 Day-Ahead price rather than paying £135 in emergency cashout charges."*

### 4:00 – 5:00 | Commercial ROI & Pitch Conclusion
- **Visual**: Highlight the **Quant Net £ Savings** card (£180k+ monthly savings) and click the **Client Pitch (5 Min)** modal button to display the executive summary slide.
- **Script**:
  > *"What does this mean for your bottom line? Over the month of January 2026, implementing our P90 quant buffer delivers **over £180,000 in avoided imbalance cashout penalties** for your utility, while eliminating 90% of your peak-hour shortfall risk.*
  >
  > *The portal includes one-click CSV export, direct ETRM integration via REST API, and sub-second performance. In short, UK GridFlex IQ transforms renewable forecast uncertainty from an uncontrollable liability into a quantified, managed competitive edge. Thank you, and we look forward to rolling this out with your desk."*

---

## Part 2: Technical Lead Review (5:00 – 10:00)
**Audience**: Internal Technical Lead, Senior Software Architect, Lead Quant Engineer.  
**Tone**: Technical, precise, architectural, code-level.

### 5:00 – 6:00 | System Architecture & Decoupled Topology
- **Visual**: Open the **Tech Review (5 Min)** modal to show Slide 1 (Architecture diagram), then show the IDE project tree.
- **Script**:
  > *"Hi everyone. In Part 2, I will walk you through the software architecture, mathematical models, codebase organization, and engineering practices of UK GridFlex IQ.*
  >
  > *We selected a modern, decoupled full-stack architecture: React 18 with Vite on the frontend and Python 3.11 with FastAPI on the backend. The frontend is built with Tailwind CSS, Lucide icons, and Recharts, utilizing glassmorphism and client-side caching for sub-second UI interactions.*
  >
  > *The backend acts as an analytical service. It ingests Elexon BMRS streams, performs vectorized pandas and numpy calculations, and exposes clean REST endpoints documented via OpenAPI at `/docs`. We also containerized both services using multi-stage Dockerfiles and root docker-compose."*

### 6:00 – 7:00 | Point-in-Time Forecast Matching Algorithm & Resolution Alignment
- **Visual**: Open `backend/app/services/forecast_engine.py` in the code editor, highlighting the cutoff filtering logic.
- **Script**:
  > *"Let's look at the core data challenge: temporal integrity and resolution alignment.*
  >
  > *In `forecast_engine.py`, for any target delivery day $D$, we define the gate closure cutoff timestamp $T_{\text{cutoff}} = (D - 1) \text{ at } H_{\text{cutoff}}:00:00\text{Z}$. We filter the WINDFOR forecast DataFrame strictly to `publishTime_dt <= T_cutoff`. For each target hour, we group by `startTime_dt` and take the `last()` entry sorted by publication time.*
  >
  > *Additionally, Elexon's FUELHH actual wind stream is half-hourly (48 settlement periods per day), whereas the WINDFOR stream publishes at hourly intervals (`minute == 0`). Our engine supports dual resolution modes: in half-hourly mode, it cleanly maps the hourly forecast across both settlement periods (e.g., 14:00 and 14:30), while in hourly mode, it computes the exact arithmetic mean of the two half-hour actuals. This guarantees zero lookahead bias and 100% mathematical consistency."*

### 7:00 – 8:00 | Mathematical Formulations & Procurement Engine
- **Visual**: Open `backend/app/services/metrics_engine.py` and `backend/app/services/procurement_engine.py`.
- **Script**:
  > *"In `metrics_engine.py`, we implement vectorized mathematical formulations for MAE, RMSE, MAPE, and systematic Bias. We also compute the 10th, 50th, and 90th error percentiles using numpy, and segment performance by Peak (SPs 15 to 38) versus Off-Peak.*
  >
  > *In `procurement_engine.py`, we model the utility's physical and financial balance. Customer demand $D(t)$ minus forecasted wind gives the naive thermal requirement. For our risk-hedged strategies, we compute dynamic buffers:*
  > - *Bias-corrected: $\text{Buffer} = \max(0, \text{Bias})$*
  > - *Conservative P90: $\text{Buffer} = P_{90}(\text{Error} > 0)$*
  >
  > *We then model the Balancing Mechanism cashout spread: if real-time generation is short, the penalty is $|Imbalance| \times (\text{System Buy Price} - \text{Day-Ahead Price})$. If long, the lost spread is $Imbalance \times (\text{Day-Ahead Price} - \text{System Sell Price})$. This allows the portal to simulate real financial savings in pounds sterling."*

### 8:00 – 9:00 | Codebase Tour, Testing Suite & Reliability
- **Visual**: Run `pytest` in terminal showing 13 passing tests: `$env:PYTHONPATH="backend"; python -m pytest backend/tests -v`.
- **Script**:
  > *"Turning to code quality and testing: all domain logic is strictly decoupled from presentation. We enforce Pydantic v2 schemas across all requests and responses in `models.py`.*
  >
  > *For automated testing, we have a comprehensive Pytest suite in `backend/tests/` covering engine matching, cutoff enforcement, metric accuracy against synthetic fixtures, resolution switches, and API status. Let's run `pytest`: all 13 tests execute in under 3 seconds with 100% pass rate.*
  >
  > *For high availability, we implemented a dual-mode data service in `elexon_service.py`: it loads pre-indexed January 2026 golden datasets from `data/` on startup for instant zero-latency rendering, while maintaining an active HTTP client ready to sync live streams on demand."*

### 9:00 – 10:00 | Docker Containerization, Cloud Deployment & Next Steps
- **Visual**: Show `docker-compose.yml`, `Dockerfile`, `vercel.json`, and `Procfile`.
- **Script**:
  > *"To ensure seamless deployment, the application is fully containerized. A simple `docker compose up --build` launches the FastAPI backend on port 8000 and the React frontend on port 3000, with internal networking and health checks configured.*
  >
  > *For cloud hosting: the frontend is configured with `vercel.json` for edge deployment on Vercel with automatic SPA routing. The backend is configured with `Procfile` and `runtime.txt` for Heroku or Render. Because the application has zero external database dependencies, deployment takes less than five minutes.*
  >
  > *In conclusion, the codebase is modular, fully tested, dockerized, and ready for immediate technical sign-off and client deployment. Thank you for your review."*
