import express from 'express';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import { upload } from '../utils/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import { isGeminiConfigured, chatModel } from '../services/ai.service.js';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const router = express.Router();
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";

// POST /upload-resume — Upload resume PDF and parse text
router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;
    if (!resumeText?.trim()) return res.status(400).json({ error: 'Could not extract text from PDF' });

    res.json({ resumeText });
  } catch (err) {
    console.error('Failed to parse resume PDF:', err);
    res.status(500).json({ error: 'Failed to parse resume PDF: ' + err.message });
  }
});

// GET or POST /question — Get a single initial interview question
const handleInitialQuestion = async (req, res) => {
  try {
    const { type, role } = req.method === 'POST' ? req.body : req.query;

    const targetRole = role || 'Software Engineer';
    const track = type || 'technical';
    
    let question = `Hello! Welcome to your mock interview for the position of ${targetRole}. To get started, could you please introduce yourself, tell me a bit about your background, and outline your key skills and achievements?`;
    if (track === 'technical') {
      question = `Hello! Welcome to your mock interview for the position of ${targetRole}. To get started, could you please introduce yourself, tell me a bit about your background, and give me a brief overview of the key technical skills and projects you have worked on?`;
    }

    res.json({
      question,
      type: track,
      role: targetRole,
      action: 'INITIAL_INTRO',
      source: 'static-intro'
    });
  } catch (err) {
    console.error("Error in initial question:", err);
    res.status(500).json({ error: 'Failed to generate initial question: ' + err.message });
  }
};

router.get('/question', authenticateToken, handleInitialQuestion);
router.post('/question', authenticateToken, handleInitialQuestion);

