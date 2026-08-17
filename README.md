# Resume2Role (CareerLens) — Phase 1

**Resume2Role** is an AI-powered job and internship recommendation platform designed specifically for students. 

This repository contains **Phase 1: Foundation & LinkedIn-Style UI**, which implements secure cookie-based authentication, user account management, and a LinkedIn-inspired dashboard layout with completely separated `frontend/` and `backend/` folders.

---

## 🚀 Phase 1 Features

- **Authentication & Security:**
  - Secure password hashing using `bcryptjs`
  - JWT generation and verification stored securely in **HTTP-only, SameSite cookies** (immune to XSS token theft)
  - Endpoint protection and automated session validation (`GET /api/auth/me`)
- **Backend Architecture:**
  - Express.js REST API in `/backend` with clean separation of concerns (`controllers/`, `models/`, `routes/`, `middleware/`, `config/`)
  - MongoDB connection using Mongoose ODM with resilient local/fallback configuration
  - Structured error responses: `{ success: false, message: "..." }`
- **Frontend Architecture:**
  - React 18 with Vite in `/frontend` for ultra-fast HMR
  - React Router v6 protected routing (automatic redirects for authenticated & unauthenticated states)
  - Full design system built with Tailwind CSS matching LinkedIn's UI/UX language:
    - LinkedIn Blue (`#0A66C2`), Canvas background (`#F4F2EE`), Crisp cards (`#FFFFFF`)
    - Sticky top navigation bar with search bar and profile dropdown
    - 3-column feed dashboard with profile mini-card, onboarding checklist, and empty state cards for upcoming Phase 2 AI features

---

## 📁 Repository Structure

```
Career Lens/
├── package.json               # Root scripts to run both frontend and backend concurrently
├── .env.example               # Root environment variables template
├── README.md                  # Project documentation
│
├── backend/                   # Express + MongoDB Backend
│   ├── package.json
│   ├── .env.example
│   ├── .env                   # Local backend environment config
│   ├── testAuth.js            # Automated backend auth test suite
│   └── src/
│       ├── config/
│       │   └── db.js          # Mongoose database connection
│       ├── controllers/
│       │   └── authController.js # Register, Login, Logout, and GetMe handlers
│       ├── middleware/
│       │   ├── auth.js        # HTTP-only cookie JWT verification
│       │   └── errorHandler.js# Centralized error handler
│       ├── models/
│       │   └── User.js        # User model with schema validation & password comparison
│       ├── routes/
│       │   └── authRoutes.js  # /api/auth endpoints
│       └── server.js          # Server bootstrap & CORS configuration
│
└── frontend/                  # Vite + React + Tailwind Frontend
    ├── package.json
    ├── vite.config.js         # Vite configuration with /api proxy
    ├── tailwind.config.js     # Custom LinkedIn color palette & shadow definitions
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── api/
        │   └── axiosClient.js # Axios instance with credentials: true
        ├── context/
        │   └── AuthContext.jsx# Session state provider & useAuth hook
        ├── components/
        │   ├── common/        # Button, Input, Card, Spinner
        │   ├── layout/        # Navbar, ProtectedRoute
        │   ├── auth/          # AuthCard
        │   └── dashboard/     # ProfileMiniCard, QuickStatsCard, WelcomeCard, FeedPlaceholderCard, GettingStartedCard, NewsWidget
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   └── DashboardPage.jsx
        ├── styles/
        │   └── index.css      # Tailwind directives & base styles
        ├── App.jsx            # Routing and providers
        └── main.jsx           # React DOM root entry
```

---

## 🛠️ Prerequisites

- **Node.js**: v18+ (tested on v24.x)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI (or automated development fallback).

---

## ⚙️ Environment Configuration

In `/backend/.env` (or copied from `backend/.env.example`):
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/resume2role
JWT_SECRET=resume2role_development_jwt_secret_key_super_secure_2026
CLIENT_URL=http://localhost:5173
```

---

## 💻 Installation & Running Locally

### Option 1: Run Concurrently from Monorepo Root (Recommended)

From the project root:

```bash
# Install dependencies for root, backend, and frontend
npm run install:all

# Start both backend (port 5000) and frontend (port 5173) simultaneously
npm run dev
```

### Option 2: Run Separately in Two Dedicated Terminals

**Terminal 1 (Backend API):**
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

**Terminal 2 (Frontend App):**
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🧪 Testing Backend Endpoints

```bash
cd backend
node testAuth.js
```
