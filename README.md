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

```
┌─────────────────────────────────────────────────────────┐
│                      AWS EC2                            │
│  ┌──────────────────┐    ┌───────────────────────────┐  │
│  │   Frontend        │    │   Backend                 │  │
│  │   Next.js 15      │◄──►│   Express.js              │  │
│  │   Port 3000       │    │   Port 5001               │  │
│  │                   │    │                           │  │
│  │  • App Router     │    │  • REST API (17+ routes)  │  │
│  │  • NextAuth JWT   │    │  • JWT Auth Middleware     │  │
│  │  • TipTap Editor  │    │  • Gemini AI Service      │  │
│  │  • Tailwind CSS   │    │  • Puppeteer PDF Gen      │  │
│  └──────────────────┘    │  • Resume Parser          │  │
│                           └───────────┬───────────────┘  │
│                                       │                  │
└───────────────────────────────────────┼──────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  MongoDB Atlas     │
                              │  (Cloud Database)  │
                              └───────────────────┘
```

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

# Frontend tests (31 tests)
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
