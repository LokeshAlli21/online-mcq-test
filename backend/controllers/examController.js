// examController.js
import db from '../database/dbClient.js';

export const createExam = async (req, res) => {
  // try {
  //   const { title, description, date } = req.body;
  //   const newExam = await db.query('INSERT INTO exams (title, description, date) VALUES ($1, $2, $3) RETURNING *', [title, description, date]);
  //   res.status(201).json(newExam.rows[0]);
  // } catch (error) {
  //   console.error('Error creating exam:', error);
  //   res.status(500).json({ message: 'Internal server error' });
  // }
}

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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export const getExamById = async (req, res) => {
  // try {
  //   const { id } = req.params;
  //   const exam = await db.query('SELECT * FROM exams WHERE id = $1', [id]);
  //   if (exam.rows.length === 0) {
  //     return res.status(404).json({ message: 'Exam not found' });
  //   }
  //   res.status(200).json(exam.rows[0]);
  // } catch (error) {
  //   console.error('Error fetching exam:', error);
  //   res.status(500).json({ message: 'Internal server error' });
  // }
}

export const updateExam = async (req, res) => {
  // try {
  //   const { id } = req.params;
  //   const { title, description, date } = req.body;
  //   const updatedExam = await db.query('UPDATE exams SET title = $1, description = $2, date = $3 WHERE id = $4 RETURNING *', [title, description, date, id]);
  //   if (updatedExam.rows.length === 0) {
  //     return res.status(404).json({ message: 'Exam not found' });
  //   }
  //   res.status(200).json(updatedExam.rows[0]);
  // } catch (error) {
  //   console.error('Error updating exam:', error);
  //   res.status(500).json({ message: 'Internal server error' });
  // }
}

export const deleteExam = async (req, res) => {
  // try {
  //   const { id } = req.params;
  //   const deletedExam = await db.query('DELETE FROM exams WHERE id = $1 RETURNING *', [id]);
  //   if (deletedExam.rows.length === 0) {
  //     return res.status(404).json({ message: 'Exam not found' });
  //   }
  //   res.status(204).send();
  // } catch (error) {
  //   console.error('Error deleting exam:', error);
  //   res.status(500).json({ message: 'Internal server error' });
  // }
}
