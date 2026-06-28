from typing import TypedDict, List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
from services.ai import chat_model

class InterviewState(TypedDict):
    chatHistory: List[Dict[str, str]]
    role: Optional[str]
    branch: Optional[str]
    questionType: Optional[str]
    difficulty: Optional[str]
    resumeText: Optional[str]
    userId: Optional[str]
    resumeContext: Optional[str]
    nextAction: Optional[str]
    nextQuestion: Optional[str]

async def orchestrator_node(state: InterviewState) -> Dict[str, Any]:
    chat_history = state.get("chatHistory") or []
    role = state.get("role") or "Software Engineer"
    branch = state.get("branch") or "Computer Science"
    question_type = state.get("questionType") or "technical"
    difficulty = state.get("difficulty") or "medium"
    
    turn = sum(1 for m in chat_history if m.get("role") == "user") + 1
    
    if turn > 7:
        return {"nextAction": "END_INTERVIEW"}
        
    history_str = "\n".join(
        f"{'Candidate' if m.get('role') == 'user' else 'Interviewer'}: {m.get('text')}"
        for m in chat_history
    )
    
    system_prompt = f"""You are the Interview Orchestrator Agent for the Crakd placement preparation platform.
Your job is to analyze the current interview state and choose the next action.

Role: {role}
Branch: {branch}
Interview Track: {question_type} (Options: "hr", "technical")
Difficulty: {difficulty}
Current Turn: {turn} of 7 (Hard limit: 7 turns)

Available actions:
- SEARCH_RESUME: Retrieve specific details/technologies from the candidate's resume context.
- ANALYZE_PROJECT: Focus specifically on asking about one of the candidate's projects.
- ASK_TECHNICAL: Ask an advanced role-specific technical question.
- ASK_CS_FUNDAMENTALS: Ask a question about core CS concepts (DBMS, CN, DAA, OS).
- ASK_HR: Ask a behavioral or fitment question.
- END_INTERVIEW: Conclude the mock interview session.

Coverage Requirements:
- If Track is "hr": You must ask at least one SEARCH_RESUME question and at least two ASK_HR questions before ending. Do NOT choose ASK_TECHNICAL or ASK_CS_FUNDAMENTALS.
- If Track is "technical": You must cover ALL technical action types (SEARCH_RESUME, ANALYZE_PROJECT, ASK_TECHNICAL, and ASK_CS_FUNDAMENTALS) at least once before concluding. Do NOT choose ASK_HR.

Routing Logic:
1. Examine the chat history carefully. Identify which categories of questions (actions) have already been covered.
2. If there are required categories that have NOT been covered yet, choose one of those uncovered actions.
3. If ALL required categories for the track have been covered at least once (which typically takes 5 to 6 turns), choose END_INTERVIEW.
4. If the turn count has reached 7 (Current Turn: {turn}), you MUST choose END_INTERVIEW to conclude the session.

Here is the ongoing chat history:
{history_str or "(No chat history yet)"}

Analyze the history and state. Return a response containing:
ACTION: [one of SEARCH_RESUME, ANALYZE_PROJECT, ASK_TECHNICAL, ASK_CS_FUNDAMENTALS, ASK_HR, END_INTERVIEW]"""

    try:
        response = await chat_model.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content="Choose the next action.")
        ])
        text = response.content.strip()
        print(f"Orchestrator raw decision: {text}")
        
        action = "ASK_TECHNICAL"
        if "END_INTERVIEW" in text: action = "END_INTERVIEW"
        elif "SEARCH_RESUME" in text: action = "SEARCH_RESUME"
        elif "ANALYZE_PROJECT" in text: action = "ANALYZE_PROJECT"
        elif "ASK_CS_FUNDAMENTALS" in text: action = "ASK_CS_FUNDAMENTALS"
        elif "ASK_HR" in text: action = "ASK_HR"
        elif "ASK_TECHNICAL" in text: action = "ASK_TECHNICAL"
        
        if question_type == 'hr' and action not in ['SEARCH_RESUME', 'END_INTERVIEW']:
            action = 'ASK_HR'
        elif question_type == 'technical' and action == 'ASK_HR':
            action = 'ASK_TECHNICAL'
            
        print(f"Orchestrator finalized action: {action}")
        return {"nextAction": action}
    except Exception as e:
        print(f"Orchestrator error, defaulting: {str(e)}")
        return {"nextAction": "ASK_HR" if question_type == 'hr' else "ASK_TECHNICAL"}

