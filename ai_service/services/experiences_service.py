import os
import re
from typing import List
from pydantic import BaseModel, Field
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.ai import chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.documents import Document
from langchain_chroma import Chroma

EXPERIENCES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "2026_Interview_Experiences")
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chroma_db")

# Wrapper class for Chroma's native, offline local ONNX embedding model (all-MiniLM-L6-v2)
class LocalONNXEmbeddings:
    """Wrapper around Chroma's native, local ONNX-based sentence transformer."""
    def __init__(self):
        from chromadb.utils import embedding_functions
        # DefaultEmbeddingFunction downloads and runs all-MiniLM-L6-v2 locally via onnxruntime
        self.ef = embedding_functions.DefaultEmbeddingFunction()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.ef(texts)

    def embed_query(self, text: str) -> List[float]:
        return self.ef([text])[0]

# Initialize local, offline embeddings
embeddings = LocalONNXEmbeddings()

# Pydantic Schemas for Output Verification & Format Injection
class TopicPrep(BaseModel):
    topic: str = Field(description="Name of core coding topic, e.g., OOPs, Java Collections, Dynamic Programming")
    frequency: str = Field(description="Frequency of the topic in interviews. Must be one of: High, Medium, Low")
    tips: str = Field(description="Specific study tip derived from student experiences")

class CompanyInsights(BaseModel):
    companyName: str = Field(description="Name of the company, e.g. Barclays, JPMC")
    difficultyRating: int = Field(description="Relative difficulty of selection as an integer from 1 to 5 (1=Very Easy, 5=Extremely Hard)")
    aptitudeDifficulty: int = Field(description="Difficulty of Aptitude/Online Test rounds as an integer from 1 to 5")
    technicalDifficulty: int = Field(description="Difficulty of Technical Interview rounds as an integer from 1 to 5")
    hrDifficulty: int = Field(description="Difficulty of HR/Behavioral rounds as an integer from 1 to 5")
    roundsList: List[str] = Field(description="List of round names in chronological order, e.g. ['Aptitude Online Test', 'DSA Technical Round']")
    keyTopics: List[TopicPrep] = Field(description="Key technical topics to prepare")
    behavioralTips: List[str] = Field(description="Behavioral tips, company core values, or cultural match pointers")
    difficultHurdles: List[str] = Field(description="Specific difficult scenarios or round aspects to prepare for")
    studentQuotes: List[str] = Field(description="Exact sentence or direct advice quote extracted from student experiences. Max 25 words per quote.")
    offeredPackages: List[str] = Field(description="List of salary packages, CTC, or job profiles offered by the company as mentioned in student reviews, e.g. ['14 LPA (FTE)', '8 LPA (Intern)']")

def get_available_companies() -> list:
    """Scan the experiences directory and return the names of all company folders."""
    if not os.path.exists(EXPERIENCES_DIR):
        return []
    
    companies = []
    for item in os.listdir(EXPERIENCES_DIR):
        full_path = os.path.join(EXPERIENCES_DIR, item)
        if os.path.isdir(full_path):
            display_name = item.replace("_2026", "").replace("_Summer_Interns", " (Interns)").replace("_", " ")
            companies.append({
                "folderName": item,
                "displayName": display_name
            })
    
    return sorted(companies, key=lambda x: x["displayName"])

def parse_and_chunk_pdfs(company_folder: str) -> list:
    """Read all PDFs in the company subfolder and split them into chunks."""
    company_path = os.path.join(EXPERIENCES_DIR, company_folder)
    if not os.path.exists(company_path):
        return []
    
    chunks = []
    splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=120)
    
    for file in os.listdir(company_path):
        if file.lower().endswith(".pdf"):
            pdf_path = os.path.join(company_path, file)
            try:
                reader = PdfReader(pdf_path)
                full_text = ""
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        full_text += text + "\n"
                
                if full_text.strip():
                    file_chunks = splitter.split_text(full_text)
                    for chunk in file_chunks:
                        chunks.append({
                            "text": chunk,
                            "source": file
                        })
            except Exception as e:
                print(f"Error reading PDF {file}: {str(e)}")
                
    return chunks

