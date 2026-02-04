## Frontend – Rootstock Bridge Monitor

This is the Next.js UI for monitoring Rootstock bridges, backed by the Node/Express API in `backend/`. It visualizes locked vs. minted balances, bridge status, and anomalies for:

- **PowPeg (BTC ↔ RBTC)** – native BTC ↔ RBTC bridge.
- **Token Bridge (USDT ↔ rUSDT)** – ERC‑20 bridge between Ethereum and Rootstock.

> **Backend dependency:** The frontend expects the backend to be running and reachable at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

### What it shows

- **Dashboard (`/`)**
  - List of bridges (PowPeg, Token Bridge) with names, directions, and “official” badge.
  - Basic error and loading states when fetching from the backend.

- **Bridge detail (`/bridges/[id]`)**
  - **Per‑asset sections** for each `BridgeAsset` (e.g. BTC→RBTC, USDT→rUSDT) under a bridge.
  - **Current Status** card (`BridgeStatus`):
    - Locked vs. minted balances, normalized by decimals.
    - Delta % with a clear convention: **positive = locked ≥ minted (over‑collateralized)**, **negative = minted > locked (under‑collateralized)**.
    - For PowPeg: status is shown as **“unverified”** and RBTC supply is shown as `N/A (native currency)`; only locked BTC is treated as a signal.
  - **Historical chart** (`BalanceChart`):
    - Time series of locked and minted balances per asset.
    - For PowPeg, only locked BTC is plotted.
  - **Recent anomalies** (`AnomalyList`):
    - Human‑readable messages from backend `Anomaly.details`, grouped by bridge.

### High‑level flow

1. `src/lib/api.ts` wraps the backend API (`/health`, `/bridges`, `/bridges/:id/status`, `/bridges/:id/anomalies`) behind a small `ApiClient` using `fetch`.
2. `src/hooks/useBridgeData.ts` defines React Query hooks (`useBridges`, `useBridgeStatus`, `useBridgeAnomalies`) for data fetching and polling.
3. `src/app/page.tsx` uses `useBridges` to render the dashboard with `BridgeCard` components.
4. `src/app/bridges/[id]/page.tsx` uses `useBridgeStatus` + `useBridgeAnomalies` and passes data into `BridgeStatus`, `BalanceChart`, and `AnomalyList`.
5. `src/components/providers/QueryProvider.tsx` wires up `@tanstack/react-query` and the `sonner` toaster for global notifications.

### Key files

- `src/app/layout.tsx` – Root layout, global styles, and `QueryProvider` wrapper.
- `src/app/page.tsx` – Main dashboard listing all bridges.
- `src/app/bridges/[id]/page.tsx` – Bridge detail page (status, chart, anomalies).
- `src/components/bridge/BridgeCard.tsx` – Compact dashboard card for a single bridge.
- `src/components/bridge/BridgeStatus.tsx` – Status card for locked/minted and delta %.
- `src/components/charts/BalanceChart.tsx` – Recharts time‑series chart for balances.
- `src/components/bridge/AnomalyList.tsx` – Timeline view of anomalies.
- `src/components/ui/*` – Shared UI primitives (spinner, status badge, error message).
- `src/components/providers/QueryProvider.tsx` – React Query + `sonner` setup.
- `src/hooks/useBridgeData.ts` – React Query hooks over the `api` client.
- `src/lib/api.ts` – Backend HTTP wrapper using `NEXT_PUBLIC_API_URL`.
- `src/lib/types.ts` – Shared TypeScript types matching the backend API.
- `src/lib/utils.ts` – Formatting helpers (amounts, percentages, dates).

### Running the frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js dev server (defaults to http://localhost:3000)
npm run dev
```

By default, the app will call the backend at `http://localhost:4000`. To point it elsewhere, set `NEXT_PUBLIC_API_URL` in a `.env` file.

### Environment variables (`frontend/.env`)

```env
# URL of the backend API
# Defaults to http://localhost:4000 if not set
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> Only client‑safe variables should be prefixed with `NEXT_PUBLIC_`. Do **not** put secrets here.

### Tailwind / UI stack

- **Framework**: Next.js 16 (App Router, React 19, client components for data‑driven views).
- **Styling**: Tailwind CSS v4 (used via `@tailwindcss/postcss`) + custom gradients.
- **Charts**: `recharts` for time‑series balance charts.
- **State / data fetching**: `@tanstack/react-query` for caching and polling.
- **Icons / motion**: `lucide-react`, `framer-motion`, `sonner` toasts.

### Development tips

- Ensure the backend is running and reachable from the browser:
  - In dev: start backend on `http://localhost:4000` and frontend on `http://localhost:3000` (Next will proxy via CORS configured in `backend/src/app.ts`).
  - If you change the backend port or host, update `NEXT_PUBLIC_API_URL` accordingly.
- Use `npm run lint` to check for ESLint and Tailwind class suggestions.

