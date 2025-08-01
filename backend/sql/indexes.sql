-- Essential indexes for performance (Updated to match new schema)

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);  -- Added for phone lookups
CREATE INDEX idx_users_type_active ON users(user_type, is_active);
CREATE INDEX idx_users_email_verified ON users(email_verified);  -- Added for verification checks
CREATE INDEX idx_users_phone_verified ON users(phone_verified);  -- Added for verification checks

-- Admin and Student table indexes (updated for new FK structure)
-- Note: These indexes are no longer needed since admins.id and students.id 
-- directly reference users.id (primary key constraint handles this)
-- CREATE INDEX idx_admins_user ON admins(user_id);  -- Removed - not needed
-- CREATE INDEX idx_students_user ON students(user_id);  -- Removed - not needed

-- Student-specific indexes
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_class_board ON students(class_level, board_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_board ON students(board_id);  -- Added for board filtering
CREATE INDEX idx_students_medium ON students(medium_id);  -- Added for medium filtering
CREATE INDEX idx_students_enrollment_date ON students(enrollment_date);  -- Added for enrollment tracking

-- Reference tables indexes
CREATE INDEX idx_boards_active ON boards(is_active);
CREATE INDEX idx_mediums_active ON mediums(is_active);
CREATE INDEX idx_schools_active ON schools(is_active);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Test-related indexes
CREATE INDEX idx_tests_category_active ON tests(category_id, is_active);
CREATE INDEX idx_tests_target_classes ON tests USING GIN (target_classes);
CREATE INDEX idx_tests_created_by ON tests(created_by);  -- Added for admin filtering

-- Question indexes
CREATE INDEX idx_questions_test ON questions(test_id);
CREATE INDEX idx_questions_test_order ON questions(test_id, question_order);

-- Test attempt indexes
CREATE INDEX idx_attempts_student_test ON test_attempts(student_id, test_id);
CREATE INDEX idx_attempts_completed ON test_attempts(completed_at);
CREATE INDEX idx_attempts_student_started ON test_attempts(student_id, started_at);  -- Added for student history

-- Question attempt indexes
CREATE INDEX idx_question_attempts_attempt ON question_attempts(attempt_id);

-- Certificate indexes
CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);