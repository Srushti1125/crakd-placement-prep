import asyncio
import os
import sys

# Configure UTF-8 encoding for stdout to prevent Windows CP1252 charmap encoding errors
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add the parent folder to the system path to allow importing modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.resume_service import retrieve_context, analyze_resume_with_ai
from services.interview_agent import run_interview_agent, evaluate_interview

sample_resume = """
SRUSHTI KHADE
EDUCATION: Sardar Patel Institute of Technology, B.Tech in Computer Engineering, CGPA: 9.62/10
TECHNICAL SKILLS:
Languages: C++, Java, Python, SQL, JavaScript
Frameworks: React.js, Flask, TensorFlow, Scikit-learn
PROJECTS:
KshetraX: Construction Workforce System | React Native, Expo, Firebase (Nov 2025)
- Developed a mobile application to digitize construction site operations, reducing manual record-keeping errors.
- Engineered a multilingual interface with voice recording capabilities.
Deepfake Detection System | Python, TensorFlow, OpenCV (Aug 2025)
- Built a multimodal neural network to identify face manipulation in audio-video streams.
"""

async def run_tests():
    print("[INFO] Starting Python AI Agents Local Verification Test...")
    print("==================================================")
    
    # 1. Test RAG Context Retrieval
    print("\n1. Testing RAG Context Retrieval...")
    query = "KshetraX mobile app"
    context = retrieve_context(user_id="test_user_1", query=query, resume_text=sample_resume)
    print("[RAG] Query:", query)
    print("[RAG] Retrieved Context:")
    print(context.strip())
    assert "KshetraX" in context or "React Native" in context, "RAG Context Retrieval Failed!"
    print("[SUCCESS] RAG Context Retrieval Verification Passed.")
    print("--------------------------------------------------")
    
    # 2. Test LangGraph Mock Interview Routing and Question Generation
    print("\n2. Testing LangGraph Mock Interview (Project Probing Node)...")
    chat_history = [
        {"role": "assistant", "text": "Welcome to your mock interview! Please tell me about your projects."},
        {"role": "user", "text": "I built a mobile app named KshetraX using React Native to digitize construction work site records."}
    ]
    state = {
        "chatHistory": chat_history,
        "role": "Software Engineer",
        "branch": "Computer Engineering",
        "questionType": "technical",
        "difficulty": "medium",
        "resumeText": sample_resume,
        "userId": "test_user_1",
        "resumeContext": None,
        "nextAction": None,
        "nextQuestion": None
    }
    
    try:
        result = await run_interview_agent(state)
        print("[ORCH] Agent Orchestrator Next Action:", result.get("nextAction"))
        print("[AGENT] Agent Interviewer Question:", result.get("nextQuestion"))
        assert result.get("nextQuestion"), "Failed to generate follow-up question!"
        print("[SUCCESS] LangGraph Interview Agent Verification Passed.")
    except Exception as e:
        print(f"[FAIL] LangGraph Interview Agent Failed: {str(e)}")
        
    print("--------------------------------------------------")
    
    # 3. Test Resume Study Plan & Questions Generator
    print("\n3. Testing Resume Study Plan & Questions Generator...")
    try:
        ats_result = await analyze_resume_with_ai(
            resume_text=sample_resume,
            job_description="We are looking for a mobile app developer proficient in React Native, Expo, and Firebase database setup.",
            job_role="Mobile App Developer",
            required_skills=["React Native", "Expo", "Firebase"]
        )
        print("[PREP] Overall Score:", ats_result.get("overallScore"))
        print("[PREP] Study Topics Count:", len(ats_result.get("studyTopics", [])))
        print("[PREP] Possible Questions Count:", len(ats_result.get("possibleQuestions", [])))
        
        # Print a sample topic and question
        if ats_result.get("studyTopics"):
            print("[PREP] Sample Topic:", ats_result.get("studyTopics")[0].get("topic"))
        if ats_result.get("possibleQuestions"):
            print("[PREP] Sample Question:", ats_result.get("possibleQuestions")[0].get("question"))
            
        assert "studyTopics" in ats_result, "studyTopics missing from result!"
        assert "possibleQuestions" in ats_result, "possibleQuestions missing from result!"
        print("[SUCCESS] Resume Study Plan & Questions Generator Verification Passed.")
    except Exception as e:
        print(f"[FAIL] Resume Study Plan & Questions Generator Failed: {str(e)}")
        
    print("==================================================")
    print("[INFO] All Python AI Agent Tests Completed!")

if __name__ == "__main__":
    asyncio.run(run_tests())
