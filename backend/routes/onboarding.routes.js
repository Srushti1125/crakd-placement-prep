import express from 'express';
import axios from 'axios';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { isGeminiConfigured } from '../services/ai.service.js';
import { calculateProfileCompletion, calculateReadinessScore } from '../utils/scoring.js';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";

const router = express.Router();

// GET /status — Get onboarding status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const p = await pool.query('SELECT onboarding_complete, profile_completion FROM student_profiles WHERE user_id=$1', [req.user.id]);
    if (!p.rows.length) return res.json({ onboardingComplete: false, profileCompletion: 0 });
    res.json({ onboardingComplete: p.rows[0].onboarding_complete, profileCompletion: p.rows[0].profile_completion });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /parse-bio — Parse student bio with Gemini AI
router.post('/parse-bio', authenticateToken, async (req, res) => {
  try {
    const { bioText } = req.body;
    if (!bioText || bioText.trim().length < 20) return res.status(400).json({ error: 'Please provide more text' });
    if (!isGeminiConfigured()) return res.status(400).json({ error: 'AI not configured' });

    let extracted = {};
    try {
      const response = await axios.post(`${PYTHON_AI_URL}/api/onboarding/parse-bio`, { bioText });
      extracted = response.data;
    } catch (err) {
      if (err.response?.status === 429) {
        return res.status(429).json({ error: 'AI busy. Wait 30s and retry.', retryAfter: 30 });
      }
      return res.status(500).json({ error: 'Failed to parse bio: ' + err.message });
    }

    const required = ['cgpa', 'skills', 'projects_count', 'dsa_level', 'target_role'];
    const missing = required.filter(f => f === 'skills' ? !extracted.skills?.length : extracted[f] == null);

    const profileUpdate = {};
    if (extracted.cgpa) profileUpdate.cgpa = extracted.cgpa;
    if (extracted.skills?.length) profileUpdate.skills = extracted.skills;
    if (extracted.projects_count != null) profileUpdate.projects_count = extracted.projects_count;
    if (extracted.internships_count != null) profileUpdate.internships_count = extracted.internships_count;
    if (extracted.dsa_level) profileUpdate.dsa_level = extracted.dsa_level;
    if (extracted.communication_score) profileUpdate.communication_score = extracted.communication_score;
    if (extracted.target_role) profileUpdate.target_role = extracted.target_role;
    if (extracted.branch) profileUpdate.branch = extracted.branch;
    if (extracted.college_name) profileUpdate.college_name = extracted.college_name;
    if (extracted.graduation_year) profileUpdate.graduation_year = extracted.graduation_year;

    if (Object.keys(profileUpdate).length > 0) {
      const setClauses = Object.keys(profileUpdate).map((k, i) => `${k}=$${i + 2}`);
      await pool.query(`UPDATE student_profiles SET ${setClauses.join(', ')}, updated_at=NOW() WHERE user_id=$1`,
        [req.user.id, ...Object.values(profileUpdate)]);
    }

    if (missing.length === 0) {
      const completion = calculateProfileCompletion(profileUpdate);
      await pool.query(
        `UPDATE student_profiles SET onboarding_complete=true, onboarding_method='ai_chat', profile_completion=$1 WHERE user_id=$2`,
        [completion, req.user.id]
      );
      const p = await pool.query('SELECT * FROM student_profiles WHERE user_id=$1', [req.user.id]);
      if (p.rows.length > 0) {
        const scoreData = calculateReadinessScore(p.rows[0]);
        await pool.query('INSERT INTO score_history (user_id, score, breakdown) VALUES ($1,$2,$3)',
          [req.user.id, scoreData.score, JSON.stringify(scoreData.breakdown)]);
      }
      return res.json({ isComplete: true, extracted, missing: [], profileUpdate });
    }
    res.json({ isComplete: false, extracted, missing, profileUpdate });
  } catch (err) {
    console.error('Parse bio error:', err);
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
});

// POST /fill-missing — Save missing onboarding fields
router.post('/fill-missing', authenticateToken, async (req, res) => {
  try {
    const { answers, missingFields, previouslyExtracted } = req.body;
    const updates = {};
    if (answers.cgpa) {
      const n = parseFloat(answers.cgpa);
      if (!isNaN(n)) updates.cgpa = n > 10 ? n / 10 : n;
    }
    if (answers.skills) {
      const s = answers.skills.split(/[,;]+/).map(x => x.trim()).filter(Boolean);
      if (s.length) updates.skills = s;
    }
    if (answers.projects_count) {
      const n = parseInt(answers.projects_count);
      if (!isNaN(n)) updates.projects_count = n;
    }
    if (answers.dsa_level) {
      const l = answers.dsa_level.toLowerCase();
      updates.dsa_level = l.includes('adv') ? 'Advanced' : l.includes('int') ? 'Intermediate' : 'Beginner';
    }
    if (answers.target_role) updates.target_role = answers.target_role;
    if (answers.internships_count) {
      const n = parseInt(answers.internships_count);
      if (!isNaN(n)) updates.internships_count = n;
    }

    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map((k, i) => `${k}=$${i + 2}`);
      await pool.query(`UPDATE student_profiles SET ${setClauses.join(', ')}, updated_at=NOW() WHERE user_id=$1`,
        [req.user.id, ...Object.values(updates)]);
    }

    const fullProfile = { ...previouslyExtracted, ...updates };
    const required = ['cgpa', 'skills', 'projects_count', 'dsa_level', 'target_role'];
    const stillMissing = required.filter(f => f === 'skills' ? !fullProfile.skills?.length : fullProfile[f] == null);

    if (stillMissing.length === 0) {
      const p = await pool.query('SELECT * FROM student_profiles WHERE user_id=$1', [req.user.id]);
      const completion = calculateProfileCompletion(p.rows[0]);
      await pool.query(`UPDATE student_profiles SET onboarding_complete=true, onboarding_method='ai_chat', profile_completion=$1 WHERE user_id=$2`,
        [completion, req.user.id]);
      const scoreData = calculateReadinessScore(p.rows[0]);
      await pool.query('INSERT INTO score_history (user_id, score, breakdown) VALUES ($1,$2,$3)',
        [req.user.id, scoreData.score, JSON.stringify(scoreData.breakdown)]);
    }
    res.json({ isComplete: stillMissing.length === 0, stillMissing, updates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
});

export default router;
