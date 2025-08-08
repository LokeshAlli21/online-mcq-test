import databaseService from '../backend-services/database/database';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Save, X, Eye, AlertCircle, Check, BookOpen, Target, Settings, Users, Star, Loader2, ArrowRight, Edit3, Sparkles, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

// Custom hooks
const useExamForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    time_limit_minutes: '',
    passing_percentage: 60.00,
    max_attempts: 1,
    partial_credit_enabled: false,
    negative_marking: false,
    negative_marks_per_wrong: 0.00,
    target_boards: [],
    target_mediums: [],
    target_classes: [],
    target_schools: [],
    is_active: true,
    ...initialData
  });

  const updateField = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const updateArrayField = useCallback((name, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    updateField(name, arrayValue);
  }, [updateField]);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      category_id: '',
      time_limit_minutes: '',
      passing_percentage: 60.00,
      max_attempts: 1,
      partial_credit_enabled: false,
      negative_marking: false,
      negative_marks_per_wrong: 0.00,
      target_boards: [],
      target_mediums: [],
      target_classes: [],
      target_schools: [],
      is_active: true
    });
  }, []);

  return { formData, updateField, updateArrayField, resetForm, setFormData };
};

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const fetchedCategories = await databaseService.getCategories();
      setCategories(fetchedCategories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
};

const useValidation = () => {
  const validateExamForm = useCallback((formData) => {
    const errors = {};

    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    if (!formData.category_id) {
      errors.category_id = 'Category is required';
    }

    if (!formData.time_limit_minutes || formData.time_limit_minutes <= 0) {
      errors.time_limit_minutes = 'Time limit must be greater than 0';
    }

    if (formData.passing_percentage < 0 || formData.passing_percentage > 100) {
      errors.passing_percentage = 'Passing percentage must be between 0 and 100';
    }

    if (!formData.max_attempts || formData.max_attempts <= 0) {
      errors.max_attempts = 'Max attempts must be greater than 0';
    }

    if (formData.negative_marking && formData.negative_marks_per_wrong < 0) {
      errors.negative_marks_per_wrong = 'Negative marks cannot be negative';
    }

    if (!formData.target_classes?.length) {
      errors.target_classes = 'At least one target class is required';
    }

    return errors;
  }, []);

  return { validateExamForm };
};

// Enhanced Components
const LoadingSpinner = ({ size = 20, className = '' }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
);

