// frontend/src/pages/MockTestReview.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icons from '../components/Icons';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MockTestReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExplanations, setShowExplanations] = useState(false);
  const [filterWrong, setFilterWrong] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    fetch(`${BASE_URL}/api/test/history/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else { setTestData(data); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load test'); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8faff' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: '#64748b' }}>
        <Icons.Loader size={36} color="#1070b9" />
        Loading test review...
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } .animate-spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f8faff' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Icons.AlertCircle size={36} color="#ef4444" />
        <div style={{ color: '#ef4444', fontWeight: '700' }}>{error}</div>
        <button onClick={() => navigate('/mock-test/history')} style={{ padding: '0.75rem 1.5rem', background: '#1070b9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
          Back to History
        </button>
      </div>
    </div>
  );

  // Reconstruct results from stored data
  const questions = testData.questions || [];
  const answers = testData.answers || {};
  const topicBreakdown = testData.topic_breakdown || [];
  const score = testData.score || 0;

  const results = questions.map((q, i) => {
    const userAnswer = answers[i.toString()];
    const isCorrect = userAnswer !== undefined && parseInt(userAnswer) === q.correct_answer;
    return {
      questionIndex: i,
      question: q.question,
      options: q.options,
      userAnswer: userAnswer !== undefined ? parseInt(userAnswer) : null,
      correctAnswer: q.correct_answer,
      isCorrect,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty
    };
  });

  const correct = results.filter(r => r.isCorrect).length;
  const displayed = filterWrong ? results.filter(r => !r.isCorrect) : results;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  const typeLabel = { subject: 'Subject Test', aptitude: 'Aptitude Test', coding: 'Coding MCQ' };
  const typeIcon = { subject: Icons.BookOpen, aptitude: Icons.Brain, coding: Icons.Code };
  const TypeIcon = typeIcon[testData.test_type] || Icons.FileText;

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Back button */}
        <button
          onClick={() => navigate('/mock-test/history')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0
          }}
        >
          <Icons.Activity size={16} color="#64748b" />
          Back to History
        </button>

        {/* Test Info Header */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TypeIcon size={28} color="#1070b9" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.25rem' }}>
              {typeLabel[testData.test_type] || 'Test'} — Review
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Icons.BookOpen size={13} color="#94a3b8" />
                {testData.topics?.join(', ') || testData.company_pattern || '—'}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Icons.FileText size={13} color="#94a3b8" />
                {testData.total_questions} questions
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Icons.Clock size={13} color="#94a3b8" />
                {testData.time_limit} min
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Icons.Activity size={12} color="#94a3b8" />
              {new Date(testData.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: scoreColor }}>{score}%</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{correct}/{testData.total_questions} correct</div>
          </div>
        </div>

        {/* Topic Breakdown */}
        {topicBreakdown.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.ChartBar size={20} color="#1070b9" />
              Topic Breakdown
            </h3>
            {topicBreakdown.map(t => (
              <div key={t.topic} style={{ marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>{t.topic}</span>
                  <span style={{ fontWeight: '700', color: t.percentage >= 60 ? '#10b981' : '#ef4444' }}>
                    {t.percentage}% ({t.correct}/{t.total})
                  </span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${t.percentage}%`,
                    background: t.percentage >= 60 ? '#10b981' : t.percentage >= 40 ? '#f59e0b' : '#ef4444',
                    borderRadius: '10px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Review */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.FileText size={20} color="#1070b9" />
              All Questions ({results.length})
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setFilterWrong(!filterWrong)}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '8px',
                  border: `2px solid ${filterWrong ? '#ef4444' : '#e2e8f0'}`,
                  background: filterWrong ? '#fee2e2' : 'white',
                  color: filterWrong ? '#dc2626' : '#64748b',
                  cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}
              >
                <Icons.AlertCircle size={14} color={filterWrong ? '#dc2626' : '#64748b'} />
                {filterWrong ? 'Wrong Only' : 'Show Wrong Only'}
              </button>
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  background: showExplanations ? '#eff6ff' : 'white',
                  color: showExplanations ? '#1070b9' : '#64748b',
                  cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}
              >
                <Icons.Lightbulb size={14} color={showExplanations ? '#1070b9' : '#64748b'} />
                {showExplanations ? 'Hide Explanations' : 'Show Explanations'}
              </button>
            </div>
          </div>

          {displayed.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <Icons.CheckCircle size={32} color="#10b981" />
              <div style={{ fontWeight: '700' }}>You got everything right in this filter!</div>
            </div>
          )}

          {displayed.map((r, idx) => (
            <div
              key={idx}
              style={{
                border: `1.5px solid ${r.isCorrect ? '#bbf7d0' : r.userAnswer === null ? '#e2e8f0' : '#fecaca'}`,
                borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem',
                background: r.isCorrect ? '#f0fdf4' : r.userAnswer === null ? '#fafafa' : '#fff5f5'
              }}
            >
              {/* Question header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>
                  Q{r.questionIndex + 1} • {r.topic} • {r.difficulty}
                </span>
                <span style={{
                  fontWeight: '700', fontSize: '0.85rem',
                  color: r.isCorrect ? '#10b981' : r.userAnswer === null ? '#f59e0b' : '#ef4444',
                  display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}>
                  {r.isCorrect
                    ? <><Icons.CheckCircle size={15} color="#10b981" /> Correct</>
                    : r.userAnswer === null
                    ? <><Icons.Clock size={15} color="#f59e0b" /> Skipped</>
                    : <><Icons.AlertCircle size={15} color="#ef4444" /> Wrong</>
                  }
                </span>
              </div>

              {/* Question text */}
              <p style={{
                margin: '0 0 0.75rem', color: '#1e293b', fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                fontFamily: r.question.includes('\n') ? 'monospace' : 'inherit',
                lineHeight: '1.6'
              }}>
                {r.question}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: showExplanations && r.explanation ? '0.75rem' : 0 }}>
                {r.options.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem',
                      background: i === r.correctAnswer ? '#d1fae5' : i === r.userAnswer && !r.isCorrect ? '#fee2e2' : 'transparent',
                      color: i === r.correctAnswer ? '#065f46' : i === r.userAnswer && !r.isCorrect ? '#dc2626' : '#374151',
                      fontWeight: i === r.correctAnswer || i === r.userAnswer ? '700' : '400',
                      display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                  >
                    {i === r.correctAnswer && <Icons.CheckCircle size={13} color="#10b981" />}
                    {i === r.userAnswer && !r.isCorrect && <Icons.AlertCircle size={13} color="#dc2626" />}
                    <span><strong>{['A', 'B', 'C', 'D'][i]}.</strong> {opt}</span>
                    {i === r.correctAnswer && <span style={{ fontSize: '0.72rem', color: '#065f46' }}>(correct answer)</span>}
                    {i === r.userAnswer && !r.isCorrect && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>(your answer)</span>}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {showExplanations && r.explanation && (
                <div style={{
                  background: '#f0f9ff', borderLeft: '3px solid #1070b9',
                  padding: '0.75rem', borderRadius: '0 8px 8px 0',
                  fontSize: '0.875rem', color: '#1e40af',
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.75rem'
                }}>
                  <Icons.Lightbulb size={15} color="#1070b9" style={{ flexShrink: 0, marginTop: '2px' }} />
                  {r.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => navigate('/mock-test')}
            style={{
              flex: 1, padding: '0.875rem',
              background: 'linear-gradient(135deg, #1070b9, #054196)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <Icons.Zap size={18} color="white" />
            Take New Test
          </button>
          <button
            onClick={() => navigate('/mock-test/history')}
            style={{
              flex: 1, padding: '0.875rem',
              background: 'white', color: '#1070b9',
              border: '2px solid #1070b9', borderRadius: '12px',
              fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <Icons.ChartBar size={18} color="#1070b9" />
            All History
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default MockTestReview;