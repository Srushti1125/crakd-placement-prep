import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ DB connection failed:', err.message);
    return;
  }
  console.log('✅ PostgreSQL connected');
  release();
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS student_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        cgpa DECIMAL(4,2),
        branch VARCHAR(100),
        graduation_year INTEGER,
        college_name VARCHAR(255),
        skills TEXT[],
        projects_count INTEGER DEFAULT 0,
        internships_count INTEGER DEFAULT 0,
        dsa_level VARCHAR(50) DEFAULT 'Beginner',
        communication_score INTEGER DEFAULT 5,
        work_experience JSONB DEFAULT '[]',
        projects_detail JSONB DEFAULT '[]',
        certifications JSONB DEFAULT '[]',
        achievements TEXT[],
        target_role VARCHAR(255),
        target_company VARCHAR(255),
        profile_completion INTEGER DEFAULT 0,
        onboarding_complete BOOLEAN DEFAULT false,
        onboarding_method VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        messages JSONB DEFAULT '[]',
        extracted_data JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'in_progress',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS score_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        breakdown JSONB,
        recorded_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS resume_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255),
        resume_text TEXT,
        job_description TEXT,
        job_role VARCHAR(255),
        ats_score INTEGER,
        readability_score INTEGER,
        role_relevance INTEGER,
        overall_score INTEGER,
        analysis_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS project_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        project_description TEXT,
        target_role VARCHAR(255),
        evaluation_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(255),
        questions_answered INTEGER DEFAULT 0,
        avg_score DECIMAL(5,2),
        session_data JSONB DEFAULT '[]',
        completed_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS test_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50) NOT NULL,
        topic VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        company_tag VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS test_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        test_type VARCHAR(50) NOT NULL,
        topics TEXT[],
        company_pattern VARCHAR(50),
        time_limit INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        questions JSONB NOT NULL,
        answers JSONB DEFAULT '{}',
        score INTEGER,
        topic_breakdown JSONB,
        status VARCHAR(20) DEFAULT 'in_progress',
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS weak_topic_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        topic VARCHAR(100) NOT NULL,
        test_type VARCHAR(50) NOT NULL,
        correct INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        last_tested TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, topic, test_type)
      );
    `);
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ DB init failed:', err);
  } finally {
    client.release();
  }
}

export { pool, initializeDatabase };
