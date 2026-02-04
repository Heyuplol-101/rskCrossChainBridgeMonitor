# Rootstock Bridge Monitor

**A single pane of glass for cross‑chain safety.**

This project continuously watches the health of key Rootstock bridges and turns raw blockchain data into clear, human‑readable signals. It answers three questions operators, auditors, and community members care about:

1. **Is BTC really backing the RBTC in circulation?**  
   - Tracks the PowPeg federation’s live Bitcoin balance.
   - Surfaces issues when locked BTC and on‑chain RBTC diverge.

2. **Are bridged stablecoins (USDT → rUSDT) solvent?**  
   - Compares USDT locked on Ethereum to rUSDT minted on Rootstock.
   - Normalizes for token decimals and shows the percentage delta.

3. **Is anything going wrong right now?**  
   - Computes green / yellow / red status per bridge using production‑grade thresholds.
   - Logs and displays “WARNING” and “CRITICAL” anomalies instead of raw numbers only.

### What’s inside

- **Backend (`/backend`)** – Node.js + Express + Prisma + ethers:
  - Polls Bitcoin, Ethereum, and Rootstock.
  - Normalizes balances and computes discrepancies.
  - Exposes a simple JSON API: `/health`, `/bridges`, `/bridges/:id/status`, `/bridges/:id/anomalies`.

- **Frontend (`/frontend`) – Next.js 16 + React 19 + Tailwind + Recharts:**
  - Dashboard of all bridges with live status badges.
  - Per‑bridge detail pages with current balances, historical charts, and anomaly timelines.

### How it helps

- **Operators** can spot trust‑assumption drift (e.g., rUSDT ≠ USDT locked) before it becomes a crisis.
- **Auditors & researchers** get a ready‑made UI on top of canonical on‑chain signals.
- **Communities** gain a transparent, always‑on view of how safely their bridges are collateralized.

To run it locally, start the backend (`/backend/README.md`) and then the frontend (`/frontend/README.md`) and open the dashboard in your browser.