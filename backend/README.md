## Backend – Rootstock Bridge Monitor

This service monitors Rootstock bridges and exposes a simple HTTP API for the frontend.

### What it does

- Fetches **locked BTC** for PowPeg from the dynamic federation address (Bitcoin side).
- Fetches **locked / minted token balances** for the Token Bridge (currently USDT → rUSDT).
- Normalizes balances by decimals and computes a **delta %** between locked and minted.
- Classifies bridge health as **green / yellow / red / unknown** based on configurable thresholds.
  - PowPeg is marked **unknown / unverified** because RBTC supply is native and not available on-chain.
- Persists per‑asset snapshots and creates anomalies only when status worsens (no alert spam), and auto‑resolves them when status returns to green.
- Serves data to the frontend via REST endpoints and an OpenAPI spec at `/docs/openapi.json`.

### High‑level flow

1. `src/index.ts` boots Express (`createApp`) and starts the `MonitoringService` loop.
2. `MonitoringService` (`src/monitoring/monitoringService.ts`):
   - Loads bridge/asset config from Postgres via Prisma.
   - Uses `chainRegistry` (`src/chains/index.ts`) to talk to Bitcoin, Rootstock, and Ethereum.
   - For each `BridgeAsset`, pulls locked and minted balances, normalizes decimals, and calls `computeStatus`.
   - Writes a `BridgeAssetSnapshot` and, if status worsened, creates an `Anomaly` row; when a bridge asset returns to **green**, any open anomalies are auto‑resolved.
3. `src/app.ts` exposes API routes the frontend and external tools consume:
   - `GET /health` – basic liveness check.
   - `GET /bridges` – list of bridges with chains and assets (supports `?limit=`).
   - `GET /bridges/:id/status` – bridge + recent snapshots per asset (used for charts).
   - `GET /bridges/:id/anomalies` – recent anomalies for that bridge (supports `?limit=&offset=&resolved=`).
   - `GET /docs/openapi.json` – OpenAPI 3.0 spec for this API.

### Key files

- `src/app.ts` – Express app and HTTP routes.
- `src/index.ts` – entrypoint, bootstraps server + monitoring loop.
- `src/config.ts` – loads env, ports, poll interval, and status thresholds.
- `src/prisma.ts` – shared Prisma client.
- `src/monitoring/status.ts` – status thresholds + delta % classification.
- `src/monitoring/monitoringService.ts` – main monitoring logic.
- `src/chains/*.ts` – chain clients (Bitcoin REST + EVM via ethers).
- `prisma/schema.prisma` – Postgres schema (chains, bridges, assets, snapshots, anomalies).
- `prisma/seed.ts` – seeds chains, assets, PowPeg and Token Bridge config.
- `prisma/cleanup-and-reseed.ts` – wipes monitoring data + stale assets, then you run `prisma db seed`.

### Run it

```bash
cd backend

# Install deps
npm install

# Generate Prisma client (if you change the schema)
npx prisma generate

# Apply migrations & seed data
npx prisma migrate deploy
npx prisma db seed

# Start dev server
npm run dev
```

Server listens on `PORT` (default `4000`) and polls bridges every `MONITOR_POLL_INTERVAL_MS` (default 60s).

### Environment variables (`.env` / `.env.example`)

The backend reads only these variables. Keep an actual `.env` file for local development and use `.env.example` as the template (no `.env.local` needed).

```env
## Server
PORT=4000

## Database (Supabase Postgres)
# Full Postgres connection string from Supabase (Project Settings -> Database)
# Example: postgres://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql:......"

DIRECT_URL="postgresql:....../postgres"

## Blockchain RPC endpoints
# Rootstock (RSK) RPC endpoint
ROOTSTOCK_RPC_URL=https://your-rootstock-rpc.example

# Ethereum mainnet (or other EVM chain) RPC endpoint
ETHEREUM_RPC_URL=https://your-ethereum-rpc.example

## Bitcoin data source (explorer API or your own service)
# Example: https://mempool.space/api or a similar provider
BITCOIN_API_URL=https://your-bitcoin-api.example

## Monitoring settings
# How often to run the monitoring loop (in milliseconds)
MONITOR_POLL_INTERVAL_MS=60000
```

#### How to get the values

- **DATABASE_URL / DIRECT_URL (Supabase)**: in the Supabase dashboard, go to *Settings → Database → Connection string* and copy:
  - Use the main Postgres connection string (or pooler) for `DATABASE_URL`.
  - Use the direct connection string (often on port 5432) for `DIRECT_URL`.
- **ROOTSTOCK_RPC_URL**: `https://public-node.rsk.co` works out of the box; for production, use your own Rootstock node or a trusted provider.
- **ETHEREUM_RPC_URL**: any reliable Ethereum mainnet RPC (e.g. `https://eth.llamarpc.com`, Infura, Alchemy, or your own node).
- **BITCOIN_API_URL**: any Bitcoin explorer API with a mempool.space‑style `/address/:address` endpoint (e.g. `https://mempool.space/api`).

# Rootstock Cross-Chain Bridge Monitor - Backend

A transparency and security tool for monitoring Rootstock bridges in real-time. Tracks locked vs. minted balances, transaction flows, and detects inconsistencies.

## 🎯 Features

- **PowPeg Monitoring** (BTC ↔ RBTC)
  - Dynamic Bitcoin federation address retrieval
  - Locked BTC balance tracking
  - Real-time status updates
  - Historical snapshots

