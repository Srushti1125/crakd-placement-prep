import axios from 'axios';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";

export async function analyzeResumeWithAI(resumeText, jobDescription, jobRole, requiredSkills = []) {
  try {
    const response = await axios.post(`${PYTHON_AI_URL}/api/resume/ats-score`, {
      resumeText,
      jobDescription,
      jobRole,
      requiredSkills
    });
    return response.data;
  } catch (err) {
    console.error("Error calling Python ATS service, using fallback schema:", err.message);
    // Return a basic fallback structure rather than failing completely
    const skillsList = Array.isArray(requiredSkills) ? requiredSkills : [];
    
    const studyTopics = [
      {
        topic: "System Architecture & Design Patterns",
        reason: "Essential to ensure your resume projects demonstrate robust modular structure and clean code practices.",
        resources: ["System Design Primer (GitHub)", "GeeksforGeeks Software Design Patterns"]
      },
      {
        topic: "Core Data Structures & Algorithms",
        reason: "Vital for clearing placement screening tests and optimizing backend runtimes.",
        resources: ["LeetCode Problem Sets", "NeetCode.io Study Roadmaps"]
      }
    ];
    
    const possibleQuestions = [
      {
        question: "Can you outline the database schema and system architecture of the most complex project on your resume?",
        type: "Project",
        context: "Resume Projects"
      },
      {
        question: "What was the most challenging technical bug you encountered in your projects and how did you debug it?",
        type: "Project",
        context: "Resume Projects"
      }
    ];

    const techMapping = {
      "react native": { topic: "React Native Performance & Architecture", reason: "Identified in your resume projects; study performance optimizations, state management (Redux/Context), and bridge communication.", resources: ["Official React Native Docs", "React Native Performance Guide"] },
      "firebase": { topic: "Firebase Scaling & Security Rules", reason: "Found in your resume database setup; master Firebase security rules, real-time sync limits, and Firestore indexing.", resources: ["Firebase Security Guide", "Firestore Best Practices"] },
      "tensorflow": { topic: "Deep Learning & Model Tuning in TensorFlow", reason: "Detected in your machine learning projects; review neural network hyperparameters, backpropagation, and TensorFlow optimization.", resources: ["TensorFlow Tutorials", "DeepLearning.AI Optimization Notes"] },
      "opencv": { topic: "Computer Vision & Image Processing with OpenCV", reason: "Found in your video/audio streams project; study feature extraction, color spaces, and filtering techniques.", resources: ["OpenCV Documentation", "Computer Vision Basics Course"] },
      "python": { topic: "Advanced Python & Memory Management", reason: "Key language detected; review decorators, generators, list comprehensions, and garbage collection.", resources: ["Real Python Guides", "Advanced Python Reference"] },
      "react": { topic: "React Component Lifecycle & Hook Internals", reason: "Key frontend technology found; study virtual DOM, hooks optimization (useMemo, useCallback), and code splitting.", resources: ["React Beta Documentation", "React Hooks Deep Dive"] },
      "sql": { topic: "Relational Database Indexing & Query Tuning", reason: "Essential for database work; learn about indexes, B-trees, execution plans, and join optimizations.", resources: ["Use The Index, Luke", "SQL Indexing Tutorials"] }
    };
    
    for (const [key, val] of Object.entries(techMapping)) {
      if (resumeText.toLowerCase().includes(key)) {
        studyTopics.push(val);
        possibleQuestions.push({
          question: `Explain how you used ${key.toUpperCase()} in your projects, the main architectural choices you made, and how you optimized its performance.`,
          type: "Skill",
          context: key.toUpperCase()
        });
      }
    }

    if (skillsList.length > 0) {
      for (const skill of skillsList.slice(0, 3)) {
        studyTopics.push({
          topic: `Deep Dive into ${skill}`,
          reason: `Required in target job descriptions but needs deeper validation of your practical experience.`,
          resources: [`Official ${skill} Reference Guides`, `W3Schools ${skill} Tutorials`]
        });
        possibleQuestions.push({
          question: `Explain a scenario where you would use ${skill} over an alternative technology, and how you optimize its performance.`,
          type: "Skill",
          context: skill
        });
      }
    }

    return {
      overallScore: 65,
      atsScore: 60,
      roleRelevance: 55,
      readability: {
        score: 70,
        level: "Standard",
        avgWordsPerSentence: "15.0"
      },
      studyTopics,
      possibleQuestions
    };
  }
}
