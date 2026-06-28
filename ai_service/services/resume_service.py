import os
import re
from typing import List, Optional
from pydantic import BaseModel, Field
from services.ai import chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# Pydantic Schemas for Resume Analysis Validation
class ReadabilityStats(BaseModel):
    score: int = Field(description="Score out of 100")
    level: str = Field(description="Complexity level, e.g. Very Easy, Easy, Fairly Easy, Standard, Fairly Difficult, Difficult, Very Difficult")
    avgWordsPerSentence: str = Field(description="Average words per sentence as a string representation of float, e.g. '14.2'")

class StudyTopic(BaseModel):
    topic: str = Field(description="Name of the topic to study, e.g. Redis Caching, DB Indexing")
    reason: str = Field(description="Specific, customized reason why they need to study this based on their projects/skills gaps")
    resources: List[str] = Field(description="Curated web resources or study suggestions")

class MockQuestion(BaseModel):
    question: str = Field(description="Highly detailed, customized mock interview question probing a project or skill listed on their resume")
    type: str = Field(description="Either 'Project' or 'Skill'")
    context: str = Field(description="Name of the specific project or skill this question probes, e.g. KshetraX, TensorFlow")

class ResumeAnalysisResult(BaseModel):
    overallScore: int = Field(description="Overall interview readiness based on match quality as an integer 0-100")
    atsScore: int = Field(description="Resume search compatibility as an integer 0-100")
    roleRelevance: int = Field(description="Fit for target role as an integer 0-100")
    readability: ReadabilityStats = Field(description="Readability statistics")
    studyTopics: List[StudyTopic] = Field(description="Personalized study topics list")
    possibleQuestions: List[MockQuestion] = Field(description="Customized mock interview questions based on resume")

def calculate_ats_score(resume_text: str, job_description: str) -> int:
    score = 0
    words = resume_text.split()
    word_count = len(words)
    
    if 300 <= word_count <= 800:
        score += 10
    elif word_count >= 200:
        score += 5
        
    sections = ['education', 'experience', 'skills', 'projects']
    score += (sum(1 for s in sections if s in resume_text.lower()) / len(sections)) * 20
    
    if '@' in resume_text:
        score += 5
    if re.search(r'\d{10}|\(\d{3}\)\s*\d{3}-\d{4}', resume_text):
        score += 5
        
    special_chars = len(re.findall(r'[^\w\s@.,\-()\n]', resume_text))
    if special_chars < 10:
        score += 10
    elif special_chars < 20:
        score += 5
        
    if job_description:
        jd_words = list(set([w.lower() for w in job_description.split() if len(w) > 3]))
        if jd_words:
            matched = sum(1 for w in jd_words if w in resume_text.lower())
            score += (matched / len(jd_words)) * 50
    else:
        score += 25
        
    return min(round(score), 100)

def analyze_keywords(resume_text: str, job_description: str) -> dict:
    words = re.findall(r'\b\w{4,}\b', resume_text.lower())
    freq = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    top_keywords = [{"word": w, "count": c} for w, c in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:15]]
    
    matched_count = 0
    missing = []
    total_jd = 0
    
    if job_description:
        jd_words = list(set(re.findall(r'\b\w{4,}\b', job_description.lower())))
        total_jd = len(jd_words)
        matched = [w for w in jd_words if w in resume_text.lower()]
        matched_count = len(matched)
        missing = [w for w in jd_words if w not in resume_text.lower()][:10]
        
    return {
        "topKeywords": top_keywords,
        "matchedKeywords": matched_count,
        "missingKeywords": missing,
        "totalJDKeywords": total_jd
    }

def calculate_readability(resume_text: str) -> dict:
    sentences = [s for s in re.split(r'[.!?]+', resume_text) if s.strip()]
    words = [w for w in resume_text.split() if w]
    syllables = sum(len(re.findall(r'[aeiouy]+', w.lower())) for w in words)
    
    s_count = max(len(sentences), 1)
    w_count = max(len(words), 1)
    
    awps = w_count / s_count
    aspw = syllables / w_count
    
    score = max(0, min(100, round(206.835 - 1.015 * awps - 84.6 * aspw)))
    
    level = 'Standard'
    if score >= 90: level = 'Very Easy'
    elif score >= 80: level = 'Easy'
    elif score >= 70: level = 'Fairly Easy'
    elif score >= 60: level = 'Standard'
    elif score >= 50: level = 'Fairly Difficult'
    elif score >= 30: level = 'Difficult'
    else: level = 'Very Difficult'
    
    return {
        "score": score,
        "level": level,
        "avgWordsPerSentence": f"{awps:.1f}"
    }

def calculate_role_relevance(resume_text: str, job_role: str, required_skills: list) -> int:
    score = 0
    if job_role and job_role.lower() in resume_text.lower():
        score += 20
    if required_skills:
        matched = sum(1 for s in required_skills if s.lower() in resume_text.lower())
        score += (matched / len(required_skills)) * 60
        
    exp_keywords = ['developed', 'implemented', 'led', 'managed', 'designed', 'built', 'created']
    score += (sum(1 for k in exp_keywords if k in resume_text.lower()) / len(exp_keywords)) * 20
    
    return round(score)

