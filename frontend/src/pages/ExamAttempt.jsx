import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, BookOpen, AlertCircle, CheckCircle2, Circle, Save, Send, Eye, EyeOff, Maximize, Minimize } from 'lucide-react';

// Mock database service for demo
const mockDatabaseService = {
  async getExamById(id) {
    return {
      "test_id": 1,
      "test_title": "Class 7-8 Math Quiz",
      "category_name": "Mathematics",
      "total_questions": 4,
      "total_marks": "12.00",
      "time_limit_minutes": 30,
      "passing_percentage": "60.00",
      "max_attempts": 1,
      "difficulty_summary": "Easy: 1, Medium: 2, Hard: 1",
      "is_active": true,
      "created_at": "2025-08-01T16:49:23.619Z"
    };
  },

  async getAllQuestions(id) {
    return {
      "success": true,
      "data": [
        {
          "id": 1,
          "test_id": 1,
          "question_text": "What is 15 × 8?",
          "options": ["110", "120", "130", "140"],
          "question_type": "single_choice",
          "correct_answers": [1],
          "marks": "2.00",
          "negative_marks": "0.50",
          "explanation": "15 × 8 = 120",
          "difficulty_level": "easy",
          "question_order": 1
        },
        {
          "id": 2,
          "test_id": 1,
          "question_text": "Which of the following are factors of 24?",
          "options": ["2", "3", "5", "6", "8", "12"],
          "question_type": "multiple_choice",
          "correct_answers": [0, 1, 3, 4, 5],
          "marks": "3.00",
          "negative_marks": "0.75",
          "explanation": "Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. From options: 2, 3, 6, 8, 12 are correct.",
          "difficulty_level": "medium",
          "question_order": 2
        },
        {
          "id": 3,
          "test_id": 1,
          "question_text": "Solve for x: 2x + 5 = 15",
          "options": ["x = 3", "x = 5", "x = 7", "x = 10"],
          "question_type": "single_choice",
          "correct_answers": [1],
          "marks": "5.00",
          "negative_marks": "1.25",
          "explanation": "2x + 5 = 15, so 2x = 10, therefore x = 5",
          "difficulty_level": "hard",
          "question_order": 3
        },
        {
          "id": 16,
          "test_id": 1,
          "question_text": "Select all prime numbers from the following:",
          "options": ["5", "6", "7", "8"],
          "question_type": "multiple_choice",
          "correct_answers": [0, 2],
          "marks": "2.00",
          "negative_marks": "1.00",
          "explanation": "5 and 7 are prime numbers. 6 and 8 are composite numbers.",
          "difficulty_level": "medium",
          "question_order": 4
        }
      ]
    };
  },

  async startExam(examId, studentId) {
    return { success: true, session_id: `session_${examId}_${studentId}_${Date.now()}` };
  },

  async saveAnswer(data) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, message: 'Answer saved' };
  },

  async submitExam(data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: 'Exam submitted successfully' };
  }
};

