import json
import re
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from services.ai import chat_model
from services.interview_agent import run_interview_agent, evaluate_interview
from services.resume_service import analyze_resume_with_ai
from services.experiences_service import get_available_companies, generate_company_insights

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

class CompanyInsightsRequest(BaseModel):
    companyFolder: str

# Pydantic schema for structured student profiles from bio text
class StudentProfileData(BaseModel):
    cgpa: Optional[float] = Field(description="Student's CGPA, e.g. 9.1 or null if missing")
    branch: Optional[str] = Field(description="Academic branch/major, e.g. Computer Science or null if missing")
    graduation_year: Optional[int] = Field(description="Graduation year as integer, or null if missing")
    college_name: Optional[str] = Field(description="Name of college, or null if missing")
    skills: List[str] = Field(description="Array of extracted technical skills or empty list if none")
    projects_count: Optional[int] = Field(description="Count of engineering projects completed, or null if missing")
    internships_count: Optional[int] = Field(description="Count of internships completed, or null if missing")
    dsa_level: Optional[str] = Field(description="DSA experience level. Must be one of: Beginner, Intermediate, Advanced, or null if missing")
    communication_score: Optional[int] = Field(description="Estimated communication score from 1 to 10 based on bio description, or null if missing")
    target_role: Optional[str] = Field(description="Target job title or role, or null if missing")

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
        parser = JsonOutputParser(pydantic_object=StudentProfileData)
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are an expert data extraction bot. Extract student profile data. Format in JSON according to:\n{format_instructions}"),
            ("user", "Extract student profile data from this text:\n\"{bio_text}\"\n\nRules: cgpa must be a float/number, skills must be an array, dsa_level must be one of: Beginner, Intermediate, Advanced.")
        ])
        
        # LCEL Chain
        chain = prompt_template | chat_model | parser
        
        data = await chain.ainvoke({
            "bio_text": req.bioText,
            "format_instructions": parser.get_format_instructions()
        })
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

@app.get("/api/experiences/companies")
def get_companies():
    try:
        companies = get_available_companies()
        return {"companies": companies}
    except Exception as e:
        print(f"Error in /api/experiences/companies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/experiences/insights")
async def get_insights(req: CompanyInsightsRequest):
    try:
        insights = await generate_company_insights(req.companyFolder)
        return insights
    except Exception as e:
        print(f"Error in /api/experiences/insights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
