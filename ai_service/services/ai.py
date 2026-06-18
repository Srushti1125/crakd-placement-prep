import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

load_dotenv(os.path.join(os.path.dirname(__file__), "../../backend/.env"))

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from environment config.")

chat_model = ChatGoogleGenerativeAI(
    google_api_key=api_key,
    model="gemini-2.5-flash",
    temperature=0.7
)

embeddings = GoogleGenerativeAIEmbeddings(
    google_api_key=api_key,
    model="models/text-embedding-004"
)
