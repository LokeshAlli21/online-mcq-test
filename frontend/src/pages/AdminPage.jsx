import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  BarChart3, 
  BookOpen, 
  Clock, 
  Target, 
  Award,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  TrendingUp,
  Calendar,
  Settings,
  ChevronRight,
  Zap,
  Globe,
  Menu,
  X,
  MoreVertical
} from 'lucide-react';
import databaseService from '../backend-services/database/database';

function AdminPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getAllExams();
      console.log("Fetched exams:", data);
      setExams(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setError("Failed to load exams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId, examTitle) => {
    if (window.confirm(`Are you sure you want to delete "${examTitle}"?`)) {
      try {
        await databaseService.deleteExam(examId);
        setExams(exams.filter(exam => exam.id !== examId));
      } catch (error) {
        console.error("Error deleting exam:", error);
        alert("Failed to delete exam. Please try again.");
      }
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || 
      (filterCategory === 'active' && exam.is_active) ||
      (filterCategory === 'inactive' && !exam.is_active);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive) => (
    <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
      isActive 
        ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 ring-1 ring-emerald-200' 
        : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 ring-1 ring-red-200'
    }`}>
      <div className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className="hidden sm:inline">{isActive ? 'Active' : 'Inactive'}</span>
      <span className="sm:hidden">{isActive ? 'On' : 'Off'}</span>
    </div>
  );

  const quickActionCards = [
    {
      id: 'create',
      title: 'Create Exam',
      description: 'Design new assessments',
      shortDesc: 'New Exam',
      icon: Plus,
      gradient: 'from-blue-600 via-blue-700 to-indigo-700',
      hoverGradient: 'from-blue-500 via-blue-600 to-indigo-600',
      route: '/admin/create-exam',
      stats: 'Quick Setup'
    },
    {
      id: 'students',
      title: 'Manage Students',
      description: 'View and organize learners',
      shortDesc: 'Students',
      icon: Users,
      gradient: 'from-emerald-600 via-green-600 to-teal-600',
      hoverGradient: 'from-emerald-500 via-green-500 to-teal-500',
      route: '/admin/manage-students',
      stats: `${Math.floor(Math.random() * 500) + 100}+ Students`
    },
    {
      id: 'analytics',
      title: 'Analytics Hub',
      description: 'Performance insights & trends',
      shortDesc: 'Analytics',
      icon: BarChart3,
      gradient: 'from-purple-600 via-violet-600 to-indigo-600',
      hoverGradient: 'from-purple-500 via-violet-500 to-indigo-500',
      route: '/admin/analytics',
      stats: 'Real-time Data'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-transparent border-t-indigo-400 animate-spin mx-auto" style={{animationDelay: '0.15s', animationDuration: '1s'}}></div>
          </div>
          <p className="mt-4 sm:mt-6 text-slate-600 font-medium text-sm sm:text-base">Loading your dashboard...</p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile-Optimized Glassmorphism Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="flex items-center justify-between">
              {/* Mobile-friendly title */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent truncate">
                  Admin Dashboard
                </h1>
                <p className="mt-1 sm:mt-3 text-slate-600 font-medium text-sm sm:text-base hidden sm:block">
                  Orchestrate your educational ecosystem with precision
                </p>
                <p className="mt-1 text-slate-600 font-medium text-xs sm:hidden">
                  Manage your platform
                </p>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3 ml-4">
                <div className="hidden sm:flex px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-blue-700">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Live</span>
                  </div>
                </div>
                <button className="p-2 sm:p-3 bg-white/60 hover:bg-white/80 rounded-xl border border-white/40 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/10">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Responsive Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 lg:mb-12">
          {quickActionCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate(card.route)}
                className="group relative overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${hoveredCard === card.id ? card.hoverGradient : card.gradient} rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl transition-all duration-300`} />
                
                {/* Animated background elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl sm:rounded-2xl" />
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-20 h-20 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                
                <div className="relative p-4 sm:p-6 lg:p-8 text-white">
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 lg:p-4 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                    </div>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">
                      <span className="sm:hidden">{card.shortDesc}</span>
                      <span className="hidden sm:inline">{card.title}</span>
                    </h3>
                    <p className="text-white/80 mb-2 sm:mb-4 font-medium text-sm sm:text-base hidden sm:block">
                      {card.description}
                    </p>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-semibold">{card.stats}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile-Responsive Exams Section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl shadow-blue-500/10 border border-white/40 overflow-hidden">
          {/* Mobile-optimized header */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border-b border-white/30">
            <div className="flex flex-col space-y-4 sm:space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                    <span className="sm:hidden">Exams</span>
                    <span className="hidden sm:inline">Examination Suite</span>
                  </h2>
                  <p className="text-slate-600 font-medium text-sm sm:text-base">
                    {filteredExams.length} active assessments
                  </p>
                </div>
              </div>
              
              {/* Mobile-optimized search and filter */}
              <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
                <div className="relative group">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 sm:pl-12 pr-4 outline-none py-2 sm:py-3 w-full lg:w-64 xl:w-80 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 placeholder-slate-400 font-medium shadow-lg shadow-blue-500/5 text-sm sm:text-base"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <div className="relative group flex-1 lg:flex-none">
                    <Filter className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="pl-10 sm:pl-12 pr-8 sm:pr-10 outline-none py-2 sm:py-3 w-full bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 appearance-none font-medium shadow-lg shadow-blue-500/5 cursor-pointer text-sm sm:text-base"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  {/* View mode toggle for tablet/desktop */}
                  <div className="hidden md:flex bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        viewMode === 'table' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      Table
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        viewMode === 'cards' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      Cards
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-6 sm:p-8 lg:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Connection Issue</h3>
              <p className="text-red-600 mb-6 font-medium text-sm sm:text-base">{error}</p>
              <button
                onClick={fetchExams}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
              >
                Reconnect
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-8 sm:p-12 lg:p-16 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">
                {exams.length === 0 ? 'Welcome to Your Exam Hub' : 'No Matching Results'}
              </h3>
              <p className="text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto font-medium text-sm sm:text-base">
                {exams.length === 0 
                  ? 'Ready to create your first assessment? Let\'s build something amazing together.' 
                  : 'Try adjusting your search criteria or explore all available exams.'
                }
              </p>
              {exams.length === 0 && (
                <button
                  onClick={() => navigate('/admin/create-exam')}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 text-sm sm:text-base"
                >
                  Create Your First Exam
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards View (default on mobile) */}
              <div className="block lg:hidden">
                <div className="p-4 space-y-4">
                  {filteredExams.map((exam, index) => (
                    <div 
                      key={exam.id}
                      className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 p-4 shadow-lg"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                            <BookOpen className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{exam.title}</h4>
                            <div className="flex items-center space-x-1 mt-1">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              <span className="text-xs text-slate-600">
                                {formatDate(exam.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(exam.is_active)}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-blue-600 font-semibold">{exam.total_questions}</div>
                          <div className="text-xs text-slate-600">Questions</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-emerald-600 font-semibold">{exam.total_marks}</div>
                          <div className="text-xs text-slate-600">Points</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-orange-600 font-semibold">{exam.time_limit_minutes}m</div>
                          <div className="text-xs text-slate-600">Duration</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-600">
                          Classes: {exam.target_classes?.join(', ') || 'All'}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => navigate(`/admin/exam/${exam.id}/view`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/exam/${exam.id}/edit`)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm">
                        <th className="px-6 xl:px-8 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-slate-700 uppercase tracking-wider">
                          Assessment Details
                        </th>
                        <th className="px-6 xl:px-8 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-slate-700 uppercase tracking-wider">
                          Configuration
                        </th>
                        <th className="px-6 xl:px-8 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-slate-700 uppercase tracking-wider">
                          Targeting
                        </th>
                        <th className="px-6 xl:px-8 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-slate-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 xl:px-8 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-slate-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                      {filteredExams.map((exam, index) => (
                        <tr 
                          key={exam.id} 
                          className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300"
                          style={{animationDelay: `${index * 0.1}s`}}
                        >
                          <td className="px-6 xl:px-8 py-4 xl:py-6">
                            <div className="flex items-start space-x-3 xl:space-x-4">
                              <div className="p-2 xl:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <BookOpen className="h-4 w-4 xl:h-5 xl:w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm xl:text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors truncate">
                                  {exam.title}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1 xl:mt-2">
                                  <Calendar className="h-3 w-3 xl:h-4 xl:w-4 text-slate-500" />
                                  <span className="text-xs xl:text-sm text-slate-600 font-medium">
                                    Created {formatDate(exam.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 xl:px-8 py-4 xl:py-6">
                            <div className="grid grid-cols-1 gap-2 xl:gap-3">
                              <div className="flex items-center space-x-2 xl:space-x-3 p-2 xl:p-3 bg-white/60 rounded-xl">
                                <BookOpen className="h-3 w-3 xl:h-4 xl:w-4 text-blue-600" />
                                <span className="text-xs xl:text-sm font-semibold text-slate-700">
                                  {exam.total_questions} Questions
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 xl:space-x-3 p-2 xl:p-3 bg-white/60 rounded-xl">
                                <Award className="h-3 w-3 xl:h-4 xl:w-4 text-emerald-600" />
                                <span className="text-xs xl:text-sm font-semibold text-slate-700">
                                  {exam.total_marks} Points
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 xl:space-x-3 p-2 xl:p-3 bg-white/60 rounded-xl">
                                <Clock className="h-3 w-3 xl:h-4 xl:w-4 text-orange-600" />
                                <span className="text-xs xl:text-sm font-semibold text-slate-700">
                                  {exam.time_limit_minutes}m Duration
                                </span>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 xl:px-8 py-4 xl:py-6">
                            <div className="space-y-2 xl:space-y-3">
                              <div className="flex items-center space-x-2 xl:space-x-3 p-2 xl:p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                                <Target className="h-3 w-3 xl:h-4 xl:w-4 text-purple-600" />
                                <span className="text-xs xl:text-sm font-semibold text-slate-700 truncate">
                                  Classes: {exam.target_classes?.join(', ') || 'All'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-xs text-slate-600 bg-white/60 px-2 xl:px-3 py-1 xl:py-2 rounded-lg font-medium text-center">
                                  Max: {exam.max_attempts}x
                                </div>
                                <div className="text-xs text-slate-600 bg-white/60 px-2 xl:px-3 py-1 xl:py-2 rounded-lg font-medium text-center">
                                  Pass: {exam.passing_percentage}%
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 xl:px-8 py-4 xl:py-6">
                            {getStatusBadge(exam.is_active)}
                          </td>
                          
                          <td className="px-6 xl:px-8 py-4 xl:py-6">
                            <div className="flex items-center space-x-1 xl:space-x-2">
                              <button
                                onClick={() => navigate(`/admin/exam/${exam.id}`)}
                                className="p-2 xl:p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg shadow-blue-500/10"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 xl:h-5 xl:w-5" />
                              </button>
                              <button
                                onClick={() => navigate(`/admin/exam/${exam.id}/edit`)}
                                className="p-2 xl:p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg shadow-emerald-500/10"
                                title="Edit Exam"
                              >
                                <Edit className="h-4 w-4 xl:h-5 xl:w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExam(exam.id, exam.title)}
                                className="p-2 xl:p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg shadow-red-500/10"
                                title="Delete Exam"
                              >
                                <Trash2 className="h-4 w-4 xl:h-5 xl:w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card View for Desktop (when selected) */}
              {viewMode === 'cards' && (
                <div className="hidden lg:block p-6 xl:p-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {filteredExams.map((exam, index) => (
                      <div 
                        key={exam.id}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4 flex-1 min-w-0">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-900 transition-colors line-clamp-2">
                                {exam.title}
                              </h4>
                              <div className="flex items-center space-x-2 mt-2">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span className="text-sm text-slate-600">
                                  Created {formatDate(exam.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(exam.is_active)}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-blue-600">{exam.total_questions}</div>
                            <div className="text-xs text-slate-600 font-medium">Questions</div>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-emerald-600">{exam.total_marks}</div>
                            <div className="text-xs text-slate-600 font-medium">Points</div>
                          </div>
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-orange-600">{exam.time_limit_minutes}m</div>
                            <div className="text-xs text-slate-600 font-medium">Duration</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                            <Target className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold text-slate-700">
                              Classes: {exam.target_classes?.join(', ') || 'All'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-sm text-slate-600 bg-white/80 px-3 py-2 rounded-xl font-medium text-center">
                              Max Attempts: {exam.max_attempts}
                            </div>
                            <div className="text-sm text-slate-600 bg-white/80 px-3 py-2 rounded-xl font-medium text-center">
                              Pass: {exam.passing_percentage}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => navigate(`/admin/exam/${exam.id}`)}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => navigate(`/admin/exam/${exam.id}/edit`)}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 font-medium"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                            title="Delete Exam"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile-friendly floating action button */}
        <div className="fixed bottom-6 right-6 lg:hidden z-40">
          <button
            onClick={() => navigate('/admin/create-exam')}
            className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile bottom navigation hint */}
        <div className="lg:hidden mt-8 pb-20">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-4 mx-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Quick Stats</div>
                  <div className="text-xs text-slate-600">
                    {exams.length} total exams • {exams.filter(e => e.is_active).length} active
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
  );
}

export default AdminPage;