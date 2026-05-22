# RationMate 🌿

**Smart Ration Distribution Management System**

RationMate connects ration shop owners with citizens. Shop owners manage their live inventory through a secure dashboard; citizens verify their identity via SMS OTP and then check real-time stock at any nearby ration shop.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://cloud.mongodb.com)
[![Twilio](https://img.shields.io/badge/SMS-Twilio-red)](https://twilio.com)

---

## Features

### Shop Owner Portal
- Select your shop from the directory and log in with a password
- Add new products to inventory
- Update current stock levels
- Delete products from inventory
- Session persists across page refreshes

### Citizen Portal
- Verify identity via SMS OTP (Twilio)
- Browse all active ration shops
- View real-time stock levels with colour-coded availability badges (Available / Low / Out of Stock)
- Session persists across page refreshes

### Security
- Passwords bcrypt-hashed at rest
- JWT authentication (7-day expiry) with auto-logout on expiry
- Rate limiting: 100 req/15 min per IP on all API endpoints; 5 req/10 min per IP on OTP endpoint
- `helmet` security headers
- CORS restricted to known origins in production

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | MongoDB Atlas (Mongoose 8) |
| Authentication | JWT (`jsonwebtoken`) + bcrypt |
| SMS | Twilio |
| Frontend | Vanilla HTML + Tailwind CSS CDN + Vanilla JS |
| Hosting | Render (backend + static frontend) |

---

## Project Structure

```
rationmate/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── models/
│   │   ├── OTP.js           # OTP model with TTL auto-expiry
│   │   ├── Shop.js          # Shop model (bcrypt password hook)
│   │   └── User.js          # Citizen user model
│   ├── routes/
│   │   ├── auth.js          # POST /api/auth/user/login
│   │   ├── otp.js           # POST /api/otp/send, /verify
│   │   └── shops.js         # GET/POST/PUT/DELETE /api/shops
│   ├── utils/
│   │   └── helpers.js       # Twilio SMS helper
│   ├── .env.example         # Environment variable template
│   ├── package.json
│   └── server.js            # Express entry point
└── frontend/
    ├── css/
    │   └── styles.css       # Custom animations, badges, modals
    ├── js/
    │   ├── api.js           # All fetch() calls to the backend
    │   └── app.js           # Page routing & UI logic
    └── index.html           # Single-page application (6 pages)
```

---

## Local Development Setup

### Prerequisites
- Node.js ≥ 18
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster (free tier works)
- A [Twilio](https://console.twilio.com) account with a phone number

### 1. Clone the repository

```bash
git clone https://github.com/Mohamed-shameel/rationmate.git
cd rationmate
```

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in your values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/rationmate?retryWrites=true&w=majority
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
NODE_ENV=development
PORT=5000
```

> **Tip:** In `development` mode the OTP is returned in the API response, so you can test without Twilio credits.

### 3. Install dependencies and start the server

```bash
cd backend
npm install
npm run dev
```

Open **http://localhost:5000** — the frontend is served automatically by Express.

### Sample Credentials (seeded on first run)

| Shop | Shop ID | Password |
|------|---------|----------|
| Main Street Ration | `SHOP001` | `admin123` |
| Central Ration Depot | `SHOP002` | `shop123` |

---

## API Reference

All endpoints are prefixed with `/api`.

### Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/test` | None | Server health check |

### Shops

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/shops` | None | List all active shops |
| GET | `/api/shops/:shopId` | None | Get shop details + inventory |
| POST | `/api/shops/login` | None | Shop owner login → returns JWT |
| PUT | `/api/shops/:shopId/inventory` | Shop JWT | Update product stock |
| POST | `/api/shops/:shopId/inventory` | Shop JWT | Add new product |
| DELETE | `/api/shops/:shopId/inventory/:productName` | Shop JWT | Remove product |

### OTP

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/otp/send` | None | Send OTP to phone number (rate limited: 5/10 min) |
| POST | `/api/otp/verify` | None | Verify OTP |

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/user/login` | None | Citizen login with phone + OTP → returns JWT |

---

## Deployment (Render)

### One-Click via `render.yaml`

This repo includes a `render.yaml` blueprint. Simply connect your GitHub repo to Render and it will be configured automatically.

### Manual Setup

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repository (`Mohamed-shameel/rationmate`)
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `backend` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Node Version** | 18 or above |

4. Add the following **Environment Variables** in the Render dashboard:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | A long random hex string |
   | `TWILIO_ACCOUNT_SID` | From Twilio console |
   | `TWILIO_AUTH_TOKEN` | From Twilio console |
   | `TWILIO_PHONE_NUMBER` | E.164 format (e.g. `+12345678900`) |
   | `NODE_ENV` | `production` |

5. Deploy — Render will install dependencies, start the server, and serve the frontend as static files from the same URL.

---

## License

MIT
