# Crakd

AI-driven placement preparation platform for mastering coding assessments, technical interviews, and resumes.

## Architecture & Stack

*   **Frontend**: React + Vite (Tailored Premium CSS Modules)
*   **Backend Orchestrator**: Node.js + Express
*   **AI Microservice**: Python + FastAPI (LangGraph & LangChain RAG)
*   **Database**: PostgreSQL

## Quick Start

### 1. Python AI Service
```bash
cd ai_service
pip install -r requirements.txt
python app.py
```

### 2. Node.js Backend Server
```bash
cd backend
npm install
# Configure .env with your PostgreSQL and API credentials
npm run dev
```

### 3. React Frontend Client
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` in your browser.
