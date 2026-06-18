import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icons from './Icons';
import { authAPI, profileAPI } from '../utils/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    profileAPI.getProfile()
      .then(data => setProfile(data))
      .catch(() => null);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout(); 
      navigate('/login');
    } catch (err) {
      console.error("Logout failed", err);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  // Removed profile link from main nav list
  const navLinks = [
    { path: '/dashboard', label: 'Home', icon: 'Activity' },
    { path: '/ProjectEvaluation', label: 'Projects', icon: 'ChartBar' },
    { path: '/resume', label: 'Resume', icon: 'FileText' },
    { path: '/interview', label: 'Interviews', icon: 'Microphone' },
    { path: '/mock-test', label: 'Tests', icon: 'Award' }, 
  ];

  const NavButton = ({ link }) => {
    const IconComponent = Icons[link.icon] || Icons.Award;
    const isActive = location.pathname === link.path;

    return (
      <button
        onClick={() => {
          navigate(link.path);
          setMenuOpen(false);
          setDropdownOpen(false);
        }}
        style={{
          background: 'transparent',
          color: isActive ? '#191919' : '#5e5e5e',
          border: 'none',
          borderBottom: isActive ? '2px solid #191919' : '2px solid transparent',
          padding: isMobile ? '0.75rem 1rem' : '0.4rem 0',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '0.75rem',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: 'center',
          gap: '0.35rem',
          width: isMobile ? '100%' : '80px',
          justifyContent: isMobile ? 'flex-start' : 'center',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = '#191919';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = '#5e5e5e';
          }
        }}
      >
        <IconComponent size={22} color={isActive ? '#191919' : '#5e5e5e'} />
        <span>{link.label}</span>
      </button>
    );
  };

  return (
    <nav
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #eef3f8',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxSizing: 'border-box',
        height: '52px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Click outside overlay to close dropdown */}
      {dropdownOpen && (
        <div 
          onClick={() => setDropdownOpen(false)} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            background: 'transparent'
          }}
        />
      )}

      <div
        style={{
          width: '100%',
          maxWidth: '1128px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Left branding and mock search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <div
            style={{
              color: '#0a66c2',
              fontSize: '1.4rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Icons.CrakdLogo size={32} />
            {!isMobile && <span style={{ color: '#0a66c2', fontWeight: '800', fontSize: '1.45rem', marginLeft: '6px' }}>Crakd</span>}
          </div>
        </div>

        {/* Navigation Items & Profile Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Desktop links */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
              {navLinks.map((link) => (
                <NavButton key={link.path} link={link} />
              ))}
              
              {/* Divider */}
              <div style={{ width: '1px', height: '32px', background: '#eef3f8', margin: '0 0.5rem' }} />

              {/* Me Dropdown Button container */}
              <div style={{ position: 'relative', zIndex: 1000 }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    background: 'transparent',
                    color: '#5e5e5e',
                    border: 'none',
                    padding: '0.4rem 0',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    width: '80px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#0a66c2',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    overflow: 'hidden'
                  }}>
                    {profile?.name ? profile.name[0].toUpperCase() : 'U'}
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Me ▼
                  </span>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: 0,
                    width: '140px',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.5rem 0',
                    boxSizing: 'border-box',
                    zIndex: 1001
                  }}>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setDropdownOpen(false);
                      }}
                      style={dropdownItemStyle}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#edf3f8'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      My Profile
                    </button>
                    <div style={{ height: '1px', background: '#eef3f8', margin: '0.25rem 0' }} />
                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      style={{ ...dropdownItemStyle, color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#5e5e5e',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              ☰
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '52px',
            left: 0,
            width: '100%',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxSizing: 'border-box',
            borderTop: '1px solid #eef3f8'
          }}
        >
          {navLinks.map((link) => (
            <NavButton key={link.path} link={link} />
          ))}
          <div style={{ height: '1px', background: '#eef3f8', margin: '0.5rem 0' }} />
          <button
            onClick={() => {
              navigate('/profile');
              setMenuOpen(false);
            }}
            style={{
              background: '#ffffff',
              color: '#0a66c2',
              border: '1px solid #0a66c2',
              padding: '0.6rem',
              borderRadius: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              fontSize: '0.85rem',
              marginBottom: '0.25rem'
            }}
          >
            My Profile
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#f3f2ef',
              color: '#5e5e5e',
              border: '1px solid #cbd5e1',
              padding: '0.6rem',
              borderRadius: '24px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              fontSize: '0.85rem'
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};

const dropdownItemStyle = {
  background: 'transparent',
  border: 'none',
  padding: '0.5rem 1rem',
  textAlign: 'left',
  width: '100%',
  cursor: 'pointer',
  fontSize: '0.8rem',
  color: '#5e5e5e',
  fontWeight: '600',
  fontFamily: 'inherit',
  transition: 'background-color 0.2s'
};

export default Navbar;