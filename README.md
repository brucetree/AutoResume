<p align="center">
  <img src="frontend/src/app/icon.svg" width="64" alt="AutoResume Logo" />
</p>

<h1 align="center">AutoResume</h1>

<p align="center">
  <strong>AI-Powered Resume Optimization Platform</strong><br/>
  Analyze job postings, identify skill gaps, and generate tailored resumes — powered by Google Gemini.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express-4.18-000?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Gemini_AI-Flash-4285F4?logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/AWS-EC2_|_ECR-FF9900?logo=amazonaws&logoColor=white" alt="AWS" />
  <img src="https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?logo=githubactions&logoColor=white" alt="CI/CD" />
</p>

---

## Overview

AutoResume is a full-stack SaaS application that helps job seekers optimize their resumes for specific positions. Users upload a resume, paste a job URL (or description), and the platform leverages **Google Gemini AI** to perform gap analysis, generate a match score, and produce a tailored version of the resume — all within a polished, responsive interface.

## Key Features

| Feature | Description |
|---|---|
| **AI Gap Analysis** | Gemini Flash analyzes resume vs. job description, producing a 0–100 match score with actionable suggestions |
| **Auto-Parse Job URL** | Paste any job listing URL — Cheerio scrapes the page and Gemini extracts structured job details |
| **Rich Resume Editor** | TipTap-powered editor with formatting toolbar for fine-tuning AI-generated content |
| **PDF Export** | Server-side PDF generation via Puppeteer with high-fidelity output |
| **Resume Library** | Upload, version, rename, download, and manage multiple resumes with a "Primary" designation |
| **Application Tracker** | Track application status across the pipeline: Analyzing → Editing → Applied → Interview → Offer |
| **Multi-Provider Auth** | Credential-based login + Google & GitHub OAuth via NextAuth.js with JWT sessions |
| **Responsive Design** | Mobile-first UI with custom design system — desktop sidebar, mobile bottom nav |

## Tech Stack

### Frontend
- **Next.js 15** (App Router, Server Components, TypeScript)
- **Tailwind CSS** with custom Material Design 3 token system
- **NextAuth.js** — JWT sessions with 1-hour expiry, multi-provider OAuth
- **TipTap** — extensible rich text editor for resume content
- **Jest + React Testing Library** — component & integration tests

### Backend
- **Express.js** on Node.js 22
- **MongoDB Atlas** (Mongoose ODM) — Users, Resumes, Applications
- **Google Gemini AI** (`@google/generative-ai`) — gap analysis, resume optimization, job parsing
- **Puppeteer** — headless Chromium for server-side PDF generation
- **pdf-parse / Mammoth** — multi-format resume parsing (PDF & DOCX)
- **Cheerio** — HTML scraping for job posting extraction
- **Jest + Supertest** — API integration tests

### Infrastructure & DevOps
- **Docker** — multi-stage builds for both services (Alpine/Slim base images)
- **AWS ECR** — private container registry with SHA-tagged images
- **AWS EC2** — production hosting with `docker-compose`
- **GitHub Actions CI/CD** — automated pipeline triggered on `release/**` branches:

```
Push to release/* ──▶ Run Tests (parallel) ──▶ Build & Push to ECR ──▶ SSH Deploy to EC2 ──▶ Health Check
```

### Database Architecture
Three isolated MongoDB Atlas databases for environment separation:

| Database | Purpose |
|---|---|
| `autoresume_dev` | Local development |
| `autoresume_test` | CI pipeline (GitHub Actions) |
| `autoresume_prod` | Production (EC2) |

## Architecture

### Production (HTTPS via Nginx)

```
Browser ── https://autoresume.org ──▶ Nginx (:443)
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
              /api/auth/*          /api/*             /* (everything else)
                    │                   │                   │
                    ▼                   ▼                   ▼
              Next.js (:3000)    Express (:5001)     Next.js (:3000)
              (NextAuth)         (Business API)      (Pages & Assets)
                    │
                    │ INTERNAL_API_URL
                    ▼
              Express (:5001)  ◄──── Docker internal network
                    │
                    ▼
              MongoDB Atlas
```

### Local Development (No Nginx)

```
Browser ──▶ Next.js (:3000)  ──── NEXT_PUBLIC_API_URL ────▶ Express (:5001)
                                                                │
                                                                ▼
                                                          MongoDB Atlas
```

### Why Does Next.js Talk to Express?

Next.js is **both a frontend and a server**. It serves two roles:

| Code | Runs On | Example |
|------|---------|---------|
| `'use client'` components | **Browser** | Dashboard page fetches `/api/applications` |
| `auth.ts`, API routes | **Next.js server** | NextAuth calls Express to verify passwords |

This means there are **two paths** to reach Express:

1. **Browser → Nginx → Express** — Client-side `fetch('/api/applications')` uses relative paths, Nginx proxies to Express
2. **Next.js server → Express** — Server-side `auth.ts` uses `INTERNAL_API_URL=http://backend:5001` via Docker internal network

### Nginx Routing Rules

