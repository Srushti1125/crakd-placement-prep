import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentForm from './pages/StudentForm';
import Dashboard from './pages/Dashboard';
import ResumeAnalysis from './pages/ResumeAnalysis';
import MockInterview from './pages/MockInterview';
import ProjectEvaluation from './pages/ProjectEvaluation';
import AIOnboarding from './pages/AIOnboarding';       // ← NEW
import StudentProfile from './pages/StudentProfile';   // ← NEW
import ProtectedRoute from './components/ProtectedRoute';
import MockTestHome from './pages/MockTestHome';
import MockTestSession from './pages/MockTestSession';
import MockTestResults from './pages/MockTestResults';
import MockTestHistory from './pages/MockTestHistory';
import MockTestReview from './pages/MockTestReview';

const App = () => {
  return (
    <Router>
      <Routes>
        // Public
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        // Onboarding (protected but doesn't require onboarding to be complete)
        <Route path="/onboarding" element={
          <ProtectedRoute requireOnboarding={false}>
            <AIOnboarding />
          </ProtectedRoute>
        } />

        // Legacy manual form (still available via "prefer a form" link)
        <Route path="/form" element={
          <ProtectedRoute requireOnboarding={false}>
            <StudentForm />
          </ProtectedRoute>
        } />

        // Student Routes (all require onboarding)
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><StudentProfile /></ProtectedRoute>
        } />
        <Route path="/resume" element={
          <ProtectedRoute><ResumeAnalysis /></ProtectedRoute>
        } />
        <Route path="/interview" element={
          <ProtectedRoute><MockInterview /></ProtectedRoute>
        } />
        <Route path="/ProjectEvaluation" element={
          <ProtectedRoute><ProjectEvaluation /></ProtectedRoute>
        } />

        // Mock test 
        <Route path="/mock-test" element={<ProtectedRoute><MockTestHome /></ProtectedRoute>} />
        <Route path="/mock-test/session" element={<ProtectedRoute><MockTestSession /></ProtectedRoute>} />
        <Route path="/mock-test/results" element={<ProtectedRoute><MockTestResults /></ProtectedRoute>} />
        <Route path="/mock-test/history" element={<ProtectedRoute><MockTestHistory /></ProtectedRoute>} />
        <Route path="/mock-test/review/:id" element={<ProtectedRoute><MockTestReview /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;