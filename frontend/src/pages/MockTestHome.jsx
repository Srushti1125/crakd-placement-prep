import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icons from '../components/Icons';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MockTestHome = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [topics, setTopics] = useState([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [companyPattern, setCompanyPattern] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SUBJECT_TOPICS = [
    'Data Structures and Algorithms', 'SQL', 'OOPS',
    'Machine Learning', 'Operating Systems', 'Computer Networks', 'Software Engineering'
  ];
  const COMPANY_PATTERNS = ['General', 'TCS', 'Infosys', 'Wipro'];

  const toggleTopic = (topic) => {
    setTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  const startTest = async () => {
    if (selected === 'subject' && topics.length === 0) {
      setError('Please select at least one topic'); return;
    }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/test/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ testType: selected, topics, timeLimit, companyPattern })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate test');
      navigate('/mock-test/session', { state: { session: data } });
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const card = (type, title, desc, IconComponent) => (
    <div
      onClick={() => { setSelected(type); setTopics([]); }}
      style={{
        border: `1.5px solid ${selected === type ? '#0a66c2' : '#cbd5e1'}`,
        background: selected === type ? '#edf3f8' : 'white',
        borderRadius: '8px', padding: '1.25rem', cursor: 'pointer',
        transition: 'all 0.2s', flex: 1, minWidth: '200px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ marginBottom: '0.5rem' }}>
        <IconComponent size={28} color={selected === type ? '#0a66c2' : '#5e5e5e'} />
      </div>
      <div style={{ fontWeight: '600', fontSize: '1rem', color: '#191919', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: '#5e5e5e' }}>{desc}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem', boxSizing: 'border-box' }}>

        {/* LinkedIn-style Hero Card */}
        <div style={{
          background: '#ffffff',
          color: '#191919',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          marginBottom: '1rem'
        }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '600', color: '#191919', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icons.Brain size={32} color="#0a66c2" />
            Mock Tests
          </h1>
          <p style={{ color: '#5e5e5e', fontSize: '0.9rem', margin: 0 }}>Practice for placements with AI-generated questions</p>
        </div>

        {/* Test Type Selection */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {card('subject', 'Subject Test', 'DSA, SQL, OOPS, ML, OS, CN, SE', Icons.BookOpen)}
          {card('aptitude', 'Aptitude Test', '30 questions • 30 minutes • Company patterns', Icons.Brain)}
          {card('coding', 'Coding MCQ', 'Code output, bugs, complexity analysis', Icons.Code)}
        </div>

        {/* Subject config */}
        {selected === 'subject' && (
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '1.25rem', marginBottom: '1rem', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: '600', fontSize: '1rem', color: '#191919', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.BookOpen size={18} color="#0a66c2" /> Select Topics
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {SUBJECT_TOPICS.map(t => (
                <button key={t} onClick={() => toggleTopic(t)} style={{
                  padding: '0.4rem 1rem', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                  border: `1.5px solid ${topics.includes(t) ? '#0a66c2' : '#cbd5e1'}`,
                  background: topics.includes(t) ? '#0a66c2' : 'white',
                  color: topics.includes(t) ? 'white' : '#5e5e5e',
                  transition: 'all 0.15s'
                }}>{t}</button>
              ))}
            </div>
            <h3 style={{ margin: '0 0 0.75rem', fontWeight: '600', fontSize: '1rem', color: '#191919', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Clock size={18} color="#0a66c2" /> Time Limit
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[30, 60].map(t => (
                <button key={t} onClick={() => setTimeLimit(t)} style={{
                  padding: '0.5rem 1.5rem', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                  border: `1.5px solid ${timeLimit === t ? '#0a66c2' : '#cbd5e1'}`,
                  background: timeLimit === t ? '#edf3f8' : 'white',
                  color: timeLimit === t ? '#0a66c2' : '#5e5e5e'
                }}>
                  {t} min <span style={{ fontWeight: '400', fontSize: '0.75rem' }}>({t * 2} questions)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aptitude config */}
        {selected === 'aptitude' && (
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '1.25rem', marginBottom: '1rem', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: '600', fontSize: '1rem', color: '#191919', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Target size={18} color="#0a66c2" /> Company Pattern
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {COMPANY_PATTERNS.map(c => (
                <button key={c} onClick={() => setCompanyPattern(c)} style={{
                  padding: '0.5rem 1.25rem', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                  border: `1.5px solid ${companyPattern === c ? '#0a66c2' : '#cbd5e1'}`,
                  background: companyPattern === c ? '#edf3f8' : 'white',
                  color: companyPattern === c ? '#0a66c2' : '#5e5e5e'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icons.Briefcase size={14} color={companyPattern === c ? '#0a66c2' : '#5e5e5e'} />
                    {c}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ padding: '0.6rem 0.8rem', background: '#edf3f8', borderRadius: '6px', fontSize: '0.8rem', color: '#5e5e5e', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1' }}>
              <Icons.AlertCircle size={14} color="#0a66c2" />
              30 questions • 30 minutes • Mixed: Quantitative, Logical, Verbal, Spatial
            </div>
          </div>
        )}

        {/* Coding config */}
        {selected === 'coding' && (
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '1.25rem', marginBottom: '1rem', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontWeight: '600', fontSize: '1rem', color: '#191919', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Clock size={18} color="#0a66c2" /> Time Limit
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[30, 60].map(t => (
                <button key={t} onClick={() => setTimeLimit(t)} style={{
                  padding: '0.5rem 1.5rem', borderRadius: '24px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                  border: `1.5px solid ${timeLimit === t ? '#0a66c2' : '#cbd5e1'}`,
                  background: timeLimit === t ? '#edf3f8' : 'white',
                  color: timeLimit === t ? '#0a66c2' : '#5e5e5e'
                }}>
                  {t} min <span style={{ fontWeight: '400', fontSize: '0.75rem' }}>({t * 2} questions)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <Icons.AlertCircle size={14} color="#b91c1c" /> {error}
          </div>
        )}

        {selected && (
          <button onClick={startTest} disabled={loading} style={{
            width: '100%', padding: '0.75rem',
            background: loading ? '#cbd5e1' : '#0a66c2',
            color: 'white', border: 'none', borderRadius: '24px',
            fontSize: '0.95rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}>
            {loading ? (
              <>
                <Icons.Loader size={18} color="white" />
                Generating Questions (15-20s)...
              </>
            ) : (
              <>
                <Icons.Zap size={18} color="white" />
                Start Test
              </>
            )}
          </button>
        )}

        {/* Past Results Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => navigate('/mock-test/history')} style={{
            background: 'none', border: 'none', color: '#0a66c2', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
          }}>
            <Icons.ChartBar size={16} color="#0a66c2" />
            View Past Test Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockTestHome;