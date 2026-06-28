import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";

// GET /api/experiences/companies — Fetch all indexed companies
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_AI_URL}/api/experiences/companies`);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching companies from Python AI service:", err.message);
    res.status(500).json({ error: "Failed to load companies from AI service" });
  }
});

// POST /api/experiences/insights — Fetch synthesized RAG insights for selected company
router.post('/insights', authenticateToken, async (req, res) => {
  try {
    const { companyFolder } = req.body;
    if (!companyFolder) {
      return res.status(400).json({ error: "companyFolder parameter is required" });
    }

    const response = await axios.post(`${PYTHON_AI_URL}/api/experiences/insights`, {
      companyFolder
    });
    res.json(response.data);
  } catch (err) {
    console.error("Error generating insights from Python AI service:", err.message);
    res.status(500).json({ error: "Failed to generate company insights from AI service" });
  }
});

export default router;
