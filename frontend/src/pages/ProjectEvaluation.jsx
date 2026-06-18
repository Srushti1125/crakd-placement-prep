import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API_URL = 'http://localhost:5000/api';

function ProjectEvaluation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ projectDescription: '', targetRole: '' });
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const isMobile = screenWidth < 768;

  useEffect(() => {
    const resize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEvaluation(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post(`${API_URL}/project/evaluate`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEvaluation(response.data.evaluation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to evaluate project');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (s) => (s >= 80 ? '#16a34a' : s >= 60 ? '#f59e0b' : '#dc2626');

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: '1128px', margin: '0 auto', padding: '1.5rem 1.5rem', boxSizing: 'border-box' }}>
        
        {/* LinkedIn-style Hero Card */}
        <div style={{
          background: '#ffffff',
          color: '#191919',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          marginBottom: '1rem',
          position: 'relative'
        }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: '600', color: '#191919' }}>Project Evaluation</h1>
          <p style={{ margin: 0, color: '#5e5e5e', fontSize: '0.9rem' }}>Evaluate how your project aligns with your target role</p>
        </div>

        {/* Form Container */}
        <div style={cardStyle}>
          <form onSubmit={handleSubmit} style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Project Description</label>
              <textarea
                rows="5"
                placeholder="Describe your project, libraries, system design, and database details..."
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Target Role</label>
              <input
                placeholder="e.g. Backend Developer"
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? 'Analyzing Project...' : 'Evaluate Project'}
            </button>
          </form>
        </div>

        {error && (
          <div style={{
            color: '#b91c1c',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {evaluation && (
          <>
            {/* Scores Overview Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <ScoreCard title="Relevance Score" value={evaluation.relevanceScore} />
              <ScoreCard title="Overall Quality" value={evaluation.overallQuality} />
            </div>

            {/* Quality Factors */}
            <div style={cardStyle}>
              <h3 style={sectionTitle}>Quality Factors</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
                {Object.entries(evaluation.qualityFactors).map(([k, v]) => (
                  <div key={k} style={factorCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#191919' }}>{k}</strong>
                      <span style={{ color: getScoreColor(v.score), fontWeight: '700', fontSize: '0.85rem' }}>{v.score}</span>
                    </div>
                    <div style={{ height: '6px', background: '#eef3f8', borderRadius: '4px', marginBottom: '0.6rem' }}>
                      <div style={{ width: `${v.score}%`, height: '100%', background: getScoreColor(v.score), borderRadius: '4px' }}></div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#5e5e5e', lineHeight: 1.4, margin: 0 }}>{v.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ ...cardStyle, borderLeft: '4px solid #16a34a' }}>
                <h3 style={{ ...sectionTitle, color: '#16a34a' }}>Strengths</h3>
                <ul style={listStyle}>
                  {evaluation.strengths.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>

              <div style={{ ...cardStyle, borderLeft: '4px solid #dc2626' }}>
                <h3 style={{ ...sectionTitle, color: '#dc2626' }}>Areas for Improvement</h3>
                <ul style={listStyle}>
                  {evaluation.improvements.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ ...cardStyle, borderLeft: '4px solid #0a66c2' }}>
              <h3 style={{ ...sectionTitle, color: '#0a66c2' }}>Recommendations</h3>
              <ul style={listStyle}>
                {evaluation.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#ffffff',
  padding: '1.5rem',
  borderRadius: '8px',
  marginBottom: '1rem',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#5e5e5e',
  marginBottom: '0.4rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  boxSizing: 'border-box',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  color: '#191919',
  outline: 'none',
  background: 'white'
};

const primaryBtn = {
  width: '100%',
  padding: '0.75rem',
  background: '#0a66c2',
  color: '#fff',
  border: 'none',
  borderRadius: '24px',
  fontWeight: '600',
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const sectionTitle = {
  margin: '0 0 1rem',
  fontSize: '1rem',
  fontWeight: '600',
  color: '#191919'
};

const factorCard = {
  background: '#ffffff',
  padding: '0.75rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box'
};

const listStyle = {
  paddingLeft: '1.2rem',
  lineHeight: 1.6,
  color: '#5e5e5e',
  fontSize: '0.85rem',
  margin: 0
};

const ScoreCard = ({ title, value }) => (
  <div style={{
    background: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    textAlign: 'center',
    boxSizing: 'border-box'
  }}>
    <div style={{ fontSize: '0.8rem', color: '#5e5e5e', fontWeight: '600' }}>{title}</div>
    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: value >= 80 ? '#16a34a' : value >= 60 ? '#f59e0b' : '#dc2626', margin: '0.25rem 0' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.75rem', color: '#5e5e5e' }}>/ 100</div>
  </div>
);

export default ProjectEvaluation;