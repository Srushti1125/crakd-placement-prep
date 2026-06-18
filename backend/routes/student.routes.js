import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateProfileCompletion, calculateReadinessScore } from '../utils/scoring.js';

const router = express.Router();

// POST /data — Save student data (legacy)
router.post('/data', authenticateToken, async (req, res) => {
  try {
    const { cgpa, skills, projectsCount, internshipsCount, dsaLevel, communication } = req.body;
    await pool.query(
      `UPDATE student_profiles SET
        cgpa=$1, skills=$2, projects_count=$3, internships_count=$4,
        dsa_level=$5, communication_score=$6, onboarding_complete=true,
        onboarding_method='manual_form', updated_at=NOW()
       WHERE user_id=$7`,
      [cgpa, skills || [], projectsCount, internshipsCount, dsaLevel, communication, req.user.id]
    );

    // Record score
    const p = await pool.query('SELECT * FROM student_profiles WHERE user_id=$1', [req.user.id]);
    if (p.rows.length > 0) {
      const scoreData = calculateReadinessScore(p.rows[0]);
      await pool.query('INSERT INTO score_history (user_id, score, breakdown) VALUES ($1,$2,$3)',
        [req.user.id, scoreData.score, JSON.stringify(scoreData.breakdown)]);
    }
    res.json({ message: 'Data saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /data — Get student data (legacy)
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM student_profiles WHERE user_id=$1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No data found' });
    const p = result.rows[0];
    res.json({
      cgpa: p.cgpa,
      skills: p.skills || [],
      projectsCount: p.projects_count,
      internshipsCount: p.internships_count,
      dsaLevel: p.dsa_level,
      communication: p.communication_score
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /profile — Get student profile details
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT sp.*, u.name, u.email FROM student_profiles sp JOIN users u ON u.id=sp.user_id WHERE sp.user_id=$1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /profile — Update student profile
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const allowed = ['cgpa','branch','graduation_year','college_name','skills','projects_count',
      'internships_count','dsa_level','communication_score','target_role','target_company'];
    const updates = {};
    for (const f of allowed) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
    const setClauses = Object.keys(updates).map((k, i) => `${k}=$${i + 2}`);
    await pool.query(`UPDATE student_profiles SET ${setClauses.join(', ')}, updated_at=NOW() WHERE user_id=$1`,
      [req.user.id, ...Object.values(updates)]);

    const p = await pool.query('SELECT * FROM student_profiles WHERE user_id=$1', [req.user.id]);
    const completion = calculateProfileCompletion(p.rows[0]);
    await pool.query('UPDATE student_profiles SET profile_completion=$1 WHERE user_id=$2', [completion, req.user.id]);

    const scoreData = calculateReadinessScore(p.rows[0]);
    await pool.query('INSERT INTO score_history (user_id, score, breakdown) VALUES ($1,$2,$3)',
      [req.user.id, scoreData.score, JSON.stringify(scoreData.breakdown)]);

    res.json({ message: 'Profile updated', profileCompletion: completion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
