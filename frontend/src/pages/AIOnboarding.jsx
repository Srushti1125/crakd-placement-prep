import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiFetch = async (path, body) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
};

// ── Field labels for the follow-up form ──────────────────────────────────────
const FIELD_CONFIG = {
  cgpa:             { label: 'CGPA (out of 10)',          placeholder: 'e.g. 8.5',              type: 'text' },
  skills:           { label: 'Technical Skills',          placeholder: 'e.g. React, Python, SQL', type: 'text' },
  projects_count:   { label: 'Number of Projects',        placeholder: 'e.g. 4',                type: 'number' },
  dsa_level:        { label: 'DSA Level',                 placeholder: '',                       type: 'select',
                      options: ['Beginner', 'Intermediate', 'Advanced'] },
  target_role:      { label: 'Target Job Role',           placeholder: 'e.g. Software Developer', type: 'text' },
  internships_count:{ label: 'Number of Internships',     placeholder: 'e.g. 1',                type: 'number' },
};

// ── Extracted tag display ─────────────────────────────────────────────────────
const ExtractedTag = ({ label, value }) => (
  <div style={{
    background: '#f0fdf4', border: '1.5px solid #bbf7d0',
    borderRadius: '10px', padding: '0.5rem 0.75rem',
    display: 'flex', flexDirection: 'column', gap: '0.1rem'
  }}>
    <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#14532d' }}>
      {Array.isArray(value) ? value.join(', ') : String(value)}
    </span>
  </div>
);

// ── Step indicator ────────────────────────────────────────────────────────────
const Step = ({ n, label, active, done }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      background: done ? '#10b981' : active ? '#1070b9' : '#e2e8f0',
      color: done || active ? 'white' : '#94a3b8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '800', fontSize: '0.9rem', transition: 'all 0.3s'
    }}>{done ? '✓' : n}</div>
    <span style={{ fontSize: '0.72rem', color: active ? '#1070b9' : '#94a3b8', fontWeight: active ? '700' : '500' }}>{label}</span>
  </div>
);

const Divider = () => (
  <div style={{ flex: 1, height: '2px', background: '#e2e8f0', marginTop: '-18px' }} />
);

