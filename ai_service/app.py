import json
import re
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage

from services.ai import chat_model
from services.interview_agent import run_interview_agent, evaluate_interview
from services.resume_service import analyze_resume_with_ai

app = FastAPI(title="Crakd AI Service Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InterviewChatRequest(BaseModel):
    chatHistory: List[Dict[str, str]] = []
    role: Optional[str] = "Software Engineer"
    branch: Optional[str] = "Computer Science"
    questionType: Optional[str] = "technical"
    difficulty: Optional[str] = "medium"
    resumeText: Optional[str] = ""
    userId: Optional[str] = "default"

class ParseBioRequest(BaseModel):
    bioText: str

class AtsScoreRequest(BaseModel):
    resumeText: str
    jobDescription: Optional[str] = ""
    jobRole: Optional[str] = ""
    requiredSkills: Optional[Any] = []

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/interview/chat")
async def interview_chat(req: InterviewChatRequest):
    try:
        state = {
            "chatHistory": req.chatHistory,
            "role": req.role,
            "branch": req.branch,
            "questionType": req.questionType,
            "difficulty": req.difficulty,
            "resumeText": req.resumeText,
            "userId": req.userId,
            "resumeContext": None,
            "nextAction": None,
            "nextQuestion": None
        }
        res = await run_interview_agent(state)
        return res
    except Exception as e:
        print(f"Error in /api/interview/chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/evaluate")
async def interview_evaluate(req: InterviewChatRequest):
    try:
        state = {
            "chatHistory": req.chatHistory,
            "role": req.role,
            "branch": req.branch,
            "questionType": req.questionType,
            "difficulty": req.difficulty,
            "resumeText": req.resumeText,
            "userId": req.userId
        }
        res = await evaluate_interview(state)
        return res
    except Exception as e:
        print(f"Error in /api/interview/evaluate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/onboarding/parse-bio")
async def parse_bio(req: ParseBioRequest):
    try:
        prompt = f"""Extract student profile data from this text. Return ONLY JSON, no markdown.
Text: "{req.bioText}"
JSON structure (use null for missing):
{{"cgpa":null,"branch":null,"graduation_year":null,"college_name":null,"skills":[],"projects_count":null,"internships_count":null,"dsa_level":null,"communication_score":null,"target_role":null}}
Rules: cgpa=number, skills=array, dsa_level=Beginner/Intermediate/Advanced, projects_count=number"""

        response = await chat_model.ainvoke([
            SystemMessage(content="You are an expert data extraction bot."),
            HumanMessage(content=prompt)
        ])
        content = response.content.strip()
        
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            data = json.loads(json_match.group(0))
        else:
            data = json.loads(content)
            
        return data
    except Exception as e:
        print(f"Error in /api/onboarding/parse-bio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume/ats-score")
async def ats_score(req: AtsScoreRequest):
    try:
        skills = req.requiredSkills
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(',') if s.strip()]
        elif not isinstance(skills, list):
            skills = []
            
        res = await analyze_resume_with_ai(
            resume_text=req.resumeText,
            job_description=req.jobDescription,
            job_role=req.jobRole,
            required_skills=skills
        )
        return res
    except Exception as e:
        print(f"Error in /api/resume/ats-score: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
