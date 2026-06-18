import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import {
  JWT_REFRESH_SECRET,
  generateAccessToken,
  generateRefreshToken
} from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /signup — Register a new student
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userRole = 'student'; // Always student, TPO removed
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email.toLowerCase(), passwordHash, name, userRole]
    );
    const user = result.rows[0];

    // Always create a student profile
    await pool.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [user.id]);

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    );

    res.status(201).json({ token: accessToken, accessToken, refreshToken, user: { ...user, onboardingComplete: false } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /login — Login student
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()', [user.id]);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    );

    let onboardingComplete = false;
    const profile = await pool.query('SELECT onboarding_complete FROM student_profiles WHERE user_id = $1', [user.id]);
    if (profile.rows.length > 0) onboardingComplete = profile.rows[0].onboarding_complete;

    res.json({
      token: accessToken, accessToken, refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, onboardingComplete }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /refresh — Refresh access token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const stored = await pool.query(
      'SELECT * FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
      [decoded.id, refreshToken]
    );
    if (stored.rows.length === 0) return res.status(403).json({ error: 'Invalid refresh token' });
    const user = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
    const newToken = generateAccessToken({ id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role });
    res.json({ token: newToken, accessToken: newToken });
  } catch {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// POST /logout — Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  res.json({ message: 'Logged out' });
});

export default router;
