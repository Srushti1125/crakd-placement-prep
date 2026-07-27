import os
from typing import List, Optional
from pydantic import BaseModel, Field
from services.ai import chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# Pydantic Schemas for Quiz Generation & Validation
class QuizQuestionItem(BaseModel):
    topic: str = Field(description="Specific category or topic name, e.g. Dynamic Programming, SQL, Quantitative, Python")
    difficulty: str = Field(description="Difficulty level: Easy, Medium, or Hard")
    question: str = Field(description="Full question text. Include multi-line code blocks with syntax tags (e.g. ```python ... ```) if applicable.")
    options: List[str] = Field(description="List of exactly 4 choices")
    correct_answer: int = Field(description="0-indexed integer position (0, 1, 2, or 3) of the correct choice in options")
    explanation: str = Field(description="Step-by-step reasoning explaining why the correct choice is right")

class QuizQuestionPackage(BaseModel):
    questions: List[QuizQuestionItem] = Field(description="List of generated MCQ questions")

COMPANY_PATTERNS = {
    "TCS": {"quantitative": 40, "logical": 30, "verbal": 20, "spatial": 10},
    "Infosys": {"quantitative": 35, "logical": 35, "verbal": 20, "spatial": 10},
    "Wipro": {"quantitative": 30, "logical": 30, "verbal": 25, "spatial": 15},
    "General": {"quantitative": 30, "logical": 30, "verbal": 25, "spatial": 15}
}

SUBJECT_TOPICS = {
    'Data Structures and Algorithms': ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting', 'Searching', 'Hashing'],
    'SQL': ['SELECT queries', 'JOINs', 'Aggregations', 'Subqueries', 'Indexes', 'Normalization', 'Transactions', 'Window Functions'],
    'OOPS': ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction', 'Design Patterns', 'Interfaces', 'Abstract Classes'],
    'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation', 'Feature Engineering', 'Neural Networks', 'Overfitting'],
    'Operating Systems': ['Process Management', 'Memory Management', 'File Systems', 'Deadlocks', 'Scheduling', 'Synchronization', 'Virtual Memory'],
    'Computer Networks': ['OSI Model', 'TCP/IP', 'HTTP/HTTPS', 'DNS', 'Routing', 'Subnetting', 'Network Security'],
    'Software Engineering': ['SDLC', 'Agile', 'Testing Types', 'Design Patterns', 'Version Control', 'CI/CD', 'System Design']
}

def _normalize_questions(raw_questions: any) -> List[dict]:
    """Validates and normalizes raw questions into consistent dictionaries."""
    validated = []
    if not isinstance(raw_questions, list):
        return validated
        
    for q in raw_questions:
        if isinstance(q, dict) and "question" in q and "options" in q:
            opts = q.get("options", [])
            if not isinstance(opts, list) or len(opts) < 2:
                continue
            try:
                ca = int(q.get("correct_answer", 0))
            except (ValueError, TypeError):
                ca = 0
            ca = max(0, min(len(opts) - 1, ca))
            
            validated.append({
                "topic": str(q.get("topic", "General")),
                "difficulty": str(q.get("difficulty", "Medium")),
                "question": str(q.get("question", "")),
                "options": [str(opt) for opt in opts],
                "correct_answer": ca,
                "explanation": str(q.get("explanation", "Refer to standard technical documentation."))
            })
    return validated

