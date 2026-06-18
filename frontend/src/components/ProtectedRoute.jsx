import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;

  // Check onboarding status
  if (requireOnboarding) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // If student hasn't completed onboarding, redirect to AI onboarding
      if (user.onboardingComplete === false) {
        const path = window.location.pathname;
        if (path !== '/onboarding' && path !== '/form') {
          return <Navigate to="/onboarding" replace />;
        }
      }
    } catch {}
  }

  return children;
};

export default ProtectedRoute;
