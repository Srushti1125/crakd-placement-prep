import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { isGeminiConfigured, callGemini } from '../services/ai.service.js';

const router = express.Router();

const COMPANY_PATTERNS = {
  TCS: { quantitative: 40, logical: 30, verbal: 20, spatial: 10 },
  Infosys: { quantitative: 35, logical: 35, verbal: 20, spatial: 10 },
  Wipro: { quantitative: 30, logical: 30, verbal: 25, spatial: 15 },
  General: { quantitative: 30, logical: 30, verbal: 25, spatial: 15 }
};

const SUBJECT_TOPICS = {
  'Data Structures and Algorithms': ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting', 'Searching', 'Hashing'],
  'SQL': ['SELECT queries', 'JOINs', 'Aggregations', 'Subqueries', 'Indexes', 'Normalization', 'Transactions', 'Window Functions'],
  'OOPS': ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction', 'Design Patterns', 'Interfaces', 'Abstract Classes'],
  'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation', 'Feature Engineering', 'Neural Networks', 'Overfitting'],
  'Operating Systems': ['Process Management', 'Memory Management', 'File Systems', 'Deadlocks', 'Scheduling', 'Synchronization', 'Virtual Memory'],
  'Computer Networks': ['OSI Model', 'TCP/IP', 'HTTP/HTTPS', 'DNS', 'Routing', 'Subnetting', 'Network Security'],
  'Software Engineering': ['SDLC', 'Agile', 'Testing Types', 'Design Patterns', 'Version Control', 'CI/CD', 'System Design']
};

