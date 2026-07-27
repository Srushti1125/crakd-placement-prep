# Crakd — AI-Powered Placement Preparation Platform

> A full-stack platform for engineering students to master technical interviews, resume optimization, and placement assessments using AI.

---

## Architecture Diagram

![Crakd Architecture Diagram](./architecture.jpg)

---

## Features

- 🤖 **AI Mock Interviewer** — Stateful LangGraph agent with 7-turn conversational interview, resume-aware follow-up questions, and detailed scorecard
- 📄 **Resume ATS Analyzer** — Keyword gap analysis, Flesch readability scoring, role relevance scoring, and AI-generated personalized study plan
- 📚 **Company Experiences (RAG)** — Local ChromaDB vector search over senior interview PDFs to surface real insights for 20+ companies
- 🧪 **Adaptive Quiz Engine** — Gemini-generated MCQs with 3 modes (Aptitude, Subject, Coding), company patterns, and cumulative weakness tracking
- 🎯 **AI Onboarding** — Bio text parsed by Gemini into structured student profiles using LCEL + Pydantic schemas
- 📊 **Dashboard** — Interview readiness score, score history charts, and weak topic analytics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| API Gateway | Node.js + Express |
| AI Microservice | Python + FastAPI |
| AI Agent | LangGraph + LangChain |
| LLM | Google Gemini 2.5 Flash |
| Vector DB | ChromaDB (local, offline) |
| Embeddings | ONNX all-MiniLM-L6-v2 (CPU) |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |

---

## Quick Start

### 1. Python AI Service
```bash
cd ai_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 2. Node.js Backend Server
```bash
cd backend
npm install
# Configure .env with PostgreSQL and Gemini API credentials
npm run dev
```

### 3. React Frontend Client
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` in your browser.

---

## Environment Variables

Create a `.env` file in `backend/`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/crakd
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
GEMINI_API_KEY=your_gemini_api_key
PYTHON_AI_URL=http://127.0.0.1:8000
```

Create a `.env` file in `ai_service/`:
```
GEMINI_API_KEY=your_gemini_api_key
```

