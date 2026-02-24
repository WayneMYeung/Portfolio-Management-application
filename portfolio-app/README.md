# 📈 Portfolio Manager

> A personal family investment portfolio management web application with PWA support.
> Built with Next.js 14, TypeScript, Prisma, SQLite, Tailwind CSS, and Recharts.

---

## ✨ Features

- **Multi-Portfolio System** — Separate portfolios per family member
- **Asset Types** — Stocks, ETFs, Cash, Crypto, Structured Products, Time Deposits
- **Live Market Data** — Yahoo Finance integration (free, no API key)
- **Multi-Currency** — USD, HKD, TWD, CNY + auto FX conversion
- **Analytics Dashboard** — Allocation charts, currency exposure, concentration risk
- **AI Insights** — Pluggable AI analysis (mock/OpenAI/Anthropic)
- **PWA** — Installable on iOS and Android
- **Dark/Light Mode** — System-aware theming
- **Docker Ready** — One-command deployment on NAS

---

## 🗂️ Project Structure

```
portfolio-manager/
├── prisma/
│   ├── schema.prisma          # Database schema (SQLite)
│   └── seed.ts                # Creates initial admin user
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── offline.html           # Offline fallback page
│   └── icons/                 # PWA icons (generate with script)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── portfolios/    # CRUD for portfolios
│   │   │   ├── holdings/      # CRUD for holdings
│   │   │   ├── market-data/   # Price fetching
│   │   │   ├── fx-rates/      # FX rate fetching
│   │   │   ├── analytics/     # Portfolio analytics
│   │   │   └── ai-insights/   # AI analysis
│   │   ├── (auth)/login/      # Login page
│   │   └── (dashboard)/       # Protected dashboard
│   │       ├── dashboard/     # Main overview
│   │       ├── portfolios/    # Portfolio management
│   │       ├── holdings/      # Holdings management
│   │       ├── analytics/     # Deep analytics
│   │       └── settings/      # App settings
│   ├── components/
│   │   ├── charts/            # Recharts components
│   │   ├── holdings/          # Holdings table
│   │   ├── Sidebar.tsx        # Navigation
│   │   ├── TopBar.tsx         # Header
│   │   ├── PortfolioModal.tsx # Create/edit portfolio
│   │   ├── HoldingModal.tsx   # Create/edit holding
│   │   └── AiInsightsPanel.tsx
│   ├── lib/
│   │   ├── prisma.ts          # DB client singleton
│   │   ├── auth.ts            # NextAuth config
│   │   ├── analytics.ts       # Portfolio calculations
│   │   ├── market-data.ts     # Yahoo Finance fetcher
│   │   ├── fx-rates.ts        # FX rate fetching + caching
│   │   ├── ai-insights.ts     # Pluggable AI module
│   │   └── utils.ts           # Helpers
│   └── types/index.ts         # TypeScript interfaces
├── Dockerfile
├── docker-compose.yml
├── docker-entrypoint.sh
└── next.config.js
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Clone and install
```bash
git clone <your-repo>
cd portfolio-manager
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local — at minimum set NEXTAUTH_SECRET
```

### 3. Setup database
```bash
# Create database and run migrations
npx prisma migrate dev --name init

# Create initial admin user
npm run db:seed
```

### 4. Generate PWA icons
```bash
npm install -D canvas   # Optional dependency
node scripts/generate-icons.js

# OR: Just place your own 192x192 and 512x512 PNGs in public/icons/
```

### 5. Run development server
```bash
npm run dev
# Open http://localhost:3000
# Login: admin@family.local / admin123
```

---

## 🐳 Docker Deployment (NAS)

### 1. Prepare on your NAS

```bash
# SSH into your NAS
ssh admin@your-nas-ip

# Create app directory
mkdir -p /volume1/docker/portfolio-manager
mkdir -p /volume1/docker/portfolio-manager/data
cd /volume1/docker/portfolio-manager

# Copy project files (or git clone)
git clone <your-repo> .
```

### 2. Create production environment file
```bash
cat > .env << 'EOF'
# REQUIRED: Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-64-char-random-secret-here
NEXTAUTH_URL=http://your-nas-ip:3000

# App port (exposed on host)
APP_PORT=3000

# Data directory on NAS
DATA_PATH=/volume1/docker/portfolio-manager/data

# Initial admin credentials
SEED_EMAIL=admin@family.local
SEED_PASSWORD=your-secure-password
SEED_NAME=Admin

# Optional: Real FX API (better rate limits)
# EXCHANGE_RATE_API_KEY=your-key

# Optional: AI insights
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...
EOF
```

### 3. Build and start
```bash
# Build image (takes 3-5 minutes first time)
docker-compose build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Open in browser: http://your-nas-ip:3000
```

### 4. Synology NAS via Container Manager
1. Open **Container Manager** → **Project** → **Create**
2. Set project path to `/volume1/docker/portfolio-manager`
3. Upload `docker-compose.yml`
4. Set environment variables via the UI
5. Deploy

---

## 🌐 Remote Access Options

### Option A: Tailscale (Recommended — Free, Simple)

```bash
# 1. Install Tailscale on your NAS
# Synology: Install via Package Center → Tailscale

