import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icons from '../components/Icons';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MockTestSession = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const session = state?.session;

  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(session ? session.timeMinutes * 60 : 1800);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!session) { navigate('/mock-test'); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  if (!session) return null;

  const questions = session.questions;
  const q = questions[currentQ];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting || submitted) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/test/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId: session.sessionId, answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
      navigate('/mock-test/results', { state: { results: data, sessionId: session.sessionId } });
    } catch (err) {
      alert('Submit failed: ' + err.message);
    } finally { setSubmitting(false); }
  };

  const answered = Object.keys(answers).length;
  const progress = (answered / questions.length) * 100;
  const timeColor = timeLeft < 300 ? '#dc2626' : timeLeft < 600 ? '#f59e0b' : '#1070b9';

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Icons.FileText size={18} color="#1070b9" />
          Question {currentQ + 1} / {questions.length}
        </div>

        <div style={{
          fontWeight: '800', fontSize: '1.2rem', color: timeColor,
          fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.4rem'
        }}>
          <Icons.Clock size={20} color={timeColor} />
          {formatTime(timeLeft)}
        </div>

        <button
          onClick={() => { if (window.confirm('Submit test now?')) handleSubmit(); }}
          disabled={submitting}
          style={{
            background: 'linear-gradient(135deg, #1070b9, #054196)', color: 'white',
            border: 'none', borderRadius: '10px', padding: '0.5rem 1.25rem',
            fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}
        >
          <Icons.CheckCircle size={16} color="white" />
          Submit
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: '#e2e8f0' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#10b981', transition: 'width 0.3s' }} />
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', flex: 1, width: '100%' }}>

        {/* Question card */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '2rem',
          marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
              {q.topic}
            </span>
            <span style={{
              background: q.difficulty === 'Hard' ? '#fee2e2' : q.difficulty === 'Medium' ? '#fef3c7' : '#d1fae5',
              color: q.difficulty === 'Hard' ? '#dc2626' : q.difficulty === 'Medium' ? '#d97706' : '#059669',
              padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700'
            }}>
              {q.difficulty}
            </span>
          </div>

          <p style={{
            fontSize: '1.05rem', color: '#1e293b', lineHeight: '1.7',
            whiteSpace: 'pre-wrap',
            fontFamily: q.question.includes('\n') ? 'monospace' : 'inherit',
            marginBottom: '1.5rem'
          }}>
            {q.question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
                style={{
                  padding: '0.875rem 1.25rem', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${answers[currentQ] === i ? '#1070b9' : '#e2e8f0'}`,
                  background: answers[currentQ] === i ? '#eff6ff' : 'white',
                  color: answers[currentQ] === i ? '#1070b9' : '#374151',
                  fontWeight: answers[currentQ] === i ? '700' : '500',
                  fontSize: '0.95rem', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}
              >
                {answers[currentQ] === i && <Icons.CheckCircle size={16} color="#1070b9" />}
                <span style={{ fontWeight: '700', marginRight: '0.25rem' }}>{['A', 'B', 'C', 'D'][i]}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            style={{
              padding: '0.75rem 1.5rem', border: '2px solid #e2e8f0', borderRadius: '12px',
              background: 'white', cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem',
              opacity: currentQ === 0 ? 0.5 : 1
            }}
          >
            <Icons.Activity size={16} color="#64748b" style={{ transform: 'scaleX(-1)' }} />
            Previous
          </button>

          <span style={{ alignSelf: 'center', fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icons.CheckCircle size={16} color="#10b981" />
            {answered} of {questions.length} answered
          </span>

          <button
            onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))}
            disabled={currentQ === questions.length - 1}
            style={{
              padding: '0.75rem 1.5rem', border: '2px solid #e2e8f0', borderRadius: '12px',
              background: 'white', cursor: currentQ === questions.length - 1 ? 'not-allowed' : 'pointer',
              fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem',
              opacity: currentQ === questions.length - 1 ? 0.5 : 1
            }}
          >
            Next
            <Icons.Activity size={16} color="#64748b" />
          </button>
        </div>

        {/* Question grid navigator */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icons.Target size={14} color="#64748b" />
            QUESTION NAVIGATOR
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontWeight: '700', fontSize: '0.8rem',
                  background: i === currentQ ? '#1070b9' : answers[i] !== undefined ? '#10b981' : '#f1f5f9',
                  color: i === currentQ || answers[i] !== undefined ? 'white' : '#64748b'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default MockTestSession;