// frontend/src/utils/api.js  — FULL REPLACEMENT
// Handles JWT access tokens, automatic refresh on 403, and all API calls

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Token Helpers ────────────────────────────────────────────────────────────
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (access, refresh) => {
  localStorage.setItem('accessToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// ─── Core Fetch with Auto-Refresh ─────────────────────────────────────────────
async function apiFetch(path, options = {}, retry = true) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Access token expired — try to refresh
  if (res.status === 403 && retry) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) { clearTokens(); window.location.href = '/login'; return; }

    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const { accessToken } = await refreshRes.json();
      setTokens(accessToken, null);
      // Retry original request with new token
      return apiFetch(path, options, false);
    } else {
      clearTokens();
      window.location.href = '/login';
      return;
    }
  }

  return res;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: async (data) => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Signup failed');
    setTokens(json.accessToken, json.refreshToken);
    localStorage.setItem('user', JSON.stringify(json.user));
    return json;
  },

  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    setTokens(json.accessToken, json.refreshToken);
    localStorage.setItem('user', JSON.stringify(json.user));
    return json;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
    clearTokens();
    window.location.href = '/login';
  },

  getUser: () => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  },

  isLoggedIn: () => !!getAccessToken(),
};

// ─── Onboarding API ───────────────────────────────────────────────────────────
export const onboardingAPI = {
  getStatus: async () => {
    const res = await apiFetch('/api/onboarding/status');
    return res.json();
  },

  chat: async (message) => {
    const res = await apiFetch('/api/onboarding/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Chat failed');
    return json;
  },

  // Start a fresh conversation (get greeting)
  startConversation: async () => {
    const res = await apiFetch('/api/onboarding/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '__start__' }),
    });
    return res.json();
  },
};

// ─── Student Profile API ──────────────────────────────────────────────────────
export const profileAPI = {
  getProfile: async () => {
    const res = await apiFetch('/api/student/profile');
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  },

  updateProfile: async (data) => {
    const res = await apiFetch('/api/student/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  },
};

// ─── Student Legacy API (backward compat) ────────────────────────────────────
export const studentAPI = {
  saveData: async (data) => {
    const res = await apiFetch('/api/student/data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getData: async () => {
    const res = await apiFetch('/api/student/data');
    return res.json();
  },
};

// ─── Analysis API ─────────────────────────────────────────────────────────────
export const analysisAPI = {
  getReadiness: async () => {
    const res = await apiFetch('/api/analysis/readiness');
    return res.json();
  },

  getScoreHistory: async () => {
    const res = await apiFetch('/api/analysis/score-history');
    return res.json();
  },

  getRoleReadiness: async (roleName, requiredSkills) => {
    const res = await apiFetch('/api/analysis/role-readiness', {
      method: 'POST',
      body: JSON.stringify({ roleName, requiredSkills }),
    });
    return res.json();
  },
};

// ─── Resume API ───────────────────────────────────────────────────────────────
export const resumeAPI = {
  analyzeText: async (data) => {
    const res = await apiFetch('/api/resume/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  uploadPDF: async (file, extra = {}) => {
    const formData = new FormData();
    formData.append('resume', file);
    if (extra.jobDescription) formData.append('jobDescription', extra.jobDescription);
    if (extra.jobRole) formData.append('jobRole', extra.jobRole);
    if (extra.requiredSkills) formData.append('requiredSkills', extra.requiredSkills);

    const token = getAccessToken();
    const res = await apiFetch('/api/resume/upload-pdf', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }, // override Content-Type (let browser set multipart)
      body: formData,
    });
    // Remove Content-Type from headers so browser sets multipart boundary
    return res.json();
  },

  getHistory: async () => {
    const res = await apiFetch('/api/resume/history');
    return res.json();
  },
};

// ─── Interview API ────────────────────────────────────────────────────────────
export const interviewAPI = {
  getQuestion: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiFetch(`/api/interview/question?${query}`);
    return res.json();
  },

  getFeedback: async (data) => {
    const res = await apiFetch('/api/interview/ai-feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  generateQuestions: async (data) => {
    const res = await apiFetch('/api/interview/generate-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// ─── Project API ──────────────────────────────────────────────────────────────
export const projectAPI = {
  evaluate: async (data) => {
    const res = await apiFetch('/api/project/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getEvaluations: async () => {
    const res = await apiFetch('/api/project/evaluations');
    return res.json();
  },
};
