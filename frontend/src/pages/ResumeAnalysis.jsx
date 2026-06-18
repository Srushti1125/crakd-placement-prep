import { useState } from 'react';
import Navbar from '../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Icons from '../components/Icons';

const ResumeAnalysis = () => {
  const [uploadMethod, setUploadMethod] = useState('pdf'); 
  const [pdfFile, setPdfFile] = useState(null);
  const [formData, setFormData] = useState({
    resumeText: '',
    jobDescription: '',
    jobRole: '',
    requiredSkills: ''
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Please select a PDF file');
      e.target.value = null;
    }
  };

  const handlePDFAnalyze = async (e) => {
    e.preventDefault();
    
    if (!pdfFile) {
      alert('Please select a PDF file');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const formDataToSend = new FormData();
      formDataToSend.append('resume', pdfFile);
      formDataToSend.append('jobDescription', formData.jobDescription);
      formDataToSend.append('jobRole', formData.jobRole);
      formDataToSend.append('requiredSkills', formData.requiredSkills);

      const response = await fetch('http://localhost:5000/api/resume/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setAnalysis(data);
      }
    } catch (error) {
      console.error('PDF analysis error:', error);
      alert('Failed to analyze PDF resume');
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/resume/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s)
        })
      });

      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const radarData = [];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1128px', margin: '0 auto', padding: '1.5rem 1.5rem', boxSizing: 'border-box' }}>
        {/* Hero Header */}
        <div style={{
          background: '#ffffff',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          color: '#191919',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icons.FileText size={32} color="#0a66c2" />
            Resume Study Planner & Questions Generator
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#5e5e5e', margin: 0 }}>
            Upload your resume to receive a personalized study plan and targeted mock interview questions based on your projects and skills.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: analysis ? '360px 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Input Form */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            height: 'fit-content',
            position: 'sticky',
            top: '4.5rem'
          }}>
            <h2 style={{ color: '#191919', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.FileText size={22} color="#0a66c2" />
              Upload Resume
            </h2>

            {/* Upload Method Toggle */}
            <div style={{
              display: 'flex',
              gap: '0.35rem',
              marginBottom: '1.5rem',
              background: '#f3f2ef',
              padding: '0.35rem',
              borderRadius: '8px'
            }}>
              <button
                onClick={() => setUploadMethod('pdf')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: uploadMethod === 'pdf' ? '#0a66c2' : 'transparent',
                  color: uploadMethod === 'pdf' ? 'white' : '#5e5e5e',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Icons.FileText size={16} color={uploadMethod === 'pdf' ? 'white' : '#5e5e5e'} />
                Upload PDF
              </button>
              <button
                onClick={() => setUploadMethod('text')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: uploadMethod === 'text' ? '#0a66c2' : 'transparent',
                  color: uploadMethod === 'text' ? 'white' : '#5e5e5e',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Icons.FileText size={16} color={uploadMethod === 'text' ? 'white' : '#5e5e5e'} />
                Paste Text
              </button>
            </div>
            
            <form onSubmit={uploadMethod === 'pdf' ? handlePDFAnalyze : handleTextAnalyze}>
              {uploadMethod === 'pdf' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555', fontSize: '0.95rem' }}>
                    Resume PDF File *
                  </label>
                  <div style={{
                    border: '1px dashed #0a66c2',
                    borderRadius: '6px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: '#edf3f8',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = '#d0e1f9';
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = '#edf3f8';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = '#edf3f8';
                    const file = e.dataTransfer.files[0];
                    if (file && file.type === 'application/pdf') {
                      setPdfFile(file);
                    }
                  }}>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required={uploadMethod === 'pdf'}
                      style={{ display: 'none' }}
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload" style={{ cursor: 'pointer', display: 'block' }}>
                      {pdfFile ? (
                        <div>
                          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                            <Icons.FileText size={36} color="#0a66c2" />
                          </div>
                          <div style={{ color: '#0a66c2', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                            {pdfFile.name}
                          </div>
                          <div style={{ color: '#5e5e5e', fontSize: '0.75rem' }}>
                            {(pdfFile.size / 1024).toFixed(2)} KB
                          </div>
                          <div style={{ marginTop: '0.5rem', color: '#004182', fontSize: '0.8rem', fontWeight: '600' }}>
                            Click to change file
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                            <Icons.FileText size={36} color="#0a66c2" />
                          </div>
                          <div style={{ color: '#0a66c2', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                            Click to upload or drag and drop
                          </div>
                          <div style={{ color: '#5e5e5e', fontSize: '0.75rem' }}>
                            PDF files only (max 5MB)
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#5e5e5e', fontSize: '0.85rem' }}>
                    Resume Text *
                  </label>
                  <textarea
                    value={formData.resumeText}
                    onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
                    placeholder="Paste your resume content here..."
                    required={uploadMethod === 'text'}
                    rows="6"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      outline: 'none',
                      background: 'white',
                      color: '#191919'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0a66c2'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#5e5e5e', fontSize: '0.85rem' }}>
                  Job Description (Optional)
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Paste target job description..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    outline: 'none',
                    background: 'white',
                    color: '#191919'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0a66c2'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#5e5e5e', fontSize: '0.85rem' }}>
                  Target Job Role
                </label>
                <input
                  type="text"
                  value={formData.jobRole}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  placeholder="e.g., Software Engineer"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    background: 'white',
                    color: '#191919'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0a66c2'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#5e5e5e', fontSize: '0.85rem' }}>
                  Required Skills
                </label>
                <input
                  type="text"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  placeholder="Python, React, AWS..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    background: 'white',
                    color: '#191919'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0a66c2'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: loading ? '#cbd5e1' : '#0a66c2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? (
                  <>
                    <Icons.Loader size={18} color="white" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Icons.Zap size={18} color="white" />
                    Analyze Resume
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Section */}
          {analysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(16, 112, 185, 0.1)',
                    textAlign: 'center'
                  }}>
                    <h2 style={{ color: '#333', marginBottom: '0.5rem', fontSize: '1.4rem', fontWeight: '600' }}>
                      Resume Readiness Score
                    </h2>
                    <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                      Overall evaluation of your resume's readiness for the <strong>{formData.jobRole || 'Software Engineer'}</strong> role.
                    </p>
                    <div style={{
                      fontSize: '5rem',
                      fontWeight: 'bold',
                      color: getScoreColor(analysis.overallScore),
                      marginBottom: '0.5rem',
                      textShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}>
                      {analysis.overallScore}%
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      color: '#555',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      {analysis.overallScore >= 80 ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Icons.Award size={22} /> Excellent Match! Ready for Interviews.
                        </span>
                      ) : analysis.overallScore >= 60 ? (
                        <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Icons.CheckCircle size={22} /> Good Base. Some Preparation Needed.
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Icons.TrendingUp size={22} /> Needs Preparation before applying.
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(16, 112, 185, 0.1)'
                  }}>
                    <h3 style={{
                      color: '#1070b9',
                      marginBottom: '1.5rem',
                      fontSize: '1.35rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      borderBottom: '2px solid #f1f5f9',
                      paddingBottom: '0.75rem'
                    }}>
                      <Icons.BookOpen size={26} color="#1070b9" />
                      Personalized Study Guide (Topics to Prepare)
                    </h3>
                    
                    {analysis.studyTopics && analysis.studyTopics.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {analysis.studyTopics.map((topic, idx) => (
                          <div key={idx} style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            borderLeft: '5px solid #1070b9',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                          >
                            <h4 style={{ color: '#1e293b', fontSize: '1.15rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                              {topic.topic}
                            </h4>
                            <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 1rem 0', lineHeight: '1.6' }}>
                              {topic.reason}
                            </p>
                            {topic.resources && topic.resources.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Study Resources:</span>
                                {topic.resources.map((res, rIdx) => (
                                  <span key={rIdx} style={{
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '15px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    border: '1px solid #bae6fd'
                                  }}>
                                    {res}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>
                        No specific topics identified. You are good to go!
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(16, 112, 185, 0.1)'
                  }}>
                    <h3 style={{
                      color: '#054196',
                      marginBottom: '1.5rem',
                      fontSize: '1.35rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      borderBottom: '2px solid #f1f5f9',
                      paddingBottom: '0.75rem'
                    }}>
                      <Icons.MessageSquare size={26} color="#054196" />
                      Targeted Mock Questions (Based on Resume)
                    </h3>

                    {analysis.possibleQuestions && analysis.possibleQuestions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {analysis.possibleQuestions.map((q, idx) => (
                          <div key={idx} style={{
                            padding: '1.25rem 1.5rem',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{
                                  background: q.type === 'Project' ? '#f59e0b' : '#3b82f6',
                                  color: 'white',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '700'
                                }}>
                                  {q.type} Question
                                </span>
                                {q.context && (
                                  <span style={{
                                    background: '#e2e8f0',
                                    color: '#475569',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    Focus: {q.context}
                                  </span>
                                )}
                              </div>
                              <p style={{ color: '#1e293b', fontSize: '1rem', fontWeight: '500', margin: 0, lineHeight: '1.5' }}>
                                "{q.question}"
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(q.question);
                                alert('Question copied to clipboard!');
                              }}
                              style={{
                                background: 'white',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#054196';
                                e.currentTarget.style.borderColor = '#054196';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#64748b';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                              }}
                              title="Copy Question"
                            >
                              <Icons.Copy size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>
                        No mock questions generated.
                      </div>
                    )}
                  </div>
                </div>
            </div>
          ) : (
            <div style={{
              background: 'white',
              padding: '3rem 2rem',
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
              <div style={{
                marginBottom: '1.5rem',
                opacity: 0.8
              }}>
                <Icons.FileText size={72} color="#0a66c2" />
              </div>
              <h3 style={{ color: '#191919', fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                Ready to Analyze Your Resume?
              </h3>
              <p style={{ color: '#5e5e5e', fontSize: '0.95rem', maxWidth: '480px', margin: 0, lineHeight: 1.5 }}>
                Upload a PDF or paste your resume text to get a personalized Study Guide and targeted mock interview questions based on your projects and skills.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value, description, color }) => (
  <div style={{
    background: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box'
  }}>
    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
    <h4 style={{ color: '#5e5e5e', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>{title}</h4>
    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color, marginBottom: '0.25rem' }}>
      {value}
    </div>
    <p style={{ color: '#5e5e5e', fontSize: '0.8rem', margin: 0, fontWeight: '500' }}>{description}</p>
  </div>
);

export default ResumeAnalysis;