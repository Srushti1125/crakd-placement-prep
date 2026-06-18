function calculateProfileCompletion(profile) {
  const fields = [
    { key: 'cgpa', weight: 15 },
    { key: 'branch', weight: 10 },
    { key: 'college_name', weight: 5 },
    { key: 'skills', weight: 20, check: v => v && v.length > 0 },
    { key: 'projects_count', weight: 15 },
    { key: 'internships_count', weight: 10 },
    { key: 'dsa_level', weight: 10 },
    { key: 'communication_score', weight: 5 },
    { key: 'target_role', weight: 10 },
  ];
  let total = 0;
  for (const f of fields) {
    const val = profile[f.key];
    if (f.check ? f.check(val) : val !== null && val !== undefined && val !== '') total += f.weight;
  }
  return Math.min(100, total);
}

function calculateReadinessScore(profile) {
  const w = { cgpa: 20, projects: 25, internships: 20, dsa: 20, communication: 15 };
  const cgpaScore = ((parseFloat(profile.cgpa) || 0) / 10) * w.cgpa;
  const projectScore = Math.min(((profile.projects_count || 0) / 5) * w.projects, w.projects);
  const internScore = Math.min(((profile.internships_count || 0) / 3) * w.internships, w.internships);
  const dsaMap = { 'Advanced': 1.0, 'Intermediate': 0.6, 'Beginner': 0.3 };
  const dsaScore = (dsaMap[profile.dsa_level] || 0.3) * w.dsa;
  const commScore = ((profile.communication_score || 5) / 10) * w.communication;
  const breakdown = { cgpa: cgpaScore, projects: projectScore, internships: internScore, dsa: dsaScore, communication: commScore };
  const total = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0));
  const suggestions = [];
  if (cgpaScore < w.cgpa * 0.6) suggestions.push({ area: 'CGPA', tip: 'Focus on upcoming exams to raise CGPA above 7.0' });
  if (projectScore < w.projects * 0.6) suggestions.push({ area: 'Projects', tip: 'Build 2-3 more projects. Aim for 5+ before placements.' });
  if (internScore < w.internships * 0.6) suggestions.push({ area: 'Internships', tip: 'Apply to internships on Internshala, LinkedIn.' });
  if (dsaScore < w.dsa * 0.6) suggestions.push({ area: 'DSA', tip: 'Practice 2 LeetCode problems daily.' });
  if (commScore < w.communication * 0.6) suggestions.push({ area: 'Communication', tip: 'Record yourself answering interview questions.' });
  return { score: total, breakdown, suggestions, maxPossible: 100 };
}

export {
  calculateProfileCompletion,
  calculateReadinessScore
};
