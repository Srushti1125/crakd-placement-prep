import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import styles from './Login.module.css';

const BrandLogo = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    {/* Tassel */}
    <path d="M140 185 L108 235 L108 275 L116 275 L116 235 Z" fill="#ffb300" />
    <circle cx="112" cy="280" r="8" fill="#ffb300" />

    {/* Skullcap */}
    <path d="M160 220 L160 270 C160 310, 352 310, 352 270 L352 220" fill="#ffffff" stroke="#e2e8f0" strokeWidth="6" />
    
    {/* Top Diamond */}
    <path d="M256 120 L440 185 L256 250 L72 185 Z" fill="#1664ec" />
    
    {/* Lightning Bolt */}
    <path d="M290 200 L210 310 L270 310 L195 425 L330 280 L270 280 Z" fill="url(#bolt_grad)" stroke="#ffffff" strokeWidth="12" strokeLinejoin="round" />

    <defs>
      <linearGradient id="bolt_grad" x1="195" y1="200" x2="330" y2="425" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffe000" />
        <stop offset="1" stopColor="#ff9100" />
      </linearGradient>
    </defs>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.login(formData.email, formData.password);
      if (!data.user.onboardingComplete) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background blobs for premium presentation */}
      <div className={styles.blobLeft} />
      <div className={styles.blobRight} />

      <div className={styles.wrapper}>
        {/* Logo and Brand Header */}
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <BrandLogo size={56} />
            <span className={styles.brandText}>Crakd</span>
          </div>
          <p className={styles.subtitle}>Crack OAs. Crack Interviews. Get Offers</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* Form panel */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email group */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <div className={styles.inputContainer}>
              <MailIcon />
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className={styles.input}
              />
            </div>
          </div>

          {/* Password group */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputContainer}>
              <LockIcon />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                className={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div className={styles.forgotPassContainer}>
            <Link to="#" className={styles.forgotPassLink}>
              Forgot Password?
            </Link>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className={styles.btn}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Signup Redirect */}
        <p className={styles.signupText}>
          Don't have an account?{' '}
          <Link to="/signup" className={styles.signupLink}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;