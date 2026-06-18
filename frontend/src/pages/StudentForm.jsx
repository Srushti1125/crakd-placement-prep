import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { studentAPI } from '../utils/api';
import Icons from '../components/Icons';

const StudentForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    cgpa: '',
    skills: '',
    projectsCount: '',
    internshipsCount: '',
    dsaLevel: 'Beginner',
    communication: '5'
  });
  const [skillTags, setSkillTags] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Popular skills suggestions
  const popularSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML/CSS',
    'MongoDB', 'SQL', 'Git', 'AWS', 'Docker', 'TypeScript',
    'Angular', 'Vue.js', 'Django', 'Flask', 'Spring Boot', 'C++'
  ];

  const addSkill = (skill) => {
    if (skill && !skillTags.includes(skill)) {
      setSkillTags([...skillTags, skill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillTags(skillTags.filter(skill => skill !== skillToRemove));
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput.trim());
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.cgpa) newErrors.cgpa = 'CGPA is required';
      else if (formData.cgpa < 0 || formData.cgpa > 10) newErrors.cgpa = 'CGPA must be between 0 and 10';
      
      if (skillTags.length === 0) newErrors.skills = 'Add at least one skill';
    }
    
    if (step === 2) {
      if (!formData.projectsCount) newErrors.projectsCount = 'Number of projects is required';
      if (!formData.internshipsCount) newErrors.internshipsCount = 'Number of internships is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      const data = {
        ...formData,
        skills: skillTags
      };
      
      await studentAPI.saveData(data);
      navigate('/dashboard');
    } catch (error) {
      alert('Failed to save data. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (step) => {
    const IconComponent = step === 1 ? Icons.BookOpen : step === 2 ? Icons.Briefcase : Icons.Target;
    return <IconComponent size={48} color="#1070b9" />;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* <Navbar /> */}
      
      <div style={{
        maxWidth: '800px',
        margin: '5rem auto',
        padding: '4rem'
      }}>
        {/* Progress Header */}
        <div style={{
          background: 'white',
          borderRadius: '20px 20px 0 0',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h2 style={{
                background: 'linear-gradient(135deg, #1070b9  0%, #054196 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '2rem',
                margin: 0,
                fontWeight: 'bold'
              }}>
                Build Your Profile
              </h2>
              <p style={{ color: '#666', margin: '0.5rem 0 0', fontSize: '1rem' }}>
                Step {currentStep} of {totalSteps}
              </p>
            </div>
            <div style={{
              animation: 'bounce 2s infinite'
            }}>
              {getStepIcon(currentStep)}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            height: '8px',
            background: '#e0e7ff',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(135deg, #1070b9  0%, #054196 100%)',
              transition: 'width 0.5s ease',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '20px',
                height: '100%',
                background: 'rgba(255,255,255,0.3)',
                animation: 'shimmer 1.5s infinite'
              }}></div>
            </div>
          </div>

          {/* Step Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1.5rem'
          }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: currentStep >= step 
                    ? 'linear-gradient(135deg, #1070b9  0%, #054196 100%)'
                    : '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: currentStep >= step ? 'white' : '#1070b9',
                  transition: 'all 0.3s ease',
                  transform: currentStep === step ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: currentStep === step ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
                }}>
                  {currentStep > step ? <Icons.CheckCircle size={24} color="white" /> : step}
                </div>
                <span style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  color: currentStep >= step ? '#1070b9' : '#999',
                  fontWeight: currentStep === step ? 'bold' : 'normal',
                  textAlign: 'center'
                }}>
                  {step === 1 ? 'Academics' : step === 2 ? 'Experience' : 'Skills'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div style={{
          background: 'white',
          borderRadius: '0 0 20px 20px',
          padding: '2.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          minHeight: '400px'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Academic Details */}
            {currentStep === 1 && (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <h3 style={{
                  color: '#333',
                  fontSize: '1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Icons.BookOpen size={28} color="#333" />
                  Academic Performance
                </h3>

                {/* CGPA Input */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '1rem'
                  }}>
                    CGPA (out of 10) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      placeholder="Enter your CGPA"
                      style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3.5rem',
                        border: errors.cgpa ? '2px solid #ef4444' : '2px solid #e0e7ff',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease',
                        background: '#fafbff'
                      }}
                      onFocus={(e) => {
                        if (!errors.cgpa) e.target.style.borderColor = '#1070b9';
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.cgpa ? '#ef4444' : '#e0e7ff';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}>
                      <Icons.Award size={24} color="#1070b9" />
                    </span>
                  </div>
                  {errors.cgpa && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                      {errors.cgpa}
                    </p>
                  )}
                  {formData.cgpa && !errors.cgpa && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: formData.cgpa >= 8 
                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                        : formData.cgpa >= 6
                        ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                        : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      borderRadius: '10px',
                      border: `2px solid ${formData.cgpa >= 8 ? '#10b981' : formData.cgpa >= 6 ? '#f59e0b' : '#ef4444'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {formData.cgpa >= 8 ? (
                        <Icons.CheckCircle size={20} color="#065f46" />
                      ) : formData.cgpa >= 6 ? (
                        <Icons.AlertCircle size={20} color="#92400e" />
                      ) : (
                        <Icons.TrendingUp size={20} color="#991b1b" />
                      )}
                      <p style={{
                        margin: 0,
                        color: formData.cgpa >= 8 ? '#065f46' : formData.cgpa >= 6 ? '#92400e' : '#991b1b',
                        fontWeight: '600'
                      }}>
                        {formData.cgpa >= 8 
                          ? 'Excellent! Your CGPA shows strong academic performance.'
                          : formData.cgpa >= 6
                          ? 'Good! Keep working on improving your grades.'
                          : 'Consider focusing on academic improvement for better opportunities.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Skills Input */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '1rem'
                  }}>
                    Technical Skills *
                  </label>
                  
                  {/* Skill Tags Display */}
                  {skillTags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: '#f0f9ff',
                      borderRadius: '12px',
                      border: '2px dashed #0ea5e9'
                    }}>
                      {skillTags.map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'linear-gradient(135deg, #1070b9  0%, #054196 100%)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            animation: 'slideIn 0.3s ease'
                          }}
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            style={{
                              background: 'rgba(255,255,255,0.3)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              color: 'white'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Skill Input Field */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={handleSkillKeyPress}
                      placeholder="Type a skill and press Enter"
                      style={{
                        width: '100%',
                        padding: '1rem 3.5rem 1rem 3.5rem',
                        border: errors.skills ? '2px solid #ef4444' : '2px solid #e0e7ff',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease',
                        background: '#fafbff'
                      }}
                      onFocus={(e) => {
                        if (!errors.skills) e.target.style.borderColor = '#1070b9';
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.skills ? '#ef4444' : '#e0e7ff';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}>
                      <Icons.Code size={24} color="#1070b9" />
                    </span>
                    <button
                      type="button"
                      onClick={() => addSkill(skillInput)}
                      disabled={!skillInput.trim()}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: skillInput.trim() 
                          ? 'linear-gradient(135deg, #1070b9  0%, #054196 100%)'
                          : '#e0e7ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        cursor: skillInput.trim() ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {errors.skills && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                      {errors.skills}
                    </p>
                  )}

                  {/* Popular Skills Suggestions */}
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Lightbulb size={18} color="#666" />
                      Popular skills:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {popularSkills
                        .filter(skill => !skillTags.includes(skill))
                        .slice(0, 8)
                        .map((skill, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => addSkill(skill)}
                            style={{
                              background: 'white',
                              border: '2px solid #e0e7ff',
                              borderRadius: '20px',
                              padding: '0.4rem 1rem',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              color: '#667eea',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#f0f9ff';
                              e.target.style.borderColor = '#1070b9';
                              e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'white';
                              e.target.style.borderColor = '#e0e7ff';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            + {skill}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Experience */}
            {currentStep === 2 && (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <h3 style={{
                  color: '#333',
                  fontSize: '1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Icons.Briefcase size={28} color="#333" />
                  Experience & Projects
                </h3>

                {/* Projects Count */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '1rem'
                  }}>
                    Number of Projects *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      value={formData.projectsCount}
                      onChange={(e) => setFormData({ ...formData, projectsCount: e.target.value })}
                      placeholder="How many projects have you completed?"
                      style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3.5rem',
                        border: errors.projectsCount ? '2px solid #ef4444' : '2px solid #e0e7ff',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease',
                        background: '#fafbff'
                      }}
                      onFocus={(e) => {
                        if (!errors.projectsCount) e.target.style.borderColor = '#667eea';
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.projectsCount ? '#ef4444' : '#e0e7ff';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}>
                      <Icons.Code size={24} color="#1070b9" />
                    </span>
                  </div>
                  {errors.projectsCount && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                      {errors.projectsCount}
                    </p>
                  )}
                  {formData.projectsCount && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: '#f0f9ff',
                      borderRadius: '10px',
                      border: '2px solid #0ea5e9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Icons.Lightbulb size={20} color="#0369a1" />
                      <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
                        {formData.projectsCount >= 5 
                          ? 'Impressive! Multiple projects show strong practical experience.'
                          : formData.projectsCount >= 3
                          ? 'Good! Keep building more projects to strengthen your portfolio.'
                          : 'Tip: Work on more projects to enhance your practical skills.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Internships Count */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '1rem'
                  }}>
                    Number of Internships *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      value={formData.internshipsCount}
                      onChange={(e) => setFormData({ ...formData, internshipsCount: e.target.value })}
                      placeholder="How many internships have you done?"
                      style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3.5rem',
                        border: errors.internshipsCount ? '2px solid #ef4444' : '2px solid #e0e7ff',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease',
                        background: '#fafbff'
                      }}
                      onFocus={(e) => {
                        if (!errors.internshipsCount) e.target.style.borderColor = '#1070b9';
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.internshipsCount ? '#ef4444' : '#e0e7ff';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}>
                      <Icons.Briefcase size={24} color="#1070b9" />
                    </span>
                  </div>
                  {errors.internshipsCount && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                      {errors.internshipsCount}
                    </p>
                  )}
                  {formData.internshipsCount && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: '#f0fdf4',
                      borderRadius: '10px',
                      border: '2px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Icons.CheckCircle size={20} color="#065f46" />
                      <p style={{ margin: 0, color: '#065f46', fontSize: '0.9rem' }}>
                        {formData.internshipsCount >= 2 
                          ? 'Excellent! Multiple internships provide valuable industry exposure.'
                          : formData.internshipsCount >= 1
                          ? 'Great start! Consider applying for more internships.'
                          : 'Try to gain internship experience for better job prospects.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Skills Assessment */}
            {currentStep === 3 && (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <h3 style={{
                  color: '#333',
                  fontSize: '1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Icons.Target size={28} color="#333" />
                  Skills Assessment
                </h3>

                {/* DSA Level */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '1rem'
                  }}>
                    Data Structures & Algorithms Level
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginTop: '1rem'
                  }}>
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, dsaLevel: level })}
                        style={{
                          padding: '1.5rem',
                          border: formData.dsaLevel === level 
                            ? '3px solid #1070b9'
                            : '2px solid #e0e7ff',
                          borderRadius: '12px',
                          background: formData.dsaLevel === level 
                            ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
                            : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.dsaLevel !== level) {
                            e.target.style.borderColor = '#1070b9';
                            e.target.style.transform = 'translateY(-5px)';
                            e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.dsaLevel !== level) {
                            e.target.style.borderColor = '#e0e7ff';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                      >
                        <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                          {level === 'Beginner' ? (
                            <Icons.Activity size={32} color={formData.dsaLevel === level ? '#1070b9' : '#999'} />
                          ) : level === 'Intermediate' ? (
                            <Icons.TrendingUp size={32} color={formData.dsaLevel === level ? '#1070b9' : '#999'} />
                          ) : (
                            <Icons.Award size={32} color={formData.dsaLevel === level ? '#1070b9' : '#999'} />
                          )}
                        </div>
                        <div style={{
                          fontWeight: 'bold',
                          color: formData.dsaLevel === level ? '#1070b9' : '#333',
                          fontSize: '1rem'
                        }}>
                          {level}
                        </div>
                        {formData.dsaLevel === level && (
                          <div style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            justifyContent: 'center'
                          }}>
                            <Icons.CheckCircle size={20} color="#1070b9" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Communication Skills Slider */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '1rem'
                  }}>
                    <span>Communication Skills</span>
                    <span style={{
                      background: 'linear-gradient(135deg, #1070b9  0%, #054196 100%)',
                      color: 'white',
                      padding: '0.25rem 1rem',
                      borderRadius: '20px',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {formData.communication}/10
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.communication}
                    onChange={(e) => setFormData({ ...formData, communication: e.target.value })}
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '10px',
                      outline: 'none',
                      background: `linear-gradient(to right, #1070b9 0%, #1070b9 ${(formData.communication / 10) * 100}%, #e0e7ff ${(formData.communication / 10) * 100}%, #e0e7ff 100%)`,
                      WebkitAppearance: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#666'
                  }}>
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                  
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: formData.communication >= 8 
                      ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                      : formData.communication >= 5
                      ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                      : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    borderRadius: '10px',
                    border: `2px solid ${formData.communication >= 8 ? '#10b981' : formData.communication >= 5 ? '#f59e0b' : '#ef4444'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {formData.communication >= 8 ? (
                      <Icons.Award size={20} color="#065f46" />
                    ) : formData.communication >= 5 ? (
                      <Icons.CheckCircle size={20} color="#92400e" />
                    ) : (
                      <Icons.TrendingUp size={20} color="#991b1b" />
                    )}
                    <p style={{
                      margin: 0,
                      color: formData.communication >= 8 ? '#065f46' : formData.communication >= 5 ? '#92400e' : '#991b1b',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}>
                      {formData.communication >= 8 
                        ? 'Excellent! Strong communication is key for career success.'
                        : formData.communication >= 5
                        ? 'Good! Keep practicing to enhance your communication.'
                        : 'Work on improving your communication skills through practice.'}
                    </p>
                  </div>
                </div>

                {/* Profile Summary */}
                <div style={{
                  marginTop: '2rem',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '16px',
                  border: '2px solid #0ea5e9'
                }}>
                  <h4 style={{
                    margin: '0 0 1rem 0',
                    color: '#0369a1',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Icons.FileText size={24} color="#0369a1" />
                    Profile Summary
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Award size={20} color="#0369a1" />
                      <span style={{ color: '#0369a1', fontSize: '0.95rem' }}>
                        CGPA: <strong>{formData.cgpa || 'Not set'}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Code size={20} color="#0369a1" />
                      <span style={{ color: '#0369a1', fontSize: '0.95rem' }}>
                        Skills: <strong>{skillTags.length}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.FileText size={20} color="#0369a1" />
                      <span style={{ color: '#0369a1', fontSize: '0.95rem' }}>
                        Projects: <strong>{formData.projectsCount || '0'}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Briefcase size={20} color="#0369a1" />
                      <span style={{ color: '#0369a1', fontSize: '0.95rem' }}>
                        Internships: <strong>{formData.internshipsCount || '0'}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Brain size={20} color="#0369a1" />
                      <span style={{ color: '#0369a1', fontSize: '0.95rem' }}>
                        DSA: <strong>{formData.dsaLevel}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.Users size={20} color="#0369a1" />
                      <span style={{ color: '#0369a1', fontSize: '0.95rem' }}>
                        Communication: <strong>{formData.communication}/10</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '2.5rem',
              gap: '1rem'
            }}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    padding: '1rem 2rem',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #1070b9',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f0f9ff';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  ← Previous
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #1070b9  0%, #054196 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flex: currentStep === 1 ? 1 : 1,
                    marginLeft: currentStep === 1 ? '0' : 'auto',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '1rem 2rem',
                    background: isSubmitting 
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    flex: 1,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Icons.Loader size={20} color="white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Icons.CheckCircle size={20} color="white" />
                      Submit & View Analysis
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1070b9  0%, #054196 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1070b9  0%, #054196 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
        }
      `}</style>
    </div>
  );
};

export default StudentForm;