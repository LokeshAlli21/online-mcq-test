import express from 'express';
import { createExam, 
    getAllStudentExams, 
    getExamById, 
    updateExam, 
    deleteExam,
    getAllStudentExamAttempts, 
    getAllExams, 
    getAllCategories,
    createCategory, 
    addNewQuestion, 
    getQuestionsByTestId,
    updateQuestion,
    deleteQuestion,
    getQuestionsForExam,
} from '../controllers/examController.js';
import { protect } from '../middlewares/protect.js';

const router = express.Router();

router.get('/get-all-student-exams/:studentId', protect, getAllStudentExams);
router.get('/get-all-student-exam-attempts/:studentId', protect, getAllStudentExamAttempts);
router.get('/admin/get-all-exams', protect, getAllExams);
router.get('/admin/get-exam-by-id/:id', protect, getExamById);
router.get('/admin/get-all-categories', protect, getAllCategories);
router.post('/admin/create-category', protect, createCategory);
router.post('/admin/create-exam', protect, createExam);
router.post('/admin/add-new-question', protect, addNewQuestion);
router.put('/admin/update-question/:id', protect, updateQuestion);
router.delete('/admin/delete-question/:id', protect, deleteQuestion);
router.get('/admin/get-questions-by-test-id/:testId', protect, getQuestionsByTestId);
router.post('/get-all-questions', protect, getQuestionsForExam);
router.get('/:id', protect, getExamById);
router.put('/admin/update-exam/:id', protect, updateExam);
router.delete('/admin/delete-exam/:id', protect, deleteExam);

export default router;