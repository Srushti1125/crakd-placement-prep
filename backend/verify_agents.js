import { chatModel, embeddings } from './services/ai.service.js';
import { StateGraph, END } from '@langchain/langgraph';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const sampleResume = `
SRUSHTI KHADE
EDUCATION: Sardar Patel Institute of Technology, B.Tech in Computer Engineering, CGPA: 9.62/10
TECHNICAL SKILLS:
Languages: C++, Java, Python, C, SQL (MySQL), HTML/CSS, JavaScript
Frameworks: Flask, TensorFlow, Keras, OpenCV, MediaPipe, Pandas, NumPy, Scikit-learn
Tools: Git, GitHub, VS Code, Google Colab, Jupyter Notebook, Docker
PROJECTS:
Crakd: AI Placement Preparation Platform | React.js, Node.js, PostgreSQL, LangGraph, LangChain, ChromaDB (Jan 2026)
- Built a full-stack placement preparation platform with JWT authentication, AI-driven onboarding, profile management.
- Designed a LangGraph-powered agentic interviewer that dynamically performs resume retrieval (RAG), project evaluation.
KshetraX: Construction Workforce System | React Native, Expo, TypeScript, Firebase (Nov 2025)
- Developed a mobile application to digitize construction site operations, reducing manual record-keeping errors.
- Engineered a multilingual interface with voice recording capabilities.
Deepfake Detection System | Python, TensorFlow, OpenCV, MediaPipe (Aug 2025 - Dec 2025)
- Built a multimodal neural network fusing MesoNet with audio-lip sync features to identify temporal inconsistencies.
`;

async function runVerification() {
  console.log("🚀 Initializing Agent Verification Test...");
  console.log("--------------------------------------------------");

  // 1. Run RAG Indexing
  console.log("1. Running character splitting & vector indexing on resume...");
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 300, chunkOverlap: 50 });
  const docs = await splitter.createDocuments([sampleResume]);
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  console.log("✅ Resume successfully indexed in memory vector store.");
  console.log("--------------------------------------------------");

  // 2. Simulate User Response mentioning a project
  const userIntroduction = "Hi, I am Shrushti. I built a mobile application called KshetraX using React Native and Expo for construction sites.";
  console.log(`2. Candidate Response: "${userIntroduction}"`);
  console.log("--------------------------------------------------");

  // 3. Retrieve context for the user response (RAG check)
  console.log("3. Querying Vector Database for context matching 'KshetraX'...");
  const contextDocs = await vectorStore.similaritySearch("KshetraX", 3);
  const contextText = contextDocs.map(d => d.pageContent).join("\n");
  console.log("🔎 Retrieved Context from Resume:");
  console.log(contextText.trim());
  console.log("--------------------------------------------------");

  // 4. Test Orchestrator Decision
  console.log("4. Running Orchestrator Agent...");
  const chatHistory = [
    { role: "assistant", text: "Welcome! Tell me about yourself and your projects." },
    { role: "user", text: userIntroduction }
  ];
  
  const historyStr = chatHistory.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`).join('\n');
  const orchestratorPrompt = `You are the Interview Orchestrator Agent for Crakd. Choose the next action.
Available actions: SEARCH_RESUME, ANALYZE_PROJECT, ASK_TECHNICAL, ASK_CS_FUNDAMENTALS, ASK_HR, END_INTERVIEW.
History:
${historyStr}
ACTION: [one of SEARCH_RESUME, ANALYZE_PROJECT, ASK_TECHNICAL, ASK_CS_FUNDAMENTALS, ASK_HR, END_INTERVIEW]`;

  const orchResponse = await chatModel.invoke([
    new SystemMessage(orchestratorPrompt),
    new HumanMessage("Decide next action.")
  ]);
  console.log("🤖 Orchestrator Decision:", orchResponse.content.trim());
  console.log("--------------------------------------------------");

  // 5. Test Conversational Follow-up question generation (Tool Execution)
  console.log("5. Running Project Probing Node (Conversational Follow-up)...");
  const followUpPrompt = `You are a technical interviewer. Ask a conversational follow-up question building directly on what the candidate said about their project using this context:
${contextText}

Ongoing Chat History:
${historyStr}

Guidelines:
- Reference the candidate's last statement.
- Ask a deep question probing architecture, tools, or implementation details of the specific project they mentioned.
- Ask ONLY one question. Do not write filler text.`;

  const questionResponse = await chatModel.invoke([
    new SystemMessage(followUpPrompt),
    new HumanMessage("Generate conversational follow-up.")
  ]);
  console.log("🎙️ Interviewer's Follow-up Question:");
  console.log(questionResponse.content.trim());
  console.log("--------------------------------------------------");
  console.log("✅ Verification Test Completed Successfully!");
}

runVerification().catch(console.error);