const ModernMCQExam = () => {
  // Mock exam ID for demo
  const id = "1";
  
  // Mock user data for demo
  const userData = {
    id: 4,
    name: "Lokesh Alli",
    email: "lokeshalli1807@gmail.com"
  };

  // State management
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const examContainerRef = useRef(null);

  // Initialize exam data
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const examData = await mockDatabaseService.getExamById(id);
        const questionsData = await mockDatabaseService.getAllQuestions(id);
        
        setExam(examData);
        setQuestions(questionsData.data || []);
        setTimeRemaining(examData.time_limit_minutes * 60); // Convert to seconds
        
        // Initialize answers object
        const initialAnswers = {};
        questionsData.data?.forEach(q => {
          initialAnswers[q.id] = q.question_type === 'multiple_choice' ? [] : null;
        });
        setAnswers(initialAnswers);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exam data:', error);
        setLoading(false);
      }
    };

    fetchExamData();
  }, [id]);

  // Start exam
  const startExam = async () => {
    try {
      const session = await mockDatabaseService.startExam(id, userData.id);
      setSessionId(session.session_id);
      setExamStarted(true);
      requestFullscreen();
    } catch (error) {
      console.error('Error starting exam:', error);
    }
  };

  // Timer functionality
  useEffect(() => {
    if (examStarted && timeRemaining > 0 && !examSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            submitExam(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [examStarted, timeRemaining, examSubmitted]);

  // Auto-save functionality (removed manual save - everything is auto-saved)
  useEffect(() => {
    if (examStarted && !examSubmitted) {
      autoSaveRef.current = setInterval(async () => {
        await saveAnswers();
      }, 10000); // Auto-save every 10 seconds
    }

    return () => clearInterval(autoSaveRef.current);
  }, [examStarted, examSubmitted, answers, markedForReview]);

  // Save answers function (always auto-save, no manual save needed)
  const saveAnswers = useCallback(async () => {
    setAutoSaving(true);
    
    try {
      await mockDatabaseService.saveAnswer({
        sessionId,
        examId: id,
        studentId: userData.id,
        answers: answers,
        markedForReview: Array.from(markedForReview),
        timestamp: new Date().toISOString()
      });
      
      setLastSaved(new Date());
      setAutoSaving(false);
      setTimeout(() => setLastSaved(null), 2000);
    } catch (error) {
      console.error('Error saving answers:', error);
      setAutoSaving(false);
    }
  }, [answers, markedForReview, sessionId, id, userData.id]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, optionIndex, questionType) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      
      if (questionType === 'multiple_choice') {
        const currentAnswers = newAnswers[questionId] || [];
        if (currentAnswers.includes(optionIndex)) {
          newAnswers[questionId] = currentAnswers.filter(idx => idx !== optionIndex);
        } else {
          newAnswers[questionId] = [...currentAnswers, optionIndex];
        }
      } else {
        newAnswers[questionId] = optionIndex;
      }
      
      return newAnswers;
    });
  };

  // Mark question for review
  const toggleMarkForReview = (questionId) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Save and next with automatic answer saving
  const saveAndNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Clear answer
  const clearAnswer = (questionId, questionType) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: questionType === 'multiple_choice' ? [] : null
    }));
  };

  // Navigation functions
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit exam with review dialog
  const submitExam = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      const unansweredCount = questions.length - answeredCount;
      const reviewCount = markedForReview.size;
      
      if (unansweredCount > 0 || reviewCount > 0) {
        setShowReviewDialog(true);
        return;
      }
      
      const confirmSubmit = window.confirm('Are you sure you want to submit the exam? You cannot change your answers after submission.');
      if (!confirmSubmit) return;
    }

    try {
      await mockDatabaseService.submitExam({
        sessionId,
        examId: id,
        studentId: userData.id,
        answers: answers,
        markedForReview: Array.from(markedForReview),
        timeSpent: (exam.time_limit_minutes * 60) - timeRemaining,
        submittedAt: new Date().toISOString(),
        isAutoSubmit
      });
      
      setExamSubmitted(true);
      clearInterval(timerRef.current);
      clearInterval(autoSaveRef.current);
      exitFullscreen();
      
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  // Force submit from review dialog
  const forceSubmit = () => {
    setShowReviewDialog(false);
    const confirmSubmit = window.confirm('You have unanswered questions or questions marked for review. Are you sure you want to submit?');
    if (confirmSubmit) {
      submitExam(true);
    }
  };

  // Fullscreen functionality
  const requestFullscreen = () => {
    if (examContainerRef.current?.requestFullscreen) {
      examContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Monitor tab switching and visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (examStarted && !examSubmitted && document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    };

    const handleBeforeUnload = (e) => {
      if (examStarted && !examSubmitted) {
        e.preventDefault();
        e.returnValue = 'Your exam progress will be lost. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examStarted, examSubmitted]);

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get question status with review marking
  const getQuestionStatus = (questionIndex) => {
    const question = questions[questionIndex];
    const answer = answers[question?.id];
    const isMarkedForReview = markedForReview.has(question?.id);
    
    if (isMarkedForReview) {
      return answer && (!Array.isArray(answer) || answer.length > 0) ? 'answered-review' : 'review';
    }
    
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      return 'unanswered';
    }
    return 'answered';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (examSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted Successfully!</h2>
          <p className="text-gray-600 mb-4">Your answers have been recorded. You will be redirected to the results page shortly.</p>
          <div className="animate-pulse text-blue-600">Redirecting...</div>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam?.test_title}</h1>
              <p className="text-gray-600">Category: {exam?.category_name}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Exam Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Questions:</span> {exam?.total_questions}</p>
                  <p><span className="font-medium">Total Marks:</span> {exam?.total_marks}</p>
                  <p><span className="font-medium">Time Limit:</span> {exam?.time_limit_minutes} minutes</p>
                  <p><span className="font-medium">Passing Percentage:</span> {exam?.passing_percentage}%</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Read all questions carefully before answering</li>
                  <li>• You can navigate between questions freely</li>
                  <li>• Your answers are auto-saved every 10 seconds</li>
                  <li>• Mark questions for review if needed</li>
                  <li>• Exam will auto-submit when time runs out</li>
                  <li>• Do not switch tabs or minimize the window</li>
                  <li>• Submit button appears on the last question</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={startExam}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const isCurrentMarkedForReview = markedForReview.has(currentQuestion?.id);
  const answeredCount = Object.values(answers).filter(answer => 
    answer !== null && answer !== undefined && 
    (!Array.isArray(answer) || answer.length > 0)
  ).length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div ref={examContainerRef} className="min-h-screen bg-gray-50">
      {/* Warning Banner */}
      {showWarning && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">
              Warning: Tab switching detected! ({tabSwitchCount} times) - This may affect your exam score.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`bg-white shadow-sm border-b ${showWarning ? 'mt-16' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">{exam?.test_title}</h1>
              <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-save status */}
              {autoSaving && (
                <div className="flex items-center text-blue-600 text-sm">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                  Auto-saving...
                </div>
              )}
              
              {lastSaved && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Auto-saved
                </div>
              )}

              {/* Timer */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                timeRemaining <= 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>

              {/* Fullscreen toggle */}
              <button
                onClick={isFullscreen ? exitFullscreen : requestFullscreen}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                    Question {currentQuestionIndex + 1}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    currentQuestion?.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                    currentQuestion?.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentQuestion?.difficulty_level?.charAt(0).toUpperCase() + currentQuestion?.difficulty_level?.slice(1)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {currentQuestion?.marks} marks
                    {currentQuestion?.negative_marks > 0 && ` • -${currentQuestion.negative_marks} for wrong answer`}
                  </span>
                  {isCurrentMarkedForReview && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                      Marked for Review
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500">
                    {currentQuestion?.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Single Choice'}
                  </div>
                  <button
                    onClick={() => toggleMarkForReview(currentQuestion?.id)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      isCurrentMarkedForReview
                        ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isCurrentMarkedForReview ? '★ Marked' : '☆ Mark for Review'}
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                  {currentQuestion?.question_text}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion?.options.map((option, index) => {
                  const isSelected = currentQuestion.question_type === 'multiple_choice' 
                    ? (currentAnswer || []).includes(index)
                    : currentAnswer === index;

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index, currentQuestion.question_type)}
                    >
                      <div className="flex items-center">
                        {currentQuestion.question_type === 'multiple_choice' ? (
                          <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded"></div>}
                          </div>
                        ) : (
                          <div className={`w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center ${
                            isSelected ? 'border-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                          </div>
                        )}
                        <span className={`select-none ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                          {option}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3 mb-6">
                <button
                  onClick={() => clearAnswer(currentQuestion?.id, currentQuestion?.question_type)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
                >
                  Clear Answer
                </button>
                
                <button
                  onClick={() => toggleMarkForReview(currentQuestion?.id)}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    isCurrentMarkedForReview
                      ? 'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {isCurrentMarkedForReview ? 'Remove Review Mark' : 'Mark for Review'}
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-3">
                  {/* Submit button only on last question */}
                  {isLastQuestion ? (
                    <button
                      onClick={() => submitExam()}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Exam
                    </button>
                  ) : (
                    <button
                      onClick={saveAndNext}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save & Next
                    </button>
                  )}
                </div>

                <button
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLastQuestion ? 'Review' : 'Next'}
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
              
              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{answeredCount}/{questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-8 h-8 rounded text-xs font-medium transition-all relative ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                          : status === 'answered'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : status === 'answered-review'
                          ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          : status === 'review'
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                      {(status === 'review' || status === 'answered-review') && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-100 rounded mr-2 relative">
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-600">Answered + Review</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-100 rounded mr-2 relative">
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-600">Review Later</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 rounded mr-2"></div>
                  <span className="text-gray-600">Not Attempted</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                  <span className="text-gray-600">Current</span>
                </div>
              </div>
              <div >
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 rounded mr-2"></div>
                  <span className="text-gray-600">Not Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                  <span className="text-gray-600">Current</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-medium text-green-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marked for Review:</span>
                  <span className="font-medium text-orange-600">{markedForReview.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Not Attempted:</span>
                  <span className="font-medium text-gray-600">{questions.length - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Left:</span>
                  <span className={`font-medium ${timeRemaining <= 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      {showReviewDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Before Submit</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-medium text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Not Attempted:</span>
                <span className="font-medium text-red-600">{questions.length - answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <span className="font-medium text-orange-600">{markedForReview.size}</span>
              </div>
            </div>

            {(questions.length - answeredCount > 0 || markedForReview.size > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm">
                  {questions.length - answeredCount > 0 && `You have ${questions.length - answeredCount} unanswered questions. `}
                  {markedForReview.size > 0 && `You have ${markedForReview.size} questions marked for review. `}
                  Do you want to review them before submitting?
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowReviewDialog(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Exam
              </button>
              <button
                onClick={forceSubmit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernMCQExam;