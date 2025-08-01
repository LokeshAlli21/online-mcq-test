import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import databaseService from '../backend-services/database/database';
import { 
  Clock, 
  BookOpen, 
  Award, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Target,
  TrendingUp,
  Users,
  FileText,
  Play,
  Zap,
  Star,
  ArrowRight,
  Timer,
  Trophy,
  Brain,
  ChevronRight
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

function StudentPage() {
  const userData = useSelector((state) => state.auth.userData);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    const getAllStudentExamsAndAttempts = async (studentId) => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading delay
        const [examsResponse, attemptsResponse] = await Promise.all([
          databaseService.getAllStudentExams(studentId),
          databaseService.getAllStudentExamAttempts(studentId)
        ]);
        console.log('Exams Response:', examsResponse);
        console.log('Attempts Response:', attemptsResponse);
        if (examsResponse.success) {
          setExams(examsResponse.exams || []);
        }
        
        if (attemptsResponse.success) {
          setAttempts(attemptsResponse.attempts || []);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.user_type === 'student' && userData?.id) {
      getAllStudentExamsAndAttempts(userData.id);
    }
  }, [userData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Easy': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'Medium': 'text-amber-600 bg-amber-50 border-amber-200',
      'Hard': 'text-rose-600 bg-rose-50 border-rose-200'
    };
    return colors[difficulty] || 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 85) return 'text-emerald-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const ExamCard = ({ exam }) => {
    const attemptCount = attempts.filter(attempt => attempt.test_id === exam.test_id).length;
    const canAttempt = attemptCount < exam.max_attempts;
    
    return (
      <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
        {/* Gradient border on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-full w-full rounded-2xl bg-white"></div>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {exam.test_title}
                  </h3>
                  <p className="text-sm text-slate-500">{exam.category_name}</p>
                </div>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              exam.is_active 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-100 text-rose-700 border border-rose-200'
            }`}>
              {exam.is_active ? '● Live' : '● Inactive'}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Questions</p>
                  <p className="text-lg font-bold text-slate-900">{exam.total_questions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Marks</p>
                  <p className="text-lg font-bold text-slate-900">{exam.total_marks}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Timer className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Duration</p>
                  <p className="text-lg font-bold text-slate-900">{exam.time_limit_minutes}m</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pass %</p>
                  <p className="text-lg font-bold text-slate-900">{exam.passing_percentage}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty Pills */}
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Difficulty Mix</p>
            <div className="flex flex-wrap gap-2">
              {exam.difficulty_summary.split(', ').map((diff, index) => {
                const [level, count] = diff.split(': ');
                return (
                  <span key={index} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getDifficultyColor(level)}`}>
                    {level} • {count}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(Math.min(attemptCount, 3))].map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{i + 1}</span>
                  </div>
                ))}
                {attemptCount > 3 && (
                  <div className="w-6 h-6 bg-slate-400 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white">+</span>
                  </div>
                )}
              </div>
              <span className="text-sm text-slate-600 ml-2">
                {attemptCount}/{exam.max_attempts} attempts
              </span>
            </div>
            
            <button 
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 ${
                canAttempt && exam.is_active 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
              disabled={!canAttempt || !exam.is_active}
            >
              {canAttempt ? (
                <>
                  <Zap className="w-4 h-4" />
                  Start Exam
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Limit Reached
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AttemptCard = ({ attempt }) => {
    const exam = exams.find(e => e.test_id === attempt.test_id);
    const percentage = parseFloat(attempt.percentage_score);
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${attempt.is_passed ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              {attempt.is_passed ? (
                <Trophy className="w-6 h-6 text-emerald-600" />
              ) : (
                <Brain className="w-6 h-6 text-rose-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {exam?.test_title || `Test ID: ${attempt.test_id}`}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Attempt #{attempt.attempt_number}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(attempt.completed_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 ${
            attempt.is_passed 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-100 text-rose-700 border border-rose-200'
          }`}>
            {attempt.is_passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {attempt.is_passed ? 'Passed' : 'Failed'}
          </div>
        </div>

        {/* Score Showcase */}
        <div className="mb-6">
          <div className="relative">
            <div className="flex items-center justify-center mb-4">
              <div className={`text-6xl font-black ${getScoreColor(percentage)}`}>
                {percentage}
                <span className="text-2xl">%</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  percentage >= 85 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                  percentage >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                  percentage >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                  'bg-gradient-to-r from-rose-400 to-rose-600'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {attempt.marks_obtained}
            </div>
            <div className="text-xs font-medium text-blue-700 mb-1">of {attempt.total_marks}</div>
            <div className="text-xs text-blue-500">Marks Scored</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {attempt.correct_answers}
            </div>
            <div className="text-xs font-medium text-emerald-700 mb-1">out of {attempt.total_questions}</div>
            <div className="text-xs text-emerald-500">Correct</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {attempt.time_taken_minutes}
            </div>
            <div className="text-xs font-medium text-purple-700 mb-1">minutes</div>
            <div className="text-xs text-purple-500">Time Taken</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
            <div className="text-2xl font-bold text-amber-600 mb-1">
              {attempt.partial_credit_answers}
            </div>
            <div className="text-xs font-medium text-amber-700 mb-1">partial</div>
            <div className="text-xs text-amber-500">Credits</div>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-600">Wrong</span>
            <span className="font-bold text-rose-600">{attempt.wrong_answers}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-600">Skipped</span>
            <span className="font-bold text-slate-600">{attempt.unanswered_questions}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-600">Review</span>
            <span className="font-bold text-amber-600">{attempt.marked_for_review_questions}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(attempt => attempt.is_passed).length;
  const averageScore = totalAttempts > 0 
    ? (attempts.reduce((sum, attempt) => sum + parseFloat(attempt.percentage_score), 0) / totalAttempts).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Animated Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&#34;60&#34; height=&#34;60&#34; viewBox=&#34;0 0 60 60&#34; xmlns=&#34;http://www.w3.org/2000/svg&#34;%3E%3Cg fill=&#34;none&#34; fill-rule=&#34;evenodd&#34;%3E%3Cg fill=&#34;%23ffffff&#34; fill-opacity=&#34;0.1&#34;%3E%3Ccircle cx=&#34;30&#34; cy=&#34;30&#34; r=&#34;4&#34;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black">Learning Hub</h1>
                  <p className="text-blue-100 text-lg">Welcome back, {userData?.name || 'Student'}! 🚀</p>
                </div>
              </div>
              <p className="text-blue-100 max-w-lg">Track your progress, take new challenges, and master your subjects with our intelligent assessment platform.</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                <div className="text-3xl font-black text-white mb-2">{exams.length}</div>
                <div className="text-blue-100 text-sm font-medium">Available</div>
                <div className="text-blue-200 text-xs">Exams</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                <div className="text-3xl font-black text-white mb-2">{passedAttempts}</div>
                <div className="text-blue-100 text-sm font-medium">Passed</div>
                <div className="text-blue-200 text-xs">Tests</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                <div className="text-3xl font-black text-white mb-2">{averageScore}%</div>
                <div className="text-blue-100 text-sm font-medium">Average</div>
                <div className="text-blue-200 text-xs">Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 z-10 relative">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'available'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-5 h-5" />
              Available Exams
              <span className="bg-white/20 px-2 py-1 rounded-lg text-sm font-bold">
                {exams.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              My Progress
              <span className="bg-white/20 px-2 py-1 rounded-lg text-sm font-bold">
                {totalAttempts}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'available' ? (
          <div>
            {exams.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {exams.map((exam) => (
                  <ExamCard key={exam.test_id} exam={exam} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl mx-auto flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No Exams Available</h3>
                <p className="text-slate-600 max-w-md mx-auto">New challenges are being prepared for you. Check back soon for exciting assessments!</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {attempts.length > 0 ? (
              <div className="grid gap-8">
                {attempts
                  .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                  .map((attempt) => (
                    <AttemptCard key={attempt.id} attempt={attempt} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl mx-auto flex items-center justify-center">
                    <TrendingUp className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Your Journey Starts Here</h3>
                <p className="text-slate-600 max-w-md mx-auto">Take your first exam to see your progress and performance analytics appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentPage;