// examController.js
import db from '../database/dbClient.js';

export const createExam = async (req, res) => {
  try {
    const {
      title,
      category_id,
      time_limit_minutes,
      passing_percentage = 60.00,
      max_attempts = 1,
      partial_credit_enabled = false,
      negative_marking = false,
      negative_marks_per_wrong = 0.00,
      target_boards,
      target_mediums,
      target_classes,
      target_schools,
      is_active = true
    } = req.body;

    // Validation
    if (!title || !category_id || !time_limit_minutes || !target_classes) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, category_id, time_limit_minutes, target_classes'
      });
    }

    // Get created_by from authenticated user (assuming it's in req.user)
    const created_by = req.user?.id || req.body.created_by;
    if (!created_by) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify category exists
    const categoryExists = await db.findById('categories', category_id);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Create the test
    const newTest = await db.create('tests', {
      title,
      category_id,
      total_questions: 0, // Will be updated when questions are added
      total_marks: 0.00, // Will be calculated from questions
      time_limit_minutes,
      passing_percentage,
      max_attempts,
      partial_credit_enabled,
      negative_marking,
      negative_marks_per_wrong,
      target_boards: target_boards ? JSON.stringify(target_boards) : null,
      target_mediums: target_mediums ? JSON.stringify(target_mediums) : null,
      target_classes: JSON.stringify(target_classes),
      target_schools: target_schools ? JSON.stringify(target_schools) : null,
      is_active,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: {
        ...newTest,
        target_boards: newTest.target_boards ? JSON.parse(newTest.target_boards) : null,
        target_mediums: newTest.target_mediums ? JSON.parse(newTest.target_mediums) : null,
        target_classes: JSON.parse(newTest.target_classes),
        target_schools: newTest.target_schools ? JSON.parse(newTest.target_schools) : null
      }
    });

  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const {
      name = '',
      description = '',
      is_active = true
    } = req.body;

    // Validation
    if (!name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Get created_by from authenticated user
    const created_by = req.user?.id || req.body.created_by;
    if (!created_by) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if category name already exists
    const existingCategory = await db.queryOne(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    // Create the category
    const newCategory = await db.create('categories', {
      name: name.trim(),
      description: description.trim() || null,
      is_active,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });

  } catch (error) {
    console.error('Error creating category:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const addNewQuestion = async (req, res) => {
  try {
    const {
      test_id,
      question_text = '',
      options = ['', '', '', ''],
      question_type = 'single_choice',
      correct_answers = [],
      marks = 1.00,
      negative_marks = 0.00,
      explanation = '',
      difficulty_level = 'medium'
    } = req.body;

    // Validation
    if (!test_id) {
      return res.status(400).json({
        success: false,
        message: 'Test ID is required'
      });
    }

    if (!question_text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question text is required'
      });
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Options must be an array with 2-6 choices'
      });
    }

    if (!Array.isArray(correct_answers) || correct_answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one correct answer is required'
      });
    }

    // Validate correct answers indices
    const maxIndex = options.length - 1;
    const invalidAnswers = correct_answers.filter(idx => idx < 0 || idx > maxIndex);
    if (invalidAnswers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid correct answer indices. Must be between 0 and ${maxIndex}`
      });
    }

    // For single choice, only one correct answer allowed
    if (question_type === 'single_choice' && correct_answers.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Single choice questions can have only one correct answer'
      });
    }

    // Get created_by from authenticated user
    const created_by = req.user?.id || req.body.created_by;
    if (!created_by) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify test exists
    const testExists = await db.findById('tests', test_id);
    if (!testExists) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Get next question order
    const lastOrder = await db.queryOne(
      'SELECT COALESCE(MAX(question_order), 0) as max_order FROM questions WHERE test_id = $1',
      [test_id]
    );
    const question_order = parseInt(lastOrder.max_order) + 1;

    // Create the question using transaction
    const result = await db.transaction(async (client) => {
      // Insert question
      const newQuestion = await client.query(`
        INSERT INTO questions (
          test_id, question_text, options, question_type, correct_answers,
          marks, negative_marks, explanation, difficulty_level, question_order, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        test_id,
        question_text.trim(),
        JSON.stringify(options),
        question_type,
        JSON.stringify(correct_answers),
        marks,
        negative_marks,
        explanation.trim() || null,
        difficulty_level,
        question_order,
        created_by
      ]);

      // Update test statistics
      await client.query(`
        UPDATE tests 
        SET 
          total_questions = (SELECT COUNT(*) FROM questions WHERE test_id = $1),
          total_marks = (SELECT COALESCE(SUM(marks), 0) FROM questions WHERE test_id = $1),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [test_id]);

      return newQuestion.rows[0];
    });

    // Parse JSON fields for response
    const formattedQuestion = {
      ...result,
      options: JSON.parse(result.options),
      correct_answers: JSON.parse(result.correct_answers)
    };

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: formattedQuestion
    });

  } catch (error) {
    console.error('Error adding question:', error);
    
    // Handle unique constraint violation (duplicate question_order)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Question order conflict. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getQuestionsByTestId = async (req, res) => {
  try {
    const { testId } = req.params;
    const { include_answers = 'false' } = req.query;

    // Verify test exists
    const testExists = await db.findById('tests', testId);
    if (!testExists) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    const query = `
      SELECT 
        q.*,
        a.full_name as created_by_username
      FROM questions q
      LEFT JOIN admins a ON q.created_by = a.id
      WHERE q.test_id = $1
      ORDER BY q.question_order ASC
    `;

    const questions = await db.queryMany(query, [testId]);

    // Format questions and optionally hide correct answers
    const formattedQuestions = questions.map(question => {
      const formatted = {
        ...question,
        options: JSON.parse(question.options),
        correct_answers: JSON.parse(question.correct_answers)
      };

      // Hide correct answers if not requested (for student view)
      if (include_answers !== 'true') {
        delete formatted.correct_answers;
        delete formatted.explanation;
      }

      return formatted;
    });

    res.json({
      success: true,
      data: formattedQuestions,
      meta: {
        test_id: parseInt(testId),
        total_questions: formattedQuestions.length,
        includes_answers: include_answers === 'true'
      }
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const exams = await db.query('SELECT * FROM tests ORDER BY created_at DESC');
    res.status(200).json(exams.rows);
  } catch (error) {
    console.error('Error fetching all exams:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await db.query('SELECT * FROM categories ORDER BY created_at DESC');
    res.status(200).json(categories.rows);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllStudentExams = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Validate studentId
    if (!studentId || isNaN(parseInt(studentId))) {
      return res.status(400).json({ 
        message: 'Invalid student ID provided' 
      });
    }

    console.log('Fetching exams for student ID:', studentId);
    // Check if student exists
    const studentExists = await db.query(
      'SELECT id FROM students WHERE id = $1', 
      [parseInt(studentId)]
    );

    console.log('Student exists:', studentExists);

    if (studentExists.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Student not found' 
      });
    }

    // Get eligible exams using the function we created
    const exams = await db.query(
      'SELECT * FROM get_student_eligible_exams($1)', 
      [parseInt(studentId)]
    );

    // Return response with additional metadata
    res.status(200).json({
      success: true,
      studentId: parseInt(studentId),
      totalExams: exams.rows.length,
      exams: exams.rows
    });

  } catch (error) {
    console.error('Error fetching student exams:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// CREATE TABLE test_attempts (
//     id SERIAL PRIMARY KEY,
//     test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
//     student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
//     attempt_number INTEGER NOT NULL DEFAULT 1,
//     answers JSONB, -- Store all answers
//     -- Enhanced scoring fields
//     total_marks DECIMAL(8,2) NOT NULL DEFAULT 0.00, -- Total marks for the test
//     marks_obtained DECIMAL(8,2) DEFAULT 0.00 CHECK (marks_obtained >= 0), -- Actual marks scored
//     percentage_score DECIMAL(5,2) DEFAULT 0.00 CHECK (percentage_score BETWEEN 0 AND 100),
//     negative_marks_deducted DECIMAL(8,2) DEFAULT 0.00 CHECK (negative_marks_deducted >= 0),
//     -- Question statistics
//     total_questions INTEGER NOT NULL,
//     correct_answers INTEGER NOT NULL DEFAULT 0,
//     wrong_answers INTEGER NOT NULL DEFAULT 0,
//     unanswered_questions INTEGER NOT NULL DEFAULT 0,
//     partial_credit_answers INTEGER NOT NULL DEFAULT 0,
//     -- Optional additional fields for status tracking
//     skipped_questions INTEGER NOT NULL DEFAULT 0,
//     answered_questions INTEGER NOT NULL DEFAULT 0,
//     marked_for_review_questions INTEGER NOT NULL DEFAULT 0,
//     time_taken_minutes INTEGER CHECK (time_taken_minutes > 0),
//     is_passed BOOLEAN,
//     started_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
//     completed_at TIMESTAMP,
//     UNIQUE(test_id, student_id, attempt_number)
// );

export const getAllStudentExamAttempts = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate studentId
    if (!studentId || isNaN(parseInt(studentId))) {
      return res.status(400).json({
        message: 'Invalid student ID provided'
      });
    }

    console.log('Fetching exam attempts for student ID:', studentId);
    // Check if student exists
    const studentExists = await db.query(
      'SELECT id FROM students WHERE id = $1',
      [parseInt(studentId)]
    );

    console.log('Student exists:', studentExists);

    if (studentExists.rows.length === 0) {
      return res.status(404).json({
        message: 'Student not found'
      });
    }

    // Get exam attempts for the student
    const attempts = await db.query(
      'SELECT * FROM test_attempts WHERE student_id = $1',
      [parseInt(studentId)]
    );

    // Return response with additional metadata
    res.status(200).json({
      success: true,
      studentId: parseInt(studentId),
      totalAttempts: attempts.rows.length,
      attempts: attempts.rows
    });

  } catch (error) {
    console.error('Error fetching student exam attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get exam/test by ID with related information
 */
export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid exam ID is required'
      });
    }

    // Get exam with related information
    const query = `
      SELECT 
        t.*,
        c.name as category_name,
        c.description as category_description,
        a.full_name as created_by_username,
        a.id as created_admin_id
      FROM tests t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN admins a ON t.created_by = a.id
      WHERE t.id = $1
    `;

    const exam = await db.queryOne(query, [id]);

    // console.log('Fetched exam:', exam);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get additional statistics
    const statsQuery = `
      SELECT 
        COUNT(q.id) as question_count,
        COALESCE(SUM(q.marks), 0) as calculated_total_marks,
        COUNT(CASE WHEN q.difficulty_level = 'easy' THEN 1 END) as easy_questions,
        COUNT(CASE WHEN q.difficulty_level = 'medium' THEN 1 END) as medium_questions,
        COUNT(CASE WHEN q.difficulty_level = 'hard' THEN 1 END) as hard_questions,
        COUNT(CASE WHEN q.question_type = 'single_choice' THEN 1 END) as single_choice_questions,
        COUNT(CASE WHEN q.question_type = 'multiple_choice' THEN 1 END) as multiple_choice_questions
      FROM questions q
      WHERE q.test_id = $1
    `;

    const stats = await db.queryOne(statsQuery, [id]);

    // console.log('Fetched exam statistics:', stats);

    // Get attempt statistics
    let attemptStats = null;
    try {
      const attemptStatsQuery = `
        SELECT 
          COUNT(*) as total_attempts,
          COUNT(DISTINCT student_id) as unique_students,
          AVG(percentage_score) as average_score,
          COUNT(CASE WHEN is_passed = true THEN 1 END) as passed_attempts,
          COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_attempts
        FROM test_attempts
        WHERE test_id = $1
      `;
      attemptStats = await db.queryOne(attemptStatsQuery, [id]);
    } catch (error) {
      // test_attempts table might not exist yet
      console.log('test_attempts table not found, skipping attempt stats');
    }

    // Format response with proper JSONB handling
    const formattedExam = {
      ...exam,
      target_boards: exam.target_boards || null,
      target_mediums: exam.target_mediums || null,
      target_classes: exam.target_classes || null,
      target_schools: exam.target_schools || null,
      
      // Add statistics
      statistics: {
        questions: {
          total: parseInt(stats.question_count),
          by_difficulty: {
            easy: parseInt(stats.easy_questions),
            medium: parseInt(stats.medium_questions),
            hard: parseInt(stats.hard_questions)
          },
          by_type: {
            single_choice: parseInt(stats.single_choice_questions),
            multiple_choice: parseInt(stats.multiple_choice_questions)
          }
        },
        marks: {
          total_from_db: parseFloat(exam.total_marks || 0),
          calculated_from_questions: parseFloat(stats.calculated_total_marks),
          is_synced: parseFloat(exam.total_marks || 0) === parseFloat(stats.calculated_total_marks)
        },
        attempts: attemptStats ? {
          total_attempts: parseInt(attemptStats.total_attempts),
          unique_students: parseInt(attemptStats.unique_students),
          average_score: attemptStats.average_score ? parseFloat(attemptStats.average_score).toFixed(2) : null,
          passed_attempts: parseInt(attemptStats.passed_attempts),
          completed_attempts: parseInt(attemptStats.completed_attempts),
          pass_rate: attemptStats.total_attempts > 0 ? 
            ((parseInt(attemptStats.passed_attempts) / parseInt(attemptStats.total_attempts)) * 100).toFixed(2) : 0,
          completion_rate: attemptStats.total_attempts > 0 ? 
            ((parseInt(attemptStats.completed_attempts) / parseInt(attemptStats.total_attempts)) * 100).toFixed(2) : 0
        } : null
      }
    };

    res.json({
      success: true,
      data: formattedExam
    });

  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update exam/test by ID
 */
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid exam ID is required'
      });
    }

    const {
      title,
      category_id,
      time_limit_minutes,
      passing_percentage,
      max_attempts,
      partial_credit_enabled,
      negative_marking,
      negative_marks_per_wrong,
      target_boards,
      target_mediums,
      target_classes,
      target_schools,
      is_active
    } = req.body;

    // Check if exam exists
    const existingExam = await db.findById('tests', id);
    if (!existingExam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Build update data object (only include provided fields)
    const updateData = {};

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty'
        });
      }
      updateData.title = title.trim();
    }

    if (category_id !== undefined) {
      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: 'Category ID is required'
        });
      }
      // Verify category exists
      const categoryExists = await db.findById('categories', category_id);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      updateData.category_id = category_id;
    }

    if (time_limit_minutes !== undefined) {
      if (!time_limit_minutes || time_limit_minutes <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Time limit must be greater than 0'
        });
      }
      updateData.time_limit_minutes = time_limit_minutes;
    }

    if (passing_percentage !== undefined) {
      if (passing_percentage < 0 || passing_percentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Passing percentage must be between 0 and 100'
        });
      }
      updateData.passing_percentage = passing_percentage;
    }

    if (max_attempts !== undefined) {
      if (max_attempts !== null && (!max_attempts || max_attempts <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Max attempts must be greater than 0 or null for unlimited'
        });
      }
      updateData.max_attempts = max_attempts;
    }

    if (partial_credit_enabled !== undefined) {
      updateData.partial_credit_enabled = Boolean(partial_credit_enabled);
    }

    if (negative_marking !== undefined) {
      updateData.negative_marking = Boolean(negative_marking);
    }

    if (negative_marks_per_wrong !== undefined) {
      if (negative_marks_per_wrong < 0) {
        return res.status(400).json({
          success: false,
          message: 'Negative marks per wrong answer cannot be negative'
        });
      }
      updateData.negative_marks_per_wrong = negative_marks_per_wrong;
    }

    // Handle JSONB fields - store as JSONB, not stringified JSON
    if (target_boards !== undefined) {
      updateData.target_boards =  target_boards ? JSON.stringify(target_boards) : null;
    }

    if (target_mediums !== undefined) {
      updateData.target_mediums = target_mediums ? JSON.stringify(target_mediums) : null;
    }

    if (target_classes !== undefined) {
      if (!target_classes || (Array.isArray(target_classes) && target_classes.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Target classes cannot be empty'
        });
      }
      updateData.target_classes = target_classes ? JSON.stringify(target_classes) : null;
    }

    if (target_schools !== undefined) {
      updateData.target_schools = target_schools ? JSON.stringify(target_schools) : null;
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    // Perform the update using parameterized query to handle JSONB properly
    const updateFields = Object.keys(updateData);
    const updateValues = Object.values(updateData);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const updateQuery = `
      UPDATE tests 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const updatedExam = await db.queryOne(updateQuery, [id, ...updateValues]);

    // Get the updated exam with related information (similar to getExamById)
    const query = `
      SELECT 
        t.*,
        c.name as category_name,
        c.description as category_description,
        a.full_name as created_by_username
      FROM tests t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN admins a ON t.created_by = a.id
      WHERE t.id = $1
    `;

    const completeUpdatedExam = await db.queryOne(query, [id]);

    // Format response
    const formattedExam = {
      ...completeUpdatedExam,
      target_boards: completeUpdatedExam.target_boards || null,
      target_mediums: completeUpdatedExam.target_mediums || null,
      target_classes: completeUpdatedExam.target_classes || null,
      target_schools: completeUpdatedExam.target_schools || null
    };

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: formattedExam,
      updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at')
    });

  } catch (error) {
    console.error('Error updating exam:', error);
    
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to category or admin'
      });
    }

    if (error.code === '23514') { // Check constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid data: violates database constraints'
      });
    }

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Duplicate data: violates unique constraints'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Soft delete exam by setting is_active to false
 */
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid exam ID is required'
      });
    }

    // Check if exam exists
    const existingExam = await db.findById('tests', id);
    if (!existingExam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if exam is already inactive
    if (!existingExam.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Exam is already inactive'
      });
    }

    // Soft delete by setting is_active to false
    const updateQuery = `
      UPDATE tests 
      SET is_active = false, updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      WHERE id = $1
      RETURNING *
    `;

    const updatedExam = await db.queryOne(updateQuery, [id]);

    res.json({
      success: true,
      message: 'Exam deactivated successfully',
      data: {
        id: updatedExam.id,
        title: updatedExam.title,
        is_active: updatedExam.is_active,
        updated_at: updatedExam.updated_at
      }
    });

  } catch (error) {
    console.error('Error deactivating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};