| Request Path | Routed To | Why |
|---|---|---|
| `/api/auth/(session\|callback\|signin\|signout\|csrf\|providers\|error)` | Next.js (:3000) | NextAuth handles sessions & OAuth callbacks |
| `/api/auth/register`, `/api/auth/login`, etc. | Express (:5001) | Business auth endpoints (register, login, profile, password) |
| `/api/*` | Express (:5001) | All other business logic API endpoints |
| `/health` | Express (:5001) | Health check for deployment verification |
| `/*` | Next.js (:3000) | Pages, static assets, everything else |
| HTTP :80 | Redirect → HTTPS :443 | SSL enforcement |

### Request Flow Example

```
User clicks "Login" with email/password:

1. Browser submits form → POST /api/auth/callback/credentials
2. Nginx sees /api/auth/ → forwards to Next.js (:3000)
3. auth.ts runs on Next.js server, calls Express via Docker network:
   fetch('http://backend:5001/api/auth/login', { email, password })
4. Express validates credentials against MongoDB, returns JWT
5. Next.js sets session cookie, redirects browser to /dashboard

User lands on Dashboard:

6. Browser loads page from Next.js (via Nginx)
7. Client-side JS runs fetch('/api/applications')  ← relative path
8. Nginx sees /api/ → forwards to Express (:5001)
9. Express queries MongoDB, returns application list
10. Dashboard renders the data
```

### Environment Variables

The app uses different env var sources per environment:

**Local Development** — env vars loaded from files by Next.js and Express automatically:

| File | Used By | Contains |
|---|---|---|
| `frontend/.env` | Next.js (auto-loaded) | `NEXT_PUBLIC_API_URL=http://localhost:5001`, auth secrets |
| `backend/.env` | Express (via dotenv) | `MONGO_URI`, `GEMINI_API_KEY`, `FRONTEND_URL` |

**Production (Docker on EC2)** — env vars injected via `docker-compose.prod.yml`:

| File / Source | Used By | Contains |
|---|---|---|
| `.env.frontend` (on EC2) | Next.js container (`env_file`) | `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, OAuth credentials |
| `.env.backend` (on EC2) | Express container (`env_file`) | `MONGO_URI`, `GEMINI_API_KEY`, `FRONTEND_URL` |
| `docker-compose.prod.yml` | Next.js container (`environment`) | `INTERNAL_API_URL=http://backend:5001` |
| Docker build arg | Baked into JS at build time | `NEXT_PUBLIC_API_URL=""` → relative paths |

> **Key concept:** `NEXT_PUBLIC_*` variables are **inlined at build time** by Next.js into client-side JavaScript. They are not read at runtime. This is why the Docker build passes `--build-arg NEXT_PUBLIC_API_URL=""` — it bakes empty string into the JS so all client-side API calls use relative paths (`/api/...`), which Nginx proxies to the correct service. The `.dockerignore` file blocks `frontend/.env` from entering the Docker image to prevent local dev values from leaking into production builds.

## Git Workflow

Three-branch Git Flow with feature branches:

```
main ◄── release/* ◄── develop ◄── feature/*
 │
 └── Tagged releases (v1.0.0)
```

- **`develop`** — integration branch for active development
- **`feature/*`** — short-lived branches for individual features
- **`release/*`** — triggers CI/CD pipeline on push
- **`main`** — production-stable code with version tags

## Getting Started

### Prerequisites
- Node.js >= 22
- MongoDB (local or Atlas)
- Google Gemini API key

### Local Development

```bash
# Clone the repository
git clone git@github.com:brucetree/AutoResume.git
cd AutoResume

# Backend
cd backend
cp .env.example .env        # Configure your environment variables
npm install
npm run dev                  # Starts on http://localhost:5001

# Frontend (in a new terminal)
cd frontend
cp .env.example .env.local   # Configure your environment variables
npm install
npm run dev                  # Starts on http://localhost:3000
```

### Environment Variables

**Backend** (`.env`):
```
MONGO_URI=mongodb+srv://...
NEXTAUTH_SECRET=your-secret
GEMINI_API_KEY=your-gemini-key
FRONTEND_URL=http://localhost:3000
PORT=5001
```

**Frontend** (`.env.local`):
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Running Tests

```bash
# Backend tests (20 tests)
cd backend && npm test

# Frontend tests (37 tests)
cd frontend && npm test
```

### Docker

```bash
# Development (MongoDB only)
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | Authentication |
| `PATCH` | `/api/auth/profile` | Update display name |
| `PATCH` | `/api/auth/password` | Change password |
| `DELETE` | `/api/auth/account` | Delete account (cascading) |
| `POST` | `/api/resumes` | Upload & parse resume |
| `GET` | `/api/resumes` | List user's resumes |
| `PATCH` | `/api/resumes/:id/rename` | Rename resume |
| `PATCH` | `/api/resumes/:id/primary` | Set as primary |
| `GET` | `/api/resumes/:id/download` | Download original file |
| `DELETE` | `/api/resumes/:id` | Delete resume |
| `POST` | `/api/jobs/parse-url` | Auto-parse job posting URL |
| `POST` | `/api/jobs/analyze` | AI analysis & optimization |
| `GET` | `/api/applications` | List applications |
| `PATCH` | `/api/applications/:id/status` | Update status |
| `POST` | `/api/applications/:id/export-pdf` | Export resume as PDF |
| `DELETE` | `/api/applications/:id` | Delete application |

## License

MIT
