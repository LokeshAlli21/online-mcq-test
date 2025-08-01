-- Views for easier querying (Updated to match new schema)

-- Admin users view
CREATE VIEW admin_users AS
SELECT 
    u.id as user_id, 
    u.email, 
    u.phone, 
    u.email_verified, 
    u.phone_verified, 
    u.is_active, 
    u.created_at as registered_at,
    a.id as admin_id, 
    a.full_name, 
    a.role, 
    a.permissions
FROM users u
JOIN admins a ON u.id = a.id  -- Changed from a.user_id to a.id
WHERE u.user_type = 'admin';

-- Student users view  
CREATE VIEW student_users AS
SELECT 
    u.id as user_id, 
    u.email, 
    u.phone, 
    u.email_verified, 
    u.phone_verified,
    u.is_active, 
    u.created_at as registered_at,
    s.id as student_id, 
    s.full_name, 
    s.student_id as student_number,
    s.date_of_birth, 
    s.address,  -- Added address field
    s.class_level, 
    s.academic_year, 
    s.enrollment_date,
    sc.name as school_name, 
    b.name as board_name, 
    m.name as medium_name
FROM users u
JOIN students s ON u.id = s.id  -- Changed from s.user_id to s.id
LEFT JOIN schools sc ON s.school_id = sc.id
JOIN boards b ON s.board_id = b.id
JOIN mediums m ON s.medium_id = m.id
WHERE u.user_type = 'student';

-- Test summary view (assuming this references existing tables)
CREATE VIEW test_summary AS
SELECT 
    t.id, 
    t.title, 
    t.total_questions, 
    t.total_marks, 
    t.time_limit_minutes,
    t.passing_percentage, 
    t.is_active, 
    c.name as category_name,
    a.full_name as created_by_name, 
    t.created_at
FROM tests t
JOIN categories c ON t.category_id = c.id
JOIN admins a ON t.created_by = a.id;