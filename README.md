# CareerLens — AI-Powered Job & Internship Matching for Students

**CareerLens** is an AI-driven career acceleration and recommendation platform built specifically for students and early-career developers.

CareerLens bridges the gap between student resumes and live industry requirements with AI-powered resume extraction (Google Gemini), a 5-factor weighted candidate-job fit engine, real-time application tracking, and personalized skill learning roadmaps.

---

## 🚀 Key Features

- **AI Resume Intelligence:**
  - Secure PDF resume upload with magic-byte file validation
  - Structured entity extraction using **Google Gemini** (skills, education, verified projects, and work experience)
  - Zero fabricated fallback data — strictly grounded in candidate evidence

- **5-Factor Weighted Matching Engine:**
  - Mathematical fit scoring across **Skills (50%)**, **Projects (20%)**, **Experience (15%)**, **Education (10%)**, and **Location (5%)**
  - Synonym normalization (`NodeJS` = `Node.js`, `AWS` = `Amazon Web Services`, `React.js` = `React`)
  - Transparent matched vs. missing skill breakdown for every role

- **AI Career Mentorship & Roadmaps:**
  - AI match explanation justifying candidate strengths and specific areas of alignment
  - 3-6 week customized project-based learning roadmaps to close high-priority skill gaps

- **Student Opportunity Hub & Pipeline:**
  - Full-text job search with debounced filtering by location, role type, and keywords
  - Saved jobs bookmarks and stage-by-stage Kanban application tracking
  - Real-time event notifications powered by Socket.IO

- **Security & Reliability:**
  - HTTP-only, SameSite JWT cookie session management
  - React Error Boundary for resilient, crash-free client rendering
  - Redis-backed rate limiting and caching with graceful offline fallbacks

---

## 📁 Architecture & Monorepo Structure

```
Career Lens/
├── package.json               # Monorepo scripts
├── .env.example               # Root environment variables template
├── README.md                  # Project documentation
│
├── backend/                   # Node.js + Express REST API
│   ├── src/
│   │   ├── config/            # DB, Redis & Storage configuration
│   │   ├── controllers/       # Auth, Profile, Resume, Jobs, Applications
│   │   ├── middleware/        # JWT auth, Rate limiting, Upload validation
│   │   ├── models/            # Mongoose Schemas (User, Job, Application, etc.)
│   │   ├── routes/            # Express endpoint routers
│   │   ├── services/          # Gemini AI Analyzer, Matching Engine, Roadmaps
│   │   └── server.js          # Express app entry & Socket.IO initialization
│   └── __tests__/             # Jest + Supertest comprehensive test suite
│
└── frontend/                  # Vite + React + Tailwind CSS
    ├── src/
    │   ├── api/               # Axios client instance
    │   ├── assets/            # Platform graphics & hero imagery
    │   ├── components/        # Common UI, Auth, Dashboard, Navbar, ErrorBoundary
    │   ├── context/           # AuthContext, ToastContext, SocketContext
    │   ├── pages/             # Landing, Dashboard, Jobs, JobDetail, Applications, Profile, Upload, Roadmap
    │   └── App.jsx            # Routing and global provider setup
    └── index.html             # HTML entry with Open Graph & Twitter meta tags
```

---

## 🛠️ Getting Started Locally

### Prerequisites
- **Node.js**: v18+ (tested on Node 20 & 24)
- **MongoDB**: Local MongoDB or MongoDB Atlas cluster

### Quick Start

```bash
# 1. Install all dependencies across root, backend, and frontend
npm run install:all

# 2. Configure environment variables
cp backend/.env.example backend/.env
# Required: add your MONGO_URI and GEMINI_API_KEY
# For real job listings: add ADZUNA_APP_ID and ADZUNA_APP_KEY (see below)

# 3. Start development servers concurrently
npm run dev
# Backend running on http://localhost:5000
# Frontend running on http://localhost:5173

# 4. (Optional but recommended) Populate job listings from Adzuna
npm run fetch:jobs
# Fetches real software/tech job listings and stores them in MongoDB
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | ✅ | Secret key for JWT session tokens |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI resume analysis — [get free key](https://aistudio.google.com/) |
| `GEMINI_MODEL` | Optional | Gemini model name (default: `gemini-3.5-flash-lite`) |
| `ADZUNA_APP_ID` | ✅ for jobs | Adzuna API app ID — [get free key](https://developer.adzuna.com) |
| `ADZUNA_APP_KEY` | ✅ for jobs | Adzuna API app key |
| `ADZUNA_COUNTRY` | Optional | Two-letter country code for job search (default: `in` for India). Other options: `gb`, `us`, `au`, `ca` |
| `CLIENT_URL` | Optional | Frontend URL for CORS (default: `http://localhost:5173`) |
| `CLOUDINARY_*` | Optional | Cloudinary credentials for cloud resume storage (uses local disk if not set) |
| `REDIS_URL` | Optional | Redis connection URL for caching (gracefully disabled if absent) |

### Job Listings (Adzuna API)

CareerLens fetches **real, live job listings** from the [Adzuna API](https://developer.adzuna.com).

1. Sign up free at [developer.adzuna.com](https://developer.adzuna.com) — instant, no credit card required
2. Copy your `app_id` and `app_key` into `backend/.env`
3. Run `npm run fetch:jobs` to populate your database

```bash
# One-time setup (or re-run to refresh listings)
npm run fetch:jobs

# Rate limit: 7 API calls per run | Free tier: 1,000 calls/month
# Safe to run ~4-5x per day
```

**Queries fetched per run:** `software engineer intern`, `full stack developer`, `backend developer`, `frontend developer`, `data analyst`, `devops engineer`, `junior developer`

**Skills are auto-extracted** from job descriptions via keyword matching against 150+ tech skill synonyms. Real apply links (`redirect_url`) are preserved directly from Adzuna.

---

## 🧪 Testing

```bash
# Run backend test suite (50/50 automated test cases with in-memory MongoDB)
npm test --prefix backend
```

---

## 📄 License & Attribution

CareerLens &copy; 2026 • Student Career Intelligence Platform
