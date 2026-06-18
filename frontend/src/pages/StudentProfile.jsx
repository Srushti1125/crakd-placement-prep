// frontend/src/pages/StudentProfile.jsx  — NEW FILE
// LinkedIn-style persistent profile page

import { useState, useEffect } from 'react';
import { profileAPI, authAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Icons from '../components/Icons';

const SKILLS_SUGGESTIONS = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript',
  'C++', 'SQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'DSA',
  'Spring Boot', 'Django', 'Flutter', 'Machine Learning', 'System Design'
];

const DSA_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const ProfileSection = ({ title, icon, children, editable, onEdit }) => (
  <div style={{
    background: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#191919', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{icon}</span> {title}
      </h3>
      {editable && (
        <button onClick={onEdit} style={{
          background: 'none', border: '1px solid #0a66c2', borderRadius: '24px',
          padding: '0.3rem 1.25rem', cursor: 'pointer', color: '#0a66c2',
          fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#edf3f8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        >Edit</button>
      )}
    </div>
    {children}
  </div>
);

const StatBadge = ({ label, value, color = '#0a66c2' }) => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    textAlign: 'center',
    minWidth: '100px',
    flex: 1
  }}>
    <div style={{ fontSize: '1.4rem', fontWeight: '800', color }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: '#5e5e5e', marginTop: '0.25rem' }}>{label}</div>
  </div>
);

