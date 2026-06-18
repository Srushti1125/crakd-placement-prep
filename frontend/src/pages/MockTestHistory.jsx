import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icons from '../components/Icons';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MockTestHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [weakTopics, setWeakTopics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${BASE_URL}/api/test/history`, { headers }).then(r => r.json()),
      fetch(`${BASE_URL}/api/test/weak-topics`, { headers }).then(r => r.json())
    ]).then(([h, w]) => {
      setHistory(Array.isArray(h) ? h : []);
      setWeakTopics(w);
      setLoading(false);
    });
  }, []);

  const typeIcon = {
    subject: Icons.BookOpen,
    aptitude: Icons.Brain,
    coding: Icons.Code
  };
  const typeLabel = {
    subject: 'Subject Test',
    aptitude: 'Aptitude Test',
    coding: 'Coding MCQ'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: '600', color: '#191919', margin: 0,
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <Icons.ChartBar size={28} color="#0a66c2" />
            Test History
          </h1>
          <button
            onClick={() => navigate('/mock-test')}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#0a66c2',
              color: 'white', border: 'none', borderRadius: '24px',
              fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.85rem'
            }}
          >
            <Icons.Play size={14} color="white" />
            New Test
          </button>
        </div>

        {/* Weak Topics Insights */}
        {weakTopics?.insights?.length > 0 && (
          <div style={{
            background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #c2410c',
            borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem', boxSizing: 'border-box'
          }}>
            <h3 style={{
              margin: '0 0 0.75rem', color: '#c2410c', fontWeight: '600', fontSize: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <Icons.Target size={18} color="#c2410c" />
              Your Weak Areas (across all tests)
            </h3>
            {weakTopics.insights.map((insight, i) => (
              <div key={i} style={{
                color: '#9a3412', fontSize: '0.85rem', marginBottom: '0.3rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.4rem', lineHeight: 1.4
              }}>
                <Icons.AlertCircle size={14} color="#9a3412" style={{ marginTop: '2px', flexShrink: 0 }} />
                {insight}
              </div>
            ))}
          </div>
        )}

        {/* History list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#5e5e5e', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Icons.Loader size={32} color="#0a66c2" />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem', color: '#5e5e5e',
            background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
            boxSizing: 'border-box'
          }}>
            <Icons.FileText size={48} color="#cbd5e1" />
            <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#191919' }}>No tests yet</div>
            <div style={{ fontSize: '0.85rem' }}>Take your first mock test to see results here</div>
            <button
              onClick={() => navigate('/mock-test')}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#0a66c2',
                color: 'white', border: 'none', borderRadius: '24px',
                fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.85rem'
              }}
            >
              <Icons.Zap size={14} color="white" />
              Start First Test
            </button>
          </div>
        ) : (
          history.map(test => {
            const TypeIcon = typeIcon[test.test_type] || Icons.FileText;
            const scoreColor = test.score >= 80 ? '#16a34a' : test.score >= 60 ? '#f59e0b' : '#dc2626';

            return (
              <div
                key={test.id}
                style={{
                  background: 'white', borderRadius: '8px', padding: '1.25rem',
                  marginBottom: '0.75rem', border: '1px solid #cbd5e1',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  boxSizing: 'border-box'
                }}
              >
                {/* Type Icon */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '6px',
                  background: '#edf3f8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <TypeIcon size={20} color="#0a66c2" />
                </div>

                {/* Info */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: '600', color: '#191919', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                    {typeLabel[test.test_type] || 'Test'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#5e5e5e', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Icons.BookOpen size={12} color="#5e5e5e" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {test.topics?.join(', ') || test.company_pattern || '—'}
                    </span>
                    <span>•</span>
                    <Icons.FileText size={12} color="#5e5e5e" />
                    {test.total_questions} questions
                    <span>•</span>
                    <Icons.Clock size={12} color="#5e5e5e" />
                    {test.time_limit} min
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#5e5e5e', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Icons.Activity size={12} color="#5e5e5e" />
                    {new Date(test.completed_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Score + Review */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: scoreColor }}>
                    {test.score}%
                  </div>
                  <button
                    onClick={() => navigate(`/mock-test/review/${test.id}`)}
                    style={{
                      marginTop: '0.3rem', padding: '0.3rem 0.8rem',
                      border: '1.5px solid #0a66c2', borderRadius: '24px',
                      background: 'white', cursor: 'pointer',
                      fontSize: '0.75rem', color: '#0a66c2', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#edf3f8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <Icons.FileText size={12} color="#0a66c2" />
                    Review
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MockTestHistory;