import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icons from '../components/Icons';

const MockTestResults = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const results = state?.results;
  const [showExplanations, setShowExplanations] = useState(false);
  const [filterWrong, setFilterWrong] = useState(false);

  if (!results) { navigate('/mock-test'); return null; }

  const { score, correct, total, topicBreakdown, weakTopics, results: questionResults, message } = results;

  const displayed = filterWrong
    ? questionResults.filter(r => !r.isCorrect)
    : questionResults;

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Score Card */}
        <div style={{
          background: `linear-gradient(135deg, ${scoreColor}15, ${scoreColor}30)`,
          border: `2px solid ${scoreColor}40`,
          borderRadius: '20px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Icons.Award size={48} color={scoreColor} />
          </div>
          <div style={{ fontSize: '4rem', fontWeight: '900', color: scoreColor }}>{score}%</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1e293b', margin: '0.5rem 0' }}>{message}</div>
          <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Icons.CheckCircle size={16} color="#64748b" />
            {correct} correct out of {total} questions
          </div>
        </div>

        {/* Topic Breakdown */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.ChartBar size={20} color="#1070b9" />
            Topic Breakdown
          </h3>
          {topicBreakdown.map(t => (
            <div key={t.topic} style={{ marginBottom: '1rem' }}>
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
                  borderRadius: '10px', transition: 'width 1s ease'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Weak Topics Alert */}
        {weakTopics.length > 0 && (
          <div style={{
            background: '#fff7ed', border: '2px solid #fed7aa',
            borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#c2410c', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.AlertCircle size={20} color="#c2410c" />
              Topics to Improve
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {weakTopics.map(t => (
                <span key={t} style={{
                  background: '#fed7aa', color: '#9a3412',
                  padding: '0.3rem 0.75rem', borderRadius: '20px',
                  fontSize: '0.85rem', fontWeight: '600'
                }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Question Review */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.FileText size={20} color="#1070b9" />
              Question Review
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

          {displayed.map((r, idx) => (
            <div
              key={idx}
              style={{
                border: `1.5px solid ${r.isCorrect ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem',
                background: r.isCorrect ? '#f0fdf4' : '#fff5f5'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>
                  Q{r.questionIndex + 1} • {r.topic} • {r.difficulty}
                </span>
                <span style={{
                  fontWeight: '800', color: r.isCorrect ? '#10b981' : '#ef4444',
                  display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}>
                  {r.isCorrect
                    ? <><Icons.CheckCircle size={16} color="#10b981" /> Correct</>
                    : <><Icons.AlertCircle size={16} color="#ef4444" /> Wrong</>
                  }
                </span>
              </div>

              <p style={{
                margin: '0 0 0.75rem', color: '#1e293b', fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                fontFamily: r.question.includes('\n') ? 'monospace' : 'inherit'
              }}>
                {r.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: showExplanations && r.explanation ? '0.75rem' : 0 }}>
                {r.options.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem',
                      background: i === r.correctAnswer ? '#d1fae5' : i === r.userAnswer && !r.isCorrect ? '#fee2e2' : 'transparent',
                      color: i === r.correctAnswer ? '#065f46' : i === r.userAnswer && !r.isCorrect ? '#dc2626' : '#374151',
                      fontWeight: i === r.correctAnswer || i === r.userAnswer ? '700' : '400',
                      display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}
                  >
                    {i === r.correctAnswer && <Icons.CheckCircle size={14} color="#10b981" />}
                    {i === r.userAnswer && !r.isCorrect && <Icons.AlertCircle size={14} color="#dc2626" />}
                    <span>{['A', 'B', 'C', 'D'][i]}. {opt}</span>
                    {i === r.correctAnswer && <span style={{ fontSize: '0.75rem' }}>(correct)</span>}
                    {i === r.userAnswer && !r.isCorrect && <span style={{ fontSize: '0.75rem' }}>(your answer)</span>}
                  </div>
                ))}
              </div>

              {showExplanations && r.explanation && (
                <div style={{
                  background: '#f0f9ff', borderLeft: '3px solid #1070b9',
                  padding: '0.75rem', borderRadius: '0 8px 8px 0',
                  fontSize: '0.875rem', color: '#1e40af',
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
                }}>
                  <Icons.Lightbulb size={16} color="#1070b9" style={{ flexShrink: 0, marginTop: '2px' }} />
                  {r.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => navigate('/mock-test')}
            style={{
              flex: 1, padding: '0.875rem',
              background: 'linear-gradient(135deg, #1070b9, #054196)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontWeight: '700', cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <Icons.Zap size={20} color="white" />
            Take Another Test
          </button>
          <button
            onClick={() => navigate('/mock-test/history')}
            style={{
              flex: 1, padding: '0.875rem',
              background: 'white', color: '#1070b9',
              border: '2px solid #1070b9', borderRadius: '12px',
              fontWeight: '700', cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <Icons.ChartBar size={20} color="#1070b9" />
            View All History
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

export default MockTestResults;