import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { analysisAPI, resumeAPI, projectAPI, profileAPI } from '../utils/api';
import Icons from '../components/Icons';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [projectHistory, setProjectHistory] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const userProfile = await profileAPI.getProfile().catch(() => null);
      setProfile(userProfile);

      const readinessData = await analysisAPI.getReadiness().catch(() => null);
      setReadiness(readinessData);

      const resumeList = await resumeAPI.getHistory().catch(() => []);
      setResumeHistory(resumeList);

      const projectList = await projectAPI.getEvaluations().catch(() => []);
      setProjectHistory(projectList);

      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const generateTodoItems = () => {
    const items = [];
    if (profile) {
      const cgpa = parseFloat(profile.cgpa);
      if (cgpa < 8.0) {
        items.push({
          title: "GPA Alert: Threshold warning",
          desc: `Your current CGPA is ${profile.cgpa}. Many premium company listings enforce a strict 8.0 CGPA cut-off. Focus on core syllabus topics to ensure academic clearances.`,
          tag: "Academic Advisory",
          color: "#ef4444",
          icon: <Icons.AlertCircle size={20} color="#ef4444" />,
          actionLabel: "Edit Profile",
          actionTarget: "/profile"
        });
      }
      if (profile.dsa_level === 'Beginner' || !profile.dsa_level) {
        items.push({
          title: "Milestone: Strengthen Data Structures",
          desc: "You are currently marked as a DSA Beginner. We recommend practicing core structures (trees, graphs, hashing) to match requirements for technical roles.",
          tag: "DSA Practice",
          color: "#f59e0b",
          icon: <Icons.Code size={20} color="#f59e0b" />,
          actionLabel: "Start Mock Tests",
          actionTarget: "/mock-test"
        });
      }
      if (parseInt(profile.projects_count || 0) < 2) {
        items.push({
          title: "Resume Upgrade: Expand Project Portfolio",
          desc: "You have less than 2 major projects in your profile. Adding a secondary core project (e.g. cloud database backend or mobile app) increases your placement response rates.",
          tag: "Project Portfolio",
          color: "#3b82f6",
          icon: <Icons.Briefcase size={20} color="#3b82f6" />,
          actionLabel: "Analyze Projects",
          actionTarget: "/ProjectEvaluation"
        });
      }
    }
    items.push({
      title: "Action Item: Run a Resume Audit",
      desc: "Scan your latest PDF resume to audit keyword scores, formatting, and generate targeted custom study questions.",
      tag: "Resume Planning",
      color: "#0a66c2",
      icon: <Icons.FileText size={20} color="#0a66c2" />,
      actionLabel: "Audit Resume",
      actionTarget: "/resume"
    });
    items.push({
      title: "Preparation: Live Technical Mock Interview",
      desc: "Simulate a live stateful technical or HR interview session utilizing real-time voice feedback and follow-up questioning.",
      tag: "Live Simulators",
      color: "#10b981",
      icon: <Icons.Microphone size={20} color="#10b981" />,
      actionLabel: "Start Interview",
      actionTarget: "/interview"
    });
    return items;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f2ef' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
          <Icons.Loader size={45} color="#0a66c2" />
          <p style={{ color: '#5e5e5e', fontSize: '0.95rem', fontWeight: '500', fontFamily: 'system-ui' }}>Loading your feed...</p>
        </div>
      </div>
    );
  }

  if (!profile && !readiness) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f2ef' }}>
        <Navbar />
        <div style={{ maxWidth: '550px', margin: '4rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <Icons.Brain size={64} color="#0a66c2" />
            </div>
            <h1 style={{ color: '#191919', fontSize: '1.6rem', marginBottom: '0.75rem', fontWeight: '600' }}>
              Welcome to Crakd
            </h1>
            <p style={{ color: '#5e5e5e', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              Create your profile details to unlock personalized preparation milestones, mock interview simulators, and study planners.
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              style={{
                padding: '0.65rem 1.5rem',
                background: '#0a66c2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#004182'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0a66c2'}
            >
              <Icons.Zap size={18} color="white" />
              Complete Onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  const todoList = generateTodoItems();
  const profileInitials = profile?.name ? profile.name[0].toUpperCase() : 'U';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f2ef', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Navbar />
      
      <div style={{ maxWidth: '1128px', margin: '1.5rem auto', padding: '0 1.5rem', boxSizing: 'border-box' }}>
        
        {/* 3-Column LinkedIn Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(225px, 225px) 1fr minmax(300px, 300px)', gap: '1.5rem' }}>
          
          {/* Left Column: Profile Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              textAlign: 'center',
              boxSizing: 'border-box'
            }}>
              {/* Cover Banner */}
              <div style={{ 
                height: '56px', 
                background: 'linear-gradient(135deg, #a0b4c8 0%, #cbd5e1 100%)',
                width: '100%'
              }} />
              
              {/* Profile Avatar Overlap */}
              <div style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '50%', 
                background: '#0a66c2', 
                color: '#ffffff', 
                fontWeight: 'bold', 
                fontSize: '2rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '-36px auto 12px',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {profileInitials}
              </div>

              {/* User Bio */}
              <div style={{ padding: '0 12px 16px', borderBottom: '1px solid #eef3f8' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#191919', margin: '0 0 4px' }}>
                  {profile?.name || 'Candidate'}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#5e5e5e', margin: 0 }}>
                  {profile?.branch || 'Department'} Student
                </p>
              </div>

              {/* Profile Metrics */}
              <div style={{ padding: '12px', textAlign: 'left', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5e5e5e' }}>Academic CGPA</span>
                  <span style={{ fontWeight: '600', color: '#0a66c2' }}>{profile?.cgpa || 'N/A'} / 10</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5e5e5e' }}>DSA Competency</span>
                  <span style={{ fontWeight: '600', color: '#0a66c2' }}>{profile?.dsa_level || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#5e5e5e' }}>Target Profile</span>
                  <span style={{ fontWeight: '600', color: '#191919', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                    {profile?.target_role || 'Developer'}
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              <div style={{ borderTop: '1px solid #eef3f8', padding: '8px 12px' }}>
                <button 
                  onClick={() => navigate('/profile')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#5e5e5e',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    padding: '4px',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0a66c2'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#5e5e5e'}
                >
                  ⚙️ Update Profile
                </button>
              </div>
            </div>

            {/* Quick Links Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '12px',
              boxSizing: 'border-box'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#5e5e5e', margin: '0 0 8px' }}>Active Modules</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                <div style={sidebarLinkStyle} onClick={() => navigate('/interview')}>🎙️ Practice Simulator</div>
                <div style={sidebarLinkStyle} onClick={() => navigate('/resume')}>📄 Resume Guide</div>
                <div style={sidebarLinkStyle} onClick={() => navigate('/ProjectEvaluation')}>💻 Project Audits</div>
                <div style={sidebarLinkStyle} onClick={() => navigate('/mock-test')}>🏆 Subject Tests</div>
              </div>
            </div>
          </div>
          
          {/* Center Column: Feed (Launcher + Milestones) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            {/* Share Post Style agent launcher */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              padding: '12px 16px 8px',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {/* Initials Circle */}
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: '#f3f2ef', 
                  color: '#5e5e5e', 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid #cbd5e1'
                }}>
                  {profileInitials}
                </div>
                {/* Mock Input Button */}
                <div style={{ 
                  flex: 1, 
                  background: '#f3f2ef', 
                  borderRadius: '35px', 
                  border: '1px solid #cbd5e1', 
                  padding: '10px 16px', 
                  fontSize: '0.85rem', 
                  color: '#5e5e5e', 
                  fontWeight: '500',
                  textAlign: 'left'
                }}>
                  Which placement evaluator do you want to start?
                </div>
              </div>

              {/* Row of Agent Options */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <button 
                  onClick={() => navigate('/interview')}
                  style={launcherButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f2ef'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Icons.Microphone size={18} color="#00a0dc" />
                  <span style={{ fontSize: '0.8rem', color: '#5e5e5e', fontWeight: '600' }}>Interviews</span>
                </button>

                <button 
                  onClick={() => navigate('/resume')}
                  style={launcherButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f2ef'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Icons.FileText size={18} color="#7fc15c" />
                  <span style={{ fontSize: '0.8rem', color: '#5e5e5e', fontWeight: '600' }}>Resume Guide</span>
                </button>

                <button 
                  onClick={() => navigate('/ProjectEvaluation')}
                  style={launcherButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f2ef'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Icons.Brain size={18} color="#e7a33e" />
                  <span style={{ fontSize: '0.8rem', color: '#5e5e5e', fontWeight: '600' }}>Architect</span>
                </button>
              </div>
            </div>

            {/* Preparation Milestones / Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #cbd5e1' }} />
                <span style={{ fontSize: '0.75rem', color: '#5e5e5e', fontWeight: '600' }}>RECOMMENDED ROADMAP</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #cbd5e1' }} />
              </div>

              {/* Feed of items */}
              {todoList.map((item, idx) => (
                <div key={idx} style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '16px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Poster Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: `${item.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#191919' }}>
                        Crakd Assistant
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#5e5e5e' }}>
                        {item.tag} • Auto Advisory
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
                    <div style={{ fontWeight: '700', color: '#191919', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    <p style={{ color: '#5e5e5e', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>

                  {/* Post Action Footer */}
                  <div style={{ display: 'flex', borderTop: '1px solid #eef3f8', paddingTop: '10px' }}>
                    <button
                      onClick={() => navigate(item.actionTarget)}
                      style={{
                        padding: '6px 16px',
                        background: 'transparent',
                        color: '#0a66c2',
                        border: '1.5px solid #0a66c2',
                        borderRadius: '24px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#edf3f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: History Scans / Preparation Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            {/* Resume Logs Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '16px',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#191919', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.FileText size={16} color="#0a66c2" />
                Resume Scan History
              </h3>
              
              {resumeHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {resumeHistory.slice(0, 3).map((item, idx) => (
                    <div key={idx} style={historyItemStyle} onClick={() => navigate('/resume')}>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: '600', color: '#191919', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.file_name || 'Resume'}
                        </div>
                        <div style={{ color: '#5e5e5e', fontSize: '0.65rem' }}>
                          Role: {item.job_role || 'Developer'}
                        </div>
                      </div>
                      <div style={{ fontWeight: '700', color: '#0a66c2', fontSize: '0.9rem' }}>
                        {item.overall_score}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#5e5e5e', fontSize: '0.75rem', margin: 0, textAlign: 'center', padding: '12px 0' }}>
                  No resume logs present.
                </p>
              )}
            </div>

            {/* Project Logs Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '16px',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: '#191919', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Brain size={16} color="#0a66c2" />
                Project Audit History
              </h3>

              {projectHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {projectHistory.slice(0, 3).map((item, idx) => (
                    <div key={idx} style={historyItemStyle} onClick={() => navigate('/ProjectEvaluation')}>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: '600', color: '#191919', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.project_description || 'Project Audit'}
                        </div>
                        <div style={{ color: '#5e5e5e', fontSize: '0.65rem' }}>
                          Role: {item.target_role || 'Developer'}
                        </div>
                      </div>
                      <div style={{ fontWeight: '700', color: '#0a66c2', fontSize: '0.9rem' }}>
                        {item.evaluation_data?.score || 80}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#5e5e5e', fontSize: '0.75rem', margin: 0, textAlign: 'center', padding: '12px 0' }}>
                  No project audits present.
                </p>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

// Internal Style Tokens for LinkedIn layout
const sidebarLinkStyle = {
  padding: '6px 8px',
  borderRadius: '4px',
  color: '#5e5e5e',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  display: 'block'
};

const launcherButtonStyle = {
  background: 'transparent',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1,
  justifyContent: 'center',
  transition: 'background-color 0.2s'
};

const historyItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 10px',
  background: '#edf3f8',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  border: '1px solid transparent'
};

export default Dashboard;