# CreditX

Full-stack multi-stage form platform — **React (Vite)** frontend + **NestJS** backend with JWT auth, refresh-token rotation, and file uploads.

## Structure

```
shivani_feature/
└── creditx/
    ├── client/creditx/   # React SPA (Vite)
    └── server/           # NestJS API
```

## Prerequisites

- Node.js **≥ 20**
- npm **≥ 10**
- MongoDB (local ≥ 6.x or Atlas)

## Setup

### 1. Backend

```bash
cd creditx/server
npm install
cp .env.example .env       # edit MONGO_URI, JWT_SECRET
npm run start:dev          # http://localhost:5001
```

`.env`:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/creditx
JWT_SECRET=<random 64-byte hex>
JWT_ACCESS_EXPIRES_IN=60s
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Frontend

```bash
cd creditx/client/creditx
npm install
cp .env.example .env
npm run dev                # http://localhost:5173
```

`.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

## Run

Two terminals:

```bash
# terminal 1
cd creditx/server && npm run start:dev

# terminal 2
cd creditx/client/creditx && npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5001/api/v1
- Swagger: http://localhost:5001/api/docs

## Scripts

**Server** (`creditx/server`):
- `npm run start:dev` — watch mode
- `npm run build` — compile to `dist/`
- `npm run start:prod` — run compiled build
- `npm run lint` · `npm test`

**Client** (`creditx/client/creditx`):
- `npm run dev` — Vite dev server
- `npm run build` — production bundle
- `npm run preview` — preview built bundle
- `npm run lint`

See [creditx/README.md](creditx/README.md) for architecture, API reference, and feature details.