const Toast = ({ type, message, onDismiss, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const bgColor = type === 'success' 
    ? 'from-emerald-500 to-teal-500' 
    : type === 'error' 
    ? 'from-red-500 to-rose-500'
    : 'from-blue-500 to-indigo-500';

  const icon = type === 'success' ? Check : AlertCircle;
  const Icon = icon;

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 bg-gradient-to-r ${bgColor} text-white rounded-2xl shadow-2xl flex items-center gap-3 transform animate-slideInRight max-w-md`}>
      <Icon size={20} />
      <span className="font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 text-white/80 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

const InputField = React.memo(({ 
  label, 
  name, 
  type = 'text', 
  required = false, 
  error, 
  value, 
  onChange, 
  icon: Icon,
  description,
  viewOnly = false,
  ...props 
}) => (
  <div className="group space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 group-focus-within:text-blue-600 transition-colors">
      {Icon && <Icon size={16} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />}
      {label} 
      {required && <span className="text-red-500">*</span>}
    </label>
    
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={viewOnly}
        className={`w-full outline-none px-4 py-3.5 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm ${
          error 
            ? 'border-red-400 bg-red-50/80 focus:bg-white' 
            : 'border-gray-200 hover:border-blue-300 bg-white/80 hover:bg-white focus:bg-white'
        } placeholder:text-gray-400`}
        {...props}
      />
      {error && (
        <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-red-400 to-rose-400 rounded-full animate-expandWidth" />
      )}
    </div>
    
    {description && (
      <p className="text-xs text-gray-500 ml-1">{description}</p>
    )}
    
    {error && (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl animate-slideDown">
        <AlertCircle size={14} />
        {error}
      </div>
    )}
  </div>
));

const ToggleField = React.memo(({ label, name, description, checked, onChange, icon: Icon, viewOnly }) => (
  <div className="flex items-start justify-between p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start gap-4 flex-1">
      {Icon && <Icon size={20} className="text-gray-500 group-hover:text-blue-500 transition-colors mt-0.5" />}
      <div>
        <label htmlFor={name} className="text-sm font-semibold text-gray-800 cursor-pointer block group-hover:text-blue-600 transition-colors">
          {label}
        </label>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
    
    <div className="relative">
      <input
        type="checkbox"
        name={name}
        disabled={viewOnly}
        id={name}
        checked={checked || false}
        onChange={onChange}
        className="sr-only outline-none"
      />
      <div
        className={`w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ${
          checked 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' 
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
        onClick={() => onChange({ target: { name, checked: !checked } })}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          } mt-0.5`}
        />
      </div>
    </div>
  </div>
));

const ArrayInput = React.memo(({ label, name, value, onChange, placeholder, required = false, error, icon: Icon, viewOnly }) => (
  <div className="group space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 group-focus-within:text-blue-600 transition-colors">
      {Icon && <Icon size={16} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />}
      {label} 
      {required && <span className="text-red-500">*</span>}
    </label>
    
    <div className="relative">
      <input
        disabled={viewOnly}
        type="text"
        value={Array.isArray(value) ? value.join(', ') : ''}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full  outline-none px-4 py-3.5 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm ${
          error 
            ? 'border-red-400 bg-red-50/80 focus:bg-white' 
            : 'border-gray-200 hover:border-blue-300 bg-white/80 hover:bg-white focus:bg-white'
        } placeholder:text-gray-400`}
        placeholder={placeholder}
      />
      {error && (
        <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-red-400 to-rose-400 rounded-full animate-expandWidth" />
      )}
    </div>
    
    {error && (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl animate-slideDown">
        <AlertCircle size={14} />
        {error}
      </div>
    )}
  </div>
));

const CategoryModal = React.memo(({ isOpen, onClose, onSubmit, loading, error, viewOnly }) => {
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setLocalError('Category name is required');
      return;
    }
    setLocalError('');
    await onSubmit(formData);
    setFormData({ name: '', description: '', is_active: true });
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', is_active: true });
    setLocalError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform animate-modalSlideUp border border-gray-100">
        <div className="p-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Add Category</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Category Name"
              name="name"
              required
              viewOnly={viewOnly}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={localError}
              placeholder="e.g., Mathematics, Science..."
            />

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Description</label>
              <textarea
                value={formData.description}
                disabled={viewOnly}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none backdrop-blur-sm bg-white/80 hover:bg-white focus:bg-white placeholder:text-gray-400"
                rows="3"
                placeholder="Brief description of the category..."
              />
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed font-medium"
              >
                {loading ? <LoadingSpinner size={16} /> : <Save size={16} />}
                {loading ? 'Adding...' : 'Add Category'}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-2 text-red-800 animate-slideDown">
                <AlertCircle size={20} />
                <span className="font-medium">{error}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
});