const CompletionBar = ({ percent }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Profile Completion</span>
      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: percent >= 80 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#ef4444' }}>{percent}%</span>
    </div>
    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${percent}%`,
        background: percent >= 80 ? 'linear-gradient(90deg, #10b981, #059669)'
          : percent >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)'
          : 'linear-gradient(90deg, #ef4444, #dc2626)',
        borderRadius: '10px',
        transition: 'width 0.8s ease'
      }} />
    </div>
    {percent < 100 && (
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
        {percent < 50 ? 'Fill in more sections to improve your chances'
          : percent < 80 ? 'Almost there! Add remaining details'
          : 'Great profile! Consider adding certifications or work experience'}
      </p>
    )}
  </div>
);

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(null); // which section is being edited
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [message, setMessage] = useState(null);
  const user = authAPI.getUser();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileAPI.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const startEdit = (section) => {
    setEditing(section);
    setEditData({ ...profile });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditData({});
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      // Map fields to what API expects
      const payload = {};
      if (editing === 'academic') {
        payload.cgpa = editData.cgpa;
        payload.branch = editData.branch;
        payload.graduation_year = editData.graduation_year;
        payload.college_name = editData.college_name;
      } else if (editing === 'skills') {
        payload.skills = editData.skills;
        payload.dsa_level = editData.dsa_level;
        payload.communication_score = editData.communication_score;
      } else if (editing === 'experience') {
        payload.projects_count = editData.projects_count;
        payload.internships_count = editData.internships_count;
        payload.target_role = editData.target_role;
        payload.target_company = editData.target_company;
      }

      await profileAPI.updateProfile(payload);
      await loadProfile();
      setEditing(null);
      setMessage({ type: 'success', text: 'Saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !(editData.skills || []).includes(trimmed)) {
      setEditData(prev => ({ ...prev, skills: [...(prev.skills || []), trimmed] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setEditData(prev => ({ ...prev, skills: (prev.skills || []).filter(s => s !== skill) }));
  };

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f2ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#5e5e5e', fontFamily: 'system-ui' }}>
          <Icons.Loader size={40} color="#0a66c2" />
          <p style={{ marginTop: '0.5rem' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    border: '2px solid #e2e8f0', borderRadius: '10px',
    fontSize: '0.95rem', boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit',
    background: 'white', color: '#1e293b'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef' }}>
      <Navbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Toast Notification */}
        {message && (
          <div style={{
            position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000,
            padding: '1rem 1.5rem',
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#dc2626',
            borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            fontWeight: '600', fontSize: '0.9rem',
            animation: 'fadeInUp 0.3s ease'
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Profile Header Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          padding: '2rem',
          color: '#191919',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* LinkedIn Cover Photo simulation */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '100px',
            background: 'linear-gradient(135deg, #a0b4c8 0%, #cbd5e1 100%)',
            zIndex: 1
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 2, marginTop: '40px' }}>
            {/* Avatar */}
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: '#0a66c2',
              color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: '800', border: '4px solid #ffffff',
              flexShrink: 0,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {(profile.name || user?.name || 'U')[0].toUpperCase()}
            </div>

            <div style={{ flex: 1, marginTop: '20px' }}>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '700', color: '#191919' }}>
                {profile.name || user?.name}
              </h1>
              <p style={{ margin: '0 0 0.5rem', color: '#5e5e5e', fontSize: '0.9rem' }}>
                {profile.branch || 'Branch not set'} Student • {profile.college_name || 'College not set'}
                {profile.graduation_year && ` • Class of ${profile.graduation_year}`}
              </p>
              {profile.target_role && (
                <span style={{
                  background: '#edf3f8', borderRadius: '20px',
                  color: '#0a66c2',
                  border: '1.5px solid #0a66c2',
                  padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '600'
                }}>
                  🎯 Targeting: {profile.target_role}
                </span>
              )}
            </div>
          </div>

          {/* Completion Bar */}
          <div style={{ marginTop: '1.5rem', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#5e5e5e' }}>Profile Completion</span>
              <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0a66c2' }}>{profile.profile_completion || 0}%</span>
            </div>
            <div style={{ height: '8px', background: '#eef3f8', borderRadius: '10px' }}>
              <div style={{
                height: '100%',
                width: `${profile.profile_completion || 0}%`,
                background: '#0a66c2',
                borderRadius: '10px', transition: 'width 1s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
          marginBottom: '1rem'
        }}>
          <StatBadge label="CGPA" value={profile.cgpa || '—'} color="#0a66c2" />
          <StatBadge label="Projects" value={profile.projects_count || 0} color="#0a66c2" />
          <StatBadge label="Internships" value={profile.internships_count || 0} color="#0a66c2" />
          <StatBadge label="Skills" value={(profile.skills || []).length} color="#0a66c2" />
          <StatBadge label="DSA Level" value={profile.dsa_level || 'N/A'} color="#0a66c2" />
        </div>

        {/* ── Academic Section ── */}
        <ProfileSection title="Academic Details" icon="🎓" editable={editing !== 'academic'} onEdit={() => startEdit('academic')}>
          {editing === 'academic' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>CGPA (out of 10)</label>
                  <input type="number" step="0.01" min="0" max="10" value={editData.cgpa || ''} onChange={e => setEditData(p => ({...p, cgpa: e.target.value}))} style={inputStyle} placeholder="e.g. 8.5" />
                </div>
                <div>
                  <label style={labelStyle}>Branch / Department</label>
                  <input type="text" value={editData.branch || ''} onChange={e => setEditData(p => ({...p, branch: e.target.value}))} style={inputStyle} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <label style={labelStyle}>College Name</label>
                  <input type="text" value={editData.college_name || ''} onChange={e => setEditData(p => ({...p, college_name: e.target.value}))} style={inputStyle} placeholder="e.g. VJTI Mumbai" />
                </div>
                <div>
                  <label style={labelStyle}>Graduation Year</label>
                  <input type="number" value={editData.graduation_year || ''} onChange={e => setEditData(p => ({...p, graduation_year: e.target.value}))} style={inputStyle} placeholder="e.g. 2026" />
                </div>
              </div>
              <EditButtons onSave={saveSection} onCancel={cancelEdit} saving={saving} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'CGPA', value: profile.cgpa || 'Not set' },
                { label: 'Branch', value: profile.branch || 'Not set' },
                { label: 'College', value: profile.college_name || 'Not set' },
                { label: 'Graduation Year', value: profile.graduation_year || 'Not set' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginTop: '0.25rem' }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </ProfileSection>

        {/* ── Skills Section ── */}
        <ProfileSection title="Skills & Proficiency" icon="💡" editable={editing !== 'skills'} onEdit={() => startEdit('skills')}>
          {editing === 'skills' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Current Skills */}
              <div>
                <label style={labelStyle}>Your Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {(editData.skills || []).map(skill => (
                    <span key={skill} style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {skill}
                      <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontWeight: '800', fontSize: '1rem', lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }} style={{ ...inputStyle, flex: 1 }} placeholder="Type skill and press Enter" />
                  <button onClick={() => addSkill(skillInput)} style={{ padding: '0.75rem 1rem', background: '#1070b9', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {SKILLS_SUGGESTIONS.filter(s => !(editData.skills || []).includes(s)).slice(0, 8).map(s => (
                    <button key={s} onClick={() => addSkill(s)} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '0.25rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', color: '#64748b' }}>+ {s}</button>
                  ))}
                </div>
              </div>

              {/* DSA Level */}
              <div>
                <label style={labelStyle}>DSA Level</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {DSA_LEVELS.map(level => (
                    <button key={level} onClick={() => setEditData(p => ({...p, dsa_level: level}))} style={{
                      flex: 1, padding: '0.75rem', border: `2px solid ${editData.dsa_level === level ? '#1070b9' : '#e2e8f0'}`,
                      borderRadius: '10px', background: editData.dsa_level === level ? '#eff6ff' : 'white',
                      color: editData.dsa_level === level ? '#1070b9' : '#64748b',
                      cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem'
                    }}>{level}</button>
                  ))}
                </div>
              </div>

              {/* Communication */}
              <div>
                <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                  Communication Score
                  <span style={{ color: '#1070b9', fontWeight: '700' }}>{editData.communication_score || 5}/10</span>
                </label>
                <input type="range" min="1" max="10" value={editData.communication_score || 5} onChange={e => setEditData(p => ({...p, communication_score: parseInt(e.target.value)}))} style={{ width: '100%', accentColor: '#1070b9' }} />
              </div>

              <EditButtons onSave={saveSection} onCancel={cancelEdit} saving={saving} />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {(profile.skills || []).length > 0
                  ? (profile.skills || []).map(skill => (
                      <span key={skill} style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '600' }}>{skill}</span>
                    ))
                  : <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No skills added yet</span>
                }
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>DSA Level</span>
                  <div style={{ fontWeight: '700', color: '#1e293b', marginTop: '0.15rem' }}>{profile.dsa_level || 'Not set'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Communication</span>
                  <div style={{ fontWeight: '700', color: '#1e293b', marginTop: '0.15rem' }}>{profile.communication_score || 5}/10</div>
                </div>
              </div>
            </div>
          )}
        </ProfileSection>

        {/* ── Experience Section ── */}
        <ProfileSection title="Experience & Goals" icon="💼" editable={editing !== 'experience'} onEdit={() => startEdit('experience')}>
          {editing === 'experience' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Number of Projects</label>
                  <input type="number" min="0" value={editData.projects_count || ''} onChange={e => setEditData(p => ({...p, projects_count: parseInt(e.target.value)}))} style={inputStyle} placeholder="e.g. 5" />
                </div>
                <div>
                  <label style={labelStyle}>Number of Internships</label>
                  <input type="number" min="0" value={editData.internships_count || ''} onChange={e => setEditData(p => ({...p, internships_count: parseInt(e.target.value)}))} style={inputStyle} placeholder="e.g. 2" />
                </div>
                <div>
                  <label style={labelStyle}>Target Role</label>
                  <input type="text" value={editData.target_role || ''} onChange={e => setEditData(p => ({...p, target_role: e.target.value}))} style={inputStyle} placeholder="e.g. Software Developer" />
                </div>
                <div>
                  <label style={labelStyle}>Target Company (optional)</label>
                  <input type="text" value={editData.target_company || ''} onChange={e => setEditData(p => ({...p, target_company: e.target.value}))} style={inputStyle} placeholder="e.g. Google, TCS, etc." />
                </div>
              </div>
              <EditButtons onSave={saveSection} onCancel={cancelEdit} saving={saving} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Projects Completed', value: profile.projects_count ?? 'Not set' },
                { label: 'Internships Done', value: profile.internships_count ?? 'Not set' },
                { label: 'Target Role', value: profile.target_role || 'Not set' },
                { label: 'Target Company', value: profile.target_company || 'Not set' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.75rem', color: '#5e5e5e', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: '600', color: '#191919', marginTop: '0.25rem' }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </ProfileSection>

        {/* Onboarding Info Badge */}
        {profile.onboarding_method && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Profile created via {profile.onboarding_method === 'ai_chat' ? '🤖 AI Chat Onboarding' : '📝 Manual Form'}
            {' • '}Last updated {new Date(profile.updated_at).toLocaleDateString()}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const labelStyle = {
  display: 'block', marginBottom: '0.4rem',
  fontSize: '0.85rem', fontWeight: '600', color: '#475569'
};

const EditButtons = ({ onSave, onCancel, saving }) => (
  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
    <button onClick={onCancel} style={{
      padding: '0.5rem 1.25rem', background: 'white', border: '1px solid #5e5e5e',
      borderRadius: '24px', cursor: 'pointer', fontWeight: '600', color: '#5e5e5e', fontSize: '0.9rem'
    }}>Cancel</button>
    <button onClick={onSave} disabled={saving} style={{
      padding: '0.5rem 1.25rem',
      background: saving ? '#cbd5e1' : '#0a66c2',
      border: 'none', borderRadius: '24px', cursor: saving ? 'not-allowed' : 'pointer',
      fontWeight: '700', color: 'white', fontSize: '0.9rem'
    }}>{saving ? 'Saving...' : 'Save Changes'}</button>
  </div>
);

export default StudentProfile;
