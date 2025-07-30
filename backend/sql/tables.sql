-- Base users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20), -- Added phone field
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('student', 'admin')),
    email_verified BOOLEAN DEFAULT false, -- Added email verification
    phone_verified BOOLEAN DEFAULT false, -- Added phone verification
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Admin-specific information
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '["create_tests", "manage_users", "view_reports"]',
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    UNIQUE(user_id)
);

-- Educational boards (CBSE, ICSE, State Boards, etc.)
CREATE TABLE boards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(200),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Medium of instruction
CREATE TABLE mediums (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Schools/Institutions (Changed to TEXT for lengthy names)
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL, -- Changed from VARCHAR(200) to TEXT for lengthy school names
    code VARCHAR(50) UNIQUE,
    board_id INTEGER NOT NULL REFERENCES boards(id),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Student-specific information and profile
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    student_id VARCHAR(50),
    date_of_birth DATE,
    address TEXT,
    school_id INTEGER REFERENCES schools(id),
    board_id INTEGER NOT NULL REFERENCES boards(id),
    medium_id INTEGER NOT NULL REFERENCES mediums(id),
    class_level INTEGER NOT NULL CHECK (class_level BETWEEN 1 AND 12), -- Extended to 12th
    academic_year VARCHAR(10),
    enrollment_date DATE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE, --CURRENT_DATE
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    UNIQUE(user_id),
    UNIQUE(student_id)
);

-- Test categories/subjects
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Tests configuration with enhanced marking system
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    total_marks DECIMAL(8,2) NOT NULL DEFAULT 0.00 CHECK (total_marks >= 0), -- Auto-calculated from questions
    time_limit_minutes INTEGER NOT NULL CHECK (time_limit_minutes > 0),
    passing_percentage DECIMAL(5,2) NOT NULL DEFAULT 60.00 CHECK (passing_percentage BETWEEN 0 AND 100),
    max_attempts INTEGER DEFAULT 1 CHECK (max_attempts > 0),
    partial_credit_enabled BOOLEAN DEFAULT false,
    negative_marking BOOLEAN DEFAULT false,
    negative_marks_per_wrong DECIMAL(5,2) DEFAULT 0.00 CHECK (negative_marks_per_wrong >= 0),
    -- Eligibility criteria
    target_boards JSONB,
    target_mediums JSONB,
    target_classes JSONB NOT NULL,
    target_schools JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Questions with individual marks (Enhanced marking system)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL CHECK (jsonb_array_length(options) BETWEEN 2 AND 6), -- Extended to 6 options
    question_type VARCHAR(20) NOT NULL DEFAULT 'single_choice' CHECK (question_type IN ('single_choice', 'multiple_choice')),
    correct_answers JSONB NOT NULL,
    marks DECIMAL(5,2) NOT NULL DEFAULT 1.00 CHECK (marks > 0), -- Individual marks per question
    negative_marks DECIMAL(5,2) DEFAULT 0.00 CHECK (negative_marks >= 0), -- Question-specific negative marking
    explanation TEXT,
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    question_order INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER NOT NULL REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    -- Ensure correct_answers contains valid indices
    CONSTRAINT valid_correct_answers CHECK (
        jsonb_array_length(correct_answers) >= 1 AND
        jsonb_array_length(correct_answers) <= jsonb_array_length(options)
    ),
    UNIQUE(test_id, question_order)
);

-- Test attempts with enhanced scoring
CREATE TABLE test_attempts (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    answers JSONB, -- Store all answers
    -- Enhanced scoring fields
    total_marks DECIMAL(8,2) NOT NULL DEFAULT 0.00, -- Total marks for the test
    marks_obtained DECIMAL(8,2) DEFAULT 0.00 CHECK (marks_obtained >= 0), -- Actual marks scored
    percentage_score DECIMAL(5,2) DEFAULT 0.00 CHECK (percentage_score BETWEEN 0 AND 100),
    negative_marks_deducted DECIMAL(8,2) DEFAULT 0.00 CHECK (negative_marks_deducted >= 0),
    -- Question statistics
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    wrong_answers INTEGER NOT NULL DEFAULT 0,
    unanswered_questions INTEGER NOT NULL DEFAULT 0,
    partial_credit_answers INTEGER NOT NULL DEFAULT 0,
    -- Optional additional fields for status tracking
    skipped_questions INTEGER NOT NULL DEFAULT 0,
    answered_questions INTEGER NOT NULL DEFAULT 0,
    marked_for_review_questions INTEGER NOT NULL DEFAULT 0,
    time_taken_minutes INTEGER CHECK (time_taken_minutes > 0),
    is_passed BOOLEAN,
    started_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    completed_at TIMESTAMP,
    UNIQUE(test_id, student_id, attempt_number)
);

-- Detailed question-wise results for analysis
CREATE TABLE question_attempts (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_answers JSONB, -- Array of selected option indices
    is_correct BOOLEAN NOT NULL DEFAULT false,
    is_partially_correct BOOLEAN NOT NULL DEFAULT false,
    marks_awarded DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'skipped', -- it may be skipped, answered, marked_for_review, etc.
    time_spent_seconds INTEGER DEFAULT 0,
    UNIQUE(attempt_id, question_id)
);

-- Certificates for passed tests
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL DEFAULT ('CERT_' || EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'))::BIGINT || '_' || FLOOR(RANDOM() * 1000)),
    test_title VARCHAR(200) NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    marks_obtained DECIMAL(8,2) NOT NULL,
    total_marks DECIMAL(8,2) NOT NULL,
    percentage_score DECIMAL(5,2) NOT NULL,
    issued_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);