import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Icons from '../components/Icons';
import { experiencesAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CompanyPrep = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCompanies, setFetchingCompanies] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setFetchingCompanies(true);
      const res = await experiencesAPI.getCompanies();
      setCompanies(res.companies || []);
      if (res.companies && res.companies.length > 0) {
        // Default to first company
        setSelectedCompany(res.companies[0].folderName);
        loadInsights(res.companies[0].folderName);
      }
      setError(null);
    } catch (err) {
      console.error("Error loading companies:", err);
      setError("Failed to load company experiences library.");
    } finally {
      setFetchingCompanies(false);
    }
  };

  const loadInsights = async (companyFolder) => {
    setLoading(true);
    try {
      const data = await experiencesAPI.getInsights(companyFolder);
      setInsights(data);
      setError(null);
    } catch (err) {
      console.error("Error loading insights:", err);
      setError("Failed to load interview insights.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (e) => {
    const val = e.target.value;
    setSelectedCompany(val);
    loadInsights(val);
  };

  // Construct chart data based on difficulty rating
  const getChartData = () => {
    if (!insights) return [];
    const diff = insights.difficultyRating || 3;
    return [
      { name: 'Aptitude/Online Test', Difficulty: Math.max(1, diff - 1) },
      { name: 'Technical Interview', Difficulty: diff },
      { name: 'HR/Behavioral', Difficulty: Math.min(5, diff + 1) }
    ];
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: '1128px', margin: '0 auto', padding: '1.5rem 1.5rem', boxSizing: 'border-box' }}>
        
        {/* Page Hero */}
        <div style={{
          background: '#ffffff',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          color: '#191919',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icons.Briefcase size={32} color="#0a66c2" />
              Seniors' Placement Experiences Library
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#5e5e5e', margin: 0 }}>
              Search and analyze past interview logs. Our RAG engine crawls student reports to synthesize custom checklists and advice.
            </p>
          </div>

          <div style={{ minWidth: '240px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#5e5e5e', fontWeight: '600', marginBottom: '0.4rem' }}>
              Select Company Library
            </label>
            {fetchingCompanies ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#5e5e5e', fontSize: '0.85rem' }}>
                <Icons.Loader size={16} /> Loading companies...
              </div>
            ) : (
              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#191919',
                  background: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {companies.map((c) => (
                  <option key={c.folderName} value={c.folderName}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{
            background: '#ffffff',
            padding: '4rem 2rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            boxSizing: 'border-box'
          }}>
            <Icons.Loader size={48} color="#0a66c2" />
            <h3 style={{ color: '#191919', marginTop: '1.5rem', fontSize: '1.2rem', fontWeight: '600' }}>
              RAG Engine Processing Student PDF Logs...
            </h3>
            <p style={{ color: '#5e5e5e', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '420px' }}>
              Parsing page text, segmenting paragraphs, and generating structured preparation insights. This may take 1-2 seconds.
            </p>
          </div>
        ) : (
          insights && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
              
              {/* Left Column: AI synthesized Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Stepper Selection Rounds */}
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <h3 style={{ color: '#191919', fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    Recruitment Round Structure
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {insights.roundsList && insights.roundsList.map((round, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          background: '#0a66c2',
                          color: '#ffffff',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.85rem'
                        }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#191919' }}>{round}</span>
                        {idx < insights.roundsList.length - 1 && (
                          <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>➜</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Coding Topics Checklist */}
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <h3 style={{ color: '#191919', fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    Core Technical Topics to Prepare
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {insights.keyTopics && insights.keyTopics.map((topic, idx) => (
                      <div key={idx} style={{
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '4px solid #0a66c2',
                        border: '1px solid #e2e8f0',
                        borderLeftColor: '#0a66c2'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>{topic.topic}</h4>
                          <span style={{
                            background: topic.frequency === 'High' ? '#fee2e2' : topic.frequency === 'Medium' ? '#fef3c7' : '#f0fdf4',
                            color: topic.frequency === 'High' ? '#991b1b' : topic.frequency === 'Medium' ? '#92400e' : '#166534',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>
                            {topic.frequency} Frequency
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>{topic.tips}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Behavioral Tips & Core Values */}
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <h3 style={{ color: '#191919', fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    Behavioral Values & Cultural Alignment
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {insights.behavioralTips && insights.behavioralTips.map((tip, idx) => (
                      <li key={idx} style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Right Column: Statistics & Quotes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Difficulty Score Card */}
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <h4 style={{ color: '#5e5e5e', fontSize: '0.85rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>Selection Difficulty</h4>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} style={{
                        fontSize: '1.8rem',
                        color: star <= (insights.difficultyRating || 3) ? '#f59e0b' : '#cbd5e1'
                      }}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#5e5e5e', fontWeight: '500' }}>
                    {insights.difficultyRating >= 4 ? 'Highly Competitive' : insights.difficultyRating >= 3 ? 'Moderate' : 'Accessible'}
                  </span>
                </div>

                {/* Recharts difficulty visual */}
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', height: '260px' }}>
                  <h4 style={{ color: '#191919', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 1rem 0' }}>Difficulty Breakdown</h4>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={getChartData()} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Difficulty" fill="#0a66c2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Major Hurdles */}
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ color: '#191919', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icons.AlertCircle size={18} color="#ef4444" /> Significant Prep Hurdles
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {insights.difficultHurdles && insights.difficultHurdles.map((hurdle, idx) => (
                      <div key={idx} style={{
                        padding: '0.5rem 0.75rem',
                        background: '#fffbeb',
                        border: '1px solid #fef3c7',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#b45309',
                        fontWeight: '600'
                      }}>
                        {hurdle}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real Quotes extracted via RAG */}
                <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ color: '#191919', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icons.MessageSquare size={18} color="#0a66c2" /> Seniors' Real Advice
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {insights.studentQuotes && insights.studentQuotes.map((quote, idx) => (
                      <div key={idx} style={{
                        fontStyle: 'italic',
                        fontSize: '0.82rem',
                        color: '#475569',
                        lineHeight: '1.4',
                        background: '#edf3f8',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        position: 'relative'
                      }}>
                        "{quote}"
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
};

export default CompanyPrep;
