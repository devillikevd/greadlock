# 🚦 AI Traffic Copilot — Advanced Smart Traffic Command Center

> A futuristic traffic orchestration platform designed for Bengaluru Smart City operations, with AI-assisted decision support, emergency corridor control, and a highly polished Vercel production deployment.

---

## 🌐 Live Production

- **Production URL:** https://ai-traffic-copilot-prod.vercel.app
- **Repository:** https://github.com/devillikevd/greadlock

---

## 🧠 Overview

AI Traffic Copilot is a premium, enterprise-grade traffic management interface built on modern frontend architecture.
The app combines advanced dashboard analytics, simulated AI traffic assistance, emergency management, and public portal access — all delivered as a production-ready Vite application.

This README is written as a “3D” command center briefing, with layered sections that describe the platform like a product launch document.

---

## ✨ Core Experience

### Traffic Operations Command Center
- Enterprise-grade **traffic status dashboard** with live density, speed, and trend indicators.
- Intelligent **junction cards** for rapid status assessment and incident prioritization.
- Deep analytics for **signal performance**, **vehicle throughput**, and **congestion heatmaps**.

### Advanced AI Copilot Assistant
- In-app conversation interface for traffic operations queries.
- Sample AI responses for traffic status, incident summaries, and predictions.
- Simulated reasoning flow that mimics a command center intelligence assistant.

### Emergency Corridor Command
- Dedicated **emergency corridor** workflow for rapid response coordination.
- Visual escalation control for incident deployment and safety prioritization.
- Emergency event status tracking built directly into the platform.

### Public & Authority Views
- **Secure role-based access** for traffic police roles and public users.
- **Public portal mode** for citizen-facing traffic awareness and status updates.
- Internal security flow to keep command center actions isolated from read-only public mode.

### Predictive Simulation & Signal Control
- Built-in **signal simulator** for scenario analysis and training.
- Predictive traffic forecast indicators across junctions.
- Simulated control actions for signal phase and routing recommendations.

---

## 🏗️ Architecture & Technology

This product is built with a modern, high-performance frontend stack:

- **React 19** for reactive UI composition
- **TypeScript 6** for strict typings and developer agility
- **Vite 8** for instant startup and optimized production builds
- **Tailwind CSS 4** for expressive yet maintainable UI design
- **Zustand** for fast, minimal global state management
- **Recharts** for rich data visualization
- **Lucide React** icon system for consistent UI glyphs
- **Framer Motion** for refined animations and interface polish

---

## 🧩 Repository Structure

```text
AI Traffic Management/
├── src/
│   ├── components/        # reusable widgets and UI building blocks
│   ├── layouts/           # shell components for application layout
│   ├── pages/             # feature pages for dashboard, AI chat, and portal
│   ├── store/             # global app state and persistence logic
│   ├── App.tsx            # router, protected routes, and app shell wiring
│   ├── main.tsx           # React hydration entrypoint
│   └── index.css          # global styling and Tailwind imports
├── package.json           # npm scripts, dependencies, and project metadata
├── vercel.json            # Vercel static deployment configuration
├── tsconfig.json          # TypeScript compiler settings
└── README.md              # product and deployment documentation
```

---

## 🚀 Deployment Flow

This application is deployed as a static Vercel project.
The `vercel.json` file guarantees:
- correct priority for static asset resolution,
- client-side router fallback to `index.html`,
- production-ready build path to `dist/`.

### Production Commands

```bash
npm install
npm run build
vercel --prod
```

### Render Deployment (Full Stack)

A Render deployment configuration has been added in `render.yaml` to deploy both the frontend and backend as separate web services.

The Render services use:
- frontend: `npm install && npm run build`, `npm run preview -- --host 0.0.0.0 --port 10000`
- backend: `pip install -r backend/requirements.txt`, `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`

#### Render deployment steps

1. Push the repository to GitHub.
2. Open https://render.com and connect your GitHub account to the repo.
3. Create services from `render.yaml` or add them manually:
   - Frontend service: `Node` environment.
   - Backend service: `Python` environment.
4. Set the backend service URL as `VITE_API_BASE_URL` in the frontend service environment.
5. Configure backend environment variables in Render:
   - `DATABASE_URL`
   - `DATABASE_SYNC_URL`
   - `REDIS_URL`
   - `GEMINI_API_KEY`
   - `SECRET_KEY`
   - `OPENWEATHER_API_KEY`
6. Deploy and test the frontend against the live backend URL.

> Note: `render.yaml` currently includes placeholder database/Redis values. Replace them with your actual Render-managed Postgres/Redis or external service URLs.


---

## 🛠️ Feature Breakdown

### Command Center Features
- **Dashboard:** Live analytics, junction map, KPI summaries, and operational alerts.
- **Junctions:** Drill-down view of each junction’s traffic density, average speed, incident status, and historical state.
- **Reports:** Download-ready analytics summaries and data review interface.
- **Settings:** Role-aware configuration and user context management.

### AI Traffic Operations
- **AI Chat:** Context-aware assistance for traffic operations queries.
- **Simulated intelligence:** Preloaded conversational examples with traffic insights.
- **Operational decision prompts:** Guidance for traffic rules, incident response, and signal recommendations.

### Emergency & Simulation
- **Emergency Corridor:** Rapid response dashboard with prioritization and status control.
- **Signal Simulator:** Simulated traffic signal behavior for training and scenario modeling.
- **Public Portal:** Citizen-facing dashboard for traffic status and public alerts.

---

## 🎯 Why this is advanced

1. **AI-ready UX:** The UI is designed around a traffic copilot persona.
2. **Production deployment:** Deployed on Vercel with proper static asset routing.
3. **Role-based platform:** Supports internal traffic authority roles and public access.
4. **Modular architecture:** Clean separation of layout, pages, state, and components.

---

## 📌 Notes & Next Steps

- Current production endpoint: `https://ai-traffic-copilot-prod.vercel.app`
- GitHub remote is configured for `https://github.com/devillikevd/greadlock`

### Suggested next upgrades
- Add a **real backend** integration for live sensor and incident feeds.
- Add **authentication and permissions** for secure operations.
- Add **analytics alerts** and anomaly detection.
- Add **multi-city support** for large-scale traffic operations.

---

## 🧰 Local Development

```bash
npm install
npm run dev
```

Open the local Vite URL after startup.

---

## 📈 Production Build

```bash
npm run build
```

The final production output is generated under the `dist/` directory.