// ─────────────────────────────────────────────────────────────────────────────
const AIOnboarding = () => {
  const navigate = useNavigate();
  const user = authAPI.getUser();

  // Flow state
  const [step, setStep] = useState('paste'); // 'paste' | 'confirm' | 'missing' | 'done'
  const [bioText, setBioText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data state
  const [extracted, setExtracted] = useState({});
  const [missingFields, setMissingFields] = useState([]);
  const [answers, setAnswers] = useState({});

  // ── Step 1: Parse bio ────────────────────────────────────────────────────
  const handleParse = async () => {
    if (bioText.trim().length < 15) {
      setError('Please paste a bit more text — even 2-3 sentences works!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/onboarding/parse-bio', { bioText });
      if (res.error) throw new Error(res.error);
      setExtracted(res.extracted || {});
      setMissingFields(res.missing || []);
      if (res.isComplete) {
        setStep('done');
        completionRedirect();
      } else {
        setStep(Object.keys(res.extracted || {}).some(k => res.extracted[k] !== null) ? 'confirm' : 'missing');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Confirm extracted data, then fill missing ───────────────────
  const handleConfirm = async () => {
    if (missingFields.length === 0) {
      setStep('done');
      completionRedirect();
      return;
    }
    setStep('missing');
  };

  // ── Step 3: Submit missing fields (rule-based, no LLM) ──────────────────
  const handleFillMissing = async () => {
    const unfilled = missingFields.filter(f => !answers[f] || answers[f].toString().trim() === '');
    if (unfilled.length > 0) {
      setError(`Please fill in: ${unfilled.map(f => FIELD_CONFIG[f]?.label).join(', ')}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/onboarding/fill-missing', {
        answers,
        missingFields,
        previouslyExtracted: extracted
      });
      if (res.error) throw new Error(res.error);
      if (res.isComplete) {
        setStep('done');
        completionRedirect();
      } else {
        setMissingFields(res.stillMissing || []);
        setError('Still need a few more details.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completionRedirect = () => {
    const currentUser = authAPI.getUser();
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify({ ...currentUser, onboardingComplete: true }));
    }
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  const extractedEntries = Object.entries(extracted).filter(([, v]) =>
    v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '2rem 1rem'
    }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '640px', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
          background: 'white', padding: '0.6rem 1.25rem', borderRadius: '50px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '1.25rem'
        }}>
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <span style={{ fontWeight: '700', color: '#1a1a2e' }}>Quick Profile Setup</span>
          <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '20px', fontWeight: '700' }}>~60 seconds</span>
        </div>
        <h1 style={{
          fontSize: '1.9rem', fontWeight: '800', margin: '0 0 0.5rem',
          background: 'linear-gradient(135deg, #1070b9, #054196)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Hey {user?.name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>
          Paste your LinkedIn bio, resume summary, or just tell us about yourself
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', width: '100%',
        maxWidth: '400px', marginBottom: '2rem', gap: '0'
      }}>
        <Step n={1} label="Paste Bio" active={step === 'paste'} done={step !== 'paste'} />
        <Divider />
        <Step n={2} label="Confirm" active={step === 'confirm'} done={step === 'missing' || step === 'done'} />
        <Divider />
        <Step n={3} label="Quick Fill" active={step === 'missing'} done={step === 'done'} />
        <Divider />
        <Step n={4} label="Done!" active={step === 'done'} done={false} />
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '640px', background: 'white',
        borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>

        {/* ── STEP 1: Paste Bio ── */}
        {step === 'paste' && (
          <div style={{ padding: '2rem' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>
              📋 Paste anything about yourself
            </h2>
            <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
              LinkedIn "About" section, resume summary, or just type it out. Our AI will extract your profile instantly.
            </p>

            {/* Example chips */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[
                "I'm a 3rd year CSE student at VJTI with 8.2 CGPA...",
                "B.Tech ECE 2026, 7.8 CGPA, skills: C++, Python...",
                "Final year student targeting SDE roles, 3 projects..."
              ].map((ex, i) => (
                <button key={i} onClick={() => setBioText(ex)} style={{
                  background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer',
                  color: '#475569', textAlign: 'left', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => e.target.style.borderColor = '#1070b9'}
                  onMouseLeave={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  💡 {ex.substring(0, 35)}...
                </button>
              ))}
            </div>

            <textarea
              value={bioText}
              onChange={e => { setBioText(e.target.value); setError(''); }}
              placeholder={`Paste your LinkedIn About section, resume summary, or just describe yourself:\n\nExample: "I'm a final year B.Tech CSE student at VJTI Mumbai with 8.5 CGPA. I know React, Node.js, Python and MongoDB. I've done 2 internships and built 4 projects. Currently preparing for SDE roles. I practice DSA regularly on LeetCode (150+ problems solved)."`}
              style={{
                width: '100%', padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '14px',
                fontSize: '0.95rem', resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', color: '#1e293b', lineHeight: '1.6',
                minHeight: '160px', boxSizing: 'border-box', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#1070b9'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0.5rem 0 0', background: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleParse}
              disabled={loading || bioText.trim().length < 15}
              style={{
                width: '100%', marginTop: '1rem', padding: '1rem',
                background: loading || bioText.trim().length < 15
                  ? '#e2e8f0'
                  : 'linear-gradient(135deg, #1070b9, #054196)',
                color: loading || bioText.trim().length < 15 ? '#94a3b8' : 'white',
                border: 'none', borderRadius: '12px', fontSize: '1rem',
                fontWeight: '700', cursor: loading || bioText.trim().length < 15 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Extracting your profile...
                </>
              ) : '⚡ Extract My Profile'}
            </button>

            <p style={{ textAlign: 'center', margin: '1rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Takes ~3 seconds • No data is stored beyond your profile
            </p>

            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button onClick={() => navigate('/form')} style={{
                background: 'none', border: 'none', color: '#94a3b8',
                cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'
              }}>
                Prefer a traditional form instead?
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Confirm Extracted ── */}
        {step === 'confirm' && (
          <div style={{ padding: '2rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '2px solid #bbf7d0', borderRadius: '14px',
              padding: '1rem 1.25rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <div>
                <div style={{ fontWeight: '700', color: '#15803d', fontSize: '0.95rem' }}>
                  Got {extractedEntries.length} detail{extractedEntries.length !== 1 ? 's' : ''} from your text!
                </div>
                <div style={{ color: '#16a34a', fontSize: '0.8rem' }}>
                  {missingFields.length === 0
                    ? 'Everything looks complete 🎉'
                    : `Just need ${missingFields.length} more thing${missingFields.length > 1 ? 's' : ''}`}
                </div>
              </div>
            </div>

            <h3 style={{ margin: '0 0 0.75rem', color: '#1e293b', fontSize: '1rem', fontWeight: '700' }}>
              📋 Extracted from your bio:
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {extractedEntries.map(([key, value]) => {
                const labelMap = {
                  cgpa: 'CGPA', branch: 'Branch', graduation_year: 'Grad Year',
                  college_name: 'College', skills: 'Skills', projects_count: 'Projects',
                  internships_count: 'Internships', dsa_level: 'DSA Level',
                  communication_score: 'Communication', target_role: 'Target Role', name: 'Name'
                };
                return <ExtractedTag key={key} label={labelMap[key] || key} value={value} />;
              })}
            </div>

            {missingFields.length > 0 && (
              <div style={{
                background: '#fff7ed', border: '1.5px solid #fed7aa',
                borderRadius: '12px', padding: '0.875rem 1rem', marginBottom: '1.25rem'
              }}>
                <div style={{ fontWeight: '700', color: '#c2410c', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  ⚠️ Still needed ({missingFields.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {missingFields.map(f => (
                    <span key={f} style={{
                      background: '#fed7aa', color: '#9a3412', padding: '0.2rem 0.6rem',
                      borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600'
                    }}>{FIELD_CONFIG[f]?.label || f}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setStep('paste'); setBioText(''); }} style={{
                flex: 1, padding: '0.875rem', background: 'white',
                border: '1.5px solid #e2e8f0', borderRadius: '12px',
                cursor: 'pointer', fontWeight: '600', color: '#64748b', fontSize: '0.9rem'
              }}>← Re-paste</button>
              <button onClick={handleConfirm} style={{
                flex: 2, padding: '0.875rem',
                background: 'linear-gradient(135deg, #1070b9, #054196)',
                border: 'none', borderRadius: '12px',
                cursor: 'pointer', fontWeight: '700', color: 'white', fontSize: '0.95rem'
              }}>
                {missingFields.length === 0 ? '🎉 Complete Setup!' : `Fill ${missingFields.length} missing field${missingFields.length > 1 ? 's' : ''} →`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Fill Missing (quick form, NO LLM) ── */}
        {step === 'missing' && (
          <div style={{ padding: '2rem' }}>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>
              Almost there! Just {missingFields.length} more thing{missingFields.length > 1 ? 's' : ''}
            </h2>
            <p style={{ color: '#64748b', margin: '0 0 1.5rem', fontSize: '0.875rem' }}>
              Quick fill — no AI needed for these
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {missingFields.map(field => {
                const config = FIELD_CONFIG[field];
                if (!config) return null;
                return (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                      {config.label} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {config.type === 'select' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {config.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setAnswers(p => ({ ...p, [field]: opt }))}
                            style={{
                              flex: 1, padding: '0.75rem',
                              border: `2px solid ${answers[field] === opt ? '#1070b9' : '#e2e8f0'}`,
                              borderRadius: '10px',
                              background: answers[field] === opt ? '#eff6ff' : 'white',
                              color: answers[field] === opt ? '#1070b9' : '#64748b',
                              cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
                              transition: 'all 0.15s'
                            }}
                          >{opt}</button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={config.type}
                        value={answers[field] || ''}
                        onChange={e => { setAnswers(p => ({ ...p, [field]: e.target.value })); setError(''); }}
                        placeholder={config.placeholder}
                        style={{
                          width: '100%', padding: '0.875rem 1rem',
                          border: `2px solid ${answers[field] ? '#1070b9' : '#e2e8f0'}`,
                          borderRadius: '10px', fontSize: '0.95rem',
                          outline: 'none', boxSizing: 'border-box',
                          fontFamily: 'inherit', color: '#1e293b',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.target.style.borderColor = '#1070b9'}
                        onBlur={e => e.target.style.borderColor = answers[field] ? '#1070b9' : '#e2e8f0'}
                      />
                    )}
                    {field === 'skills' && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Separate with commas</p>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0 0 1rem', background: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                {error}
              </p>
            )}

            <button onClick={handleFillMissing} disabled={loading} style={{
              width: '100%', padding: '1rem',
              background: loading ? '#e2e8f0' : 'linear-gradient(135deg, #1070b9, #054196)',
              color: loading ? '#94a3b8' : 'white',
              border: 'none', borderRadius: '12px', fontSize: '1rem',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Saving...
                </>
              ) : '🚀 Complete My Profile'}
            </button>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 'done' && (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>
              Profile Created!
            </h2>
            <p style={{ color: '#64748b', margin: '0 0 1.5rem' }}>
              Taking you to your dashboard...
            </p>
            <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'linear-gradient(90deg, #1070b9, #10b981)',
                borderRadius: '10px', animation: 'progress 2s linear forwards'
              }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
};

export default AIOnboarding;