// POST /generate — Generate a new test
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { testType, topics, timeLimit, companyPattern } = req.body;

    if (!testType) return res.status(400).json({ error: 'testType required' });
    if (!isGeminiConfigured()) return res.status(400).json({ error: 'Gemini not configured' });

    let totalQuestions, prompt, timeMinutes;

    if (testType === 'aptitude') {
      totalQuestions = 30;
      timeMinutes = 30;
      const pattern = COMPANY_PATTERNS[companyPattern] || COMPANY_PATTERNS.General;
      const qPerCategory = {
        quantitative: Math.round(totalQuestions * pattern.quantitative / 100),
        logical: Math.round(totalQuestions * pattern.logical / 100),
        verbal: Math.round(totalQuestions * pattern.verbal / 100),
        spatial: Math.round(totalQuestions * pattern.spatial / 100)
      };

      prompt = `Generate ${totalQuestions} aptitude MCQ questions for placement preparation.
Distribution: ${qPerCategory.quantitative} Quantitative, ${qPerCategory.logical} Logical Reasoning, ${qPerCategory.verbal} Verbal, ${qPerCategory.spatial} Spatial Reasoning.
${companyPattern ? `Style: ${companyPattern} company pattern` : ''}

Return ONLY a JSON array. Each question object:
{
  "topic": "category name",
  "difficulty": "Easy|Medium|Hard",
  "question": "question text",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 0,
  "explanation": "why this answer is correct"
}
correct_answer is 0-indexed. Mix difficulties: 40% Easy, 40% Medium, 20% Hard.
Return ONLY the JSON array, no markdown.`;

    } else if (testType === 'subject') {
      if (!topics || topics.length === 0) return res.status(400).json({ error: 'Topics required for subject test' });
      timeMinutes = parseInt(timeLimit) || 30;
      totalQuestions = timeMinutes * 2; // 2 questions per minute

      const topicList = topics.map(t => {
        const subtopics = SUBJECT_TOPICS[t] || [];
        return `${t} (subtopics: ${subtopics.join(', ')})`;
      }).join('\n');

      prompt = `Generate ${totalQuestions} MCQ questions covering these subjects:
${topicList}

Distribute questions evenly across selected topics.
Mix difficulties: 35% Easy, 45% Medium, 20% Hard.

Return ONLY a JSON array. Each question:
{
  "topic": "specific topic name",
  "difficulty": "Easy|Medium|Hard",
  "question": "question text",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 0,
  "explanation": "clear explanation of the correct answer"
}
correct_answer is 0-indexed. No markdown, just the array.`;

    } else if (testType === 'coding') {
      timeMinutes = parseInt(timeLimit) || 30;
      totalQuestions = timeMinutes * 2;

      prompt = `Generate ${totalQuestions} MCQ questions about code analysis for placement tests.
Question types (mix these):
- "What is the output of this code?"
- "What is wrong in this code?"
- "What does this code do?"
- "Is this code correct? If not, why?"
- "What is the time complexity of this code?"
- "Which line causes an error?"

Use Python, Java, C++, JavaScript code snippets. Keep code snippets short (5-10 lines max).
Mix difficulties: 30% Easy, 50% Medium, 20% Hard.

Return ONLY a JSON array:
{
  "topic": "Python|Java|C++|JavaScript",
  "difficulty": "Easy|Medium|Hard",
  "question": "full question with code snippet",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 0,
  "explanation": "explanation with corrected code if needed"
}
No markdown, just the array.`;
    }

    let questions;
    try {
      const raw = await callGemini(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      questions = JSON.parse(arrayMatch ? arrayMatch[0] : cleaned);
    } catch (err) {
      if (err.message === 'RATE_LIMITED') return res.status(429).json({ error: 'AI busy. Try again in 30s.' });
      console.error('Question generation failed:', err);
      return res.status(500).json({ error: 'Failed to generate questions. Try again.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: 'Failed to generate valid questions. Try again.' });
    }

    questions = questions.slice(0, totalQuestions);

    const session = await pool.query(
      `INSERT INTO test_sessions (user_id, test_type, topics, company_pattern, time_limit, total_questions, questions, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'in_progress') RETURNING id, started_at`,
      [req.user.id, testType, topics || [], companyPattern || null, timeMinutes, questions.length, JSON.stringify(questions)]
    );

    res.json({
      sessionId: session.rows[0].id,
      questions: questions.map((q, i) => ({
        id: i,
        topic: q.topic,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options
      })),
      totalQuestions: questions.length,
      timeMinutes,
      startedAt: session.rows[0].started_at
    });

  } catch (err) {
    console.error('Test generate error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /submit — Submit test answers and get results
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { sessionId, answers } = req.body;

    const sessionResult = await pool.query(
      'SELECT * FROM test_sessions WHERE id=$1 AND user_id=$2',
      [sessionId, req.user.id]
    );

    if (!sessionResult.rows.length) return res.status(404).json({ error: 'Session not found' });
    const session = sessionResult.rows[0];
    if (session.status === 'completed') return res.status(400).json({ error: 'Test already submitted' });

    const questions = session.questions;
    let correct = 0;
    const topicStats = {};
    const results = [];

    questions.forEach((q, i) => {
      const userAnswer = answers[i.toString()];
      const isCorrect = userAnswer !== undefined && parseInt(userAnswer) === q.correct_answer;
      if (isCorrect) correct++;

      if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0, difficulty: {} };
      topicStats[q.topic].total++;
      if (isCorrect) topicStats[q.topic].correct++;
      if (!topicStats[q.topic].difficulty[q.difficulty]) topicStats[q.topic].difficulty[q.difficulty] = { correct: 0, total: 0 };
      topicStats[q.topic].difficulty[q.difficulty].total++;
      if (isCorrect) topicStats[q.topic].difficulty[q.difficulty].correct++;

      results.push({
        questionIndex: i,
        question: q.question,
        options: q.options,
        userAnswer: userAnswer !== undefined ? parseInt(userAnswer) : null,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty
      });
    });

    const score = Math.round((correct / questions.length) * 100);

    const topicBreakdown = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100),
      difficulty: stats.difficulty
    })).sort((a, b) => a.percentage - b.percentage);

    await pool.query(
      `UPDATE test_sessions SET answers=$1, score=$2, topic_breakdown=$3, status='completed', completed_at=NOW() WHERE id=$4`,
      [JSON.stringify(answers), score, JSON.stringify(topicBreakdown), sessionId]
    );

    for (const [topic, stats] of Object.entries(topicStats)) {
      await pool.query(
        `INSERT INTO weak_topic_tracking (user_id, topic, test_type, correct, total, last_tested)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (user_id, topic, test_type)
         DO UPDATE SET correct = weak_topic_tracking.correct + $4,
                       total = weak_topic_tracking.total + $5,
                       last_tested = NOW()`,
        [req.user.id, topic, session.test_type, stats.correct, stats.total]
      );
    }

    const weakTopics = topicBreakdown.filter(t => t.percentage < 50).map(t => t.topic);

    res.json({
      score,
      correct,
      total: questions.length,
      percentage: score,
      topicBreakdown,
      weakTopics,
      results,
      message: score >= 80 ? '🎉 Excellent!' : score >= 60 ? '👍 Good effort!' : '💪 Keep practicing!'
    });

  } catch (err) {
    console.error('Test submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /history — Get test history for student
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, test_type, topics, company_pattern, time_limit, total_questions,
              score, topic_breakdown, status, started_at, completed_at
       FROM test_sessions
       WHERE user_id=$1 AND status='completed'
       ORDER BY completed_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /history/:id — Get full test result details
router.get('/history/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM test_sessions WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Test not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /weak-topics — Analyze weak topics across all sessions
router.get('/weak-topics', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT topic, test_type, correct, total,
              ROUND((correct::decimal / NULLIF(total, 0)) * 100) as accuracy,
              last_tested
       FROM weak_topic_tracking
       WHERE user_id=$1
       ORDER BY accuracy ASC`,
      [req.user.id]
    );

    const weakTopics = result.rows.filter(r => r.accuracy < 60);
    const strongTopics = result.rows.filter(r => r.accuracy >= 60);

    res.json({
      weakTopics,
      strongTopics,
      insights: weakTopics.slice(0, 3).map(t =>
        `You consistently struggle with ${t.topic} — only ${t.accuracy}% accuracy across ${t.total} questions`
      )
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /topics — Get available topics list metadata
router.get('/topics', authenticateToken, (req, res) => {
  res.json({
    subjectTopics: Object.keys(SUBJECT_TOPICS),
    subjectSubtopics: SUBJECT_TOPICS,
    aptitudeCategories: ['Quantitative', 'Logical Reasoning', 'Verbal', 'Spatial Reasoning'],
    companyPatterns: Object.keys(COMPANY_PATTERNS),
    codingLanguages: ['Python', 'Java', 'C++', 'JavaScript', 'Mixed']
  });
});

export default router;
