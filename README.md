# OCPP EV Charging Management Dashboard

A production-quality admin dashboard frontend for an EV charging management platform powered by an OCPP 1.6J backend API.

## ✨ Features

- **Real-time monitoring** — Live charge point status, power consumption, and session tracking
- **Analytics** — Daily/monthly energy charts, session trends, availability rates
- **Charge Points** — Full CRUD view with table/grid toggle, status filtering, and detail pages
- **Transactions** — Session history with filterable table and slide-in detail drawer
- **OCPP Messages** — Raw protocol log viewer with expandable JSON payloads
- **AI Insights** — Energy forecasting and anomaly detection module (API-ready)
- **Settings** — System health monitoring, environment info, and preference placeholders
- **Responsive** — Mobile-first design with collapsible sidebar and mobile drawer

## 🛠 Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tooling |
| Tailwind CSS v4 | Styling |
| React Router v6 | Client-side routing |
| TanStack Query v5 | API state management + caching |
| Axios | HTTP client |
| Recharts | Data visualization |
| Lucide React | Icons |
| date-fns | Date formatting |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Your OCPP backend running (see [Backend Setup](#backend-setup))

### Installation

```bash
# Clone / navigate to the dashboard directory
cd ocpp-dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and set your backend URL
# VITE_API_BASE_URL=http://localhost:3000
```

### Running Locally

```bash
npm run dev
```

The dashboard opens at **http://localhost:5173**

### Build for Production

```bash
npm run build
npm run preview
```

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of your OCPP backend REST API |

## 🗂 Project Structure

```
src/
├── api/                  # Axios service modules per domain
│   ├── client.ts         # Axios instance with interceptors
│   ├── health.ts
│   ├── chargePoints.ts
│   ├── transactions.ts
│   ├── stats.ts
│   ├── messages.ts
│   └── ai.ts
│
├── components/           # Reusable UI components
│   ├── StatCard.tsx
│   ├── StatusBadge.tsx
│   ├── ChartCard.tsx
│   ├── PageHeader.tsx
│   ├── SearchInput.tsx
│   ├── Pagination.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── LoadingSkeleton.tsx
│   └── JsonViewer.tsx
│
├── hooks/                # React Query data hooks
│   ├── useStats.ts
│   ├── useChargePoints.ts
│   ├── useTransactions.ts
│   ├── useMessages.ts
│   └── useAi.ts
│
├── layouts/              # App shell components
│   ├── AppLayout.tsx     # Main layout (sidebar + header + content)
│   ├── Sidebar.tsx       # Collapsible navigation
│   └── Header.tsx        # Top bar with health indicator
│
├── pages/                # Route-level page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ChargePointsPage.tsx
│   ├── ChargePointDetailPage.tsx
│   ├── TransactionsPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── MessagesPage.tsx
│   ├── AiInsightsPage.tsx
│   └── SettingsPage.tsx
│
├── types/
│   └── index.ts          # TypeScript domain types
│
├── utils/
│   ├── formatters.ts     # Date, energy, duration formatters
│   └── status.ts         # Status → color/badge mapping
│
├── App.tsx               # Route definitions
├── main.tsx              # Entry point with providers
└── index.css             # Global styles + Tailwind theme
```

## 📄 Pages Overview

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Auth-ready login UI with demo bypass |
| `/dashboard` | Overview | KPI cards, energy/session charts, health widget |
| `/charge-points` | Charge Points | List/grid view, search, status filter, pagination |
| `/charge-points/:id` | CP Detail | Tabbed detail: overview, history, meter values, transactions |
| `/transactions` | Transactions | Filterable table, detail drawer |
| `/analytics` | Analytics | Deep chart suite — energy, sessions, availability, status donut |
| `/messages` | OCPP Messages | Protocol log with expandable JSON viewer |
| `/ai-insights` | AI Insights | Forecast & anomaly detection module |
| `/settings` | Settings | Health, environment, theme, notification preferences |

## 🔌 Backend API Endpoints

The dashboard consumes these endpoints from `VITE_API_BASE_URL`:

```
GET /api/health
GET /api/charge-points
GET /api/charge-points/:chargePointId
GET /api/charge-points/:chargePointId/status-history
GET /api/charge-points/:chargePointId/meter-values
GET /api/charge-points/:chargePointId/transactions
GET /api/transactions
GET /api/transactions/:transactionId
GET /api/transactions/summary/overview
GET /api/stats/overview
GET /api/stats/energy/daily
GET /api/stats/energy/monthly
GET /api/stats/sessions/daily
GET /api/stats/power/realtime
GET /api/stats/status/distribution
GET /api/stats/availability
GET /api/messages
GET /api/messages/:id
GET /api/ai/forecast-energy
GET /api/ai/anomaly-detection
```

## 🎨 Design System

| Token | Value |
|---|---|
| Sidebar | Dark navy `#0d1526 → #111d35` |
| Background | Soft slate `#f1f5f9` |
| Primary | Electric blue `#3b82f6` |
| Success | Emerald `#10b981` |
| Warning | Amber `#f59e0b` |
| Danger | Rose `#f43f5e` |
| Font | Inter (Google Fonts) |

## 📝 Notes

- **Authentication**: The login page pre-fills credentials and bypasses auth for demo purposes. JWT auth can be wired into `src/api/client.ts` interceptors.
- **AI endpoints**: The AI Insights page works with both live backend responses and graceful fallback demo data when endpoints are unavailable.
- **Real-time**: Power and status data auto-refresh via React Query's `refetchInterval`.

---

*Final Year Engineering Project — EV Charging Station Management Platform using OCPP 1.6J*
