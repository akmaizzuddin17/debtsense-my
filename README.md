# DebtSense MY — AI Financial Intelligence

> Malaysia's AI-powered personal financial threat intelligence system.
> Detects debt risk, guards spending, and grows wealth — powered by 5 Gemini AI Agents.

**Project 2030: MyAI Future Hackathon | Track 5: Secure Digital (FinTech & Security)**
*Organised by GDG On Campus UTM — "Advancing the Nation by Building Solutions with Google AI"*

---

## Problem Statement

Malaysia loses **millions of ringgit annually** to digital fraud and financial scams. The highest-risk targets are Malaysians trapped in debt spiral — high DSR, low savings, and no financial safety net. These individuals are the primary victims of predatory lenders, fake investment schemes (Skim Cepat Kaya), Macau Scams, and Ah Long operations.

DebtSense MY solves this by building **financial resilience as a layer of digital security** — helping Malaysians understand their vulnerability profile before scammers exploit it.

---

## The 5-Agent Multi-Agent Pipeline

All agents run sequentially via a streaming SSE pipeline. Each agent feeds context into the next.

| # | Agent | Role | Output |
|---|-------|------|--------|
| 1 | DSR Analyzer | Calculates Debt Service Ratio vs BNM 60% limit | DSR %, status (SAFE/WARNING/DANGER), headroom in RM |
| 2 | Risk Profiler | Full financial risk assessment | Risk score 0-100, savings rate, emergency fund analysis |
| 3 | Purchase Advisor | "Should I buy X?" verdict | BUY / WAIT / AVOID with concrete action steps |
| 4 | Investment Matchmaker | Maps user to Malaysian investments | 4 ranked picks (ASB, EPF, REITs, gold, stocks) |
| 5 | Rescue & Growth Planner | Personalised 3-month roadmap + Financial Twin | Month-by-month action plan + personality archetype |

Additional agents:
- **Scam Detector** — 3-dimension forensic analysis of suspicious messages (Technical, Psychological, Structural)
- **Fraud Vulnerability Profiler** — Assesses money mule risk and predatory loan exposure
- **Tax & Zakat Optimizer** — LHDN relief calculator + Zakat pendapatan estimator

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | Gemini 2.5 Flash (`@google/generative-ai` SDK) |
| Backend | Node.js + Express |
| Streaming | Server-Sent Events (SSE) — real-time per-agent results |
| Frontend | React + Vite |
| Deployment | Google Cloud Run |
| Development | Google AI Studio + Antigravity |

---

## Architecture

```
User Input (Browser)
      |
React Frontend (Vite + lucide-react)
      | POST /api/analyze  (SSE stream)
Express Backend (Node.js)
      |
  Multi-Agent Pipeline (sequential)
  Agent 1 (DSR) -> Agent 2 (Risk) -> Agent 3+4 (Purchase+Investment, parallel) -> Agent 5 (Plan)
      |
  Server-side post-processing (arithmetic never trusted to AI)
      |
  Shield Score calculation (pure math, server-side)
      |
Gemini 2.5 Flash API (Google AI)
      |
Google Cloud Run (deployed)
```

---

## AI Disclosure

This project uses AI coding assistance (Claude Code by Anthropic) for frontend/backend development. All AI-generated code has been reviewed, tested, and understood by the developer. The core AI intelligence of the product itself uses **Gemini 2.5 Flash** exclusively, as required by the hackathon's Google AI Ecosystem mandate.

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Step 1 — Clone & Install

```bash
git clone https://github.com/akmaizzuddin17/debtsense-my.git
cd debtsense-my

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Step 2 — Configure API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env and add your Gemini API key
```

```env
GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXX
PORT=3001
```

### Step 3 — Run Locally

Open two terminals:

**Terminal 1 — Backend:**
```bash
node backend/server.js
# Running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
# Open http://localhost:5173
```

---

## Deploy to Google Cloud Run

### One-command deploy (after `gcloud auth login`):

```bash
# Build frontend first
cd frontend && npm run build && cd ..

# Deploy
gcloud run deploy debtsense-my \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_api_key_here \
  --port 3001
```

---

## Malaysian Financial Context

| Term | Description |
|------|-------------|
| DSR | Debt Service Ratio — BNM's safe limit is 60% of gross income |
| PTPTN | National student loan scheme |
| EPF (KWSP) | Mandatory retirement fund — i-Saraan for self-employed top-up |
| ASB | Amanah Saham Bumiputera — fixed income unit trust |
| AKPK | Credit counselling agency (free service: 1800-88-2575) |
| Tabung Haji | Hajj pilgrimage savings fund |
| CCRIS | BNM central credit reference system |
| BNMTELELINK | BNM fraud hotline: 1-300-88-5465 |

---

## Project Structure

```
debtsense-my/
├── backend/
│   ├── server.js           # All 8 AI agents + Express API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css       # Design system (CSS variables)
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── InputForm.jsx
│   │       ├── Results.jsx
│   │       ├── ShieldScore.jsx
│   │       ├── FinancialTwin.jsx
│   │       └── AIAssistant.jsx
│   ├── package.json
│   └── vite.config.js
├── Dockerfile              # Cloud Run deployment
├── .env.example            # API key template
└── .gitignore
```

---

## Judging Criteria Alignment

| Criterion | How DebtSense MY addresses it |
|-----------|-------------------------------|
| AI Integration Depth (10pts) | 8 Gemini agents as core logic — not a chatbot wrapper |
| Agentic / Workflow Design (7pts) | Sequential 5-agent pipeline with SSE streaming; each agent feeds the next |
| Technical Complexity (5pts) | Server-side arithmetic correction, parallel agent execution, real-time streaming |
| Originality (8pts) | Financial vulnerability as a security metric — novel for Malaysia |
| National Relevance (7pts) | BNM DSR, PTPTN, EPF, AKPK, LHDN — built exclusively for Malaysian context |
| Real-World Impact (6pts) | Directly addresses BNM's financial literacy and BNMTELELINK fraud prevention agenda |

---

## Disclaimer

DebtSense MY is an educational AI tool and does not constitute financial or legal advice. Always consult a licensed financial advisor (CFP) for major financial decisions.
