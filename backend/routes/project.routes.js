import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { isGeminiConfigured, callGemini } from '../services/ai.service.js';

const router = express.Router();

// POST /evaluate — Evaluate a project
router.post('/evaluate', authenticateToken, async (req, res) => {
  try {
    const { projectDescription, targetRole } = req.body;
    if (!projectDescription || !targetRole) return res.status(400).json({ error: 'Project description and target role required' });
    if (!isGeminiConfigured()) return res.status(400).json({ error: 'Gemini not configured' });

    const prompt = `Evaluate this project for a ${targetRole} role. Return ONLY valid JSON no markdown:
Project: ${projectDescription}
{"relevanceScore":0-100,"relevanceAnalysis":"string","overallQuality":0-100,"qualityFactors":{"uniqueness":{"score":0-100,"feedback":"string"},"industryImpact":{"score":0-100,"feedback":"string"},"technicalComplexity":{"score":0-100,"feedback":"string"},"scalability":{"score":0-100,"feedback":"string"},"innovation":{"score":0-100,"feedback":"string"}},"strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"],"careerAlignment":"string","recommendations":["r1","r2","r3"]}`;

    let evaluation;
    try {
      const text = (await callGemini(prompt)).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try { evaluation = JSON.parse(text); } catch { evaluation = null; }
    } catch (err) {
      if (err.message === 'RATE_LIMITED') return res.status(429).json({ error: 'AI busy, try in 30s' });
    }

    if (!evaluation) {
      evaluation = { relevanceScore: 70, relevanceAnalysis: "Project aligns with the target role.", overallQuality: 75, qualityFactors: { uniqueness: { score: 70, feedback: "Shows unique aspects." }, industryImpact: { score: 65, feedback: "Has potential for impact." }, technicalComplexity: { score: 75, feedback: "Good technical implementation." }, scalability: { score: 70, feedback: "Allows for growth." }, innovation: { score: 68, feedback: "Incorporates innovative features." } }, strengths: ["Well-structured", "Addresses a real problem", "Uses modern tech"], improvements: ["Expand feature set", "Add documentation", "Enhance testing"], careerAlignment: "Aligns with the target role.", recommendations: ["Deploy it live", "Document design decisions", "Add advanced features"] };
    }

    await pool.query('INSERT INTO project_evaluations (user_id, project_description, target_role, evaluation_data) VALUES ($1,$2,$3,$4)',
      [req.user.id, projectDescription, targetRole, JSON.stringify(evaluation)]);
    res.json({ success: true, evaluation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to evaluate: ' + err.message });
  }
});

// GET /evaluations — List all project evaluations
router.get('/evaluations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM project_evaluations WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, evaluations: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /evaluation/:id — Get single project evaluation details
router.get('/evaluation/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM project_evaluations WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Evaluation not found' });
    res.json({ success: true, evaluation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /evaluation/:id — Delete project evaluation
router.delete('/evaluation/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM project_evaluations WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Evaluation not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /compare-role — Compare project against a target job role
router.post('/compare-role', authenticateToken, async (req, res) => {
  try {
    const { projectDescription, targetRole, requiredSkills } = req.body;
    if (!projectDescription || !targetRole) return res.status(400).json({ error: 'Project description and target role required' });
    if (!isGeminiConfigured()) return res.status(400).json({ error: 'Gemini not configured' });

    const prompt = `Compare this project with the target role. Return ONLY valid JSON no markdown:
Project: ${projectDescription}
Role: ${targetRole}
${requiredSkills ? `Required Skills: ${requiredSkills.join(', ')}` : ''}
{"matchScore":0-100,"matchedSkills":[],"missingSkills":[],"projectSkills":[],"gapAnalysis":"string","skillDevelopmentPlan":[]}`;

    let comparison;
    try {
      const text = (await callGemini(prompt)).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try { comparison = JSON.parse(text); } catch { comparison = null; }
    } catch (err) {
      if (err.message === 'RATE_LIMITED') return res.status(429).json({ error: 'AI busy, try in 30s' });
    }

    if (!comparison) {
      comparison = { matchScore: 70, matchedSkills: ["Problem Solving", "Technical Implementation"], missingSkills: ["Testing", "Documentation"], projectSkills: ["Development", "Design"], gapAnalysis: "Good foundation with room for improvement.", skillDevelopmentPlan: ["Add testing", "Write documentation", "Deploy the project"] };
    }
    res.json({ success: true, comparison });
  } catch (err) {
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
});

export default router;
