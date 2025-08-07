import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Save, X, AlertCircle, Edit3, Trash2, Eye, ChevronRight, 
  Clock, Target, HelpCircle, Star, Award, Loader2, ChevronDown,
  Lightbulb, Search, ArrowLeft, CheckCircle2, MoreVertical
} from 'lucide-react';
import databaseService from '../backend-services/database/database';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Button = ({ variant = 'primary', size = 'md', loading, children, className = '', navigateTo, ...props }) => {
  const navigate = useNavigate();
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-100 text-gray-600'
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2', lg: 'px-6 py-3 text-lg' };
  
  return (
    <button 
      onClick={navigateTo ? () => navigate(navigateTo) : props.onClick}
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};

const Input = ({ label, error, icon: Icon, viewOnly=false, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {Icon && <Icon size={16} />}
        {label}
      </label>
    )}
    <input 
      disabled={viewOnly}
      className={`w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
        error ? 'border-red-300' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} />{error}</p>}
  </div>
);

const TextArea = ({ label, error, viewOnly=false, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <textarea 
      disabled={viewOnly}
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none ${
        error ? 'border-red-300' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} />{error}</p>}
  </div>
);

const Select = ({ label, options, viewOnly=false, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <select 
      disabled={viewOnly}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      {...props}
    >
      {options.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  </div>
);

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
};

const QuestionCard = ({ question, index, onEdit, onDelete, onView }) => {
  const [showActions, setShowActions] = useState(false);
  
  const difficultyColors = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100'
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
              Q{index + 1}
            </span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${difficultyColors[question.difficulty_level]}`}>
              {question.difficulty_level}
            </span>
            <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-sm font-medium">
              {question.marks} pts
            </span>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-2">{question.question_text}</h3>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            {question.options?.map((option, idx) => (
              <div 
                key={idx}
                className={`p-2 rounded text-sm border ${
                  question.correct_answers?.includes(idx) 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
              </div>
            ))}
          </div>

          {question.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <div className="flex items-start gap-2">
                <Lightbulb size={14} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-700">Explanation</p>
                  <p className="text-sm text-blue-600">{question.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
              <button onClick={() => { onView(question); setShowActions(false); }} 
                      className="w-full px-3 py-1 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                <Eye size={12} /> View
              </button>
              <button onClick={() => { onEdit(question); setShowActions(false); }} 
                      className="w-full px-3 py-1 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                <Edit3 size={12} /> Edit
              </button>
              <button onClick={() => { onDelete(question.id); setShowActions(false); }} 
                      className="w-full px-3 py-1 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionModal = ({ isOpen, onClose, question, onSave, loading, viewOnly }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    options: ['', '', '', ''],
    question_type: 'single_choice',
    correct_answers: [],
    marks: 1,
    negative_marks: 0,
    explanation: '',
    difficulty_level: 'medium'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (question) {
      setFormData(question);
    } else {
      setFormData({
        question_text: '',
        options: ['', '', '', ''],
        question_type: 'single_choice',
        correct_answers: [],
        marks: 1,
        negative_marks: 0,
        explanation: '',
        difficulty_level: 'medium'
      });
    }
  }, [question, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.question_text.trim()) newErrors.question_text = 'Question text required';
    if (formData.options.filter(opt => opt.trim()).length < 2) newErrors.options = 'At least 2 options required';
    if (!formData.correct_answers.length) newErrors.correct_answers = 'Select correct answer(s)';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    updateField('options', newOptions);
  };

  const toggleCorrectAnswer = (index) => {
    if (formData.question_type === 'single_choice') {
      updateField('correct_answers', [index]);
    } else {
      const current = formData.correct_answers;
      const newAnswers = current.includes(index) 
        ? current.filter(i => i !== index)
        : [...current, index];
      updateField('correct_answers', newAnswers);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{viewOnly ? 'View Question' : question ? 'Edit Question' : 'Add Question'}</h2>
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <TextArea
            viewOnly={viewOnly}
            label="Question Text"
            value={formData.question_text}
            onChange={(e) => updateField('question_text', e.target.value)}
            error={errors.question_text}
            rows={3}
            placeholder="Enter your question..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              viewOnly={viewOnly}
              value={formData.question_type}
              onChange={(e) => updateField('question_type', e.target.value)}
              options={[
                { value: 'single_choice', label: 'Single Choice' },
                { value: 'multiple_choice', label: 'Multiple Choice' }
              ]}
            />

            <Select
              label="Difficulty"
              viewOnly={viewOnly}
              value={formData.difficulty_level}
              onChange={(e) => updateField('difficulty_level', e.target.value)}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' }
              ]}
            />

            <Input
              label="Marks"
              type="number"
              viewOnly={viewOnly}
              value={formData.marks}
              onChange={(e) => updateField('marks', +e.target.value)}
              min="0"
              step="0.5"
            />

            <Input
              label="Negative Marks"
              type="number"
              viewOnly={viewOnly}
              value={formData.negative_marks}
              onChange={(e) => updateField('negative_marks', +e.target.value)}
              min="0"
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type={formData.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                    name="correct"
                    disabled={viewOnly}
                    checked={formData.correct_answers.includes(index)}
                    onChange={() => toggleCorrectAnswer(index)}
                  />
                  <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    type="text"
                    value={option}
                    disabled={viewOnly}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
            {errors.options && <p className="text-sm text-red-600 mt-1">{errors.options}</p>}
            {errors.correct_answers && <p className="text-sm text-red-600 mt-1">{errors.correct_answers}</p>}
          </div>

          <TextArea
            label="Explanation (Optional)"
            viewOnly={viewOnly}
            value={formData.explanation}
            onChange={(e) => updateField('explanation', e.target.value)}
            rows={2}
            placeholder="Explain the correct answer..."
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} loading={loading} disabled={viewOnly}>
              <Save size={16} />
              {question ? 'Update' : 'Add'} Question
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddQuestions = () => {
  const navigate = useNavigate();
  const {id: examId} = useParams()
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examResponse, questionsResponse] = await Promise.all([
          databaseService.getExamById(examId),
          databaseService.getQuestionsByTestId(examId)
        ]);
        setExamData(examResponse.data);
        setQuestions(questionsResponse?.data || []);
        console.log('questions', questionsResponse);
      } catch (error) {
        showToast('error', 'Failed to load data');
      }
    };
    fetchData();
  }, [examId]);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.filter(q => {
      const matchesSearch = q?.question_text?.toLowerCase().includes(searchTerm?.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'all' || q.difficulty_level === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [questions, searchTerm, difficultyFilter]);

  const handleSaveQuestion = async (formData) => {
    setLoading(true);
    try {
      const questionData = { ...formData, test_id: examId };
      
      if (editingQuestion) {
        await databaseService.updateQuestion(editingQuestion.id, questionData);
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...questionData } : q));
        showToast('success', 'Question updated successfully');
      } else {
        const newQuestion = await databaseService.addNewQuestion(questionData);
        // console.log('New Question Added:', newQuestion?.data);
        // console.log('New Question Data:', questionData);
        setQuestions(prev => [...prev, newQuestion?.data]);
        showToast('success', 'Question added successfully');
      }
      
      setShowModal(false);
      setViewOnly(false);
      setEditingQuestion(null);
    } catch (error) {
      showToast('error', 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Delete this question?')) return;
    // for now delete is not allowed temporarily
    showToast('info', 'Delete functionality is temporarily disabled');
    return;
    
    try {
      await databaseService.deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      showToast('success', 'Question deleted');
    } catch (error) {
      showToast('error', 'Failed to delete question');
    }
  };

  const totalMarks = Array.isArray(questions) 
    ? questions.reduce((sum, q) => {
        const marks = Number(q.marks);
        return sum + (isNaN(marks) ? 0 : marks);
      }, 0)
    : 0;

  console.log('totalMarks', totalMarks);

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 mt-1 sm:mt-0">
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{examData?.title || 'Loading...'}</h1>
                <p className="text-gray-600 text-sm md:text-base truncate">{examData?.description || 'Manage Questions'}</p>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded-full">{questions.length} Questions</span>
                  <span className="bg-gray-100 px-2 py-1 rounded-full">{totalMarks} Total Marks</span>
                  {examData?.time_limit_minutes && <span className="bg-gray-100 px-2 py-1 rounded-full">{examData.time_limit_minutes} mins</span>}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowModal(true)} 
              className="w-full sm:w-auto flex-shrink-0"
            >
              <Plus size={16} className="mr-1 sm:mr-2" /> 
              <span className="hidden xs:inline">Add Question</span>
              <span className="xs:hidden">Add</span>
            </Button>
          </div>
        </div>


        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600 mb-6">
                {questions.length === 0 
                  ? 'Start by adding your first question'
                  : 'Try adjusting your search or filters'
                }
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add Question
              </Button>
            </div>
          ) : (
            filteredQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onEdit={(q) => { setEditingQuestion(q); setShowModal(true); }}
                onDelete={handleDeleteQuestion}
                onView={(q) => { setEditingQuestion(q); setShowModal(true); setViewOnly(true); }}
              />
            ))
          )}
        </div>

        {/* Finish Section */}
        {questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            {/* <h3 className="text-lg font-semibold mb-2">Ready to publish?</h3> */}
            <p className="text-gray-600 mb-4">
              {questions.length} questions • {totalMarks} total marks
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" navigateTo={-1}>Go Back</Button>
              {/* <Button variant="success">
                <Award size={16} /> Publish Exam
              </Button> */}
            </div>
          </div>
        )}
      </div>

      <QuestionModal
        isOpen={showModal}
        viewOnly={viewOnly}
        onClose={() => { setShowModal(false); setEditingQuestion(null); setViewOnly(false); }}
        question={editingQuestion}
        onSave={handleSaveQuestion}
        loading={loading}
      />
    </div>
  );
};

export default AddQuestions;