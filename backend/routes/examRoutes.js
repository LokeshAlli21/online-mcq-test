import express from 'express';
import { createExam, getAllStudentExams, getExamById, updateExam, deleteExam ,getAllStudentExamAttempts } from '../controllers/examController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

router.post('/', protect, createExam);
router.get('/get-all-student-exams/:studentId', protect, getAllStudentExams);
router.get('/get-all-student-exam-attempts/:studentId', protect, getAllStudentExamAttempts);
router.get('/:id', protect, getExamById);
router.put('/:id', protect, updateExam);
router.delete('/:id', protect, deleteExam);

export default router;