def generate_suggestions(ats_score: int, keywords: dict, readability: dict, role_relevance: int) -> list:
    s = []
    if ats_score < 70:
        s.append({
            "category": "ATS Optimization",
            "priority": "High",
            "suggestion": "Add clear section headers: Education, Experience, Skills, Projects."
        })
    if len(keywords.get("missingKeywords", [])) > 5:
        s.append({
            "category": "Keywords",
            "priority": "High",
            "suggestion": f"Include missing keywords: {', '.join(keywords['missingKeywords'][:5])}"
        })
    if readability.get("score", 100) < 60:
        s.append({
            "category": "Readability",
            "priority": "Medium",
            "suggestion": "Use bullet points and shorter sentences."
        })
    if role_relevance < 60:
        s.append({
            "category": "Role Relevance",
            "priority": "High",
            "suggestion": "Emphasize role-relevant skills. Use action verbs: developed, built, led."
        })
    return s

def run_fallback_analysis(resume_text: str, job_description: str, job_role: str, required_skills: list) -> dict:
    ats_score = calculate_ats_score(resume_text, job_description)
    readability = calculate_readability(resume_text)
    role_relevance = calculate_role_relevance(resume_text, job_role, required_skills)
    overall_score = round((ats_score + role_relevance + readability["score"] * 0.5) / 2.5)
    
    study_topics = [
        {
            "topic": "System Architecture & Design Patterns",
            "reason": "Essential to ensure your resume projects demonstrate robust modular structure and clean code practices.",
            "resources": ["System Design Primer (GitHub)", "GeeksforGeeks Software Design Patterns"]
        },
        {
            "topic": "Core Data Structures & Algorithms",
            "reason": "Vital for clearing placement screening tests and optimizing backend runtimes.",
            "resources": ["LeetCode Problem Sets", "NeetCode.io Study Roadmaps"]
        }
    ]
    
    possible_questions = [
        {
            "question": "Can you outline the database schema and system architecture of the most complex project on your resume?",
            "type": "Project",
            "context": "Resume Projects"
        },
        {
            "question": "What was the most challenging technical bug you encountered in your projects and how did you debug it?",
            "type": "Project",
            "context": "Resume Projects"
        }
    ]
    
    if required_skills:
        for skill in required_skills[:3]:
            study_topics.append({
                "topic": f"Deep Dive into {skill}",
                "reason": f"Required in target job descriptions but needs deeper validation of your practical experience.",
                "resources": [f"Official {skill} Reference Guides", f"W3Schools {skill} Tutorials"]
            })
            possible_questions.append({
                "question": f"Explain a scenario where you would use {skill} over an alternative technology, and how you optimize its performance.",
                "type": "Skill",
                "context": skill
            })
            
    return {
        "overallScore": overall_score,
        "atsScore": ats_score,
        "roleRelevance": role_relevance,
        "readability": readability,
        "studyTopics": study_topics,
        "possibleQuestions": possible_questions
    }

async def analyze_resume_with_ai(resume_text: str, job_description: str, job_role: str, required_skills: list) -> dict:
    skills_list = required_skills or []
    if isinstance(required_skills, str):
        skills_list = [s.strip() for s in required_skills.split(',') if s.strip()]
        
    parser = JsonOutputParser(pydantic_object=ResumeAnalysisResult)
    
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", "You are a professional placement preparation coach and technical reviewer. Your job is to format output in JSON according to: {format_instructions}"),
        ("user", "Your job is to analyze the candidate's resume text against a target job role and description, and generate:\n"
                 "1. A personalized Study Plan (a list of core topics the candidate needs to study).\n"
                 "   - This MUST include deep-dives into the specific technologies, databases, frameworks, or libraries the candidate has listed in their resume projects or skills (e.g. React Native, Firebase, Expo, TensorFlow, OpenCV, SQLite, etc.) to test their mastery.\n"
                 "   - It should also include core concepts based on the target job role and description gaps.\n"
                 "2. A list of possible Mock Interview Questions based specifically on their projects and skills.\n\n"
                 "Target Job Role: {job_role}\n"
                 "Target Job Description: {job_description}\n"
                 "Required Skills: {required_skills}\n\n"
                 "Candidate Resume Text:\n{resume_text}")
    ])
    
    # LCEL Chain
    chain = prompt_template | chat_model | parser
    
    try:
        data = await chain.ainvoke({
            "job_role": job_role or 'Software Engineer',
            "job_description": job_description or 'General Technical Role',
            "required_skills": ', '.join(skills_list) or 'None specified',
            "resume_text": resume_text,
            "format_instructions": parser.get_format_instructions()
        })
        return data
    except Exception as e:
        print(f"Warning: AI Resume analysis failed, running fallback. Error: {str(e)}")
        return run_fallback_analysis(resume_text, job_description, job_role, skills_list)