def retrieve_company_context(company_folder: str, query: str = None, max_chunks: int = 12) -> list:
    """Semantic RAG Retrieval: Returns the top relevant chunks for a selected company using local offline ChromaDB."""
    clean_collection_name = re.sub(r'[^a-zA-Z0-9_-]', '_', company_folder).lower()
    
    vector_store = Chroma(
        collection_name=clean_collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_DB_DIR
    )
    
    try:
        count = vector_store._collection.count()
    except Exception:
        count = 0
        
    if count == 0:
        print(f"[RAG] Local vector database collection '{clean_collection_name}' is empty. Parsing files...")
        chunks = parse_and_chunk_pdfs(company_folder)
        if chunks:
            docs = [Document(page_content=c["text"], metadata={"source": c["source"]}) for c in chunks]
            # Fast, local addition without rate-limiting batch loops or API calls
            vector_store.add_documents(docs)
            print(f"[SUCCESS] Indexed {len(docs)} document chunks to ChromaDB locally.")
        else:
            return []
            
    search_terms = query or "recruitment round interview coding questions technical project manager HR criteria difficulty tips"
    
    retrieved_docs = vector_store.similarity_search(search_terms, k=max_chunks)
    
    return [
        {"text": doc.page_content, "source": doc.metadata.get("source", "unknown")}
        for doc in retrieved_docs
    ]

async def generate_company_insights(company_folder: str) -> dict:
    """Generate synthesized prep checklists and quotes using local ChromaDB RAG context and LangChain LCEL."""
    display_name = company_folder.replace("_2026", "").replace("_Summer_Interns", " (Interns)").replace("_", " ")
    
    # Retrieve top 12 chunks from ChromaDB for this company
    retrieved = retrieve_company_context(company_folder, max_chunks=12)
    
    if not retrieved:
        return {
            "companyName": display_name,
            "difficultyRating": 3,
            "aptitudeDifficulty": 2,
            "technicalDifficulty": 3,
            "hrDifficulty": 2,
            "roundsList": ["Aptitude Test", "Technical Interview", "HR Round"],
            "keyTopics": [
                {"topic": "Data Structures & Algorithms", "frequency": "High", "tips": "Study Linked Lists, Stacks, Queues, and basic Tree traversals."},
                {"topic": "OOPs Concepts", "frequency": "Medium", "tips": "Be prepared to explain polymorphism, inheritance, and abstraction with code examples."}
            ],
            "behavioralTips": ["Maintain clear communication", "Explain your project with structural diagrams."],
            "difficultHurdles": ["Rapid fire programming questions", "Deep dive into DBMS Normalization"],
            "studentQuotes": ["Ensure your resume projects are authentic; interviewers probe deep into details."],
            "offeredPackages": ["12 LPA (FTE)", "8 LPA (Internship)"]
        }
        
    context_str = "\n\n".join([f"--- Chunk from {c['source']} ---\n{c['text']}" for c in retrieved])
    
    # Define LangChain Output Parser with Pydantic Schema
    parser = JsonOutputParser(pydantic_object=CompanyInsights)
    
    # Define ChatPromptTemplate using LangChain schemas
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", "You are an expert placement prep coordinator and structured data compiler. Your job is to format your output in JSON according to instructions:\n{format_instructions}"),
        ("user", "We have collected real-world student placement reviews for the company \"{company_name}\".\nBelow is the retrieved context from their PDF experience files:\n\n{context}\n\nBased on these actual reviews, synthesize a comprehensive preparation checklist and insights package for candidates targeting {company_name}.\nFocus on extracting real topics, rounds structure, hurdles, and direct quotes from the text.")
    ])
    
    # Setup LCEL Chain: prompt | model | parser
    chain = prompt_template | chat_model | parser
    
    try:
        data = await chain.ainvoke({
            "company_name": display_name,
            "context": context_str,
            "format_instructions": parser.get_format_instructions()
        })
        return data
    except Exception as e:
        print(f"Error generating insights via LCEL for {company_folder}: {str(e)}")
        # Fallback handling
        return {
            "companyName": display_name,
            "difficultyRating": 3,
            "aptitudeDifficulty": 3,
            "technicalDifficulty": 4,
            "hrDifficulty": 2,
            "roundsList": ["Online Aptitude Test", "Technical DSA Round", "Managerial & HR Interview"],
            "keyTopics": [
                {"topic": "Data Structures & Algorithms", "frequency": "High", "tips": "Master sorting algorithms, binary search trees, and dynamic programming foundations."},
                {"topic": "DBMS & SQL Querying", "frequency": "High", "tips": "Be ready to write custom SQL queries involving inner/outer joins and aggregates."}
            ],
            "behavioralTips": ["Show strong logical reasoning", "Be transparent about project contributions."],
            "difficultHurdles": ["Live coding under time constraints", "Rigorous debugging questions on syntax"],
            "studentQuotes": ["Ensure you know the exact time complexity of every solution you offer."],
            "offeredPackages": ["14 LPA (FTE)", "10 LPA (Internship)"]
        }
