-- Sample data with enhanced marking (Updated for new schema)

INSERT INTO boards (name, full_name, description) VALUES
('CBSE', 'Central Board of Secondary Education', 'National level board of education in India'),
('ICSE', 'Indian Certificate of Secondary Education', 'Private board of school education in India'),
('Maharashtra State Board', 'Maharashtra State Board of Secondary and Higher Secondary Education', 'State board of Maharashtra');

INSERT INTO mediums (name) VALUES ('English'), ('Hindi'), ('Marathi');

INSERT INTO schools (name, code, board_id, city, state, contact_phone) VALUES
('Delhi Public School Pune - A Premier Educational Institution with Excellence in Academic and Co-curricular Activities', 'DPS001', 1, 'Pune', 'Maharashtra', '+91-20-12345678'),
('Ryan International School Mumbai - Fostering Global Citizens Through Quality Education and Character Development', 'RYAN002', 1, 'Mumbai', 'Maharashtra', '+91-22-87654321');

INSERT INTO users (email, phone, password_hash, user_type) VALUES
('admin@test.com', '+91-9876543200', '$2b$12$SWir50pa.YsTe9Je260Jweyo782fvHqCiAL2k7rw4kKxo7FVZoxUu', 'admin'),
('student1@test.com', '+91-9876543210', '$2b$12$SWir50pa.YsTe9Je260Jweyo782fvHqCiAL2k7rw4kKxo7FVZoxUu', 'student'),
('student2@test.com', '+91-9876543211', '$2b$12$SWir50pa.YsTe9Je260Jweyo782fvHqCiAL2k7rw4kKxo7FVZoxUu', 'student');

-- Updated: Using direct ID reference instead of user_id
INSERT INTO admins (id, full_name, role) VALUES
(1, 'Admin User', 'super_admin');

-- Updated: Using direct ID reference instead of user_id, and added address field
INSERT INTO students (id, full_name, student_id, address, school_id, board_id, medium_id, class_level, academic_year) VALUES
(2, 'Rahul Sharma', 'STU001', '123 MG Road, Pune, Maharashtra - 411001', 1, 1, 1, 7, '2024-25'),
(3, 'Priya Patel', 'STU002', '456 Linking Road, Mumbai, Maharashtra - 400050', 2, 1, 1, 8, '2024-25');

INSERT INTO categories (name, description, created_by) VALUES
('Mathematics', 'Mathematics questions for classes 1-12', 1),
('Science', 'Science questions for classes 1-12', 1);

INSERT INTO tests (title, category_id, total_questions, time_limit_minutes, target_classes, target_boards, target_mediums, passing_percentage, partial_credit_enabled, negative_marking, negative_marks_per_wrong, created_by) VALUES
('Class 7-8 Math Quiz', 1, 3, 30, '[7, 8]', '[1]', '[1]', 60.00, true, true, 0.25, 1);

-- Insert questions with different marks
INSERT INTO questions (test_id, question_text, options, question_type, correct_answers, marks, negative_marks, difficulty_level, question_order, explanation, created_by) VALUES
(1, 'What is 15 × 8?', '["110", "120", "130", "140"]', 'single_choice', '[1]', 2.00, 0.50, 'easy', 1, '15 × 8 = 120', 1),
(1, 'Which of the following are factors of 24?', '["2", "3", "5", "6", "8", "12"]', 'multiple_choice', '[0, 1, 3, 4, 5]', 3.00, 0.75, 'medium', 2, 'Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. From options: 2, 3, 6, 8, 12 are correct.', 1),
(1, 'Solve for x: 2x + 5 = 15', '["x = 3", "x = 5", "x = 7", "x = 10"]', 'single_choice', '[1]', 5.00, 1.25, 'hard', 3, '2x + 5 = 15, so 2x = 10, therefore x = 5', 1);

-- The total_marks for the test will be auto-calculated as 2.00 + 3.00 + 5.00 = 10.00

-- Student 1: Rahul Sharma
-- Correct: Q1, Q2 partially (3 correct out of 5), Q3 correct
INSERT INTO test_attempts (
    test_id, student_id, attempt_number, answers,
    total_marks, marks_obtained, percentage_score, negative_marks_deducted,
    total_questions, correct_answers, wrong_answers, unanswered_questions, partial_credit_answers,
    skipped_questions, answered_questions, marked_for_review_questions,
    time_taken_minutes, is_passed, started_at, completed_at
) VALUES (
    1, 2, 1,
    '[
        {"question_id": 1, "selected_answers": [1]},
        {"question_id": 2, "selected_answers": [0,1,3]},
        {"question_id": 3, "selected_answers": [1]}
    ]',
    10.00, 2.00 + 1.80 + 5.00, -- full + partial + full
    ROUND((8.80 / 10.00) * 100, 2), -- 88.00
    0.00, -- no wrong answers
    3, 2, 0, 0, 1,
    0, 3, 0,
    18, true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '18 minutes'
);

-- Student 2: Priya Patel
-- Correct: Q2 only, Q1 and Q3 are wrong
INSERT INTO test_attempts (
    test_id, student_id, attempt_number, answers,
    total_marks, marks_obtained, percentage_score, negative_marks_deducted,
    total_questions, correct_answers, wrong_answers, unanswered_questions, partial_credit_answers,
    skipped_questions, answered_questions, marked_for_review_questions,
    time_taken_minutes, is_passed, started_at, completed_at
) VALUES (
    1, 3, 1,
    '[
        {"question_id": 1, "selected_answers": [0]},
        {"question_id": 2, "selected_answers": [0,1,3,4,5]},
        {"question_id": 3, "selected_answers": [2]}
    ]',
    10.00, 3.00, -- only Q2 correct
    ROUND((3.00 / 10.00) * 100, 2), -- 30.00
    0.50 + 1.25, -- two wrongs: Q1 + Q3
    3, 1, 2, 0, 0,
    0, 3, 0,
    25, false,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '25 minutes'
);