// POST /generate-questions — Batch generate questions (retains fast utility)
router.post('/generate-questions', authenticateToken, async (req, res) => {
  try {
    const { role, branch, type, count = 5, difficulty = 'medium' } = req.body;
    if (!isGeminiConfigured()) return res.status(400).json({ error: 'Gemini not configured' });
    let prompt = `Generate ${count} professional interview questions for a ${type || 'general'} interview`;
    if (role) prompt += ` for the role of ${role}`;
    if (branch) prompt += ` in the ${branch} field`;
    prompt += ` at ${difficulty} difficulty.\nReturn numbered list only (1. question, 2. question, ...)`;
    try {
      const response = await chatModel.invoke([
        new SystemMessage("You are an interview preparation assistant."),
        new HumanMessage(prompt)
      ]);
      const rawText = response.content;
      const questions = rawText.split('\n').filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(q => q.length > 10);
      res.json({ questions, role, type, difficulty, count: questions.length, source: 'gemini-ai' });
    } catch (err) {
      if (err.message === 'RATE_LIMITED') return res.status(429).json({ error: 'AI busy, try again in 30 seconds' });
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// POST /ai-feedback — Get AI feedback on a single answer (retains utility)
router.post('/ai-feedback', authenticateToken, async (req, res) => {
  try {
    const { question, answer, role, branch } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and answer required' });
    if (!isGeminiConfigured()) return res.status(400).json({ error: 'Gemini not configured' });
    const prompt = `You are an expert interviewer. Evaluate this answer.
Role: ${role || 'General'} | Field: ${branch || 'Tech'}
Question: "${question}"
Answer: "${answer}"
Return JSON only: {"score": 0-100, "strengths": ["..."], "improvements": ["..."], "suggestions": ["..."]}`;
    try {
      const response = await chatModel.invoke([
        new SystemMessage("You are a technical recruiter evaluating candidate answers."),
        new HumanMessage(prompt)
      ]);
      const text = response.content.trim();
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const feedback = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
      res.json({ ...feedback, source: 'gemini-ai' });
    } catch (err) {
      res.json({ score: 70, strengths: ['Good effort'], improvements: ['Add specifics'], suggestions: ['Use STAR method'], source: 'fallback' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

// POST /prep-plan — Generate customized prep plan (retains utility)
router.post('/prep-plan', authenticateToken, async (req, res) => {
  try {
    const { role, branch, experience, weaknesses } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });
    if (!isGeminiConfigured()) return res.status(400).json({ error: 'Gemini not configured' });

    const prompt = `Create a personalized interview preparation plan for:
Role: ${role}
${branch ? `Field: ${branch}` : ''}
${experience ? `Experience: ${experience}` : ''}
${weaknesses ? `Improve: ${weaknesses}` : ''}
Return ONLY valid JSON no markdown:
{"topics":["t1","t2","t3","t4","t5"],"focusAreas":["a1","a2","a3"],"commonQuestions":["q1","q2","q3","q4","q5"],"resources":["r1","r2","r3"],"timeline":{"week1":"desc","week2":"desc","week3":"desc"}}`;

    let plan;
    try {
      const response = await chatModel.invoke([
        new SystemMessage("You are a career coach and placement preparation expert."),
        new HumanMessage(prompt)
      ]);
      const text = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try { plan = JSON.parse(text); } catch { plan = null; }
    } catch (err) {
      console.warn("Prep plan AI error:", err.message);
    }

    if (!plan) {
      plan = {
        topics: ["Data Structures & Algorithms", "System Design", "OOP Concepts", "Database Design", "Web Technologies"],
        focusAreas: ["Problem Solving", "Communication Skills", "Technical Depth"],
        commonQuestions: ["Tell me about yourself", "Why this role?", "Describe a challenge you overcame", "Explain a project you built", "Where do you see yourself in 5 years?"],
        resources: ["LeetCode", "System Design Primer", "GeeksForGeeks", "Cracking the Coding Interview"],
        timeline: { week1: "Master DSA fundamentals and practice easy problems", week2: "Practice medium problems and study system design", week3: "Mock interviews and behavioral question prep" }
      };
    }

    res.json({ ...plan, role, branch, source: 'gemini-ai' });
  } catch (err) {
    console.error('Prep plan error:', err);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

// POST /chat — Dynamic Orchestrator Agent flow for conversational follow-ups
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { chatHistory, role, branch, questionType, difficulty, resumeText } = req.body;
    
    if (!isGeminiConfigured()) {
      return res.json({ question: "Could you expand on your technical contribution to that project?", source: 'fallback' });
    }

    const payload = {
      chatHistory: chatHistory || [],
      role: role || 'Software Engineer',
      branch: branch || 'Computer Science',
      questionType: questionType || 'technical',
      difficulty: difficulty || 'medium',
      resumeText: resumeText || '',
      userId: String(req.user.id)
    };

    const response = await axios.post(`${PYTHON_AI_URL}/api/interview/chat`, payload);
    const result = response.data;
    
    if (result.nextAction === 'END_INTERVIEW') {
      const evalRes = await axios.post(`${PYTHON_AI_URL}/api/interview/evaluate`, payload);
      res.json({
        question: "Interview complete. Let's look at your scorecard...",
        ended: true,
        action: result.nextAction,
        evaluation: evalRes.data,
        source: 'langgraph-orchestrator'
      });
    } else {
      res.json({
        question: result.nextQuestion,
        action: result.nextAction,
        source: 'langgraph-orchestrator'
      });
    }
  } catch (err) {
    console.error("Error in orchestrator chat route:", err);
    res.status(500).json({ error: 'Failed to process chat turn: ' + err.message });
  }
});

// POST /evaluate-chat — Evaluator Agent critique scorecard compiler
router.post('/evaluate-chat', authenticateToken, async (req, res) => {
  try {
    const { chatHistory, role, branch, questionType, difficulty, resumeText } = req.body;
    
    const payload = {
      chatHistory: chatHistory || [],
      role: role || 'Software Engineer',
      branch: branch || 'Computer Science',
      questionType: questionType || 'technical',
      difficulty: difficulty || 'medium',
      resumeText: resumeText || '',
      userId: String(req.user.id)
    };

    const response = await axios.post(`${PYTHON_AI_URL}/api/interview/evaluate`, payload);
    res.json({
      ...response.data,
      source: 'langgraph-evaluator'
    });
  } catch (err) {
    console.error("Error in evaluator route:", err);
    res.status(500).json({ error: 'Failed to compile scorecard: ' + err.message });
  }
});

export default router;