async def search_resume_node(state: InterviewState) -> Dict[str, Any]:
    resume_text = state.get("resumeText") or ""
    chat_history = state.get("chatHistory") or []
    role = state.get("role") or "Software Engineer"
    branch = state.get("branch") or "Computer Science"
    user_id = state.get("userId") or "default"
    
    # Pass the entire resume text directly for complete resume coverage
    context = resume_text
    history_str = "\n".join(
        f"{'Candidate' if m.get('role') == 'user' else 'Interviewer'}: {m.get('text')}"
        for m in chat_history
    )
    
    prompt = f"""You are an expert interviewer. Ask a specific follow-up question based on the candidate's resume context:
{context}

Ongoing Chat History:
{history_str}

Guidelines:
- Actively listen to the candidate's latest response in the chat history.
- Ask a logical, conversational follow-up question that builds directly on what they just said, using the resume context for reference.
- Do not jump to a random topic. Probe deeper into their last answer (e.g., if they mentioned a technology, ask how they used it or explain a challenge they faced with it).
- Ask ONLY one question. Do not say "Thank you" and do not write intro/outro text."""

    response = await chat_model.ainvoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Ask the next follow-up question based on the resume.")
    ])
    return {"nextQuestion": response.content.strip()}

async def analyze_project_node(state: InterviewState) -> Dict[str, Any]:
    resume_text = state.get("resumeText") or ""
    chat_history = state.get("chatHistory") or []
    
    # Pass the entire resume text to analyze projects with global context
    context = resume_text
    history_str = "\n".join(
        f"{'Candidate' if m.get('role') == 'user' else 'Interviewer'}: {m.get('text')}"
        for m in chat_history
    )
    
    prompt = f"""You are a technical interviewer. Ask a deep follow-up question specifically probing one of the projects listed on the candidate's resume:
{context}

Ongoing Chat History:
{history_str}

Guidelines:
- Actively listen to the candidate's latest response.
- Ask a conversational follow-up question that probes deeper into the project details, architecture, database choices, scalability, or implementation details they just mentioned.
- Make the question a direct continuation of their last response rather than a generic prompt.
- Ask ONLY one question. Do not write filler text."""

    response = await chat_model.ainvoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Ask the next question about their projects.")
    ])
    return {"nextQuestion": response.content.strip()}

async def ask_technical_node(state: InterviewState) -> Dict[str, Any]:
    chat_history = state.get("chatHistory") or []
    role = state.get("role") or "Software Engineer"
    branch = state.get("branch") or "Computer Science"
    difficulty = state.get("difficulty") or "medium"
    
    history_str = "\n".join(
        f"{'Candidate' if m.get('role') == 'user' else 'Interviewer'}: {m.get('text')}"
        for m in chat_history
    )
    
    prompt = f"""You are a technical interviewer. Ask a professional technical follow-up question.
Role: {role} | Branch: {branch} | Difficulty: {difficulty}

Ongoing Chat History:
{history_str}

Guidelines:
- Actively listen to the candidate's latest response in the chat history.
- Ask a direct follow-up question based on the technologies, tools, or concepts they just discussed. 
- Do not jump to a disjointed technical concept. For example, if they just talked about React state, ask about useEffect, context, or Redux; if they talked about SQL, ask about indexing or query tuning.
- Ensure the question flows naturally from the conversation history. Do not repeat questions.
- Ask ONLY one question. Do not write filler text."""

    response = await chat_model.ainvoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Ask the next technical follow-up question.")
    ])
    return {"nextQuestion": response.content.strip()}

async def ask_cs_fundamentals_node(state: InterviewState) -> Dict[str, Any]:
    chat_history = state.get("chatHistory") or []
    role = state.get("role") or "Software Engineer"
    branch = state.get("branch") or "Computer Science"
    difficulty = state.get("difficulty") or "medium"
    
    history_str = "\n".join(
        f"{'Candidate' if m.get('role') == 'user' else 'Interviewer'}: {m.get('text')}"
        for m in chat_history
    )
    
    prompt = f"""You are a technical interviewer. Ask a question about core Computer Science Fundamentals (DBMS, Computer Networks, Data Structures & Algorithms, or Operating Systems).
Role: {role} | Branch: {branch} | Difficulty: {difficulty}

Ongoing Chat History:
{history_str}

Guidelines:
- Review the chat history. Attempt to connect the CS fundamentals question to a concept the candidate has mentioned (e.g., if they discussed database caching, ask about DBMS indexing/transactions; if they discussed REST APIs, ask about HTTP/TCP/IP routing; if they discussed backend performance, ask about time/space complexity).
- Make the transition feel natural and conversational.
- Do NOT repeat questions that have already been asked in the history.
- Ask ONLY one question. Do not write filler."""

    response = await chat_model.ainvoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Ask the next CS fundamentals question.")
    ])
    return {"nextQuestion": response.content.strip()}

async def ask_hr_node(state: InterviewState) -> Dict[str, Any]:
    chat_history = state.get("chatHistory") or []
    role = state.get("role") or "Software Engineer"
    
    history_str = "\n".join(
        f"{'Candidate' if m.get('role') == 'user' else 'Interviewer'}: {m.get('text')}"
        for m in chat_history
    )
    
    prompt = f"""You are an HR interviewer. Ask a behavioral, situational, or fitment question.
Target Role: {role}

Ongoing Chat History:
{history_str}

Guidelines:
- Actively listen to the candidate's latest response in the chat history.
- Ask a conversational follow-up question that drills down on their motivations, conflict resolution, or teamwork experience as mentioned in their last response.
- Do not jump to a generic list of questions. Make it a natural continuation of their words.
- Do NOT repeat questions from history.
- Ask ONLY one question. Do not write filler."""

    response = await chat_model.ainvoke([
        SystemMessage(content=prompt),
        HumanMessage(content="Ask the next HR behavioral follow-up question.")
    ])
    return {"nextQuestion": response.content.strip()}

