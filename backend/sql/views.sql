-- Views for easier querying
CREATE VIEW admin_users AS
SELECT 
    u.id as user_id, u.email, u.is_active, u.created_at as registered_at,
    a.id as admin_id, a.full_name, a.role, a.permissions
FROM users u
JOIN admins a ON u.id = a.user_id
WHERE u.user_type = 'admin';

CREATE VIEW student_users AS
SELECT 
    u.id as user_id, u.email, u.is_active, u.created_at as registered_at,
    s.id as student_id, s.full_name, s.student_id as student_number,
    s.phone, s.date_of_birth, s.class_level, s.academic_year, s.enrollment_date,
    sc.name as school_name, b.name as board_name, m.name as medium_name
FROM users u
JOIN students s ON u.id = s.user_id
LEFT JOIN schools sc ON s.school_id = sc.id
JOIN boards b ON s.board_id = b.id
JOIN mediums m ON s.medium_id = m.id
WHERE u.user_type = 'student';

CREATE VIEW test_summary AS
SELECT 
    t.id, t.title, t.total_questions, t.total_marks, t.time_limit_minutes,
    t.passing_percentage, t.is_active, c.name as category_name,
    a.full_name as created_by_name, t.created_at
FROM tests t
JOIN categories c ON t.category_id = c.id
JOIN admins a ON t.created_by = a.id;