# 2. Install Tailscale on your phone/laptop
# https://tailscale.com/download

# 3. Both devices join the same Tailscale network
# 4. Access via: http://nas-tailscale-ip:3000
# 5. For HTTPS: Enable Tailscale Funnel (no port forwarding needed)

tailscale funnel 3000  # Exposes via https://yourdevice.tailnet.ts.net
```

### Option B: Cloudflare Tunnel (Free, Public HTTPS)

```bash
# 1. Install cloudflared on NAS
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# 2. Authenticate
./cloudflared tunnel login

# 3. Create tunnel
./cloudflared tunnel create portfolio

# 4. Configure tunnel (create config.yml)
cat > ~/.cloudflared/config.yml << EOF
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: portfolio.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# 5. Route DNS
./cloudflared tunnel route dns portfolio portfolio.yourdomain.com

# 6. Run tunnel (or use systemd service)
./cloudflared tunnel run portfolio

# Update .env: NEXTAUTH_URL=https://portfolio.yourdomain.com
```

### Option C: Reverse Proxy (Nginx Proxy Manager)

```nginx
server {
    listen 443 ssl;
    server_name portfolio.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📱 PWA Installation

### iOS (iPhone/iPad)
1. Open Safari → Navigate to your app URL
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. App installs with full-screen mode

### Android
1. Open Chrome → Navigate to your app URL
2. Tap the three-dot menu → **"Add to Home Screen"**
3. Or look for the browser install prompt banner

---

## 🔧 Configuration

### Changing Admin Password
```bash
# Option A: Using Prisma Studio
npm run db:studio  # Opens visual DB editor

# Option B: Direct SQL
sqlite3 prisma/portfolio.db
UPDATE User SET password = '<bcrypt-hash>' WHERE email = 'admin@family.local';

# Option C: Reseed (wipes DB)
npx prisma migrate reset
npm run db:seed
```

### Adding Family Members
Family members are **portfolios**, not separate users. One admin manages all portfolios.

If you need separate logins per family member, add users directly to the DB or extend the seed script.

### AI Insights Setup
```bash
# In .env:
AI_PROVIDER=openai    # or: anthropic, mock (default)
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

### Database Backup
```bash
# Simple SQLite backup
cp /volume1/docker/portfolio-manager/data/portfolio.db \
   /volume1/backups/portfolio-$(date +%Y%m%d).db

# Automate with NAS Task Scheduler
```

### Migrating to PostgreSQL
1. Update `prisma/schema.prisma`: change `provider = "sqlite"` to `"postgresql"`
2. Update `DATABASE_URL` to your PostgreSQL connection string
3. Run: `npx prisma migrate dev`
4. Use a SQLite→PostgreSQL migration tool (e.g., pgloader)

---

## 📊 Supported Tickers

| Asset Type | Example Tickers |
|------------|----------------|
| US Stocks  | AAPL, MSFT, NVDA |
| HK Stocks  | 0700.HK, 9988.HK |
| ETFs       | SPY, QQQ, 2800.HK |
| Crypto     | BTC-USD, ETH-USD |
| Forex      | EURUSD=X, HKDUSD=X |

**No ticker?** Leave ticker blank and use **Manual Price Override** for:
- Structured products (QDAP, ELN)
- Time deposits
- Private equity
- Real estate

---

## 🔮 Future Improvements

1. **Historical Portfolio Chart** — Plot portfolio total value over time using stored price history
2. **Dividend Tracking** — Record dividend income, track yield
3. **Transaction History** — Log buys/sells, calculate realized P&L
4. **Benchmark Comparison** — Compare vs SPY, HSI, MSCI World
5. **Rebalancing Tool** — Target allocation vs actual with suggested trades
6. **Multiple User Accounts** — Full multi-user auth for family members
7. **Email Alerts** — Notify on large price moves or threshold breaches
8. **Import/Export** — CSV import from brokerage, Excel export
9. **Tax Reporting** — Capital gains calculation by tax year
10. **Crypto Wallet Integration** — Direct blockchain balance fetching
11. **Real-time Prices** — WebSocket price streaming
12. **Mobile App** — React Native app using the same API

---

## 🛡️ Security Notes

This app is designed for **private family use** on a home network. For internet-facing deployment:

- Use HTTPS (via Tailscale or Cloudflare Tunnel — both provide TLS automatically)
- Set a strong `NEXTAUTH_SECRET` (32+ random characters)
- Use a strong admin password
- Consider IP allowlisting if using a reverse proxy
- Keep Docker and dependencies updated

---

## 📄 License

MIT License — Use freely for personal and family use.