def route_next_node(state: InterviewState) -> str:
    action = state.get("nextAction")
    print(f"LangGraph routing action: {action}")
    if action == "SEARCH_RESUME":
        return "search_resume"
    elif action == "ANALYZE_PROJECT":
        return "analyze_project"
    elif action == "ASK_TECHNICAL":
        return "ask_technical"
    elif action == "ASK_CS_FUNDAMENTALS":
        return "ask_cs_fundamentals"
    elif action == "ASK_HR":
        return "ask_hr"
    else:
        return END

workflow = StateGraph(InterviewState)

workflow.add_node("orchestrator", orchestrator_node)
workflow.add_node("search_resume", search_resume_node)
workflow.add_node("analyze_project", analyze_project_node)
workflow.add_node("ask_technical", ask_technical_node)
workflow.add_node("ask_cs_fundamentals", ask_cs_fundamentals_node)
workflow.add_node("ask_hr", ask_hr_node)

workflow.set_entry_point("orchestrator")

workflow.add_conditional_edges(
    "orchestrator",
    route_next_node,
    {
        "search_resume": "search_resume",
        "analyze_project": "analyze_project",
        "ask_technical": "ask_technical",
        "ask_cs_fundamentals": "ask_cs_fundamentals",
        "ask_hr": "ask_hr",
        END: END
    }
)

workflow.add_edge("search_resume", END)
workflow.add_edge("analyze_project", END)
workflow.add_edge("ask_technical", END)
workflow.add_edge("ask_cs_fundamentals", END)
workflow.add_edge("ask_hr", END)

compiled_graph = workflow.compile()

async def run_interview_agent(state: dict) -> dict:
    result = await compiled_graph.ainvoke(state)
    return {
        "nextAction": result.get("nextAction"),
        "nextQuestion": result.get("nextQuestion")
    }

async def evaluate_interview(state: dict) -> dict:
    chat_history = state.get("chatHistory") or []
    role = state.get("role") or "Software Engineer"
    branch = state.get("branch") or "Computer Science"
    question_type = state.get("questionType") or "technical"
    difficulty = state.get("difficulty") or "medium"
    resume_text = state.get("resumeText") or ""
    user_id = state.get("userId") or "default"
    
    history_str = "\n".join(
        f"{'Candidate' if m.get('role') == 'user' else 'Interviewer'}: {m.get('text')}"
        for m in chat_history
    )
    
    prompt = f"""You are a senior tech recruiter and HR evaluator. You are reviewing a mock interview session.
Target Job Role: {role}
Branch/Field: {branch}
Interview Type: {question_type}
Difficulty: {difficulty}

"""
    if resume_text:
        import re
        resume_summary = retrieve_context(user_id, "", resume_text, 10)
        prompt += f"Candidate's Resume Context:\n{resume_summary}\n\n"
        
    prompt += f"Here is the full interview transcript:\n{history_str}\n\n"
    prompt += """Critique the candidate's performance. Return ONLY a valid JSON object with the following fields:
{
  "score": <overall score integer between 0 and 100>,
  "strengths": ["list of 2-3 specific strengths"],
  "improvements": ["list of 2-3 specific areas of improvement"],
  "suggestions": ["list of 2-3 concrete tips"],
  "radarMetrics": {
    "technicalDepth": <score 0-100>,
    "communication": <score 0-100>,
    "problemSolving": <score 0-100>,
    "relevance": <score 0-100>
  },
  "overallEvaluation": "A detailed 3-4 sentence critique explaining the scoring and resume match."
}

Do not include any markdown format or wrap in ```json. Return ONLY raw JSON."""

    try:
        import re
        import json
        response = await chat_model.ainvoke([
            SystemMessage(content=prompt),
            HumanMessage(content="Generate the evaluation scorecard JSON.")
        ])
        content = response.content.strip()
        
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            data = json.loads(json_match.group(0))
        else:
            data = json.loads(content)
            
        return data
    except Exception as e:
        print(f"Evaluation error: {str(e)}")
        return {
            "score": 75,
            "strengths": ["Clear communication", "Good overview of achievements"],
            "improvements": ["Provide more quantitative metrics for projects"],
            "suggestions": ["Use the STAR method structure"],
            "radarMetrics": { "technicalDepth": 75, "communication": 80, "problemSolving": 70, "relevance": 75 },
            "overallEvaluation": "Evaluation complete. Good performance, with room to refine details."
        }
