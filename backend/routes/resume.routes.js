import express from 'express';
import pdfParse from 'pdf-parse';
import { pool } from '../config/database.js';
import { upload } from '../utils/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeResumeWithAI } from '../services/resume.service.js';
import { isGeminiConfigured, callGemini } from '../services/ai.service.js';

const router = express.Router();

// POST /analyze — Analyze raw resume text
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { resumeText, jobDescription, jobRole, requiredSkills } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text required' });

    const analysisData = await analyzeResumeWithAI(resumeText, jobDescription, jobRole, requiredSkills);
    const overallScore = analysisData.overallScore || 0;
    const atsScore = analysisData.atsScore || 0;
    const readabilityScore = analysisData.readability?.score || 0;
    const roleRelevance = analysisData.roleRelevance || 0;

    await pool.query(
      'INSERT INTO resume_analyses (user_id, resume_text, job_description, job_role, ats_score, readability_score, role_relevance, overall_score, analysis_data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, resumeText, jobDescription, jobRole, atsScore, readabilityScore, roleRelevance, overallScore, JSON.stringify(analysisData)]
    );
    res.json(analysisData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /upload-pdf — Upload PDF resume and analyze
router.post('/upload-pdf', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;
    if (!resumeText?.trim()) return res.status(400).json({ error: 'Could not extract text from PDF' });

    const { jobDescription, jobRole, requiredSkills } = req.body;
    
    const analysisData = await analyzeResumeWithAI(resumeText, jobDescription, jobRole, requiredSkills);
    const overallScore = analysisData.overallScore || 0;
    const atsScore = analysisData.atsScore || 0;
    const readabilityScore = analysisData.readability?.score || 0;
    const roleRelevance = analysisData.roleRelevance || 0;

    // Inject frontend-required properties
    analysisData.extractedText = resumeText.substring(0, 500) + '...';
    analysisData.fullText = resumeText;
    analysisData.fileName = req.file.originalname;

    await pool.query(
      'INSERT INTO resume_analyses (user_id, file_name, resume_text, job_description, job_role, ats_score, readability_score, role_relevance, overall_score, analysis_data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [req.user.id, req.file.originalname, resumeText, jobDescription, jobRole, atsScore, readabilityScore, roleRelevance, overallScore, JSON.stringify(analysisData)]
    );
    res.json(analysisData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process PDF: ' + err.message });
  }
});

// GET /history — Get past resume analyses history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, file_name, job_role, overall_score, ats_score, created_at FROM resume_analyses WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /optimize — Acts as an Iterative Resume Optimizer Agent (STAR reflection loop)
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const { resumeText, jobDescription, jobRole } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });
    if (!isGeminiConfigured()) {
      return res.json({
        optimizations: [
          {
            original: "Built a web application for student placements.",
            optimized: "Architected and deployed a responsive placement portal using React, Node.js, and PostgreSQL; scaled system capacity to support 1,500+ active student users and reduced average page load time by 40% using database optimizations.",
            analysis: "Added concrete technologies (React, Node.js, PostgreSQL, SQL), specified the scale (1,500+ users), and quantified the performance result (40% load time reduction) to fulfill the STAR format."
          },
          {
            original: "Analyzed code and fixed bugs.",
            optimized: "Refactored legacy backend code into a modular MVC architecture, increasing test coverage by 25% and reducing server runtime errors by 15% through thorough unit testing and schema checks.",
            analysis: "Replaced generic action with industry terminology (MVC architecture, test coverage, unit testing) and quantified the exact improvements (25% test coverage, 15% error reduction)."
          }
        ],
        source: 'fallback'
      });
    }

    const prompt = `You are a professional Resume Coach and ATS Specialist. Your goal is to optimize the project/experience bullet points of a candidate's resume for a target job description and role.

Target Job Role: ${jobRole || 'Software Engineer'}
Target Job Description: ${jobDescription || 'General Tech Role'}

Here is the student's resume text:
${resumeText}

Identify the 3-5 key project descriptions or work experience bullet points from the resume.
For each key bullet point, perform an iterative STAR (Situation, Task, Action, Result) reflection loop:
1. (Draft) Rewrite the point incorporating relevant skills/keywords from the job description.
2. (Evaluate) Analyze the draft against the STAR method. Find gaps (e.g. missing action verb, lack of metrics/scale, vague technical stack).
3. (Refine) Modify the draft to address the critique, injecting realistic metrics, frameworks, or outcomes suitable for this role.

Return ONLY a valid JSON array of objects representing these optimizations, with NO markdown code blocks, backticks, or extra text. Each object in the array must look exactly like this:
{
  "original": "The exact original bullet point from the resume",
  "optimized": "The final refined bullet point following the STAR method",
  "analysis": "Explanation of the reflection critique and what changes/metrics/actions were added."
}

Do not write anything other than the JSON array.`;

    try {
      const text = await callGemini(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const optimizations = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      res.json({ optimizations, source: 'gemini-ai' });
    } catch (err) {
      console.error('Optimize resume error:', err);
      res.json({
        optimizations: [
          {
            original: "Built a web application for student placements.",
            optimized: "Architected and deployed a responsive placement portal using React, Node.js, and PostgreSQL; scaled system capacity to support 1,500+ active student users and reduced average page load time by 40% using database optimizations.",
            analysis: "Added concrete technologies (React, Node.js, PostgreSQL, SQL), specified the scale (1,500+ users), and quantified the performance result (40% load time reduction) to fulfill the STAR format."
          }
        ],
        source: 'fallback'
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to optimize resume' });
  }
});

export default router;