async def generate_quiz_questions_with_ai(
    test_type: str,
    topics: List[str],
    time_limit: int,
    company_pattern: Optional[str] = None
) -> List[dict]:
    """Generates structured placement MCQs using LangChain LCEL chain (ChatPromptTemplate | chat_model | JsonOutputParser)."""
    
    total_questions = 30
    prompt_instruction = ""
    
    if test_type == 'aptitude':
        total_questions = 30
        pattern = COMPANY_PATTERNS.get(company_pattern) or COMPANY_PATTERNS["General"]
        
        q_quant = round(total_questions * pattern["quantitative"] / 100)
        q_logical = round(total_questions * pattern["logical"] / 100)
        q_verbal = round(total_questions * pattern["verbal"] / 100)
        q_spatial = round(total_questions * pattern["spatial"] / 100)
        
        company_str = f" in the style of {company_pattern} campus recruitment tests" if company_pattern else ""
        
        prompt_instruction = f"""Generate exactly {total_questions} high-quality placement aptitude MCQ questions{company_str}.

Category Distribution:
- {q_quant} Quantitative Aptitude (word problems, work & time, speed & distance, probability, percentages, profit/loss)
- {q_logical} Logical Reasoning (syllogisms, coding-decoding, blood relations, series, seating arrangement)
- {q_verbal} Verbal Ability (reading comprehension, grammar correction, vocabulary, sentence completion)
- {q_spatial} Spatial Reasoning / Pattern Recognition

Difficulty Breakdown:
- 40% Easy, 40% Medium, 20% Hard.

Guidelines:
- Each question must be realistic, challenging, and clear.
- Provide 4 distinct options and a 0-indexed integer for correct_answer (0, 1, 2, or 3).
- Provide a clear step-by-step mathematical or logical explanation.
"""

    elif test_type == 'subject':
        time_minutes = time_limit or 30
        total_questions = time_minutes * 2
        
        topic_details = []
        for t in (topics or []):
            subtopics = SUBJECT_TOPICS.get(t) or []
            topic_details.append(f"- {t}: Focus on core concepts like {', '.join(subtopics)}")
            
        topics_str = "\n".join(topic_details)
        
        prompt_instruction = f"""Generate exactly {total_questions} subject-specific technical MCQ questions for software placement preparation.

Topics Covered:
{topics_str}

Difficulty Breakdown:
- 35% Easy (fundamental definitions & core concepts)
- 45% Medium (practical scenarios & applied technical knowledge)
- 20% Hard (tricky edge cases, internal workings, & complex problem solving)

Guidelines:
- Ensure questions reflect real technical interview online assessments (e.g. GATE/TCS NQT/Infosys Pseudo-code standard).
- Include code snippets or query blocks inside markdown code blocks where applicable (e.g. ```sql ... ```).
- Provide 4 clear options and an educational explanation explaining why the correct option is right.
"""

    elif test_type == 'coding':
        time_minutes = time_limit or 30
        total_questions = time_minutes * 2
        
        prompt_instruction = f"""Generate exactly {total_questions} code analysis MCQ questions for software engineering placement tests.

Question Types Mix:
1. "What is the output of this code?" (Focus on scoping, pointer arithmetic, string manipulation, recursion, type coercion)
2. "What is the time/space complexity of this function?" (Focus on loops, recursion trees, dynamic programming)
3. "Which line contains a bug or syntax error?" (Focus on array bounds, null references, off-by-one errors)
4. "What does this code do / How can it be optimized?"

Languages: Use Python, Java, C++, and JavaScript.
Code Format: Every coding question MUST include a short, clean code snippet (5-10 lines max) formatted with markdown code blocks (e.g. ```python ... ``` or ```cpp ... ```).

Difficulty Breakdown:
- 30% Easy, 50% Medium, 20% Hard.

Guidelines:
- Code snippets must use proper syntax.
- Options must include common candidate misconception outputs as distractors.
- Explanations must walk through code execution line-by-line.
"""

    # Setup LangChain Output Parser with Pydantic Schema
    parser = JsonOutputParser(pydantic_object=QuizQuestionPackage)
    
    # Setup ChatPromptTemplate
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", "You are a senior technical assessment compiler and campus recruitment specialist. "
                   "Generate high-quality, professional placement exam questions.\n"
                   "Format your output strictly in JSON according to:\n{format_instructions}"),
        ("user", "{instruction}")
    ])
    
    # LCEL Chain: prompt_template | chat_model | parser
    chain = prompt_template | chat_model | parser
    
    try:
        data = await chain.ainvoke({
            "instruction": prompt_instruction,
            "format_instructions": parser.get_format_instructions()
        })
        
        # Extract questions array from parser output
        if isinstance(data, dict):
            raw_questions = data.get("questions") or []
        elif isinstance(data, list):
            raw_questions = data
        else:
            raw_questions = []
            
        return _normalize_questions(raw_questions)
        
    except Exception as err:
        print(f"Error generating quiz questions via LCEL chain: {str(err)}")
        return []
