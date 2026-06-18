import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import Icons from '../components/Icons';

const MockInterview = () => {
  const [mode, setMode] = useState('select');
  const [questionType, setQuestionType] = useState('technical');
  const [role, setRole] = useState('');
  const [branch, setBranch] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showPrepPlan, setShowPrepPlan] = useState(false);
  const [prepPlan, setPrepPlan] = useState(null);
  const [answerMode, setAnswerMode] = useState('text'); // 'text' or 'speech'
  const [currentTurn, setCurrentTurn] = useState(1);
  const [chatHistory, setChatHistory] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const [isResumeBased, setIsResumeBased] = useState(true);
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [silenceCountDown, setSilenceCountDown] = useState(null);
  
  const silenceTimeoutRef = useRef(null);
  const silenceIntervalRef = useRef(null);
  const isHandsFreeRef = useRef(isHandsFree);

  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
  }, [isHandsFree]);

  // Predefined options
  const branches = [
    'Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Data Science', 
    'Artificial Intelligence', 'Cyber Security', 'Cloud Computing'
  ];

  const roles = [
    'Software Engineer', 'Full Stack Developer', 'Frontend Developer',
    'Backend Developer', 'Data Scientist', 'Data Analyst', 'DevOps Engineer',
    'Mobile App Developer', 'UI/UX Designer', 'Product Manager',
    'QA Engineer', 'Cloud Architect', 'Machine Learning Engineer',
    'Cybersecurity Analyst', 'Business Analyst'
  ];

  useEffect(() => {
    checkSpeechSupport();
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    };
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        if (isHandsFreeRef.current) {
          setAnswerMode('speech');
          startSpeechRecognition();
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const checkSpeechSupport = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setAnswerMode('text');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only');
      return;
    }

    setUploadingResume(true);
    setResumeFileName(file.name);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/interview/upload-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setResumeFileName('');
      } else {
        setResumeText(data.resumeText);
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      alert('Failed to parse resume PDF. Please try again.');
      setResumeFileName('');
    } finally {
      setUploadingResume(false);
    }
  };

  const fetchQuestion = async () => {
    if (!resumeText) {
      alert('Please upload your resume before starting the interview.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      let response;
      if (resumeText) {
        response = await fetch('/api/interview/question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: questionType,
            difficulty,
            role,
            branch,
            resumeText
          })
        });
      } else {
        let url = `/api/interview/question?type=${questionType}&difficulty=${difficulty}`;
        if (role) url += `&role=${encodeURIComponent(role)}`;
        if (branch) url += `&branch=${encodeURIComponent(branch)}`;
        
        response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch question');
      }

      const data = await response.json();
      setCurrentQuestion(data);
      setChatHistory([{ role: 'assistant', text: data.question }]);
      speakText(data.question);
      setCurrentTurn(1);
      setMode('interview');
      setAnswer('');
      setTranscript('');
    } catch (error) {
      alert('Failed to fetch question: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrepPlan = async () => {
    if (!role) {
      alert('Please select a job role first');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:5000/api/interview/prep-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role,
          branch,
          experience: 'fresher',
          weaknesses: 'confidence, technical depth'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to generate prep plan');
        return;
      }
      
      const data = await response.json();
      setPrepPlan(data);
      setShowPrepPlan(true);
    } catch (error) {
      alert('Failed to generate preparation plan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSilenceTimer = (currentTranscriptText) => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

    setSilenceCountDown(4);
    let secondsLeft = 4;
    silenceIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft >= 0) {
        setSilenceCountDown(secondsLeft);
      } else {
        clearInterval(silenceIntervalRef.current);
      }
    }, 1000);

    silenceTimeoutRef.current = setTimeout(() => {
      setSilenceCountDown(null);
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
      
      const textToSubmit = currentTranscriptText.trim();
      
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      clearInterval(timerRef.current);
      setInterimTranscript('');

      if (textToSubmit.length > 0) {
        submitSpeechAnswer(textToSubmit);
      }
    }, 4000);
  };

  const startSpeechRecognition = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    setSilenceCountDown(null);

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    let finalTranscript = '';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setRecordingTime(0);
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      if (isHandsFreeRef.current) {
        resetSilenceTimer('');
      }
    };

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          if (transcriptPart.toLowerCase().includes('submit answer') || transcriptPart.toLowerCase().includes('next question')) {
            const cleanedText = (finalTranscript + ' ' + transcriptPart)
              .replace(/submit answer/gi, '')
              .replace(/next question/gi, '')
              .trim();
            
            stopSpeechRecognition();
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
            setSilenceCountDown(null);
            
            if (cleanedText.length > 0) {
              submitSpeechAnswer(cleanedText);
            }
            return;
          }

          finalTranscript += transcriptPart + ' ';
          setTranscript(finalTranscript);
        } else {
          interim += transcriptPart;
        }
      }
      
      setInterimTranscript(interim);

      if (isHandsFreeRef.current) {
        resetSilenceTimer(finalTranscript + ' ' + interim);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopSpeechRecognition();
    };

    recognitionRef.current.onend = () => {
      if (isRecording) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Failed to restart speech recognition:", e);
        }
      }
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      alert('Failed to start speech recognition: ' + error.message);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
    setInterimTranscript('');
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
    setSilenceCountDown(null);
  };

  const submitAnswer = async (text) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const updatedHistory = [...chatHistory, { role: 'user', text }];
      setChatHistory(updatedHistory);

      if (currentTurn < 8) {
        const response = await fetch('/api/interview/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            chatHistory: updatedHistory,
            role,
            branch,
            questionType,
            difficulty,
            resumeText: isResumeBased ? resumeText : undefined
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to get follow-up question');
        }

        const data = await response.json();
        if (data.ended) {
          setAiFeedback(data.evaluation);
          setMode('results');
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
        } else {
          setChatHistory([...updatedHistory, { role: 'assistant', text: data.question }]);
          setCurrentQuestion(data);
          speakText(data.question);
          setCurrentTurn(prev => prev + 1);
          setAnswer('');
          setTranscript('');
        }
      } else {
        const response = await fetch('/api/interview/evaluate-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            chatHistory: updatedHistory,
            role,
            branch,
            questionType,
            difficulty,
            resumeText: isResumeBased ? resumeText : undefined
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to evaluate interview');
        }

        const data = await response.json();
        setAiFeedback(data);
        setMode('results');
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
    } catch (error) {
      alert('Failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitTextAnswer = () => {
    if (!answer.trim()) {
      alert('Please provide an answer');
      return;
    }
    submitAnswer(answer);
  };

  const submitSpeechAnswer = (overrideText) => {
    const textToSubmit = typeof overrideText === 'string' ? overrideText : transcript;
    if (!textToSubmit.trim()) {
      alert('No speech detected');
      return;
    }
    submitAnswer(textToSubmit);
  };

  const resetInterview = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setMode('select');
    setCurrentQuestion(null);
    setChatHistory([]);
    setCurrentTurn(1);
    setAnswer('');
    setTranscript('');
    setInterimTranscript('');
    setAnalysis(null);
    setAiFeedback(null);
    setRecordingTime(0);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const nextQuestion = () => {
    setAnswer('');
    setTranscript('');
    setInterimTranscript('');
    setAiFeedback(null);
    setRecordingTime(0);
    fetchQuestion();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Preparation Plan Modal
  if (showPrepPlan && prepPlan) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Navbar />
        
        <div style={{ maxWidth: '1128px', margin: '0 auto', padding: '1.5rem 1.5rem', boxSizing: 'border-box' }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: '#8b5cf6', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icons.Target size={36} color="#8b5cf6" />
                Your Personalized Interview Prep Plan
              </h2>
              <button
                onClick={() => setShowPrepPlan(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Close
              </button>
            </div>

            <div style={{
              background: '#f0f9ff',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '2px solid #3b82f6'
            }}>
              <h3 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Preparing for:</h3>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {role} {branch && `(${branch})`}
              </div>
            </div>

            {/* Topics to Study */}
            <Section title={<span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Icons.BookOpen size={24} color="#333" /> Key Topics to Study</span>} items={prepPlan.topics} />

            {/* Focus Areas */}
            <Section title={<span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Icons.Target size={24} color="#333" /> Practice Focus Areas</span>} items={prepPlan.focusAreas} />

            {/* Common Questions */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.AlertCircle size={24} color="#333" />
                Common Questions to Prepare
              </h3>
              {prepPlan.commonQuestions?.map((q, idx) => (
                <div key={idx} style={{
                  background: '#fef3c7',
                  padding: '1rem',
                  borderRadius: '10px',
                  marginBottom: '0.75rem',
                  borderLeft: '4px solid #f59e0b'
                }}>
                  <strong>{idx + 1}.</strong> {q}
                </div>
              ))}
            </div>

            {/* Resources */}
            <Section title={<span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Icons.BookOpen size={24} color="#333" /> Recommended Resources</span>} items={prepPlan.resources} />

            {/* Timeline */}
            {prepPlan.timeline && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Clock size={24} color="#333" />
                  Preparation Timeline
                </h3>
                {Object.entries(prepPlan.timeline).map(([week, desc]) => (
                  <div key={week} style={{
                    background: '#d1fae5',
                    padding: '1rem',
                    borderRadius: '10px',
                    marginBottom: '0.75rem'
                  }}>
                    <strong style={{ color: '#059669', textTransform: 'capitalize' }}>{week}:</strong>
                    <span style={{ marginLeft: '0.5rem', color: '#065f46' }}>{desc}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowPrepPlan(false)}
              style={{
                width: '100%',
                marginTop: '2rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, #1070b9 0% , #054196 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Icons.Zap size={24} color="white" />
              Start Practicing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interview Screen (Conversational Panel)
  if (mode === 'interview') {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Navbar />
        
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1.5rem', boxSizing: 'border-box' }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            {/* Header info */}
            <div style={{
              background: '#f0f9ff',
              padding: '1rem',
              borderRadius: '10px',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  {questionType.toUpperCase()} • {difficulty.toUpperCase()}
                </div>
                {role && (
                  <div style={{ fontSize: '0.9rem', color: '#1070b9', fontWeight: '600' }}>
                    {role} {branch && `• ${branch}`}
                  </div>
                )}
              </div>
              <div style={{
                background: '#054196',
                color: 'white',
                padding: '0.5rem 1.2rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}>
                Turn {currentTurn} of 7
              </div>
            </div>

            {/* Chat History Area */}
            <div style={{
              border: '2px solid #e0e7ff',
              borderRadius: '15px',
              padding: '1.5rem',
              height: '380px',
              overflowY: 'auto',
              marginBottom: '2rem',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {chatHistory.map((msg, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '1rem 1.25rem',
                    borderRadius: '15px',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    background: msg.role === 'user' ? '#054196' : 'white',
                    color: msg.role === 'user' ? 'white' : '#334155',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    borderTopRightRadius: msg.role === 'user' ? '2px' : '15px',
                    borderTopLeftRadius: msg.role === 'user' ? '15px' : '2px',
                  }}>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      opacity: 0.8,
                      marginBottom: '0.25rem',
                      color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : '#64748b'
                    }}>
                      {msg.role === 'user' ? 'You (Candidate)' : 'Interviewer (Agent A)'}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Answer Mode Selection */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setAnswerMode('text')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: answerMode === 'text' ? '#054196' : 'white',
                    color: answerMode === 'text' ? 'white' : '#333',
                    border: answerMode === 'text' ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Icons.FileText size={20} color={answerMode === 'text' ? 'white' : '#333'} />
                  Type Answer
                </button>
                <button
                  onClick={() => setAnswerMode('speech')}
                  disabled={!speechSupported}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: answerMode === 'speech' ? '#054196' : 'white',
                    color: answerMode === 'speech' ? 'white' : '#333',
                    border: answerMode === 'speech' ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: speechSupported ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    opacity: speechSupported ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Icons.Microphone size={20} color={answerMode === 'speech' ? 'white' : '#333'} />
                  Speak Answer
                </button>
              </div>

              {!speechSupported && answerMode === 'speech' && (
                <div style={{
                  padding: '1rem',
                  background: '#fef3c7',
                  borderRadius: '10px',
                  color: '#92400e',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Icons.AlertCircle size={20} color="#92400e" />
                  Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.
                </div>
              )}
            </div>

            {/* Text Answer Input */}
            {answerMode === 'text' && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                  Your Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '1rem',
                    border: '2px solid #e0e7ff',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#64748b',
                  textAlign: 'right'
                }}>
                  {answer.split(/\s+/).filter(w => w).length} words
                </div>
              </div>
            )}

            {/* Speech Answer Input */}
            {answerMode === 'speech' && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  background: isRecording ? '#fef3c7' : '#f9fafb',
                  padding: '2rem',
                  borderRadius: '10px',
                  border: isRecording ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  {!isRecording ? (
                    <div>
                      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <Icons.Microphone size={48} color="#64748b" />
                      </div>
                      <div style={{ fontSize: '1.1rem', color: '#64748b' }}>
                        Click the button below to start recording
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        marginBottom: '1rem',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        <Icons.Activity size={48} color="#f59e0b" />
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#f59e0b',
                        marginBottom: '0.5rem'
                      }}>
                        Recording... {formatTime(recordingTime)}
                      </div>
                      {isHandsFree && silenceCountDown !== null && (
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#ef4444',
                          margin: '0.5rem 0',
                          padding: '0.25rem 0.5rem',
                          background: '#fee2e2',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          Auto-submitting in {silenceCountDown}s...
                        </div>
                      )}
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        Speak clearly into your microphone
                      </div>
                    </div>
                  )}
                </div>

                {transcript && (
                  <div style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '2px solid #e0e7ff',
                    marginBottom: '1rem',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>
                      Transcript:
                    </div>
                    <div style={{ color: '#555' }}>
                      {transcript}
                      {interimTranscript && (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>{interimTranscript}</span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  {!isRecording ? (
                    <button
                      onClick={startSpeechRecognition}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Icons.Microphone size={24} color="white" />
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopSpeechRecognition}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Icons.Pause size={24} color="white" />
                      Stop Recording
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={resetInterview}
                style={{
                  padding: '1rem 2rem',
                  background: 'white',
                  color: '#64748b',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Back
              </button>
              
              <button
                onClick={answerMode === 'text' ? submitTextAnswer : submitSpeechAnswer}
                disabled={loading || (answerMode === 'text' ? !answer.trim() : !transcript.trim())}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: loading || (answerMode === 'text' ? !answer.trim() : !transcript.trim()) 
                    ? '#ccc' 
                    : 'linear-gradient(135deg, #054196 0% , #1070b9 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: loading || (answerMode === 'text' ? !answer.trim() : !transcript.trim()) 
                    ? 'not-allowed' 
                    : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <Icons.Loader size={24} color="white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icons.CheckCircle size={24} color="white" />
                    {currentTurn === 5 ? 'Finish & Evaluate' : 'Submit Answer'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  // Results Screen
  if (mode === 'results') {
    const radarData = aiFeedback?.radarMetrics ? [
      { metric: 'Tech Depth', value: aiFeedback.radarMetrics.technicalDepth, fullMark: 100 },
      { metric: 'Communication', value: aiFeedback.radarMetrics.communication, fullMark: 100 },
      { metric: 'Problem Solving', value: aiFeedback.radarMetrics.problemSolving, fullMark: 100 },
      { metric: 'Relevance', value: aiFeedback.radarMetrics.relevance, fullMark: 100 }
    ] : [];

    return (
      <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Navbar />
        
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1.5rem', boxSizing: 'border-box' }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: radarData.length > 0 ? '1fr 1fr' : '1fr', gap: '2rem', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {aiFeedback?.score >= 80 ? (
                    <Icons.Award size={64} color="#10b981" />
                  ) : aiFeedback?.score >= 60 ? (
                    <Icons.CheckCircle size={64} color="#f59e0b" />
                  ) : (
                    <Icons.TrendingUp size={64} color="#ef4444" />
                  )}
                </div>
                <h2 style={{ color: '#333', fontSize: '2rem', marginBottom: '0.5rem' }}>
                  Interview Scorecard
                </h2>
                <div style={{
                  fontSize: '4.5rem',
                  fontWeight: 'bold',
                  color: getScoreColor(aiFeedback?.score || 0)
                }}>
                  {aiFeedback?.score || 0}%
                </div>
                <div style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '0.5rem' }}>
                  {aiFeedback?.score >= 80 ? 'Excellent Performance!' : aiFeedback?.score >= 60 ? 'Good Potential!' : 'Needs Preparation!'}
                </div>
              </div>

              {radarData.length > 0 && (
                <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#334155', fontSize: 12, fontWeight: '600' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Candidate" dataKey="value" stroke="#054196" fill="#1070b9" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Overall Evaluation Narrative */}
            {aiFeedback?.overallEvaluation && (
              <div style={{
                background: '#f8fafc',
                padding: '2rem',
                borderRadius: '15px',
                border: '1px solid #e2e8f0',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#334155', fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Brain size={24} color="#054196" />
                  Agentic Evaluation Debrief
                </h3>
                <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
                  {aiFeedback.overallEvaluation}
                </p>
              </div>
            )}

            {aiFeedback && (
              <>
                {/* Strengths */}
                {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.CheckCircle size={24} color="#10b981" />
                      Strengths
                    </h3>
                    {aiFeedback.strengths.map((strength, idx) => (
                      <div key={idx} style={{
                        background: '#d1fae5',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center'
                      }}>
                        <Icons.CheckCircle size={20} color="#059669" />
                        <span style={{ color: '#065f46' }}>{strength}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Areas for Improvement */}
                {aiFeedback.improvements && aiFeedback.improvements.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Lightbulb size={24} color="#f59e0b" />
                      Areas for Improvement
                    </h3>
                    {aiFeedback.improvements.map((improvement, idx) => (
                      <div key={idx} style={{
                        background: '#fef3c7',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center'
                      }}>
                        <Icons.Lightbulb size={20} color="#f59e0b" />
                        <span style={{ color: '#92400e' }}>{improvement}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {aiFeedback.suggestions && aiFeedback.suggestions.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Target size={24} color="#3b82f6" />
                      Actionable Suggestions
                    </h3>
                    {aiFeedback.suggestions.map((suggestion, idx) => (
                      <div key={idx} style={{
                        background: '#dbeafe',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center'
                      }}>
                        <Icons.Target size={20} color="#1070b9" />
                        <span style={{ color: '#1e40af' }}>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Collapsible Transcript */}
            <div style={{ marginTop: '2rem', borderTop: '2px solid #f1f5f9', paddingTop: '2rem' }}>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#334155'
                }}
              >
                <span>View Full Conversational Transcript</span>
                <span>{showTranscript ? '▲' : '▼'}</span>
              </button>

              {showTranscript && (
                <div style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  background: '#f8fafc',
                  padding: '1.5rem',
                  borderRadius: '15px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0'
                }}>
                  {chatHistory.map((msg, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}>
                      <div style={{
                        maxWidth: '80%',
                        padding: '1rem 1.25rem',
                        borderRadius: '15px',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        background: msg.role === 'user' ? '#054196' : 'white',
                        color: msg.role === 'user' ? 'white' : '#334155',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                        borderTopRightRadius: msg.role === 'user' ? '2px' : '15px',
                        borderTopLeftRadius: msg.role === 'user' ? '15px' : '2px',
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          opacity: 0.8,
                          marginBottom: '0.25rem',
                          color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : '#64748b'
                        }}>
                          {msg.role === 'user' ? 'You' : 'Interviewer'}
                        </div>
                        <div>{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
              <button
                onClick={resetInterview}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'white',
                  color: '#64748b',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Back to Home
              </button>
              
              <button
                onClick={nextQuestion}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #054196 0% , #1070b9 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <Icons.Loader size={24} color="white" />
                    Loading...
                  </>
                ) : (
                  <>
                    Start New Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Select Question Screen
  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1128px', margin: '0 auto', padding: '1.5rem 1.5rem', boxSizing: 'border-box' }}>
        <div style={{
          background: '#ffffff',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          color: '#191919',
          marginBottom: '1rem'
        }}>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icons.Microphone size={32} color="#0a66c2" />
            AI Mock Interview
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#5e5e5e', margin: 0 }}>
            Get personalized questions and instant feedback
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          marginBottom: '1rem',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ color: '#191919', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.Target size={22} color="#0a66c2" />
            Configure Your Interview
          </h2>
          
          {/* Role Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#555', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Briefcase size={20} color="#555" />
              Target Job Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e7ff',
                borderRadius: '10px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="">Select a role...</option>
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Branch Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#555', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Award size={20} color="#555" />
              Your Branch/Field
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e7ff',
                borderRadius: '10px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="">Select your branch...</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Question Type */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#555', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.FileText size={20} color="#555" />
              Interview Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {['hr', 'technical'].map(type => (
                <button
                  key={type}
                  onClick={() => setQuestionType(type)}
                  style={{
                    padding: '1rem',
                    background: questionType === type ? 'linear-gradient(135deg, #1070b9 0% , #054196 100%)' : 'white',
                    color: questionType === type ? 'white' : '#333',
                    border: questionType === type ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {type === 'hr' ? 'HR' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#555', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Activity size={20} color="#555" />
              Difficulty Level
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {['easy', 'medium', 'hard'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  style={{
                    padding: '0.75rem',
                    background: difficulty === diff ? '#054196' : 'white',
                    color: difficulty === diff ? 'white' : '#333',
                    border: difficulty === diff ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* PDF Upload Dropzone */}
          {isResumeBased && (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              transition: 'border-color 0.2s',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                accept=".pdf"
                id="interview-resume-upload"
                style={{ display: 'none' }}
                onChange={handleResumeUpload}
              />
              <label htmlFor="interview-resume-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  <Icons.FileText size={40} color="#054196" />
                </div>
                {uploadingResume ? (
                  <p style={{ margin: 0, color: '#64748b', fontWeight: '500' }}>Parsing resume text...</p>
                ) : resumeFileName ? (
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: '#054196', fontWeight: '700' }}>✓ {resumeFileName}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Resume uploaded successfully. Ready to start.</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '0 0 0.25rem', color: '#334155', fontWeight: '600' }}>Upload your PDF Resume</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>PDF files only (max 5MB)</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Hands-Free Mode Toggle */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icons.Microphone size={24} color="#054196" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>Hands-Free Mode</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Voice-guided automatic listening & submission</div>
              </div>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '50px',
              height: '26px'
            }}>
              <input
                type="checkbox"
                checked={isHandsFree}
                onChange={(e) => setIsHandsFree(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isHandsFree ? '#10b981' : '#cbd5e1',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: isHandsFree ? '28px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              onClick={fetchQuestion}
              disabled={loading}
              style={{
                padding: '1rem',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #1070b9 0% , #054196 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <Icons.Loader size={24} color="white" />
                  Generating...
                </>
              ) : (
                <>
                  <Icons.Zap size={24} color="white" />
                  Start Interview
                </>
              )}
            </button>

            <button
              onClick={fetchPrepPlan}
              disabled={loading || !role}
              style={{
                padding: '1rem',
                background: loading || !role ? '#ccc' : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: loading || !role ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Icons.FileText size={24} color="white" />
              Get Prep Plan
            </button>
          </div>

          {!role && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#fef3c7',
              borderRadius: '10px',
              color: '#92400e',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <Icons.Lightbulb size={20} color="#92400e" />
              Select a role to get personalized questions !
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, items }) => (
  <div style={{ marginBottom: '2rem' }}>
    <h3 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.3rem' }}>{title}</h3>
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {items?.map((item, idx) => (
        <div key={idx} style={{
          background: '#f9fafb',
          padding: '1rem',
          borderRadius: '10px',
          border: '2px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{
            background: '#1070b9',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {idx + 1}
          </span>
          <span style={{ color: '#333', fontWeight: '500' }}>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

export default MockInterview;