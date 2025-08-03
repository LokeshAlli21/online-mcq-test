import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Eye, EyeOff, Mail, Phone, Lock, Loader2, BookOpen, Trophy, Users, CheckCircle, User, ArrowRight, ArrowLeft, Calendar, GraduationCap, School, Globe } from 'lucide-react';
import { toast } from 'react-toastify';
import authService from '../backend-services/auth/auth';
import databaseService from '../backend-services/database/database';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/authSlice'; // Adjust the import path as necessary

// Memoized InputField component to prevent unnecessary re-renders
const InputField = React.memo(({ label, name, type = 'text', icon: Icon, placeholder, options, disabled, min, max, value, onChange, error, showPassword, togglePasswordVisibility, loading }) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className={`w-5 h-5 transition-colors ${error ? 'text-red-400' : 'text-gray-400'}`} />
      </div>
      {options ? (
        <select
          id={name} 
          name={name} 
          value={value} 
          onChange={onChange} 
          disabled={disabled}
          className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl focus:outline-none focus:ring-0 transition-all duration-200 text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
            error ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-white'
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={name} 
          name={name} 
          type={(name === 'password' || name === 'confirmPassword') && showPassword ? 'text' : type} 
          value={value} 
          onChange={onChange}
          min={min} 
          max={max} 
          placeholder={placeholder} 
          disabled={loading}
          className={`w-full pl-12 ${(name === 'password' || name === 'confirmPassword') ? 'pr-12' : 'pr-4'} py-4 bg-gray-50 border-2 rounded-2xl focus:outline-none focus:ring-0 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
            error ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-white'
          }`}
        />
      )}
      {(name === 'password' || name === 'confirmPassword') && (
        <button 
          type="button" 
          onClick={() => togglePasswordVisibility(name)} 
          disabled={loading}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
    {error && (
      <p className="text-red-500 text-sm flex items-center space-x-1 animate-fade-in">
        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
        <span>{error}</span>
      </p>
    )}
    {name === 'password' && value && !error && (
      <div className="text-xs text-green-600 pl-1">✓ Password meets requirements</div>
    )}
    {name === 'confirmPassword' && value && !error && (
      <div className="text-xs text-green-600 pl-1">✓ Passwords match</div>
    )}
  </div>
));

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', date_of_birth: '',
    board_id: '', medium_id: '', school_id: '', class_level: '', academic_year: '', student_id: '',
    password: '', confirmPassword: ''
  });

  const [instituteOptions, setInstituteOptions] = useState({ boards: [], mediums: [], schools: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await databaseService.getInstituteOptions();
        console.log("Fetched institute options:", data);
        if (data?.data) {
          setInstituteOptions({
            boards: data.data.boards || [],
            mediums: data.data.mediums || [],
            schools: data.data.schools || []
          });
        }
      } catch (error) {
        console.error("Error fetching institute options:", error);
        toast.error('Failed to load institute options');
      }
    };
    fetchData();
  }, []);

  // Memoized validation functions
  const validateEmail = useCallback((email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email), []);
  const validatePhone = useCallback((phone) => { const clean = phone.replace(/\D/g, ''); return clean.length === 10 ; }, []);
  const validateName = useCallback((name) => { const trimmed = name.trim(); return trimmed.length >= 2 && trimmed.length <= 200; }, []);
  const validateDateOfBirth = useCallback((date) => {
    if (!date) return false;
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 5 && age <= 25;
  }, []);
  const validatePassword = useCallback((password) => {
    return password.length >= 6 && password.length <= 128;

  }, []);
  // Memoized options to prevent unnecessary re-renders
  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [`${currentYear}-${currentYear + 1}`, `${currentYear - 1}-${currentYear}`, `${currentYear + 1}-${currentYear + 2}`];
  }, []);

  // Show all schools without filtering by board
  const filteredSchools = useMemo(() => {
    return instituteOptions.schools;
  }, [instituteOptions.schools]);

  // Memoized step configuration
  const stepConfigurations = useMemo(() => {
    const currentDate = new Date();
    const maxDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 5)).toISOString().split('T')[0];
    const minDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 20)).toISOString().split('T')[0];

    return [
      {
        title: 'Personal Information',
        desc: 'Tell us about yourself',
        fields: [
          { label: 'Full Name', name: 'full_name', icon: User, placeholder: 'Enter your full name' },
          { label: 'Email Address', name: 'email', type: 'email', icon: Mail, placeholder: 'Enter your email address' },
          { label: 'Phone Number', name: 'phone', type: 'tel', icon: Phone, placeholder: 'Enter your phone number' },
          { label: 'Date of Birth', name: 'date_of_birth', type: 'date', icon: Calendar, min: minDate, max: maxDate }
        ]
      },
      {
        title: 'Academic Information',
        desc: 'Tell us about your education',
        fields: [
          { label: 'Board', name: 'board_id', icon: GraduationCap, placeholder: 'Select Board', 
            options: instituteOptions.boards.map(b => ({ value: b.id, label: `${b.name} - ${b.full_name}` })) },
          { label: 'Medium', name: 'medium_id', icon: Globe, placeholder: 'Select Medium',
            options: instituteOptions.mediums.map(m => ({ value: m.id, label: m.name })) },
          { label: 'School', name: 'school_id', icon: School, placeholder: 'Select School',
            options: filteredSchools.map(s => ({ value: s.id, label: s.name })) },
          { label: 'Class', name: 'class_level', icon: BookOpen, placeholder: 'Select Class',
            options: Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `Class ${i + 1}` })) },
          { label: 'Academic Year', name: 'academic_year', icon: Calendar, placeholder: 'Select Academic Year',
            options: academicYearOptions.map(year => ({ value: year, label: year })) },
          { label: 'Student ID (Optional)', name: 'student_id', icon: User, placeholder: 'Enter your student ID (if any)' }
        ]
      },
      {
        title: 'Account Security',
        desc: 'Create a secure password for your account',
        fields: [
          { label: 'Password', name: 'password', type: 'password', icon: Lock, placeholder: 'Create a password' },
          { label: 'Confirm Password', name: 'confirmPassword', type: 'password', icon: Lock, placeholder: 'Confirm your password' }
        ]
      }
    ];
  }, [instituteOptions.boards, instituteOptions.mediums, filteredSchools, academicYearOptions]);

  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
      else if (!validateName(formData.full_name)) newErrors.full_name = 'Name must be between 2-200 characters';
      
      if (!formData.email.trim()) newErrors.email = 'Email address is required';
      else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
      
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!validatePhone(formData.phone)) newErrors.phone = 'Please enter a valid phone number (10 digits)';
      // dob is optional but if provided, must be valid
      if (formData.date_of_birth && !validateDateOfBirth(formData.date_of_birth)) {
        newErrors.date_of_birth = 'Please enter a valid date of birth';
      }
    }

    if (step === 2) {
      if (!formData.board_id) newErrors.board_id = 'Please select a board';
      if (!formData.medium_id) newErrors.medium_id = 'Please select a medium';
      if (!formData.school_id) newErrors.school_id = 'Please select a school';
      if (!formData.class_level) newErrors.class_level = 'Please select a class';
      if (!formData.academic_year) newErrors.academic_year = 'Please select academic year';
    }

    if (step === 3) {
      console.log("Validating password and confirmPassword");
      if (!formData.password.trim()) newErrors.password = 'Password is required';
      else if (!validatePassword(formData.password) && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      else if (!validatePassword(formData.password) && formData.password.length > 128) newErrors.password = 'Password must be less than 128 characters';

      if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateEmail, validatePhone, validateName, validateDateOfBirth, validatePassword]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Handle live password  validation using validatePassword
    if (name === 'password' && value) {
      if (!validatePassword(value)) {
        setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters and less than 128 characters' }));
      } else {
        setErrors(prev => ({ ...prev, password: '' }));
      }
    }

    // Handle password confirmation validation
    if ((name === 'password' || name === 'confirmPassword') && formData.password && formData.confirmPassword) {
      if ((name === 'password' && value === formData.confirmPassword) || 
          (name === 'confirmPassword' && value === formData.password)) {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }

    // No need to reset school selection when board changes since schools are not filtered by board
    // if (name === 'board_id' && value !== formData.board_id) {
    //   setFormData(prev => ({ ...prev, school_id: '' }));
    // }
  }, [errors, formData.password, formData.confirmPassword, formData.board_id, validatePassword]);

  const handleNext = useCallback(() => { 
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, totalSteps)); 
  }, [validateStep, currentStep, totalSteps]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const signupData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        date_of_birth: formData.date_of_birth,
        board_id: parseInt(formData.board_id),
        medium_id: parseInt(formData.medium_id),
        school_id: parseInt(formData.school_id),
        class_level: parseInt(formData.class_level),
        academic_year: formData.academic_year,
        student_id: formData.student_id.trim() || null,
        password: formData.password
      };
      
      const response = await authService.signup(signupData);
      if (response?.user) {
        dispatch(login(response.user));
        toast.success('🎉 Welcome! Your account has been created successfully!');
        navigate('/', { replace: true });
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Account creation failed. Please try again.';
      toast.error(`🚫 ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = useCallback((field) => {
    if (field === 'password') {
      setShowPassword(prev => !prev);
    } else {
      setShowConfirmPassword(prev => !prev);
    }
  }, []);

  const renderStepContent = () => {
    const currentStepData = stepConfigurations[currentStep - 1];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
          <p className="text-gray-600">{currentStepData.desc}</p>
        </div>
        {currentStepData.fields.map((field) => (
          <InputField 
            key={field.name} 
            {...field} 
            value={formData[field.name]}
            onChange={handleInputChange}
            error={errors[field.name]}
            showPassword={field.name === 'password' ? showPassword : showConfirmPassword}
            togglePasswordVisibility={togglePasswordVisibility}
            loading={loading}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-20 w-16 h-16 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        <div className="hidden lg:block space-y-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MCQ Test</h1>
                <p className="text-gray-500 text-sm">Test Your Knowledge</p>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Start your<span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">learning adventure</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">Join thousands of learners worldwide. Create your account and begin mastering new skills with our comprehensive MCQ tests.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Trophy, title: "Achieve Excellence", desc: "Earn certificates and track your progress" },
              { icon: Users, title: "Join Community", desc: "Connect with learners from around the world" },
              { icon: CheckCircle, title: "Learn Effectively", desc: "Get instant feedback and detailed explanations" }
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/70 transition-all duration-300 group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MCQ Test</h1>
              <p className="text-gray-500 text-sm mt-1">Test Your Knowledge</p>
            </div>

            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="flex justify-between items-center mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < totalSteps && (
                      <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                        step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Form Content */}
              <div className="relative">
                {renderStepContent()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
                    currentStep === 1 
                      ? 'opacity-50 cursor-not-allowed text-gray-400' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                )}
              </div>

              {/* Sign In Link */}
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline">
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 1024px) {
          .bg-grid-pattern {
            background-size: 15px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default SignUp;