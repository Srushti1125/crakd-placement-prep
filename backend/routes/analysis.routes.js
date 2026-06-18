import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateReadinessScore } from '../utils/scoring.js';

const router = express.Router();

// GET /readiness — Get readiness score and suggestions
router.get('/readiness', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM student_profiles WHERE user_id=$1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'No student data found' });
    res.json(calculateReadinessScore(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /score-history — Get history of readiness scores
router.get('/score-history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT score, recorded_at FROM score_history WHERE user_id=$1 ORDER BY recorded_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /role-readiness — Compare profile skills against a role requirements
router.post('/role-readiness', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM student_profiles WHERE user_id=$1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'No student data' });
    const { roleName, requiredSkills } = req.body;
    if (!requiredSkills?.length) return res.status(400).json({ error: 'Required skills not provided' });
    const studentSkills = (result.rows[0].skills || []).map(s => s.toLowerCase());
    const roleSkills = requiredSkills.map(s => s.toLowerCase());
    const matched = roleSkills.filter(s => studentSkills.some(ss => ss.includes(s) || s.includes(ss)));
    res.json({
      roleName,
      matchPercentage: Math.round((matched.length / roleSkills.length) * 100),
      matchedSkills: matched.length,
      totalRequired: roleSkills.length,
      missingSkills: roleSkills.filter(s => !matched.includes(s))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