- **Token Bridge Monitoring** (ERC-20)
  - Ethereum ↔ Rootstock USDT → rUSDT (Token Bridge side token)
  - Locked USDT vs. minted rUSDT tracking

- **Anomaly Detection**
  - Automatic status computation (green/yellow/red)
  - Threshold-based alerts
  - Historical tracking

- **RESTful API**
  - `/health` - Health check
  - `/bridges` - List all bridges
  - `/bridges/:id/status` - Bridge status
  - `/bridges/:id/anomalies` - Bridge anomalies

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js 22+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Blockchain**: ethers.js + undici

### Project Structure
```
backend/
├── src/
│   ├── abis/              # Contract ABIs
│   ├── chains/            # Blockchain clients
│   ├── monitoring/        # Monitoring logic
│   ├── tests/             # Test scripts
│   ├── app.ts            # Express app
│   ├── config.ts         # Configuration
│   ├── index.ts          # Entry point
│   └── prisma.ts         # Prisma client
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── .env.example          # Environment template
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL database (or Supabase account)
- Rootstock RPC access
- Bitcoin API access (mempool.space)

### Installation

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database:**
```bash
npx prisma migrate dev
npx prisma db seed
```

4. **Start development server:**
```bash
npm run dev
```

The server will start on `http://localhost:4000`.

## ⚙️ Configuration

See the **Environment variables** section above. For Supabase:

1. Create a Supabase project.
2. In **Settings → Database → Connection string**, copy:
   - Pooler/transaction URL into `DATABASE_URL`.
   - Direct connection URL into `DIRECT_URL`.

## 📊 Database Schema

### Key Models

- **Chain** - Bitcoin, Rootstock, Ethereum
- **Bridge** - PowPeg, Token Bridge
- **Asset** - BTC, RBTC, bridged tokens (e.g. USDT)
- **BridgeAsset** - Bridge asset mappings
- **BridgeAssetSnapshot** - Historical balance data
- **Anomaly** - Alert tracking

See `prisma/schema.prisma` for full schema.

## 🔗 Multi-Asset Support

The system supports monitoring multiple assets per bridge. Each bridge can have multiple `BridgeAsset` entries (e.g., USDT, USDC, DAI for the Token Bridge).

### Adding New Assets

To add a new asset pair (e.g., rUSDC, rDAI) when contracts are deployed and verified:

1. **Edit `prisma/seed.ts`**:
   - Uncomment or add the asset definitions (source asset on Ethereum, destination asset on Rootstock)
   - Ensure contract addresses are correct and verified
   - Set correct decimals for both source and destination assets

2. **Reseed the database**:
   ```bash
   npm run db:seed
   ```

3. **Restart the monitoring service**:
   The service will automatically detect and monitor all configured `BridgeAsset` entries.

**Note**: rUSDC and rDAI assets are already defined in `seed.ts` but commented out until their contracts are fully deployed and verified. Once ready, simply uncomment those sections and reseed.

## 🔍 Monitoring Logic

### PowPeg (BTC ↔ RBTC)

1. Query `getFederationAddress()` on PowPeg precompiled contract
2. Get locked BTC balance from Bitcoin API
3. Compare with RBTC circulation (via external API or limitation documented)
4. Compute status and create snapshot

### Token Bridge (ERC-20)

1. Get locked token balance on Ethereum (USDT lock contract).
2. Get minted token `totalSupply()` on Rootstock (rUSDT side token).
3. Compare balances and compute delta and status per monitoring thresholds.
4. Create snapshots and anomalies when status worsens.

### Status Computation

- Uses bigint‑first math and decimal normalization to avoid precision loss.
- **Green**: Delta < 5% (healthy)
- **Yellow**: Delta 5–10% (warning)
- **Red**: Delta > 10% (critical)
- **Unknown**: Used for PowPeg when minted side cannot be safely computed.

## 🧪 Testing

### Run Tests

```bash
# Unit tests for status/delta logic
npm run test:unit

# Complete PowPeg monitoring flow
npm test
```

### API Testing

```bash
# Health check
curl http://localhost:4000/health

# List bridges (supports ?limit=)
curl "http://localhost:4000/bridges?limit=10"

# Bridge status (includes per‑asset snapshots)
curl http://localhost:4000/bridges/1/status

# Bridge anomalies (supports ?limit=&offset=&resolved=)
curl "http://localhost:4000/bridges/1/anomalies?limit=20&resolved=false"

# OpenAPI spec
curl http://localhost:4000/docs/openapi.json
```

## 🔧 Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npx prisma studio    # Open Prisma Studio
npx prisma db seed   # Seed database
```

### Database Migrations

```bash
npx prisma migrate dev --name description  # Create migration
npx prisma migrate deploy                  # Apply migrations (prod)
npx prisma db push                        # Sync schema (dev only)
```


### Production Checklist

1. ✅ Set up PostgreSQL database
2. ✅ Configure environment variables
3. ✅ Run database migrations
4. ✅ Seed initial data
5. ✅ Build TypeScript (`npm run build`)
6. ✅ Start server (`npm start`)
7. ✅ Set up monitoring (health checks)
8. ✅ Configure alerts (optional)

## 🤝 Contributing

This project was built for the Rootstock Hacktivator program.

### Development Workflow

1. Create feature branch
2. Make changes
3. Run tests
4. Create pull request

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Rootstock DevRel team for clarifications
- Rootstock community for support
- Hacktivator program for the opportunity

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️  for Rootstock transparency and security**