const ActionButton = ({ onClick, loading, children, variant = 'primary', className = '' }) => {
  const baseClasses = "px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none flex items-center gap-2";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25",
    secondary: "bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 shadow-gray-200/50",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25"
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const CreateExam = ({ viewOnly = false }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const { formData, updateField, updateArrayField, setFormData } = useExamForm();
  const { categories, refetch: refetchCategories } = useCategories();
  const { validateExamForm } = useValidation();
  
  const [loading, setLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [categoryError, setCategoryError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isEditMode = useMemo(() => Boolean(id), [id]);

  // Fetch exam data for edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchExamData = async () => {
        try {
          setLoading(true);
          const response = await databaseService.getExamById(id);
          console.log('Fetched exam data:', response);
          if (!response || !response.data) {
            setToast({ type: 'error', message: 'Exam not found' });
            return;
          }
          const data = response.data;
          setFormData({
            ...data,
            target_boards: data.target_boards || [],
            target_mediums: data.target_mediums || [],
            target_classes: data.target_classes || [],
            target_schools: data.target_schools || []
          });
        } catch (error) {
          console.error('Error fetching exam data:', error);
          setToast({ type: 'error', message: 'Failed to load exam data' });
        } finally {
          setLoading(false);
        }
      };
      fetchExamData();
    }
  }, [id, isEditMode, setFormData]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : 
                    type === 'number' ? parseFloat(value) || '' : value;
    
    updateField(name, newValue);
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [updateField, errors]);

  const handleArrayInputChange = useCallback((name, value) => {
    updateArrayField(name, value);
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [updateArrayField, errors]);

  const handleSubmitExam = useCallback(async (action) => {
    const validationErrors = validateExamForm(formData);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      showToast('error', 'Please fix the validation errors before proceeding');
      return;
    }

    setLoading(true);

    console.log('Submitting exam data:', formData, "\n Action:", action);

    try {
      const formDataToSubmit = {
        ...formData,
        category_id: parseInt(formData.category_id),
        time_limit_minutes: parseInt(formData.time_limit_minutes),
        max_attempts: parseInt(formData.max_attempts),
        passing_percentage: parseFloat(formData.passing_percentage),
        negative_marks_per_wrong: parseFloat(formData.negative_marks_per_wrong),
        target_boards: formData.target_boards?.length > 0 ? formData.target_boards : null,
        target_mediums: formData.target_mediums?.length > 0 ? formData.target_mediums : null,
        target_classes: formData.target_classes,
        target_schools: formData.target_schools?.length > 0 ? formData.target_schools : null
      };

      let result;
      if (isEditMode && action !== 'goToQuestions') {
        result = await databaseService.updateExam(id, formDataToSubmit);
        console.log('Exam updated:', result, "\n Data:", formDataToSubmit);
        showToast('success', 'Exam updated successfully!');
      } else if (!isEditMode) {
        result = await databaseService.createExam(formDataToSubmit);
        console.log('Exam created:', result, "\n Data:", formDataToSubmit);
        showToast('success', 'Exam created successfully!');
      }

      // Handle different actions
      if ((action === 'updateAndAddQuestions') || (action === 'createAndAddQuestions') || (action === 'goToQuestions')) {
        console.log('Navigating to add questions...');
        const examId = isEditMode ? id : result?.data?.id;
        console.log('Exam ID for questions:', examId);
        if (Number.isInteger(Number(examId))) {
          navigate(`/admin/create-exam/add-questions/${examId}`);
          return;
        } else {
          console.error("Invalid exam ID, navigation aborted");
          showToast('error', 'Invalid exam ID, please try again.');
          return;
        }
      }
      if( action === 'updateOnly') {
        navigate('/');
        return;
      }
      return

    } catch (error) {
      console.error('Error saving exam:', error);
      showToast('error', `Failed to ${isEditMode ? 'update' : 'create'} exam. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [formData, validateExamForm, isEditMode, id, navigate]);

  const handleCategorySubmit = useCallback(async (categoryData) => {
    setCategoryLoading(true);
    setCategoryError('');

    try {
      await databaseService.createCategory(categoryData);
      console.log('Category created:', categoryData);
      await refetchCategories();
      setCategoryModalOpen(false);
      showToast('success', 'Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      setCategoryError('Failed to create category. Please try again.');
    } finally {
      setCategoryLoading(false);
    }
  }, [refetchCategories]);

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 mx-auto animate-pulse">
            <LoadingSpinner size={32} className="text-white" />
          </div>
          <p className="text-xl font-semibold text-gray-700 animate-pulse">Loading exam data...</p>
          <p className="text-gray-500 mt-2">Please wait while we fetch your exam details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8 border border-white/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-6">
              <div 
                className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${
                  viewOnly 
                    ? 'from-green-500 to-emerald-600' 
                    : isEditMode 
                      ? 'from-orange-500 to-red-600' 
                      : 'from-blue-500 to-indigo-600'
                } rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105`}
                role="img"
                aria-label={`${
                  viewOnly ? 'View Exam' : isEditMode ? 'Update Exam' : 'Create New Exam'
                } icon`}
              >
                {viewOnly ? (
                  <Eye className="text-white" size={28} />
                ) : isEditMode ? (
                  <Edit3 className="text-white" size={28} />
                ) : (
                  <Sparkles className="text-white" size={28} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 md:mb-2">
                  {viewOnly ? 'View Exam' : isEditMode ? 'Update Exam' : 'Create New Exam'}
                </h1>
                <p className="text-gray-600 text-sm md:text-lg leading-relaxed">
                  {viewOnly 
                    ? 'View your exam details and results' 
                    : isEditMode 
                      ? 'Modify your exam configuration and manage content' 
                      : 'Design and configure your perfect examination'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <BookOpen className="text-blue-600" size={28} />
              Basic Information
              <div className="h-1 flex-1 bg-gradient-to-r from-blue-200 to-transparent rounded-full ml-4" />
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="lg:col-span-2">
                <InputField
                  label="Exam Title"
                  viewOnly={viewOnly}
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  error={errors.title}
                  placeholder="Enter an engaging exam title..."
                  icon={BookOpen}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                  <Target size={16} className="text-gray-500" />
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <select
                      name="category_id"
                      disabled={viewOnly}
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className={`w-full px-4  outline-none py-3.5 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm bg-white/80 hover:bg-white focus:bg-white appearance-none pr-10 ${
                        errors.category_id ? 'border-red-400 bg-red-50/80' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  { !viewOnly && (
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus size={16} />
                  </button>
                  )}
                </div>
                {errors.category_id && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mt-2 animate-slideDown">
                    <AlertCircle size={14} />
                    {errors.category_id}
                  </div>
                )}
              </div>

              <InputField
                label="Time Limit"
                name="time_limit_minutes"
                type="number"
                required
                value={formData.time_limit_minutes}
                onChange={handleInputChange}
                viewOnly={viewOnly}
                error={errors.time_limit_minutes}
                min="1"
                placeholder="60"
                description="Duration in minutes"
              />

              <InputField
                label="Passing Percentage"
                name="passing_percentage"
                type="number"
                viewOnly={viewOnly}
                required
                value={formData.passing_percentage}
                onChange={handleInputChange}
                error={errors.passing_percentage}
                min="0"
                max="100"
                step="0.01"
                placeholder="60.00"
                description="Minimum percentage to pass"
              />

              <InputField
                label="Maximum Attempts"
                name="max_attempts"
                type="number"
                viewOnly={viewOnly}
                required
                value={formData.max_attempts}
                onChange={handleInputChange}
                error={errors.max_attempts}
                min="1"
                placeholder="1"
                description="Number of attempts allowed"
              />
            </div>
          </div>

          {/* Scoring Configuration */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Star className="text-purple-600" size={28} />
              Scoring Configuration
              <div className="h-1 flex-1 bg-gradient-to-r from-purple-200 to-transparent rounded-full ml-4" />
            </h2>

            <div className="space-y-6">
              <ToggleField
                name="partial_credit_enabled"
                label="Enable Partial Credit"
                description="Allow partial marks for partially correct answers"
                checked={formData.partial_credit_enabled}
                onChange={handleInputChange}
                viewOnly={viewOnly}
                icon={Star}
              />

              <ToggleField
                name="negative_marking"
                label="Enable Negative Marking"
                description="Deduct marks for incorrect answers"
                checked={formData.negative_marking}
                onChange={handleInputChange}
                viewOnly={viewOnly}
                icon={AlertCircle}
              />

              {formData.negative_marking && (
                <div className="ml-8 animate-slideDown">
                  <InputField
                    label="Negative Marks per Wrong Answer"
                    viewOnly={viewOnly}
                    name="negative_marks_per_wrong"
                    type="number"
                    value={formData.negative_marks_per_wrong}
                    onChange={handleInputChange}
                    error={errors.negative_marks_per_wrong}
                    min="0"
                    step="0.01"
                    placeholder="0.25"
                    description="Points deducted for each incorrect answer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Users className="text-green-600" size={28} />
              Target Audience
              <div className="h-1 flex-1 bg-gradient-to-r from-green-200 to-transparent rounded-full ml-4" />
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ArrayInput
                label="Target Boards"
                name="target_boards"
                value={formData.target_boards}
                onChange={handleArrayInputChange}
                placeholder="CBSE, ICSE, State Board"
                viewOnly={viewOnly}
                icon={Target}
              />

              <ArrayInput
                label="Target Mediums"
                name="target_mediums"
                value={formData.target_mediums}
                viewOnly={viewOnly}
                onChange={handleArrayInputChange}
                placeholder="English, Hindi, Regional"
                icon={BookOpen}
              />

              <ArrayInput
                label="Target Classes"
                name="target_classes"
                value={formData.target_classes}
                onChange={handleArrayInputChange}
                placeholder="10, 11, 12"
                required
                error={errors.target_classes}
                viewOnly={viewOnly}
                icon={Users}
              />

              <ArrayInput
                label="Target Schools"
                name="target_schools"
                value={formData.target_schools}
                onChange={handleArrayInputChange}
                viewOnly={viewOnly}
                placeholder="School names (optional)"
                icon={Settings}
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="text-gray-600" size={28} />
                Advanced Settings
                <div className="h-1 flex-1 bg-gradient-to-r from-gray-200 to-transparent rounded-full ml-4" />
              </div>
              <ChevronDown 
                size={24} 
                className={`text-gray-400 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} 
              />
            </button>

            <div className={`overflow-hidden transition-all duration-500 ${showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pt-4">
                <ToggleField
                  name="is_active"
                  viewOnly={viewOnly}
                  label="Activate Exam"
                  description="Make this exam available for students to take"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  icon={Check}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!viewOnly ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              {isEditMode ? (
                <>
                  <ActionButton
                    onClick={() => handleSubmitExam('updateOnly')}
                    loading={loading}
                    variant="secondary"
                  >
                    <Save size={20} />
                    Update Only
                  </ActionButton>
                  
                  <ActionButton
                    onClick={() => handleSubmitExam('updateAndAddQuestions')}
                    loading={loading}
                    variant="primary"
                  >
                    <Save size={20} />
                    Update & Add Questions
                  </ActionButton>
                  
                  <ActionButton
                    onClick={() => handleSubmitExam('goToQuestions')}
                    loading={loading}
                    variant="success"
                  >
                    <ArrowRight size={20} />
                    Go to Questions
                  </ActionButton>
                </>
              ) : (
                <ActionButton
                  onClick={() => handleSubmitExam('createAndAddQuestions')}
                  loading={loading}
                  variant="primary"
                  className="px-10"
                >
                  <Sparkles size={20} />
                  {loading ? 'Creating...' : 'Create Exam & Add Questions'}
                </ActionButton>
              )}
            </div>
          </div>
          ) : (
            <div className="flex justify-between">
              <ActionButton
                onClick={() => navigate('/')}
                variant="secondary"
              >
                Go back
              </ActionButton>
            </div>
          )}
        </form>

        {/* Category Modal */}
        <CategoryModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          onSubmit={handleCategorySubmit}
          loading={categoryLoading}
          error={categoryError}
          viewOnly={viewOnly}
        />
      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translateX(100px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        @keyframes modalSlideUp {
          from { 
            opacity: 0; 
            transform: translateY(50px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 200px;
          }
        }
        
        @keyframes expandWidth {
          from { width: 0; }
          to { width: 100%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.4s ease-out;
        }
        
        .animate-modalSlideUp {
          animation: modalSlideUp 0.4s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-expandWidth {
          animation: expandWidth 0.3s ease-out;
        }

        /* Glassmorphism effects */
        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
        }
        
        .backdrop-blur-md {
          backdrop-filter: blur(12px);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #2563eb, #4f46e5);
        }
      `}</style>
    </div>
  );
};

export default CreateExam;